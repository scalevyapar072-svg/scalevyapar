type CompanyPlanAmountLike = {
  audience?: unknown
  planAmount?: unknown
}

type CompanyJobHistoryLike = {
  companyId?: unknown
  status?: unknown
  publishedAt?: unknown
}

type CompanyFreeTrialAuditLike = {
  id?: unknown
  summary?: unknown
  createdAt?: unknown
}

export type CompanyJobPublicationMarker = {
  companyId: string
  planId: string
  jobId: string
  publishedAt: string
}

export type CompanyFreeTrialMarkerStatus = 'reserved' | 'consumed'

export type CompanyFreeTrialMarker = {
  companyId: string
  planId: string
  submissionId: string
  jobId: string
  status: CompanyFreeTrialMarkerStatus
  reservedAt: string
  consumedAt: string
}

export const COMPANY_FREE_TRIAL_MARKER_PREFIX = 'company-job-post-free-trial:v1:'
export const COMPANY_JOB_PUBLICATION_MARKER_PREFIX = 'company-job-publication-history:v1:'
export const COMPANY_FREE_TRIAL_RESERVATION_TTL_MS = 5 * 60 * 1000

const normalize = (value: unknown) => String(value || '').trim()
const normalizeLookup = (value: unknown) => normalize(value).toLowerCase()

export const getCompanyPlanAmountValidationError = (
  audience: unknown,
  planAmount: unknown,
) => {
  if (audience !== 'company') return ''
  if (typeof planAmount !== 'number' || !Number.isFinite(planAmount)) {
    return 'Company plan amount must be a valid number.'
  }
  if (planAmount < 0) {
    return 'Plan amounts cannot be negative.'
  }
  return ''
}

export const getCompanyFreePlanJobPostLimitValidationError = (
  audience: unknown,
  planAmount: unknown,
  jobPostLimit: unknown,
) => {
  if (audience !== 'company' || planAmount !== 0) return ''
  return typeof jobPostLimit === 'number' && Number.isFinite(jobPostLimit) && jobPostLimit === 1
    ? ''
    : 'A ₹0 Company plan must allow exactly 1 job post.'
}

export const resolveStoredCompanyPlanAmount = (plan: CompanyPlanAmountLike) => {
  if (plan.audience !== 'company') return null
  if (typeof plan.planAmount !== 'number' || !Number.isFinite(plan.planAmount) || plan.planAmount < 0) {
    return null
  }
  return plan.planAmount
}

export const isStoredFreeCompanyPlan = (plan: CompanyPlanAmountLike) =>
  resolveStoredCompanyPlanAmount(plan) === 0

export const hasSuccessfulCompanyJobPublication = (
  jobs: CompanyJobHistoryLike[],
  companyId: string,
) => jobs.some(job => {
  if (normalize(job.companyId) !== normalize(companyId)) return false
  if (normalize(job.publishedAt)) return true
  return ['live', 'published', 'active'].includes(normalizeLookup(job.status))
})

export const buildCompanyFreeTrialMarkerId = (companyId: string) =>
  `audit-company-free-trial-${normalize(companyId)}`

export const buildCompanyJobPublicationMarkerId = (companyId: string) =>
  `audit-company-job-publication-${normalize(companyId)}`

export const serializeCompanyFreeTrialMarker = (marker: CompanyFreeTrialMarker) =>
  `${COMPANY_FREE_TRIAL_MARKER_PREFIX}${JSON.stringify(marker)}`

export const parseCompanyFreeTrialMarker = (value: unknown): CompanyFreeTrialMarker | null => {
  const normalized = normalize(value)
  if (!normalized.startsWith(COMPANY_FREE_TRIAL_MARKER_PREFIX)) return null

  try {
    const parsed = JSON.parse(normalized.slice(COMPANY_FREE_TRIAL_MARKER_PREFIX.length)) as Partial<CompanyFreeTrialMarker>
    const status = parsed.status === 'consumed' ? 'consumed' : parsed.status === 'reserved' ? 'reserved' : null
    const marker = {
      companyId: normalize(parsed.companyId),
      planId: normalize(parsed.planId),
      submissionId: normalize(parsed.submissionId),
      jobId: normalize(parsed.jobId),
      status,
      reservedAt: normalize(parsed.reservedAt),
      consumedAt: normalize(parsed.consumedAt),
    }

    if (!marker.companyId || !marker.planId || !marker.submissionId || !marker.jobId || !marker.status || !marker.reservedAt) {
      return null
    }

    return marker as CompanyFreeTrialMarker
  } catch {
    return null
  }
}

export const serializeCompanyJobPublicationMarker = (marker: CompanyJobPublicationMarker) =>
  `${COMPANY_JOB_PUBLICATION_MARKER_PREFIX}${JSON.stringify(marker)}`

export const parseCompanyJobPublicationMarker = (value: unknown): CompanyJobPublicationMarker | null => {
  const normalized = normalize(value)
  if (!normalized.startsWith(COMPANY_JOB_PUBLICATION_MARKER_PREFIX)) return null

  try {
    const parsed = JSON.parse(normalized.slice(COMPANY_JOB_PUBLICATION_MARKER_PREFIX.length)) as Partial<CompanyJobPublicationMarker>
    const marker = {
      companyId: normalize(parsed.companyId),
      planId: normalize(parsed.planId),
      jobId: normalize(parsed.jobId),
      publishedAt: normalize(parsed.publishedAt),
    }
    return marker.companyId && marker.jobId && marker.publishedAt ? marker : null
  } catch {
    return null
  }
}

export const findCompanyFreeTrialMarker = (
  auditLogs: CompanyFreeTrialAuditLike[],
  companyId: string,
) => {
  const markerId = buildCompanyFreeTrialMarkerId(companyId)
  const record = auditLogs.find(item => normalize(item.id) === markerId) || null
  if (!record) return null
  const marker = parseCompanyFreeTrialMarker(record.summary)
  return marker ? { record, marker } : null
}

export const isMatchingCompanyFreeTrialRetry = (
  marker: CompanyFreeTrialMarker,
  input: Pick<CompanyFreeTrialMarker, 'companyId' | 'planId' | 'submissionId' | 'jobId'>,
) =>
  marker.companyId === normalize(input.companyId) &&
  marker.planId === normalize(input.planId) &&
  marker.submissionId === normalize(input.submissionId) &&
  marker.jobId === normalize(input.jobId)

export const isCompanyFreeTrialReservationStale = (
  marker: CompanyFreeTrialMarker,
  now: Date | string | number = new Date(),
  staleAfterMs = COMPANY_FREE_TRIAL_RESERVATION_TTL_MS,
) => {
  if (marker.status !== 'reserved' || !Number.isFinite(staleAfterMs) || staleAfterMs < 0) return false
  const reservedAt = new Date(marker.reservedAt).getTime()
  const nowAt = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return Number.isFinite(reservedAt) && Number.isFinite(nowAt) && nowAt - reservedAt >= staleAfterMs
}
