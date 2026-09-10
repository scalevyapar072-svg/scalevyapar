import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const routeSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'job-post', 'route.ts'),
  'utf8',
)
const formSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'company-job-post-form.tsx'),
  'utf8',
)
const panelSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'panel', 'company-panel-client.tsx'),
  'utf8',
)
const companyAppSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-company-app.ts'),
  'utf8',
)
const marketplaceSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-marketplace.ts'),
  'utf8',
)
const planUtilsSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-plan-utils.ts'),
  'utf8',
)

const extractVariableInitializer = (source: string, variableName: string) => {
  const sourceFile = ts.createSourceFile(
    `${variableName}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let initializer = ''

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      initializer = node.initializer.getText(sourceFile)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  assert.ok(initializer, `Expected ${variableName} in production source`)
  return initializer
}

const importTranspiled = async (source: string) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })
  return import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`)
}

const routeHelpers = await importTranspiled(`
  const normalize = ${extractVariableInitializer(routeSource, 'normalize')}
  const normalizeLookup = ${extractVariableInitializer(routeSource, 'normalizeLookup')}
  const isPublishedJobStatus = ${extractVariableInitializer(routeSource, 'isPublishedJobStatus')}
  const normalizeCompanyJobSubmissionId = ${extractVariableInitializer(routeSource, 'normalizeCompanyJobSubmissionId')}
  const buildCompanyJobSubmissionId = ${extractVariableInitializer(routeSource, 'buildCompanyJobSubmissionId')}
  const isFirstCompanyJobPublication = ${extractVariableInitializer(routeSource, 'isFirstCompanyJobPublication')}
  const buildCompanyJobSubmissionFields = ${extractVariableInitializer(routeSource, 'buildCompanyJobSubmissionFields')}
  export {
    buildCompanyJobSubmissionFields,
    buildCompanyJobSubmissionId,
    isFirstCompanyJobPublication,
  }
`)

const planHelpers = await importTranspiled(`
  const normalizeLookup = ${extractVariableInitializer(planUtilsSource, 'normalizeLookup')}
  const toNumber = ${extractVariableInitializer(planUtilsSource, 'toNumber')}
  const addDays = ${extractVariableInitializer(planUtilsSource, 'addDays')}
  const minIsoDate = ${extractVariableInitializer(planUtilsSource, 'minIsoDate')}
  const getJobPostLiveDays = ${extractVariableInitializer(planUtilsSource, 'getJobPostLiveDays')}
  const extractConnectedPlanLabel = ${extractVariableInitializer(planUtilsSource, 'extractConnectedPlanLabel')}
  const jobMatchesPlan = ${extractVariableInitializer(planUtilsSource, 'jobMatchesPlan')}
  const isPublishedPlanUsageJob = ${extractVariableInitializer(planUtilsSource, 'isPublishedPlanUsageJob')}
  const countUsedJobPostsForPlan = ${extractVariableInitializer(planUtilsSource, 'countUsedJobPostsForPlan')}
  const calculateJobLiveWindow = ${extractVariableInitializer(planUtilsSource, 'calculateJobLiveWindow')}
  export { calculateJobLiveWindow, countUsedJobPostsForPlan }
`)

type ExistingJob = {
  status?: string
  reviewStatus?: 'under_review' | 'approved' | 'rejected' | null
  reviewReason?: string
  submittedAt?: string
  reviewedAt?: string
  publishedAt?: string
  expiresAt?: string
}

type SubmissionFields = {
  status: 'draft' | 'live'
  reviewStatus: ExistingJob['reviewStatus']
  reviewReason: string
  submittedAt: string
  reviewedAt: string
  publishedAt: string
  expiresAt: string
}

const buildFields = routeHelpers.buildCompanyJobSubmissionFields as (input: {
  mode: 'draft' | 'publish'
  existingJob: ExistingJob | null
  today: string
  liveWindowEndDate: string
}) => SubmissionFields

const buildSubmissionId = routeHelpers.buildCompanyJobSubmissionId as (
  companyId: string,
  submissionId: string,
) => string

const isFirstPublication = routeHelpers.isFirstCompanyJobPublication as (
  mode: 'draft' | 'publish',
  existingStatus: unknown,
) => boolean

const countUsed = planHelpers.countUsedJobPostsForPlan as (
  jobs: Array<{
    id: string
    companyId: string
    description: string
    planId?: string
    status?: string
  }>,
  companyId: string,
  plan: { id: string; name: string },
  excludeJobId?: string,
) => number

const liveWindow = planHelpers.calculateJobLiveWindow as (input: {
  startDate: string
  plan: { jobPostLiveDays: number }
  planEndDate?: string
}) => { startDate: string; endDate: string }

const plan = { id: 'plan-company-active', name: 'Company Active' }
const planDescription = '\n\nJob requirement details\nConnected plan: Company Active'

test('Save as Draft stores a deliberate draft without review metadata', () => {
  assert.deepEqual(buildFields({
    mode: 'draft',
    existingJob: null,
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  }), {
    status: 'draft',
    reviewStatus: null,
    reviewReason: '',
    submittedAt: '',
    reviewedAt: '',
    publishedAt: '',
    expiresAt: '',
  })
})

test('new valid Publish Now submission becomes live without Admin approval', () => {
  const fields = buildFields({
    mode: 'publish',
    existingJob: null,
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  })
  assert.equal(fields.status, 'live')
  assert.equal(fields.reviewStatus, null)
  assert.doesNotMatch(routeSource, /buildJobSubmissionReviewFields/)
})

test('existing draft transitions to live through the same publish workflow', () => {
  assert.equal(isFirstPublication('publish', 'draft'), true)
  assert.equal(buildFields({
    mode: 'publish',
    existingJob: { status: 'draft' },
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  }).status, 'live')
})

test('first publication populates published_at', () => {
  const fields = buildFields({
    mode: 'publish',
    existingJob: { status: 'draft', publishedAt: '' },
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  })
  assert.equal(fields.publishedAt, '2026-09-10')
})

test('first publication expiry follows live-period days and never exceeds plan validity', () => {
  assert.deepEqual(liveWindow({
    startDate: '2026-09-10',
    plan: { jobPostLiveDays: 30 },
    planEndDate: '2026-09-25',
  }), {
    startDate: '2026-09-10',
    endDate: '2026-09-25',
  })
})

test('one plan allowance is consumed only by the first transition to live', () => {
  const draftJob = {
    id: 'job-draft',
    companyId: 'company-1',
    planId: plan.id,
    description: planDescription,
    status: 'draft',
  }
  assert.equal(countUsed([draftJob], 'company-1', plan), 0)
  assert.equal(countUsed([{ ...draftJob, status: 'live' }], 'company-1', plan), 1)
  assert.equal(isFirstPublication('publish', draftJob.status), true)
})

test('editing an already-live job preserves publication dates and consumes no extra allowance', () => {
  const existing = {
    status: 'live',
    reviewStatus: null,
    publishedAt: '2026-09-01',
    expiresAt: '2026-09-30',
  } satisfies ExistingJob
  const fields = buildFields({
    mode: 'publish',
    existingJob: existing,
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  })
  assert.equal(isFirstPublication('publish', existing.status), false)
  assert.equal(fields.publishedAt, existing.publishedAt)
  assert.equal(fields.expiresAt, existing.expiresAt)
  assert.equal(countUsed([{
    id: 'job-live',
    companyId: 'company-1',
    planId: plan.id,
    description: planDescription,
    status: fields.status,
  }], 'company-1', plan), 1)
})

test('same submission retry resolves to one deterministic job ID', () => {
  const firstId = buildSubmissionId('company-1', 'company-job-post-1789012345678')
  const retryId = buildSubmissionId('company-1', 'company-job-post-1789012345678')
  assert.equal(firstId, retryId)
  assert.equal(firstId, 'job-company-1-company-job-post-1789012345678')
  assert.match(routeSource, /snapshot\.jobPosts\.find\(jobPost => jobPost\.id === idempotentJobId/)
  assert.match(formSource, /submissionId,/)
})

test('inactive, expired, and exhausted plans are blocked before first publication write', () => {
  assert.match(routeSource, /isFirstPublication && !selectedPlan\.isActive/)
  assert.match(routeSource, /isFirstPublication &&[\s\S]*JOB_POST_LIMIT_REACHED/)
  assert.match(routeSource, /isFirstPublication &&[\s\S]*PLAN_EXPIRED/)
  const expiryGateIndex = routeSource.indexOf("code: 'PLAN_EXPIRED'")
  const companyWriteIndex = routeSource.indexOf("const updatedCompanySnapshot = await updateLabourEntity")
  assert.ok(expiryGateIndex > -1 && companyWriteIndex > expiryGateIndex)
})

test('missing review-column compatibility remains in create and update persistence', () => {
  assert.match(marketplaceSource, /writeJobPostWithSchemaCompatibility\(\s*'create'/)
  assert.match(marketplaceSource, /writeJobPostWithSchemaCompatibility\(\s*'update'/)
  assert.match(marketplaceSource, /review_status\|review_reason\|submitted_at\|reviewed_at/)
  assert.equal(buildFields({
    mode: 'publish',
    existingJob: null,
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  }).reviewStatus, null)
})

test('company panel shows a newly published job as Active immediately', () => {
  assert.match(routeSource, /statusLabel: mode === 'draft' \? 'Draft' : 'Active'/)
  assert.match(formSource, /mode === 'draft' \? 'Draft' : 'Active'/)
  assert.match(panelSource, /value === 'live' \|\| value === 'active' \|\| value === 'hired'\) return 'Active'/)
})

test('active job counters derive immediately from live status', () => {
  assert.match(companyAppSource, /liveJobPosts: jobs\.filter\(job => job\.status === 'live'\)\.length/)
  assert.match(panelSource, /value: dashboard\.stats\.liveJobPosts/)
})

test('draft cards remain drafts and do not claim to await Admin review', () => {
  assert.match(panelSource, /job\.status === 'draft'[\s\S]*\? 'Saved as draft'/)
  assert.match(panelSource, /job\.reviewStatus === 'under_review'[\s\S]*\? 'Awaiting admin review'/)
  assert.equal(countUsed([{
    id: 'job-draft',
    companyId: 'company-1',
    planId: plan.id,
    description: planDescription,
    status: 'draft',
  }], 'company-1', plan), 0)
})

test('worker job feeds and matching continue to include only live jobs', () => {
  assert.match(companyAppSource, /\.filter\(jobPost => jobPost\.status === 'live'\)/)
  assert.equal(buildFields({
    mode: 'publish',
    existingJob: null,
    today: '2026-09-10',
    liveWindowEndDate: '2026-10-10',
  }).status, 'live')
})

test('auto-publish adds no WhatsApp or unexpected notification integration', () => {
  const changedRuntimeSource = `${routeSource}\n${formSource}\n${panelSource}`
  assert.doesNotMatch(changedRuntimeSource, /sendWhatsApp|whatsapp.*send|enqueueWhatsApp/i)
  assert.equal((routeSource.match(/sendNewJobSubmittedForReviewEmail/g) || []).length, 2)
})

test('publish route creates no duplicate wallet, payment, or allowance transaction', () => {
  assert.doesNotMatch(routeSource, /createLabourEntity\(\s*['"]walletTransactions['"]/)
  assert.doesNotMatch(routeSource, /createLabourEntity\(\s*['"]payments['"]/)
  assert.match(routeSource, /countUsedJobPostsForPlan\(/)
  assert.match(routeSource, /isFirstPublication/)
})
