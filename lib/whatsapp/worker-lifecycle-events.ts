import {
  buildWhatsappConsentState,
  type WhatsappConsentState,
} from './consent'
import { evaluateWhatsappRecipientEligibility } from './recipient-eligibility'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/worker-lifecycle-events')

export const WHATSAPP_WORKER_LIFECYCLE_EVENT_TYPES = [
  'worker_registration_under_review',
  'worker_account_approved',
  'worker_account_rejected',
] as const

export type WhatsappWorkerLifecycleEventType =
  (typeof WHATSAPP_WORKER_LIFECYCLE_EVENT_TYPES)[number]

export const WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS: Record<
  WhatsappWorkerLifecycleEventType,
  {
    templateName: string
    templateCategory: 'UTILITY'
    notificationPurpose: 'service'
    recipientType: 'worker'
    parameterNames: readonly string[]
  }
> = {
  worker_registration_under_review: {
    templateName: 'worker_registration_under_review',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'worker',
    parameterNames: [],
  },
  worker_account_approved: {
    templateName: 'worker_account_approved',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'worker',
    parameterNames: [],
  },
  worker_account_rejected: {
    templateName: 'worker_account_rejected',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'worker',
    parameterNames: ['rejection_reason'],
  },
}

export type WorkerLifecycleEventSnapshot = {
  id: string
  mobile: string
  status: string
  isVisible: boolean
  activePlan: string
  planValidUntil: string
  kycStatus: string
  kycRemarks: string
  registrationCompletedAt: string
  updatedAt: string
}

export type WhatsappWorkerLifecycleTemplateState = {
  configured: boolean
  approved: boolean
  enabled: boolean
}

export type WhatsappWorkerLifecycleDryRunReason =
  | 'no_lifecycle_transition'
  | 'missing_transition_marker'
  | 'missing_rejection_reason'
  | 'template_not_configured'
  | 'template_not_approved'
  | 'template_not_enabled'
  | 'whatsapp_paused'
  | 'dry_run_only'
  | string

export type WhatsappWorkerLifecycleDryRunPlan = {
  dryRun: true
  dispatchState: 'blocked'
  dispatchReason: WhatsappWorkerLifecycleDryRunReason
  eventType: WhatsappWorkerLifecycleEventType
  recipientType: 'worker'
  recipientId: string
  maskedMobile: string
  templateName: string
  templateCategory: 'UTILITY'
  notificationPurpose: 'service'
  idempotencyKey: string | null
  transitionMarker: string | null
  templateParameters: Record<string, string>
  eligibility: {
    eligible: boolean
    reasonCodes: string[]
    deliveryWindow: 'send_now' | 'queue_until_allowed' | 'blocked'
    missingConsents: Array<keyof WhatsappConsentState>
  }
}

const EMPTY_TEMPLATE_STATE: WhatsappWorkerLifecycleTemplateState = {
  configured: false,
  approved: false,
  enabled: false,
}

const normalizeStatus = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const isApproved = (worker: WorkerLifecycleEventSnapshot) =>
  normalizeStatus(worker.kycStatus) === 'approved'

const isRejected = (worker: WorkerLifecycleEventSnapshot) =>
  normalizeStatus(worker.kycStatus) === 'rejected' || normalizeStatus(worker.status) === 'rejected'

const hasRegistrationCompleted = (worker: WorkerLifecycleEventSnapshot) =>
  Boolean(String(worker.registrationCompletedAt || '').trim())

const encodeIdempotencyPart = (value: string) => encodeURIComponent(value.trim())

export const sanitizeWorkerWhatsappRejectionReason = (value: unknown) => {
  const normalized = String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/https?:\/\/\S+/gi, '[redacted-link]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\d{6,}\b/g, '[redacted-number]')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return null

  const fallbackCopy = [
    'kyc could not be approved',
    'please review your kyc details',
    'documents could not be verified',
  ]
  if (fallbackCopy.includes(normalized.toLowerCase())) return null

  return normalized.slice(0, 300).trim() || null
}

const resolveTransition = ({
  previous,
  current,
}: {
  previous: WorkerLifecycleEventSnapshot
  current: WorkerLifecycleEventSnapshot
}): {
  eventType: WhatsappWorkerLifecycleEventType
  transitionMarker: string
  templateParameters: Record<string, string>
  contractBlockReason: 'missing_transition_marker' | 'missing_rejection_reason' | null
} | null => {
  if (!isRejected(previous) && isRejected(current)) {
    const reason = sanitizeWorkerWhatsappRejectionReason(current.kycRemarks)
    const transitionMarker = String(current.updatedAt || '').trim()
    return {
      eventType: 'worker_account_rejected',
      transitionMarker,
      templateParameters: reason ? { rejection_reason: reason } : {},
      contractBlockReason: !transitionMarker
        ? 'missing_transition_marker'
        : reason
          ? null
          : 'missing_rejection_reason',
    }
  }

  if (!isApproved(previous) && isApproved(current)) {
    const transitionMarker = String(current.updatedAt || '').trim()
    return {
      eventType: 'worker_account_approved',
      transitionMarker,
      templateParameters: {},
      contractBlockReason: transitionMarker ? null : 'missing_transition_marker',
    }
  }

  if (
    !hasRegistrationCompleted(previous) &&
    hasRegistrationCompleted(current) &&
    !isApproved(current) &&
    !isRejected(current)
  ) {
    const transitionMarker = String(current.registrationCompletedAt || '').trim()
    return {
      eventType: 'worker_registration_under_review',
      transitionMarker,
      templateParameters: {},
      contractBlockReason: transitionMarker ? null : 'missing_transition_marker',
    }
  }

  return null
}

const resolveTemplateBlockReason = (state: WhatsappWorkerLifecycleTemplateState) => {
  if (!state.configured) return 'template_not_configured' as const
  if (!state.approved) return 'template_not_approved' as const
  if (!state.enabled) return 'template_not_enabled' as const
  return null
}

export const planWorkerLifecycleWhatsappDryRun = ({
  previous,
  current,
  consentState,
  suppressed = false,
  withinLimit = true,
  pauseAllSending = true,
  templateStates = {},
  now = new Date(),
  timeZone = 'Asia/Kolkata',
}: {
  previous: WorkerLifecycleEventSnapshot
  current: WorkerLifecycleEventSnapshot
  consentState?: Partial<WhatsappConsentState>
  suppressed?: boolean
  withinLimit?: boolean
  pauseAllSending?: boolean
  templateStates?: Partial<
    Record<WhatsappWorkerLifecycleEventType, WhatsappWorkerLifecycleTemplateState>
  >
  now?: Date
  timeZone?: string
}): WhatsappWorkerLifecycleDryRunPlan | null => {
  const transition = resolveTransition({ previous, current })
  if (!transition) return null

  const contract = WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS[transition.eventType]
  const eligibility = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'manual',
    notificationPurpose: contract.notificationPurpose,
    templateCategory: contract.templateCategory,
    consentState: buildWhatsappConsentState(consentState || {}),
    suppressed,
    withinLimit,
    matchStillValid: true,
    allowQueueDuringQuietHours: true,
    worker: current,
    now,
    timeZone,
  })
  const templateBlockReason = resolveTemplateBlockReason(
    templateStates[transition.eventType] || EMPTY_TEMPLATE_STATE,
  )
  const dispatchReason =
    transition.contractBlockReason ||
    eligibility.reasonCodes[0] ||
    templateBlockReason ||
    (pauseAllSending ? 'whatsapp_paused' : 'dry_run_only')
  const workerId = String(current.id || '').trim()
  const idempotencyKey =
    workerId && transition.transitionMarker
      ? [
          'worker-lifecycle',
          transition.eventType,
          encodeIdempotencyPart(workerId),
          encodeIdempotencyPart(transition.transitionMarker),
        ].join(':')
      : null

  return {
    dryRun: true,
    dispatchState: 'blocked',
    dispatchReason,
    eventType: transition.eventType,
    recipientType: contract.recipientType,
    recipientId: workerId,
    maskedMobile: eligibility.maskedMobile,
    templateName: contract.templateName,
    templateCategory: contract.templateCategory,
    notificationPurpose: contract.notificationPurpose,
    idempotencyKey,
    transitionMarker: transition.transitionMarker || null,
    templateParameters: transition.templateParameters,
    eligibility: {
      eligible: eligibility.eligible,
      reasonCodes: eligibility.reasonCodes,
      deliveryWindow: eligibility.deliveryWindow,
      missingConsents: eligibility.missingConsents,
    },
  }
}
