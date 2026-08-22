create table if not exists public.labour_whatsapp_consents (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('worker', 'company', 'external_test')),
  recipient_id text,
  normalized_mobile text not null,
  consent_type text not null check (consent_type in ('service_allowed', 'matching_alerts_allowed', 'marketing_allowed')),
  allowed boolean not null default false,
  source text not null,
  consent_text_version text not null default '',
  consented_at timestamptz,
  opted_out_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_labour_whatsapp_consents_unique_recipient_consent
on public.labour_whatsapp_consents (
  recipient_type,
  coalesce(recipient_id, ''),
  normalized_mobile,
  consent_type
);

create index if not exists idx_labour_whatsapp_consents_mobile
on public.labour_whatsapp_consents (normalized_mobile);

create index if not exists idx_labour_whatsapp_consents_type_allowed
on public.labour_whatsapp_consents (consent_type, allowed);

alter table public.labour_whatsapp_consents enable row level security;

create table if not exists public.labour_whatsapp_suppressions (
  id uuid primary key default gen_random_uuid(),
  normalized_mobile text not null,
  suppression_scope text not null default 'all_whatsapp',
  trigger_source text not null,
  trigger_command text not null,
  trigger_message_id text,
  previous_consent_snapshot jsonb not null default '{}'::jsonb,
  restoration_requested_at timestamptz,
  restoration_message_id text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_labour_whatsapp_suppressions_mobile_active
on public.labour_whatsapp_suppressions (normalized_mobile)
where active = true;

create index if not exists idx_labour_whatsapp_suppressions_scope
on public.labour_whatsapp_suppressions (suppression_scope, active);

alter table public.labour_whatsapp_suppressions enable row level security;

create table if not exists public.labour_whatsapp_inbound_events (
  id uuid primary key default gen_random_uuid(),
  message_id text not null unique,
  normalized_mobile text,
  matched_recipient_type text check (matched_recipient_type in ('worker', 'company', 'external_test')),
  matched_recipient_id text,
  event_kind text not null check (event_kind in ('opt_out_all', 'restore_request', 'message', 'unknown')),
  raw_text text not null default '',
  normalized_text text not null default '',
  command_key text,
  suppression_applied boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_labour_whatsapp_inbound_events_mobile
on public.labour_whatsapp_inbound_events (normalized_mobile);

create index if not exists idx_labour_whatsapp_inbound_events_kind
on public.labour_whatsapp_inbound_events (event_kind, created_at desc);

alter table public.labour_whatsapp_inbound_events enable row level security;

create table if not exists public.labour_whatsapp_template_inventory (
  id uuid primary key default gen_random_uuid(),
  meta_template_name text not null,
  language text not null,
  meta_category text not null,
  meta_status text not null,
  intended_recipient_type text check (intended_recipient_type in ('worker', 'company', 'both', 'external_test')),
  intended_business_event text,
  header_type text not null check (header_type in ('NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  body_variable_schema jsonb not null default '[]'::jsonb,
  footer_text text not null default '',
  button_schema jsonb not null default '[]'::jsonb,
  enabled boolean not null default false,
  safe_test_available boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  last_synchronized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_labour_whatsapp_template_inventory_name_language
on public.labour_whatsapp_template_inventory (meta_template_name, language);

create index if not exists idx_labour_whatsapp_template_inventory_status
on public.labour_whatsapp_template_inventory (meta_status, enabled);

alter table public.labour_whatsapp_template_inventory enable row level security;

create table if not exists public.labour_whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  settings_key text not null unique,
  settings_value jsonb not null default '{}'::jsonb,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_labour_whatsapp_settings_key
on public.labour_whatsapp_settings (settings_key);

alter table public.labour_whatsapp_settings enable row level security;
