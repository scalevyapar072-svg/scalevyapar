-- Stage A: dormant durable infrastructure only.
-- This migration does not reference business tables and cannot enqueue events.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table public.rozgar_internal_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  event_type text not null,
  recipient_email text not null default 'scalevyapar072@gmail.com',
  template_id text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz default now(),
  last_attempt_at timestamptz,
  processing_started_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error_code text,
  last_error_message_safe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rozgar_internal_notification_outbox_event_key_key unique (event_key),
  constraint rozgar_internal_notification_outbox_event_type_check
    check (event_type in ('company_registration', 'job_published')),
  constraint rozgar_internal_notification_outbox_recipient_check
    check (recipient_email = 'scalevyapar072@gmail.com'),
  constraint rozgar_internal_notification_outbox_template_check
    check (template_id in ('rozgar_company_registration_admin', 'rozgar_job_published_admin')),
  constraint rozgar_internal_notification_outbox_payload_check
    check (jsonb_typeof(payload_json) = 'object'),
  constraint rozgar_internal_notification_outbox_status_check
    check (status in ('pending', 'processing', 'sent', 'failed')),
  constraint rozgar_internal_notification_outbox_attempt_count_check
    check (attempt_count between 0 and 4)
);

create index rozgar_internal_notification_outbox_due_idx
  on public.rozgar_internal_notification_outbox(status, next_attempt_at, created_at);

create index rozgar_internal_notification_outbox_processing_idx
  on public.rozgar_internal_notification_outbox(status, processing_started_at);

alter table public.rozgar_internal_notification_outbox enable row level security;

revoke all on table public.rozgar_internal_notification_outbox from public;
revoke all on table public.rozgar_internal_notification_outbox from anon;
revoke all on table public.rozgar_internal_notification_outbox from authenticated;
revoke all on table public.rozgar_internal_notification_outbox from service_role;
grant select on table public.rozgar_internal_notification_outbox to service_role;

comment on table public.rozgar_internal_notification_outbox is
  'Durable internal-only notifications for new Rozgar companies and first job publications.';

create or replace function public.recover_stale_rozgar_internal_notification_outbox()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer := 0;
  recovered_rows integer := 0;
begin
  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'failed',
    processing_started_at = null,
    next_attempt_at = null,
    last_error_code = 'stale-final-attempt',
    last_error_message_safe = 'The final processing lease expired before completion.',
    updated_at = now()
  where outbox.status = 'processing'
    and outbox.attempt_count >= 4
    and outbox.processing_started_at <= now() - interval '15 minutes';

  get diagnostics affected_rows = row_count;
  recovered_rows := recovered_rows + affected_rows;

  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'pending',
    processing_started_at = null,
    next_attempt_at = now(),
    last_error_code = 'stale-processing-lease',
    last_error_message_safe = 'The processing lease expired and the event was returned for retry.',
    updated_at = now()
  where outbox.status = 'processing'
    and outbox.attempt_count < 4
    and outbox.processing_started_at <= now() - interval '15 minutes';

  get diagnostics affected_rows = row_count;
  recovered_rows := recovered_rows + affected_rows;

  return recovered_rows;
end;
$$;

create or replace function public.claim_rozgar_internal_notification_outbox(p_limit integer default 25)
returns setof public.rozgar_internal_notification_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recover_stale_rozgar_internal_notification_outbox();

  return query
  with candidates as (
    select outbox.id
    from public.rozgar_internal_notification_outbox as outbox
    where outbox.status = 'pending'
      and outbox.attempt_count < 4
      and outbox.next_attempt_at <= now()
    order by outbox.created_at asc, outbox.id asc
    for update skip locked
    limit least(greatest(coalesce(p_limit, 25), 1), 25)
  )
  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'processing',
    attempt_count = outbox.attempt_count + 1,
    last_attempt_at = now(),
    processing_started_at = now(),
    updated_at = now()
  from candidates
  where outbox.id = candidates.id
  returning outbox.*;
end;
$$;

create or replace function public.complete_rozgar_internal_notification_outbox(
  p_outbox_id uuid,
  p_provider_message_id text,
  p_sent_at timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'sent',
    next_attempt_at = null,
    processing_started_at = null,
    sent_at = coalesce(p_sent_at, now()),
    provider_message_id = nullif(left(coalesce(p_provider_message_id, ''), 500), ''),
    last_error_code = null,
    last_error_message_safe = null,
    updated_at = now()
  where outbox.id = p_outbox_id
    and outbox.status = 'processing';

  return found;
end;
$$;

create or replace function public.retry_rozgar_internal_notification_outbox(
  p_outbox_id uuid,
  p_next_attempt_at timestamptz,
  p_error_code text,
  p_error_message_safe text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'pending',
    next_attempt_at = coalesce(p_next_attempt_at, now()),
    processing_started_at = null,
    last_error_code = nullif(left(coalesce(p_error_code, ''), 100), ''),
    last_error_message_safe = nullif(left(coalesce(p_error_message_safe, ''), 1000), ''),
    updated_at = now()
  where outbox.id = p_outbox_id
    and outbox.status = 'processing'
    and outbox.attempt_count < 4;

  return found;
end;
$$;

create or replace function public.fail_rozgar_internal_notification_outbox(
  p_outbox_id uuid,
  p_error_code text,
  p_error_message_safe text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rozgar_internal_notification_outbox as outbox
  set
    status = 'failed',
    next_attempt_at = null,
    processing_started_at = null,
    last_error_code = nullif(left(coalesce(p_error_code, ''), 100), ''),
    last_error_message_safe = nullif(left(coalesce(p_error_message_safe, ''), 1000), ''),
    updated_at = now()
  where outbox.id = p_outbox_id
    and outbox.status = 'processing';

  return found;
end;
$$;

revoke all on function public.recover_stale_rozgar_internal_notification_outbox() from public;
revoke all on function public.recover_stale_rozgar_internal_notification_outbox() from anon;
revoke all on function public.recover_stale_rozgar_internal_notification_outbox() from authenticated;
revoke all on function public.recover_stale_rozgar_internal_notification_outbox() from service_role;
grant execute on function public.recover_stale_rozgar_internal_notification_outbox() to service_role;

revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from public;
revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from anon;
revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from authenticated;
revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from service_role;
grant execute on function public.claim_rozgar_internal_notification_outbox(integer) to service_role;

revoke all on function public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz) from public;
revoke all on function public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz) from anon;
revoke all on function public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz) from authenticated;
revoke all on function public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz) from service_role;
grant execute on function public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz) to service_role;

revoke all on function public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text) from public;
revoke all on function public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text) from anon;
revoke all on function public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text) from authenticated;
revoke all on function public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text) from service_role;
grant execute on function public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text) to service_role;

revoke all on function public.fail_rozgar_internal_notification_outbox(uuid, text, text) from public;
revoke all on function public.fail_rozgar_internal_notification_outbox(uuid, text, text) from anon;
revoke all on function public.fail_rozgar_internal_notification_outbox(uuid, text, text) from authenticated;
revoke all on function public.fail_rozgar_internal_notification_outbox(uuid, text, text) from service_role;
grant execute on function public.fail_rozgar_internal_notification_outbox(uuid, text, text) to service_role;

commit;
