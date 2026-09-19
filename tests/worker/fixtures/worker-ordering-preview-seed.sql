insert into public.clients (
  id,
  name,
  email,
  password_hash,
  role,
  phone,
  plan,
  status
) values (
  'e2e-order-client',
  'Isolated Ordering Company',
  'isolated.preview.company@example.test',
  '$2b$10$0zfAxKMaoC24guvT8QzlfuLNZzOMhYcJBS/gUJWkFZ9pMGwZTO8LG',
  'CLIENT',
  '8300000001',
  'e2e-order-company-plan',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  password_hash = excluded.password_hash,
  role = excluded.role,
  phone = excluded.phone,
  plan = excluded.plan,
  status = excluded.status;

insert into public.labour_categories (id, name, slug, demand_level, is_active)
values
  ('e2e-category-match', 'E2E Stitching', 'e2e-stitching', 'high', true),
  ('e2e-category-other', 'E2E Electrician', 'e2e-electrician', 'medium', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  demand_level = excluded.demand_level,
  is_active = excluded.is_active;

insert into public.labour_plans (
  id,
  audience,
  name,
  registration_fee,
  wallet_credit,
  plan_amount,
  validity_days,
  daily_charge,
  is_active,
  labour_category_ids,
  job_post_limit,
  plan_validity_days,
  job_post_live_days,
  display_order
) values (
  'e2e-order-company-plan',
  'company',
  'E2E Ordering Plan',
  0,
  0,
  0,
  365,
  0,
  true,
  array['e2e-category-match'],
  5,
  365,
  365,
  200001
)
on conflict (id) do update set
  name = excluded.name,
  is_active = excluded.is_active,
  labour_category_ids = excluded.labour_category_ids,
  job_post_limit = excluded.job_post_limit,
  plan_validity_days = excluded.plan_validity_days,
  job_post_live_days = excluded.job_post_live_days;

insert into public.labour_companies (
  id,
  company_name,
  contact_person,
  email,
  mobile,
  contact_mobile,
  city,
  category_ids,
  status,
  active_plan,
  created_at,
  updated_at
) values (
  'e2e-order-company',
  'Isolated Ordering Company',
  'Synthetic Owner',
  'isolated.preview.company@example.test',
  '8300000001',
  '8300000001',
  'Jaipur',
  array['e2e-category-match'],
  'active',
  'e2e-order-company-plan',
  '2026-09-19T08:00:00.000Z',
  '2026-09-19T08:00:00.000Z'
)
on conflict (id) do update set
  company_name = excluded.company_name,
  contact_person = excluded.contact_person,
  email = excluded.email,
  mobile = excluded.mobile,
  contact_mobile = excluded.contact_mobile,
  city = excluded.city,
  category_ids = excluded.category_ids,
  status = excluded.status,
  active_plan = excluded.active_plan,
  updated_at = excluded.updated_at;

insert into public.labour_companies (
  id,
  company_name,
  contact_person,
  email,
  mobile,
  contact_mobile,
  city,
  category_ids,
  status,
  active_plan,
  created_at,
  updated_at
) values (
  'e2e-foreign-company',
  'Isolated Foreign Company',
  'Synthetic Foreign Owner',
  'isolated.foreign.company@example.test',
  '8300000002',
  '8300000002',
  'Jaipur',
  array['e2e-category-match'],
  'active',
  'e2e-order-company-plan',
  '2026-09-19T08:00:00.000Z',
  '2026-09-19T08:00:00.000Z'
)
on conflict (id) do update set
  company_name = excluded.company_name,
  contact_person = excluded.contact_person,
  email = excluded.email,
  mobile = excluded.mobile,
  contact_mobile = excluded.contact_mobile,
  city = excluded.city,
  category_ids = excluded.category_ids,
  status = excluded.status,
  active_plan = excluded.active_plan,
  updated_at = excluded.updated_at;

insert into public.labour_job_posts (
  id,
  company_id,
  plan_id,
  category_id,
  title,
  city,
  workers_needed,
  wage_amount,
  validity_days,
  status,
  review_status,
  reviewed_at,
  published_at,
  expires_at,
  created_at,
  updated_at
) values (
  'e2e-order-live-job',
  'e2e-order-company',
  'e2e-order-company-plan',
  'e2e-category-match',
  'E2E Jaipur Stitching Requirement',
  'Jaipur',
  20,
  900,
  365,
  'live',
  'approved',
  '2026-09-19T08:30:00.000Z',
  '2026-09-19',
  '2027-09-19',
  '2026-09-19T08:30:00.000Z',
  '2026-09-19T08:30:00.000Z'
)
on conflict (id) do update set
  company_id = excluded.company_id,
  plan_id = excluded.plan_id,
  category_id = excluded.category_id,
  title = excluded.title,
  city = excluded.city,
  status = excluded.status,
  review_status = excluded.review_status,
  reviewed_at = excluded.reviewed_at,
  published_at = excluded.published_at,
  expires_at = excluded.expires_at,
  updated_at = excluded.updated_at;

insert into public.labour_job_posts (
  id,
  company_id,
  plan_id,
  category_id,
  title,
  city,
  workers_needed,
  wage_amount,
  validity_days,
  status,
  review_status,
  reviewed_at,
  published_at,
  expires_at,
  created_at,
  updated_at
) values
  (
    'e2e-foreign-live-job',
    'e2e-foreign-company',
    'e2e-order-company-plan',
    'e2e-category-match',
    'E2E Foreign Jaipur Requirement',
    'Jaipur',
    20,
    900,
    365,
    'live',
    'approved',
    '2026-09-19T08:35:00.000Z',
    '2026-09-19',
    '2027-09-19',
    '2026-09-19T08:35:00.000Z',
    '2026-09-19T08:35:00.000Z'
  ),
  (
    'e2e-expired-job',
    'e2e-order-company',
    'e2e-order-company-plan',
    'e2e-category-match',
    'E2E Expired Jaipur Requirement',
    'Jaipur',
    20,
    900,
    1,
    'live',
    'approved',
    '2026-09-17T08:35:00.000Z',
    '2026-09-17',
    '2026-09-18',
    '2026-09-17T08:35:00.000Z',
    '2026-09-17T08:35:00.000Z'
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  plan_id = excluded.plan_id,
  category_id = excluded.category_id,
  title = excluded.title,
  city = excluded.city,
  status = excluded.status,
  review_status = excluded.review_status,
  reviewed_at = excluded.reviewed_at,
  published_at = excluded.published_at,
  expires_at = excluded.expires_at,
  updated_at = excluded.updated_at;

delete from public.labour_workers where id like 'e2e-tier-%';

with tier_config as (
  select * from (values
    (1, 24, true,  true,  true),
    (2,  9, true,  true,  false),
    (3, 17, true,  false, true),
    (4,  8, true,  false, false),
    (5, 22, false, true,  true),
    (6,  7, false, true,  false),
    (7, 16, false, false, true),
    (8,  6, false, false, false)
  ) as tiers(tier, worker_count, category_match, city_match, active_worker)
),
expanded as (
  select
    tier,
    category_match,
    city_match,
    active_worker,
    generate_series(1, worker_count) as worker_number
  from tier_config
)
insert into public.labour_workers (
  id,
  full_name,
  mobile,
  city,
  home_city,
  address,
  preferred_work_locations,
  skills,
  experience_years,
  expected_daily_wage,
  minimum_expected_wage,
  maximum_expected_wage,
  status,
  availability,
  is_visible,
  category_ids,
  active_plan,
  plan_valid_until,
  identity_proof_type,
  identity_proof_number,
  identity_proof_path,
  registration_completed_at,
  registration_fee_paid,
  created_at,
  updated_at
)
select
  'e2e-tier-' || tier || '-' || lpad(worker_number::text, 3, '0'),
  'E2E T' || tier || ' Worker ' || lpad(worker_number::text, 3, '0'),
  '82' || lpad(((tier * 1000) + worker_number)::text, 8, '0'),
  case when city_match then 'Jaipur' else 'Ajmer' end,
  case when city_match then 'Jaipur' else 'Ajmer' end,
  'Synthetic isolated address',
  jsonb_build_array(jsonb_build_object(
    'stateLabel', 'Rajasthan',
    'cityLabels', jsonb_build_array(case when city_match then 'Jaipur' else 'Ajmer' end)
  )),
  array['Synthetic skill'],
  10 - tier,
  700 + tier,
  650 + tier,
  750 + tier,
  case when active_worker then 'active' else 'inactive_wallet_empty' end,
  case when active_worker then 'available_today' else 'not_available' end,
  true,
  array[case when category_match then 'e2e-category-match' else 'e2e-category-other' end],
  case when active_worker then 'e2e-worker-active-plan' else null end,
  case when active_worker then '2027-12-31'::date else null end,
  '',
  '',
  '',
  '2026-09-19T07:00:00.000Z',
  true,
  '2026-09-19T07:00:00.000Z'::timestamptz + ((tier * 1000 + worker_number) * interval '1 second'),
  '2026-09-19T07:00:00.000Z'
from expanded;

select
  count(*) as worker_count,
  count(distinct id) as distinct_worker_count,
  count(*) filter (where id like 'e2e-tier-1-%') as tier_1,
  count(*) filter (where id like 'e2e-tier-2-%') as tier_2,
  count(*) filter (where id like 'e2e-tier-3-%') as tier_3,
  count(*) filter (where id like 'e2e-tier-4-%') as tier_4,
  count(*) filter (where id like 'e2e-tier-5-%') as tier_5,
  count(*) filter (where id like 'e2e-tier-6-%') as tier_6,
  count(*) filter (where id like 'e2e-tier-7-%') as tier_7,
  count(*) filter (where id like 'e2e-tier-8-%') as tier_8
from public.labour_workers
where id like 'e2e-tier-%';
