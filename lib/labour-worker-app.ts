import { createHash, randomInt } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { EncryptJWT, jwtDecrypt, jwtVerify, SignJWT } from 'jose'
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
  isJobPostLiveRecord,
  isWorkerPlanExpiredRecord,
  WorkerIdentityProofType,
  updateLabourEntity
} from './labour-marketplace'
import { getLabourAdminSettings } from './labour-admin-settings'
import { buildSelectableLabourCityOptions, LabourMasterOption, LabourMasterKey, slugifyLabourMaster } from './labour-masters-schema'
import { sendWorkerPushNotification } from './labour-worker-push'
import { sendCompanyApplicationEmail } from './labour-company-email'
import {
  isWhatsappTemplateTranslationMissingError,
  sendWhatsappTemplateMessage,
  sendWhatsappTextMessage
} from './labour-whatsapp'
import { supabaseAdmin } from './supabase-admin'
import { sendTwoFactorOtp } from './two-factor'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')
const OTP_SESSION_ENCRYPTION_KEY = createHash('sha256')
  .update(process.env.JWT_SECRET || 'scalevyapar-secret-key-2024')
  .digest()
const OTP_DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-worker-auth.json')
const OTP_TABLE_NAME = 'labour_worker_auth_sessions'
const OTP_EXPIRY_MINUTES = 10
const OTP_RESEND_COOLDOWN_SECONDS = 60
const MAX_OTP_VERIFY_ATTEMPTS = 5
const OTP_LENGTH = 6
const OTP_PROVIDER = (process.env.OTP_PROVIDER || '').trim().toLowerCase()
const DEV_OTP_CODE = (process.env.LABOUR_WORKER_STATIC_OTP || '').trim()
const ALLOW_STATELESS_DEMO_OTP = process.env.NODE_ENV !== 'production' && DEV_OTP_CODE.length > 0
const WORKER_UPLOAD_BUCKET = 'labour-worker-files'
const LABOUR_ADMIN_SETTINGS_TABLE = 'labour_admin_settings'

type LabourMasterDataPayload = {
  options?: unknown[]
  industryBusinessDependencies?: unknown[]
  categoryDependencies?: unknown[]
}

type WorkerAppMasterData = {
  availableIndustryCategories: WorkerAppMasterOption[]
  availableBusinessTypes: WorkerAppMasterOption[]
  availableWorkerSalaryTypes: WorkerAppMasterOption[]
  industryBusinessDependencies: WorkerAppIndustryBusinessDependency[]
  categoryDependencies: WorkerAppCategoryDependency[]
  availableCities: string[]
  hasConfiguredCityOptions: boolean
  cityCoordinateLookup: Map<string, WorkerAppCityCoordinate>
}

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

type StoredWorkerOtpState = {
  code: string
  failedAttempts: number
  provider: 'legacy' | 'local-demo' | '2factor'
  providerSessionId?: string
}

type WorkerOtpSessionTokenPayload = {
  role: 'WORKER_OTP_SESSION'
  mobile: string
  workerId: string
  otpCode: string
  failedAttempts: number
  provider: 'legacy' | 'local-demo' | '2factor'
  providerSessionId?: string
  expiresAt: string
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
  homeCity: string
  address: string
  salaryType: string
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
  isPausedByWorker: boolean
  pausedAt: string | null
  reactivatedAt: string | null
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
  homeCity: string
  address: string
  salaryType: string
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
  isPausedByWorker: boolean
  pausedAt: string | null
  reactivatedAt: string | null
  lastDeductionAt: string | null
  nextDeductionAt: string | null
  transactions: LabourWalletTransactionRecord[]
}

export type WorkerAppActivationSummary = {
  isActive: boolean
  isPausedByWorker: boolean
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
  coordinateSource?: 'job' | 'city_master' | 'none' | null
}

type WorkerAppCityCoordinate = {
  latitude: number | null
  longitude: number | null
  sourceCityId: string
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

export type WorkerAppMasterOption = {
  id: string
  label: string
  value: string
  slug: string
}

export type WorkerAppIndustryBusinessDependency = {
  id: string
  industryCategory: WorkerAppMasterOption
  businessType: WorkerAppMasterOption
}

export type WorkerAppCategoryDependency = {
  id: string
  industryCategory: WorkerAppMasterOption
  businessType: WorkerAppMasterOption | null
  categoryId: string
  categoryName: string
  categorySlug: string
}

export type WorkerApplicationDeliveryDebugItem = {
  recipient: 'company' | 'worker'
  channel: 'whatsapp'
  status: 'accepted' | 'skipped' | 'failed'
  reason: string
  messageId?: string
  messageStatus?: string
  recipientWaId?: string
}

export type WorkerJobApplyResult = {
  dashboard: WorkerAppDashboard
  deliveryDebug: WorkerApplicationDeliveryDebugItem[]
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
  availableIndustryCategories: WorkerAppMasterOption[]
  availableBusinessTypes: WorkerAppMasterOption[]
  availableWorkerSalaryTypes: WorkerAppMasterOption[]
  industryBusinessDependencies: WorkerAppIndustryBusinessDependency[]
  categoryDependencies: WorkerAppCategoryDependency[]
  availableCities: string[]
  popularCitySuggestions: string[]
  workerPlan: {
    id: string
    name: string
    validityDays: number
    planValidityDays: number
    planStartDate: string | null
    planEndDate: string | null
    dailyCharge: number
    registrationFee: number
    registrationFeePaid: boolean
    walletCredit: number
    lockedReason: string | null
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

const isTwoFactorOtpProvider = () => OTP_PROVIDER === '2factor'

const generateWorkerOtpCode = () =>
  String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')

const buildWorkerOtpExpiry = () =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

const parseStoredWorkerOtpState = (value: string): StoredWorkerOtpState => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return {
      code: '',
      failedAttempts: 0,
      provider: 'legacy'
    }
  }

  try {
    const parsed = JSON.parse(normalized) as Partial<StoredWorkerOtpState>
    if (parsed && typeof parsed.code === 'string') {
      return {
        code: parsed.code.trim(),
        failedAttempts: Number.isFinite(parsed.failedAttempts)
          ? Math.max(0, Number(parsed.failedAttempts))
          : 0,
        provider: parsed.provider === '2factor' || parsed.provider === 'local-demo'
          ? parsed.provider
          : 'legacy',
        providerSessionId: typeof parsed.providerSessionId === 'string'
          ? parsed.providerSessionId
          : undefined
      }
    }
  } catch {
    // Fall back to the legacy plain-string OTP format.
  }

  return {
    code: normalized,
    failedAttempts: 0,
    provider: 'legacy'
  }
}

const stringifyStoredWorkerOtpState = (state: StoredWorkerOtpState) =>
  JSON.stringify(state)

const generateWorkerOtpSessionToken = async (
  session: WorkerAuthSession,
  state: StoredWorkerOtpState
) =>
  new EncryptJWT({
    role: 'WORKER_OTP_SESSION',
    mobile: session.mobile,
    workerId: session.workerId,
    otpCode: state.code,
    failedAttempts: state.failedAttempts,
    provider: state.provider,
    providerSessionId: state.providerSessionId,
    expiresAt: session.expiresAt
  } satisfies WorkerOtpSessionTokenPayload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(new Date(session.expiresAt))
    .encrypt(OTP_SESSION_ENCRYPTION_KEY)

const verifyWorkerOtpSessionToken = async (token: string): Promise<WorkerOtpSessionTokenPayload | null> => {
  try {
    const { payload } = await jwtDecrypt(token, OTP_SESSION_ENCRYPTION_KEY)
    if (payload.role !== 'WORKER_OTP_SESSION') {
      return null
    }

    const mobile = typeof payload.mobile === 'string' ? payload.mobile.trim() : ''
    const workerId = typeof payload.workerId === 'string' ? payload.workerId.trim() : ''
    const otpCode = typeof payload.otpCode === 'string' ? payload.otpCode.trim() : ''
    const expiresAt = typeof payload.expiresAt === 'string' ? payload.expiresAt.trim() : ''
    const provider = payload.provider === '2factor' || payload.provider === 'local-demo'
      ? payload.provider
      : 'legacy'

    if (!mobile || !workerId || !otpCode || !expiresAt) {
      return null
    }

    return {
      role: 'WORKER_OTP_SESSION',
      mobile,
      workerId,
      otpCode,
      failedAttempts: Number.isFinite(payload.failedAttempts)
        ? Math.max(0, Number(payload.failedAttempts))
        : 0,
      provider,
      providerSessionId: typeof payload.providerSessionId === 'string'
        ? payload.providerSessionId
        : undefined,
      expiresAt
    }
  } catch {
    return null
  }
}

const toStringValue = (value: unknown) => String(value || '').trim()

const normalizeFilterValue = (value: unknown) =>
  toStringValue(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')

const normalizeComparableKey = (value: unknown) =>
  normalizeFilterValue(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const DEFAULT_WORKER_SALARY_TYPE = 'Daily Wage'
const DEFAULT_WORKER_SALARY_TYPE_LABELS = [
  'Daily Wage',
  'Monthly Salary',
  'Weekly',
  'Per Piece',
  'Contract',
  'Hourly'
]

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null

const parseCoordinateValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const normalized = toStringValue(value)
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const readCoordinateFromKeys = (
  record: Record<string, unknown> | null,
  keys: string[]
): number | null => {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const parsed = parseCoordinateValue(record[key])
    if (parsed !== null) {
      return parsed
    }
  }
  return null
}

const hasUsableCoordinatePair = (latitude: number | null, longitude: number | null) => {
  if (latitude === null || longitude === null) {
    return false
  }

  if (latitude === 0 && longitude === 0) {
    return false
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
}

const uniqueStrings = (values: Array<unknown>) => {
  const seen = new Map<string, string>()
  for (const value of values) {
    const label = toStringValue(value)
    const key = normalizeComparableKey(label)
    if (!label || !key || seen.has(key)) {
      continue
    }
    seen.set(key, label)
  }
  return Array.from(seen.values()).sort((left, right) => left.localeCompare(right, 'en-IN'))
}

const matchesComparable = (selected: string, ...candidates: Array<unknown>) => {
  const normalizedSelected = normalizeComparableKey(selected)
  if (!normalizedSelected) {
    return false
  }
  return candidates.some(candidate => normalizeComparableKey(candidate) === normalizedSelected)
}

const toWorkerAppMasterOption = (value: unknown): WorkerAppMasterOption | null => {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const label = toStringValue(record.label || record.name || record.value)
  const optionValue = toStringValue(record.value || record.label || record.slug)
  const id = toStringValue(record.id || optionValue || label)
  const slug = toStringValue(record.slug || optionValue || label)
  if (!id || !label || !optionValue) {
    return null
  }

  return {
    id,
    label,
    value: optionValue,
    slug
  }
}

const toLabourMasterOption = (value: unknown): LabourMasterOption | null => {
  const record = asRecord(value)
  if (!record) return null

  const masterKey = toStringValue(record.masterKey) as LabourMasterKey
  const label = toStringValue(record.label || record.name || record.value)
  const optionValue = toStringValue(record.value || record.label || record.slug || record.name)
  const id = toStringValue(record.id || optionValue || label)
  const slug = toStringValue(record.slug || slugifyLabourMaster(optionValue || label))
  if (!id || !label || !optionValue || !masterKey) return null

  return {
    id,
    masterKey,
    label,
    value: optionValue,
    slug: slug || slugifyLabourMaster(optionValue || label) || id,
    description: toStringValue(record.description),
    stateOptionId: toStringValue(record.stateOptionId),
    isActive: record.isActive !== false,
    sortOrder: Number(record.sortOrder || 0),
    createdAt: toStringValue(record.createdAt) || new Date(0).toISOString(),
    updatedAt: toStringValue(record.updatedAt) || new Date(0).toISOString()
  }
}

const buildWorkerSalaryTypeOption = (label: string): WorkerAppMasterOption => {
  const normalizedLabel = toStringValue(label) || DEFAULT_WORKER_SALARY_TYPE
  const normalizedKey = normalizeComparableKey(normalizedLabel) || 'daily_wage'
  return {
    id: `worker-salary-type-${normalizedKey}`,
    label: normalizedLabel,
    value: normalizedLabel,
    slug: normalizedKey
  }
}

const resolveWorkerSalaryType = (value: unknown) =>
  toStringValue(value) || DEFAULT_WORKER_SALARY_TYPE

const buildMasterOptionLookup = (options: WorkerAppMasterOption[]) => {
  const lookup = new Map<string, WorkerAppMasterOption>()
  for (const option of options) {
    const keys = [option.id, option.value, option.label, option.slug]
      .map(normalizeComparableKey)
      .filter(Boolean)
    for (const key of keys) {
      lookup.set(key, option)
    }
  }
  return lookup
}

const resolveMasterOption = (
  lookup: Map<string, WorkerAppMasterOption>,
  value: unknown
): WorkerAppMasterOption | null => {
  const record = asRecord(value)
  if (record) {
    const direct = toWorkerAppMasterOption(record)
    if (direct) {
      const resolved = [direct.id, direct.value, direct.label, direct.slug]
        .map(item => lookup.get(normalizeComparableKey(item)))
        .find(Boolean)
      return resolved || direct
    }
  }

  const key = normalizeComparableKey(value)
  return key ? lookup.get(key) || null : null
}

const readLabourMasterData = async (
  categories: LabourCategoryRecord[],
  popularCitySuggestions: string[]
): Promise<WorkerAppMasterData> => {
  const { data, error } = await supabaseAdmin
    .from(LABOUR_ADMIN_SETTINGS_TABLE)
    .select('id, settings_json')
    .eq('id', 'labour-master-data')
    .maybeSingle()

  if (error && !isMissingSupabaseTableError(error.message)) {
    throw new Error(`Failed to load labour master data: ${error.message}`)
  }

  const masterData = ((data?.settings_json || {}) as LabourMasterDataPayload)
  const rawOptions = (masterData.options as unknown[]) || []
  const options = rawOptions
    .map(item => toWorkerAppMasterOption(item))
    .filter((item): item is WorkerAppMasterOption => Boolean(item))

  const activeOptions = options.filter(option => {
    const raw = rawOptions.find(item =>
      matchesComparable(
        option.id,
        asRecord(item)?.id,
        asRecord(item)?.value,
        asRecord(item)?.label,
        asRecord(item)?.slug
      )
    )
    return asRecord(raw)?.isActive !== false
  })

  const activeStateKeys = new Set(
    rawOptions
      .filter(item =>
        normalizeComparableKey(asRecord(item)?.masterKey) === 'state' &&
        asRecord(item)?.isActive !== false
      )
      .flatMap(item => {
        const raw = asRecord(item)
        return [raw?.id, raw?.value, raw?.label, raw?.slug]
          .map(normalizeComparableKey)
          .filter(Boolean)
      })
  )
  const hasConfiguredCityOptions = rawOptions.some(
    item => normalizeComparableKey(asRecord(item)?.masterKey) === 'city'
  )
  const normalizedMasterOptions = rawOptions
    .map(item => toLabourMasterOption(item))
    .filter((item): item is LabourMasterOption => Boolean(item))
  const selectableCityOptions = buildSelectableLabourCityOptions(normalizedMasterOptions)
  const selectableCityKeys = new Set(
    selectableCityOptions.activeCitiesWithActiveState.flatMap(option =>
      [option.id, option.value, option.label, option.slug].map(normalizeComparableKey).filter(Boolean)
    )
  )

  const optionLookup = buildMasterOptionLookup(activeOptions)
  const industryOptions = activeOptions.filter(option => {
    const raw = rawOptions.find(item =>
      matchesComparable(
        option.id,
        asRecord(item)?.id,
        asRecord(item)?.value,
        asRecord(item)?.label,
        asRecord(item)?.slug
      )
    )
    return normalizeComparableKey(asRecord(raw)?.masterKey) === 'industry_category'
  })

  const businessOptions = activeOptions.filter(option => {
    const raw = rawOptions.find(item =>
      matchesComparable(
        option.id,
        asRecord(item)?.id,
        asRecord(item)?.value,
        asRecord(item)?.label,
        asRecord(item)?.slug
      )
    )
    return normalizeComparableKey(asRecord(raw)?.masterKey) === 'business_type'
  })

  const workerSalaryTypeOptions = activeOptions.filter(option => {
    const raw = rawOptions.find(item =>
      matchesComparable(
        option.id,
        asRecord(item)?.id,
        asRecord(item)?.value,
        asRecord(item)?.label,
        asRecord(item)?.slug
      )
    )
    return normalizeComparableKey(asRecord(raw)?.masterKey) === 'worker_salary_type'
  })

  const cityOptionsRaw = rawOptions
    .filter(item =>
      normalizeComparableKey(asRecord(item)?.masterKey) === 'city' &&
      asRecord(item)?.isActive !== false &&
      (() => {
        const linkedStateKey = normalizeComparableKey(asRecord(item)?.stateOptionId)
        if (!linkedStateKey || !activeStateKeys.has(linkedStateKey)) {
          return false
        }
        const cityKeys = [
          asRecord(item)?.id,
          asRecord(item)?.value,
          asRecord(item)?.label,
          asRecord(item)?.slug
        ].map(normalizeComparableKey).filter(Boolean)
        return cityKeys.some(cityKey => selectableCityKeys.has(cityKey))
      })()
    )
    .map(item => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))

  const cityCoordinateLookup = new Map<string, WorkerAppCityCoordinate>()
  for (const rawCity of cityOptionsRaw) {
    const cityLatitude = readCoordinateFromKeys(rawCity, ['latitude', 'lat'])
    const cityLongitude = readCoordinateFromKeys(rawCity, ['longitude', 'lng'])
    if (!hasUsableCoordinatePair(cityLatitude, cityLongitude)) {
      continue
    }

    const cityCoordinate: WorkerAppCityCoordinate = {
      latitude: cityLatitude,
      longitude: cityLongitude,
      sourceCityId: toStringValue(rawCity.id || rawCity.value || rawCity.label || rawCity.slug)
    }

    const cityKeyInputs = [
      rawCity.id,
      rawCity.value,
      rawCity.label,
      rawCity.slug,
      rawCity.name
    ]
    for (const cityKeyInput of cityKeyInputs) {
      const cityKey = normalizeComparableKey(cityKeyInput)
      if (cityKey) {
        cityCoordinateLookup.set(cityKey, cityCoordinate)
      }
    }
  }

  const cityOptions = cityOptionsRaw
    .map(item => toStringValue(item.label || item.value))
    .filter(Boolean)

  const categoryLookup = new Map<string, LabourCategoryRecord>()
  for (const category of categories) {
    const keys = [category.id, category.slug, category.name]
      .map(normalizeComparableKey)
      .filter(Boolean)
    for (const key of keys) {
      categoryLookup.set(key, category)
    }
  }

  const industryBusinessDependencies = ((masterData.industryBusinessDependencies as unknown[]) || [])
    .filter(item => asRecord(item)?.isActive !== false)
    .map(item => {
      const raw = asRecord(item)
      if (!raw) {
        return null
      }
      const industryCategory = resolveMasterOption(optionLookup, raw.industryCategoryOptionId || raw.industryCategory)
      const businessType = resolveMasterOption(optionLookup, raw.businessTypeOptionId || raw.businessType)
      if (!industryCategory || !businessType) {
        return null
      }
      return {
        id: toStringValue(raw.id || `${industryCategory.id}-${businessType.id}`),
        industryCategory,
        businessType
      } satisfies WorkerAppIndustryBusinessDependency
    })
    .filter((item): item is WorkerAppIndustryBusinessDependency => Boolean(item))

  const categoryDependencies = ((masterData.categoryDependencies as unknown[]) || [])
    .filter(item => asRecord(item)?.isActive !== false)
    .map(item => {
      const raw = asRecord(item)
      if (!raw) {
        return null
      }
      const industryCategory = resolveMasterOption(optionLookup, raw.industryCategoryOptionId || raw.industryCategory)
      const businessType = resolveMasterOption(optionLookup, raw.businessTypeOptionId || raw.businessType)
      const category = categoryLookup.get(
        normalizeComparableKey(raw.categoryId || raw.categorySlug || raw.categoryName || raw.categoryLabel)
      )
      const categoryId = toStringValue(raw.categoryId || category?.id)
      const categoryName = toStringValue(raw.categoryName || raw.categoryLabel || category?.name)
      const categorySlug = toStringValue(raw.categorySlug || category?.slug)
      if (!industryCategory || !categoryId || !categoryName) {
        return null
      }
      return {
        id: toStringValue(raw.id || `${industryCategory.id}-${businessType?.id || 'all'}-${categoryId}`),
        industryCategory,
        businessType,
        categoryId,
        categoryName,
        categorySlug
      } satisfies WorkerAppCategoryDependency
    })
    .filter((item): item is WorkerAppCategoryDependency => Boolean(item))

  return {
    availableIndustryCategories: industryOptions,
    availableBusinessTypes: businessOptions,
    availableWorkerSalaryTypes: workerSalaryTypeOptions.length > 0
      ? workerSalaryTypeOptions
      : DEFAULT_WORKER_SALARY_TYPE_LABELS.map(buildWorkerSalaryTypeOption),
    industryBusinessDependencies,
    categoryDependencies,
    hasConfiguredCityOptions,
    cityCoordinateLookup,
    availableCities: cityOptions.length > 0
      ? uniqueStrings(cityOptions)
      : hasConfiguredCityOptions
        ? []
        : uniqueStrings(popularCitySuggestions)
  }
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const sanitizeMobile = (mobile: string) => mobile.replace(/\D/g, '').slice(-10)
const resolveCompanyContactMobile = (company: LabourCompanyRecord | undefined) => company?.contactMobile || company?.mobile || ''
const formatCategorySummary = (categories: string[]) => categories.length ? categories.slice(0, 3).join(', ') : 'Not specified'
const formatAppliedAtLabel = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

const buildCompanyApplicationWhatsappMessage = (payload: {
  companyName: string
  workerName: string
  workerCity: string
  workerMobile: string
  workerCategories: string[]
  expectedDailyWage: number
  note: string
  jobTitle: string
  appliedAt: string
}) => [
  'Rozgar App',
  `New worker applied for ${payload.jobTitle}.`,
  `Worker: ${payload.workerName}`,
  `City: ${payload.workerCity || 'Not added'}`,
  `Mobile: ${payload.workerMobile || 'Not available'}`,
  `Skills: ${formatCategorySummary(payload.workerCategories)}`,
  `Wage: Rs ${Number(payload.expectedDailyWage || 0).toLocaleString('en-IN')}/day`,
  payload.note ? `Note: ${payload.note}` : '',
  `Applied: ${formatAppliedAtLabel(payload.appliedAt)}`
].filter(Boolean).join('\n')

const buildWorkerApplicationConfirmationWhatsappMessage = (payload: {
  workerName: string
  companyName: string
  contactPerson: string
  companyCity: string
  companyMobile: string
  jobTitle: string
}) => [
  'Rozgar App',
  `You applied for ${payload.jobTitle}.`,
  `Company: ${payload.companyName}`,
  `Contact: ${payload.contactPerson || payload.companyName}`,
  `City: ${payload.companyCity || 'Not added'}`,
  `Number: ${payload.companyMobile || 'Not available'}`,
  `${payload.workerName}, the company can contact you soon.`
  ].filter(Boolean).join('\n')

const getCompanyApplicationWhatsappTemplateConfig = () => {
  const templateName = (process.env.WHATSAPP_COMPANY_APPLICATION_TEMPLATE_NAME || '').trim()
  const languageCode = (process.env.WHATSAPP_COMPANY_APPLICATION_TEMPLATE_LANGUAGE || 'en').trim() || 'en'

  return {
    templateName,
    languageCode
  }
}

const getWorkerConfirmationWhatsappTemplateConfig = () => {
  const templateName = (process.env.WHATSAPP_WORKER_CONFIRMATION_TEMPLATE_NAME || '').trim()
  const languageCode = (process.env.WHATSAPP_WORKER_CONFIRMATION_TEMPLATE_LANGUAGE || 'en').trim() || 'en'

  return {
    templateName,
    languageCode
  }
}

const getTemplateRetryLanguageCode = (languageCode: string) => {
  const normalizedLanguageCode = String(languageCode || '').trim().toLowerCase()
  if (!normalizedLanguageCode || normalizedLanguageCode === 'en') {
    return 'en_US'
  }

  return null
}

const sendWorkerApplicationConfirmationWhatsapp = async (payload: {
  workerMobile: string
  workerName: string
  companyName: string
  contactPerson: string
  companyCity: string
  companyMobile: string
  jobTitle: string
}) => {
  const workerConfirmationTemplate = getWorkerConfirmationWhatsappTemplateConfig()
  const textFallbackPayload = {
    to: payload.workerMobile,
    body: buildWorkerApplicationConfirmationWhatsappMessage({
      workerName: payload.workerName,
      companyName: payload.companyName,
      contactPerson: payload.contactPerson,
      companyCity: payload.companyCity,
      companyMobile: payload.companyMobile,
      jobTitle: payload.jobTitle
    })
  }

  if (!workerConfirmationTemplate.templateName) {
    return sendWhatsappTextMessage(textFallbackPayload)
  }

  const bodyParameters = [
    payload.workerName || 'Worker',
    payload.jobTitle || 'Job',
    [
      payload.companyName || 'Company',
      payload.contactPerson || payload.companyName || 'Company team',
      payload.companyCity || 'Not added'
    ].filter(Boolean).join(', '),
    payload.companyMobile || 'Not available'
  ]

  try {
    return await sendWhatsappTemplateMessage({
      to: payload.workerMobile,
      templateName: workerConfirmationTemplate.templateName,
      languageCode: workerConfirmationTemplate.languageCode,
      bodyParameters
    })
  } catch (error) {
    const retryLanguageCode = getTemplateRetryLanguageCode(workerConfirmationTemplate.languageCode)

    if (!retryLanguageCode || !isWhatsappTemplateTranslationMissingError(error)) {
      throw error
    }

    console.warn('Worker WhatsApp template translation missing, retrying with fallback language.', {
      templateName: workerConfirmationTemplate.templateName,
      languageCode: workerConfirmationTemplate.languageCode,
      retryLanguageCode
    })

    try {
      return await sendWhatsappTemplateMessage({
        to: payload.workerMobile,
        templateName: workerConfirmationTemplate.templateName,
        languageCode: retryLanguageCode,
        bodyParameters
      })
    } catch (retryError) {
      if (!isWhatsappTemplateTranslationMissingError(retryError)) {
        throw retryError
      }

      console.warn('Worker WhatsApp template still missing after retry, falling back to text confirmation.', {
        templateName: workerConfirmationTemplate.templateName,
        languageCode: retryLanguageCode
      })

      return sendWhatsappTextMessage(textFallbackPayload)
    }
  }
}

const sendCompanyApplicationWhatsapp = async (payload: {
  companyContactMobile: string
  companyName: string
  workerName: string
  workerCity: string
  workerMobile: string
  workerCategories: string[]
  expectedDailyWage: number
  note: string
  jobTitle: string
  appliedAt: string
}) => {
  const companyApplicationTemplate = getCompanyApplicationWhatsappTemplateConfig()
  const textFallbackPayload = {
    to: payload.companyContactMobile,
    body: buildCompanyApplicationWhatsappMessage({
      companyName: payload.companyName,
      workerName: payload.workerName,
      workerCity: payload.workerCity,
      workerMobile: payload.workerMobile,
      workerCategories: payload.workerCategories,
      expectedDailyWage: payload.expectedDailyWage,
      note: payload.note,
      jobTitle: payload.jobTitle,
      appliedAt: payload.appliedAt
    })
  }

  if (!companyApplicationTemplate.templateName) {
    return sendWhatsappTextMessage(textFallbackPayload)
  }

  const bodyParameters = [
    payload.companyName || 'Company',
    payload.workerName || 'Worker',
    payload.jobTitle || 'Job',
    payload.workerCity || 'Not specified',
    payload.workerMobile || 'Not available',
    formatCategorySummary(payload.workerCategories) || 'Not specified',
    `Rs ${Number(payload.expectedDailyWage || 0).toLocaleString('en-IN')}`,
    payload.note || 'No note shared',
    formatAppliedAtLabel(payload.appliedAt)
  ]

  try {
    return await sendWhatsappTemplateMessage({
      to: payload.companyContactMobile,
      templateName: companyApplicationTemplate.templateName,
      languageCode: companyApplicationTemplate.languageCode,
      bodyParameters
    })
  } catch (error) {
    if (!isWhatsappTemplateTranslationMissingError(error)) {
      throw error
    }

    const normalizedLanguageCode = companyApplicationTemplate.languageCode.toLowerCase()
    if (normalizedLanguageCode !== 'en') {
      const retryLanguageCode = companyApplicationTemplate.languageCode.includes('_') ? 'en_US' : 'en'
      try {
        return await sendWhatsappTemplateMessage({
          to: payload.companyContactMobile,
          templateName: companyApplicationTemplate.templateName,
          languageCode: retryLanguageCode,
          bodyParameters
        })
      } catch (retryError) {
        if (!isWhatsappTemplateTranslationMissingError(retryError)) {
          throw retryError
        }

        return sendWhatsappTextMessage(textFallbackPayload)
      }
    }

    return sendWhatsappTextMessage(textFallbackPayload)
  }
}

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

  if (!worker.activePlan || !workerPlan) {
    return 'inactive_subscription_expired'
  }

  if (isWorkerPlanExpiredRecord(worker)) {
    return 'inactive_subscription_expired'
  }

  if (isWorkerPausedByWorker(worker, workerPlan)) {
    return 'inactive_paused_by_worker'
  }

  const outstandingRegistrationFee = getOutstandingWorkerRegistrationFee(worker, workerPlan, transactions)
  if (outstandingRegistrationFee > 0 && worker.walletBalance < outstandingRegistrationFee) {
    return 'inactive_wallet_empty'
  }

  if (workerPlan && isZeroChargeWorkerPlan(workerPlan)) {
    return 'active'
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

const isZeroChargeWorkerPlan = (workerPlan: LabourPlanRecord | null) =>
  Boolean(
    workerPlan &&
    workerPlan.audience === 'worker' &&
    workerPlan.registrationFee <= 0 &&
    workerPlan.dailyCharge <= 0
  )

const isFreeWorkerPlan = (workerPlan: LabourPlanRecord | null) =>
  Boolean(
    workerPlan &&
    workerPlan.audience === 'worker' &&
    (
      workerPlan.id === 'plan-worker-free-7-days' ||
      String(workerPlan.name || '').trim().toLowerCase() === 'free worker plan' ||
      isZeroChargeWorkerPlan(workerPlan)
    )
  )

const isPaidWorkerPlan = (workerPlan: LabourPlanRecord | null) =>
  Boolean(
    workerPlan &&
    workerPlan.audience === 'worker' &&
    !isFreeWorkerPlan(workerPlan)
  )

const isWorkerPausedByWorker = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null
) =>
  Boolean(
    isPaidWorkerPlan(workerPlan) &&
    (worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker')
  )

const getWorkerPlan = (plans: LabourPlanRecord[]) =>
  plans.find(plan => plan.audience === 'worker' && plan.isActive && isFreeWorkerPlan(plan)) ||
  plans.find(plan => plan.audience === 'worker' && plan.isActive) ||
  null

const getWorkerPlanValidityDays = (workerPlan: LabourPlanRecord | null) =>
  workerPlan ? (workerPlan.planValidityDays > 0 ? workerPlan.planValidityDays : workerPlan.validityDays) : 0

const DAILY_WORKER_DEDUCTION_INTERVAL_MS = 24 * 60 * 60 * 1000

const getDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const addDaysToDateValue = (dateValue: string, days: number) => {
  const baseDate = new Date(dateValue)
  if (Number.isNaN(baseDate.getTime())) {
    return dateValue
  }
  baseDate.setDate(baseDate.getDate() + days)
  return getDateValue(baseDate)
}

const parseWorkerDate = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const resolveWorkerDeductionAnchor = (worker: LabourWorkerRecord) => {
  const baseAnchor =
    parseWorkerDate(worker.registrationCompletedAt) ||
    parseWorkerDate(worker.planValidFrom) ||
    parseWorkerDate(worker.createdAt)
  const reactivatedAt = parseWorkerDate(worker.workerReactivatedAt)
  if (!baseAnchor) {
    return reactivatedAt
  }
  if (reactivatedAt && reactivatedAt.getTime() > baseAnchor.getTime()) {
    return reactivatedAt
  }
  return baseAnchor
}

const getLatestWorkerDeductionTransaction = (transactions: LabourWalletTransactionRecord[]) =>
  transactions.find(transaction =>
    transaction.transactionType === 'wallet_deduction' &&
    transaction.status === 'completed'
  ) || null

const getWorkerDeductionDateValue = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[],
  anchor?: Date | null
) => {
  const latestDeduction = getLatestWorkerDeductionTransaction(transactions)
  const latestDeductionDate = parseWorkerDate(latestDeduction?.createdAt)
  let latestDeductionDateValue = ''
  if (latestDeductionDate) {
    if (!anchor || latestDeductionDate.getTime() >= anchor.getTime()) {
      latestDeductionDateValue = getDateValue(latestDeductionDate)
    }
  }
  const lastWalletDeductionDate = worker.lastWalletDeductionDate ? worker.lastWalletDeductionDate.slice(0, 10) : ''
  if (!lastWalletDeductionDate || !anchor) {
    return [latestDeductionDateValue, lastWalletDeductionDate].filter(Boolean).sort().at(-1) || ''
  }
  const storedDeductionDate = parseWorkerDate(lastWalletDeductionDate)
  if (!storedDeductionDate || storedDeductionDate.getTime() < anchor.getTime()) {
    return latestDeductionDateValue
  }
  return [latestDeductionDateValue, lastWalletDeductionDate].filter(Boolean).sort().at(-1) || ''
}

const getWorkerDeductionTimeForDate = (anchor: Date, dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(part => Number(part))
  if (!year || !month || !day) return null
  const date = new Date(anchor)
  date.setFullYear(year, month - 1, day)
  return date
}

const resolveWorkerDailyDeductionSchedule = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[],
  now = new Date()
) => {
  const anchor = resolveWorkerDeductionAnchor(worker)
  if (!anchor) {
    return {
      shouldDeduct: false,
      deductionDateValue: '',
      nextDeductionAt: null as string | null
    }
  }

  const elapsedIntervals = Math.floor((now.getTime() - anchor.getTime()) / DAILY_WORKER_DEDUCTION_INTERVAL_MS)
  const lastDeductionDateValue = getWorkerDeductionDateValue(worker, transactions, anchor)

  if (elapsedIntervals <= 0) {
    return {
      shouldDeduct: false,
      deductionDateValue: '',
      nextDeductionAt: new Date(anchor.getTime() + DAILY_WORKER_DEDUCTION_INTERVAL_MS).toISOString()
    }
  }

  const latestCompletedDeductionAt = new Date(anchor.getTime() + elapsedIntervals * DAILY_WORKER_DEDUCTION_INTERVAL_MS)
  const deductionDateValue = getDateValue(latestCompletedDeductionAt)
  const alreadyDeductedForLatestCycle =
    Boolean(lastDeductionDateValue) && lastDeductionDateValue >= deductionDateValue

  let nextDeductionAt: Date
  if (lastDeductionDateValue) {
    const lastDeductionAt = getWorkerDeductionTimeForDate(anchor, lastDeductionDateValue)
    nextDeductionAt = lastDeductionAt
      ? new Date(lastDeductionAt.getTime() + DAILY_WORKER_DEDUCTION_INTERVAL_MS)
      : new Date(anchor.getTime() + DAILY_WORKER_DEDUCTION_INTERVAL_MS)
  } else {
    nextDeductionAt = new Date(anchor.getTime() + DAILY_WORKER_DEDUCTION_INTERVAL_MS)
  }

  while (nextDeductionAt.getTime() <= now.getTime()) {
    nextDeductionAt = new Date(nextDeductionAt.getTime() + DAILY_WORKER_DEDUCTION_INTERVAL_MS)
  }

  return {
    shouldDeduct: !alreadyDeductedForLatestCycle,
    deductionDateValue,
    nextDeductionAt: nextDeductionAt.toISOString()
  }
}

const resolveAssignedWorkerPlan = (
  worker: LabourWorkerRecord,
  plans: LabourPlanRecord[]
) => plans.find(plan => plan.id === worker.activePlan && plan.audience === 'worker') || null

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
  const pausedByWorker = isWorkerPausedByWorker(worker, workerPlan)

  if (effectiveStatus === 'blocked') {
    return {
      isActive: false,
      isPausedByWorker: false,
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
      isPausedByWorker: false,
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
      isPausedByWorker: false,
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
      isPausedByWorker: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Registration under review',
      description: 'Your worker account was submitted successfully and is waiting for admin verification.',
      recommendedAction: 'Wait for approval'
    }
  }

  if (effectiveStatus === 'inactive_subscription_expired') {
    const freePlanExpired = isFreeWorkerPlan(workerPlan)

    return {
      isActive: false,
      isPausedByWorker: false,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: freePlanExpired
        ? 'Free plan expired. Please activate a paid plan.'
        : workerPlan ? 'Plan expired' : 'No active worker plan assigned',
      description: workerPlan
        ? freePlanExpired
          ? `Your free worker plan expired on ${worker.planValidUntil || 'the previous validity date'}. Please activate a paid worker plan to unlock job details, contact details, and applications again.`
          : `Your worker plan expired on ${worker.planValidUntil || 'the previous validity date'}. Renew or assign a new worker plan to unlock company details again.`
        : 'No active worker plan is assigned to your account yet. Please contact admin or purchase the correct worker plan to continue using the Rozgar worker app.',
      recommendedAction: freePlanExpired ? 'Activate paid plan' : workerPlan ? 'Renew worker plan' : 'Get worker plan assigned'
    }
  }

  if (effectiveStatus === 'inactive_paused_by_worker') {
    return {
      isActive: false,
      isPausedByWorker: true,
      canViewCompanyDetails: false,
      status: effectiveStatus,
      headline: 'Worker access is paused',
      description: 'Your paid worker plan is paused by you. Daily deduction will stay stopped until you activate the plan again.',
      recommendedAction: worker.walletBalance >= (workerPlan?.dailyCharge || 0)
        ? 'Activate worker access'
        : workerPlan
          ? `Recharge at least Rs ${Math.max((workerPlan.dailyCharge || 0) - worker.walletBalance, 0)} before activating`
          : 'Activate worker access'
    }
  }

  if (effectiveStatus === 'inactive_wallet_empty') {
    return {
      isActive: false,
      isPausedByWorker: pausedByWorker,
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
    isPausedByWorker: pausedByWorker,
    canViewCompanyDetails: effectiveStatus === 'active',
    status: effectiveStatus,
    headline: 'Worker access is active',
    description: workerPlan
      ? isFreeWorkerPlan(workerPlan)
        ? `Your free worker plan is active until ${worker.planValidUntil || 'the current validity date'}. No registration fee or daily deduction will be charged during this free period.`
        : `Your one-time registration fee is settled. Daily deduction is Rs ${workerPlan.dailyCharge} and company details are unlocked.`
      : 'Your worker access is active and company details are unlocked.',
    recommendedAction: 'Apply to matching job posts'
  }
}

const toWorkerProfile = (worker: LabourWorkerRecord, categories: LabourCategoryRecord[]): WorkerAppProfile => ({
  id: worker.id,
  fullName: worker.fullName,
  mobile: worker.mobile,
  city: worker.city,
  homeCity: worker.homeCity,
  address: worker.address,
  salaryType: resolveWorkerSalaryType(worker.salaryType),
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
  isPausedByWorker: worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker',
  pausedAt: worker.workerPausedAt || null,
  reactivatedAt: worker.workerReactivatedAt || null,
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
  const lastDeduction = getLatestWorkerDeductionTransaction(transactions)
  const pausedByWorker = isWorkerPausedByWorker(worker, workerPlan)
  const deductionSchedule = dailyCharge > 0 && workerPlan && !isFreeWorkerPlan(workerPlan)
    ? resolveWorkerDailyDeductionSchedule(worker, transactions)
    : null

  return {
    balance: worker.walletBalance,
    dailyCharge,
    registrationFee,
    registrationFeePaid,
    estimatedDaysRemaining: dailyCharge > 0 ? Math.floor(worker.walletBalance / dailyCharge) : 0,
    visibilityRule: !worker.activePlan || !workerPlan
      ? 'No active worker plan is assigned yet. Company details stay locked until a valid worker plan is assigned and funded.'
      : pausedByWorker
      ? 'Your paid worker plan is paused. Daily deduction will stay stopped until you activate worker access again.'
      : outstandingRegistrationFee > 0
      ? worker.walletBalance > 0
        ? `A one-time registration fee of Rs ${registrationFee} is pending. Recharge until the wallet reaches at least Rs ${registrationFee}, then daily charges will start as per your worker plan.`
        : `Add wallet balance to cover the one-time registration fee of Rs ${registrationFee}. After that, daily worker charges apply as per the active plan.`
      : isFreeWorkerPlan(workerPlan)
        ? 'Your free worker plan is active for 7 days. No registration fee or daily deduction will be charged during this free period.'
      : dailyCharge > 0
        ? `One-time registration fee is already charged. Rs ${dailyCharge} is deducted every active day. Company details unlock only while your worker access is active.`
        : 'Worker daily deduction is not configured yet.',
    isPausedByWorker: pausedByWorker,
    pausedAt: worker.workerPausedAt || null,
    reactivatedAt: worker.workerReactivatedAt || null,
    lastDeductionAt: lastDeduction?.createdAt || null,
    nextDeductionAt: deductionSchedule?.nextDeductionAt || null,
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

const reconcileWorkerDailyCharge = async (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[]
) => {
  const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)
  const shouldBeVisible = isWorkerRegistrationComplete(worker) && effectiveStatus === 'active'

  if (!workerPlan || !worker.activePlan || isWorkerPlanExpiredRecord(worker)) {
    if (worker.status !== effectiveStatus || worker.isVisible !== shouldBeVisible) {
      await updateLabourEntity('workers', worker.id, {
        status: effectiveStatus,
        isVisible: shouldBeVisible
      }, 'worker-wallet')
      return true
    }

    return false
  }

  if (effectiveStatus !== 'active') {
    if (worker.status !== effectiveStatus || worker.isVisible !== shouldBeVisible) {
      await updateLabourEntity('workers', worker.id, {
        status: effectiveStatus,
        isVisible: shouldBeVisible
      }, 'worker-wallet')
      return true
    }

    return false
  }

  const dailyCharge = workerPlan.dailyCharge || 0
  if (dailyCharge <= 0) {
    if (worker.status !== effectiveStatus || worker.isVisible !== shouldBeVisible) {
      await updateLabourEntity('workers', worker.id, {
        status: effectiveStatus,
        isVisible: shouldBeVisible
      }, 'worker-wallet')
      return true
    }

    return false
  }

  const deductionSchedule = resolveWorkerDailyDeductionSchedule(worker, transactions)
  if (!deductionSchedule.shouldDeduct || !deductionSchedule.deductionDateValue) {
    if (worker.status !== effectiveStatus || worker.isVisible !== shouldBeVisible) {
      await updateLabourEntity('workers', worker.id, {
        status: effectiveStatus,
        isVisible: shouldBeVisible
      }, 'worker-wallet')
      return true
    }

    return false
  }

  if (worker.walletBalance < dailyCharge) {
    const nextStatus = deriveWorkerStatus({ ...worker, walletBalance: 0 }, workerPlan, transactions)
    const nextVisibility = isWorkerRegistrationComplete(worker) && nextStatus === 'active'
    if (worker.status !== nextStatus || worker.isVisible !== nextVisibility) {
      await updateLabourEntity('workers', worker.id, {
        status: nextStatus,
        isVisible: nextVisibility
      }, 'worker-wallet')
      return true
    }

    return false
  }

  const nextWorker: LabourWorkerRecord = {
    ...worker,
    walletBalance: Math.max(0, worker.walletBalance - dailyCharge),
    lastWalletDeductionDate: deductionSchedule.deductionDateValue
  }
  const nextStatus = deriveWorkerStatus(nextWorker, workerPlan, transactions)

  await createLabourEntity('walletTransactions', {
    entityType: 'worker',
    entityId: worker.id,
    entityName: worker.fullName || worker.mobile,
    city: worker.city,
    transactionType: 'wallet_deduction',
    amount: dailyCharge,
    direction: 'debit',
    status: 'completed',
    reference: workerPlan.id,
    note: `Daily worker plan charge deducted for ${deductionSchedule.deductionDateValue}.`
  }, 'worker-wallet')

  await updateLabourEntity('workers', worker.id, {
    walletBalance: nextWorker.walletBalance,
    lastWalletDeductionDate: nextWorker.lastWalletDeductionDate,
    status: nextStatus,
    isVisible: isWorkerRegistrationComplete(nextWorker) && nextStatus === 'active'
  }, 'worker-wallet')

  return true
}

const settleWorkerDailyChargeForToday = async ({
  worker,
  workerPlan,
  transactions,
  now,
  note
}: {
  worker: LabourWorkerRecord
  workerPlan: LabourPlanRecord
  transactions: LabourWalletTransactionRecord[]
  now: string
  note: string
}) => {
  const dailyCharge = workerPlan.dailyCharge || 0
  if (dailyCharge <= 0 || isFreeWorkerPlan(workerPlan)) {
    return {
      worker,
      transactions,
      deducted: false
    }
  }

  const todayDateValue = now.slice(0, 10)
  const lastDeductionDateValue = getWorkerDeductionDateValue(
    worker,
    transactions,
    resolveWorkerDeductionAnchor(worker)
  )

  if (lastDeductionDateValue === todayDateValue) {
    return {
      worker,
      transactions,
      deducted: false
    }
  }

  if (worker.walletBalance < dailyCharge) {
    return {
      worker,
      transactions,
      deducted: false
    }
  }

  await createLabourEntity('walletTransactions', {
    entityType: 'worker',
    entityId: worker.id,
    entityName: worker.fullName || worker.mobile,
    city: worker.city,
    transactionType: 'wallet_deduction',
    amount: dailyCharge,
    direction: 'debit',
    status: 'completed',
    reference: workerPlan.id,
    note
  }, 'worker-wallet')

  const nextTransaction: LabourWalletTransactionRecord = {
    id: `wallet-txn-${worker.id}-${todayDateValue}`,
    entityType: 'worker',
    entityId: worker.id,
    entityName: worker.fullName || worker.mobile,
    city: worker.city,
    transactionType: 'wallet_deduction',
    amount: dailyCharge,
    direction: 'debit',
    status: 'completed',
    reference: workerPlan.id,
    note,
    createdAt: now,
    updatedAt: now
  }

  return {
    worker: {
      ...worker,
      walletBalance: Math.max(0, worker.walletBalance - dailyCharge),
      lastWalletDeductionDate: todayDateValue
    },
    transactions: [nextTransaction, ...transactions],
    deducted: true
  }
}

const buildReactivatedWorkerPlanWindow = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord,
  now: string
) => {
  if (!isWorkerPlanExpiredRecord(worker)) {
    return {
      planValidFrom: worker.planValidFrom || '',
      planValidUntil: worker.planValidUntil || ''
    }
  }

  const validityDays = Math.max(getWorkerPlanValidityDays(workerPlan), 1)
  const planValidFrom = getDateValue(new Date(now))
  const planValidUntil = addDaysToDateValue(planValidFrom, validityDays)
  return {
    planValidFrom,
    planValidUntil
  }
}

const buildWorkerFeed = (
  worker: LabourWorkerRecord,
  companies: LabourCompanyRecord[],
  jobPosts: LabourJobPostRecord[],
  categories: LabourCategoryRecord[],
  applications: LabourJobApplicationRecord[],
  savedJobs: LabourSavedJobRecord[],
  activation: WorkerAppActivationSummary,
  masterData: WorkerAppMasterData
): WorkerAppFeedItem[] => {
  const matchingPosts = jobPosts
    .filter(jobPost => {
      if (!isJobPostLiveRecord(jobPost)) {
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
      const rawJobPost = asRecord(jobPost)
      const rawCompany = asRecord(company)
      const cityCandidate = toStringValue(jobPost.city || company?.city)
      const cityCoordinate = cityCandidate
        ? masterData.cityCoordinateLookup.get(normalizeComparableKey(cityCandidate))
        : null
      const jobLatitude = readCoordinateFromKeys(rawJobPost, ['latitude', 'workLocationLatitude', 'lat'])
      const jobLongitude = readCoordinateFromKeys(rawJobPost, ['longitude', 'workLocationLongitude', 'lng'])
      const companyLatitude = readCoordinateFromKeys(rawCompany, [
        'latitude',
        'companyLatitude',
        'locationLatitude'
      ])
      const companyLongitude = readCoordinateFromKeys(rawCompany, [
        'longitude',
        'companyLongitude',
        'locationLongitude'
      ])

      let latitude: number | null = null
      let longitude: number | null = null
      let coordinateSource: WorkerAppFeedItem['coordinateSource'] = null

      if (hasUsableCoordinatePair(jobLatitude, jobLongitude)) {
        latitude = jobLatitude
        longitude = jobLongitude
        coordinateSource = 'job'
      } else if (hasUsableCoordinatePair(companyLatitude, companyLongitude)) {
        latitude = companyLatitude
        longitude = companyLongitude
        coordinateSource = 'job'
      } else if (cityCoordinate && hasUsableCoordinatePair(cityCoordinate.latitude, cityCoordinate.longitude)) {
        latitude = cityCoordinate.latitude
        longitude = cityCoordinate.longitude
        coordinateSource = 'city_master'
      } else {
        coordinateSource = 'none'
      }

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
        latitude,
        longitude,
        coordinateSource,
        wageAmount: jobPost.wageAmount,
        workersNeeded: jobPost.workersNeeded,
        categoryName,
        companyLocked: !activation.canViewCompanyDetails,
        companyName: activation.canViewCompanyDetails ? company?.companyName || 'Company not found' : 'Unlock company details after activation',
        companyCity: company?.city || '',
        contactPerson: activation.canViewCompanyDetails ? company?.contactPerson || null : null,
        companyMobile: activation.canViewCompanyDetails ? resolveCompanyContactMobile(company) || null : null,
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

const buildAvailableWorkerCategories = (
  categories: LabourCategoryRecord[],
  categoryDependencies: WorkerAppCategoryDependency[]
) => {
  const activeCategories = categories.filter(category => category.isActive)
  if (categoryDependencies.length === 0) {
    return activeCategories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      showOnHome: category.showOnHome,
      homeOrder: category.homeOrder
    }))
  }

  const dependencyCategoryKeys = new Set(
    categoryDependencies
      .flatMap(dependency => [
        normalizeComparableKey(dependency.categoryId),
        normalizeComparableKey(dependency.categorySlug),
        normalizeComparableKey(dependency.categoryName)
      ])
      .filter(Boolean)
  )

  const seenCategoryKeys = new Set<string>()
  const dependencyAwareCategories = activeCategories.filter(category => {
    const categoryKeys = [
      normalizeComparableKey(category.id),
      normalizeComparableKey(category.slug),
      normalizeComparableKey(category.name)
    ].filter(Boolean)

    const matchingKey = categoryKeys.find(key => dependencyCategoryKeys.has(key))
    if (!matchingKey || seenCategoryKeys.has(matchingKey)) {
      return false
    }

    seenCategoryKeys.add(matchingKey)
    return true
  })

  return dependencyAwareCategories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    showOnHome: category.showOnHome,
    homeOrder: category.homeOrder
  }))
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
    homeCity: '',
    address: '',
    salaryType: DEFAULT_WORKER_SALARY_TYPE,
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
  const now = new Date()
  const storage = await getOtpStorageBackend()
  const usesStatelessOtpSession = storage === 'json'
  let sessions: WorkerAuthSession[] = []

  if (!usesStatelessOtpSession) {
    const persisted = await readOtpSessions()
    sessions = persisted.sessions
    const activeSession = sessions.find(session => session.mobile === normalizedMobile && !session.isVerified)
    if (activeSession) {
      const activeSessionExpiresAt = new Date(activeSession.expiresAt).getTime()
      if (activeSessionExpiresAt > now.getTime()) {
        const cooldownEndsAt = new Date(activeSession.updatedAt || activeSession.createdAt).getTime() + (OTP_RESEND_COOLDOWN_SECONDS * 1000)
        if (cooldownEndsAt > now.getTime()) {
          const remainingSeconds = Math.max(1, Math.ceil((cooldownEndsAt - now.getTime()) / 1000))
          throw new Error(`Please wait ${remainingSeconds} seconds before requesting another OTP.`)
        }
      }
    }
  }

  const expiresAt = buildWorkerOtpExpiry()
  const otpCode = isTwoFactorOtpProvider()
    ? generateWorkerOtpCode()
    : DEV_OTP_CODE

  if (!otpCode) {
    throw new Error('Worker OTP provider is not configured.')
  }

  let providerSessionId: string | undefined
  if (isTwoFactorOtpProvider()) {
    const providerResult = await sendTwoFactorOtp({
      mobile: normalizedMobile,
      otpCode,
      expiresAt
    })
    providerSessionId = providerResult.providerSessionId
  } else if (!supportsStatelessDemoOtp()) {
    throw new Error('Worker OTP provider is not configured.')
  }

  const otpState: StoredWorkerOtpState = {
    code: otpCode,
    failedAttempts: 0,
    provider: isTwoFactorOtpProvider() ? '2factor' : 'local-demo',
    providerSessionId
  }

  const nextSession: WorkerAuthSession = {
    id: createId('otp'),
    mobile: normalizedMobile,
    workerId: worker.id,
    otpCode: stringifyStoredWorkerOtpState(otpState),
    expiresAt,
    isVerified: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  let otpSessionToken: string | undefined
  if (usesStatelessOtpSession) {
    otpSessionToken = await generateWorkerOtpSessionToken(nextSession, otpState)
  } else {
    const filtered = sessions.filter(session => session.mobile !== normalizedMobile)
    filtered.unshift(nextSession)
    try {
      await writeOtpSessions(filtered, storage)
    } catch (error) {
      if (!supportsStatelessDemoOtp()) {
        throw error
      }
    }
  }

  return {
    workerId: worker.id,
    mobile: normalizedMobile,
    expiresAt: nextSession.expiresAt,
    otpSessionToken,
    message: isTwoFactorOtpProvider()
      ? 'OTP sent successfully to your mobile number.'
      : 'OTP generated for local worker login testing.'
  }
}

export const verifyWorkerOtpCode = async (mobile: string, otpCode: string, otpSessionToken?: string) => {
  const normalizedMobile = sanitizeMobile(mobile)
  const normalizedOtpCode = String(otpCode).trim()

  if (!isTwoFactorOtpProvider() && supportsStatelessDemoOtp() && normalizedOtpCode === DEV_OTP_CODE) {
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

  const storage = await getOtpStorageBackend()
  if (storage === 'json') {
    if (!otpSessionToken) {
      throw new Error('OTP session not found. Request OTP again.')
    }

    const statelessSession = await verifyWorkerOtpSessionToken(otpSessionToken)
    if (!statelessSession) {
      throw new Error('OTP expired. Request a new OTP.')
    }

    if (sanitizeMobile(statelessSession.mobile) !== normalizedMobile) {
      throw new Error('OTP session does not match this mobile number. Request OTP again.')
    }

    if (statelessSession.otpCode !== normalizedOtpCode) {
      throw new Error('Invalid OTP code.')
    }

    const snapshot = await getLabourMarketplaceSnapshot()
    const worker = findWorkerById(snapshot, statelessSession.workerId)
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

  const { sessions } = await readOtpSessions()
  const session = sessions.find(item => item.mobile === normalizedMobile)

  if (!session) {
    throw new Error('OTP session not found. Request OTP again.')
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await writeOtpSessions(
      sessions.filter(item => item.id !== session.id),
      'supabase'
    )
    throw new Error('OTP expired. Request a new OTP.')
  }

  const storedOtpState = parseStoredWorkerOtpState(session.otpCode)
  if (storedOtpState.code !== normalizedOtpCode) {
    const failedAttempts = storedOtpState.failedAttempts + 1
    if (failedAttempts >= MAX_OTP_VERIFY_ATTEMPTS) {
      await writeOtpSessions(
        sessions.filter(item => item.id !== session.id),
        'supabase'
      )
      throw new Error('Too many wrong OTP attempts. Request a new OTP.')
    }

    const updatedSessions = sessions.map(item => item.id === session.id
      ? {
          ...item,
          otpCode: stringifyStoredWorkerOtpState({
            ...storedOtpState,
            failedAttempts
          }),
          updatedAt: new Date().toISOString()
        }
      : item)
    await writeOtpSessions(updatedSessions, 'supabase')
    throw new Error('Invalid OTP code.')
  }

  await writeOtpSessions(
    sessions.filter(item => item.id !== session.id),
    'supabase'
  )

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
  const masterData = await readLabourMasterData(
    snapshot.categories,
    adminSettings.settings.workerHomeControls.popularCitySuggestions
  )
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const workerPlan = resolveAssignedWorkerPlan(worker, snapshot.plans)
  const walletTransactions = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const didReconcileRegistrationFee = await reconcileWorkerRegistrationFee(worker, workerPlan, walletTransactions)
  if (didReconcileRegistrationFee) {
    return getWorkerAppDashboard(workerId)
  }
  const didReconcileDailyCharge = await reconcileWorkerDailyCharge(worker, workerPlan, walletTransactions)
  if (didReconcileDailyCharge) {
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
  const feed = buildWorkerFeed(
    worker,
    snapshot.companies,
    snapshot.jobPosts,
    snapshot.categories,
    applications,
    savedJobs,
    activation,
    masterData
  )

  const allowedDashboardCities = masterData.availableCities.length > 0
    ? uniqueStrings([...masterData.availableCities, worker.city])
    : masterData.hasConfiguredCityOptions
      ? uniqueStrings([worker.city])
      : uniqueStrings([
          ...adminSettings.settings.workerHomeControls.popularCitySuggestions,
          ...feed.map(item => item.city),
          ...feed.map(item => item.companyCity),
          worker.city
        ])

  const allowedDashboardCityKeys = new Set(
    allowedDashboardCities.map(normalizeComparableKey).filter(Boolean)
  )

  const filteredFeed = feed.filter(item => {
    const jobCityKey = normalizeComparableKey(item.city)
    const companyCityKey = normalizeComparableKey(item.companyCity)

    if (!jobCityKey && !companyCityKey) {
      return true
    }

    if (jobCityKey && allowedDashboardCityKeys.has(jobCityKey)) {
      return true
    }

    if (companyCityKey && allowedDashboardCityKeys.has(companyCityKey)) {
      return true
    }

    return false
  })

  const filteredPopularCitySuggestions = uniqueStrings(
    adminSettings.settings.workerHomeControls.popularCitySuggestions.filter(city =>
      allowedDashboardCityKeys.has(normalizeComparableKey(city))
    )
  )

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
    feed: filteredFeed,
    notifications: notifications.map(toWorkerNotification),
    unreadNotificationCount: notifications.filter(notification => !notification.isRead).length,
    availableCategories: buildAvailableWorkerCategories(snapshot.categories, masterData.categoryDependencies),
    availableIndustryCategories: masterData.availableIndustryCategories,
    availableBusinessTypes: masterData.availableBusinessTypes,
    availableWorkerSalaryTypes: masterData.availableWorkerSalaryTypes,
    industryBusinessDependencies: masterData.industryBusinessDependencies,
    categoryDependencies: masterData.categoryDependencies,
    availableCities: allowedDashboardCities,
    popularCitySuggestions: filteredPopularCitySuggestions,
    workerPlan: workerPlan ? {
      id: workerPlan.id,
      name: workerPlan.name,
      validityDays: getWorkerPlanValidityDays(workerPlan),
      planValidityDays: getWorkerPlanValidityDays(workerPlan),
      planStartDate: worker.planValidFrom || null,
      planEndDate: worker.planValidUntil || null,
      dailyCharge: workerPlan.dailyCharge,
      registrationFee: workerPlan.registrationFee,
      registrationFeePaid: isWorkerRegistrationFeeSettled(worker, workerPlan, walletTransactions),
      walletCredit: workerPlan.walletCredit,
      lockedReason: activation.isActive ? null : activation.headline
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
    homeCity: payload.homeCity.trim(),
    address: payload.address.trim(),
    salaryType: resolveWorkerSalaryType(payload.salaryType),
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
    resolveAssignedWorkerPlan(existing, snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === workerId)
  )

  await updateLabourEntity('workers', workerId, {
    fullName: nextWorker.fullName,
    city: nextWorker.city,
    homeCity: nextWorker.homeCity,
    address: nextWorker.address,
    salaryType: nextWorker.salaryType,
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
  payload: Partial<Pick<WorkerAppProfile, 'fullName' | 'city' | 'homeCity' | 'address' | 'salaryType' | 'categoryIds' | 'skills' | 'experienceYears' | 'expectedDailyWage' | 'availability'>>
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
    homeCity: payload.homeCity ?? existing.homeCity,
    address: payload.address ?? existing.address,
    salaryType: resolveWorkerSalaryType(payload.salaryType ?? existing.salaryType),
    categoryIds: payload.categoryIds ?? existing.categoryIds,
    skills: payload.skills ?? existing.skills,
    experienceYears: payload.experienceYears ?? existing.experienceYears,
    expectedDailyWage: payload.expectedDailyWage ?? existing.expectedDailyWage,
    availability: (payload.availability ?? existing.availability) as LabourWorkerRecord['availability']
  }
  const nextStatus = deriveWorkerStatus(
    mergedWorker,
    resolveAssignedWorkerPlan(existing, snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === workerId)
  )

  await updateLabourEntity('workers', workerId, {
    fullName: mergedWorker.fullName,
    city: mergedWorker.city,
    homeCity: mergedWorker.homeCity,
    address: mergedWorker.address,
    salaryType: mergedWorker.salaryType,
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

export const updateWorkerWalletStatus = async (workerId: string, active: boolean) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const adminSettings = await getLabourAdminSettings()
  const worker = findWorkerById(snapshot, workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  if (worker.status === 'blocked' || worker.status === 'rejected') {
    throw new Error('Blocked or rejected worker accounts cannot change wallet activation status.')
  }

  const workerPlan = resolveAssignedWorkerPlan(worker, snapshot.plans)
  if (!workerPlan || !worker.activePlan || !isPaidWorkerPlan(workerPlan)) {
    throw new Error('Wallet activation control is available only for paid worker plans.')
  }

  const transactions = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const pausedByWorker = isWorkerPausedByWorker(worker, workerPlan)
  const effectiveStatus = deriveWorkerStatus(worker, workerPlan, transactions)
  const now = new Date().toISOString()
  const minimumWalletRecharge = Math.max(
    adminSettings.settings.feeRules.minimumWalletRecharge || 0,
    workerPlan.dailyCharge || 0
  )

  if (!active) {
    if (pausedByWorker) {
      return getWorkerAppDashboard(workerId)
    }

    if (effectiveStatus !== 'active') {
      throw new Error('Only active paid worker plans can be deactivated.')
    }

    const {
      worker: workerAfterCharge
    } = await settleWorkerDailyChargeForToday({
      worker,
      workerPlan,
      transactions,
      now,
      note: `Daily worker plan charge deducted for ${now.slice(0, 10)} before pausing worker access.`
    })

    await updateLabourEntity('workers', worker.id, {
      walletBalance: workerAfterCharge.walletBalance,
      lastWalletDeductionDate: workerAfterCharge.lastWalletDeductionDate || null,
      workerPausedByWorker: true,
      workerPausedAt: now,
      status: 'inactive_paused_by_worker',
      isVisible: false
    }, 'worker-wallet')

    return getWorkerAppDashboard(workerId)
  }

  if (!pausedByWorker && effectiveStatus === 'active') {
    return getWorkerAppDashboard(workerId)
  }

  if (worker.walletBalance < minimumWalletRecharge) {
    throw new Error('Insufficient wallet balance. Please recharge to activate worker access.')
  }

  const reactivatedPlanWindow = buildReactivatedWorkerPlanWindow(worker, workerPlan, now)
  const workerReadyForActivation: LabourWorkerRecord = {
    ...worker,
    planValidFrom: reactivatedPlanWindow.planValidFrom,
    planValidUntil: reactivatedPlanWindow.planValidUntil
  }

  const {
    worker: workerAfterCharge,
    transactions: transactionsAfterCharge
  } = await settleWorkerDailyChargeForToday({
    worker: workerReadyForActivation,
    workerPlan,
    transactions,
    now,
    note: `Daily worker plan charge deducted for ${now.slice(0, 10)} while activating worker access.`
  })

  const activationCandidate: LabourWorkerRecord = {
    ...workerAfterCharge,
    workerPausedByWorker: false,
    workerReactivatedAt: now,
    lastWalletDeductionDate: workerAfterCharge.lastWalletDeductionDate,
    status: worker.status === 'inactive_paused_by_worker' ? 'active' : worker.status
  }
  const nextStatus = deriveWorkerStatus(activationCandidate, workerPlan, transactionsAfterCharge)
  if (nextStatus !== 'active') {
    if (nextStatus === 'inactive_wallet_empty') {
      throw new Error('Insufficient wallet balance. Please recharge to activate worker access.')
    }
    if (nextStatus === 'inactive_subscription_expired') {
      throw new Error('Worker access cannot be activated until your plan validity is restored.')
    }
    throw new Error('Worker access cannot be activated until your account becomes eligible again.')
  }

  await updateLabourEntity('workers', worker.id, {
    walletBalance: activationCandidate.walletBalance,
    planValidFrom: activationCandidate.planValidFrom || null,
    planValidUntil: activationCandidate.planValidUntil || null,
    workerPausedByWorker: false,
    workerReactivatedAt: now,
    lastWalletDeductionDate: activationCandidate.lastWalletDeductionDate,
    status: nextStatus,
    isVisible: isWorkerRegistrationComplete(activationCandidate) && nextStatus === 'active'
  }, 'worker-wallet')

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
    suggestedAmount: resolveAssignedWorkerPlan(worker, snapshot.plans)?.planAmount || getWorkerPlan(snapshot.plans)?.planAmount || 50,
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

export const applyToWorkerJob = async (workerId: string, jobPostId: string, note?: string): Promise<WorkerJobApplyResult> => {
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
    resolveAssignedWorkerPlan(worker, snapshot.plans),
    snapshot.walletTransactions.filter(transaction => transaction.entityType === 'worker' && transaction.entityId === worker.id)
  )
  if (!activation.canViewCompanyDetails) {
    throw new Error('Recharge and keep your worker access active before applying to jobs.')
  }

  const jobCategory = snapshot.categories.find(category => category.id === jobPost.categoryId)
  const workerCategoryKeys = new Set(
    [
      ...worker.categoryIds,
      ...worker.categoryIds.map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name),
      ...worker.categoryIds.map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.slug)
    ]
      .map(normalizeComparableKey)
      .filter((value): value is string => value.length > 0)
  )
  const jobCategoryKeys = [jobPost.categoryId, jobCategory?.slug, jobCategory?.name]
    .map(normalizeComparableKey)
    .filter((value): value is string => value.length > 0)
  const categoryMatch = jobCategoryKeys.some(key => workerCategoryKeys.has(key))

  if (!categoryMatch) {
    throw new Error('This job is locked for your category. Please update your profile or choose matching category jobs.')
  }

  const existingApplication = snapshot.jobApplications.find(
    application => application.workerId === workerId && application.jobPostId === jobPostId
  )

  if (existingApplication) {
    return {
      dashboard: await getWorkerAppDashboard(workerId),
      deliveryDebug: []
    }
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

  const workerCategories = worker.categoryIds
    .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name)
    .filter((value): value is string => Boolean(value))
  const companyContactMobile = resolveCompanyContactMobile(company)
  const appliedAt = new Date().toISOString()

  try {
    await sendCompanyApplicationEmail({
      companyEmail: company.email,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      workerName: worker.fullName,
      workerCity: worker.city,
      workerMobile: worker.mobile,
      workerCategories,
      expectedDailyWage: worker.expectedDailyWage,
      note: note || '',
      jobTitle: jobPost.title,
      jobCity: jobPost.city,
      appliedAt
    })
  } catch (error) {
    console.error('Failed to send company application email', error)
  }

  let deliveryDebug: WorkerApplicationDeliveryDebugItem[] = []

  try {
    const whatsappResults = await Promise.allSettled([
      sendCompanyApplicationWhatsapp({
        companyContactMobile,
        companyName: company.companyName,
        workerName: worker.fullName,
        workerCity: worker.city,
        workerMobile: worker.mobile,
        workerCategories,
        expectedDailyWage: worker.expectedDailyWage,
        note: note || '',
        jobTitle: jobPost.title,
        appliedAt
      }),
      sendWorkerApplicationConfirmationWhatsapp({
        workerMobile: worker.mobile,
        workerName: worker.fullName,
        companyName: company.companyName,
        contactPerson: company.contactPerson,
        companyCity: company.city,
        companyMobile: companyContactMobile,
        jobTitle: jobPost.title
      })
    ])

    deliveryDebug = whatsappResults.map((result, index) => {
      const recipient = index === 0 ? 'company' : 'worker'
      if (result.status === 'fulfilled') {
        return {
          recipient,
          channel: 'whatsapp',
          status: result.value.accepted ? 'accepted' : 'skipped',
          reason: result.value.accepted ? 'accepted' : (result.value.reason || 'skipped'),
          messageId: result.value.messageId || undefined,
          messageStatus: result.value.messageStatus || undefined,
          recipientWaId: result.value.recipientWaId || undefined
        }
      }

      return {
        recipient,
        channel: 'whatsapp',
        status: 'failed',
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason || 'unknown-error')
      }
    })

    console.log('Worker application WhatsApp delivery summary', {
      workerId,
      jobPostId,
      companyId: company.id,
      deliveryDebug
    })

    whatsappResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.accepted) {
        console.warn(
          index === 0
            ? 'Company WhatsApp application alert skipped'
            : 'Worker WhatsApp application confirmation skipped',
          result.value
        )
      } else if (result.status === 'rejected') {
        console.error(
          index === 0
            ? 'Failed to send company WhatsApp application alert'
            : 'Failed to send worker WhatsApp application confirmation',
          result.reason
        )
      }
    })
  } catch (error) {
    console.error('Failed to send worker/company WhatsApp alerts', error)
    deliveryDebug = [
      {
        recipient: 'company',
        channel: 'whatsapp',
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown-error'
      },
      {
        recipient: 'worker',
        channel: 'whatsapp',
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown-error'
      }
    ]
  }

  return {
    dashboard: await getWorkerAppDashboard(workerId),
    deliveryDebug
  }
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
