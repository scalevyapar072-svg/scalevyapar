-- Stage B: activate transactional event creation after Stage A is installed.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

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
revoke all on function public.enqueue_rozgar_company_registration_notification() from service_role;

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
revoke all on function public.enqueue_rozgar_job_published_notification() from service_role;

create trigger enqueue_rozgar_company_registration_notification_after_insert
after insert on public.labour_companies
for each row
execute function public.enqueue_rozgar_company_registration_notification();

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

commit;
