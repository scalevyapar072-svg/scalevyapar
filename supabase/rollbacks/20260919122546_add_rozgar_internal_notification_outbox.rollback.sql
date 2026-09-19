-- Stage A rollback. Stage B must be rolled back first.
-- This drops only the dedicated outbox infrastructure and does not alter business tables.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname in (
      'enqueue_rozgar_company_registration_notification_after_insert',
      'enqueue_rozgar_job_published_notification_after_insert',
      'enqueue_rozgar_job_published_notification_after_status_update'
    )
      and not tgisinternal
  ) then
    raise exception 'Stage B triggers are still active; roll back Stage B first.';
  end if;
end;
$$;

drop function if exists public.fail_rozgar_internal_notification_outbox(uuid, text, text);
drop function if exists public.retry_rozgar_internal_notification_outbox(uuid, timestamptz, text, text);
drop function if exists public.complete_rozgar_internal_notification_outbox(uuid, text, timestamptz);
drop function if exists public.claim_rozgar_internal_notification_outbox(integer);
drop function if exists public.recover_stale_rozgar_internal_notification_outbox();
drop table if exists public.rozgar_internal_notification_outbox;

commit;
