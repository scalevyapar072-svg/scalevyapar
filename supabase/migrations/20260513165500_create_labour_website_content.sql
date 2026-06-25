create table if not exists public.labour_website_content (
  id text primary key,
  page_key text not null unique,
  title text not null,
  content_json jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_labour_website_content_page_key
  on public.labour_website_content(page_key);
