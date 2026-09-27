import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const adminPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'admin', 'labour', 'page.tsx'),
  'utf8',
)
const overrideRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'admin', 'labour', 'job-post-override', 'route.ts'),
  'utf8',
)
const overrideModule = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'admin-job-post-override.ts')).href
)
const {
  buildAdminJobPostOverrideMutation,
  handleAdminJobPostOverrideRequest,
} = overrideModule

const now = new Date('2026-09-27T08:00:00.000Z')

const makeJob = (overrides: Record<string, unknown> = {}) => ({
  id: 'job-synthetic-1',
  companyId: 'company-synthetic-1',
  planId: 'plan-synthetic-1',
  categoryId: 'category-synthetic-1',
  title: 'Synthetic Operator Job',
  status: 'live',
  reviewStatus: null,
  reviewReason: '',
  submittedAt: '',
  reviewedAt: '',
  publishedAt: '2026-09-01',
  expiresAt: '2026-10-01',
  validityDays: 30,
  ...overrides,
})

const makeRequest = (payload: Record<string, unknown>) => new Request(
  'https://preview.example.test/api/admin/labour/job-post-override',
  {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  },
)

const makeHarness = ({
  job = makeJob(),
  requireAdmin = async () => ({ email: 'admin@example.test' }),
}: {
  job?: ReturnType<typeof makeJob>
  requireAdmin?: (request: Request) => Promise<{ email: string } | Response>
} = {}) => {
  let currentJob = { ...job }
  let updateCalls = 0
  const auditActors: string[] = []

  const getSnapshot = async () => ({
    jobPosts: [{ ...currentJob }],
    walletTransactions: [],
    plans: [{ id: 'plan-synthetic-1', jobPostLimit: 1 }],
    checkouts: [],
  })

  const dependencies = {
    requireAdmin,
    getSnapshot,
    updateJobPost: async (jobPostId: string, payload: Record<string, unknown>, actor: string) => {
      assert.equal(jobPostId, currentJob.id)
      updateCalls += 1
      auditActors.push(actor)
      currentJob = { ...currentJob, ...payload }
      return getSnapshot()
    },
    getAdminCategories: async () => [],
    now: () => now,
  }

  return {
    dependencies,
    state: () => ({ currentJob, updateCalls, auditActors }),
  }
}

test('existing Admin Job Posts editor reuses its status/date fields and Save button through the dedicated route', () => {
  assert.match(adminPageSource, /fetch\('\/api\/admin\/labour\/job-post-override'/)
  assert.match(adminPageSource, /editingJobPostId[\s\S]*jobPostDraft\.expiresAt \|\| addDays/)
  assert.match(adminPageSource, /<button onClick=\{saveJobPost\} style=\{primaryButtonStyle\}>Save Job Post<\/button>/)
  assert.match(overrideRouteSource, /requireAdmin/)
  assert.match(overrideRouteSource, /updateLabourEntity\('jobPosts'/)
  assert.doesNotMatch(overrideRouteSource, /razorpay|checkout|walletTransactions|plan_purchase/i)
})

test('authenticated Admin can extend an existing live job expiry', async () => {
  const harness = makeHarness()
  const response = await handleAdminJobPostOverrideRequest(
    makeRequest({
      jobPostId: 'job-synthetic-1',
      payload: { status: 'live', expiresAt: '2026-11-15', publishedAt: '2026-09-01' },
    }),
    harness.dependencies,
  )

  assert.equal(response.status, 200)
  assert.equal(harness.state().currentJob.expiresAt, '2026-11-15')
  assert.deepEqual(harness.state().auditActors, ['admin@example.test'])
})

test('authenticated Admin can reactivate an expired job with a future expiry', async () => {
  const harness = makeHarness({
    job: makeJob({ status: 'expired', expiresAt: '2026-09-20', reviewStatus: 'approved' }),
  })
  const response = await handleAdminJobPostOverrideRequest(
    makeRequest({
      jobPostId: 'job-synthetic-1',
      payload: { status: 'live', expiresAt: '2026-10-20', publishedAt: '2026-09-01' },
    }),
    harness.dependencies,
  )

  assert.equal(response.status, 200)
  assert.equal(harness.state().currentJob.status, 'live')
  assert.equal(harness.state().currentJob.expiresAt, '2026-10-20')
})

test('all supported non-live legacy states can be reactivated without plan or billing mutation', () => {
  for (const status of ['expired', 'pending', 'paused', 'rejected', 'inactive']) {
    const result = buildAdminJobPostOverrideMutation({
      current: makeJob({
        status,
        expiresAt: '2026-09-20',
        reviewStatus: status === 'rejected' ? 'rejected' : null,
      }),
      payload: { status: 'live', expiresAt: '2026-10-20' },
      now,
    })
    assert.equal(result.mutation.status, 'live')
    assert.equal(result.mutation.expiresAt, '2026-10-20')
    if (status === 'rejected') assert.equal(result.mutation.reviewStatus, 'approved')
  }
})

test('invalid, missing, current, and past expiry dates are rejected when making a job live', async () => {
  for (const expiresAt of ['', '2026-02-31', '2026-09-27', '2026-09-26']) {
    const harness = makeHarness({ job: makeJob({ status: 'expired', expiresAt: '2026-09-20' }) })
    const response = await handleAdminJobPostOverrideRequest(
      makeRequest({ jobPostId: 'job-synthetic-1', payload: { status: 'live', expiresAt } }),
      harness.dependencies,
    )
    assert.equal(response.status, 400, `expected ${expiresAt || 'missing date'} to be rejected`)
    assert.equal(harness.state().updateCalls, 0)
  }
})

test('unauthenticated and non-Admin authorization failures are returned before data access', async () => {
  for (const status of [401, 403]) {
    let snapshotReads = 0
    const harness = makeHarness({
      requireAdmin: async () => Response.json(
        { error: status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status },
      ),
    })
    const getSnapshot = harness.dependencies.getSnapshot
    harness.dependencies.getSnapshot = async () => {
      snapshotReads += 1
      return getSnapshot()
    }
    const response = await handleAdminJobPostOverrideRequest(
      makeRequest({ jobPostId: 'job-synthetic-1', payload: { status: 'live', expiresAt: '2026-10-20' } }),
      harness.dependencies,
    )
    assert.equal(response.status, status)
    assert.equal(snapshotReads, 0)
    assert.equal(harness.state().updateCalls, 0)
  }
})

test('Admin override mutates only the existing job and never billing, wallet, usage, or checkout state', async () => {
  const harness = makeHarness({ job: makeJob({ status: 'paused' }) })
  const response = await handleAdminJobPostOverrideRequest(
    makeRequest({
      jobPostId: 'job-synthetic-1',
      payload: { status: 'live', expiresAt: '2026-10-31' },
    }),
    harness.dependencies,
  )
  const state = harness.state()

  assert.equal(response.status, 200)
  assert.equal(state.updateCalls, 1)
  assert.equal(state.currentJob.status, 'live')
  assert.equal(state.currentJob.expiresAt, '2026-10-31')
  assert.equal(state.currentJob.planId, 'plan-synthetic-1')
})

test('repeated and concurrent overrides are state-idempotent and create no usage or billing records', async () => {
  const harness = makeHarness({ job: makeJob({ status: 'expired', expiresAt: '2026-09-20' }) })
  const requestPayload = {
    jobPostId: 'job-synthetic-1',
    payload: { status: 'live', expiresAt: '2026-10-31', publishedAt: '2026-09-01' },
  }

  const first = await handleAdminJobPostOverrideRequest(makeRequest(requestPayload), harness.dependencies)
  const repeated = await handleAdminJobPostOverrideRequest(makeRequest(requestPayload), harness.dependencies)
  const concurrent = await Promise.all([
    handleAdminJobPostOverrideRequest(makeRequest(requestPayload), harness.dependencies),
    handleAdminJobPostOverrideRequest(makeRequest(requestPayload), harness.dependencies),
  ])
  const state = harness.state()

  assert.equal(first.status, 200)
  assert.equal(repeated.status, 200)
  assert.ok(concurrent.every(response => response.status === 200))
  assert.equal(state.currentJob.status, 'live')
  assert.equal(state.currentJob.expiresAt, '2026-10-31')
  assert.equal(state.updateCalls, 1)
  assert.equal(state.currentJob.planId, 'plan-synthetic-1')
})
