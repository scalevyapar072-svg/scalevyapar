-- Phase 16D.5B automatic WhatsApp scope correction foundation only.
-- Migration classification: ONE-TIME MIGRATION.
-- This unapplied repository migration adds backend-only scheduling, execution-audit,
-- and per-recipient deduplication ledgers for future automatic WhatsApp flows.
-- It does not enable sending, pricing, billing, checkout, company charging,
-- entitlements, webhooks, or Meta activation.
--
-- Approved future automatic categories only:
-- - company_matching_digest
-- - worker_matching_digest
-- - worker_payment_or_plan_reminder
-- - worker_kyc_rejected
--
-- Security model:
-- - Existing manual bulk messaging behavior remains unchanged and out of scope.
-- - RLS is enabled on every new public table.
-- - No public policies are created.
-- - Privileges are revoked from anon, authenticated, and PUBLIC.
-- - service_role access is granted explicitly for controlled server-side use.
-- - No default ACLs are modified.
-- - No secrets, tokens, or raw provider payloads are stored.
-- - Future application code must enforce matching-alert consent for digest messages.
-- - Future application code must enforce service-message consent for recharge/plan
--   and KYC-rejected notifications.
-- - Future application code must enforce suppression, limits, quiet hours,
--   immediate pre-send revalidation, universal sender gating, and
--   pause_all_sending before every send attempt.
-- - pause_all_sending remains the primary fail-safe and is not changed here.

create table public.labour_whatsapp_automatic_executions (
  id uuid primary key default gen_random_uuid(),
  automation_event_type text not null
    constraint labour_whatsapp_automatic_executions_event_type_check
      check (
        automation_event_type in (
          'company_matching_digest',
          'worker_matching_digest',
          'worker_payment_or_plan_reminder',
          'worker_kyc_rejected'
        )
      ),
  recipient_type text not null
    constraint labour_whatsapp_automatic_executions_recipient_type_check
      check (recipient_type in ('worker', 'company')),
  recipient_id text not null
    constraint labour_whatsapp_automatic_executions_recipient_id_nonempty_check
      check (btrim(recipient_id) <> ''),
  cycle_starts_at timestamptz not null,
  cycle_ends_at timestamptz not null,
  execution_status text not null
    constraint labour_whatsapp_automatic_executions_status_check
      check (execution_status in ('queued', 'blocked', 'completed', 'failed')),
  eligible_count integer not null default 0
    constraint labour_whatsapp_automatic_executions_eligible_count_check
      check (eligible_count >= 0),
  excluded_count integer not null default 0
    constraint labour_whatsapp_automatic_executions_excluded_count_check
      check (excluded_count >= 0),
  selected_count integer not null default 0
    constraint labour_whatsapp_automatic_executions_selected_count_check
      check (selected_count >= 0),
  sent_count integer not null default 0
    constraint labour_whatsapp_automatic_executions_sent_count_check
      check (sent_count >= 0),
  failed_count integer not null default 0
    constraint labour_whatsapp_automatic_executions_failed_count_check
      check (failed_count >= 0),
  idempotency_key text not null unique
    constraint labour_whatsapp_automatic_executions_idempotency_key_nonempty_check
      check (btrim(idempotency_key) <> ''),
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_automatic_executions_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_automatic_executions_cycle_window_check
    check (cycle_ends_at = cycle_starts_at + interval '72 hours'),
  constraint labour_whatsapp_automatic_executions_event_recipient_compatibility_check
    check (
      (automation_event_type = 'company_matching_digest' and recipient_type = 'company')
      or
      (automation_event_type = 'worker_matching_digest' and recipient_type = 'worker')
      or
      (automation_event_type = 'worker_payment_or_plan_reminder' and recipient_type = 'worker')
      or
      (automation_event_type = 'worker_kyc_rejected' and recipient_type = 'worker')
    )
);

create unique index idx_labour_whatsapp_automatic_executions_recipient_cycle
on public.labour_whatsapp_automatic_executions (
  automation_event_type,
  recipient_type,
  recipient_id,
  cycle_starts_at
);

create index idx_labour_whatsapp_automatic_executions_recipient_event_created
on public.labour_whatsapp_automatic_executions (
  recipient_type,
  recipient_id,
  automation_event_type,
  created_at desc
);

alter table public.labour_whatsapp_automatic_executions enable row level security;

revoke all on table public.labour_whatsapp_automatic_executions
from anon, authenticated, public;

grant select, insert, update, delete, references
on table public.labour_whatsapp_automatic_executions
to service_role;

comment on table public.labour_whatsapp_automatic_executions is
  'Automatic WhatsApp execution ledger for approved future digest and worker lifecycle categories only. Each row represents one recipient-level 72-hour cycle window. This migration does not activate sending, pricing, billing, checkout, or webhooks.';

create table public.labour_whatsapp_automatic_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null
    references public.labour_whatsapp_automatic_executions (id)
      on delete cascade,
  recipient_type text not null
    constraint labour_whatsapp_automatic_delivery_attempts_recipient_type_check
      check (recipient_type in ('worker', 'company')),
  recipient_id text not null
    constraint labour_whatsapp_automatic_delivery_attempts_recipient_id_nonempty_check
      check (btrim(recipient_id) <> ''),
  template_name text not null
    constraint labour_whatsapp_automatic_delivery_attempts_template_name_nonempty_check
      check (btrim(template_name) <> ''),
  template_language text not null
    constraint labour_whatsapp_automatic_delivery_attempts_template_language_nonempty_check
      check (btrim(template_language) <> ''),
  eligibility_outcome text not null
    constraint labour_whatsapp_automatic_delivery_attempts_eligibility_outcome_check
      check (eligibility_outcome in ('eligible', 'ineligible', 'revalidated_blocked')),
  attempt_status text not null
    constraint labour_whatsapp_automatic_delivery_attempts_status_check
      check (attempt_status in ('blocked', 'skipped', 'sent', 'failed')),
  reason_code text
    constraint labour_whatsapp_automatic_delivery_attempts_reason_code_nonempty_check
      check (reason_code is null or btrim(reason_code) <> ''),
  provider_message_id text
    constraint labour_whatsapp_automatic_delivery_attempts_provider_message_id_nonempty_check
      check (provider_message_id is null or btrim(provider_message_id) <> ''),
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_automatic_delivery_attempts_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_labour_whatsapp_automatic_delivery_attempts_execution_recipient
on public.labour_whatsapp_automatic_delivery_attempts (
  execution_id,
  recipient_type,
  recipient_id
);

create unique index idx_labour_whatsapp_automatic_delivery_attempts_provider_message_id
on public.labour_whatsapp_automatic_delivery_attempts (provider_message_id)
where provider_message_id is not null;

create index idx_labour_whatsapp_automatic_delivery_attempts_execution_status
on public.labour_whatsapp_automatic_delivery_attempts (
  execution_id,
  attempt_status,
  created_at desc
);

alter table public.labour_whatsapp_automatic_delivery_attempts enable row level security;

revoke all on table public.labour_whatsapp_automatic_delivery_attempts
from anon, authenticated, public;

grant select, insert, update, delete, references
on table public.labour_whatsapp_automatic_delivery_attempts
to service_role;

comment on table public.labour_whatsapp_automatic_delivery_attempts is
  'Per-recipient automatic delivery-attempt ledger for approved future digest and worker lifecycle categories only. Stores template identity, recipient audit data, safe failure reasons, and deduplication records. No secrets, raw provider payloads, or sending side effects are created by this migration.';

-- Rollback plan (do not execute automatically).
-- WARNING:
-- - Rolling back after real usage begins drops automatic execution and delivery
--   audit data.
-- - Export data or take a verified backup before any real rollback.
-- - Rollback must not touch existing Worker, Company, Job, consent, suppression,
--   template, or pause_all_sending records.
--
-- Safe reverse order for manual rollback review only:
-- drop table public.labour_whatsapp_automatic_delivery_attempts;
-- drop table public.labour_whatsapp_automatic_executions;
