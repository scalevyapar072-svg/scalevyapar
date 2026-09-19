import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const notificationModule = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'rozgar-notification-email.ts')).href
)
const registrationRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company-intake', 'route.ts'),
  'utf8',
)
const jobRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'job-post', 'route.ts'),
  'utf8',
)

const companyPayload = {
  companyId: 'company-synthetic-1',
  companyName: 'Synthetic Textiles',
  contactPerson: 'Synthetic Owner',
  registeredMobile: '9000000000',
  registeredEmail: 'owner@example.test',
  city: 'Jaipur',
  state: 'Rajasthan',
  industryCategory: 'Textiles',
  businessType: 'Manufacturer',
  registeredAt: '2026-09-19T10:00:00.000Z',
}

const jobPayload = {
  jobId: 'job-synthetic-1',
  jobTitle: 'Cutting and Stitching Team',
  companyName: companyPayload.companyName,
  companyId: companyPayload.companyId,
  labourCategories: ['Cutting Master', 'Stitching Karigar'],
  city: 'Jaipur',
  workersRequired: 25,
  selectedPlan: 'Synthetic Company Plan',
  publishedAt: '2026-09-19T10:30:00.000Z',
  expiresAt: '2026-10-19T10:30:00.000Z',
}

const withEmailEnvironment = async (
  vercelEnv: string,
  fetchImpl: typeof fetch,
  run: () => Promise<void>,
) => {
  const previous = {
    vercelEnv: process.env.VERCEL_ENV,
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
    fetch: globalThis.fetch,
  }

  process.env.VERCEL_ENV = vercelEnv
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.RESEND_FROM_EMAIL = 'test@example.test'
  globalThis.fetch = fetchImpl

  try {
    await run()
  } finally {
    if (previous.vercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = previous.vercelEnv
    if (previous.apiKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previous.apiKey
    if (previous.from === undefined) delete process.env.RESEND_FROM_EMAIL
    else process.env.RESEND_FROM_EMAIL = previous.from
    globalThis.fetch = previous.fetch
  }
}

test('Preview and local execution use the isolated sink and never call Resend', async () => {
  let fetchCalls = 0
  await withEmailEnvironment('preview', async () => {
    fetchCalls += 1
    throw new Error('Preview must not call the provider')
  }, async () => {
    const [companyResult, jobResult] = await Promise.all([
      notificationModule.sendNewCompanyRegistrationEmail(companyPayload),
      notificationModule.sendNewJobPublishedEmail(jobPayload),
    ])

    assert.equal(companyResult.reason, 'non-production-sink')
    assert.equal(jobResult.reason, 'non-production-sink')
  })
  assert.equal(fetchCalls, 0)
})

test('company registration uses the fixed internal recipient and a stable idempotency key', async () => {
  const requests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  const providerDeliveries = new Set<string>()
  await withEmailEnvironment('production', async (_url, init) => {
    const key = String((init?.headers as Record<string, string>)['Idempotency-Key'])
    providerDeliveries.add(key)
    requests.push({
      headers: init?.headers as Record<string, string>,
      body: JSON.parse(String(init?.body || '{}')) as Record<string, unknown>,
    })
    return new Response(JSON.stringify({ id: 'email-company-1' }), { status: 200 })
  }, async () => {
    await Promise.all([
      notificationModule.sendNewCompanyRegistrationEmail(companyPayload),
      notificationModule.sendNewCompanyRegistrationEmail(companyPayload),
    ])
  })

  assert.equal(requests.length, 2)
  assert.equal(requests[0].headers['Idempotency-Key'], 'rozgar-company-registration-company-synthetic-1')
  assert.equal(requests[1].headers['Idempotency-Key'], 'rozgar-company-registration-company-synthetic-1')
  assert.equal(providerDeliveries.size, 1)
  assert.deepEqual(requests[0].body.to, ['scalevyapar072@gmail.com'])
  assert.equal(requests[0].body.subject, 'New Rozgar Company Registration — Synthetic Textiles')
})

test('concurrent first-publication calls collapse to one provider event key', async () => {
  const providerDeliveries = new Set<string>()
  const requests: string[] = []

  await withEmailEnvironment('production', async (_url, init) => {
    const key = String((init?.headers as Record<string, string>)['Idempotency-Key'])
    requests.push(key)
    providerDeliveries.add(key)
    return new Response(JSON.stringify({ id: `email-${key}` }), { status: 200 })
  }, async () => {
    await Promise.all([
      notificationModule.sendNewJobPublishedEmail(jobPayload),
      notificationModule.sendNewJobPublishedEmail(jobPayload),
    ])
  })

  assert.deepEqual(requests, [
    'rozgar-job-published-job-synthetic-1',
    'rozgar-job-published-job-synthetic-1',
  ])
  assert.equal(providerDeliveries.size, 1)
})

test('provider failure is returned safely instead of failing the committed operation', async () => {
  await withEmailEnvironment('production', async () =>
    new Response(JSON.stringify({ name: 'provider_unavailable', message: 'Synthetic failure' }), { status: 503 }),
  async () => {
    const result = await notificationModule.sendNewJobPublishedEmail(jobPayload)
    assert.equal(result.delivered, false)
    assert.equal(result.reason, 'provider-error')
    assert.equal(result.safeErrorCode, 'provider_unavailable')
  })
})

test('registration notification is after a newly committed company and outside duplicate paths', () => {
  const duplicateGateIndex = registrationRouteSource.indexOf('if (duplicateCompany)')
  const companyCommitIndex = registrationRouteSource.indexOf('const companySnapshot = await createLabourEntity(')
  const notificationIndex = registrationRouteSource.indexOf('await sendNewCompanyRegistrationEmail({')
  const successIndex = registrationRouteSource.indexOf('return NextResponse.json({\n      success: true')

  assert.ok(duplicateGateIndex > -1 && duplicateGateIndex < companyCommitIndex)
  assert.ok(companyCommitIndex < notificationIndex)
  assert.ok(notificationIndex < successIndex)
  assert.equal((registrationRouteSource.match(/await sendNewCompanyRegistrationEmail/g) || []).length, 1)
})

test('job notification is limited to the first successful publication transition', () => {
  assert.match(jobRouteSource, /const isFirstPublication = isFirstCompanyJobPublication\(mode, existingJob\?\.status\)/)
  assert.match(jobRouteSource, /if \(!isFirstPublication \|\| !isPublishedJobStatus\(job\.status\)\) return/)
  assert.match(jobRouteSource, /await notifyFirstPublication\(updatedJob\)/)
  assert.match(jobRouteSource, /if \(createdJob\) await notifyFirstPublication\(createdJob\)/)
  assert.doesNotMatch(jobRouteSource, /sendNewJobSubmittedForReviewEmail/)
})
