export type LabourPlanRestrictionLike = {
  id?: string
  name?: string
  categoryId?: string
  industryCategoryValues?: string[]
  businessTypeValues?: string[]
  labourCategoryIds?: string[]
  jobPostLimit?: number
  planValidityDays?: number
  jobPostLiveDays?: number
  validityDays?: number
  planAmount?: number
  isActive?: boolean
  audience?: string
}

export type LabourPlanUsageJobLike = {
  id: string
  companyId: string
  description: string
  planId?: string
  status?: string
  publishedAt?: string
  expiresAt?: string
  createdAt?: string
}

export type LabourPlanPurchaseLike = {
  entityType?: string
  entityId?: string
  transactionType?: string
  reference?: string
  status?: string
  createdAt?: string
}

export type CompanyJobPostingPlanStatus = 'active' | 'inactive' | 'expired' | 'limit_used'

export type CompanyJobPostingPlanSummary = {
  planId: string
  planName: string
  status: CompanyJobPostingPlanStatus
  source: 'paid_plan' | 'job_history_inferred' | 'assigned_plan'
  usedJobPosts: number
  totalJobPosts: number
  remainingJobPosts: number
  validFrom: string
  validUntil: string
  planAmount: number
  planValidityDays: number
  jobPostLiveDays: number
  hasPaidPurchase: boolean
}

const normalizeLookup = (value: unknown) => String(value || '').trim().toLowerCase()
const PAID_PLAN_PURCHASE_STATUSES = new Set(['completed', 'success', 'paid', 'active'])
const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const minIsoDate = (left: string, right: string) => {
  if (!left) return right
  if (!right) return left
  const leftTime = new Date(left).getTime()
  const rightTime = new Date(right).getTime()
  if (Number.isNaN(leftTime)) return right
  if (Number.isNaN(rightTime)) return left
  return leftTime <= rightTime ? left : right
}

const normalizeIsoDate = (value: unknown) => String(value || '').slice(0, 10)
const isIsoDateBefore = (left: string, right: string) => Boolean(left && right && left < right)
const getJobPlanSortDate = (job: LabourPlanUsageJobLike) =>
  normalizeIsoDate(job.publishedAt) || normalizeIsoDate(job.createdAt) || normalizeIsoDate(job.expiresAt)

export const getPlanValidityDays = (plan: LabourPlanRestrictionLike) => {
  const explicitPlanValidityDays = toNumber(plan.planValidityDays)
  if (explicitPlanValidityDays > 0) {
    return explicitPlanValidityDays
  }

  const legacyValidityDays = toNumber(plan.validityDays)
  return legacyValidityDays > 0 ? legacyValidityDays : 0
}

export const getJobPostLiveDays = (plan: LabourPlanRestrictionLike) => {
  const explicitJobPostLiveDays = toNumber(plan.jobPostLiveDays)
  if (explicitJobPostLiveDays > 0) {
    return explicitJobPostLiveDays
  }

  const legacyValidityDays = toNumber(plan.validityDays)
  return legacyValidityDays > 0 ? legacyValidityDays : 0
}

export const getPlanIndustryCategoryValues = (plan: LabourPlanRestrictionLike) => {
  return Array.isArray(plan.industryCategoryValues)
    ? plan.industryCategoryValues.map(value => String(value || '').trim()).filter(Boolean)
    : []
}

export const getPlanBusinessTypeValues = (plan: LabourPlanRestrictionLike) => {
  return Array.isArray(plan.businessTypeValues)
    ? plan.businessTypeValues.map(value => String(value || '').trim()).filter(Boolean)
    : []
}

export const getPlanLabourCategoryIds = (plan: LabourPlanRestrictionLike) => {
  const mappedCategoryIds = Array.isArray(plan.labourCategoryIds)
    ? plan.labourCategoryIds.map(value => String(value || '').trim()).filter(Boolean)
    : []

  if (mappedCategoryIds.length > 0) {
    return mappedCategoryIds
  }

  return plan.categoryId ? [String(plan.categoryId).trim()].filter(Boolean) : []
}

export const extractConnectedPlanLabel = (description: string) => {
  const normalized = String(description || '').replace(/\r/g, '')
  const detailMarker = '\n\nJob requirement details\n'
  const detailIndex = normalized.indexOf(detailMarker)

  if (detailIndex === -1) {
    return ''
  }

  const detailBlock = normalized.slice(detailIndex + detailMarker.length)
  const docsIndex = detailBlock.indexOf('\n\nDocuments\n')
  const rows = (docsIndex === -1 ? detailBlock : detailBlock.slice(0, docsIndex))
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  for (const row of rows) {
    const separatorIndex = row.indexOf(':')
    if (separatorIndex === -1) continue

    const label = row.slice(0, separatorIndex).trim().toLowerCase()
    if (label === 'connected plan') {
      return row.slice(separatorIndex + 1).trim()
    }
  }

  return ''
}

export const jobMatchesPlan = (
  job: LabourPlanUsageJobLike,
  companyId: string,
  plan: LabourPlanRestrictionLike
) => {
  if (job.companyId !== companyId) return false

  const planId = String(plan.id || '').trim()
  if (planId && String(job.planId || '').trim() === planId) {
    return true
  }

  const planName = String(plan.name || '').trim()
  if (!planName) {
    return false
  }

  return normalizeLookup(extractConnectedPlanLabel(job.description)) === normalizeLookup(planName)
}

export const countUsedJobPostsForPlan = (
  jobs: LabourPlanUsageJobLike[],
  companyId: string,
  plan: LabourPlanRestrictionLike,
  excludeJobId = ''
) => {
  return jobs.filter(job => job.id !== excludeJobId && jobMatchesPlan(job, companyId, plan)).length
}

export const isPaidCompanyPlanPurchaseStatus = (status: unknown) => {
  const normalized = normalizeLookup(status)
  return !normalized || PAID_PLAN_PURCHASE_STATUSES.has(normalized)
}

export const resolveLatestCompanyPlanPurchase = (
  companyId: string,
  plan: LabourPlanRestrictionLike | null,
  walletTransactions: LabourPlanPurchaseLike[]
) => {
  if (!companyId || !plan?.id) {
    return null
  }

  return walletTransactions
    .filter(transaction =>
      transaction.entityType === 'company' &&
      transaction.entityId === companyId &&
      transaction.transactionType === 'plan_purchase' &&
      isPaidCompanyPlanPurchaseStatus(transaction.status) &&
      (!transaction.reference || transaction.reference === plan.id)
    )
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))[0] || null
}

export const resolveCompanyPlanWindow = (
  companyId: string,
  plan: LabourPlanRestrictionLike | null,
  walletTransactions: LabourPlanPurchaseLike[]
) => {
  if (!companyId || !plan?.id) {
    return { startDate: '', endDate: '' }
  }

  const planValidityDays = getPlanValidityDays(plan)
  if (planValidityDays <= 0) {
    return { startDate: '', endDate: '' }
  }

  const latestPlanPurchase = resolveLatestCompanyPlanPurchase(companyId, plan, walletTransactions)

  const startDate = String(latestPlanPurchase?.createdAt || '').slice(0, 10)
  if (!startDate) {
    return { startDate: '', endDate: '' }
  }

  return {
    startDate,
    endDate: addDays(startDate, planValidityDays)
  }
}

const buildCompanyPlanSummary = ({
  companyId,
  plan,
  jobs,
  today,
  validFrom,
  validUntil,
  hasPaidPurchase,
  source
}: {
  companyId: string
  plan: LabourPlanRestrictionLike
  jobs: LabourPlanUsageJobLike[]
  today: string
  validFrom: string
  validUntil: string
  hasPaidPurchase: boolean
  source: CompanyJobPostingPlanSummary['source']
}): CompanyJobPostingPlanSummary => {
  const totalJobPosts = toNumber(plan.jobPostLimit)
  const usedJobPosts = countUsedJobPostsForPlan(jobs, companyId, plan)
  const remainingJobPosts = Math.max(0, totalJobPosts - usedJobPosts)
  const status: CompanyJobPostingPlanStatus =
    validUntil && isIsoDateBefore(validUntil, today)
      ? 'expired'
      : remainingJobPosts <= 0
        ? 'limit_used'
        : hasPaidPurchase || source === 'job_history_inferred' || source === 'assigned_plan'
          ? 'active'
          : 'inactive'

  return {
    planId: String(plan.id || '').trim(),
    planName: String(plan.name || '').trim() || 'Connected plan',
    status,
    source,
    usedJobPosts,
    totalJobPosts,
    remainingJobPosts,
    validFrom,
    validUntil,
    planAmount: toNumber(plan.planAmount),
    planValidityDays: getPlanValidityDays(plan),
    jobPostLiveDays: getJobPostLiveDays(plan),
    hasPaidPurchase
  }
}

const resolveCompanyPlanFromJobs = (
  companyId: string,
  plans: LabourPlanRestrictionLike[],
  jobs: LabourPlanUsageJobLike[]
) => {
  const companyJobs = jobs
    .filter(job => job.companyId === companyId)
    .map(job => {
      const directPlan = String(job.planId || '').trim()
        ? plans.find(plan => String(plan.id || '').trim() === String(job.planId || '').trim()) || null
        : null
      const connectedPlanLabel = extractConnectedPlanLabel(job.description)
      const labelPlan = connectedPlanLabel
        ? plans.find(plan => normalizeLookup(plan.name) === normalizeLookup(connectedPlanLabel)) || null
        : null

      return {
        job,
        plan: directPlan || labelPlan
      }
    })
    .filter((item): item is { job: LabourPlanUsageJobLike; plan: LabourPlanRestrictionLike } => Boolean(item.plan))
    .sort((left, right) => getJobPlanSortDate(right.job).localeCompare(getJobPlanSortDate(left.job)))

  return companyJobs[0] || null
}

export const resolveCompanyCurrentJobPostingPlan = ({
  companyId,
  activePlanId,
  plans,
  walletTransactions,
  jobs,
  today = formatLocalDateForPlan(new Date())
}: {
  companyId: string
  activePlanId?: string
  plans: LabourPlanRestrictionLike[]
  walletTransactions: LabourPlanPurchaseLike[]
  jobs: LabourPlanUsageJobLike[]
  today?: string
}): CompanyJobPostingPlanSummary | null => {
  const companyPlans = plans.filter(plan => plan.audience === 'company' && plan.isActive !== false)
  const activePlan = activePlanId
    ? companyPlans.find(plan => String(plan.id || '').trim() === String(activePlanId || '').trim()) || null
    : null

  if (activePlan) {
    const planWindow = resolveCompanyPlanWindow(companyId, activePlan, walletTransactions)
    const latestPaidPlanPurchase = resolveLatestCompanyPlanPurchase(companyId, activePlan, walletTransactions)

    if (latestPaidPlanPurchase?.createdAt) {
      return buildCompanyPlanSummary({
        companyId,
        plan: activePlan,
        jobs,
        today,
        validFrom: planWindow.startDate,
        validUntil: planWindow.endDate,
        hasPaidPurchase: true,
        source: 'paid_plan'
      })
    }
  }

  const inferredPlanMatch = resolveCompanyPlanFromJobs(companyId, companyPlans, jobs)
  if (inferredPlanMatch?.plan) {
    const validFrom = normalizeIsoDate(inferredPlanMatch.job.publishedAt) || normalizeIsoDate(inferredPlanMatch.job.createdAt)
    const validUntil = validFrom
      ? addDays(validFrom, getPlanValidityDays(inferredPlanMatch.plan))
      : normalizeIsoDate(inferredPlanMatch.job.expiresAt)

    return buildCompanyPlanSummary({
      companyId,
      plan: inferredPlanMatch.plan,
      jobs,
      today,
      validFrom,
      validUntil,
      hasPaidPurchase: false,
      source: 'job_history_inferred'
    })
  }

  if (activePlan) {
    return buildCompanyPlanSummary({
      companyId,
      plan: activePlan,
      jobs,
      today,
      validFrom: '',
      validUntil: '',
      hasPaidPurchase: false,
      source: 'assigned_plan'
    })
  }

  return null
}

function formatLocalDateForPlan(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const calculateJobLiveWindow = ({
  startDate,
  plan,
  planEndDate
}: {
  startDate: string
  plan: LabourPlanRestrictionLike
  planEndDate?: string
}) => {
  const normalizedStartDate = String(startDate || '').slice(0, 10)
  if (!normalizedStartDate) {
    return { startDate: '', endDate: '' }
  }

  const liveDays = getJobPostLiveDays(plan)
  const rawEndDate = liveDays > 0 ? addDays(normalizedStartDate, liveDays) : ''
  const cappedEndDate = planEndDate ? minIsoDate(rawEndDate, planEndDate) : rawEndDate

  return {
    startDate: normalizedStartDate,
    endDate: cappedEndDate || rawEndDate
  }
}
