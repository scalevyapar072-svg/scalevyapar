alter table public.labour_workers
  add column if not exists preferred_work_locations jsonb;

alter table public.labour_workers
  alter column preferred_work_locations drop not null;
