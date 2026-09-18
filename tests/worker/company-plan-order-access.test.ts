import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const root = process.cwd()
const read = (...parts: string[]) => readFileSync(path.join(root, ...parts), 'utf8')
const planUtilsSource = read('lib', 'labour-plan-utils.ts')
const adminPageSource = read('app', 'admin', 'labour', 'page.tsx')
const adminRouteSource = read('app', 'api', 'admin', 'labour', 'route.ts')
const jobPageSource = read('app', 'labour', 'company', 'job-post', 'page.tsx')
const jobFormSource = read('app', 'labour', 'company', 'company-job-post-form.tsx')
const jobRouteSource = read('app', 'api', 'labour', 'company', 'job-post', 'route.ts')
const orderRouteSource = read('app', 'api', 'labour', 'company', 'payments', 'razorpay', 'order', 'route.ts')
const marketplaceSource = read('lib', 'labour-marketplace.ts')
const migrationSource = read('supabase', 'migrations', '20260918125401_labour_plan_display_order.sql')
const rollbackSource = read('supabase', 'rollbacks', '20260918125401_labour_plan_display_order.rollback.sql')

const importTranspiled = async (source: string) => {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

const stripImports = (source: string) => source.replace(/import[\s\S]*?from ['"][^'"]+['"]\r?\n/g, '')

const planUtils = await importTranspiled(planUtilsSource)
const getCompanyPlanAccessEligibility = planUtils.getCompanyPlanAccessEligibility as (
  plan: Record<string, unknown>,
  selection: Record<string, unknown>,
) => { eligible: boolean; code: string; error: string }

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
  const getPlanLabourCategoryIds = plan => plan.labourCategoryIds || (plan.categoryId ? [plan.categoryId] : [])
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
  const requireCompanyApp = async () => ({ companyId: 'company-1' })
  const createLabourEntity = async () => ({ jobPosts: [] })
  const updateLabourEntity = async () => null
  const getCompanyJobPublicationHistory = async () => null
  const recordCompanyJobPublication = async input => input
  const reserveCompanyFreeTrialPublication = async () => ({ status: 'conflict', marker: null })
  const completeCompanyFreeTrialPublication = async () => null
  const releaseCompanyFreeTrialPublication = async () => null
  const getLabourMarketplaceSnapshot = async () => ({})
  const findCompanyFreeTrialMarker = () => null
  const hasSuccessfulCompanyJobPublication = (jobs, companyId) => jobs.some(job =>
    job.companyId === companyId && (Boolean(job.publishedAt) || ['live', 'published', 'active'].includes(String(job.status || '').toLowerCase()))
  )
  const isMatchingCompanyFreeTrialRetry = () => false
  const resolveStoredCompanyPlanAmount = plan =>
    plan.audience === 'company' && typeof plan.planAmount === 'number' && Number.isFinite(plan.planAmount) && plan.planAmount >= 0
      ? plan.planAmount
      : null
  const sendNewJobSubmittedForReviewEmail = async () => undefined
  ${stripImports(jobRouteSource)}
`)

const orderHandlers = await importTranspiled(`
  class Razorpay { constructor() {} }
  const NextResponse = { json: (body, init) => Response.json(body, init) }
  const requireCompanyApp = async () => ({ companyId: 'company-1' })
  const getLabourCompanyWebsiteContent = async () => ({ content: { pricingPage: {} } })
  const getLabourMarketplaceSnapshot = async () => ({ companies: [] })
  const getLabourMastersSnapshot = async () => ({ options: [], industryBusinessDependencies: [], categoryDependencies: [] })
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
  const resolveCompanyPlanForCheckout = () => null
  const resolveStoredCompanyPlanAmount = plan =>
    plan.audience === 'company' && typeof plan.planAmount === 'number' && Number.isFinite(plan.planAmount) && plan.planAmount >= 0
      ? plan.planAmount
      : null
  const createCheckoutSummary = ({ planSlug, billingMode }) => ({
    plan: { slug: planSlug || '' },
    planTitle: 'Synthetic plan',
    billingMode: billingMode || 'monthly',
    total: 1,
  })
  ${stripImports(orderRouteSource)}
`)

const matchingPlan = {
  id: 'company-free-textile-retailer-finishing',
  audience: 'company',
  isActive: true,
  planAmount: 0,
  jobPostLimit: 1,
  planValidityDays: 90,
  validityDays: 90,
  jobPostLiveDays: 30,
  name: 'Synthetic Free Trial',
  industryCategoryValues: ['Textile & Garments'],
  businessTypeValues: ['Retailer'],
  labourCategoryIds: ['finishing-worker'],
}
const matchingSelection = {
  industryCategoryValue: 'Textile & Garments',
  businessTypeValue: 'Retailer',
  labourCategoryId: 'finishing-worker',
}

const company = {
  id: 'company-1',
  companyName: 'Synthetic Textile Retailer',
  contactPerson: 'Synthetic Owner',
  email: 'owner@example.com',
  mobile: '9999999999',
  contactMobile: '9999999998',
  businessType: matchingSelection.businessTypeValue,
  industryCategory: matchingSelection.industryCategoryValue,
  companyAddress: '1 Synthetic Road',
  state: 'Rajasthan',
  city: 'Jaipur',
  area: 'Sitapura',
  pincode: '302022',
  status: 'active',
  activePlan: '',
}

const category = { id: matchingSelection.labourCategoryId, name: 'Finishing Worker', isActive: true }
const masters = {
  options: [
    { id: 'industry-1', masterKey: 'industry_category', label: matchingSelection.industryCategoryValue, value: matchingSelection.industryCategoryValue, slug: 'textile-garments', isActive: true },
    { id: 'business-1', masterKey: 'business_type', label: matchingSelection.businessTypeValue, value: matchingSelection.businessTypeValue, slug: 'retailer', isActive: true },
  ],
  industryBusinessDependencies: [],
  categoryDependencies: [],
}

type MutationMetrics = {
  companyUpdates: number
  jobCreates: number
  jobUpdates: number
  reservations: number
  publicationHistory: number
  razorpayOrders: number
  payments: number
  walletTransactions: number
  billingEntries: number
}

const createMetrics = (): MutationMetrics => ({
  companyUpdates: 0,
  jobCreates: 0,
  jobUpdates: 0,
  reservations: 0,
  publicationHistory: 0,
  razorpayOrders: 0,
  payments: 0,
  walletTransactions: 0,
  billingEntries: 0,
})

const createJobHarness = (planOverrides: Record<string, unknown> = {}) => {
  const plan = { ...matchingPlan, ...planOverrides }
  const metrics = createMetrics()
  const snapshot = {
    companies: [{ ...company }],
    plans: [plan],
    categories: [{ ...category }],
    jobPosts: [] as Array<Record<string, unknown>>,
    walletTransactions: [] as Array<Record<string, unknown>>,
    payments: [] as Array<Record<string, unknown>>,
    billingEntries: [] as Array<Record<string, unknown>>,
    auditLogs: [] as Array<Record<string, unknown>>,
  }
  const dependencies = {
    getLabourMarketplaceSnapshot: async () => snapshot,
    getLabourMastersSnapshot: async () => masters,
    getCompanyPlanAccessEligibility,
    requireCompanyApp: async () => ({ companyId: company.id }),
    updateLabourEntity: async (entityType: string, id: string, payload: Record<string, unknown>) => {
      if (entityType === 'companies') {
        metrics.companyUpdates += 1
        snapshot.companies = snapshot.companies.map(item => item.id === id ? { ...item, ...payload } : item)
      } else if (entityType === 'jobPosts') {
        metrics.jobUpdates += 1
        snapshot.jobPosts = snapshot.jobPosts.map(item => item.id === id ? { ...item, ...payload } : item)
      }
      return snapshot
    },
    createLabourEntity: async (entityType: string, payload: Record<string, unknown>) => {
      assert.equal(entityType, 'jobPosts')
      metrics.jobCreates += 1
      snapshot.jobPosts.push({ ...payload, createdAt: '2026-09-18T12:00:00.000Z', updatedAt: '2026-09-18T12:00:00.000Z' })
      return snapshot
    },
    getCompanyJobPublicationHistory: async () => null,
    recordCompanyJobPublication: async (input: Record<string, unknown>) => {
      metrics.publicationHistory += 1
      return input
    },
    reserveCompanyFreeTrialPublication: async (input: Record<string, unknown>, reservedAt: string) => {
      metrics.reservations += 1
      return { status: 'claimed', marker: { ...input, status: 'reserved', reservedAt, consumedAt: '' } }
    },
    completeCompanyFreeTrialPublication: async () => undefined,
    releaseCompanyFreeTrialPublication: async () => undefined,
    now: () => new Date('2026-09-18T12:00:00.000Z'),
  }
  const body = (overrides: Record<string, unknown> = {}) => ({
    jobTitle: 'Synthetic Finishing Worker',
    labourCategoryId: matchingSelection.labourCategoryId,
    selectedPlanId: plan.id,
    workerCategory: 'Finishing Worker',
    workersRequired: 1,
    salaryType: 'Monthly Salary',
    salaryAmount: 20000,
    jobDescription: 'Synthetic route verification only',
    mode: 'publish',
    submissionId: 'company-job-post-1789725600000',
    ...overrides,
  })
  return { plan, metrics, snapshot, dependencies, body }
}

const assertNoMutations = (metrics: MutationMetrics) => {
  assert.deepEqual(metrics, createMetrics())
}

test('strict Company plan access requires an exact Industry + Business Type + Labour Category match', () => {
  assert.deepEqual(
    getCompanyPlanAccessEligibility(matchingPlan, matchingSelection),
    { eligible: true, code: 'eligible', error: '' },
  )
  assert.equal(getCompanyPlanAccessEligibility(matchingPlan, { ...matchingSelection, industryCategoryValue: 'Food Processing' }).code, 'industry_mismatch')
  assert.equal(getCompanyPlanAccessEligibility(matchingPlan, { ...matchingSelection, businessTypeValue: 'Manufacturer' }).code, 'business_type_mismatch')
  assert.equal(getCompanyPlanAccessEligibility(matchingPlan, { ...matchingSelection, labourCategoryId: 'stitching-worker' }).code, 'labour_category_mismatch')
})

test('missing selections and empty plan access configuration fail closed', () => {
  for (const selection of [
    { ...matchingSelection, industryCategoryValue: '' },
    { ...matchingSelection, businessTypeValue: '' },
    { ...matchingSelection, labourCategoryId: '' },
  ]) {
    assert.equal(getCompanyPlanAccessEligibility(matchingPlan, selection).code, 'missing_selection')
  }
  for (const plan of [
    { ...matchingPlan, industryCategoryValues: [] },
    { ...matchingPlan, businessTypeValues: [] },
    { ...matchingPlan, labourCategoryIds: [] },
  ]) {
    assert.equal(getCompanyPlanAccessEligibility(plan, matchingSelection).code, 'incomplete_plan_access')
  }
})

test('job-post route rejects forged, inactive, wrong-audience, incomplete, and mismatched plans before mutation', async () => {
  const cases = [
    { plan: {}, body: { selectedPlanId: 'forged-plan-id' } },
    { plan: { isActive: false }, body: {} },
    { plan: { audience: 'worker' }, body: {} },
    { plan: { industryCategoryValues: [] }, body: {} },
    { plan: { businessTypeValues: [] }, body: {} },
    { plan: { labourCategoryIds: [] }, body: {} },
    { plan: { industryCategoryValues: ['Food Processing'] }, body: {} },
    { plan: { businessTypeValues: ['Manufacturer'] }, body: {} },
    { plan: { labourCategoryIds: ['stitching-worker'] }, body: {} },
  ]

  for (const scenario of cases) {
    const harness = createJobHarness(scenario.plan)
    const response = await jobHandlers.handleCompanyJobPost(
      { json: async () => harness.body(scenario.body) },
      harness.dependencies,
    )
    assert.equal(response.status, 400)
    assert.equal(harness.snapshot.jobPosts.length, 0)
    assertNoMutations(harness.metrics)
  }
})

test('matched ₹0 plan publishes without checkout and preserves configured validity/live period', async () => {
  const harness = createJobHarness()
  const response = await jobHandlers.handleCompanyJobPost(
    { json: async () => harness.body() },
    harness.dependencies,
  )
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(harness.metrics.jobCreates, 1)
  assert.equal(harness.metrics.reservations, 1)
  assert.equal(harness.metrics.publicationHistory, 1)
  assert.equal(harness.metrics.razorpayOrders, 0)
  assert.equal(harness.metrics.payments, 0)
  assert.equal(harness.metrics.walletTransactions, 0)
  assert.equal(harness.metrics.billingEntries, 0)
  assert.equal(harness.snapshot.jobPosts[0].status, 'live')
  assert.equal(harness.snapshot.jobPosts[0].expiresAt, '2026-10-18')
  assert.match(String(harness.snapshot.jobPosts[0].description), /Plan valid until: 2026-12-17/)
})

test('matched positive-price plan saves selection then creates the existing Razorpay checkout order', async () => {
  const harness = createJobHarness({ id: 'paid-plan-1', name: 'Paid ₹1', planAmount: 1 })
  const draftResponse = await jobHandlers.handleCompanyJobPost(
    { json: async () => harness.body({ mode: 'draft', selectedPlanId: 'paid-plan-1' }) },
    harness.dependencies,
  )
  const draftPayload = await draftResponse.json()
  assert.equal(draftResponse.status, 200)
  assert.equal(harness.metrics.jobCreates, 1)
  assert.equal(harness.metrics.reservations, 0)

  const orderDependencies = {
    requireCompanyApp: async () => ({ companyId: company.id }),
    getLabourCompanyWebsiteContent: async () => ({ content: { pricingPage: {} } }),
    getLabourMarketplaceSnapshot: async () => harness.snapshot,
    getLabourMastersSnapshot: async () => masters,
    getCompanyPlanAccessEligibility,
    resolveCompanyPlanForCheckout: () => harness.plan,
    getRazorpay: () => ({
      keyId: 'rzp_test_synthetic',
      client: {
        orders: {
          create: async ({ amount }: { amount: number }) => {
            harness.metrics.razorpayOrders += 1
            return { id: 'order-synthetic', amount, currency: 'INR' }
          },
        },
      },
    }),
  }
  const orderResponse = await orderHandlers.handleCompanyRazorpayOrderPost(
    { json: async () => ({ plan: 'paid-plan-1', billing: 'monthly', jobId: draftPayload.jobId }) },
    orderDependencies,
  )
  assert.equal(orderResponse.status, 200)
  assert.equal(harness.metrics.razorpayOrders, 1)
  assert.equal(harness.metrics.payments, 0)
  assert.equal(harness.metrics.walletTransactions, 0)
  assert.equal(harness.metrics.billingEntries, 0)
})

test('checkout route rejects forged or newly ineligible selections before Razorpay or billing mutation', async () => {
  for (const scenario of [
    { requestedPlan: 'forged-plan-id', plan: { id: 'paid-plan-1', planAmount: 1 } },
    { requestedPlan: 'paid-plan-1', plan: { id: 'paid-plan-1', planAmount: 1, industryCategoryValues: ['Food Processing'] } },
  ]) {
    const harness = createJobHarness(scenario.plan)
    harness.snapshot.jobPosts.push({
      id: 'saved-job-1',
      companyId: company.id,
      planId: 'paid-plan-1',
      categoryId: matchingSelection.labourCategoryId,
      status: 'draft',
    })
    const response = await orderHandlers.handleCompanyRazorpayOrderPost(
      { json: async () => ({ plan: scenario.requestedPlan, jobId: 'saved-job-1' }) },
      {
        requireCompanyApp: async () => ({ companyId: company.id }),
        getLabourCompanyWebsiteContent: async () => ({ content: { pricingPage: {} } }),
        getLabourMarketplaceSnapshot: async () => harness.snapshot,
        getLabourMastersSnapshot: async () => masters,
        getCompanyPlanAccessEligibility,
        resolveCompanyPlanForCheckout: () => scenario.requestedPlan === 'paid-plan-1' ? harness.plan : null,
        getRazorpay: () => ({
          keyId: 'rzp_test_synthetic',
          client: { orders: { create: async () => { harness.metrics.razorpayOrders += 1 } } },
        }),
      },
    )
    assert.equal(response.status, 400)
    assert.equal(harness.metrics.razorpayOrders, 0)
    assert.equal(harness.metrics.payments, 0)
    assert.equal(harness.metrics.walletTransactions, 0)
    assert.equal(harness.metrics.billingEntries, 0)
    assert.equal(harness.snapshot.jobPosts.length, 1)
  }
})

test('Admin controls enforce same-audience first/last boundaries and preserve Edit/Delete', () => {
  assert.match(adminPageSource, /planIdsByAudience\[plan\.audience\]/)
  assert.match(adminPageSource, /const canMoveUp = audiencePlanIndex > 0/)
  assert.match(adminPageSource, /const canMoveDown = audiencePlanIndex >= 0 && audiencePlanIndex < audiencePlanIds\.length - 1/)
  assert.match(adminPageSource, /disabled=\{!canMoveUp \|\| Boolean\(movingPlanId\)\}/)
  assert.match(adminPageSource, /disabled=\{!canMoveDown \|\| Boolean\(movingPlanId\)\}/)
  assert.match(adminPageSource, />Edit<\/button>/)
  assert.match(adminPageSource, />Delete<\/button>/)
  assert.match(adminRouteSource, /action !== 'movePlan'/)
  assert.match(adminRouteSource, /dependencies\.moveLabourPlan \|\| moveLabourPlan/)
})

test('saved database order feeds Company plans while Worker and Company plans remain separated', () => {
  assert.match(marketplaceSource, /order\('audience',[\s\S]*order\('display_order',[\s\S]*order\('id'/)
  assert.match(marketplaceSource, /interface LabourPlanRecord[\s\S]*displayOrder\?: number/)
  assert.match(marketplaceSource, /readSupabasePlans\(\)/)
  assert.match(jobPageSource, /snapshot\.plans\.filter\(plan => plan\.isActive && plan\.audience === 'company'\)/)
  assert.match(jobFormSource, /eligiblePlans\.filter\(plan => connectedPlanIds\.has\(plan\.id\)\)/)
  assert.doesNotMatch(jobPageSource, /sort\(/)
})

test('migration and rollback are bounded, transactional, deterministic, audience-scoped, and least-privileged', () => {
  assert.match(migrationSource, /^begin;/i)
  assert.match(migrationSource, /set local lock_timeout = '5s'/i)
  assert.match(migrationSource, /set local statement_timeout = '30s'/i)
  assert.match(migrationSource, /partition by audience[\s\S]*order by created_at asc, id asc/i)
  assert.match(migrationSource, /unique \(audience, display_order\)[\s\S]*deferrable initially deferred/i)
  assert.match(migrationSource, /pg_advisory_xact_lock/)
  assert.match(migrationSource, /new\.audience is distinct from old\.audience/i)
  assert.match(migrationSource, /revoke all on function public\.assign_labour_plan_display_order\(\) from public/i)
  assert.match(migrationSource, /revoke all on function public\.assign_labour_plan_display_order\(\) from anon/i)
  assert.match(migrationSource, /revoke all on function public\.assign_labour_plan_display_order\(\) from authenticated/i)
  assert.match(migrationSource, /revoke all on function public\.assign_labour_plan_display_order\(\) from service_role/i)
  assert.doesNotMatch(migrationSource, /grant execute on function public\.assign_labour_plan_display_order/)
  assert.match(migrationSource, /grant execute on function public\.move_labour_plan\(text, text\) to service_role/i)
  assert.match(migrationSource, /commit;\s*$/i)
  assert.match(rollbackSource, /^-- Rollback[\s\S]*begin;/i)
  assert.match(rollbackSource, /drop trigger if exists assign_labour_plan_display_order/)
  assert.match(rollbackSource, /drop column if exists display_order/)
  assert.match(rollbackSource, /commit;\s*$/i)
})

test('both production mutation routes use the shared strict eligibility helper before mutation', () => {
  assert.match(jobRouteSource, /dependencies\.getCompanyPlanAccessEligibility \|\| getCompanyPlanAccessEligibilityFallback/)
  assert.ok(jobRouteSource.indexOf('dependencies.getCompanyPlanAccessEligibility || getCompanyPlanAccessEligibilityFallback') < jobRouteSource.indexOf('dependencies.createLabourEntity('))
  assert.match(orderRouteSource, /dependencies\.getCompanyPlanAccessEligibility\(selectedCompanyPlan/)
  assert.ok(orderRouteSource.indexOf('dependencies.getCompanyPlanAccessEligibility(selectedCompanyPlan') < orderRouteSource.indexOf('dependencies.getRazorpay()'))
  assert.match(jobRouteSource, /code: 'PLAN_ACCESS_NOT_ELIGIBLE'/)
  assert.match(orderRouteSource, /code: 'PLAN_ACCESS_NOT_ELIGIBLE'/)
})
