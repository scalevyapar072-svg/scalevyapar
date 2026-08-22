-- Phase 16C.3A review-only correction.
-- Migration classification: ONE-TIME MIGRATION.
-- This migration is intended to run once through Supabase migrations after
-- formal approval. It must not be applied from QA unless database-target
-- separation is separately proven.
--
-- Security model:
-- - RLS is enabled on every new table in public.
-- - No anon/authenticated policies are created.
-- - No grants are created for browser roles.
-- - Intended access is via controlled server-side Admin APIs using the
--   Supabase service role only.
-- - The service role bypasses RLS and must never be exposed to browser or
--   mobile clients.
-- - These tables do not authorize sending, do not activate webhook
--   persistence, and do not activate automatic or bulk messaging.
-- - Future sender code must treat a missing or invalid pause_all_sending
--   setting as paused.

create table public.labour_whatsapp_consents (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null
    constraint labour_whatsapp_consents_recipient_type_check
      check (recipient_type in ('worker', 'company', 'external_test')),
  recipient_id text
    constraint labour_whatsapp_consents_recipient_id_nonempty_check
      check (recipient_id is null or btrim(recipient_id) <> ''),
  normalized_mobile text not null
    constraint labour_whatsapp_consents_mobile_nonempty_check
      check (btrim(normalized_mobile) <> '')
    constraint labour_whatsapp_consents_mobile_e164_check
      check (normalized_mobile ~ '^\+[1-9][0-9]{7,14}$'),
  consent_type text not null
    constraint labour_whatsapp_consents_type_check
      check (consent_type in ('service_allowed', 'matching_alerts_allowed', 'marketing_allowed')),
  allowed boolean not null default false,
  source text not null
    constraint labour_whatsapp_consents_source_nonempty_check
      check (btrim(source) <> ''),
  consent_text_version text not null default '',
  consented_at timestamptz,
  opted_out_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_consents_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_consents_allowed_requires_consented_at_check
    check (not allowed or consented_at is not null),
  constraint labour_whatsapp_consents_active_allowed_not_opted_out_check
    check (not (allowed and opted_out_at is not null))
);

create unique index idx_labour_whatsapp_consents_unique_recipient_consent
on public.labour_whatsapp_consents (
  recipient_type,
  coalesce(recipient_id, ''),
  normalized_mobile,
  consent_type
);

create index idx_labour_whatsapp_consents_mobile
on public.labour_whatsapp_consents (normalized_mobile);

create index idx_labour_whatsapp_consents_type_allowed
on public.labour_whatsapp_consents (consent_type, allowed);

alter table public.labour_whatsapp_consents enable row level security;

comment on table public.labour_whatsapp_consents is
  'Current effective WhatsApp consent state only. This table must not replace or erase immutable consent-event history. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

comment on column public.labour_whatsapp_consents.metadata is
  'Object-shaped metadata only. Detailed consent-flow validation remains the responsibility of the application layer.';

create table public.labour_whatsapp_consent_events (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null
    constraint labour_whatsapp_consent_events_recipient_type_check
      check (recipient_type in ('worker', 'company', 'unknown')),
  recipient_id text
    constraint labour_whatsapp_consent_events_recipient_id_nonempty_check
      check (recipient_id is null or btrim(recipient_id) <> ''),
  normalized_mobile text not null
    constraint labour_whatsapp_consent_events_mobile_nonempty_check
      check (btrim(normalized_mobile) <> '')
    constraint labour_whatsapp_consent_events_mobile_e164_check
      check (normalized_mobile ~ '^\+[1-9][0-9]{7,14}$'),
  consent_type text not null
    constraint labour_whatsapp_consent_events_type_check
      check (consent_type in ('service_allowed', 'matching_alerts_allowed', 'marketing_allowed')),
  previous_allowed boolean,
  new_allowed boolean not null,
  event_type text not null
    constraint labour_whatsapp_consent_events_event_type_check
      check (event_type in ('granted', 'denied', 'opted_out', 'restoration_requested', 'restored', 'admin_correction')),
  source text not null
    constraint labour_whatsapp_consent_events_source_nonempty_check
      check (btrim(source) <> ''),
  consent_text_version text not null default '',
  event_message_id text
    constraint labour_whatsapp_consent_events_event_message_id_nonempty_check
      check (event_message_id is null or btrim(event_message_id) <> ''),
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_consent_events_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_labour_whatsapp_consent_events_mobile_type_occurred
on public.labour_whatsapp_consent_events (normalized_mobile, consent_type, occurred_at desc);

create index idx_labour_whatsapp_consent_events_recipient_occurred
on public.labour_whatsapp_consent_events (recipient_type, recipient_id, occurred_at desc);

create unique index idx_labour_whatsapp_consent_events_message_dedupe
on public.labour_whatsapp_consent_events (
  event_message_id,
  normalized_mobile,
  consent_type,
  event_type
)
where event_message_id is not null;

alter table public.labour_whatsapp_consent_events enable row level security;

comment on table public.labour_whatsapp_consent_events is
  'Append-oriented WhatsApp consent audit history. No trigger, UPDATE, or DELETE workflow is assumed for application correctness. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

comment on column public.labour_whatsapp_consent_events.event_message_id is
  'Optional provider or inbound message identifier used only for deduplication support when a message-backed consent event exists.';

create table public.labour_whatsapp_suppressions (
  id uuid primary key default gen_random_uuid(),
  normalized_mobile text not null
    constraint labour_whatsapp_suppressions_mobile_nonempty_check
      check (btrim(normalized_mobile) <> '')
    constraint labour_whatsapp_suppressions_mobile_e164_check
      check (normalized_mobile ~ '^\+[1-9][0-9]{7,14}$'),
  suppression_scope text not null default 'all_whatsapp'
    constraint labour_whatsapp_suppressions_scope_nonempty_check
      check (btrim(suppression_scope) <> ''),
  trigger_source text not null
    constraint labour_whatsapp_suppressions_trigger_source_nonempty_check
      check (btrim(trigger_source) <> ''),
  trigger_command text not null
    constraint labour_whatsapp_suppressions_trigger_command_nonempty_check
      check (btrim(trigger_command) <> ''),
  trigger_message_id text
    constraint labour_whatsapp_suppressions_trigger_message_id_nonempty_check
      check (trigger_message_id is null or btrim(trigger_message_id) <> ''),
  previous_consent_snapshot jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_suppressions_snapshot_object_check
      check (jsonb_typeof(previous_consent_snapshot) = 'object'),
  restoration_requested_at timestamptz,
  restoration_message_id text
    constraint labour_whatsapp_suppressions_restoration_message_id_nonempty_check
      check (restoration_message_id is null or btrim(restoration_message_id) <> ''),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_suppressions_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_labour_whatsapp_suppressions_mobile_active
on public.labour_whatsapp_suppressions (normalized_mobile)
where active = true;

create index idx_labour_whatsapp_suppressions_scope
on public.labour_whatsapp_suppressions (suppression_scope, active);

create unique index idx_labour_whatsapp_suppressions_trigger_message_id
on public.labour_whatsapp_suppressions (trigger_message_id)
where trigger_message_id is not null;

create unique index idx_labour_whatsapp_suppressions_restoration_message_id
on public.labour_whatsapp_suppressions (restoration_message_id)
where restoration_message_id is not null;

alter table public.labour_whatsapp_suppressions enable row level security;

comment on table public.labour_whatsapp_suppressions is
  'Independent WhatsApp suppression state. A general STOP can suppress all categories without mutating historical consent events. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

create table public.labour_whatsapp_inbound_events (
  id uuid primary key default gen_random_uuid(),
  message_id text not null unique
    constraint labour_whatsapp_inbound_events_message_id_nonempty_check
      check (btrim(message_id) <> ''),
  normalized_mobile text
    constraint labour_whatsapp_inbound_events_mobile_nonempty_check
      check (normalized_mobile is null or btrim(normalized_mobile) <> '')
    constraint labour_whatsapp_inbound_events_mobile_e164_check
      check (normalized_mobile is null or normalized_mobile ~ '^\+[1-9][0-9]{7,14}$'),
  matched_recipient_type text
    constraint labour_whatsapp_inbound_events_recipient_type_check
      check (matched_recipient_type in ('worker', 'company', 'external_test')),
  matched_recipient_id text
    constraint labour_whatsapp_inbound_events_recipient_id_nonempty_check
      check (matched_recipient_id is null or btrim(matched_recipient_id) <> ''),
  event_kind text not null
    constraint labour_whatsapp_inbound_events_kind_check
      check (event_kind in ('opt_out_all', 'restore_request', 'message', 'unknown')),
  raw_text text not null default '',
  normalized_text text not null default '',
  command_key text
    constraint labour_whatsapp_inbound_events_command_key_nonempty_check
      check (command_key is null or btrim(command_key) <> ''),
  suppression_applied boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_inbound_events_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_labour_whatsapp_inbound_events_mobile
on public.labour_whatsapp_inbound_events (normalized_mobile);

create index idx_labour_whatsapp_inbound_events_kind
on public.labour_whatsapp_inbound_events (event_kind, created_at desc);

alter table public.labour_whatsapp_inbound_events enable row level security;

comment on table public.labour_whatsapp_inbound_events is
  'Inbound WhatsApp audit records only. This migration does not activate webhook persistence or outbound messaging. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

create table public.labour_whatsapp_template_inventory (
  id uuid primary key default gen_random_uuid(),
  meta_template_name text not null
    constraint labour_whatsapp_template_inventory_name_nonempty_check
      check (btrim(meta_template_name) <> ''),
  language text not null
    constraint labour_whatsapp_template_inventory_language_nonempty_check
      check (btrim(language) <> ''),
  meta_category text not null
    constraint labour_whatsapp_template_inventory_category_nonempty_check
      check (btrim(meta_category) <> ''),
  meta_status text not null
    constraint labour_whatsapp_template_inventory_status_nonempty_check
      check (btrim(meta_status) <> ''),
  intended_recipient_type text
    constraint labour_whatsapp_template_inventory_recipient_type_check
      check (intended_recipient_type in ('worker', 'company', 'both', 'external_test')),
  intended_business_event text,
  header_type text not null
    constraint labour_whatsapp_template_inventory_header_type_check
      check (header_type in ('NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  body_variable_schema jsonb not null default '[]'::jsonb
    constraint labour_whatsapp_template_inventory_body_variables_array_check
      check (jsonb_typeof(body_variable_schema) = 'array'),
  footer_text text not null default '',
  button_schema jsonb not null default '[]'::jsonb
    constraint labour_whatsapp_template_inventory_button_schema_array_check
      check (jsonb_typeof(button_schema) = 'array'),
  enabled boolean not null default false,
  safe_test_available boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_template_inventory_metadata_object_check
      check (jsonb_typeof(metadata) = 'object'),
  last_synchronized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_template_inventory_enabled_requires_approved_status_check
    check (enabled = false or meta_status = 'APPROVED'),
  constraint labour_whatsapp_template_inventory_safe_test_requires_approved_status_check
    check (safe_test_available = false or meta_status = 'APPROVED')
);

create unique index idx_labour_whatsapp_template_inventory_name_language
on public.labour_whatsapp_template_inventory (meta_template_name, language);

create index idx_labour_whatsapp_template_inventory_status
on public.labour_whatsapp_template_inventory (meta_status, enabled);

alter table public.labour_whatsapp_template_inventory enable row level security;

comment on table public.labour_whatsapp_template_inventory is
  'Persisted read-only template inventory. SQL can prevent enablement unless Meta status is APPROVED, but application-layer validation still controls detailed variables, media contracts, and button contracts. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

create table public.labour_whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  settings_key text not null unique
    constraint labour_whatsapp_settings_key_nonempty_check
      check (btrim(settings_key) <> ''),
  settings_value jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_settings_value_shape_check
      check (
        case
          when settings_key = 'pause_all_sending' then jsonb_typeof(settings_value) = 'boolean'
          when settings_key in ('worker_daily_limit', 'company_job_daily_limit', 'manual_bulk_cap') then jsonb_typeof(settings_value) = 'number'
          when settings_key in ('quiet_hours_start', 'quiet_hours_end', 'timezone') then jsonb_typeof(settings_value) = 'string'
          else jsonb_typeof(settings_value) = 'object'
        end
      ),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_labour_whatsapp_settings_key
on public.labour_whatsapp_settings (settings_key);

alter table public.labour_whatsapp_settings enable row level security;

comment on table public.labour_whatsapp_settings is
  'Operational WhatsApp safety settings only. Future application code must treat a missing or invalid pause_all_sending value as paused. Phase 16C.2 does not connect this setting to any sender. Browser clients receive no direct access; controlled server-side Admin/service-role access only.';

comment on column public.labour_whatsapp_settings.settings_value is
  'Known settings use conservative JSON types: pause_all_sending=boolean, numeric limits=number, quiet-hours/timezone=string, future composite settings=object.';

insert into public.labour_whatsapp_settings (
  settings_key,
  settings_value,
  description
) values (
  'pause_all_sending',
  'true'::jsonb,
  'Fail-safe default. Future sender code must treat missing or invalid pause_all_sending as paused.'
)
on conflict (settings_key) do nothing;

-- Rollback plan (do not execute automatically).
-- WARNING:
-- - Rolling back after real usage begins drops WhatsApp consent, audit, suppression,
--   inbound, template, and settings records.
-- - Export data or take a verified backup before any real rollback.
-- - Rollback must not touch existing Worker, Company, or Job tables.
--
-- Safe reverse order for manual rollback review only:
-- drop table public.labour_whatsapp_settings;
-- drop table public.labour_whatsapp_template_inventory;
-- drop table public.labour_whatsapp_inbound_events;
-- drop table public.labour_whatsapp_suppressions;
-- drop table public.labour_whatsapp_consent_events;
-- drop table public.labour_whatsapp_consents;
