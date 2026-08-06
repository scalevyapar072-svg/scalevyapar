import { promises as fs } from 'fs'
import path from 'path'
import { seededLabourCategoryCatalog } from './labour-dependency-seeds'
import {
  getLabourMastersSnapshot,
  purgeInactiveLabourCategoryDependenciesForCategory
} from './labour-masters'
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
export type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'inactive_paused_by_worker' | 'blocked' | 'rejected'
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

export class LabourEntityConflictError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 409) {
    super(message)
    this.name = 'LabourEntityConflictError'
    this.statusCode = statusCode
  }
}

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
  industryCategoryValues: string[]
  businessTypeValues: string[]
  labourCategoryIds: string[]
  jobPostLimit: number
  registrationFee: number
  walletCredit: number
  planAmount: number
  planValidityDays: number
  jobPostLiveDays: number
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
  salaryType: string
  companyId: string
  industryCategory: string
  businessType: string
  address: string
  preferredWorkLocations: Array<{
    stateOptionId: string
    stateLabel: string
    cityOptionIds: string[]
    cityLabels: string[]
  }>
  profilePhotoPath: string
  resumeDocumentPath: string
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  minimumExpectedWage: number
  maximumExpectedWage: number
  walletBalance: number
  registrationFeePaid: boolean
  activePlan: string
  planValidFrom: string
  planValidUntil: string
  lastWalletDeductionDate: string
  workerPausedByWorker: boolean
  workerPausedAt: string
  workerReactivatedAt: string
  status: WorkerStatus
  kycStatus: string
  kycRemarks: string
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
  businessType: string
  industryCategory: string
  gstNumber: string
  companyAddress: string
  state: string
  city: string
  area: string
  pincode: string
  workersNeeded: number
  hiringType: string
  businessDescription: string
  gstCertificatePath: string
  companyProofPath: string
  ownerIdProofPath: string
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
  planId: string
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
  adminCategories?: LabourCategoryRecord[]
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
      id: 'plan-worker-free-7-days',
      audience: 'worker',
      name: 'Free Worker Plan',
      industryCategoryValues: [],
      businessTypeValues: [],
      labourCategoryIds: [],
      jobPostLimit: 1,
      registrationFee: 0,
      walletCredit: 0,
      planAmount: 0,
      planValidityDays: 7,
      jobPostLiveDays: 7,
      validityDays: 7,
      dailyCharge: 0,
      description: 'Free worker activation for 7 days. After expiry, worker must switch to a paid plan.',
      isActive: true,
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z'
    },
    {
      id: 'plan-worker-basic',
      audience: 'worker',
      name: 'Worker Access 10 Days',
      industryCategoryValues: [],
      businessTypeValues: [],
      labourCategoryIds: [],
      jobPostLimit: 1,
      registrationFee: 50,
      walletCredit: 50,
      planAmount: 50,
      planValidityDays: 10,
      jobPostLiveDays: 10,
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
      industryCategoryValues: [],
      businessTypeValues: [],
      labourCategoryIds: [],
      jobPostLimit: 1,
      registrationFee: 100,
      walletCredit: 0,
      planAmount: 200,
      planValidityDays: 3,
      jobPostLiveDays: 3,
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
      industryCategoryValues: [],
      businessTypeValues: [],
      labourCategoryIds: ['cat-stitching'],
      jobPostLimit: 1,
      registrationFee: 100,
      walletCredit: 0,
      planAmount: 300,
      planValidityDays: 3,
      jobPostLiveDays: 3,
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
      salaryType: 'Daily Wage',
      companyId: 'company-neelufer',
      industryCategory: 'Textile',
      businessType: 'Textile Business',
      address: 'Textile Market, Surat',
      preferredWorkLocations: [],
      profilePhotoPath: 'workers/worker-sajid/profile-photo-demo.jpg',
      resumeDocumentPath: '',
      skills: ['Ladies kurti stitching', 'Machine handling', 'Finishing'],
      experienceYears: 6,
      expectedDailyWage: 950,
      minimumExpectedWage: 0,
      maximumExpectedWage: 0,
      walletBalance: 40,
      registrationFeePaid: true,
      activePlan: 'plan-worker-basic',
      planValidFrom: '2026-05-15',
      planValidUntil: '2026-05-25',
      lastWalletDeductionDate: '2026-05-20',
      workerPausedByWorker: false,
      workerPausedAt: '',
      workerReactivatedAt: '',
      status: 'active',
      kycStatus: '',
      kycRemarks: '',
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
      salaryType: 'Daily Wage',
      companyId: 'company-printerhub',
      industryCategory: 'Manufacturing',
      businessType: 'Manufacturer',
      address: 'Mansarovar, Jaipur',
      preferredWorkLocations: [],
      profilePhotoPath: 'workers/worker-rahul/profile-photo-demo.jpg',
      resumeDocumentPath: '',
      skills: ['Site wiring', 'Repair work'],
      experienceYears: 3,
      expectedDailyWage: 800,
      minimumExpectedWage: 0,
      maximumExpectedWage: 0,
      walletBalance: 0,
      registrationFeePaid: false,
      activePlan: '',
      planValidFrom: '',
      planValidUntil: '',
      lastWalletDeductionDate: '',
      workerPausedByWorker: false,
      workerPausedAt: '',
      workerReactivatedAt: '',
      status: 'inactive_wallet_empty',
      kycStatus: '',
      kycRemarks: '',
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
      businessType: 'Textile Business',
      industryCategory: 'Textile',
      gstNumber: '',
      companyAddress: 'Ring Road, Surat',
      state: 'Gujarat',
      city: 'Surat',
      area: '',
      pincode: '395002',
      workersNeeded: 12,
      hiringType: 'Daily Basis',
      businessDescription: 'Garment production company hiring stitching and embroidery labour.',
      gstCertificatePath: '',
      companyProofPath: '',
      ownerIdProofPath: '',
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
      businessType: 'Manufacturer',
      industryCategory: 'Manufacturing',
      gstNumber: '',
      companyAddress: 'Narol industrial area, Ahmedabad',
      state: 'Gujarat',
      city: 'Ahmedabad',
      area: '',
      pincode: '382405',
      workersNeeded: 6,
      hiringType: 'Daily Basis',
      businessDescription: 'Printing and finishing company looking for printer labour.',
      gstCertificatePath: '',
      companyProofPath: '',
      ownerIdProofPath: '',
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
      planId: 'plan-company-stitching',
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
      planId: 'plan-company-basic',
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

const getPlanValidityDays = (plan: Pick<LabourPlanRecord, 'planValidityDays' | 'validityDays'>) => {
  return plan.planValidityDays > 0 ? plan.planValidityDays : plan.validityDays
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toOptionalText = (value: unknown) => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
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

const normalizeStatusToken = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')

const normalizeCompanyStatus = (value: unknown): CompanyStatus => {
  const normalized = normalizeStatusToken(value)
  if (!normalized) return 'pending'

  if (['active', 'approved', 'enabled', 'live', 'published'].includes(normalized)) {
    return 'active'
  }

  if (['blocked', 'rejected', 'suspended'].includes(normalized)) {
    return 'blocked'
  }

  if (['inactive', 'deactivated', 'disabled'].includes(normalized)) {
    return 'inactive'
  }

  return 'pending'
}

const normalizeJobPostStatus = (value: unknown): JobPostStatus => {
  const normalized = normalizeStatusToken(value)
  if (!normalized) return 'draft'

  if (['live', 'active', 'approved', 'open', 'published'].includes(normalized)) {
    return 'live'
  }

  if (['expired', 'closed'].includes(normalized)) {
    return 'expired'
  }

  if (['paused', 'inactive', 'on hold'].includes(normalized)) {
    return 'paused'
  }

  return 'draft'
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const deriveJobPostEffectiveExpiry = (jobPost: Pick<LabourJobPostRecord, 'publishedAt' | 'expiresAt' | 'validityDays'>) => {
  const explicitExpiry = String(jobPost.expiresAt || '').trim()
  if (explicitExpiry) {
    return explicitExpiry
  }

  const publishedAt = String(jobPost.publishedAt || '').trim()
  const validityDays = Number(jobPost.validityDays || 0)
  if (!publishedAt || validityDays <= 0) {
    return ''
  }

  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) {
    return ''
  }

  publishedDate.setHours(0, 0, 0, 0)
  publishedDate.setDate(publishedDate.getDate() + validityDays)
  return publishedDate.toISOString().slice(0, 10)
}

const resolveJobPostExpiryMoment = (jobPost: Pick<LabourJobPostRecord, 'publishedAt' | 'expiresAt' | 'validityDays'>) => {
  const effectiveExpiry = deriveJobPostEffectiveExpiry(jobPost)
  if (!effectiveExpiry) {
    return null
  }

  if (DATE_ONLY_PATTERN.test(effectiveExpiry)) {
    const expiryMoment = new Date(`${effectiveExpiry}T23:59:59.999`)
    return Number.isNaN(expiryMoment.getTime()) ? null : expiryMoment
  }

  const expiryMoment = new Date(effectiveExpiry)
  return Number.isNaN(expiryMoment.getTime()) ? null : expiryMoment
}

export const isWorkerPlanExpiredRecord = (
  worker: Pick<LabourWorkerRecord, 'planValidUntil'>
) => {
  const expiryValue = String(worker.planValidUntil || '').trim()
  if (!expiryValue) return true

  const expiresAt = new Date(expiryValue)
  if (Number.isNaN(expiresAt.getTime())) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

export const isWorkerSearchActiveRecord = (
  worker: Pick<LabourWorkerRecord, 'status' | 'isVisible' | 'activePlan' | 'planValidUntil'>
) => {
  if (worker.status !== 'active') return false
  if (!worker.isVisible) return false
  if (!String(worker.activePlan || '').trim()) return false
  return !isWorkerPlanExpiredRecord(worker)
}

export const isJobPostExpiredRecord = (jobPost: LabourJobPostRecord) => {
  if (jobPost.status === 'expired') return true

  const expiryMoment = resolveJobPostExpiryMoment(jobPost)
  if (!expiryMoment) return false

  return Date.now() > expiryMoment.getTime()
}

export const isJobPostLiveRecord = (jobPost: LabourJobPostRecord) =>
  normalizeJobPostStatus(jobPost.status) === 'live' && !isJobPostExpiredRecord(jobPost)

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true })

  try {
    await fs.access(DATA_FILE_PATH)
  } catch {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8')
  }
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: string) => UUID_PATTERN.test(value.trim())

const createWalletTransactionId = () => crypto.randomUUID()

const FREE_WORKER_PLAN_ID = 'plan-worker-free-7-days'
const FREE_WORKER_PLAN_NAME = 'Free Worker Plan'
const FREE_WORKER_PLAN_DESCRIPTION = 'Free worker activation for 7 days. After expiry, worker must switch to a paid plan.'

const normalizePlanText = (value: string | undefined | null) =>
  String(value || '').trim().toLowerCase()

const isFreeWorkerPlan = (plan: Pick<LabourPlanRecord, 'id' | 'audience' | 'name'> | null | undefined) =>
  Boolean(
    plan &&
    plan.audience === 'worker' &&
    (
      plan.id === FREE_WORKER_PLAN_ID ||
      normalizePlanText(plan.name) === normalizePlanText(FREE_WORKER_PLAN_NAME)
    )
  )

const buildFreeWorkerPlan = (existing?: Partial<LabourPlanRecord>): LabourPlanRecord => {
  const now = existing?.updatedAt || new Date().toISOString()

  return {
    id: existing?.id || FREE_WORKER_PLAN_ID,
    audience: 'worker',
    name: FREE_WORKER_PLAN_NAME,
    categoryId: existing?.categoryId,
    industryCategoryValues: existing?.industryCategoryValues || [],
    businessTypeValues: existing?.businessTypeValues || [],
    labourCategoryIds: existing?.labourCategoryIds || [],
    jobPostLimit: existing?.jobPostLimit ?? 1,
    registrationFee: 0,
    walletCredit: 0,
    planAmount: 0,
    planValidityDays: 7,
    jobPostLiveDays: existing?.jobPostLiveDays ?? 7,
    validityDays: 7,
    dailyCharge: 0,
    description: FREE_WORKER_PLAN_DESCRIPTION,
    isActive: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const prioritizeWorkerPlans = (plans: LabourPlanRecord[]) => {
  const freePlan = plans.find(plan => isFreeWorkerPlan(plan)) || null
  if (!freePlan) return plans

  return [
    freePlan,
    ...plans.filter(plan => plan.id !== freePlan.id)
  ]
}

const ensureFreeWorkerPlan = (plans: LabourPlanRecord[]) => {
  const existingFreePlan = plans.find(plan => isFreeWorkerPlan(plan)) || null
  const nextFreePlan = buildFreeWorkerPlan(existingFreePlan || undefined)
  const dedupedPlans = plans.filter(
    plan => !isFreeWorkerPlan(plan) || plan.id === (existingFreePlan?.id || nextFreePlan.id)
  )
  const remainingPlans = dedupedPlans.filter(plan => plan.id !== nextFreePlan.id)

  return prioritizeWorkerPlans([nextFreePlan, ...remainingPlans])
}

const buildPlanStoragePayload = (plan: LabourPlanRecord) => ({
  id: plan.id,
  audience: plan.audience,
  name: plan.name,
  category_id: plan.categoryId || null,
  industry_category_values: plan.industryCategoryValues,
  business_type_values: plan.businessTypeValues,
  labour_category_ids: plan.labourCategoryIds,
  job_post_limit: plan.jobPostLimit,
  plan_validity_days: plan.planValidityDays,
  job_post_live_days: plan.jobPostLiveDays,
  registration_fee: plan.registrationFee,
  wallet_credit: plan.walletCredit,
  plan_amount: plan.planAmount,
  validity_days: plan.validityDays,
  daily_charge: plan.dailyCharge,
  description: plan.description,
  is_active: plan.isActive,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt
})

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
  industry_category_values?: string[] | null
  business_type_values?: string[] | null
  labour_category_ids?: string[] | null
  job_post_limit?: number | null
  plan_validity_days?: number | null
  job_post_live_days?: number | null
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
  industryCategoryValues: toStringArray(row.industry_category_values),
  businessTypeValues: toStringArray(row.business_type_values),
  labourCategoryIds: toStringArray(row.labour_category_ids || (row.category_id ? [row.category_id] : [])),
  jobPostLimit: row.job_post_limit ?? 1,
  planValidityDays: row.plan_validity_days ?? row.validity_days ?? 0,
  jobPostLiveDays: row.job_post_live_days ?? row.validity_days ?? 0,
  registrationFee: row.registration_fee ?? 0,
  walletCredit: row.wallet_credit ?? 0,
  planAmount: row.plan_amount ?? 0,
  validityDays: row.plan_validity_days ?? row.validity_days ?? 0,
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
  salary_type?: string | null
  company_id: string | null
  industry_category: string | null
  business_type: string | null
  address: string | null
  preferred_work_locations?: unknown[] | null
  profile_photo_path: string | null
  resume_document_path?: string | null
  skills: string[] | null
  experience_years: number | null
  expected_daily_wage: number | null
  minimum_expected_wage?: number | null
  maximum_expected_wage?: number | null
  wallet_balance: number | null
  registration_fee_paid: boolean | null
  active_plan?: string | null
  plan_valid_from?: string | null
  plan_valid_until?: string | null
  last_wallet_deduction_date?: string | null
  worker_paused_by_worker?: boolean | null
  worker_paused_at?: string | null
  worker_reactivated_at?: string | null
  status: string | null
  kyc_status?: string | null
  kyc_remarks?: string | null
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
  fullName: String(row.full_name || '').trim(),
  mobile: String(row.mobile || '').trim(),
  city: row.city || '',
  homeCity: row.home_city || '',
  salaryType: toOptionalText(row.salary_type),
  companyId: row.company_id || '',
  industryCategory: row.industry_category || '',
  businessType: row.business_type || '',
  address: row.address || '',
  preferredWorkLocations: normalizePreferredWorkLocations(row.preferred_work_locations),
  profilePhotoPath: row.profile_photo_path || '',
  resumeDocumentPath: row.resume_document_path || '',
  skills: row.skills || [],
  experienceYears: row.experience_years ?? 0,
  expectedDailyWage: row.expected_daily_wage ?? 0,
  minimumExpectedWage: row.minimum_expected_wage ?? 0,
  maximumExpectedWage: row.maximum_expected_wage ?? 0,
  walletBalance: row.wallet_balance ?? 0,
  registrationFeePaid: row.registration_fee_paid ?? false,
  activePlan: row.active_plan || '',
  planValidFrom: row.plan_valid_from || '',
  planValidUntil: row.plan_valid_until || '',
  lastWalletDeductionDate: row.last_wallet_deduction_date || '',
  workerPausedByWorker: row.worker_paused_by_worker ?? false,
  workerPausedAt: row.worker_paused_at || '',
  workerReactivatedAt: row.worker_reactivated_at || '',
  status: (row.status as WorkerStatus | null) || 'pending',
  kycStatus: row.kyc_status || '',
  kycRemarks: row.kyc_remarks || '',
  availability: (row.availability as WorkerAvailability | null) || 'available_today',
  isVisible: row.is_visible ?? true,
  categoryIds: toStringArray(row.category_ids),
  identityProofType: (row.identity_proof_type as WorkerIdentityProofType | null) || '',
  identityProofNumber: row.identity_proof_number || '',
  identityProofPath: row.identity_proof_path || '',
  registrationCompletedAt: row.registration_completed_at || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const COMPANY_AREA_MARKER = '[[SV_AREA]]'

const splitCompanyAddressAndArea = (addressValue: string | null | undefined, explicitAreaValue: string | null | undefined) => {
  const rawAddress = String(addressValue || '')
  const explicitArea = String(explicitAreaValue || '').trim()
  const markerIndex = rawAddress.indexOf(COMPANY_AREA_MARKER)

  if (markerIndex === -1) {
    return {
      companyAddress: rawAddress,
      area: explicitArea
    }
  }

  const address = rawAddress.slice(0, markerIndex).trimEnd()
  const markerArea = rawAddress.slice(markerIndex + COMPANY_AREA_MARKER.length).trim()

  return {
    companyAddress: address,
    area: explicitArea || markerArea
  }
}

const mergeCompanyAddressAndArea = (companyAddress: string, area: string) => {
  const address = companyAddress.trim()
  const cleanedArea = area.trim()
  if (!cleanedArea) {
    return address
  }

  return address
    ? `${address}\n${COMPANY_AREA_MARKER}${cleanedArea}`
    : `${COMPANY_AREA_MARKER}${cleanedArea}`
}

const mapCompanyRow = (row: {
  id: string
  company_name: string
  contact_person: string
  email: string | null
  mobile: string
  contact_mobile?: string | null
  business_type?: string | null
  industry_category?: string | null
  gst_number?: string | null
  company_address?: string | null
  state?: string | null
  city: string | null
  area?: string | null
  pincode?: string | null
  workers_needed?: number | null
  hiring_type?: string | null
  business_description?: string | null
  gst_certificate_path?: string | null
  company_proof_path?: string | null
  owner_id_proof_path?: string | null
  category_ids: string[] | null
  status: string | null
  registration_fee_paid: boolean | null
  active_plan: string | null
  created_at: string
  updated_at: string
}): LabourCompanyRecord => {
  const locationFields = splitCompanyAddressAndArea(row.company_address, row.area)

  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email || '',
    mobile: row.mobile,
    contactMobile: row.contact_mobile || row.mobile || '',
    businessType: row.business_type || '',
    industryCategory: row.industry_category || '',
    gstNumber: row.gst_number || '',
    companyAddress: locationFields.companyAddress,
    state: row.state || '',
    city: row.city || '',
    area: locationFields.area,
    pincode: row.pincode || '',
    workersNeeded: row.workers_needed ?? 0,
    hiringType: row.hiring_type || '',
    businessDescription: row.business_description || '',
    gstCertificatePath: row.gst_certificate_path || '',
    companyProofPath: row.company_proof_path || '',
    ownerIdProofPath: row.owner_id_proof_path || '',
    categoryIds: toStringArray(row.category_ids),
    status: (row.status as CompanyStatus | null) || 'pending',
    registrationFeePaid: row.registration_fee_paid ?? false,
    activePlan: row.active_plan || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

const mapJobPostRow = (row: {
  id: string
  company_id: string
  plan_id?: string | null
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
}): LabourJobPostRecord => {
  const publishedAt = row.published_at || ''
  const validityDays = row.validity_days ?? 0
  const expiresAt = deriveJobPostEffectiveExpiry({
    publishedAt,
    expiresAt: row.expires_at || '',
    validityDays
  })

  return {
    id: row.id,
    companyId: row.company_id,
    planId: row.plan_id || '',
    categoryId: row.category_id,
    title: row.title,
    description: row.description || '',
    city: row.city || '',
    locationLabel: row.location_label || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    workersNeeded: row.workers_needed ?? 1,
    wageAmount: row.wage_amount ?? 0,
    validityDays,
    status: (row.status as JobPostStatus | null) || 'draft',
    publishedAt,
    expiresAt,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

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
  summary: String(row.summary || '').trim(),
  actor: String(row.actor || '').trim(),
  createdAt: String(row.created_at || '')
})

const normalizeAuditLog = (
  payload: Partial<LabourAuditLogRecord>,
  existing?: LabourAuditLogRecord
): LabourAuditLogRecord => {
  const now = new Date().toISOString()

  return {
    id: String(payload.id || existing?.id || createId('audit')).trim(),
    action: (payload.action || existing?.action || 'update') as LabourAuditLogRecord['action'],
    entityType: (payload.entityType || existing?.entityType || 'workers') as LabourEntityType,
    entityId: String(payload.entityId || existing?.entityId || '').trim(),
    summary: String(payload.summary || existing?.summary || '').trim(),
    actor: String(payload.actor || existing?.actor || '').trim(),
    createdAt: String(payload.createdAt || existing?.createdAt || now)
  }
}

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

const buildWorkerUpdateAuditSummary = (
  worker: LabourWorkerRecord,
  payload: Record<string, unknown>
) => {
  const kycReviewStatusLabel = String(payload.kycReviewStatusLabel || '').trim()
  if (!kycReviewStatusLabel) {
    return `Updated worker ${worker.fullName}`
  }

  const reviewRemark = normalizeKycReviewRemarkText(payload.kycReviewRemark)
  return reviewRemark
    ? `Updated worker KYC for ${worker.fullName}: ${kycReviewStatusLabel} - ${reviewRemark}`
    : `Updated worker KYC for ${worker.fullName}: ${kycReviewStatusLabel}`
}

const hasPayloadField = (payload: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(payload, key)

const KYC_REMARK_DISPLAY_FALLBACKS = new Set([
  'please contact support or review your kyc details.'
])

const isKycReviewRemarkDisplayFallback = (value: unknown) => {
  const remark = String(value || '').trim()
  const normalized = remark.replace(/[“”]/g, '').toLowerCase()
  return KYC_REMARK_DISPLAY_FALLBACKS.has(normalized)
}

const normalizeKycReviewRemarkText = (value: unknown) =>
  isKycReviewRemarkDisplayFallback(value) ? '' : String(value || '').trim()

const resolveWorkerKycRemarks = (
  payload: Partial<LabourWorkerRecord>,
  rawPayload: Record<string, unknown>,
  existing?: LabourWorkerRecord
) => {
  if (payload.kycRemarks === null || rawPayload.kyc_remarks === null || rawPayload.kycReviewRemark === null) {
    return ''
  }
  const candidate = hasPayloadField(payload, 'kycRemarks')
    ? payload.kycRemarks
    : hasPayloadField(payload, 'kyc_remarks')
      ? rawPayload.kyc_remarks
      : hasPayloadField(payload, 'kycReviewRemark')
        ? rawPayload.kycReviewRemark
        : undefined

  if (candidate === undefined) {
    return existing?.kycRemarks || ''
  }

  return isKycReviewRemarkDisplayFallback(candidate)
    ? existing?.kycRemarks || ''
    : String(candidate || '').trim()
}

const resolveWorkerResumeDocumentPath = (
  payload: Partial<LabourWorkerRecord>,
  rawPayload: Record<string, unknown>,
  existing?: LabourWorkerRecord
) => {
  const candidate = hasPayloadField(payload, 'resumeDocumentPath')
    ? payload.resumeDocumentPath
    : hasPayloadField(payload, 'resume_document_path')
      ? rawPayload.resume_document_path
      : undefined

  if (candidate === undefined) {
    return existing?.resumeDocumentPath || ''
  }

  const trimmed = String(candidate || '').trim()
  return trimmed || existing?.resumeDocumentPath || ''
}

const normalizeKycStatusFromReviewLabel = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
  if (!normalized) return ''
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'needs correction' || normalized === 'need correction') return 'needs_correction'
  if (normalized === 'verified' || normalized === 'approved') return 'approved'
  if (normalized === 'pending' || normalized === 'pending review') return 'pending_review'
  return ''
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
  const planValidityDays = toNumber(
    payload.planValidityDays,
    existing?.planValidityDays ?? existing?.validityDays ?? 0
  )
  const jobPostLiveDays = toNumber(
    payload.jobPostLiveDays,
    existing?.jobPostLiveDays ?? existing?.validityDays ?? planValidityDays
  )

  return {
    id: existing?.id || String(payload.id || createId('plan')),
    audience: (payload.audience || existing?.audience || 'worker') as PlanAudience,
    name: String(payload.name || existing?.name || '').trim(),
    categoryId: payload.categoryId || existing?.categoryId || undefined,
    industryCategoryValues: toStringArray(payload.industryCategoryValues || existing?.industryCategoryValues || []),
    businessTypeValues: toStringArray(payload.businessTypeValues || existing?.businessTypeValues || []),
    labourCategoryIds: toStringArray(
      payload.labourCategoryIds ||
      existing?.labourCategoryIds ||
      (payload.categoryId || existing?.categoryId ? [payload.categoryId || existing?.categoryId || ''] : [])
    ),
    jobPostLimit: Math.max(1, toNumber(payload.jobPostLimit, existing?.jobPostLimit ?? 1)),
    registrationFee: toNumber(payload.registrationFee, existing?.registrationFee ?? 0),
    walletCredit: toNumber(payload.walletCredit, existing?.walletCredit ?? 0),
    planAmount: toNumber(payload.planAmount, existing?.planAmount ?? 0),
    planValidityDays,
    jobPostLiveDays,
    validityDays: planValidityDays,
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
  const nextSalaryType =
    payload.salaryType !== undefined
      ? toOptionalText(payload.salaryType)
      : toOptionalText(existing?.salaryType)
  const rawPayload = payload as Record<string, unknown>
  return {
    id: existing?.id || String(payload.id || createId('worker')),
    fullName: String(payload.fullName || existing?.fullName || '').trim(),
    mobile: String(payload.mobile || existing?.mobile || '').trim(),
    city: String(payload.city || existing?.city || '').trim(),
    homeCity: String(payload.homeCity || existing?.homeCity || '').trim(),
    salaryType: nextSalaryType,
    companyId: String(payload.companyId || existing?.companyId || '').trim(),
    industryCategory: String(payload.industryCategory || existing?.industryCategory || '').trim(),
    businessType: String(payload.businessType || existing?.businessType || '').trim(),
    address: String(payload.address || existing?.address || '').trim(),
    preferredWorkLocations: Array.isArray(payload.preferredWorkLocations)
      ? normalizePreferredWorkLocations(payload.preferredWorkLocations)
      : existing?.preferredWorkLocations || [],
    profilePhotoPath: String(payload.profilePhotoPath || existing?.profilePhotoPath || '').trim(),
    resumeDocumentPath: resolveWorkerResumeDocumentPath(payload, rawPayload, existing),
    skills: toStringArray(payload.skills || existing?.skills || []),
    experienceYears: toNumber(payload.experienceYears, existing?.experienceYears ?? 0),
    expectedDailyWage: toNumber(payload.expectedDailyWage ?? rawPayload.expected_daily_wage, existing?.expectedDailyWage ?? 0),
    minimumExpectedWage: toNumber(payload.minimumExpectedWage ?? rawPayload.minimum_expected_wage, existing?.minimumExpectedWage ?? 0),
    maximumExpectedWage: toNumber(payload.maximumExpectedWage ?? rawPayload.maximum_expected_wage, existing?.maximumExpectedWage ?? 0),
    walletBalance: toNumber(payload.walletBalance, existing?.walletBalance ?? 0),
    registrationFeePaid: toBoolean(payload.registrationFeePaid, existing?.registrationFeePaid ?? false),
    activePlan: String(payload.activePlan || existing?.activePlan || '').trim(),
    planValidFrom: String(payload.planValidFrom || existing?.planValidFrom || '').trim(),
    planValidUntil: String(payload.planValidUntil || existing?.planValidUntil || '').trim(),
    lastWalletDeductionDate: String(payload.lastWalletDeductionDate || existing?.lastWalletDeductionDate || '').trim(),
    workerPausedByWorker: toBoolean(payload.workerPausedByWorker, existing?.workerPausedByWorker ?? false),
    workerPausedAt: String(payload.workerPausedAt || existing?.workerPausedAt || '').trim(),
    workerReactivatedAt: String(payload.workerReactivatedAt || existing?.workerReactivatedAt || '').trim(),
    status: (payload.status || existing?.status || 'pending') as WorkerStatus,
    kycStatus: String(
      hasPayloadField(payload, 'kycStatus')
        ? payload.kycStatus
        : hasPayloadField(payload, 'kyc_status')
          ? rawPayload.kyc_status
          : normalizeKycStatusFromReviewLabel(rawPayload.kycReviewStatusLabel) || existing?.kycStatus || ''
    ).trim(),
    kycRemarks: resolveWorkerKycRemarks(payload, rawPayload, existing),
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

const isMissingWorkerPlanColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('active_plan') ||
    normalized.includes('plan_valid_from') ||
    normalized.includes('plan_valid_until') ||
    normalized.includes('last_wallet_deduction_date')
  )
}

const isMissingWorkerPauseColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('worker_paused_by_worker') ||
    normalized.includes('worker_paused_at') ||
    normalized.includes('worker_reactivated_at')
  )
}

const isMissingWorkerProfileMappingColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('company_id') ||
    normalized.includes('industry_category') ||
    normalized.includes('business_type')
  )
}

const normalizePreferredWorkLocations = (value: unknown): LabourWorkerRecord['preferredWorkLocations'] => {
  const locations = Array.isArray(value) ? value : []

  return locations
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(item => {
      const cityOptionIds = Array.isArray(item.cityOptionIds)
        ? item.cityOptionIds.map(id => String(id || '').trim()).filter(Boolean)
        : [String(item.cityOptionId || '').trim()].filter(Boolean)
      const cityLabels = Array.isArray(item.cityLabels)
        ? item.cityLabels.map(label => String(label || '').trim()).filter(Boolean)
        : [String(item.cityLabel || item.city || '').trim()].filter(Boolean)

      return {
        stateOptionId: String(item.stateOptionId || '').trim(),
        stateLabel: String(item.stateLabel || item.state || '').trim(),
        cityOptionIds,
        cityLabels
      }
    })
    .filter(location => location.cityLabels.length > 0)
}

const isMissingWorkerPreferredLocationColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && normalized.includes('preferred_work_locations')
}

const isMissingWorkerExpectedWageRangeColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('minimum_expected_wage') ||
    normalized.includes('maximum_expected_wage')
  )
}

const isMissingWorkerResumeDocumentPathColumnError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && normalized.includes('resume_document_path')
}

const stripUnsupportedWorkerColumnsForError = (payload: Record<string, unknown>, message: string) => {
  const legacyWorkerPayload: Record<string, unknown> = { ...payload }
  let changed = false

  if (isMissingWorkerProfileMappingColumnsError(message)) {
    delete legacyWorkerPayload.company_id
    delete legacyWorkerPayload.industry_category
    delete legacyWorkerPayload.business_type
    changed = true
  }

  if (isMissingWorkerRegistrationFeePaidColumnError(message)) {
    delete legacyWorkerPayload.registration_fee_paid
    changed = true
  }

  if (isMissingWorkerPlanColumnsError(message)) {
    delete legacyWorkerPayload.active_plan
    delete legacyWorkerPayload.plan_valid_from
    delete legacyWorkerPayload.plan_valid_until
    delete legacyWorkerPayload.last_wallet_deduction_date
    changed = true
  }

  if (isMissingWorkerPauseColumnsError(message)) {
    delete legacyWorkerPayload.worker_paused_by_worker
    delete legacyWorkerPayload.worker_paused_at
    delete legacyWorkerPayload.worker_reactivated_at
    changed = true
  }

  if (isMissingWorkerResumeDocumentPathColumnError(message)) {
    delete legacyWorkerPayload.resume_document_path
    changed = true
  }

  return changed ? legacyWorkerPayload : null
}

const isMissingCompanyContactMobileColumnError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('contact_mobile') && (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  )
}

const isMissingCompanyAreaColumnError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('area') && (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  )
}

const isMissingCompanyRegistrationFieldsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('business_type') ||
    normalized.includes('industry_category') ||
    normalized.includes('gst_number') ||
    normalized.includes('company_address') ||
    normalized.includes('state') ||
    normalized.includes('pincode') ||
    normalized.includes('area') ||
    normalized.includes('workers_needed') ||
    normalized.includes('hiring_type') ||
    normalized.includes('business_description') ||
    normalized.includes('gst_certificate_path') ||
    normalized.includes('company_proof_path') ||
    normalized.includes('owner_id_proof_path')
  )
}

const isMissingPlanMetadataColumnsError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('column') ||
    normalized.includes('schema cache')
  ) && (
    normalized.includes('industry_category_values') ||
    normalized.includes('business_type_values') ||
    normalized.includes('labour_category_ids') ||
    normalized.includes('job_post_limit') ||
    normalized.includes('plan_validity_days') ||
    normalized.includes('job_post_live_days')
  )
}

const normalizeCompany = (
  payload: Partial<LabourCompanyRecord>,
  existing?: LabourCompanyRecord
): LabourCompanyRecord => {
  const now = new Date().toISOString()
  const hasOwnField = (field: keyof LabourCompanyRecord) => Object.prototype.hasOwnProperty.call(payload, field)
  const resolveTextField = (field: keyof LabourCompanyRecord, fallback: string) =>
    hasOwnField(field) ? String(payload[field] ?? '').trim() : String(fallback || '').trim()
  const primaryMobile = String(payload.mobile || existing?.mobile || '').trim()
  const contactMobile = hasOwnField('contactMobile')
    ? String(payload.contactMobile ?? '').trim() || primaryMobile
    : String(existing?.contactMobile || primaryMobile).trim()
  return {
    id: existing?.id || String(payload.id || createId('company')),
    companyName: resolveTextField('companyName', existing?.companyName || ''),
    contactPerson: resolveTextField('contactPerson', existing?.contactPerson || ''),
    email: resolveTextField('email', existing?.email || '').toLowerCase(),
    mobile: primaryMobile,
    contactMobile,
    businessType: resolveTextField('businessType', existing?.businessType || ''),
    industryCategory: resolveTextField('industryCategory', existing?.industryCategory || ''),
    gstNumber: resolveTextField('gstNumber', existing?.gstNumber || '').toUpperCase(),
    companyAddress: resolveTextField('companyAddress', existing?.companyAddress || ''),
    state: resolveTextField('state', existing?.state || ''),
    city: resolveTextField('city', existing?.city || ''),
    area: resolveTextField('area', existing?.area || ''),
    pincode: resolveTextField('pincode', existing?.pincode || ''),
    workersNeeded: Math.max(0, Number(payload.workersNeeded ?? existing?.workersNeeded ?? 0) || 0),
    hiringType: resolveTextField('hiringType', existing?.hiringType || ''),
    businessDescription: resolveTextField('businessDescription', existing?.businessDescription || ''),
    gstCertificatePath: resolveTextField('gstCertificatePath', existing?.gstCertificatePath || ''),
    companyProofPath: resolveTextField('companyProofPath', existing?.companyProofPath || ''),
    ownerIdProofPath: resolveTextField('ownerIdProofPath', existing?.ownerIdProofPath || ''),
    categoryIds: toStringArray(payload.categoryIds || existing?.categoryIds || []),
    status: normalizeCompanyStatus(payload.status || existing?.status || 'pending'),
    registrationFeePaid: toBoolean(payload.registrationFeePaid, existing?.registrationFeePaid ?? false),
    activePlan: resolveTextField('activePlan', existing?.activePlan || ''),
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

const getTodayDateValue = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getWorkerPlanById = (plans: LabourPlanRecord[], planId: string) =>
  plans.find(plan => plan.id === planId && plan.audience === 'worker') || null

const getDefaultWorkerPlan = (plans: LabourPlanRecord[]) =>
  plans.find(plan => plan.audience === 'worker' && plan.isActive && isFreeWorkerPlan(plan)) ||
  plans.find(plan => plan.audience === 'worker' && plan.isActive) ||
  null

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const buildWorkerPlanWalletCreditTransaction = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord,
  createdAt: string
): LabourWalletTransactionRecord | null => {
  if (workerPlan.walletCredit <= 0) {
    return null
  }

  return {
    id: createWalletTransactionId(),
    entityType: 'worker',
    entityId: worker.id,
    entityName: worker.fullName || worker.mobile,
    city: worker.city,
    transactionType: 'wallet_recharge',
    amount: workerPlan.walletCredit,
    direction: 'credit',
    status: 'completed',
    reference: workerPlan.id,
    note: `Wallet credited from assigned worker plan ${workerPlan.name}.`,
    createdAt,
    updatedAt: createdAt
  }
}

const syncWorkerPlanAssignment = (
  worker: LabourWorkerRecord,
  plans: LabourPlanRecord[],
  existing?: LabourWorkerRecord
) => {
  const nextWorker: LabourWorkerRecord = { ...worker }
  const fallbackWorkerPlan = getDefaultWorkerPlan(plans)
  const assignedPlan = getWorkerPlanById(plans, nextWorker.activePlan) || (!nextWorker.activePlan ? fallbackWorkerPlan : null)

  if (!assignedPlan) {
    nextWorker.activePlan = ''
    nextWorker.planValidFrom = ''
    nextWorker.planValidUntil = ''
    nextWorker.lastWalletDeductionDate = ''
    return {
      worker: nextWorker,
      assignedPlan: null,
      walletCreditTransaction: null as LabourWalletTransactionRecord | null
    }
  }

  if (!nextWorker.activePlan) {
    nextWorker.activePlan = assignedPlan.id
  }

  const previousPlanId = existing?.activePlan || ''
  const canActivateAssignedPlan = Boolean(nextWorker.registrationCompletedAt || existing?.registrationCompletedAt)
  const fallbackStartDate = canActivateAssignedPlan
    ? (
        nextWorker.planValidFrom ||
        (previousPlanId === assignedPlan.id ? existing?.planValidFrom || '' : '') ||
        getTodayDateValue()
      )
    : ''
  nextWorker.planValidFrom = fallbackStartDate
  nextWorker.planValidUntil = canActivateAssignedPlan
    ? (nextWorker.planValidUntil || addDays(fallbackStartDate, getPlanValidityDays(assignedPlan)))
    : ''

  if (previousPlanId !== assignedPlan.id) {
    nextWorker.lastWalletDeductionDate = ''
    nextWorker.registrationFeePaid = assignedPlan.registrationFee <= 0
  }

  const walletCreditTransaction = previousPlanId !== assignedPlan.id
    ? buildWorkerPlanWalletCreditTransaction(nextWorker, assignedPlan, nextWorker.updatedAt)
    : null

  if (walletCreditTransaction) {
    nextWorker.walletBalance = roundCurrency(nextWorker.walletBalance + walletCreditTransaction.amount)
  }

  return {
    worker: nextWorker,
    assignedPlan,
    walletCreditTransaction
  }
}

const getEffectiveCompanyStatus = (
  company: LabourCompanyRecord,
  plans: LabourPlanRecord[],
  walletTransactions: LabourWalletTransactionRecord[],
  jobPosts: LabourJobPostRecord[]
): CompanyStatus => {
  const explicitStatus = normalizeCompanyStatus(company.status)
  if (explicitStatus !== 'active') {
    return explicitStatus
  }

  const hasLiveJobs = jobPosts.some(jobPost =>
    jobPost.companyId === company.id &&
    normalizeJobPostStatus(jobPost.status) === 'live' &&
    !isJobPostExpiredRecord(jobPost)
  )

  if (!company.activePlan) {
    return explicitStatus
  }

  const companyPlan = plans.find(plan =>
    plan.id === company.activePlan &&
    plan.audience === 'company' &&
    plan.isActive
  )

  if (!companyPlan || getPlanValidityDays(companyPlan) <= 0) {
    return hasLiveJobs ? 'active' : 'inactive'
  }

  const latestPlanPurchase = walletTransactions
    .filter(transaction =>
      transaction.entityType === 'company' &&
      transaction.entityId === company.id &&
      transaction.transactionType === 'plan_purchase' &&
      (!transaction.reference || transaction.reference === company.activePlan)
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]

  if (!latestPlanPurchase?.createdAt) {
    return explicitStatus
  }

  const planStartDate = latestPlanPurchase.createdAt
  const expiresAt = addDays(planStartDate, getPlanValidityDays(companyPlan))

  if (!expiresAt) {
    return explicitStatus
  }

  const expiryDate = new Date(expiresAt)
  if (Number.isNaN(expiryDate.getTime())) {
    return explicitStatus
  }

  expiryDate.setHours(23, 59, 59, 999)
  if (new Date() > expiryDate && !hasLiveJobs) {
    return 'inactive'
  }

  return 'active'
}

const applyEffectiveCompanyStatuses = (data: LabourMarketplaceData): LabourMarketplaceData => {
  const jobPosts = data.jobPosts.map(jobPost => {
    const normalizedStatus = normalizeJobPostStatus(jobPost.status)
    return {
      ...jobPost,
      status: isJobPostExpiredRecord({ ...jobPost, status: normalizedStatus }) ? 'expired' : normalizedStatus
    }
  })

  return {
    ...data,
    companies: data.companies.map(company => ({
      ...company,
      status: getEffectiveCompanyStatus(company, data.plans, data.walletTransactions, jobPosts)
    })),
    jobPosts
  }
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
    planId: String(payload.planId || existing?.planId || '').trim(),
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
  const requestedId = String(payload.id || '').trim()

  return {
    id: existing?.id || (isUuid(requestedId) ? requestedId : createWalletTransactionId()),
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

const mergeSeededCategories = (
  categories: LabourCategoryRecord[],
  options?: { includeMissing?: boolean; excludedCategoryIds?: string[]; excludedCategorySlugs?: string[] }
) => {
  const timestamp = new Date().toISOString()
  const nextCategories = [...categories]
  const includeMissing = options?.includeMissing ?? true
  const excludedCategoryIds = new Set((options?.excludedCategoryIds || []).map(value => value.trim()).filter(Boolean))
  const excludedCategorySlugs = new Set((options?.excludedCategorySlugs || []).map(value => slugify(value)).filter(Boolean))

  seededLabourCategoryCatalog.forEach((seed, index) => {
    if (excludedCategoryIds.has(seed.id) || excludedCategorySlugs.has(seed.slug)) {
      return
    }

    const existing = nextCategories.find(category =>
      category.id === seed.id ||
      slugify(category.slug || category.name) === seed.slug ||
      category.name.trim().toLowerCase() === seed.label.trim().toLowerCase() ||
      (seed.aliases || []).some(alias => category.name.trim().toLowerCase() === alias.trim().toLowerCase())
    )

    if (existing) {
      existing.name = seed.label
      existing.slug = seed.slug
      existing.description = existing.description || seed.description
      existing.isActive = true
      existing.demandLevel = existing.demandLevel || seed.demandLevel
      existing.updatedAt = existing.updatedAt || timestamp
      return
    }

    if (!includeMissing) {
      return
    }

    nextCategories.push({
      id: seed.id,
      name: seed.label,
      slug: seed.slug,
      description: seed.description,
      imageUrl: '',
      showOnHome: false,
      homeOrder: 1000 + index,
      demandLevel: seed.demandLevel,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  })

  return nextCategories
}

const formatCategoryLinkCount = (count: number, label: string) =>
  `${count} ${label}${count === 1 ? '' : 's'}`

const humanizeMasterFallback = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return value
  const matched = normalized.match(/^master-[^-]+-(.+)$/)
  const candidate = matched?.[1] || normalized
  return candidate
    .split(/[-_]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const resolveMasterOptionLabel = (
  options: Array<{ id: string; label: string }>,
  id: string,
  fallback: string
) => options.find(option => option.id === id)?.label || humanizeMasterFallback(fallback)

const describeCategoryMappings = (
  mappings: Array<{
    industryCategoryOptionId: string
    businessTypeOptionId: string
    isActive: boolean
  }>,
  mastersSnapshot: Awaited<ReturnType<typeof getLabourMastersSnapshot>>
) =>
  mappings.map(mapping => {
    const industryLabel = resolveMasterOptionLabel(
      mastersSnapshot.options.filter(option => option.masterKey === 'industry_category'),
      mapping.industryCategoryOptionId,
      mapping.industryCategoryOptionId
    )
    const businessTypeLabel = resolveMasterOptionLabel(
      mastersSnapshot.options.filter(option => option.masterKey === 'business_type'),
      mapping.businessTypeOptionId,
      mapping.businessTypeOptionId
    )

    return `${industryLabel} -> ${businessTypeLabel} [${mapping.isActive ? 'active' : 'inactive'}]`
  })

const buildCategoryDeletionBlockedMessage = (
  blockers: Array<{ count: number; label: string }>,
  categoryName: string,
  categorySlug: string,
  mappingDetails: string[],
  options?: {
    hasActiveMappings: boolean
    hasInactiveMappings: boolean
    hasOnlyMappingBlockers: boolean
  }
) => {
  const details = blockers
    .filter(blocker => blocker.count > 0)
    .map(blocker => formatCategoryLinkCount(blocker.count, blocker.label))

  if (details.length === 0) {
    return `Cannot delete category ${categoryName} (${categorySlug}). Linked records still exist.`
  }

  const mappingSummary = mappingDetails.length > 0
    ? ` Mapping details: ${mappingDetails.join('; ')}.`
    : ''

  const nextStepSummary = options?.hasOnlyMappingBlockers && options.hasActiveMappings
    ? ' Remove the active mappings from Category Dependencies and try deleting again. Inactive legacy mappings will clear automatically once no active mappings remain.'
    : ''

  return `Cannot delete category ${categoryName} (${categorySlug}). Linked records found: ${details.join(', ')}.${mappingSummary}${nextStepSummary}`
}

const assertCategoryDeletionIsSafe = async (id: string, actor: string) => {
  const snapshot = await readSupabaseData()
  const category = snapshot.categories.find(record => record.id === id)
  if (!category) return null

  const mastersSnapshot = await getLabourMastersSnapshot()
  const dependencies = (mastersSnapshot.categoryDependencies || []).filter(
    dependency => dependency.categoryId === id
  )

  const blockers = [
    {
      count: snapshot.plans.filter(
        plan => plan.categoryId === id || plan.labourCategoryIds.includes(id)
      ).length,
      label: 'plan'
    },
    {
      count: snapshot.workers.filter(worker => worker.categoryIds.includes(id)).length,
      label: 'worker'
    },
    {
      count: snapshot.companies.filter(company => company.categoryIds.includes(id)).length,
      label: 'company'
    },
    {
      count: snapshot.jobPosts.filter(jobPost => jobPost.categoryId === id).length,
      label: 'job post'
    },
    {
      count: dependencies.filter(dependency => dependency.isActive).length,
      label: 'active category mapping'
    },
    {
      count: dependencies.filter(dependency => !dependency.isActive).length,
      label: 'inactive category mapping'
    }
  ]

  const activeDependencyMappings = dependencies.filter(dependency => dependency.isActive)
  const inactiveDependencyMappings = dependencies.filter(dependency => !dependency.isActive)
  const nonMappingBlockedLinks = blockers
    .filter(blocker => !blocker.label.includes('mapping'))
    .reduce((sum, blocker) => sum + blocker.count, 0)

  if (nonMappingBlockedLinks === 0 && activeDependencyMappings.length === 0 && inactiveDependencyMappings.length > 0) {
    await purgeInactiveLabourCategoryDependenciesForCategory(id, actor)
    return category
  }

  const totalBlockedLinks = blockers.reduce((sum, blocker) => sum + blocker.count, 0)
  if (totalBlockedLinks > 0) {
    const mappingDetails = describeCategoryMappings(dependencies, mastersSnapshot)
    throw new LabourEntityConflictError(
      buildCategoryDeletionBlockedMessage(blockers, category.name, category.slug, mappingDetails, {
        hasActiveMappings: activeDependencyMappings.length > 0,
        hasInactiveMappings: inactiveDependencyMappings.length > 0,
        hasOnlyMappingBlockers: nonMappingBlockedLinks === 0
      })
    )
  }

  return category
}

const buildCompanyPlanPurchaseTransaction = (
  company: LabourCompanyRecord,
  plans: LabourPlanRecord[],
  createdAt: string
): LabourWalletTransactionRecord | null => {
  if (company.status !== 'active' || !company.activePlan) {
    return null
  }

  const plan = plans.find(item => item.id === company.activePlan && item.audience === 'company')
  if (!plan) {
    return null
  }

  return normalizeWalletTransaction({
    entityType: 'company',
    entityId: company.id,
    entityName: company.companyName,
    city: company.city,
    transactionType: 'plan_purchase',
    amount: plan.planAmount,
    direction: 'credit',
    status: 'completed',
    reference: plan.id,
    note: `Company plan ${plan.name} activated from labour admin.`,
    createdAt,
    updatedAt: createdAt
  })
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
    categories: mergeSeededCategories((parsed.categories || []).map(category => normalizeCategory(category)), { includeMissing: true }),
    plans: ensureFreeWorkerPlan((parsed.plans || []).map(plan => normalizePlan(plan))),
    workers: (parsed.workers || []).map(worker => normalizeWorker(worker)),
    companies: (parsed.companies || []).map(company => normalizeCompany(company)),
    jobPosts: (parsed.jobPosts || []).map(jobPost => normalizeJobPost(jobPost)),
    jobApplications: (parsed.jobApplications || []).map(application => normalizeJobApplication(application)),
    savedJobs: (parsed.savedJobs || []).map(savedJob => normalizeSavedJob(savedJob)),
    workerNotifications: (parsed.workerNotifications || []).map(notification => normalizeWorkerNotification(notification)),
    walletTransactions: (parsed.walletTransactions || []).map(transaction => normalizeWalletTransaction(transaction)),
    rechargeRequests: (parsed.rechargeRequests || []).map(request => normalizeRechargeRequest(request)),
    auditLogs: (parsed.auditLogs || []).map(log => normalizeAuditLog(log))
  }
}

const writeJsonData = async (data: LabourMarketplaceData) => {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

const buildSnapshot = (data: LabourMarketplaceData, storage: 'supabase' | 'json'): LabourMarketplaceSnapshot => {
  const effectiveData = applyEffectiveCompanyStatuses(data)

  return {
  ...effectiveData,
  stats: {
    activeWorkers: effectiveData.workers.filter(worker => isWorkerSearchActiveRecord(worker)).length,
    inactiveWorkers: effectiveData.workers.filter(worker => !isWorkerSearchActiveRecord(worker)).length,
    activeCompanies: effectiveData.companies.filter(company => company.status === 'active').length,
    liveJobPosts: effectiveData.jobPosts.filter(job => job.status === 'live').length,
    totalWalletBalance: effectiveData.workers.reduce((sum, worker) => sum + worker.walletBalance, 0),
    recentAuditLogs: effectiveData.auditLogs.slice(0, 8)
  },
  storage
}
}

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

  const mappedPlans = (plansResult.data || []).map(mapPlanRow)
  const existingFreePlan = mappedPlans.find(plan => isFreeWorkerPlan(plan)) || null
  const ensuredFreePlan = buildFreeWorkerPlan(existingFreePlan || undefined)

  if (!existingFreePlan) {
    const planPayload = buildPlanStoragePayload(ensuredFreePlan)
    let { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).insert(planPayload)
    if (error && isMissingPlanMetadataColumnsError(error.message)) {
      const legacyPlanPayload: Record<string, unknown> = { ...planPayload }
      delete legacyPlanPayload.industry_category_values
      delete legacyPlanPayload.business_type_values
      delete legacyPlanPayload.labour_category_ids
      delete legacyPlanPayload.job_post_limit
      delete legacyPlanPayload.plan_validity_days
      delete legacyPlanPayload.job_post_live_days
      ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.plans).insert(legacyPlanPayload))
    }
    if (error) {
      throw new Error(`Failed to seed free worker plan: ${error.message}`)
    }
  } else {
    const freePlanNeedsUpdate =
      existingFreePlan.planAmount !== ensuredFreePlan.planAmount ||
      existingFreePlan.registrationFee !== ensuredFreePlan.registrationFee ||
      existingFreePlan.walletCredit !== ensuredFreePlan.walletCredit ||
      existingFreePlan.dailyCharge !== ensuredFreePlan.dailyCharge ||
      getPlanValidityDays(existingFreePlan) !== getPlanValidityDays(ensuredFreePlan) ||
      existingFreePlan.name !== ensuredFreePlan.name ||
      existingFreePlan.description !== ensuredFreePlan.description ||
      existingFreePlan.isActive !== ensuredFreePlan.isActive

    if (freePlanNeedsUpdate) {
      const planPayload = buildPlanStoragePayload(ensuredFreePlan)
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).update({
        audience: planPayload.audience,
        name: planPayload.name,
        category_id: planPayload.category_id,
        industry_category_values: planPayload.industry_category_values,
        business_type_values: planPayload.business_type_values,
        labour_category_ids: planPayload.labour_category_ids,
        job_post_limit: planPayload.job_post_limit,
        plan_validity_days: planPayload.plan_validity_days,
        job_post_live_days: planPayload.job_post_live_days,
        registration_fee: planPayload.registration_fee,
        wallet_credit: planPayload.wallet_credit,
        plan_amount: planPayload.plan_amount,
        validity_days: planPayload.validity_days,
        daily_charge: planPayload.daily_charge,
        description: planPayload.description,
        is_active: planPayload.is_active,
        updated_at: planPayload.updated_at
      }).eq('id', existingFreePlan.id)
      if (error && isMissingPlanMetadataColumnsError(error.message)) {
        const legacyPlanPayload: Record<string, unknown> = {
          audience: planPayload.audience,
          name: planPayload.name,
          category_id: planPayload.category_id,
          registration_fee: planPayload.registration_fee,
          wallet_credit: planPayload.wallet_credit,
          plan_amount: planPayload.plan_amount,
          validity_days: planPayload.validity_days,
          daily_charge: planPayload.daily_charge,
          description: planPayload.description,
          is_active: planPayload.is_active,
          updated_at: planPayload.updated_at
        }
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.plans).update(legacyPlanPayload).eq('id', existingFreePlan.id))
      }
      if (error) {
        throw new Error(`Failed to update free worker plan: ${error.message}`)
      }
    }
  }

  const deletedCategoryTombstones = (auditLogsResult.data || [])
    .map(mapAuditLogRow)
    .filter(log => log.entityType === 'categories' && log.action === 'delete')

  const deletedCategoryIds = deletedCategoryTombstones
    .map(log => log.entityId)
    .filter(categoryId => !(categoriesResult.data || []).some(row => row.id === categoryId))

  const deletedCategorySlugs = deletedCategoryTombstones
    .map(log => {
      const slugMatch = log.summary.match(/\(([^)]+)\)/)
      return slugMatch?.[1] || ''
    })
    .filter(slugValue => {
      const normalizedSlug = slugify(slugValue)
      return normalizedSlug.length > 0 && !(categoriesResult.data || []).some(row => slugify(String(row.slug || row.name || '')) === normalizedSlug)
    })

  return {
    categories: mergeSeededCategories((categoriesResult.data || []).map(mapCategoryRow), {
      includeMissing: true,
      excludedCategoryIds: deletedCategoryIds,
      excludedCategorySlugs: deletedCategorySlugs
    }),
    plans: ensureFreeWorkerPlan(
      !existingFreePlan
        ? [...mappedPlans, ensuredFreePlan]
        : mappedPlans.map(plan => (plan.id === existingFreePlan.id ? ensuredFreePlan : plan))
    ),
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
    industry_category_values: plan.industryCategoryValues,
    business_type_values: plan.businessTypeValues,
    labour_category_ids: plan.labourCategoryIds,
    job_post_limit: plan.jobPostLimit,
    plan_validity_days: plan.planValidityDays,
    job_post_live_days: plan.jobPostLiveDays,
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
    home_city: worker.homeCity,
    salary_type: toOptionalText(worker.salaryType) || null,
    company_id: worker.companyId || null,
    industry_category: worker.industryCategory || null,
    business_type: worker.businessType || null,
    address: worker.address,
    preferred_work_locations: worker.preferredWorkLocations || [],
    profile_photo_path: worker.profilePhotoPath,
    resume_document_path: worker.resumeDocumentPath || null,
    skills: worker.skills,
    experience_years: worker.experienceYears,
    expected_daily_wage: worker.expectedDailyWage,
    minimum_expected_wage: worker.minimumExpectedWage || null,
    maximum_expected_wage: worker.maximumExpectedWage || null,
    wallet_balance: worker.walletBalance,
    registration_fee_paid: worker.registrationFeePaid,
    active_plan: worker.activePlan || null,
    plan_valid_from: worker.planValidFrom || null,
    plan_valid_until: worker.planValidUntil || null,
    last_wallet_deduction_date: worker.lastWalletDeductionDate || null,
    worker_paused_by_worker: worker.workerPausedByWorker,
    worker_paused_at: worker.workerPausedAt || null,
    worker_reactivated_at: worker.workerReactivatedAt || null,
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
    business_type: company.businessType || null,
    industry_category: company.industryCategory || null,
    gst_number: company.gstNumber || null,
    company_address: mergeCompanyAddressAndArea(company.companyAddress, company.area) || null,
    state: company.state || null,
    city: company.city,
    area: company.area || null,
    pincode: company.pincode || null,
    workers_needed: company.workersNeeded,
    hiring_type: company.hiringType || null,
    business_description: company.businessDescription || null,
    gst_certificate_path: company.gstCertificatePath || null,
    company_proof_path: company.companyProofPath || null,
    owner_id_proof_path: company.ownerIdProofPath || null,
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
    plan_id: jobPost.planId || null,
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
    type: transaction.transactionType,
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

export const getLabourAdminVisibleCategories = async (): Promise<LabourCategoryRecord[]> => {
  const backend = await getStorageBackend()
  if (backend === 'json') {
    return (await readJsonData()).categories
  }

  const categoryRows = await readOptionalSupabaseRows<{
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
  }>(STORAGE_TABLES.categories)
  return categoryRows.map(mapCategoryRow)
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
        data.plans = ensureFreeWorkerPlan([record, ...data.plans])
        appendAuditLog(data, 'create', entityType, record.id, `Created plan ${record.name}`, actor)
        break
      }
      case 'workers': {
        const normalized = normalizeWorker(payload)
        const { worker: record, walletCreditTransaction } = syncWorkerPlanAssignment(normalized, data.plans)
        data.workers.unshift(record)
        if (walletCreditTransaction) {
          data.walletTransactions.unshift(walletCreditTransaction)
        }
        appendAuditLog(data, 'create', entityType, record.id, `Created worker ${record.fullName}`, actor)
        break
      }
      case 'companies': {
        const record = normalizeCompany(payload)
        data.companies.unshift(record)
        const planPurchase = buildCompanyPlanPurchaseTransaction(record, data.plans, record.createdAt)
        if (planPurchase) {
          data.walletTransactions.unshift(planPurchase)
        }
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
      const planPayload = {
        id: record.id,
        audience: record.audience,
        name: record.name,
        category_id: record.categoryId || null,
        industry_category_values: record.industryCategoryValues,
        business_type_values: record.businessTypeValues,
        labour_category_ids: record.labourCategoryIds,
        job_post_limit: record.jobPostLimit,
        plan_validity_days: record.planValidityDays,
        job_post_live_days: record.jobPostLiveDays,
        registration_fee: record.registrationFee,
        wallet_credit: record.walletCredit,
        plan_amount: record.planAmount,
        validity_days: record.validityDays,
        daily_charge: record.dailyCharge,
        description: record.description,
        is_active: record.isActive,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).insert(planPayload)
      if (error && isMissingPlanMetadataColumnsError(error.message)) {
        const legacyPlanPayload: Record<string, unknown> = { ...planPayload }
        delete legacyPlanPayload.industry_category_values
        delete legacyPlanPayload.business_type_values
        delete legacyPlanPayload.labour_category_ids
        delete legacyPlanPayload.job_post_limit
        delete legacyPlanPayload.plan_validity_days
        delete legacyPlanPayload.job_post_live_days
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.plans).insert(legacyPlanPayload))
      }
      if (error) throw new Error(`Failed to create labour plan: ${error.message}`)
      await writeSupabaseAuditLog('create', entityType, record.id, `Created plan ${record.name}`, actor)
      break
    }
    case 'workers': {
      const normalized = normalizeWorker(payload)
      const supabaseData = await readSupabaseData()
      const { worker: record, walletCreditTransaction } = syncWorkerPlanAssignment(normalized, supabaseData.plans)
      const workerPayload = {
        id: record.id,
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        home_city: record.homeCity,
        preferred_work_locations: record.preferredWorkLocations || [],
        salary_type: toOptionalText(record.salaryType) || null,
        company_id: record.companyId || null,
        industry_category: record.industryCategory || null,
        business_type: record.businessType || null,
        address: record.address,
        profile_photo_path: record.profilePhotoPath,
        resume_document_path: record.resumeDocumentPath || null,
        skills: record.skills,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        minimum_expected_wage: record.minimumExpectedWage || null,
        maximum_expected_wage: record.maximumExpectedWage || null,
        wallet_balance: record.walletBalance,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan || null,
        plan_valid_from: record.planValidFrom || null,
        plan_valid_until: record.planValidUntil || null,
        last_wallet_deduction_date: record.lastWalletDeductionDate || null,
        worker_paused_by_worker: record.workerPausedByWorker,
        worker_paused_at: record.workerPausedAt || null,
        worker_reactivated_at: record.workerReactivatedAt || null,
        status: record.status,
        kyc_status: record.kycStatus || null,
        kyc_remarks: record.kycRemarks || null,
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
      let workerPayloadToWrite: Record<string, unknown> = workerPayload
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.workers).insert(workerPayloadToWrite)
      for (let attempt = 0; error && attempt < 5; attempt += 1) {
        const legacyWorkerPayload = stripUnsupportedWorkerColumnsForError(workerPayloadToWrite, error.message)
        if (!legacyWorkerPayload) break
        workerPayloadToWrite = legacyWorkerPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.workers).insert(workerPayloadToWrite))
      }
      if (error) {
        if (isMissingWorkerExpectedWageRangeColumnsError(error.message)) {
          throw new Error(`Failed to create labour worker: salary range columns are missing from labour_workers schema cache (${error.message})`)
        }
        throw new Error(`Failed to create labour worker: ${error.message}`)
      }
      if (walletCreditTransaction) {
        const { error: transactionError } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).insert({
          id: walletCreditTransaction.id,
          entity_type: walletCreditTransaction.entityType,
          entity_id: walletCreditTransaction.entityId,
          entity_name: walletCreditTransaction.entityName,
          city: walletCreditTransaction.city,
          type: walletCreditTransaction.transactionType,
          transaction_type: walletCreditTransaction.transactionType,
          amount: walletCreditTransaction.amount,
          direction: walletCreditTransaction.direction,
          status: walletCreditTransaction.status,
          reference: walletCreditTransaction.reference,
          note: walletCreditTransaction.note,
          created_at: walletCreditTransaction.createdAt,
          updated_at: walletCreditTransaction.updatedAt
        })
        if (transactionError) throw new Error(`Failed to create worker plan wallet credit transaction: ${transactionError.message}`)
      }
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
        business_type: record.businessType || null,
        industry_category: record.industryCategory || null,
        gst_number: record.gstNumber || null,
        company_address: mergeCompanyAddressAndArea(record.companyAddress, record.area) || null,
        state: record.state || null,
        city: record.city,
        area: record.area || null,
        pincode: record.pincode || null,
        workers_needed: record.workersNeeded,
        hiring_type: record.hiringType || null,
        business_description: record.businessDescription || null,
        gst_certificate_path: record.gstCertificatePath || null,
        company_proof_path: record.companyProofPath || null,
        owner_id_proof_path: record.ownerIdProofPath || null,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
      let companyPayloadToWrite: Record<string, unknown> = companyPayload
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(companyPayloadToWrite)
      if (error && isMissingCompanyContactMobileColumnError(error.message)) {
        const { contact_mobile, ...legacyCompanyPayload } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(companyPayloadToWrite))
      }
      if (error && isMissingCompanyAreaColumnError(error.message)) {
        const { area, ...legacyCompanyPayload } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(companyPayloadToWrite))
      }
      if (error && isMissingCompanyRegistrationFieldsError(error.message)) {
        const {
          business_type,
          industry_category,
          gst_number,
          company_address,
          state,
          area,
          pincode,
          workers_needed,
          hiring_type,
          business_description,
          gst_certificate_path,
          company_proof_path,
          owner_id_proof_path,
          ...legacyCompanyPayload
        } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).insert(companyPayloadToWrite))
      }
      if (error) throw new Error(`Failed to create labour company: ${error.message}`)
      const planPurchase = buildCompanyPlanPurchaseTransaction(record, (await readSupabaseData()).plans, record.createdAt)
      if (planPurchase) {
        const { error: transactionError } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).insert({
          id: planPurchase.id,
          entity_type: planPurchase.entityType,
          entity_id: planPurchase.entityId,
          entity_name: planPurchase.entityName,
          city: planPurchase.city,
          type: planPurchase.transactionType,
          transaction_type: planPurchase.transactionType,
          amount: planPurchase.amount,
          direction: planPurchase.direction,
          status: planPurchase.status,
          reference: planPurchase.reference,
          note: planPurchase.note,
          created_at: planPurchase.createdAt,
          updated_at: planPurchase.updatedAt
        })
        if (transactionError) throw new Error(`Failed to create company plan transaction: ${transactionError.message}`)
      }
      await writeSupabaseAuditLog('create', entityType, record.id, `Created company ${record.companyName}`, actor)
      break
    }
    case 'jobPosts': {
      const record = normalizeJobPost(payload)
      const jobPostPayload = {
        id: record.id,
        company_id: record.companyId,
        plan_id: record.planId || null,
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
      }
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobPosts).insert(jobPostPayload)
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
        type: record.transactionType,
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
        data.plans = ensureFreeWorkerPlan(data.plans)
        appendAuditLog(data, 'update', entityType, id, `Updated plan ${updated.name}`, actor)
        break
      }
      case 'workers': {
        const index = data.workers.findIndex(record => record.id === id)
        if (index === -1) return null
        const existing = data.workers[index]
        const normalized = normalizeWorker(payload, existing)
        const { worker: updated, walletCreditTransaction } = syncWorkerPlanAssignment(normalized, data.plans, existing)
        data.workers[index] = updated
        if (walletCreditTransaction) {
          data.walletTransactions.unshift(walletCreditTransaction)
        }
        appendAuditLog(data, 'update', entityType, id, buildWorkerUpdateAuditSummary(updated, payload), actor)
        break
      }
      case 'companies': {
        const index = data.companies.findIndex(record => record.id === id)
        if (index === -1) return null
        const existing = data.companies[index]
        const updated = normalizeCompany(payload, data.companies[index])
        data.companies[index] = updated
        const shouldCreatePlanPurchase = updated.status === 'active' && Boolean(updated.activePlan) && (
          existing.activePlan !== updated.activePlan ||
          existing.status !== 'active'
        )
        if (shouldCreatePlanPurchase) {
          const planPurchase = buildCompanyPlanPurchaseTransaction(updated, data.plans, updated.updatedAt)
          if (planPurchase) {
            data.walletTransactions.unshift(planPurchase)
          }
        }
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
      const planPayload = {
        audience: record.audience,
        name: record.name,
        category_id: record.categoryId || null,
        industry_category_values: record.industryCategoryValues,
        business_type_values: record.businessTypeValues,
        labour_category_ids: record.labourCategoryIds,
        job_post_limit: record.jobPostLimit,
        plan_validity_days: record.planValidityDays,
        job_post_live_days: record.jobPostLiveDays,
        registration_fee: record.registrationFee,
        wallet_credit: record.walletCredit,
        plan_amount: record.planAmount,
        validity_days: record.validityDays,
        daily_charge: record.dailyCharge,
        description: record.description,
        is_active: record.isActive,
        updated_at: record.updatedAt
      }
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.plans).update(planPayload).eq('id', id)
      if (error && isMissingPlanMetadataColumnsError(error.message)) {
        const legacyPlanPayload: Record<string, unknown> = { ...planPayload }
        delete legacyPlanPayload.industry_category_values
        delete legacyPlanPayload.business_type_values
        delete legacyPlanPayload.labour_category_ids
        delete legacyPlanPayload.job_post_limit
        delete legacyPlanPayload.plan_validity_days
        delete legacyPlanPayload.job_post_live_days
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.plans).update(legacyPlanPayload).eq('id', id))
      }
      if (error) throw new Error(`Failed to update labour plan: ${error.message}`)
      await writeSupabaseAuditLog('update', entityType, id, `Updated plan ${record.name}`, actor)
      break
    }
    case 'workers': {
      const existing = (await readSupabaseData()).workers.find(record => record.id === id)
      if (!existing) return null
      const supabaseData = await readSupabaseData()
      const normalized = normalizeWorker(payload, existing)
      const { worker: record, walletCreditTransaction } = syncWorkerPlanAssignment(normalized, supabaseData.plans, existing)
      const workerPayload = {
        full_name: record.fullName,
        mobile: record.mobile,
        city: record.city,
        home_city: record.homeCity,
        preferred_work_locations: record.preferredWorkLocations || [],
        salary_type: toOptionalText(record.salaryType) || null,
        company_id: record.companyId || null,
        industry_category: record.industryCategory || null,
        business_type: record.businessType || null,
        address: record.address,
        profile_photo_path: record.profilePhotoPath,
        resume_document_path: record.resumeDocumentPath || null,
        skills: record.skills,
        experience_years: record.experienceYears,
        expected_daily_wage: record.expectedDailyWage,
        minimum_expected_wage: record.minimumExpectedWage || null,
        maximum_expected_wage: record.maximumExpectedWage || null,
        wallet_balance: record.walletBalance,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan || null,
        plan_valid_from: record.planValidFrom || null,
        plan_valid_until: record.planValidUntil || null,
        last_wallet_deduction_date: record.lastWalletDeductionDate || null,
        worker_paused_by_worker: record.workerPausedByWorker,
        worker_paused_at: record.workerPausedAt || null,
        worker_reactivated_at: record.workerReactivatedAt || null,
        status: record.status,
        kyc_status: record.kycStatus || null,
        kyc_remarks: record.kycRemarks || null,
        availability: record.availability,
        is_visible: record.isVisible,
        category_ids: record.categoryIds,
        identity_proof_type: record.identityProofType,
        identity_proof_number: record.identityProofNumber,
        identity_proof_path: record.identityProofPath,
        registration_completed_at: record.registrationCompletedAt || null,
        updated_at: record.updatedAt
      }
      let workerPayloadToWrite: Record<string, unknown> = workerPayload
      let { error } = await supabaseAdmin
        .from(STORAGE_TABLES.workers)
        .update(workerPayloadToWrite)
        .eq('id', id)
        .select('id,expected_daily_wage,minimum_expected_wage,maximum_expected_wage')
        .single()
      for (let attempt = 0; error && attempt < 5; attempt += 1) {
        const legacyWorkerPayload = stripUnsupportedWorkerColumnsForError(workerPayloadToWrite, error.message)
        if (!legacyWorkerPayload) break
        workerPayloadToWrite = legacyWorkerPayload
        ;({ error } = await supabaseAdmin
          .from(STORAGE_TABLES.workers)
          .update(workerPayloadToWrite)
          .eq('id', id)
          .select('id,expected_daily_wage,minimum_expected_wage,maximum_expected_wage')
          .single())
      }
      if (error) {
        if (isMissingWorkerExpectedWageRangeColumnsError(error.message)) {
          throw new Error(`Failed to update labour worker: salary range columns are missing from labour_workers schema cache (${error.message})`)
        }
        throw new Error(`Failed to update labour worker: ${error.message}`)
      }
      if (walletCreditTransaction) {
        const { error: transactionError } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).insert({
          id: walletCreditTransaction.id,
          entity_type: walletCreditTransaction.entityType,
          entity_id: walletCreditTransaction.entityId,
          entity_name: walletCreditTransaction.entityName,
          city: walletCreditTransaction.city,
          type: walletCreditTransaction.transactionType,
          transaction_type: walletCreditTransaction.transactionType,
          amount: walletCreditTransaction.amount,
          direction: walletCreditTransaction.direction,
          status: walletCreditTransaction.status,
          reference: walletCreditTransaction.reference,
          note: walletCreditTransaction.note,
          created_at: walletCreditTransaction.createdAt,
          updated_at: walletCreditTransaction.updatedAt
        })
        if (transactionError) throw new Error(`Failed to create worker plan wallet credit transaction: ${transactionError.message}`)
      }
      await writeSupabaseAuditLog('update', entityType, id, buildWorkerUpdateAuditSummary(record, payload), actor)
      break
    }
    case 'companies': {
      const supabaseData = await readSupabaseData()
      const existing = supabaseData.companies.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeCompany(payload, existing)
      const companyPayload = {
        company_name: record.companyName,
        contact_person: record.contactPerson,
        email: record.email || null,
        mobile: record.mobile,
        contact_mobile: record.contactMobile || record.mobile,
        business_type: record.businessType || null,
        industry_category: record.industryCategory || null,
        gst_number: record.gstNumber || null,
        company_address: mergeCompanyAddressAndArea(record.companyAddress, record.area) || null,
        state: record.state || null,
        city: record.city,
        area: record.area || null,
        pincode: record.pincode || null,
        workers_needed: record.workersNeeded,
        hiring_type: record.hiringType || null,
        business_description: record.businessDescription || null,
        gst_certificate_path: record.gstCertificatePath || null,
        company_proof_path: record.companyProofPath || null,
        owner_id_proof_path: record.ownerIdProofPath || null,
        category_ids: record.categoryIds,
        status: record.status,
        registration_fee_paid: record.registrationFeePaid,
        active_plan: record.activePlan,
        updated_at: record.updatedAt
      }
      let companyPayloadToWrite: Record<string, unknown> = companyPayload
      let { error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(companyPayloadToWrite).eq('id', id)
      if (error && isMissingCompanyContactMobileColumnError(error.message)) {
        const { contact_mobile, ...legacyCompanyPayload } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(companyPayloadToWrite).eq('id', id))
      }
      if (error && isMissingCompanyAreaColumnError(error.message)) {
        const { area, ...legacyCompanyPayload } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(companyPayloadToWrite).eq('id', id))
      }
      if (error && isMissingCompanyRegistrationFieldsError(error.message)) {
        const {
          business_type,
          industry_category,
          gst_number,
          company_address,
          state,
          area,
          pincode,
          workers_needed,
          hiring_type,
          business_description,
          gst_certificate_path,
          company_proof_path,
          owner_id_proof_path,
          ...legacyCompanyPayload
        } = companyPayloadToWrite as typeof companyPayload
        companyPayloadToWrite = legacyCompanyPayload
        ;({ error } = await supabaseAdmin.from(STORAGE_TABLES.companies).update(companyPayloadToWrite).eq('id', id))
      }
      if (error) throw new Error(`Failed to update labour company: ${error.message}`)
      const shouldCreatePlanPurchase = record.status === 'active' && Boolean(record.activePlan) && (
        existing.activePlan !== record.activePlan ||
        existing.status !== 'active'
      )
      if (shouldCreatePlanPurchase) {
        const planPurchase = buildCompanyPlanPurchaseTransaction(record, supabaseData.plans, record.updatedAt)
        if (planPurchase) {
          const { error: transactionError } = await supabaseAdmin.from(STORAGE_TABLES.walletTransactions).insert({
            id: planPurchase.id,
            entity_type: planPurchase.entityType,
            entity_id: planPurchase.entityId,
            entity_name: planPurchase.entityName,
            city: planPurchase.city,
            type: planPurchase.transactionType,
            transaction_type: planPurchase.transactionType,
            amount: planPurchase.amount,
            direction: planPurchase.direction,
            status: planPurchase.status,
            reference: planPurchase.reference,
            note: planPurchase.note,
            created_at: planPurchase.createdAt,
            updated_at: planPurchase.updatedAt
          })
          if (transactionError) throw new Error(`Failed to create company plan transaction: ${transactionError.message}`)
        }
      }
      await writeSupabaseAuditLog('update', entityType, id, `Updated company ${record.companyName}`, actor)
      break
    }
    case 'jobPosts': {
      const existing = (await readSupabaseData()).jobPosts.find(record => record.id === id)
      if (!existing) return null
      const record = normalizeJobPost(payload, existing)
      const jobPostPayload = {
        company_id: record.companyId,
        plan_id: record.planId || null,
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
      }
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.jobPosts).update(jobPostPayload).eq('id', id)
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
        type: record.transactionType,
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
      const existing = await assertCategoryDeletionIsSafe(id, actor)
      if (!existing) return null
      summary = `Deleted category ${existing.name}`
      const { error } = await supabaseAdmin.from(STORAGE_TABLES.categories).delete().eq('id', id)
      if (error) throw new Error(`Failed to delete labour category: ${error.message}`)
      const verificationSnapshot = await readSupabaseData()
      if (verificationSnapshot.categories.some(record => record.id === id)) {
        throw new Error(`Category delete did not complete. ${existing.name} still exists after the delete attempt.`)
      }
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
