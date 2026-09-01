-- PHASE 16H.11A BYTE-PRESERVED PREVIEW TRANSACTIONAL APPLICATION
-- FUTURE AUTHORIZED TARGET ONLY: rtftsavrplygvvdsrmrp
-- PRODUCTION PROJECT IS EXCLUDED.
-- Do not execute without separate Preview-application approval.

begin;
-- Phase 16H.6 sanitized schema derivative — review only; not approved for application.
-- Source data rows, Production network paths, Vault access, privileged definer functions, and broad client grants are excluded.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."worker_referral_email_outbox" (
    "id" "text" NOT NULL,
    "event_key" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "payload_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_attempt_at" timestamp with time zone,
    "last_attempt_at" timestamp with time zone,
    "processing_started_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "provider_message_id" "text",
    "last_error_code" "text",
    "last_error_message_safe" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_email_outbox_attempt_count_check" CHECK ((("attempt_count" >= 0) AND ("attempt_count" <= 4))),
    CONSTRAINT "worker_referral_email_outbox_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."worker_referral_email_outbox" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_email_outbox" IS 'Rozgar Refer & Earn: admin-only email outbox for controlled Resend delivery.';


CREATE OR REPLACE FUNCTION "public"."create_worker_referral_withdrawal_request"("p_worker_id" "text", "p_amount" numeric, "p_payout_method" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
  v_minimum_withdrawal_amount numeric(12, 2) := 250;
  v_minimum_withdrawal_text text := '250';
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

  select minimum_withdrawal_amount
    into v_minimum_withdrawal_amount
    from public.worker_referral_settings
   where id = 'global'
   limit 1;

  v_minimum_withdrawal_amount := coalesce(round(v_minimum_withdrawal_amount, 2), 250);
  v_minimum_withdrawal_text := trim(trailing '.' from trim(trailing '0' from to_char(v_minimum_withdrawal_amount, 'FM999999999990.00')));

  if v_amount < v_minimum_withdrawal_amount then
    return jsonb_build_object(
      'success', false,
      'code', 'minimum-withdrawal',
      'message', 'Minimum withdrawal is Rs ' || v_minimum_withdrawal_text || '.'
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


ALTER FUNCTION "public"."create_worker_referral_withdrawal_request"("p_worker_id" "text", "p_amount" numeric, "p_payout_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_worker_referral_reward"("p_referral_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."credit_worker_referral_reward"("p_referral_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_worker_referral_withdrawal_paid"("p_request_id" "text", "p_payment_reference" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."mark_worker_referral_withdrawal_paid"("p_request_id" "text", "p_payment_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_worker_referral_withdrawal"("p_request_id" "text", "p_action" "text", "p_rejection_reason" "text" DEFAULT ''::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_request public.worker_referral_withdrawal_requests%rowtype;
  v_now timestamptz := now();
  v_request_id text := trim(coalesce(p_request_id, ''));
  v_action text := lower(trim(coalesce(p_action, '')));
  v_reason text := trim(coalesce(p_rejection_reason, ''));
begin
  if v_request_id = '' then
    return jsonb_build_object(
      'success', false,
      'code', 'request-required',
      'message', 'Withdrawal request ID is required.'
    );
  end if;

  if v_action not in ('approve', 'reject') then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-action',
      'message', 'Select a valid review action.'
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

  if v_request.status <> 'requested' then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-status-transition',
      'message', 'Only requested withdrawals can be reviewed in this phase.'
    );
  end if;

  if v_action = 'approve' then
    update public.worker_referral_withdrawal_requests
       set status = 'approved',
           approved_at = v_now,
           rejected_at = null,
           rejection_reason = '',
           updated_at = v_now
     where id = v_request.id
     returning * into v_request;
  else
    if v_reason = '' then
      return jsonb_build_object(
        'success', false,
        'code', 'rejection-reason-required',
        'message', 'Rejection reason is required.'
      );
    end if;

    update public.worker_referral_withdrawal_requests
       set status = 'rejected',
           rejected_at = v_now,
           rejection_reason = v_reason,
           approved_at = null,
           updated_at = v_now
     where id = v_request.id
     returning * into v_request;
  end if;

  return jsonb_build_object(
    'success', true,
    'withdrawal', to_jsonb(v_request)
  );
end;
$$;


ALTER FUNCTION "public"."review_worker_referral_withdrawal"("p_request_id" "text", "p_action" "text", "p_rejection_reason" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_modules" (
    "client_id" "text" NOT NULL,
    "module_id" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "role" "text" DEFAULT 'CLIENT'::"text" NOT NULL,
    "phone" "text",
    "plan" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_admin_settings" (
    "id" "text" NOT NULL,
    "settings_json" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."labour_admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_audit_logs" (
    "id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "actor" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_audit_logs_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"]))),
    CONSTRAINT "labour_audit_logs_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['categories'::"text", 'plans'::"text", 'workers'::"text", 'companies'::"text", 'jobPosts'::"text", 'jobApplications'::"text", 'savedJobs'::"text", 'workerNotifications'::"text", 'walletTransactions'::"text", 'rechargeRequests'::"text"])))
);


ALTER TABLE "public"."labour_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "demand_level" "text" DEFAULT 'medium'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "show_on_home" boolean DEFAULT true NOT NULL,
    "home_order" integer DEFAULT 0 NOT NULL,
    "image_url" "text",
    CONSTRAINT "labour_categories_demand_level_check" CHECK (("demand_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."labour_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_companies" (
    "id" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "mobile" "text" NOT NULL,
    "city" "text",
    "category_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "registration_fee_paid" boolean DEFAULT false NOT NULL,
    "active_plan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "contact_mobile" "text",
    "business_type" "text",
    "industry_category" "text",
    "gst_number" "text",
    "company_address" "text",
    "state" "text",
    "pincode" "text",
    "workers_needed" integer DEFAULT 0 NOT NULL,
    "hiring_type" "text",
    "business_description" "text",
    "gst_certificate_path" "text",
    "company_proof_path" "text",
    "owner_id_proof_path" "text",
    CONSTRAINT "labour_companies_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."labour_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_job_applications" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "job_post_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "note" "text",
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_job_applications_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'reviewed'::"text", 'shortlisted'::"text", 'rejected'::"text", 'hired'::"text"])))
);


ALTER TABLE "public"."labour_job_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_job_posts" (
    "id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "city" "text",
    "workers_needed" integer DEFAULT 1 NOT NULL,
    "wage_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "validity_days" integer DEFAULT 3 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" "date",
    "expires_at" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_label" "text",
    "latitude" double precision,
    "longitude" double precision,
    "plan_id" "text",
    CONSTRAINT "labour_job_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'live'::"text", 'expired'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."labour_job_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_plans" (
    "id" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category_id" "text",
    "registration_fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "wallet_credit" numeric(10,2) DEFAULT 0 NOT NULL,
    "plan_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "validity_days" integer DEFAULT 0 NOT NULL,
    "daily_charge" numeric(10,2) DEFAULT 0 NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "industry_category_values" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "business_type_values" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "labour_category_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "job_post_limit" integer DEFAULT 1 NOT NULL,
    "plan_validity_days" integer DEFAULT 0 NOT NULL,
    "job_post_live_days" integer DEFAULT 0 NOT NULL,
    "plan_extension_days" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "labour_plans_audience_check" CHECK (("audience" = ANY (ARRAY['worker'::"text", 'company'::"text"]))),
    CONSTRAINT "labour_plans_plan_extension_days_non_negative" CHECK (("plan_extension_days" >= 0))
);


ALTER TABLE "public"."labour_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_recharge_requests" (
    "id" "text" NOT NULL,
    "request_type" "text" NOT NULL,
    "related_entity_type" "text" NOT NULL,
    "related_entity_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "category_label" "text",
    "status_label" "text",
    "suggested_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "request_status" "text" DEFAULT 'open'::"text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_recharge_requests_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "labour_recharge_requests_related_entity_type_check" CHECK (("related_entity_type" = ANY (ARRAY['worker'::"text", 'company'::"text"]))),
    CONSTRAINT "labour_recharge_requests_request_status_check" CHECK (("request_status" = ANY (ARRAY['open'::"text", 'contacted'::"text", 'resolved'::"text", 'closed'::"text"]))),
    CONSTRAINT "labour_recharge_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['worker_recharge'::"text", 'company_follow_up'::"text", 'worker_support'::"text"])))
);


ALTER TABLE "public"."labour_recharge_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_saved_jobs" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "job_post_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."labour_saved_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "text",
    "amount" numeric(10,2) NOT NULL,
    "type" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "reference_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "city" character varying(100),
    "state" character varying(100),
    "industry" character varying(100),
    "balance_after" numeric(10,2) DEFAULT 0,
    "metadata" "jsonb",
    "entity_type" character varying(20) DEFAULT 'worker'::character varying,
    "entity_id" "text",
    "entity_name" character varying(200),
    "transaction_type" character varying(50),
    "direction" character varying(10),
    "reference" character varying(200),
    "note" "text"
);


ALTER TABLE "public"."labour_wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_website_content" (
    "id" "text" NOT NULL,
    "page_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content_json" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."labour_website_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_consent_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_type" "text" NOT NULL,
    "recipient_id" "text",
    "normalized_mobile" "text" NOT NULL,
    "consent_type" "text" NOT NULL,
    "previous_allowed" boolean,
    "new_allowed" boolean NOT NULL,
    "event_type" "text" NOT NULL,
    "source" "text" NOT NULL,
    "consent_text_version" "text" DEFAULT ''::"text" NOT NULL,
    "event_message_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_consent_events_event_message_id_nonempty_check" CHECK ((("event_message_id" IS NULL) OR ("btrim"("event_message_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_consent_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['granted'::"text", 'denied'::"text", 'opted_out'::"text", 'restoration_requested'::"text", 'restored'::"text", 'admin_correction'::"text"]))),
    CONSTRAINT "labour_whatsapp_consent_events_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_consent_events_mobile_e164_check" CHECK (("normalized_mobile" ~ '^\+[1-9][0-9]{7,14}$'::"text")),
    CONSTRAINT "labour_whatsapp_consent_events_mobile_nonempty_check" CHECK (("btrim"("normalized_mobile") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_consent_events_recipient_id_nonempty_check" CHECK ((("recipient_id" IS NULL) OR ("btrim"("recipient_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_consent_events_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['worker'::"text", 'company'::"text", 'unknown'::"text"]))),
    CONSTRAINT "labour_whatsapp_consent_events_source_nonempty_check" CHECK (("btrim"("source") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_consent_events_type_check" CHECK (("consent_type" = ANY (ARRAY['service_allowed'::"text", 'matching_alerts_allowed'::"text", 'marketing_allowed'::"text"])))
);


ALTER TABLE "public"."labour_whatsapp_consent_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_consent_events" IS 'Append-oriented WhatsApp consent audit history. No trigger, UPDATE, or DELETE workflow is assumed for application correctness. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



COMMENT ON COLUMN "public"."labour_whatsapp_consent_events"."event_message_id" IS 'Optional provider or inbound message identifier used only for deduplication support when a message-backed consent event exists.';



CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_type" "text" NOT NULL,
    "recipient_id" "text",
    "normalized_mobile" "text" NOT NULL,
    "consent_type" "text" NOT NULL,
    "allowed" boolean DEFAULT false NOT NULL,
    "source" "text" NOT NULL,
    "consent_text_version" "text" DEFAULT ''::"text" NOT NULL,
    "consented_at" timestamp with time zone,
    "opted_out_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_consents_active_allowed_not_opted_out_check" CHECK ((NOT ("allowed" AND ("opted_out_at" IS NOT NULL)))),
    CONSTRAINT "labour_whatsapp_consents_allowed_requires_consented_at_check" CHECK (((NOT "allowed") OR ("consented_at" IS NOT NULL))),
    CONSTRAINT "labour_whatsapp_consents_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_consents_mobile_e164_check" CHECK (("normalized_mobile" ~ '^\+[1-9][0-9]{7,14}$'::"text")),
    CONSTRAINT "labour_whatsapp_consents_mobile_nonempty_check" CHECK (("btrim"("normalized_mobile") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_consents_recipient_id_nonempty_check" CHECK ((("recipient_id" IS NULL) OR ("btrim"("recipient_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_consents_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['worker'::"text", 'company'::"text", 'external_test'::"text"]))),
    CONSTRAINT "labour_whatsapp_consents_source_nonempty_check" CHECK (("btrim"("source") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_consents_type_check" CHECK (("consent_type" = ANY (ARRAY['service_allowed'::"text", 'matching_alerts_allowed'::"text", 'marketing_allowed'::"text"])))
);


ALTER TABLE "public"."labour_whatsapp_consents" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_consents" IS 'Current effective WhatsApp consent state only. This table must not replace or erase immutable consent-event history. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



COMMENT ON COLUMN "public"."labour_whatsapp_consents"."metadata" IS 'Object-shaped metadata only. Detailed consent-flow validation remains the responsibility of the application layer.';



CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_inbound_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "text" NOT NULL,
    "normalized_mobile" "text",
    "matched_recipient_type" "text",
    "matched_recipient_id" "text",
    "event_kind" "text" NOT NULL,
    "raw_text" "text" DEFAULT ''::"text" NOT NULL,
    "normalized_text" "text" DEFAULT ''::"text" NOT NULL,
    "command_key" "text",
    "suppression_applied" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_inbound_events_command_key_nonempty_check" CHECK ((("command_key" IS NULL) OR ("btrim"("command_key") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_inbound_events_kind_check" CHECK (("event_kind" = ANY (ARRAY['opt_out_all'::"text", 'restore_request'::"text", 'message'::"text", 'unknown'::"text"]))),
    CONSTRAINT "labour_whatsapp_inbound_events_message_id_nonempty_check" CHECK (("btrim"("message_id") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_inbound_events_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_inbound_events_mobile_e164_check" CHECK ((("normalized_mobile" IS NULL) OR ("normalized_mobile" ~ '^\+[1-9][0-9]{7,14}$'::"text"))),
    CONSTRAINT "labour_whatsapp_inbound_events_mobile_nonempty_check" CHECK ((("normalized_mobile" IS NULL) OR ("btrim"("normalized_mobile") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_inbound_events_recipient_id_nonempty_check" CHECK ((("matched_recipient_id" IS NULL) OR ("btrim"("matched_recipient_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_inbound_events_recipient_type_check" CHECK (("matched_recipient_type" = ANY (ARRAY['worker'::"text", 'company'::"text", 'external_test'::"text"])))
);


ALTER TABLE "public"."labour_whatsapp_inbound_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_inbound_events" IS 'Inbound WhatsApp audit records only. This migration does not activate webhook persistence or outbound messaging. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "settings_key" "text" NOT NULL,
    "settings_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_settings_key_nonempty_check" CHECK (("btrim"("settings_key") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_settings_value_shape_check" CHECK (
CASE
    WHEN ("settings_key" = 'pause_all_sending'::"text") THEN ("jsonb_typeof"("settings_value") = 'boolean'::"text")
    WHEN ("settings_key" = ANY (ARRAY['worker_daily_limit'::"text", 'company_job_daily_limit'::"text", 'manual_bulk_cap'::"text"])) THEN ("jsonb_typeof"("settings_value") = 'number'::"text")
    WHEN ("settings_key" = ANY (ARRAY['quiet_hours_start'::"text", 'quiet_hours_end'::"text", 'timezone'::"text"])) THEN ("jsonb_typeof"("settings_value") = 'string'::"text")
    ELSE ("jsonb_typeof"("settings_value") = 'object'::"text")
END)
);


ALTER TABLE "public"."labour_whatsapp_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_settings" IS 'Operational WhatsApp safety settings only. Future application code must treat a missing or invalid pause_all_sending value as paused. Phase 16C.2 does not connect this setting to any sender. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



COMMENT ON COLUMN "public"."labour_whatsapp_settings"."settings_value" IS 'Known settings use conservative JSON types: pause_all_sending=boolean, numeric limits=number, quiet-hours/timezone=string, future composite settings=object.';



CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_suppressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "normalized_mobile" "text" NOT NULL,
    "suppression_scope" "text" DEFAULT 'all_whatsapp'::"text" NOT NULL,
    "trigger_source" "text" NOT NULL,
    "trigger_command" "text" NOT NULL,
    "trigger_message_id" "text",
    "previous_consent_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "restoration_requested_at" timestamp with time zone,
    "restoration_message_id" "text",
    "active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_suppressions_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_mobile_e164_check" CHECK (("normalized_mobile" ~ '^\+[1-9][0-9]{7,14}$'::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_mobile_nonempty_check" CHECK (("btrim"("normalized_mobile") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_restoration_message_id_nonempty_ch" CHECK ((("restoration_message_id" IS NULL) OR ("btrim"("restoration_message_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_suppressions_scope_nonempty_check" CHECK (("btrim"("suppression_scope") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_snapshot_object_check" CHECK (("jsonb_typeof"("previous_consent_snapshot") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_trigger_command_nonempty_check" CHECK (("btrim"("trigger_command") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_suppressions_trigger_message_id_nonempty_check" CHECK ((("trigger_message_id" IS NULL) OR ("btrim"("trigger_message_id") <> ''::"text"))),
    CONSTRAINT "labour_whatsapp_suppressions_trigger_source_nonempty_check" CHECK (("btrim"("trigger_source") <> ''::"text"))
);


ALTER TABLE "public"."labour_whatsapp_suppressions" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_suppressions" IS 'Independent WhatsApp suppression state. A general STOP can suppress all categories without mutating historical consent events. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



CREATE TABLE IF NOT EXISTS "public"."labour_whatsapp_template_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meta_template_name" "text" NOT NULL,
    "language" "text" NOT NULL,
    "meta_category" "text" NOT NULL,
    "meta_status" "text" NOT NULL,
    "intended_recipient_type" "text",
    "intended_business_event" "text",
    "header_type" "text" NOT NULL,
    "body_variable_schema" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "footer_text" "text" DEFAULT ''::"text" NOT NULL,
    "button_schema" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "safe_test_available" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_synchronized_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_whatsapp_template_inventory_body_variables_array_check" CHECK (("jsonb_typeof"("body_variable_schema") = 'array'::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_button_schema_array_check" CHECK (("jsonb_typeof"("button_schema") = 'array'::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_category_nonempty_check" CHECK (("btrim"("meta_category") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_enabled_requires_approved_st" CHECK ((("enabled" = false) OR ("meta_status" = 'APPROVED'::"text"))),
    CONSTRAINT "labour_whatsapp_template_inventory_header_type_check" CHECK (("header_type" = ANY (ARRAY['NONE'::"text", 'TEXT'::"text", 'IMAGE'::"text", 'VIDEO'::"text", 'DOCUMENT'::"text"]))),
    CONSTRAINT "labour_whatsapp_template_inventory_language_nonempty_check" CHECK (("btrim"("language") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_name_nonempty_check" CHECK (("btrim"("meta_template_name") <> ''::"text")),
    CONSTRAINT "labour_whatsapp_template_inventory_recipient_type_check" CHECK (("intended_recipient_type" = ANY (ARRAY['worker'::"text", 'company'::"text", 'both'::"text", 'external_test'::"text"]))),
    CONSTRAINT "labour_whatsapp_template_inventory_safe_test_requires_approved_" CHECK ((("safe_test_available" = false) OR ("meta_status" = 'APPROVED'::"text"))),
    CONSTRAINT "labour_whatsapp_template_inventory_status_nonempty_check" CHECK (("btrim"("meta_status") <> ''::"text"))
);


ALTER TABLE "public"."labour_whatsapp_template_inventory" OWNER TO "postgres";


COMMENT ON TABLE "public"."labour_whatsapp_template_inventory" IS 'Persisted read-only template inventory. SQL can prevent enablement unless Meta status is APPROVED, but application-layer validation still controls detailed variables, media contracts, and button contracts. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';



CREATE TABLE IF NOT EXISTS "public"."labour_worker_device_tokens" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "fcm_token" "text" NOT NULL,
    "locale" "text" DEFAULT 'hi'::"text" NOT NULL,
    "platform" "text" DEFAULT 'android'::"text" NOT NULL,
    "device_label" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."labour_worker_device_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_worker_notifications" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_job_post_id" "text",
    "related_company_id" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labour_worker_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "labour_worker_notifications_type_check" CHECK (("type" = ANY (ARRAY['application_submitted'::"text", 'job_saved'::"text", 'application_status'::"text", 'wallet_reminder'::"text"])))
);


ALTER TABLE "public"."labour_worker_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labour_workers" (
    "id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "mobile" "text" NOT NULL,
    "city" "text",
    "experience_years" numeric(6,2) DEFAULT 0 NOT NULL,
    "expected_daily_wage" numeric(10,2) DEFAULT 0 NOT NULL,
    "wallet_balance" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "availability" "text" DEFAULT 'available_today'::"text" NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "category_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "skills" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "profile_photo_path" "text" DEFAULT ''::"text" NOT NULL,
    "identity_proof_type" "text" DEFAULT ''::"text" NOT NULL,
    "identity_proof_number" "text" DEFAULT ''::"text" NOT NULL,
    "identity_proof_path" "text" DEFAULT ''::"text" NOT NULL,
    "registration_completed_at" timestamp with time zone,
    "registration_fee_paid" boolean DEFAULT false NOT NULL,
    "home_city" "text",
    "address" "text",
    "active_plan" "text",
    "plan_valid_from" "date",
    "plan_valid_until" "date",
    "last_wallet_deduction_date" "date",
    "worker_paused_by_worker" boolean DEFAULT false NOT NULL,
    "worker_paused_at" timestamp with time zone,
    "worker_reactivated_at" timestamp with time zone,
    "salary_type" "text",
    "preferred_work_locations" "jsonb",
    "minimum_expected_wage" numeric,
    "maximum_expected_wage" numeric,
    "resume_document_path" "text",
    "kyc_status" "text",
    "kyc_remarks" "text",
    CONSTRAINT "labour_workers_availability_check" CHECK (("availability" = ANY (ARRAY['available_today'::"text", 'available_this_week'::"text", 'not_available'::"text"]))),
    CONSTRAINT "labour_workers_identity_proof_type_check" CHECK (("identity_proof_type" = ANY (ARRAY[''::"text", 'aadhaar'::"text", 'pan'::"text", 'voter_id'::"text", 'driving_license'::"text", 'other'::"text"]))),
    CONSTRAINT "labour_workers_kyc_status_check" CHECK ((("kyc_status" IS NULL) OR ("kyc_status" = ANY (ARRAY['pending_review'::"text", 'approved'::"text", 'rejected'::"text", 'needs_correction'::"text"])))),
    CONSTRAINT "labour_workers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive_wallet_empty'::"text", 'inactive_subscription_expired'::"text", 'inactive_paused_by_worker'::"text", 'blocked'::"text", 'rejected'::"text", 'needs_correction'::"text"])))
);


ALTER TABLE "public"."labour_workers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."labour_workers"."salary_type" IS 'Worker salary type selected in Rozgar registration/profile. Null means fallback to Daily Wage.';



CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'coming_soon'::"text" NOT NULL,
    "type" "text",
    "icon" "text",
    "href" "text",
    "customer_link" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "color" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worker_referral_category_eligibility" (
    "id" "text" NOT NULL,
    "referral_profile_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "reward_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_category_eligibility_reward_amount_check" CHECK (("reward_amount" >= (0)::numeric))
);


ALTER TABLE "public"."worker_referral_category_eligibility" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_category_eligibility" IS 'Rozgar Refer & Earn: active existing labour categories eligible for a referrer and reward amount.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_ledger" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "referral_id" "text" NOT NULL,
    "entry_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "balance_after" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reference" "text" NOT NULL,
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_ledger_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "worker_referral_ledger_balance_after_check" CHECK (("balance_after" >= (0)::numeric)),
    CONSTRAINT "worker_referral_ledger_entry_type_check" CHECK (("entry_type" = ANY (ARRAY['reward_credit'::"text", 'reward_reversal'::"text", 'withdrawal_debit'::"text", 'withdrawal_reversal'::"text"]))),
    CONSTRAINT "worker_referral_ledger_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'available'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."worker_referral_ledger" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_ledger" IS 'Rozgar Refer & Earn: separate append-only referral earnings ledger; does not affect labour_wallet_transactions.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_payout_account_audit" (
    "id" "text" NOT NULL,
    "payout_account_id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "method" "text" NOT NULL,
    "masked_destination" "text" NOT NULL,
    "actor" "text" DEFAULT 'worker-app'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_payout_account_audit_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'replace'::"text"]))),
    CONSTRAINT "worker_referral_payout_account_audit_method_check" CHECK (("method" = ANY (ARRAY['bank'::"text", 'upi'::"text"])))
);


ALTER TABLE "public"."worker_referral_payout_account_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_payout_account_audit" IS 'Rozgar Refer & Earn: payout destination change audit with masked values only.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_payout_accounts" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "method" "text" NOT NULL,
    "account_holder_name" "text" DEFAULT ''::"text" NOT NULL,
    "account_number_ciphertext" "text" DEFAULT ''::"text" NOT NULL,
    "account_number_last4" "text" DEFAULT ''::"text" NOT NULL,
    "ifsc" "text" DEFAULT ''::"text" NOT NULL,
    "upi_id_ciphertext" "text" DEFAULT ''::"text" NOT NULL,
    "upi_id_masked" "text" DEFAULT ''::"text" NOT NULL,
    "encryption_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "preferred_method" "text",
    CONSTRAINT "worker_referral_payout_accounts_bank_last4_check" CHECK ((("account_number_last4" = ''::"text") OR ("account_number_last4" ~ '^[0-9]{4}$'::"text"))),
    CONSTRAINT "worker_referral_payout_accounts_encryption_version_check" CHECK (("encryption_version" = 'v1'::"text")),
    CONSTRAINT "worker_referral_payout_accounts_method_alignment_check" CHECK ((("preferred_method" IS NULL) OR ("method" = "preferred_method"))),
    CONSTRAINT "worker_referral_payout_accounts_method_check" CHECK (("method" = ANY (ARRAY['bank'::"text", 'upi'::"text"]))),
    CONSTRAINT "worker_referral_payout_accounts_method_fields_check" CHECK ((((("account_holder_name" = ''::"text") AND ("account_number_ciphertext" = ''::"text") AND ("account_number_last4" = ''::"text") AND ("ifsc" = ''::"text")) OR (("account_holder_name" <> ''::"text") AND ("account_number_ciphertext" <> ''::"text") AND ("account_number_last4" ~ '^[0-9]{4}$'::"text") AND ("ifsc" ~ '^[A-Z]{4}0[A-Z0-9]{6}$'::"text"))) AND ((("upi_id_ciphertext" = ''::"text") AND ("upi_id_masked" = ''::"text")) OR (("upi_id_ciphertext" <> ''::"text") AND ("upi_id_masked" <> ''::"text"))) AND ((("account_holder_name" <> ''::"text") AND ("account_number_ciphertext" <> ''::"text") AND ("account_number_last4" ~ '^[0-9]{4}$'::"text") AND ("ifsc" ~ '^[A-Z]{4}0[A-Z0-9]{6}$'::"text")) OR (("upi_id_ciphertext" <> ''::"text") AND ("upi_id_masked" <> ''::"text"))) AND (("preferred_method" IS NULL) OR (("preferred_method" = 'bank'::"text") AND ("account_holder_name" <> ''::"text") AND ("account_number_ciphertext" <> ''::"text") AND ("account_number_last4" ~ '^[0-9]{4}$'::"text") AND ("ifsc" ~ '^[A-Z]{4}0[A-Z0-9]{6}$'::"text")) OR (("preferred_method" = 'upi'::"text") AND ("upi_id_ciphertext" <> ''::"text") AND ("upi_id_masked" <> ''::"text"))))),
    CONSTRAINT "worker_referral_payout_accounts_preferred_method_check" CHECK ((("preferred_method" IS NULL) OR ("preferred_method" = ANY (ARRAY['bank'::"text", 'upi'::"text"]))))
);


ALTER TABLE "public"."worker_referral_payout_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_payout_accounts" IS 'Rozgar Refer & Earn: one secure payout row per worker, allowing saved bank and UPI methods for future withdrawals.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_profiles" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "referral_code" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_profiles_referral_code_format_check" CHECK (("referral_code" ~ '^RZG[A-Z0-9]{8}$'::"text"))
);


ALTER TABLE "public"."worker_referral_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_profiles" IS 'Rozgar Refer & Earn: one permanent server-generated referral code per worker.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_settings" (
    "id" "text" NOT NULL,
    "minimum_withdrawal_amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_settings_minimum_withdrawal_amount_check" CHECK (("minimum_withdrawal_amount" > (0)::numeric))
);


ALTER TABLE "public"."worker_referral_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_settings" IS 'Rozgar Refer & Earn: global settings such as the minimum withdrawal amount.';



CREATE TABLE IF NOT EXISTS "public"."worker_referral_withdrawal_requests" (
    "id" "text" NOT NULL,
    "worker_id" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payout_method" "text" NOT NULL,
    "payout_account_id" "text" NOT NULL,
    "masked_destination" "text" DEFAULT ''::"text" NOT NULL,
    "encrypted_destination_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "rejection_reason" "text" DEFAULT ''::"text" NOT NULL,
    "payment_reference" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referral_withdrawal_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "worker_referral_withdrawal_requests_masked_destination_check" CHECK (("masked_destination" <> ''::"text")),
    CONSTRAINT "worker_referral_withdrawal_requests_payout_method_check" CHECK (("payout_method" = ANY (ARRAY['bank'::"text", 'upi'::"text"]))),
    CONSTRAINT "worker_referral_withdrawal_requests_snapshot_object_check" CHECK (("jsonb_typeof"("encrypted_destination_snapshot") = 'object'::"text")),
    CONSTRAINT "worker_referral_withdrawal_requests_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'approved'::"text", 'processing'::"text", 'paid'::"text", 'rejected'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."worker_referral_withdrawal_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referral_withdrawal_requests" IS 'Rozgar Refer & Earn: reserved withdrawal requests for referral earnings before later admin approval/payment phases.';



CREATE TABLE IF NOT EXISTS "public"."worker_referrals" (
    "id" "text" NOT NULL,
    "referrer_worker_id" "text" NOT NULL,
    "referred_worker_id" "text" NOT NULL,
    "referral_profile_id" "text" NOT NULL,
    "referral_code_snapshot" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "reward_amount_snapshot" numeric(12,2) DEFAULT 0 NOT NULL,
    "referral_status" "text" DEFAULT 'attributed'::"text" NOT NULL,
    "reward_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attributed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "registered_at" timestamp with time zone,
    "qualified_at" timestamp with time zone,
    "rewarded_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "invalidated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "worker_referrals_no_self_referral_check" CHECK (("referrer_worker_id" <> "referred_worker_id")),
    CONSTRAINT "worker_referrals_referral_status_check" CHECK (("referral_status" = ANY (ARRAY['attributed'::"text", 'registered'::"text", 'kyc_pending'::"text", 'qualified'::"text", 'rejected'::"text", 'reward_credited'::"text", 'invalid'::"text"]))),
    CONSTRAINT "worker_referrals_reward_amount_snapshot_check" CHECK (("reward_amount_snapshot" >= (0)::numeric)),
    CONSTRAINT "worker_referrals_reward_status_check" CHECK (("reward_status" = ANY (ARRAY['pending'::"text", 'available'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."worker_referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_referrals" IS 'Rozgar Refer & Earn: immutable Worker 1 to Worker 2 attribution with category and reward snapshots.';



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_pkey" PRIMARY KEY ("client_id", "module_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_admin_settings"
    ADD CONSTRAINT "labour_admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_audit_logs"
    ADD CONSTRAINT "labour_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_categories"
    ADD CONSTRAINT "labour_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_categories"
    ADD CONSTRAINT "labour_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."labour_companies"
    ADD CONSTRAINT "labour_companies_mobile_key" UNIQUE ("mobile");



ALTER TABLE ONLY "public"."labour_companies"
    ADD CONSTRAINT "labour_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_job_applications"
    ADD CONSTRAINT "labour_job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_job_posts"
    ADD CONSTRAINT "labour_job_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_plans"
    ADD CONSTRAINT "labour_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_recharge_requests"
    ADD CONSTRAINT "labour_recharge_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_saved_jobs"
    ADD CONSTRAINT "labour_saved_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_wallet_transactions"
    ADD CONSTRAINT "labour_wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_website_content"
    ADD CONSTRAINT "labour_website_content_page_key_key" UNIQUE ("page_key");



ALTER TABLE ONLY "public"."labour_website_content"
    ADD CONSTRAINT "labour_website_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_consent_events"
    ADD CONSTRAINT "labour_whatsapp_consent_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_consents"
    ADD CONSTRAINT "labour_whatsapp_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_inbound_events"
    ADD CONSTRAINT "labour_whatsapp_inbound_events_message_id_key" UNIQUE ("message_id");



ALTER TABLE ONLY "public"."labour_whatsapp_inbound_events"
    ADD CONSTRAINT "labour_whatsapp_inbound_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_settings"
    ADD CONSTRAINT "labour_whatsapp_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_settings"
    ADD CONSTRAINT "labour_whatsapp_settings_settings_key_key" UNIQUE ("settings_key");



ALTER TABLE ONLY "public"."labour_whatsapp_suppressions"
    ADD CONSTRAINT "labour_whatsapp_suppressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_whatsapp_template_inventory"
    ADD CONSTRAINT "labour_whatsapp_template_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_worker_device_tokens"
    ADD CONSTRAINT "labour_worker_device_tokens_fcm_token_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."labour_worker_device_tokens"
    ADD CONSTRAINT "labour_worker_device_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_worker_notifications"
    ADD CONSTRAINT "labour_worker_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labour_workers"
    ADD CONSTRAINT "labour_workers_mobile_key" UNIQUE ("mobile");



ALTER TABLE ONLY "public"."labour_workers"
    ADD CONSTRAINT "labour_workers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."worker_referral_category_eligibility"
    ADD CONSTRAINT "worker_referral_category_eligibility_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_category_eligibility"
    ADD CONSTRAINT "worker_referral_category_eligibility_profile_category_key" UNIQUE ("referral_profile_id", "category_id");



ALTER TABLE ONLY "public"."worker_referral_email_outbox"
    ADD CONSTRAINT "worker_referral_email_outbox_event_key_key" UNIQUE ("event_key");



ALTER TABLE ONLY "public"."worker_referral_email_outbox"
    ADD CONSTRAINT "worker_referral_email_outbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_ledger"
    ADD CONSTRAINT "worker_referral_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_ledger"
    ADD CONSTRAINT "worker_referral_ledger_reference_key" UNIQUE ("reference");



ALTER TABLE ONLY "public"."worker_referral_payout_account_audit"
    ADD CONSTRAINT "worker_referral_payout_account_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_payout_accounts"
    ADD CONSTRAINT "worker_referral_payout_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_payout_accounts"
    ADD CONSTRAINT "worker_referral_payout_accounts_worker_key" UNIQUE ("worker_id");



ALTER TABLE ONLY "public"."worker_referral_profiles"
    ADD CONSTRAINT "worker_referral_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_profiles"
    ADD CONSTRAINT "worker_referral_profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."worker_referral_profiles"
    ADD CONSTRAINT "worker_referral_profiles_worker_id_key" UNIQUE ("worker_id");



ALTER TABLE ONLY "public"."worker_referral_settings"
    ADD CONSTRAINT "worker_referral_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referral_withdrawal_requests"
    ADD CONSTRAINT "worker_referral_withdrawal_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_referred_worker_id_key" UNIQUE ("referred_worker_id");



CREATE INDEX "idx_labour_admin_settings_updated_at" ON "public"."labour_admin_settings" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_labour_audit_logs_created_at" ON "public"."labour_audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_labour_categories_active" ON "public"."labour_categories" USING "btree" ("is_active");



CREATE UNIQUE INDEX "idx_labour_companies_email_unique" ON "public"."labour_companies" USING "btree" ("lower"("email")) WHERE (("email" IS NOT NULL) AND ("btrim"("email") <> ''::"text"));



CREATE INDEX "idx_labour_companies_status" ON "public"."labour_companies" USING "btree" ("status");



CREATE INDEX "idx_labour_job_applications_job_post_id" ON "public"."labour_job_applications" USING "btree" ("job_post_id");



CREATE INDEX "idx_labour_job_applications_worker_id" ON "public"."labour_job_applications" USING "btree" ("worker_id");



CREATE INDEX "idx_labour_job_posts_plan_id" ON "public"."labour_job_posts" USING "btree" ("plan_id");



CREATE INDEX "idx_labour_job_posts_status" ON "public"."labour_job_posts" USING "btree" ("status");



CREATE INDEX "idx_labour_plans_audience" ON "public"."labour_plans" USING "btree" ("audience");



CREATE INDEX "idx_labour_recharge_requests_priority" ON "public"."labour_recharge_requests" USING "btree" ("priority");



CREATE INDEX "idx_labour_recharge_requests_status" ON "public"."labour_recharge_requests" USING "btree" ("request_status");



CREATE INDEX "idx_labour_saved_jobs_job_post_id" ON "public"."labour_saved_jobs" USING "btree" ("job_post_id");



CREATE INDEX "idx_labour_saved_jobs_worker_id" ON "public"."labour_saved_jobs" USING "btree" ("worker_id");



CREATE INDEX "idx_labour_website_content_page_key" ON "public"."labour_website_content" USING "btree" ("page_key");



CREATE UNIQUE INDEX "idx_labour_whatsapp_consent_events_message_dedupe" ON "public"."labour_whatsapp_consent_events" USING "btree" ("event_message_id", "normalized_mobile", "consent_type", "event_type") WHERE ("event_message_id" IS NOT NULL);



CREATE INDEX "idx_labour_whatsapp_consent_events_mobile_type_occurred" ON "public"."labour_whatsapp_consent_events" USING "btree" ("normalized_mobile", "consent_type", "occurred_at" DESC);



CREATE INDEX "idx_labour_whatsapp_consent_events_recipient_occurred" ON "public"."labour_whatsapp_consent_events" USING "btree" ("recipient_type", "recipient_id", "occurred_at" DESC);



CREATE INDEX "idx_labour_whatsapp_consents_mobile" ON "public"."labour_whatsapp_consents" USING "btree" ("normalized_mobile");



CREATE INDEX "idx_labour_whatsapp_consents_type_allowed" ON "public"."labour_whatsapp_consents" USING "btree" ("consent_type", "allowed");



CREATE UNIQUE INDEX "idx_labour_whatsapp_consents_unique_recipient_consent" ON "public"."labour_whatsapp_consents" USING "btree" ("recipient_type", COALESCE("recipient_id", ''::"text"), "normalized_mobile", "consent_type");



CREATE INDEX "idx_labour_whatsapp_inbound_events_kind" ON "public"."labour_whatsapp_inbound_events" USING "btree" ("event_kind", "created_at" DESC);



CREATE INDEX "idx_labour_whatsapp_inbound_events_mobile" ON "public"."labour_whatsapp_inbound_events" USING "btree" ("normalized_mobile");



CREATE INDEX "idx_labour_whatsapp_settings_key" ON "public"."labour_whatsapp_settings" USING "btree" ("settings_key");



CREATE UNIQUE INDEX "idx_labour_whatsapp_suppressions_mobile_active" ON "public"."labour_whatsapp_suppressions" USING "btree" ("normalized_mobile") WHERE ("active" = true);



CREATE UNIQUE INDEX "idx_labour_whatsapp_suppressions_restoration_message_id" ON "public"."labour_whatsapp_suppressions" USING "btree" ("restoration_message_id") WHERE ("restoration_message_id" IS NOT NULL);



CREATE INDEX "idx_labour_whatsapp_suppressions_scope" ON "public"."labour_whatsapp_suppressions" USING "btree" ("suppression_scope", "active");



CREATE UNIQUE INDEX "idx_labour_whatsapp_suppressions_trigger_message_id" ON "public"."labour_whatsapp_suppressions" USING "btree" ("trigger_message_id") WHERE ("trigger_message_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_labour_whatsapp_template_inventory_name_language" ON "public"."labour_whatsapp_template_inventory" USING "btree" ("meta_template_name", "language");



CREATE INDEX "idx_labour_whatsapp_template_inventory_status" ON "public"."labour_whatsapp_template_inventory" USING "btree" ("meta_status", "enabled");



CREATE INDEX "idx_labour_worker_device_tokens_active" ON "public"."labour_worker_device_tokens" USING "btree" ("is_active");



CREATE INDEX "idx_labour_worker_device_tokens_worker_id" ON "public"."labour_worker_device_tokens" USING "btree" ("worker_id");



CREATE INDEX "idx_labour_worker_notifications_is_read" ON "public"."labour_worker_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_labour_worker_notifications_worker_id" ON "public"."labour_worker_notifications" USING "btree" ("worker_id");



CREATE INDEX "idx_labour_workers_status" ON "public"."labour_workers" USING "btree" ("status");



CREATE INDEX "worker_referral_category_eligibility_category_idx" ON "public"."worker_referral_category_eligibility" USING "btree" ("category_id");



CREATE INDEX "worker_referral_category_eligibility_profile_idx" ON "public"."worker_referral_category_eligibility" USING "btree" ("referral_profile_id");



CREATE INDEX "worker_referral_email_outbox_due_idx" ON "public"."worker_referral_email_outbox" USING "btree" ("status", "next_attempt_at", "created_at");



CREATE INDEX "worker_referral_email_outbox_processing_idx" ON "public"."worker_referral_email_outbox" USING "btree" ("status", "processing_started_at");



CREATE INDEX "worker_referral_ledger_reference_idx" ON "public"."worker_referral_ledger" USING "btree" ("reference");



CREATE INDEX "worker_referral_ledger_referral_idx" ON "public"."worker_referral_ledger" USING "btree" ("referral_id");



CREATE INDEX "worker_referral_ledger_worker_created_idx" ON "public"."worker_referral_ledger" USING "btree" ("worker_id", "created_at" DESC);



CREATE INDEX "worker_referral_payout_account_audit_payout_account_idx" ON "public"."worker_referral_payout_account_audit" USING "btree" ("payout_account_id");



CREATE INDEX "worker_referral_payout_account_audit_worker_idx" ON "public"."worker_referral_payout_account_audit" USING "btree" ("worker_id", "created_at" DESC);



CREATE INDEX "worker_referral_payout_accounts_updated_idx" ON "public"."worker_referral_payout_accounts" USING "btree" ("updated_at" DESC);



CREATE INDEX "worker_referral_payout_accounts_worker_idx" ON "public"."worker_referral_payout_accounts" USING "btree" ("worker_id");



CREATE INDEX "worker_referral_profiles_referral_code_idx" ON "public"."worker_referral_profiles" USING "btree" ("referral_code");



CREATE INDEX "worker_referral_profiles_worker_id_idx" ON "public"."worker_referral_profiles" USING "btree" ("worker_id");



CREATE UNIQUE INDEX "worker_referral_withdrawal_requests_one_open_idx" ON "public"."worker_referral_withdrawal_requests" USING "btree" ("worker_id") WHERE ("status" = ANY (ARRAY['requested'::"text", 'approved'::"text", 'processing'::"text"]));



CREATE INDEX "worker_referral_withdrawal_requests_payout_account_idx" ON "public"."worker_referral_withdrawal_requests" USING "btree" ("payout_account_id");



CREATE INDEX "worker_referral_withdrawal_requests_status_requested_idx" ON "public"."worker_referral_withdrawal_requests" USING "btree" ("status", "requested_at" DESC);



CREATE INDEX "worker_referral_withdrawal_requests_worker_requested_idx" ON "public"."worker_referral_withdrawal_requests" USING "btree" ("worker_id", "requested_at" DESC);



CREATE INDEX "worker_referral_withdrawal_requests_worker_status_idx" ON "public"."worker_referral_withdrawal_requests" USING "btree" ("worker_id", "status");



CREATE INDEX "worker_referrals_referral_status_idx" ON "public"."worker_referrals" USING "btree" ("referral_status");



CREATE INDEX "worker_referrals_referred_worker_idx" ON "public"."worker_referrals" USING "btree" ("referred_worker_id");



CREATE INDEX "worker_referrals_referrer_worker_idx" ON "public"."worker_referrals" USING "btree" ("referrer_worker_id");



CREATE INDEX "worker_referrals_reward_status_idx" ON "public"."worker_referrals" USING "btree" ("reward_status");



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_job_applications"
    ADD CONSTRAINT "labour_job_applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."labour_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_job_applications"
    ADD CONSTRAINT "labour_job_applications_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "public"."labour_job_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_job_applications"
    ADD CONSTRAINT "labour_job_applications_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_job_posts"
    ADD CONSTRAINT "labour_job_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."labour_categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."labour_job_posts"
    ADD CONSTRAINT "labour_job_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."labour_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_job_posts"
    ADD CONSTRAINT "labour_job_posts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."labour_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."labour_plans"
    ADD CONSTRAINT "labour_plans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."labour_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."labour_saved_jobs"
    ADD CONSTRAINT "labour_saved_jobs_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "public"."labour_job_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_saved_jobs"
    ADD CONSTRAINT "labour_saved_jobs_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_worker_device_tokens"
    ADD CONSTRAINT "labour_worker_device_tokens_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labour_worker_notifications"
    ADD CONSTRAINT "labour_worker_notifications_related_company_id_fkey" FOREIGN KEY ("related_company_id") REFERENCES "public"."labour_companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."labour_worker_notifications"
    ADD CONSTRAINT "labour_worker_notifications_related_job_post_id_fkey" FOREIGN KEY ("related_job_post_id") REFERENCES "public"."labour_job_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."labour_worker_notifications"
    ADD CONSTRAINT "labour_worker_notifications_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_referral_category_eligibility"
    ADD CONSTRAINT "worker_referral_category_eligibility_category_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."labour_categories"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_category_eligibility"
    ADD CONSTRAINT "worker_referral_category_eligibility_profile_fkey" FOREIGN KEY ("referral_profile_id") REFERENCES "public"."worker_referral_profiles"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_ledger"
    ADD CONSTRAINT "worker_referral_ledger_referral_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."worker_referrals"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_ledger"
    ADD CONSTRAINT "worker_referral_ledger_worker_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_payout_account_audit"
    ADD CONSTRAINT "worker_referral_payout_account_audit_payout_account_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "public"."worker_referral_payout_accounts"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_payout_account_audit"
    ADD CONSTRAINT "worker_referral_payout_account_audit_worker_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_payout_accounts"
    ADD CONSTRAINT "worker_referral_payout_accounts_worker_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_profiles"
    ADD CONSTRAINT "worker_referral_profiles_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_withdrawal_requests"
    ADD CONSTRAINT "worker_referral_withdrawal_requests_payout_account_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "public"."worker_referral_payout_accounts"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referral_withdrawal_requests"
    ADD CONSTRAINT "worker_referral_withdrawal_requests_worker_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_category_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."labour_categories"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_profile_fkey" FOREIGN KEY ("referral_profile_id") REFERENCES "public"."worker_referral_profiles"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_referred_worker_fkey" FOREIGN KEY ("referred_worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."worker_referrals"
    ADD CONSTRAINT "worker_referrals_referrer_worker_fkey" FOREIGN KEY ("referrer_worker_id") REFERENCES "public"."labour_workers"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE "public"."client_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_job_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_job_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_recharge_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_saved_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_website_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_consent_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_inbound_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_suppressions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_whatsapp_template_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_worker_device_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_worker_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labour_workers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_category_eligibility" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_email_outbox" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_payout_account_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_payout_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referral_withdrawal_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_referrals" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_email_outbox" TO "service_role";






REVOKE ALL ON FUNCTION "public"."create_worker_referral_withdrawal_request"("p_worker_id" "text", "p_amount" numeric, "p_payout_method" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_worker_referral_withdrawal_request"("p_worker_id" "text", "p_amount" numeric, "p_payout_method" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."credit_worker_referral_reward"("p_referral_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."credit_worker_referral_reward"("p_referral_id" "text") TO "service_role";






REVOKE ALL ON FUNCTION "public"."mark_worker_referral_withdrawal_paid"("p_request_id" "text", "p_payment_reference" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_worker_referral_withdrawal_paid"("p_request_id" "text", "p_payment_reference" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_worker_referral_withdrawal"("p_request_id" "text", "p_action" "text", "p_rejection_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_worker_referral_withdrawal"("p_request_id" "text", "p_action" "text", "p_rejection_reason" "text") TO "service_role";



GRANT ALL ON TABLE "public"."client_modules" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."labour_admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."labour_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."labour_categories" TO "service_role";



GRANT ALL ON TABLE "public"."labour_companies" TO "service_role";



GRANT ALL ON TABLE "public"."labour_job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."labour_job_posts" TO "service_role";



GRANT ALL ON TABLE "public"."labour_plans" TO "service_role";



GRANT ALL ON TABLE "public"."labour_recharge_requests" TO "service_role";



GRANT ALL ON TABLE "public"."labour_saved_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."labour_wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."labour_website_content" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_consent_events" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_consents" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_inbound_events" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_settings" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_suppressions" TO "service_role";



GRANT ALL ON TABLE "public"."labour_whatsapp_template_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."labour_worker_device_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."labour_worker_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."labour_workers" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_category_eligibility" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_payout_account_audit" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_payout_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_settings" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referral_withdrawal_requests" TO "service_role";



GRANT ALL ON TABLE "public"."worker_referrals" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








commit;