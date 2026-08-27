import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()
const migrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260827130053_worker_payment_attempt_foundation.sql',
)

const readMigrationSource = () => readFileSync(migrationPath, 'utf8')

const stripSqlComments = (source: string) =>
  source
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

test('worker payment-attempt foundation migration exists at the approved repository path', () => {
  assert.equal(existsSync(migrationPath), true)
})

test('worker payment-attempt foundation migration defines the approved table, columns, constraints, and security model', () => {
  const source = readMigrationSource()

  for (const fragment of [
    'create table public.labour_worker_payment_attempts',
    'id uuid primary key default gen_random_uuid()',
    'worker_id text not null',
    'provider text not null',
    'provider_order_id text not null',
    'provider_payment_id text',
    'provider_currency text not null',
    'provider_amount_paise bigint not null',
    'provider_status text not null',
    'idempotency_key text not null',
    "application_status text not null default 'created'",
    'wallet_transaction_id text',
    'failure_category text',
    'verified_at timestamptz',
    'applied_at timestamptz',
    'created_at timestamptz not null default now()',
    'updated_at timestamptz not null default now()',
    'references public.labour_workers(id)',
    'references public.labour_wallet_transactions(id)',
    "check (provider in ('razorpay'))",
    "check (provider_currency = 'INR')",
    'check (provider_amount_paise > 0)',
    "check (application_status in ('created', 'verified', 'applied', 'failed'))",
    "failure_category ~ '^[a-z0-9_]+$'",
    'create unique index idx_labour_worker_payment_attempts_provider_payment_id',
    'create unique index idx_labour_worker_payment_attempts_idempotency_key',
    'create unique index idx_labour_worker_payment_attempts_applied_provider_order',
    'create unique index idx_labour_worker_payment_attempts_wallet_transaction_id',
    "where provider_payment_id is not null",
    "where application_status = 'applied'",
    'where wallet_transaction_id is not null',
    "application_status not in ('verified', 'applied')",
    "application_status <> 'applied'",
    "application_status <> 'failed'",
    'create or replace function public.labour_worker_payment_attempts_prevent_identity_mutation()',
    'returns trigger',
    "set search_path = ''",
    'create trigger labour_worker_payment_attempts_identity_immutable_trigger',
    'alter table public.labour_worker_payment_attempts enable row level security',
    'revoke all on function public.labour_worker_payment_attempts_prevent_identity_mutation()',
    'revoke all on table public.labour_worker_payment_attempts',
    'from public, anon, authenticated',
    'grant select, insert, update, references',
    'to service_role',
  ]) {
    assert.ok(source.includes(fragment), `Expected migration to include: ${fragment}`)
  }
})

test('worker payment-attempt foundation migration keeps browser roles and public policies disabled', () => {
  const source = readMigrationSource().toLowerCase()

  assert.equal(source.includes('create policy'), false)
  assert.equal(source.includes('to anon'), false)
  assert.equal(source.includes('to authenticated'), false)
  assert.equal(source.includes('auth.role()'), false)
  assert.equal(source.includes('user_metadata'), false)
  assert.equal(source.includes('security definer'), false)
})

test('worker payment-attempt foundation migration excludes signatures secrets raw payload columns and runtime side effects', () => {
  const source = readMigrationSource().toLowerCase()
  const uncommented = stripSqlComments(source)

  for (const fragment of [
    'razorpay_signature',
    'provider_signature',
    'signature_hash',
    'raw_provider_payload',
    'provider_payload',
    'full_provider_payload',
    'provider_secret',
    'access_key',
    'key_secret',
    'wallet_balance',
    'registration_fee_paid',
    'is_visible',
  ]) {
    assert.equal(source.includes(fragment), false, `Expected migration to exclude: ${fragment}`)
  }

  assert.equal((source.match(/create or replace function/g) || []).length, 1)
  assert.equal(uncommented.includes('insert into '), false)
  assert.equal(uncommented.includes('delete from '), false)
  assert.equal(uncommented.includes('update public.labour_workers'), false)
  assert.equal(uncommented.includes('update public.labour_wallet_transactions'), false)
  assert.equal(uncommented.includes('alter table public.labour_workers'), false)
  assert.equal(uncommented.includes('alter table public.labour_wallet_transactions'), false)
  assert.equal(uncommented.includes('alter table if exists public.labour_workers'), false)
  assert.equal(uncommented.includes('alter table if exists public.labour_wallet_transactions'), false)
  assert.equal(uncommented.includes('insert into public.labour_wallet_transactions'), false)
  assert.equal(uncommented.includes('insert into public.labour_workers'), false)
})
