-- Rozgar Refer & Earn Phase 10: secure payout destination setup.
-- Additive only: no changes to worker profiles, wallet, KYC, referral attribution,
-- reward ledger, or existing audit constraints.

create table if not exists public.worker_referral_payout_accounts (
  id text primary key,
  worker_id text not null,
  method text not null,
  account_holder_name text not null default '',
  account_number_ciphertext text not null default '',
  account_number_last4 text not null default '',
  ifsc text not null default '',
  upi_id_ciphertext text not null default '',
  upi_id_masked text not null default '',
  encryption_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referral_payout_accounts_worker_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_payout_accounts_worker_key unique (worker_id),
  constraint worker_referral_payout_accounts_method_check
    check (method in ('bank', 'upi')),
  constraint worker_referral_payout_accounts_bank_last4_check
    check (
      account_number_last4 = ''
      or account_number_last4 ~ '^[0-9]{4}$'
    ),
  constraint worker_referral_payout_accounts_encryption_version_check
    check (encryption_version in ('v1')),
  constraint worker_referral_payout_accounts_method_fields_check
    check (
      (
        method = 'bank'
        and account_holder_name <> ''
        and account_number_ciphertext <> ''
        and account_number_last4 ~ '^[0-9]{4}$'
        and ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
        and upi_id_ciphertext = ''
        and upi_id_masked = ''
      )
      or
      (
        method = 'upi'
        and account_holder_name = ''
        and account_number_ciphertext = ''
        and account_number_last4 = ''
        and ifsc = ''
        and upi_id_ciphertext <> ''
        and upi_id_masked <> ''
      )
    )
);

create table if not exists public.worker_referral_payout_account_audit (
  id text primary key,
  payout_account_id text not null,
  worker_id text not null,
  action text not null,
  method text not null,
  masked_destination text not null,
  actor text not null default 'worker-app',
  created_at timestamptz not null default now(),
  constraint worker_referral_payout_account_audit_payout_account_fkey
    foreign key (payout_account_id)
    references public.worker_referral_payout_accounts(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_payout_account_audit_worker_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_payout_account_audit_action_check
    check (action in ('create', 'update', 'replace')),
  constraint worker_referral_payout_account_audit_method_check
    check (method in ('bank', 'upi'))
);

create index if not exists worker_referral_payout_accounts_worker_idx
  on public.worker_referral_payout_accounts(worker_id);

create index if not exists worker_referral_payout_accounts_updated_idx
  on public.worker_referral_payout_accounts(updated_at desc);

create index if not exists worker_referral_payout_account_audit_worker_idx
  on public.worker_referral_payout_account_audit(worker_id, created_at desc);

create index if not exists worker_referral_payout_account_audit_payout_account_idx
  on public.worker_referral_payout_account_audit(payout_account_id);

alter table public.worker_referral_payout_accounts enable row level security;
alter table public.worker_referral_payout_account_audit enable row level security;

comment on table public.worker_referral_payout_accounts is
  'Rozgar Refer & Earn: one secure payout destination per worker for future referral withdrawals.';

comment on table public.worker_referral_payout_account_audit is
  'Rozgar Refer & Earn: payout destination change audit with masked values only.';
