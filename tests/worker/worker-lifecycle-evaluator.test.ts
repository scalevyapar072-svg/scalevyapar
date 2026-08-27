import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

import type {
  LabourMarketplaceSnapshot,
  LabourPlanRecord,
  LabourWorkerRecord,
  LabourWalletTransactionRecord,
} from '../../lib/labour-marketplace.ts'
import type {
  WorkerLifecycleEvaluation,
  WorkerLifecycleFacts,
} from '../../lib/worker-lifecycle-evaluator.ts'

const {
  evaluateWorkerLifecycle,
} = await import(
  pathToFileURL(
    path.join(process.cwd(), 'lib', 'worker-lifecycle-evaluator.ts'),
  ).href,
)

const workspaceRoot = process.cwd()
const evaluatorSourcePath = path.join(workspaceRoot, 'lib', 'worker-lifecycle-evaluator.ts')

const readWorkspaceFile = (...segments: string[]) =>
  readFileSync(path.join(workspaceRoot, ...segments), 'utf8')

const sliceBetween = (source: string, startNeedle: string, endNeedle: string) => {
  const startIndex = source.indexOf(startNeedle)
  const endIndex = source.indexOf(endNeedle, startIndex)

  assert.notEqual(startIndex, -1, `Expected source to include ${startNeedle}`)
  assert.notEqual(endIndex, -1, `Expected source to include ${endNeedle}`)

  return source.slice(startIndex, endIndex)
}

const withVisibility = (
  registrationComplete: boolean,
  derivedStatus: LabourWorkerRecord['status'],
  reasonCategory: WorkerLifecycleEvaluation['reasonCategory'],
): WorkerLifecycleEvaluation => ({
  derivedStatus,
  reasonCategory,
  recommendedIsVisible: registrationComplete && derivedStatus === 'active',
})

const normalizeDateValue = (value: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

const isZeroChargeWorkerPlan = (facts: WorkerLifecycleFacts) =>
  facts.planAudience === 'worker' &&
  facts.planRegistrationFee <= 0 &&
  facts.planDailyCharge <= 0

const isFreeWorkerPlan = (facts: WorkerLifecycleFacts) =>
  facts.planAudience === 'worker' &&
  (facts.activePlanId === 'plan-worker-free-7-days' ||
    facts.planName.trim().toLowerCase() === 'free worker plan' ||
    isZeroChargeWorkerPlan(facts))

const isPaidWorkerPlan = (facts: WorkerLifecycleFacts) =>
  facts.planAudience === 'worker' && !isFreeWorkerPlan(facts)

const isRegistrationFeeSettled = (facts: WorkerLifecycleFacts) => {
  if (facts.planRegistrationFee <= 0) {
    return true
  }

  return facts.registrationFeePaid || facts.hasCompletedRegistrationFeeTransaction
}

const getOutstandingRegistrationFee = (facts: WorkerLifecycleFacts) => {
  if (facts.planRegistrationFee <= 0 || isRegistrationFeeSettled(facts)) {
    return 0
  }

  return facts.planRegistrationFee
}

const isPlanExpired = (facts: WorkerLifecycleFacts) => {
  const expiryDateValue = normalizeDateValue(facts.planValidUntil)
  const currentDateValue = normalizeDateValue(facts.currentDateValue)

  if (!expiryDateValue || !currentDateValue) {
    return true
  }

  return expiryDateValue < currentDateValue
}

const evaluateCanonicalReference = (
  facts: WorkerLifecycleFacts,
): WorkerLifecycleEvaluation => {
  if (facts.persistedStatus === 'blocked') {
    return withVisibility(
      facts.registrationComplete,
      'blocked',
      'persisted_blocked',
    )
  }

  if (facts.persistedStatus === 'rejected') {
    return withVisibility(
      facts.registrationComplete,
      'rejected',
      'persisted_rejected',
    )
  }

  if (!facts.registrationComplete) {
    return withVisibility(
      facts.registrationComplete,
      'pending',
      'registration_incomplete',
    )
  }

  if (facts.persistedStatus === 'pending') {
    return withVisibility(
      facts.registrationComplete,
      'pending',
      'persisted_pending',
    )
  }

  if (
    !facts.activePlanId.trim() ||
    !facts.planResolved ||
    facts.planAudience !== 'worker'
  ) {
    return withVisibility(
      facts.registrationComplete,
      'inactive_subscription_expired',
      'missing_active_plan',
    )
  }

  if (isPlanExpired(facts)) {
    return withVisibility(
      facts.registrationComplete,
      'inactive_subscription_expired',
      'expired_active_plan',
    )
  }

  if (facts.workerPausedByWorker && isPaidWorkerPlan(facts)) {
    return withVisibility(
      facts.registrationComplete,
      'inactive_paused_by_worker',
      'worker_paused',
    )
  }

  const outstandingRegistrationFee = getOutstandingRegistrationFee(facts)
  if (outstandingRegistrationFee > 0 && facts.walletBalance < outstandingRegistrationFee) {
    return withVisibility(
      facts.registrationComplete,
      'inactive_wallet_empty',
      'registration_fee_unpaid',
    )
  }

  if (isZeroChargeWorkerPlan(facts)) {
    return withVisibility(
      facts.registrationComplete,
      'active',
      'eligible_active',
    )
  }

  if (facts.walletBalance <= 0) {
    return withVisibility(
      facts.registrationComplete,
      'inactive_wallet_empty',
      'wallet_balance_non_positive',
    )
  }

  return withVisibility(
    facts.registrationComplete,
    'active',
    'eligible_active',
  )
}

const makeFacts = (
  overrides: Partial<WorkerLifecycleFacts> = {},
): WorkerLifecycleFacts => ({
  persistedStatus: 'active',
  registrationComplete: true,
  workerPausedByWorker: false,
  activePlanId: 'worker-plan',
  planResolved: true,
  planAudience: 'worker',
  planName: 'Paid Worker Plan',
  planRegistrationFee: 0,
  planDailyCharge: 5,
  planValidUntil: '2099-01-01',
  walletBalance: 100,
  registrationFeePaid: true,
  hasCompletedRegistrationFeeTransaction: false,
  currentDateValue: '2026-08-27',
  ...overrides,
})

const makePlan = (
  id: string,
  overrides: Partial<LabourPlanRecord> = {},
): LabourPlanRecord => ({
  id,
  audience: 'worker',
  name: 'Paid Worker Plan',
  categoryId: undefined,
  industryCategoryValues: [],
  businessTypeValues: [],
  labourCategoryIds: [],
  jobPostLimit: 1,
  registrationFee: 0,
  walletCredit: 0,
  planAmount: 199,
  planValidityDays: 30,
  jobPostLiveDays: 30,
  validityDays: 30,
  dailyCharge: 5,
  description: '',
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

const makeWorker = (
  id: string,
  overrides: Partial<LabourWorkerRecord> = {},
): LabourWorkerRecord => ({
  id,
  fullName: `Worker ${id}`,
  mobile: '9876543210',
  city: 'Surat',
  homeCity: 'Surat',
  salaryType: 'daily',
  companyId: '',
  industryCategory: 'Textile',
  businessType: '',
  address: '',
  preferredWorkLocations: [],
  profilePhotoPath: '/uploads/profile.jpg',
  resumeDocumentPath: '',
  skills: [],
  experienceYears: 2,
  expectedDailyWage: 500,
  minimumExpectedWage: 450,
  maximumExpectedWage: 550,
  walletBalance: 100,
  registrationFeePaid: true,
  activePlan: 'worker-plan',
  planValidFrom: '2026-08-01',
  planValidUntil: '2099-01-01',
  lastWalletDeductionDate: '',
  workerPausedByWorker: false,
  workerPausedAt: '',
  workerReactivatedAt: '',
  status: 'active',
  kycStatus: 'approved',
  kycRemarks: '',
  availability: 'available_today',
  isVisible: true,
  categoryIds: ['cat-stitching'],
  identityProofType: 'aadhaar',
  identityProofNumber: '123456789012',
  identityProofPath: '/uploads/proof.jpg',
  registrationCompletedAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

const makeSnapshot = (
  worker: LabourWorkerRecord,
  plan: LabourPlanRecord,
): Pick<LabourMarketplaceSnapshot, 'plans' | 'walletTransactions'> => ({
  plans: [plan],
  walletTransactions: [],
})

const isWorkerRegistrationCompleteReference = (worker: LabourWorkerRecord) =>
  Boolean(worker.fullName.trim()) &&
  Boolean(worker.city.trim()) &&
  worker.categoryIds.length > 0 &&
  Boolean(worker.profilePhotoPath.trim()) &&
  Boolean(worker.identityProofType) &&
  Boolean(worker.identityProofNumber.trim()) &&
  Boolean(worker.identityProofPath.trim())

const isFreeWorkerPlanRecordReference = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
) =>
  Boolean(
    workerPlan &&
      workerPlan.audience === 'worker' &&
      (
        worker.activePlan === 'plan-worker-free-7-days' ||
        String(workerPlan.name || '').trim().toLowerCase() === 'free worker plan' ||
        (
          workerPlan.registrationFee <= 0 &&
          workerPlan.dailyCharge <= 0
        )
      ),
  )

const isPaidWorkerPlanRecordReference = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
) =>
  Boolean(
    workerPlan &&
      workerPlan.audience === 'worker' &&
      !isFreeWorkerPlanRecordReference(worker, workerPlan),
  )

const hasCompletedRegistrationFeeTransactionReference = (
  worker: LabourWorkerRecord,
  transactions: LabourMarketplaceSnapshot['walletTransactions'],
) =>
  transactions.some(
    (transaction) =>
      transaction.entityType === 'worker' &&
      transaction.entityId === worker.id &&
      transaction.transactionType === 'registration_fee' &&
      transaction.status === 'completed',
  )

const getOutstandingRegistrationFeeReference = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourMarketplaceSnapshot['walletTransactions'],
) => {
  const registrationFee = workerPlan?.registrationFee || 0
  if (
    registrationFee <= 0 ||
    worker.registrationFeePaid ||
    hasCompletedRegistrationFeeTransactionReference(worker, transactions)
  ) {
    return 0
  }

  return registrationFee
}

const isWorkerPlanExpiredReference = (
  worker: Pick<LabourWorkerRecord, 'planValidUntil'>,
  currentDateValue: string,
) => {
  const expiryDateValue = normalizeDateValue(worker.planValidUntil)
  if (!expiryDateValue) {
    return true
  }

  return expiryDateValue < normalizeDateValue(currentDateValue)
}

const deriveLegacyWorkerStatusReference = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null = null,
  transactions: LabourMarketplaceSnapshot['walletTransactions'] = [],
  currentDateValue = '2026-08-27',
): LabourWorkerRecord['status'] => {
  if (worker.status === 'blocked' || worker.status === 'rejected') {
    return worker.status
  }

  if (!isWorkerRegistrationCompleteReference(worker)) {
    return 'pending'
  }

  if (worker.status === 'pending') {
    return 'pending'
  }

  if (!worker.activePlan || !workerPlan || workerPlan.audience !== 'worker') {
    return 'inactive_subscription_expired'
  }

  if (isWorkerPlanExpiredReference(worker, currentDateValue)) {
    return 'inactive_subscription_expired'
  }

  if (
    isPaidWorkerPlanRecordReference(worker, workerPlan) &&
    (worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker')
  ) {
    return 'inactive_paused_by_worker'
  }

  const outstandingRegistrationFee = getOutstandingRegistrationFeeReference(
    worker,
    workerPlan,
    transactions,
  )
  if (outstandingRegistrationFee > 0 && worker.walletBalance < outstandingRegistrationFee) {
    return 'inactive_wallet_empty'
  }

  if (
    workerPlan &&
    workerPlan.audience === 'worker' &&
    workerPlan.registrationFee <= 0 &&
    workerPlan.dailyCharge <= 0
  ) {
    return 'active'
  }

  if (worker.walletBalance <= 0) {
    return 'inactive_wallet_empty'
  }

  return 'active'
}

const buildWorkerLifecycleFactsReference = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null = null,
  transactions: LabourMarketplaceSnapshot['walletTransactions'] = [],
  currentDateValue = '2026-08-27',
): WorkerLifecycleFacts => ({
  persistedStatus: worker.status,
  registrationComplete: isWorkerRegistrationCompleteReference(worker),
  workerPausedByWorker:
    worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker',
  activePlanId: worker.activePlan,
  planResolved: Boolean(workerPlan),
  planAudience:
    workerPlan?.audience === 'worker' || workerPlan?.audience === 'company'
      ? workerPlan.audience
      : '',
  planName: workerPlan?.name || '',
  planRegistrationFee: workerPlan?.registrationFee || 0,
  planDailyCharge: workerPlan?.dailyCharge || 0,
  planValidUntil: worker.planValidUntil,
  walletBalance: worker.walletBalance,
  registrationFeePaid: worker.registrationFeePaid,
  hasCompletedRegistrationFeeTransaction:
    hasCompletedRegistrationFeeTransactionReference(worker, transactions),
  currentDateValue,
})

test('mutation-side deriveWorkerStatus stays a thin compatibility wrapper over the approved evaluator facts contract', () => {
  const source = readWorkspaceFile('lib', 'labour-worker-app.ts')
  const deriveWorkerStatusBlock = sliceBetween(
    source,
    'const deriveWorkerStatus = (',
    'const ensureWorkerUploadBucket = async',
  )

  for (const expected of [
    'const lifecycleFacts: WorkerLifecycleFacts = {',
    'persistedStatus: worker.status,',
    'registrationComplete: isWorkerRegistrationComplete(worker),',
    "workerPausedByWorker: worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker',",
    'activePlanId: worker.activePlan,',
    'planResolved: Boolean(workerPlan),',
    "workerPlan?.audience === 'worker' || workerPlan?.audience === 'company'",
    "planName: workerPlan?.name || '',",
    'planRegistrationFee: workerPlan?.registrationFee || 0,',
    'planDailyCharge: workerPlan?.dailyCharge || 0,',
    'planValidUntil: worker.planValidUntil,',
    'walletBalance: worker.walletBalance,',
    'registrationFeePaid: worker.registrationFeePaid,',
    'hasCompletedRegistrationFeeTransaction: hasCompletedWorkerRegistrationFeeTransaction(worker, transactions),',
    'currentDateValue: getDateValue(new Date())',
    'return evaluateWorkerLifecycle(lifecycleFacts).derivedStatus',
  ]) {
    assert.ok(
      deriveWorkerStatusBlock.includes(expected),
      `Expected deriveWorkerStatus wrapper to include ${expected}`,
    )
  }

  assert.equal(
    deriveWorkerStatusBlock.includes("toString(worker.kycStatus).toLowerCase() === 'rejected'"),
    false,
  )
})

test('pure worker lifecycle evaluator stays side-effect free', () => {
  const source = readFileSync(evaluatorSourcePath, 'utf8')

  for (const disallowed of [
    'process.env',
    'Date.now(',
    'new Date(',
    'createClient(',
    'supabase',
    '.insert(',
    '.update(',
    '.upsert(',
    '.delete(',
    '/messages',
    'fetch(',
  ]) {
    assert.equal(
      source.includes(disallowed),
      false,
      `Expected pure evaluator source to exclude ${disallowed}`,
    )
  }
})

test('pure evaluator matches the canonical lifecycle contract across parity scenarios', () => {
  const cases = [
    {
      name: 'blocked',
      facts: makeFacts({ persistedStatus: 'blocked' }),
    },
    {
      name: 'rejected',
      facts: makeFacts({ persistedStatus: 'rejected' }),
    },
    {
      name: 'incomplete registration',
      facts: makeFacts({ registrationComplete: false }),
    },
    {
      name: 'stored pending',
      facts: makeFacts({ persistedStatus: 'pending' }),
    },
    {
      name: 'missing plan',
      facts: makeFacts({ activePlanId: '', planResolved: false }),
    },
    {
      name: 'expired plan',
      facts: makeFacts({ planValidUntil: '2026-08-26' }),
    },
    {
      name: 'plan expiring on evaluation date',
      facts: makeFacts({ planValidUntil: '2026-08-27' }),
    },
    {
      name: 'paid-plan worker pause',
      facts: makeFacts({ workerPausedByWorker: true }),
    },
    {
      name: 'registration fee settled by completed transaction',
      facts: makeFacts({
        planRegistrationFee: 99,
        registrationFeePaid: false,
        hasCompletedRegistrationFeeTransaction: true,
        walletBalance: 20,
      }),
    },
    {
      name: 'unpaid registration-fee gap',
      facts: makeFacts({
        planRegistrationFee: 99,
        registrationFeePaid: false,
        hasCompletedRegistrationFeeTransaction: false,
        walletBalance: 10,
      }),
    },
    {
      name: 'zero-charge free plan with zero wallet',
      facts: makeFacts({
        activePlanId: 'plan-worker-free-7-days',
        planName: 'Free Worker Plan',
        planRegistrationFee: 0,
        planDailyCharge: 0,
        walletBalance: 0,
      }),
    },
    {
      name: 'paid plan with zero wallet',
      facts: makeFacts({
        walletBalance: 0,
      }),
    },
    {
      name: 'eligible active worker',
      facts: makeFacts(),
    },
    {
      name: 'blank legacy kyc on stored active keeps current canonical outcome',
      facts: makeFacts(),
    },
    {
      name: 'pending_review kyc on stored active keeps current canonical outcome',
      facts: makeFacts(),
    },
  ] as const

  for (const testCase of cases) {
    const expected = evaluateCanonicalReference(testCase.facts)
    const actual = evaluateWorkerLifecycle(testCase.facts)
    assert.deepEqual(actual, expected, testCase.name)
  }
})

test('pure evaluator respects the explicit evaluation date boundary', () => {
  const facts = makeFacts({
    planValidUntil: '2026-08-27T00:00:00.000Z',
    currentDateValue: '2026-08-27',
  })

  assert.deepEqual(
    evaluateWorkerLifecycle(facts),
    withVisibility(true, 'active', 'eligible_active'),
  )

  assert.deepEqual(
    evaluateWorkerLifecycle({
      ...facts,
      currentDateValue: '2026-08-28',
    }),
    withVisibility(true, 'inactive_subscription_expired', 'expired_active_plan'),
  )
})

test('legacy mutation-side reference and compatibility-wrapper facts stay identical across approved parity scenarios', () => {
  type ParityCase = {
    name: string
    worker: LabourWorkerRecord
    plan: LabourPlanRecord | null
    transactions: LabourWalletTransactionRecord[]
    currentDateValue: string
  }

  const paidPlan = makePlan('worker-plan')
  const wrongAudiencePlan = makePlan('company-plan', { audience: 'company', dailyCharge: 10 })
  const freePlan = makePlan('plan-worker-free-7-days', {
    name: 'Free Worker Plan',
    registrationFee: 0,
    dailyCharge: 0,
  })
  const registrationFeePlan = makePlan('worker-plan-fee', {
    registrationFee: 99,
    dailyCharge: 10,
  })
  const completedRegistrationFeeTransaction: LabourWalletTransactionRecord = {
    id: 'txn-registration-fee',
    entityType: 'worker',
    entityId: 'worker-registration-fee',
    entityName: 'Worker Registration Fee',
    city: 'Surat',
    transactionType: 'registration_fee',
    amount: 99,
    direction: 'debit',
    status: 'completed',
    reference: 'worker-plan-fee',
    note: 'registration fee',
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  }

  const cases: ParityCase[] = [
    {
      name: 'blocked',
      worker: makeWorker('worker-blocked', { status: 'blocked' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'rejected',
      worker: makeWorker('worker-rejected', { status: 'rejected' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'incomplete registration',
      worker: makeWorker('worker-incomplete', { identityProofPath: '' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'stored pending',
      worker: makeWorker('worker-pending', { status: 'pending' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'missing plan',
      worker: makeWorker('worker-missing-plan', { activePlan: '' }),
      plan: null,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'wrong-audience unresolved plan',
      worker: makeWorker('worker-wrong-audience', { activePlan: 'company-plan' }),
      plan: wrongAudiencePlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'expired plan',
      worker: makeWorker('worker-expired', { planValidUntil: '2026-08-26' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'plan valid through evaluation date',
      worker: makeWorker('worker-valid-through-day', { planValidUntil: '2026-08-27' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'paid-plan self-pause',
      worker: makeWorker('worker-paused', {
        workerPausedByWorker: true,
        planValidUntil: '2026-08-27',
      }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'free-plan self-pause behavior',
      worker: makeWorker('worker-free-paused', {
        activePlan: 'plan-worker-free-7-days',
        workerPausedByWorker: true,
        walletBalance: 0,
      }),
      plan: freePlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'unpaid registration-fee gap',
      worker: makeWorker('worker-unpaid-registration-fee', {
        activePlan: 'worker-plan-fee',
        registrationFeePaid: false,
        walletBalance: 10,
      }),
      plan: registrationFeePlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'registration fee settled by flag',
      worker: makeWorker('worker-registration-fee-flag', {
        activePlan: 'worker-plan-fee',
        registrationFeePaid: true,
        walletBalance: 20,
      }),
      plan: registrationFeePlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'registration fee settled by completed transaction',
      worker: makeWorker('worker-registration-fee', {
        id: 'worker-registration-fee',
        activePlan: 'worker-plan-fee',
        registrationFeePaid: false,
        walletBalance: 20,
      }),
      plan: registrationFeePlan,
      transactions: [completedRegistrationFeeTransaction],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'zero-charge free plan with zero wallet',
      worker: makeWorker('worker-free-zero-wallet', {
        activePlan: 'plan-worker-free-7-days',
        walletBalance: 0,
      }),
      plan: freePlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'paid plan with zero wallet',
      worker: makeWorker('worker-paid-zero-wallet', { walletBalance: 0 }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'eligible active worker',
      worker: makeWorker('worker-eligible-active'),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'blank KYC on active',
      worker: makeWorker('worker-blank-kyc', { kycStatus: '' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'pending_review KYC on active',
      worker: makeWorker('worker-pending-review-kyc', { kycStatus: 'pending_review' }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
    {
      name: 'kyc_status rejected with non-rejected stored status',
      worker: makeWorker('worker-kyc-rejected-nonrejected-status', {
        kycStatus: 'rejected',
        status: 'active',
      }),
      plan: paidPlan,
      transactions: [],
      currentDateValue: '2026-08-27',
    },
  ]

  let mismatchCount = 0

  for (const testCase of cases) {
    const legacyStatus = deriveLegacyWorkerStatusReference(
      testCase.worker,
      testCase.plan,
      testCase.transactions,
      testCase.currentDateValue,
    )
    const wrapperStatus = evaluateWorkerLifecycle(
      buildWorkerLifecycleFactsReference(
        testCase.worker,
        testCase.plan,
        testCase.transactions,
        testCase.currentDateValue,
      ),
    ).derivedStatus

    if (legacyStatus !== wrapperStatus) {
      mismatchCount += 1
    }

    assert.equal(
      wrapperStatus,
      legacyStatus,
      `Expected wrapper parity for ${testCase.name}`,
    )
  }

  assert.equal(mismatchCount, 0)
})

test('legacy mutation-side reference and compatibility-wrapper facts stay identical across date boundaries', () => {
  const worker = makeWorker('worker-date-boundary', {
    planValidUntil: '2026-08-27T00:00:00.000Z',
  })
  const plan = makePlan('worker-plan')
  const currentDateValues = ['2026-08-26', '2026-08-27', '2026-08-28'] as const

  for (const currentDateValue of currentDateValues) {
    const legacyStatus = deriveLegacyWorkerStatusReference(worker, plan, [], currentDateValue)
    const wrapperStatus = evaluateWorkerLifecycle(
      buildWorkerLifecycleFactsReference(worker, plan, [], currentDateValue),
    ).derivedStatus

    assert.equal(
      wrapperStatus,
      legacyStatus,
      `Expected wrapper parity on evaluation date ${currentDateValue}`,
    )
  }
})

test('mutation-side callers still route lifecycle decisions through deriveWorkerStatus and existing activation flow', () => {
  const source = readWorkspaceFile('lib', 'labour-worker-app.ts')

  for (const expected of [
    'const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)',
    'const nextStatus = deriveWorkerStatus(nextWorker, workerPlan, transactions)',
    'const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)',
    "const nextStatus = deriveWorkerStatus({ ...worker, walletBalance: 0 }, workerPlan, transactions)",
    'const nextStatus = deriveWorkerStatus(nextWorker, workerPlan, transactions)',
    'const nextStatus = deriveWorkerStatus(',
    'const activation = deriveActivationSummary(',
  ]) {
    assert.ok(
      source.includes(expected),
      `Expected worker lifecycle caller flow to retain ${expected}`,
    )
  }
})

test('compatibility-wrapper facts do not let legacy kyc values override a non-rejected stored status', () => {
  const plan = makePlan('worker-plan')

  for (const kycStatus of ['rejected', '', 'pending_review'] as const) {
    const worker = makeWorker(`worker-${kycStatus || 'blank'}`, {
      kycStatus,
      status: 'active',
    })

    const evaluation = evaluateWorkerLifecycle(
      buildWorkerLifecycleFactsReference(
        worker,
        plan,
        makeSnapshot(worker, plan).walletTransactions,
        '2026-08-27',
      ),
    )

    assert.equal(evaluation.derivedStatus, 'active')
    assert.equal(evaluation.reasonCategory, 'eligible_active')
    assert.equal(evaluation.recommendedIsVisible, true)
  }
})
