alter table public.labour_workers
  add column if not exists home_city text;

alter table public.labour_workers
  add column if not exists address text;
