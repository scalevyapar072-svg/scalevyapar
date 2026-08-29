-- Phase 16H.1 review-only migration body.
-- This SQL has not been applied to any Supabase environment.
-- Create the final migration locally with:
--   supabase migration new add_whatsapp_worker_job_match_outbox
-- Then copy this reviewed body into the CLI-created migration file.
--
-- Security and rollout boundary:
-- - Candidate-linked WhatsApp outbox foundation only.
-- - Depends on the reviewed Phase 16G.1 match-candidate migration.
-- - Does not create a trigger, cron, function, webhook, HTTP call, or sender.
-- - Does not enqueue any row or modify an existing candidate.
-- - No permissions are added for anon, authenticated, or PUBLIC.
-- - RLS is enabled and no browser policy is created.
-- - Intended future access is controlled server-side service-role code only.

create table public.labour_whatsapp_worker_job_match_outbox (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null
    references public.labour_whatsapp_worker_job_match_candidates (id)
      on delete restrict,
  match_key text not null
    constraint labour_whatsapp_match_outbox_match_key_nonempty_check
      check (btrim(match_key) <> ''),
  idempotency_key text not null
    constraint labour_whatsapp_match_outbox_idempotency_key_nonempty_check
      check (btrim(idempotency_key) <> ''),
  worker_id text not null
    constraint labour_whatsapp_match_outbox_worker_id_nonempty_check
      check (btrim(worker_id) <> ''),
  job_post_id text not null
    constraint labour_whatsapp_match_outbox_job_id_nonempty_check
      check (btrim(job_post_id) <> ''),
  company_id text not null
    constraint labour_whatsapp_match_outbox_company_id_nonempty_check
      check (btrim(company_id) <> ''),
  recipient_type text not null default 'worker'
    constraint labour_whatsapp_match_outbox_recipient_type_check
      check (recipient_type = 'worker'),
  template_name text not null default 'worker_job_match_alert'
    constraint labour_whatsapp_match_outbox_template_name_check
      check (template_name = 'worker_job_match_alert'),
  template_language text not null default 'hi'
    constraint labour_whatsapp_match_outbox_template_language_check
      check (template_language = 'hi'),
  template_category text not null default 'UTILITY'
    constraint labour_whatsapp_match_outbox_template_category_check
      check (template_category = 'UTILITY'),
  outbox_status text not null default 'pending'
    constraint labour_whatsapp_match_outbox_status_check
      check (
        outbox_status in (
          'pending',
          'processing',
          'retry_scheduled',
          'sent',
          'blocked',
          'failed_terminal',
          'cancelled'
        )
      ),
  available_at timestamptz not null,
  next_attempt_at timestamptz,
  processing_started_at timestamptz,
  sent_at timestamptz,
  blocked_at timestamptz,
  cancelled_at timestamptz,
  attempt_count integer not null default 0
    constraint labour_whatsapp_match_outbox_attempt_count_check
      check (attempt_count between 0 and 4),
  last_failure_code text
    constraint labour_whatsapp_match_outbox_failure_code_nonempty_check
      check (last_failure_code is null or btrim(last_failure_code) <> ''),
  provider_message_id text
    constraint labour_whatsapp_match_outbox_provider_message_id_nonempty_check
      check (provider_message_id is null or btrim(provider_message_id) <> ''),
  revalidation_snapshot jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_match_outbox_revalidation_object_check
      check (jsonb_typeof(revalidation_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_match_outbox_retry_state_check
    check (
      outbox_status <> 'retry_scheduled'
      or next_attempt_at is not null
    ),
  constraint labour_whatsapp_match_outbox_processing_state_check
    check (
      outbox_status <> 'processing'
      or processing_started_at is not null
    ),
  constraint labour_whatsapp_match_outbox_sent_state_check
    check (
      outbox_status <> 'sent'
      or sent_at is not null
    ),
  constraint labour_whatsapp_match_outbox_blocked_state_check
    check (
      outbox_status <> 'blocked'
      or blocked_at is not null
    ),
  constraint labour_whatsapp_match_outbox_cancelled_state_check
    check (
      outbox_status <> 'cancelled'
      or cancelled_at is not null
    )
);

create unique index idx_labour_whatsapp_match_outbox_candidate
on public.labour_whatsapp_worker_job_match_outbox (candidate_id);

create unique index idx_labour_whatsapp_match_outbox_match_key
on public.labour_whatsapp_worker_job_match_outbox (match_key);

create unique index idx_labour_whatsapp_match_outbox_idempotency_key
on public.labour_whatsapp_worker_job_match_outbox (idempotency_key);

create unique index idx_labour_whatsapp_match_outbox_provider_message_id
on public.labour_whatsapp_worker_job_match_outbox (provider_message_id)
where provider_message_id is not null;

create index idx_labour_whatsapp_match_outbox_due
on public.labour_whatsapp_worker_job_match_outbox (
  available_at,
  next_attempt_at,
  created_at
)
where outbox_status in ('pending', 'retry_scheduled');

create index idx_labour_whatsapp_match_outbox_worker_status
on public.labour_whatsapp_worker_job_match_outbox (
  worker_id,
  outbox_status,
  created_at desc
);

create index idx_labour_whatsapp_match_outbox_job_status
on public.labour_whatsapp_worker_job_match_outbox (
  job_post_id,
  outbox_status,
  created_at desc
);

alter table public.labour_whatsapp_worker_job_match_outbox enable row level security;

revoke all on table public.labour_whatsapp_worker_job_match_outbox
from public, anon, authenticated;

grant select, insert, update
on table public.labour_whatsapp_worker_job_match_outbox
to service_role;

comment on table public.labour_whatsapp_worker_job_match_outbox is
  'Server-only candidate-linked outbox foundation for future Worker job-match Utility alerts. This migration creates no sender, scheduler, trigger, HTTP request, browser access, or queued data.';

comment on column public.labour_whatsapp_worker_job_match_outbox.revalidation_snapshot is
  'Server-generated non-secret safety audit metadata only. Mobile numbers, message bodies, access tokens, and raw provider payloads must not be stored here.';

comment on column public.labour_whatsapp_worker_job_match_outbox.last_failure_code is
  'Sanitized internal failure category only. Raw provider errors, request bodies, credentials, and personal data must not be stored here.';
