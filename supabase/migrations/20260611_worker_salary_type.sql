-- Forward migration: add nullable worker salary type support.
begin;

alter table if exists public.labour_workers
add column if not exists salary_type text null;

comment on column public.labour_workers.salary_type is
  'Worker salary type selected in Rozgar registration/profile. Null means fallback to Daily Wage.';

commit;

-- Rollback SQL (do not run unless explicitly required):
-- begin;
-- alter table if exists public.labour_workers
-- drop column if exists salary_type;
-- commit;
