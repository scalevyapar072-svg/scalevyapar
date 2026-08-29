import type { LabourMarketplaceSnapshot } from '../labour-marketplace'
import {
  normalizeIndianMobileToE164,
  type WhatsappConsentState,
} from './consent'
import { isInsideWhatsappQuietHours } from './recipient-eligibility'
import {
  planWorkerJobMatchDryRun,
  type WorkerJobMatchTemplateState,
} from './worker-job-match-contract'
import {
  planWorkerJobMatchOutboxPreview,
  type WorkerJobMatchCandidateSnapshot,
  type WorkerJobMatchOutboxExistingSnapshot,
  type WorkerJobMatchOutboxPreviewPlan,
} from './worker-job-match-outbox-contract'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/worker-job-match-outbox-preview')

export const WHATSAPP_MATCH_OUTBOX_PREVIEW_MAX_CANDIDATES = 200

export type WorkerJobMatchOutboxPreviewCandidate = WorkerJobMatchCandidateSnapshot

export type WorkerJobMatchOutboxPreviewExisting = WorkerJobMatchOutboxExistingSnapshot & {
  matchKey: string
  workerId: string
  sentAt: string | null
}

export type WorkerJobMatchOutboxPreviewRow = WorkerJobMatchOutboxPreviewPlan & {
  jobTitle: string
  categoryLabel: string
  city: string
}

export type WorkerJobMatchOutboxPreviewSummary = {
  source: 'supabase' | 'unavailable'
  candidateReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  outboxReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  readOnly: true
  persistenceAllowed: false
  metaRequestAllowed: false
  totalCandidateCount: number
  evaluatedCandidateCount: number
  truncated: boolean
  wouldEnqueueCount: number
  wouldScheduleCount: number
  wouldRetryCount: number
  duplicateCount: number
  blockedCount: number
  rows: WorkerJobMatchOutboxPreviewRow[]
}

const findQuietHoursEnd = (now: Date, timeZone: string) => {
  if (!isInsideWhatsappQuietHours(now, timeZone)) return null

  for (let minutes = 1; minutes <= 24 * 60; minutes += 1) {
    const candidate = new Date(now.getTime() + minutes * 60_000)
    if (!isInsideWhatsappQuietHours(candidate, timeZone)) return candidate.toISOString()
  }

  return null
}

export const buildWorkerJobMatchOutboxPreview = ({
  snapshot,
  source,
  candidateReadState,
  outboxReadState,
  candidates = [],
  existingOutboxRows = [],
  workerConsentStates = {},
  suppressedMobiles = [],
  templateState,
  pauseAllSending,
  workerDailyLimit,
  now,
  timeZone,
  maxCandidates = WHATSAPP_MATCH_OUTBOX_PREVIEW_MAX_CANDIDATES,
}: {
  snapshot: LabourMarketplaceSnapshot
  source: 'supabase' | 'unavailable'
  candidateReadState: WorkerJobMatchOutboxPreviewSummary['candidateReadState']
  outboxReadState: WorkerJobMatchOutboxPreviewSummary['outboxReadState']
  candidates?: WorkerJobMatchOutboxPreviewCandidate[]
  existingOutboxRows?: WorkerJobMatchOutboxPreviewExisting[]
  workerConsentStates?: Record<string, Partial<WhatsappConsentState>>
  suppressedMobiles?: Iterable<string>
  templateState: WorkerJobMatchTemplateState
  pauseAllSending: boolean
  workerDailyLimit: number
  now: Date
  timeZone: string
  maxCandidates?: number
}): WorkerJobMatchOutboxPreviewSummary => {
  const unavailable =
    source !== 'supabase' ||
    candidateReadState !== 'connected' ||
    outboxReadState !== 'connected'

  if (unavailable) {
    return {
      source: 'unavailable',
      candidateReadState,
      outboxReadState,
      readOnly: true,
      persistenceAllowed: false,
      metaRequestAllowed: false,
      totalCandidateCount: 0,
      evaluatedCandidateCount: 0,
      truncated: false,
      wouldEnqueueCount: 0,
      wouldScheduleCount: 0,
      wouldRetryCount: 0,
      duplicateCount: 0,
      blockedCount: 0,
      rows: [],
    }
  }

  const safeMaximum = Math.max(0, Math.floor(maxCandidates))
  const selectedCandidates = candidates.slice(0, safeMaximum)
  const workers = new Map(snapshot.workers.map((worker) => [worker.id, worker]))
  const jobs = new Map(snapshot.jobPosts.map((job) => [job.id, job]))
  const categories = new Map(snapshot.categories.map((category) => [category.id, category.name]))
  const suppressed = new Set(suppressedMobiles)
  const outboxByMatchKey = new Map(existingOutboxRows.map((row) => [row.matchKey, row]))
  const sentSince = now.getTime() - 24 * 60 * 60_000
  const sentCountByWorker = new Map<string, number>()

  for (const row of existingOutboxRows) {
    const sentAt = row.sentAt ? new Date(row.sentAt) : null
    if (row.status !== 'sent' || !sentAt || Number.isNaN(sentAt.getTime())) continue
    if (sentAt.getTime() < sentSince || sentAt.getTime() > now.getTime()) continue
    sentCountByWorker.set(row.workerId, (sentCountByWorker.get(row.workerId) || 0) + 1)
  }

  const insideQuietHours = isInsideWhatsappQuietHours(now, timeZone)
  const quietHoursEndAt = findQuietHoursEnd(now, timeZone)
  const rows: WorkerJobMatchOutboxPreviewRow[] = []

  for (const candidate of selectedCandidates) {
    const worker = workers.get(candidate.workerId)
    const job = jobs.get(candidate.jobPostId)

    if (!worker || !job) continue

    const existingOutbox = outboxByMatchKey.get(candidate.matchKey) || null
    const normalizedMobile = normalizeIndianMobileToE164(worker.mobile)
    const workerSuppressed = normalizedMobile.ok && suppressed.has(normalizedMobile.normalized)
    const matchPlan = planWorkerJobMatchDryRun({
      worker,
      job,
      consentState: workerConsentStates[worker.id] || {},
      suppressed: workerSuppressed,
      existingMatch: false,
      pauseAllSending,
      templateState,
      now,
      timeZone,
    })
    const plan = planWorkerJobMatchOutboxPreview({
      matchPlan,
      candidate,
      existingOutbox,
      revalidation: {
        matchStillValid: matchPlan.decision === 'eligible',
        matchingConsentAllowed: matchPlan.eligibility.missingConsents.length === 0,
        suppressed: workerSuppressed,
        withinDailyLimit:
          (sentCountByWorker.get(worker.id) || 0) < Math.max(0, workerDailyLimit),
        pauseAllSending,
        templateConfigured: templateState.configured,
        templateApproved: templateState.approved,
        templateEnabled: templateState.enabled,
        insideQuietHours,
        quietHoursEndAt,
      },
      now,
    })

    rows.push({
      ...plan,
      jobTitle: job.title,
      categoryLabel: categories.get(job.categoryId) || job.categoryId,
      city: job.city,
    })
  }

  return {
    source: 'supabase',
    candidateReadState,
    outboxReadState,
    readOnly: true,
    persistenceAllowed: false,
    metaRequestAllowed: false,
    totalCandidateCount: candidates.length,
    evaluatedCandidateCount: rows.length,
    truncated: selectedCandidates.length < candidates.length,
    wouldEnqueueCount: rows.filter((row) => row.queueDecision === 'would_enqueue').length,
    wouldScheduleCount: rows.filter(
      (row) => row.queueDecision === 'would_schedule_after_quiet_hours',
    ).length,
    wouldRetryCount: rows.filter((row) => row.queueDecision === 'would_retry_existing').length,
    duplicateCount: rows.filter((row) => row.queueDecision === 'duplicate').length,
    blockedCount: rows.filter((row) => row.queueDecision === 'blocked').length,
    rows,
  }
}
