import { promises as fs } from 'fs'
import path from 'path'
import { jwtVerify, SignJWT } from 'jose'
import {
  createLabourEntity,
  createLabourEntity as createLabourRecord,
  getLabourMarketplaceSnapshot,
  LabourCategoryRecord,
  LabourCompanyRecord,
  LabourJobPostRecord,
  LabourMarketplaceSnapshot,
  LabourPlanRecord,
  LabourRechargeRequestRecord,
  LabourWalletTransactionRecord,
  LabourWorkerRecord,
  updateLabourEntity
} from './labour-marketplace'
import { supabaseAdmin } from './supabase-admin'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')
const OTP_DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-worker-auth.json')
const OTP_TABLE_NAME = 'labour_worker_auth_sessions'
const OTP_EXPIRY_MINUTES = 10
const DEV_OTP_CODE = process.env.LABOUR_WORKER_STATIC_OTP || '123456'
const ALLOW_STATELESS_DEMO_OTP = DEV_OTP_CODE.trim().length > 0

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
  categoryIds: string[]
  categoryLabels: string[]
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  walletBalance: number
  status: string
  isVisible: boolean
}

export type WorkerAppWalletSummary = {
  balance: number
  dailyCharge: number
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
}

export type WorkerAppDashboard = {
  profile: WorkerAppProfile
  wallet: WorkerAppWalletSummary
  activation: WorkerAppActivationSummary
  feed: WorkerAppFeedItem[]
  availableCategories: Array<{
    id: string
    name: string
  }>
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

const isWorkerProfileComplete = (worker: LabourWorkerRecord) =>
  Boolean(worker.fullName.trim()) &&
  Boolean(worker.city.trim()) &&
  worker.categoryIds.length > 0

const getWorkerPlan = (plans: LabourPlanRecord[]) =>
  plans.find(plan => plan.audience === 'worker' && plan.isActive) || null

const deriveActivationSummary = (worker: LabourWorkerRecord, workerPlan: LabourPlanRecord | null): WorkerAppActivationSummary => {
  if (worker.status === 'blocked') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: worker.status,
      headline: 'Account blocked',
      description: 'Your worker account is currently blocked by admin. Please contact support.',
      recommendedAction: 'Contact support'
    }
  }

  if (worker.status === 'rejected') {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: worker.status,
      headline: 'Profile not approved',
      description: 'Your worker profile was rejected or needs correction before activation.',
      recommendedAction: 'Update profile and contact support'
    }
  }

  if (!isWorkerProfileComplete(worker)) {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: worker.status,
      headline: 'Complete your profile',
      description: 'Add name, city and category so companies can match your work profile properly.',
      recommendedAction: 'Complete profile'
    }
  }

  if (worker.walletBalance <= 0) {
    return {
      isActive: false,
      canViewCompanyDetails: false,
      status: worker.status,
      headline: 'Recharge required',
      description: 'Your wallet balance is empty. Company details stay locked until your worker access becomes active again.',
      recommendedAction: workerPlan ? `Recharge at least Rs ${workerPlan.planAmount}` : 'Recharge wallet'
    }
  }

  return {
    isActive: worker.status === 'active',
    canViewCompanyDetails: worker.status === 'active',
    status: worker.status,
    headline: 'Worker access is active',
    description: workerPlan
      ? `Your wallet is active. Daily deduction is Rs ${workerPlan.dailyCharge} and company details are unlocked.`
      : 'Your worker access is active and company details are unlocked.',
    recommendedAction: 'Apply to matching job posts'
  }
}

const toWorkerProfile = (worker: LabourWorkerRecord, categories: LabourCategoryRecord[]): WorkerAppProfile => ({
  id: worker.id,
  fullName: worker.fullName,
  mobile: worker.mobile,
  city: worker.city,
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
  isVisible: worker.isVisible
})

const toWorkerWalletSummary = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[],
  workerPlan: LabourPlanRecord | null
): WorkerAppWalletSummary => {
  const dailyCharge = workerPlan?.dailyCharge || 0
  const lastDeduction = transactions.find(transaction => transaction.transactionType === 'wallet_deduction')

  return {
    balance: worker.walletBalance,
    dailyCharge,
    estimatedDaysRemaining: dailyCharge > 0 ? Math.floor(worker.walletBalance / dailyCharge) : 0,
    visibilityRule: dailyCharge > 0
      ? `Rs ${dailyCharge} is deducted every active day. Company details unlock only while your worker access is active.`
      : 'Worker daily deduction is not configured yet.',
    lastDeductionAt: lastDeduction?.createdAt || null,
    transactions
  }
}

const buildWorkerFeed = (
  worker: LabourWorkerRecord,
  companies: LabourCompanyRecord[],
  jobPosts: LabourJobPostRecord[],
  categories: LabourCategoryRecord[],
  activation: WorkerAppActivationSummary
): WorkerAppFeedItem[] => {
  const matchingPosts = jobPosts
    .filter(jobPost => jobPost.status === 'live' && worker.categoryIds.includes(jobPost.categoryId))
    .map(jobPost => {
      const company = companies.find(item => item.id === jobPost.companyId)
      const categoryName = categories.find(category => category.id === jobPost.categoryId)?.name || jobPost.categoryId
      const cityMatch = worker.city && jobPost.city && worker.city.toLowerCase() === jobPost.city.toLowerCase()

      return {
        id: jobPost.id,
        title: jobPost.title,
        description: jobPost.description,
        city: jobPost.city,
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
        matchReason: cityMatch ? 'Strong match in your city and category' : 'Category match for your worker profile'
      } satisfies WorkerAppFeedItem
    })

  return matchingPosts.sort((left, right) => {
    const leftCity = left.city.toLowerCase() === worker.city.toLowerCase() ? 1 : 0
    const rightCity = right.city.toLowerCase() === worker.city.toLowerCase() ? 1 : 0
    return rightCity - leftCity
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
    skills: [],
    experienceYears: 0,
    expectedDailyWage: 0,
    walletBalance: 0,
    status: 'pending',
    availability: 'available_today',
    isVisible: false,
    categoryIds: []
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
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const workerPlan = getWorkerPlan(snapshot.plans)
  const activation = deriveActivationSummary(worker, workerPlan)
  const walletTransactions = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return {
    profile: toWorkerProfile(worker, snapshot.categories),
    wallet: toWorkerWalletSummary(worker, walletTransactions, workerPlan),
    activation,
    feed: buildWorkerFeed(worker, snapshot.companies, snapshot.jobPosts, snapshot.categories, activation),
    availableCategories: snapshot.categories
      .filter(category => category.isActive)
      .map(category => ({ id: category.id, name: category.name })),
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

export const updateWorkerAppProfile = async (
  workerId: string,
  payload: Partial<Pick<WorkerAppProfile, 'fullName' | 'city' | 'categoryIds' | 'skills' | 'experienceYears' | 'expectedDailyWage' | 'availability'>>
) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const existing = findWorkerById(snapshot, workerId)
  if (!existing) {
    throw new Error('Worker account not found.')
  }

  const nextStatus =
    existing.status === 'blocked' || existing.status === 'rejected'
      ? existing.status
      : existing.walletBalance <= 0
        ? 'inactive_wallet_empty'
        : 'active'

  await updateLabourEntity('workers', workerId, {
    fullName: payload.fullName ?? existing.fullName,
    city: payload.city ?? existing.city,
    categoryIds: payload.categoryIds ?? existing.categoryIds,
    skills: payload.skills ?? existing.skills,
    experienceYears: payload.experienceYears ?? existing.experienceYears,
    expectedDailyWage: payload.expectedDailyWage ?? existing.expectedDailyWage,
    availability: payload.availability ?? existing.availability,
    isVisible: isWorkerProfileComplete({
      ...existing,
      fullName: payload.fullName ?? existing.fullName,
      city: payload.city ?? existing.city,
      categoryIds: payload.categoryIds ?? existing.categoryIds
    }) && nextStatus === 'active',
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
