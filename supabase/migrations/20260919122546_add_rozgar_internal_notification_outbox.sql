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
grant select, insert, update on table public.rozgar_internal_notification_outbox to service_role;

comment on table public.rozgar_internal_notification_outbox is
  'Durable internal-only notifications for new Rozgar companies and first job publications.';

create or replace function public.claim_rozgar_internal_notification_outbox(p_limit integer default 25)
returns setof public.rozgar_internal_notification_outbox
language plpgsql
security definer
set search_path = ''
as $$
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

  return query
  with candidates as (
    select outbox.id
    from public.rozgar_internal_notification_outbox as outbox
    where (
      outbox.status = 'pending'
      and outbox.attempt_count < 4
      and outbox.next_attempt_at <= now()
    ) or (
      outbox.status = 'processing'
      and outbox.attempt_count < 4
      and outbox.processing_started_at <= now() - interval '15 minutes'
    )
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

revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from public;
revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from anon;
revoke all on function public.claim_rozgar_internal_notification_outbox(integer) from authenticated;
grant execute on function public.claim_rozgar_internal_notification_outbox(integer) to service_role;

create or replace function public.enqueue_rozgar_company_registration_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.rozgar_internal_notification_outbox (
    event_key,
    event_type,
    recipient_email,
    template_id,
    payload_json
  )
  values (
    'rozgar-company-registration-' || new.id,
    'company_registration',
    'scalevyapar072@gmail.com',
    'rozgar_company_registration_admin',
    jsonb_strip_nulls(jsonb_build_object(
      'company_id', new.id,
      'company_name', new.company_name,
      'contact_person', new.contact_person,
      'registered_mobile', new.mobile,
      'registered_email', new.email,
      'city', new.city,
      'state', new.state,
      'industry_category', new.industry_category,
      'business_type', new.business_type,
      'registered_at', new.created_at
    ))
  )
  on conflict (event_key) do nothing;

  return new;
end;
$$;

revoke all on function public.enqueue_rozgar_company_registration_notification() from public;
revoke all on function public.enqueue_rozgar_company_registration_notification() from anon;
revoke all on function public.enqueue_rozgar_company_registration_notification() from authenticated;

create trigger enqueue_rozgar_company_registration_notification_after_insert
after insert on public.labour_companies
for each row
execute function public.enqueue_rozgar_company_registration_notification();

create or replace function public.enqueue_rozgar_job_published_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_name_value text;
  category_name_value text;
  plan_name_value text;
begin
  select company.company_name
  into company_name_value
  from public.labour_companies as company
  where company.id = new.company_id;

  select category.name
  into category_name_value
  from public.labour_categories as category
  where category.id = new.category_id;

  if new.plan_id is not null then
    select plan.name
    into plan_name_value
    from public.labour_plans as plan
    where plan.id = new.plan_id;
  end if;

  insert into public.rozgar_internal_notification_outbox (
    event_key,
    event_type,
    recipient_email,
    template_id,
    payload_json
  )
  values (
    'rozgar-job-published-' || new.id,
    'job_published',
    'scalevyapar072@gmail.com',
    'rozgar_job_published_admin',
    jsonb_strip_nulls(jsonb_build_object(
      'job_id', new.id,
      'job_title', new.title,
      'company_name', company_name_value,
      'company_id', new.company_id,
      'labour_categories', jsonb_build_array(category_name_value),
      'city', new.city,
      'workers_required', new.workers_needed,
      'selected_plan', plan_name_value,
      'published_at', new.published_at,
      'expires_at', new.expires_at
    ))
  )
  on conflict (event_key) do nothing;

  return new;
end;
$$;

revoke all on function public.enqueue_rozgar_job_published_notification() from public;
revoke all on function public.enqueue_rozgar_job_published_notification() from anon;
revoke all on function public.enqueue_rozgar_job_published_notification() from authenticated;

create trigger enqueue_rozgar_job_published_notification_after_insert
after insert on public.labour_job_posts
for each row
when (new.status = 'live')
execute function public.enqueue_rozgar_job_published_notification();

create trigger enqueue_rozgar_job_published_notification_after_status_update
after update of status on public.labour_job_posts
for each row
when (old.status is distinct from new.status and new.status = 'live')
execute function public.enqueue_rozgar_job_published_notification();
