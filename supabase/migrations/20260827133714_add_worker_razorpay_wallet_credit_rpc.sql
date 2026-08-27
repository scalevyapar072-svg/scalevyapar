-- Phase 16D.8K.3 source-only atomic Worker Razorpay wallet-credit RPC foundation.
-- Migration classification: ONE-TIME MIGRATION.
-- This repository-only migration defines a future server-only RPC for atomically
-- applying one already verified Razorpay payment to one Worker wallet.
--
-- Safety model:
-- - This migration must not be applied from Preview, QA, or any shared database
--   during this phase.
-- - No application route, helper, or caller is integrated here.
-- - No existing Worker lifecycle, visibility, registration-fee, or plan behavior
--   is changed here.
-- - The RPC is restricted to service_role execution only.
-- - Browser roles, anon, and authenticated retain no execute access.
-- - The RPC performs no network activity and does not call Razorpay, Meta, or
--   any outbound service.
--
-- Authoritative live/source-aligned wallet-ledger contract used here:
-- - labour_wallet_transactions.id: uuid
-- - labour_wallet_transactions.amount: numeric(10,2) rupees
-- - labour_wallet_transactions.type: wallet_recharge
-- - labour_wallet_transactions.transaction_type: wallet_recharge
-- - labour_wallet_transactions.status: completed
-- - labour_wallet_transactions.direction: credit
-- - labour_wallet_transactions.entity_type: worker
-- - labour_wallet_transactions.entity_id: Worker id
-- - labour_wallet_transactions.entity_name: Worker name/mobile fallback
-- - labour_wallet_transactions.reference: provider order id
-- - labour_wallet_transactions.note: sanitized server-generated Razorpay note
-- - labour_wallet_transactions.description/reference_id/worker_id remain omitted
--   because current authoritative/source-backed wallet_recharge rows do not use
--   them.

create or replace function public.apply_verified_worker_razorpay_credit(
  p_worker_id text,
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_provider_amount_paise bigint,
  p_provider_currency text,
  p_provider_status text,
  p_idempotency_key text
)
returns table (
  outcome text,
  payment_attempt_id uuid,
  wallet_transaction_id uuid,
  resulting_wallet_balance numeric(10, 2)
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_worker_id text := btrim(coalesce(p_worker_id, ''));
  v_provider text := lower(btrim(coalesce(p_provider, '')));
  v_provider_order_id text := btrim(coalesce(p_provider_order_id, ''));
  v_provider_payment_id text := btrim(coalesce(p_provider_payment_id, ''));
  v_provider_currency text := upper(btrim(coalesce(p_provider_currency, '')));
  v_provider_status text := lower(btrim(coalesce(p_provider_status, '')));
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_amount_rupees_raw numeric;
  v_amount_rupees numeric(10, 2);
  v_existing_balance numeric(10, 2);
  v_target_balance numeric(10, 2);
  v_worker public.labour_workers%rowtype;
  v_attempt_by_payment public.labour_worker_payment_attempts%rowtype;
  v_attempt_by_idempotency public.labour_worker_payment_attempts%rowtype;
  v_attempt_by_applied_order public.labour_worker_payment_attempts%rowtype;
  v_applied_attempt public.labour_worker_payment_attempts%rowtype;
  v_applied_wallet_transaction public.labour_wallet_transactions%rowtype;
  v_attempt_to_apply public.labour_worker_payment_attempts%rowtype;
  v_wallet_transaction_id uuid := gen_random_uuid();
begin
  if v_worker_id = '' then
    raise exception 'worker_id_required'
      using errcode = '22023';
  end if;

  if v_provider <> 'razorpay' then
    raise exception 'invalid_provider'
      using errcode = '22023';
  end if;

  if v_provider_order_id = '' then
    raise exception 'provider_order_id_required'
      using errcode = '22023';
  end if;

  if v_provider_payment_id = '' then
    raise exception 'provider_payment_id_required'
      using errcode = '22023';
  end if;

  if p_provider_amount_paise is null or p_provider_amount_paise <= 0 then
    raise exception 'invalid_provider_amount_paise'
      using errcode = '22023';
  end if;

  if v_provider_currency <> 'INR' then
    raise exception 'invalid_provider_currency'
      using errcode = '22023';
  end if;

  if v_provider_status <> 'captured' then
    raise exception 'invalid_provider_status'
      using errcode = '22023';
  end if;

  if v_idempotency_key = '' then
    raise exception 'idempotency_key_required'
      using errcode = '22023';
  end if;

  v_amount_rupees_raw := p_provider_amount_paise::numeric / 100::numeric;

  if v_amount_rupees_raw <> round(v_amount_rupees_raw, 2) then
    raise exception 'unsafe_amount_representation'
      using errcode = '22003';
  end if;

  if v_amount_rupees_raw >= 100000000::numeric then
    raise exception 'wallet_amount_out_of_range'
      using errcode = '22003';
  end if;

  v_amount_rupees := v_amount_rupees_raw::numeric(10, 2);

  select *
    into v_worker
    from public.labour_workers
   where id = v_worker_id
   for update;

  if not found then
    raise exception 'worker_not_found'
      using errcode = 'P0001';
  end if;

  v_existing_balance := coalesce(v_worker.wallet_balance, 0)::numeric(10, 2);
  v_target_balance := (v_existing_balance + v_amount_rupees)::numeric(10, 2);

  if v_target_balance >= 100000000::numeric then
    raise exception 'wallet_balance_out_of_range'
      using errcode = '22003';
  end if;

  select *
    into v_attempt_by_payment
    from public.labour_worker_payment_attempts
   where provider = v_provider
     and provider_payment_id = v_provider_payment_id
   for update;

  select *
    into v_attempt_by_idempotency
    from public.labour_worker_payment_attempts
   where idempotency_key = v_idempotency_key
   for update;

  select *
    into v_attempt_by_applied_order
    from public.labour_worker_payment_attempts
   where provider = v_provider
     and provider_order_id = v_provider_order_id
     and application_status = 'applied'
   for update;

  if v_attempt_by_payment.id is not null
     and (
        v_attempt_by_payment.worker_id is distinct from v_worker_id
        or v_attempt_by_payment.provider_order_id is distinct from v_provider_order_id
        or v_attempt_by_payment.provider_currency is distinct from v_provider_currency
        or v_attempt_by_payment.provider_amount_paise is distinct from p_provider_amount_paise
        or v_attempt_by_payment.idempotency_key is distinct from v_idempotency_key
      ) then
    raise exception 'provider_payment_conflict'
      using errcode = '23505';
  end if;

  if v_attempt_by_idempotency.id is not null
     and (
       v_attempt_by_idempotency.worker_id is distinct from v_worker_id
       or v_attempt_by_idempotency.provider is distinct from v_provider
       or v_attempt_by_idempotency.provider_order_id is distinct from v_provider_order_id
       or coalesce(v_attempt_by_idempotency.provider_payment_id, v_provider_payment_id) is distinct from v_provider_payment_id
       or v_attempt_by_idempotency.provider_currency is distinct from v_provider_currency
       or v_attempt_by_idempotency.provider_amount_paise is distinct from p_provider_amount_paise
     ) then
    raise exception 'idempotency_key_conflict'
      using errcode = '23505';
  end if;

  if v_attempt_by_applied_order.id is not null
     and (
        v_attempt_by_applied_order.worker_id is distinct from v_worker_id
        or coalesce(v_attempt_by_applied_order.provider_payment_id, v_provider_payment_id) is distinct from v_provider_payment_id
        or v_attempt_by_applied_order.provider_currency is distinct from v_provider_currency
        or v_attempt_by_applied_order.provider_amount_paise is distinct from p_provider_amount_paise
        or v_attempt_by_applied_order.idempotency_key is distinct from v_idempotency_key
      ) then
    raise exception 'provider_order_conflict'
      using errcode = '23505';
  end if;

  if v_attempt_by_payment.id is not null
     and v_attempt_by_payment.application_status = 'applied' then
    v_applied_attempt := v_attempt_by_payment;
  end if;

  if v_attempt_by_idempotency.id is not null
     and v_attempt_by_idempotency.application_status = 'applied' then
    v_applied_attempt := v_attempt_by_idempotency;
  end if;

  if v_attempt_by_applied_order.id is not null then
    v_applied_attempt := v_attempt_by_applied_order;
  end if;

  if v_attempt_by_payment.id is not null
     and v_attempt_by_idempotency.id is not null
     and v_attempt_by_payment.id <> v_attempt_by_idempotency.id then
    raise exception 'payment_attempt_identity_conflict'
      using errcode = '23505';
  end if;

  if v_applied_attempt.id is not null then
    if v_applied_attempt.wallet_transaction_id is null then
      raise exception 'applied_wallet_transaction_integrity_conflict'
        using errcode = '23505';
    end if;

    select *
      into v_applied_wallet_transaction
      from public.labour_wallet_transactions
     where id = v_applied_attempt.wallet_transaction_id;

    if not found
       or v_applied_wallet_transaction.balance_after is null
       or v_applied_wallet_transaction.entity_type is distinct from 'worker'
       or v_applied_wallet_transaction.entity_id is distinct from v_applied_attempt.worker_id
       or v_applied_wallet_transaction.transaction_type is distinct from 'wallet_recharge'
       or v_applied_wallet_transaction.type is distinct from 'wallet_recharge'
       or v_applied_wallet_transaction.direction is distinct from 'credit'
       or v_applied_wallet_transaction.status is distinct from 'completed'
       or v_applied_wallet_transaction.amount is distinct from v_amount_rupees
       or v_applied_wallet_transaction.reference is distinct from v_applied_attempt.provider_order_id then
      raise exception 'applied_wallet_transaction_integrity_conflict'
        using errcode = '23505';
    end if;

    return query
    select
      'already_applied'::text,
      v_applied_attempt.id,
      v_applied_attempt.wallet_transaction_id,
      v_applied_wallet_transaction.balance_after;
    return;
  end if;

  if v_attempt_by_payment.id is not null then
    v_attempt_to_apply := v_attempt_by_payment;
  elsif v_attempt_by_idempotency.id is not null then
    v_attempt_to_apply := v_attempt_by_idempotency;
  end if;

  if v_attempt_to_apply.id is null then
    begin
      insert into public.labour_worker_payment_attempts (
        worker_id,
        provider,
        provider_order_id,
        provider_payment_id,
        provider_currency,
        provider_amount_paise,
        provider_status,
        idempotency_key,
        application_status,
        verified_at,
        created_at,
        updated_at
      )
      values (
        v_worker_id,
        v_provider,
        v_provider_order_id,
        v_provider_payment_id,
        v_provider_currency,
        p_provider_amount_paise,
        v_provider_status,
        v_idempotency_key,
        'verified',
        v_now,
        v_now,
        v_now
      )
      returning *
        into v_attempt_to_apply;
    exception
      when unique_violation then
        raise exception 'payment_attempt_identity_conflict'
          using errcode = '23505';
    end;
  else
    update public.labour_worker_payment_attempts
       set provider_status = v_provider_status,
           provider_payment_id = v_provider_payment_id,
           provider_currency = v_provider_currency,
           provider_amount_paise = p_provider_amount_paise,
           application_status = 'verified',
           verified_at = coalesce(verified_at, v_now),
           failure_category = null,
           updated_at = v_now
     where id = v_attempt_to_apply.id
     returning *
       into v_attempt_to_apply;
  end if;

  insert into public.labour_wallet_transactions (
    id,
    amount,
    type,
    status,
    created_at,
    updated_at,
    city,
    balance_after,
    entity_type,
    entity_id,
    entity_name,
    transaction_type,
    direction,
    reference,
    note
  )
  values (
    v_wallet_transaction_id,
    v_amount_rupees,
    'wallet_recharge',
    'completed',
    v_now,
    v_now,
    coalesce(v_worker.city, ''),
    v_target_balance,
    'worker',
    v_worker.id,
    coalesce(nullif(v_worker.full_name, ''), v_worker.mobile),
    'wallet_recharge',
    'credit',
    v_provider_order_id,
    'Razorpay wallet recharge ' || v_provider_payment_id || '. Order ' || v_provider_order_id || '.'
  );

  update public.labour_workers
     set wallet_balance = v_target_balance,
         updated_at = v_now
   where id = v_worker.id
   returning wallet_balance
     into resulting_wallet_balance;

  begin
    update public.labour_worker_payment_attempts
       set wallet_transaction_id = v_wallet_transaction_id,
           application_status = 'applied',
           verified_at = coalesce(verified_at, v_now),
           applied_at = v_now,
           failure_category = null,
           updated_at = v_now
     where id = v_attempt_to_apply.id
     returning *
       into v_attempt_to_apply;
  exception
    when unique_violation then
      raise exception 'payment_attempt_apply_conflict'
        using errcode = '23505';
  end;

  return query
  select
    'applied'::text,
    v_attempt_to_apply.id,
    v_wallet_transaction_id,
    resulting_wallet_balance;
end;
$$;

revoke execute on function public.apply_verified_worker_razorpay_credit(
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text
) from public;

revoke execute on function public.apply_verified_worker_razorpay_credit(
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text
) from anon;

revoke execute on function public.apply_verified_worker_razorpay_credit(
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text
) from authenticated;

grant execute on function public.apply_verified_worker_razorpay_credit(
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text
) to service_role;

comment on function public.apply_verified_worker_razorpay_credit(
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text
) is
  'Future server-only atomic Worker wallet-credit RPC for already verified Razorpay payments. Applies one exact payment once, updates only wallet balance plus payment-attempt state, and performs no lifecycle, plan, registration-fee, notification, or network behavior in this phase.';

-- Rollback plan (do not execute automatically).
-- WARNING:
-- - Rolling back after real usage begins removes the server-only wallet-credit RPC.
-- - Export function definitions and validate any dependent integration before rollback.
-- - Rollback must not touch existing Worker, wallet, lifecycle, registration-fee,
--   plan, notification, or payment-attempt rows.
--
-- Safe reverse order for manual rollback review only:
-- revoke execute on function public.apply_verified_worker_razorpay_credit(text, text, text, text, bigint, text, text, text) from service_role;
-- drop function public.apply_verified_worker_razorpay_credit(text, text, text, text, bigint, text, text, text);
