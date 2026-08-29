import {
  buildWhatsappConsentState,
  type WhatsappConsentState,
} from './consent'
import {
  evaluateWhatsappRecipientEligibility,
  type WhatsappRecipientEligibilityResult,
} from './recipient-eligibility'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/worker-job-match-contract')

export const WHATSAPP_WORKER_JOB_MATCH_CONTRACT = {
  eventType: 'worker_job_match_alert',
  templateName: 'worker_job_match_alert',
  templateCategory: 'UTILITY',
  notificationPurpose: 'matching',
  recipientType: 'worker',
} as const

export type WorkerJobMatchPreferredLocation = {
  cityLabels: string[]
}

export type WorkerJobMatchWorkerSnapshot = {
  id: string
  mobile: string
  status: string
  isVisible: boolean
  activePlan: string
  planValidUntil: string
  availability: string
  categoryIds: string[]
  city: string
  homeCity: string
  preferredWorkLocations: WorkerJobMatchPreferredLocation[]
}

export type WorkerJobMatchJobSnapshot = {
  id: string
  companyId: string
  categoryId: string
  city: string
  status: string
  reviewStatus: string | null
  reviewedAt: string
  publishedAt: string
  expiresAt: string
  updatedAt: string
}

export type WorkerJobMatchTemplateState = {
  configured: boolean
  approved: boolean
  enabled: boolean
}

export type WorkerJobMatchReasonCode =
  | 'missing_worker_id'
  | 'missing_job_id'
  | 'missing_company_id'
  | 'job_not_approved'
  | 'job_not_live'
  | 'job_expired'
  | 'worker_not_available'
  | 'category_mismatch'
  | 'location_mismatch'
  | 'already_matched'
  | 'template_not_configured'
  | 'template_not_approved'
  | 'template_not_enabled'
  | 'whatsapp_paused'
  | 'dry_run_only'
  | string

export type WorkerJobMatchDryRunPlan = {
  dryRun: true
  dispatchState: 'blocked'
  decision: 'eligible' | 'blocked' | 'already_matched'
  dispatchReason: WorkerJobMatchReasonCode
  eventType: 'worker_job_match_alert'
  recipientType: 'worker'
  recipientId: string
  jobId: string
  companyId: string
  maskedMobile: string
  templateName: 'worker_job_match_alert'
  templateCategory: 'UTILITY'
  notificationPurpose: 'matching'
  matchKey: string | null
  matchedCategoryId: string | null
  matchedCity: string | null
  structuralReasonCodes: WorkerJobMatchReasonCode[]
  eligibility: WhatsappRecipientEligibilityResult
}

const EMPTY_TEMPLATE_STATE: WorkerJobMatchTemplateState = {
  configured: false,
  approved: false,
  enabled: false,
}

const normalizeKey = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const encodeMatchKeyPart = (value: string) => encodeURIComponent(value.trim())

const parseMoment = (value: string, endOfDayForDateOnly = false) => {
  const normalized = String(value || '').trim()
  if (!normalized) return null

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
  const parsed = new Date(
    dateOnly && endOfDayForDateOnly
      ? `${normalized}T23:59:59.999`
      : normalized,
  )
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isWorkerPlanExpired = (planValidUntil: string, now: Date) => {
  const expiry = parseMoment(planValidUntil, true)
  return !expiry || expiry.getTime() < now.getTime()
}

const isJobExpired = (expiresAt: string, now: Date) => {
  const expiry = parseMoment(expiresAt, true)
  return !expiry || expiry.getTime() < now.getTime()
}

const collectWorkerCityKeys = (worker: WorkerJobMatchWorkerSnapshot) => {
  const values = [worker.city, worker.homeCity]
  for (const preferredLocation of worker.preferredWorkLocations || []) {
    values.push(...(preferredLocation.cityLabels || []))
  }
  return new Set(values.map(normalizeKey).filter(Boolean))
}

const resolveTemplateReason = (state: WorkerJobMatchTemplateState) => {
  if (!state.configured) return 'template_not_configured' as const
  if (!state.approved) return 'template_not_approved' as const
  if (!state.enabled) return 'template_not_enabled' as const
  return null
}

export const planWorkerJobMatchDryRun = ({
  worker,
  job,
  consentState,
  suppressed = false,
  withinLimit = true,
  existingMatch = false,
  pauseAllSending = true,
  templateState = EMPTY_TEMPLATE_STATE,
  now = new Date(),
  timeZone = 'Asia/Kolkata',
}: {
  worker: WorkerJobMatchWorkerSnapshot
  job: WorkerJobMatchJobSnapshot
  consentState?: Partial<WhatsappConsentState>
  suppressed?: boolean
  withinLimit?: boolean
  existingMatch?: boolean
  pauseAllSending?: boolean
  templateState?: WorkerJobMatchTemplateState
  now?: Date
  timeZone?: string
}): WorkerJobMatchDryRunPlan => {
  const workerId = String(worker.id || '').trim()
  const jobId = String(job.id || '').trim()
  const companyId = String(job.companyId || '').trim()
  const jobCategoryId = String(job.categoryId || '').trim()
  const normalizedJobCity = normalizeKey(job.city)
  const workerCategoryIds = new Set((worker.categoryIds || []).map(normalizeKey).filter(Boolean))
  const workerCityKeys = collectWorkerCityKeys(worker)
  const structuralReasonCodes: WorkerJobMatchReasonCode[] = []

  if (!workerId) structuralReasonCodes.push('missing_worker_id')
  if (!jobId) structuralReasonCodes.push('missing_job_id')
  if (!companyId) structuralReasonCodes.push('missing_company_id')
  if (normalizeKey(job.reviewStatus) !== 'approved') {
    structuralReasonCodes.push('job_not_approved')
  }
  if (normalizeKey(job.status) !== 'live') structuralReasonCodes.push('job_not_live')
  if (isJobExpired(job.expiresAt, now)) structuralReasonCodes.push('job_expired')
  if (!['available today', 'available this week'].includes(normalizeKey(worker.availability))) {
    structuralReasonCodes.push('worker_not_available')
  }
  if (!jobCategoryId || !workerCategoryIds.has(normalizeKey(jobCategoryId))) {
    structuralReasonCodes.push('category_mismatch')
  }
  if (!normalizedJobCity || !workerCityKeys.has(normalizedJobCity)) {
    structuralReasonCodes.push('location_mismatch')
  }
  if (existingMatch) structuralReasonCodes.push('already_matched')

  const structurallyValid = structuralReasonCodes.length === 0
  const eligibility = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'automatic',
    notificationPurpose: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.notificationPurpose,
    templateCategory: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.templateCategory,
    consentState: buildWhatsappConsentState(consentState || {}),
    suppressed,
    withinLimit,
    matchStillValid: structurallyValid,
    allowQueueDuringQuietHours: true,
    worker: {
      status: worker.status,
      isVisible: worker.isVisible,
      activePlan: worker.activePlan,
      planValidUntil: worker.planValidUntil,
      mobile: worker.mobile,
    },
    now,
    timeZone,
  })

  if (isWorkerPlanExpired(worker.planValidUntil, now)) {
    // Keep the deterministic caller-supplied clock authoritative as well as
    // the shared recipient guard, whose public contract remains unchanged.
    if (!eligibility.reasonCodes.includes('worker_plan_expired')) {
      eligibility.reasonCodes.push('worker_plan_expired')
    }
    eligibility.eligible = false
    eligibility.deliveryWindow = 'blocked'
  }

  const templateReason = resolveTemplateReason(templateState)
  const dispatchReason =
    structuralReasonCodes[0] ||
    eligibility.reasonCodes[0] ||
    templateReason ||
    (pauseAllSending ? 'whatsapp_paused' : 'dry_run_only')
  const decision = existingMatch
    ? 'already_matched'
    : structurallyValid && eligibility.eligible && !templateReason
      ? 'eligible'
      : 'blocked'
  const matchKey = workerId && jobId
    ? `worker-job-match:${encodeMatchKeyPart(workerId)}:${encodeMatchKeyPart(jobId)}`
    : null

  return {
    dryRun: true,
    dispatchState: 'blocked',
    decision,
    dispatchReason,
    eventType: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.eventType,
    recipientType: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.recipientType,
    recipientId: workerId,
    jobId,
    companyId,
    maskedMobile: eligibility.maskedMobile,
    templateName: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.templateName,
    templateCategory: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.templateCategory,
    notificationPurpose: WHATSAPP_WORKER_JOB_MATCH_CONTRACT.notificationPurpose,
    matchKey,
    matchedCategoryId: structurallyValid ? jobCategoryId : null,
    matchedCity: structurallyValid ? String(job.city || '').trim() : null,
    structuralReasonCodes,
    eligibility,
  }
}
