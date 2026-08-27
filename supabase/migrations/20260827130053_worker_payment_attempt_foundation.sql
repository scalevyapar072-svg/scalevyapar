-- Phase 16D.8K.2 source-only Worker payment-attempt schema foundation.
-- Migration classification: ONE-TIME MIGRATION.
-- This repository-only migration defines future server-side Worker payment-attempt
-- persistence for verified provider-backed wallet credits.
--
-- Safety model:
-- - This migration must not be applied from Preview, QA, or any shared database
--   during this phase.
-- - No existing wallet, Worker, lifecycle, visibility, or registration-fee
--   behavior is changed here.
-- - No provider signatures, secrets, or raw provider payloads are stored.
-- - RLS is enabled immediately.
-- - No anon/authenticated policies are created.
-- - PUBLIC, anon, and authenticated table access is revoked.
-- - Future controlled server-only integration may use service_role access only.

create table public.labour_worker_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null,
  provider text not null
    constraint labour_worker_payment_attempts_provider_check
      check (provider in ('razorpay')),
  provider_order_id text not null
    constraint labour_worker_payment_attempts_provider_order_id_nonempty_check
      check (btrim(provider_order_id) <> ''),
  provider_payment_id text
    constraint labour_worker_payment_attempts_provider_payment_id_nonempty_check
      check (provider_payment_id is null or btrim(provider_payment_id) <> ''),
  provider_currency text not null
    constraint labour_worker_payment_attempts_provider_currency_check
      check (provider_currency = 'INR'),
  provider_amount_paise bigint not null
    constraint labour_worker_payment_attempts_provider_amount_paise_check
      check (provider_amount_paise > 0),
  provider_status text not null
    constraint labour_worker_payment_attempts_provider_status_nonempty_check
      check (btrim(provider_status) <> ''),
  idempotency_key text not null
    constraint labour_worker_payment_attempts_idempotency_key_nonempty_check
      check (btrim(idempotency_key) <> ''),
  application_status text not null default 'created'
    constraint labour_worker_payment_attempts_application_status_check
      check (application_status in ('created', 'verified', 'applied', 'failed')),
  wallet_transaction_id text
    constraint labour_worker_payment_attempts_wallet_transaction_id_nonempty_check
      check (wallet_transaction_id is null or btrim(wallet_transaction_id) <> ''),
  failure_category text
    constraint labour_worker_payment_attempts_failure_category_sanitized_check
      check (
        failure_category is null
        or failure_category ~ '^[a-z0-9_]+$'
      ),
  verified_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_worker_payment_attempts_worker_id_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint labour_worker_payment_attempts_wallet_transaction_id_fkey
    foreign key (wallet_transaction_id)
    references public.labour_wallet_transactions(id)
    on update restrict
    on delete restrict,
  constraint labour_worker_payment_attempts_verified_requires_payment_identity_check
    check (
      application_status not in ('verified', 'applied')
      or (
        provider_payment_id is not null
        and verified_at is not null
      )
    ),
  constraint labour_worker_payment_attempts_applied_requires_complete_identity_check
    check (
      application_status <> 'applied'
      or (
        provider_payment_id is not null
        and wallet_transaction_id is not null
        and verified_at is not null
        and applied_at is not null
      )
    ),
  constraint labour_worker_payment_attempts_non_applied_has_no_wallet_transaction_check
    check (
      application_status = 'applied'
      or wallet_transaction_id is null
    ),
  constraint labour_worker_payment_attempts_non_applied_has_no_applied_at_check
    check (
      application_status = 'applied'
      or applied_at is null
    ),
  constraint labour_worker_payment_attempts_failed_requires_failure_category_check
    check (
      application_status <> 'failed'
      or failure_category is not null
    ),
  constraint labour_worker_payment_attempts_applied_after_verified_check
    check (
      applied_at is null
      or verified_at is null
      or applied_at >= verified_at
    )
);

create unique index idx_labour_worker_payment_attempts_idempotency_key
on public.labour_worker_payment_attempts (idempotency_key);

create unique index idx_labour_worker_payment_attempts_provider_payment_id
on public.labour_worker_payment_attempts (provider, provider_payment_id)
where provider_payment_id is not null;

create unique index idx_labour_worker_payment_attempts_applied_provider_order
on public.labour_worker_payment_attempts (provider, provider_order_id)
where application_status = 'applied';

create unique index idx_labour_worker_payment_attempts_wallet_transaction_id
on public.labour_worker_payment_attempts (wallet_transaction_id)
where wallet_transaction_id is not null;

create index idx_labour_worker_payment_attempts_worker_created
on public.labour_worker_payment_attempts (worker_id, created_at desc);

create index idx_labour_worker_payment_attempts_order_created
on public.labour_worker_payment_attempts (provider, provider_order_id, created_at desc);

create index idx_labour_worker_payment_attempts_application_status_created
on public.labour_worker_payment_attempts (application_status, created_at desc);

create or replace function public.labour_worker_payment_attempts_prevent_identity_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.application_status in ('verified', 'applied') then
    if new.worker_id is distinct from old.worker_id
      or new.provider is distinct from old.provider
      or new.provider_order_id is distinct from old.provider_order_id
      or new.provider_payment_id is distinct from old.provider_payment_id
      or new.provider_currency is distinct from old.provider_currency
      or new.provider_amount_paise is distinct from old.provider_amount_paise
      or new.idempotency_key is distinct from old.idempotency_key then
      raise exception 'Verified or applied worker payment attempts cannot change provider identity fields.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.labour_worker_payment_attempts_prevent_identity_mutation()
from public, anon, authenticated;

create trigger labour_worker_payment_attempts_identity_immutable_trigger
before update on public.labour_worker_payment_attempts
for each row
execute function public.labour_worker_payment_attempts_prevent_identity_mutation();

alter table public.labour_worker_payment_attempts enable row level security;

revoke all on table public.labour_worker_payment_attempts
from public, anon, authenticated;

grant select, insert, update, references
on table public.labour_worker_payment_attempts
to service_role;

comment on table public.labour_worker_payment_attempts is
  'Future server-only Worker provider payment-attempt ledger. Stores sanitized provider identity, application status, and immutable idempotency references only. Does not credit wallets, settle fees, or update Worker lifecycle state in this phase.';

comment on column public.labour_worker_payment_attempts.failure_category is
  'Sanitized safe failure category only. No signatures, secrets, personal data, or raw provider payloads are stored.';

comment on function public.labour_worker_payment_attempts_prevent_identity_mutation() is
  'Trigger helper for immutable provider identity fields after verification/application. Not an RPC and not callable by browser roles.';

-- Rollback plan (do not execute automatically).
-- WARNING:
-- - Rolling back after real usage begins drops Worker payment-attempt audit rows.
-- - Export data or take a verified backup before any real rollback.
-- - Rollback must not touch existing Worker, wallet, lifecycle, payment,
--   registration-fee, or visibility records.
--
-- Safe reverse order for manual rollback review only:
-- drop trigger labour_worker_payment_attempts_identity_immutable_trigger on public.labour_worker_payment_attempts;
-- drop function public.labour_worker_payment_attempts_prevent_identity_mutation();
-- drop table public.labour_worker_payment_attempts;
