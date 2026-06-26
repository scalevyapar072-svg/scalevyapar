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
import { resolveCompanyCurrentJobPostingPlan, resolveCompanyJobPostingPlans, resolveCompanyPlanWindow, type CompanyJobPostingPlanSummary } from './labour-plan-utils'
import { sendWorkerPushNotification } from './labour-worker-push'
import { buildCompanyBillingHistoryFromLedger, type CompanyBillingRecord } from './labour-company-billing'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')

export type CompanyAppTokenPayload = {
  companyId: string
  email: string
  role: 'COMPANY_APP'
}

export type CompanyAppProfile = {
  id: string
  activePlanId: string
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  contactMobile: string
  businessType: string
  industryCategory: string
  gstNumber: string
  companyAddress: string
  state: string
  pincode: string
  city: string
  area: string
  status: string
  activePlan: string
  planValidFrom: string
  planValidUntil: string
  categoryLabels: string[]
  activeJobCategoryLabels: string[]
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
  companyId: string
  planId: string
  title: string
  description: string
  city: string
  locationLabel: string
  categoryId: string
  categoryLabel: string
  status: string
  workersNeeded: number
  wageAmount: number
  publishedAt: string
  expiresAt: string
  workerCategory: string
  salaryType: string
  shiftType: string
  weeklyOff: string
  overtimeAvailable: string
  foodFacility: string
  accommodation: string
  transportFacility: string
  jobDuration: string
  requiredSkills: string
  specialInstructions: string
  totalApplications: number
  shortlistedCount: number
  hiredCount: number
  applicants: CompanyAppApplicant[]
}

export type CompanyAppDashboard = {
  profile: CompanyAppProfile
  currentJobPostingPlan: CompanyJobPostingPlanSummary | null
  currentJobPostingPlans: CompanyJobPostingPlanSummary[]
  stats: {
    liveJobPosts: number
    totalApplications: number
    shortlistedApplications: number
    hiredApplications: number
  }
  jobs: CompanyAppJobPost[]
  recentApplications: CompanyAppApplicant[]
  billingHistory: CompanyBillingRecord[]
}

export type CompanyBillingProfileUpdatePayload = {
  companyName?: string
  gstNumber?: string
  companyAddress?: string
  city?: string
  area?: string
  state?: string
  pincode?: string
}

const normalizeName = (value: string) => value.trim().toLowerCase()
const normalizeEmail = (value: string) => value.trim().toLowerCase()
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const resolveBestCompanyAppLoginMatch = ({
  companies,
  normalizedEmail,
  normalizedIdentity,
  plans,
  walletTransactions,
  jobs
}: {
  companies: LabourCompanyRecord[]
  normalizedEmail: string
  normalizedIdentity?: string
  plans: Awaited<ReturnType<typeof getLabourMarketplaceSnapshot>>['plans']
  walletTransactions: Awaited<ReturnType<typeof getLabourMarketplaceSnapshot>>['walletTransactions']
  jobs: Awaited<ReturnType<typeof getLabourMarketplaceSnapshot>>['jobPosts']
}) => {
  const candidates = companies.filter(company => {
    if (normalizeEmail(company.email) !== normalizedEmail) {
      return false
    }

    if (!normalizedIdentity) {
      return true
    }

    return (
      normalizeName(company.companyName) === normalizedIdentity ||
      normalizeName(company.contactPerson) === normalizedIdentity
    )
  })

  return candidates
    .map((company, index) => {
      const currentPlan = resolveCompanyCurrentJobPostingPlan({
        companyId: company.id,
        activePlanId: company.activePlan,
        plans,
        walletTransactions,
        jobs: jobs
          .filter(jobPost => jobPost.companyId === company.id)
          .map(jobPost => ({
            id: jobPost.id,
            companyId: jobPost.companyId,
            description: jobPost.description,
            planId: jobPost.planId,
            status: jobPost.status,
            publishedAt: jobPost.publishedAt,
            expiresAt: jobPost.expiresAt,
            createdAt: jobPost.createdAt
          }))
      })

      const score =
        (company.status === 'active' ? 100 : 0) +
        (currentPlan?.status === 'active' ? 50 : 0) +
        (currentPlan ? 25 : 0) +
        (company.activePlan ? 10 : 0)

      return { company, index, score, updatedAt: company.updatedAt || company.createdAt || '' }
    })
    .sort((left, right) =>
      right.score - left.score ||
      String(right.updatedAt).localeCompare(String(left.updatedAt)) ||
      left.index - right.index
    )[0]?.company || null
}

const parseJobRequirementDetailMap = (description: string) => {
  const normalized = String(description || '').replace(/\r/g, '')
  const detailMarker = '\n\nJob requirement details\n'
  const docsMarker = '\n\nDocuments\n'
  const detailIndex = normalized.indexOf(detailMarker)
  const detailMap = new Map<string, string>()

  if (detailIndex === -1) {
    return detailMap
  }

  const afterDetails = normalized.slice(detailIndex + detailMarker.length)
  const docsIndex = afterDetails.indexOf(docsMarker)
  const detailBlock = (docsIndex === -1 ? afterDetails : afterDetails.slice(0, docsIndex)).trim()

  detailBlock
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return
      const label = line.slice(0, separatorIndex).trim().toLowerCase()
      const value = line.slice(separatorIndex + 1).trim()
      detailMap.set(label, value)
    })

  return detailMap
}

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

const toCompanyProfile = (
  company: LabourCompanyRecord,
  categoryLabels: string[],
  activePlanLabel: string,
  activeJobCategoryLabels: string[],
  planWindow: { startDate: string; endDate: string }
): CompanyAppProfile => ({
  id: company.id,
  activePlanId: company.activePlan,
  companyName: company.companyName,
  contactPerson: company.contactPerson,
  email: company.email,
  mobile: company.mobile,
  contactMobile: company.contactMobile || company.mobile,
  businessType: company.businessType,
  industryCategory: company.industryCategory,
  gstNumber: company.gstNumber,
  companyAddress: company.companyAddress,
  state: company.state,
  pincode: company.pincode,
  city: company.city,
  area: company.area,
  status: company.status,
  activePlan: activePlanLabel,
  planValidFrom: planWindow.startDate,
  planValidUntil: planWindow.endDate,
  categoryLabels,
  activeJobCategoryLabels
})

export const loginCompanyApp = async (email: string, identity: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const normalizedEmail = normalizeEmail(email)
  const normalizedIdentity = normalizeName(identity)

  const company = resolveBestCompanyAppLoginMatch({
    companies: snapshot.companies,
    normalizedEmail,
    normalizedIdentity,
    plans: snapshot.plans,
    walletTransactions: snapshot.walletTransactions,
    jobs: snapshot.jobPosts
  })

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

  const company = resolveBestCompanyAppLoginMatch({
    companies: snapshot.companies,
    normalizedEmail,
    normalizedIdentity: normalizedFallbackIdentity,
    plans: snapshot.plans,
    walletTransactions: snapshot.walletTransactions,
    jobs: snapshot.jobPosts
  }) || (
    normalizedFallbackIdentity
      ? resolveBestCompanyAppLoginMatch({
          companies: snapshot.companies,
          normalizedEmail,
          plans: snapshot.plans,
          walletTransactions: snapshot.walletTransactions,
          jobs: snapshot.jobPosts
        })
      : null
  )

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
  const activePlanRecord = snapshot.plans.find(plan => plan.id === company.activePlan) || null
  const activePlanWindow = activePlanRecord
    ? resolveCompanyPlanWindow(company.id, activePlanRecord, snapshot.walletTransactions)
    : { startDate: '', endDate: '' }
  const hasPaidActivePlan = Boolean(activePlanRecord && activePlanWindow.startDate)
  const activePlanLabel = hasPaidActivePlan
    ? (snapshot.plans.find(plan => plan.id === company.activePlan)?.name || company.activePlan || 'Not assigned')
    : 'Not assigned'

  const companyJobPosts = snapshot.jobPosts
    .filter(jobPost => jobPost.companyId === companyId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const currentJobPostingPlan = resolveCompanyCurrentJobPostingPlan({
    companyId: company.id,
    activePlanId: company.activePlan,
    plans: snapshot.plans,
    walletTransactions: snapshot.walletTransactions,
    jobs: companyJobPosts.map(jobPost => ({
      id: jobPost.id,
      companyId: jobPost.companyId,
      description: jobPost.description,
      planId: jobPost.planId,
      status: jobPost.status,
      publishedAt: jobPost.publishedAt,
      expiresAt: jobPost.expiresAt,
      createdAt: jobPost.createdAt
    }))
  })
  const currentJobPostingPlans = resolveCompanyJobPostingPlans({
    companyId: company.id,
    activePlanId: company.activePlan,
    plans: snapshot.plans,
    walletTransactions: snapshot.walletTransactions,
    jobs: companyJobPosts.map(jobPost => ({
      id: jobPost.id,
      companyId: jobPost.companyId,
      description: jobPost.description,
      planId: jobPost.planId,
      status: jobPost.status,
      publishedAt: jobPost.publishedAt,
      expiresAt: jobPost.expiresAt,
      createdAt: jobPost.createdAt
    }))
  })

  const activeJobCategoryLabels = Array.from(
    new Set(
      companyJobPosts
        .filter(jobPost => jobPost.status === 'live')
        .map(jobPost => snapshot.categories.find(category => category.id === jobPost.categoryId)?.name || jobPost.categoryId)
        .filter(Boolean)
    )
  )

  const jobs = companyJobPosts.map(jobPost => {
    const detailMap = parseJobRequirementDetailMap(jobPost.description)
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
      companyId: jobPost.companyId,
      planId: jobPost.planId,
      title: jobPost.title,
      description: jobPost.description,
      city: jobPost.city,
      locationLabel: jobPost.locationLabel,
      categoryId: jobPost.categoryId,
      categoryLabel: snapshot.categories.find(category => category.id === jobPost.categoryId)?.name || jobPost.categoryId,
      status: jobPost.status,
      workersNeeded: jobPost.workersNeeded,
      wageAmount: jobPost.wageAmount,
      publishedAt: jobPost.publishedAt,
      expiresAt: jobPost.expiresAt,
      workerCategory: detailMap.get('worker category') || '',
      salaryType: detailMap.get('salary type') || '',
      shiftType: detailMap.get('shift type') || '',
      weeklyOff: detailMap.get('weekly off') || '',
      overtimeAvailable: detailMap.get('overtime available') || '',
      foodFacility: detailMap.get('food facility') || '',
      accommodation: detailMap.get('accommodation') || '',
      transportFacility: detailMap.get('transport facility') || '',
      jobDuration: detailMap.get('job duration') || '',
      requiredSkills: detailMap.get('required skills') || '',
      specialInstructions: detailMap.get('special instructions') || '',
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

  const billingHistory = buildCompanyBillingHistoryFromLedger({
    company,
    plans: snapshot.plans,
    walletTransactions: snapshot.walletTransactions
  })

  return {
    profile: toCompanyProfile(
      hasPaidActivePlan ? company : { ...company, activePlan: '' },
      categoryLabels,
      activePlanLabel,
      activeJobCategoryLabels,
      activePlanWindow
    ),
    currentJobPostingPlan,
    currentJobPostingPlans,
    stats: {
      liveJobPosts: jobs.filter(job => job.status === 'live').length,
      totalApplications: recentApplications.length ? jobs.reduce((sum, job) => sum + job.totalApplications, 0) : jobs.reduce((sum, job) => sum + job.totalApplications, 0),
      shortlistedApplications: jobs.reduce((sum, job) => sum + job.shortlistedCount, 0),
      hiredApplications: jobs.reduce((sum, job) => sum + job.hiredCount, 0)
    },
    jobs,
    recentApplications,
    billingHistory
  }
}

export const updateCompanyAppBillingProfile = async (
  companyId: string,
  payload: CompanyBillingProfileUpdatePayload
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const company = snapshot.companies.find(item => item.id === companyId)

  if (!company) {
    throw new Error('Company account not found.')
  }

  const updated = await updateLabourEntity('companies', company.id, {
    ...company,
    companyName: payload.companyName ?? company.companyName,
    gstNumber: payload.gstNumber ?? company.gstNumber,
    companyAddress: payload.companyAddress ?? company.companyAddress,
    city: payload.city ?? company.city,
    area: payload.area ?? company.area,
    state: payload.state ?? company.state,
    pincode: payload.pincode ?? company.pincode
  }, 'company-panel-billing')

  if (!updated) {
    throw new Error('Failed to update company billing profile.')
  }

  return getCompanyAppDashboard(companyId)
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

export const updateCompanyApplicationNote = async (
  companyId: string,
  applicationId: string,
  note: string
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const application = snapshot.jobApplications.find(item => item.id === applicationId && item.companyId === companyId)

  if (!application) {
    throw new Error('Job application not found for this company.')
  }

  const updated = await updateLabourEntity('jobApplications', applicationId, {
    ...application,
    note: note.trim(),
    updatedAt: new Date().toISOString()
  }, 'company-app')

  if (!updated) {
    throw new Error('Failed to update worker application note.')
  }

  return getCompanyAppDashboard(companyId)
}
