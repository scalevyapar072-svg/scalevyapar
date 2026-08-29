import {
  buildWhatsappConsentState,
  type WhatsappConsentState,
} from './consent'
import { evaluateWhatsappRecipientEligibility } from './recipient-eligibility'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/job-lifecycle-events')

export const WHATSAPP_JOB_LIFECYCLE_EVENT_TYPES = [
  'company_job_under_review',
  'company_job_approved',
  'company_job_rejected',
] as const

export type WhatsappJobLifecycleEventType =
  (typeof WHATSAPP_JOB_LIFECYCLE_EVENT_TYPES)[number]

export const WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS: Record<
  WhatsappJobLifecycleEventType,
  {
    templateName: string
    templateCategory: 'UTILITY'
    notificationPurpose: 'service'
    recipientType: 'company'
    parameterNames: readonly string[]
  }
> = {
  company_job_under_review: {
    templateName: 'company_job_under_review',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'company',
    parameterNames: [],
  },
  company_job_approved: {
    templateName: 'company_job_approved',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'company',
    parameterNames: [],
  },
  company_job_rejected: {
    templateName: 'company_job_rejected',
    templateCategory: 'UTILITY',
    notificationPurpose: 'service',
    recipientType: 'company',
    parameterNames: ['rejection_reason'],
  },
}

export type JobLifecycleReviewStatus = 'under_review' | 'approved' | 'rejected'

export type JobLifecycleEventSnapshot = {
  id: string
  companyId: string
  status: string
  reviewStatus?: string | null
  reviewReason?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  updatedAt: string
}

export type JobLifecycleCompanySnapshot = {
  id: string
  status: string
  contactMobile: string
  mobile: string
}

export type WhatsappJobLifecycleTemplateState = {
  configured: boolean
  approved: boolean
  enabled: boolean
}

export type WhatsappJobLifecycleModelReadiness =
  | { ready: true; reviewStatus: JobLifecycleReviewStatus }
  | { ready: false; reason: 'job_review_model_unavailable' | 'invalid_job_review_status' }

export type WhatsappJobLifecycleDryRunPlan = {
  dryRun: true
  dispatchState: 'blocked'
  dispatchReason: string
  eventType: WhatsappJobLifecycleEventType
  recipientType: 'company'
  recipientId: string
  jobId: string
  maskedMobile: string
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
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

const EMPTY_TEMPLATE_STATE: WhatsappJobLifecycleTemplateState = {
  configured: false,
  approved: false,
  enabled: false,
}

const normalizeStatus = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const isReviewStatus = (value: string): value is JobLifecycleReviewStatus =>
  value === 'under_review' || value === 'approved' || value === 'rejected'

export const auditJobLifecycleModelReadiness = (
  job: JobLifecycleEventSnapshot,
): WhatsappJobLifecycleModelReadiness => {
  if (job.reviewStatus === undefined || job.reviewStatus === null) {
    return { ready: false, reason: 'job_review_model_unavailable' }
  }

  const reviewStatus = normalizeStatus(job.reviewStatus)
  return isReviewStatus(reviewStatus)
    ? { ready: true, reviewStatus }
    : { ready: false, reason: 'invalid_job_review_status' }
}

export const sanitizeJobWhatsappRejectionReason = (value: unknown) => {
  const normalized = String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/https?:\/\/\S+/gi, '[redacted-link]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\d{6,}\b/g, '[redacted-number]')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return null
  if (
    ['job could not be approved', 'job rejected', 'please review your job'].includes(
      normalized.toLowerCase(),
    )
  ) {
    return null
  }

  return normalized.slice(0, 300).trim() || null
}

const resolveTransition = ({
  previous,
  current,
}: {
  previous: JobLifecycleEventSnapshot
  current: JobLifecycleEventSnapshot
}): {
  eventType: WhatsappJobLifecycleEventType
  marker: string
  parameters: Record<string, string>
  blockReason: string | null
} | null => {
  const currentReadiness = auditJobLifecycleModelReadiness(current)
  if (!currentReadiness.ready) return null

  const previousReadiness = auditJobLifecycleModelReadiness(previous)
  const previousReviewStatus = previousReadiness.ready
    ? previousReadiness.reviewStatus
    : null
  if (previousReviewStatus === currentReadiness.reviewStatus) return null

  if (currentReadiness.reviewStatus === 'under_review') {
    const marker = String(current.submittedAt || '').trim()
    return {
      eventType: 'company_job_under_review' as const,
      marker,
      parameters: {},
      blockReason: marker ? null : 'missing_transition_marker',
    }
  }

  if (currentReadiness.reviewStatus === 'approved') {
    const marker = String(current.reviewedAt || current.updatedAt || '').trim()
    return {
      eventType: 'company_job_approved' as const,
      marker,
      parameters: {},
      blockReason:
        normalizeStatus(current.status) !== 'live'
          ? 'job_not_live'
          : marker
            ? null
            : 'missing_transition_marker',
    }
  }

  const marker = String(current.reviewedAt || current.updatedAt || '').trim()
  const reason = sanitizeJobWhatsappRejectionReason(current.reviewReason)
  return {
    eventType: 'company_job_rejected' as const,
    marker,
    parameters: reason ? { rejection_reason: reason } : {},
    blockReason: !marker
      ? 'missing_transition_marker'
      : reason
        ? null
        : 'missing_rejection_reason',
  }
}

const resolveTemplateBlockReason = (state: WhatsappJobLifecycleTemplateState) => {
  if (!state.configured) return 'template_not_configured'
  if (!state.approved) return 'template_not_approved'
  if (!state.enabled) return 'template_not_enabled'
  return null
}

const encodeIdempotencyPart = (value: string) => encodeURIComponent(value.trim())

export const planJobLifecycleWhatsappDryRun = ({
  previous,
  current,
  company,
  consentState,
  suppressed = false,
  withinLimit = true,
  pauseAllSending = true,
  templateStates = {},
  now = new Date(),
  timeZone = 'Asia/Kolkata',
}: {
  previous: JobLifecycleEventSnapshot
  current: JobLifecycleEventSnapshot
  company: JobLifecycleCompanySnapshot
  consentState?: Partial<WhatsappConsentState>
  suppressed?: boolean
  withinLimit?: boolean
  pauseAllSending?: boolean
  templateStates?: Partial<
    Record<WhatsappJobLifecycleEventType, WhatsappJobLifecycleTemplateState>
  >
  now?: Date
  timeZone?: string
}): WhatsappJobLifecycleDryRunPlan | null => {
  const transition = resolveTransition({ previous, current })
  if (!transition) return null

  const contract = WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS[transition.eventType]
  const eligibility = evaluateWhatsappRecipientEligibility({
    recipientType: 'company',
    mode: 'manual',
    notificationPurpose: contract.notificationPurpose,
    templateCategory: contract.templateCategory,
    consentState: buildWhatsappConsentState(consentState || {}),
    suppressed,
    withinLimit,
    matchStillValid: true,
    allowQueueDuringQuietHours: true,
    company,
    now,
    timeZone,
  })
  const templateBlockReason = resolveTemplateBlockReason(
    templateStates[transition.eventType] || EMPTY_TEMPLATE_STATE,
  )
  const dispatchReason =
    transition.blockReason ||
    eligibility.reasonCodes[0] ||
    templateBlockReason ||
    (pauseAllSending ? 'whatsapp_paused' : 'dry_run_only')
  const jobId = String(current.id || '').trim()
  const companyId = String(current.companyId || company.id || '').trim()
  const idempotencyKey =
    jobId && companyId && transition.marker
      ? [
          'job-lifecycle',
          transition.eventType,
          encodeIdempotencyPart(companyId),
          encodeIdempotencyPart(jobId),
          encodeIdempotencyPart(transition.marker),
        ].join(':')
      : null

  return {
    dryRun: true,
    dispatchState: 'blocked',
    dispatchReason,
    eventType: transition.eventType,
    recipientType: contract.recipientType,
    recipientId: companyId,
    jobId,
    maskedMobile: eligibility.maskedMobile,
    resolvedRecipientSource: eligibility.resolvedRecipientSource,
    templateName: contract.templateName,
    templateCategory: contract.templateCategory,
    notificationPurpose: contract.notificationPurpose,
    idempotencyKey,
    transitionMarker: transition.marker || null,
    templateParameters: transition.parameters,
    eligibility: {
      eligible: eligibility.eligible,
      reasonCodes: eligibility.reasonCodes,
      deliveryWindow: eligibility.deliveryWindow,
      missingConsents: eligibility.missingConsents,
    },
  }
}
