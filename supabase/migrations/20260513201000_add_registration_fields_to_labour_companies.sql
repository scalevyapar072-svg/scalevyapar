alter table public.labour_companies
  add column if not exists business_type text,
  add column if not exists industry_category text,
  add column if not exists gst_number text,
  add column if not exists company_address text,
  add column if not exists state text,
  add column if not exists pincode text,
  add column if not exists workers_needed integer not null default 0,
  add column if not exists hiring_type text,
  add column if not exists business_description text,
  add column if not exists gst_certificate_path text,
  add column if not exists company_proof_path text,
  add column if not exists owner_id_proof_path text;
