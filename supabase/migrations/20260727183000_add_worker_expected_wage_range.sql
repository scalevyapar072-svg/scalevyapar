alter table public.labour_workers
  add column if not exists minimum_expected_wage numeric(10, 2),
  add column if not exists maximum_expected_wage numeric(10, 2);
