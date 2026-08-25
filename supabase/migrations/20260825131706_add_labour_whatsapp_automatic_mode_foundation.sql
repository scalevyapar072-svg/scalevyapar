-- Phase 16D.5B automatic mode schema and entitlement foundation only.
-- Migration classification: ONE-TIME MIGRATION.
-- This migration adds backend-only automatic-mode storage and audit ledgers.
-- It does not enable sending, pricing UI, checkout, billing charges, job-post
-- triggers, worker lifecycle triggers, webhooks, or Meta activation.
--
-- Security model:
-- - Existing manual bulk messaging behavior remains unchanged and out of scope.
-- - RLS is enabled on every new public table.
-- - No public policies are created.
-- - Privileges are revoked from anon, authenticated, and PUBLIC.
-- - service_role access is granted explicitly for controlled server-side use.
-- - No default ACLs are modified.
-- - No secrets, tokens, or raw provider payloads are stored.
-- - Future application code must resolve missing, invalid, or unreadable
--   automatic mode state to OFF.
-- - pause_all_sending remains the primary fail-safe and is not changed here.

insert into public.labour_whatsapp_settings (
  settings_key,
  settings_value,
  description
) values (
  'automatic_messaging_mode',
  '{"mode":"off"}'::jsonb,
  'Canonical automatic WhatsApp mode for system-triggered messages only. Missing, invalid, or unreadable values must resolve to OFF. Manual bulk messaging is unaffected.'
)
on conflict (settings_key) do nothing;

insert into public.labour_whatsapp_settings (
  settings_key,
  settings_value,
  description
) values (
  'automatic_addon_pricing',
  '{"currency":"INR","amountMinor":0,"active":false}'::jsonb,
  'Backend-editable WhatsApp Automation add-on price foundation only. Default is inactive and zero-priced until a later approved pricing phase.'
)
on conflict (settings_key) do nothing;

create table public.labour_whatsapp_company_automation_entitlements (
  id uuid primary key default gen_random_uuid(),
  company_id text not null
    constraint labour_whatsapp_company_automation_entitlements_company_id_nonempty_check
      check (btrim(company_id) <> ''),
  entitlement_status text not null
    constraint labour_whatsapp_company_automation_entitlements_status_check
      check (entitlement_status in ('pending', 'active', 'inactive', 'expired', 'revoked')),
  entitlement_mode text not null
    constraint labour_whatsapp_company_automation_entitlements_mode_check
      check (entitlement_mode in ('paid')),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  payment_order_reference text
    constraint labour_whatsapp_company_automation_entitlements_payment_order_reference_nonempty_check
      check (payment_order_reference is null or btrim(payment_order_reference) <> ''),
  payment_reference text
    constraint labour_whatsapp_company_automation_entitlements_payment_reference_nonempty_check
      check (payment_reference is null or btrim(payment_reference) <> ''),
  source text not null
    constraint labour_whatsapp_company_automation_entitlements_source_nonempty_check
      check (btrim(source) <> ''),
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_company_automation_entitlements_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_company_automation_entitlements_valid_window_check
    check (valid_until >= valid_from)
);

create index idx_labour_whatsapp_company_automation_entitlements_company_status
on public.labour_whatsapp_company_automation_entitlements (
  company_id,
  entitlement_status,
  valid_until desc
);

create unique index idx_labour_whatsapp_company_automation_entitlements_payment_order_reference
on public.labour_whatsapp_company_automation_entitlements (payment_order_reference)
where payment_order_reference is not null;

create unique index idx_labour_whatsapp_company_automation_entitlements_payment_reference
on public.labour_whatsapp_company_automation_entitlements (payment_reference)
where payment_reference is not null;

alter table public.labour_whatsapp_company_automation_entitlements enable row level security;

revoke all on table public.labour_whatsapp_company_automation_entitlements
from anon, authenticated, public;

grant select, insert, update, delete, references
on table public.labour_whatsapp_company_automation_entitlements
to service_role;

comment on table public.labour_whatsapp_company_automation_entitlements is
  'Per-company WhatsApp Automation entitlement foundation for future PAID automatic job-post messaging. No company is auto-entitled by this migration. Browser clients receive no direct access; controlled server-side service-role/Admin API access only.';

create table public.labour_whatsapp_automatic_executions (
  id uuid primary key default gen_random_uuid(),
  automation_event_type text not null
    constraint labour_whatsapp_automatic_executions_event_type_check
      check (automation_event_type in ('job_post_matching', 'worker_recharge_required', 'worker_kyc_rejected')),
  company_id text not null
    constraint labour_whatsapp_automatic_executions_company_id_nonempty_check
      check (btrim(company_id) <> ''),
  job_post_id text
    constraint labour_whatsapp_automatic_executions_job_post_id_nonempty_check
      check (job_post_id is null or btrim(job_post_id) <> ''),
  mode_snapshot text not null
    constraint labour_whatsapp_automatic_executions_mode_snapshot_check
      check (mode_snapshot in ('off', 'free', 'paid')),
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
  updated_at timestamptz not null default now()
);

create index idx_labour_whatsapp_automatic_executions_company_event_created
on public.labour_whatsapp_automatic_executions (
  company_id,
  automation_event_type,
  created_at desc
);

create index idx_labour_whatsapp_automatic_executions_job_post_event
on public.labour_whatsapp_automatic_executions (
  job_post_id,
  automation_event_type
);

alter table public.labour_whatsapp_automatic_executions enable row level security;

revoke all on table public.labour_whatsapp_automatic_executions
from anon, authenticated, public;

grant select, insert, update, delete, references
on table public.labour_whatsapp_automatic_executions
to service_role;

comment on table public.labour_whatsapp_automatic_executions is
  'Automatic WhatsApp execution ledger for future system-triggered flows only. Idempotency is keyed by idempotency_key. This migration does not activate any job-post or worker lifecycle trigger.';

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
  'Per-recipient automatic delivery-attempt ledger for future automatic WhatsApp flows only. No secrets, raw provider payloads, or message sending side effects are created by this migration.';

-- Rollback plan (do not execute automatically).
-- WARNING:
-- - Rolling back after real usage begins drops automatic entitlement and audit data.
-- - Export data or take a verified backup before any real rollback.
-- - Rollback must not touch existing Worker, Company, Job, consent, suppression,
--   template, or pause_all_sending records.
--
-- Safe reverse order for manual rollback review only:
-- drop table public.labour_whatsapp_automatic_delivery_attempts;
-- drop table public.labour_whatsapp_automatic_executions;
-- drop table public.labour_whatsapp_company_automation_entitlements;
-- delete from public.labour_whatsapp_settings where settings_key in ('automatic_addon_pricing', 'automatic_messaging_mode');
