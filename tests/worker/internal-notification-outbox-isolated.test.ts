import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ts from 'typescript'

const isolatedUrl = String(process.env.ISOLATED_SUPABASE_URL || '').trim()
const isolatedServiceKey = String(process.env.ISOLATED_SUPABASE_SERVICE_ROLE_KEY || '').trim()
const isolatedProjectRef = String(process.env.ISOLATED_SUPABASE_PROJECT_REF || '').trim()
const mutationsApproved = process.env.ALLOW_DISPOSABLE_SUPABASE_MUTATIONS === 'true'
const canRun = Boolean(
  isolatedUrl &&
  isolatedServiceKey &&
  isolatedProjectRef &&
  mutationsApproved,
)

const disallowedProjectRefs = new Set([
  'eyehflljrgztmucwjrhc',
  'kovibdcgqopkkyezlncr',
])

const stripImports = (source: string) => source.replace(
  /^import(?:[\s\S]*?)from\s+['"][^'"]+['"]\r?\n/gm,
  '',
)

const assertNoError = (error: { message: string } | null, context: string) => {
  if (error) throw new Error(`${context}: ${error.message}`)
}

const loadProcessor = async (supabase: SupabaseClient) => {
  const workspaceRoot = process.cwd()
  const notificationSource = readFileSync(
    path.join(workspaceRoot, 'lib', 'rozgar-notification-email.ts'),
    'utf8',
  )
  const outboxSource = readFileSync(
    path.join(workspaceRoot, 'lib', 'rozgar-internal-notification-outbox.ts'),
    'utf8',
  )
  ;(globalThis as typeof globalThis & { __isolatedSupabaseAdmin?: SupabaseClient })
    .__isolatedSupabaseAdmin = supabase
  const source = `
    const supabaseAdmin = globalThis.__isolatedSupabaseAdmin
    ${stripImports(notificationSource)}
    ${stripImports(outboxSource)}
  `
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}#${Date.now()}`)
}

test('disposable Supabase proves transactional enqueue and durable recovery end to end', {
  skip: canRun ? false : 'Disposable Supabase credentials were not supplied.',
  timeout: 120_000,
}, async () => {
  assert.equal(disallowedProjectRefs.has(isolatedProjectRef), false)
  assert.match(isolatedUrl, new RegExp(`^https://${isolatedProjectRef}\\.supabase\\.co/?$`))

  const supabase = createClient(isolatedUrl, isolatedServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const processor = await loadProcessor(supabase)
  const runId = `iso-${Date.now()}`
  const categoryId = `${runId}-category`
  const freePlanId = `${runId}-free-plan`
  const paidPlanId = `${runId}-paid-plan`
  const nowIso = '2026-09-19T10:00:00.000Z'
  const publishedDate = '2026-09-19'

  const { count: referralCountBefore, error: referralBeforeError } = await supabase
    .from('worker_referral_email_outbox')
    .select('id', { count: 'exact', head: true })
  assertNoError(referralBeforeError, 'read referral outbox before isolated test')

  const { error: settlePreviousRunsError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .update({
      status: 'sent',
      sent_at: nowIso,
      next_attempt_at: null,
      processing_started_at: null,
      provider_message_id: 'synthetic-previous-isolated-run',
    })
    .in('status', ['pending', 'processing'])
  assertNoError(settlePreviousRunsError, 'settle prior disposable test events')

  const { error: categoryError } = await supabase.from('labour_categories').insert({
    id: categoryId,
    name: 'Isolated Stitching',
    slug: `${runId}-stitching`,
    demand_level: 'high',
    is_active: true,
  })
  assertNoError(categoryError, 'seed category')

  const displayOrderBase = 100000 + Number(runId.slice(-5))
  const { error: planError } = await supabase.from('labour_plans').insert([
    {
      id: freePlanId,
      audience: 'company',
      name: 'Isolated Free',
      registration_fee: 0,
      wallet_credit: 0,
      plan_amount: 0,
      validity_days: 30,
      daily_charge: 0,
      is_active: true,
      labour_category_ids: [categoryId],
      job_post_limit: 1,
      plan_validity_days: 30,
      job_post_live_days: 30,
      display_order: displayOrderBase,
    },
    {
      id: paidPlanId,
      audience: 'company',
      name: 'Isolated Paid',
      registration_fee: 0,
      wallet_credit: 0,
      plan_amount: 149,
      validity_days: 30,
      daily_charge: 0,
      is_active: true,
      labour_category_ids: [categoryId],
      job_post_limit: 5,
      plan_validity_days: 30,
      job_post_live_days: 30,
      display_order: displayOrderBase + 1,
    },
  ])
  assertNoError(planError, 'seed plans')

  const companyIds = [
    `${runId}-public-company`,
    `${runId}-admin-company`,
  ]
  const { error: companyError } = await supabase.from('labour_companies').insert(
    companyIds.map((id, index) => ({
      id,
      company_name: index === 0 ? 'Isolated Public Company' : 'Isolated Admin Company',
      contact_person: 'Synthetic Owner',
      mobile: `88${String(Date.now() + index).slice(-8)}`,
      email: `${id}@example.test`,
      city: 'Jaipur',
      state: 'Rajasthan',
      category_ids: [categoryId],
      status: 'active',
      active_plan: index === 0 ? freePlanId : paidPlanId,
      created_at: nowIso,
      updated_at: nowIso,
    })),
  )
  assertNoError(companyError, 'insert public and Admin-created companies')

  const jobIds = {
    free: `${runId}-free-live`,
    paid: `${runId}-paid-live`,
    draft: `${runId}-draft-live`,
    admin: `${runId}-admin-approved`,
    concurrent: `${runId}-concurrent-live`,
  }
  const baseJob = {
    category_id: categoryId,
    title: 'Isolated job',
    city: 'Jaipur',
    workers_needed: 3,
    wage_amount: 800,
    validity_days: 30,
    expires_at: '2026-10-19',
  }
  const { error: jobInsertError } = await supabase.from('labour_job_posts').insert([
    {
      ...baseJob,
      id: jobIds.free,
      company_id: companyIds[0],
      plan_id: freePlanId,
      status: 'live',
      published_at: publishedDate,
    },
    {
      ...baseJob,
      id: jobIds.paid,
      company_id: companyIds[1],
      plan_id: paidPlanId,
      status: 'live',
      published_at: publishedDate,
    },
    {
      ...baseJob,
      id: jobIds.draft,
      company_id: companyIds[0],
      plan_id: freePlanId,
      status: 'draft',
      published_at: null,
      expires_at: null,
    },
    {
      ...baseJob,
      id: jobIds.admin,
      company_id: companyIds[1],
      plan_id: paidPlanId,
      status: 'draft',
      review_status: 'under_review',
      submitted_at: nowIso,
      published_at: null,
      expires_at: null,
    },
    {
      ...baseJob,
      id: jobIds.concurrent,
      company_id: companyIds[1],
      plan_id: paidPlanId,
      status: 'draft',
      published_at: null,
      expires_at: null,
    },
  ])
  assertNoError(jobInsertError, 'insert free, paid, draft, Admin, and concurrent jobs')

  const { error: draftPublishError } = await supabase
    .from('labour_job_posts')
    .update({ status: 'live', published_at: publishedDate, expires_at: '2026-10-19' })
    .eq('id', jobIds.draft)
  assertNoError(draftPublishError, 'publish saved draft')

  const { error: adminPublishError } = await supabase
    .from('labour_job_posts')
    .update({
      status: 'live',
      review_status: 'approved',
      reviewed_at: nowIso,
      published_at: publishedDate,
      expires_at: '2026-10-19',
    })
    .eq('id', jobIds.admin)
  assertNoError(adminPublishError, 'Admin approve and publish')

  const concurrentResults = await Promise.all([
    supabase.from('labour_job_posts').update({ status: 'live', published_at: publishedDate }).eq('id', jobIds.concurrent),
    supabase.from('labour_job_posts').update({ status: 'live', published_at: publishedDate }).eq('id', jobIds.concurrent),
  ])
  concurrentResults.forEach((result, index) => assertNoError(result.error, `concurrent publication ${index + 1}`))

  const { error: repeatedUpdateError } = await supabase
    .from('labour_job_posts')
    .update({ status: 'live', title: 'Isolated job edited while live' })
    .eq('id', jobIds.draft)
  assertNoError(repeatedUpdateError, 'repeat live update')

  const expectedKeys = [
    ...companyIds.map(id => `rozgar-company-registration-${id}`),
    ...Object.values(jobIds).map(id => `rozgar-job-published-${id}`),
  ]
  const { data: coveredRows, error: coveredError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .select('id,event_key,recipient_email,status,attempt_count')
    .in('event_key', expectedKeys)
  assertNoError(coveredError, 'read entry-point events')
  assert.equal(coveredRows?.length, expectedKeys.length)
  assert.equal(new Set((coveredRows || []).map(row => row.event_key)).size, expectedKeys.length)
  assert.ok((coveredRows || []).every(row => row.recipient_email === 'scalevyapar072@gmail.com'))

  const coveredIds = (coveredRows || []).map(row => row.id)
  const { error: settleCoveredError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .update({ status: 'sent', sent_at: nowIso, provider_message_id: 'synthetic-entrypoint-proof' })
    .in('id', coveredIds)
  assertNoError(settleCoveredError, 'settle entry-point proof events')

  const retryCompanyId = `${runId}-retry-company`
  const retryJobId = `${runId}-retry-job`
  const { error: retryCompanyError } = await supabase.from('labour_companies').insert({
    id: retryCompanyId,
    company_name: 'Isolated Retry Company',
    contact_person: 'Synthetic Owner',
    mobile: `87${String(Date.now()).slice(-8)}`,
    email: `${retryCompanyId}@example.test`,
    city: 'Jaipur',
    status: 'active',
  })
  assertNoError(retryCompanyError, 'insert retry company')
  const { error: retryJobError } = await supabase.from('labour_job_posts').insert({
    ...baseJob,
    id: retryJobId,
    company_id: retryCompanyId,
    plan_id: paidPlanId,
    status: 'live',
    published_at: publishedDate,
  })
  assertNoError(retryJobError, 'insert retry job')

  const retryKeys = [
    `rozgar-company-registration-${retryCompanyId}`,
    `rozgar-job-published-${retryJobId}`,
  ]
  const providerAttempts = new Map<string, number>()
  const retryDependencies = {
    send: async (message: { idempotencyKey: string }) => {
      const attempts = (providerAttempts.get(message.idempotencyKey) || 0) + 1
      providerAttempts.set(message.idempotencyKey, attempts)
      if (attempts === 1) {
        return {
          delivered: false,
          skipped: false,
          reason: 'provider-error',
          providerMessageId: '',
          safeErrorCode: 'provider_unavailable',
          safeErrorMessage: 'Synthetic 503',
          statusCode: 503,
        }
      }
      return {
        delivered: true,
        skipped: false,
        providerMessageId: `email-${message.idempotencyKey}`,
        safeErrorCode: '',
        safeErrorMessage: '',
        statusCode: 200,
      }
    },
  }
  const retryFirst = await processor.processRozgarInternalNotificationOutboxBatch(25, retryDependencies)
  assert.equal(retryFirst.retried, 2)
  const { error: makeDueError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .update({ next_attempt_at: '2026-09-19T00:00:00.000Z' })
    .in('event_key', retryKeys)
  assertNoError(makeDueError, 'make 503 events due')
  const retrySecond = await processor.processRozgarInternalNotificationOutboxBatch(25, retryDependencies)
  assert.equal(retrySecond.sent, 2)
  retryKeys.forEach(key => assert.equal(providerAttempts.get(key), 2))

  const crashCompanyId = `${runId}-crash-company`
  const crashEventKey = `rozgar-company-registration-${crashCompanyId}`
  const { error: crashCompanyError } = await supabase.from('labour_companies').insert({
    id: crashCompanyId,
    company_name: 'Isolated Crash Company',
    contact_person: 'Synthetic Owner',
    mobile: `86${String(Date.now()).slice(-8)}`,
    email: `${crashCompanyId}@example.test`,
    city: 'Jaipur',
    status: 'active',
  })
  assertNoError(crashCompanyError, 'commit company before processor interruption')

  const acceptedProviderKeys = new Set<string>()
  const requestedProviderKeys: string[] = []
  let interruptOnce = true
  const crashDependencies = {
    send: async (message: { idempotencyKey: string }) => {
      requestedProviderKeys.push(message.idempotencyKey)
      acceptedProviderKeys.add(message.idempotencyKey)
      return {
        delivered: true,
        skipped: false,
        providerMessageId: `email-${message.idempotencyKey}`,
        safeErrorCode: '',
        safeErrorMessage: '',
        statusCode: 200,
      }
    },
    mark: async (rowId: string, update: Record<string, unknown>) => {
      if (interruptOnce && update.status === 'sent') {
        interruptOnce = false
        throw new Error('synthetic post-acceptance interruption')
      }
      const { error } = await supabase
        .from('rozgar_internal_notification_outbox')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', rowId)
        .eq('status', 'processing')
      assertNoError(error, 'mark crash-recovery event')
    },
  }
  await assert.rejects(
    processor.processRozgarInternalNotificationOutboxBatch(25, crashDependencies),
    /synthetic post-acceptance interruption/,
  )
  const { data: interruptedRow, error: interruptedError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .select('status,attempt_count')
    .eq('event_key', crashEventKey)
    .single()
  assertNoError(interruptedError, 'read interrupted event')
  assert.equal(interruptedRow?.status, 'processing')
  const { error: staleError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .update({ processing_started_at: '2026-09-19T00:00:00.000Z' })
    .eq('event_key', crashEventKey)
  assertNoError(staleError, 'expire processing lease')
  const recovered = await processor.processRozgarInternalNotificationOutboxBatch(25, crashDependencies)
  assert.equal(recovered.sent, 1)
  assert.equal(acceptedProviderKeys.size, 1)
  assert.deepEqual(requestedProviderKeys, [crashEventKey, crashEventKey])

  const concurrentCompanyId = `${runId}-processor-concurrency`
  const { error: concurrentCompanyError } = await supabase.from('labour_companies').insert({
    id: concurrentCompanyId,
    company_name: 'Isolated Concurrent Processor Company',
    contact_person: 'Synthetic Owner',
    mobile: `85${String(Date.now()).slice(-8)}`,
    email: `${concurrentCompanyId}@example.test`,
    city: 'Jaipur',
    status: 'active',
  })
  assertNoError(concurrentCompanyError, 'insert concurrent processor event')
  let concurrentSends = 0
  const concurrentDependencies = {
    send: async (message: { idempotencyKey: string }) => {
      concurrentSends += 1
      return {
        delivered: true,
        skipped: false,
        providerMessageId: `email-${message.idempotencyKey}`,
        safeErrorCode: '',
        safeErrorMessage: '',
        statusCode: 200,
      }
    },
  }
  const concurrentProcessorResults = await Promise.all([
    processor.processRozgarInternalNotificationOutboxBatch(25, concurrentDependencies),
    processor.processRozgarInternalNotificationOutboxBatch(25, concurrentDependencies),
  ])
  assert.equal(concurrentProcessorResults.reduce((sum, result) => sum + result.claimed, 0), 1)
  assert.equal(concurrentSends, 1)

  const previewCompanyId = `${runId}-preview-sink`
  const { error: previewCompanyError } = await supabase.from('labour_companies').insert({
    id: previewCompanyId,
    company_name: 'Isolated Preview Sink Company',
    contact_person: 'Synthetic Owner',
    mobile: `84${String(Date.now()).slice(-8)}`,
    email: `${previewCompanyId}@example.test`,
    city: 'Jaipur',
    status: 'active',
  })
  assertNoError(previewCompanyError, 'insert Preview sink event')
  const previousVercelEnv = process.env.VERCEL_ENV
  const previousFetch = globalThis.fetch
  let networkCalls = 0
  process.env.VERCEL_ENV = 'preview'
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith('https://api.resend.com')) {
      networkCalls += 1
      throw new Error('Preview must not contact Resend')
    }
    return previousFetch(input, init)
  }
  try {
    const previewSummary = await processor.processRozgarInternalNotificationOutboxBatch(25)
    assert.equal(previewSummary.synthetic, 1)
    assert.equal(networkCalls, 0)
  } finally {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = previousVercelEnv
    globalThis.fetch = previousFetch
  }

  const { data: finalRows, error: finalRowsError } = await supabase
    .from('rozgar_internal_notification_outbox')
    .select('event_key,status,attempt_count,provider_message_id')
    .like('event_key', `%${runId}%`)
  assertNoError(finalRowsError, 'read final isolated outbox state')
  assert.ok((finalRows || []).every(row => row.status === 'sent'))
  assert.equal(new Set((finalRows || []).map(row => row.event_key)).size, finalRows?.length)

  const { count: referralCountAfter, error: referralAfterError } = await supabase
    .from('worker_referral_email_outbox')
    .select('id', { count: 'exact', head: true })
  assertNoError(referralAfterError, 'read referral outbox after isolated test')
  assert.equal(referralCountAfter, referralCountBefore)
})
