import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import type {
  LabourMarketplaceSnapshot,
  LabourPlanRecord,
  LabourWorkerRecord,
} from '../../lib/labour-marketplace'
import {
  evaluateWorkerLifecycle,
  type WorkerLifecycleEvaluation,
  type WorkerLifecycleFacts,
} from '../../lib/worker-lifecycle-evaluator'
import { deriveWorkerLifecycleStatusPreview } from '../../lib/whatsapp/automation-preview'

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

const assertOrdered = (source: string, needles: string[], context: string) => {
  let previousIndex = -1

  for (const needle of needles) {
    const nextIndex = source.indexOf(needle)
    assert.notEqual(nextIndex, -1, `Expected ${context} to include ${needle}`)
    assert.ok(
      nextIndex > previousIndex,
      `Expected ${context} to keep ${needle} after the prior lifecycle step`,
    )
    previousIndex = nextIndex
  }
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

test('canonical lifecycle source keeps the approved precedence order and no kyc-status rejection override', () => {
  const source = readWorkspaceFile('lib', 'labour-worker-app.ts')
  const deriveWorkerStatusBlock = sliceBetween(
    source,
    'const deriveWorkerStatus = (',
    'const ensureWorkerUploadBucket = async',
  )

  assertOrdered(
    deriveWorkerStatusBlock,
    [
      "if (worker.status === 'blocked' || worker.status === 'rejected')",
      'if (!isWorkerRegistrationComplete(worker))',
      "if (worker.status === 'pending')",
      'if (!worker.activePlan || !workerPlan)',
      'if (isWorkerPlanExpiredRecord(worker))',
      'if (isWorkerPausedByWorker(worker, workerPlan))',
      'const outstandingRegistrationFee = getOutstandingWorkerRegistrationFee(worker, workerPlan, transactions)',
      "if (outstandingRegistrationFee > 0 && worker.walletBalance < outstandingRegistrationFee)",
      'if (workerPlan && isZeroChargeWorkerPlan(workerPlan))',
      'if (worker.walletBalance <= 0)',
    ],
    'deriveWorkerStatus',
  )

  assert.match(
    deriveWorkerStatusBlock,
    /if \(worker\.walletBalance <= 0\) \{\s+return 'inactive_wallet_empty'\s+\}\s+return 'active'/,
    'Expected deriveWorkerStatus to keep the final active fallback after the wallet-empty check',
  )

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

test('preview lifecycle adapter does not let legacy kyc values override a non-rejected stored status', () => {
  const plan = makePlan('worker-plan')

  for (const kycStatus of ['rejected', '', 'pending_review'] as const) {
    const worker = makeWorker(`worker-${kycStatus || 'blank'}`, {
      kycStatus,
      status: 'active',
    })

    const evaluation = deriveWorkerLifecycleStatusPreview(
      worker,
      makeSnapshot(worker, plan),
      '2026-08-27',
    )

    assert.equal(evaluation.derivedStatus, 'active')
    assert.equal(evaluation.reasonCategory, 'eligible_active')
    assert.equal(evaluation.recommendedIsVisible, true)
  }
})
