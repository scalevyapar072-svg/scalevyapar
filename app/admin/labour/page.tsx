'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type DemandLevel = 'high' | 'medium' | 'low'
type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'blocked' | 'rejected'
type WorkerIdentityProofType = '' | 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'other'
type WorkerKycFilter = 'all' | 'not_submitted' | 'ready_for_review' | 'approved' | 'rejected'
type CompanyStatus = 'pending' | 'active' | 'inactive' | 'blocked'
type JobPostStatus = 'draft' | 'live' | 'expired' | 'paused'
type JobApplicationStatus = 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
type WorkerNotificationType = 'application_submitted' | 'job_saved' | 'application_status' | 'wallet_reminder'
type WorkerNotificationPriority = 'high' | 'medium' | 'low'
type PlanAudience = 'worker' | 'company'
type WorkerAvailability = 'available_today' | 'available_this_week' | 'not_available'
type WalletEntityType = 'worker' | 'company'
type WalletTransactionType = 'registration_fee' | 'wallet_deduction' | 'plan_purchase' | 'wallet_recharge' | 'manual_adjustment'
type WalletTransactionDirection = 'credit' | 'debit'
type WalletTransactionStatus = 'pending' | 'completed' | 'attention' | 'failed'
type RechargeRequestType = 'worker_recharge' | 'company_follow_up'
type RechargeRequestPriority = 'high' | 'medium' | 'low'
type RechargeRequestStatus = 'open' | 'contacted' | 'resolved' | 'closed'
type LabourSection =
  | 'overview'
  | 'workers'
  | 'companies'
  | 'categories'
  | 'jobPosts'
  | 'jobApplications'
  | 'savedJobs'
  | 'workerNotifications'
  | 'plans'
  | 'walletTransactions'
  | 'rechargeRequests'
  | 'reports'
  | 'settings'
  | 'auditLogs'
type LabourEntityType = 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts' | 'jobApplications' | 'savedJobs' | 'workerNotifications' | 'walletTransactions' | 'rechargeRequests'

type LabourCategory = {
  id: string
  name: string
  slug: string
  description: string
  demandLevel: DemandLevel
  isActive: boolean
}

type LabourPlan = {
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
}

type LabourWorker = {
  id: string
  fullName: string
  mobile: string
  city: string
  profilePhotoPath: string
  experienceYears: number
  expectedDailyWage: number
  walletBalance: number
  status: WorkerStatus
  availability: WorkerAvailability
  isVisible: boolean
  categoryIds: string[]
  identityProofType: WorkerIdentityProofType
  identityProofNumber: string
  identityProofPath: string
  registrationCompletedAt: string
}

type LabourCompany = {
  id: string
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  city: string
  categoryIds: string[]
  status: CompanyStatus
  registrationFeePaid: boolean
  activePlan: string
}

type LabourJobPost = {
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
}

type LabourJobApplication = {
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

type LabourSavedJob = {
  id: string
  workerId: string
  jobPostId: string
  createdAt: string
  updatedAt: string
}

type LabourWorkerNotification = {
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

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string
  summary: string
  actor: string
  createdAt: string
}

type LabourSnapshot = {
  categories: LabourCategory[]
  plans: LabourPlan[]
  workers: LabourWorker[]
  companies: LabourCompany[]
  jobPosts: LabourJobPost[]
  jobApplications: LabourJobApplication[]
  savedJobs: LabourSavedJob[]
  workerNotifications: LabourWorkerNotification[]
  walletTransactions: WalletTransaction[]
  rechargeRequests: RechargeRequest[]
  auditLogs: AuditLog[]
  stats: {
    activeWorkers: number
    inactiveWorkers: number
    activeCompanies: number
    liveJobPosts: number
    totalWalletBalance: number
    recentAuditLogs: AuditLog[]
  }
  storage: 'supabase' | 'json'
}

type WalletTransaction = {
  id: string
  entityType: WalletEntityType
  entityId: string
  transactionType: WalletTransactionType
  entityName: string
  city: string
  amount: number
  direction: WalletTransactionDirection
  status: WalletTransactionStatus
  reference: string
  note: string
  createdAt: string
  updatedAt: string
}

type RechargeRequest = {
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

type CategoryFilters = {
  search: string
  demand: 'all' | DemandLevel
  activity: 'all' | 'active' | 'inactive'
}

type PlanFilters = {
  search: string
  audience: 'all' | PlanAudience
  categoryId: string
  activity: 'all' | 'active' | 'inactive'
}

type WorkerFilters = {
  search: string
  status: 'all' | WorkerStatus
  categoryId: string
  visibility: 'all' | 'visible' | 'hidden'
  kyc: WorkerKycFilter
}

type CompanyFilters = {
  search: string
  status: 'all' | CompanyStatus
  categoryId: string
  fee: 'all' | 'paid' | 'pending'
}

type JobFilters = {
  search: string
  status: 'all' | JobPostStatus
  categoryId: string
  companyId: string
}

type JobApplicationFilters = {
  search: string
  status: 'all' | JobApplicationStatus
  companyId: string
  jobPostId: string
}

type SavedJobFilters = {
  search: string
  companyId: string
  jobPostId: string
}

type WorkerNotificationFilters = {
  search: string
  workerId: string
  type: 'all' | WorkerNotificationType
  priority: 'all' | WorkerNotificationPriority
  readState: 'all' | 'read' | 'unread'
}

type WorkerNotificationDraft = {
  workerId: string
  type: WorkerNotificationType
  title: string
  message: string
  priority: WorkerNotificationPriority
  relatedJobPostId: string
  relatedCompanyId: string
}

type WalletFilters = {
  search: string
  audience: 'all' | WalletEntityType
  transactionType: 'all' | WalletTransaction['transactionType']
  status: 'all' | WalletTransaction['status']
}

type RechargeFilters = {
  search: string
  priority: 'all' | RechargeRequestPriority
  type: 'all' | RechargeRequestType
  status: 'all' | RechargeRequestStatus
}

type AuditFilters = {
  search: string
  entityType: 'all' | string
}

type LabourAdminSettings = {
  notificationTemplates: {
    applicationSubmittedTitle: string
    applicationSubmittedMessage: string
    shortlistedTitle: string
    shortlistedMessage: string
    rejectedTitle: string
    rejectedMessage: string
    walletReminderTitle: string
    walletReminderMessage: string
    adminBroadcastTitle: string
    adminBroadcastMessage: string
  }
  uploadRules: {
    maxPhotoSizeMb: number
    maxDocumentSizeMb: number
    allowedPhotoExtensions: string[]
    allowedDocumentExtensions: string[]
    requireIdentityDocumentUpload: boolean
  }
  kycRules: {
    requireProfilePhoto: boolean
    requireIdentityNumber: boolean
    manualReviewRequired: boolean
    autoRejectBlurredPhoto: boolean
    reviewReminderHours: number
    allowedProofTypes: string[]
  }
  feeRules: {
    defaultWorkerRegistrationFee: number
    defaultWorkerDailyDeduction: number
    minimumWalletRecharge: number
    defaultCompanyRegistrationFee: number
    defaultCompanyPlanAmount: number
    followUpCreditThreshold: number
  }
  automationControls: {
    autoHideInactiveWorkers: boolean
    autoPauseExpiredJobs: boolean
    sendWalletReminderPush: boolean
    sendApplicationStatusPush: boolean
    autoCreateRechargeFollowUps: boolean
    autoEscalatePendingKyc: boolean
    pendingKycEscalationHours: number
  }
}

const workerStatuses: WorkerStatus[] = [
  'pending',
  'active',
  'inactive_wallet_empty',
  'inactive_subscription_expired',
  'blocked',
  'rejected'
]

const companyStatuses: CompanyStatus[] = ['pending', 'active', 'inactive', 'blocked']
const workerAvailabilityOptions: WorkerAvailability[] = ['available_today', 'available_this_week', 'not_available']
const workerIdentityProofOptions: Array<Exclude<WorkerIdentityProofType, ''>> = ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other']
const jobPostStatuses: JobPostStatus[] = ['draft', 'live', 'expired', 'paused']
const jobApplicationStatuses: JobApplicationStatus[] = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired']
const workerNotificationTypes: WorkerNotificationType[] = ['application_submitted', 'job_saved', 'application_status', 'wallet_reminder']
const workerNotificationPriorities: WorkerNotificationPriority[] = ['high', 'medium', 'low']

const blankCategory: LabourCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  demandLevel: 'medium',
  isActive: true
}

const blankPlan: LabourPlan = {
  id: '',
  audience: 'worker',
  name: '',
  categoryId: '',
  registrationFee: 0,
  walletCredit: 0,
  planAmount: 0,
  validityDays: 0,
  dailyCharge: 0,
  description: '',
  isActive: true
}

const blankWorker: LabourWorker = {
  id: '',
  fullName: '',
  mobile: '',
  city: '',
  profilePhotoPath: '',
  experienceYears: 0,
  expectedDailyWage: 0,
  walletBalance: 0,
  status: 'pending',
  availability: 'available_today',
  isVisible: true,
  categoryIds: [],
  identityProofType: '',
  identityProofNumber: '',
  identityProofPath: '',
  registrationCompletedAt: ''
}

const blankCompany: LabourCompany = {
  id: '',
  companyName: '',
  contactPerson: '',
  email: '',
  mobile: '',
  city: '',
  categoryIds: [],
  status: 'pending',
  registrationFeePaid: false,
  activePlan: ''
}

const blankJobPost: LabourJobPost = {
  id: '',
  companyId: '',
  categoryId: '',
  title: '',
  description: '',
  city: '',
  workersNeeded: 1,
  wageAmount: 0,
  validityDays: 3,
  status: 'draft',
  publishedAt: '',
  expiresAt: ''
}

const blankWalletTransaction: WalletTransaction = {
  id: '',
  entityType: 'worker',
  entityId: '',
  transactionType: 'wallet_recharge',
  entityName: '',
  city: '',
  amount: 0,
  direction: 'credit',
  status: 'completed',
  reference: '',
  note: '',
  createdAt: '',
  updatedAt: ''
}

const blankRechargeRequest: RechargeRequest = {
  id: '',
  requestType: 'worker_recharge',
  relatedEntityType: 'worker',
  relatedEntityId: '',
  name: '',
  city: '',
  categoryLabel: '',
  statusLabel: '',
  suggestedAmount: 0,
  priority: 'medium',
  requestStatus: 'open',
  note: '',
  createdAt: '',
  updatedAt: ''
}

const blankWorkerNotificationDraft: WorkerNotificationDraft = {
  workerId: '',
  type: 'wallet_reminder',
  title: '',
  message: '',
  priority: 'medium',
  relatedJobPostId: '',
  relatedCompanyId: ''
}

const blankLabourAdminSettings: LabourAdminSettings = {
  notificationTemplates: {
    applicationSubmittedTitle: 'Application received',
    applicationSubmittedMessage: 'Your application for {{job_title}} has been submitted successfully.',
    shortlistedTitle: 'You are shortlisted',
    shortlistedMessage: 'You have been shortlisted for {{job_title}}. Keep your phone active for the next step.',
    rejectedTitle: 'Application update',
    rejectedMessage: 'Your application for {{job_title}} was not selected this time.',
    walletReminderTitle: 'Wallet recharge needed',
    walletReminderMessage: 'Your wallet is low. Recharge soon to keep company details unlocked.',
    adminBroadcastTitle: 'Important update',
    adminBroadcastMessage: 'Admin shared a new update for active workers.'
  },
  uploadRules: {
    maxPhotoSizeMb: 4,
    maxDocumentSizeMb: 8,
    allowedPhotoExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    allowedDocumentExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    requireIdentityDocumentUpload: true
  },
  kycRules: {
    requireProfilePhoto: true,
    requireIdentityNumber: true,
    manualReviewRequired: true,
    autoRejectBlurredPhoto: false,
    reviewReminderHours: 12,
    allowedProofTypes: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other']
  },
  feeRules: {
    defaultWorkerRegistrationFee: 49,
    defaultWorkerDailyDeduction: 5,
    minimumWalletRecharge: 50,
    defaultCompanyRegistrationFee: 199,
    defaultCompanyPlanAmount: 999,
    followUpCreditThreshold: 100
  },
  automationControls: {
    autoHideInactiveWorkers: true,
    autoPauseExpiredJobs: true,
    sendWalletReminderPush: true,
    sendApplicationStatusPush: true,
    autoCreateRechargeFollowUps: true,
    autoEscalatePendingKyc: true,
    pendingKycEscalationHours: 24
  }
}

const blankCategoryFilters: CategoryFilters = { search: '', demand: 'all', activity: 'all' }
const blankPlanFilters: PlanFilters = { search: '', audience: 'all', categoryId: '', activity: 'all' }
const blankWorkerFilters: WorkerFilters = { search: '', status: 'all', categoryId: '', visibility: 'all', kyc: 'all' }
const blankCompanyFilters: CompanyFilters = { search: '', status: 'all', categoryId: '', fee: 'all' }
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const blankJobFilters: JobFilters = { search: '', status: 'all', categoryId: '', companyId: '' }
const blankJobApplicationFilters: JobApplicationFilters = { search: '', status: 'all', companyId: '', jobPostId: '' }
const blankSavedJobFilters: SavedJobFilters = { search: '', companyId: '', jobPostId: '' }
const blankWorkerNotificationFilters: WorkerNotificationFilters = { search: '', workerId: '', type: 'all', priority: 'all', readState: 'all' }
const blankWalletFilters: WalletFilters = { search: '', audience: 'all', transactionType: 'all', status: 'all' }
const blankRechargeFilters: RechargeFilters = { search: '', priority: 'all', type: 'all', status: 'all' }
const blankAuditFilters: AuditFilters = { search: '', entityType: 'all' }

const sectionLabels: Record<LabourSection, string> = {
  overview: 'Dashboard',
  workers: 'Workers',
  companies: 'Companies',
  categories: 'Categories',
  jobPosts: 'Job Posts',
  jobApplications: 'Job Applications',
  savedJobs: 'Saved Jobs',
  workerNotifications: 'Worker Notifications',
  plans: 'Plans',
  walletTransactions: 'Wallet Transactions',
  rechargeRequests: 'Recharge Requests',
  reports: 'Reports',
  settings: 'Settings',
  auditLogs: 'Audit Logs'
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const formatDateTime = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const matchesSearch = (search: string, values: Array<string | number | boolean | undefined>) => {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return values.some(value => String(value || '').toLowerCase().includes(query))
}

const isTenDigitMobile = (value: string) => /^\d{10}$/.test(value.trim())

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const isExpiredJobPost = (jobPost: LabourJobPost) => {
  if (jobPost.status === 'expired') return true
  if (!jobPost.expiresAt) return false
  const expiresAt = new Date(jobPost.expiresAt)
  if (Number.isNaN(expiresAt.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

const titleCase = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getNotificationPriorityTone = (priority: WorkerNotificationPriority) => {
  if (priority === 'high') return { background: '#fff1f2', color: '#b91c1c', border: '#fecdd3' }
  if (priority === 'medium') return { background: '#fff7ed', color: '#c2410c', border: '#fdba74' }
  return { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
}

const escapeCsvCell = (value: unknown) => {
  const normalized = String(value ?? '')
  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

const createCsvContent = (rows: Array<Record<string, unknown>>) => {
  if (rows.length === 0) return 'No data available'
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach(key => set.add(key))
    return set
  }, new Set<string>()))

  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsvCell(row[header])).join(','))
  ]

  return lines.join('\n')
}

const parseCommaSeparatedList = (value: string) =>
  value
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)

export default function LabourExchangeAdminPage() {
  const [snapshot, setSnapshot] = useState<LabourSnapshot | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<LabourAdminSettings>(blankLabourAdminSettings)
  const [settingsStorage, setSettingsStorage] = useState<'supabase' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [activeSection, setActiveSection] = useState<LabourSection>('overview')

  const [categoryDraft, setCategoryDraft] = useState<LabourCategory>(blankCategory)
  const [planDraft, setPlanDraft] = useState<LabourPlan>(blankPlan)
  const [workerDraft, setWorkerDraft] = useState<LabourWorker>(blankWorker)
  const [companyDraft, setCompanyDraft] = useState<LabourCompany>(blankCompany)
  const [jobPostDraft, setJobPostDraft] = useState<LabourJobPost>(blankJobPost)
  const [workerNotificationDraft, setWorkerNotificationDraft] = useState<WorkerNotificationDraft>(blankWorkerNotificationDraft)
  const [walletTransactionDraft, setWalletTransactionDraft] = useState<WalletTransaction>(blankWalletTransaction)
  const [rechargeRequestDraft, setRechargeRequestDraft] = useState<RechargeRequest>(blankRechargeRequest)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [selectedWorkerReviewId, setSelectedWorkerReviewId] = useState<string | null>(null)
  const [selectedJobApplicationId, setSelectedJobApplicationId] = useState<string | null>(null)
  const [selectedCompanyAuditId, setSelectedCompanyAuditId] = useState<string | null>(null)
  const [selectedSavedJobId, setSelectedSavedJobId] = useState<string | null>(null)
  const [selectedWorkerNotificationId, setSelectedWorkerNotificationId] = useState<string | null>(null)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editingJobPostId, setEditingJobPostId] = useState<string | null>(null)
  const [editingWalletTransactionId, setEditingWalletTransactionId] = useState<string | null>(null)
  const [editingRechargeRequestId, setEditingRechargeRequestId] = useState<string | null>(null)

  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>(blankCategoryFilters)
  const [planFilters, setPlanFilters] = useState<PlanFilters>(blankPlanFilters)
  const [workerFilters, setWorkerFilters] = useState<WorkerFilters>(blankWorkerFilters)
  const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(blankCompanyFilters)
  const [jobFilters, setJobFilters] = useState<JobFilters>(blankJobFilters)
  const [jobApplicationFilters, setJobApplicationFilters] = useState<JobApplicationFilters>(blankJobApplicationFilters)
  const [savedJobFilters, setSavedJobFilters] = useState<SavedJobFilters>(blankSavedJobFilters)
  const [workerNotificationFilters, setWorkerNotificationFilters] = useState<WorkerNotificationFilters>(blankWorkerNotificationFilters)
  const [walletFilters, setWalletFilters] = useState<WalletFilters>(blankWalletFilters)
  const [rechargeFilters, setRechargeFilters] = useState<RechargeFilters>(blankRechargeFilters)
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(blankAuditFilters)

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    color: '#0f172a',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  }

  const labelStyle = {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600' as const,
    display: 'block' as const,
    marginBottom: '4px'
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
  }

  const subtleButtonStyle = {
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #dbe2ea',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700' as const,
    cursor: 'pointer'
  }

  const primaryButtonStyle = {
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700' as const
  }

  const fetchSnapshot = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Unable to load labour exchange data.')
      }

      const data = await response.json()
      setSnapshot(data)
    } catch {
      setError('Unable to load labour exchange data right now.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    setSettingsLoading(true)

    try {
      const response = await fetch('/api/admin/labour/settings', { cache: 'no-store' })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load labour admin settings.')
      }

      setSettingsDraft(data.settings || blankLabourAdminSettings)
      setSettingsStorage(data.storage === 'supabase' ? 'supabase' : 'json')
    } catch {
      setError(current => current || 'Unable to load labour admin settings right now.')
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    void fetchSnapshot()
    void fetchSettings()
  }, [])

  const showSaved = (message: string) => {
    setSaved(message)
    setTimeout(() => setSaved(''), 2500)
  }

  const replaceSnapshot = (nextSnapshot: LabourSnapshot) => {
    setSnapshot(nextSnapshot)
    setError('')
  }

  const saveSettings = async () => {
    setError('')
    setSettingsLoading(true)

    try {
      const response = await fetch('/api/admin/labour/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsDraft })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        setError(data.error || 'Failed to save labour admin settings.')
        return
      }

      setSettingsDraft(data.settings || blankLabourAdminSettings)
      setSettingsStorage(data.storage === 'supabase' ? 'supabase' : 'json')
      showSaved('Labour admin settings updated.')
    } catch {
      setError('Failed to save labour admin settings.')
    } finally {
      setSettingsLoading(false)
    }
  }

  const persistEntity = async (
    method: 'POST' | 'PUT',
    entityType: LabourEntityType,
    payload: Record<string, unknown>,
    id?: string
  ) => {
    const response = await fetch('/api/admin/labour', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(method === 'POST' ? { entityType, payload } : { entityType, id, payload })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to save record.')
      return false
    }

    replaceSnapshot(data.snapshot)
    return true
  }

  const removeEntity = async (entityType: LabourEntityType, id: string, label: string) => {
    setError('')
    const confirmed = window.confirm(`Delete ${label}?`)
    if (!confirmed) return

    const response = await fetch('/api/admin/labour', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, id })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to delete record.')
      return
    }

    replaceSnapshot(data.snapshot)
    showSaved(`${label} deleted`)
  }

  const resetCategoryDraft = () => {
    setCategoryDraft(blankCategory)
    setEditingCategoryId(null)
  }

  const resetPlanDraft = () => {
    setPlanDraft(blankPlan)
    setEditingPlanId(null)
  }

  const resetWorkerDraft = () => {
    setWorkerDraft(blankWorker)
    setEditingWorkerId(null)
  }

  const resetCompanyDraft = () => {
    setCompanyDraft(blankCompany)
    setEditingCompanyId(null)
  }

  const resetJobPostDraft = () => {
    setJobPostDraft(blankJobPost)
    setEditingJobPostId(null)
  }

  const resetWorkerNotificationDraft = () => {
    setWorkerNotificationDraft(blankWorkerNotificationDraft)
  }

  const resetWalletTransactionDraft = () => {
    setWalletTransactionDraft(blankWalletTransaction)
    setEditingWalletTransactionId(null)
  }

  const resetRechargeRequestDraft = () => {
    setRechargeRequestDraft(blankRechargeRequest)
    setEditingRechargeRequestId(null)
  }

  const openAddForm = (section: LabourSection) => {
    setActiveSection(section)

    if (section === 'categories') resetCategoryDraft()
    if (section === 'plans') resetPlanDraft()
    if (section === 'workers') resetWorkerDraft()
    if (section === 'companies') resetCompanyDraft()
    if (section === 'jobPosts') resetJobPostDraft()
    if (section === 'workerNotifications') resetWorkerNotificationDraft()
    if (section === 'walletTransactions') resetWalletTransactionDraft()
    if (section === 'rechargeRequests') resetRechargeRequestDraft()
  }

  const onMultiSelectChange = (values: string[], nextValue: string) =>
    values.includes(nextValue) ? values.filter(item => item !== nextValue) : [...values, nextValue]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading labour exchange admin...</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error || 'Unable to load the labour exchange module.'}</p>
        <button onClick={() => void fetchSnapshot()} style={primaryButtonStyle}>
          Retry
        </button>
      </div>
    )
  }

  const getCategoryName = (categoryId: string) =>
    snapshot.categories.find(category => category.id === categoryId)?.name || categoryId

  const getPlanById = (planId: string) => snapshot.plans.find(plan => plan.id === planId)
  const getPlanName = (planId: string) => getPlanById(planId)?.name || planId || 'No plan'
  const getWorkerById = (workerId: string) => snapshot.workers.find(worker => worker.id === workerId)
  const getCompanyName = (companyId: string) =>
    snapshot.companies.find(company => company.id === companyId)?.companyName || companyId
  const getCompanyById = (companyId: string) => snapshot.companies.find(company => company.id === companyId)
  const getEntityName = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.fullName || '' : getCompanyById(entityId)?.companyName || ''
  const formatIdentityProofType = (value: WorkerIdentityProofType) => {
    if (!value) return 'Not provided'
    return value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
  }
  const isWorkerKycSubmitted = (worker: LabourWorker) =>
    Boolean(worker.profilePhotoPath.trim()) &&
    Boolean(worker.identityProofType) &&
    Boolean(worker.identityProofNumber.trim()) &&
    Boolean(worker.identityProofPath.trim()) &&
    Boolean(worker.registrationCompletedAt.trim())
  const getWorkerKycState = (worker: LabourWorker): Exclude<WorkerKycFilter, 'all'> => {
    if (!isWorkerKycSubmitted(worker)) return 'not_submitted'
    if (worker.status === 'rejected') return 'rejected'
    if (worker.status === 'pending') return 'ready_for_review'
    return 'approved'
  }
  const getWorkerKycLabel = (worker: LabourWorker) => {
    const state = getWorkerKycState(worker)
    if (state === 'not_submitted') return 'KYC not submitted'
    if (state === 'ready_for_review') return 'Ready for review'
    if (state === 'rejected') return 'KYC rejected'
    return 'KYC approved'
  }
  const getWorkerKycTone = (worker: LabourWorker) => {
    const state = getWorkerKycState(worker)
    if (state === 'ready_for_review') return { background: '#fff7ed', color: '#c2410c', border: '#fdba74' }
    if (state === 'approved') return { background: '#ecfdf5', color: '#047857', border: '#86efac' }
    if (state === 'rejected') return { background: '#fff1f2', color: '#be123c', border: '#fda4af' }
    return { background: '#f8fafc', color: '#475569', border: '#cbd5e1' }
  }
  const getWorkerDocumentHref = (storagePath: string) =>
    storagePath.trim() ? `/api/admin/labour/worker-file?path=${encodeURIComponent(storagePath.trim())}` : ''
  const getJobPostById = (jobPostId: string) => snapshot.jobPosts.find(jobPost => jobPost.id === jobPostId)
  const getEntityCity = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.city || '' : getCompanyById(entityId)?.city || ''
  const getEntityCategoryLabel = (entityType: WalletEntityType, entityId: string) => {
    if (entityType === 'worker') {
      const worker = getWorkerById(entityId)
      return worker ? worker.categoryIds.map(getCategoryName).join(', ') : ''
    }

    const company = getCompanyById(entityId)
    return company ? company.categoryIds.map(getCategoryName).join(', ') : ''
  }
  const getEntityStatusLabel = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.status || '' : getCompanyById(entityId)?.status || ''

  const activeWorkerPlan =
    snapshot.plans.find(plan => plan.audience === 'worker' && plan.isActive) ||
    snapshot.plans.find(plan => plan.audience === 'worker') ||
    null

  const expiredJobPostsCount = snapshot.jobPosts.filter(isExpiredJobPost).length
  const workerRegistrationRevenue = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.transactionType === 'registration_fee' && transaction.direction === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const workerWalletRevenue = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'worker' && transaction.transactionType !== 'registration_fee')
    .reduce((sum, transaction) => sum + (transaction.direction === 'credit' ? transaction.amount : -transaction.amount), 0)

  const companyRegistrationRevenue = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'company' && transaction.transactionType === 'registration_fee' && transaction.direction === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const companyPlanRevenue = snapshot.walletTransactions
    .filter(transaction => transaction.entityType === 'company' && transaction.transactionType === 'plan_purchase' && transaction.direction === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const registrationRevenue = workerRegistrationRevenue + companyRegistrationRevenue
  const walletRevenue = workerWalletRevenue + companyPlanRevenue

  const categoryDemandRows = snapshot.categories
    .map(category => {
      const workersCount = snapshot.workers.filter(worker => worker.categoryIds.includes(category.id)).length
      const activeWorkersCount = snapshot.workers.filter(
        worker => worker.categoryIds.includes(category.id) && worker.status === 'active'
      ).length
      const companiesCount = snapshot.companies.filter(company => company.categoryIds.includes(category.id)).length
      const liveJobsCount = snapshot.jobPosts.filter(
        jobPost => jobPost.categoryId === category.id && jobPost.status === 'live'
      ).length
      const expiredJobsCount = snapshot.jobPosts.filter(
        jobPost => jobPost.categoryId === category.id && isExpiredJobPost(jobPost)
      ).length

      return {
        id: category.id,
        name: category.name,
        demandLevel: category.demandLevel,
        workersCount,
        activeWorkersCount,
        companiesCount,
        liveJobsCount,
        expiredJobsCount,
        demandScore: liveJobsCount * 3 + companiesCount * 2 + activeWorkersCount
      }
    })
    .sort((left, right) => right.demandScore - left.demandScore || left.name.localeCompare(right.name))

  const workerStatusBreakdown = workerStatuses.map(status => ({
    status,
    count: snapshot.workers.filter(worker => worker.status === status).length
  }))

  const companyStatusBreakdown = companyStatuses.map(status => ({
    status,
    count: snapshot.companies.filter(company => company.status === status).length
  }))

  const jobLifecycleBreakdown = jobPostStatuses.map(status => ({
    status,
    count: snapshot.jobPosts.filter(jobPost => jobPost.status === status).length
  }))

  const moderationQueue = [
    ...snapshot.workers
      .filter(worker => worker.status === 'pending' || worker.status === 'blocked' || worker.status === 'rejected')
      .map(worker => ({
        id: `worker-${worker.id}`,
        type: 'Worker',
        name: worker.fullName,
        city: worker.city,
        status: worker.status,
        note:
          worker.status === 'pending'
            ? 'Review profile and wallet setup before activation.'
            : 'Needs moderation review before being visible in the marketplace.'
      })),
    ...snapshot.companies
      .filter(company => company.status === 'pending' || company.status === 'blocked')
      .map(company => ({
        id: `company-${company.id}`,
        type: 'Company',
        name: company.companyName,
        city: company.city,
        status: company.status,
        note:
          company.status === 'pending'
            ? 'Confirm registration fee and plan before activating.'
            : 'Company has been blocked and needs admin follow-up.'
      })),
    ...snapshot.jobPosts
      .filter(jobPost => isExpiredJobPost(jobPost) || jobPost.status === 'paused')
      .map(jobPost => ({
        id: `job-${jobPost.id}`,
        type: 'Job Post',
        name: jobPost.title,
        city: jobPost.city,
        status: isExpiredJobPost(jobPost) ? 'expired' : jobPost.status,
        note: isExpiredJobPost(jobPost)
          ? 'Posting validity ended and should be renewed or archived.'
          : 'Paused job post needs review before going live again.'
      }))
  ].slice(0, 8)

  const walletTransactions = [...snapshot.walletTransactions].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const rechargeRequests = [...snapshot.rechargeRequests].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const filteredCategories = snapshot.categories.filter(category => {
    if (categoryFilters.demand !== 'all' && category.demandLevel !== categoryFilters.demand) return false
    if (categoryFilters.activity === 'active' && !category.isActive) return false
    if (categoryFilters.activity === 'inactive' && category.isActive) return false

    return matchesSearch(categoryFilters.search, [category.name, category.slug, category.description, category.demandLevel])
  })

  const filteredPlans = snapshot.plans.filter(plan => {
    if (planFilters.audience !== 'all' && plan.audience !== planFilters.audience) return false
    if (planFilters.categoryId && (plan.categoryId || '') !== planFilters.categoryId) return false
    if (planFilters.activity === 'active' && !plan.isActive) return false
    if (planFilters.activity === 'inactive' && plan.isActive) return false

    return matchesSearch(planFilters.search, [
      plan.name,
      plan.description,
      plan.audience,
      getCategoryName(plan.categoryId || '')
    ])
  })

  const filteredWorkers = snapshot.workers.filter(worker => {
    if (workerFilters.status !== 'all' && worker.status !== workerFilters.status) return false
    if (workerFilters.categoryId && !worker.categoryIds.includes(workerFilters.categoryId)) return false
    if (workerFilters.visibility === 'visible' && !worker.isVisible) return false
    if (workerFilters.visibility === 'hidden' && worker.isVisible) return false
    if (workerFilters.kyc !== 'all' && getWorkerKycState(worker) !== workerFilters.kyc) return false

    return matchesSearch(workerFilters.search, [
      worker.fullName,
      worker.mobile,
      worker.city,
      worker.status,
      getWorkerKycLabel(worker),
      formatIdentityProofType(worker.identityProofType),
      worker.categoryIds.map(getCategoryName).join(', ')
    ])
  })
  const selectedWorkerReview =
    filteredWorkers.find(worker => worker.id === selectedWorkerReviewId) ||
    filteredWorkers.find(worker => getWorkerKycState(worker) === 'ready_for_review') ||
    filteredWorkers[0] ||
    null

  const filteredCompanies = snapshot.companies.filter(company => {
    if (companyFilters.status !== 'all' && company.status !== companyFilters.status) return false
    if (companyFilters.categoryId && !company.categoryIds.includes(companyFilters.categoryId)) return false
    if (companyFilters.fee === 'paid' && !company.registrationFeePaid) return false
    if (companyFilters.fee === 'pending' && company.registrationFeePaid) return false

    return matchesSearch(companyFilters.search, [
      company.companyName,
      company.contactPerson,
      company.email,
      company.mobile,
      company.city,
      company.status,
      company.categoryIds.map(getCategoryName).join(', ')
    ])
  })

  const filteredJobPosts = snapshot.jobPosts.filter(jobPost => {
    const effectiveStatus = isExpiredJobPost(jobPost) ? 'expired' : jobPost.status

    if (jobFilters.status !== 'all' && effectiveStatus !== jobFilters.status) return false
    if (jobFilters.categoryId && jobPost.categoryId !== jobFilters.categoryId) return false
    if (jobFilters.companyId && jobPost.companyId !== jobFilters.companyId) return false

    return matchesSearch(jobFilters.search, [
      jobPost.title,
      jobPost.description,
      jobPost.city,
      getCategoryName(jobPost.categoryId),
      getCompanyName(jobPost.companyId),
      effectiveStatus
    ])
  })
  const filteredJobApplications = snapshot.jobApplications.filter(application => {
    if (jobApplicationFilters.status !== 'all' && application.status !== jobApplicationFilters.status) return false
    if (jobApplicationFilters.companyId && application.companyId !== jobApplicationFilters.companyId) return false
    if (jobApplicationFilters.jobPostId && application.jobPostId !== jobApplicationFilters.jobPostId) return false

    const worker = getWorkerById(application.workerId)
    const company = getCompanyById(application.companyId)
    const jobPost = getJobPostById(application.jobPostId)

    return matchesSearch(jobApplicationFilters.search, [
      worker?.fullName || '',
      worker?.mobile || '',
      company?.companyName || '',
      company?.contactPerson || '',
      jobPost?.title || '',
      jobPost?.city || '',
      application.status,
      application.note
    ])
  })
  const selectedJobApplication =
    filteredJobApplications.find(application => application.id === selectedJobApplicationId) ||
    filteredJobApplications.find(application => application.status === 'submitted') ||
    filteredJobApplications[0] ||
    null
  const companyApplicationAuditRows = snapshot.companies
    .map(company => {
      const applications = snapshot.jobApplications.filter(application => application.companyId === company.id)
      const companyJobPosts = snapshot.jobPosts.filter(jobPost => jobPost.companyId === company.id)
      const latestActivity = applications
        .slice()
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] || null

      return {
        company,
        applications,
        submittedCount: applications.filter(application => application.status === 'submitted').length,
        reviewedCount: applications.filter(application => application.status === 'reviewed').length,
        shortlistedCount: applications.filter(application => application.status === 'shortlisted').length,
        rejectedCount: applications.filter(application => application.status === 'rejected').length,
        hiredCount: applications.filter(application => application.status === 'hired').length,
        liveJobsCount: companyJobPosts.filter(jobPost => !isExpiredJobPost(jobPost) && jobPost.status === 'live').length,
        latestActivity
      }
    })
    .filter(row => row.applications.length > 0)
    .sort((left, right) => {
      if (right.submittedCount !== left.submittedCount) return right.submittedCount - left.submittedCount
      return right.applications.length - left.applications.length
    })
  const selectedCompanyAudit =
    companyApplicationAuditRows.find(row => row.company.id === selectedCompanyAuditId) ||
    companyApplicationAuditRows.find(row => row.company.id === jobApplicationFilters.companyId) ||
    (selectedJobApplication ? companyApplicationAuditRows.find(row => row.company.id === selectedJobApplication.companyId) : null) ||
    companyApplicationAuditRows[0] ||
    null
  const selectedCompanyAuditApplications = selectedCompanyAudit
    ? filteredJobApplications
      .filter(application => application.companyId === selectedCompanyAudit.company.id)
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    : []
  const recentCompanyActionRows = snapshot.jobApplications
    .filter(application => application.status !== 'submitted')
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 8)
  const filteredSavedJobs = snapshot.savedJobs.filter(savedJob => {
    const worker = getWorkerById(savedJob.workerId)
    const jobPost = getJobPostById(savedJob.jobPostId)
    const company = jobPost ? getCompanyById(jobPost.companyId) : null

    if (savedJobFilters.companyId && company?.id !== savedJobFilters.companyId) return false
    if (savedJobFilters.jobPostId && savedJob.jobPostId !== savedJobFilters.jobPostId) return false

    return matchesSearch(savedJobFilters.search, [
      worker?.fullName || '',
      worker?.mobile || '',
      worker?.city || '',
      jobPost?.title || '',
      jobPost?.city || '',
      company?.companyName || ''
    ])
  })
  const selectedSavedJob =
    filteredSavedJobs.find(savedJob => savedJob.id === selectedSavedJobId) ||
    filteredSavedJobs[0] ||
    null
  const filteredWorkerNotifications = snapshot.workerNotifications.filter(notification => {
    if (workerNotificationFilters.workerId && notification.workerId !== workerNotificationFilters.workerId) return false
    if (workerNotificationFilters.type !== 'all' && notification.type !== workerNotificationFilters.type) return false
    if (workerNotificationFilters.priority !== 'all' && notification.priority !== workerNotificationFilters.priority) return false
    if (workerNotificationFilters.readState === 'read' && !notification.isRead) return false
    if (workerNotificationFilters.readState === 'unread' && notification.isRead) return false

    const worker = getWorkerById(notification.workerId)
    const jobPost = notification.relatedJobPostId ? getJobPostById(notification.relatedJobPostId) : null
    const company = notification.relatedCompanyId ? getCompanyById(notification.relatedCompanyId) : null

    return matchesSearch(workerNotificationFilters.search, [
      worker?.fullName || '',
      worker?.mobile || '',
      worker?.city || '',
      notification.title,
      notification.message,
      notification.type,
      notification.priority,
      company?.companyName || '',
      jobPost?.title || ''
    ])
  })
  const selectedWorkerNotification =
    filteredWorkerNotifications.find(notification => notification.id === selectedWorkerNotificationId) ||
    filteredWorkerNotifications.find(notification => !notification.isRead) ||
    filteredWorkerNotifications[0] ||
    null

  const filteredWalletTransactions = walletTransactions.filter(transaction => {
    if (walletFilters.audience !== 'all' && transaction.entityType !== walletFilters.audience) return false
    if (walletFilters.transactionType !== 'all' && transaction.transactionType !== walletFilters.transactionType) return false
    if (walletFilters.status !== 'all' && transaction.status !== walletFilters.status) return false

    return matchesSearch(walletFilters.search, [
      transaction.entityName,
      transaction.city,
      transaction.reference,
      transaction.transactionType,
      transaction.entityType
    ])
  })

  const filteredRechargeRequests = rechargeRequests.filter(request => {
    if (rechargeFilters.priority !== 'all' && request.priority !== rechargeFilters.priority) return false
    if (rechargeFilters.type !== 'all' && request.requestType !== rechargeFilters.type) return false
    if (rechargeFilters.status !== 'all' && request.requestStatus !== rechargeFilters.status) return false

    return matchesSearch(rechargeFilters.search, [
      request.name,
      request.city,
      request.categoryLabel,
      request.statusLabel,
      request.requestStatus,
      request.note
    ])
  })

  const filteredAuditLogs = snapshot.auditLogs.filter(log => {
    if (auditFilters.entityType !== 'all' && log.entityType !== auditFilters.entityType) return false
    return matchesSearch(auditFilters.search, [log.summary, log.entityType, log.entityId, log.actor, log.action])
  })
  const unreadWorkerNotificationsCount = snapshot.workerNotifications.filter(notification => !notification.isRead).length
  const pendingWorkerKycCount = snapshot.workers.filter(worker => getWorkerKycState(worker) === 'ready_for_review').length
  const pendingCompanyApprovalsCount = snapshot.companies.filter(company => company.status === 'pending').length
  const openRechargeRequestsCount = rechargeRequests.filter(request => request.requestStatus === 'open').length
  const savedJobConversionRate = snapshot.savedJobs.length === 0
    ? 0
    : Math.round((snapshot.jobApplications.length / snapshot.savedJobs.length) * 100)
  const enabledAutomationCount = Object.entries(settingsDraft.automationControls)
    .filter(([key, value]) => key !== 'pendingKycEscalationHours' && value === true)
    .length
  const pendingKycReviewCount = snapshot.workers.filter(
    worker =>
      worker.registrationCompletedAt &&
      worker.identityProofType &&
      worker.identityProofNumber &&
      worker.identityProofPath &&
      worker.status === 'pending'
  ).length
  const categoryReportRows = categoryDemandRows.map(row => ({
    category: row.name,
    demandLevel: row.demandLevel,
    activeWorkers: row.activeWorkersCount,
    totalWorkers: row.workersCount,
    companies: row.companiesCount,
    liveJobs: row.liveJobsCount,
    expiredJobs: row.expiredJobsCount,
    demandScore: row.demandScore
  }))
  const cityKeys = Array.from(new Set([
    ...snapshot.jobPosts.map(jobPost => jobPost.city.trim() || 'Unknown'),
    ...snapshot.workers.map(worker => worker.city.trim() || 'Unknown'),
    ...snapshot.companies.map(company => company.city.trim() || 'Unknown')
  ]))
  const cityReportRows = cityKeys
    .map(city => {
      const normalizedCity = city.toLowerCase()
      const cityJobPosts = snapshot.jobPosts.filter(jobPost => (jobPost.city.trim() || 'Unknown').toLowerCase() === normalizedCity)
      const cityCompanies = snapshot.companies.filter(company => (company.city.trim() || 'Unknown').toLowerCase() === normalizedCity)
      const cityWorkers = snapshot.workers.filter(worker => (worker.city.trim() || 'Unknown').toLowerCase() === normalizedCity)
      const jobPostIds = new Set(cityJobPosts.map(jobPost => jobPost.id))

      return {
        city,
        liveJobs: cityJobPosts.filter(jobPost => jobPost.status === 'live').length,
        applications: snapshot.jobApplications.filter(application => jobPostIds.has(application.jobPostId)).length,
        workers: cityWorkers.length,
        companies: cityCompanies.length
      }
    })
    .sort((left, right) => right.liveJobs - left.liveJobs || right.applications - left.applications || left.city.localeCompare(right.city))
    .slice(0, 10)
  const exportRows = {
    workers: snapshot.workers.map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      mobile: worker.mobile,
      city: worker.city,
      status: worker.status,
      kycState: getWorkerKycState(worker),
      categories: worker.categoryIds.map(getCategoryName).join(', '),
      walletBalance: worker.walletBalance,
      isVisible: worker.isVisible,
      registrationCompletedAt: worker.registrationCompletedAt
    })),
    companies: snapshot.companies.map(company => ({
      id: company.id,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      mobile: company.mobile,
      city: company.city,
      status: company.status,
      registrationFeePaid: company.registrationFeePaid,
      activePlan: getPlanName(company.activePlan),
      categories: company.categoryIds.map(getCategoryName).join(', ')
    })),
    jobPosts: snapshot.jobPosts.map(jobPost => ({
      id: jobPost.id,
      title: jobPost.title,
      company: getCompanyName(jobPost.companyId),
      category: getCategoryName(jobPost.categoryId),
      city: jobPost.city,
      wageAmount: jobPost.wageAmount,
      workersNeeded: jobPost.workersNeeded,
      status: jobPost.status,
      publishedAt: jobPost.publishedAt,
      expiresAt: jobPost.expiresAt
    })),
    applications: snapshot.jobApplications.map(application => ({
      id: application.id,
      worker: getWorkerById(application.workerId)?.fullName || '',
      workerMobile: getWorkerById(application.workerId)?.mobile || '',
      company: getCompanyName(application.companyId),
      jobPost: getJobPostById(application.jobPostId)?.title || '',
      status: application.status,
      appliedAt: application.appliedAt,
      note: application.note
    })),
    savedJobs: snapshot.savedJobs.map(savedJob => ({
      id: savedJob.id,
      worker: getWorkerById(savedJob.workerId)?.fullName || '',
      workerMobile: getWorkerById(savedJob.workerId)?.mobile || '',
      company: getCompanyName(getJobPostById(savedJob.jobPostId)?.companyId || ''),
      jobPost: getJobPostById(savedJob.jobPostId)?.title || '',
      savedAt: savedJob.createdAt
    })),
    notifications: snapshot.workerNotifications.map(notification => ({
      id: notification.id,
      worker: getWorkerById(notification.workerId)?.fullName || '',
      workerMobile: getWorkerById(notification.workerId)?.mobile || '',
      type: notification.type,
      title: notification.title,
      priority: notification.priority,
      isRead: notification.isRead,
      company: getCompanyName(notification.relatedCompanyId || ''),
      jobPost: getJobPostById(notification.relatedJobPostId || '')?.title || '',
      createdAt: notification.createdAt
    })),
    wallet: walletTransactions.map(transaction => ({
      id: transaction.id,
      entityType: transaction.entityType,
      entityName: transaction.entityName,
      city: transaction.city,
      transactionType: transaction.transactionType,
      direction: transaction.direction,
      amount: transaction.amount,
      status: transaction.status,
      reference: transaction.reference,
      createdAt: transaction.createdAt
    })),
    recharge: rechargeRequests.map(request => ({
      id: request.id,
      requestType: request.requestType,
      name: request.name,
      city: request.city,
      priority: request.priority,
      status: request.requestStatus,
      suggestedAmount: request.suggestedAmount,
      note: request.note,
      createdAt: request.createdAt
    })),
    categories: categoryReportRows,
    cities: cityReportRows
  }

  const downloadReportFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportCsvReport = (name: keyof typeof exportRows) => {
    downloadReportFile(
      `scalevyapar-${name}-report.csv`,
      createCsvContent(exportRows[name]),
      'text/csv;charset=utf-8;'
    )
    showSaved(`${titleCase(name)} report exported`)
  }

  const exportJsonSnapshot = () => {
    downloadReportFile(
      'scalevyapar-labour-snapshot.json',
      JSON.stringify(snapshot, null, 2),
      'application/json;charset=utf-8;'
    )
    showSaved('Full labour snapshot exported')
  }

  const validateCategory = () => {
    const name = categoryDraft.name.trim()
    const slug = slugify(categoryDraft.slug || categoryDraft.name)

    if (!name) return 'Category name is required.'
    if (!slug) return 'Category slug is required.'

    const duplicateName = snapshot.categories.find(
      category => category.id !== editingCategoryId && category.name.toLowerCase() === name.toLowerCase()
    )
    if (duplicateName) return 'A category with this name already exists.'

    const duplicateSlug = snapshot.categories.find(
      category => category.id !== editingCategoryId && category.slug.toLowerCase() === slug.toLowerCase()
    )
    if (duplicateSlug) return 'A category with this slug already exists.'

    return ''
  }

  const validatePlan = () => {
    if (!planDraft.name.trim()) return 'Plan name is required.'
    if (planDraft.validityDays <= 0) return 'Plan validity must be greater than 0 days.'
    if (planDraft.registrationFee < 0 || planDraft.walletCredit < 0 || planDraft.planAmount < 0 || planDraft.dailyCharge < 0) {
      return 'Plan amounts cannot be negative.'
    }

    if (planDraft.audience === 'worker' && planDraft.dailyCharge <= 0) {
      return 'Worker plans should have a daily charge.'
    }

    if (planDraft.audience === 'company' && planDraft.planAmount <= 0) {
      return 'Company plans should have a plan amount.'
    }

    const duplicateName = snapshot.plans.find(
      plan =>
        plan.id !== editingPlanId &&
        plan.audience === planDraft.audience &&
        plan.name.trim().toLowerCase() === planDraft.name.trim().toLowerCase()
    )

    if (duplicateName) return 'A plan with this name already exists for the selected audience.'
    return ''
  }

  const validateWorker = () => {
    if (!workerDraft.fullName.trim()) return 'Worker name is required.'
    if (!workerDraft.mobile.trim()) return 'Worker mobile is required.'
    if (!isTenDigitMobile(workerDraft.mobile)) return 'Worker mobile must be exactly 10 digits.'
    if (workerDraft.categoryIds.length === 0) return 'Select at least one worker category.'
    if (workerDraft.experienceYears < 0 || workerDraft.expectedDailyWage < 0 || workerDraft.walletBalance < 0) {
      return 'Worker experience, wage and wallet balance must be non-negative.'
    }

    const duplicateMobile = snapshot.workers.find(
      worker => worker.id !== editingWorkerId && worker.mobile.trim() === workerDraft.mobile.trim()
    )
    if (duplicateMobile) return 'Another worker already uses this mobile number.'

    return ''
  }

  const validateCompany = () => {
    if (!companyDraft.companyName.trim()) return 'Company name is required.'
    if (!companyDraft.contactPerson.trim()) return 'Contact person is required.'
    if (!companyDraft.email.trim()) return 'Company email is required.'
    if (!isValidEmail(companyDraft.email)) return 'Enter a valid company email address.'
    if (!companyDraft.mobile.trim()) return 'Company mobile is required.'
    if (!isTenDigitMobile(companyDraft.mobile)) return 'Company mobile must be exactly 10 digits.'
    if (companyDraft.categoryIds.length === 0) return 'Select at least one company category.'
    if (companyDraft.status === 'active' && !companyDraft.activePlan) return 'Active companies should have a plan selected.'

    const duplicateMobile = snapshot.companies.find(
      company => company.id !== editingCompanyId && company.mobile.trim() === companyDraft.mobile.trim()
    )
    if (duplicateMobile) return 'Another company already uses this mobile number.'

    const normalizedEmail = companyDraft.email.trim().toLowerCase()
    const duplicateEmail = snapshot.companies.find(
      company => company.id !== editingCompanyId && company.email.trim().toLowerCase() === normalizedEmail
    )
    if (duplicateEmail) return 'Another company already uses this email address.'

    return ''
  }

  const validateJobPost = () => {
    if (!jobPostDraft.title.trim()) return 'Job title is required.'
    if (!jobPostDraft.companyId) return 'Company is required.'
    if (!jobPostDraft.categoryId) return 'Category is required.'
    if (jobPostDraft.workersNeeded <= 0) return 'Workers needed must be greater than 0.'
    if (jobPostDraft.validityDays <= 0) return 'Validity days must be greater than 0.'
    if (jobPostDraft.wageAmount < 0) return 'Wage amount cannot be negative.'
    return ''
  }

  const validateWalletTransaction = () => {
    if (!walletTransactionDraft.entityId) return 'Select a worker or company for the transaction.'
    if (walletTransactionDraft.amount <= 0) return 'Transaction amount must be greater than 0.'
    if (!walletTransactionDraft.reference.trim()) return 'Reference is required for tracking.'
    return ''
  }

  const validateRechargeRequest = () => {
    if (!rechargeRequestDraft.relatedEntityId) return 'Select a worker or company for the request.'
    if (!rechargeRequestDraft.name.trim()) return 'Request name is required.'
    if (rechargeRequestDraft.suggestedAmount < 0) return 'Suggested amount cannot be negative.'
    if (!rechargeRequestDraft.note.trim()) return 'Add a follow-up note for the request.'
    return ''
  }

  const saveCategory = async () => {
    setError('')
    const validationError = validateCategory()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...categoryDraft,
      slug: slugify(categoryDraft.slug || categoryDraft.name)
    }

    const ok = await persistEntity(
      editingCategoryId ? 'PUT' : 'POST',
      'categories',
      payload,
      editingCategoryId || undefined
    )

    if (!ok) return
    resetCategoryDraft()
    showSaved('Category saved')
  }

  const savePlan = async () => {
    setError('')
    const validationError = validatePlan()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...planDraft,
      categoryId: planDraft.categoryId || ''
    }

    const ok = await persistEntity(
      editingPlanId ? 'PUT' : 'POST',
      'plans',
      payload,
      editingPlanId || undefined
    )

    if (!ok) return
    resetPlanDraft()
    showSaved('Plan saved')
  }

  const saveWorker = async () => {
    setError('')
    const validationError = validateWorker()
    if (validationError) {
      setError(validationError)
      return
    }

    const ok = await persistEntity(
      editingWorkerId ? 'PUT' : 'POST',
      'workers',
      workerDraft,
      editingWorkerId || undefined
    )

    if (!ok) return
    resetWorkerDraft()
    showSaved('Worker saved')
  }

  const reviewWorkerKyc = async (worker: LabourWorker, decision: 'approve' | 'reject') => {
    setError('')
    if (!isWorkerKycSubmitted(worker)) {
      setError('Worker has not submitted the full KYC set yet.')
      return
    }

    const nextStatus: WorkerStatus =
      decision === 'approve'
        ? worker.walletBalance > 0
          ? 'active'
          : 'inactive_wallet_empty'
        : 'rejected'
    const nextVisibility = decision === 'approve' ? worker.walletBalance > 0 : false

    const ok = await persistEntity('PUT', 'workers', {
      status: nextStatus,
      isVisible: nextVisibility
    }, worker.id)

    if (!ok) return

    setSelectedWorkerReviewId(worker.id)
    showSaved(
      decision === 'approve'
        ? worker.walletBalance > 0
          ? `${worker.fullName} approved and activated`
          : `${worker.fullName} approved. Wallet recharge is still needed for activation`
        : `${worker.fullName} KYC rejected`
    )
  }

  const updateJobApplicationStatus = async (
    application: LabourJobApplication,
    status: JobApplicationStatus,
    note?: string
  ) => {
    setError('')
    const ok = await persistEntity('PUT', 'jobApplications', {
      status,
      note: typeof note === 'string' ? note : application.note
    }, application.id)

    if (!ok) return

    setSelectedJobApplicationId(application.id)
    showSaved('Application updated')
  }

  const sendWorkerNotification = async () => {
    setError('')
    if (!workerNotificationDraft.workerId) {
      setError('Choose a worker for the notification.')
      return
    }

    if (!workerNotificationDraft.title.trim()) {
      setError('Notification title is required.')
      return
    }

    if (!workerNotificationDraft.message.trim()) {
      setError('Notification message is required.')
      return
    }

    const response = await fetch('/api/admin/labour/worker-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...workerNotificationDraft,
        relatedCompanyId:
          workerNotificationDraft.relatedCompanyId ||
          getJobPostById(workerNotificationDraft.relatedJobPostId)?.companyId ||
          ''
      })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to send worker notification.')
      return
    }

    replaceSnapshot(data.snapshot)
    setSelectedWorkerNotificationId(null)
    resetWorkerNotificationDraft()
    showSaved('Worker notification sent')
  }

  const resendSelectedWorkerNotification = async (notification: LabourWorkerNotification) => {
    setError('')
    const response = await fetch('/api/admin/labour/worker-notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notification.id })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to resend worker notification.')
      return
    }

    replaceSnapshot(data.snapshot)
    setSelectedWorkerNotificationId(notification.id)
    showSaved('Push notification resent')
  }

  const toggleWorkerNotificationReadState = async (
    notification: LabourWorkerNotification,
    isRead: boolean
  ) => {
    setError('')
    const ok = await persistEntity('PUT', 'workerNotifications', { isRead }, notification.id)
    if (!ok) return
    setSelectedWorkerNotificationId(notification.id)
    showSaved(isRead ? 'Notification marked read' : 'Notification marked unread')
  }

  const saveCompany = async () => {
    setError('')
    const validationError = validateCompany()
    if (validationError) {
      setError(validationError)
      return
    }

    const ok = await persistEntity(
      editingCompanyId ? 'PUT' : 'POST',
      'companies',
      companyDraft,
      editingCompanyId || undefined
    )

    if (!ok) return
    resetCompanyDraft()
    showSaved('Company saved')
  }

  const saveJobPost = async () => {
    setError('')
    const validationError = validateJobPost()
    if (validationError) {
      setError(validationError)
      return
    }

    const publishedAt = jobPostDraft.publishedAt || new Date().toISOString().slice(0, 10)
    const payload = {
      ...jobPostDraft,
      publishedAt,
      expiresAt: jobPostDraft.expiresAt || addDays(publishedAt, jobPostDraft.validityDays)
    }

    const ok = await persistEntity(
      editingJobPostId ? 'PUT' : 'POST',
      'jobPosts',
      payload,
      editingJobPostId || undefined
    )

    if (!ok) return
    resetJobPostDraft()
    showSaved('Job post saved')
  }

  const saveWalletTransaction = async () => {
    setError('')
    const validationError = validateWalletTransaction()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...walletTransactionDraft,
      entityName: getEntityName(walletTransactionDraft.entityType, walletTransactionDraft.entityId) || walletTransactionDraft.entityName,
      city: getEntityCity(walletTransactionDraft.entityType, walletTransactionDraft.entityId) || walletTransactionDraft.city
    }

    const ok = await persistEntity(
      editingWalletTransactionId ? 'PUT' : 'POST',
      'walletTransactions',
      payload,
      editingWalletTransactionId || undefined
    )

    if (!ok) return
    resetWalletTransactionDraft()
    showSaved('Wallet transaction saved')
  }

  const saveRechargeRequest = async () => {
    setError('')
    const validationError = validateRechargeRequest()
    if (validationError) {
      setError(validationError)
      return
    }

    const relatedEntityType = rechargeRequestDraft.requestType === 'worker_recharge' ? 'worker' : 'company'
    const payload = {
      ...rechargeRequestDraft,
      relatedEntityType,
      name: getEntityName(relatedEntityType, rechargeRequestDraft.relatedEntityId) || rechargeRequestDraft.name,
      city: getEntityCity(relatedEntityType, rechargeRequestDraft.relatedEntityId) || rechargeRequestDraft.city,
      categoryLabel: getEntityCategoryLabel(relatedEntityType, rechargeRequestDraft.relatedEntityId) || rechargeRequestDraft.categoryLabel,
      statusLabel: getEntityStatusLabel(relatedEntityType, rechargeRequestDraft.relatedEntityId) || rechargeRequestDraft.statusLabel
    }

    const ok = await persistEntity(
      editingRechargeRequestId ? 'PUT' : 'POST',
      'rechargeRequests',
      payload,
      editingRechargeRequestId || undefined
    )

    if (!ok) return
    resetRechargeRequestDraft()
    showSaved('Recharge request saved')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {(saved || error) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          {error || saved}
        </div>
      )}

      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '800' }}>
            LX
          </div>
          <div>
            <p style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>Labour Exchange</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>
              Dashboard, worker management, companies, categories, job posts, plans, reports and moderation.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ ...subtleButtonStyle, textDecoration: 'none' }}>
            Back To Admin
          </Link>
          <button onClick={() => void fetchSnapshot()} style={primaryButtonStyle}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 32px 40px' }}>
        <div style={{ ...cardStyle, marginBottom: '20px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Storage Mode
            </p>
            <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
              {snapshot.storage === 'supabase'
                ? 'This module is currently reading and writing live Supabase tables.'
                : 'This module is currently using the local JSON fallback because the Supabase labour tables do not exist yet.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['categories', 'plans', 'workers', 'companies', 'jobPosts', 'workerNotifications'].map(key => (
              <button
                key={key}
                onClick={() => openAddForm(key as LabourSection)}
                style={subtleButtonStyle}
              >
                Add {sectionLabels[key as LabourSection].slice(0, -1)}
              </button>
            ))}
            <a href="/admin/labour/website" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Edit Website
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {[
            { label: 'Active Workers', value: snapshot.stats.activeWorkers, accent: '#10b981' },
            { label: 'Inactive Workers', value: snapshot.stats.inactiveWorkers, accent: '#f59e0b' },
            { label: 'Active Companies', value: snapshot.stats.activeCompanies, accent: '#2563eb' },
            { label: 'Live Job Posts', value: snapshot.stats.liveJobPosts, accent: '#7c3aed' },
            { label: 'Expired Job Posts', value: expiredJobPostsCount, accent: '#dc2626' },
            { label: 'Applications', value: snapshot.jobApplications.length, accent: '#0f766e' },
            { label: 'Unread Alerts', value: snapshot.workerNotifications.filter(notification => !notification.isRead).length, accent: '#b45309' },
            { label: 'Wallet Revenue', value: formatCurrency(walletRevenue), accent: '#0f172a' },
            { label: 'Registration Revenue', value: formatCurrency(registrationRevenue), accent: '#1d4ed8' }
          ].map(card => (
            <div key={card.label} style={{ ...cardStyle, padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '26px', color: card.accent, fontWeight: '800' }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
          {Object.entries(sectionLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as LabourSection)}
              style={{
                padding: '10px 16px',
                border: `1px solid ${activeSection === key ? '#cbd5e1' : '#e2e8f0'}`,
                background: activeSection === key ? '#ffffff' : '#f8fafc',
                color: activeSection === key ? '#0f172a' : '#64748b',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeSection === key ? '700' : '600'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={cardStyle}>
                <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '20px' }}>Admin module coverage</h2>
                <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                  This admin module now covers dashboard tracking, worker management, company management, categories, job posts, pricing plans, wallet transaction monitoring, recharge follow-up, reports and moderation.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  {[
                    `Categories: ${snapshot.categories.length}`,
                    `Plans: ${snapshot.plans.length}`,
                    `Workers: ${snapshot.workers.length}`,
                    `Companies: ${snapshot.companies.length}`,
                    `Job Posts: ${snapshot.jobPosts.length}`,
                    `Applications: ${snapshot.jobApplications.length}`,
                    `Saved Jobs: ${snapshot.savedJobs.length}`,
                    `Worker Alerts: ${snapshot.workerNotifications.length}`,
                    `Wallet Entries: ${walletTransactions.length}`,
                    `Recharge Follow-ups: ${rechargeRequests.length}`,
                    `Audit Logs: ${snapshot.auditLogs.length}`
                  ].map(item => (
                    <div key={item} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px' }}>Category-wise demand</h3>
                  <button onClick={() => setActiveSection('reports')} style={subtleButtonStyle}>Open Reports</button>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {categoryDemandRows.map(row => (
                    <div key={row.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>{row.name}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{row.demandLevel} demand</p>
                      </div>
                      <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13px' }}>
                        Active workers {row.activeWorkersCount} | Total workers {row.workersCount} | Companies {row.companiesCount} | Live jobs {row.liveJobsCount} | Expired jobs {row.expiredJobsCount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px' }}>Recent admin activity</h3>
                  <button onClick={() => setActiveSection('auditLogs')} style={subtleButtonStyle}>Open Audit Logs</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {snapshot.stats.recentAuditLogs.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No changes logged yet.</p>
                  ) : (
                    snapshot.stats.recentAuditLogs.map(log => (
                      <div key={log.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{log.summary}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{log.actor} | {formatDateTime(log.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '17px' }}>Moderation queue</h3>
                  <button onClick={() => setActiveSection('reports')} style={subtleButtonStyle}>Open Moderation</button>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {moderationQueue.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Nothing is waiting for moderation right now.</p>
                  ) : (
                    moderationQueue.map(item => (
                      <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{item.type}: {item.name}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px' }}>{item.city || 'No city'} | {titleCase(item.status)}</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{item.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: '390px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingCategoryId ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={resetCategoryDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Category Name *</label>
                  <input value={categoryDraft.name} onChange={event => setCategoryDraft(current => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Slug *</label>
                  <input value={categoryDraft.slug} onChange={event => setCategoryDraft(current => ({ ...current, slug: slugify(event.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Demand Level</label>
                  <select value={categoryDraft.demandLevel} onChange={event => setCategoryDraft(current => ({ ...current, demandLevel: event.target.value as DemandLevel }))} style={inputStyle}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={categoryDraft.description} onChange={event => setCategoryDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={categoryDraft.isActive} onChange={event => setCategoryDraft(current => ({ ...current, isActive: event.target.checked }))} />
                  Category is active
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveCategory} style={primaryButtonStyle}>Save Category</button>
                  <button onClick={resetCategoryDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Categories</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search categories" value={categoryFilters.search} onChange={event => setCategoryFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={categoryFilters.demand} onChange={event => setCategoryFilters(current => ({ ...current, demand: event.target.value as CategoryFilters['demand'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Demand</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select value={categoryFilters.activity} onChange={event => setCategoryFilters(current => ({ ...current, activity: event.target.value as CategoryFilters['activity'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredCategories.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No categories match the current filters.</p>
                ) : (
                  filteredCategories.map(category => (
                    <div key={category.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{category.name}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>{category.slug} | {category.demandLevel} demand | {category.isActive ? 'Active' : 'Inactive'}</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{category.description || 'No description yet.'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setCategoryDraft(category); setEditingCategoryId(category.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('categories', category.id, category.name)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'plans' && (
          <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingPlanId ? 'Edit Plan' : 'Add Plan'}</h2>
                <button onClick={resetPlanDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Plan Name *</label>
                  <input value={planDraft.name} onChange={event => setPlanDraft(current => ({ ...current, name: event.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Audience</label>
                    <select value={planDraft.audience} onChange={event => setPlanDraft(current => ({ ...current, audience: event.target.value as PlanAudience }))} style={inputStyle}>
                      <option value="worker">Worker</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category Override</label>
                    <select value={planDraft.categoryId || ''} onChange={event => setPlanDraft(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
                      <option value="">All Categories</option>
                      {snapshot.categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Registration Fee</label>
                    <input type="number" min="0" value={planDraft.registrationFee} onChange={event => setPlanDraft(current => ({ ...current, registrationFee: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Credit</label>
                    <input type="number" min="0" value={planDraft.walletCredit} onChange={event => setPlanDraft(current => ({ ...current, walletCredit: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Plan Amount</label>
                    <input type="number" min="0" value={planDraft.planAmount} onChange={event => setPlanDraft(current => ({ ...current, planAmount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Validity Days</label>
                    <input type="number" min="1" value={planDraft.validityDays} onChange={event => setPlanDraft(current => ({ ...current, validityDays: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Daily Charge</label>
                    <input type="number" min="0" value={planDraft.dailyCharge} onChange={event => setPlanDraft(current => ({ ...current, dailyCharge: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={planDraft.description} onChange={event => setPlanDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={planDraft.isActive} onChange={event => setPlanDraft(current => ({ ...current, isActive: event.target.checked }))} />
                  Plan is active
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={savePlan} style={primaryButtonStyle}>Save Plan</button>
                  <button onClick={resetPlanDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Plans</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search plans" value={planFilters.search} onChange={event => setPlanFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={planFilters.audience} onChange={event => setPlanFilters(current => ({ ...current, audience: event.target.value as PlanFilters['audience'] }))} style={{ ...inputStyle, width: '130px' }}>
                    <option value="all">All Audience</option>
                    <option value="worker">Worker</option>
                    <option value="company">Company</option>
                  </select>
                  <select value={planFilters.categoryId} onChange={event => setPlanFilters(current => ({ ...current, categoryId: event.target.value }))} style={{ ...inputStyle, width: '180px' }}>
                    <option value="">All Categories</option>
                    {snapshot.categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select value={planFilters.activity} onChange={event => setPlanFilters(current => ({ ...current, activity: event.target.value as PlanFilters['activity'] }))} style={{ ...inputStyle, width: '130px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredPlans.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No plans match the current filters.</p>
                ) : (
                  filteredPlans.map(plan => (
                    <div key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{plan.name}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {titleCase(plan.audience)} | {getCategoryName(plan.categoryId || '')} | {formatCurrency(plan.planAmount)} | {plan.validityDays} days | {plan.isActive ? 'Active' : 'Inactive'}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{plan.description || 'No description yet.'}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                          Registration {formatCurrency(plan.registrationFee)} | Wallet credit {formatCurrency(plan.walletCredit)} | Daily charge {formatCurrency(plan.dailyCharge)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setPlanDraft({ ...plan, categoryId: plan.categoryId || '' }); setEditingPlanId(plan.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('plans', plan.id, plan.name)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'workers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingWorkerId ? 'Edit Worker' : 'Add Worker'}</h2>
                <button onClick={resetWorkerDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input value={workerDraft.fullName} onChange={event => setWorkerDraft(current => ({ ...current, fullName: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mobile *</label>
                    <input value={workerDraft.mobile} maxLength={10} onChange={event => setWorkerDraft(current => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={workerDraft.city} onChange={event => setWorkerDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Experience Years</label>
                    <input type="number" min="0" value={workerDraft.experienceYears} onChange={event => setWorkerDraft(current => ({ ...current, experienceYears: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Expected Daily Wage</label>
                    <input type="number" min="0" value={workerDraft.expectedDailyWage} onChange={event => setWorkerDraft(current => ({ ...current, expectedDailyWage: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Balance</label>
                    <input type="number" min="0" value={workerDraft.walletBalance} onChange={event => setWorkerDraft(current => ({ ...current, walletBalance: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={workerDraft.status} onChange={event => setWorkerDraft(current => ({ ...current, status: event.target.value as WorkerStatus }))} style={inputStyle}>
                      {workerStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Availability</label>
                    <select value={workerDraft.availability} onChange={event => setWorkerDraft(current => ({ ...current, availability: event.target.value as WorkerAvailability }))} style={inputStyle}>
                      {workerAvailabilityOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Categories *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {snapshot.categories.map(category => (
                      <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={workerDraft.categoryIds.includes(category.id)}
                          onChange={() => setWorkerDraft(current => ({ ...current, categoryIds: onMultiSelectChange(current.categoryIds, category.id) }))}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={workerDraft.isVisible} onChange={event => setWorkerDraft(current => ({ ...current, isVisible: event.target.checked }))} />
                  Worker profile visible to companies
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveWorker} style={primaryButtonStyle}>Save Worker</button>
                  <button onClick={resetWorkerDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Workers</h2>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input placeholder="Search workers" value={workerFilters.search} onChange={event => setWorkerFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                    <select value={workerFilters.status} onChange={event => setWorkerFilters(current => ({ ...current, status: event.target.value as WorkerFilters['status'] }))} style={{ ...inputStyle, width: '210px' }}>
                      <option value="all">All Status</option>
                      {workerStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <select value={workerFilters.categoryId} onChange={event => setWorkerFilters(current => ({ ...current, categoryId: event.target.value }))} style={{ ...inputStyle, width: '180px' }}>
                      <option value="">All Categories</option>
                      {snapshot.categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <select value={workerFilters.visibility} onChange={event => setWorkerFilters(current => ({ ...current, visibility: event.target.value as WorkerFilters['visibility'] }))} style={{ ...inputStyle, width: '140px' }}>
                      <option value="all">All Visibility</option>
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                    <select value={workerFilters.kyc} onChange={event => setWorkerFilters(current => ({ ...current, kyc: event.target.value as WorkerFilters['kyc'] }))} style={{ ...inputStyle, width: '170px' }}>
                      <option value="all">All KYC States</option>
                      <option value="not_submitted">Not Submitted</option>
                      <option value="ready_for_review">Ready for Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filteredWorkers.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No workers match the current filters.</p>
                  ) : (
                    filteredWorkers.map(worker => {
                      const kycTone = getWorkerKycTone(worker)
                      return (
                        <div key={worker.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <p style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>{worker.fullName}</p>
                              <span style={{ fontSize: '11px', fontWeight: '700', borderRadius: '999px', padding: '5px 9px', background: kycTone.background, color: kycTone.color, border: `1px solid ${kycTone.border}` }}>
                                {getWorkerKycLabel(worker)}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                              {worker.mobile} | {worker.city || 'No city'} | {worker.status} | {worker.isVisible ? 'Visible' : 'Hidden'} | {formatCurrency(worker.walletBalance)}
                            </p>
                            <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                              Categories: {worker.categoryIds.map(getCategoryName).join(', ') || 'None'} | Wage {formatCurrency(worker.expectedDailyWage)} | Availability {worker.availability}
                            </p>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                              Proof: {formatIdentityProofType(worker.identityProofType)} {worker.identityProofNumber ? `| ${worker.identityProofNumber}` : '| No proof number'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedWorkerReviewId(worker.id)} style={subtleButtonStyle}>Review KYC</button>
                            <button onClick={() => { setWorkerDraft(worker); setEditingWorkerId(worker.id) }} style={subtleButtonStyle}>Edit</button>
                            <button onClick={() => void removeEntity('workers', worker.id, worker.fullName)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Worker KYC Review</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Review uploaded profile photos and identity proof documents, then approve or reject the worker account.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ ...subtleButtonStyle, cursor: 'default' }}>
                      Ready {snapshot.workers.filter(worker => getWorkerKycState(worker) === 'ready_for_review').length}
                    </span>
                    <span style={{ ...subtleButtonStyle, cursor: 'default' }}>
                      Rejected {snapshot.workers.filter(worker => getWorkerKycState(worker) === 'rejected').length}
                    </span>
                  </div>
                </div>

                {!selectedWorkerReview ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Choose a worker from the list to review KYC details.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{selectedWorkerReview.fullName || 'Unnamed worker'}</p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                            {selectedWorkerReview.mobile} | {selectedWorkerReview.city || 'No city'} | {selectedWorkerReview.categoryIds.map(getCategoryName).join(', ') || 'No categories'}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            Registered {selectedWorkerReview.registrationCompletedAt ? new Date(selectedWorkerReview.registrationCompletedAt).toLocaleString() : 'Not completed yet'}
                          </p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: getWorkerKycTone(selectedWorkerReview).background, color: getWorkerKycTone(selectedWorkerReview).color, border: `1px solid ${getWorkerKycTone(selectedWorkerReview).border}`, alignSelf: 'flex-start' }}>
                          {getWorkerKycLabel(selectedWorkerReview)}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                          <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Profile Photo</p>
                          <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>
                            {selectedWorkerReview.profilePhotoPath || 'No profile photo uploaded yet.'}
                          </p>
                          {selectedWorkerReview.profilePhotoPath ? (
                            <a href={getWorkerDocumentHref(selectedWorkerReview.profilePhotoPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                              Open Photo
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Waiting for upload</span>
                          )}
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                          <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Identity Proof</p>
                          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                            {formatIdentityProofType(selectedWorkerReview.identityProofType)}
                          </p>
                          <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px' }}>
                            {selectedWorkerReview.identityProofNumber || 'No proof number provided'}
                          </p>
                          <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>
                            {selectedWorkerReview.identityProofPath || 'No document uploaded yet.'}
                          </p>
                          {selectedWorkerReview.identityProofPath ? (
                            <a href={getWorkerDocumentHref(selectedWorkerReview.identityProofPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                              Open Document
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Waiting for upload</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => void reviewWorkerKyc(selectedWorkerReview, 'approve')} style={primaryButtonStyle}>
                          Approve KYC
                        </button>
                        <button onClick={() => void reviewWorkerKyc(selectedWorkerReview, 'reject')} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                          Reject KYC
                        </button>
                        <button onClick={() => { setWorkerDraft(selectedWorkerReview); setEditingWorkerId(selectedWorkerReview.id) }} style={subtleButtonStyle}>
                          Open in Worker Editor
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'companies' && (
          <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingCompanyId ? 'Edit Company' : 'Add Company'}</h2>
                <button onClick={resetCompanyDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input value={companyDraft.companyName} onChange={event => setCompanyDraft(current => ({ ...current, companyName: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Person *</label>
                    <input value={companyDraft.contactPerson} onChange={event => setCompanyDraft(current => ({ ...current, contactPerson: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Mobile *</label>
                    <input value={companyDraft.mobile} maxLength={10} onChange={event => setCompanyDraft(current => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={companyDraft.city} onChange={event => setCompanyDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Company Email *</label>
                  <input
                    type="email"
                    value={companyDraft.email}
                    onChange={event => setCompanyDraft(current => ({ ...current, email: event.target.value.trim().toLowerCase() }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Categories *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {snapshot.categories.map(category => (
                      <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={companyDraft.categoryIds.includes(category.id)}
                          onChange={() => setCompanyDraft(current => ({ ...current, categoryIds: onMultiSelectChange(current.categoryIds, category.id) }))}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={companyDraft.status} onChange={event => setCompanyDraft(current => ({ ...current, status: event.target.value as CompanyStatus }))} style={inputStyle}>
                      {companyStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Active Plan</label>
                    <select value={companyDraft.activePlan} onChange={event => setCompanyDraft(current => ({ ...current, activePlan: event.target.value }))} style={inputStyle}>
                      <option value="">Select plan</option>
                      {snapshot.plans.filter(plan => plan.audience === 'company').map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={companyDraft.registrationFeePaid} onChange={event => setCompanyDraft(current => ({ ...current, registrationFeePaid: event.target.checked }))} />
                  Registration fee paid
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveCompany} style={primaryButtonStyle}>Save Company</button>
                  <button onClick={resetCompanyDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Companies</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search companies" value={companyFilters.search} onChange={event => setCompanyFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={companyFilters.status} onChange={event => setCompanyFilters(current => ({ ...current, status: event.target.value as CompanyFilters['status'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Status</option>
                    {companyStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select value={companyFilters.categoryId} onChange={event => setCompanyFilters(current => ({ ...current, categoryId: event.target.value }))} style={{ ...inputStyle, width: '180px' }}>
                    <option value="">All Categories</option>
                    {snapshot.categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select value={companyFilters.fee} onChange={event => setCompanyFilters(current => ({ ...current, fee: event.target.value as CompanyFilters['fee'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Fee Status</option>
                    <option value="paid">Fee Paid</option>
                    <option value="pending">Fee Pending</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredCompanies.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No companies match the current filters.</p>
                ) : (
                  filteredCompanies.map(company => (
                    <div key={company.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{company.companyName}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {company.contactPerson} | {company.email || 'No email'} | {company.city || 'No city'} | {company.status} | {company.registrationFeePaid ? 'Fee paid' : 'Fee pending'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Categories: {company.categoryIds.map(getCategoryName).join(', ') || 'None'} | Plan {getPlanName(company.activePlan)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setCompanyDraft(company); setEditingCompanyId(company.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('companies', company.id, company.companyName)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'jobPosts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingJobPostId ? 'Edit Job Post' : 'Add Job Post'}</h2>
                <button onClick={resetJobPostDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Job Title *</label>
                  <input value={jobPostDraft.title} onChange={event => setJobPostDraft(current => ({ ...current, title: event.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <select value={jobPostDraft.companyId} onChange={event => setJobPostDraft(current => ({ ...current, companyId: event.target.value }))} style={inputStyle}>
                      <option value="">Select company</option>
                      {snapshot.companies.map(company => (
                        <option key={company.id} value={company.id}>{company.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select value={jobPostDraft.categoryId} onChange={event => setJobPostDraft(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
                      <option value="">Select category</option>
                      {snapshot.categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={jobPostDraft.description} onChange={event => setJobPostDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={jobPostDraft.city} onChange={event => setJobPostDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Workers Needed</label>
                    <input type="number" min="1" value={jobPostDraft.workersNeeded} onChange={event => setJobPostDraft(current => ({ ...current, workersNeeded: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Wage Amount</label>
                    <input type="number" min="0" value={jobPostDraft.wageAmount} onChange={event => setJobPostDraft(current => ({ ...current, wageAmount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Validity Days</label>
                    <input type="number" min="1" value={jobPostDraft.validityDays} onChange={event => setJobPostDraft(current => ({ ...current, validityDays: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={jobPostDraft.status} onChange={event => setJobPostDraft(current => ({ ...current, status: event.target.value as JobPostStatus }))} style={inputStyle}>
                      {jobPostStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Published At</label>
                    <input type="date" value={jobPostDraft.publishedAt} onChange={event => setJobPostDraft(current => ({ ...current, publishedAt: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expires At</label>
                    <input type="date" value={jobPostDraft.expiresAt} onChange={event => setJobPostDraft(current => ({ ...current, expiresAt: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveJobPost} style={primaryButtonStyle}>Save Job Post</button>
                  <button onClick={resetJobPostDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Job Posts</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search job posts" value={jobFilters.search} onChange={event => setJobFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={jobFilters.status} onChange={event => setJobFilters(current => ({ ...current, status: event.target.value as JobFilters['status'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Status</option>
                    {jobPostStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select value={jobFilters.categoryId} onChange={event => setJobFilters(current => ({ ...current, categoryId: event.target.value }))} style={{ ...inputStyle, width: '180px' }}>
                    <option value="">All Categories</option>
                    {snapshot.categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select value={jobFilters.companyId} onChange={event => setJobFilters(current => ({ ...current, companyId: event.target.value }))} style={{ ...inputStyle, width: '180px' }}>
                    <option value="">All Companies</option>
                    {snapshot.companies.map(company => (
                      <option key={company.id} value={company.id}>{company.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredJobPosts.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No job posts match the current filters.</p>
                ) : (
                  filteredJobPosts.map(jobPost => {
                    const effectiveStatus = isExpiredJobPost(jobPost) ? 'expired' : jobPost.status

                    return (
                      <div key={jobPost.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{jobPost.title}</p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                            {getCompanyName(jobPost.companyId)} | {getCategoryName(jobPost.categoryId)} | {jobPost.city || 'No city'} | {effectiveStatus}
                          </p>
                          <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{jobPost.description || 'No description yet.'}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            {jobPost.workersNeeded} workers | {formatCurrency(jobPost.wageAmount)} | {jobPost.validityDays} days | {formatDate(jobPost.publishedAt)} to {formatDate(jobPost.expiresAt)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <button onClick={() => { setJobPostDraft(jobPost); setEditingJobPostId(jobPost.id) }} style={subtleButtonStyle}>Edit</button>
                          <button onClick={() => void removeEntity('jobPosts', jobPost.id, jobPost.title)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'jobApplications' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ marginBottom: '18px', display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Company Application Audit</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Audit how each company is handling worker applications from one central admin queue.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '8px 12px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '12px', fontWeight: '700' }}>
                      Pending company action: {snapshot.jobApplications.filter(application => application.status === 'submitted').length}
                    </span>
                    <span style={{ padding: '8px 12px', borderRadius: '999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: '700' }}>
                      Active company pipelines: {companyApplicationAuditRows.length}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Submitted', value: snapshot.jobApplications.filter(application => application.status === 'submitted').length, accent: '#c2410c' },
                    { label: 'Reviewed', value: snapshot.jobApplications.filter(application => application.status === 'reviewed').length, accent: '#1d4ed8' },
                    { label: 'Shortlisted', value: snapshot.jobApplications.filter(application => application.status === 'shortlisted').length, accent: '#047857' },
                    { label: 'Hired', value: snapshot.jobApplications.filter(application => application.status === 'hired').length, accent: '#7c3aed' }
                  ].map(card => (
                    <div key={card.label} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#f8fafc' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</p>
                      <p style={{ margin: 0, fontSize: '24px', color: card.accent, fontWeight: '800' }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {companyApplicationAuditRows.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No company applications are available for audit yet.</p>
                  ) : (
                    companyApplicationAuditRows.slice(0, 6).map(row => (
                      <div key={row.company.id} style={{ border: selectedCompanyAudit?.company.id === row.company.id ? '1px solid #93c5fd' : '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: selectedCompanyAudit?.company.id === row.company.id ? '#eff6ff' : '#fff', display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '800' }}>{row.company.companyName}</p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                            {row.company.contactPerson} | {row.company.mobile} | {row.company.city || 'No city'}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            {row.applications.length} applications | {row.submittedCount} pending | {row.shortlistedCount} shortlisted | {row.hiredCount} hired
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedCompanyAuditId(row.company.id)
                              setJobApplicationFilters(current => ({ ...current, companyId: row.company.id }))
                            }}
                            style={subtleButtonStyle}
                          >
                            Audit Company
                          </button>
                          <a href="/labour/company/panel" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                            Open Company Panel
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Job Applications</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Search applications"
                    value={jobApplicationFilters.search}
                    onChange={event => setJobApplicationFilters(current => ({ ...current, search: event.target.value }))}
                    style={{ ...inputStyle, width: '220px' }}
                  />
                  <select
                    value={jobApplicationFilters.status}
                    onChange={event => setJobApplicationFilters(current => ({ ...current, status: event.target.value as JobApplicationFilters['status'] }))}
                    style={{ ...inputStyle, width: '170px' }}
                  >
                    <option value="all">All Statuses</option>
                    {jobApplicationStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    value={jobApplicationFilters.companyId}
                    onChange={event => setJobApplicationFilters(current => ({ ...current, companyId: event.target.value }))}
                    style={{ ...inputStyle, width: '180px' }}
                  >
                    <option value="">All Companies</option>
                    {snapshot.companies.map(company => (
                      <option key={company.id} value={company.id}>{company.companyName}</option>
                    ))}
                  </select>
                  <select
                    value={jobApplicationFilters.jobPostId}
                    onChange={event => setJobApplicationFilters(current => ({ ...current, jobPostId: event.target.value }))}
                    style={{ ...inputStyle, width: '200px' }}
                  >
                    <option value="">All Job Posts</option>
                    {snapshot.jobPosts.map(jobPost => (
                      <option key={jobPost.id} value={jobPost.id}>{jobPost.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredJobApplications.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No job applications match the current filters.</p>
                ) : (
                  filteredJobApplications.map(application => {
                    const worker = getWorkerById(application.workerId)
                    const jobPost = getJobPostById(application.jobPostId)
                    const company = getCompanyById(application.companyId)
                    return (
                      <div key={application.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <p style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>{worker?.fullName || 'Unknown worker'}</p>
                            <span style={{ fontSize: '11px', fontWeight: '700', borderRadius: '999px', padding: '5px 9px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                              {titleCase(application.status)}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                            {jobPost?.title || 'Unknown job'} | {company?.companyName || 'Unknown company'} | {worker?.mobile || 'No mobile'}
                          </p>
                          <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>
                            Applied {formatDate(application.appliedAt)} {jobPost?.city ? `| ${jobPost.city}` : ''}
                          </p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            {application.note || 'No application note added yet.'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedJobApplicationId(application.id)} style={subtleButtonStyle}>Review</button>
                          <button onClick={() => void removeEntity('jobApplications', application.id, `${worker?.fullName || 'Application'} application`)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Application Review</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Review incoming worker applications, update the hiring status, and keep the full submission visible in one place.
                </p>
              </div>

              {selectedCompanyAudit ? (
                <div style={{ border: '1px solid #dbeafe', borderRadius: '14px', padding: '16px', background: '#f8fbff', marginBottom: '16px', display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '17px', fontWeight: '800' }}>{selectedCompanyAudit.company.companyName}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                        {selectedCompanyAudit.company.contactPerson} | {selectedCompanyAudit.company.mobile} | {selectedCompanyAudit.company.city || 'No city'}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                        Company status: {titleCase(selectedCompanyAudit.company.status)} | Live jobs: {selectedCompanyAudit.liveJobsCount}
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', alignSelf: 'flex-start' }}>
                      {selectedCompanyAudit.submittedCount} pending company action
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' }}>
                    {[
                      { label: 'Submitted', value: selectedCompanyAudit.submittedCount },
                      { label: 'Reviewed', value: selectedCompanyAudit.reviewedCount },
                      { label: 'Shortlisted', value: selectedCompanyAudit.shortlistedCount },
                      { label: 'Rejected', value: selectedCompanyAudit.rejectedCount },
                      { label: 'Hired', value: selectedCompanyAudit.hiredCount }
                    ].map(item => (
                      <div key={item.label} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', background: '#fff' }}>
                        <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{item.label}</p>
                        <p style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>Recent company-side review activity</p>
                    {selectedCompanyAuditApplications.length === 0 ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No applications match the current company filter.</p>
                    ) : (
                      selectedCompanyAuditApplications.slice(0, 5).map(application => {
                        const worker = getWorkerById(application.workerId)
                        const jobPost = getJobPostById(application.jobPostId)
                        return (
                          <button
                            key={application.id}
                            onClick={() => setSelectedJobApplicationId(application.id)}
                            style={{ ...subtleButtonStyle, textAlign: 'left', justifyContent: 'space-between', display: 'flex', gap: '12px' }}
                          >
                            <span>
                              {worker?.fullName || 'Unknown worker'} | {jobPost?.title || 'Unknown job'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{titleCase(application.status)}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}

              {!selectedJobApplication ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Choose an application from the list to review it.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                          {getWorkerById(selectedJobApplication.workerId)?.fullName || 'Unknown worker'}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                          {getJobPostById(selectedJobApplication.jobPostId)?.title || 'Unknown job'} | {getCompanyById(selectedJobApplication.companyId)?.companyName || 'Unknown company'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Applied {formatDate(selectedJobApplication.appliedAt)} | Last updated {formatDate(selectedJobApplication.updatedAt)}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', alignSelf: 'flex-start' }}>
                        {titleCase(selectedJobApplication.status)}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                        <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Worker Details</p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Mobile: {getWorkerById(selectedJobApplication.workerId)?.mobile || 'Not available'}
                        </p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          City: {getWorkerById(selectedJobApplication.workerId)?.city || 'Not available'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Worker status: {getWorkerById(selectedJobApplication.workerId)?.status || 'Unknown'}
                        </p>
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                        <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Job Details</p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Wage: {formatCurrency(getJobPostById(selectedJobApplication.jobPostId)?.wageAmount || 0)}
                        </p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Workers needed: {getJobPostById(selectedJobApplication.jobPostId)?.workersNeeded || 0}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          City: {getJobPostById(selectedJobApplication.jobPostId)?.city || 'Not available'}
                        </p>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                      <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Application Note</p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                        {selectedJobApplication.note || 'No note added by the worker.'}
                      </p>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                      <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Company Audit Context</p>
                      <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                        Company status: {getCompanyById(selectedJobApplication.companyId)?.status || 'Unknown'}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                        Contact person: {getCompanyById(selectedJobApplication.companyId)?.contactPerson || 'Not available'}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                        Company mobile: {getCompanyById(selectedJobApplication.companyId)?.mobile || 'Not available'}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                        Open from company panel to compare this worker against the rest of that company pipeline.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {jobApplicationStatuses.map(status => (
                        <button
                          key={status}
                          onClick={() => void updateJobApplicationStatus(selectedJobApplication, status)}
                          style={status === selectedJobApplication.status ? primaryButtonStyle : subtleButtonStyle}
                        >
                          Mark {titleCase(status)}
                        </button>
                      ))}
                      <a href="/labour/company/panel" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        Open Company Panel
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'grid', gap: '10px' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>Recent company actions across all companies</h3>
                {recentCompanyActionRows.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No reviewed company activity yet.</p>
                ) : (
                  recentCompanyActionRows.map(application => {
                    const worker = getWorkerById(application.workerId)
                    const company = getCompanyById(application.companyId)
                    const jobPost = getJobPostById(application.jobPostId)
                    return (
                      <button
                        key={application.id}
                        onClick={() => {
                          setSelectedJobApplicationId(application.id)
                          setSelectedCompanyAuditId(application.companyId)
                        }}
                        style={{ ...subtleButtonStyle, textAlign: 'left', justifyContent: 'space-between', display: 'flex', gap: '12px' }}
                      >
                        <span>
                          {company?.companyName || 'Unknown company'} moved {worker?.fullName || 'worker'} on {jobPost?.title || 'job'}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{titleCase(application.status)} | {formatDate(application.updatedAt)}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'savedJobs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Saved Jobs Monitoring</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Search saved jobs"
                    value={savedJobFilters.search}
                    onChange={event => setSavedJobFilters(current => ({ ...current, search: event.target.value }))}
                    style={{ ...inputStyle, width: '220px' }}
                  />
                  <select
                    value={savedJobFilters.companyId}
                    onChange={event => setSavedJobFilters(current => ({ ...current, companyId: event.target.value }))}
                    style={{ ...inputStyle, width: '180px' }}
                  >
                    <option value="">All Companies</option>
                    {snapshot.companies.map(company => (
                      <option key={company.id} value={company.id}>{company.companyName}</option>
                    ))}
                  </select>
                  <select
                    value={savedJobFilters.jobPostId}
                    onChange={event => setSavedJobFilters(current => ({ ...current, jobPostId: event.target.value }))}
                    style={{ ...inputStyle, width: '210px' }}
                  >
                    <option value="">All Job Posts</option>
                    {snapshot.jobPosts.map(jobPost => (
                      <option key={jobPost.id} value={jobPost.id}>{jobPost.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredSavedJobs.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No saved jobs match the current filters.</p>
                ) : (
                  filteredSavedJobs.map(savedJob => {
                    const worker = getWorkerById(savedJob.workerId)
                    const jobPost = getJobPostById(savedJob.jobPostId)
                    const company = jobPost ? getCompanyById(jobPost.companyId) : null

                    return (
                      <div key={savedJob.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{worker?.fullName || 'Unknown worker'}</p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                            {jobPost?.title || 'Unknown job'} | {company?.companyName || 'Unknown company'} | {worker?.mobile || 'No mobile'}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            Saved on {formatDate(savedJob.createdAt)} {jobPost?.city ? `| ${jobPost.city}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedSavedJobId(savedJob.id)} style={subtleButtonStyle}>Review</button>
                          <button onClick={() => void removeEntity('savedJobs', savedJob.id, `${worker?.fullName || 'Worker'} saved job`)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Saved Job Detail</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Track which roles workers are bookmarking most often before they apply.
                </p>
              </div>

              {!selectedSavedJob ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Choose a saved-job record from the list to review it.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                          {getWorkerById(selectedSavedJob.workerId)?.fullName || 'Unknown worker'}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                          {getJobPostById(selectedSavedJob.jobPostId)?.title || 'Unknown job'} | {getCompanyById(getJobPostById(selectedSavedJob.jobPostId)?.companyId || '')?.companyName || 'Unknown company'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Saved {formatDate(selectedSavedJob.createdAt)}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', alignSelf: 'flex-start' }}>
                        Shortlisted by worker
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                        <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Worker</p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Mobile: {getWorkerById(selectedSavedJob.workerId)?.mobile || 'Not available'}
                        </p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          City: {getWorkerById(selectedSavedJob.workerId)?.city || 'Not available'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Status: {getWorkerById(selectedSavedJob.workerId)?.status || 'Unknown'}
                        </p>
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                        <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Job</p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Wage: {formatCurrency(getJobPostById(selectedSavedJob.jobPostId)?.wageAmount || 0)}
                        </p>
                        <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                          Workers needed: {getJobPostById(selectedSavedJob.jobPostId)?.workersNeeded || 0}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          City: {getJobPostById(selectedSavedJob.jobPostId)?.city || 'Not available'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelectedSavedJobId(null)} style={subtleButtonStyle}>
                        Clear selection
                      </button>
                      <button onClick={() => void removeEntity('savedJobs', selectedSavedJob.id, `${getWorkerById(selectedSavedJob.workerId)?.fullName || 'Worker'} saved job`)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                        Remove Saved Record
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'workerNotifications' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Worker Notifications</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Search alerts"
                    value={workerNotificationFilters.search}
                    onChange={event => setWorkerNotificationFilters(current => ({ ...current, search: event.target.value }))}
                    style={{ ...inputStyle, width: '210px' }}
                  />
                  <select
                    value={workerNotificationFilters.workerId}
                    onChange={event => setWorkerNotificationFilters(current => ({ ...current, workerId: event.target.value }))}
                    style={{ ...inputStyle, width: '180px' }}
                  >
                    <option value="">All Workers</option>
                    {snapshot.workers.map(worker => (
                      <option key={worker.id} value={worker.id}>{worker.fullName || worker.mobile}</option>
                    ))}
                  </select>
                  <select
                    value={workerNotificationFilters.type}
                    onChange={event => setWorkerNotificationFilters(current => ({ ...current, type: event.target.value as WorkerNotificationFilters['type'] }))}
                    style={{ ...inputStyle, width: '190px' }}
                  >
                    <option value="all">All Types</option>
                    {workerNotificationTypes.map(type => (
                      <option key={type} value={type}>{titleCase(type)}</option>
                    ))}
                  </select>
                  <select
                    value={workerNotificationFilters.priority}
                    onChange={event => setWorkerNotificationFilters(current => ({ ...current, priority: event.target.value as WorkerNotificationFilters['priority'] }))}
                    style={{ ...inputStyle, width: '160px' }}
                  >
                    <option value="all">All Priorities</option>
                    {workerNotificationPriorities.map(priority => (
                      <option key={priority} value={priority}>{titleCase(priority)}</option>
                    ))}
                  </select>
                  <select
                    value={workerNotificationFilters.readState}
                    onChange={event => setWorkerNotificationFilters(current => ({ ...current, readState: event.target.value as WorkerNotificationFilters['readState'] }))}
                    style={{ ...inputStyle, width: '150px' }}
                  >
                    <option value="all">All States</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredWorkerNotifications.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No worker notifications match the current filters.</p>
                ) : (
                  filteredWorkerNotifications.map(notification => {
                    const worker = getWorkerById(notification.workerId)
                    const jobPost = notification.relatedJobPostId ? getJobPostById(notification.relatedJobPostId) : null
                    const company = notification.relatedCompanyId ? getCompanyById(notification.relatedCompanyId) : null
                    const priorityTone = getNotificationPriorityTone(notification.priority)

                    return (
                      <div key={notification.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <p style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>{notification.title}</p>
                            <span style={{ fontSize: '11px', fontWeight: '700', borderRadius: '999px', padding: '5px 9px', background: priorityTone.background, color: priorityTone.color, border: `1px solid ${priorityTone.border}` }}>
                              {titleCase(notification.priority)}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '700', borderRadius: '999px', padding: '5px 9px', background: notification.isRead ? '#f8fafc' : '#ecfdf5', color: notification.isRead ? '#475569' : '#047857', border: `1px solid ${notification.isRead ? '#cbd5e1' : '#86efac'}` }}>
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                            {worker?.fullName || 'Unknown worker'} | {worker?.mobile || 'No mobile'} | {titleCase(notification.type)}
                          </p>
                          <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>
                            {notification.message}
                          </p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            {formatDateTime(notification.createdAt)}
                            {jobPost?.title ? ` | ${jobPost.title}` : ''}
                            {company?.companyName ? ` | ${company.companyName}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedWorkerNotificationId(notification.id)} style={subtleButtonStyle}>Review</button>
                          <button onClick={() => void resendSelectedWorkerNotification(notification)} style={subtleButtonStyle}>Resend</button>
                          <button onClick={() => void removeEntity('workerNotifications', notification.id, `${notification.title} notification`)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ marginBottom: '14px' }}>
                  <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Notification Review</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    Open past alerts, resend push notifications, and change read state without leaving the labour admin.
                  </p>
                </div>

                {!selectedWorkerNotification ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Choose a notification from the list to review it.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                            {selectedWorkerNotification.title}
                          </p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                            {getWorkerById(selectedWorkerNotification.workerId)?.fullName || 'Unknown worker'} | {titleCase(selectedWorkerNotification.type)}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            Created {formatDateTime(selectedWorkerNotification.createdAt)} | Updated {formatDateTime(selectedWorkerNotification.updatedAt)}
                          </p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: getNotificationPriorityTone(selectedWorkerNotification.priority).background, color: getNotificationPriorityTone(selectedWorkerNotification.priority).color, border: `1px solid ${getNotificationPriorityTone(selectedWorkerNotification.priority).border}`, alignSelf: 'flex-start' }}>
                          {titleCase(selectedWorkerNotification.priority)}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                          <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Worker</p>
                          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                            Name: {getWorkerById(selectedWorkerNotification.workerId)?.fullName || 'Unknown worker'}
                          </p>
                          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                            Mobile: {getWorkerById(selectedWorkerNotification.workerId)?.mobile || 'Not available'}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            City: {getWorkerById(selectedWorkerNotification.workerId)?.city || 'Not available'}
                          </p>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                          <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Linked Context</p>
                          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                            Job: {getJobPostById(selectedWorkerNotification.relatedJobPostId || '')?.title || 'Not linked'}
                          </p>
                          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                            Company: {getCompanyById(selectedWorkerNotification.relatedCompanyId || '')?.companyName || 'Not linked'}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                            State: {selectedWorkerNotification.isRead ? 'Read by worker app' : 'Unread in worker app'}
                          </p>
                        </div>
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                        <p style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '700' }}>Message</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                          {selectedWorkerNotification.message}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => void resendSelectedWorkerNotification(selectedWorkerNotification)} style={primaryButtonStyle}>
                          Resend Push
                        </button>
                        <button onClick={() => void toggleWorkerNotificationReadState(selectedWorkerNotification, !selectedWorkerNotification.isRead)} style={subtleButtonStyle}>
                          Mark as {selectedWorkerNotification.isRead ? 'Unread' : 'Read'}
                        </button>
                        <button onClick={() => setSelectedWorkerNotificationId(null)} style={subtleButtonStyle}>
                          Clear selection
                        </button>
                        <button onClick={() => void removeEntity('workerNotifications', selectedWorkerNotification.id, `${selectedWorkerNotification.title} notification`)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>
                          Delete Notification
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px' }}>Compose Worker Alert</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Send a new in-app plus push notification to a worker when you need manual follow-up.
                    </p>
                  </div>
                  <button onClick={resetWorkerNotificationDraft} style={subtleButtonStyle}>Reset form</button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Worker</label>
                    <select
                      value={workerNotificationDraft.workerId}
                      onChange={event => setWorkerNotificationDraft(current => ({ ...current, workerId: event.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Select worker</option>
                      {snapshot.workers.map(worker => (
                        <option key={worker.id} value={worker.id}>{worker.fullName || worker.mobile} ({worker.mobile})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Type</label>
                      <select
                        value={workerNotificationDraft.type}
                        onChange={event => setWorkerNotificationDraft(current => ({ ...current, type: event.target.value as WorkerNotificationType }))}
                        style={inputStyle}
                      >
                        {workerNotificationTypes.map(type => (
                          <option key={type} value={type}>{titleCase(type)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <select
                        value={workerNotificationDraft.priority}
                        onChange={event => setWorkerNotificationDraft(current => ({ ...current, priority: event.target.value as WorkerNotificationPriority }))}
                        style={inputStyle}
                      >
                        {workerNotificationPriorities.map(priority => (
                          <option key={priority} value={priority}>{titleCase(priority)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Title</label>
                    <input
                      value={workerNotificationDraft.title}
                      onChange={event => setWorkerNotificationDraft(current => ({ ...current, title: event.target.value }))}
                      placeholder="Example: Application update"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Message</label>
                    <textarea
                      value={workerNotificationDraft.message}
                      onChange={event => setWorkerNotificationDraft(current => ({ ...current, message: event.target.value }))}
                      placeholder="Write the worker-facing alert message"
                      style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' as const }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Related Job Post</label>
                      <select
                        value={workerNotificationDraft.relatedJobPostId}
                        onChange={event => {
                          const nextJobPostId = event.target.value
                          setWorkerNotificationDraft(current => ({
                            ...current,
                            relatedJobPostId: nextJobPostId,
                            relatedCompanyId: nextJobPostId ? getJobPostById(nextJobPostId)?.companyId || '' : current.relatedCompanyId
                          }))
                        }}
                        style={inputStyle}
                      >
                        <option value="">No linked job</option>
                        {snapshot.jobPosts.map(jobPost => (
                          <option key={jobPost.id} value={jobPost.id}>{jobPost.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Related Company</label>
                      <select
                        value={workerNotificationDraft.relatedCompanyId}
                        onChange={event => setWorkerNotificationDraft(current => ({ ...current, relatedCompanyId: event.target.value }))}
                        style={inputStyle}
                      >
                        <option value="">No linked company</option>
                        {snapshot.companies.map(company => (
                          <option key={company.id} value={company.id}>{company.companyName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => void sendWorkerNotification()} style={primaryButtonStyle}>
                      Send Notification
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedWorkerNotification) return
                        setWorkerNotificationDraft({
                          workerId: selectedWorkerNotification.workerId,
                          type: selectedWorkerNotification.type,
                          title: selectedWorkerNotification.title,
                          message: selectedWorkerNotification.message,
                          priority: selectedWorkerNotification.priority,
                          relatedJobPostId: selectedWorkerNotification.relatedJobPostId || '',
                          relatedCompanyId: selectedWorkerNotification.relatedCompanyId || ''
                        })
                      }}
                      style={subtleButtonStyle}
                    >
                      Use Selected Alert
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'walletTransactions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingWalletTransactionId ? 'Edit Wallet Transaction' : 'Add Wallet Transaction'}</h2>
                <button onClick={resetWalletTransactionDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Entity Type</label>
                    <select
                      value={walletTransactionDraft.entityType}
                      onChange={event => {
                        const entityType = event.target.value as WalletEntityType
                        setWalletTransactionDraft(current => ({
                          ...current,
                          entityType,
                          entityId: '',
                          entityName: '',
                          city: ''
                        }))
                      }}
                      style={inputStyle}
                    >
                      <option value="worker">Worker</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Entity *</label>
                    <select
                      value={walletTransactionDraft.entityId}
                      onChange={event => {
                        const entityId = event.target.value
                        setWalletTransactionDraft(current => ({
                          ...current,
                          entityId,
                          entityName: getEntityName(current.entityType, entityId),
                          city: getEntityCity(current.entityType, entityId)
                        }))
                      }}
                      style={inputStyle}
                    >
                      <option value="">Select {walletTransactionDraft.entityType}</option>
                      {(walletTransactionDraft.entityType === 'worker' ? snapshot.workers : snapshot.companies).map(entity => (
                        <option key={entity.id} value={entity.id}>{walletTransactionDraft.entityType === 'worker' ? (entity as LabourWorker).fullName : (entity as LabourCompany).companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Transaction Type</label>
                    <select value={walletTransactionDraft.transactionType} onChange={event => setWalletTransactionDraft(current => ({ ...current, transactionType: event.target.value as WalletTransactionType }))} style={inputStyle}>
                      <option value="registration_fee">registration_fee</option>
                      <option value="wallet_deduction">wallet_deduction</option>
                      <option value="plan_purchase">plan_purchase</option>
                      <option value="wallet_recharge">wallet_recharge</option>
                      <option value="manual_adjustment">manual_adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Direction</label>
                    <select value={walletTransactionDraft.direction} onChange={event => setWalletTransactionDraft(current => ({ ...current, direction: event.target.value as WalletTransactionDirection }))} style={inputStyle}>
                      <option value="credit">credit</option>
                      <option value="debit">debit</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Amount *</label>
                    <input type="number" min="0" value={walletTransactionDraft.amount} onChange={event => setWalletTransactionDraft(current => ({ ...current, amount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={walletTransactionDraft.status} onChange={event => setWalletTransactionDraft(current => ({ ...current, status: event.target.value as WalletTransactionStatus }))} style={inputStyle}>
                      <option value="pending">pending</option>
                      <option value="completed">completed</option>
                      <option value="attention">attention</option>
                      <option value="failed">failed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Reference *</label>
                  <input value={walletTransactionDraft.reference} onChange={event => setWalletTransactionDraft(current => ({ ...current, reference: event.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Note</label>
                  <textarea value={walletTransactionDraft.note} onChange={event => setWalletTransactionDraft(current => ({ ...current, note: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveWalletTransaction} style={primaryButtonStyle}>Save Transaction</button>
                  <button onClick={resetWalletTransactionDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Wallet and transaction ledger</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    Monitor registration collections, worker wallet deductions and company plan purchases in one place.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search ledger" value={walletFilters.search} onChange={event => setWalletFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={walletFilters.audience} onChange={event => setWalletFilters(current => ({ ...current, audience: event.target.value as WalletFilters['audience'] }))} style={{ ...inputStyle, width: '140px' }}>
                    <option value="all">All Audience</option>
                    <option value="worker">Worker</option>
                    <option value="company">Company</option>
                  </select>
                  <select value={walletFilters.transactionType} onChange={event => setWalletFilters(current => ({ ...current, transactionType: event.target.value as WalletFilters['transactionType'] }))} style={{ ...inputStyle, width: '170px' }}>
                    <option value="all">All Types</option>
                    <option value="registration_fee">Registration Fee</option>
                    <option value="wallet_deduction">Wallet Deduction</option>
                    <option value="plan_purchase">Plan Purchase</option>
                    <option value="wallet_recharge">Wallet Recharge</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                  </select>
                  <select value={walletFilters.status} onChange={event => setWalletFilters(current => ({ ...current, status: event.target.value as WalletFilters['status'] }))} style={{ ...inputStyle, width: '140px' }}>
                    <option value="all">All Status</option>
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="attention">attention</option>
                    <option value="failed">failed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wallet Revenue</p>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: '800', fontSize: '24px' }}>{formatCurrency(walletRevenue)}</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registration Revenue</p>
                  <p style={{ margin: 0, color: '#1d4ed8', fontWeight: '800', fontSize: '24px' }}>{formatCurrency(registrationRevenue)}</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Worker Wallet Balance</p>
                  <p style={{ margin: 0, color: '#059669', fontWeight: '800', fontSize: '24px' }}>{formatCurrency(snapshot.stats.totalWalletBalance)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredWalletTransactions.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No transactions match the current filters.</p>
                ) : (
                  filteredWalletTransactions.map(transaction => (
                    <div key={transaction.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1.25fr 0.65fr 0.65fr 0.6fr 0.75fr 0.5fr', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{transaction.entityName}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                          {titleCase(transaction.entityType)} | {titleCase(transaction.transactionType)} | {transaction.reference}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>{transaction.note || 'No note'}</p>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{transaction.city || 'No city'}</p>
                      <p style={{ margin: 0, color: transaction.direction === 'credit' ? '#0f766e' : '#b45309', fontSize: '13px', fontWeight: '700' }}>
                        {transaction.direction === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                      <p style={{ margin: 0, color: transaction.status === 'attention' ? '#b45309' : transaction.status === 'failed' ? '#b91c1c' : '#2563eb', fontSize: '12px', fontWeight: '700' }}>
                        {titleCase(transaction.status)}
                      </p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{formatDateTime(transaction.createdAt)}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setWalletTransactionDraft(transaction); setEditingWalletTransactionId(transaction.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('walletTransactions', transaction.id, transaction.reference || transaction.entityName)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rechargeRequests' && (
          <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{editingRechargeRequestId ? 'Edit Recharge Request' : 'Add Recharge Request'}</h2>
                <button onClick={resetRechargeRequestDraft} style={subtleButtonStyle}>Add More</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Request Type</label>
                    <select
                      value={rechargeRequestDraft.requestType}
                      onChange={event => {
                        const requestType = event.target.value as RechargeRequestType
                        const relatedEntityType = requestType === 'worker_recharge' ? 'worker' : 'company'
                        setRechargeRequestDraft(current => ({
                          ...current,
                          requestType,
                          relatedEntityType,
                          relatedEntityId: '',
                          name: '',
                          city: '',
                          categoryLabel: '',
                          statusLabel: ''
                        }))
                      }}
                      style={inputStyle}
                    >
                      <option value="worker_recharge">worker_recharge</option>
                      <option value="company_follow_up">company_follow_up</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Related Entity *</label>
                    <select
                      value={rechargeRequestDraft.relatedEntityId}
                      onChange={event => {
                        const relatedEntityId = event.target.value
                        const relatedEntityType = rechargeRequestDraft.requestType === 'worker_recharge' ? 'worker' : 'company'
                        setRechargeRequestDraft(current => ({
                          ...current,
                          relatedEntityType,
                          relatedEntityId,
                          name: getEntityName(relatedEntityType, relatedEntityId),
                          city: getEntityCity(relatedEntityType, relatedEntityId),
                          categoryLabel: getEntityCategoryLabel(relatedEntityType, relatedEntityId),
                          statusLabel: getEntityStatusLabel(relatedEntityType, relatedEntityId)
                        }))
                      }}
                      style={inputStyle}
                    >
                      <option value="">Select {rechargeRequestDraft.requestType === 'worker_recharge' ? 'worker' : 'company'}</option>
                      {(rechargeRequestDraft.requestType === 'worker_recharge' ? snapshot.workers : snapshot.companies).map(entity => (
                        <option key={entity.id} value={entity.id}>{rechargeRequestDraft.requestType === 'worker_recharge' ? (entity as LabourWorker).fullName : (entity as LabourCompany).companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select value={rechargeRequestDraft.priority} onChange={event => setRechargeRequestDraft(current => ({ ...current, priority: event.target.value as RechargeRequestPriority }))} style={inputStyle}>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Request Status</label>
                    <select value={rechargeRequestDraft.requestStatus} onChange={event => setRechargeRequestDraft(current => ({ ...current, requestStatus: event.target.value as RechargeRequestStatus }))} style={inputStyle}>
                      <option value="open">open</option>
                      <option value="contacted">contacted</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Suggested Amount</label>
                  <input type="number" min="0" value={rechargeRequestDraft.suggestedAmount} onChange={event => setRechargeRequestDraft(current => ({ ...current, suggestedAmount: Number(event.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Note *</label>
                  <textarea value={rechargeRequestDraft.note} onChange={event => setRechargeRequestDraft(current => ({ ...current, note: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveRechargeRequest} style={primaryButtonStyle}>Save Request</button>
                  <button onClick={resetRechargeRequestDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Recharge requests and fee follow-up</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    Manage the live queue for worker recharge follow-up and pending company payment calls.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input placeholder="Search requests" value={rechargeFilters.search} onChange={event => setRechargeFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={rechargeFilters.priority} onChange={event => setRechargeFilters(current => ({ ...current, priority: event.target.value as RechargeFilters['priority'] }))} style={{ ...inputStyle, width: '130px' }}>
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select value={rechargeFilters.type} onChange={event => setRechargeFilters(current => ({ ...current, type: event.target.value as RechargeFilters['type'] }))} style={{ ...inputStyle, width: '170px' }}>
                    <option value="all">All Types</option>
                    <option value="worker_recharge">Worker Recharge</option>
                    <option value="company_follow_up">Company Follow-up</option>
                  </select>
                  <select value={rechargeFilters.status} onChange={event => setRechargeFilters(current => ({ ...current, status: event.target.value as RechargeFilters['status'] }))} style={{ ...inputStyle, width: '140px' }}>
                    <option value="all">All Request Status</option>
                    <option value="open">open</option>
                    <option value="contacted">contacted</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredRechargeRequests.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No recharge or follow-up requests match the current filters.</p>
                ) : (
                  filteredRechargeRequests.map(request => (
                    <div key={request.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1.15fr 0.7fr 0.7fr 0.5fr 0.6fr 0.6fr', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{request.name}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{titleCase(request.requestType)} | {request.statusLabel}</p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>{request.note}</p>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{request.city || 'No city'}</p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{request.categoryLabel || 'Unassigned'}</p>
                      <p style={{ margin: 0, color: request.priority === 'high' ? '#b91c1c' : request.priority === 'medium' ? '#b45309' : '#2563eb', fontSize: '12px', fontWeight: '700' }}>
                        {titleCase(request.priority)}
                      </p>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '12px', fontWeight: '700' }}>{titleCase(request.requestStatus)}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setRechargeRequestDraft(request); setEditingRechargeRequestId(request.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('rechargeRequests', request.id, request.name)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px' }}>
              {[
                { label: 'Unread Worker Alerts', value: unreadWorkerNotificationsCount, accent: '#b45309' },
                { label: 'Pending Worker KYC', value: pendingWorkerKycCount, accent: '#c2410c' },
                { label: 'Pending Companies', value: pendingCompanyApprovalsCount, accent: '#7c3aed' },
                { label: 'Open Recharge Requests', value: openRechargeRequestsCount, accent: '#0f766e' },
                { label: 'Saved To Apply Rate', value: `${savedJobConversionRate}%`, accent: '#1d4ed8' }
              ].map(card => (
                <div key={card.label} style={{ ...cardStyle, padding: '18px 20px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: '24px', color: card.accent, fontWeight: '800' }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px' }}>Export reporting center</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
                      Download operational CSV reports for workers, companies, jobs, applications, saved jobs, notifications, wallet ledger, recharge follow-ups, category performance, and city demand.
                    </p>
                  </div>
                  <button onClick={exportJsonSnapshot} style={primaryButtonStyle}>Export Full JSON Snapshot</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'workers', label: 'Workers CSV', count: exportRows.workers.length },
                    { key: 'companies', label: 'Companies CSV', count: exportRows.companies.length },
                    { key: 'jobPosts', label: 'Job Posts CSV', count: exportRows.jobPosts.length },
                    { key: 'applications', label: 'Applications CSV', count: exportRows.applications.length },
                    { key: 'savedJobs', label: 'Saved Jobs CSV', count: exportRows.savedJobs.length },
                    { key: 'notifications', label: 'Alerts CSV', count: exportRows.notifications.length },
                    { key: 'wallet', label: 'Wallet Ledger CSV', count: exportRows.wallet.length },
                    { key: 'recharge', label: 'Recharge CSV', count: exportRows.recharge.length },
                    { key: 'categories', label: 'Category Performance CSV', count: exportRows.categories.length },
                    { key: 'cities', label: 'City Demand CSV', count: exportRows.cities.length }
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => exportCsvReport(item.key as keyof typeof exportRows)}
                      style={{ ...subtleButtonStyle, textAlign: 'left', display: 'grid', gap: '6px', padding: '14px 16px' }}
                    >
                      <span style={{ color: '#0f172a', fontWeight: '800' }}>{item.label}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{item.count} rows ready</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Queue health</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    `Unread worker alerts: ${unreadWorkerNotificationsCount}`,
                    `Pending worker KYC review: ${pendingWorkerKycCount}`,
                    `Pending company approvals: ${pendingCompanyApprovalsCount}`,
                    `Open recharge requests: ${openRechargeRequestsCount}`,
                    `Live job posts: ${snapshot.stats.liveJobPosts}`,
                    `Expired job posts: ${expiredJobPostsCount}`,
                    `Total applications: ${snapshot.jobApplications.length}`,
                    `Total saved jobs: ${snapshot.savedJobs.length}`
                  ].map(item => (
                    <div key={item} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Worker status breakdown</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {workerStatusBreakdown.map(item => (
                    <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                      <span>{titleCase(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Company status breakdown</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {companyStatusBreakdown.map(item => (
                    <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                      <span>{titleCase(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Job post lifecycle</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {jobLifecycleBreakdown.map(item => (
                    <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                      <span>{titleCase(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                    <span>Expired by date</span>
                    <strong>{expiredJobPostsCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Category performance</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {categoryDemandRows.map(row => (
                    <div key={row.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>{row.name}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Demand score {row.demandScore}</p>
                      </div>
                      <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13px' }}>
                        Active workers {row.activeWorkersCount} | Live jobs {row.liveJobsCount} | Companies {row.companiesCount} | Expired jobs {row.expiredJobsCount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Top city demand</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {cityReportRows.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No city demand rows available yet.</p>
                  ) : (
                    cityReportRows.map(item => (
                      <div key={item.city} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{item.city}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{item.liveJobs} live jobs</p>
                        </div>
                        <p style={{ margin: '6px 0 0', color: '#475569', fontSize: '12px' }}>
                          Applications {item.applications} | Workers {item.workers} | Companies {item.companies}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Moderation queue</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {moderationQueue.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No moderation items right now.</p>
                  ) : (
                    moderationQueue.map(item => (
                      <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{item.type}: {item.name}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px' }}>{item.city || 'No city'} | {titleCase(item.status)}</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{item.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Reporting notes</h3>
                <div style={{ display: 'grid', gap: '10px', color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                  <p style={{ margin: 0 }}>Use CSV exports for accountant review, ops follow-up, worker KYC audits, and company outreach lists.</p>
                  <p style={{ margin: 0 }}>The full JSON export is useful for backup snapshots or advanced downstream analysis in spreadsheets or BI tools.</p>
                  <p style={{ margin: 0 }}>Saved-to-apply conversion helps show whether shortlisting is turning into real hiring intent from workers.</p>
                  <p style={{ margin: 0 }}>Unread alerts and recharge queues should be reviewed daily so worker engagement and wallet activation do not stall.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Operations Settings</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
                  Control worker notifications, upload validation, KYC review rules, fee defaults, and automation behavior from one panel.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '8px 12px', borderRadius: '999px', background: settingsStorage === 'supabase' ? '#dcfce7' : '#e0f2fe', color: settingsStorage === 'supabase' ? '#166534' : '#075985', fontSize: '12px', fontWeight: '700' }}>
                  {settingsStorage === 'supabase' ? 'Live Supabase storage' : 'JSON fallback storage'}
                </span>
                <button onClick={() => void saveSettings()} disabled={settingsLoading} style={primaryButtonStyle}>
                  {settingsLoading ? 'Loading...' : 'Save Settings'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
              {[
                { label: 'Enabled Automations', value: `${enabledAutomationCount}/6`, accent: '#1d4ed8' },
                { label: 'Pending KYC Review', value: pendingKycReviewCount, accent: '#c2410c' },
                { label: 'Min Wallet Recharge', value: formatCurrency(settingsDraft.feeRules.minimumWalletRecharge), accent: '#0f766e' },
                { label: 'Upload Limits', value: `${settingsDraft.uploadRules.maxPhotoSizeMb}MB / ${settingsDraft.uploadRules.maxDocumentSizeMb}MB`, accent: '#7c3aed' }
              ].map(card => (
                <div key={card.label} style={{ ...cardStyle, padding: '18px 20px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: '22px', color: card.accent, fontWeight: '800' }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '17px' }}>Notification templates</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input value={settingsDraft.notificationTemplates.applicationSubmittedTitle} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, applicationSubmittedTitle: event.target.value } }))} placeholder="Application submitted title" style={inputStyle} />
                    <input value={settingsDraft.notificationTemplates.shortlistedTitle} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, shortlistedTitle: event.target.value } }))} placeholder="Shortlisted title" style={inputStyle} />
                  </div>
                  <textarea value={settingsDraft.notificationTemplates.applicationSubmittedMessage} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, applicationSubmittedMessage: event.target.value } }))} placeholder="Application submitted message" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <textarea value={settingsDraft.notificationTemplates.shortlistedMessage} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, shortlistedMessage: event.target.value } }))} placeholder="Shortlisted message" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input value={settingsDraft.notificationTemplates.rejectedTitle} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, rejectedTitle: event.target.value } }))} placeholder="Rejected title" style={inputStyle} />
                    <input value={settingsDraft.notificationTemplates.walletReminderTitle} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, walletReminderTitle: event.target.value } }))} placeholder="Wallet reminder title" style={inputStyle} />
                  </div>
                  <textarea value={settingsDraft.notificationTemplates.rejectedMessage} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, rejectedMessage: event.target.value } }))} placeholder="Rejected message" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <textarea value={settingsDraft.notificationTemplates.walletReminderMessage} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, walletReminderMessage: event.target.value } }))} placeholder="Wallet reminder message" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input value={settingsDraft.notificationTemplates.adminBroadcastTitle} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, adminBroadcastTitle: event.target.value } }))} placeholder="Admin broadcast title" style={inputStyle} />
                    <textarea value={settingsDraft.notificationTemplates.adminBroadcastMessage} onChange={event => setSettingsDraft(current => ({ ...current, notificationTemplates: { ...current.notificationTemplates, adminBroadcastMessage: event.target.value } }))} placeholder="Admin broadcast message" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Use variables like <code>{'{{job_title}}'}</code> and <code>{'{{company_name}}'}</code> in templates for worker-facing alerts.</p>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '17px' }}>Upload rules</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="number" min={1} value={settingsDraft.uploadRules.maxPhotoSizeMb} onChange={event => setSettingsDraft(current => ({ ...current, uploadRules: { ...current.uploadRules, maxPhotoSizeMb: Number(event.target.value || 0) } }))} placeholder="Max photo size (MB)" style={inputStyle} />
                    <input type="number" min={1} value={settingsDraft.uploadRules.maxDocumentSizeMb} onChange={event => setSettingsDraft(current => ({ ...current, uploadRules: { ...current.uploadRules, maxDocumentSizeMb: Number(event.target.value || 0) } }))} placeholder="Max document size (MB)" style={inputStyle} />
                  </div>
                  <input value={settingsDraft.uploadRules.allowedPhotoExtensions.join(', ')} onChange={event => setSettingsDraft(current => ({ ...current, uploadRules: { ...current.uploadRules, allowedPhotoExtensions: parseCommaSeparatedList(event.target.value) } }))} placeholder="Photo formats: jpg, png, webp" style={inputStyle} />
                  <input value={settingsDraft.uploadRules.allowedDocumentExtensions.join(', ')} onChange={event => setSettingsDraft(current => ({ ...current, uploadRules: { ...current.uploadRules, allowedDocumentExtensions: parseCommaSeparatedList(event.target.value) } }))} placeholder="Document formats: jpg, png, pdf" style={inputStyle} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.uploadRules.requireIdentityDocumentUpload} onChange={event => setSettingsDraft(current => ({ ...current, uploadRules: { ...current.uploadRules, requireIdentityDocumentUpload: event.target.checked } }))} />
                    Require identity document upload before worker registration can finish
                  </label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc' }}>
                    <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>Current live validation summary</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                      Photos: {settingsDraft.uploadRules.allowedPhotoExtensions.join(', ')} up to {settingsDraft.uploadRules.maxPhotoSizeMb}MB. Documents: {settingsDraft.uploadRules.allowedDocumentExtensions.join(', ')} up to {settingsDraft.uploadRules.maxDocumentSizeMb}MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '17px' }}>KYC rules</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.kycRules.requireProfilePhoto} onChange={event => setSettingsDraft(current => ({ ...current, kycRules: { ...current.kycRules, requireProfilePhoto: event.target.checked } }))} />
                    Require profile photo for new worker accounts
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.kycRules.requireIdentityNumber} onChange={event => setSettingsDraft(current => ({ ...current, kycRules: { ...current.kycRules, requireIdentityNumber: event.target.checked } }))} />
                    Require identity number field before submit
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.kycRules.manualReviewRequired} onChange={event => setSettingsDraft(current => ({ ...current, kycRules: { ...current.kycRules, manualReviewRequired: event.target.checked } }))} />
                    Keep KYC on manual admin review before worker becomes fully active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.kycRules.autoRejectBlurredPhoto} onChange={event => setSettingsDraft(current => ({ ...current, kycRules: { ...current.kycRules, autoRejectBlurredPhoto: event.target.checked } }))} />
                    Auto-reject obviously low-quality photo submissions
                  </label>
                  <input type="number" min={1} value={settingsDraft.kycRules.reviewReminderHours} onChange={event => setSettingsDraft(current => ({ ...current, kycRules: { ...current.kycRules, reviewReminderHours: Number(event.target.value || 0) } }))} placeholder="KYC review reminder hours" style={inputStyle} />
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>Allowed proof types</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {workerIdentityProofOptions.map(proofType => {
                        const selected = settingsDraft.kycRules.allowedProofTypes.includes(proofType)
                        return (
                          <label key={proofType} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '999px', border: selected ? '1px solid #1d4ed8' : '1px solid #cbd5e1', background: selected ? '#eff6ff' : '#fff', color: selected ? '#1d4ed8' : '#334155', fontSize: '12px', fontWeight: '700' }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={event => setSettingsDraft(current => ({
                                ...current,
                                kycRules: {
                                  ...current.kycRules,
                                  allowedProofTypes: event.target.checked
                                    ? [...current.kycRules.allowedProofTypes, proofType]
                                    : current.kycRules.allowedProofTypes.filter(item => item !== proofType)
                                }
                              }))}
                            />
                            {titleCase(proofType)}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '17px' }}>Fee defaults and ops thresholds</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="number" min={0} value={settingsDraft.feeRules.defaultWorkerRegistrationFee} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, defaultWorkerRegistrationFee: Number(event.target.value || 0) } }))} placeholder="Worker registration fee" style={inputStyle} />
                    <input type="number" min={0} value={settingsDraft.feeRules.defaultWorkerDailyDeduction} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, defaultWorkerDailyDeduction: Number(event.target.value || 0) } }))} placeholder="Worker daily deduction" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="number" min={0} value={settingsDraft.feeRules.minimumWalletRecharge} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, minimumWalletRecharge: Number(event.target.value || 0) } }))} placeholder="Minimum wallet recharge" style={inputStyle} />
                    <input type="number" min={0} value={settingsDraft.feeRules.followUpCreditThreshold} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, followUpCreditThreshold: Number(event.target.value || 0) } }))} placeholder="Follow-up credit threshold" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="number" min={0} value={settingsDraft.feeRules.defaultCompanyRegistrationFee} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, defaultCompanyRegistrationFee: Number(event.target.value || 0) } }))} placeholder="Company registration fee" style={inputStyle} />
                    <input type="number" min={0} value={settingsDraft.feeRules.defaultCompanyPlanAmount} onChange={event => setSettingsDraft(current => ({ ...current, feeRules: { ...current.feeRules, defaultCompanyPlanAmount: Number(event.target.value || 0) } }))} placeholder="Default company plan amount" style={inputStyle} />
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc', display: 'grid', gap: '6px', color: '#334155', fontSize: '12px' }}>
                    <div>Worker registration revenue so far: {formatCurrency(workerRegistrationRevenue)}</div>
                    <div>Company registration revenue so far: {formatCurrency(companyRegistrationRevenue)}</div>
                    <div>Wallet balance live now: {formatCurrency(snapshot.stats.totalWalletBalance)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '17px' }}>Automation controls</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.autoHideInactiveWorkers} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, autoHideInactiveWorkers: event.target.checked } }))} />
                    Hide workers automatically when account becomes inactive
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.autoPauseExpiredJobs} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, autoPauseExpiredJobs: event.target.checked } }))} />
                    Pause or expire jobs automatically when validity ends
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.sendWalletReminderPush} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, sendWalletReminderPush: event.target.checked } }))} />
                    Send wallet reminder push notifications
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.sendApplicationStatusPush} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, sendApplicationStatusPush: event.target.checked } }))} />
                    Send application status push notifications
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.autoCreateRechargeFollowUps} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, autoCreateRechargeFollowUps: event.target.checked } }))} />
                    Auto-create recharge follow-up requests
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={settingsDraft.automationControls.autoEscalatePendingKyc} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, autoEscalatePendingKyc: event.target.checked } }))} />
                    Escalate pending KYC reviews automatically
                  </label>
                  <input type="number" min={1} value={settingsDraft.automationControls.pendingKycEscalationHours} onChange={event => setSettingsDraft(current => ({ ...current, automationControls: { ...current.automationControls, pendingKycEscalationHours: Number(event.target.value || 0) } }))} placeholder="Pending KYC escalation hours" style={inputStyle} />
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Module navigation and linked tools</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    {(['overview', 'workers', 'companies', 'categories', 'jobPosts', 'jobApplications', 'savedJobs', 'workerNotifications', 'plans', 'walletTransactions', 'rechargeRequests', 'reports', 'auditLogs'] as LabourSection[]).map(section => (
                      <button key={section} onClick={() => setActiveSection(section)} style={{ ...subtleButtonStyle, textAlign: 'left' }}>
                        Open {sectionLabels[section]}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a href="/admin/labour/website" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Open Website Editor
                    </a>
                    <a href="/labour/company" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Preview Website
                    </a>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc', color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    Save settings here before editing related plans, worker review logic, or push templates. This panel is meant for operational defaults, while Plans, Workers, Notifications, and Reports remain execution modules.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => void saveSettings()} disabled={settingsLoading} style={primaryButtonStyle}>
                {settingsLoading ? 'Loading...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'auditLogs' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Audit Logs</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input placeholder="Search logs" value={auditFilters.search} onChange={event => setAuditFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                <select value={auditFilters.entityType} onChange={event => setAuditFilters(current => ({ ...current, entityType: event.target.value }))} style={{ ...inputStyle, width: '170px' }}>
                  <option value="all">All Entities</option>
                  {Array.from(new Set(snapshot.auditLogs.map(log => log.entityType))).map(entityType => (
                    <option key={entityType} value={entityType}>{entityType}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredAuditLogs.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No audit logs match the current filters.</p>
              ) : (
                filteredAuditLogs.map(log => (
                  <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{log.summary}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{log.action.toUpperCase()} | {log.entityType} | {log.entityId}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px', color: '#334155', fontSize: '12px', fontWeight: '600' }}>{log.actor}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
