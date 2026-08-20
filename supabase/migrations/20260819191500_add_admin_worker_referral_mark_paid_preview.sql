-- Preview-only Phase 13B migration.
-- Adds atomic manual payout completion for approved referral withdrawal requests.

create or replace function public.mark_worker_referral_withdrawal_paid(
  p_request_id text,
  p_payment_reference text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_request public.worker_referral_withdrawal_requests%rowtype;
  v_existing_ledger public.worker_referral_ledger%rowtype;
  v_ledger public.worker_referral_ledger%rowtype;
  v_request_id text := trim(coalesce(p_request_id, ''));
  v_payment_reference text := regexp_replace(trim(coalesce(p_payment_reference, '')), '\s+', ' ', 'g');
  v_now timestamptz := now();
  v_reference text;
  v_anchor_referral_id text;
  v_current_balance numeric(12, 2) := 0;
  v_balance_after numeric(12, 2) := 0;
begin
  if v_request_id = '' then
    return jsonb_build_object(
      'success', false,
      'code', 'request-required',
      'message', 'Withdrawal request ID is required.'
    );
  end if;

  if v_payment_reference = '' then
    return jsonb_build_object(
      'success', false,
      'code', 'payment-reference-required',
      'message', 'Payment reference is required.'
    );
  end if;

  if char_length(v_payment_reference) > 120 then
    return jsonb_build_object(
      'success', false,
      'code', 'payment-reference-too-long',
      'message', 'Payment reference must be 120 characters or less.'
    );
  end if;

  select *
    into v_request
    from public.worker_referral_withdrawal_requests
   where id = v_request_id
   for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'request-not-found',
      'message', 'Withdrawal request was not found.'
    );
  end if;

  if v_request.status <> 'approved' then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-status-transition',
      'message', 'Only approved withdrawals can be marked paid.'
    );
  end if;

  v_reference := 'withdrawal:' || v_request.id;

  select *
    into v_existing_ledger
    from public.worker_referral_ledger
   where reference = v_reference;

  if v_existing_ledger.id is not null then
    return jsonb_build_object(
      'success', false,
      'code', 'withdrawal-already-debited',
      'message', 'This withdrawal already has a payout ledger debit.',
      'ledgerEntry', to_jsonb(v_existing_ledger)
    );
  end if;

  select coalesce(sum(
           case
             when status = 'available' and entry_type in ('reward_credit', 'withdrawal_reversal') then amount
             when status = 'available' and entry_type in ('reward_reversal', 'withdrawal_debit') then -amount
             else 0
           end
         ), 0)
    into v_current_balance
    from public.worker_referral_ledger
   where worker_id = v_request.worker_id;

  v_balance_after := round((v_current_balance - v_request.amount)::numeric, 2);

  if v_balance_after < 0 then
    return jsonb_build_object(
      'success', false,
      'code', 'insufficient-ledger-balance',
      'message', 'Approved withdrawal exceeds the current referral ledger balance.',
      'currentBalance', v_current_balance
    );
  end if;

  select referral_id
    into v_anchor_referral_id
    from public.worker_referral_ledger
   where worker_id = v_request.worker_id
   order by created_at desc
   limit 1;

  if v_anchor_referral_id is null then
    select id
      into v_anchor_referral_id
      from public.worker_referrals
     where referrer_worker_id = v_request.worker_id
     order by coalesce(rewarded_at, qualified_at, registered_at, attributed_at, created_at) desc,
              created_at desc
     limit 1;
  end if;

  if v_anchor_referral_id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'referral-anchor-not-found',
      'message', 'Unable to resolve a referral ledger anchor for this worker.'
    );
  end if;

  insert into public.worker_referral_ledger (
    id,
    worker_id,
    referral_id,
    entry_type,
    amount,
    balance_after,
    status,
    reference,
    remarks,
    created_at
  )
  values (
    'ref-ledger-withdrawal-debit-' || v_request.id,
    v_request.worker_id,
    v_anchor_referral_id,
    'withdrawal_debit',
    v_request.amount,
    v_balance_after,
    'available',
    v_reference,
    'Manual payout completed. Payment reference: ' || v_payment_reference,
    v_now
  )
  returning * into v_ledger;

  update public.worker_referral_withdrawal_requests
     set status = 'paid',
         paid_at = v_now,
         payment_reference = v_payment_reference,
         updated_at = v_now
   where id = v_request.id
   returning * into v_request;

  return jsonb_build_object(
    'success', true,
    'withdrawal', to_jsonb(v_request),
    'ledgerEntry', to_jsonb(v_ledger),
    'balanceAfter', v_balance_after
  );
end;
$$;

revoke execute on function public.mark_worker_referral_withdrawal_paid(text, text) from public;
revoke execute on function public.mark_worker_referral_withdrawal_paid(text, text) from anon;
revoke execute on function public.mark_worker_referral_withdrawal_paid(text, text) from authenticated;
grant execute on function public.mark_worker_referral_withdrawal_paid(text, text) to service_role;
