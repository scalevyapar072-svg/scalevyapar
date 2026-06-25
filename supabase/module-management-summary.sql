alter table if exists public.modules
add column if not exists summary text not null default '';
