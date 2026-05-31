create table if not exists public.clients (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('ADMIN', 'CLIENT')),
  phone text,
  plan text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'coming_soon')),
  type text,
  icon text,
  href text,
  customer_link text,
  features text[] not null default '{}',
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_modules (
  client_id text not null,
  module_id text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (client_id, module_id),
  constraint client_modules_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete cascade,
  constraint client_modules_module_id_fkey
    foreign key (module_id) references public.modules(id) on delete cascade
);

create table if not exists public.login_page_settings (
  id text primary key,
  settings_json jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_role on public.clients(role);
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_modules_status on public.modules(status);
create index if not exists idx_modules_is_active on public.modules(is_active);
create index if not exists idx_client_modules_client_id on public.client_modules(client_id);
create index if not exists idx_client_modules_module_id on public.client_modules(module_id);

insert into public.modules (
  id,
  name,
  slug,
  description,
  status,
  type,
  icon,
  href,
  customer_link,
  features,
  color,
  is_active
)
values
  (
    'mod-leads',
    'Leads',
    'leads',
    'Lead generation and public business data workflows.',
    'active',
    'Growth',
    'LD',
    '/leads',
    '',
    array['Google Maps scraping', 'Business listing capture', 'CSV export'],
    '#0f766e',
    true
  ),
  (
    'mod-labour',
    'Labour Marketplace',
    'labour',
    'Company-side labour marketplace and hiring workflows.',
    'active',
    'Operations',
    'LB',
    '/labour/company',
    '',
    array['Company intake', 'Worker search', 'Marketplace dashboard'],
    '#92400e',
    true
  ),
  (
    'mod-vizora',
    'Vizora',
    'vizora',
    'AI content generation and creative media tooling.',
    'active',
    'Creative',
    'VZ',
    '/vizora',
    '',
    array['AI image generation', 'Upscaling', 'Creative workspace'],
    '#1d4ed8',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  type = excluded.type,
  icon = excluded.icon,
  href = excluded.href,
  customer_link = excluded.customer_link,
  features = excluded.features,
  color = excluded.color,
  is_active = excluded.is_active;

insert into public.login_page_settings (id, settings_json, updated_at)
values (
  'login-page-settings',
  jsonb_build_object(
    'headline', 'Scale Your Business with Automation',
    'subtitle', 'The all-in-one platform for lead generation, CRM, WhatsApp automation, and inventory management.',
    'features', jsonb_build_array(
      jsonb_build_object('icon', '🎯', 'text', 'Google B2B Lead Extraction'),
      jsonb_build_object('icon', '💬', 'text', 'WhatsApp Automation'),
      jsonb_build_object('icon', '👥', 'text', 'CRM & Call Management'),
      jsonb_build_object('icon', '📦', 'text', 'Inventory Management'),
      jsonb_build_object('icon', '📸', 'text', 'AI Photo & Video Generation')
    )
  ),
  now()
)
on conflict (id) do nothing;
