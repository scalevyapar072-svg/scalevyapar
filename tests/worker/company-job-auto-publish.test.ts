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
  const normalizeEmail = ${extractVariableInitializer(routeSource, 'normalizeEmail')}
  const normalizeLookup = ${extractVariableInitializer(routeSource, 'normalizeLookup')}
  const normalizeCompanyJobProfileDetails = ${extractVariableInitializer(routeSource, 'normalizeCompanyJobProfileDetails')}
  const hasMeaningfulCompanyProfileChange = ${extractVariableInitializer(routeSource, 'hasMeaningfulCompanyProfileChange')}
  const applyCompanyUpdateWhenRequired = ${extractVariableInitializer(routeSource, 'applyCompanyUpdateWhenRequired')}
  const isPublishedJobStatus = ${extractVariableInitializer(routeSource, 'isPublishedJobStatus')}
  const normalizeCompanyJobSubmissionId = ${extractVariableInitializer(routeSource, 'normalizeCompanyJobSubmissionId')}
  const buildCompanyJobSubmissionId = ${extractVariableInitializer(routeSource, 'buildCompanyJobSubmissionId')}
  const isFirstCompanyJobPublication = ${extractVariableInitializer(routeSource, 'isFirstCompanyJobPublication')}
  const buildCompanyJobSubmissionFields = ${extractVariableInitializer(routeSource, 'buildCompanyJobSubmissionFields')}
  export {
    buildCompanyJobSubmissionFields,
    buildCompanyJobSubmissionId,
    normalizeCompanyJobProfileDetails,
    hasMeaningfulCompanyProfileChange,
    applyCompanyUpdateWhenRequired,
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

type CompanyProfileDetails = {
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  contactMobile: string
  businessType: string
  industryCategory: string
  companyAddress: string
  state: string
  city: string
  area: string
  pincode: string
}

const normalizeCompanyDetails = routeHelpers.normalizeCompanyJobProfileDetails as (
  details: Partial<Record<keyof CompanyProfileDetails, unknown>>,
) => CompanyProfileDetails
const hasMeaningfulCompanyChange = routeHelpers.hasMeaningfulCompanyProfileChange as (
  current: Partial<Record<keyof CompanyProfileDetails, unknown>>,
  submitted: Partial<Record<keyof CompanyProfileDetails, unknown>>,
) => boolean
const applyCompanyUpdate = routeHelpers.applyCompanyUpdateWhenRequired as <T>(
  shouldUpdate: boolean,
  update: () => Promise<T>,
) => Promise<T | null>

const currentCompany: CompanyProfileDetails = {
  companyName: 'ScaleVyapar Textiles',
  contactPerson: 'QA Owner',
  email: 'owner@example.com',
  mobile: '9876500000',
  contactMobile: '9876500001',
  businessType: 'Manufacturer',
  industryCategory: 'Garment',
  companyAddress: 'Industrial Area',
  state: 'Rajasthan',
  city: 'Jaipur',
  area: 'Sitapura',
  pincode: '302022',
}

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

test('existing draft publication with identical company data makes zero company-update calls', async () => {
  let companyUpdateCalls = 0
  const shouldUpdate = hasMeaningfulCompanyChange(currentCompany, { ...currentCompany })
  const result = await applyCompanyUpdate(shouldUpdate, async () => {
    companyUpdateCalls += 1
    return { companies: [currentCompany] }
  })

  assert.equal(shouldUpdate, false)
  assert.equal(companyUpdateCalls, 0)
  assert.equal(result, null)
  assert.match(routeSource, /const shouldUpdateCompany = !existingJob \|\| hasMeaningfulCompanyProfileChange/)
})

test('identical existing-job company data creates zero company audit entries', async () => {
  const auditEntries: string[] = []
  await applyCompanyUpdate(hasMeaningfulCompanyChange(currentCompany, currentCompany), async () => {
    auditEntries.push('company-update-audit')
    return null
  })

  assert.deepEqual(auditEntries, [])
})

test('whitespace, email case, nulls, and contact-mobile defaults do not create a false company difference', () => {
  const normalizedStored = normalizeCompanyDetails({
    ...currentCompany,
    email: ' OWNER@EXAMPLE.COM ',
    contactMobile: null,
    area: null,
  })
  const normalizedSubmitted = normalizeCompanyDetails({
    ...currentCompany,
    companyName: '  ScaleVyapar Textiles  ',
    contactPerson: ' QA Owner ',
    email: 'owner@example.com',
    contactMobile: '9876500000',
    companyAddress: ' Industrial Area ',
    area: '',
  })

  assert.deepEqual(normalizedStored, normalizedSubmitted)
  assert.equal(hasMeaningfulCompanyChange(normalizedStored, normalizedSubmitted), false)
})

test('a genuine existing-job company-field change updates the company exactly once', async () => {
  let companyUpdateCalls = 0
  const changedCompany = { ...currentCompany, city: 'Ajmer' }
  const result = await applyCompanyUpdate(
    hasMeaningfulCompanyChange(currentCompany, changedCompany),
    async () => {
      companyUpdateCalls += 1
      return { companies: [changedCompany] }
    },
  )

  assert.equal(companyUpdateCalls, 1)
  assert.deepEqual(result, { companies: [changedCompany] })
})

test('a genuine company change creates exactly one normal company audit entry', async () => {
  const auditEntries: string[] = []
  await applyCompanyUpdate(
    hasMeaningfulCompanyChange(currentCompany, { ...currentCompany, pincode: '305001' }),
    async () => {
      auditEntries.push('company-update-audit')
      return null
    },
  )

  assert.deepEqual(auditEntries, ['company-update-audit'])
  assert.match(marketplaceSource, /writeSupabaseAuditLog\('update', entityType, id, `Updated company/)
})

test('new-job submissions preserve the existing company synchronization', async () => {
  let companyUpdateCalls = 0
  const existingJob = null
  const shouldUpdate = !existingJob || hasMeaningfulCompanyChange(currentCompany, currentCompany)
  await applyCompanyUpdate(shouldUpdate, async () => {
    companyUpdateCalls += 1
    return null
  })

  assert.equal(companyUpdateCalls, 1)
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

test('existing-job publishing updates the job row and job audit exactly once', () => {
  const existingJobBranch = routeSource.slice(
    routeSource.indexOf('    if (existingJob) {'),
    routeSource.indexOf('    const finalSnapshot = await createLabourEntity('),
  )

  assert.equal((existingJobBranch.match(/updateLabourEntity\(\s*'jobPosts'/g) || []).length, 1)
  assert.equal((marketplaceSource.match(/writeSupabaseAuditLog\('update', entityType, id, `Updated job post/g) || []).length, 1)
})

test('inactive, expired, and exhausted plans are blocked before first publication write', () => {
  assert.match(routeSource, /isFirstPublication && !selectedPlan\.isActive/)
  assert.match(routeSource, /isFirstPublication &&[\s\S]*JOB_POST_LIMIT_REACHED/)
  assert.match(routeSource, /isFirstPublication &&[\s\S]*PLAN_EXPIRED/)
  const expiryGateIndex = routeSource.indexOf("code: 'PLAN_EXPIRED'")
  const companyWriteIndex = routeSource.indexOf('const shouldUpdateCompany =')
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

test('auto-publish leaves delivery to the transactional outbox trigger', () => {
  const changedRuntimeSource = `${routeSource}\n${formSource}\n${panelSource}`
  assert.doesNotMatch(changedRuntimeSource, /sendWhatsApp|whatsapp.*send|enqueueWhatsApp/i)
  assert.doesNotMatch(routeSource, /sendNewJobPublishedEmail/)
  assert.match(routeSource, /const isFirstPublication = isFirstCompanyJobPublication\(mode, existingJob\?\.status\)/)
})

test('publish route creates no duplicate wallet, payment, or allowance transaction', () => {
  assert.doesNotMatch(routeSource, /createLabourEntity\(\s*['"]walletTransactions['"]/)
  assert.doesNotMatch(routeSource, /createLabourEntity\(\s*['"]payments['"]/)
  assert.match(routeSource, /countUsedJobPostsForPlan\(/)
  assert.match(routeSource, /isFirstPublication/)
})
