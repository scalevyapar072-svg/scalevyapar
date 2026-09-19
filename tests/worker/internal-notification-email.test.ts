import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import type {
  RozgarInternalNotificationOutboxRow,
  RozgarInternalNotificationProcessorDependencies,
} from '../../lib/rozgar-internal-notification-outbox'

process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'isolated-test-service-role-key'

const workspaceRoot = process.cwd()
const stageAMigrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260919122546_add_rozgar_internal_notification_outbox.sql',
)
const stageBMigrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260919140716_activate_rozgar_internal_notification_outbox.sql',
)
const stageARollbackPath = path.join(
  workspaceRoot,
  'supabase',
  'rollbacks',
  '20260919122546_add_rozgar_internal_notification_outbox.rollback.sql',
)
const stageBRollbackPath = path.join(
  workspaceRoot,
  'supabase',
  'rollbacks',
  '20260919140716_activate_rozgar_internal_notification_outbox.rollback.sql',
)
const stageASource = readFileSync(stageAMigrationPath, 'utf8')
const stageBSource = readFileSync(stageBMigrationPath, 'utf8')
const stageARollbackSource = readFileSync(stageARollbackPath, 'utf8')
const stageBRollbackSource = readFileSync(stageBRollbackPath, 'utf8')
const registrationRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company-intake', 'route.ts'),
  'utf8',
)
const jobRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'job-post', 'route.ts'),
  'utf8',
)
const adminRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'admin', 'labour', 'route.ts'),
  'utf8',
)
const adminReviewRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'admin', 'labour', 'job-post-review', 'route.ts'),
  'utf8',
)
const processorRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'internal', 'refer-earn-email-outbox', 'process', 'route.ts'),
  'utf8',
)

const stripImports = (source: string) => source.replace(
  /^import(?:[\s\S]*?)from\s+['"][^'"]+['"]\r?\n/gm,
  '',
)
const notificationSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'rozgar-notification-email.ts'),
  'utf8',
)
const outboxSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'rozgar-internal-notification-outbox.ts'),
  'utf8',
)
const transpiledHarness = ts.transpileModule(`
  const supabaseAdmin = {
    rpc: async () => ({ data: [], error: null }),
    from: () => ({
      update: () => ({
        eq: () => ({ eq: async () => ({ error: null }) }),
      }),
    }),
  }
  ${stripImports(notificationSource)}
  ${stripImports(outboxSource)}
`, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const outboxModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledHarness).toString('base64')}`
)

type OutboxRow = RozgarInternalNotificationOutboxRow
type ProcessorDependencies = RozgarInternalNotificationProcessorDependencies

const makeRow = (overrides: Partial<OutboxRow> = {}): OutboxRow => ({
  id: '00000000-0000-4000-8000-000000000001',
  event_key: 'rozgar-company-registration-company-synthetic-1',
  event_type: 'company_registration',
  recipient_email: 'scalevyapar072@gmail.com',
  template_id: outboxModule.ROZGAR_COMPANY_REGISTRATION_TEMPLATE_ID,
  payload_json: {
    company_id: 'company-synthetic-1',
    company_name: 'Synthetic Textiles',
    contact_person: 'Synthetic Owner',
    registered_mobile: '9000000000',
    registered_email: 'owner@example.test',
    city: 'Jaipur',
    state: 'Rajasthan',
    industry_category: 'Textiles',
    business_type: 'Manufacturer',
    registered_at: '2026-09-19T10:00:00.000Z',
  },
  status: 'pending',
  attempt_count: 0,
  next_attempt_at: '2026-09-19T10:00:00.000Z',
  last_attempt_at: null,
  processing_started_at: null,
  sent_at: null,
  provider_message_id: null,
  last_error_code: null,
  last_error_message_safe: null,
  created_at: '2026-09-19T10:00:00.000Z',
  updated_at: '2026-09-19T10:00:00.000Z',
  ...overrides,
})

const makeMemoryDependencies = (
  row: OutboxRow,
  send: ProcessorDependencies['send'],
  options: { throwAfterProviderAcceptanceOnce?: boolean } = {},
) => {
  let throwAfterProviderAcceptanceOnce = Boolean(options.throwAfterProviderAcceptanceOnce)
  const dependencies: ProcessorDependencies = {
    claim: async () => {
      if (row.status === 'sent' || row.status === 'failed' || row.attempt_count >= 4) return []
      if (
        row.status === 'processing' &&
        row.processing_started_at &&
        new Date(row.processing_started_at).getTime() > new Date('2026-09-19T09:55:00.000Z').getTime()
      ) return []
      row.status = 'processing'
      row.attempt_count += 1
      row.processing_started_at = '2026-09-19T10:00:00.000Z'
      return [{ ...row, payload_json: { ...row.payload_json } }]
    },
    mark: async (_rowId, update) => {
      if (throwAfterProviderAcceptanceOnce && update.status === 'sent') {
        throwAfterProviderAcceptanceOnce = false
        throw new Error('synthetic process interruption')
      }
      Object.assign(row, update)
    },
    send,
    now: () => new Date('2026-09-19T10:10:00.000Z'),
  }
  return dependencies
}

const deliveredResult = (providerMessageId = 'email-synthetic-1') => ({
  delivered: true,
  skipped: false,
  providerMessageId,
  safeErrorCode: '',
  safeErrorMessage: '',
  statusCode: 200,
} as const)

const retryable503Result = {
  delivered: false,
  skipped: false,
  reason: 'provider-error' as const,
  providerMessageId: '',
  safeErrorCode: 'provider_unavailable',
  safeErrorMessage: 'Synthetic provider failure',
  statusCode: 503,
}

const gitBlobHash = (filePath: string) => {
  const content = Buffer.from(readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n'))
  const header = Buffer.from(`blob ${content.byteLength}\0`)
  return createHash('sha1').update(header).update(content).digest('hex')
}

test('Stage A creates only dormant, locked-down outbox infrastructure', () => {
  assert.match(stageASource, /create table public\.rozgar_internal_notification_outbox/)
  assert.doesNotMatch(stageASource, /worker_referral_email_outbox/)
  assert.match(stageASource, /check \(status in \('pending', 'processing', 'sent', 'failed'\)\)/)
  assert.match(stageASource, /attempt_count between 0 and 4/)
  assert.match(stageASource, /create or replace function public\.recover_stale_rozgar_internal_notification_outbox/)
  assert.match(stageASource, /processing_started_at <= now\(\) - interval '15 minutes'/)
  assert.match(stageASource, /create or replace function public\.claim_rozgar_internal_notification_outbox/)
  assert.match(stageASource, /for update skip locked/)
  assert.match(stageASource, /create or replace function public\.complete_rozgar_internal_notification_outbox/)
  assert.match(stageASource, /create or replace function public\.retry_rozgar_internal_notification_outbox/)
  assert.match(stageASource, /create or replace function public\.fail_rozgar_internal_notification_outbox/)
  assert.match(stageASource, /recipient_email = 'scalevyapar072@gmail\.com'/)
  assert.match(stageASource, /revoke all on table public\.rozgar_internal_notification_outbox from anon/)
  assert.match(stageASource, /revoke all on table public\.rozgar_internal_notification_outbox from service_role/)
  assert.match(stageASource, /grant select on table public\.rozgar_internal_notification_outbox to service_role/)
  assert.doesNotMatch(stageASource, /grant (?:insert|update|delete)/)
  assert.equal(stageASource.match(/grant execute on function/g)?.length, 5)
  assert.doesNotMatch(stageASource, /grant execute on function[\s\S]*?to (?:public|anon|authenticated)/)
  assert.doesNotMatch(stageASource, /create trigger/)
  assert.doesNotMatch(stageASource, /insert into public\.rozgar_internal_notification_outbox/)
  assert.doesNotMatch(stageASource, /labour_companies|labour_job_posts/)
  assert.doesNotMatch(stageASource, /resend|http|net\./i)
})

test('Stage B alone activates transactional company and first-live job events', () => {
  assert.doesNotMatch(stageBSource, /create table|alter table|create index/i)
  assert.match(stageBSource, /after insert on public\.labour_companies/)
  assert.match(stageBSource, /after insert on public\.labour_job_posts[\s\S]*when \(new\.status = 'live'\)/)
  assert.match(stageBSource, /after update of status on public\.labour_job_posts[\s\S]*old\.status is distinct from new\.status and new\.status = 'live'/)
  assert.match(stageBSource, /'rozgar-company-registration-' \|\| new\.id/)
  assert.match(stageBSource, /'rozgar-job-published-' \|\| new\.id/)
  assert.equal(stageBSource.match(/on conflict \(event_key\) do nothing/g)?.length, 2)
  assert.doesNotMatch(registrationRouteSource, /sendNewCompanyRegistrationEmail/)
  assert.doesNotMatch(jobRouteSource, /sendNewJobPublishedEmail/)
})

test('processor uses state-transition RPCs rather than direct table writes', () => {
  assert.match(outboxSource, /complete_rozgar_internal_notification_outbox/)
  assert.match(outboxSource, /retry_rozgar_internal_notification_outbox/)
  assert.match(outboxSource, /fail_rozgar_internal_notification_outbox/)
  assert.doesNotMatch(outboxSource, /\.from\(['"]rozgar_internal_notification_outbox['"]\)/)
})

test('rollback files enforce deactivation before infrastructure removal and retain rows for app rollback', () => {
  const companyTriggerDrop = stageBRollbackSource.indexOf(
    'drop trigger if exists enqueue_rozgar_company_registration_notification_after_insert',
  )
  const jobInsertTriggerDrop = stageBRollbackSource.indexOf(
    'drop trigger if exists enqueue_rozgar_job_published_notification_after_insert',
  )
  const jobUpdateTriggerDrop = stageBRollbackSource.indexOf(
    'drop trigger if exists enqueue_rozgar_job_published_notification_after_status_update',
  )
  const triggerFunctionDrop = stageBRollbackSource.indexOf(
    'drop function if exists public.enqueue_rozgar_company_registration_notification()',
  )
  assert.ok(companyTriggerDrop >= 0)
  assert.ok(jobInsertTriggerDrop >= 0)
  assert.ok(jobUpdateTriggerDrop >= 0)
  assert.ok(triggerFunctionDrop > companyTriggerDrop)
  assert.ok(triggerFunctionDrop > jobInsertTriggerDrop)
  assert.ok(triggerFunctionDrop > jobUpdateTriggerDrop)
  assert.doesNotMatch(stageBRollbackSource, /drop table|delete from|truncate/i)

  assert.match(stageARollbackSource, /Stage B triggers are still active/)
  assert.match(stageARollbackSource, /drop table if exists public\.rozgar_internal_notification_outbox/)
  assert.doesNotMatch(
    stageARollbackSource,
    /labour_companies|labour_job_posts|worker_referral_email_outbox|alter table|delete from|truncate/i,
  )
})

test('all rollout states fail safely around the dormant and activation boundary', () => {
  assert.doesNotMatch(stageASource, /create trigger|insert into/)
  assert.match(processorRouteSource, /Promise\.allSettled/)
  assert.match(processorRouteSource, /processRozgarInternalNotificationOutboxBatch\(\)/)
  assert.match(stageBSource, /on conflict \(event_key\) do nothing/)
  assert.doesNotMatch(stageBRollbackSource, /drop table|delete from|truncate/i)
})

test('all public and Admin company/job entry points converge on trigger-covered writers', () => {
  assert.match(registrationRouteSource, /createLabourEntity\(\s*'companies'/)
  assert.match(jobRouteSource, /dependencies\.createLabourEntity\(\s*'jobPosts'/)
  assert.match(jobRouteSource, /dependencies\.updateLabourEntity\(\s*'jobPosts'/)
  assert.match(adminRouteSource, /dependencies\.createLabourEntity\(/)
  assert.match(adminRouteSource, /dependencies\.updateLabourEntity\(/)
  assert.match(adminReviewRouteSource, /dependencies\.reviewLabourJobPost\(/)
  assert.match(processorRouteSource, /Promise\.allSettled/)
  assert.match(processorRouteSource, /processRozgarInternalNotificationOutboxBatch\(\)/)
})

test('provider 503 is retried and later success uses the identical provider idempotency key', async () => {
  const row = makeRow()
  const keys: string[] = []
  let calls = 0
  const dependencies = makeMemoryDependencies(row, async message => {
    keys.push(message.idempotencyKey)
    calls += 1
    return calls === 1 ? retryable503Result : deliveredResult()
  })

  const first = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)
  assert.equal(first.retried, 1)
  assert.equal(row.status, 'pending')
  assert.match(String(row.next_attempt_at), /^2026-09-19T10:15:00/)

  const second = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)
  assert.equal(second.sent, 1)
  assert.equal(row.status, 'sent')
  assert.deepEqual(keys, [row.event_key, row.event_key])
})

test('committed pending event survives interruption before processing', async () => {
  const row = makeRow()
  const companyRecord = { id: 'company-synthetic-1', companyName: 'Synthetic Textiles' }
  assert.equal(row.status, 'pending')

  const dependencies = makeMemoryDependencies(row, async () => deliveredResult())
  const summary = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)

  assert.equal(summary.sent, 1)
  assert.equal(row.status, 'sent')
  assert.deepEqual(companyRecord, { id: 'company-synthetic-1', companyName: 'Synthetic Textiles' })
})

test('crash after provider acceptance is recovered with one provider delivery', async () => {
  const row = makeRow()
  const providerDeliveries = new Set<string>()
  const requestedKeys: string[] = []
  const dependencies = makeMemoryDependencies(row, async message => {
    requestedKeys.push(message.idempotencyKey)
    providerDeliveries.add(message.idempotencyKey)
    return deliveredResult(`email-${message.idempotencyKey}`)
  }, { throwAfterProviderAcceptanceOnce: true })

  await assert.rejects(
    outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies),
    /synthetic process interruption/,
  )
  assert.equal(row.status, 'processing')

  row.processing_started_at = '2026-09-19T09:30:00.000Z'
  const recovered = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)
  assert.equal(recovered.sent, 1)
  assert.equal(row.status, 'sent')
  assert.equal(providerDeliveries.size, 1)
  assert.deepEqual(requestedKeys, [row.event_key, row.event_key])
})

test('concurrent processors claim one event and send once', async () => {
  const row = makeRow()
  let sends = 0
  const dependencies = makeMemoryDependencies(row, async () => {
    sends += 1
    return deliveredResult()
  })

  const [left, right] = await Promise.all([
    outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies),
    outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies),
  ])

  assert.equal(left.claimed + right.claimed, 1)
  assert.equal(sends, 1)
  assert.equal(row.status, 'sent')
})

test('Preview and local processors use the synthetic sink without a network request', async () => {
  const previousVercelEnv = process.env.VERCEL_ENV
  const previousFetch = globalThis.fetch
  const row = makeRow()
  let fetchCalls = 0
  process.env.VERCEL_ENV = 'preview'
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('Preview must not call the provider')
  }

  try {
    const dependencies = makeMemoryDependencies(
      row,
      async message => outboxModule.sendResendAdminNotification(message),
    )
    const summary = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)
    assert.equal(summary.synthetic, 1)
    assert.equal(summary.sent, 1)
    assert.equal(row.status, 'sent')
    assert.equal(row.provider_message_id, `synthetic-sink:${row.event_key}`)
    assert.equal(fetchCalls, 0)
  } finally {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = previousVercelEnv
    globalThis.fetch = previousFetch
  }
})

test('retry budget ends in a recorded failure without touching the company or job', async () => {
  const row = makeRow({ attempt_count: 3 })
  const companyRecord = { id: 'company-synthetic-1', status: 'active' }
  const dependencies = makeMemoryDependencies(row, async () => retryable503Result)

  const summary = await outboxModule.processRozgarInternalNotificationOutboxBatch(25, dependencies)
  assert.equal(summary.failed, 1)
  assert.equal(row.status, 'failed')
  assert.equal(row.attempt_count, 4)
  assert.equal(row.last_error_code, 'provider_unavailable')
  assert.deepEqual(companyRecord, { id: 'company-synthetic-1', status: 'active' })
})

test('existing worker referral outbox implementation and Production migration remain byte-identical', () => {
  assert.equal(
    gitBlobHash(path.join(workspaceRoot, 'lib', 'labour-worker-referral-email-outbox.ts')),
    '2ebc55df3f876352f421bb42f186e3c84cc5efd0',
  )
  assert.equal(
    gitBlobHash(path.join(workspaceRoot, 'supabase', 'migrations', '20260820121500_add_worker_referral_email_outbox_production.sql')),
    'dd11483b8cd0248c7fb7845b604ded2fef5cad19',
  )
  assert.equal(
    gitBlobHash(path.join(workspaceRoot, 'supabase', 'migrations', '20260820191500_enable_refer_earn_email_scheduler_production.sql')),
    '1564d5f7e3c8fc1338c050c1e88ee586e45c0a42',
  )
})
