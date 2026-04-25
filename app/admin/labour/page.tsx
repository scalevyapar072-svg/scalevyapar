'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type DemandLevel = 'high' | 'medium' | 'low'
type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'blocked' | 'rejected'
type CompanyStatus = 'pending' | 'active' | 'inactive' | 'blocked'
type JobPostStatus = 'draft' | 'live' | 'expired' | 'paused'
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
  | 'plans'
  | 'walletTransactions'
  | 'rechargeRequests'
  | 'reports'
  | 'settings'
  | 'auditLogs'
type LabourEntityType = 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts' | 'walletTransactions' | 'rechargeRequests'

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
  experienceYears: number
  expectedDailyWage: number
  walletBalance: number
  status: WorkerStatus
  availability: WorkerAvailability
  isVisible: boolean
  categoryIds: string[]
}

type LabourCompany = {
  id: string
  companyName: string
  contactPerson: string
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
const jobPostStatuses: JobPostStatus[] = ['draft', 'live', 'expired', 'paused']

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
  experienceYears: 0,
  expectedDailyWage: 0,
  walletBalance: 0,
  status: 'pending',
  availability: 'available_today',
  isVisible: true,
  categoryIds: []
}

const blankCompany: LabourCompany = {
  id: '',
  companyName: '',
  contactPerson: '',
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

const blankCategoryFilters: CategoryFilters = { search: '', demand: 'all', activity: 'all' }
const blankPlanFilters: PlanFilters = { search: '', audience: 'all', categoryId: '', activity: 'all' }
const blankWorkerFilters: WorkerFilters = { search: '', status: 'all', categoryId: '', visibility: 'all' }
const blankCompanyFilters: CompanyFilters = { search: '', status: 'all', categoryId: '', fee: 'all' }
const blankJobFilters: JobFilters = { search: '', status: 'all', categoryId: '', companyId: '' }
const blankWalletFilters: WalletFilters = { search: '', audience: 'all', transactionType: 'all', status: 'all' }
const blankRechargeFilters: RechargeFilters = { search: '', priority: 'all', type: 'all', status: 'all' }
const blankAuditFilters: AuditFilters = { search: '', entityType: 'all' }

const sectionLabels: Record<LabourSection, string> = {
  overview: 'Dashboard',
  workers: 'Workers',
  companies: 'Companies',
  categories: 'Categories',
  jobPosts: 'Job Posts',
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

export default function LabourExchangeAdminPage() {
  const [snapshot, setSnapshot] = useState<LabourSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [activeSection, setActiveSection] = useState<LabourSection>('overview')

  const [categoryDraft, setCategoryDraft] = useState<LabourCategory>(blankCategory)
  const [planDraft, setPlanDraft] = useState<LabourPlan>(blankPlan)
  const [workerDraft, setWorkerDraft] = useState<LabourWorker>(blankWorker)
  const [companyDraft, setCompanyDraft] = useState<LabourCompany>(blankCompany)
  const [jobPostDraft, setJobPostDraft] = useState<LabourJobPost>(blankJobPost)
  const [walletTransactionDraft, setWalletTransactionDraft] = useState<WalletTransaction>(blankWalletTransaction)
  const [rechargeRequestDraft, setRechargeRequestDraft] = useState<RechargeRequest>(blankRechargeRequest)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editingJobPostId, setEditingJobPostId] = useState<string | null>(null)
  const [editingWalletTransactionId, setEditingWalletTransactionId] = useState<string | null>(null)
  const [editingRechargeRequestId, setEditingRechargeRequestId] = useState<string | null>(null)

  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>(blankCategoryFilters)
  const [planFilters, setPlanFilters] = useState<PlanFilters>(blankPlanFilters)
  const [workerFilters, setWorkerFilters] = useState<WorkerFilters>(blankWorkerFilters)
  const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(blankCompanyFilters)
  const [jobFilters, setJobFilters] = useState<JobFilters>(blankJobFilters)
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

  useEffect(() => {
    void fetchSnapshot()
  }, [])

  const showSaved = (message: string) => {
    setSaved(message)
    setTimeout(() => setSaved(''), 2500)
  }

  const replaceSnapshot = (nextSnapshot: LabourSnapshot) => {
    setSnapshot(nextSnapshot)
    setError('')
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

    return matchesSearch(workerFilters.search, [
      worker.fullName,
      worker.mobile,
      worker.city,
      worker.status,
      worker.categoryIds.map(getCategoryName).join(', ')
    ])
  })

  const filteredCompanies = snapshot.companies.filter(company => {
    if (companyFilters.status !== 'all' && company.status !== companyFilters.status) return false
    if (companyFilters.categoryId && !company.categoryIds.includes(companyFilters.categoryId)) return false
    if (companyFilters.fee === 'paid' && !company.registrationFeePaid) return false
    if (companyFilters.fee === 'pending' && company.registrationFeePaid) return false

    return matchesSearch(companyFilters.search, [
      company.companyName,
      company.contactPerson,
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
    if (!companyDraft.mobile.trim()) return 'Company mobile is required.'
    if (!isTenDigitMobile(companyDraft.mobile)) return 'Company mobile must be exactly 10 digits.'
    if (companyDraft.categoryIds.length === 0) return 'Select at least one company category.'
    if (companyDraft.status === 'active' && !companyDraft.activePlan) return 'Active companies should have a plan selected.'

    const duplicateMobile = snapshot.companies.find(
      company => company.id !== editingCompanyId && company.mobile.trim() === companyDraft.mobile.trim()
    )
    if (duplicateMobile) return 'Another company already uses this mobile number.'

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
            {['categories', 'plans', 'workers', 'companies', 'jobPosts'].map(key => (
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
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredWorkers.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No workers match the current filters.</p>
                ) : (
                  filteredWorkers.map(worker => (
                    <div key={worker.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{worker.fullName}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {worker.mobile} | {worker.city || 'No city'} | {worker.status} | {worker.isVisible ? 'Visible' : 'Hidden'} | {formatCurrency(worker.walletBalance)}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Categories: {worker.categoryIds.map(getCategoryName).join(', ') || 'None'} | Wage {formatCurrency(worker.expectedDailyWage)} | Availability {worker.availability}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setWorkerDraft(worker); setEditingWorkerId(worker.id) }} style={subtleButtonStyle}>Edit</button>
                        <button onClick={() => void removeEntity('workers', worker.id, worker.fullName)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                      </div>
                    </div>
                  ))
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
                          {company.contactPerson} | {company.city || 'No city'} | {company.status} | {company.registrationFeePaid ? 'Fee paid' : 'Fee pending'}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
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
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Worker status model</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {workerStatuses.map(status => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                      <span>{titleCase(status)}</span>
                      <strong>{snapshot.workers.filter(worker => worker.status === status).length}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Company status model</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {companyStatuses.map(status => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '13px' }}>
                      <span>{titleCase(status)}</span>
                      <strong>{snapshot.companies.filter(company => company.status === status).length}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Operational pricing rules</h3>
                <div style={{ display: 'grid', gap: '8px', color: '#334155', fontSize: '13px' }}>
                  <div>Worker registration revenue: {formatCurrency(workerRegistrationRevenue)}</div>
                  <div>Worker wallet revenue: {formatCurrency(workerWalletRevenue)}</div>
                  <div>Company registration revenue: {formatCurrency(companyRegistrationRevenue)}</div>
                  <div>Company plan revenue: {formatCurrency(companyPlanRevenue)}</div>
                  <div>Current wallet balance: {formatCurrency(snapshot.stats.totalWalletBalance)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Module navigation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {(['overview', 'workers', 'companies', 'categories', 'jobPosts', 'plans', 'walletTransactions', 'rechargeRequests', 'reports', 'auditLogs'] as LabourSection[]).map(section => (
                    <button key={section} onClick={() => setActiveSection(section)} style={{ ...subtleButtonStyle, textAlign: 'left' }}>
                      Open {sectionLabels[section]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Admin guidance</h3>
                <div style={{ display: 'grid', gap: '10px', color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                  <p style={{ margin: 0 }}>Use Categories to add new labour types like stitching karighar, embroidery worker, electrician, printer labour, constructor labour or machine setup staff.</p>
                  <p style={{ margin: 0 }}>Use Plans to edit registration fees, wallet credits, daily deduction values and company posting plans.</p>
                  <p style={{ margin: 0 }}>Use Workers and Companies to moderate visibility, block bad actors, activate pending records and manage assigned categories.</p>
                  <p style={{ margin: 0 }}>Use Reports and Wallet Transactions to review category demand, fee recovery, expired job posts and follow-up queues.</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '17px' }}>Editable company website</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
                    Manage the public labour company website layout, content blocks, FAQs, CTAs and section order from the website editor.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href="/admin/labour/website" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Open Website Editor
                  </a>
                  <a href="/labour/company" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Preview Website
                  </a>
                </div>
              </div>
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
