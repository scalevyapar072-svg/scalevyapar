import type { WorkerJobMatchDryRunPlan } from './worker-job-match-contract'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/worker-job-match-outbox-contract')

export const WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT = {
  eventType: 'worker_job_match_alert',
  recipientType: 'worker',
  templateName: 'worker_job_match_alert',
  templateLanguage: 'hi',
  templateCategory: 'UTILITY',
  maximumAttempts: 4,
  retryDelaysSeconds: [60, 300, 1800] as const,
} as const

export type WorkerJobMatchCandidateSnapshot = {
  id: string
  matchKey: string
  workerId: string
  jobPostId: string
  companyId: string
  candidateState: 'eligible' | 'consumed' | 'invalidated' | string
  lastValidatedAt: string
}

export type WorkerJobMatchOutboxExistingSnapshot = {
  idempotencyKey: string
  status:
    | 'pending'
    | 'processing'
    | 'retry_scheduled'
    | 'sent'
    | 'blocked'
    | 'failed_terminal'
    | 'cancelled'
    | string
  attemptCount: number
  nextAttemptAt: string | null
}

export type WorkerJobMatchOutboxRevalidation = {
  matchStillValid: boolean
  matchingConsentAllowed: boolean
  suppressed: boolean
  withinDailyLimit: boolean
  pauseAllSending: boolean | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
  insideQuietHours: boolean
  quietHoursEndAt: string | null
}

export type WorkerJobMatchOutboxReasonCode =
  | 'match_plan_not_eligible'
  | 'match_plan_not_dry_run'
  | 'candidate_missing'
  | 'candidate_not_eligible'
  | 'candidate_identity_mismatch'
  | 'candidate_stale'
  | 'match_no_longer_valid'
  | 'matching_consent_not_allowed'
  | 'suppressed'
  | 'daily_limit_exceeded'
  | 'pause_state_missing_or_invalid'
  | 'whatsapp_paused'
  | 'template_not_configured'
  | 'template_not_approved'
  | 'template_not_enabled'
  | 'quiet_hours_end_missing_or_invalid'
  | 'duplicate_pending'
  | 'duplicate_processing'
  | 'duplicate_sent'
  | 'duplicate_terminal'
  | 'retry_not_due'
  | 'maximum_attempts_reached'
  | 'preview_only'

export type WorkerJobMatchOutboxPreviewPlan = {
  dryRun: true
  persistenceAllowed: false
  metaRequestAllowed: false
  dispatchState: 'blocked'
  queueDecision:
    | 'would_enqueue'
    | 'would_schedule_after_quiet_hours'
    | 'would_retry_existing'
    | 'duplicate'
    | 'blocked'
  primaryReason: WorkerJobMatchOutboxReasonCode
  reasonCodes: WorkerJobMatchOutboxReasonCode[]
  eventType: 'worker_job_match_alert'
  recipientType: 'worker'
  recipientId: string
  jobPostId: string
  companyId: string
  candidateId: string
  matchKey: string
  idempotencyKey: string | null
  maskedMobile: string
  templateName: 'worker_job_match_alert'
  templateLanguage: 'hi'
  templateCategory: 'UTILITY'
  availableAt: string | null
  attemptCount: number
  maximumAttempts: 4
  retryDelaysSeconds: readonly [60, 300, 1800]
}

const normalize = (value: unknown) => String(value || '').trim()

const encodePart = (value: string) => encodeURIComponent(value)

const parseMoment = (value: string | null | undefined) => {
  const normalized = normalize(value)
  if (!normalized) return null
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const buildIdempotencyKey = (matchKey: string) =>
  matchKey
    ? `worker-job-match-outbox:${encodePart(matchKey)}:${WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.templateName}:${WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.templateLanguage}`
    : null

const resolveExistingReason = (
  existing: WorkerJobMatchOutboxExistingSnapshot,
): WorkerJobMatchOutboxReasonCode | null => {
  if (existing.status === 'pending') return 'duplicate_pending'
  if (existing.status === 'processing') return 'duplicate_processing'
  if (existing.status === 'sent') return 'duplicate_sent'
  if (['blocked', 'failed_terminal', 'cancelled'].includes(existing.status)) {
    return 'duplicate_terminal'
  }
  return null
}

export const planWorkerJobMatchOutboxPreview = ({
  matchPlan,
  candidate,
  revalidation,
  existingOutbox = null,
  now = new Date(),
  maximumCandidateAgeMinutes = 15,
}: {
  matchPlan: WorkerJobMatchDryRunPlan
  candidate: WorkerJobMatchCandidateSnapshot | null
  revalidation: WorkerJobMatchOutboxRevalidation
  existingOutbox?: WorkerJobMatchOutboxExistingSnapshot | null
  now?: Date
  maximumCandidateAgeMinutes?: number
}): WorkerJobMatchOutboxPreviewPlan => {
  const reasonCodes: WorkerJobMatchOutboxReasonCode[] = []
  const candidateId = normalize(candidate?.id)
  const matchKey = normalize(candidate?.matchKey || matchPlan.matchKey)
  const idempotencyKey = buildIdempotencyKey(matchKey)
  const candidateValidatedAt = parseMoment(candidate?.lastValidatedAt)
  const candidateAgeLimitMs = Math.max(1, maximumCandidateAgeMinutes) * 60_000

  if (matchPlan.dryRun !== true) reasonCodes.push('match_plan_not_dry_run')
  if (matchPlan.decision !== 'eligible') reasonCodes.push('match_plan_not_eligible')
  if (!candidateId || !candidate) reasonCodes.push('candidate_missing')
  if (candidate && candidate.candidateState !== 'eligible') {
    reasonCodes.push('candidate_not_eligible')
  }
  if (
    candidate &&
    (
      normalize(candidate.matchKey) !== normalize(matchPlan.matchKey) ||
      normalize(candidate.workerId) !== normalize(matchPlan.recipientId) ||
      normalize(candidate.jobPostId) !== normalize(matchPlan.jobId) ||
      normalize(candidate.companyId) !== normalize(matchPlan.companyId)
    )
  ) {
    reasonCodes.push('candidate_identity_mismatch')
  }
  if (
    candidate &&
    (
      !candidateValidatedAt ||
      candidateValidatedAt.getTime() > now.getTime() ||
      now.getTime() - candidateValidatedAt.getTime() > candidateAgeLimitMs
    )
  ) {
    reasonCodes.push('candidate_stale')
  }
  if (!revalidation.matchStillValid) reasonCodes.push('match_no_longer_valid')
  if (!revalidation.matchingConsentAllowed) reasonCodes.push('matching_consent_not_allowed')
  if (revalidation.suppressed) reasonCodes.push('suppressed')
  if (!revalidation.withinDailyLimit) reasonCodes.push('daily_limit_exceeded')
  if (typeof revalidation.pauseAllSending !== 'boolean') {
    reasonCodes.push('pause_state_missing_or_invalid')
  } else if (revalidation.pauseAllSending) {
    reasonCodes.push('whatsapp_paused')
  }
  if (!revalidation.templateConfigured) reasonCodes.push('template_not_configured')
  if (!revalidation.templateApproved) reasonCodes.push('template_not_approved')
  if (!revalidation.templateEnabled) reasonCodes.push('template_not_enabled')

  let availableAt = now.toISOString()
  if (revalidation.insideQuietHours) {
    const quietHoursEnd = parseMoment(revalidation.quietHoursEndAt)
    if (!quietHoursEnd || quietHoursEnd.getTime() <= now.getTime()) {
      reasonCodes.push('quiet_hours_end_missing_or_invalid')
      availableAt = ''
    } else {
      availableAt = quietHoursEnd.toISOString()
    }
  }

  const blockingReasons = [...reasonCodes]
  let queueDecision: WorkerJobMatchOutboxPreviewPlan['queueDecision'] = 'blocked'

  if (blockingReasons.length === 0 && existingOutbox) {
    if (normalize(existingOutbox.idempotencyKey) !== idempotencyKey) {
      reasonCodes.push('duplicate_terminal')
    } else {
      const existingReason = resolveExistingReason(existingOutbox)
      if (existingReason) {
        reasonCodes.push(existingReason)
        queueDecision = 'duplicate'
      } else if (existingOutbox.status === 'retry_scheduled') {
        const nextAttempt = parseMoment(existingOutbox.nextAttemptAt)
        if (existingOutbox.attemptCount >= WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.maximumAttempts) {
          reasonCodes.push('maximum_attempts_reached')
        } else if (!nextAttempt || nextAttempt.getTime() > now.getTime()) {
          reasonCodes.push('retry_not_due')
          queueDecision = 'duplicate'
        } else {
          queueDecision = 'would_retry_existing'
          availableAt = now.toISOString()
        }
      } else {
        reasonCodes.push('duplicate_terminal')
        queueDecision = 'duplicate'
      }
    }
  } else if (blockingReasons.length === 0) {
    queueDecision = revalidation.insideQuietHours
      ? 'would_schedule_after_quiet_hours'
      : 'would_enqueue'
  }

  if (queueDecision !== 'blocked' && !reasonCodes.includes('preview_only')) {
    reasonCodes.push('preview_only')
  }

  return {
    dryRun: true,
    persistenceAllowed: false,
    metaRequestAllowed: false,
    dispatchState: 'blocked',
    queueDecision,
    primaryReason: reasonCodes[0] || 'preview_only',
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ['preview_only'],
    eventType: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.eventType,
    recipientType: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.recipientType,
    recipientId: normalize(matchPlan.recipientId),
    jobPostId: normalize(matchPlan.jobId),
    companyId: normalize(matchPlan.companyId),
    candidateId,
    matchKey,
    idempotencyKey,
    maskedMobile: normalize(matchPlan.maskedMobile),
    templateName: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.templateName,
    templateLanguage: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.templateLanguage,
    templateCategory: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.templateCategory,
    availableAt: availableAt || null,
    attemptCount: Math.max(0, Number(existingOutbox?.attemptCount || 0)),
    maximumAttempts: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.maximumAttempts,
    retryDelaysSeconds: WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT.retryDelaysSeconds,
  }
}
