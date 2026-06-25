alter table public.labour_workers
  add column if not exists company_id text,
  add column if not exists industry_category text,
  add column if not exists business_type text;
