alter table if exists public.labour_workers
add column if not exists active_plan text;

alter table if exists public.labour_workers
add column if not exists plan_valid_from date;

alter table if exists public.labour_workers
add column if not exists plan_valid_until date;

alter table if exists public.labour_workers
add column if not exists last_wallet_deduction_date date;
