-- Phase 16G.1 review-only migration body.
-- This SQL has not been applied to any Supabase environment.
-- Create the final migration locally with:
--   supabase migration new add_whatsapp_worker_job_match_candidates
-- Then copy this reviewed body into the CLI-created migration file.
--
-- Security and rollout boundary:
-- - Preview candidate persistence foundation only.
-- - Does not add database hooks, schedules, functions, webhooks, or send paths.
-- - No permissions are added for anon or authenticated roles.
-- - RLS is enabled and no browser policy is created.
-- - Intended future access is controlled server-side service-role code only.

create table public.labour_whatsapp_worker_job_match_candidates (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null
    constraint labour_whatsapp_match_candidates_worker_id_nonempty_check
      check (btrim(worker_id) <> ''),
  job_post_id text not null
    constraint labour_whatsapp_match_candidates_job_id_nonempty_check
      check (btrim(job_post_id) <> ''),
  company_id text not null
    constraint labour_whatsapp_match_candidates_company_id_nonempty_check
      check (btrim(company_id) <> ''),
  match_key text not null
    constraint labour_whatsapp_match_candidates_match_key_nonempty_check
      check (btrim(match_key) <> ''),
  candidate_state text not null default 'eligible'
    constraint labour_whatsapp_match_candidates_state_check
      check (candidate_state in ('eligible', 'consumed', 'invalidated')),
  matched_category_id text not null
    constraint labour_whatsapp_match_candidates_category_nonempty_check
      check (btrim(matched_category_id) <> ''),
  matched_city text not null
    constraint labour_whatsapp_match_candidates_city_nonempty_check
      check (btrim(matched_city) <> ''),
  eligibility_snapshot jsonb not null default '{}'::jsonb
    constraint labour_whatsapp_match_candidates_snapshot_object_check
      check (jsonb_typeof(eligibility_snapshot) = 'object'),
  matched_at timestamptz not null,
  last_validated_at timestamptz not null,
  consumed_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labour_whatsapp_match_candidates_consumed_at_check
    check (candidate_state <> 'consumed' or consumed_at is not null),
  constraint labour_whatsapp_match_candidates_invalidated_at_check
    check (candidate_state <> 'invalidated' or invalidated_at is not null)
);

create unique index idx_labour_whatsapp_match_candidates_worker_job
on public.labour_whatsapp_worker_job_match_candidates (worker_id, job_post_id);

create unique index idx_labour_whatsapp_match_candidates_match_key
on public.labour_whatsapp_worker_job_match_candidates (match_key);

create index idx_labour_whatsapp_match_candidates_job_state
on public.labour_whatsapp_worker_job_match_candidates (job_post_id, candidate_state);

create index idx_labour_whatsapp_match_candidates_worker_state
on public.labour_whatsapp_worker_job_match_candidates (worker_id, candidate_state);

alter table public.labour_whatsapp_worker_job_match_candidates enable row level security;

revoke all on table public.labour_whatsapp_worker_job_match_candidates
from public, anon, authenticated;

grant select
on table public.labour_whatsapp_worker_job_match_candidates
to service_role;

comment on table public.labour_whatsapp_worker_job_match_candidates is
  'Preview foundation for deterministic Worker-to-job WhatsApp match candidates. No database hook, scheduler, sender, browser permission, or browser RLS policy is created by this migration.';

comment on column public.labour_whatsapp_worker_job_match_candidates.eligibility_snapshot is
  'Server-generated non-secret matching audit metadata. Mobile numbers and message bodies must not be stored here.';
