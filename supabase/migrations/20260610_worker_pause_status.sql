begin;

alter table if exists public.labour_workers
add column if not exists worker_paused_by_worker boolean not null default false;

alter table if exists public.labour_workers
add column if not exists worker_paused_at timestamptz null;

alter table if exists public.labour_workers
add column if not exists worker_reactivated_at timestamptz null;

alter table if exists public.labour_workers
drop constraint if exists labour_workers_status_check;

alter table if exists public.labour_workers
add constraint labour_workers_status_check
check (
  status in (
    'pending',
    'active',
    'inactive_wallet_empty',
    'inactive_subscription_expired',
    'inactive_paused_by_worker',
    'blocked',
    'rejected'
  )
);

commit;

-- Rollback SQL
-- begin;
--
-- update public.labour_workers
-- set
--   worker_paused_by_worker = false,
--   worker_paused_at = null,
--   worker_reactivated_at = null,
--   status = case
--     when status = 'inactive_paused_by_worker' then
--       case
--         when coalesce(active_plan, '') = '' then 'inactive_subscription_expired'
--         when plan_valid_until is not null and plan_valid_until < current_date then 'inactive_subscription_expired'
--         when coalesce(wallet_balance, 0) <= 0 then 'inactive_wallet_empty'
--         else 'active'
--       end
--     else status
--   end
-- where
--   status = 'inactive_paused_by_worker'
--   or worker_paused_by_worker = true
--   or worker_paused_at is not null
--   or worker_reactivated_at is not null;
--
-- alter table if exists public.labour_workers
-- drop constraint if exists labour_workers_status_check;
--
-- alter table if exists public.labour_workers
-- add constraint labour_workers_status_check
-- check (
--   status in (
--     'pending',
--     'active',
--     'inactive_wallet_empty',
--     'inactive_subscription_expired',
--     'blocked',
--     'rejected'
--   )
-- );
--
-- alter table if exists public.labour_workers
-- drop column if exists worker_reactivated_at;
--
-- alter table if exists public.labour_workers
-- drop column if exists worker_paused_at;
--
-- alter table if exists public.labour_workers
-- drop column if exists worker_paused_by_worker;
--
-- commit;
