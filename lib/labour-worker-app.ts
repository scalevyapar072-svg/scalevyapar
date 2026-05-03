import { promises as fs } from 'fs'
import path from 'path'
import { jwtVerify, SignJWT } from 'jose'
import {
  createLabourEntity,
  createLabourEntity as createLabourRecord,
  deleteLabourEntity,
  getLabourMarketplaceSnapshot,
  LabourJobApplicationRecord,
  LabourCategoryRecord,
  LabourCompanyRecord,
  LabourJobPostRecord,
  LabourMarketplaceSnapshot,
  LabourPlanRecord,
  LabourRechargeRequestRecord,
  LabourSavedJobRecord,
  LabourWalletTransactionRecord,
  LabourWorkerRecord,
  LabourWorkerNotificationRecord,
  WorkerIdentityProofType,
  updateLabourEntity
} from './labour-marketplace'
import { getLabourAdminSettings } from './labour-admin-settings'
import { sendWorkerPushNotification } from './labour-worker-push'
import { sendCompanyApplicationEmail } from './labour-company-email'
import { supabaseAdmin } from './supabase-admin'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')
const OTP_DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-worker-auth.json')
const OTP_TABLE_NAME = 'labour_worker_auth_sessions'
const OTP_EXPIRY_MINUTES = 10
const DEV_OTP_CODE = process.env.LABOUR_WORKER_STATIC_OTP || '123456'
const ALLOW_STATELESS_DEMO_OTP = DEV_OTP_CODE.trim().length > 0
const WORKER_UPLOAD_BUCKET = 'labour-worker-files'

type WorkerAuthSession = {
  id: string
  mobile: string
  workerId: string
  otpCode: string
  expiresAt: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

type WorkerAuthStore = {
  sessions: WorkerAuthSession[]
}

export type WorkerAppTokenPayload = {
  workerId: string
  mobile: string
  role: 'WORKER_APP'
}

export type WorkerAppProfile = {
  id: string
  fullName: string
  mobile: string
  city: string
  profilePhotoPath: string
  categoryIds: string[]
  categoryLabels: string[]
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  walletBalance: number
  status: string
  isVisible: boolean
  identityProofType: WorkerIdentityProofType
  identityProofNumber: string
  identityProofPath: string
  isRegistrationComplete: boolean
  canAccessApp: boolean
  registrationCompletedAt: string
}

export type WorkerRegistrationPayload = {
  fullName: string
  city: string
  categoryIds: string[]
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  profilePhotoPath: string
  identityProofType: WorkerIdentityProofType
  identityProofNumber: string
  identityProofPath: string
}

export type WorkerAppWalletSummary = {
  balance: number
  dailyCharge: number
  registrationFee: number
  registrationFeePaid: boolean
  estimatedDaysRemaining: number
  visibilityRule: string
  lastDeductionAt: string | null
  transactions: LabourWalletTransactionRecord[]
}

export type WorkerAppActivationSummary = {
  isActive: boolean
  canViewCompanyDetails: boolean
  status: string
  headline: string
  description: string
  recommendedAction: string
}

export type WorkerAppFeedItem = {
  id: string
  title: string
  description: string
  city: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
  wageAmount: number
  workersNeeded: number
  categoryName: string
  companyLocked: boolean
  companyName: string
  companyCity: string
  contactPerson: string | null
  companyMobile: string | null
  publishedAt: string
  expiresAt: string
  matchReason: string
  hasApplied: boolean
  applicationStatus: string | null
  isSaved: boolean
  appliedAt: string | null
}

export type WorkerAppNotification = {
  id: string
  type: string
  title: string
  message: string
  relatedJobPostId: string | null
  relatedCompanyId: string | null
  isRead: boolean
  priority: string
  createdAt: string
}

export type WorkerAppDashboard = {
  profile: WorkerAppProfile
  wallet: WorkerAppWalletSummary
  activation: WorkerAppActivationSummary
  support: {
    showHeaderHelpButton: boolean
    title: string
    subtitle: string
    whatsappNumber: string
    chatbotUrl: string
    extraLabel: string
    extraUrl: string
    prefilledMessage: string
  }
  feed: WorkerAppFeedItem[]
  notifications: WorkerAppNotification[]
  unreadNotificationCount: number
  availableCategories: Array<{
    id: string
    name: string
    description: string
    imageUrl: string
    showOnHome: boolean
    homeOrder: number
  }>
  popularCitySuggestions: string[]
  workerPlan: {
    id: string
    name: string
    validityDays: number
    dailyCharge: number
    registrationFee: number
    walletCredit: number
  } | null
}

const ensureOtpFile = async () => {
  await fs.mkdir(path.dirname(OTP_DATA_FILE_PATH), { recursive: true })
  try {
    await fs.access(OTP_DATA_FILE_PATH)
  } catch {
    const initialState: WorkerAuthStore = { sessions: [] }
    await fs.writeFile(OTP_DATA_FILE_PATH, JSON.stringify(initialState, null, 2), 'utf8')
  }
}

const readJsonOtpStore = async (): Promise<WorkerAuthStore> => {
  await ensureOtpFile()
  const raw = await fs.readFile(OTP_DATA_FILE_PATH, 'utf8')
  const parsed = JSON.parse(raw) as Partial<WorkerAuthStore>
  return { sessions: parsed.sessions || [] }
}

const writeJsonOtpStore = async (store: WorkerAuthStore) => {
  await fs.writeFile(OTP_DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

const supportsStatelessDemoOtp = () => ALLOW_STATELESS_DEMO_OTP

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const getOtpStorageBackend = async (): Promise<'supabase' | 'json'> => {
  const { error } = await supabaseAdmin.from(OTP_TABLE_NAME).select('id').limit(1)
  return error && isMissingSupabaseTableError(error.message) ? 'json' : 'supabase'
}

const readOtpSessions = async (): Promise<{ sessions: WorkerAuthSession[]; storage: 'supabase' | 'json' }> => {
  const storage = await getOtpStorageBackend()
  if (storage === 'json') {
    const store = await readJsonOtpStore()
    return { sessions: store.sessions, storage }
  }

  const { data, error } = await supabaseAdmin
    .from(OTP_TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to read worker auth sessions: ${error.message}`)
  }

  return {
    storage,
    sessions: (data || []).map(row => ({
      id: row.id as string,
      mobile: row.mobile as string,
      workerId: row.worker_id as string,
      otpCode: row.otp_code as string,
      expiresAt: row.expires_at as string,
      isVerified: Boolean(row.is_verified),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }))
  }
}

const writeOtpSessions = async (sessions: WorkerAuthSession[], storage: 'supabase' | 'json') => {
  if (storage === 'json') {
    await writeJsonOtpStore({ sessions })
    return
  }

  const payload = sessions.map(session => ({
    id: session.id,
    mobile: session.mobile,
    worker_id: session.workerId,
    otp_code: session.otpCode,
    expires_at: session.expiresAt,
    is_verified: session.isVerified,
    created_at: session.createdAt,
    updated_at: session.updatedAt
  }))

  const { error: deleteError } = await supabaseAdmin.from(OTP_TABLE_NAME).delete().neq('id', '__never__')
  if (deleteError) {
    throw new Error(`Failed to reset worker auth sessions: ${deleteError.message}`)
  }

  if (payload.length === 0) {
    return
  }

  const { error } = await supabaseAdmin.from(OTP_TABLE_NAME).upsert(payload, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to save worker auth sessions: ${error.message}`)
  }
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const sanitizeMobile = (mobile: string) => mobile.replace(/\D/g, '').slice(-10)
const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const normalizeIdentityProofType = (value: unknown): WorkerIdentityProofType => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'aadhaar' || normalized === 'pan' || normalized === 'voter_id' || normalized === 'driving_license' || normalized === 'other') {
    return normalized
  }

  return ''
}

const isWorkerProfileComplete = (worker: LabourWorkerRecord) =>
  Boolean(worker.fullName.trim()) &&
  Boolean(worker.city.trim()) &&
  worker.categoryIds.length > 0

const isWorkerRegistrationComplete = (worker: LabourWorkerRecord) =>
  isWorkerProfileComplete(worker) &&
  Boolean(worker.profilePhotoPath.trim()) &&
  Boolean(worker.identityProofType) &&
  Boolean(worker.identityProofNumber.trim()) &&
  Boolean(worker.identityProofPath.trim())

const canWorkerAccessApp = (worker: LabourWorkerRecord) =>
  isWorkerRegistrationComplete(worker) ||
  Boolean(worker.registrationCompletedAt.trim()) ||
  worker.status !== 'pending'

const deriveWorkerStatus = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null = null,
  transactions: LabourWalletTransactionRecord[] = []
): LabourWorkerRecord['status'] => {
  if (worker.status === 'blocked' || worker.status === 'rejected') {
    return worker.status
  }

  if (!isWorkerRegistrationComplete(worker)) {
    return 'pending'
  }

  if (worker.status === 'pending') {
    return 'pending'
  }

  const outstandingRegistrationFee = getOutstandingWorkerRegistrationFee(worker, workerPlan, transactions)
  if (outstandingRegistrationFee > 0 && worker.walletBalance < outstandingRegistrationFee) {
    return 'inactive_wallet_empty'
  }

  if (worker.walletBalance <= 0) {
    return 'inactive_wallet_empty'
  }

  return 'active'
}

const ensureWorkerUploadBucket = async () => {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
  if (error) {
    throw new Error(`Failed to access worker upload storage: ${error.message}`)
  }

  if ((buckets || []).some(bucket => bucket.name === WORKER_UPLOAD_BUCKET)) {
    return
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(WORKER_UPLOAD_BUCKET, {
    public: false,
    fileSizeLimit: '10MB'
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(`Failed to create worker upload bucket: ${createError.message}`)
  }
}

const assertWorkerRegistrationPayload = (payload: WorkerRegistrationPayload) => {
  if (!payload.fullName.trim()) {
    throw new Error('Full name is required.')
  }
  if (!payload.city.trim()) {
    throw new Error('City is required.')
  }
  if (!payload.categoryIds.length) {
    throw new Error('Select at least one category.')
  }
  if (!payload.profilePhotoPath.trim()) {
    throw new Error('Profile photo upload is required.')
  }
  if (!payload.identityProofType) {
    throw new Error('Identity proof type is required.')
  }
  if (!payload.identityProofNumber.trim()) {
    throw new Error('Identity proof number is required.')
  }
  if (!payload.identityProofPath.trim()) {
    throw new Error('Identity proof upload is required.')
  }
}

const getWorkerPlan = (plans: LabourPlanRecord[]) =>
  plans.find(plan => plan.audience === 'worker' && plan.isActive) || null

const hasCompletedWorkerRegistrationFeeTransaction = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[]
) =>
  transactions.some(transaction =>
    transaction.entityType === 'worker' &&
    transaction.entityId === worker.id &&
    transaction.transactionType === 'registration_fee' &&
    transaction.status === 'completed'
  )

const isWorkerRegistrationFeeSettled = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[]
) => {
  if ((workerPlan?.registrationFee || 0) <= 0) {
    return true
  }

  return worker.registrationFeePaid || hasCompletedWorkerRegistrationFeeTransaction(worker, transactions)
}

const getOutstandingWorkerRegistrationFee = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[]
) => {
  const registrationFee = workerPlan?.registrationFee || 0
  if (registrationFee <= 0 || isWorkerRegistrationFeeSettled(worker, workerPlan, transactions)) {
    return 0
  }

  return registrationFee
}

const deriveActivationSummary = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[]
): WorkerAppActivationSummary => {
  const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)
  const outstandingRegistrationFee = getOutstandingWorkerRegistrationFee(worker, workerPlan, transactions)
  const rechargeGap = Math.max(outstandingRegistrationFee - worker.walletBalance, 0)

  if (effectiveStatus === 'blocked') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Account blocked',
      description: 'Your worker account is currently blocked by admin. Please contact support.',
      recommendedAction: 'Contact support'
    }
  }

  if (effectiveStatus === 'rejected') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Profile not approved',
      description: 'Your worker profile was rejected or needs correction before activation.',
      recommendedAction: 'Update profile and contact support'
    }
  }

  if (!isWorkerRegistrationComplete(worker)) {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Complete your registration',
      description: 'Upload your photo, identity proof, and work details so your worker account can be submitted for approval.',
      recommendedAction: 'Finish registration'
    }
  }

  if (effectiveStatus === 'pending') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Registration under review',
      description: 'Your worker account was submitted successfully and is waiting for admin verification.',
      recommendedAction: 'Wait for approval'
    }
  }

  if (effectiveStatus === 'inactive_wallet_empty') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: outstandingRegistrationFee > 0 ? 'Registration fee pending' : 'Recharge required',
      description: outstandingRegistrationFee > 0
        ? rechargeGap > 0
          ? `Add more wallet balance until it reaches at least Rs ${outstandingRegistrationFee}. Your one-time registration fee will be deducted first, then worker access can turn active.`
          : `Your one-time registration fee of Rs ${outstandingRegistrationFee} is waiting to be deducted from the wallet before worker access becomes active.`
        : 'Your wallet balance is empty. Company details stay locked until your worker access becomes active again.',
      recommendedAction: outstandingRegistrationFee > 0
        ? rechargeGap > 0
          ? `Recharge at least Rs ${rechargeGap}`
          : 'Wait for wallet fee deduction'
        : workerPlan ? `Recharge at least Rs ${workerPlan.planAmount}` : 'Recharge wallet'
    }
  }

  return {
    isActive: effectiveStatus === 'active',
    canViewCompanyDetails: effectiveStatus === 'active',
    status: effectiveStatus,
    headline: 'Worker access is active',
    description: workerPlan
      ? `Your one-time registration fee is settled. Daily deduction is Rs ${workerPlan.dailyCharge} and company details are unlocked.`
      : 'Your worker access is active and company details are unlocked.',
    recommendedAction: 'Apply to matching job posts'
  }
}

const toWorkerProfile = (worker: LabourWorkerRecord, categories: LabourCategoryRecord[]): WorkerAppProfile => ({
  id: worker.id,
  fullName: worker.fullName,
  mobile: worker.mobile,
  city: worker.city,
  profilePhotoPath: worker.profilePhotoPath,
  categoryIds: worker.categoryIds,
  categoryLabels: worker.categoryIds
    .map(categoryId => categories.find(category => category.id === categoryId)?.name)
    .filter((value): value is string => Boolean(value)),
  skills: worker.skills,
  experienceYears: worker.experienceYears,
  expectedDailyWage: worker.expectedDailyWage,
  availability: worker.availability,
  walletBalance: worker.walletBalance,
  status: worker.status,
  isVisible: worker.isVisible,
  identityProofType: worker.identityProofType,
  identityProofNumber: worker.identityProofNumber,
  identityProofPath: worker.identityProofPath,
  isRegistrationComplete: isWorkerRegistrationComplete(worker),
  canAccessApp: canWorkerAccessApp(worker),
  registrationCompletedAt: worker.registrationCompletedAt
})

const toWorkerWalletSummary = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[],
  workerPlan: LabourPlanRecord | null
): WorkerAppWalletSummary => {
  const dailyCharge = workerPlan?.dailyCharge || 0
  const registrationFee = workerPlan?.registrationFee || 0
  const registrationFeePaid = isWorkerRegistrationFeeSettled(worker, workerPlan, transactions)
  const outstandingRegistrationFee = registrationFeePaid ? 0 : registrationFee
  const lastDeduction = transactions.find(transaction => transaction.transactionType === 'wallet_deduction')

  return {
    balance: worker.walletBalance,
    dailyCharge,
    registrationFee,
    registrationFeePaid,
    estimatedDaysRemaining: dailyCharge > 0 ? Math.floor(worker.walletBalance / dailyCharge) : 0,
    visibilityRule: outstandingRegistrationFee > 0
      ? worker.walletBalance > 0
        ? `A one-time registration fee of Rs ${registrationFee} is pending. Recharge until the wallet reaches at least Rs ${registrationFee}, then daily charges will start as per your worker plan.`
        : `Add wallet balance to cover the one-time registration fee of Rs ${registrationFee}. After that, daily worker charges apply as per the active plan.`
      : dailyCharge > 0
        ? `One-time registration fee is already charged. Rs ${dailyCharge} is deducted every active day. Company details unlock only while your worker access is active.`
        : 'Worker daily deduction is not configured yet.',
    lastDeductionAt: lastDeduction?.createdAt || null,
    transactions
  }
}

const toWorkerNotification = (notification: LabourWorkerNotificationRecord): WorkerAppNotification => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  relatedJobPostId: notification.relatedJobPostId || null,
  relatedCompanyId: notification.relatedCompanyId || null,
  isRead: notification.isRead,
  priority: notification.priority,
  createdAt: notification.createdAt
})

const reconcileWorkerRegistrationFee = async (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[]
) => {
  if (!isWorkerRegistrationComplete(worker)) {
    return false
  }

  if (worker.status === 'blocked' || worker.status === 'rejected') {
    return false
  }

  const registrationFee = workerPlan?.registrationFee || 0
  const hasCompletedFeeTransaction = hasCompletedWorkerRegistrationFeeTransaction(worker, transactions)

  if (!worker.registrationFeePaid && (registrationFee <= 0 || hasCompletedFeeTransaction)) {
    const nextWorker: LabourWorkerRecord = {
      ...worker,
      registrationFeePaid: true
    }
    const nextStatus = deriveWorkerStatus(nextWorker, workerPlan, transactions)

    await updateLabourEntity('workers', worker.id, {
      registrationFeePaid: true,
      status: nextStatus,
      isVisible: isWorkerRegistrationComplete(nextWorker) && nextStatus === 'active'
    }, 'worker-wallet')

    return true
  }

  const outstandingRegistrationFee = getOutstandingWorkerRegistrationFee(worker, workerPlan, transactions)
  if (outstandingRegistrationFee <= 0 || worker.walletBalance < outstandingRegistrationFee) {
    const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)
    const shouldBeVisible = isWorkerRegistrationComplete(worker) && effectiveStatus === 'active'
    if (worker.status !== effectiveStatus || worker.isVisible !== shouldBeVisible) {
      await updateLabourEntity('workers', worker.id, {
        status: effectiveStatus,
        isVisible: shouldBeVisible
      }, 'worker-wallet')

      return true
    }

    return false
  }

  const nextWorker: LabourWorkerRecord = {
    ...worker,
    walletBalance: Math.max(0, worker.walletBalance - outstandingRegistrationFee),
    registrationFeePaid: true
  }
  const nextStatus = deriveWorkerStatus(nextWorker, workerPlan, transactions)

  await updateLabourEntity('workers', worker.id, {
    walletBalance: nextWorker.walletBalance,
    registrationFeePaid: true,
    status: nextStatus,
    isVisible: isWorkerRegistrationComplete(nextWorker) && nextStatus === 'active'
  }, 'worker-wallet')

  await createLabourEntity('walletTransactions', {
    entityType: 'worker',
    entityId: worker.id,
    entityName: worker.fullName || worker.mobile,
    city: worker.city,
    transactionType: 'registration_fee',
    amount: outstandingRegistrationFee,
    direction: 'debit',
    status: 'completed',
    reference: workerPlan?.id || worker.id,
    note: 'One-time worker registration fee deducted from wallet balance.'
  }, 'worker-wallet')

  return true
}

const buildWorkerFeed = (
  worker: LabourWorkerRecord,
  companies: LabourCompanyRecord[],
  jobPosts: LabourJobPostRecord[],
  categories: LabourCategoryRecord[],
  applications: LabourJobApplicationRecord[],
  savedJobs: LabourSavedJobRecord[],
  activation: WorkerAppActivationSummary
): WorkerAppFeedItem[] => {
  const matchingPosts = jobPosts
    .filter(jobPost => {
      if (jobPost.status !== 'live') {
        return false
      }
      const company = companies.find(item => item.id === jobPost.companyId)
      return company?.status === 'active'
    })
    .map(jobPost => {
      const company = companies.find(item => item.id === jobPost.companyId)
      const categoryName = categories.find(category => category.id === jobPost.categoryId)?.name || jobPost.categoryId
      const categoryMatch = worker.categoryIds.includes(jobPost.categoryId)
      const cityMatch = worker.city && jobPost.city && worker.city.toLowerCase() === jobPost.city.toLowerCase()
      const application = applications.find(item => item.jobPostId === jobPost.id)
      const savedJob = savedJobs.find(item => item.jobPostId === jobPost.id)
      const matchReason = categoryMatch
        ? cityMatch
          ? 'Strong match in your city and category'
          : 'Category match for your worker profile'
        : cityMatch
          ? 'Available in your city'
          : 'Open job from an active company'

      return {
        id: jobPost.id,
        title: jobPost.title,
        description: jobPost.description,
        city: jobPost.city,
        locationLabel: jobPost.locationLabel,
        latitude: jobPost.latitude,
        longitude: jobPost.longitude,
        wageAmount: jobPost.wageAmount,
        workersNeeded: jobPost.workersNeeded,
        categoryName,
        companyLocked: !activation.canViewCompanyDetails,
        companyName: activation.canViewCompanyDetails ? company?.companyName || 'Company not found' : 'Unlock company details after activation',
        companyCity: company?.city || '',
        contactPerson: activation.canViewCompanyDetails ? company?.contactPerson || null : null,
        companyMobile: activation.canViewCompanyDetails ? company?.mobile || null : null,
        publishedAt: jobPost.publishedAt,
        expiresAt: jobPost.expiresAt,
        matchReason,
        hasApplied: Boolean(application),
        applicationStatus: application?.status || null,
        isSaved: Boolean(savedJob),
        appliedAt: application?.appliedAt || null
      } satisfies WorkerAppFeedItem
    })

  return matchingPosts.sort((left, right) => {
    const applicationBoost = Number(right.hasApplied) - Number(left.hasApplied)
    if (applicationBoost !== 0) {
      return applicationBoost
    }

    const scoreMatch = (item: WorkerAppFeedItem) => {
      const normalized = item.matchReason.toLowerCase()
      if (normalized.includes('strong match')) {
        return 3
      }
      if (normalized.includes('category match')) {
        return 2
      }
      if (normalized.includes('your city')) {
        return 1
      }
      return 0
    }

    const matchBoost = scoreMatch(right) - scoreMatch(left)
    if (matchBoost !== 0) {
      return matchBoost
    }

    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
  })
}

export const createWorkerNotification = async (
  workerId: string,
  payload: Pick<LabourWorkerNotificationRecord, 'type' | 'title' | 'message' | 'priority'> & {
    relatedJobPostId?: string
    relatedCompanyId?: string
  },
  actor = 'worker-app'
) => {
  const notificationId = createId('notification')
  await createLabourEntity('workerNotifications', {
    id: notificationId,
    workerId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    priority: payload.priority,
    relatedJobPostId: payload.relatedJobPostId,
    relatedCompanyId: payload.relatedCompanyId,
    isRead: false
  }, actor)

  await sendWorkerPushNotification({
    workerId,
    title: payload.title,
    body: payload.message,
    priority: payload.priority,
    data: {
      type: payload.type,
      notificationId,
      relatedJobPostId: payload.relatedJobPostId,
      relatedCompanyId: payload.relatedCompanyId
    }
  }).catch(error => {
    console.error('Failed to deliver worker push notification', error)
  })
}

export const resendWorkerNotification = async (notificationId: string, actor = 'admin') => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const notification = snapshot.workerNotifications.find(record => record.id === notificationId)
  if (!notification) {
    throw new Error('Worker notification not found.')
  }

  const worker = findWorkerById(snapshot, notification.workerId)
  if (!worker) {
    throw new Error('Worker account not found for this notification.')
  }

  if (notification.isRead) {
    await updateLabourEntity('workerNotifications', notification.id, { isRead: false }, actor)
  }

  await sendWorkerPushNotification({
    workerId: notification.workerId,
    title: notification.title,
    body: notification.message,
    priority: notification.priority,
    data: {
      type: notification.type,
      notificationId: notification.id,
      relatedJobPostId: notification.relatedJobPostId,
      relatedCompanyId: notification.relatedCompanyId
    }
  }).catch(error => {
    console.error('Failed to re-deliver worker push notification', error)
  })
}

const findWorkerByMobile = (snapshot: LabourMarketplaceSnapshot, mobile: string) =>
  snapshot.workers.find(worker => sanitizeMobile(worker.mobile) === sanitizeMobile(mobile))

const findWorkerById = (snapshot: LabourMarketplaceSnapshot, workerId: string) =>
  snapshot.workers.find(worker => worker.id === workerId)

const ensureWorkerExists = async (mobile: string) => {
  const normalizedMobile = sanitizeMobile(mobile)
  const snapshot = await getLabourMarketplaceSnapshot()
  const existing = findWorkerByMobile(snapshot, normalizedMobile)
  if (existing) {
    return existing
  }

  const created = await createLabourRecord('workers', {
    fullName: '',
    mobile: normalizedMobile,
    city: '',
    profilePhotoPath: '',
      skills: [],
      experienceYears: 0,
      expectedDailyWage: 0,
      walletBalance: 0,
      registrationFeePaid: false,
      status: 'pending',
    availability: 'available_today',
    isVisible: false,
    categoryIds: [],
    identityProofType: '',
    identityProofNumber: '',
    identityProofPath: '',
    registrationCompletedAt: ''
  }, 'worker-app')

  const worker = findWorkerByMobile(created, normalizedMobile)
  if (!worker) {
    throw new Error('Failed to create worker profile for mobile number.')
  }

  return worker
}

export const generateWorkerAppToken = async (payload: WorkerAppTokenPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)

export const verifyWorkerAppToken = async (token: string): Promise<WorkerAppTokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== 'WORKER_APP') return null
    return {
      workerId: payload.workerId as string,
      mobile: payload.mobile as string,
      role: 'WORKER_APP'
    }
  } catch {
    return null
  }
}

export const getWorkerTokenFromRequest = (request: Request) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim()
}

export const requireWorkerApp = async (request: Request): Promise<WorkerAppTokenPayload> => {
  const token = getWorkerTokenFromRequest(request)
  if (!token) {
    throw new Error('Missing worker authorization token.')
  }

  const payload = await verifyWorkerAppToken(token)
  if (!payload) {
    throw new Error('Invalid worker authorization token.')
  }

  return payload
}

export const requestWorkerOtp = async (mobile: string) => {
  const normalizedMobile = sanitizeMobile(mobile)
  if (normalizedMobile.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number.')
  }

  const worker = await ensureWorkerExists(normalizedMobile)
  const { sessions, storage } = await readOtpSessions()
  const now = new Date()
  const nextSession: WorkerAuthSession = {
    id: createId('otp'),
    mobile: normalizedMobile,
    workerId: worker.id,
    otpCode: DEV_OTP_CODE,
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    isVerified: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  const filtered = sessions.filter(session => session.mobile !== normalizedMobile)
  filtered.unshift(nextSession)
  try {
    await writeOtpSessions(filtered, storage)
  } catch (error) {
    if (!supportsStatelessDemoOtp()) {
      throw error
    }
  }

  return {
    workerId: worker.id,
    mobile: normalizedMobile,
    expiresAt: nextSession.expiresAt,
    otpCode: DEV_OTP_CODE,
    message: 'OTP generated for worker login. Connect an SMS provider later for production delivery.'
  }
}

export const verifyWorkerOtpCode = async (mobile: string, otpCode: string) => {
  const normalizedMobile = sanitizeMobile(mobile)

  if (supportsStatelessDemoOtp() && String(otpCode).trim() === DEV_OTP_CODE) {
    const snapshot = await getLabourMarketplaceSnapshot()
    const worker = findWorkerByMobile(snapshot, normalizedMobile)
    if (!worker) {
      throw new Error('Worker account not found. Request OTP again.')
    }

    const token = await generateWorkerAppToken({
      workerId: worker.id,
      mobile: worker.mobile,
      role: 'WORKER_APP'
    })

    return {
      token,
      workerId: worker.id
    }
  }

  const { sessions, storage } = await readOtpSessions()
  const session = sessions.find(item => item.mobile === normalizedMobile)

  if (!session) {
    throw new Error('OTP session not found. Request OTP again.')
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new Error('OTP expired. Request a new OTP.')
  }

  if (session.otpCode !== String(otpCode).trim()) {
    throw new Error('Invalid OTP code.')
  }

  const updatedSessions = sessions.map(item => item.id === session.id ? { ...item, isVerified: true, updatedAt: new Date().toISOString() } : item)
  await writeOtpSessions(updatedSessions, storage)

  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, session.workerId)
  if (!worker) {
    throw new Error('Worker account not found after OTP verification.')
  }

  const token = await generateWorkerAppToken({
    workerId: worker.id,
    mobile: worker.mobile,
    role: 'WORKER_APP'
  })

  return {
    token,
    workerId: worker.id
  }
}

export const getWorkerAppDashboard = async (workerId: string): Promise<WorkerAppDashboard> => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const adminSettings = await getLabourAdminSettings()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const workerPlan = getWorkerPlan(snapshot.plans)
  const walletTransactions = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const didReconcileRegistrationFee = await reconcileWorkerRegistrationFee(worker, workerPlan, walletTransactions)
  if (didReconcileRegistrationFee) {
    return getWorkerAppDashboard(workerId)
  }

  const activation = deriveActivationSummary(worker, workerPlan, walletTransactions)
  const applications = snapshot.jobApplications
    .filter(application => application.workerId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const savedJobs = snapshot.savedJobs.filter(savedJob => savedJob.workerId === worker.id)
  const notifications = snapshot.workerNotifications
    .filter(notification => notification.workerId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return {
    profile: toWorkerProfile(worker, snapshot.categories),
    wallet: toWorkerWalletSummary(worker, walletTransactions, workerPlan),
    activation,
    support: {
      showHeaderHelpButton: adminSettings.settings.helpControls.showHeaderHelpButton,
      title: adminSettings.settings.helpControls.supportTitle,
      subtitle: adminSettings.settings.helpControls.supportSubtitle,
      whatsappNumber: adminSettings.settings.helpControls.supportWhatsappNumber,
      chatbotUrl: adminSettings.settings.helpControls.supportChatbotUrl,
      extraLabel: adminSettings.settings.helpControls.supportExtraLabel,
      extraUrl: adminSettings.settings.helpControls.supportExtraUrl,
      prefilledMessage: adminSettings.settings.helpControls.supportPrefilledMessage
    },
    feed: buildWorkerFeed(
      worker,
      snapshot.companies,
      snapshot.jobPosts,
      snapshot.categories,
      applications,
      savedJobs,
      activation
    ),
    notifications: notifications.map(toWorkerNotification),
    unreadNotificationCount: notifications.filter(notification => !notification.isRead).length,
    availableCategories: snapshot.categories
      .filter(category => category.isActive)
      .map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder
      })),
    popularCitySuggestions: adminSettings.settings.workerHomeControls.popularCitySuggestions,
    workerPlan: workerPlan ? {
      id: workerPlan.id,
      name: workerPlan.name,
      validityDays: workerPlan.validityDays,
      dailyCharge: workerPlan.dailyCharge,
      registrationFee: workerPlan.registrationFee,
      walletCredit: workerPlan.walletCredit
    } : null
  }
}

export const uploadWorkerRegistrationAsset = async (
  workerId: string,
  payload: {
    documentKind: 'profile_photo' | 'identity_proof'
    fileName: string
    contentType: string
    bytes: Buffer
  }
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  if (!payload.bytes.length) {
    throw new Error('Uploaded file is empty.')
  }

  const safeFileName = sanitizeFileName(payload.fileName || `${payload.documentKind}.bin`) || `${payload.documentKind}.bin`
  const extension = safeFileName.includes('.') ? safeFileName.split('.').pop() : 'bin'
  const storagePath = `workers/${workerId}/${payload.documentKind}-${Date.now()}.${extension}`

  await ensureWorkerUploadBucket()
  const { error } = await supabaseAdmin.storage.from(WORKER_UPLOAD_BUCKET).upload(storagePath, payload.bytes, {
    contentType: payload.contentType,
    upsert: true
  })

  if (error) {
    throw new Error(`Failed to upload worker document: ${error.message}`)
  }

  return {
    storagePath,
    bucket: WORKER_UPLOAD_BUCKET,
    fileName: safeFileName
  }
}

export const completeWorkerAppRegistration = async (
  workerId: string,
  payload: WorkerRegistrationPayload
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const existing = findWorkerById(snapshot, workerId)
  if (!existing) {
    throw new Error('Worker account not found.')
  }

  const nextWorker: LabourWorkerRecord = {
    ...existing,
    fullName: payload.fullName.trim(),
    city: payload.city.trim(),
    categoryIds: payload.categoryIds,
    skills: payload.skills,
    experienceYears: payload.experienceYears,
    expectedDailyWage: payload.expectedDailyWage,
    availability: payload.availability as LabourWorkerRecord['availability'],
    profilePhotoPath: payload.profilePhotoPath.trim(),
    identityProofType: normalizeIdentityProofType(payload.identityProofType),
    identityProofNumber: payload.identityProofNumber.trim(),
    identityProofPath: payload.identityProofPath.trim(),
    registrationCompletedAt: existing.registrationCompletedAt || new Date().toISOString()
  }

  assertWorkerRegistrationPayload({
    ...payload,
    identityProofType: nextWorker.identityProofType
  })

  const nextStatus = deriveWorkerStatus(
    nextWorker,
    getWorkerPlan(snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === workerId)
  )

  await updateLabourEntity('workers', workerId, {
    fullName: nextWorker.fullName,
    city: nextWorker.city,
    categoryIds: nextWorker.categoryIds,
    skills: nextWorker.skills,
    experienceYears: nextWorker.experienceYears,
    expectedDailyWage: nextWorker.expectedDailyWage,
    availability: nextWorker.availability,
    profilePhotoPath: nextWorker.profilePhotoPath,
    identityProofType: nextWorker.identityProofType,
      identityProofNumber: nextWorker.identityProofNumber,
      identityProofPath: nextWorker.identityProofPath,
      registrationCompletedAt: nextWorker.registrationCompletedAt,
      registrationFeePaid: existing.registrationFeePaid,
      isVisible: isWorkerRegistrationComplete(nextWorker) && nextStatus === 'active',
      status: nextStatus
  }, 'worker-app')

  return getWorkerAppDashboard(workerId)
}

export const updateWorkerAppProfile = async (
  workerId: string,
  payload: Partial<Pick<WorkerAppProfile, 'fullName' | 'city' | 'categoryIds' | 'skills' | 'experienceYears' | 'expectedDailyWage' | 'availability'>>
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const existing = findWorkerById(snapshot, workerId)
  if (!existing) {
    throw new Error('Worker account not found.')
  }

  const mergedWorker: LabourWorkerRecord = {
    ...existing,
    fullName: payload.fullName ?? existing.fullName,
    city: payload.city ?? existing.city,
    categoryIds: payload.categoryIds ?? existing.categoryIds,
    skills: payload.skills ?? existing.skills,
    experienceYears: payload.experienceYears ?? existing.experienceYears,
    expectedDailyWage: payload.expectedDailyWage ?? existing.expectedDailyWage,
    availability: (payload.availability ?? existing.availability) as LabourWorkerRecord['availability']
  }
  const nextStatus = deriveWorkerStatus(
    mergedWorker,
    getWorkerPlan(snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === workerId)
  )

  await updateLabourEntity('workers', workerId, {
    fullName: mergedWorker.fullName,
    city: mergedWorker.city,
    categoryIds: mergedWorker.categoryIds,
    skills: mergedWorker.skills,
    experienceYears: mergedWorker.experienceYears,
    expectedDailyWage: mergedWorker.expectedDailyWage,
    availability: mergedWorker.availability,
    isVisible: isWorkerRegistrationComplete(mergedWorker) && nextStatus === 'active',
    status: nextStatus
  }, 'worker-app')

  return getWorkerAppDashboard(workerId)
}

export const createWorkerRechargeRequest = async (workerId: string, note?: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const categoryLabel = worker.categoryIds
    .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name)
    .filter((value): value is string => Boolean(value))
    .join(', ')

  await createLabourEntity('rechargeRequests', {
    requestType: 'worker_recharge',
    relatedEntityType: 'worker',
    relatedEntityId: worker.id,
    name: worker.fullName || worker.mobile,
    city: worker.city,
    categoryLabel,
    statusLabel: worker.status,
    suggestedAmount: getWorkerPlan(snapshot.plans)?.planAmount || 50,
    priority: worker.walletBalance <= 0 ? 'high' : 'medium',
    requestStatus: 'open',
    note: note || 'Recharge requested from worker app.'
  }, 'worker-app')

  return getWorkerAppDashboard(workerId)
}

export const createWorkerHelpRequest = async (workerId: string, note?: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const categoryLabel = worker.categoryIds
    .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name)
    .filter((value): value is string => Boolean(value))
    .join(', ')

  await createLabourEntity('rechargeRequests', {
    requestType: 'worker_support',
    relatedEntityType: 'worker',
    relatedEntityId: worker.id,
    name: `${worker.fullName || worker.mobile} help request`,
    city: worker.city,
    categoryLabel,
    statusLabel: worker.status,
    suggestedAmount: 0,
    priority: 'medium',
    requestStatus: 'open',
    note: note?.trim() || 'Worker asked for support from the Rozgar app.'
  }, 'worker-app')

  return getWorkerAppDashboard(workerId)
}

export const applyToWorkerJob = async (workerId: string, jobPostId: string, note?: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const jobPost = snapshot.jobPosts.find(job => job.id === jobPostId && job.status === 'live')
  if (!jobPost) {
    throw new Error('Job post not found or no longer live.')
  }

  const company = snapshot.companies.find(item => item.id === jobPost.companyId)
  if (!company || company.status !== 'active') {
    throw new Error('This job is not available from an active company anymore.')
  }

  const activation = deriveActivationSummary(
    worker,
    getWorkerPlan(snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
  )
  if (!activation.canViewCompanyDetails) {
    throw new Error('Recharge and keep your worker access active before applying to jobs.')
  }

  const existingApplication = snapshot.jobApplications.find(
    application => application.workerId === workerId && application.jobPostId === jobPostId
  )

  if (existingApplication) {
    return getWorkerAppDashboard(workerId)
  }

  await createLabourEntity('jobApplications', {
    workerId,
    jobPostId,
    companyId: jobPost.companyId,
    status: 'submitted',
    note: note || '',
    appliedAt: new Date().toISOString()
  }, 'worker-app')

  await createWorkerNotification(workerId, {
    type: 'application_submitted',
    title: 'Application sent',
    message: `You applied for ${jobPost.title}${company ? ` at ${company.companyName}` : ''}.`,
    priority: 'medium',
    relatedJobPostId: jobPost.id,
    relatedCompanyId: company?.id
  })

  try {
    await sendCompanyApplicationEmail({
      companyEmail: company.email,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      workerName: worker.fullName,
      workerCity: worker.city,
      workerMobile: worker.mobile,
      workerCategories: worker.categoryIds
        .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name)
        .filter((value): value is string => Boolean(value)),
      expectedDailyWage: worker.expectedDailyWage,
      note: note || '',
      jobTitle: jobPost.title,
      jobCity: jobPost.city,
      appliedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to send company application email', error)
  }

  return getWorkerAppDashboard(workerId)
}

export const toggleWorkerSavedJob = async (workerId: string, jobPostId: string) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const jobPost = snapshot.jobPosts.find(job => job.id === jobPostId)
  if (!jobPost) {
    throw new Error('Job post not found.')
  }

  const existing = snapshot.savedJobs.find(savedJob => savedJob.workerId === workerId && savedJob.jobPostId === jobPostId)

  if (existing) {
    await deleteLabourEntity('savedJobs', existing.id, 'worker-app')
    return getWorkerAppDashboard(workerId)
  }

  await createLabourEntity('savedJobs', {
    workerId,
    jobPostId
  }, 'worker-app')

  await createWorkerNotification(workerId, {
    type: 'job_saved',
    title: 'Job saved',
    message: `${jobPost.title} was added to your shortlist for quick follow-up.`,
    priority: 'low',
    relatedJobPostId: jobPost.id,
    relatedCompanyId: jobPost.companyId
  })

  return getWorkerAppDashboard(workerId)
}

export const markWorkerNotificationsRead = async (workerId: string, notificationIds?: string[]) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const targetIds = new Set(notificationIds && notificationIds.length > 0
    ? notificationIds
    : snapshot.workerNotifications
        .filter(notification => notification.workerId === workerId && !notification.isRead)
        .map(notification => notification.id))

  for (const notification of snapshot.workerNotifications) {
    if (notification.workerId === workerId && targetIds.has(notification.id) && !notification.isRead) {
      await updateLabourEntity('workerNotifications', notification.id, { isRead: true }, 'worker-app')
    }
  }

  return getWorkerAppDashboard(workerId)
}
