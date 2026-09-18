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
