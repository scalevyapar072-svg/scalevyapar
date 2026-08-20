-- Preview-only Phase 10K.8 migration.
-- Keep one payout row per worker while allowing both bank and UPI details
-- to coexist, with preferred_method representing the current/default choice.

alter table public.worker_referral_payout_accounts
  add column if not exists preferred_method text;

update public.worker_referral_payout_accounts
set preferred_method = method
where preferred_method is null;

alter table public.worker_referral_payout_accounts
  drop constraint if exists worker_referral_payout_accounts_method_fields_check,
  drop constraint if exists worker_referral_payout_accounts_preferred_method_check,
  drop constraint if exists worker_referral_payout_accounts_method_alignment_check;

alter table public.worker_referral_payout_accounts
  add constraint worker_referral_payout_accounts_preferred_method_check
  check (
    preferred_method is null
    or preferred_method in ('bank', 'upi')
  );

alter table public.worker_referral_payout_accounts
  add constraint worker_referral_payout_accounts_method_alignment_check
  check (
    preferred_method is null
    or method = preferred_method
  );

alter table public.worker_referral_payout_accounts
  add constraint worker_referral_payout_accounts_method_fields_check
  check (
    (
      (
        account_holder_name = ''
        and account_number_ciphertext = ''
        and account_number_last4 = ''
        and ifsc = ''
      )
      or
      (
        account_holder_name <> ''
        and account_number_ciphertext <> ''
        and account_number_last4 ~ '^[0-9]{4}$'
        and ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
      )
    )
    and
    (
      (upi_id_ciphertext = '' and upi_id_masked = '')
      or
      (upi_id_ciphertext <> '' and upi_id_masked <> '')
    )
    and
    (
      (
        account_holder_name <> ''
        and account_number_ciphertext <> ''
        and account_number_last4 ~ '^[0-9]{4}$'
        and ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
      )
      or
      (upi_id_ciphertext <> '' and upi_id_masked <> '')
    )
    and
    (
      preferred_method is null
      or
      (
        preferred_method = 'bank'
        and account_holder_name <> ''
        and account_number_ciphertext <> ''
        and account_number_last4 ~ '^[0-9]{4}$'
        and ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
      )
      or
      (
        preferred_method = 'upi'
        and upi_id_ciphertext <> ''
        and upi_id_masked <> ''
      )
    )
  );

comment on table public.worker_referral_payout_accounts is
  'Rozgar Refer & Earn: one secure payout row per worker, allowing saved bank and UPI methods for future withdrawals.';
