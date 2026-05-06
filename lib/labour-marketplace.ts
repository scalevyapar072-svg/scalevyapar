import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export type LabourEntityType =
  | 'categories'
  | 'plans'
  | 'workers'
  | 'companies'
  | 'jobPosts'
  | 'jobApplications'
  | 'savedJobs'
  | 'workerNotifications'
  | 'walletTransactions'
  | 'rechargeRequests'
export type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'blocked' | 'rejected'
export type WorkerIdentityProofType = '' | 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'other'
export type CompanyStatus = 'pending' | 'active' | 'inactive' | 'blocked'
export type JobPostStatus = 'draft' | 'live' | 'expired' | 'paused'
export type PlanAudience = 'worker' | 'company'
export type DemandLevel = 'high' | 'medium' | 'low'
export type WorkerAvailability = 'available_today' | 'available_this_week' | 'not_available'
export type WalletEntityType = 'worker' | 'company'
export type WalletTransactionType = 'registration_fee' | 'wallet_deduction' | 'plan_purchase' | 'wallet_recharge' | 'manual_adjustment'
export type WalletTransactionDirection = 'credit' | 'debit'
export type WalletTransactionStatus = 'pending' | 'completed' | 'attention' | 'failed'
export type RechargeRequestType = 'worker_recharge' | 'company_follow_up' | 'worker_support'
export type RechargeRequestPriority = 'high' | 'medium' | 'low'
export type RechargeRequestStatus = 'open' | 'contacted' | 'resolved' | 'closed'
export type JobApplicationStatus = 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
export type WorkerNotificationType = 'application_submitted' | 'job_saved' | 'application_status' | 'wallet_reminder'
export type WorkerNotificationPriority = 'high' | 'medium' | 'low'

export interface LabourCategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  showOnHome: boolean
  homeOrder: number
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
  homeCity: string
  address: string
  profilePhotoPath: string
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  walletBalance: number
  registrationFeePaid: boolean
  status: WorkerStatus
  availability: WorkerAvailability
  isVisible: boolean
  categoryIds: string[]
  identityProofType: WorkerIdentityProofType
  identityProofNumber: string
  identityProofPath: string
  registrationCompletedAt: string
  createdAt: string
  updatedAt: string
}

export interface LabourCompanyRecord {
  id: string
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  contactMobile: string
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
  locationLabel: string
  latitude: number | null
  longitude: number | null
  workersNeeded: number
  wageAmount: number
  validityDays: number
  status: JobPostStatus
  publishedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface LabourJobApplicationRecord {
  id: string
  workerId: string
  jobPostId: string
  companyId: string
  status: JobApplicationStatus
  note: string
  appliedAt: string
  createdAt: string
  updatedAt: string
}

export interface LabourSavedJobRecord {
  id: string
  workerId: string
  jobPostId: string
  createdAt: string
  updatedAt: string
}

export interface LabourWorkerNotificationRecord {
  id: string
  workerId: string
  type: WorkerNotificationType
  title: string
  message: string
  relatedJobPostId?: string
  relatedCompanyId?: string
  isRead: boolean
  priority: WorkerNotificationPriority
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

export interface LabourWalletTransactionRecord {
  id: string
  entityType: WalletEntityType
  entityId: string
  entityName: string
  city: string
  transactionType: WalletTransactionType
  amount: number
  direction: WalletTransactionDirection
  status: WalletTransactionStatus
  reference: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface LabourRechargeRequestRecord {
  id: string
  requestType: RechargeRequestType
  relatedEntityType: WalletEntityType
  relatedEntityId: string
  name: string
  city: string
  categoryLabel: string
  statusLabel: string
  suggestedAmount: number
  priority: RechargeRequestPriority
  requestStatus: RechargeRequestStatus
  note: string
  createdAt: string
  updatedAt: string
}

export interface LabourMarketplaceData {
  categories: LabourCategoryRecord[]
  plans: LabourPlanRecord[]
  workers: LabourWorkerRecord[]
  companies: LabourCompanyRecord[]
  jobPosts: LabourJobPostRecord[]
  jobApplications: LabourJobApplicationRecord[]
  savedJobs: LabourSavedJobRecord[]
  workerNotifications: LabourWorkerNotificationRecord[]
  walletTransactions: LabourWalletTransactionRecord[]
  rechargeRequests: LabourRechargeRequestRecord[]
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
  jobApplications: 'labour_job_applications',
  savedJobs: 'labour_saved_jobs',
  workerNotifications: 'labour_worker_notifications',
  walletTransactions: 'labour_wallet_transactions',
  rechargeRequests: 'labour_recharge_requests',
  auditLogs: 'labour_audit_logs'
} as const

const defaultData: LabourMarketplaceData = {
  categories: [
    {
      id: 'cat-stitching',
      name: 'Stitching Karighar',
      slug: 'stitching-karighar',
      description: 'Daily-basis stitching karighars for garments and boutique production.',
      imageUrl: '',
      showOnHome: true,
      homeOrder: 1,
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
      imageUrl: '',
      showOnHome: true,
      homeOrder: 2,
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
      imageUrl: '',
      showOnHome: true,
      homeOrder: 4,
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
      imageUrl: '',
      showOnHome: true,
      homeOrder: 3,
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
      homeCity: 'Surat',
      address: 'Textile Market, Surat',
      profilePhotoPath: 'workers/worker-sajid/profile-photo-demo.jpg',
      skills: ['Ladies kurti stitching', 'Machine handling', 'Finishing'],
      experienceYears: 6,
      expectedDailyWage: 950,
      walletBalance: 40,
      registrationFeePaid: true,
      status: 'active',
      availability: 'available_today',
      isVisible: true,
      categoryIds: ['cat-stitching', 'cat-embroidery'],
      identityProofType: 'aadhaar',
      identityProofNumber: 'XXXX-XXXX-4321',
      identityProofPath: 'workers/worker-sajid/identity-proof-demo.pdf',
      registrationCompletedAt: '2026-04-25T00:00:00.000Z',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'worker-rahul',
      fullName: 'Rahul Sahu',
      mobile: '9812345678',
      city: 'Jaipur',
      homeCity: 'Jaipur',
      address: 'Mansarovar, Jaipur',
      profilePhotoPath: 'workers/worker-rahul/profile-photo-demo.jpg',
      skills: ['Site wiring', 'Repair work'],
      experienceYears: 3,
      expectedDailyWage: 800,
      walletBalance: 0,
      registrationFeePaid: false,
      status: 'inactive_wallet_empty',
      availability: 'available_this_week',
      isVisible: false,
      categoryIds: ['cat-electrician'],
      identityProofType: 'voter_id',
      identityProofNumber: 'VOTER-9812',
      identityProofPath: 'workers/worker-rahul/identity-proof-demo.pdf',
      registrationCompletedAt: '2026-04-25T00:00:00.000Z',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  companies: [
    {
      id: 'company-neelufer',
      companyName: 'Neelufer Creations',
      contactPerson: 'Neelu',
      email: 'neelufer@example.com',
      mobile: '9898989898',
      contactMobile: '9898989898',
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
      email: 'printerhub@example.com',
      mobile: '9765432100',
      contactMobile: '9765432100',
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
      locationLabel: '',
      latitude: null,
      longitude: null,
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
      locationLabel: '',
      latitude: null,
      longitude: null,
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
  jobApplications: [],
  savedJobs: [
    {
      id: 'saved-job-sajid',
      workerId: 'worker-sajid',
      jobPostId: 'job-neelufer-stitching',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  workerNotifications: [
    {
      id: 'notify-sajid-wallet',
      workerId: 'worker-sajid',
      type: 'wallet_reminder',
      title: 'Worker access is active',
      message: 'Your wallet is active. Keep balance above zero to keep company details unlocked.',
      relatedJobPostId: 'job-neelufer-stitching',
      relatedCompanyId: 'company-neelufer',
      isRead: false,
      priority: 'medium',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  walletTransactions: [
    {
      id: 'txn-worker-registration-sajid',
      entityType: 'worker',
      entityId: 'worker-sajid',
      entityName: 'Sajid Ansari',
      city: 'Surat',
      transactionType: 'registration_fee',
      amount: 50,
      direction: 'credit',
      status: 'completed',
      reference: 'worker-sajid',
      note: 'Initial worker registration and wallet opening fee.',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'txn-company-plan-neelufer',
      entityType: 'company',
      entityId: 'company-neelufer',
      entityName: 'Neelufer Creations',
      city: 'Surat',
      transactionType: 'plan_purchase',
      amount: 300,
      direction: 'credit',
      status: 'completed',
      reference: 'plan-company-stitching',
      note: 'Priority category plan for stitching karighar hiring.',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    }
  ],
  rechargeRequests: [
    {
      id: 'request-rahul-recharge',
      requestType: 'worker_recharge',
      relatedEntityType: 'worker',
      relatedEntityId: 'worker-rahul',
      name: 'Rahul Sahu',
      city: 'Jaipur',
      categoryLabel: 'Electrician',
      statusLabel: 'inactive_wallet_empty',
      suggestedAmount: 50,
      priority: 'high',
      requestStatus: 'open',
      note: 'Wallet is empty. Follow up for recharge to restore visibility.',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'request-printerhub-followup',
      requestType: 'company_follow_up',
      relatedEntityType: 'company',
      relatedEntityId: 'company-printerhub',
      name: 'Printer Hub',
      city: 'Ahmedabad',
      categoryLabel: 'Printer Labour',
      statusLabel: 'pending',
      suggestedAmount: 200,
      priority: 'high',
      requestStatus: 'open',
      note: 'Registration fee and company activation are still pending.',
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

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
  image_url: string | null
  show_on_home: boolean | null
  home_order: number | null
  demand_level: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}): LabourCategoryRecord => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  imageUrl: row.image_url || '',
  showOnHome: row.show_on_home ?? true,
  homeOrder: row.home_order ?? 0,
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
  home_city: string | null
  address: string | null
  profile_photo_path: string | null
  skills: string[] | null
  experience_years: number | null
  expected_daily_wage: number | null
  wallet_balance: number | null
  registration_fee_paid: boolean | null
  status: string | null
  availability: string | null
  is_visible: boolean | null
  category_ids: string[] | null
  identity_proof_type: string | null
  identity_proof_number: string | null
  identity_proof_path: string | null
  registration_completed_at: string | null
  created_at: string
  updated_at: string
}): LabourWorkerRecord => ({
  id: row.id,
  fullName: row.full_name,
  mobile: row.mobile,
  city: row.city || '',
  homeCity: row.home_city || '',
  address: row.address || '',
  profilePhotoPath: row.profile_photo_path || '',
  skills: row.skills || [],
  experienceYears: row.experience_years ?? 0,
  expectedDailyWage: row.expected_daily_wage ?? 0,
  walletBalance: row.wallet_balance ?? 0,
  registrationFeePaid: row.registration_fee_paid ?? false,
  status: (row.status as WorkerStatus | null) || 'pending',
  availability: (row.availability as WorkerAvailability | null) || 'available_today',
  isVisible: row.is_visible ?? true,
  categoryIds: row.category_ids || [],
  identityProofType: (row.identity_proof_type as WorkerIdentityProofType | null) || '',
  identityProofNumber: row.identity_proof_number || '',
  identityProofPath: row.identity_proof_path || '',
  registrationCompletedAt: row.registration_completed_at || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapCompanyRow = (row: {
  id: string
  company_name: string
  contact_person: string
  email: string | null
  mobile: string
  contact_mobile?: string | null
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
  email: row.email || '',
  mobile: row.mobile,
  contactMobile: row.contact_mobile || row.mobile || '',
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
  location_label: string | null
  latitude: number | null
  longitude: number | null
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
  locationLabel: row.location_label || '',
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
  workersNeeded: row.workers_needed ?? 1,
  wageAmount: row.wage_amount ?? 0,
  validityDays: row.validity_days ?? 0,
  status: (row.status as JobPostStatus | null) || 'draft',
  publishedAt: row.published_at || '',
  expiresAt: row.expires_at || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapJobApplicationRow = (row: {
  id: string
  worker_id: string
  job_post_id: string
  company_id: string
  status: string | null
  note: string | null
  applied_at: string | null
  created_at: string
  updated_at: string
}): LabourJobApplicationRecord => ({
  id: row.id,
  workerId: row.worker_id,
  jobPostId: row.job_post_id,
  companyId: row.company_id,
  status: (row.status as JobApplicationStatus | null) || 'submitted',
  note: row.note || '',
  appliedAt: row.applied_at || row.created_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapSavedJobRow = (row: {
  id: string
  worker_id: string
  job_post_id: string
  created_at: string
  updated_at: string
}): LabourSavedJobRecord => ({
  id: row.id,
  workerId: row.worker_id,
  jobPostId: row.job_post_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapWorkerNotificationRow = (row: {
  id: string
  worker_id: string
  type: string
  title: string
  message: string
  related_job_post_id: string | null
  related_company_id: string | null
  is_read: boolean | null
  priority: string | null
  created_at: string
  updated_at: string
}): LabourWorkerNotificationRecord => ({
  id: row.id,
  workerId: row.worker_id,
  type: (row.type as WorkerNotificationType | null) || 'wallet_reminder',
  title: row.title,
  message: row.message,
  relatedJobPostId: row.related_job_post_id || undefined,
  relatedCompanyId: row.related_company_id || undefined,
  isRead: row.is_read ?? false,
  priority: (row.priority as WorkerNotificationPriority | null) || 'medium',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapWalletTransactionRow = (row: {
  id: string
  entity_type: string
  entity_id: string
  entity_name: string
  city: string | null
  transaction_type: string
  amount: number | null
  direction: string
  status: string
  reference: string | null
  note: string | null
  created_at: string
  updated_at: string
}): LabourWalletTransactionRecord => ({
  id: row.id,
  entityType: row.entity_type as WalletEntityType,
  entityId: row.entity_id,
  entityName: row.entity_name,
  city: row.city || '',
  transactionType: row.transaction_type as WalletTransactionType,
  amount: row.amount ?? 0,
  direction: row.direction as WalletTransactionDirection,
  status: row.status as WalletTransactionStatus,
  reference: row.reference || '',
  note: row.note || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapRechargeRequestRow = (row: {
  id: string
  request_type: string
  related_entity_type: string
  related_entity_id: string
  name: string
  city: string | null
  category_label: string | null
  status_label: string | null
  suggested_amount: number | null
  priority: string
  request_status: string
  note: string | null
  created_at: string
  updated_at: string
}): LabourRechargeRequestRecord => ({
  id: row.id,
  requestType: row.request_type as RechargeRequestType,
  relatedEntityType: row.related_entity_type as WalletEntityType,
  relatedEntityId: row.related_entity_id,
  name: row.name,
  city: row.city || '',
  categoryLabel: row.category_label || '',
  statusLabel: row.status_label || '',
  suggestedAmount: row.suggested_amount ?? 0,
  priority: row.priority as RechargeRequestPriority,
  requestStatus: row.request_status as RechargeRequestStatus,
  note: row.note || '',
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
    imageUrl: String(payload.imageUrl || existing?.imageUrl || '').trim(),
    showOnHome: toBoolean(payload.showOnHome, existing?.showOnHome ?? true),
    homeOrder: toNumber(payload.homeOrder, existing?.homeOrder ?? 0),
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
    homeCity: String(payload.homeCity || existing?.homeCity || '').trim(),
    address: String(payload.address || existing?.address || '').trim(),
    profilePhotoPath: String(payload.profilePhotoPath || existing?.profilePhotoPath || '').trim(),
    skills: toStringArray(payload.skills || existing?.skills || []),
    experienceYears: toNumber(payload.experienceYears, existing?.experienceYears ?? 0),
    expectedDailyWage: toNumber(payload.expectedDailyWage, existing?.expectedDailyWage ?? 0),
    walletBalance: toNumber(payload.walletBalance, existing?.walletBalance ?? 0),
    registrationFeePaid: toBoolean(payload.registrationFeePaid, existing?.registrationFeePaid ?? false),
    status: (payload.status || existing?.status || 'pending') as WorkerStatus,
    availability: (payload.availability || existing?.availability || 'available_today') as WorkerAvailability,
    isVisible: toBoolean(payload.isVisible, existing?.isVisible ?? true),
    categoryIds: toStringArray(payload.categoryIds || existing?.categoryIds || []),
    identityProofType: (payload.identityProofType || existing?.identityProofType || '') as WorkerIdentityProofType,
    identityProofNumber: String(payload.identityProofNumber || existing?.identityProofNumber || '').trim(),
    identityProofPath: String(payload.identityProofPath || existing?.identityProofPath || '').trim(),
    registrationCompletedAt: String(payload.registrationCompletedAt || existing?.registrationCompletedAt || '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const isMissingWorkerRegistrationFeePaidColumnError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('registration_fee_paid') && (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  )
}

const isMissingCompanyContactMobileColumnError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('contact_mobile') && (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  )
}

const normalizeCompany = (
  payload: Partial<LabourCompanyRecord>,
  existing?: LabourCompanyRecord
): LabourCompanyRecord => {
  const now = new Date().toISOString()
  const primaryMobile = String(payload.mobile || existing?.mobile || '').trim()
  const contactMobile = String(payload.contactMobile || existing?.contactMobile || primaryMobile).trim()
  return {
    id: existing?.id || String(payload.id || createId('company')),
    companyName: String(payload.companyName || existing?.companyName || '').trim(),
    contactPerson: String(payload.contactPerson || existing?.contactPerson || '').trim(),
    email: String(payload.email || existing?.email || '').trim().toLowerCase(),
    mobile: primaryMobile,
    contactMobile,
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
    locationLabel: String(payload.locationLabel || existing?.locationLabel || '').trim(),
    latitude: toNullableNumber(payload.latitude ?? existing?.latitude ?? null),
    longitude: toNullableNumber(payload.longitude ?? existing?.longitude ?? null),
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

const normalizeJobApplication = (
  payload: Partial<LabourJobApplicationRecord>,
  existing?: LabourJobApplicationRecord
): LabourJobApplicationRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('application')),
    workerId: String(payload.workerId || existing?.workerId || '').trim(),
    jobPostId: String(payload.jobPostId || existing?.jobPostId || '').trim(),
    companyId: String(payload.companyId || existing?.companyId || '').trim(),
    status: (payload.status || existing?.status || 'submitted') as JobApplicationStatus,
    note: String(payload.note || existing?.note || '').trim(),
    appliedAt: String(payload.appliedAt || existing?.appliedAt || now),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeSavedJob = (
  payload: Partial<LabourSavedJobRecord>,
  existing?: LabourSavedJobRecord
): LabourSavedJobRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('saved-job')),
    workerId: String(payload.workerId || existing?.workerId || '').trim(),
    jobPostId: String(payload.jobPostId || existing?.jobPostId || '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeWorkerNotification = (
  payload: Partial<LabourWorkerNotificationRecord>,
  existing?: LabourWorkerNotificationRecord
): LabourWorkerNotificationRecord => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || String(payload.id || createId('notification')),
    workerId: String(payload.workerId || existing?.workerId || '').trim(),
    type: (payload.type || existing?.type || 'wallet_reminder') as WorkerNotificationType,
    title: String(payload.title || existing?.title || '').trim(),
    message: String(payload.message || existing?.message || '').trim(),
    relatedJobPostId: payload.relatedJobPostId || existing?.relatedJobPostId || undefined,
    relatedCompanyId: payload.relatedCompanyId || existing?.relatedCompanyId || undefined,
    isRead: toBoolean(payload.isRead, existing?.isRead ?? false),
    priority: (payload.priority || existing?.priority || 'medium') as WorkerNotificationPriority,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeWalletTransaction = (
  payload: Partial<LabourWalletTransactionRecord>,
  existing?: LabourWalletTransactionRecord
): LabourWalletTransactionRecord => {
  const now = new Date().toISOString()

  return {
    id: existing?.id || String(payload.id || createId('txn')),
    entityType: (payload.entityType || existing?.entityType || 'worker') as WalletEntityType,
    entityId: String(payload.entityId || existing?.entityId || '').trim(),
    entityName: String(payload.entityName || existing?.entityName || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    transactionType: (payload.transactionType || existing?.transactionType || 'wallet_recharge') as WalletTransactionType,
    amount: toNumber(payload.amount, existing?.amount ?? 0),
    direction: (payload.direction || existing?.direction || 'credit') as WalletTransactionDirection,
    status: (payload.status || existing?.status || 'completed') as WalletTransactionStatus,
    reference: String(payload.reference || existing?.reference || '').trim(),
    note: String(payload.note || existing?.note || '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const normalizeRechargeRequest = (
  payload: Partial<LabourRechargeRequestRecord>,
  existing?: LabourRechargeRequestRecord
): LabourRechargeRequestRecord => {
  const now = new Date().toISOString()

  return {
    id: existing?.id || String(payload.id || createId('request')),
    requestType: (payload.requestType || existing?.requestType || 'worker_recharge') as RechargeRequestType,
    relatedEntityType: (payload.relatedEntityType || existing?.relatedEntityType || 'worker') as WalletEntityType,
    relatedEntityId: String(payload.relatedEntityId || existing?.relatedEntityId || '').trim(),
    name: String(payload.name || existing?.name || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    categoryLabel: String(payload.categoryLabel || existing?.categoryLabel || '').trim(),
    statusLabel: String(payload.statusLabel || existing?.statusLabel || '').trim(),
    suggestedAmount: toNumber(payload.suggestedAmount, existing?.suggestedAmount ?? 0),
    priority: (payload.priority || existing?.priority || 'medium') as RechargeRequestPriority,
    requestStatus: (payload.requestStatus || existing?.requestStatus || 'open') as RechargeRequestStatus,
    note: String(payload.note || existing?.note || '').trim(),
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
    jobApplications: parsed.jobApplications || [],
    savedJobs: parsed.savedJobs || [],
    workerNotifications: parsed.workerNotifications || [],
    walletTransactions: parsed.walletTransactions || [],
    rechargeRequests: parsed.rechargeRequests || [],
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

const readOptionalSupabaseRows = async <TRow>(tableName: string) => {
  const result = await supabaseAdmin.from(tableName).select('*').order('created_at', { ascending: false })
  if (result.error && isMissingSupabaseTableError(result.error.message)) {
    return [] as TRow[]
  }

  if (result.error) {
    throw new Error(result.error.message)
  }

  return (result.data || []) as TRow[]
}

const readSupabaseData = async (): Promise<LabourMarketplaceData> => {
  const [
    categoriesResult,
    plansResult,
    workersResult,
    companiesResult,
    jobPostsResult,
    jobApplicationsRows,
    savedJobsRows,
    workerNotificationsRows,
    walletTransactionsRows,
    rechargeRequestsRows,
    auditLogsResult
  ] = await Promise.all([
    supabaseAdmin.from(STORAGE_TABLES.categories).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.plans).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.workers).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.companies).select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from(STORAGE_TABLES.jobPosts).select('*').order('created_at', { ascending: true }),
    readOptionalSupabaseRows<{
      id: string
      worker_id: string
      job_post_id: string
      company_id: string
      status: string | null
      note: string | null
      applied_at: string | null
      created_at: string
      updated_at: string
    }>(STORAGE_TABLES.jobApplications),
    readOptionalSupabaseRows<{
      id: string
      worker_id: string
      job_post_id: string
      created_at: string
      updated_at: string
    }>(STORAGE_TABLES.savedJobs),
    readOptionalSupabaseRows<{
      id: string
      worker_id: string
      type: string
      title: string
      message: string
      related_job_post_id: string | null
      related_company_id: string | null
      is_read: boolean | null
      priority: string | null
      created_at: string
      updated_at: string
    }>(STORAGE_TABLES.workerNotifications),
    readOptionalSupabaseRows<{
      id: string
      entity_type: string
      entity_id: string
      entity_name: string
      city: string | null
      transaction_type: string
      amount: number | null
      direction: string
      status: string
      reference: string | null
      note: string | null
      created_at: string
      updated_at: string
    }>(STORAGE_TABLES.walletTransactions),
    readOptionalSupabaseRows<{
      id: string
      request_type: string
      related_entity_type: string
      related_entity_id: string
      name: string
      city: string | null
      category_label: string | null
      status_label: string | null
      suggested_amount: number | null
      priority: string
      request_status: string
      note: string | null
      created_at: string
      updated_at: string
    }>(STORAGE_TABLES.rechargeRequests),
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
    jobApplications: jobApplicationsRows.map(mapJobApplicationRow),
    savedJobs: savedJobsRows.map(mapSavedJobRow),
    workerNotifications: workerNotificationsRows.map(mapWorkerNotificationRow),
    walletTransactions: walletTransactionsRows.map(mapWalletTransactionRow),
    rechargeRequests: rechargeRequestsRows.map(mapRechargeRequestRow),
    auditLogs: (auditLogsResult.data || []).map(mapAuditLogRow)
  }
}

const seedSupabaseFromJson = async (data: LabourMarketplaceData) => {
  const categoriesPayload = data.categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: category.imageUrl || null,
    show_on_home: category.showOnHome,
    home_order: category.homeOrder,
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
    profile_photo_path: worker.profilePhotoPath,
    skills: worker.skills,
    experience_years: worker.experienceYears,
    expected_daily_wage: worker.expectedDailyWage,
    wallet_balance: worker.walletBalance,
    registration_fee_paid: worker.registrationFeePaid,
    status: worker.status,
    availability: worker.availability,
    is_visible: worker.isVisible,
    category_ids: worker.categoryIds,
    identity_proof_type: worker.identityProofType,
    identity_proof_number: worker.identityProofNumber,
    identity_proof_path: worker.identityProofPath,
    registration_completed_at: worker.registrationCompletedAt || null,
    created_at: worker.createdAt,
    updated_at: worker.updatedAt
  }))

  const companiesPayload = data.companies.map(company => ({
    id: company.id,
    company_name: company.companyName,
    contact_person: company.contactPerson,
    email: company.email || null,
    mobile: company.mobile,
    contact_mobile: company.contactMobile || company.mobile,
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

  const jobApplicationsPayload = data.jobApplications.map(application => ({
    id: application.id,
    worker_id: application.workerId,
    job_post_id: application.jobPostId,
    company_id: application.companyId,
    status: application.status,
    note: application.note,
    applied_at: application.appliedAt,
    created_at: application.createdAt,
    updated_at: application.updatedAt
  }))

  const savedJobsPayload = data.savedJobs.map(savedJob => ({
    id: savedJob.id,
    worker_id: savedJob.workerId,
    job_post_id: savedJob.jobPostId,
    created_at: savedJob.createdAt,
    updated_at: savedJob.updatedAt
  }))

  const workerNotificationsPayload = data.workerNotifications.map(notification => ({
    id: notification.id,
    worker_id: notification.workerId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    related_job_post_id: notification.relatedJobPostId || null,
    related_company_id: notification.relatedCompanyId || null,
    is_read: notification.isRead,
    priority: notification.priority,
    created_at: notification.createdAt,
    updated_at: notification.updatedAt
  }))

  const walletTransactionsPayload = data.walletTransactions.map(transaction => ({
    id: transaction.id,
    entity_type: transaction.entityType,
    entity_id: transaction.entityId,
    entity_name: transaction.entityName,
    city: transaction.city,
    transaction_type: transaction.transactionType,
    amount: transaction.amount,
    direction: transaction.direction,
    status: transaction.status,
    reference: transaction.reference,
    note: transaction.note,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt
  }))

  const rechargeRequestsPayload = data.rechargeRequests.map(request => ({
    id: request.id,
    request_type: request.requestType,
    related_entity_type: request.relatedEntityType,
    related_entity_id: request.relatedEntityId,
    name: request.name,
    city: request.city,
    category_label: request.categoryLabel,
    status_label: request.statusLabel,
    suggested_amount: request.suggestedAmount,
    priority: request.priority,
    request_status: request.requestStatus,
    note: request.note,
    created_at: request.createdAt,
    updated_at: request.updatedAt
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

  if (jobApplicationsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.jobApplications).upsert(jobApplicationsPayload, { onConflict: 'id' }))
  }

  if (savedJobsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.savedJobs).upsert(savedJobsPayload, { onConflict: 'id' }))
  }

  if (workerNotificationsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.workerNotifications).upsert(workerNotificationsPayload, { onConflict: 'id' }))
  }

  if (walletTransactionsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.walletTransactions).upsert(walletTransactionsPayload, { onConflict: 'id' }))
  }

  if (rechargeRequestsPayload.length > 0) {
    operations.push(supabaseAdmin.from(STORAGE_TABLES.rechargeRequests).upsert(rechargeRequestsPayload, { onConflict: 'id' }))
  }

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
      case 'jobApplications': {
        const record = normalizeJobApplication(payload)
        data.jobApplications.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created job application ${record.jobPostId}`, actor)
        break
      }
      case 'savedJobs': {
        const record = normalizeSavedJob(payload)
        data.savedJobs.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created saved job ${record.jobPostId}`, actor)
        break
      }
      case 'workerNotifications': {
        const record = normalizeWorkerNotification(payload)
        data.workerNotifications.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created notification ${record.title}`, actor)
        break
      }
      case 'walletTransactions': {
        const record = normalizeWalletTransaction(payload)
        data.walletTransactions.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created wallet transaction ${record.reference || record.entityName}`, actor)
        break
      }
      case 'rechargeRequests': {
        const record = normalizeRechargeRequest(payload)
        data.rechargeRequests.unshift(record)
        appendAuditLog(data, 'create', entityType, record.id, `Created recharge request ${record.name}`, actor)
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
        image_url: record.imageUrl || null,
        show_on_home: record.showOnHome,
        home_order: record.homeOrder,
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
      const workerPayload = {
        id: record.id,
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        profile_photo_path: record.profilePhotoPath,
        skills: record.skills,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        wallet_balance: record.walletBalance,
        registration_fee_paid: record.registrationFeePaid,
        status: record.status,
        availability: record.availability,
        is_visible: record.isVisible,
        category_ids: record.categoryIds,
        identity_proof_type: record.identityProofType,
        identity_proof_number: record.identityProofNumber,
        identity_proof_path: record.identityProofPath,
        registration_completed_at: record.registrationCompletedAt || null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).insert(workerPayload)
      if (error && isMissingWorkerRegistrationFeePaidColumnError(error.message)) {
        const { registration_fee_paid, ...legacyWorkerPayload } = workerPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.workers).insert(legacyWorkerPayload))
      }
      if (error) throw new Error(`Failed to create labour worker: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created worker ${record.fullName}`, actor)
      break
    }
    case 'companies': {
      const record = normalizeCompany(payload)
      const companyPayload = {
        id: record.id,
        company_name: record.companyName,
        contact_person: record.contactPerson,
        email: record.email || null,
        mobile: record.mobile,
        contact_mobile: record.contactMobile || record.mobile,
        city: record.city,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(companyPayload)
      if (error && isMissingCompanyContactMobileColumnError(error.message)) {
        const { contact_mobile, ...legacyCompanyPayload } = companyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(legacyCompanyPayload))
      }
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
        location_label: record.locationLabel || null,
        latitude: record.latitude,
        longitude: record.longitude,
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
    case 'jobApplications': {
      const record = normalizeJobApplication(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobApplications).insert({
        id: record.id,
        worker_id: record.workerId,
        job_post_id: record.jobPostId,
        company_id: record.companyId,
        status: record.status,
        note: record.note,
        applied_at: record.appliedAt,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create labour job application: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created job application ${record.jobPostId}`, actor)
      break
    }
    case 'savedJobs': {
      const record = normalizeSavedJob(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.savedJobs).insert({
        id: record.id,
        worker_id: record.workerId,
        job_post_id: record.jobPostId,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create saved job: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created saved job ${record.jobPostId}`, actor)
      break
    }
    case 'workerNotifications': {
      const record = normalizeWorkerNotification(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workerNotifications).insert({
        id: record.id,
        worker_id: record.workerId,
        type: record.type,
        title: record.title,
        message: record.message,
        related_job_post_id: record.relatedJobPostId || null,
        related_company_id: record.relatedCompanyId || null,
        is_read: record.isRead,
        priority: record.priority,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create worker notification: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created notification ${record.title}`, actor)
      break
    }
    case 'walletTransactions': {
      const record = normalizeWalletTransaction(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).insert({
        id: record.id,
        entity_type: record.entityType,
        entity_id: record.entityId,
        entity_name: record.entityName,
        city: record.city,
        transaction_type: record.transactionType,
        amount: record.amount,
        direction: record.direction,
        status: record.status,
        reference: record.reference,
        note: record.note,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create wallet transaction: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created wallet transaction ${record.reference || record.entityName}`, actor)
      break
    }
    case 'rechargeRequests': {
      const record = normalizeRechargeRequest(payload)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.rechargeRequests).insert({
        id: record.id,
        request_type: record.requestType,
        related_entity_type: record.relatedEntityType,
        related_entity_id: record.relatedEntityId,
        name: record.name,
        city: record.city,
        category_label: record.categoryLabel,
        status_label: record.statusLabel,
        suggested_amount: record.suggestedAmount,
        priority: record.priority,
        request_status: record.requestStatus,
        note: record.note,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      })
      if (error) throw new Error(`Failed to create recharge request: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created recharge request ${record.name}`, actor)
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
      case 'jobApplications': {
        const index = data.jobApplications.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeJobApplication(payload, data.jobApplications[index])
        data.jobApplications[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated job application ${updated.jobPostId}`, actor)
        break
      }
      case 'savedJobs': {
        const index = data.savedJobs.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeSavedJob(payload, data.savedJobs[index])
        data.savedJobs[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated saved job ${updated.jobPostId}`, actor)
        break
      }
      case 'workerNotifications': {
        const index = data.workerNotifications.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeWorkerNotification(payload, data.workerNotifications[index])
        data.workerNotifications[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated notification ${updated.title}`, actor)
        break
      }
      case 'walletTransactions': {
        const index = data.walletTransactions.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeWalletTransaction(payload, data.walletTransactions[index])
        data.walletTransactions[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated wallet transaction ${updated.reference || updated.entityName}`, actor)
        break
      }
      case 'rechargeRequests': {
        const index = data.rechargeRequests.findIndex(record => record.id === id)
        if (index === -1) return null
        const updated = normalizeRechargeRequest(payload, data.rechargeRequests[index])
        data.rechargeRequests[index] = updated
        appendAuditLog(data, 'update', entityType, id, `Updated recharge request ${updated.name}`, actor)
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
        image_url: record.imageUrl || null,
        show_on_home: record.showOnHome,
        home_order: record.homeOrder,
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
      const workerPayload = {
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        profile_photo_path: record.profilePhotoPath,
        skills: record.skills,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        wallet_balance: record.walletBalance,
        registration_fee_paid: record.registrationFeePaid,
        status: record.status,
        availability: record.availability,
        is_visible: record.isVisible,
        category_ids: record.categoryIds,
        identity_proof_type: record.identityProofType,
        identity_proof_number: record.identityProofNumber,
        identity_proof_path: record.identityProofPath,
        registration_completed_at: record.registrationCompletedAt || null,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).update(workerPayload).eq('id', id)
      if (error && isMissingWorkerRegistrationFeePaidColumnError(error.message)) {
        const { registration_fee_paid, ...legacyWorkerPayload } = workerPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.workers).update(legacyWorkerPayload).eq('id', id))
      }
      if (error) throw new Error(`Failed to update labour worker: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated worker ${record.fullName}`, actor)
      break
    }
    case 'companies': {
      const existing = (await readSupabaseData()).companies.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeCompany(payload, existing)
      const companyPayload = {
        company_name: record.companyName,
        contact_person: record.contactPerson,
        email: record.email || null,
        mobile: record.mobile,
        contact_mobile: record.contactMobile || record.mobile,
        city: record.city,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(companyPayload).eq('id', id)
      if (error && isMissingCompanyContactMobileColumnError(error.message)) {
        const { contact_mobile, ...legacyCompanyPayload } = companyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(legacyCompanyPayload).eq('id', id))
      }
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
        location_label: record.locationLabel || null,
        latitude: record.latitude,
        longitude: record.longitude,
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
    case 'jobApplications': {
      const existing = (await readSupabaseData()).jobApplications.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeJobApplication(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobApplications).update({
        worker_id: record.workerId,
        job_post_id: record.jobPostId,
        company_id: record.companyId,
        status: record.status,
        note: record.note,
        applied_at: record.appliedAt,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update labour job application: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated job application ${record.jobPostId}`, actor)
      break
    }
    case 'savedJobs': {
      const existing = (await readSupabaseData()).savedJobs.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeSavedJob(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.savedJobs).update({
        worker_id: record.workerId,
        job_post_id: record.jobPostId,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update saved job: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated saved job ${record.jobPostId}`, actor)
      break
    }
    case 'workerNotifications': {
      const existing = (await readSupabaseData()).workerNotifications.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeWorkerNotification(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workerNotifications).update({
        worker_id: record.workerId,
        type: record.type,
        title: record.title,
        message: record.message,
        related_job_post_id: record.relatedJobPostId || null,
        related_company_id: record.relatedCompanyId || null,
        is_read: record.isRead,
        priority: record.priority,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update worker notification: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated notification ${record.title}`, actor)
      break
    }
    case 'walletTransactions': {
      const existing = (await readSupabaseData()).walletTransactions.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeWalletTransaction(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).update({
        entity_type: record.entityType,
        entity_id: record.entityId,
        entity_name: record.entityName,
        city: record.city,
        transaction_type: record.transactionType,
        amount: record.amount,
        direction: record.direction,
        status: record.status,
        reference: record.reference,
        note: record.note,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update wallet transaction: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated wallet transaction ${record.reference || record.entityName}`, actor)
      break
    }
    case 'rechargeRequests': {
      const existing = (await readSupabaseData()).rechargeRequests.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeRechargeRequest(payload, existing)
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.rechargeRequests).update({
        request_type: record.requestType,
        related_entity_type: record.relatedEntityType,
        related_entity_id: record.relatedEntityId,
        name: record.name,
        city: record.city,
        category_label: record.categoryLabel,
        status_label: record.statusLabel,
        suggested_amount: record.suggestedAmount,
        priority: record.priority,
        request_status: record.requestStatus,
        note: record.note,
        updated_at: record.updatedAt
      }).eq('id', id)
      if (error) throw new Error(`Failed to update recharge request: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated recharge request ${record.name}`, actor)
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
      case 'jobApplications': {
        const { record, nextItems } = removeById(data.jobApplications)
        if (!record) return null
        data.jobApplications = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted job application ${record.jobPostId}`, actor)
        break
      }
      case 'savedJobs': {
        const { record, nextItems } = removeById(data.savedJobs)
        if (!record) return null
        data.savedJobs = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted saved job ${record.jobPostId}`, actor)
        break
      }
      case 'workerNotifications': {
        const { record, nextItems } = removeById(data.workerNotifications)
        if (!record) return null
        data.workerNotifications = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted notification ${record.title}`, actor)
        break
      }
      case 'walletTransactions': {
        const { record, nextItems } = removeById(data.walletTransactions)
        if (!record) return null
        data.walletTransactions = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted wallet transaction ${record.reference || record.entityName}`, actor)
        break
      }
      case 'rechargeRequests': {
        const { record, nextItems } = removeById(data.rechargeRequests)
        if (!record) return null
        data.rechargeRequests = nextItems
        appendAuditLog(data, 'delete', entityType, id, `Deleted recharge request ${record.name}`, actor)
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
    case 'jobApplications': {
      const existing = (await readSupabaseData()).jobApplications.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted job application ${existing.jobPostId}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobApplications).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour job application: ${error.message}`)
      break
    }
    case 'savedJobs': {
      const existing = (await readSupabaseData()).savedJobs.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted saved job ${existing.jobPostId}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.savedJobs).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete saved job: ${error.message}`)
      break
    }
    case 'workerNotifications': {
      const existing = (await readSupabaseData()).workerNotifications.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted notification ${existing.title}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.workerNotifications).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete worker notification: ${error.message}`)
      break
    }
    case 'walletTransactions': {
      const existing = (await readSupabaseData()).walletTransactions.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted wallet transaction ${existing.reference || existing.entityName}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete wallet transaction: ${error.message}`)
      break
    }
    case 'rechargeRequests': {
      const existing = (await readSupabaseData()).rechargeRequests.find(record => record.id === id)
      if (!existing) return null
      summary = `Deleted recharge request ${existing.name}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.rechargeRequests).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete recharge request: ${error.message}`)
      break
    }
  }

  await writeSupabaseAuditLog('delete', entityType, id, summary, actor)
  const supabaseData = await readSupabaseData()
  return buildSnapshot(supabaseData, 'supabase')
}
