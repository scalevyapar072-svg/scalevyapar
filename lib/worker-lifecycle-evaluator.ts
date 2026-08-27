import type { LabourWorkerRecord } from './labour-marketplace'

type WorkerStatus = LabourWorkerRecord['status']

export type WorkerLifecycleReasonCategory =
  | 'persisted_blocked'
  | 'persisted_rejected'
  | 'persisted_pending'
  | 'registration_incomplete'
  | 'worker_paused'
  | 'missing_active_plan'
  | 'expired_active_plan'
  | 'registration_fee_unpaid'
  | 'wallet_balance_non_positive'
  | 'eligible_active'

export type WorkerLifecycleFacts = {
  persistedStatus: WorkerStatus
  registrationComplete: boolean
  workerPausedByWorker: boolean
  activePlanId: string
  planResolved: boolean
  planAudience: 'worker' | 'company' | ''
  planName: string
  planRegistrationFee: number
  planDailyCharge: number
  planValidUntil: string
  walletBalance: number
  registrationFeePaid: boolean
  hasCompletedRegistrationFeeTransaction: boolean
  currentDateValue: string
}

export type WorkerLifecycleEvaluation = {
  derivedStatus: WorkerStatus
  reasonCategory: WorkerLifecycleReasonCategory
  recommendedIsVisible: boolean
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})/

const normalizeDateValue = (value: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return normalized
  }

  const match = normalized.match(DATE_PREFIX_PATTERN)
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

const withVisibility = (
  registrationComplete: boolean,
  derivedStatus: WorkerStatus,
  reasonCategory: WorkerLifecycleReasonCategory,
): WorkerLifecycleEvaluation => ({
  derivedStatus,
  reasonCategory,
  recommendedIsVisible: registrationComplete && derivedStatus === 'active',
})

export const evaluateWorkerLifecycle = (
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
