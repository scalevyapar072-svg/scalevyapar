-- Preview-only Phase 11B migration.
-- Adds referral withdrawal request storage and atomic request creation.

create table if not exists public.worker_referral_withdrawal_requests (
  id text primary key,
  worker_id text not null,
  amount numeric(12, 2) not null,
  payout_method text not null,
  payout_account_id text not null,
  masked_destination text not null default '',
  encrypted_destination_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  rejection_reason text not null default '',
  payment_reference text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referral_withdrawal_requests_worker_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_withdrawal_requests_payout_account_fkey
    foreign key (payout_account_id)
    references public.worker_referral_payout_accounts(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_withdrawal_requests_amount_check
    check (amount > 0),
  constraint worker_referral_withdrawal_requests_payout_method_check
    check (payout_method in ('bank', 'upi')),
  constraint worker_referral_withdrawal_requests_status_check
    check (status in ('requested', 'approved', 'processing', 'paid', 'rejected', 'failed', 'cancelled')),
  constraint worker_referral_withdrawal_requests_masked_destination_check
    check (masked_destination <> ''),
  constraint worker_referral_withdrawal_requests_snapshot_object_check
    check (jsonb_typeof(encrypted_destination_snapshot) = 'object')
);

create index if not exists worker_referral_withdrawal_requests_worker_requested_idx
  on public.worker_referral_withdrawal_requests(worker_id, requested_at desc);

create index if not exists worker_referral_withdrawal_requests_worker_status_idx
  on public.worker_referral_withdrawal_requests(worker_id, status);

create index if not exists worker_referral_withdrawal_requests_status_requested_idx
  on public.worker_referral_withdrawal_requests(status, requested_at desc);

create index if not exists worker_referral_withdrawal_requests_payout_account_idx
  on public.worker_referral_withdrawal_requests(payout_account_id);

create unique index if not exists worker_referral_withdrawal_requests_one_open_idx
  on public.worker_referral_withdrawal_requests(worker_id)
  where status in ('requested', 'approved', 'processing');

alter table public.worker_referral_withdrawal_requests enable row level security;

comment on table public.worker_referral_withdrawal_requests is
  'Rozgar Refer & Earn: reserved withdrawal requests for referral earnings before later admin approval/payment phases.';

create or replace function public.create_worker_referral_withdrawal_request(
  p_worker_id text,
  p_amount numeric,
  p_payout_method text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_worker public.labour_workers%rowtype;
  v_profile public.worker_referral_profiles%rowtype;
  v_payout public.worker_referral_payout_accounts%rowtype;
  v_existing public.worker_referral_withdrawal_requests%rowtype;
  v_request public.worker_referral_withdrawal_requests%rowtype;
  v_now timestamptz := now();
  v_worker_id text := trim(coalesce(p_worker_id, ''));
  v_method text := lower(trim(coalesce(p_payout_method, '')));
  v_amount numeric(12, 2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_available numeric(12, 2) := 0;
  v_reserved numeric(12, 2) := 0;
  v_withdrawable numeric(12, 2) := 0;
  v_masked_destination text := '';
  v_snapshot jsonb := '{}'::jsonb;
begin
  if v_worker_id = '' then
    return jsonb_build_object(
      'success', false,
      'code', 'worker-not-found',
      'message', 'Worker account was not found.'
    );
  end if;

  if v_method not in ('bank', 'upi') then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-payout-method',
      'message', 'Select a valid payout method before requesting withdrawal.'
    );
  end if;

  if v_amount < 500 then
    return jsonb_build_object(
      'success', false,
      'code', 'minimum-withdrawal',
      'message', 'Minimum withdrawal is Rs 500.'
    );
  end if;

  select *
    into v_worker
    from public.labour_workers
   where id = v_worker_id
   for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'worker-not-found',
      'message', 'Worker account was not found.'
    );
  end if;

  if coalesce(trim(v_worker.kyc_status), '') <> 'approved' then
    return jsonb_build_object(
      'success', false,
      'code', 'kyc-required',
      'message', 'Complete KYC approval before requesting withdrawal.'
    );
  end if;

  select *
    into v_profile
    from public.worker_referral_profiles
   where worker_id = v_worker_id
     and is_active = true
   limit 1
   for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'referral-profile-inactive',
      'message', 'Refer and Earn is not enabled for this account.'
    );
  end if;

  select *
    into v_payout
    from public.worker_referral_payout_accounts
   where worker_id = v_worker_id
   for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'payout-method-required',
      'message', 'Add Bank or UPI before requesting withdrawal.'
    );
  end if;

  if v_method = 'bank' and (
    trim(coalesce(v_payout.account_holder_name, '')) = ''
    or trim(coalesce(v_payout.account_number_ciphertext, '')) = ''
    or trim(coalesce(v_payout.account_number_last4, '')) = ''
    or trim(coalesce(v_payout.ifsc, '')) = ''
  ) then
    return jsonb_build_object(
      'success', false,
      'code', 'bank-not-configured',
      'message', 'Add a bank account before requesting withdrawal.'
    );
  end if;

  if v_method = 'upi' and (
    trim(coalesce(v_payout.upi_id_ciphertext, '')) = ''
    or trim(coalesce(v_payout.upi_id_masked, '')) = ''
  ) then
    return jsonb_build_object(
      'success', false,
      'code', 'upi-not-configured',
      'message', 'Add a UPI ID before requesting withdrawal.'
    );
  end if;

  select *
    into v_existing
    from public.worker_referral_withdrawal_requests
   where worker_id = v_worker_id
     and status in ('requested', 'approved', 'processing')
   order by requested_at desc
   limit 1
   for update;

  if v_existing.id is not null then
    return jsonb_build_object(
      'success', false,
      'code', 'open-request-exists',
      'message', 'You already have a withdrawal request under review.'
    );
  end if;

  select coalesce(sum(
           case
             when status = 'available' and entry_type = 'reward_credit' then amount
             when status = 'available' and entry_type = 'reward_reversal' then -amount
             when status = 'available' and entry_type = 'withdrawal_debit' then -amount
             when status = 'available' and entry_type = 'withdrawal_reversal' then amount
             else 0
           end
         ), 0)
    into v_available
    from public.worker_referral_ledger
   where worker_id = v_worker_id;

  select coalesce(sum(amount), 0)
    into v_reserved
    from public.worker_referral_withdrawal_requests
   where worker_id = v_worker_id
     and status in ('requested', 'approved', 'processing');

  v_withdrawable := greatest(v_available - v_reserved, 0);

  if v_amount > v_withdrawable then
    return jsonb_build_object(
      'success', false,
      'code', 'insufficient-withdrawable-balance',
      'message', 'Requested amount exceeds the available referral balance.'
    );
  end if;

  if v_method = 'bank' then
    v_masked_destination := 'Bank ' || '••••' || v_payout.account_number_last4;
    v_snapshot := jsonb_build_object(
      'method', 'bank',
      'accountHolderName', v_payout.account_holder_name,
      'accountNumberCiphertext', v_payout.account_number_ciphertext,
      'accountNumberLast4', v_payout.account_number_last4,
      'ifsc', v_payout.ifsc
    );
  else
    v_masked_destination := 'UPI ' || v_payout.upi_id_masked;
    v_snapshot := jsonb_build_object(
      'method', 'upi',
      'upiIdCiphertext', v_payout.upi_id_ciphertext,
      'upiIdMasked', v_payout.upi_id_masked
    );
  end if;

  begin
    insert into public.worker_referral_withdrawal_requests (
      id,
      worker_id,
      amount,
      payout_method,
      payout_account_id,
      masked_destination,
      encrypted_destination_snapshot,
      status,
      requested_at,
      created_at,
      updated_at
    )
    values (
      'ref-withdrawal-' || substr(md5(v_worker_id || v_now::text || random()::text), 1, 24),
      v_worker_id,
      v_amount,
      v_method,
      v_payout.id,
      v_masked_destination,
      v_snapshot,
      'requested',
      v_now,
      v_now,
      v_now
    )
    returning * into v_request;
  exception
    when unique_violation then
      return jsonb_build_object(
        'success', false,
        'code', 'open-request-exists',
        'message', 'You already have a withdrawal request under review.'
      );
  end;

  return jsonb_build_object(
    'success', true,
    'withdrawalId', v_request.id,
    'availableBalance', v_available,
    'reservedBalance', v_reserved + v_amount,
    'withdrawableBalance', greatest(v_withdrawable - v_amount, 0)
  );
end;
$$;

revoke execute on function public.create_worker_referral_withdrawal_request(text, numeric, text) from public;
revoke execute on function public.create_worker_referral_withdrawal_request(text, numeric, text) from anon;
revoke execute on function public.create_worker_referral_withdrawal_request(text, numeric, text) from authenticated;
grant execute on function public.create_worker_referral_withdrawal_request(text, numeric, text) to service_role;
