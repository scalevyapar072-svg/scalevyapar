alter table if exists public.labour_workers
add column if not exists resume_document_path text;
