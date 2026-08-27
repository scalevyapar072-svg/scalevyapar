import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()
const migrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260827133714_add_worker_razorpay_wallet_credit_rpc.sql',
)

const readMigrationSource = () => readFileSync(migrationPath, 'utf8')

const stripSqlComments = (source: string) =>
  source
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

test('worker wallet-credit RPC migration exists at the approved repository path', () => {
  assert.equal(existsSync(migrationPath), true)
})

test('worker wallet-credit RPC migration defines the approved signature security model and narrow output contract', () => {
  const source = readMigrationSource()

  for (const fragment of [
    'create or replace function public.apply_verified_worker_razorpay_credit(',
    'p_worker_id text',
    'p_provider text',
    'p_provider_order_id text',
    'p_provider_payment_id text',
    'p_provider_amount_paise bigint',
    'p_provider_currency text',
    'p_provider_status text',
    'p_idempotency_key text',
    'returns table (',
    'outcome text',
    'payment_attempt_id uuid',
    'wallet_transaction_id uuid',
    'resulting_wallet_balance numeric(10, 2)',
    'language plpgsql',
    'security invoker',
    'set search_path = public',
    "if v_provider <> 'razorpay' then",
    "if v_provider_status <> 'captured' then",
    "if v_provider_currency <> 'INR' then",
    'if p_provider_amount_paise is null or p_provider_amount_paise <= 0 then',
    'if v_idempotency_key = \'\' then',
    'v_amount_rupees_raw := p_provider_amount_paise::numeric / 100::numeric;',
    'if v_amount_rupees_raw <> round(v_amount_rupees_raw, 2) then',
    'if v_amount_rupees_raw >= 100000000::numeric then',
    'select *',
    'from public.labour_workers',
    'for update;',
    'from public.labour_worker_payment_attempts',
    'provider_payment_id = v_provider_payment_id',
    'idempotency_key = v_idempotency_key',
    "provider_order_id = v_provider_order_id",
    "application_status = 'applied'",
    "'already_applied'::text",
    "'applied'::text",
    'gen_random_uuid()',
    'insert into public.labour_wallet_transactions',
    "'wallet_recharge'",
    "'completed'",
    "'worker'",
    "'credit'",
    "'Razorpay wallet recharge ' || v_provider_payment_id || '. Order ' || v_provider_order_id || '.'",
    'update public.labour_workers',
    'wallet_balance = v_target_balance',
    'update public.labour_worker_payment_attempts',
    "application_status = 'verified'",
    "application_status = 'applied'",
    'wallet_transaction_id = v_wallet_transaction_id',
    'verified_at = coalesce(verified_at, v_now)',
    'applied_at = v_now',
    'revoke execute on function public.apply_verified_worker_razorpay_credit(',
    ') from public;',
    ') from anon;',
    ') from authenticated;',
    ') to service_role;',
  ]) {
    assert.ok(source.includes(fragment), `Expected migration to include: ${fragment}`)
  }
})

test('worker wallet-credit RPC migration preserves authoritative live ledger values and omits unused legacy nullable fields', () => {
  const source = readMigrationSource().toLowerCase()
  const walletInsertColumns = source.match(/insert into public\.labour_wallet_transactions\s*\(([\s\S]*?)\)\s*values/)

  assert.ok(walletInsertColumns, 'Expected a labour_wallet_transactions insert column list')

  const insertColumns = walletInsertColumns[1]

  for (const fragment of [
    "type,",
    "transaction_type,",
    "status,",
    "direction,",
    "entity_type,",
    "entity_id,",
    "entity_name,",
    "reference,",
    "note",
    "'wallet_recharge'",
    "'completed'",
    "'worker'",
    "'credit'",
    ]) {
    assert.equal(source.includes(fragment), true, `Expected authoritative ledger contract fragment: ${fragment}`)
  }

  for (const fragment of [
    'worker_id,',
    'description,',
    'reference_id,',
    'performed_by',
  ]) {
    assert.equal(insertColumns.includes(fragment), false, `Expected wallet insert to omit legacy/unsupported write fragment: ${fragment}`)
  }
})

test('worker wallet-credit RPC migration encodes exact retry, identifier-conflict, and atomic single-credit protections', () => {
  const source = readMigrationSource().toLowerCase()

  for (const fragment of [
    'provider_payment_conflict',
    'idempotency_key_conflict',
    'provider_order_conflict',
    'payment_attempt_identity_conflict',
    'payment_attempt_apply_conflict',
    'applied_wallet_transaction_integrity_conflict',
    'when unique_violation then',
    'v_attempt_by_payment',
    'v_attempt_by_idempotency',
    'v_attempt_by_applied_order',
    'v_applied_attempt',
    'v_applied_wallet_transaction',
    'v_attempt_to_apply',
    'v_attempt_by_payment.idempotency_key is distinct from v_idempotency_key',
    'v_attempt_by_applied_order.idempotency_key is distinct from v_idempotency_key',
    'v_applied_attempt.wallet_transaction_id is null',
    'from public.labour_wallet_transactions',
    'where id = v_applied_attempt.wallet_transaction_id',
    "v_applied_wallet_transaction.balance_after is null",
    "v_applied_wallet_transaction.entity_type is distinct from 'worker'",
    "v_applied_wallet_transaction.entity_id is distinct from v_applied_attempt.worker_id",
    "v_applied_wallet_transaction.transaction_type is distinct from 'wallet_recharge'",
    "v_applied_wallet_transaction.type is distinct from 'wallet_recharge'",
    "v_applied_wallet_transaction.direction is distinct from 'credit'",
    "v_applied_wallet_transaction.status is distinct from 'completed'",
    'v_applied_wallet_transaction.amount is distinct from v_amount_rupees',
    'v_applied_wallet_transaction.reference is distinct from v_applied_attempt.provider_order_id',
    'v_applied_wallet_transaction.balance_after',
    'return query',
    'wallet_balance = v_target_balance',
    'wallet_transaction_id = v_wallet_transaction_id',
  ]) {
    assert.equal(source.includes(fragment), true, `Expected retry/conflict protection fragment: ${fragment}`)
  }

  assert.equal((source.match(/insert into public\.labour_wallet_transactions/g) || []).length, 1)
  assert.equal((source.match(/update public\.labour_workers/g) || []).length, 1)
  assert.equal((source.match(/update public\.labour_worker_payment_attempts/g) || []).length >= 1, true)
  assert.equal(source.includes('v_attempt_by_payment.wallet_transaction_id,\n      v_existing_balance'), false)
  assert.equal(source.includes('v_attempt_by_idempotency.wallet_transaction_id,\n      v_existing_balance'), false)
  assert.equal(source.includes('v_attempt_by_applied_order.wallet_transaction_id,\n      v_existing_balance'), false)
  assert.equal(source.includes('update public.labour_wallet_transactions'), false)
  assert.equal(source.includes('delete from public.labour_wallet_transactions'), false)
})

test('worker wallet-credit RPC migration excludes registration-fee lifecycle plan notification and network side effects', () => {
  const source = readMigrationSource().toLowerCase()
  const uncommented = stripSqlComments(source.toLowerCase())

  for (const fragment of [
    'registration_fee_paid',
    'registration fee',
    'is_visible',
    'visibility',
    'deriveworkerstatus',
    'inactive_wallet_empty',
    'inactive_subscription_expired',
    'inactive_paused_by_worker',
    'active_plan',
    'plan_valid_from',
    'plan_valid_until',
    'sendpaymentreceivedemail',
    'dashboard',
    'meta',
    '/messages',
    'http',
    'fetch(',
    'razorpay.orders',
    'razorpay.payments',
    'createorder',
  ]) {
    assert.equal(uncommented.includes(fragment), false, `Expected migration to exclude: ${fragment}`)
  }

  assert.equal(uncommented.includes('alter table public.labour_workers'), false)
  assert.equal(uncommented.includes('alter table public.labour_wallet_transactions'), false)
  assert.equal(uncommented.includes('alter table public.labour_worker_payment_attempts'), false)
  assert.equal(uncommented.includes('create policy'), false)
  assert.equal(uncommented.includes('security definer'), false)
})
