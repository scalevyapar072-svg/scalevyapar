import { jwtVerify, SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import {
  createLabourEntity,
  getLabourMarketplaceSnapshot,
  LabourCompanyRecord,
  LabourJobApplicationRecord,
  JobApplicationStatus,
  LabourWorkerNotificationRecord,
  updateLabourEntity
} from './labour-marketplace'
import { sendWorkerPushNotification } from './labour-worker-push'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')

export type CompanyAppTokenPayload = {
  companyId: string
  email: string
  role: 'COMPANY_APP'
}

export type CompanyAppProfile = {
  id: string
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  city: string
  status: string
  activePlan: string
  categoryLabels: string[]
}

export type CompanyAppApplicant = {
  applicationId: string
  appliedAt: string
  status: JobApplicationStatus
  note: string
  workerId: string
  fullName: string
  city: string
  mobile: string | null
  canContactDirectly: boolean
  categoryLabels: string[]
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  walletBalance: number
  profilePhotoPath: string
}

export type CompanyAppJobPost = {
  id: string
  title: string
  city: string
  status: string
  workersNeeded: number
  wageAmount: number
  publishedAt: string
  expiresAt: string
  totalApplications: number
  shortlistedCount: number
  hiredCount: number
  applicants: CompanyAppApplicant[]
}

export type CompanyAppDashboard = {
  profile: CompanyAppProfile
  stats: {
    liveJobPosts: number
    totalApplications: number
    shortlistedApplications: number
    hiredApplications: number
  }
  jobs: CompanyAppJobPost[]
  recentApplications: CompanyAppApplicant[]
}

const normalizeName = (value: string) => value.trim().toLowerCase()
const normalizeEmail = (value: string) => value.trim().toLowerCase()
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const signCompanyToken = async (payload: Omit<CompanyAppTokenPayload, 'role'>) =>
  new SignJWT({
    companyId: payload.companyId,
    email: payload.email,
    role: 'COMPANY_APP'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)

const createWorkerNotification = async (
  workerId: string,
  payload: Pick<LabourWorkerNotificationRecord, 'type' | 'title' | 'message' | 'priority'> & {
    relatedJobPostId?: string
    relatedCompanyId?: string
  }
) => {
  const notificationId = createId('notification')
  await createLabourEntity('workerNotifications', {
    id: notificationId,
    workerId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedJobPostId: payload.relatedJobPostId || '',
    relatedCompanyId: payload.relatedCompanyId || '',
    isRead: false,
    priority: payload.priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, 'company-app')

  await sendWorkerPushNotification({
    workerId,
    title: payload.title,
    body: payload.message,
    priority: payload.priority,
    data: {
      relatedJobPostId: payload.relatedJobPostId,
      relatedCompanyId: payload.relatedCompanyId,
      type: payload.type
    }
  })
}

const toCompanyProfile = (company: LabourCompanyRecord, categoryLabels: string[]): CompanyAppProfile => ({
  id: company.id,
  companyName: company.companyName,
  contactPerson: company.contactPerson,
  email: company.email,
  mobile: company.mobile,
  city: company.city,
  status: company.status,
  activePlan: company.activePlan,
  categoryLabels
})

export const loginCompanyApp = async (email: string, identity: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const normalizedEmail = normalizeEmail(email)
  const normalizedIdentity = normalizeName(identity)

  const company = snapshot.companies.find(item =>
    normalizeEmail(item.email) === normalizedEmail &&
    (
      normalizeName(item.companyName) === normalizedIdentity ||
      normalizeName(item.contactPerson) === normalizedIdentity
    )
  )

  if (!company) {
    throw new Error('Company account not found. Use your registered company email and your company name or contact person. Password is not used on this screen.')
  }

  if (company.status === 'blocked') {
    throw new Error('This company account is blocked. Please contact labour support.')
  }

  const token = await signCompanyToken({
    companyId: company.id,
    email: normalizedEmail
  })

  return {
    token,
    dashboard: await getCompanyAppDashboard(company.id)
  }
}

export const loginCompanyAppFromDashboard = async (email: string, fallbackIdentity?: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const normalizedEmail = normalizeEmail(email)
  const normalizedFallbackIdentity = normalizeName(fallbackIdentity || '')

  const company = snapshot.companies.find(item => {
    if (normalizeEmail(item.email) !== normalizedEmail) {
      return false
    }

    if (!normalizedFallbackIdentity) {
      return true
    }

    return (
      normalizeName(item.companyName) === normalizedFallbackIdentity ||
      normalizeName(item.contactPerson) === normalizedFallbackIdentity
    )
  }) || snapshot.companies.find(item => normalizeEmail(item.email) === normalizedEmail)

  if (!company) {
    throw new Error('No registered company was found for this dashboard account.')
  }

  if (company.status === 'blocked') {
    throw new Error('This company account is blocked. Please contact labour support.')
  }

  const token = await signCompanyToken({
    companyId: company.id,
    email: normalizedEmail
  })

  return {
    token,
    dashboard: await getCompanyAppDashboard(company.id)
  }
}

export const requireCompanyApp = async (request: NextRequest): Promise<CompanyAppTokenPayload> => {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (!token) {
    throw new Error('Company authorization token is missing.')
  }

  const verified = await jwtVerify(token, JWT_SECRET)
  const payload = verified.payload as Partial<CompanyAppTokenPayload>

  if (payload.role !== 'COMPANY_APP' || !payload.companyId || !payload.email) {
    throw new Error('Invalid company authorization token.')
  }

  return {
    companyId: payload.companyId,
    email: payload.email,
    role: 'COMPANY_APP'
  }
}

export const getCompanyAppDashboard = async (companyId: string): Promise<CompanyAppDashboard> => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const company = snapshot.companies.find(item => item.id === companyId)

  if (!company) {
    throw new Error('Company account not found.')
  }

  const categoryLabels = company.categoryIds
    .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name || categoryId)

  const companyJobPosts = snapshot.jobPosts
    .filter(jobPost => jobPost.companyId === companyId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const jobs = companyJobPosts.map(jobPost => {
    const applicants = snapshot.jobApplications
      .filter(application => application.companyId === companyId && application.jobPostId === jobPost.id)
      .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))
      .map(application => {
        const worker = snapshot.workers.find(item => item.id === application.workerId)
        const workerCategoryLabels = (worker?.categoryIds || [])
          .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name || categoryId)
        const canContactDirectly = Boolean(
          worker &&
          worker.status === 'active' &&
          worker.isVisible &&
          worker.walletBalance > 0
        )

        return {
          applicationId: application.id,
          appliedAt: application.appliedAt,
          status: application.status,
          note: application.note,
          workerId: application.workerId,
          fullName: worker?.fullName || 'Unknown worker',
          city: worker?.city || '',
          mobile: canContactDirectly ? worker?.mobile || null : null,
          canContactDirectly,
          categoryLabels: workerCategoryLabels,
          skills: worker?.skills || [],
          experienceYears: worker?.experienceYears || 0,
          expectedDailyWage: worker?.expectedDailyWage || 0,
          availability: worker?.availability || 'not_available',
          walletBalance: worker?.walletBalance || 0,
          profilePhotoPath: worker?.profilePhotoPath || ''
        } satisfies CompanyAppApplicant
      })

    return {
      id: jobPost.id,
      title: jobPost.title,
      city: jobPost.city,
      status: jobPost.status,
      workersNeeded: jobPost.workersNeeded,
      wageAmount: jobPost.wageAmount,
      publishedAt: jobPost.publishedAt,
      expiresAt: jobPost.expiresAt,
      totalApplications: applicants.length,
      shortlistedCount: applicants.filter(item => item.status === 'shortlisted').length,
      hiredCount: applicants.filter(item => item.status === 'hired').length,
      applicants
    } satisfies CompanyAppJobPost
  })

  const recentApplications = jobs
    .flatMap(job => job.applicants)
    .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))
    .slice(0, 12)

  return {
    profile: toCompanyProfile(company, categoryLabels),
    stats: {
      liveJobPosts: jobs.filter(job => job.status === 'live').length,
      totalApplications: recentApplications.length ? jobs.reduce((sum, job) => sum + job.totalApplications, 0) : jobs.reduce((sum, job) => sum + job.totalApplications, 0),
      shortlistedApplications: jobs.reduce((sum, job) => sum + job.shortlistedCount, 0),
      hiredApplications: jobs.reduce((sum, job) => sum + job.hiredCount, 0)
    },
    jobs,
    recentApplications
  }
}

export const updateCompanyApplicationStatus = async (
  companyId: string,
  applicationId: string,
  status: JobApplicationStatus
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const application = snapshot.jobApplications.find(item => item.id === applicationId && item.companyId === companyId)

  if (!application) {
    throw new Error('Job application not found for this company.')
  }

  const updated = await updateLabourEntity('jobApplications', applicationId, {
    ...application,
    status,
    updatedAt: new Date().toISOString()
  }, 'company-app')

  if (!updated) {
    throw new Error('Failed to update worker application status.')
  }

  const jobPost = snapshot.jobPosts.find(item => item.id === application.jobPostId)
  const company = snapshot.companies.find(item => item.id === companyId)
  const statusLabels: Record<JobApplicationStatus, string> = {
    submitted: 'submitted',
    reviewed: 'reviewed',
    shortlisted: 'shortlisted',
    rejected: 'rejected',
    hired: 'hired'
  }

  await createWorkerNotification(application.workerId, {
    type: 'application_status',
    title: `Application ${statusLabels[status]}`,
    message: `${company?.companyName || 'A company'} updated your application for ${jobPost?.title || 'a job'} to ${statusLabels[status]}.`,
    priority: status === 'hired' ? 'high' : status === 'shortlisted' ? 'medium' : 'low',
    relatedJobPostId: jobPost?.id,
    relatedCompanyId: company?.id
  })

  return getCompanyAppDashboard(companyId)
}
