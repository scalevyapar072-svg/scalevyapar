import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export type LabourEntityType = 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts'
export type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'blocked'
export type CompanyStatus = 'pending' | 'active' | 'inactive' | 'blocked'
export type JobPostStatus = 'draft' | 'live' | 'expired' | 'paused'
export type PlanAudience = 'worker' | 'company'
export type DemandLevel = 'high' | 'medium' | 'low'
export type WorkerAvailability = 'available_today' | 'available_this_week' | 'not_available'

export interface LabourCategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  demandLevel: DemandLevel
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LabourPlanRecord {
  id: string
  audience: PlanAudience
  name: string
  categoryId?: string
  registrationFee: number
  walletCredit: number
  planAmount: number
  validityDays: number
  dailyCharge: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LabourWorkerRecord {
  id: string
  fullName: string
  mobile: string
  city: string
  experienceYears: number
  expectedDailyWage: number
  walletBalance: number
  status: WorkerStatus
  availability: WorkerAvailability
  isVisible: boolean
  categoryIds: string[]
  createdAt: string
  updatedAt: string
}

export interface LabourCompanyRecord {
  id: string
  companyName: string
  contactPerson: string
  mobile: string
  city: string
  categoryIds: string[]
  status: CompanyStatus
  registrationFeePaid: boolean
  activePlan: string
  createdAt: string
  updatedAt: string
}

export interface LabourJobPostRecord {
  id: string
  companyId: string
  categoryId: string
  title: string
  description: string
  city: string
  workersNeeded: number
  wageAmount: number
  validityDays: number
  status: JobPostStatus
  publishedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface LabourAuditLogRecord {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: LabourEntityType
  entityId: string
  summary: string
  actor: string
  createdAt: string
}

export interface LabourMarketplaceData {
  categories: LabourCategoryRecord[]
  plans: LabourPlanRecord[]
  workers: LabourWorkerRecord[]
  companies: LabourCompanyRecord[]
  jobPosts: LabourJobPostRecord[]
  auditLogs: LabourAuditLogRecord[]
}

export interface LabourMarketplaceSnapshot extends LabourMarketplaceData {
  stats: {
    activeWorkers: number
    inactiveWorkers: number
    activeCompanies: number
    liveJobPosts: number
    totalWalletBalance: number
    recentAuditLogs: LabourAuditLogRecord[]
  }
  storage: 'supabase' | 'json'
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-marketplace.json')

const STORAGE_TABLES = {
  categories: 'labour_categories',
  plans: 'labour_plans',
  workers: 'labour_workers',
  companies: 'labour_companies',
  jobPosts: 'labour_job_posts',
  auditLogs: 'labour_audit_logs'
} as const

const defaultData: LabourMarketplaceData = {
  categories: [
    {
      id: 'cat-stitching',
      name: 'Stitching Karighar',
      slug: 'stitching-karighar',
      description: 'Daily-basis stitching karighars for garments and boutique production.',
      demandLevel: 'high',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'cat-embroidery',
      name: 'Embroidery Worker',
      slug: 'embroidery-worker',
      description: 'Machine embroidery and hand embroidery workers.',
      demandLevel: 'high',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'cat-electrician',
      name: 'Electrician',
      slug: 'electrician',
      description: 'On-demand electricians for site work, maintenance and setup.',
      demandLevel: 'medium',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'cat-printer-labour',
      name: 'Printer Labour',
      slug: 'printer-labour',
      description: 'Printing press labour and print setup helpers.',
      demandLevel: 'medium',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  plans: [
    {
      id: 'plan-worker-basic',
      audience: 'worker',
      name: 'Worker Access 10 Days',
      registrationFee: 50,
      walletCredit: 50,
      planAmount: 50,
      validityDays: 10,
      dailyCharge: 5,
      description: 'Opening worker wallet with 10 active days at Rs 5 deduction per day.',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'plan-company-basic',
      audience: 'company',
      name: 'Company Basic 3 Days',
      registrationFee: 100,
      walletCredit: 0,
      planAmount: 200,
      validityDays: 3,
      dailyCharge: 0,
      description: 'General company posting plan for any daily worker requirement.',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'plan-company-stitching',
      audience: 'company',
      name: 'Stitching Karighar Priority 3 Days',
      categoryId: 'cat-stitching',
      registrationFee: 100,
      walletCredit: 0,
      planAmount: 300,
      validityDays: 3,
      dailyCharge: 0,
      description: 'Category-specific premium posting plan for stitching karighar demand.',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  workers: [
    {
      id: 'worker-sajid',
      fullName: 'Sajid Ansari',
      mobile: '9876543210',
      city: 'Surat',
      experienceYears: 6,
      expectedDailyWage: 950,
      walletBalance: 40,
      status: 'active',
      availability: 'available_today',
      isVisible: true,
      categoryIds: ['cat-stitching', 'cat-embroidery'],
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'worker-rahul',
      fullName: 'Rahul Sahu',
      mobile: '9812345678',
      city: 'Jaipur',
      experienceYears: 3,
      expectedDailyWage: 800,
      walletBalance: 0,
      status: 'inactive_wallet_empty',
      availability: 'available_this_week',
      isVisible: false,
      categoryIds: ['cat-electrician'],
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  companies: [
    {
      id: 'company-neelufer',
      companyName: 'Neelufer Creations',
      contactPerson: 'Neelu',
      mobile: '9898989898',
      city: 'Surat',
      categoryIds: ['cat-stitching', 'cat-embroidery'],
      status: 'active',
      registrationFeePaid: true,
      activePlan: 'plan-company-stitching',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'company-printerhub',
      companyName: 'Printer Hub',
      contactPerson: 'Imran',
      mobile: '9765432100',
      city: 'Ahmedabad',
      categoryIds: ['cat-printer-labour'],
      status: 'pending',
      registrationFeePaid: false,
      activePlan: 'plan-company-basic',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  jobPosts: [
    {
      id: 'job-neelufer-stitching',
      companyId: 'company-neelufer',
      categoryId: 'cat-stitching',
      title: '10 Stitching Karighar Needed For Ladies Kurtis',
      description: 'Immediate requirement for experienced stitching karighars for daily production. Overtime available.',
      city: 'Surat',
      workersNeeded: 10,
      wageAmount: 950,
      validityDays: 3,
      status: 'live',
      publishedAt: '2026-04-25',
      expiresAt: '2026-04-28',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'job-printerhub-print',
      companyId: 'company-printerhub',
      categoryId: 'cat-printer-labour',
      title: 'Printing Labour For Night Shift',
      description: 'Need two helpers for machine setup and print handling for the next three days.',
      city: 'Ahmedabad',
      workersNeeded: 2,
      wageAmount: 850,
      validityDays: 3,
      status: 'draft',
      publishedAt: '2026-04-25',
      expiresAt: '2026-04-28',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  auditLogs: []
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toNumber = (value: unknown, fallback: number = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: unknown, fallback: boolean = false) => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true })

  try {
    await fs.access(DATA_FILE_PATH)
  } catch {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8')
  }
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const mapCategoryRow = (row: {
  id: string
  name: string
  slug: string
  description: string | null
  demand_level: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}): LabourCategoryRecord => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  demandLevel: (row.demand_level as DemandLevel | null) || 'medium',
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapPlanRow = (row: {
  id: string
  audience: string
  name: string
  category_id: string | null
  registration_fee: number | null
  wallet_credit: number | null
  plan_amount: number | null
  validity_days: number | null
  daily_charge: number | null
  description: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}): LabourPlanRecord => ({
  id: row.id,
  audience: row.audience as PlanAudience,
  name: row.name,
  categoryId: row.category_id || undefined,
  registrationFee: row.registration_fee ?? 0,
  walletCredit: row.wallet_credit ?? 0,
  planAmount: row.plan_amount ?? 0,
  validityDays: row.validity_days ?? 0,
  dailyCharge: row.daily_charge ?? 0,
  description: row.description || '',
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapWorkerRow = (row: {
  id: string
  full_name: string
  mobile: string
  city: string | null
  experience_years: number | null
  expected_daily_wage: number | null
  wallet_balance: number | null
  status: string | null
  availability: string | null
  is_visible: boolean | null
  category_ids: string[] | null
  created_at: string
  updated_at: string
}): LabourWorkerRecord => ({
  id: row.id,
  fullName: row.full_name,
  mobile: row.mobile,
  city: row.city || '',
  experienceYears: row.experience_years ?? 0,
  expectedDailyWage: row.expected_daily_wage ?? 0,
  walletBalance: row.wallet_balance ?? 0,
  status: (row.status as WorkerStatus | null) || 'pending',
  availability: (row.availability as WorkerAvailability | null) || 'available_today',
  isVisible: row.is_visible ?? true,
  categoryIds: row.category_ids || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapCompanyRow = (row: {
  id: string
  company_name: string
  contact_person: string
  mobile: string
  city: string | null
  category_ids: string[] | null
  status: string | null
  registration_fee_paid: boolean | null
  active_plan: string | null
  created_at: string
  updated_at: string
}): LabourCompanyRecord => ({
  id: row.id,
  companyName: row.company_name,
  contactPerson: row.contact_person,
  mobile: row.mobile,
  city: row.city || '',
  categoryIds: row.category_ids || [],
  status: (row.status as CompanyStatus | null) || 'pending',
  registrationFeePaid: row.registration_fee_paid ?? false,
  activePlan: row.active_plan || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapJobPostRow = (row: {
  id: string
  company_id: string
  category_id: string
  title: string
  description: string | null
  city: string | null
  workers_needed: number | null
  wage_amount: number | null
  validity_days: number | null
  status: string | null
  published_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}): LabourJobPostRecord => ({
  id: row.id,
  companyId: row.company_id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description || '',
  city: row.city || '',
  workersNeeded: row.workers_needed ?? 1,
  wageAmount: row.wage_amount ?? 0,
  validityDays: row.validity_days ?? 0,
  status: (row.status as JobPostStatus | null) || 'draft',
  publishedAt: row.published_at || '',
  expiresAt: row.expires_at || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapAuditLogRow = (row: {
  id: string
  action: string
  entity_type: string
  entity_id: string
  summary: string
  actor: string
  created_at: string
}): LabourAuditLogRecord => ({
  id: row.id,
  action: row.action as LabourAuditLogRecord['action'],
  entityType: row.entity_type as LabourEntityType,
  entityId: row.entity_id,
  summary: row.summary,
  actor: row.actor,
  createdAt: row.created_at
})

const appendAuditLog = (
  data: LabourMarketplaceData,
  action: LabourAuditLogRecord['action'],
  entityType: LabourEntityType,
  entityId: string,
  summary: string,
  actor: string
) => {
  data.auditLogs.unshift({
    id: createId('audit'),
    action,
    entityType,
    entityId,
    summary,
    actor,
    createdAt: new Date().toISOString()
  })
}

const normalizeCategory = (
  payload: Partial<LabourCategoryRecord>,
  existing?: LabourCategoryRecord
): LabourCategoryRecord => {
  const now = new Date().toISOString()
  const name = String(payload.name || existing?.name || '').trim()
  const slug = slugify(String(payload.slug || name || existing?.slug || 'category'))

  return {
    id: existing?.id || String(payload.id || createId('cat')),
    name,
    slug,
    description: String(payload.description || existing?.description || '').trim(),
    demandLevel: (payload.demandLevel || existing?.demandLevel || 'medium') as DemandLevel,
    isActive: toBoolean(payload.isActive, existing?.isActive ?? true),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizePlan = (
  payload: Partial<LabourPlanRecord>,
  existing?: LabourPlanRecord
): LabourPlanRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('plan')),
    audience: (payload.audience || existing?.audience || 'worker') as PlanAudience,
    name: String(payload.name || existing?.name || '').trim(),
    categoryId: payload.categoryId || existing?.categoryId || undefined,
    registrationFee: toNumber(payload.registrationFee, existing?.registrationFee ?? 0),
    walletCredit: toNumber(payload.walletCredit, existing?.walletCredit ?? 0),
    planAmount: toNumber(payload.planAmount, existing?.planAmount ?? 0),
    validityDays: toNumber(payload.validityDays, existing?.validityDays ?? 0),
    dailyCharge: toNumber(payload.dailyCharge, existing?.dailyCharge ?? 0),
    description: String(payload.description || existing?.description || '').trim(),
    isActive: toBoolean(payload.isActive, existing?.isActive ?? true),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeWorker = (
  payload: Partial<LabourWorkerRecord>,
  existing?: LabourWorkerRecord
): LabourWorkerRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('worker')),
    fullName: String(payload.fullName || existing?.fullName || '').trim(),
    mobile: String(payload.mobile || existing?.mobile || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    experienceYears: toNumber(payload.experienceYears, existing?.experienceYears ?? 0),
    expectedDailyWage: toNumber(payload.expectedDailyWage, existing?.expectedDailyWage ?? 0),
    walletBalance: toNumber(payload.walletBalance, existing?.walletBalance ?? 0),
    status: (payload.status || existing?.status || 'pending') as WorkerStatus,
    availability: (payload.availability || existing?.availability || 'available_today') as WorkerAvailability,
    isVisible: toBoolean(payload.isVisible, existing?.isVisible ?? true),
    categoryIds: toStringArray(payload.categoryIds || existing?.categoryIds || []),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeCompany = (
  payload: Partial<LabourCompanyRecord>,
  existing?: LabourCompanyRecord
): LabourCompanyRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('company')),
    companyName: String(payload.companyName || existing?.companyName || '').trim(),
    contactPerson: String(payload.contactPerson || existing?.contactPerson || '').trim(),
    mobile: String(payload.mobile || existing?.mobile || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    categoryIds: toStringArray(payload.categoryIds || existing?.categoryIds || []),
    status: (payload.status || existing?.status || 'pending') as CompanyStatus,
    registrationFeePaid: toBoolean(payload.registrationFeePaid, existing?.registrationFeePaid ?? false),
    activePlan: String(payload.activePlan || existing?.activePlan || '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const addDays = (dateValue: string, days: number) => {
  const base = new Date(dateValue)
  if (Number.isNaN(base.getTime())) {
    return ''
  }

  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

const normalizeJobPost = (
  payload: Partial<LabourJobPostRecord>,
  existing?: LabourJobPostRecord
): LabourJobPostRecord => {
  const now = new Date().toISOString()
  const validityDays = toNumber(payload.validityDays, existing?.validityDays ?? 3)
  const publishedAt = String(payload.publishedAt || existing?.publishedAt || new Date().toISOString().slice(0, 10))
  const expiresAt = String(payload.expiresAt || existing?.expiresAt || addDays(publishedAt, validityDays))

  return {
    id: existing?.id || String(payload.id || createId('job')),
    companyId: String(payload.companyId || existing?.companyId || '').trim(),
    categoryId: String(payload.categoryId || existing?.categoryId || '').trim(),
    title: String(payload.title || existing?.title || '').trim(),
    description: String(payload.description || existing?.description || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    workersNeeded: toNumber(payload.workersNeeded, existing?.workersNeeded ?? 1),
    wageAmount: toNumber(payload.wageAmount, existing?.wageAmount ?? 0),
    validityDays,
    status: (payload.status || existing?.status || 'draft') as JobPostStatus,
    publishedAt,
    expiresAt,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const readJsonData = async (): Promise<LabourMarketplaceData> => {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf8')
  const parsed = JSON.parse(raw) as LabourMarketplaceData

  return {
    categories: parsed.categories || [],
    plans: parsed.plans || [],
    workers: parsed.workers || [],
    companies: parsed.companies || [],
    jobPosts: parsed.jobPosts || [],
    auditLogs: parsed.auditLogs || []
  }
}

const writeJsonData = async (data: LabourMarketplaceData) => {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

const buildSnapshot = (data: LabourMarketplaceData, storage: 'supabase' | 'json'): LabourMarketplaceSnapshot => ({
  ...data,
  stats: {
    activeWorkers: data.workers.filter(worker => worker.status === 'active').length,
    inactiveWorkers: data.workers.filter(worker => worker.status !== 'active').length,
    activeCompanies: data.companies.filter(company => company.status === 'active').length,
    liveJobPosts: data.jobPosts.filter(job => job.status === 'live').length,
    totalWalletBalance: data.workers.reduce((sum, worker) => sum + worker.walletBalance, 0),
    recentAuditLogs: data.auditLogs.slice(0, 8)
  },
  storage
})

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const getStorageBackend = async (): Promise<'supabase' | 'json'> => {
  const { error } = await supabaseAdmin
    .from(STORAGE_TABLES.categories)
    .select('id')
    .limit(1)

  return error && isMissingSupabaseTableError(error.message) ? 'json' : 'supabase'
}

const readSupabaseData = async (): Promise<LabourMarketplaceData> => {
  const [
    categoriesResult,
    plansResult,
    workersResult,
    companiesResult,
    jobPostsResult,
    auditLogsResult
  ] = await Promise.all([
    supabaseAdmin.from(STORAGE_TABLES.categories).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.plans).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.workers).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.companies).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.jobPosts).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.auditLogs).select('*').order('created_at', { ascending: false })
  ])

  const errors = [
    categoriesResult.error,
    plansResult.error,
    workersResult.error,
    companiesResult.error,
    jobPostsResult.error,
    auditLogsResult.error
  ].filter(Boolean)

  if (errors.length > 0) {
    throw new Error(errors.map(error => error?.message).join('; '))
  }

  return {
    categories: (categoriesResult.data || []).map(mapCategoryRow),
    plans: (plansResult.data || []).map(mapPlanRow),
    workers: (workersResult.data || []).map(mapWorkerRow),
    companies: (companiesResult.data || []).map(mapCompanyRow),
    jobPosts: (jobPostsResult.data || []).map(mapJobPostRow),
    auditLogs: (auditLogsResult.data || []).map(mapAuditLogRow)
  }
}

const seedSupabaseFromJson = async (data: LabourMarketplaceData) => {
  const categoriesPayload = data.categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    demand_level: category.demandLevel,
    is_active: category.isActive,
    created_at: category.createdAt,
    updated_at: category.updatedAt
  }))

  const plansPayload = data.plans.map(plan => ({
    id: plan.id,
    audience: plan.audience,
    name: plan.name,
    category_id: plan.categoryId || null,
    registration_fee: plan.registrationFee,
    wallet_credit: plan.walletCredit,
    plan_amount: plan.planAmount,
    validity_days: plan.validityDays,
    daily_charge: plan.dailyCharge,
    description: plan.description,
    is_active: plan.isActive,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt
  }))

  const workersPayload = data.workers.map(worker => ({
    id: worker.id,
    full_name: worker.fullName,
    mobile: worker.mobile,
    city: worker.city,
    experience_years: worker.experienceYears,
    expected_daily_wage: worker.expectedDailyWage,
    wallet_balance: worker.walletBalance,
    status: worker.status,
    availability: worker.availability,
    is_visible: worker.isVisible,
    category_ids: worker.categoryIds,
    created_at: worker.createdAt,
    updated_at: worker.updatedAt
  }))

  const companiesPayload = data.companies.map(company => ({
    id: company.id,
    company_name: company.companyName,
    contact_person: company.contactPerson,
    mobile: company.mobile,
    city: company.city,
    category_ids: company.categoryIds,
    status: company.status,
    registration_fee_paid: company.registrationFeePaid,
    active_plan: company.activePlan,
    created_at: company.createdAt,
    updated_at: company.updatedAt
  }))

  const jobPostsPayload = data.jobPosts.map(jobPost => ({
    id: jobPost.id,
    company_id: jobPost.companyId,
    category_id: jobPost.categoryId,
    title: jobPost.title,
    description: jobPost.description,
    city: jobPost.city,
    workers_needed: jobPost.workersNeeded,
    wage_amount: jobPost.wageAmount,
    validity_days: jobPost.validityDays,
    status: jobPost.status,
    published_at: jobPost.publishedAt || null,
    expires_at: jobPost.expiresAt || null,
    created_at: jobPost.createdAt,
    updated_at: jobPost.updatedAt
  }))

  const auditLogsPayload = data.auditLogs.map(log => ({
    id: log.id,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    summary: log.summary,
    actor: log.actor,
    created_at: log.createdAt
  }))

  const operations = [
    supabaseAdmin.from(STORAGE_TABLES.categories).upsert(categoriesPayload, { onConflict: 'id' }),
    supabaseAdmin.from(STORAGE_TABLES.plans).upsert(plansPayload, { onConflict: 'id' }),
    supabaseAdmin.from(STORAGE_TABLES.workers).upsert(workersPayload, { onConflict: 'id' }),
    supabaseAdmin.from(STORAGE_TABLES.companies).upsert(companiesPayload, { onConflict: 'id' }),
    supabaseAdmin.from(STORAGE_TABLES.jobPosts).upsert(jobPostsPayload, { onConflict: 'id' })
  ]

  if (auditLogsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.auditLogs).upsert(auditLogsPayload, { onConflict: 'id' }))
  }

  const results = await Promise.all(operations)
  const errors = results.map(result => result.error).filter(Boolean)
  if (errors.length > 0) {
    throw new Error(errors.map(error => error?.message).join('; '))
  }
}

export const syncLabourJsonToSupabase = async (): Promise<LabourMarketplaceSnapshot> => {
  const backend = await getStorageBackend()
  if (backend !== 'supabase') {
    throw new Error('Supabase labour tables are not available yet. Run the SQL migration first.')
  }

  const jsonData = await readJsonData()
  await seedSupabaseFromJson(jsonData)
  const supabaseData = await readSupabaseData()
  return buildSnapshot(supabaseData, 'supabase')
}

const readDataWithStorage = async (): Promise<{ data: LabourMarketplaceData; storage: 'supabase' | 'json' }> => {
  const backend = await getStorageBackend()
  if (backend === 'supabase') {
    return {
      data: await readSupabaseData(),
      storage: 'supabase'
    }
  }

  return {
    data: await readJsonData(),
    storage: 'json'
  }
}

const writeSupabaseAuditLog = async (
  action: LabourAuditLogRecord['action'],
  entityType: LabourEntityType,
  entityId: string,
  summary: string,
  actor: string
) => {
  const { error } = await supabaseAdmin.from(STORAGE_TABLES.auditLogs).insert({
    id: createId('audit'),
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    actor,
    created_at: new Date().toISOString()
  })

  if (error) {
    throw new Error(`Failed to write labour audit log: ${error.message}`)
  }
}

export const getLabourMarketplaceSnapshot = async (): Promise<LabourMarketplaceSnapshot> => {
  const { data, storage } = await readDataWithStorage()
  return buildSnapshot(data, storage)
}

export const createLabourEntity = async (
  entityType: LabourEntityType,
  payload: Record<string, unknown>,
  actor: string
) => {
  const backend = await getStorageBackend()
  if (backend === 'json') {
    const data = await readJsonData()

    switch (entityType) {
      case 'categories': {
        const record = normalizeCategory(payload)
        data.categories.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created category ${record.name}`, actor)
        break
      }
      case 'plans': {
        const record = normalizePlan(payload)
        data.plans.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created plan ${record.name}`, actor)
        break
      }
      case 'workers': {
        const record = normalizeWorker(payload)
        data.workers.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created worker ${record.fullName}`, actor)
        break
      }
      case 'companies': {
        const record = normalizeCompany(payload)
        data.companies.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created company ${record.companyName}`, actor)
        break
      }
      case 'jobPosts': {
        const record = normalizeJobPost(payload)
        data.jobPosts.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created job post ${record.title}`, actor)
        break
      }
    }

    await writeJsonData(data)
    return buildSnapshot(data, 'json')
  }

  switch (entityType) {
    case 'categories': {
      const record = normalizeCategory(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.categories).insert({
        id: record.id,
        name: record.name,
        slug: record.slug,
        description: record.description,
        demand_level: record.demandLevel,
        is_active: record.isActive,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour category: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created category ${record.name}`, actor)
      break
    }
    case 'plans': {
      const record = normalizePlan(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).insert({
        id: record.id,
        audience: record.audience,
        name: record.name,
        category_id: record.categoryId || null,
        registration_fee: record.registrationFee,
        wallet_credit: record.walletCredit,
        plan_amount: record.planAmount,
        validity_days: record.validityDays,
        daily_charge: record.dailyCharge,
        description: record.description,
        is_active: record.isActive,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour plan: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created plan ${record.name}`, actor)
      break
    }
    case 'workers': {
      const record = normalizeWorker(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).insert({
        id: record.id,
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        wallet_balance: record.walletBalance,
        status: record.status,
        availability: record.availability,
        is_visible: record.isVisible,
        category_ids: record.categoryIds,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour worker: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created worker ${record.fullName}`, actor)
      break
    }
    case 'companies': {
      const record = normalizeCompany(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert({
        id: record.id,
        company_name: record.companyName,
        contact_person: record.contactPerson,
        mobile: record.mobile,
        city: record.city,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour company: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created company ${record.companyName}`, actor)
      break
    }
    case 'jobPosts': {
      const record = normalizeJobPost(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobPosts).insert({
        id: record.id,
        company_id: record.companyId,
        category_id: record.categoryId,
        title: record.title,
        description: record.description,
        city: record.city,
        workers_needed: record.workersNeeded,
        wage_amount: record.wageAmount,
        validity_days: record.validityDays,
        status: record.status,
        published_at: record.publishedAt || null,
        expires_at: record.expiresAt || null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour job post: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created job post ${record.title}`, actor)
      break
    }
  }

  const supabaseData = await readSupabaseData()
  return buildSnapshot(supabaseData, 'supabase')
}

export const updateLabourEntity = async (
  entityType: LabourEntityType,
  id: string,
  payload: Record<string, unknown>,
  actor: string
) => {
  const backend = await getStorageBackend()
  if (backend === 'json') {
    const data = await readJsonData()

    switch (entityType) {
      case 'categories': {
        const index = data.categories.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeCategory(payload, data.categories[index])
        data.categories[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated category ${updated.name}`, actor)
        break
      }
      case 'plans': {
        const index = data.plans.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizePlan(payload, data.plans[index])
        data.plans[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated plan ${updated.name}`, actor)
        break
      }
      case 'workers': {
        const index = data.workers.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeWorker(payload, data.workers[index])
        data.workers[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated worker ${updated.fullName}`, actor)
        break
      }
      case 'companies': {
        const index = data.companies.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeCompany(payload, data.companies[index])
        data.companies[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated company ${updated.companyName}`, actor)
        break
      }
      case 'jobPosts': {
        const index = data.jobPosts.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeJobPost(payload, data.jobPosts[index])
        data.jobPosts[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated job post ${updated.title}`, actor)
        break
      }
    }

    await writeJsonData(data)
    return buildSnapshot(data, 'json')
  }

  switch (entityType) {
    case 'categories': {
      const existing = (await readSupabaseData()).categories.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeCategory(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.categories).update({
        name: record.name,
        slug: record.slug,
        description: record.description,
        demand_level: record.demandLevel,
        is_active: record.isActive,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour category: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated category ${record.name}`, actor)
      break
    }
    case 'plans': {
      const existing = (await readSupabaseData()).plans.find(record => record.id === id)
      if (!existing) return null
      const record = normalizePlan(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).update({
        audience: record.audience,
        name: record.name,
        category_id: record.categoryId || null,
        registration_fee: record.registrationFee,
        wallet_credit: record.walletCredit,
        plan_amount: record.planAmount,
        validity_days: record.validityDays,
        daily_charge: record.dailyCharge,
        description: record.description,
        is_active: record.isActive,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour plan: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated plan ${record.name}`, actor)
      break
    }
    case 'workers': {
      const existing = (await readSupabaseData()).workers.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeWorker(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).update({
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        wallet_balance: record.walletBalance,
        status: record.status,
        availability: record.availability,
        is_visible: record.isVisible,
        category_ids: record.categoryIds,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour worker: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated worker ${record.fullName}`, actor)
      break
    }
    case 'companies': {
      const existing = (await readSupabaseData()).companies.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeCompany(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update({
        company_name: record.companyName,
        contact_person: record.contactPerson,
        mobile: record.mobile,
        city: record.city,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour company: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated company ${record.companyName}`, actor)
      break
    }
    case 'jobPosts': {
      const existing = (await readSupabaseData()).jobPosts.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeJobPost(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobPosts).update({
        company_id: record.companyId,
        category_id: record.categoryId,
        title: record.title,
        description: record.description,
        city: record.city,
        workers_needed: record.workersNeeded,
        wage_amount: record.wageAmount,
        validity_days: record.validityDays,
        status: record.status,
        published_at: record.publishedAt || null,
        expires_at: record.expiresAt || null,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour job post: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated job post ${record.title}`, actor)
      break
    }
  }

  const supabaseData = await readSupabaseData()
  return buildSnapshot(supabaseData, 'supabase')
}

export const deleteLabourEntity = async (
  entityType: LabourEntityType,
  id: string,
  actor: string
) => {
  const backend = await getStorageBackend()
  if (backend === 'json') {
    const data = await readJsonData()

    const removeById = <T extends { id: string }>(items: T[]) => {
      const record = items.find(item => item.id === id)
      if (!record) return { record: null, nextItems: items }
      return { record, nextItems: items.filter(item => item.id !== id) }
    }

    switch (entityType) {
      case 'categories': {
        const { record, nextItems } = removeById(data.categories)
        if (!record) return null
        data.categories = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted category ${record.name}`, actor)
        break
      }
      case 'plans': {
        const { record, nextItems } = removeById(data.plans)
        if (!record) return null
        data.plans = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted plan ${record.name}`, actor)
        break
      }
      case 'workers': {
        const { record, nextItems } = removeById(data.workers)
        if (!record) return null
        data.workers = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted worker ${record.fullName}`, actor)
        break
      }
      case 'companies': {
        const { record, nextItems } = removeById(data.companies)
        if (!record) return null
        data.companies = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted company ${record.companyName}`, actor)
        break
      }
      case 'jobPosts': {
        const { record, nextItems } = removeById(data.jobPosts)
        if (!record) return null
        data.jobPosts = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted job post ${record.title}`, actor)
        break
      }
    }

    await writeJsonData(data)
    return buildSnapshot(data, 'json')
  }

  let summary = ''

  switch (entityType) {
    case 'categories': {
      const existing = (await readSupabaseData()).categories.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted category ${existing.name}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.categories).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour category: ${error.message}`)
      break
    }
    case 'plans': {
      const existing = (await readSupabaseData()).plans.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted plan ${existing.name}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour plan: ${error.message}`)
      break
    }
    case 'workers': {
      const existing = (await readSupabaseData()).workers.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted worker ${existing.fullName}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour worker: ${error.message}`)
      break
    }
    case 'companies': {
      const existing = (await readSupabaseData()).companies.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted company ${existing.companyName}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour company: ${error.message}`)
      break
    }
    case 'jobPosts': {
      const existing = (await readSupabaseData()).jobPosts.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted job post ${existing.title}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobPosts).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour job post: ${error.message}`)
      break
    }
  }

  await writeSupabaseAuditLog('delete', entityType, id, summary, actor)
  const supabaseData = await readSupabaseData()
  return buildSnapshot(supabaseData, 'supabase')
}
