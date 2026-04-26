create table if not exists public.labour_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  demand_level text not null default 'medium' check (demand_level in ('high', 'medium', 'low')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_plans (
  id text primary key,
  audience text not null check (audience in ('worker', 'company')),
  name text not null,
  category_id text references public.labour_categories(id) on delete set null,
  registration_fee numeric(10, 2) not null default 0,
  wallet_credit numeric(10, 2) not null default 0,
  plan_amount numeric(10, 2) not null default 0,
  validity_days integer not null default 0,
  daily_charge numeric(10, 2) not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_workers (
  id text primary key,
  full_name text not null,
  mobile text not null unique,
  city text,
  skills text[] not null default '{}',
  experience_years numeric(6, 2) not null default 0,
  expected_daily_wage numeric(10, 2) not null default 0,
  wallet_balance numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive_wallet_empty', 'inactive_subscription_expired', 'blocked', 'rejected')),
  availability text not null default 'available_today' check (availability in ('available_today', 'available_this_week', 'not_available')),
  is_visible boolean not null default true,
  category_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.labour_workers
drop constraint if exists labour_workers_status_check;

alter table if exists public.labour_workers
add constraint labour_workers_status_check
check (status in ('pending', 'active', 'inactive_wallet_empty', 'inactive_subscription_expired', 'blocked', 'rejected'));

create table if not exists public.labour_companies (
  id text primary key,
  company_name text not null,
  contact_person text not null,
  mobile text not null unique,
  city text,
  category_ids text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'blocked')),
  registration_fee_paid boolean not null default false,
  active_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_job_posts (
  id text primary key,
  company_id text not null references public.labour_companies(id) on delete cascade,
  category_id text not null references public.labour_categories(id) on delete restrict,
  title text not null,
  description text,
  city text,
  workers_needed integer not null default 1,
  wage_amount numeric(10, 2) not null default 0,
  validity_days integer not null default 3,
  status text not null default 'draft' check (status in ('draft', 'live', 'expired', 'paused')),
  published_at date,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_job_applications (
  id text primary key,
  worker_id text not null references public.labour_workers(id) on delete cascade,
  job_post_id text not null references public.labour_job_posts(id) on delete cascade,
  company_id text not null references public.labour_companies(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  note text,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_saved_jobs (
  id text primary key,
  worker_id text not null references public.labour_workers(id) on delete cascade,
  job_post_id text not null references public.labour_job_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_worker_notifications (
  id text primary key,
  worker_id text not null references public.labour_workers(id) on delete cascade,
  type text not null check (type in ('application_submitted', 'job_saved', 'application_status', 'wallet_reminder')),
  title text not null,
  message text not null,
  related_job_post_id text references public.labour_job_posts(id) on delete set null,
  related_company_id text references public.labour_companies(id) on delete set null,
  is_read boolean not null default false,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_wallet_transactions (
  id text primary key,
  entity_type text not null check (entity_type in ('worker', 'company')),
  entity_id text not null,
  entity_name text not null,
  city text,
  transaction_type text not null check (transaction_type in ('registration_fee', 'wallet_deduction', 'plan_purchase', 'wallet_recharge', 'manual_adjustment')),
  amount numeric(10, 2) not null default 0,
  direction text not null check (direction in ('credit', 'debit')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'attention', 'failed')),
  reference text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_recharge_requests (
  id text primary key,
  request_type text not null check (request_type in ('worker_recharge', 'company_follow_up')),
  related_entity_type text not null check (related_entity_type in ('worker', 'company')),
  related_entity_id text not null,
  name text not null,
  city text,
  category_label text,
  status_label text,
  suggested_amount numeric(10, 2) not null default 0,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  request_status text not null default 'open' check (request_status in ('open', 'contacted', 'resolved', 'closed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_website_content (
  id text primary key,
  page_key text not null unique,
  title text not null,
  content_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_worker_auth_sessions (
  id text primary key,
  mobile text not null,
  worker_id text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_audit_logs (
  id text primary key,
  action text not null check (action in ('create', 'update', 'delete')),
  entity_type text not null check (entity_type in ('categories', 'plans', 'workers', 'companies', 'jobPosts', 'jobApplications', 'savedJobs', 'workerNotifications', 'walletTransactions', 'rechargeRequests')),
  entity_id text not null,
  summary text not null,
  actor text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.labour_audit_logs
drop constraint if exists labour_audit_logs_entity_type_check;

alter table if exists public.labour_audit_logs
add constraint labour_audit_logs_entity_type_check
check (entity_type in ('categories', 'plans', 'workers', 'companies', 'jobPosts', 'jobApplications', 'savedJobs', 'workerNotifications', 'walletTransactions', 'rechargeRequests'));

create index if not exists idx_labour_categories_active on public.labour_categories(is_active);
create index if not exists idx_labour_plans_audience on public.labour_plans(audience);
create index if not exists idx_labour_workers_status on public.labour_workers(status);
create index if not exists idx_labour_companies_status on public.labour_companies(status);
create index if not exists idx_labour_job_posts_status on public.labour_job_posts(status);
create index if not exists idx_labour_job_applications_worker_id on public.labour_job_applications(worker_id);
create index if not exists idx_labour_job_applications_job_post_id on public.labour_job_applications(job_post_id);
create index if not exists idx_labour_saved_jobs_worker_id on public.labour_saved_jobs(worker_id);
create index if not exists idx_labour_saved_jobs_job_post_id on public.labour_saved_jobs(job_post_id);
create index if not exists idx_labour_worker_notifications_worker_id on public.labour_worker_notifications(worker_id);
create index if not exists idx_labour_worker_notifications_is_read on public.labour_worker_notifications(is_read);
create index if not exists idx_labour_wallet_transactions_created_at on public.labour_wallet_transactions(created_at desc);
create index if not exists idx_labour_wallet_transactions_entity_type on public.labour_wallet_transactions(entity_type);
create index if not exists idx_labour_recharge_requests_status on public.labour_recharge_requests(request_status);
create index if not exists idx_labour_recharge_requests_priority on public.labour_recharge_requests(priority);
create index if not exists idx_labour_website_content_page_key on public.labour_website_content(page_key);
create index if not exists idx_labour_worker_auth_sessions_mobile on public.labour_worker_auth_sessions(mobile);
create index if not exists idx_labour_audit_logs_created_at on public.labour_audit_logs(created_at desc);
