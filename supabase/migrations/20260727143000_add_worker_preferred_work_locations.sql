alter table public.labour_workers
  add column if not exists preferred_work_locations jsonb not null default '[]'::jsonb;
