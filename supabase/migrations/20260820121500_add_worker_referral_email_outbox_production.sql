create table if not exists public.worker_referral_email_outbox (
  id text primary key,
  event_key text not null,
  event_type text not null,
  recipient_email text not null,
  template_id text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz null,
  last_attempt_at timestamptz null,
  processing_started_at timestamptz null,
  sent_at timestamptz null,
  provider_message_id text null,
  last_error_code text null,
  last_error_message_safe text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referral_email_outbox_event_key_key unique (event_key),
  constraint worker_referral_email_outbox_status_check
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  constraint worker_referral_email_outbox_attempt_count_check
    check (attempt_count >= 0 and attempt_count <= 4)
);

create index if not exists worker_referral_email_outbox_due_idx
  on public.worker_referral_email_outbox(status, next_attempt_at, created_at);

create index if not exists worker_referral_email_outbox_processing_idx
  on public.worker_referral_email_outbox(status, processing_started_at);

alter table public.worker_referral_email_outbox enable row level security;

revoke all on table public.worker_referral_email_outbox from public;
revoke all on table public.worker_referral_email_outbox from anon;
revoke all on table public.worker_referral_email_outbox from authenticated;
grant select, insert, update on table public.worker_referral_email_outbox to service_role;

comment on table public.worker_referral_email_outbox is
  'Rozgar Refer & Earn: admin-only email outbox for controlled Resend delivery.';

create or replace function public.claim_worker_referral_email_outbox(p_limit integer default 25)
returns setof public.worker_referral_email_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  row_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
begin
  return query
  with candidates as (
    select outbox.id
    from public.worker_referral_email_outbox as outbox
    where
      (
        outbox.status = 'pending'
        and (outbox.next_attempt_at is null or outbox.next_attempt_at <= now())
      )
      or (
        outbox.status = 'processing'
        and outbox.attempt_count < 4
        and outbox.processing_started_at <= now() - interval '15 minutes'
      )
    order by outbox.created_at
    limit row_limit
    for update skip locked
  ),
  claimed as (
    update public.worker_referral_email_outbox as outbox
    set
      status = 'processing',
      attempt_count = outbox.attempt_count + 1,
      last_attempt_at = now(),
      processing_started_at = now(),
      next_attempt_at = null,
      updated_at = now()
    where outbox.id in (select id from candidates)
    returning outbox.*
  )
  select *
  from claimed;
end;
$$;

revoke all on function public.claim_worker_referral_email_outbox(integer) from public;
revoke all on function public.claim_worker_referral_email_outbox(integer) from anon;
revoke all on function public.claim_worker_referral_email_outbox(integer) from authenticated;
grant execute on function public.claim_worker_referral_email_outbox(integer) to service_role;
