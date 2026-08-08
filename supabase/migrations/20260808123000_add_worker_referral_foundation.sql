-- Rozgar Refer & Earn Phase 1 foundation.
-- Additive only: no existing worker, wallet, KYC, payment, or category table behavior is changed.

create table if not exists public.worker_referral_profiles (
  id text primary key,
  worker_id text not null,
  referral_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referral_profiles_worker_id_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_profiles_worker_id_key unique (worker_id),
  constraint worker_referral_profiles_referral_code_key unique (referral_code),
  constraint worker_referral_profiles_referral_code_format_check
    check (referral_code ~ '^RZG[A-Z0-9]{8}$')
);

create table if not exists public.worker_referral_category_eligibility (
  id text primary key,
  referral_profile_id text not null,
  category_id text not null,
  reward_amount numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referral_category_eligibility_profile_fkey
    foreign key (referral_profile_id)
    references public.worker_referral_profiles(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_category_eligibility_category_fkey
    foreign key (category_id)
    references public.labour_categories(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_category_eligibility_profile_category_key
    unique (referral_profile_id, category_id),
  constraint worker_referral_category_eligibility_reward_amount_check
    check (reward_amount >= 0)
);

create table if not exists public.worker_referrals (
  id text primary key,
  referrer_worker_id text not null,
  referred_worker_id text not null,
  referral_profile_id text not null,
  referral_code_snapshot text not null,
  category_id text not null,
  reward_amount_snapshot numeric(12, 2) not null default 0,
  referral_status text not null default 'attributed',
  reward_status text not null default 'pending',
  attributed_at timestamptz not null default now(),
  registered_at timestamptz,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  rejected_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_referrals_referrer_worker_fkey
    foreign key (referrer_worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referrals_referred_worker_fkey
    foreign key (referred_worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referrals_profile_fkey
    foreign key (referral_profile_id)
    references public.worker_referral_profiles(id)
    on update restrict
    on delete restrict,
  constraint worker_referrals_category_fkey
    foreign key (category_id)
    references public.labour_categories(id)
    on update restrict
    on delete restrict,
  constraint worker_referrals_referred_worker_id_key unique (referred_worker_id),
  constraint worker_referrals_no_self_referral_check
    check (referrer_worker_id <> referred_worker_id),
  constraint worker_referrals_reward_amount_snapshot_check
    check (reward_amount_snapshot >= 0),
  constraint worker_referrals_referral_status_check
    check (referral_status in (
      'attributed',
      'registered',
      'kyc_pending',
      'qualified',
      'rejected',
      'reward_credited',
      'invalid'
    )),
  constraint worker_referrals_reward_status_check
    check (reward_status in ('pending', 'available', 'reversed'))
);

create table if not exists public.worker_referral_ledger (
  id text primary key,
  worker_id text not null,
  referral_id text not null,
  entry_type text not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null default 0,
  status text not null default 'pending',
  reference text not null,
  remarks text,
  created_at timestamptz not null default now(),
  constraint worker_referral_ledger_worker_fkey
    foreign key (worker_id)
    references public.labour_workers(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_ledger_referral_fkey
    foreign key (referral_id)
    references public.worker_referrals(id)
    on update restrict
    on delete restrict,
  constraint worker_referral_ledger_reference_key unique (reference),
  constraint worker_referral_ledger_entry_type_check
    check (entry_type in ('reward_credit', 'reward_reversal')),
  constraint worker_referral_ledger_amount_check
    check (amount > 0),
  constraint worker_referral_ledger_balance_after_check
    check (balance_after >= 0),
  constraint worker_referral_ledger_status_check
    check (status in ('pending', 'available', 'reversed'))
);

create index if not exists worker_referral_profiles_worker_id_idx
  on public.worker_referral_profiles(worker_id);

create index if not exists worker_referral_profiles_referral_code_idx
  on public.worker_referral_profiles(referral_code);

create index if not exists worker_referral_category_eligibility_profile_idx
  on public.worker_referral_category_eligibility(referral_profile_id);

create index if not exists worker_referral_category_eligibility_category_idx
  on public.worker_referral_category_eligibility(category_id);

create index if not exists worker_referrals_referrer_worker_idx
  on public.worker_referrals(referrer_worker_id);

create index if not exists worker_referrals_referred_worker_idx
  on public.worker_referrals(referred_worker_id);

create index if not exists worker_referral_ledger_worker_created_idx
  on public.worker_referral_ledger(worker_id, created_at desc);

create index if not exists worker_referral_ledger_referral_idx
  on public.worker_referral_ledger(referral_id);

alter table public.worker_referral_profiles enable row level security;
alter table public.worker_referral_category_eligibility enable row level security;
alter table public.worker_referrals enable row level security;
alter table public.worker_referral_ledger enable row level security;

comment on table public.worker_referral_profiles is
  'Rozgar Refer & Earn: one permanent server-generated referral code per worker.';
comment on table public.worker_referral_category_eligibility is
  'Rozgar Refer & Earn: active existing labour categories eligible for a referrer and reward amount.';
comment on table public.worker_referrals is
  'Rozgar Refer & Earn: immutable Worker 1 to Worker 2 attribution with category and reward snapshots.';
comment on table public.worker_referral_ledger is
  'Rozgar Refer & Earn: separate append-only referral earnings ledger; does not affect labour_wallet_transactions.';
