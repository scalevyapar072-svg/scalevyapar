import type { LabourMarketplaceSnapshot } from '../labour-marketplace'
import {
  normalizeIndianMobileToE164,
  type WhatsappConsentState,
} from './consent'
import {
  planWorkerJobMatchDryRun,
  type WorkerJobMatchTemplateState,
} from './worker-job-match-contract'

export const WHATSAPP_MATCH_PREVIEW_MAX_PAIRS = 500

export type WorkerJobMatchPreviewRow = {
  matchKey: string
  workerId: string
  jobId: string
  companyId: string
  jobTitle: string
  categoryId: string
  categoryLabel: string
  city: string
  maskedMobile: string
  decision: 'eligible' | 'blocked' | 'already_matched'
  dispatchReason: string
  reasonCodes: string[]
  consentEligible: boolean
  suppressed: boolean
  templateEligible: boolean
}

export type WorkerJobMatchPreviewSummary = {
  source: 'supabase' | 'unavailable'
  duplicateReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  duplicateCheckAvailable: boolean
  totalPossiblePairs: number
  evaluatedPairCount: number
  truncated: boolean
  eligibleCount: number
  blockedCount: number
  alreadyMatchedCount: number
  rows: WorkerJobMatchPreviewRow[]
}

const normalizeMobile = (value: string) => {
  const normalized = normalizeIndianMobileToE164(value)
  return normalized.ok ? normalized.normalized : ''
}

export const buildWorkerJobMatchPreview = ({
  snapshot,
  source,
  duplicateReadState,
  workerConsentStates = {},
  suppressedMobiles = [],
  existingMatchKeys = [],
  templateState,
  pauseAllSending,
  now,
  timeZone,
  maxPairs = WHATSAPP_MATCH_PREVIEW_MAX_PAIRS,
}: {
  snapshot: LabourMarketplaceSnapshot
  source: 'supabase' | 'unavailable'
  duplicateReadState: WorkerJobMatchPreviewSummary['duplicateReadState']
  workerConsentStates?: Record<string, Partial<WhatsappConsentState>>
  suppressedMobiles?: Iterable<string>
  existingMatchKeys?: Iterable<string>
  templateState: WorkerJobMatchTemplateState
  pauseAllSending: boolean
  now: Date
  timeZone: string
  maxPairs?: number
}): WorkerJobMatchPreviewSummary => {
  if (source !== 'supabase') {
    return {
      source: 'unavailable',
      duplicateReadState,
      duplicateCheckAvailable: false,
      totalPossiblePairs: 0,
      evaluatedPairCount: 0,
      truncated: false,
      eligibleCount: 0,
      blockedCount: 0,
      alreadyMatchedCount: 0,
      rows: [],
    }
  }

  const safeMaxPairs = Math.max(0, Math.floor(maxPairs))
  const totalPossiblePairs = snapshot.workers.length * snapshot.jobPosts.length
  const suppressedSet = new Set(suppressedMobiles)
  const existingMatchSet = new Set(existingMatchKeys)
  const categoryLabels = new Map(
    snapshot.categories.map((category) => [category.id, category.name]),
  )
  const rows: WorkerJobMatchPreviewRow[] = []

  outer: for (const job of snapshot.jobPosts) {
    for (const worker of snapshot.workers) {
      if (rows.length >= safeMaxPairs) break outer

      const expectedMatchKey = worker.id && job.id
        ? `worker-job-match:${encodeURIComponent(worker.id.trim())}:${encodeURIComponent(job.id.trim())}`
        : ''
      const suppressed = suppressedSet.has(normalizeMobile(worker.mobile))
      const plan = planWorkerJobMatchDryRun({
        worker,
        job,
        consentState: workerConsentStates[worker.id] || {},
        suppressed,
        existingMatch: Boolean(expectedMatchKey && existingMatchSet.has(expectedMatchKey)),
        pauseAllSending,
        templateState,
        now,
        timeZone,
      })
      const reasonCodes = Array.from(
        new Set([
          ...plan.structuralReasonCodes,
          ...plan.eligibility.reasonCodes,
          plan.dispatchReason,
        ].filter((reasonCode) => reasonCode && reasonCode !== 'dry_run_only')),
      )

      rows.push({
        matchKey: plan.matchKey || '',
        workerId: plan.recipientId,
        jobId: plan.jobId,
        companyId: plan.companyId,
        jobTitle: job.title,
        categoryId: job.categoryId,
        categoryLabel: categoryLabels.get(job.categoryId) || job.categoryId,
        city: job.city,
        maskedMobile: plan.maskedMobile,
        decision: plan.decision,
        dispatchReason: plan.dispatchReason,
        reasonCodes,
        consentEligible: plan.eligibility.missingConsents.length === 0,
        suppressed,
        templateEligible:
          templateState.configured && templateState.approved && templateState.enabled,
      })
    }
  }

  return {
    source: 'supabase',
    duplicateReadState,
    duplicateCheckAvailable: duplicateReadState === 'connected',
    totalPossiblePairs,
    evaluatedPairCount: rows.length,
    truncated: rows.length < totalPossiblePairs,
    eligibleCount: rows.filter((row) => row.decision === 'eligible').length,
    blockedCount: rows.filter((row) => row.decision === 'blocked').length,
    alreadyMatchedCount: rows.filter((row) => row.decision === 'already_matched').length,
    rows,
  }
}
