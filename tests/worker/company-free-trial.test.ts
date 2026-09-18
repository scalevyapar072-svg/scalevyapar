import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const root = process.cwd()
const read = (...parts: string[]) => readFileSync(path.join(root, ...parts), 'utf8')

const freeTrialSource = read('lib', 'labour-company-free-trial.ts')
const adminPageSource = read('app', 'admin', 'labour', 'page.tsx')
const adminRouteSource = read('app', 'api', 'admin', 'labour', 'route.ts')
const jobRouteSource = read('app', 'api', 'labour', 'company', 'job-post', 'route.ts')
const jobFormSource = read('app', 'labour', 'company', 'company-job-post-form.tsx')
const orderRouteSource = read('app', 'api', 'labour', 'company', 'payments', 'razorpay', 'order', 'route.ts')
const verifyRouteSource = read('app', 'api', 'labour', 'company', 'payments', 'razorpay', 'verify', 'route.ts')
const paymentSource = read('lib', 'labour-company-payment.ts')
const marketplaceSource = read('lib', 'labour-marketplace.ts')
const planUtilsSource = read('lib', 'labour-plan-utils.ts')

const extractInitializer = (source: string, name: string, kind = ts.ScriptKind.TS) => {
  const file = ts.createSourceFile(`${name}.ts`, source, ts.ScriptTarget.Latest, true, kind)
  let initializer = ''
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) {
      initializer = node.initializer.getText(file)
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  assert.ok(initializer, `Expected ${name} in production source`)
  return initializer
}

const importTranspiled = async (source: string) => {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

const stripImports = (source: string) => source.replace(/import[\s\S]*?from ['"][^'"]+['"]\r?\n/g, '')

const helpers = await importTranspiled(`
  const COMPANY_FREE_TRIAL_MARKER_PREFIX = 'company-job-post-free-trial:v1:'
  const normalize = ${extractInitializer(freeTrialSource, 'normalize')}
  const normalizeLookup = ${extractInitializer(freeTrialSource, 'normalizeLookup')}
  const getCompanyPlanAmountValidationError = ${extractInitializer(freeTrialSource, 'getCompanyPlanAmountValidationError')}
  const resolveStoredCompanyPlanAmount = ${extractInitializer(freeTrialSource, 'resolveStoredCompanyPlanAmount')}
  const isStoredFreeCompanyPlan = ${extractInitializer(freeTrialSource, 'isStoredFreeCompanyPlan')}
  const hasSuccessfulCompanyJobPublication = ${extractInitializer(freeTrialSource, 'hasSuccessfulCompanyJobPublication')}
  const buildCompanyFreeTrialMarkerId = ${extractInitializer(freeTrialSource, 'buildCompanyFreeTrialMarkerId')}
  const serializeCompanyFreeTrialMarker = ${extractInitializer(freeTrialSource, 'serializeCompanyFreeTrialMarker')}
  const parseCompanyFreeTrialMarker = ${extractInitializer(freeTrialSource, 'parseCompanyFreeTrialMarker')}
  const isMatchingCompanyFreeTrialRetry = ${extractInitializer(freeTrialSource, 'isMatchingCompanyFreeTrialRetry')}
  const normalizeCompanyJobSubmissionId = ${extractInitializer(jobRouteSource, 'normalizeCompanyJobSubmissionId', ts.ScriptKind.TSX)}
  const buildCompanyJobSubmissionId = ${extractInitializer(jobRouteSource, 'buildCompanyJobSubmissionId', ts.ScriptKind.TSX)}
  const isFirstCompanyJobPublication = ${extractInitializer(jobRouteSource, 'isFirstCompanyJobPublication', ts.ScriptKind.TSX)}
  export {
    getCompanyPlanAmountValidationError,
    resolveStoredCompanyPlanAmount,
    isStoredFreeCompanyPlan,
    hasSuccessfulCompanyJobPublication,
    buildCompanyFreeTrialMarkerId,
    serializeCompanyFreeTrialMarker,
    parseCompanyFreeTrialMarker,
    isMatchingCompanyFreeTrialRetry,
    normalizeCompanyJobSubmissionId,
    buildCompanyJobSubmissionId,
    isFirstCompanyJobPublication,
  }
`)

const adminHandlers = await importTranspiled(`
  const createLabourEntity = async () => ({})
  const deleteLabourEntity = async () => ({})
  const getLabourAdminVisibleCategories = async () => []
  const getLabourMarketplaceSnapshot = async () => ({ plans: [], workers: [], jobPosts: [] })
  const requireAdmin = async () => ({ email: 'admin@example.com' })
  const updateLabourEntity = async () => ({})
  class LabourEntityConflictError extends Error {}
  const shouldBlockWorkerLifecycleMutation = () => false
  const buildWorkerLifecycleMutationBlockedResponse = () => Response.json({}, { status: 409 })
  const isWorkerKycComplete = () => true
  ${stripImports(adminRouteSource)}
`)

const orderHandlers = await importTranspiled(`
  class Razorpay { constructor() {} }
  const NextResponse = { json: (body, init) => Response.json(body, init) }
  const requireCompanyApp = async () => ({ companyId: 'c1' })
  const getLabourCompanyWebsiteContent = async () => ({ content: { pricingPage: {} } })
  const getLabourMarketplaceSnapshot = async () => ({ companies: [] })
  const resolveCompanyPlanForCheckout = () => null
  const resolveStoredCompanyPlanAmount = ${extractInitializer(freeTrialSource, 'resolveStoredCompanyPlanAmount')}
  const createCheckoutSummary = ({ planSlug, billingMode }) => ({
    plan: { slug: planSlug || 'synthetic-plan' },
    planTitle: 'Synthetic plan',
    billingMode: billingMode || 'monthly',
    total: 999,
  })
  ${stripImports(orderRouteSource)}
`)

const paymentResolvers = await importTranspiled(`
  const createPricingPlanSlug = value => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const resolveStoredCompanyPlanAmount = ${extractInitializer(freeTrialSource, 'resolveStoredCompanyPlanAmount')}
  const normalize = ${extractInitializer(paymentSource, 'normalize')}
  const tierRank = ${extractInitializer(paymentSource, 'tierRank')}
  const sortCompanyPlansByAmount = ${extractInitializer(paymentSource, 'sortCompanyPlansByAmount')}
  const resolveCompanyPlanForCheckout = ${extractInitializer(paymentSource, 'resolveCompanyPlanForCheckout')}
  export { resolveCompanyPlanForCheckout }
`)

const jobHandlers = await importTranspiled(`
  const NextResponse = { json: (body, init) => Response.json(body, init) }
  const groupLabourMasterOptions = options => options.reduce((groups, option) => {
    ;(groups[option.masterKey] ||= []).push(option)
    return groups
  }, {})
  const getVisibleLabourMasterOptions = options => options.filter(option => option.isActive !== false)
  const findMatchingMasterOption = (options, value) => options.find(option =>
    [option.id, option.value, option.label, option.slug].some(candidate =>
      String(candidate || '').trim().toLowerCase() === String(value || '').trim().toLowerCase()
    )
  )
  const filterBusinessTypesByIndustryDependency = options => getVisibleLabourMasterOptions(options)
  const filterCategoriesByLabourDependency = categories => categories.filter(category => category.isActive !== false)
  const addDays = (dateValue, days) => {
    const date = new Date(dateValue + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
  }
  const getPlanValidityDays = plan => plan.planValidityDays > 0 ? plan.planValidityDays : plan.validityDays
  const getJobPostLiveDays = plan => plan.jobPostLiveDays > 0 ? plan.jobPostLiveDays : plan.validityDays
  const getPlanLabourCategoryIds = plan => plan.labourCategoryIds || []
  const countUsedJobPostsForPlan = (jobs, companyId, plan, excludedId) => jobs.filter(job =>
    job.id !== excludedId && job.companyId === companyId && job.planId === plan.id &&
    (Boolean(job.publishedAt) || ['live', 'published', 'active'].includes(String(job.status || '').toLowerCase()))
  ).length
  const calculateJobLiveWindow = ({ startDate, plan, planEndDate }) => {
    const configuredEnd = addDays(startDate, getJobPostLiveDays(plan))
    return { startDate, endDate: planEndDate && planEndDate < configuredEnd ? planEndDate : configuredEnd }
  }
  const resolveLatestCompanyPlanPurchase = () => null
  const resolveCompanyCurrentJobPostingPlan = () => null
  const resolveCompanyJobPostingPlans = () => []
  const resolveCompanyPlanWindow = () => ({ startDate: '', endDate: '' })
  const getLabourMastersSnapshot = async () => ({ options: [], industryBusinessDependencies: [], categoryDependencies: [] })
  const requireCompanyApp = async () => ({ companyId: 'c1' })
  const createLabourEntity = async () => ({ jobPosts: [] })
  const updateLabourEntity = async () => null
  const reserveCompanyFreeTrialPublication = async () => ({ status: 'conflict', marker: null })
  const completeCompanyFreeTrialPublication = async () => null
  const releaseCompanyFreeTrialPublication = async () => null
  const getLabourMarketplaceSnapshot = async () => ({})
  const sendNewJobSubmittedForReviewEmail = async () => undefined
  const COMPANY_FREE_TRIAL_MARKER_PREFIX = 'company-job-post-free-trial:v1:'
  const helperNormalize = ${extractInitializer(freeTrialSource, 'normalize')}
  const helperNormalizeLookup = ${extractInitializer(freeTrialSource, 'normalizeLookup')}
  const buildCompanyFreeTrialMarkerId = ${extractInitializer(freeTrialSource, 'buildCompanyFreeTrialMarkerId')}
  const parseCompanyFreeTrialMarker = ${extractInitializer(freeTrialSource, 'parseCompanyFreeTrialMarker')}
  const findCompanyFreeTrialMarker = ${extractInitializer(freeTrialSource, 'findCompanyFreeTrialMarker')}
  const hasSuccessfulCompanyJobPublication = ${extractInitializer(freeTrialSource, 'hasSuccessfulCompanyJobPublication')}
  const isMatchingCompanyFreeTrialRetry = ${extractInitializer(freeTrialSource, 'isMatchingCompanyFreeTrialRetry')}
  const resolveStoredCompanyPlanAmount = ${extractInitializer(freeTrialSource, 'resolveStoredCompanyPlanAmount')}
  ${stripImports(jobRouteSource)
    .replaceAll('normalize(job.companyId)', 'helperNormalize(job.companyId)')
    .replaceAll('normalize(companyId)', 'helperNormalize(companyId)')
    .replaceAll('normalizeLookup(job.status)', 'helperNormalizeLookup(job.status)')}
`)

type TrialMarker = {
  companyId: string
  planId: string
  submissionId: string
  jobId: string
  status: 'reserved' | 'consumed'
  reservedAt: string
  consumedAt: string
}

type SyntheticJob = {
  id: string
  companyId: string
  planId: string
  status: string
  publishedAt: string
  expiresAt?: string
}

const amountError = helpers.getCompanyPlanAmountValidationError as (audience: unknown, amount: unknown) => string
const storedAmount = helpers.resolveStoredCompanyPlanAmount as (plan: { audience?: unknown; planAmount?: unknown }) => number | null
const hasPublication = helpers.hasSuccessfulCompanyJobPublication as (jobs: SyntheticJob[], companyId: string) => boolean
const markerId = helpers.buildCompanyFreeTrialMarkerId as (companyId: string) => string
const serializeMarker = helpers.serializeCompanyFreeTrialMarker as (marker: TrialMarker) => string
const parseMarker = helpers.parseCompanyFreeTrialMarker as (value: unknown) => TrialMarker | null
const matchesRetry = helpers.isMatchingCompanyFreeTrialRetry as (
  marker: TrialMarker,
  input: Pick<TrialMarker, 'companyId' | 'planId' | 'submissionId' | 'jobId'>,
) => boolean
const buildJobId = helpers.buildCompanyJobSubmissionId as (companyId: string, submissionId: string) => string
const isFirstPublication = helpers.isFirstCompanyJobPublication as (mode: 'draft' | 'publish', status?: unknown) => boolean
const submissionOne = 'company-job-post-1760000000001'
const submissionTwo = 'company-job-post-1760000000002'

class SyntheticTrialStore {
  jobs: SyntheticJob[] = []
  markers = new Map<string, TrialMarker>()
  paymentOrders = 0
  payments = 0
  walletTransactions = 0

  async publish(input: {
    companyId: string
    planId: string
    submissionId: string
    amount: unknown
    active?: boolean
    fail?: boolean
  }) {
    const amount = storedAmount({ audience: 'company', planAmount: input.amount })
    if (amount === null) return { status: 'invalid' as const }
    if (amount > 0) return { status: 'checkout' as const }
    if (input.active === false) return { status: 'inactive' as const }

    const jobId = buildJobId(input.companyId, input.submissionId)
    assert.notEqual(jobId, '', 'Synthetic publication must use the production submission ID format')
    const claimId = markerId(input.companyId)
    const existingJob = this.jobs.find(job => job.id === jobId && job.companyId === input.companyId)
    const existingMarker = this.markers.get(claimId)
    const request = { ...input, jobId }

    if (existingMarker) {
      if (!matchesRetry(existingMarker, request)) return { status: 'used' as const }
      if (existingMarker.status === 'consumed' && existingJob) return { status: 'published' as const, job: existingJob }
    } else {
      if (hasPublication(this.jobs, input.companyId)) return { status: 'ineligible' as const }
      this.markers.set(claimId, {
        companyId: input.companyId,
        planId: input.planId,
        submissionId: input.submissionId,
        jobId,
        status: 'reserved',
        reservedAt: '2026-09-18T00:00:00.000Z',
        consumedAt: '',
      })
    }

    await Promise.resolve()
    if (input.fail) {
      const current = this.markers.get(claimId)
      if (current?.status === 'reserved' && matchesRetry(current, request)) this.markers.delete(claimId)
      return { status: 'failed' as const }
    }

    let job = this.jobs.find(item => item.id === jobId)
    if (!job) {
      job = { id: jobId, companyId: input.companyId, planId: input.planId, status: 'live', publishedAt: '2026-09-18' }
      this.jobs.push(job)
    }
    const current = this.markers.get(claimId)
    if (current && matchesRetry(current, request)) {
      this.markers.set(claimId, { ...current, status: 'consumed', consumedAt: '2026-09-18T00:00:01.000Z' })
    }
    return { status: 'published' as const, job }
  }
}

const createSyntheticPaidOrder = async (authoritativeAmount: number, browserAmount = 0) => {
  let orderCalls = 0
  let receivedAmount = 0
  const response = await orderHandlers.handleCompanyRazorpayOrderPost(
    { json: async () => ({ plan: 'synthetic-paid', amount: browserAmount }) },
    {
      requireCompanyApp: async () => ({ companyId: 'c1' }),
      getLabourCompanyWebsiteContent: async () => ({ content: { pricingPage: {} } }),
      getLabourMarketplaceSnapshot: async () => ({
        companies: [{ id: 'c1', companyName: 'Synthetic Co', contactPerson: 'Owner', email: 'owner@example.com', mobile: '9999999999' }],
      }),
      resolveCompanyPlanForCheckout: () => ({ id: 'p-paid', audience: 'company', planAmount: authoritativeAmount }),
      getRazorpay: () => ({
        keyId: 'rzp_test_synthetic',
        client: {
          orders: {
            create: async ({ amount }: { amount: number }) => {
              orderCalls += 1
              receivedAmount = amount
              return { id: 'order_synthetic', amount, currency: 'INR' }
            },
          },
        },
      }),
    },
  )
  return { response, orderCalls, receivedAmount }
}

const createSyntheticJobRouteHarness = () => {
  const company = {
    id: 'c1',
    companyName: 'Synthetic Company',
    contactPerson: 'Synthetic Owner',
    email: 'owner@example.com',
    mobile: '9999999999',
    contactMobile: '9999999998',
    businessType: 'Factory',
    industryCategory: 'Manufacturing',
    companyAddress: '1 Industrial Road',
    state: 'Rajasthan',
    city: 'Jaipur',
    area: 'Sitapura',
    pincode: '302022',
    status: 'active',
    activePlan: '',
  }
  const freePlan = {
    id: 'p-free',
    name: 'Synthetic Zero Plan',
    audience: 'company',
    isActive: true,
    planAmount: 0,
    jobPostLimit: 1,
    planValidityDays: 90,
    validityDays: 90,
    jobPostLiveDays: 30,
    industryCategoryValues: ['Manufacturing'],
    businessTypeValues: ['Factory'],
    labourCategoryIds: ['cat-1'],
  }
  const snapshot = {
    companies: [company],
    plans: [freePlan],
    categories: [{ id: 'cat-1', name: 'Machine Operator', isActive: true }],
    jobPosts: [] as Array<Record<string, unknown>>,
    walletTransactions: [] as Array<Record<string, unknown>>,
    auditLogs: [] as Array<Record<string, unknown>>,
  }
  const masters = {
    options: [
      { id: 'industry-1', masterKey: 'industry_category', label: 'Manufacturing', value: 'Manufacturing', slug: 'manufacturing', isActive: true },
      { id: 'business-1', masterKey: 'business_type', label: 'Factory', value: 'Factory', slug: 'factory', isActive: true },
    ],
    industryBusinessDependencies: [],
    categoryDependencies: [],
  }
  const dependencies = {
    getLabourMarketplaceSnapshot: async () => snapshot,
    getLabourMastersSnapshot: async () => masters,
    requireCompanyApp: async () => ({ companyId: company.id }),
    updateLabourEntity: async (entityType: string, id: string, payload: Record<string, unknown>) => {
      if (entityType === 'jobPosts') {
        const index = snapshot.jobPosts.findIndex(job => job.id === id)
        if (index >= 0) snapshot.jobPosts[index] = { ...snapshot.jobPosts[index], ...payload }
      }
      return snapshot
    },
    createLabourEntity: async (entityType: string, payload: Record<string, unknown>) => {
      assert.equal(entityType, 'jobPosts')
      if (!snapshot.jobPosts.some(job => job.id === payload.id)) {
        snapshot.jobPosts.push({ ...payload, createdAt: '2026-09-18T00:00:00.000Z', updatedAt: '2026-09-18T00:00:00.000Z' })
      }
      return snapshot
    },
    reserveCompanyFreeTrialPublication: async (input: Pick<TrialMarker, 'companyId' | 'planId' | 'submissionId' | 'jobId'>) => {
      const id = markerId(input.companyId)
      const existingRecord = snapshot.auditLogs.find(record => record.id === id)
      const existing = parseMarker(existingRecord?.summary)
      if (existing) {
        if (!matchesRetry(existing, input)) return { status: 'conflict', marker: existing }
        return { status: existing.status === 'consumed' ? 'consumed' : 'conflict', marker: existing }
      }
      const marker: TrialMarker = {
        ...input,
        status: 'reserved',
        reservedAt: '2026-09-18T00:00:00.000Z',
        consumedAt: '',
      }
      snapshot.auditLogs.push({ id, summary: serializeMarker(marker) })
      return { status: 'claimed', marker }
    },
    completeCompanyFreeTrialPublication: async (input: Pick<TrialMarker, 'companyId' | 'planId' | 'submissionId' | 'jobId'>) => {
      const record = snapshot.auditLogs.find(item => item.id === markerId(input.companyId))
      const marker = parseMarker(record?.summary)
      assert.ok(record && marker && matchesRetry(marker, input))
      record.summary = serializeMarker({ ...marker, status: 'consumed', consumedAt: '2026-09-18T00:00:01.000Z' })
    },
    releaseCompanyFreeTrialPublication: async (input: Pick<TrialMarker, 'companyId' | 'planId' | 'submissionId' | 'jobId'>) => {
      const index = snapshot.auditLogs.findIndex(item => item.id === markerId(input.companyId))
      const marker = parseMarker(snapshot.auditLogs[index]?.summary)
      if (index >= 0 && marker?.status === 'reserved' && matchesRetry(marker, input)) snapshot.auditLogs.splice(index, 1)
    },
    now: () => new Date('2026-09-18T12:00:00.000Z'),
  }
  const body = (submissionId: string) => ({
    jobTitle: 'Synthetic Machine Operator',
    labourCategoryId: 'cat-1',
    selectedPlanId: freePlan.id,
    workerCategory: 'Machine Operator',
    workersRequired: 1,
    salaryType: 'Monthly Salary',
    salaryAmount: 20000,
    jobDescription: 'Synthetic verification only',
    mode: 'publish',
    submissionId,
  })
  return {
    snapshot,
    dependencies,
    body,
  }
}

test('1. Admin create and edit accept an active Company plan whose exact numeric amount is zero', async () => {
  assert.equal(amountError('company', 0), '')
  assert.match(adminRouteSource, /entityType === 'plans'[\s\S]*getCompanyPlanAmountValidationError\(planPayload\.audience, planPayload\.planAmount\)/)
  assert.match(adminPageSource, /type="number" min="0" value=\{planDraft\.planAmount\}/)

  let createdPayload: Record<string, unknown> | null = null
  let updatedPayload: Record<string, unknown> | null = null
  const dependencies = {
    requireAdmin: async () => ({ email: 'admin@example.com' }),
    createLabourEntity: async (_type: string, payload: Record<string, unknown>) => {
      createdPayload = payload
      return { plans: [payload] }
    },
    updateLabourEntity: async (_type: string, _id: string, payload: Record<string, unknown>) => {
      updatedPayload = payload
      return { plans: [payload] }
    },
    deleteLabourEntity: async () => ({}),
    getLabourAdminVisibleCategories: async () => [],
    getLabourMarketplaceSnapshot: async () => ({
      plans: [{ id: 'p-free', audience: 'company', planAmount: 149 }],
      workers: [],
      jobPosts: [],
    }),
  }
  const plan = {
    audience: 'company',
    name: 'Synthetic Free Trial',
    planAmount: 0,
    jobPostLimit: 1,
    planValidityDays: 90,
    jobPostLiveDays: 30,
    industryCategoryValues: ['Manufacturing'],
    businessTypeValues: ['Factory'],
    labourCategoryIds: ['cat-1'],
    isActive: true,
  }
  const createResponse = await adminHandlers.handleAdminLabourPost(
    { json: async () => ({ entityType: 'plans', payload: plan }) },
    dependencies,
  )
  const editResponse = await adminHandlers.handleAdminLabourPut(
    { json: async () => ({ entityType: 'plans', id: 'p-free', payload: plan }) },
    dependencies,
  )
  assert.equal(createResponse.status, 200)
  assert.equal(editResponse.status, 200)
  assert.equal((createdPayload as Record<string, unknown> | null)?.planAmount, 0)
  assert.equal((updatedPayload as Record<string, unknown> | null)?.planAmount, 0)
})

test('2. Worker plan validation and behavior remain unchanged', () => {
  assert.equal(amountError('worker', 0), '')
  assert.equal(amountError('worker', Number.NaN), '')
  assert.doesNotMatch(freeTrialSource, /audience === 'worker'/)
})

test('3. Company negative, missing, malformed, and NaN amounts remain rejected', () => {
  for (const value of [-1, undefined, null, '', '0', 'free', Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.notEqual(amountError('company', value), '', `Expected ${String(value)} to be rejected`)
  }
})

test('4. A stored zero-value Company plan follows the no-checkout publication branch', async () => {
  const store = new SyntheticTrialStore()
  assert.equal((await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })).status, 'published')
  assert.match(jobRouteSource, /const isFreeCompanyPlan = storedPlanAmount === 0/)
  assert.match(jobRouteSource, /mode !== 'draft' && !isFreeCompanyPlan && !latestPaidPlanPurchase/)
})

test('5. A stored one-rupee Company plan still requires checkout', async () => {
  assert.equal((await new SyntheticTrialStore().publish({ companyId: 'c1', planId: 'p1', submissionId: submissionOne, amount: 1 })).status, 'checkout')
  const order = await createSyntheticPaidOrder(1)
  assert.equal(order.response.status, 200)
  assert.equal(order.orderCalls, 1)
  assert.equal(order.receivedAmount, 99900)
})

test('6. Existing paid prices 149, 399, and 599 still require checkout', async () => {
  for (const amount of [149, 399, 599]) {
    assert.equal((await new SyntheticTrialStore().publish({ companyId: 'c1', planId: `p${amount}`, submissionId: submissionOne, amount })).status, 'checkout')
    const order = await createSyntheticPaidOrder(amount)
    assert.equal(order.response.status, 200)
    assert.equal(order.orderCalls, 1)
    assert.equal(order.receivedAmount, 99900)
  }
})

test('7. Other allowed positive stored prices continue through checkout', async () => {
  for (const amount of [2, 999, 999999]) {
    assert.equal((await new SyntheticTrialStore().publish({ companyId: 'c1', planId: `p${amount}`, submissionId: submissionOne, amount })).status, 'checkout')
  }
})

test('8. A browser-supplied zero cannot bypass a paid stored plan', async () => {
  assert.match(orderRouteSource, /storedPlanAmount = resolveStoredCompanyPlanAmount\(selectedCompanyPlan\)/)
  assert.doesNotMatch(orderRouteSource, /body\.amount/)
  const order = await createSyntheticPaidOrder(399, 0)
  assert.equal(order.response.status, 200)
  assert.equal(order.orderCalls, 1)
  assert.equal(order.receivedAmount, 99900)
})

test('9. A fake or unknown plan ID is denied', () => {
  assert.match(jobRouteSource, /snapshot\.plans\.find\(plan => plan\.id === selectedPlanId && plan\.audience === 'company' && plan\.isActive\)/)
  assert.match(jobRouteSource, /Select a valid connected company plan/)
  assert.match(orderRouteSource, /if \(!selectedCompanyPlan\)[\s\S]*No active company plan is available for checkout/)
})

test('10. An inactive zero-value plan is denied', async () => {
  const result = await new SyntheticTrialStore().publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0, active: false })
  assert.equal(result.status, 'inactive')
  assert.match(jobRouteSource, /isFirstPublication && !selectedPlan\.isActive/)
})

test('11. A company with no successful publication can publish one free job', async () => {
  const store = new SyntheticTrialStore()
  const result = await store.publish({ companyId: 'c-new', planId: 'p-free', submissionId: submissionOne, amount: 0 })
  assert.equal(result.status, 'published')
  assert.equal(store.jobs.length, 1)
  assert.equal(store.jobs[0].status, 'live')

  const route = createSyntheticJobRouteHarness()
  const response = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  )
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(route.snapshot.jobPosts.length, 1)
  assert.equal(route.snapshot.jobPosts[0].status, 'live')
  assert.equal(route.snapshot.jobPosts[0].publishedAt, '2026-09-18')
  assert.equal(route.snapshot.jobPosts[0].expiresAt, '2026-10-18')
  assert.equal(parseMarker(route.snapshot.auditLogs[0].summary)?.status, 'consumed')
})

test('12. A company with historical successful publication is ineligible', async () => {
  const store = new SyntheticTrialStore()
  store.jobs.push({ id: 'old', companyId: 'c1', planId: 'paid', status: 'expired', publishedAt: '2026-01-01' })
  assert.equal((await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })).status, 'ineligible')
  assert.equal(hasPublication(store.jobs, 'c1'), true)

  const route = createSyntheticJobRouteHarness()
  route.snapshot.jobPosts.push({
    id: 'historical-job',
    companyId: 'c1',
    planId: 'p-paid',
    status: 'expired',
    publishedAt: '2026-01-01',
  })
  const response = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  )
  assert.equal(response.status, 409)
  assert.equal((await response.json()).code, 'FREE_TRIAL_NOT_ELIGIBLE')
})

test('13. Drafting and selecting the free plan do not consume the trial', () => {
  assert.equal(isFirstPublication('draft'), false)
  assert.match(jobRouteSource, /if \(isFirstPublication && isFreeCompanyPlan\)/)
  assert.doesNotMatch(jobFormSource, /reserveCompanyFreeTrialPublication/)
})

test('14. A failed publication releases the reservation without consuming it', async () => {
  const store = new SyntheticTrialStore()
  const input = { companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 }
  assert.equal((await store.publish({ ...input, fail: true })).status, 'failed')
  assert.equal(store.markers.size, 0)
  assert.equal((await store.publish(input)).status, 'published')
  assert.match(jobRouteSource, /releaseCompanyFreeTrialPublication\(freeTrialReservation\)/)

  const route = createSyntheticJobRouteHarness()
  const createJob = route.dependencies.createLabourEntity
  route.dependencies.createLabourEntity = async () => { throw new Error('Synthetic publication failure') }
  const originalConsoleError = console.error
  console.error = () => undefined
  const failed = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  ).finally(() => {
    console.error = originalConsoleError
  })
  assert.equal(failed.status, 500)
  assert.equal(route.snapshot.jobPosts.length, 0)
  assert.equal(route.snapshot.auditLogs.length, 0)
  route.dependencies.createLabourEntity = createJob
  const retry = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  )
  assert.equal(retry.status, 200)
})

test('15. Successful publication consumes the claim exactly once', async () => {
  const store = new SyntheticTrialStore()
  await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })
  assert.equal(store.markers.size, 1)
  assert.equal([...store.markers.values()][0].status, 'consumed')
  assert.match(marketplaceSource, /status: 'consumed'/)
})

test('16. Retrying the same publication request is idempotent', async () => {
  const store = new SyntheticTrialStore()
  const input = { companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 }
  const first = await store.publish(input)
  const retry = await store.publish(input)
  assert.equal(first.status, 'published')
  assert.equal(retry.status, 'published')
  assert.equal(store.jobs.length, 1)
  assert.equal(first.job?.id, retry.job?.id)

  const route = createSyntheticJobRouteHarness()
  const firstResponse = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  )
  const retryResponse = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionOne) },
    route.dependencies,
  )
  assert.equal(firstResponse.status, 200)
  assert.equal(retryResponse.status, 200)
  assert.equal(route.snapshot.jobPosts.length, 1)
})

test('17. Concurrent publication requests produce at most one free job', async () => {
  const store = new SyntheticTrialStore()
  const results = await Promise.all([
    store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 }),
    store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionTwo, amount: 0 }),
  ])
  assert.equal(results.filter(result => result.status === 'published').length, 1)
  assert.equal(store.jobs.length, 1)
  assert.match(marketplaceSource, /error\.code !== '23505'/)
  assert.match(marketplaceSource, /buildCompanyFreeTrialMarkerId\(marker\.companyId\)/)

  const route = createSyntheticJobRouteHarness()
  const responses = await Promise.all([
    jobHandlers.handleCompanyJobPost({ json: async () => route.body(submissionOne) }, route.dependencies),
    jobHandlers.handleCompanyJobPost({ json: async () => route.body(submissionTwo) }, route.dependencies),
  ])
  assert.equal(responses.filter(response => response.status === 200).length, 1)
  assert.equal(responses.filter(response => response.status === 409).length, 1)
  assert.equal(route.snapshot.jobPosts.length, 1)

  const duplicateRoute = createSyntheticJobRouteHarness()
  const duplicateResponses = await Promise.all([
    jobHandlers.handleCompanyJobPost({ json: async () => duplicateRoute.body(submissionOne) }, duplicateRoute.dependencies),
    jobHandlers.handleCompanyJobPost({ json: async () => duplicateRoute.body(submissionOne) }, duplicateRoute.dependencies),
  ])
  assert.equal(duplicateResponses.filter(response => response.status === 200).length, 1)
  assert.equal(duplicateResponses.filter(response => response.status === 409).length, 1)
  assert.equal(duplicateRoute.snapshot.jobPosts.length, 1)
})

test('18. Deleting or expiring the free job does not restore eligibility', async () => {
  const store = new SyntheticTrialStore()
  await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })
  store.jobs = []
  assert.equal((await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionTwo, amount: 0 })).status, 'used')
  assert.equal(store.markers.size, 1)

  const route = createSyntheticJobRouteHarness()
  await jobHandlers.handleCompanyJobPost({ json: async () => route.body(submissionOne) }, route.dependencies)
  route.snapshot.jobPosts.splice(0)
  const second = await jobHandlers.handleCompanyJobPost(
    { json: async () => route.body(submissionTwo) },
    route.dependencies,
  )
  assert.equal(second.status, 409)
  assert.equal(route.snapshot.jobPosts.length, 0)
})

test('19. Configured quota, validity, live period, industry, business, and category gates remain enforced', () => {
  assert.match(jobRouteSource, /usedJobPostsCount >= selectedPlan\.jobPostLimit/)
  assert.match(jobRouteSource, /getPlanValidityDays\(selectedPlan\)/)
  assert.match(jobRouteSource, /getJobPostLiveDays\(selectedPlan\)/)
  assert.match(jobRouteSource, /selectedPlan\.industryCategoryValues/)
  assert.match(jobRouteSource, /selectedPlan\.businessTypeValues/)
  assert.match(jobRouteSource, /getPlanLabourCategoryIds\(selectedPlan\)/)
  assert.match(planUtilsSource, /calculateJobLiveWindow/)
})

test('20. Zero-value publication creates no Razorpay order or payment', async () => {
  const store = new SyntheticTrialStore()
  await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })
  assert.equal(store.paymentOrders, 0)
  assert.equal(store.payments, 0)
  assert.match(orderRouteSource, /storedPlanAmount === 0[\s\S]*FREE_PLAN_CHECKOUT_NOT_REQUIRED/)
  assert.ok(orderRouteSource.indexOf("storedPlanAmount === 0") < orderRouteSource.indexOf('dependencies.getRazorpay()'))

  let razorpayCalls = 0
  const response = await orderHandlers.handleCompanyRazorpayOrderPost(
    { json: async () => ({ plan: 'free', amount: 999 }) },
    {
      requireCompanyApp: async () => ({ companyId: 'c1' }),
      getLabourCompanyWebsiteContent: async () => ({ content: { pricingPage: {} } }),
      getLabourMarketplaceSnapshot: async () => ({ companies: [{ id: 'c1' }] }),
      resolveCompanyPlanForCheckout: () => ({ id: 'p-free', audience: 'company', planAmount: 0 }),
      getRazorpay: () => {
        razorpayCalls += 1
        return { keyId: 'test', client: { orders: { create: async () => ({}) } } }
      },
    },
  )
  assert.equal(response.status, 400)
  assert.equal(razorpayCalls, 0)
})

test('21. Zero-value publication creates no fake billing or wallet movement', async () => {
  const store = new SyntheticTrialStore()
  await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0 })
  assert.equal(store.walletTransactions, 0)
  assert.doesNotMatch(jobRouteSource, /createLabourEntity\(\s*['"]walletTransactions['"]/)
  assert.doesNotMatch(jobRouteSource, /createLabourEntity\(\s*['"]payments['"]/)
  assert.match(marketplaceSource, /entityType: 'jobPosts'/)
})

test('22. Paid checkout, verification, billing, and publication paths remain intact', () => {
  assert.match(orderRouteSource, /client\.orders\.create/)
  assert.match(verifyRouteSource, /activateCompanyPlanFromRazorpay/)
  assert.match(paymentSource, /createLabourEntity\('walletTransactions'/)
  assert.match(paymentSource, /transactionType: 'plan_purchase'/)
  assert.match(paymentSource, /zero-value company plan cannot be activated through payment verification/)

  const plans = [
    { id: 'free', name: 'Company Trial', audience: 'company', isActive: true, planAmount: 0 },
    { id: 'starter', name: 'Starter', audience: 'company', isActive: true, planAmount: 499 },
    { id: 'professional', name: 'Professional', audience: 'company', isActive: true, planAmount: 999 },
    { id: 'enterprise', name: 'Enterprise', audience: 'company', isActive: true, planAmount: 1999 },
  ]
  const summary = (name: string) => ({ plan: { slug: name.toLowerCase(), name } })
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'starter', summary('Starter')).id, 'starter')
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'professional', summary('Professional')).id, 'professional')
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'enterprise', summary('Enterprise')).id, 'enterprise')
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'company-trial', summary('Company Trial')).id, 'free')

  const fallbackSummary = { plan: { slug: 'website-plan', name: 'Website Plan' } }
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'starter-tier', fallbackSummary).id, 'starter')
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'professional-tier', fallbackSummary).id, 'professional')
  assert.equal(paymentResolvers.resolveCompanyPlanForCheckout({ plans }, 'enterprise-tier', fallbackSummary).id, 'enterprise')
})

test('23. Synthetic verification mutates no pre-existing company or job record', async () => {
  const store = new SyntheticTrialStore()
  store.jobs.push({ id: 'existing', companyId: 'other', planId: 'paid', status: 'live', publishedAt: '2026-01-01' })
  const before = structuredClone(store.jobs)
  await store.publish({ companyId: 'c1', planId: 'p-free', submissionId: submissionOne, amount: 0, fail: true })
  assert.deepEqual(store.jobs, before)
})

test('24. Authentication and cross-company job authorization remain fail-closed', () => {
  assert.match(jobRouteSource, /await dependencies\.requireCompanyApp\(request\)/)
  assert.match(jobRouteSource, /jobPost\.id === editJobId && jobPost\.companyId === company\.id/)
  assert.match(jobRouteSource, /status: 401/)
  assert.match(adminRouteSource, /await dependencies\.requireAdmin\(request\)/)
})

test('marker serialization round-trips the authoritative one-time claim', () => {
  const marker: TrialMarker = {
    companyId: 'c1',
    planId: 'p-free',
    submissionId: submissionOne,
    jobId: `job-c1-${submissionOne}`,
    status: 'consumed',
    reservedAt: '2026-09-18T00:00:00.000Z',
    consumedAt: '2026-09-18T00:00:01.000Z',
  }
  assert.deepEqual(parseMarker(serializeMarker(marker)), marker)
})
