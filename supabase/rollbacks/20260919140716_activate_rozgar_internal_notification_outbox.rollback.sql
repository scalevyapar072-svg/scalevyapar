-- Stage B rollback. Run before restoring an application that does not process this outbox.
-- Pending, processing, sent, and failed rows are intentionally retained for audit/recovery.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

drop trigger if exists enqueue_rozgar_company_registration_notification_after_insert
  on public.labour_companies;
drop trigger if exists enqueue_rozgar_job_published_notification_after_insert
  on public.labour_job_posts;
drop trigger if exists enqueue_rozgar_job_published_notification_after_status_update
  on public.labour_job_posts;

drop function if exists public.enqueue_rozgar_company_registration_notification();
drop function if exists public.enqueue_rozgar_job_published_notification();

commit;
