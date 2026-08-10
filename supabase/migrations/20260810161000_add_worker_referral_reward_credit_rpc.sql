create or replace function public.credit_worker_referral_reward(p_referral_id text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_referral public.worker_referrals%rowtype;
  v_existing_ledger public.worker_referral_ledger%rowtype;
  v_ledger public.worker_referral_ledger%rowtype;
  v_reference text;
  v_now timestamptz := now();
  v_balance_after numeric(12, 2);
begin
  select *
    into v_referral
    from public.worker_referrals
   where id = p_referral_id
   for update;

  if not found then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'referral-not-found',
      'referral', null,
      'ledgerEntry', null
    );
  end if;

  v_reference := 'reward-credit-' || v_referral.id;

  select *
    into v_existing_ledger
    from public.worker_referral_ledger
   where reference = v_reference;

  if v_existing_ledger.id is not null then
    if v_referral.reward_status = 'pending' then
      update public.worker_referrals
         set reward_status = 'available',
             rewarded_at = coalesce(rewarded_at, v_existing_ledger.created_at),
             updated_at = v_now
       where id = v_referral.id
       returning * into v_referral;
    end if;

    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', true,
      'reason', 'already-credited',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', to_jsonb(v_existing_ledger)
    );
  end if;

  if v_referral.referral_status <> 'qualified' then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'not-qualified',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', null
    );
  end if;

  if v_referral.reward_status <> 'pending' or v_referral.rewarded_at is not null then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'reward-not-pending',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', null
    );
  end if;

  if v_referral.qualified_at is null then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'missing-qualified-at',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', null
    );
  end if;

  if v_referral.reward_amount_snapshot <= 0 then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'invalid-reward-amount',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', null
    );
  end if;

  if not exists (
    select 1
      from public.labour_workers
     where id = v_referral.referrer_worker_id
  ) then
    return jsonb_build_object(
      'credited', false,
      'alreadyCredited', false,
      'reason', 'referrer-not-found',
      'referral', to_jsonb(v_referral),
      'ledgerEntry', null
    );
  end if;

  select coalesce(sum(
           case
             when entry_type in ('reward_credit', 'withdrawal_reversal') then amount
             when entry_type in ('reward_reversal', 'withdrawal_debit') then -amount
             else 0
           end
         ), 0) + v_referral.reward_amount_snapshot
    into v_balance_after
    from public.worker_referral_ledger
   where worker_id = v_referral.referrer_worker_id;

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
    'ref-ledger-reward-credit-' || v_referral.id,
    v_referral.referrer_worker_id,
    v_referral.id,
    'reward_credit',
    v_referral.reward_amount_snapshot,
    v_balance_after,
    'available',
    v_reference,
    'Referral reward credited after referred worker KYC qualification.',
    v_now
  )
  returning * into v_ledger;

  update public.worker_referrals
     set reward_status = 'available',
         rewarded_at = v_now,
         updated_at = v_now
   where id = v_referral.id
     and referral_status = 'qualified'
     and reward_status = 'pending'
     and rewarded_at is null
  returning * into v_referral;

  if v_referral.id is null then
    raise exception 'Referral reward status update failed for referral %', p_referral_id;
  end if;

  return jsonb_build_object(
    'credited', true,
    'alreadyCredited', false,
    'reason', 'credited',
    'referral', to_jsonb(v_referral),
    'ledgerEntry', to_jsonb(v_ledger)
  );
end;
$$;

revoke execute on function public.credit_worker_referral_reward(text) from public;
revoke execute on function public.credit_worker_referral_reward(text) from anon;
revoke execute on function public.credit_worker_referral_reward(text) from authenticated;
grant execute on function public.credit_worker_referral_reward(text) to service_role;
