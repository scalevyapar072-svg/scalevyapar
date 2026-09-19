export type WorkerSearchJobCandidate = {
  id: string
  companyId: string
  status: string | null | undefined
  expiresAt?: string | null
  createdAt?: string | null
  publishedAt?: string | null
}

type ResolveAuthorizedWorkerSearchJobInput = {
  authenticatedCompanyId: string | null | undefined
  requestedJobId: string | null | undefined
  now?: Date
}

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

const isExpiredWorkerSearchJob = (
  job: WorkerSearchJobCandidate,
  now: Date,
) => {
  const expiresAtValue = String(job.expiresAt || '').trim()
  if (!expiresAtValue) return false

  const expiresAt = new Date(expiresAtValue)
  if (Number.isNaN(expiresAt.getTime())) return false

  const expiryDay = new Date(expiresAt)
  const currentDay = new Date(now)
  expiryDay.setHours(0, 0, 0, 0)
  currentDay.setHours(0, 0, 0, 0)
  return expiryDay < currentDay
}

export const isLiveWorkerSearchJob = (
  job: WorkerSearchJobCandidate,
  now = new Date(),
) => normalize(job.status) === 'live' && !isExpiredWorkerSearchJob(job, now)

export const resolveAuthorizedWorkerSearchJob = <Job extends WorkerSearchJobCandidate>(
  jobs: readonly Job[],
  {
    authenticatedCompanyId,
    requestedJobId,
    now = new Date(),
  }: ResolveAuthorizedWorkerSearchJobInput,
): Job | null => {
  const companyId = String(authenticatedCompanyId || '').trim()
  const requestedId = String(requestedJobId || '').trim()
  if (!companyId) return null

  const ownedLiveJobs = jobs.filter(job =>
    job.companyId === companyId && isLiveWorkerSearchJob(job, now)
  )

  if (requestedId) {
    return ownedLiveJobs.find(job => job.id === requestedId) || null
  }

  return [...ownedLiveJobs].sort((left, right) =>
    String(right.createdAt || '').localeCompare(String(left.createdAt || '')) ||
    String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')) ||
    right.id.localeCompare(left.id)
  )[0] || null
}

export const buildCompanyWorkerSearchHref = (jobId: string | null | undefined) => {
  const normalizedJobId = String(jobId || '').trim()
  return normalizedJobId
    ? `/labour/company/search?jobId=${encodeURIComponent(normalizedJobId)}`
    : '/labour/company/search'
}
