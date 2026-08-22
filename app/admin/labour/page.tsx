'use client'

import Link from 'next/link'
import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Database,
  FileText,
  HandCoins,
  CheckCircle,
  LayoutDashboard,
  LifeBuoy,
  RefreshCw,
  Settings2,
  Shapes,
  Users,
  WalletCards
} from 'lucide-react'
import {
  buildLabourLocationOptions,
  LabourMastersSnapshot,
  LabourMasterKey,
  buildLabourMasterSelectOptions,
  findMatchingMasterOption,
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  getVisibleLabourMasterOptions,
  groupLabourMasterOptions,
  labourMasterSeedValues,
  resolveLabourMasterLabel
} from '@/lib/labour-masters-schema'
import LabourWhatsappMetaStatusCard from '@/components/admin/labour-whatsapp-meta-status'
type DemandLevel = 'high' | 'medium' | 'low'
type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'inactive_paused_by_worker' | 'blocked' | 'rejected'
type WorkerIdentityProofType = '' | 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'other'
type WorkerKycFilter = 'all' | 'not_submitted' | 'ready_for_review' | 'needs_correction' | 'approved' | 'rejected'
type WorkerKycReviewDecision = 'pending' | 'verified' | 'rejected' | 'needs_correction'
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
type RechargeRequestType = 'worker_recharge' | 'company_follow_up' | 'worker_support'
type RechargeRequestPriority = 'high' | 'medium' | 'low'
type RechargeRequestStatus = 'open' | 'contacted' | 'resolved' | 'closed'
type LabourSection =
  | 'overview'
  | 'workers'
  | 'referrals'
  | 'companies'
  | 'categories'
  | 'jobPosts'
  | 'workerRechargeHistory'
  | 'jobPostPaymentHistory'
  | 'companyBillingHistory'
  | 'jobApplications'
  | 'savedJobs'
  | 'workerNotifications'
  | 'plans'
  | 'walletTransactions'
  | 'rechargeRequests'
  | 'supportRequests'
  | 'reports'
  | 'settings'
  | 'auditLogs'
type LabourEntityType = 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts' | 'jobApplications' | 'savedJobs' | 'workerNotifications' | 'walletTransactions' | 'rechargeRequests'
type ReferralAdminTab = 'dashboard' | 'referrers' | 'tracking' | 'ledger' | 'settings' | 'withdrawals'
type ReferralWorkerStatusFilter = 'all' | 'enabled' | 'not_enabled'
type ReferralLedgerFilters = {
  search: string
  agentWorkerId: string
  referredWorkerId: string
  categoryId: string
  entryType: string
  status: string
  dateFrom: string
  dateTo: string
}
type ReferralWithdrawalReviewAction = 'approve' | 'reject' | 'mark-paid'
type ReferralWithdrawalFilters = {
  search: string
  status: string
  payoutMethod: string
}
type CategoryDependencyRow = {
  id: string
  categoryId: string
  categoryLabel: string
  industryCategoryOptionId: string
  industryCategoryLabel: string
  businessTypeOptionId: string
  businessTypeLabel: string
  isActive: boolean
  isIndustryBusinessVisible: boolean
  isIndustryOptionVisible: boolean
  isBusinessTypeOptionVisible: boolean
}

type LabourCategory = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  showOnHome: boolean
  homeOrder: number
  demandLevel: DemandLevel
  isActive: boolean
}

type LabourPlan = {
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
}

type LabourWorker = {
  id: string
  fullName: string
  mobile: string
  city: string
  homeCity: string
  preferredWorkLocations: Array<{
    stateOptionId: string
    stateLabel: string
    cityOptionIds: string[]
    cityLabels: string[]
  }>
  companyId: string
  industryCategory: string
  businessType: string
  address: string
  profilePhotoPath: string
  skills: string[]
  experienceYears: number
  salaryType: string
  expectedDailyWage: number
  minimumExpectedWage: number
  maximumExpectedWage: number
  walletBalance: number
  activePlan: string
  planValidFrom: string
  planValidUntil: string
  lastWalletDeductionDate: string
  registrationFeePaid: boolean
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
}

type LabourCompany = {
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
}

type LabourJobPost = {
  id: string
  companyId: string
  categoryId: string
  title: string
  description: string
  connectedPlan: string
  workerCategory: string
  genderPreference: string
  ageRequirement: string
  experienceRequired: string
  jobLocation: string
  dutyHours: string
  shiftType: string
  weeklyOff: string
  jobDuration: string
  salaryType: string
  overtimeAvailable: string
  foodFacility: string
  accommodation: string
  transportFacility: string
  requiredSkills: string
  specialInstructions: string
  languagesPreferred: string
  submissionMode: string
  documentsBlock: string
  city: string
  locationLabel: string
  latitude: number | ''
  longitude: number | ''
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

type WorkerKycReviewDraft = {
  decision: WorkerKycReviewDecision
  remarks: string
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

type ReferralAdminProfile = {
  id: string
  workerId: string
  referralCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type ReferralAdminEligibility = {
  id: string
  referralProfileId: string
  categoryId: string
  rewardAmount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type ReferralAdminReferral = {
  id: string
  referrerWorkerId: string
  referredWorkerId: string
  referralProfileId: string
  referralCodeSnapshot: string
  categoryId: string
  rewardAmountSnapshot: number
  referralStatus: string
  rewardStatus: string
  attributedAt: string
  registeredAt: string
  qualifiedAt: string
  rewardedAt: string
  rejectedAt: string
  invalidatedAt: string
  createdAt: string
  updatedAt: string
}

type ReferralAdminLedgerEntry = {
  id: string
  workerId: string
  referralId: string
  entryType: string
  amount: number
  balanceAfter: number
  status: string
  reference: string
  remarks: string
  createdAt: string
}

type ReferralAdminSnapshot = {
  profiles: ReferralAdminProfile[]
  eligibility: ReferralAdminEligibility[]
  referrals: ReferralAdminReferral[]
  ledger: ReferralAdminLedgerEntry[]
  stats: {
    totalReferrers: number
    activeReferrers: number
    totalReferrals: number
    registered: number
    kycPending: number
    qualified: number
    rejectedInvalid: number
    rewardsCredited: number
    availableReferralEarningsLiability: number
    reversedRewards: number
  }
}

type ReferralAdminSettings = {
  id: string
  minimumWithdrawalAmount: number
  createdAt: string
  updatedAt: string
}

type ReferralAdminWithdrawalItem = {
  id: string
  workerId: string
  agentName: string
  mobile: string
  referralCode: string
  kycStatus: string
  amount: number
  payoutMethod: 'bank' | 'upi'
  maskedDestination: string
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled'
  requestedAt: string
  approvedAt: string
  rejectedAt: string
  rejectionReason: string
  paidAt: string
  paymentReference: string
  createdAt: string
  updatedAt: string
}

type ReferralAdminWithdrawalPaymentDetails = {
  requestId: string
  amount: number
  payoutMethod: 'bank' | 'upi'
  maskedDestination: string
  approvedAt: string
  bank: {
    accountHolderName: string
    accountNumber: string
    ifsc: string
  } | null
  upi: {
    upiId: string
  } | null
}

type ReferralAdminWithdrawalSnapshot = {
  withdrawals: ReferralAdminWithdrawalItem[]
  summary: {
    requestedCount: number
    approvedCount: number
    paidCount: number
    rejectedCount: number
    totalRequestedAmount: number
    totalApprovedAmount: number
    totalPaidAmount: number
  }
}

type LabourSnapshot = {
  categories: LabourCategory[]
  adminCategories?: LabourCategory[]
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
  companyId: string
  status: 'all' | WorkerStatus
  availability: 'all' | WorkerAvailability
  categoryId: string
  industryCategory: string
  businessType: string
  dateFrom: string
  dateTo: string
  sort: 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc'
  visibility: 'all' | 'visible' | 'hidden'
  kyc: WorkerKycFilter
}

type CompanyFilters = {
  search: string
  status: 'all' | CompanyStatus
  categoryId: string
  fee: 'all' | 'paid' | 'pending'
  industryCategory: string
  businessType: string
  dateFrom: string
  dateTo: string
  sort: 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc'
}

type JobFilters = {
  search: string
  status: 'all' | JobPostStatus
  categoryId: string
  companyId: string
  industryCategory: string
  businessType: string
  dateFrom: string
  dateTo: string
  sort: 'title_asc' | 'title_desc' | 'created_desc' | 'created_asc' | 'company_asc' | 'company_desc'
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

type WorkerRechargeHistoryFilters = {
  search: string
  type: 'all' | 'recharge' | 'deduction'
  dateFrom: string
  dateTo: string
}

type JobPostPaymentHistoryFilters = {
  searchCompanyName: string
  searchCompanyMobile: string
  searchJobTitle: string
  paymentType: 'all' | 'recharge' | 'payment' | 'deduction' | 'adjustment' | 'other'
  status: 'all' | 'success' | 'pending' | 'failed' | 'rejected' | 'other'
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

type CompanyBillingHistoryFilters = {
  search: string
  billingType: 'all' | 'recharge' | 'subscription' | 'payment' | 'deduction' | 'adjustment' | 'other'
  status: 'all' | 'success' | 'pending' | 'failed' | 'rejected' | 'other'
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

type ParsedWhatsappAuditSummary = {
  messageId: string
  status: string
  waId: string
  phoneNumberId: string
  conversationId: string
  origin: string
  pricingCategory: string
  billable: string
  errors: string
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
  workerLanguageControls: {
    enabledWorkerLanguageCodes: string[]
    defaultWorkerLanguageCode: string
    showLanguageSelectionOnFirstOpen: boolean
  }
  workerHomeControls: {
    popularCitySuggestions: string[]
  }
  helpControls: {
    showHeaderHelpButton: boolean
    supportTitle: string
    supportSubtitle: string
    supportWhatsappNumber: string
    supportChatbotUrl: string
    supportExtraLabel: string
    supportExtraUrl: string
    supportPrefilledMessage: string
  }
}

const workerStatuses: WorkerStatus[] = [
  'pending',
  'active',
  'inactive_wallet_empty',
  'inactive_subscription_expired',
  'inactive_paused_by_worker',
  'blocked',
  'rejected'
]

const companyStatuses: CompanyStatus[] = ['pending', 'active', 'inactive', 'blocked']
const companyHiringTypes = ['Daily Basis', 'Weekly Basis', 'Monthly Basis', 'Contract Basis']
const workerAvailabilityOptions: WorkerAvailability[] = ['available_today', 'available_this_week']
const workerIdentityProofOptions: Array<Exclude<WorkerIdentityProofType, ''>> = ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other']
const jobPostStatuses: JobPostStatus[] = ['draft', 'live', 'expired', 'paused']
const jobApplicationStatuses: JobApplicationStatus[] = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired']
const workerNotificationTypes: WorkerNotificationType[] = ['application_submitted', 'job_saved', 'application_status', 'wallet_reminder']
const workerNotificationPriorities: WorkerNotificationPriority[] = ['high', 'medium', 'low']
const workerLanguageOptions = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' }
] as const

const blankCategory: LabourCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  showOnHome: true,
  homeOrder: 0,
  demandLevel: 'medium',
  isActive: true
}

const blankPlan: LabourPlan = {
  id: '',
  audience: 'company',
  name: '',
  categoryId: '',
  industryCategoryValues: [],
  businessTypeValues: [],
  labourCategoryIds: [],
  jobPostLimit: 1,
  registrationFee: 0,
  walletCredit: 0,
  planAmount: 0,
  planValidityDays: 0,
  jobPostLiveDays: 0,
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
  homeCity: '',
  preferredWorkLocations: [],
  companyId: '',
  industryCategory: '',
  businessType: '',
  address: '',
  profilePhotoPath: '',
  skills: [],
  experienceYears: 0,
  salaryType: '',
  expectedDailyWage: 0,
  minimumExpectedWage: 0,
  maximumExpectedWage: 0,
  walletBalance: 0,
  activePlan: '',
  planValidFrom: '',
  planValidUntil: '',
  lastWalletDeductionDate: '',
  registrationFeePaid: false,
  status: 'pending',
  kycStatus: '',
  kycRemarks: '',
  availability: 'available_today',
  isVisible: true,
  categoryIds: [],
  identityProofType: '',
  identityProofNumber: '',
  identityProofPath: '',
  registrationCompletedAt: '',
  createdAt: ''
}

const blankCompany: LabourCompany = {
  id: '',
  companyName: '',
  contactPerson: '',
  email: '',
  mobile: '',
  contactMobile: '',
  businessType: '',
  industryCategory: '',
  gstNumber: '',
  companyAddress: '',
  state: '',
  city: '',
  area: '',
  pincode: '',
  workersNeeded: 1,
  hiringType: '',
  businessDescription: '',
  gstCertificatePath: '',
  companyProofPath: '',
  ownerIdProofPath: '',
  categoryIds: [],
  status: 'active',
  registrationFeePaid: false,
  activePlan: '',
  createdAt: ''
}

const blankJobPost: LabourJobPost = {
  id: '',
  companyId: '',
  categoryId: '',
  title: '',
  description: '',
  connectedPlan: '',
  workerCategory: '',
  genderPreference: '',
  ageRequirement: '',
  experienceRequired: '',
  jobLocation: '',
  dutyHours: '',
  shiftType: '',
  weeklyOff: '',
  jobDuration: '',
  salaryType: '',
  overtimeAvailable: '',
  foodFacility: '',
  accommodation: '',
  transportFacility: '',
  requiredSkills: '',
  specialInstructions: '',
  languagesPreferred: '',
  submissionMode: 'Pending review for publish',
  documentsBlock: '',
  city: '',
  locationLabel: '',
  latitude: '',
  longitude: '',
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

const blankReferralAdminSnapshot: ReferralAdminSnapshot = {
  profiles: [],
  eligibility: [],
  referrals: [],
  ledger: [],
  stats: {
    totalReferrers: 0,
    activeReferrers: 0,
    totalReferrals: 0,
    registered: 0,
    kycPending: 0,
    qualified: 0,
    rejectedInvalid: 0,
    rewardsCredited: 0,
    availableReferralEarningsLiability: 0,
    reversedRewards: 0
  }
}

const blankReferralAdminSettings: ReferralAdminSettings = {
  id: 'global',
  minimumWithdrawalAmount: 250,
  createdAt: '',
  updatedAt: ''
}

const blankReferralAdminWithdrawalSnapshot: ReferralAdminWithdrawalSnapshot = {
  withdrawals: [],
  summary: {
    requestedCount: 0,
    approvedCount: 0,
    paidCount: 0,
    rejectedCount: 0,
    totalRequestedAmount: 0,
    totalApprovedAmount: 0,
    totalPaidAmount: 0
  }
}

const blankReferralLedgerFilters: ReferralLedgerFilters = {
  search: '',
  agentWorkerId: 'all',
  referredWorkerId: 'all',
  categoryId: 'all',
  entryType: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: ''
}

const blankReferralWithdrawalFilters: ReferralWithdrawalFilters = {
  search: '',
  status: 'all',
  payoutMethod: 'all'
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
  },
  workerLanguageControls: {
    enabledWorkerLanguageCodes: ['hi', 'en'],
    defaultWorkerLanguageCode: 'hi',
    showLanguageSelectionOnFirstOpen: true
  },
  workerHomeControls: {
    popularCitySuggestions: [
      'Jaipur',
      'Delhi',
      'Mumbai',
      'Bengaluru',
      'Pune',
      'Kolkata',
      'Ahmedabad',
      'Hyderabad',
      'Chennai',
      'Surat',
      'Lucknow',
      'Nagpur',
      'Vadodara',
      'Indore',
      'Patna',
      'Rajkot',
      'Chandigarh',
      'Bhopal',
      'Ludhiana',
      'Kanpur',
      'Nashik',
      'Bhubaneswar'
    ]
  },
  helpControls: {
    showHeaderHelpButton: true,
    supportTitle: 'Need help?',
    supportSubtitle: 'Chat with our team or message us on WhatsApp.',
    supportWhatsappNumber: '',
    supportChatbotUrl: '',
    supportExtraLabel: '',
    supportExtraUrl: '',
    supportPrefilledMessage: 'Hello Team, I need help with the Rozgar worker app.'
  }
}

const blankCategoryFilters: CategoryFilters = { search: '', demand: 'all', activity: 'all' }
const blankPlanFilters: PlanFilters = { search: '', audience: 'all', categoryId: '', activity: 'all' }
const blankWorkerFilters: WorkerFilters = {
  search: '',
  companyId: '',
  status: 'all',
  availability: 'all',
  categoryId: '',
  industryCategory: '',
  businessType: '',
  dateFrom: '',
  dateTo: '',
  sort: 'name_asc',
  visibility: 'all',
  kyc: 'all'
}
const blankCompanyFilters: CompanyFilters = {
  search: '',
  status: 'all',
  categoryId: '',
  fee: 'all',
  industryCategory: '',
  businessType: '',
  dateFrom: '',
  dateTo: '',
  sort: 'name_asc'
}
const blankWorkerKycReviewDraft: WorkerKycReviewDraft = {
  decision: 'pending',
  remarks: ''
}
const KYC_DISPLAY_FALLBACK_MESSAGES = new Set([
  'please contact support or review your kyc details.'
])
const isKycDisplayFallbackRemark = (value: string) =>
  KYC_DISPLAY_FALLBACK_MESSAGES.has(value.trim().replace(/[“”]/g, '').toLowerCase())
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const blankJobFilters: JobFilters = {
  search: '',
  status: 'all',
  categoryId: '',
  companyId: '',
  industryCategory: '',
  businessType: '',
  dateFrom: '',
  dateTo: '',
  sort: 'title_asc'
}
const blankJobApplicationFilters: JobApplicationFilters = { search: '', status: 'all', companyId: '', jobPostId: '' }
const blankSavedJobFilters: SavedJobFilters = { search: '', companyId: '', jobPostId: '' }
const blankWorkerNotificationFilters: WorkerNotificationFilters = { search: '', workerId: '', type: 'all', priority: 'all', readState: 'all' }
const blankWalletFilters: WalletFilters = { search: '', audience: 'all', transactionType: 'all', status: 'all' }
const blankRechargeFilters: RechargeFilters = { search: '', priority: 'all', type: 'all', status: 'all' }
const blankAuditFilters: AuditFilters = { search: '', entityType: 'all' }
const blankWorkerRechargeHistoryFilters: WorkerRechargeHistoryFilters = { search: '', type: 'all', dateFrom: '', dateTo: '' }
const blankJobPostPaymentHistoryFilters: JobPostPaymentHistoryFilters = {
  searchCompanyName: '',
  searchCompanyMobile: '',
  searchJobTitle: '',
  paymentType: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: ''
}
const blankCompanyBillingHistoryFilters: CompanyBillingHistoryFilters = {
  search: '',
  billingType: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: ''
}

const sectionLabels: Record<LabourSection, string> = {
  overview: 'Dashboard',
  workers: 'Workers',
  referrals: 'Refer & Earn',
  companies: 'Companies',
  categories: 'Categories',
  jobPosts: 'Job Posts',
  workerRechargeHistory: 'Worker Recharge & Deduction History',
  jobPostPaymentHistory: 'Job Post Recharge & Payment History',
  companyBillingHistory: 'Company Billing History',
  jobApplications: 'Job Applications',
  savedJobs: 'Saved Jobs',
  workerNotifications: 'Worker Notifications',
  plans: 'Plans',
  walletTransactions: 'Wallet Transactions',
  rechargeRequests: 'Recharge Requests',
  supportRequests: 'Support Requests',
  reports: 'Reports',
  settings: 'Settings',
  auditLogs: 'Audit Logs'
}

const sectionNavItems: Array<{
  key: LabourSection
  label: string
  icon: ComponentType<{ className?: string }>
}> = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'workers', label: 'Workers', icon: Users },
  { key: 'referrals', label: 'Refer & Earn', icon: HandCoins },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'categories', label: 'Categories', icon: Shapes },
  { key: 'jobPosts', label: 'Job Posts', icon: BriefcaseBusiness },
  { key: 'workerRechargeHistory', label: 'Worker Recharge & Deduction History', icon: WalletCards },
  { key: 'jobPostPaymentHistory', label: 'Job Post Recharge & Payment History', icon: BriefcaseBusiness },
  { key: 'companyBillingHistory', label: 'Company Billing History', icon: Building2 },
  { key: 'jobApplications', label: 'Job Applications', icon: FileText },
  { key: 'savedJobs', label: 'Saved Jobs', icon: Bookmark },
  { key: 'workerNotifications', label: 'Worker Notifications', icon: Bell },
  { key: 'plans', label: 'Plans', icon: WalletCards },
  { key: 'walletTransactions', label: 'Wallet Transactions', icon: WalletCards },
  { key: 'rechargeRequests', label: 'Recharge Requests', icon: HandCoins },
  { key: 'supportRequests', label: 'Support Requests', icon: LifeBuoy },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings2 },
  { key: 'auditLogs', label: 'Audit Logs', icon: ClipboardList }
]

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const maskMobile = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length < 4) return '-'
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`
}

const formatWorkerExpectedWageRange = (worker: Pick<LabourWorker, 'expectedDailyWage' | 'minimumExpectedWage' | 'maximumExpectedWage'>) => {
  const fallback = Number(worker.expectedDailyWage || 0)
  const minimum = Number(worker.minimumExpectedWage || 0) || fallback
  const maximum = Number(worker.maximumExpectedWage || 0) || fallback
  if (!minimum && !maximum) return 'Rs 0 - 0/day'
  return `${formatCurrency(minimum || maximum)} - ${Number(maximum || minimum).toLocaleString('en-IN')}/day`
}

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

const formatFileDate = () => new Date().toISOString().slice(0, 10)

const escapeXml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const escapePdfText = (value: unknown) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ')

const sanitizeExportValue = (value: unknown) => {
  const text = String(value ?? '')
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

const createCrc32Table = () => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
}

const crc32Table = createCrc32Table()

const calculateCrc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff
  bytes.forEach(byte => {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  })
  return (crc ^ 0xffffffff) >>> 0
}

const writeUint16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff)
}

const writeUint32 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

const createZipArchive = (files: Array<{ name: string; content: string }>) => {
  const encoder = new TextEncoder()
  const output: number[] = []
  const centralDirectory: number[] = []

  files.forEach(file => {
    const nameBytes = encoder.encode(file.name)
    const contentBytes = encoder.encode(file.content)
    const crc = calculateCrc32(contentBytes)
    const localHeaderOffset = output.length

    writeUint32(output, 0x04034b50)
    writeUint16(output, 20)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint32(output, crc)
    writeUint32(output, contentBytes.length)
    writeUint32(output, contentBytes.length)
    writeUint16(output, nameBytes.length)
    writeUint16(output, 0)
    output.push(...Array.from(nameBytes), ...Array.from(contentBytes))

    writeUint32(centralDirectory, 0x02014b50)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, crc)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint16(centralDirectory, nameBytes.length)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, 0)
    writeUint32(centralDirectory, localHeaderOffset)
    centralDirectory.push(...Array.from(nameBytes))
  })

  const centralDirectoryOffset = output.length
  output.push(...centralDirectory)
  writeUint32(output, 0x06054b50)
  writeUint16(output, 0)
  writeUint16(output, 0)
  writeUint16(output, files.length)
  writeUint16(output, files.length)
  writeUint32(output, centralDirectory.length)
  writeUint32(output, centralDirectoryOffset)
  writeUint16(output, 0)

  return new Uint8Array(output)
}

const createReferralLedgerXlsx = (headers: string[], rows: Array<Record<string, string | number>>) => {
  const columnWidths = headers.map(header => Math.min(Math.max(header.length + 4, 14), 36))
  rows.forEach(row => {
    headers.forEach((header, index) => {
      columnWidths[index] = Math.min(
        Math.max(columnWidths[index], String(row[header] ?? '').length + 2),
        48
      )
    })
  })

  const columnName = (index: number) => {
    let column = ''
    let value = index + 1
    while (value > 0) {
      const remainder = (value - 1) % 26
      column = String.fromCharCode(65 + remainder) + column
      value = Math.floor((value - remainder) / 26)
    }
    return column
  }

  const renderCell = (value: unknown, isHeader = false) => {
    if (!isHeader && typeof value === 'number') {
      return `<c s="2"><v>${value}</v></c>`
    }
    return `<c t="inlineStr" s="${isHeader ? 1 : 0}"><is><t>${escapeXml(sanitizeExportValue(value))}</t></is></c>`
  }

  const sheetRows = [
    `<row r="1">${headers.map((header, index) => `<c r="${columnName(index)}1" t="inlineStr" s="1"><is><t>${escapeXml(header)}</t></is></c>`).join('')}</row>`,
    ...rows.map((row, rowIndex) => {
      const rowNumber = rowIndex + 2
      return `<row r="${rowNumber}">${headers.map((header, columnIndex) => {
        const rendered = renderCell(row[header])
        return rendered.replace('<c ', `<c r="${columnName(columnIndex)}${rowNumber}" `)
      }).join('')}</row>`
    })
  ]

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${columnWidths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>
  <sheetData>${sheetRows.join('')}</sheetData>
</worksheet>`

  return createZipArchive([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
    },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Rozgar Referral Ledger</dc:title>
  <dc:creator>ScaleVyapar Admin</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Rozgar Admin</Application>
</Properties>`
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Reward Ledger" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheet
    }
  ])
}

const createReferralLedgerPdf = (title: string, filterSummary: string[], headers: string[], rows: Array<Record<string, string | number>>) => {
  const lines = [
    'Rozgar by ScaleVyapar',
    title,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Applied Filters:',
    ...filterSummary,
    '',
    headers.join(' | '),
    ...rows.map(row => headers.map(header => String(row[header] ?? '')).join(' | '))
  ]
  const pageWidth = 842
  const pageHeight = 595
  const left = 36
  const top = 548
  const lineHeight = 13
  const maxChars = 150
  const textCommands = lines.flatMap(line => {
    const chunks = String(line || ' ')
      .replace(/\s+/g, ' ')
      .match(new RegExp(`.{1,${maxChars}}`, 'g')) || ['']
    return chunks
  }).slice(0, 38).map((line, index) => `BT /F1 ${index < 2 ? 14 : 8} Tf ${left} ${top - index * lineHeight} Td (${escapePdfText(line)}) Tj ET`)
  const stream = textCommands.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ]
  let offset = '%PDF-1.4\n'.length
  const xref = ['0000000000 65535 f ']
  const body = objects.map(object => {
    xref.push(`${String(offset).padStart(10, '0')} 00000 n `)
    offset += object.length + 1
    return object
  }).join('\n')
  const xrefOffset = offset
  return `%PDF-1.4\n${body}\nxref\n0 ${xref.length}\n${xref.join('\n')}\ntrailer << /Size ${xref.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeComparableValue = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const getComparableValueTokens = (value: string) => {
  const normalizedValue = normalizeComparableValue(value)
  if (!normalizedValue) return []

  const slugValue = slugify(normalizedValue)
  const compactValue = normalizedValue.replace(/[^a-z0-9]+/g, '')

  return Array.from(
    new Set(
      [normalizedValue, slugValue, compactValue]
        .map(item => item.trim())
        .filter(Boolean)
    )
  )
}

const matchesSearch = (search: string, values: Array<string | number | boolean | undefined>) => {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return values.some(value => String(value || '').toLowerCase().includes(query))
}

const matchesDateRange = (value: string, dateFrom: string, dateTo: string) => {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return !dateFrom && !dateTo

  if (dateFrom) {
    const fromTimestamp = new Date(`${dateFrom}T00:00:00`).getTime()
    if (timestamp < fromTimestamp) return false
  }

  if (dateTo) {
    const toTimestamp = new Date(`${dateTo}T23:59:59.999`).getTime()
    if (timestamp > toTimestamp) return false
  }

  return true
}

const matchesAmountRange = (value: number, amountMin: string, amountMax: string) => {
  if (amountMin.trim()) {
    const parsedAmountMin = Number(amountMin)
    if (!Number.isNaN(parsedAmountMin) && value < parsedAmountMin) return false
  }

  if (amountMax.trim()) {
    const parsedAmountMax = Number(amountMax)
    if (!Number.isNaN(parsedAmountMax) && value > parsedAmountMax) return false
  }

  return true
}

const normalizeLedgerStatus = (status: string): Exclude<JobPostPaymentHistoryFilters['status'], 'all'> => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'pending'
    case 'failed':
      return 'failed'
    default:
      return 'other'
  }
}

const normalizeRechargeRequestStatus = (status: RechargeRequestStatus): Exclude<JobPostPaymentHistoryFilters['status'], 'all'> => {
  switch (status) {
    case 'resolved':
      return 'success'
    case 'open':
    case 'contacted':
      return 'pending'
    case 'closed':
    default:
      return 'other'
  }
}

type WalletLedgerSource = 'worker_wallet' | 'job_post' | 'company_billing' | 'manual' | 'other'

const getWalletLedgerSource = (transaction: WalletTransaction): WalletLedgerSource => {
  if (transaction.transactionType === 'manual_adjustment') return 'manual'
  if (transaction.entityType === 'worker') return 'worker_wallet'
  if (transaction.transactionType === 'plan_purchase') return 'job_post'
  if (transaction.entityType === 'company') return 'company_billing'
  return 'other'
}

const getWorkerRechargeHistoryType = (
  transaction: WalletTransaction
): Exclude<WorkerRechargeHistoryFilters['type'], 'all'> => {
  if (transaction.transactionType === 'wallet_deduction') return 'deduction'
  if (transaction.transactionType === 'wallet_recharge') return 'recharge'
  return transaction.direction === 'credit' ? 'recharge' : 'deduction'
}

const getCompanyBillingHistoryType = (
  transaction: WalletTransaction
): Exclude<CompanyBillingHistoryFilters['billingType'], 'all'> => {
  switch (transaction.transactionType) {
    case 'wallet_recharge':
      return 'recharge'
    case 'plan_purchase':
      return 'subscription'
    case 'wallet_deduction':
      return 'deduction'
    case 'manual_adjustment':
      return 'adjustment'
    case 'registration_fee':
      return 'payment'
    default:
      return 'other'
  }
}

const getJobPostPaymentTypeFromTransaction = (
  transaction: WalletTransaction
): Exclude<JobPostPaymentHistoryFilters['paymentType'], 'all'> => {
  switch (transaction.transactionType) {
    case 'wallet_recharge':
      return 'recharge'
    case 'wallet_deduction':
      return 'deduction'
    case 'manual_adjustment':
      return 'adjustment'
    case 'registration_fee':
    case 'plan_purchase':
      return 'payment'
    default:
      return 'other'
  }
}

const getJobPostPaymentTypes = (billingRows: WalletTransaction[], followUps: RechargeRequest[]) => {
  const paymentTypes = new Set<Exclude<JobPostPaymentHistoryFilters['paymentType'], 'all'>>()

  billingRows.forEach(transaction => {
    paymentTypes.add(getJobPostPaymentTypeFromTransaction(transaction))
  })

  if (followUps.length > 0) {
    paymentTypes.add('recharge')
  }

  return Array.from(paymentTypes)
}

const formatWalletLedgerSource = (source: WalletLedgerSource) => {
  switch (source) {
    case 'worker_wallet':
      return 'Worker Wallet'
    case 'job_post':
      return 'Job Post'
    case 'company_billing':
      return 'Company Billing'
    case 'manual':
      return 'Manual'
    case 'other':
      return 'Other'
    default:
      return 'Unknown'
  }
}

const isTenDigitMobile = (value: string) => /^\d{10}$/.test(value.trim())

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const getTodayDateValue = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const resolveJobPostValidityDays = (value: number, fallback = 3) => {
  const normalizedValue = Number(value)
  if (Number.isFinite(normalizedValue) && normalizedValue > 0) {
    return normalizedValue
  }

  return fallback
}

const shouldSyncJobPostExpiry = (
  currentExpiresAt: string,
  currentPublishedAt: string,
  currentValidityDays: number
) => {
  const normalizedExpiry = currentExpiresAt.trim()
  if (!normalizedExpiry) return true

  const baselinePublishedAt = currentPublishedAt.trim() || getTodayDateValue()
  const baselineValidityDays = resolveJobPostValidityDays(currentValidityDays)
  return normalizedExpiry === addDays(baselinePublishedAt, baselineValidityDays)
}

const getPlanValidityDays = (plan: Pick<LabourPlan, 'planValidityDays' | 'validityDays'>) => {
  return plan.planValidityDays > 0 ? plan.planValidityDays : plan.validityDays
}

const isFreeWorkerPlan = (
  plan: Pick<LabourPlan, 'id' | 'audience' | 'name' | 'registrationFee' | 'dailyCharge' | 'planAmount'> | null | undefined
) =>
  Boolean(
    plan &&
    plan.audience === 'worker' &&
    (
      plan.id === 'plan-worker-free-7-days' ||
      String(plan.name || '').trim().toLowerCase() === 'free worker plan' ||
      (plan.registrationFee <= 0 && plan.dailyCharge <= 0 && plan.planAmount <= 0)
    )
  )

const getDefaultWorkerPlan = (plans: LabourPlan[]) =>
  plans.find(plan => plan.audience === 'worker' && plan.isActive && isFreeWorkerPlan(plan)) ||
  plans.find(plan => plan.audience === 'worker' && plan.isActive) ||
  null

const getJobPostLiveDays = (plan: Pick<LabourPlan, 'jobPostLiveDays' | 'validityDays'>) => {
  return plan.jobPostLiveDays > 0 ? plan.jobPostLiveDays : plan.validityDays
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

const isLiveJobPost = (jobPost: LabourJobPost) => jobPost.status === 'live' && !isExpiredJobPost(jobPost)

const isWorkerPlanExpired = (worker: LabourWorker) => {
  const expiryValue = String(worker.planValidUntil || '').trim()
  if (!expiryValue) return true

  const expiresAt = new Date(expiryValue)
  if (Number.isNaN(expiresAt.getTime())) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

const getEffectiveWorkerStatus = (worker: LabourWorker): WorkerStatus => {
  if (worker.status !== 'active') return worker.status
  if (!worker.isVisible) return 'inactive_subscription_expired'
  if (!String(worker.activePlan || '').trim()) return 'inactive_subscription_expired'
  if (isWorkerPlanExpired(worker)) return 'inactive_subscription_expired'
  return 'active'
}

const getEffectiveWorkerAvailability = (worker: LabourWorker): WorkerAvailability =>
  getEffectiveWorkerStatus(worker) === 'active' ? worker.availability : 'not_available'

const titleCase = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getWorkerStatusLabel = (status: WorkerStatus) => {
  if (status === 'inactive_paused_by_worker') return 'Paused by Worker'
  if (status === 'inactive_subscription_expired') return 'Plan Expired'
  return titleCase(status)
}

const isWhatsappAuditLog = (log: AuditLog) =>
  String(log.actor || '') === 'WHATSAPP_WEBHOOK' || String(log.summary || '').startsWith('WhatsApp status')

const parseWhatsappAuditSummary = (summary: string): ParsedWhatsappAuditSummary => {
  const parsed: ParsedWhatsappAuditSummary = {
    messageId: '',
    status: '',
    waId: '',
    phoneNumberId: '',
    conversationId: '',
    origin: '',
    pricingCategory: '',
    billable: '',
    errors: ''
  }

  summary
    .split('|')
    .map(part => part.trim())
    .forEach(part => {
      if (!part.includes('=')) return
      const [key, ...valueParts] = part.split('=')
      const value = valueParts.join('=').trim()

      switch (key.trim()) {
        case 'messageId':
          parsed.messageId = value
          break
        case 'status':
          parsed.status = value
          break
        case 'waId':
          parsed.waId = value
          break
        case 'phoneNumberId':
          parsed.phoneNumberId = value
          break
        case 'conversationId':
          parsed.conversationId = value
          break
        case 'origin':
          parsed.origin = value
          break
        case 'pricingCategory':
          parsed.pricingCategory = value
          break
        case 'billable':
          parsed.billable = value
          break
        case 'errors':
          parsed.errors = value
          break
      }
    })

  return parsed
}

const getWhatsappStatusTone = (status: string) => {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'read') return { background: '#ecfeff', color: '#155e75', border: '#a5f3fc' }
  if (normalized === 'delivered') return { background: '#ecfdf5', color: '#166534', border: '#86efac' }
  if (normalized === 'sent' || normalized === 'accepted') return { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
  if (normalized === 'failed') return { background: '#fff1f2', color: '#b91c1c', border: '#fecdd3' }
  return { background: '#f8fafc', color: '#334155', border: '#cbd5e1' }
}

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

const parseCommaSeparatedDisplayList = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const JOB_POST_WORKER_CATEGORIES = ['Skilled', 'Semi-Skilled', 'Unskilled']
const JOB_POST_GENDER_OPTIONS = ['Male', 'Female', 'Any']
const JOB_POST_EXPERIENCE_OPTIONS = ['Fresher', '1+ Years', '2+ Years', '5+ Years', 'Experienced Only']
const JOB_POST_SHIFT_TYPES = ['Day Shift', 'Night Shift', 'Rotational Shift']
const JOB_POST_DURATIONS = ['1 Day', '1 Week', '1 Month', 'Contract Basis', 'Permanent']
const JOB_POST_SALARY_TYPES = ['Daily Wage', 'Weekly Payment', 'Monthly Salary', 'Contract Payment']
const DEFAULT_WORKER_SALARY_TYPE = 'Daily Wage'
const WORKER_SALARY_TYPES = ['Daily Wage', 'Monthly Salary', 'Weekly', 'Per Piece', 'Contract', 'Hourly']
const JOB_POST_YES_NO_OPTIONS = ['Yes', 'No']
const JOB_POST_FACILITY_OPTIONS = ['Available', 'Not Available']

const JOB_POST_DETAIL_LABELS: Array<{ key: keyof LabourJobPost; label: string }> = [
  { key: 'connectedPlan', label: 'Connected plan' },
  { key: 'workerCategory', label: 'Worker category' },
  { key: 'genderPreference', label: 'Gender preference' },
  { key: 'ageRequirement', label: 'Age requirement' },
  { key: 'experienceRequired', label: 'Experience required' },
  { key: 'jobLocation', label: 'Job location' },
  { key: 'dutyHours', label: 'Duty hours' },
  { key: 'shiftType', label: 'Shift type' },
  { key: 'weeklyOff', label: 'Weekly off' },
  { key: 'jobDuration', label: 'Job duration' },
  { key: 'salaryType', label: 'Salary type' },
  { key: 'overtimeAvailable', label: 'Overtime available' },
  { key: 'foodFacility', label: 'Food facility' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'transportFacility', label: 'Transport facility' },
  { key: 'requiredSkills', label: 'Required skills' },
  { key: 'specialInstructions', label: 'Special instructions' },
  { key: 'languagesPreferred', label: 'Languages preferred' },
  { key: 'submissionMode', label: 'Submission mode' }
]

const splitJobPostDescription = (value: string) => {
  const normalized = String(value || '').replace(/\r/g, '')
  const detailMarker = '\n\nJob requirement details\n'
  const docsMarker = '\n\nDocuments\n'
  const detailIndex = normalized.indexOf(detailMarker)

  if (detailIndex === -1) {
    return {
      baseDescription: normalized.trim(),
      detailBlock: '',
      documentsBlock: ''
    }
  }

  const baseDescription = normalized.slice(0, detailIndex).trim()
  const afterDetails = normalized.slice(detailIndex + detailMarker.length)
  const docsIndex = afterDetails.indexOf(docsMarker)

  if (docsIndex === -1) {
    return {
      baseDescription,
      detailBlock: afterDetails.trim(),
      documentsBlock: ''
    }
  }

  return {
    baseDescription,
    detailBlock: afterDetails.slice(0, docsIndex).trim(),
    documentsBlock: afterDetails.slice(docsIndex + docsMarker.length).trim()
  }
}

const parseJobPostDraft = (jobPost: LabourJobPost, connectedPlanFallback = ''): LabourJobPost => {
  const { baseDescription, detailBlock, documentsBlock } = splitJobPostDescription(jobPost.description)
  const detailMap = new Map<string, string>()

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

  const nextDraft: LabourJobPost = {
    ...jobPost,
    description: baseDescription,
    connectedPlan: detailMap.get('connected plan') || connectedPlanFallback,
    workerCategory: detailMap.get('worker category') || '',
    genderPreference: detailMap.get('gender preference') || '',
    ageRequirement: detailMap.get('age requirement') || '',
    experienceRequired: detailMap.get('experience required') || '',
    jobLocation: detailMap.get('job location') || '',
    dutyHours: detailMap.get('duty hours') || '',
    shiftType: detailMap.get('shift type') || '',
    weeklyOff: detailMap.get('weekly off') || '',
    jobDuration: detailMap.get('job duration') || '',
    salaryType: detailMap.get('salary type') || '',
    overtimeAvailable: detailMap.get('overtime available') || '',
    foodFacility: detailMap.get('food facility') || '',
    accommodation: detailMap.get('accommodation') || '',
    transportFacility: detailMap.get('transport facility') || '',
    requiredSkills: detailMap.get('required skills') || '',
    specialInstructions: detailMap.get('special instructions') || '',
    languagesPreferred: detailMap.get('languages preferred') || '',
    submissionMode: detailMap.get('submission mode') || 'Pending review for publish',
    documentsBlock
  }

  return nextDraft
}

const buildJobPostDescription = (jobPost: LabourJobPost) => {
  const lines = [jobPost.description.trim()].filter(Boolean)

  const metaLines = JOB_POST_DETAIL_LABELS
    .map(({ key, label }) => [label, String(jobPost[key] || '').trim()] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)

  if (metaLines.length > 0) {
    lines.push(['Job requirement details', ...metaLines].join('\n'))
  }

  if (jobPost.documentsBlock.trim()) {
    lines.push(['Documents', jobPost.documentsBlock.trim()].join('\n'))
  }

  return lines.join('\n\n').trim()
}

export default function LabourExchangeAdminPage() {
  const [snapshot, setSnapshot] = useState<LabourSnapshot | null>(null)
  const [referralSnapshot, setReferralSnapshot] = useState<ReferralAdminSnapshot>(blankReferralAdminSnapshot)
  const [referralWithdrawalSnapshot, setReferralWithdrawalSnapshot] = useState<ReferralAdminWithdrawalSnapshot>(blankReferralAdminWithdrawalSnapshot)
  const [withdrawalPaymentDetails, setWithdrawalPaymentDetails] = useState<ReferralAdminWithdrawalPaymentDetails | null>(null)
  const [withdrawalPaymentDetailsRequestId, setWithdrawalPaymentDetailsRequestId] = useState('')
  const [withdrawalPaymentDetailsError, setWithdrawalPaymentDetailsError] = useState('')
  const [referralSettingsDraft, setReferralSettingsDraft] = useState<ReferralAdminSettings>(blankReferralAdminSettings)
  const [mastersSnapshot, setMastersSnapshot] = useState<LabourMastersSnapshot | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<LabourAdminSettings>(blankLabourAdminSettings)
  const [settingsStorage, setSettingsStorage] = useState<'supabase' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [referralLoading, setReferralLoading] = useState(true)
  const [referralWithdrawalsLoading, setReferralWithdrawalsLoading] = useState(true)
  const [referralSaving, setReferralSaving] = useState(false)
  const [referralWithdrawalSaving, setReferralWithdrawalSaving] = useState(false)
  const [withdrawalPaymentDetailsLoading, setWithdrawalPaymentDetailsLoading] = useState(false)
  const [referralSettingsLoading, setReferralSettingsLoading] = useState(true)
  const [referralSettingsSaving, setReferralSettingsSaving] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [isWorkerCategoryMenuOpen, setIsWorkerCategoryMenuOpen] = useState(false)
  const [workerCategorySearch, setWorkerCategorySearch] = useState('')
  const [workerHomeStateId, setWorkerHomeStateId] = useState('')
  const [showAllWorkerPreferredStates, setShowAllWorkerPreferredStates] = useState(false)
  const [expandedWorkerPreferredCityStates, setExpandedWorkerPreferredCityStates] = useState<string[]>([])
  const [activeSection, setActiveSection] = useState<LabourSection>('overview')
  const [referralAdminTab, setReferralAdminTab] = useState<ReferralAdminTab>('dashboard')
  const [referralWorkerSearch, setReferralWorkerSearch] = useState('')
  const [referralWorkerStatusFilter, setReferralWorkerStatusFilter] = useState<ReferralWorkerStatusFilter>('all')
  const [referralCategorySearch, setReferralCategorySearch] = useState('')
  const [referralIndustryFilter, setReferralIndustryFilter] = useState('')
  const [referralBusinessTypeFilter, setReferralBusinessTypeFilter] = useState('')
  const [selectedReferralWorkerId, setSelectedReferralWorkerId] = useState('')
  const [selectedReferralCategoryIds, setSelectedReferralCategoryIds] = useState<string[]>([])
  const [referralRewardDraft, setReferralRewardDraft] = useState<Record<string, string>>({})
  const [referralTrackingFilters, setReferralTrackingFilters] = useState({ search: '', agentWorkerId: 'all' })
  const [referralLedgerFilters, setReferralLedgerFilters] = useState<ReferralLedgerFilters>(blankReferralLedgerFilters)
  const [referralWithdrawalFilters, setReferralWithdrawalFilters] = useState<ReferralWithdrawalFilters>(blankReferralWithdrawalFilters)
  const [creditingReferralId, setCreditingReferralId] = useState('')
  const [withdrawalReviewDraft, setWithdrawalReviewDraft] = useState<{
    requestId: string
    action: ReferralWithdrawalReviewAction
    rejectionReason: string
    paymentReference: string
    paymentConfirmed: boolean
  } | null>(null)

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
  const [isWorkerKycReviewOpen, setIsWorkerKycReviewOpen] = useState(false)
  const [workerKycReviewDraft, setWorkerKycReviewDraft] = useState<WorkerKycReviewDraft>(blankWorkerKycReviewDraft)
  const [workerKycReviewValidation, setWorkerKycReviewValidation] = useState('')
  const [selectedJobApplicationId, setSelectedJobApplicationId] = useState<string | null>(null)
  const [selectedCompanyAuditId, setSelectedCompanyAuditId] = useState<string | null>(null)
  const [selectedSavedJobId, setSelectedSavedJobId] = useState<string | null>(null)
  const [selectedWorkerNotificationId, setSelectedWorkerNotificationId] = useState<string | null>(null)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editingJobPostId, setEditingJobPostId] = useState<string | null>(null)
  const [editingWalletTransactionId, setEditingWalletTransactionId] = useState<string | null>(null)
  const [editingRechargeRequestId, setEditingRechargeRequestId] = useState<string | null>(null)
  const workerKycPanelRef = useRef<HTMLDivElement | null>(null)

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
  const [workerRechargeHistoryFilters, setWorkerRechargeHistoryFilters] = useState<WorkerRechargeHistoryFilters>(blankWorkerRechargeHistoryFilters)
  const [jobPostPaymentHistoryFilters, setJobPostPaymentHistoryFilters] = useState<JobPostPaymentHistoryFilters>(blankJobPostPaymentHistoryFilters)
  const [companyBillingHistoryFilters, setCompanyBillingHistoryFilters] = useState<CompanyBillingHistoryFilters>(blankCompanyBillingHistoryFilters)

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #d7dfeb',
    color: '#0f172a',
    fontSize: '13px',
    padding: '9px 11px',
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
    border: '1px solid #dce4ef',
    borderRadius: '20px',
    padding: '18px',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)'
  }

  const compactFilterPanelStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-end',
    gap: '10px',
    marginBottom: '16px',
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc'
  }

  const subtleButtonStyle = {
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #d7dfeb',
    padding: '9px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none'
  }

  const primaryButtonStyle = {
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    padding: '9px 15px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none'
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

  const fetchMasters = async () => {
    try {
      const response = await fetch('/api/admin/labour/masters', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Unable to load labour master data.')
      }

      const data = await response.json()
      setMastersSnapshot(data)
    } catch (fetchError) {
      console.warn('Labour masters fallback in use:', fetchError)
      setMastersSnapshot(null)
    }
  }

  const fetchReferralSnapshot = async () => {
    setReferralLoading(true)

    try {
      const response = await fetch('/api/admin/labour/referrals', { cache: 'no-store' })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load referral data.')
      }

      setReferralSnapshot(data)
    } catch {
      setError(current => current || 'Unable to load Refer & Earn data right now.')
      setReferralSnapshot(blankReferralAdminSnapshot)
    } finally {
      setReferralLoading(false)
    }
  }

  const fetchReferralSettings = async () => {
    setReferralSettingsLoading(true)

    try {
      const response = await fetch('/api/admin/labour/referral-settings', { cache: 'no-store' })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load referral settings.')
      }

      setReferralSettingsDraft(data.settings || blankReferralAdminSettings)
    } catch {
      setError(current => current || 'Unable to load Refer & Earn settings right now.')
      setReferralSettingsDraft(blankReferralAdminSettings)
    } finally {
      setReferralSettingsLoading(false)
    }
  }

  const fetchReferralWithdrawals = async () => {
    setReferralWithdrawalsLoading(true)

    try {
      const response = await fetch('/api/admin/labour/withdrawals', { cache: 'no-store' })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load withdrawal requests.')
      }

      setReferralWithdrawalSnapshot(data || blankReferralAdminWithdrawalSnapshot)
    } catch {
      setError(current => current || 'Unable to load Refer & Earn withdrawal requests right now.')
      setReferralWithdrawalSnapshot(blankReferralAdminWithdrawalSnapshot)
    } finally {
      setReferralWithdrawalsLoading(false)
    }
  }

  useEffect(() => {
    void fetchSnapshot()
    void fetchSettings()
    void fetchMasters()
    void fetchReferralSnapshot()
    void fetchReferralSettings()
    void fetchReferralWithdrawals()
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

  const toggleWorkerLanguage = (code: string, enabled: boolean) => {
    setSettingsDraft(current => {
      const nextEnabledCodes = enabled
        ? Array.from(new Set([...current.workerLanguageControls.enabledWorkerLanguageCodes, code]))
        : current.workerLanguageControls.enabledWorkerLanguageCodes.filter(item => item !== code)

      const sanitizedCodes = nextEnabledCodes.length > 0 ? nextEnabledCodes : [code]
      const nextDefaultCode = sanitizedCodes.includes(current.workerLanguageControls.defaultWorkerLanguageCode)
        ? current.workerLanguageControls.defaultWorkerLanguageCode
        : sanitizedCodes[0]

      return {
        ...current,
        workerLanguageControls: {
          ...current.workerLanguageControls,
          enabledWorkerLanguageCodes: sanitizedCodes,
          defaultWorkerLanguageCode: nextDefaultCode
        }
      }
    })
  }

  const masterOptionsByKey = useMemo(
    () => groupLabourMasterOptions(mastersSnapshot?.options || []),
    [mastersSnapshot]
  )

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

  const getCategoryName = (categoryId: string) =>
    snapshot?.categories.find(category => category.id === categoryId)?.name || categoryId
  const adminVisibleCategories = snapshot?.adminCategories || snapshot?.categories || []
  const getIndustryCategoryLabel = (value: string) =>
    resolveLabourMasterLabel(masterOptionsByKey.industry_category || [], value, humanizeMasterFallback(value))
  const getBusinessTypeLabel = (value: string) =>
    resolveLabourMasterLabel(masterOptionsByKey.business_type || [], value, humanizeMasterFallback(value))

  const categoryDependencyRowsByCategoryId = useMemo(() => {
    const activeIndustryBusinessKeys = new Set(
      (mastersSnapshot?.industryBusinessDependencies || [])
        .filter(record => record.isActive)
        .map(record => `${record.industryCategoryOptionId}::${record.businessTypeOptionId}`)
    )
    const activeIndustryOptionIds = new Set(
      (masterOptionsByKey.industry_category || []).filter(option => option.isActive).map(option => option.id)
    )
    const activeBusinessTypeOptionIds = new Set(
      (masterOptionsByKey.business_type || []).filter(option => option.isActive).map(option => option.id)
    )

    return (mastersSnapshot?.categoryDependencies || []).reduce<Record<string, CategoryDependencyRow[]>>((groups, dependency) => {
      const row: CategoryDependencyRow = {
        id: dependency.id,
        categoryId: dependency.categoryId,
        categoryLabel: getCategoryName(dependency.categoryId),
        industryCategoryOptionId: dependency.industryCategoryOptionId,
        industryCategoryLabel: getIndustryCategoryLabel(dependency.industryCategoryOptionId),
        businessTypeOptionId: dependency.businessTypeOptionId,
        businessTypeLabel: getBusinessTypeLabel(dependency.businessTypeOptionId),
        isActive: dependency.isActive,
        isIndustryBusinessVisible: activeIndustryBusinessKeys.has(`${dependency.industryCategoryOptionId}::${dependency.businessTypeOptionId}`),
        isIndustryOptionVisible: activeIndustryOptionIds.has(dependency.industryCategoryOptionId),
        isBusinessTypeOptionVisible: activeBusinessTypeOptionIds.has(dependency.businessTypeOptionId)
      }

      if (!groups[dependency.categoryId]) {
        groups[dependency.categoryId] = []
      }

      groups[dependency.categoryId].push(row)
      return groups
    }, {})
  }, [getBusinessTypeLabel, getCategoryName, getIndustryCategoryLabel, masterOptionsByKey.business_type, masterOptionsByKey.industry_category, mastersSnapshot])

  const getMasterSelectOptions = (
    masterKey: LabourMasterKey,
    selectedValues: string[] = [],
    fallbackValues: string[] = []
  ) => buildLabourMasterSelectOptions(masterOptionsByKey[masterKey] || [], selectedValues, fallbackValues)

  const labourLocationOptions = useMemo(
    () => buildLabourLocationOptions(mastersSnapshot?.options || []),
    [mastersSnapshot]
  )

  const adminCityOptions = labourLocationOptions.activeCities.reduce<string[]>((list, option) => {
    const normalizedCity = option.value.trim()
    if (!normalizedCity) return list
    if (list.some(item => item.toLowerCase() === normalizedCity.toLowerCase())) return list
    return [...list, normalizedCity]
  }, []).reduce<string[]>((list, city) => {
    const normalizedCity = city.trim()
    if (!normalizedCity) return list
    if (list.some(item => item.toLowerCase() === normalizedCity.toLowerCase())) return list
    return [...list, normalizedCity]
  }, [])

  const defaultAdminCity = adminCityOptions[0] || ''

  const getCitySelectOptions = (selectedCity: string) => {
    const normalizedSelectedCity = selectedCity.trim()
    if (!normalizedSelectedCity) return adminCityOptions
    if (adminCityOptions.some(city => city.toLowerCase() === normalizedSelectedCity.toLowerCase())) return adminCityOptions
    return [normalizedSelectedCity, ...adminCityOptions]
  }

  const workerStateOptions = labourLocationOptions.activeStates
  const workerPreferredStateOptions = showAllWorkerPreferredStates
    ? workerStateOptions
    : workerStateOptions.slice(0, 5)

  const getWorkerStateCities = (stateOptionId: string) =>
    labourLocationOptions.activeCitiesByState.find(group => group.stateOptionId === stateOptionId)?.cities || []

  const getWorkerHomeCityOptions = (stateOptionId: string, selectedCity = '') => {
    const stateCities = getWorkerStateCities(stateOptionId)
    const cityOptions = stateCities.reduce<string[]>((list, option) => {
      const cityValue = option.value.trim() || option.label.trim()
      if (!cityValue) return list
      if (list.some(item => item.toLowerCase() === cityValue.toLowerCase())) return list
      return [...list, cityValue]
    }, [])
    const normalizedSelectedCity = selectedCity.trim()
    if (!normalizedSelectedCity) return cityOptions
    if (cityOptions.some(city => city.toLowerCase() === normalizedSelectedCity.toLowerCase())) return cityOptions
    return [normalizedSelectedCity, ...cityOptions]
  }

  const getUnknownRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null

  const collectPreferredLocationValues = (
    record: Record<string, unknown>,
    keys: string[]
  ) => keys.reduce<string[]>((values, key) => {
    const value = record[key]
    const nextValues = Array.isArray(value)
      ? value.flatMap(item => {
          if (typeof item === 'string' || typeof item === 'number') return [String(item)]
          const itemRecord = getUnknownRecord(item)
          return itemRecord
            ? collectPreferredLocationValues(itemRecord, ['id', 'label', 'value', 'name', 'city', 'cityLabel', 'city_label'])
            : []
        })
      : [String(value || '')]

    for (const nextValue of nextValues) {
      const trimmedValue = nextValue.trim()
      if (trimmedValue && !values.some(item => normalizeComparableValue(item) === normalizeComparableValue(trimmedValue))) {
        values.push(trimmedValue)
      }
    }
    return values
  }, [])

  const optionMatchesPreferredValues = (
    option: { id: string; label: string; value: string; slug: string },
    values: string[]
  ) => {
    const optionTokens = [
      option.id,
      option.label,
      option.value,
      option.slug
    ].flatMap(getComparableValueTokens)

    return values.some(value =>
      getComparableValueTokens(value).some(token => optionTokens.includes(token))
    )
  }

  const normalizeWorkerPreferredLocationDraft = (rawLocations: unknown): LabourWorker['preferredWorkLocations'] => {
    if (!Array.isArray(rawLocations)) return []

    const normalizedLocations: LabourWorker['preferredWorkLocations'] = []

    for (const rawLocation of rawLocations) {
      const record = getUnknownRecord(rawLocation)
      if (!record) continue

      const stateValues = collectPreferredLocationValues(record, [
        'stateOptionId',
        'state_option_id',
        'stateId',
        'state_id',
        'stateLabel',
        'state_label',
        'state',
        'stateName',
        'state_name'
      ])
      const stateOption = workerStateOptions.find(option => optionMatchesPreferredValues(option, stateValues))
      const stateOptionId = stateOption?.id || String(record.stateOptionId || record.state_option_id || '').trim()
      const stateLabel = stateOption?.label || String(record.stateLabel || record.state_label || record.state || '').trim()
      if (!stateOptionId && !stateLabel) continue

      const stateCities = stateOption ? getWorkerStateCities(stateOption.id) : []
      const cityValues = collectPreferredLocationValues(record, [
        'cityOptionIds',
        'city_option_ids',
        'cityLabels',
        'city_labels',
        'cities',
        'cityOptionId',
        'city_option_id',
        'cityId',
        'city_id',
        'cityLabel',
        'city_label',
        'city',
        'cityName',
        'city_name'
      ])
      const matchedCities = stateCities.filter(option => optionMatchesPreferredValues(option, cityValues))
      const cityOptionIds = matchedCities.length > 0
        ? matchedCities.map(option => option.id)
        : collectPreferredLocationValues(record, ['cityOptionIds', 'city_option_ids', 'cityOptionId', 'city_option_id'])
      const cityLabels = matchedCities.length > 0
        ? matchedCities.map(option => option.label || option.value)
        : cityValues.filter(value => !stateValues.some(stateValue => normalizeComparableValue(stateValue) === normalizeComparableValue(value)))

      const existingLocation = normalizedLocations.find(location =>
        normalizeComparableValue(location.stateOptionId || location.stateLabel) === normalizeComparableValue(stateOptionId || stateLabel)
      )
      if (existingLocation) {
        for (const cityOptionId of cityOptionIds) {
          if (cityOptionId && !existingLocation.cityOptionIds.includes(cityOptionId)) {
            existingLocation.cityOptionIds.push(cityOptionId)
          }
        }
        for (const cityLabel of cityLabels) {
          if (cityLabel && !existingLocation.cityLabels.includes(cityLabel)) {
            existingLocation.cityLabels.push(cityLabel)
          }
        }
      } else {
        normalizedLocations.push({
          stateOptionId,
          stateLabel,
          cityOptionIds,
          cityLabels
        })
      }
    }

    return normalizedLocations.filter(location => location.stateOptionId || location.cityLabels.length > 0)
  }

  const inferWorkerHomeStateId = (cityValue: string) => {
    const normalizedCity = cityValue.trim().toLowerCase()
    if (!normalizedCity) return ''
    return labourLocationOptions.activeCitiesByState.find(group =>
      group.cities.some(city => {
        const optionCity = (city.value.trim() || city.label.trim()).toLowerCase()
        return optionCity === normalizedCity
      })
    )?.stateOptionId || ''
  }

  const getPreferredLocationForState = (stateOptionId: string) =>
    workerDraft.preferredWorkLocations.find(location => location.stateOptionId === stateOptionId) || null

  const isWorkerPreferredStateSelected = (stateOptionId: string) =>
    Boolean(getPreferredLocationForState(stateOptionId))

  const isWorkerPreferredCitySelected = (stateOptionId: string, cityOptionId: string) =>
    Boolean(getPreferredLocationForState(stateOptionId)?.cityOptionIds.includes(cityOptionId))

  const countWorkerPreferredCities = () =>
    workerDraft.preferredWorkLocations.reduce((count, location) => count + location.cityOptionIds.length, 0)

  const toggleWorkerPreferredState = (stateOptionId: string) => {
    const stateOption = workerStateOptions.find(option => option.id === stateOptionId)
    if (!stateOption) return
    setWorkerDraft(current => {
      const alreadySelected = current.preferredWorkLocations.some(location => location.stateOptionId === stateOptionId)
      if (alreadySelected) {
        return {
          ...current,
          preferredWorkLocations: current.preferredWorkLocations.filter(location => location.stateOptionId !== stateOptionId)
        }
      }
      return {
        ...current,
        preferredWorkLocations: [
          ...current.preferredWorkLocations,
          {
            stateOptionId,
            stateLabel: stateOption.label,
            cityOptionIds: [],
            cityLabels: []
          }
        ]
      }
    })
  }

  const toggleWorkerPreferredCity = (stateOptionId: string, cityOptionId: string) => {
    const stateOption = workerStateOptions.find(option => option.id === stateOptionId)
    const cityOption = getWorkerStateCities(stateOptionId).find(option => option.id === cityOptionId)
    if (!stateOption || !cityOption) return

    setWorkerDraft(current => {
      const existingLocation = current.preferredWorkLocations.find(location => location.stateOptionId === stateOptionId)
      const cityLabel = cityOption.label || cityOption.value
      const nextLocations = existingLocation
        ? current.preferredWorkLocations.map(location => {
            if (location.stateOptionId !== stateOptionId) return location
            const alreadySelected = location.cityOptionIds.includes(cityOptionId)
            return {
              ...location,
              cityOptionIds: alreadySelected
                ? location.cityOptionIds.filter(id => id !== cityOptionId)
                : [...location.cityOptionIds, cityOptionId],
              cityLabels: alreadySelected
                ? location.cityLabels.filter(label => label !== cityLabel)
                : [...location.cityLabels, cityLabel]
            }
          })
        : [
            ...current.preferredWorkLocations,
            {
              stateOptionId,
              stateLabel: stateOption.label,
              cityOptionIds: [cityOptionId],
              cityLabels: [cityLabel]
            }
          ]

      return {
        ...current,
        preferredWorkLocations: nextLocations.filter(location => location.cityOptionIds.length > 0 || location.stateOptionId === stateOptionId)
      }
    })
  }

  const toggleWorkerPreferredCityExpansion = (stateOptionId: string) => {
    setExpandedWorkerPreferredCityStates(current =>
      current.includes(stateOptionId)
        ? current.filter(id => id !== stateOptionId)
        : [...current, stateOptionId]
    )
  }

  useEffect(() => {
    if (!defaultAdminCity) return
    setWorkerDraft(current => ({
      ...current,
      city: current.city.trim() || defaultAdminCity,
      homeCity: current.homeCity.trim() || defaultAdminCity
    }))
    setJobPostDraft(current => (current.city.trim() ? current : { ...current, city: defaultAdminCity }))
  }, [defaultAdminCity])

  useEffect(() => {
    if (workerHomeStateId) return
    const inferredStateId = inferWorkerHomeStateId(workerDraft.homeCity || workerDraft.city)
    if (inferredStateId) {
      setWorkerHomeStateId(inferredStateId)
    }
  }, [workerDraft.city, workerDraft.homeCity, workerHomeStateId, labourLocationOptions])

  const workerExperienceOptions = getMasterSelectOptions('worker_experience_years', [String(workerDraft.experienceYears)], ['0', '1', '2', '3', '5', '10'])
  const workerAvailabilitySelectOptions = getMasterSelectOptions('worker_status_availability', [workerDraft.availability], workerAvailabilityOptions)
  const workerSalaryTypeOptions = getMasterSelectOptions(
    'worker_salary_type',
    [workerDraft.salaryType || DEFAULT_WORKER_SALARY_TYPE],
    WORKER_SALARY_TYPES
  )
  const workerAvailabilityFilterOptions = getMasterSelectOptions(
    'worker_status_availability',
    [workerFilters.availability === 'all' ? '' : workerFilters.availability],
    workerAvailabilityOptions
  )
  const activeWorkerPlans = useMemo(() => {
    const workerPlans = (snapshot?.plans || []).filter(plan => plan.audience === 'worker' && plan.isActive)
    const defaultPlan = getDefaultWorkerPlan(workerPlans)
    if (!defaultPlan) return workerPlans

    return [defaultPlan, ...workerPlans.filter(plan => plan.id !== defaultPlan.id)]
  }, [snapshot?.plans])
  const selectedWorkerPlan = (snapshot?.plans || []).find(plan => plan.id === workerDraft.activePlan && plan.audience === 'worker') || null
  const workerPlanSelectOptions = selectedWorkerPlan && !activeWorkerPlans.some(plan => plan.id === selectedWorkerPlan.id)
    ? [selectedWorkerPlan, ...activeWorkerPlans]
    : activeWorkerPlans
  const selectedWorkerPlanValidityDays = selectedWorkerPlan ? getPlanValidityDays(selectedWorkerPlan) : 0
  const visibleWorkerIndustryMasterOptions = getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
  const visibleWorkerBusinessTypeMasterOptions = getVisibleLabourMasterOptions(masterOptionsByKey.business_type || [])
  const getWorkerBusinessTypeMasterOptionsForIndustry = (industryCategoryValue: string) =>
    filterBusinessTypesByIndustryDependency(
      masterOptionsByKey.business_type || [],
      masterOptionsByKey.industry_category || [],
      mastersSnapshot?.industryBusinessDependencies || [],
      industryCategoryValue
    )
  const workerIndustryCategoryOptions = buildLabourMasterSelectOptions(
    visibleWorkerIndustryMasterOptions,
    workerDraft.industryCategory ? [workerDraft.industryCategory] : []
  )
  const filteredWorkerBusinessTypeMasterOptions = getWorkerBusinessTypeMasterOptionsForIndustry(workerDraft.industryCategory)
  const workerBusinessTypeOptions = buildLabourMasterSelectOptions(
    filteredWorkerBusinessTypeMasterOptions,
    workerDraft.businessType ? [workerDraft.businessType] : []
  )
  const workerFilterIndustryCategoryOptions = buildLabourMasterSelectOptions(
    getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || []),
    workerFilters.industryCategory ? [workerFilters.industryCategory] : []
  )
  const filteredWorkerFilterBusinessTypeMasterOptions = filterBusinessTypesByIndustryDependency(
    masterOptionsByKey.business_type || [],
    masterOptionsByKey.industry_category || [],
    mastersSnapshot?.industryBusinessDependencies || [],
    workerFilters.industryCategory
  )
  const workerFilterBusinessTypeOptions = buildLabourMasterSelectOptions(
    filteredWorkerFilterBusinessTypeMasterOptions,
    workerFilters.businessType ? [workerFilters.businessType] : []
  )
  const workerCompanyOptions = [...(snapshot?.companies || [])]
    .sort((left, right) => left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' }))
    .map(company => ({ id: company.id, label: company.companyName, value: company.id }))
  const availableWorkerCategories = useMemo(
    () =>
      !snapshot || !workerDraft.industryCategory.trim() || !workerDraft.businessType.trim()
        ? []
        : filterCategoriesByLabourDependency(
            snapshot.categories,
            mastersSnapshot?.categoryDependencies || [],
            masterOptionsByKey,
            workerDraft.businessType,
            workerDraft.industryCategory
          ),
    [masterOptionsByKey, mastersSnapshot?.categoryDependencies, snapshot, workerDraft.businessType, workerDraft.industryCategory]
  )
  const workerCategoryOptions = useMemo(() => {
    if (!snapshot) return []

    const optionsById = new Map<string, LabourCategory>()
    availableWorkerCategories.forEach(category => {
      optionsById.set(category.id, category)
    })

    snapshot.categories
      .filter(category => workerDraft.categoryIds.includes(category.id))
      .forEach(category => {
        if (!optionsById.has(category.id)) {
          optionsById.set(category.id, category)
        }
      })

    return [...optionsById.values()].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
  }, [availableWorkerCategories, snapshot, workerDraft.categoryIds])
  const visibleWorkerCategoryOptions = workerCategoryOptions.filter(category =>
    matchesSearch(workerCategorySearch, [category.name, category.slug, category.description])
  )
  const resolveWorkerCategoryIds = (categoryValues: string[] = []) => {
    if (!snapshot) {
      return Array.from(
        new Set(
          categoryValues
            .map(value => String(value || '').trim())
            .filter(Boolean)
        )
      )
    }

    const resolvedIds = new Map<string, string>()
    const categoryIndex = snapshot.categories.map(category => ({
      category,
      tokens: new Set(
        [category.id, category.name, category.slug].flatMap(getComparableValueTokens)
      )
    }))

    categoryValues.forEach(value => {
      const trimmedValue = String(value || '').trim()
      if (!trimmedValue) return

      const requestedTokens = new Set(getComparableValueTokens(trimmedValue))
      const matchedCategory = categoryIndex.find(({ tokens }) =>
        Array.from(requestedTokens).some(token => tokens.has(token))
      )?.category

      if (matchedCategory) {
        resolvedIds.set(matchedCategory.id, matchedCategory.id)
        return
      }

      resolvedIds.set(trimmedValue, trimmedValue)
    })

    return [...resolvedIds.values()]
  }
  const findMatchingWorkerCategoryDependency = (
    categoryValues: string[] = [],
    industryCategoryValue: string = ''
  ) => {
    if (!snapshot) return null

    const resolvedCategoryIds = resolveWorkerCategoryIds(categoryValues)
    const selectedCategoryTokens = new Set<string>()

    resolvedCategoryIds.forEach(categoryValue => {
      getComparableValueTokens(categoryValue).forEach(token => selectedCategoryTokens.add(token))
      const matchedCategory = snapshot.categories.find(category => category.id === categoryValue)
      if (matchedCategory) {
        ;[matchedCategory.id, matchedCategory.name, matchedCategory.slug]
          .flatMap(getComparableValueTokens)
          .forEach(token => selectedCategoryTokens.add(token))
      }
    })

    categoryValues.forEach(categoryValue =>
      getComparableValueTokens(categoryValue).forEach(token => selectedCategoryTokens.add(token))
    )

    if (selectedCategoryTokens.size === 0) return null

    const matchedIndustryOption = industryCategoryValue
      ? findMatchingMasterOption(visibleWorkerIndustryMasterOptions, industryCategoryValue)
      : null

    const matchingDependencies = (mastersSnapshot?.categoryDependencies || [])
      .filter(dependency => {
        if (!dependency.isActive) return false
        if (matchedIndustryOption && dependency.industryCategoryOptionId !== matchedIndustryOption.id) return false

        const dependencyCategory = snapshot.categories.find(category => category.id === dependency.categoryId)
        const dependencyTokens = [
          dependency.categoryId,
          dependencyCategory?.name || '',
          dependencyCategory?.slug || ''
        ].flatMap(getComparableValueTokens)

        return dependencyTokens.some(token => selectedCategoryTokens.has(token))
      })
      .sort((left, right) => {
        const leftIndustryExists = visibleWorkerIndustryMasterOptions.some(option => option.id === left.industryCategoryOptionId)
        const rightIndustryExists = visibleWorkerIndustryMasterOptions.some(option => option.id === right.industryCategoryOptionId)
        const leftBusinessExists = visibleWorkerBusinessTypeMasterOptions.some(option => option.id === left.businessTypeOptionId)
        const rightBusinessExists = visibleWorkerBusinessTypeMasterOptions.some(option => option.id === right.businessTypeOptionId)
        const leftScore = (leftIndustryExists ? 4 : 0) + (leftBusinessExists ? 4 : 0) + (matchedIndustryOption?.id === left.industryCategoryOptionId ? 2 : 0)
        const rightScore = (rightIndustryExists ? 4 : 0) + (rightBusinessExists ? 4 : 0) + (matchedIndustryOption?.id === right.industryCategoryOptionId ? 2 : 0)
        return rightScore - leftScore
      })

    return matchingDependencies[0] || null
  }
  const resolveWorkerIndustryCategoryValue = (value: string, categoryIds: string[] = []) => {
    const matchedOption = findMatchingMasterOption(visibleWorkerIndustryMasterOptions, value)
    if (matchedOption) return matchedOption.value

    const matchingDependency = findMatchingWorkerCategoryDependency(categoryIds)
    if (!matchingDependency) return ''

    return visibleWorkerIndustryMasterOptions.find(
      option => option.id === matchingDependency.industryCategoryOptionId
    )?.value || ''
  }

  const resolveWorkerBusinessTypeValue = (
    value: string,
    industryCategoryValue: string,
    categoryIds: string[] = []
  ) => {
    const resolvedIndustryCategoryValue = resolveWorkerIndustryCategoryValue(industryCategoryValue, categoryIds)
    const filteredBusinessTypeOptions = getWorkerBusinessTypeMasterOptionsForIndustry(
      resolvedIndustryCategoryValue || industryCategoryValue
    )
    const directMatch =
      findMatchingMasterOption(filteredBusinessTypeOptions, value) ||
      findMatchingMasterOption(visibleWorkerBusinessTypeMasterOptions, value)
    if (directMatch) return directMatch.value
    const matchingDependency = findMatchingWorkerCategoryDependency(
      categoryIds,
      resolvedIndustryCategoryValue || industryCategoryValue
    )
    if (!matchingDependency) return ''

    return visibleWorkerBusinessTypeMasterOptions.find(
      option => option.id === matchingDependency.businessTypeOptionId
    )?.value || ''
  }

  const syncWorkerPlanDraft = (
    draft: LabourWorker,
    nextPlanId?: string,
    forceRecalculateDates: boolean = false
  ) => {
    const selectedPlanId = (nextPlanId ?? draft.activePlan).trim()
    const selectedPlan =
      (snapshot?.plans || []).find(
        plan => plan.audience === 'worker' && plan.id === selectedPlanId
      ) ||
      (!selectedPlanId ? getDefaultWorkerPlan(activeWorkerPlans) || null : null)

    if (!selectedPlan) {
      return {
        ...draft,
        activePlan: '',
        planValidFrom: '',
        planValidUntil: '',
        lastWalletDeductionDate: ''
      }
    }

    const nextPlanValidFrom =
      forceRecalculateDates || !draft.planValidFrom
        ? draft.planValidFrom || getTodayDateValue()
        : draft.planValidFrom

    return {
      ...draft,
      activePlan: selectedPlan.id,
      planValidFrom: nextPlanValidFrom,
      planValidUntil:
        forceRecalculateDates || !draft.planValidUntil
          ? addDays(nextPlanValidFrom, getPlanValidityDays(selectedPlan))
          : draft.planValidUntil,
      lastWalletDeductionDate: draft.activePlan && draft.activePlan !== selectedPlan.id ? '' : draft.lastWalletDeductionDate,
      registrationFeePaid:
        !draft.activePlan || draft.activePlan !== selectedPlan.id
          ? (selectedPlan.registrationFee <= 0 ? true : draft.registrationFeePaid)
          : draft.registrationFeePaid
    }
  }

  const buildWorkerEditorDraft = (worker?: LabourWorker) => {
    const baseDraft: LabourWorker = {
      ...blankWorker,
      city: defaultAdminCity,
      homeCity: defaultAdminCity,
      ...(worker || {})
    }
    const resolvedCategoryIds = resolveWorkerCategoryIds(baseDraft.categoryIds)

    const nextIndustryCategory = resolveWorkerIndustryCategoryValue(
      baseDraft.industryCategory,
      resolvedCategoryIds
    )
    const nextBusinessType = resolveWorkerBusinessTypeValue(
      baseDraft.businessType,
      nextIndustryCategory || baseDraft.industryCategory,
      resolvedCategoryIds
    )
    const minimumExpectedWage = baseDraft.minimumExpectedWage || baseDraft.expectedDailyWage || 0
    const maximumExpectedWage = baseDraft.maximumExpectedWage || baseDraft.expectedDailyWage || 0
    const rawBaseDraft = baseDraft as unknown as Record<string, unknown>
    const preferredWorkLocations = normalizeWorkerPreferredLocationDraft(
      rawBaseDraft.preferredWorkLocations || rawBaseDraft.preferred_work_locations
    )
    const skills = Array.isArray(rawBaseDraft.skills)
      ? rawBaseDraft.skills.map(skill => String(skill || '').trim()).filter(Boolean)
      : String(rawBaseDraft.skills || '')
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean)

    return syncWorkerPlanDraft({
      ...baseDraft,
      categoryIds: resolvedCategoryIds,
      skills,
      industryCategory: nextIndustryCategory,
      businessType: nextBusinessType,
      preferredWorkLocations,
      minimumExpectedWage,
      maximumExpectedWage,
      expectedDailyWage: minimumExpectedWage || maximumExpectedWage,
      salaryType: baseDraft.salaryType.trim() || DEFAULT_WORKER_SALARY_TYPE
    })
  }

  const buildWorkerSavePayload = (worker: LabourWorker): Record<string, unknown> => {
    const minimumExpectedWage = Number(worker.minimumExpectedWage || 0)
    const maximumExpectedWage = Number(worker.maximumExpectedWage || 0)
    const expectedDailyWage = minimumExpectedWage || maximumExpectedWage || Number(worker.expectedDailyWage || 0)

    return {
      ...worker,
      expectedDailyWage,
      minimumExpectedWage,
      maximumExpectedWage,
      minimum_expected_wage: minimumExpectedWage || null,
      maximum_expected_wage: maximumExpectedWage || null,
      skills: worker.skills.map(skill => skill.trim()).filter(Boolean),
      preferredWorkLocations: worker.preferredWorkLocations
        .filter(location => location.cityLabels.length > 0 || location.cityOptionIds.length > 0)
        .map(location => ({
          state: location.stateLabel,
          cities: location.cityLabels,
          stateOptionId: location.stateOptionId,
          stateLabel: location.stateLabel,
          cityOptionIds: location.cityOptionIds,
          cityLabels: location.cityLabels
        }))
    }
  }

  const getWorkerPreferredWorkCityLabels = (worker: LabourWorker) => {
    const rawWorker = worker as unknown as Record<string, unknown>
    const normalizedLocations = normalizeWorkerPreferredLocationDraft(
      rawWorker.preferredWorkLocations || rawWorker.preferred_work_locations
    )
    const cityLabels = normalizedLocations.flatMap(location => location.cityLabels)

    return Array.from(
      new Set(
        cityLabels
          .map(label => label.trim())
          .filter(Boolean)
      )
    )
  }

  const companyIndustryCategoryOptions = buildLabourMasterSelectOptions(
    getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
  )
  const filteredCompanyBusinessTypeMasterOptions = filterBusinessTypesByIndustryDependency(
    masterOptionsByKey.business_type || [],
    masterOptionsByKey.industry_category || [],
    mastersSnapshot?.industryBusinessDependencies || [],
    companyDraft.industryCategory
  )
  const companyBusinessTypeOptions = buildLabourMasterSelectOptions(filteredCompanyBusinessTypeMasterOptions)
  const companyFilterIndustryCategoryOptions = companyIndustryCategoryOptions
  const filteredCompanyFilterBusinessTypeMasterOptions = filterBusinessTypesByIndustryDependency(
    masterOptionsByKey.business_type || [],
    masterOptionsByKey.industry_category || [],
    mastersSnapshot?.industryBusinessDependencies || [],
    companyFilters.industryCategory
  )
  const companyFilterBusinessTypeOptions = buildLabourMasterSelectOptions(filteredCompanyFilterBusinessTypeMasterOptions)
  const jobFilterIndustryCategoryOptions = companyIndustryCategoryOptions
  const filteredJobFilterBusinessTypeMasterOptions = filterBusinessTypesByIndustryDependency(
    masterOptionsByKey.business_type || [],
    masterOptionsByKey.industry_category || [],
    mastersSnapshot?.industryBusinessDependencies || [],
    jobFilters.industryCategory
  )
  const jobFilterBusinessTypeOptions = buildLabourMasterSelectOptions(
    filteredJobFilterBusinessTypeMasterOptions,
    jobFilters.businessType ? [jobFilters.businessType] : []
  )
  const companyStateOptions = getMasterSelectOptions('state', [companyDraft.state])
  const getCompanyCityOptionsForState = (stateValue: string, selectedCity = '') => {
    const normalizedSelectedCity = selectedCity.trim()
    const matchingState = findMatchingMasterOption(
      [
        ...labourLocationOptions.activeStates,
        ...(masterOptionsByKey.state || [])
      ],
      stateValue
    )

    const sourceCities = matchingState
      ? (labourLocationOptions.activeCitiesByState.find(group => group.stateOptionId === matchingState.id)?.cities || [])
      : labourLocationOptions.activeCities

    const optionCities = sourceCities.reduce<string[]>((list, option) => {
      const cityValue = option.value.trim() || option.label.trim()
      if (!cityValue) return list
      if (list.some(item => item.toLowerCase() === cityValue.toLowerCase())) return list
      return [...list, cityValue]
    }, [])

    if (!normalizedSelectedCity) return optionCities
    if (optionCities.some(city => city.toLowerCase() === normalizedSelectedCity.toLowerCase())) return optionCities
    return [normalizedSelectedCity, ...optionCities]
  }
  const companyCityOptions = useMemo(
    () => getCompanyCityOptionsForState(companyDraft.state, companyDraft.city),
    [companyDraft.city, companyDraft.state, labourLocationOptions, masterOptionsByKey.state]
  )
  const companyStatusOptions = getMasterSelectOptions('company_status', [companyDraft.status], companyStatuses)
  const companyStatusFilterOptions = getMasterSelectOptions('company_status', [companyFilters.status === 'all' ? '' : companyFilters.status], companyStatuses)
  const jobGenderOptions = getMasterSelectOptions('job_gender_preference', [jobPostDraft.genderPreference], JOB_POST_GENDER_OPTIONS)
  const jobExperienceRequiredOptions = getMasterSelectOptions('job_experience_required', [jobPostDraft.experienceRequired], JOB_POST_EXPERIENCE_OPTIONS)
  const jobShiftTypeOptions = getMasterSelectOptions('job_shift_type', [jobPostDraft.shiftType], JOB_POST_SHIFT_TYPES)
  const jobWeeklyOffOptions = getMasterSelectOptions('job_weekly_off', [jobPostDraft.weeklyOff], labourMasterSeedValues.job_weekly_off.map(option => option.value || option.label))
  const jobDurationOptions = getMasterSelectOptions('job_duration', [jobPostDraft.jobDuration], JOB_POST_DURATIONS)
  const jobSalaryTypeOptions = getMasterSelectOptions('job_salary_type', [jobPostDraft.salaryType], JOB_POST_SALARY_TYPES)
  const jobOvertimeOptions = getMasterSelectOptions('job_overtime_available', [jobPostDraft.overtimeAvailable], JOB_POST_YES_NO_OPTIONS)
  const jobFoodFacilityOptions = getMasterSelectOptions('job_food_facility', [jobPostDraft.foodFacility], JOB_POST_FACILITY_OPTIONS)
  const jobAccommodationOptions = getMasterSelectOptions('job_accommodation', [jobPostDraft.accommodation], JOB_POST_FACILITY_OPTIONS)
  const jobTransportFacilityOptions = getMasterSelectOptions('job_transport_facility', [jobPostDraft.transportFacility], JOB_POST_FACILITY_OPTIONS)

  const selectedJobCompanyForDependencies = snapshot?.companies.find(company => company.id === jobPostDraft.companyId) || null
  const filteredJobPostCategories = useMemo(
    () =>
      !snapshot
        ? []
        : filterCategoriesByLabourDependency(
            snapshot.categories,
            mastersSnapshot?.categoryDependencies || [],
            masterOptionsByKey,
            selectedJobCompanyForDependencies?.businessType || '',
            selectedJobCompanyForDependencies?.industryCategory || ''
          ),
    [masterOptionsByKey, mastersSnapshot?.categoryDependencies, selectedJobCompanyForDependencies?.businessType, selectedJobCompanyForDependencies?.industryCategory, snapshot]
  )

  const jobPostCategoryOptions = useMemo(
    () => (!snapshot ? [] : filteredJobPostCategories),
    [filteredJobPostCategories, snapshot]
  )
  const planIndustryCategoryOptions = buildLabourMasterSelectOptions(
    getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || []),
    planDraft.industryCategoryValues
  )
  const filteredPlanBusinessTypeMasterOptions = useMemo(() => {
    const selectedIndustryIds = new Set(
      (masterOptionsByKey.industry_category || [])
        .filter(option => option.isActive && planDraft.industryCategoryValues.includes(option.value))
        .map(option => option.id)
    )

    if (selectedIndustryIds.size === 0) {
      return [] as ReturnType<typeof getVisibleLabourMasterOptions>
    }

    const allowedBusinessTypeIds = new Set(
      (mastersSnapshot?.industryBusinessDependencies || [])
        .filter(dependency => dependency.isActive && selectedIndustryIds.has(dependency.industryCategoryOptionId))
        .map(dependency => dependency.businessTypeOptionId)
    )

    return getVisibleLabourMasterOptions(masterOptionsByKey.business_type || []).filter(option => allowedBusinessTypeIds.has(option.id))
  }, [masterOptionsByKey.business_type, masterOptionsByKey.industry_category, mastersSnapshot?.industryBusinessDependencies, planDraft.industryCategoryValues])
  const planBusinessTypeOptions = buildLabourMasterSelectOptions(
    filteredPlanBusinessTypeMasterOptions,
    planDraft.businessTypeValues
  )
  const filteredPlanLabourCategories = useMemo(() => {
    if (!snapshot) return [] as LabourCategory[]

    const selectedIndustryIds = new Set(
      (masterOptionsByKey.industry_category || [])
        .filter(option => option.isActive && planDraft.industryCategoryValues.includes(option.value))
        .map(option => option.id)
    )
    const selectedBusinessIds = new Set(
      (masterOptionsByKey.business_type || [])
        .filter(option => option.isActive && planDraft.businessTypeValues.includes(option.value))
        .map(option => option.id)
    )

    if (selectedIndustryIds.size === 0 || selectedBusinessIds.size === 0) {
      return []
    }

    const allowedCategoryIds = new Set(
      (mastersSnapshot?.categoryDependencies || [])
        .filter(
          dependency =>
            dependency.isActive &&
            selectedIndustryIds.has(dependency.industryCategoryOptionId) &&
            selectedBusinessIds.has(dependency.businessTypeOptionId)
        )
        .map(dependency => dependency.categoryId)
    )

    return snapshot.categories.filter(category => category.isActive && allowedCategoryIds.has(category.id))
  }, [
    masterOptionsByKey.business_type,
    masterOptionsByKey.industry_category,
    mastersSnapshot?.categoryDependencies,
    planDraft.businessTypeValues,
    planDraft.industryCategoryValues,
    snapshot
  ])
  const planLabourCategoryOptions = useMemo(() => {
    if (!snapshot) return [] as LabourCategory[]

    const optionsById = new Map<string, LabourCategory>()
    filteredPlanLabourCategories.forEach(category => {
      optionsById.set(category.id, category)
    })

    snapshot.categories
      .filter(category => planDraft.labourCategoryIds.includes(category.id))
      .forEach(category => {
        if (!optionsById.has(category.id)) {
          optionsById.set(category.id, category)
        }
      })

    return [...optionsById.values()].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
  }, [filteredPlanLabourCategories, planDraft.labourCategoryIds, snapshot])

  const hasCompanyIndustrySelection = companyDraft.industryCategory.trim().length > 0
  const hasMappedBusinessTypesForCompany = companyBusinessTypeOptions.length > 0
  const hasWorkerIndustrySelection = workerDraft.industryCategory.trim().length > 0
  const hasWorkerBusinessSelection = workerDraft.businessType.trim().length > 0
  const hasMappedBusinessTypesForWorker = workerBusinessTypeOptions.length > 0
  const hasMappedCategoriesForWorker = availableWorkerCategories.length > 0
  const hasPlanIndustrySelection = planDraft.industryCategoryValues.length > 0
  const hasPlanBusinessSelection = planDraft.businessTypeValues.length > 0
  const hasMappedBusinessTypesForPlan = planBusinessTypeOptions.length > 0
  const hasMappedCategoriesForPlan = planLabourCategoryOptions.length > 0
  const hasSelectedJobCompanyIndustry = (selectedJobCompanyForDependencies?.industryCategory || '').trim().length > 0
  const hasSelectedJobCompanyBusiness = (selectedJobCompanyForDependencies?.businessType || '').trim().length > 0

  useEffect(() => {
    const resolvedIndustryCategory = resolveWorkerIndustryCategoryValue(
      workerDraft.industryCategory,
      workerDraft.categoryIds
    )
    if (!workerDraft.industryCategory) {
      if (!resolvedIndustryCategory) return
      setWorkerDraft(current =>
        current.industryCategory || current.categoryIds.join('|') !== workerDraft.categoryIds.join('|')
          ? current
          : { ...current, industryCategory: resolvedIndustryCategory }
      )
      return
    }

    const matchedIndustryCategory = findMatchingMasterOption(
      visibleWorkerIndustryMasterOptions,
      workerDraft.industryCategory
    )
    if (matchedIndustryCategory) {
      if (matchedIndustryCategory.value !== workerDraft.industryCategory) {
        setWorkerDraft(current =>
          current.industryCategory === workerDraft.industryCategory
            ? { ...current, industryCategory: matchedIndustryCategory.value }
            : current
        )
      }
      return
    }

    if (resolvedIndustryCategory) {
      setWorkerDraft(current =>
        current.industryCategory === workerDraft.industryCategory
          ? { ...current, industryCategory: resolvedIndustryCategory }
          : current
      )
      return
    }

    setWorkerDraft(current => ({
      ...current,
      industryCategory: '',
      businessType: ''
    }))
  }, [
    resolveWorkerIndustryCategoryValue,
    visibleWorkerIndustryMasterOptions,
    workerDraft.categoryIds,
    workerDraft.industryCategory
  ])

  useEffect(() => {
    if (!hasWorkerIndustrySelection) {
      return
    }

    const resolvedBusinessType = resolveWorkerBusinessTypeValue(
      workerDraft.businessType,
      workerDraft.industryCategory,
      workerDraft.categoryIds
    )

    if (!workerDraft.businessType) {
      if (!resolvedBusinessType) return
      setWorkerDraft(current =>
        current.businessType || current.industryCategory !== workerDraft.industryCategory
          ? current
          : { ...current, businessType: resolvedBusinessType }
      )
      return
    }

    if (!workerBusinessTypeOptions.some(option => option.value === workerDraft.businessType)) {
      if (resolvedBusinessType) {
        setWorkerDraft(current =>
          current.businessType === workerDraft.businessType
            ? { ...current, businessType: resolvedBusinessType }
            : current
        )
        return
      }

      setWorkerDraft(current => ({ ...current, businessType: '' }))
    }
  }, [
    hasWorkerIndustrySelection,
    resolveWorkerBusinessTypeValue,
    workerBusinessTypeOptions,
    workerDraft.businessType,
    workerDraft.categoryIds,
    workerDraft.industryCategory
  ])

  useEffect(() => {
    if (!workerFilters.industryCategory) {
      if (workerFilters.businessType) {
        setWorkerFilters(current => ({ ...current, businessType: '' }))
      }
      return
    }

    if (workerFilters.businessType && !workerFilterBusinessTypeOptions.some(option => option.value === workerFilters.businessType)) {
      setWorkerFilters(current => ({ ...current, businessType: '' }))
    }
  }, [workerFilterBusinessTypeOptions, workerFilters.businessType, workerFilters.industryCategory])

  useEffect(() => {
    if (!hasWorkerBusinessSelection) return

    const allowedCategoryIds = new Set(workerCategoryOptions.map(category => category.id))
    if (workerDraft.categoryIds.some(categoryId => !allowedCategoryIds.has(categoryId))) {
      setWorkerDraft(current => ({
        ...current,
        categoryIds: current.categoryIds.filter(categoryId => allowedCategoryIds.has(categoryId))
      }))
    }
  }, [hasWorkerBusinessSelection, workerCategoryOptions, workerDraft.categoryIds])

  useEffect(() => {
    if (!isWorkerCategoryMenuOpen) {
      setWorkerCategorySearch('')
    }
  }, [isWorkerCategoryMenuOpen])

  useEffect(() => {
    if (!companyDraft.industryCategory) return
    if (companyIndustryCategoryOptions.some(option => option.value === companyDraft.industryCategory)) return

    setCompanyDraft(current => ({
      ...current,
      industryCategory: '',
      businessType: ''
    }))
  }, [companyDraft.industryCategory, companyIndustryCategoryOptions])

  useEffect(() => {
    if (!hasCompanyIndustrySelection) {
      if (companyDraft.businessType) {
        setCompanyDraft(current => ({ ...current, businessType: '' }))
      }
      return
    }

    if (companyDraft.businessType && !companyBusinessTypeOptions.some(option => option.value === companyDraft.businessType)) {
      setCompanyDraft(current => ({ ...current, businessType: '' }))
    }
  }, [companyBusinessTypeOptions, companyDraft.businessType, hasCompanyIndustrySelection])

  useEffect(() => {
    if (!companyFilters.industryCategory) {
      if (companyFilters.businessType) {
        setCompanyFilters(current => ({ ...current, businessType: '' }))
      }
      return
    }

    if (companyFilters.businessType && !companyFilterBusinessTypeOptions.some(option => option.value === companyFilters.businessType)) {
      setCompanyFilters(current => ({ ...current, businessType: '' }))
    }
  }, [companyFilterBusinessTypeOptions, companyFilters.businessType, companyFilters.industryCategory])

  useEffect(() => {
    const allowedIndustryValues = new Set(planIndustryCategoryOptions.map(option => option.value))
    if (planDraft.industryCategoryValues.every(value => allowedIndustryValues.has(value))) return

    setPlanDraft(current => ({
      ...current,
      industryCategoryValues: current.industryCategoryValues.filter(value => allowedIndustryValues.has(value)),
      businessTypeValues: [],
      labourCategoryIds: []
    }))
  }, [planDraft.industryCategoryValues, planIndustryCategoryOptions])

  useEffect(() => {
    if (!hasPlanIndustrySelection) {
      if (planDraft.businessTypeValues.length === 0 && planDraft.labourCategoryIds.length === 0) return
      setPlanDraft(current => ({
        ...current,
        businessTypeValues: [],
        labourCategoryIds: []
      }))
      return
    }

    const allowedBusinessValues = new Set(planBusinessTypeOptions.map(option => option.value))
    if (planDraft.businessTypeValues.every(value => allowedBusinessValues.has(value))) return

    setPlanDraft(current => ({
      ...current,
      businessTypeValues: current.businessTypeValues.filter(value => allowedBusinessValues.has(value)),
      labourCategoryIds: []
    }))
  }, [hasPlanIndustrySelection, planBusinessTypeOptions, planDraft.businessTypeValues, planDraft.labourCategoryIds.length])

  useEffect(() => {
    if (!hasPlanBusinessSelection) {
      if (planDraft.labourCategoryIds.length === 0) return
      setPlanDraft(current => ({ ...current, labourCategoryIds: [] }))
      return
    }

    const allowedCategoryIds = new Set(planLabourCategoryOptions.map(category => category.id))
    if (planDraft.labourCategoryIds.every(categoryId => allowedCategoryIds.has(categoryId))) return

    setPlanDraft(current => ({
      ...current,
      labourCategoryIds: current.labourCategoryIds.filter(categoryId => allowedCategoryIds.has(categoryId))
    }))
  }, [hasPlanBusinessSelection, planDraft.labourCategoryIds, planLabourCategoryOptions])

  useEffect(() => {
    if (!jobFilters.industryCategory) {
      if (jobFilters.businessType) {
        setJobFilters(current => ({ ...current, businessType: '' }))
      }
      return
    }

    if (jobFilters.businessType && !jobFilterBusinessTypeOptions.some(option => option.value === jobFilters.businessType)) {
      setJobFilters(current => ({ ...current, businessType: '' }))
    }
  }, [jobFilterBusinessTypeOptions, jobFilters.businessType, jobFilters.industryCategory])

  useEffect(() => {
    if (!jobPostDraft.categoryId) return
    if (jobPostCategoryOptions.some(category => category.id === jobPostDraft.categoryId)) return

    setJobPostDraft(current => ({ ...current, categoryId: '' }))
  }, [jobPostCategoryOptions, jobPostDraft.categoryId])

  useEffect(() => {
    if (!snapshot || !jobPostDraft.companyId) return
    const selectedCompany = snapshot.companies.find(company => company.id === jobPostDraft.companyId)
    if (!selectedCompany) return

    const defaultCompanyPlan = selectedCompany.activePlan
      ? snapshot.plans.find(plan => plan.id === selectedCompany.activePlan && plan.audience === 'company')
      : undefined

    setJobPostDraft(current => {
      if (current.companyId !== selectedCompany.id) return current

      const currentConnectedPlan = getCompanyPlanByName(current.connectedPlan)
      const resolvedPlan = currentConnectedPlan || defaultCompanyPlan
      const generatedPublishedAt = current.publishedAt || getTodayDateValue()
      const resolvedPlanLiveDays = resolvedPlan ? getJobPostLiveDays(resolvedPlan) : 0
      const generatedValidityDays = resolvedPlanLiveDays > 0
        ? resolvedPlanLiveDays
        : resolveJobPostValidityDays(current.validityDays, 3)
      const generatedExpiresAt = shouldSyncJobPostExpiry(
        current.expiresAt,
        current.publishedAt,
        current.validityDays
      )
        ? addDays(generatedPublishedAt, generatedValidityDays)
        : current.expiresAt
      const generatedLocationLabel =
        selectedCompany.area.trim() ||
        selectedCompany.pincode.trim() ||
        current.locationLabel.trim() ||
        selectedCompany.companyAddress.trim()

      return {
        ...current,
        city: current.city.trim() || selectedCompany.city.trim() || current.city,
        locationLabel: current.locationLabel.trim() || generatedLocationLabel,
        validityDays: generatedValidityDays,
        status: current.status || 'draft',
        connectedPlan: current.connectedPlan || defaultCompanyPlan?.name || '',
        submissionMode: editingJobPostId ? current.submissionMode : 'Pending review for publish',
        publishedAt: generatedPublishedAt,
        expiresAt: generatedExpiresAt
      }
    })
  }, [editingJobPostId, jobPostDraft.companyId, snapshot])

  useEffect(() => {
    if (!isWorkerKycReviewOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWorkerKycReview()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isWorkerKycReviewOpen])

  const selectedWorkerReview =
    (snapshot?.workers || []).find(worker => worker.id === selectedWorkerReviewId) ||
    null
  const selectedWorkerKycAuditLog = selectedWorkerReview
    ? (Array.isArray(snapshot?.auditLogs)
        ? snapshot.auditLogs.find(log => log.entityType === 'workers' && log.entityId === selectedWorkerReview.id && /kyc/i.test(String(log.summary || '')))
        : null) || null
    : null

  useEffect(() => {
    if (!isWorkerKycReviewOpen || !selectedWorkerReview || !workerKycPanelRef.current) return
    workerKycPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isWorkerKycReviewOpen, selectedWorkerReview])

  const handleJobPostValidityDaysChange = (value: string) => {
    const parsedValidityDays = Number(value)
    setJobPostDraft(current => {
      const nextValidityDays = Number.isFinite(parsedValidityDays) ? parsedValidityDays : 0
      const nextPublishedAt = current.publishedAt || getTodayDateValue()
      const nextExpiresAt = shouldSyncJobPostExpiry(
        current.expiresAt,
        current.publishedAt,
        current.validityDays
      )
        ? addDays(nextPublishedAt, resolveJobPostValidityDays(nextValidityDays))
        : current.expiresAt

      return {
        ...current,
        validityDays: nextValidityDays,
        publishedAt: nextPublishedAt,
        expiresAt: nextExpiresAt
      }
    })
  }

  const handleJobPostPublishedAtChange = (value: string) => {
    setJobPostDraft(current => {
      const nextPublishedAt = value
      const nextExpiresAt = shouldSyncJobPostExpiry(
        current.expiresAt,
        current.publishedAt,
        current.validityDays
      )
        ? addDays(nextPublishedAt || getTodayDateValue(), resolveJobPostValidityDays(current.validityDays))
        : current.expiresAt

      return {
        ...current,
        publishedAt: nextPublishedAt,
        expiresAt: nextExpiresAt
      }
    })
  }

  const handleJobPostExpiresAtChange = (value: string) => {
    setJobPostDraft(current => ({
      ...current,
      expiresAt: value
    }))
  }

  const handleJobPostConnectedPlanChange = (value: string) => {
    const selectedPlan = getCompanyPlanByName(value)
    setJobPostDraft(current => {
      const nextPublishedAt = current.publishedAt || getTodayDateValue()
      const nextValidityDays = selectedPlan
        ? getJobPostLiveDays(selectedPlan)
        : resolveJobPostValidityDays(current.validityDays, 3)
      const normalizedValidityDays = resolveJobPostValidityDays(nextValidityDays, 3)

      return {
        ...current,
        connectedPlan: value,
        validityDays: normalizedValidityDays,
        publishedAt: nextPublishedAt,
        expiresAt: selectedPlan ? addDays(nextPublishedAt, normalizedValidityDays) : current.expiresAt
      }
    })
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

    if (entityType === 'categories') {
      await fetchSnapshot()
      await fetchMasters()
    } else {
      replaceSnapshot(data.snapshot)
    }
    showSaved(`${label} deleted`)
  }

  const removeCategoryBlockerMapping = async (row: CategoryDependencyRow) => {
    setError('')
    const confirmed = window.confirm(
      `Remove ${row.industryCategoryLabel} -> ${row.businessTypeLabel} -> ${row.categoryLabel}? This only removes the category mapping blocker and does not delete any workers, companies, jobs, plans, or history.`
    )
    if (!confirmed) return

    const response = await fetch('/api/admin/labour/masters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'dependency',
        payload: {
          industryCategoryOptionId: row.industryCategoryOptionId,
          businessTypeOptionId: row.businessTypeOptionId,
          categoryId: row.categoryId
        }
      })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to remove category mapping blocker.')
      return
    }

    setMastersSnapshot(data.snapshot || null)
    showSaved(`Removed mapping blocker for ${row.categoryLabel}`)
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
    setWorkerDraft(buildWorkerEditorDraft())
    setEditingWorkerId(null)
    setIsWorkerCategoryMenuOpen(false)
    setWorkerCategorySearch('')
    setWorkerHomeStateId('')
    setShowAllWorkerPreferredStates(false)
    setExpandedWorkerPreferredCityStates([])
  }

  const resetCompanyDraft = () => {
    setCompanyDraft(blankCompany)
    setEditingCompanyId(null)
  }

  const resetJobPostDraft = () => {
    setJobPostDraft({ ...blankJobPost, city: defaultAdminCity })
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

  const getPlanIndustryLabels = (plan: LabourPlan) =>
    (plan.industryCategoryValues || []).map(getIndustryCategoryLabel).filter(Boolean)
  const getPlanBusinessTypeLabels = (plan: LabourPlan) =>
    (plan.businessTypeValues || []).map(getBusinessTypeLabel).filter(Boolean)
  const getPlanLabourCategoryLabels = (plan: LabourPlan) => {
    const selectedCategoryIds = plan.labourCategoryIds?.length ? plan.labourCategoryIds : plan.categoryId ? [plan.categoryId] : []
    return selectedCategoryIds.map(getCategoryName).filter(Boolean)
  }
  const summarizeSelection = (labels: string[], noun: string) => {
    if (labels.length === 0) return `All ${noun}`
    if (labels.length <= 2) return labels.join(', ')
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`
  }

  const getPlanById = (planId: string) => snapshot.plans.find(plan => plan.id === planId)
  const getPlanName = (planId: string) => getPlanById(planId)?.name || planId || 'No plan'
  const activeCompanyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const getWorkerById = (workerId: string) => snapshot.workers.find(worker => worker.id === workerId)
  const getReferralProfileByWorkerId = (workerId: string) =>
    referralSnapshot.profiles.find(profile => profile.workerId === workerId) || null
  const getReferralEligibilityByProfileId = (referralProfileId: string) =>
    referralSnapshot.eligibility.filter(eligibility => eligibility.referralProfileId === referralProfileId)
  const openReferralWorker = (workerId: string, nextReferralSnapshot = referralSnapshot) => {
    setSelectedReferralWorkerId(workerId)
    const profile = nextReferralSnapshot.profiles.find(item => item.workerId === workerId)
    const eligibility = profile
      ? nextReferralSnapshot.eligibility.filter(item => item.referralProfileId === profile.id)
      : []
    setSelectedReferralCategoryIds(eligibility.filter(item => item.isActive).map(item => item.categoryId))
    setReferralRewardDraft(Object.fromEntries(eligibility.map(item => [item.categoryId, String(item.rewardAmount || 0)])))
    setReferralAdminTab('referrers')
  }
  const saveReferralProfileActive = async (workerId: string, isActive: boolean) => {
    setError('')
    setReferralSaving(true)

    try {
      const response = await fetch('/api/admin/labour/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-profile-active', workerId, isActive })
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save referral profile.')
      }

      setReferralSnapshot(data.snapshot || blankReferralAdminSnapshot)
      openReferralWorker(workerId, data.snapshot || blankReferralAdminSnapshot)
      showSaved(isActive ? 'Refer & Earn enabled for worker' : 'Refer & Earn disabled for worker')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save referral profile.')
    } finally {
      setReferralSaving(false)
    }
  }

  const saveReferralSettings = async () => {
    setError('')
    setReferralSettingsSaving(true)

    const amount = Number(referralSettingsDraft.minimumWithdrawalAmount || 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Minimum withdrawal amount must be greater than zero.')
      setReferralSettingsSaving(false)
      return
    }

    try {
      const response = await fetch('/api/admin/labour/referral-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            minimumWithdrawalAmount: amount
          }
        })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        setError(data.error || 'Failed to save referral settings.')
        return
      }

      setReferralSettingsDraft(data.settings || blankReferralAdminSettings)
      showSaved('Settings saved successfully.')
    } catch {
      setError('Failed to save referral settings.')
    } finally {
      setReferralSettingsSaving(false)
    }
  }
  const saveReferralEligibility = async () => {
    const profile = getReferralProfileByWorkerId(selectedReferralWorkerId)
    if (!profile) {
      setError('Enable Refer & Earn for this worker before assigning categories.')
      return
    }

    setError('')
    setReferralSaving(true)

    const activeCategoryIds = new Set(selectedReferralCategoryIds)
    const existingCategoryIds = new Set(getReferralEligibilityByProfileId(profile.id).map(item => item.categoryId))
    const categoryIds = Array.from(new Set([
      ...Array.from(activeCategoryIds),
      ...Array.from(existingCategoryIds)
    ]))

    try {
      const response = await fetch('/api/admin/labour/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-eligibility',
          referralProfileId: profile.id,
          entries: categoryIds.map(categoryId => ({
            categoryId,
            rewardAmount: Number(referralRewardDraft[categoryId] || 0),
            isActive: activeCategoryIds.has(categoryId)
          }))
        })
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save referral categories.')
      }

      setReferralSnapshot(data.snapshot || blankReferralAdminSnapshot)
      openReferralWorker(selectedReferralWorkerId, data.snapshot || blankReferralAdminSnapshot)
      showSaved('Referral category eligibility saved')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save referral categories.')
    } finally {
      setReferralSaving(false)
    }
  }

  const submitReferralWithdrawalReview = async () => {
    if (!withdrawalReviewDraft) return
    const trimmedReason = withdrawalReviewDraft.rejectionReason.trim()
    const trimmedPaymentReference = withdrawalReviewDraft.paymentReference.trim().replace(/\s+/g, ' ')

    if (withdrawalReviewDraft.action === 'reject' && !trimmedReason) {
      setError('Rejection reason is required.')
      return
    }

    if (trimmedReason.length > 500) {
      setError('Rejection reason must be 500 characters or less.')
      return
    }

    if (withdrawalReviewDraft.action === 'mark-paid' && !trimmedPaymentReference) {
      setError('Payment reference / UTR is required.')
      return
    }

    if (trimmedPaymentReference.length > 120) {
      setError('Payment reference must be 120 characters or less.')
      return
    }

    if (withdrawalReviewDraft.action === 'mark-paid' && !withdrawalReviewDraft.paymentConfirmed) {
      setError('Confirm the manual payment before marking this withdrawal as paid.')
      return
    }

    setError('')
    setReferralWithdrawalSaving(true)

    try {
      const response = await fetch('/api/admin/labour/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: withdrawalReviewDraft.requestId,
          action: withdrawalReviewDraft.action,
          rejectionReason: trimmedReason,
          paymentReference: trimmedPaymentReference,
        })
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to review withdrawal request.')
      }

      setReferralWithdrawalSnapshot(data.snapshot || blankReferralAdminWithdrawalSnapshot)
      setWithdrawalReviewDraft(null)
      setWithdrawalPaymentDetails(null)
      setWithdrawalPaymentDetailsRequestId('')
      setWithdrawalPaymentDetailsError('')
      showSaved(
        withdrawalReviewDraft.action === 'approve'
          ? 'Withdrawal request approved.'
          : withdrawalReviewDraft.action === 'reject'
            ? 'Withdrawal request rejected.'
            : 'Withdrawal marked paid successfully.'
      )
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review withdrawal request.')
    } finally {
      setReferralWithdrawalSaving(false)
    }
  }

  const openWithdrawalReview = (requestId: string, action: ReferralWithdrawalReviewAction) => {
    setWithdrawalReviewDraft({
      requestId,
      action,
      rejectionReason: '',
      paymentReference: '',
      paymentConfirmed: false,
    })
    setWithdrawalPaymentDetails(null)
    setWithdrawalPaymentDetailsRequestId('')
    setWithdrawalPaymentDetailsError('')
    setError('')
  }

  const closeWithdrawalPaymentDetails = () => {
    setWithdrawalPaymentDetails(null)
    setWithdrawalPaymentDetailsRequestId('')
    setWithdrawalPaymentDetailsError('')
    setWithdrawalPaymentDetailsLoading(false)
  }

  const loadWithdrawalPaymentDetails = async (requestId: string) => {
    setWithdrawalPaymentDetailsRequestId(requestId)
    setWithdrawalPaymentDetailsLoading(true)
    setWithdrawalPaymentDetails(null)
    setWithdrawalPaymentDetailsError('')
    setError('')

    try {
      const response = await fetch('/api/admin/labour/withdrawals/payment-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ requestId }),
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment details.')
      }

      setWithdrawalPaymentDetails(
        (data.paymentDetails as ReferralAdminWithdrawalPaymentDetails | undefined) || null,
      )
    } catch (detailsError) {
      const message =
        detailsError instanceof Error ? detailsError.message : 'Failed to load payment details.'
      setWithdrawalPaymentDetailsError(message)
      setError(message)
    } finally {
      setWithdrawalPaymentDetailsLoading(false)
    }
  }

  const copyTextToClipboard = async (label: string, value: string) => {
    if (!value.trim()) {
      setError(`No ${label.toLowerCase()} available to copy.`)
      return
    }

    if (!navigator?.clipboard?.writeText) {
      setError('Clipboard access is not available in this browser.')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      showSaved(`${label} copied.`)
    } catch {
      setError(`Failed to copy ${label.toLowerCase()}.`)
    }
  }

  const creditReferralReward = async (referral: ReferralAdminReferral) => {
    const referrer = getWorkerById(referral.referrerWorkerId)
    const referred = getWorkerById(referral.referredWorkerId)
    const confirmed = window.confirm([
      'Credit referral reward?',
      '',
      `Agent: ${referrer?.fullName || referral.referrerWorkerId}`,
      `Worker: ${referred?.mobile || referral.referredWorkerId}`,
      `Category: ${getCategoryName(referral.categoryId)}`,
      `Reward: ${formatCurrency(referral.rewardAmountSnapshot)}`,
      '',
      "This will credit the Agent's separate referral earnings ledger."
    ].join('\n'))

    if (!confirmed) return

    setError('')
    setCreditingReferralId(referral.id)

    try {
      const response = await fetch('/api/admin/labour/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'credit-qualified-reward',
          referralId: referral.id
        })
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to credit referral reward.')
      }

      setReferralSnapshot(data.snapshot || blankReferralAdminSnapshot)
      showSaved('Referral reward credited successfully.')
    } catch (creditError) {
      setError(creditError instanceof Error ? creditError.message : 'Failed to credit referral reward.')
    } finally {
      setCreditingReferralId('')
    }
  }
  const getCompanyName = (companyId: string) =>
    snapshot.companies.find(company => company.id === companyId)?.companyName || companyId
  const getCompanyById = (companyId: string) => snapshot.companies.find(company => company.id === companyId)
  const getCompanyPlanByName = (planName: string) =>
    activeCompanyPlans.find(plan => plan.name.trim().toLowerCase() === planName.trim().toLowerCase()) || null
  const getCompanyActivePlan = (companyId: string) => {
    const company = getCompanyById(companyId)
    if (!company?.activePlan) return null
    return snapshot.plans.find(plan => plan.id === company.activePlan && plan.audience === 'company') || null
  }
  const getEntityName = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.fullName || '' : getCompanyById(entityId)?.companyName || ''
  const formatIdentityProofType = (value: WorkerIdentityProofType) => {
    if (!value) return 'Not provided'
    return value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
  }
  const isImageDocumentPath = (value: unknown) => {
    const normalizedValue = String(value || '').trim()
    return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(normalizedValue.split('?')[0] || '')
  }
  const isWorkerKycSubmitted = (worker: LabourWorker) =>
    Boolean(String(worker.profilePhotoPath || '').trim()) &&
    Boolean(worker.identityProofType) &&
    Boolean(String(worker.identityProofNumber || '').trim()) &&
    Boolean(String(worker.identityProofPath || '').trim()) &&
    Boolean(String(worker.registrationCompletedAt || '').trim())
  const getWorkerKycState = (worker: LabourWorker): Exclude<WorkerKycFilter, 'all'> => {
    if (worker.status === 'rejected') return 'rejected'
    if (worker.status === 'blocked') return 'needs_correction'
    if (!isWorkerKycSubmitted(worker)) return 'not_submitted'
    if (worker.status === 'pending') return 'ready_for_review'
    return 'approved'
  }
  const getWorkerKycLabel = (worker: LabourWorker) => {
    const state = getWorkerKycState(worker)
    if (state === 'not_submitted') return 'KYC not submitted'
    if (state === 'ready_for_review') return 'Ready for review'
    if (state === 'needs_correction') return 'Needs correction'
    if (state === 'rejected') return 'KYC rejected'
    return 'KYC approved'
  }
  const getWorkerKycTone = (worker: LabourWorker) => {
    const state = getWorkerKycState(worker)
    if (state === 'ready_for_review') return { background: '#fff7ed', color: '#c2410c', border: '#fdba74' }
    if (state === 'needs_correction') return { background: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' }
    if (state === 'approved') return { background: '#ecfdf5', color: '#047857', border: '#86efac' }
    if (state === 'rejected') return { background: '#fff1f2', color: '#be123c', border: '#fda4af' }
    return { background: '#f8fafc', color: '#475569', border: '#cbd5e1' }
  }
  const buildWorkerKycReviewDraft = (worker: LabourWorker): WorkerKycReviewDraft => ({
    decision:
      worker.status === 'rejected'
        ? 'rejected'
        : worker.status === 'blocked'
          ? 'needs_correction'
          : getWorkerKycState(worker) === 'approved'
            ? 'verified'
            : 'pending',
    remarks: String(worker.kycRemarks || '').trim()
  })
  const getWorkerDocumentHref = (storagePath: unknown) => {
    const normalizedPath = String(storagePath || '').trim()
    return normalizedPath ? `/api/admin/labour/worker-file?path=${encodeURIComponent(normalizedPath)}` : ''
  }
  const getWorkerCategoryIds = (worker: LabourWorker) =>
    Array.isArray(worker.categoryIds) ? worker.categoryIds.map(categoryId => String(categoryId || '').trim()).filter(Boolean) : []
  const getWorkerCategoryLabel = (worker: LabourWorker) =>
    getWorkerCategoryIds(worker).map(getCategoryName).join(', ') || 'No categories'
  const getCompanyCategoryIds = (company: LabourCompany) =>
    Array.isArray(company.categoryIds) ? company.categoryIds.map(categoryId => String(categoryId || '').trim()).filter(Boolean) : []
  const getCompanyCategoryLabel = (company: LabourCompany) =>
    getCompanyCategoryIds(company).map(getCategoryName).join(', ') || 'No categories'
  const getJobPostById = (jobPostId: string) => snapshot.jobPosts.find(jobPost => jobPost.id === jobPostId)
  const getEntityCity = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.city || '' : getCompanyById(entityId)?.city || ''
  const getEntityCategoryLabel = (entityType: WalletEntityType, entityId: string) => {
    if (entityType === 'worker') {
      const worker = getWorkerById(entityId)
      return worker ? getWorkerCategoryLabel(worker) : ''
    }

    const company = getCompanyById(entityId)
    return company ? getCompanyCategoryLabel(company) : ''
  }
  const getEntityStatusLabel = (entityType: WalletEntityType, entityId: string) =>
    entityType === 'worker' ? getWorkerById(entityId)?.status || '' : getCompanyById(entityId)?.status || ''
  const getWorkerCompany = (worker: LabourWorker) =>
    worker.companyId ? snapshot.companies.find(company => company.id === worker.companyId) || null : null
  const getWorkerCompanyName = (worker: LabourWorker) => getWorkerCompany(worker)?.companyName || 'No company'
  const getWorkerIndustryCategoryValue = (worker: LabourWorker) => {
    const linkedCompanyIndustry = getWorkerCompany(worker)?.industryCategory || ''
    const value = worker.industryCategory || linkedCompanyIndustry
    return findMatchingMasterOption(masterOptionsByKey.industry_category || [], value)?.value || value
  }
  const getWorkerBusinessTypeValue = (worker: LabourWorker) => {
    const linkedCompanyBusinessType = getWorkerCompany(worker)?.businessType || ''
    const value = worker.businessType || linkedCompanyBusinessType
    return findMatchingMasterOption(masterOptionsByKey.business_type || [], value)?.value || value
  }
  const getWorkerIndustryCategoryLabel = (worker: LabourWorker) => {
    const linkedCompanyIndustry = getWorkerCompany(worker)?.industryCategory || ''
    const value = worker.industryCategory || linkedCompanyIndustry
    return value
      ? resolveLabourMasterLabel(masterOptionsByKey.industry_category || [], value, value)
      : 'No industry category'
  }
  const getWorkerBusinessTypeLabel = (worker: LabourWorker) => {
    const linkedCompanyBusinessType = getWorkerCompany(worker)?.businessType || ''
    const value = worker.businessType || linkedCompanyBusinessType
    return value
      ? resolveLabourMasterLabel(masterOptionsByKey.business_type || [], value, value)
      : 'No business type'
  }
  const getWorkerCreatedAtTimestamp = (worker: LabourWorker) => {
    if (!worker.createdAt) return Number.NaN
    const timestamp = new Date(worker.createdAt).getTime()
    return Number.isNaN(timestamp) ? Number.NaN : timestamp
  }
  const getCompanyIndustryCategoryValue = (company: LabourCompany) =>
    findMatchingMasterOption(masterOptionsByKey.industry_category || [], company.industryCategory)?.value || company.industryCategory
  const getCompanyBusinessTypeValue = (company: LabourCompany) =>
    findMatchingMasterOption(masterOptionsByKey.business_type || [], company.businessType)?.value || company.businessType
  const getCompanyIndustryCategoryLabel = (company: LabourCompany) =>
    company.industryCategory
      ? resolveLabourMasterLabel(masterOptionsByKey.industry_category || [], company.industryCategory, company.industryCategory)
      : 'No industry category'
  const getCompanyBusinessTypeLabel = (company: LabourCompany) =>
    company.businessType
      ? resolveLabourMasterLabel(masterOptionsByKey.business_type || [], company.businessType, company.businessType)
      : 'No business type'
  const getCompanyCreatedAtTimestamp = (company: LabourCompany) => {
    if (!company.createdAt) return Number.NaN
    const timestamp = new Date(company.createdAt).getTime()
    return Number.isNaN(timestamp) ? Number.NaN : timestamp
  }
  const getJobPostCompany = (jobPost: LabourJobPost) => getCompanyById(jobPost.companyId) || null
  const getJobPostCompanyName = (jobPost: LabourJobPost) => getJobPostCompany(jobPost)?.companyName || 'No company'
  const getJobPostIndustryCategoryValue = (jobPost: LabourJobPost) => {
    const linkedCompany = getJobPostCompany(jobPost)
    return linkedCompany ? getCompanyIndustryCategoryValue(linkedCompany) : ''
  }
  const getJobPostBusinessTypeValue = (jobPost: LabourJobPost) => {
    const linkedCompany = getJobPostCompany(jobPost)
    return linkedCompany ? getCompanyBusinessTypeValue(linkedCompany) : ''
  }
  const getJobPostIndustryCategoryLabel = (jobPost: LabourJobPost) => {
    const linkedCompany = getJobPostCompany(jobPost)
    return linkedCompany ? getCompanyIndustryCategoryLabel(linkedCompany) : 'No industry category'
  }
  const getJobPostBusinessTypeLabel = (jobPost: LabourJobPost) => {
    const linkedCompany = getJobPostCompany(jobPost)
    return linkedCompany ? getCompanyBusinessTypeLabel(linkedCompany) : 'No business type'
  }
  const getJobPostPublishedAtTimestamp = (jobPost: LabourJobPost) => {
    if (!jobPost.publishedAt) return Number.NaN
    const timestamp = new Date(jobPost.publishedAt).getTime()
    return Number.isNaN(timestamp) ? Number.NaN : timestamp
  }

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
      const workersCount = snapshot.workers.filter(worker => getWorkerCategoryIds(worker).includes(category.id)).length
      const activeWorkersCount = snapshot.workers.filter(
        worker => getWorkerCategoryIds(worker).includes(category.id) && getEffectiveWorkerStatus(worker) === 'active'
      ).length
      const companiesCount = snapshot.companies.filter(company => getCompanyCategoryIds(company).includes(category.id)).length
      const liveJobsCount = snapshot.jobPosts.filter(
        jobPost => jobPost.categoryId === category.id && isLiveJobPost(jobPost)
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
    count: snapshot.workers.filter(worker => getEffectiveWorkerStatus(worker) === status).length
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

  const filteredCategories = adminVisibleCategories.filter(category => {
    if (categoryFilters.demand !== 'all' && category.demandLevel !== categoryFilters.demand) return false
    if (categoryFilters.activity === 'active' && !category.isActive) return false
    if (categoryFilters.activity === 'inactive' && category.isActive) return false

    return matchesSearch(categoryFilters.search, [category.name, category.slug, category.description, category.demandLevel])
  })

  const filteredPlans = snapshot.plans.filter(plan => {
    if (planFilters.audience !== 'all' && plan.audience !== planFilters.audience) return false
    if (planFilters.categoryId) {
      const matchedCategoryIds = plan.labourCategoryIds?.length
        ? plan.labourCategoryIds
        : plan.categoryId
          ? [plan.categoryId]
          : []
      if (!matchedCategoryIds.includes(planFilters.categoryId)) return false
    }
    if (planFilters.activity === 'active' && !plan.isActive) return false
    if (planFilters.activity === 'inactive' && plan.isActive) return false

    return matchesSearch(planFilters.search, [
      plan.name,
      plan.description,
      plan.audience,
      getCategoryName(plan.categoryId || ''),
      ...getPlanIndustryLabels(plan),
      ...getPlanBusinessTypeLabels(plan),
      ...getPlanLabourCategoryLabels(plan)
    ])
  })

  const filteredWorkers = [...snapshot.workers]
    .filter(worker => {
      if (workerFilters.companyId && worker.companyId !== workerFilters.companyId) return false
      if (workerFilters.status !== 'all' && getEffectiveWorkerStatus(worker) !== workerFilters.status) return false
      if (workerFilters.availability !== 'all' && getEffectiveWorkerAvailability(worker) !== workerFilters.availability) return false
      if (workerFilters.categoryId && !getWorkerCategoryIds(worker).includes(workerFilters.categoryId)) return false
      if (workerFilters.visibility === 'visible' && !worker.isVisible) return false
      if (workerFilters.visibility === 'hidden' && worker.isVisible) return false
      if (workerFilters.kyc !== 'all' && getWorkerKycState(worker) !== workerFilters.kyc) return false
      if (workerFilters.industryCategory && getWorkerIndustryCategoryValue(worker) !== workerFilters.industryCategory) return false
      if (workerFilters.businessType && getWorkerBusinessTypeValue(worker) !== workerFilters.businessType) return false

      const createdAtTimestamp = getWorkerCreatedAtTimestamp(worker)
      if (workerFilters.dateFrom) {
        const fromTimestamp = new Date(`${workerFilters.dateFrom}T00:00:00`).getTime()
        if (Number.isNaN(createdAtTimestamp) || createdAtTimestamp < fromTimestamp) return false
      }
      if (workerFilters.dateTo) {
        const toTimestamp = new Date(`${workerFilters.dateTo}T23:59:59.999`).getTime()
        if (Number.isNaN(createdAtTimestamp) || createdAtTimestamp > toTimestamp) return false
      }

      return matchesSearch(workerFilters.search, [
        worker.fullName,
        worker.mobile,
        worker.city,
        worker.homeCity,
        worker.status,
        getWorkerKycLabel(worker),
        formatIdentityProofType(worker.identityProofType),
        getWorkerCompanyName(worker),
        getWorkerIndustryCategoryLabel(worker),
        getWorkerBusinessTypeLabel(worker),
        getWorkerCategoryLabel(worker)
      ])
    })
    .sort((left, right) => {
      switch (workerFilters.sort) {
        case 'name_desc':
          return String(right.fullName || '').localeCompare(String(left.fullName || ''), undefined, { sensitivity: 'base' })
        case 'created_desc': {
          const leftTimestamp = getWorkerCreatedAtTimestamp(left)
          const rightTimestamp = getWorkerCreatedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return String(left.fullName || '').localeCompare(String(right.fullName || ''), undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return rightTimestamp - leftTimestamp || String(left.fullName || '').localeCompare(String(right.fullName || ''), undefined, { sensitivity: 'base' })
        }
        case 'created_asc': {
          const leftTimestamp = getWorkerCreatedAtTimestamp(left)
          const rightTimestamp = getWorkerCreatedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return String(left.fullName || '').localeCompare(String(right.fullName || ''), undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return leftTimestamp - rightTimestamp || String(left.fullName || '').localeCompare(String(right.fullName || ''), undefined, { sensitivity: 'base' })
        }
        case 'name_asc':
        default:
          return String(left.fullName || '').localeCompare(String(right.fullName || ''), undefined, { sensitivity: 'base' })
      }
    })
  const filteredCompanies = [...snapshot.companies]
    .filter(company => {
      if (companyFilters.status !== 'all' && company.status !== companyFilters.status) return false
      if (companyFilters.categoryId && !getCompanyCategoryIds(company).includes(companyFilters.categoryId)) return false
      if (companyFilters.fee === 'paid' && !company.registrationFeePaid) return false
      if (companyFilters.fee === 'pending' && company.registrationFeePaid) return false
      if (companyFilters.industryCategory && getCompanyIndustryCategoryValue(company) !== companyFilters.industryCategory) return false
      if (companyFilters.businessType && getCompanyBusinessTypeValue(company) !== companyFilters.businessType) return false

      const createdAtTimestamp = getCompanyCreatedAtTimestamp(company)
      if (companyFilters.dateFrom) {
        const fromTimestamp = new Date(`${companyFilters.dateFrom}T00:00:00`).getTime()
        if (Number.isNaN(createdAtTimestamp) || createdAtTimestamp < fromTimestamp) return false
      }
      if (companyFilters.dateTo) {
        const toTimestamp = new Date(`${companyFilters.dateTo}T23:59:59.999`).getTime()
        if (Number.isNaN(createdAtTimestamp) || createdAtTimestamp > toTimestamp) return false
      }

      return matchesSearch(companyFilters.search, [
        company.companyName,
        company.contactPerson,
        company.email,
        company.mobile,
        company.city,
        company.status,
        getCompanyIndustryCategoryLabel(company),
        getCompanyBusinessTypeLabel(company),
        getCompanyCategoryLabel(company)
      ])
    })
    .sort((left, right) => {
      switch (companyFilters.sort) {
        case 'name_desc':
          return right.companyName.localeCompare(left.companyName, undefined, { sensitivity: 'base' })
        case 'created_desc': {
          const leftTimestamp = getCompanyCreatedAtTimestamp(left)
          const rightTimestamp = getCompanyCreatedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return rightTimestamp - leftTimestamp || left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' })
        }
        case 'created_asc': {
          const leftTimestamp = getCompanyCreatedAtTimestamp(left)
          const rightTimestamp = getCompanyCreatedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return leftTimestamp - rightTimestamp || left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' })
        }
        case 'name_asc':
        default:
          return left.companyName.localeCompare(right.companyName, undefined, { sensitivity: 'base' })
      }
    })

  const filteredJobPosts = [...snapshot.jobPosts]
    .filter(jobPost => {
      const effectiveStatus = isExpiredJobPost(jobPost) ? 'expired' : jobPost.status

      if (jobFilters.status !== 'all' && effectiveStatus !== jobFilters.status) return false
      if (jobFilters.categoryId && jobPost.categoryId !== jobFilters.categoryId) return false
      if (jobFilters.companyId && jobPost.companyId !== jobFilters.companyId) return false
      if (jobFilters.industryCategory && getJobPostIndustryCategoryValue(jobPost) !== jobFilters.industryCategory) return false
      if (jobFilters.businessType && getJobPostBusinessTypeValue(jobPost) !== jobFilters.businessType) return false

      const publishedAtTimestamp = getJobPostPublishedAtTimestamp(jobPost)
      if (jobFilters.dateFrom) {
        const fromTimestamp = new Date(`${jobFilters.dateFrom}T00:00:00`).getTime()
        if (Number.isNaN(publishedAtTimestamp) || publishedAtTimestamp < fromTimestamp) return false
      }
      if (jobFilters.dateTo) {
        const toTimestamp = new Date(`${jobFilters.dateTo}T23:59:59.999`).getTime()
        if (Number.isNaN(publishedAtTimestamp) || publishedAtTimestamp > toTimestamp) return false
      }

      return matchesSearch(jobFilters.search, [
        jobPost.title,
        jobPost.description,
        jobPost.city,
        jobPost.locationLabel,
        getCategoryName(jobPost.categoryId),
        getJobPostCompanyName(jobPost),
        getJobPostIndustryCategoryLabel(jobPost),
        getJobPostBusinessTypeLabel(jobPost),
        effectiveStatus
      ])
    })
    .sort((left, right) => {
      switch (jobFilters.sort) {
        case 'title_desc':
          return right.title.localeCompare(left.title, undefined, { sensitivity: 'base' })
        case 'created_desc': {
          const leftTimestamp = getJobPostPublishedAtTimestamp(left)
          const rightTimestamp = getJobPostPublishedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return rightTimestamp - leftTimestamp || left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
        }
        case 'created_asc': {
          const leftTimestamp = getJobPostPublishedAtTimestamp(left)
          const rightTimestamp = getJobPostPublishedAtTimestamp(right)
          if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
            return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
          }
          if (Number.isNaN(leftTimestamp)) return 1
          if (Number.isNaN(rightTimestamp)) return -1
          return leftTimestamp - rightTimestamp || left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
        }
        case 'company_asc':
          return getJobPostCompanyName(left).localeCompare(getJobPostCompanyName(right), undefined, { sensitivity: 'base' }) ||
            left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
        case 'company_desc':
          return getJobPostCompanyName(right).localeCompare(getJobPostCompanyName(left), undefined, { sensitivity: 'base' }) ||
            left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
        case 'title_asc':
        default:
          return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
      }
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
        liveJobsCount: companyJobPosts.filter(jobPost => isLiveJobPost(jobPost)).length,
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
    if (request.requestType === 'worker_support') return false
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

  const filteredSupportRequests = rechargeRequests.filter(request => {
    if (request.requestType !== 'worker_support') return false
    if (rechargeFilters.priority !== 'all' && request.priority !== rechargeFilters.priority) return false
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

  const workerRechargeHistoryRows = walletTransactions.filter(
    transaction =>
      transaction.entityType === 'worker' &&
      ['wallet_recharge', 'wallet_deduction', 'manual_adjustment'].includes(transaction.transactionType)
  )

  const filteredWorkerRechargeHistoryRows = workerRechargeHistoryRows.filter(transaction => {
    const worker = getWorkerById(transaction.entityId)
    const workerHistoryType = getWorkerRechargeHistoryType(transaction)

    if (workerRechargeHistoryFilters.type !== 'all' && workerHistoryType !== workerRechargeHistoryFilters.type) return false
    if (!matchesDateRange(transaction.createdAt, workerRechargeHistoryFilters.dateFrom, workerRechargeHistoryFilters.dateTo)) return false

    return matchesSearch(workerRechargeHistoryFilters.search, [
      transaction.entityName,
      worker?.fullName,
      worker?.mobile,
      transaction.reference,
      transaction.note,
      transaction.city,
      transaction.transactionType,
      workerHistoryType
    ])
  })

  const companyBillingHistoryRows = walletTransactions.filter(transaction => transaction.entityType === 'company')

  const filteredCompanyBillingHistoryRows = companyBillingHistoryRows.filter(transaction => {
    const company = getCompanyById(transaction.entityId)
    const billingType = getCompanyBillingHistoryType(transaction)
    const billingStatus = normalizeLedgerStatus(transaction.status)

    if (companyBillingHistoryFilters.billingType !== 'all' && billingType !== companyBillingHistoryFilters.billingType) return false
    if (companyBillingHistoryFilters.status !== 'all' && billingStatus !== companyBillingHistoryFilters.status) return false
    if (!matchesDateRange(transaction.createdAt, companyBillingHistoryFilters.dateFrom, companyBillingHistoryFilters.dateTo)) return false
    if (!matchesAmountRange(transaction.amount, companyBillingHistoryFilters.amountMin, companyBillingHistoryFilters.amountMax)) return false

    return matchesSearch(companyBillingHistoryFilters.search, [
      transaction.entityName,
      company?.companyName,
      company?.mobile,
      company?.contactMobile,
      transaction.reference,
      transaction.note,
      transaction.city,
      transaction.transactionType,
      billingType,
      billingStatus,
      company?.activePlan ? getPlanName(company.activePlan) : ''
    ])
  })

  const jobPostPaymentHistoryRows = [...snapshot.jobPosts]
    .map(jobPost => {
      const companyBillingRows = companyBillingHistoryRows.filter(transaction => transaction.entityId === jobPost.companyId)
      const companyFollowUps = rechargeRequests.filter(
        request => request.requestType === 'company_follow_up' && request.relatedEntityId === jobPost.companyId
      )
      const latestBillingRow = companyBillingRows[0] || null
      const latestFollowUp = companyFollowUps[0] || null
      const activityTimestamp =
        latestBillingRow?.createdAt ||
        latestFollowUp?.createdAt ||
        jobPost.publishedAt ||
        jobPost.expiresAt ||
        ''

      const latestActivityIsBilling =
        Boolean(latestBillingRow) &&
        (
          !latestFollowUp ||
          latestBillingRow!.createdAt.localeCompare(latestFollowUp.createdAt) >= 0
        )

      const trackingAmount = latestActivityIsBilling ? latestBillingRow?.amount || 0 : latestFollowUp?.suggestedAmount || 0
      const trackingStatus = latestActivityIsBilling
        ? normalizeLedgerStatus(latestBillingRow?.status || 'attention')
        : normalizeRechargeRequestStatus(latestFollowUp?.requestStatus || 'closed')
      const trackingType = latestActivityIsBilling
        ? getJobPostPaymentTypeFromTransaction(latestBillingRow as WalletTransaction)
        : latestFollowUp
          ? 'recharge'
          : 'other'
      const trackingReferenceId = latestActivityIsBilling
        ? latestBillingRow?.reference || latestBillingRow?.id || ''
        : latestFollowUp?.id || ''
      const trackingNote = latestActivityIsBilling
        ? latestBillingRow?.note || ''
        : latestFollowUp?.note || ''
      const trackingSource = latestActivityIsBilling
        ? formatWalletLedgerSource(getWalletLedgerSource(latestBillingRow as WalletTransaction))
        : 'Recharge Request'

      return {
        jobPost,
        company: getCompanyById(jobPost.companyId),
        companyBillingRows,
        paymentTypes: getJobPostPaymentTypes(companyBillingRows, companyFollowUps),
        latestBillingRow,
        latestFollowUp,
        activityTimestamp,
        trackingAmount,
        trackingStatus,
        trackingType,
        trackingReferenceId,
        trackingNote,
        trackingSource
      }
    })
    .filter(row => row.latestBillingRow || row.latestFollowUp)
    .sort((left, right) => right.activityTimestamp.localeCompare(left.activityTimestamp))

  const filteredJobPostPaymentHistoryRows = jobPostPaymentHistoryRows.filter(row => {
    if (
      jobPostPaymentHistoryFilters.paymentType !== 'all' &&
      row.trackingType !== jobPostPaymentHistoryFilters.paymentType &&
      !row.paymentTypes.includes(jobPostPaymentHistoryFilters.paymentType)
    ) {
      return false
    }

    if (jobPostPaymentHistoryFilters.status !== 'all' && row.trackingStatus !== jobPostPaymentHistoryFilters.status) return false
    if (!matchesDateRange(row.activityTimestamp, jobPostPaymentHistoryFilters.dateFrom, jobPostPaymentHistoryFilters.dateTo)) return false
    if (!matchesAmountRange(row.trackingAmount, jobPostPaymentHistoryFilters.amountMin, jobPostPaymentHistoryFilters.amountMax)) return false
    if (
      jobPostPaymentHistoryFilters.searchCompanyName.trim() &&
      !matchesSearch(jobPostPaymentHistoryFilters.searchCompanyName, [row.company?.companyName, row.jobPost.title])
    ) {
      return false
    }
    if (
      jobPostPaymentHistoryFilters.searchCompanyMobile.trim() &&
      !matchesSearch(jobPostPaymentHistoryFilters.searchCompanyMobile, [row.company?.mobile, row.company?.contactMobile])
    ) {
      return false
    }
    if (
      jobPostPaymentHistoryFilters.searchJobTitle.trim() &&
      !matchesSearch(jobPostPaymentHistoryFilters.searchJobTitle, [row.jobPost.title, row.jobPost.id])
    ) {
      return false
    }

    return matchesSearch(
      [
        jobPostPaymentHistoryFilters.searchCompanyName,
        jobPostPaymentHistoryFilters.searchCompanyMobile,
        jobPostPaymentHistoryFilters.searchJobTitle
      ]
        .filter(Boolean)
        .join(' '),
      [
        row.jobPost.title,
        row.jobPost.id,
        row.jobPost.city,
        row.jobPost.status,
        row.company?.companyName,
        row.company?.mobile,
        row.company?.contactMobile,
        row.trackingReferenceId,
        row.trackingNote,
        row.paymentTypes.join(', '),
        row.trackingType,
        row.trackingStatus
      ]
    )
  })

  const filteredAuditLogs = snapshot.auditLogs.filter(log => {
    if (auditFilters.entityType !== 'all' && log.entityType !== auditFilters.entityType) return false
    return matchesSearch(auditFilters.search, [log.summary, log.entityType, log.entityId, log.actor, log.action])
  })
  const whatsappAuditLogs = snapshot.auditLogs
    .filter(isWhatsappAuditLog)
    .map(log => ({
      log,
      details: parseWhatsappAuditSummary(log.summary)
    }))
  const unreadWorkerNotificationsCount = snapshot.workerNotifications.filter(notification => !notification.isRead).length
  const pendingWorkerKycCount = snapshot.workers.filter(worker => getWorkerKycState(worker) === 'ready_for_review').length
  const pendingCompanyApprovalsCount = snapshot.companies.filter(company => company.status === 'pending').length
  const openRechargeRequestsCount = rechargeRequests.filter(
    request => request.requestType !== 'worker_support' && request.requestStatus === 'open'
  ).length
  const openSupportRequestsCount = rechargeRequests.filter(
    request => request.requestType === 'worker_support' && request.requestStatus === 'open'
  ).length
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
        liveJobs: cityJobPosts.filter(jobPost => isLiveJobPost(jobPost)).length,
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
      categories: getWorkerCategoryLabel(worker),
      walletBalance: worker.walletBalance,
      isVisible: worker.isVisible,
      registrationCompletedAt: worker.registrationCompletedAt
    })),
    companies: snapshot.companies.map(company => ({
      id: company.id,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      mobile: company.mobile,
      contactMobile: company.contactMobile,
      city: company.city,
      status: company.status,
      registrationFeePaid: company.registrationFeePaid,
      activePlan: getPlanName(company.activePlan),
      categories: getCompanyCategoryLabel(company)
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

  const currentSectionLabel = sectionLabels[activeSection]
  const currentSectionCopy =
    activeSection === 'overview'
      ? 'Track labour operations, live activity, revenue, and admin coverage from one compact workspace.'
      : `${currentSectionLabel} management stays connected to the existing labour workflows, data bindings, and admin actions.`
  const overviewMetricCards = [
    { label: 'Active Workers', value: snapshot.stats.activeWorkers, accent: '#10b981' },
    { label: 'Inactive Workers', value: snapshot.stats.inactiveWorkers, accent: '#f59e0b' },
    { label: 'Active Companies', value: snapshot.stats.activeCompanies, accent: '#2563eb' },
    { label: 'Live Job Posts', value: snapshot.stats.liveJobPosts, accent: '#7c3aed' },
    { label: 'Expired Job Posts', value: expiredJobPostsCount, accent: '#dc2626' },
    { label: 'Applications', value: snapshot.jobApplications.length, accent: '#0f766e' },
    { label: 'Unread Alerts', value: unreadWorkerNotificationsCount, accent: '#b45309' },
    { label: 'Wallet Revenue', value: formatCurrency(walletRevenue), accent: '#0f172a' },
    { label: 'Registration Revenue', value: formatCurrency(registrationRevenue), accent: '#1d4ed8' }
  ]
  const referralSearchTerm = referralWorkerSearch.trim().toLowerCase()
  const enabledReferralWorkerIds = new Set(
    referralSnapshot.profiles.filter(profile => profile.isActive).map(profile => profile.workerId)
  )
  const referralWorkerStatusFilterOptions: Array<{ key: ReferralWorkerStatusFilter; label: string; count: number }> = [
    { key: 'all', label: 'All Workers', count: snapshot.workers.length },
    { key: 'enabled', label: 'Enabled', count: snapshot.workers.filter(worker => enabledReferralWorkerIds.has(worker.id)).length },
    { key: 'not_enabled', label: 'Not Enabled', count: snapshot.workers.filter(worker => !enabledReferralWorkerIds.has(worker.id)).length }
  ]
  const referralWorkerRows = snapshot.workers
    .filter(worker => {
      const isEnabledReferralWorker = enabledReferralWorkerIds.has(worker.id)
      if (referralWorkerStatusFilter === 'enabled' && !isEnabledReferralWorker) return false
      if (referralWorkerStatusFilter === 'not_enabled' && isEnabledReferralWorker) return false
      if (!referralSearchTerm) return true
      return [
        worker.id,
        worker.fullName,
        worker.mobile,
        worker.city,
        worker.homeCity
      ].some(value => String(value || '').toLowerCase().includes(referralSearchTerm))
    })
    .slice(0, 40)
  const selectedReferralWorker = selectedReferralWorkerId ? getWorkerById(selectedReferralWorkerId) || null : null
  const selectedReferralProfile = selectedReferralWorker
    ? getReferralProfileByWorkerId(selectedReferralWorker.id)
    : null
  const selectedReferralEligibility = selectedReferralProfile
    ? getReferralEligibilityByProfileId(selectedReferralProfile.id)
    : []
  const selectedReferralEligibilityByCategory = new Map(
    selectedReferralEligibility.map(item => [item.categoryId, item])
  )
  const referralTrackingAgentOptions = Array.from(
    new Map(
      referralSnapshot.referrals.map(referral => {
        const referrer = getWorkerById(referral.referrerWorkerId)
        return [referral.referrerWorkerId, {
          id: referral.referrerWorkerId,
          label: referrer?.fullName || referral.referrerWorkerId,
          mobile: referrer?.mobile || ''
        }]
      })
    ).values()
  ).sort((left, right) => left.label.localeCompare(right.label))
  const referralTrackingSearchTerm = referralTrackingFilters.search.trim().toLowerCase()
  const hasReferralTrackingFilters =
    Boolean(referralTrackingSearchTerm) || referralTrackingFilters.agentWorkerId !== 'all'
  const filteredReferralTrackingRows = referralSnapshot.referrals.filter(referral => {
    const referrer = getWorkerById(referral.referrerWorkerId)
    const matchesSearch = !referralTrackingSearchTerm || [
      referrer?.fullName,
      referrer?.mobile,
      referral.referralCodeSnapshot
    ].some(value => String(value || '').toLowerCase().includes(referralTrackingSearchTerm))
    const matchesAgent =
      referralTrackingFilters.agentWorkerId === 'all' ||
      referral.referrerWorkerId === referralTrackingFilters.agentWorkerId

    return matchesSearch && matchesAgent
  })
  const referralById = new Map(referralSnapshot.referrals.map(referral => [referral.id, referral]))
  const referralLedgerRows = referralSnapshot.ledger.map(entry => {
    const referral = referralById.get(entry.referralId) || null
    const agent = referral ? getWorkerById(referral.referrerWorkerId) || null : getWorkerById(entry.workerId) || null
    const referred = referral ? getWorkerById(referral.referredWorkerId) || null : null

    return {
      entry,
      referral,
      agent,
      referred,
      categoryName: referral ? getCategoryName(referral.categoryId) : '-',
      referralCode: referral?.referralCodeSnapshot || '-'
    }
  })
  const referralLedgerAgentOptions = Array.from(
    new Map(
      referralLedgerRows.map(row => {
        const workerId = row.referral?.referrerWorkerId || row.entry.workerId
        return [workerId, {
          id: workerId,
          label: row.agent?.fullName || workerId,
          mobile: row.agent?.mobile || ''
        }]
      })
    ).values()
  ).sort((left, right) => left.label.localeCompare(right.label))
  const referralLedgerReferredWorkerOptions = Array.from(
    new Map(
      referralLedgerRows
        .filter(row => row.referral)
        .map(row => [row.referral?.referredWorkerId || '', {
          id: row.referral?.referredWorkerId || '',
          label: row.referred?.fullName || row.referral?.referredWorkerId || '',
          mobile: row.referred?.mobile || ''
        }])
    ).values()
  ).filter(option => option.id).sort((left, right) => left.label.localeCompare(right.label))
  const referralLedgerCategoryOptions = Array.from(
    new Map(
      referralLedgerRows
        .filter(row => row.referral?.categoryId)
        .map(row => [row.referral?.categoryId || '', {
          id: row.referral?.categoryId || '',
          label: row.categoryName
        }])
    ).values()
  ).filter(option => option.id).sort((left, right) => left.label.localeCompare(right.label))
  const referralLedgerEntryTypeOptions = Array.from(new Set(referralSnapshot.ledger.map(entry => entry.entryType).filter(Boolean))).sort()
  const referralLedgerStatusOptions = Array.from(new Set(referralSnapshot.ledger.map(entry => entry.status).filter(Boolean))).sort()
  const referralLedgerSearchTerm = referralLedgerFilters.search.trim().toLowerCase()
  const filteredReferralLedgerRows = referralLedgerRows.filter(row => {
    const matchesSearch = !referralLedgerSearchTerm || [
      row.agent?.fullName,
      row.agent?.mobile,
      row.referred?.fullName,
      row.referred?.mobile,
      row.referralCode,
      row.entry.referralId,
      row.entry.reference
    ].some(value => String(value || '').toLowerCase().includes(referralLedgerSearchTerm))
    const matchesAgent =
      referralLedgerFilters.agentWorkerId === 'all' ||
      (row.referral?.referrerWorkerId || row.entry.workerId) === referralLedgerFilters.agentWorkerId
    const matchesReferred =
      referralLedgerFilters.referredWorkerId === 'all' ||
      row.referral?.referredWorkerId === referralLedgerFilters.referredWorkerId
    const matchesCategory =
      referralLedgerFilters.categoryId === 'all' ||
      row.referral?.categoryId === referralLedgerFilters.categoryId
    const matchesEntryType =
      referralLedgerFilters.entryType === 'all' ||
      row.entry.entryType === referralLedgerFilters.entryType
    const matchesStatus =
      referralLedgerFilters.status === 'all' ||
      row.entry.status === referralLedgerFilters.status
    const matchesLedgerDateRange = matchesDateRange(row.entry.createdAt, referralLedgerFilters.dateFrom, referralLedgerFilters.dateTo)

    return matchesSearch && matchesAgent && matchesReferred && matchesCategory && matchesEntryType && matchesStatus && matchesLedgerDateRange
  })
  const hasReferralLedgerFilters = Object.entries(referralLedgerFilters).some(([key, value]) =>
    key === 'search' ? Boolean(value.trim()) : value !== 'all' && Boolean(value)
  )
  const referralLedgerExportHeaders = [
    'Date/Time',
    'Agent Name',
    'Agent Mobile',
    'Worker 2 Name',
    'Worker 2 Mobile',
    'Referral Code',
    'Category',
    'Referral ID',
    'Entry Type',
    'Amount',
    'Balance After',
    'Status',
    'Reference',
    'Remarks'
  ]
  const referralLedgerExportRows = filteredReferralLedgerRows.map(row => ({
    'Date/Time': formatDateTime(row.entry.createdAt),
    'Agent Name': row.agent?.fullName || row.entry.workerId,
    'Agent Mobile': row.agent?.mobile || '',
    'Worker 2 Name': row.referred?.fullName || row.referral?.referredWorkerId || '',
    'Worker 2 Mobile': row.referred?.mobile || '',
    'Referral Code': row.referralCode,
    'Category': row.categoryName,
    'Referral ID': row.entry.referralId,
    'Entry Type': row.entry.entryType,
    Amount: Number(row.entry.amount || 0),
    'Balance After': Number(row.entry.balanceAfter || 0),
    Status: row.entry.status,
    Reference: row.entry.reference,
    Remarks: row.entry.remarks || ''
  }))
  const referralLedgerFilterSummary = [
    `Search: ${referralLedgerFilters.search.trim() || 'All'}`,
    `Agent: ${referralLedgerAgentOptions.find(option => option.id === referralLedgerFilters.agentWorkerId)?.label || 'All Agents'}`,
    `Worker 2: ${referralLedgerReferredWorkerOptions.find(option => option.id === referralLedgerFilters.referredWorkerId)?.label || 'All Referred Workers'}`,
    `Category: ${referralLedgerCategoryOptions.find(option => option.id === referralLedgerFilters.categoryId)?.label || 'All Categories'}`,
    `Entry Type: ${referralLedgerFilters.entryType === 'all' ? 'All Entry Types' : referralLedgerFilters.entryType}`,
    `Status: ${referralLedgerFilters.status === 'all' ? 'All Statuses' : referralLedgerFilters.status}`,
    `Date Range: ${referralLedgerFilters.dateFrom || 'Any'} to ${referralLedgerFilters.dateTo || 'Any'}`
  ]
  const referralIndustryOptions = buildLabourMasterSelectOptions(
    visibleWorkerIndustryMasterOptions,
    referralIndustryFilter ? [referralIndustryFilter] : []
  )
  const referralBusinessTypeOptions = buildLabourMasterSelectOptions(
    filterBusinessTypesByIndustryDependency(
      masterOptionsByKey.business_type || [],
      masterOptionsByKey.industry_category || [],
      mastersSnapshot?.industryBusinessDependencies || [],
      referralIndustryFilter
    ),
    referralBusinessTypeFilter ? [referralBusinessTypeFilter] : []
  )
  const selectedReferralIndustryOption = referralIndustryFilter
    ? findMatchingMasterOption(visibleWorkerIndustryMasterOptions, referralIndustryFilter)
    : null
  const selectedReferralBusinessTypeOption = referralBusinessTypeFilter
    ? findMatchingMasterOption(visibleWorkerBusinessTypeMasterOptions, referralBusinessTypeFilter)
    : null
  const activeReferralCategories = (snapshot.adminCategories || snapshot.categories)
    .filter(category => category.isActive)
  const activeReferralCategoryById = new Map(activeReferralCategories.map(category => [category.id, category]))
  const selectedReferralCategorySummaries = selectedReferralCategoryIds
    .map(categoryId => {
      const category = activeReferralCategoryById.get(categoryId) || snapshot.categories.find(item => item.id === categoryId)
      if (!category) return null
      const existing = selectedReferralEligibilityByCategory.get(categoryId)
      return {
        id: categoryId,
        name: category.name,
        reward: referralRewardDraft[categoryId] ?? String(existing?.rewardAmount || 0)
      }
    })
    .filter((item): item is { id: string; name: string; reward: string } => Boolean(item))
  const referralCategorySearchTerm = referralCategorySearch.trim().toLowerCase()
  const referralCategoryResultGroups = Object.values(
    (mastersSnapshot?.categoryDependencies || []).reduce<Record<string, {
      key: string
      industryLabel: string
      businessTypeLabel: string
      rows: LabourCategory[]
    }>>((groups, dependency) => {
      if (!dependency.isActive) return groups
      const category = activeReferralCategoryById.get(dependency.categoryId)
      if (!category) return groups
      const dependencyRows = categoryDependencyRowsByCategoryId[dependency.categoryId] || []
      const dependencyRow = dependencyRows.find(row => row.id === dependency.id)
      if (!dependencyRow?.isIndustryBusinessVisible || !dependencyRow.isIndustryOptionVisible || !dependencyRow.isBusinessTypeOptionVisible) {
        return groups
      }
      if (selectedReferralIndustryOption && dependency.industryCategoryOptionId !== selectedReferralIndustryOption.id) return groups
      if (selectedReferralBusinessTypeOption && dependency.businessTypeOptionId !== selectedReferralBusinessTypeOption.id) return groups

      const searchableText = [
        dependencyRow.industryCategoryLabel,
        dependencyRow.businessTypeLabel,
        category.name
      ].join(' ').toLowerCase()
      if (referralCategorySearchTerm && !searchableText.includes(referralCategorySearchTerm)) return groups

      const key = `${dependency.industryCategoryOptionId}::${dependency.businessTypeOptionId}`
      if (!groups[key]) {
        groups[key] = {
          key,
          industryLabel: dependencyRow.industryCategoryLabel,
          businessTypeLabel: dependencyRow.businessTypeLabel,
          rows: []
        }
      }
      if (!groups[key].rows.some(row => row.id === category.id)) {
        groups[key].rows.push(category)
      }
      return groups
    }, {})
  )
    .map(group => ({
      ...group,
      rows: group.rows.sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) =>
      `${left.industryLabel} ${left.businessTypeLabel}`.localeCompare(`${right.industryLabel} ${right.businessTypeLabel}`)
    )
  const referralMetricCards = [
    { label: 'Total Referrers', value: referralSnapshot.stats.totalReferrers, accent: '#2563eb' },
    { label: 'Active Referrers', value: referralSnapshot.stats.activeReferrers, accent: '#10b981' },
    { label: 'Total Referrals', value: referralSnapshot.stats.totalReferrals, accent: '#0f766e' },
    { label: 'Registered', value: referralSnapshot.stats.registered, accent: '#7c3aed' },
    { label: 'KYC Pending', value: referralSnapshot.stats.kycPending, accent: '#f59e0b' },
    { label: 'Qualified', value: referralSnapshot.stats.qualified, accent: '#047857' },
    { label: 'Rejected / Invalid', value: referralSnapshot.stats.rejectedInvalid, accent: '#dc2626' },
    { label: 'Rewards Credited', value: referralSnapshot.stats.rewardsCredited, accent: '#1d4ed8' },
    { label: 'Available Liability', value: formatCurrency(referralSnapshot.stats.availableReferralEarningsLiability), accent: '#0f172a' },
    { label: 'Reversed Rewards', value: formatCurrency(referralSnapshot.stats.reversedRewards), accent: '#be123c' }
  ]
  const referralWithdrawalById = new Map(
    referralWithdrawalSnapshot.withdrawals.map(withdrawal => [withdrawal.id, withdrawal])
  )
  const selectedWithdrawalReview = withdrawalReviewDraft
    ? referralWithdrawalById.get(withdrawalReviewDraft.requestId) || null
    : null
  const selectedWithdrawalPaymentRequest = withdrawalPaymentDetailsRequestId
    ? referralWithdrawalById.get(withdrawalPaymentDetailsRequestId) || null
    : null
  const referralWithdrawalStatusOptions = Array.from(
    new Set(referralWithdrawalSnapshot.withdrawals.map(item => item.status).filter(Boolean))
  ).sort()
  const referralWithdrawalMethodOptions = Array.from(
    new Set(referralWithdrawalSnapshot.withdrawals.map(item => item.payoutMethod).filter(Boolean))
  ).sort()
  const referralWithdrawalSearchTerm = referralWithdrawalFilters.search.trim().toLowerCase()
  const filteredReferralWithdrawalRows = referralWithdrawalSnapshot.withdrawals.filter(withdrawal => {
    const matchesSearch =
      !referralWithdrawalSearchTerm ||
      [
        withdrawal.agentName,
        withdrawal.mobile,
        withdrawal.referralCode,
        withdrawal.id,
      ].some(value => String(value || '').toLowerCase().includes(referralWithdrawalSearchTerm))
    const matchesStatus =
      referralWithdrawalFilters.status === 'all' ||
      withdrawal.status === referralWithdrawalFilters.status
    const matchesMethod =
      referralWithdrawalFilters.payoutMethod === 'all' ||
      withdrawal.payoutMethod === referralWithdrawalFilters.payoutMethod

    return matchesSearch && matchesStatus && matchesMethod
  })
  const hasReferralWithdrawalFilters = Object.entries(referralWithdrawalFilters).some(
    ([key, value]) => (key === 'search' ? Boolean(value.trim()) : value !== 'all' && Boolean(value)),
  )
  const referralWithdrawalMetricCards = [
    {
      label: 'Requested',
      value: referralWithdrawalSnapshot.summary.requestedCount,
      accent: '#b45309',
    },
    {
      label: 'Approved',
      value: referralWithdrawalSnapshot.summary.approvedCount,
      accent: '#047857',
    },
    {
      label: 'Paid',
      value: referralWithdrawalSnapshot.summary.paidCount,
      accent: '#1d4ed8',
    },
    {
      label: 'Rejected',
      value: referralWithdrawalSnapshot.summary.rejectedCount,
      accent: '#b91c1c',
    },
    {
      label: 'Total Requested Amount',
      value: formatCurrency(referralWithdrawalSnapshot.summary.totalRequestedAmount),
      accent: '#0f172a',
    },
    {
      label: 'Total Approved Amount',
      value: formatCurrency(referralWithdrawalSnapshot.summary.totalApprovedAmount),
      accent: '#1d4ed8',
    },
    {
      label: 'Total Paid Amount',
      value: formatCurrency(referralWithdrawalSnapshot.summary.totalPaidAmount),
      accent: '#0369a1',
    }
  ]

  const downloadReportFile = (fileName: string, content: BlobPart, mimeType: string) => {
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

  const exportReferralLedgerExcel = () => {
    downloadReportFile(
      `rozgar-referral-ledger-${formatFileDate()}.xlsx`,
      createReferralLedgerXlsx(referralLedgerExportHeaders, referralLedgerExportRows),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    showSaved('Filtered referral ledger Excel exported')
  }

  const exportReferralLedgerPdf = () => {
    downloadReportFile(
      `rozgar-referral-ledger-${formatFileDate()}.pdf`,
      createReferralLedgerPdf(
        'Refer & Earn - Reward Ledger',
        referralLedgerFilterSummary,
        ['Date/Time', 'Agent Name', 'Worker 2 Name', 'Referral Code', 'Category', 'Entry Type', 'Amount', 'Balance After', 'Status'],
        referralLedgerExportRows
      ),
      'application/pdf'
    )
    showSaved('Filtered referral ledger PDF exported')
  }

  const validateCategory = () => {
    const name = categoryDraft.name.trim()
    const slug = slugify(categoryDraft.slug || categoryDraft.name)

    if (!name) return 'Category name is required.'
    if (!slug) return 'Category slug is required.'

    const duplicateName = adminVisibleCategories.find(
      category => category.id !== editingCategoryId && category.name.toLowerCase() === name.toLowerCase()
    )
    if (duplicateName) return 'A category with this name already exists.'

    const duplicateSlug = adminVisibleCategories.find(
      category => category.id !== editingCategoryId && category.slug.toLowerCase() === slug.toLowerCase()
    )
    if (duplicateSlug) return 'A category with this slug already exists.'

    return ''
  }

  const validatePlan = () => {
    if (!planDraft.name.trim()) return 'Plan name is required.'
    if (planDraft.planValidityDays <= 0) return 'Plan validity days must be greater than 0.'
    if (planDraft.registrationFee < 0 || planDraft.walletCredit < 0 || planDraft.planAmount < 0 || planDraft.dailyCharge < 0) {
      return 'Plan amounts cannot be negative.'
    }

    if (planDraft.audience === 'company' && planDraft.planAmount <= 0) {
      return 'Company plans should have a plan amount.'
    }

    if (planDraft.audience === 'company' && planDraft.jobPostLimit <= 0) {
      return 'Number of job posts allowed must be at least 1.'
    }

    if (planDraft.audience === 'company' && planDraft.jobPostLiveDays <= 0) {
      return 'Job post live period days must be greater than 0 for company plans.'
    }

    if (planDraft.industryCategoryValues.length === 0) {
      return `Select at least one industry category for ${planDraft.audience} plans.`
    }

    if (planDraft.businessTypeValues.length === 0) {
      return `Select at least one business type for ${planDraft.audience} plans.`
    }

    if (planDraft.labourCategoryIds.length === 0 && !planDraft.categoryId) {
      return 'Select at least one labour category or keep a legacy category override.'
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

  const validateWorker = (draft: LabourWorker = workerDraft) => {
    if (!draft.fullName.trim()) return 'Worker name is required.'
    if (!draft.mobile.trim()) return 'Worker mobile is required.'
    if (!isTenDigitMobile(draft.mobile)) return 'Worker mobile must be exactly 10 digits.'
    if (!draft.industryCategory.trim()) return 'Industry category is required.'
    if (!draft.businessType.trim()) return 'Business type is required.'
    if (!draft.homeCity.trim()) return 'City is required.'
    const preferredCityCount = draft.preferredWorkLocations.reduce((count, location) => count + location.cityOptionIds.length, 0)
    if (!editingWorkerId && preferredCityCount === 0) {
      return 'Select at least one preferred work city.'
    }
    if (draft.categoryIds.length === 0) return 'Select at least one worker category.'
    if (
      draft.experienceYears < 0 ||
      draft.expectedDailyWage < 0 ||
      draft.minimumExpectedWage < 0 ||
      draft.maximumExpectedWage < 0 ||
      draft.walletBalance < 0
    ) {
      return 'Worker experience, wage and wallet balance must be non-negative.'
    }
    if (
      draft.minimumExpectedWage > 0 &&
      draft.maximumExpectedWage > 0 &&
      draft.maximumExpectedWage < draft.minimumExpectedWage
    ) {
      return 'Maximum expected wage cannot be less than minimum expected wage.'
    }

    const duplicateMobile = snapshot.workers.find(
      worker => worker.id !== editingWorkerId && worker.mobile.trim() === draft.mobile.trim()
    )
    if (duplicateMobile) return 'Another worker already uses this mobile number.'

    return ''
  }

  const validateCompany = () => {
    if (!companyDraft.companyName.trim()) return 'Company name is required.'
    if (!companyDraft.contactPerson.trim()) return 'Contact person is required.'
    if (!companyDraft.businessType.trim()) return 'Business type is required.'
    if (!companyDraft.industryCategory.trim()) return 'Industry category is required.'
    if (!companyDraft.email.trim()) return 'Company email is required.'
    if (!isValidEmail(companyDraft.email)) return 'Enter a valid company email address.'
    if (!companyDraft.mobile.trim()) return 'Owner number is required.'
    if (!isTenDigitMobile(companyDraft.mobile)) return 'Owner number must be exactly 10 digits.'
    if (companyDraft.contactMobile.trim() && !isTenDigitMobile(companyDraft.contactMobile)) return 'Contact number must be exactly 10 digits.'
    if (!companyDraft.companyAddress.trim()) return 'Company address is required.'
    if (!companyDraft.state.trim()) return 'State is required.'
    if (companyDraft.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i.test(companyDraft.gstNumber.trim())) {
      return 'GST number format is not valid.'
    }
    if (companyDraft.pincode.trim() && !/^\d{6}$/.test(companyDraft.pincode.trim())) return 'Pincode must be exactly 6 digits.'

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
    if (jobPostDraft.wageAmount < 0) return 'Wage amount cannot be negative.'
    if (resolveJobPostValidityDays(jobPostDraft.validityDays, 0) <= 0) return 'Validity days must be at least 1.'
    if (jobPostDraft.publishedAt && Number.isNaN(new Date(jobPostDraft.publishedAt).getTime())) return 'Published At must be a valid date.'
    if (jobPostDraft.expiresAt && Number.isNaN(new Date(jobPostDraft.expiresAt).getTime())) return 'Expires At must be a valid date.'
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
      categoryId: planDraft.categoryId || '',
      industryCategoryValues: planDraft.industryCategoryValues,
      businessTypeValues: planDraft.businessTypeValues,
      labourCategoryIds: planDraft.labourCategoryIds,
      jobPostLimit: planDraft.jobPostLimit,
      planValidityDays: planDraft.planValidityDays,
      jobPostLiveDays: planDraft.jobPostLiveDays,
      validityDays: planDraft.planValidityDays
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
    const normalizedWorkerDraft = buildWorkerEditorDraft(workerDraft)
    const validationError = validateWorker(normalizedWorkerDraft)
    if (validationError) {
      setError(validationError)
      return
    }
    setWorkerDraft(normalizedWorkerDraft)

    const ok = await persistEntity(
      editingWorkerId ? 'PUT' : 'POST',
      'workers',
      buildWorkerSavePayload(normalizedWorkerDraft),
      editingWorkerId || undefined
    )

    if (!ok) return
    resetWorkerDraft()
    showSaved('Worker saved')
  }

  const openWorkerKycReview = (workerId: string) => {
    const worker = snapshot?.workers.find(entry => entry.id === workerId)
    if (!worker) return
    setSelectedWorkerReviewId(workerId)
    setWorkerKycReviewDraft(buildWorkerKycReviewDraft(worker))
    setWorkerKycReviewValidation('')
    setIsWorkerKycReviewOpen(true)
    setError('')
  }

  const closeWorkerKycReview = () => {
    setIsWorkerKycReviewOpen(false)
    setSelectedWorkerReviewId(null)
    setWorkerKycReviewDraft(blankWorkerKycReviewDraft)
    setWorkerKycReviewValidation('')
  }

  const saveWorkerKycReview = async () => {
    setError('')
    setWorkerKycReviewValidation('')
    if (!selectedWorkerReview) {
      setError('Choose a worker from the list to review KYC details.')
      return
    }

    const trimmedReviewRemark = workerKycReviewDraft.remarks.trim()

    if (workerKycReviewDraft.decision === 'rejected' && !trimmedReviewRemark) {
      setWorkerKycReviewValidation('Review reason is required when KYC is rejected.')
      return
    }

    if (workerKycReviewDraft.decision === 'needs_correction' && !trimmedReviewRemark) {
      setWorkerKycReviewValidation('Correction reason is required when KYC needs correction.')
      return
    }

    if (
      (workerKycReviewDraft.decision === 'rejected' || workerKycReviewDraft.decision === 'needs_correction') &&
      isKycDisplayFallbackRemark(trimmedReviewRemark)
    ) {
      setWorkerKycReviewValidation('Enter the actual admin review reason. The worker app fallback message cannot be saved as a KYC reason.')
      return
    }

    if (workerKycReviewDraft.decision === 'verified' && !isWorkerKycSubmitted(selectedWorkerReview)) {
      setError('Worker has not submitted the full KYC set yet.')
      return
    }

    let nextStatus: WorkerStatus = 'pending'
    let nextVisibility = false
    let reviewLabel = 'Pending'

    switch (workerKycReviewDraft.decision) {
      case 'verified':
        nextStatus = selectedWorkerReview.walletBalance > 0 ? 'active' : 'inactive_wallet_empty'
        nextVisibility = selectedWorkerReview.walletBalance > 0
        reviewLabel = 'Verified'
        break
      case 'rejected':
        nextStatus = 'rejected'
        reviewLabel = 'Rejected'
        break
      case 'needs_correction':
        nextStatus = 'blocked'
        reviewLabel = 'Needs correction'
        break
      case 'pending':
      default:
        nextStatus = 'pending'
        reviewLabel = 'Pending'
        break
    }

    const reviewRemark = trimmedReviewRemark
    const ok = await persistEntity('PUT', 'workers', {
      status: nextStatus,
      isVisible: nextVisibility,
      kycReviewStatusLabel: reviewLabel,
      kycReviewRemark: reviewRemark
    }, selectedWorkerReview.id)

    if (!ok) return

    setSelectedWorkerReviewId(selectedWorkerReview.id)
    setIsWorkerKycReviewOpen(false)
    setWorkerKycReviewDraft(blankWorkerKycReviewDraft)
    showSaved(
      workerKycReviewDraft.decision === 'verified'
        ? selectedWorkerReview.walletBalance > 0
          ? `${selectedWorkerReview.fullName} KYC verified and activated`
          : `${selectedWorkerReview.fullName} KYC verified. Wallet recharge is still needed for activation`
        : reviewRemark
          ? `${selectedWorkerReview.fullName} marked as ${reviewLabel.toLowerCase()}: ${reviewRemark}`
          : `${selectedWorkerReview.fullName} marked as ${reviewLabel.toLowerCase()}`
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

    const selectedCompany = getCompanyById(jobPostDraft.companyId)
    const selectedCompanyPlan = getCompanyPlanByName(jobPostDraft.connectedPlan) || getCompanyActivePlan(jobPostDraft.companyId)
    const publishedAt = jobPostDraft.publishedAt || getTodayDateValue()
    const selectedCompanyPlanLiveDays = selectedCompanyPlan ? getJobPostLiveDays(selectedCompanyPlan) : 0
    const generatedValidityDays = selectedCompanyPlanLiveDays > 0
      ? selectedCompanyPlanLiveDays
      : resolveJobPostValidityDays(jobPostDraft.validityDays, 3)
    const generatedCity = jobPostDraft.city.trim() || selectedCompany?.city.trim() || defaultAdminCity
    const generatedLocationLabel =
      jobPostDraft.locationLabel.trim() ||
      selectedCompany?.area.trim() ||
      selectedCompany?.pincode.trim() ||
      selectedCompany?.companyAddress.trim() ||
      ''
    const payload = {
      ...jobPostDraft,
      description: buildJobPostDescription({
        ...jobPostDraft,
        connectedPlan: jobPostDraft.connectedPlan || selectedCompanyPlan?.name || '',
        submissionMode: editingJobPostId ? jobPostDraft.submissionMode || jobPostDraft.status : 'Pending review for publish'
      }),
      city: generatedCity,
      locationLabel: generatedLocationLabel,
      validityDays: generatedValidityDays,
      status: jobPostDraft.status || 'draft',
      publishedAt,
      expiresAt: selectedCompanyPlanLiveDays > 0
        ? addDays(publishedAt, generatedValidityDays)
        : jobPostDraft.expiresAt || addDays(publishedAt, generatedValidityDays)
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

    const relatedEntityType = rechargeRequestDraft.requestType === 'company_follow_up' ? 'company' : 'worker'
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
    <div style={{ minHeight: '100vh', background: '#edf2f8', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        .labour-admin-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 272px minmax(0, 1fr);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 22%),
            linear-gradient(180deg, #f7faff 0%, #eef3f9 100%);
        }
        .labour-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 14px;
          background: linear-gradient(180deg, #112347 0%, #0d1c38 52%, #0a162e 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.12);
          color: #ffffff;
          overflow: hidden;
        }
        .labour-sidebar-panel {
          height: 100%;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          gap: 14px;
          min-height: 0;
        }
        .labour-brand {
          display: grid;
          gap: 10px;
        }
        .labour-brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #275df3 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 16px 28px rgba(29, 78, 216, 0.28);
        }
        .labour-brand-title {
          margin: 0;
          font-size: 18px;
          line-height: 1.15;
          font-weight: 600;
          color: #f8fafc;
        }
        .labour-brand-copy {
          margin: 6px 0 0;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12.5px;
          line-height: 1.5;
        }
        .labour-sidebar-kicker {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.86);
        }
        .labour-sidebar-nav {
          display: grid;
          gap: 4px;
          align-content: start;
          min-height: 0;
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 197, 253, 0.34) transparent;
        }
        .labour-sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }
        .labour-sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(147, 197, 253, 0.34);
          border-radius: 999px;
        }
        .labour-nav-item {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(241, 245, 249, 0.92);
          border-radius: 13px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
          text-align: left;
        }
        .labour-nav-item:hover {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(147, 197, 253, 0.18);
          color: #ffffff;
        }
        .labour-nav-item.active {
          background: linear-gradient(180deg, rgba(37, 99, 235, 0.3) 0%, rgba(29, 78, 216, 0.24) 100%);
          border-color: rgba(96, 165, 250, 0.34);
          color: #ffffff;
          box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.08);
        }
        .labour-nav-icon {
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
        }
        .labour-sidebar-footer {
          border-top: 1px solid rgba(148, 163, 184, 0.18);
          padding-top: 12px;
          display: grid;
          gap: 4px;
        }
        .labour-sidebar-footer-title {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 600;
        }
        .labour-sidebar-footer-copy {
          color: rgba(191, 219, 254, 0.78);
          font-size: 11px;
          line-height: 1.45;
        }
        .labour-content-shell {
          min-width: 0;
          display: grid;
          grid-template-rows: auto 1fr;
        }
        .labour-topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 18px 24px 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          background: rgba(247, 250, 255, 0.9);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(220, 228, 239, 0.9);
        }
        .labour-header-kicker {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #5c7598;
        }
        .labour-header-title {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 600;
          color: #0f172a;
        }
        .labour-header-copy {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #64748b;
          max-width: 760px;
        }
        .labour-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .labour-page-body {
          padding: 20px 24px 28px;
        }
        .labour-page-stack {
          width: min(1420px, 100%);
          display: grid;
          gap: 14px;
        }
        .labour-storage-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
        }
        .labour-storage-copy {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .labour-storage-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #eef4ff 0%, #e4eeff 100%);
          color: #2563eb;
          flex: 0 0 auto;
        }
        .labour-storage-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .labour-metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        .labour-metric-card {
          position: relative;
          overflow: hidden;
          min-height: 108px;
          padding: 16px 18px;
        }
        .labour-metric-card::after {
          content: "";
          position: absolute;
          width: 64px;
          height: 64px;
          border-radius: 999px;
          inset: auto -22px -22px auto;
          background: rgba(219, 230, 246, 0.34);
        }
        .labour-metric-label {
          position: relative;
          z-index: 1;
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 600;
          color: #5f7594;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .labour-metric-value {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 31px;
          line-height: 1.05;
          font-weight: 600;
        }
        .labour-overview-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 16px;
        }
        .labour-overview-stack {
          display: grid;
          gap: 16px;
        }
        .labour-coverage-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .labour-card-heading {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 600;
        }
        .labour-card-subheading {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 600;
        }
        .labour-card-copy {
          margin: 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.65;
        }
        .labour-chip-card {
          background: #f8fbff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
        }
        .labour-activity-row {
          background: #fbfdff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
        }
        .labour-content-section {
          min-width: 0;
        }
        .labour-nav-item:focus-visible,
        .labour-header-actions a:focus-visible,
        .labour-header-actions button:focus-visible,
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
        @media (max-width: 1280px) {
          .labour-metric-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
          .labour-overview-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1120px) {
          .labour-admin-shell {
            grid-template-columns: 1fr;
          }
          .labour-sidebar {
            position: static;
            height: auto;
            overflow: visible;
          }
          .labour-sidebar-panel {
            grid-template-rows: auto auto auto;
          }
          .labour-sidebar-footer {
            display: none;
          }
          .labour-sidebar-nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            overflow: visible;
            padding-right: 0;
          }
          .labour-metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-height: 940px) and (min-width: 1121px) {
          .labour-sidebar-footer {
            display: none;
          }
        }
        @media (max-width: 920px) {
          .labour-storage-card {
            grid-template-columns: 1fr;
          }
          .labour-storage-actions {
            justify-content: flex-start;
          }
          .labour-coverage-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .labour-topbar {
            padding: 16px 14px 14px;
          }
          .labour-header-title {
            font-size: 24px;
          }
          .labour-page-body {
            padding: 16px;
          }
          .labour-sidebar {
            padding: 14px;
          }
          .labour-sidebar-nav {
            grid-template-columns: 1fr;
          }
          .labour-metric-grid,
          .labour-coverage-grid {
            grid-template-columns: 1fr;
          }
          .labour-storage-copy {
            align-items: flex-start;
          }
          .labour-header-actions {
            width: 100%;
          }
        }
      `}</style>
      {(saved || error) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          {error || saved}
        </div>
      )}

      <div className="labour-admin-shell">
        <aside className="labour-sidebar">
          <div className="labour-sidebar-panel">
            <div className="labour-brand">
              <div className="labour-brand-mark">LX</div>
              <div>
                <h1 className="labour-brand-title">Labour Exchange</h1>
                <p className="labour-brand-copy">
                  Dashboard, worker management, companies, categories, job posts, plans, reports and moderation.
                </p>
              </div>
            </div>

            <div className="labour-sidebar-kicker">Navigation</div>

            <div className="labour-sidebar-nav">
              {sectionNavItems.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`labour-nav-item ${activeSection === item.key ? 'active' : ''}`}
                  >
                    <Icon className="labour-nav-icon" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="labour-sidebar-footer">
              <div className="labour-sidebar-footer-title">Labour Exchange Admin</div>
              <div className="labour-sidebar-footer-copy">Manage • Monitor • Grow</div>
            </div>
          </div>
        </aside>

        <main className="labour-content-shell">
          <header className="labour-topbar">
            <div>
              <p className="labour-header-kicker">Labour Admin Workspace</p>
              <h2 className="labour-header-title">{currentSectionLabel}</h2>
              <p className="labour-header-copy">{currentSectionCopy}</p>
            </div>
            <div className="labour-header-actions">
              <Link href="/admin" style={subtleButtonStyle}>
                <ArrowLeft className="labour-nav-icon" />
                Back To Admin
              </Link>
              <button onClick={() => { void fetchSnapshot(); void fetchMasters() }} style={primaryButtonStyle}>
                <RefreshCw className="labour-nav-icon" />
                Refresh
              </button>
            </div>
          </header>

          <div className="labour-page-body">
            <div className="labour-page-stack">
              <div style={{ ...cardStyle }} className="labour-storage-card">
                <div className="labour-storage-copy">
                  <div className="labour-storage-icon">
                    <Database className="labour-nav-icon" />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#284667', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                      Storage Mode
                    </p>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.55 }}>
                      {snapshot.storage === 'supabase'
                        ? 'This module is currently reading and writing live Supabase tables.'
                        : 'This module is currently using the local JSON fallback because the Supabase labour tables do not exist yet.'}
                    </p>
                  </div>
                </div>
                <div className="labour-storage-actions">
                  {['categories', 'plans', 'workers', 'companies', 'jobPosts', 'workerNotifications'].map(key => (
                    <button
                      key={key}
                      onClick={() => openAddForm(key as LabourSection)}
                      style={subtleButtonStyle}
                    >
                      Add {sectionLabels[key as LabourSection].slice(0, -1)}
                    </button>
                  ))}
                  <a href="/admin/labour/website" style={subtleButtonStyle}>
                    Edit Website
                  </a>
                </div>
              </div>

              <div className="labour-metric-grid">
                {overviewMetricCards.map(card => (
                  <div key={card.label} style={cardStyle} className="labour-metric-card">
                    <p className="labour-metric-label">{card.label}</p>
                    <p className="labour-metric-value" style={{ color: card.accent }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {activeSection === 'overview' && (
                <div className="labour-overview-grid labour-content-section">
                  <div className="labour-overview-stack">
                    <div style={cardStyle}>
                      <h2 className="labour-card-heading">Admin module coverage</h2>
                      <p className="labour-card-copy" style={{ marginBottom: '16px' }}>
                        This admin module now covers dashboard tracking, worker management, company management, categories, job posts, pricing plans, wallet transaction monitoring, recharge follow-up, reports and moderation.
                      </p>
                      <div className="labour-coverage-grid">
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
                          `Recharge Follow-ups: ${rechargeRequests.filter(request => request.requestType !== 'worker_support').length}`,
                          `Support Requests: ${rechargeRequests.filter(request => request.requestType === 'worker_support').length}`,
                          `Audit Logs: ${snapshot.auditLogs.length}`
                        ].map(item => (
                          <div key={item} className="labour-chip-card">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <h3 className="labour-card-subheading">Category-wise demand</h3>
                        <button onClick={() => setActiveSection('reports')} style={subtleButtonStyle}>Open Reports</button>
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {categoryDemandRows.map(row => (
                          <div key={row.id} className="labour-activity-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                              <p style={{ margin: 0, color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>{row.name}</p>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{row.demandLevel} demand</p>
                            </div>
                            <p style={{ margin: '6px 0 0', color: '#475569', fontSize: '12px', lineHeight: 1.55 }}>
                              Active workers {row.activeWorkersCount} | Total workers {row.workersCount} | Companies {row.companiesCount} | Live jobs {row.liveJobsCount} | Expired jobs {row.expiredJobsCount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="labour-overview-stack">
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <h3 className="labour-card-subheading">Recent admin activity</h3>
                        <button onClick={() => setActiveSection('auditLogs')} style={subtleButtonStyle}>Open Audit Logs</button>
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {snapshot.stats.recentAuditLogs.length === 0 ? (
                          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No changes logged yet.</p>
                        ) : (
                          snapshot.stats.recentAuditLogs.map(log => (
                            <div key={log.id} className="labour-activity-row">
                              <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{log.summary}</p>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{log.actor} | {formatDateTime(log.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <h3 className="labour-card-subheading">Moderation queue</h3>
                        <button onClick={() => setActiveSection('reports')} style={subtleButtonStyle}>Open Moderation</button>
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {moderationQueue.length === 0 ? (
                          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Nothing is waiting for moderation right now.</p>
                        ) : (
                          moderationQueue.map(item => (
                            <div key={item.id} className="labour-activity-row">
                              <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{item.type}: {item.name}</p>
                              <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px' }}>{item.city || 'No city'} | {titleCase(item.status)}</p>
                              <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: 1.55 }}>{item.note}</p>
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
                <div>
                  <label style={labelStyle}>Image URL</label>
                  <input value={categoryDraft.imageUrl} onChange={event => setCategoryDraft(current => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={categoryDraft.showOnHome} onChange={event => setCategoryDraft(current => ({ ...current, showOnHome: event.target.checked }))} />
                    Show in worker home popular categories
                  </label>
                  <div>
                    <label style={labelStyle}>Home card order</label>
                    <input
                      type="number"
                      min={0}
                      value={categoryDraft.homeOrder}
                      onChange={event => setCategoryDraft(current => ({ ...current, homeOrder: Number(event.target.value || 0) }))}
                      style={inputStyle}
                    />
                  </div>
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
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    {adminVisibleCategories.length === 0
                      ? 'No categories found. Add your first category manually.'
                      : 'No categories match the current filters.'}
                  </p>
                ) : (
                  filteredCategories.map(category => (
                    <div key={category.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{category.name}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {category.slug} | {category.demandLevel} demand | {category.isActive ? 'Active' : 'Inactive'} | Home: {category.showOnHome ? `Yes (#${category.homeOrder})` : 'No'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{category.description || 'No description yet.'}</p>
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>{category.imageUrl || 'No image URL set.'}</p>
                        {(categoryDependencyRowsByCategoryId[category.id] || []).length > 0 ? (
                          <div style={{ marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', background: '#f8fafc', display: 'grid', gap: '8px' }}>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
                              Category mapping blockers: {(categoryDependencyRowsByCategoryId[category.id] || []).length}
                            </p>
                            {(categoryDependencyRowsByCategoryId[category.id] || []).map(row => (
                              <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                                <div>
                                  <p style={{ margin: 0, color: '#0f172a', fontSize: '12px', fontWeight: 600 }}>
                                    {row.industryCategoryLabel} {'->'} {row.businessTypeLabel} {'->'} {row.categoryLabel}
                                  </p>
                                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '11px' }}>
                                    {row.isActive ? 'Active mapping' : 'Inactive mapping'}
                                    {!row.isIndustryBusinessVisible ? ' | Hidden from current dependency picker' : ''}
                                    {!row.isIndustryOptionVisible ? ' | Industry master inactive/missing' : ''}
                                    {!row.isBusinessTypeOptionVisible ? ' | Business Type master inactive/missing' : ''}
                                    {!row.isActive ? ' | Will auto-clear after active blockers are removed and delete is retried' : ''}
                                  </p>
                                </div>
                                {row.isActive ? (
                                  <button
                                    onClick={() => void removeCategoryBlockerMapping(row)}
                                    style={{ ...subtleButtonStyle, padding: '7px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                                  >
                                    Remove Mapping
                                  </button>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    Auto-clears later
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setCategoryDraft({ ...category }); setEditingCategoryId(category.id) }} style={subtleButtonStyle}>Edit</button>
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
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Basic Details</p>
                  <div>
                    <label style={labelStyle}>Plan Name *</label>
                    <input value={planDraft.name} onChange={event => setPlanDraft(current => ({ ...current, name: event.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Audience</label>
                      <select value={planDraft.audience} onChange={event => setPlanDraft(current => ({ ...current, audience: event.target.value as PlanAudience }))} style={inputStyle}>
                        <option value="company">Company</option>
                        <option value="worker">Worker</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Plan Amount</label>
                      <input type="number" min="0" value={planDraft.planAmount} onChange={event => setPlanDraft(current => ({ ...current, planAmount: Number(event.target.value) }))} style={inputStyle} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input type="checkbox" checked={planDraft.isActive} onChange={event => setPlanDraft(current => ({ ...current, isActive: event.target.checked }))} />
                    Plan is active
                  </label>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Plan Limits</p>
                  {planDraft.audience === 'company' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Number of Job Posts Allowed</label>
                        <input type="number" min="1" value={planDraft.jobPostLimit} onChange={event => setPlanDraft(current => ({ ...current, jobPostLimit: Number(event.target.value || 1) }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Plan Validity Days</label>
                        <input type="number" min="1" value={planDraft.planValidityDays} onChange={event => setPlanDraft(current => ({ ...current, planValidityDays: Number(event.target.value || 0), validityDays: Number(event.target.value || 0) }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Job Post Live Period Days</label>
                        <input type="number" min="1" value={planDraft.jobPostLiveDays} onChange={event => setPlanDraft(current => ({ ...current, jobPostLiveDays: Number(event.target.value || 0) }))} style={inputStyle} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>Plan Validity Days</label>
                      <input type="number" min="1" value={planDraft.planValidityDays} onChange={event => setPlanDraft(current => ({ ...current, planValidityDays: Number(event.target.value || 0), validityDays: Number(event.target.value || 0) }))} style={inputStyle} />
                    </div>
                  )}
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Industry / Business / Category Access</p>
                  <div>
                    <label style={labelStyle}>Industry Category *</label>
                    <div style={{ border: '1px solid #dbe3f0', borderRadius: '14px', padding: '12px', background: '#f8fafc', display: 'grid', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                      {planIndustryCategoryOptions.length === 0 ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No active industry categories available.</p>
                      ) : (
                        planIndustryCategoryOptions.map(option => (
                          <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                            <input
                              type="checkbox"
                              checked={planDraft.industryCategoryValues.includes(option.value)}
                              onChange={() => setPlanDraft(current => ({
                                ...current,
                                industryCategoryValues: onMultiSelectChange(current.industryCategoryValues, option.value)
                              }))}
                            />
                            {option.label}
                          </label>
                        ))
                      )}
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {planDraft.industryCategoryValues.length > 0 ? `${planDraft.industryCategoryValues.length} industry categor${planDraft.industryCategoryValues.length === 1 ? 'y' : 'ies'} selected` : 'Select one or more active industry categories.'}
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Business Type / Business Category *</label>
                    <div style={{ border: '1px solid #dbe3f0', borderRadius: '14px', padding: '12px', background: hasPlanIndustrySelection ? '#f8fafc' : '#f1f5f9', display: 'grid', gap: '10px', maxHeight: '180px', overflowY: 'auto', opacity: hasPlanIndustrySelection ? 1 : 0.75 }}>
                      {!hasPlanIndustrySelection ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Select Industry Category first</p>
                      ) : !hasMappedBusinessTypesForPlan ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No active business types are mapped to the selected industry categories.</p>
                      ) : (
                        planBusinessTypeOptions.map(option => (
                          <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                            <input
                              type="checkbox"
                              checked={planDraft.businessTypeValues.includes(option.value)}
                              onChange={() => setPlanDraft(current => ({
                                ...current,
                                businessTypeValues: onMultiSelectChange(current.businessTypeValues, option.value)
                              }))}
                            />
                            {option.label}
                          </label>
                        ))
                      )}
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {planDraft.businessTypeValues.length > 0 ? `${planDraft.businessTypeValues.length} business type${planDraft.businessTypeValues.length === 1 ? '' : 's'} selected` : 'Select one or more mapped business types.'}
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Labour Category *</label>
                    <div style={{ border: '1px solid #dbe3f0', borderRadius: '14px', padding: '12px', background: hasPlanIndustrySelection && hasPlanBusinessSelection ? '#f8fafc' : '#f1f5f9', display: 'grid', gap: '10px', maxHeight: '200px', overflowY: 'auto', opacity: hasPlanIndustrySelection && hasPlanBusinessSelection ? 1 : 0.75 }}>
                      {!hasPlanIndustrySelection || !hasPlanBusinessSelection ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Select Industry Category and Business Type first</p>
                      ) : !hasMappedCategoriesForPlan ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No active labour categories are mapped to the selected industry and business types.</p>
                      ) : (
                        planLabourCategoryOptions.map(category => (
                          <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                            <input
                              type="checkbox"
                              checked={planDraft.labourCategoryIds.includes(category.id)}
                              onChange={() => setPlanDraft(current => ({
                                ...current,
                                labourCategoryIds: onMultiSelectChange(current.labourCategoryIds, category.id)
                              }))}
                            />
                            {category.name}
                          </label>
                        ))
                      )}
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {planDraft.labourCategoryIds.length > 0 ? `${planDraft.labourCategoryIds.length} labour categor${planDraft.labourCategoryIds.length === 1 ? 'y' : 'ies'} selected` : 'Select one or more mapped labour categories.'}
                    </p>
                  </div>
                </div>

                {planDraft.audience === 'worker' ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px' }}>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Worker Wallet Settings</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Registration Fee</label>
                        <input type="number" min="0" value={planDraft.registrationFee} onChange={event => setPlanDraft(current => ({ ...current, registrationFee: Number(event.target.value) }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Wallet Credit</label>
                        <input type="number" min="0" value={planDraft.walletCredit} onChange={event => setPlanDraft(current => ({ ...current, walletCredit: Number(event.target.value) }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Daily Charge</label>
                        <input type="number" min="0" value={planDraft.dailyCharge} onChange={event => setPlanDraft(current => ({ ...current, dailyCharge: Number(event.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Description</p>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={planDraft.description} onChange={event => setPlanDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                </div>
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
                          {plan.audience === 'company'
                            ? `${titleCase(plan.audience)} | ${formatCurrency(plan.planAmount)} | Plan valid ${getPlanValidityDays(plan)} days | Job live ${getJobPostLiveDays(plan)} days | ${plan.jobPostLimit} job post${plan.jobPostLimit === 1 ? '' : 's'} | ${plan.isActive ? 'Active' : 'Inactive'}`
                            : `${titleCase(plan.audience)} | Registration ${formatCurrency(plan.registrationFee)} | Wallet credit ${formatCurrency(plan.walletCredit)} | Daily charge ${formatCurrency(plan.dailyCharge)} | Plan valid ${getPlanValidityDays(plan)} days | ${plan.isActive ? 'Active' : 'Inactive'}`
                          }
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{plan.description || 'No description yet.'}</p>
                        {plan.audience === 'company' ? null : (
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            Registration {formatCurrency(plan.registrationFee)} | Wallet credit {formatCurrency(plan.walletCredit)} | Daily charge {formatCurrency(plan.dailyCharge)}
                          </p>
                        )}
                        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '12px' }}>
                          Industries: {summarizeSelection(getPlanIndustryLabels(plan), 'industries')}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>
                          Business Types: {summarizeSelection(getPlanBusinessTypeLabels(plan), 'business types')}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>
                          Categories: {summarizeSelection(getPlanLabourCategoryLabels(plan), 'categories')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <button onClick={() => { setPlanDraft({ ...blankPlan, ...plan, categoryId: plan.categoryId || '', industryCategoryValues: plan.industryCategoryValues || [], businessTypeValues: plan.businessTypeValues || [], labourCategoryIds: plan.labourCategoryIds || [], jobPostLimit: plan.jobPostLimit || 1, planValidityDays: plan.planValidityDays || plan.validityDays || 0, jobPostLiveDays: plan.jobPostLiveDays || plan.validityDays || 0, validityDays: plan.planValidityDays || plan.validityDays || 0 }); setEditingPlanId(plan.id) }} style={subtleButtonStyle}>Edit</button>
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
                    <label style={labelStyle}>Industry Category *</label>
                    <select
                      value={workerDraft.industryCategory}
                      onChange={event => setWorkerDraft(current => ({
                        ...current,
                        industryCategory: event.target.value,
                        businessType: '',
                        categoryIds: []
                      }))}
                      style={inputStyle}
                    >
                      <option value="">Select industry category</option>
                      {workerIndustryCategoryOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Business Type *</label>
                    <select
                      value={workerDraft.businessType}
                      onChange={event => setWorkerDraft(current => ({
                        ...current,
                        businessType: event.target.value,
                        categoryIds: []
                      }))}
                      style={inputStyle}
                      disabled={!hasWorkerIndustrySelection}
                    >
                      <option value="">
                        {hasWorkerIndustrySelection ? 'Select business type' : 'Select industry category first'}
                      </option>
                      {workerBusinessTypeOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {!hasWorkerIndustrySelection ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>Select Industry Category to load Business Types.</p>
                    ) : !hasMappedBusinessTypesForWorker ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>No Business Type mappings found for this Industry Category.</p>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <select
                      value={workerHomeStateId}
                      onChange={event => {
                        const nextStateId = event.target.value
                        setWorkerHomeStateId(nextStateId)
                        setWorkerDraft(current => ({
                          ...current,
                          city: '',
                          homeCity: ''
                        }))
                      }}
                      style={inputStyle}
                    >
                      <option value="">Select state</option>
                      {workerStateOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <select
                      value={workerDraft.homeCity}
                      onChange={event => {
                        const nextCity = event.target.value
                        setWorkerDraft(current => ({
                          ...current,
                          city: nextCity,
                          homeCity: nextCity
                        }))
                      }}
                      style={inputStyle}
                      disabled={!workerHomeStateId}
                    >
                      <option value="">{workerHomeStateId ? 'Select city' : 'Select state first'}</option>
                      {getWorkerHomeCityOptions(workerHomeStateId, workerDraft.homeCity).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Address</label>
                  <textarea
                    value={workerDraft.address}
                    onChange={event => setWorkerDraft(current => ({ ...current, address: event.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '92px' }}
                  />
                </div>
                <div style={{ border: '1px solid #dbe6f3', borderRadius: '18px', padding: '14px', background: '#f8fbff', display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Where do you want to work? *</label>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                      Select multiple states and cities where worker is available for work.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {workerPreferredStateOptions.map(option => {
                      const selected = isWorkerPreferredStateSelected(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleWorkerPreferredState(option.id)}
                          style={{
                            border: `1px solid ${selected ? '#2563eb' : '#cbd5e1'}`,
                            background: selected ? '#eff6ff' : '#ffffff',
                            color: selected ? '#1d4ed8' : '#334155',
                            borderRadius: '999px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  {workerStateOptions.length > 5 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllWorkerPreferredStates(current => !current)}
                      style={{ ...subtleButtonStyle, justifySelf: 'flex-start', padding: '8px 12px' }}
                    >
                      {showAllWorkerPreferredStates ? '▲ View Less States' : '▼ View More States'}
                    </button>
                  ) : null}
                  {workerDraft.preferredWorkLocations.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {workerDraft.preferredWorkLocations.map(location => {
                        const cities = getWorkerStateCities(location.stateOptionId)
                        const cityListExpanded = expandedWorkerPreferredCityStates.includes(location.stateOptionId)
                        const visibleCities = cityListExpanded ? cities : cities.slice(0, 5)
                        return (
                          <div key={location.stateOptionId} style={{ border: '1px solid #d7dfeb', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'grid', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{location.stateLabel}</strong>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>{location.cityOptionIds.length} selected</span>
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {visibleCities.length === 0 ? (
                                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No active cities mapped for this state.</p>
                              ) : (
                                visibleCities.map(city => (
                                  <label key={city.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isWorkerPreferredCitySelected(location.stateOptionId, city.id)}
                                      onChange={() => toggleWorkerPreferredCity(location.stateOptionId, city.id)}
                                    />
                                    {city.label || city.value}
                                  </label>
                                ))
                              )}
                            </div>
                            {cities.length > 5 ? (
                              <button
                                type="button"
                                onClick={() => toggleWorkerPreferredCityExpansion(location.stateOptionId)}
                                style={{ ...subtleButtonStyle, justifySelf: 'flex-start', padding: '7px 10px', fontSize: '12px' }}
                              >
                                {cityListExpanded ? '▲ View Less Cities' : '▼ View More Cities'}
                              </button>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Select at least one state, then choose one or more cities.</p>
                  )}
                  {countWorkerPreferredCities() > 0 ? (
                    <div style={{ display: 'grid', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '12px' }}>Available Work Locations</strong>
                      {workerDraft.preferredWorkLocations
                        .filter(location => location.cityLabels.length > 0)
                        .map(location => (
                          <p key={`summary-${location.stateOptionId}`} style={{ margin: 0, color: '#475569', fontSize: '12px' }}>
                            {location.stateLabel}: {location.cityLabels.join(', ')}
                          </p>
                        ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label style={labelStyle}>Experience Years *</label>
                  <select value={String(workerDraft.experienceYears)} onChange={event => setWorkerDraft(current => ({ ...current, experienceYears: Number(event.target.value) || 0 }))} style={inputStyle}>
                    {workerExperienceOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Salary Type</label>
                    <select
                      value={workerDraft.salaryType || DEFAULT_WORKER_SALARY_TYPE}
                      onChange={event => setWorkerDraft(current => ({ ...current, salaryType: event.target.value }))}
                      style={inputStyle}
                    >
                      {workerSalaryTypeOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Minimum Expected Salary/Wage</label>
                    <input
                      type="number"
                      min="0"
                      value={workerDraft.minimumExpectedWage}
                      onChange={event => {
                        const nextMinimum = Number(event.target.value)
                        setWorkerDraft(current => ({
                          ...current,
                          minimumExpectedWage: nextMinimum,
                          expectedDailyWage: nextMinimum > 0 ? nextMinimum : current.maximumExpectedWage
                        }))
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Maximum Expected Salary/Wage</label>
                    <input
                      type="number"
                      min="0"
                      value={workerDraft.maximumExpectedWage}
                      onChange={event => {
                        const nextMaximum = Number(event.target.value)
                        setWorkerDraft(current => ({
                          ...current,
                          maximumExpectedWage: nextMaximum,
                          expectedDailyWage: current.minimumExpectedWage > 0 ? current.minimumExpectedWage : nextMaximum
                        }))
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Balance</label>
                    <input type="number" min="0" value={workerDraft.walletBalance} onChange={event => setWorkerDraft(current => ({ ...current, walletBalance: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Worker Plan</label>
                    <select
                      value={workerDraft.activePlan}
                      onChange={event => {
                        const nextPlanId = event.target.value
                        setWorkerDraft(current =>
                          syncWorkerPlanDraft(
                            {
                              ...current,
                              activePlan: nextPlanId
                            },
                            nextPlanId,
                            true
                          )
                        )
                      }}
                      style={inputStyle}
                    >
                      <option value="">{workerPlanSelectOptions.length === 0 ? 'No active worker plan' : 'Select worker plan'}</option>
                      {workerPlanSelectOptions.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {`${plan.name} — ${formatCurrency(plan.planAmount)} — Valid ${getPlanValidityDays(plan)} days — Daily ${formatCurrency(plan.dailyCharge)}`}
                        </option>
                      ))}
                    </select>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>
                      {selectedWorkerPlan
                        ? 'Assigning a new worker plan applies that plan wallet credit once and uses its daily charge for worker access.'
                        : 'Assign an active worker plan to activate wallet-based worker access in the Rozgar app.'}
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Registration Fee Status</label>
                    <select
                      value={workerDraft.registrationFeePaid ? 'paid' : 'pending'}
                      onChange={event => setWorkerDraft(current => ({
                        ...current,
                        registrationFeePaid: event.target.value === 'paid' || event.target.value === 'free'
                      }))}
                      style={inputStyle}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Plan Start Date</label>
                    <input
                      type="date"
                      value={workerDraft.planValidFrom}
                      onChange={event => {
                        const nextPlanValidFrom = event.target.value
                        setWorkerDraft(current => ({
                          ...current,
                          planValidFrom: nextPlanValidFrom,
                          planValidUntil: selectedWorkerPlan && nextPlanValidFrom
                            ? addDays(nextPlanValidFrom, getPlanValidityDays(selectedWorkerPlan))
                            : current.planValidUntil
                        }))
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Plan End Date</label>
                    <input
                      type="date"
                      value={workerDraft.planValidUntil}
                      onChange={event => setWorkerDraft(current => ({ ...current, planValidUntil: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                {selectedWorkerPlan ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Wallet Credit From Plan</label>
                      <input value={formatCurrency(selectedWorkerPlan.walletCredit)} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Daily Charge From Plan</label>
                      <input value={formatCurrency(selectedWorkerPlan.dailyCharge)} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Plan Validity Days</label>
                      <input value={String(selectedWorkerPlanValidityDays)} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                    </div>
                  </div>
                ) : null}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={workerDraft.status} onChange={event => setWorkerDraft(current => ({ ...current, status: event.target.value as WorkerStatus }))} style={inputStyle}>
                      {workerStatuses.map(status => (
                        <option key={status} value={status}>{getWorkerStatusLabel(status)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Availability</label>
                    <select value={workerDraft.availability} onChange={event => setWorkerDraft(current => ({ ...current, availability: event.target.value as WorkerAvailability }))} style={inputStyle}>
                      {workerAvailabilitySelectOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Skills</label>
                  <input
                    value={workerDraft.skills.join(', ')}
                    onChange={event => setWorkerDraft(current => ({
                      ...current,
                      skills: event.target.value
                        .split(',')
                        .map(skill => skill.trim())
                        .filter(Boolean)
                    }))}
                    placeholder="Enter skills separated by comma"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Categories *</label>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasWorkerIndustrySelection || !hasWorkerBusinessSelection) return
                        setIsWorkerCategoryMenuOpen(current => !current)
                      }}
                      style={{
                        ...inputStyle,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: !hasWorkerIndustrySelection || !hasWorkerBusinessSelection ? '#f8fafc' : '#ffffff',
                        color: workerDraft.categoryIds.length > 0 ? '#0f172a' : '#64748b',
                        cursor: !hasWorkerIndustrySelection || !hasWorkerBusinessSelection ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!hasWorkerIndustrySelection || !hasWorkerBusinessSelection}
                    >
                      <span>
                        {workerDraft.categoryIds.length > 0
                          ? `${workerDraft.categoryIds.length} categor${workerDraft.categoryIds.length === 1 ? 'y' : 'ies'} selected`
                          : 'Select categories'}
                      </span>
                      <span>{isWorkerCategoryMenuOpen ? 'Close' : 'Open'}</span>
                    </button>
                    {workerDraft.categoryIds.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {workerCategoryOptions
                          .filter(category => workerDraft.categoryIds.includes(category.id))
                          .map(category => (
                            <span key={category.id} style={{ borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 10px', fontSize: '12px', fontWeight: '600' }}>
                              {category.name}
                            </span>
                          ))}
                      </div>
                    ) : null}
                    {!hasWorkerIndustrySelection ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Select Industry Category first.</p>
                    ) : !hasWorkerBusinessSelection ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Select Business Type to load mapped categories.</p>
                    ) : !hasMappedCategoriesForWorker && workerDraft.categoryIds.length === 0 ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No categories mapped for this Industry Category and Business Type.</p>
                    ) : null}
                    {isWorkerCategoryMenuOpen && hasWorkerIndustrySelection && hasWorkerBusinessSelection ? (
                      <div style={{ border: '1px solid #d7dfeb', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'grid', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            placeholder="Search categories"
                            value={workerCategorySearch}
                            onChange={event => setWorkerCategorySearch(event.target.value)}
                            style={{ ...inputStyle, flex: '1 1 220px' }}
                          />
                          <button type="button" onClick={() => setWorkerDraft(current => ({ ...current, categoryIds: [] }))} style={subtleButtonStyle}>
                            Clear Selection
                          </button>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>
                          {workerDraft.categoryIds.length} selected
                        </div>
                        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                          {visibleWorkerCategoryOptions.length === 0 ? (
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No categories match the current search.</p>
                          ) : (
                            visibleWorkerCategoryOptions.map(category => (
                              <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                                <input
                                  type="checkbox"
                                  checked={workerDraft.categoryIds.includes(category.id)}
                                  onChange={() => setWorkerDraft(current => ({ ...current, categoryIds: onMultiSelectChange(current.categoryIds, category.id) }))}
                                />
                                {category.name}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
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
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input placeholder="Search workers" value={workerFilters.search} onChange={event => setWorkerFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                    <select value={workerFilters.companyId} onChange={event => setWorkerFilters(current => ({ ...current, companyId: event.target.value }))} style={{ ...inputStyle, width: '190px' }}>
                      <option value="">All Companies</option>
                      {workerCompanyOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select value={workerFilters.status} onChange={event => setWorkerFilters(current => ({ ...current, status: event.target.value as WorkerFilters['status'] }))} style={{ ...inputStyle, width: '210px' }}>
                      <option value="all">All Status</option>
                      {workerStatuses.map(status => (
                        <option key={status} value={status}>{getWorkerStatusLabel(status)}</option>
                      ))}
                    </select>
                    <select value={workerFilters.availability} onChange={event => setWorkerFilters(current => ({ ...current, availability: event.target.value as WorkerFilters['availability'] }))} style={{ ...inputStyle, width: '190px' }}>
                      <option value="all">All Availability</option>
                      {workerAvailabilityFilterOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select value={workerFilters.industryCategory} onChange={event => setWorkerFilters(current => ({ ...current, industryCategory: event.target.value }))} style={{ ...inputStyle, width: '190px' }}>
                      <option value="">All Industry Categories</option>
                      {workerFilterIndustryCategoryOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select
                      value={workerFilters.businessType}
                      onChange={event => setWorkerFilters(current => ({ ...current, businessType: event.target.value }))}
                      style={{ ...inputStyle, width: '180px' }}
                      disabled={!workerFilters.industryCategory}
                    >
                      <option value="">{workerFilters.industryCategory ? 'All Business Types' : 'Select Industry Category first'}</option>
                      {workerFilterBusinessTypeOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
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
                      <option value="needs_correction">Needs Correction</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <input type="date" value={workerFilters.dateFrom} onChange={event => setWorkerFilters(current => ({ ...current, dateFrom: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="From Date" />
                    <input type="date" value={workerFilters.dateTo} onChange={event => setWorkerFilters(current => ({ ...current, dateTo: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="To Date" />
                    <select value={workerFilters.sort} onChange={event => setWorkerFilters(current => ({ ...current, sort: event.target.value as WorkerFilters['sort'] }))} style={{ ...inputStyle, width: '190px' }}>
                      <option value="name_asc">Worker Name A to Z</option>
                      <option value="name_desc">Worker Name Z to A</option>
                      <option value="created_desc">Newest Registered First</option>
                      <option value="created_asc">Oldest Registered First</option>
                    </select>
                    <button onClick={() => setWorkerFilters(blankWorkerFilters)} style={subtleButtonStyle}>Clear Filters</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filteredWorkers.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No workers found for the selected filters.</p>
                      <button onClick={() => setWorkerFilters(blankWorkerFilters)} style={subtleButtonStyle}>Clear Filters</button>
                    </div>
                  ) : (
                    filteredWorkers.map(worker => {
                      const kycTone = getWorkerKycTone(worker)
                      const effectiveWorkerStatus = getEffectiveWorkerStatus(worker)
                      const effectiveWorkerAvailability = getEffectiveWorkerAvailability(worker)
                      const workerAvailabilityFallback =
                        effectiveWorkerAvailability === 'available_today'
                          ? 'Ready to Work today'
                          : effectiveWorkerAvailability === 'available_this_week'
                            ? 'Can join in 7 days'
                            : 'Not available'
                      const workerAvailabilityLabel = resolveLabourMasterLabel(
                        masterOptionsByKey.worker_status_availability || [],
                        effectiveWorkerAvailability,
                        workerAvailabilityFallback
                      )
                      const preferredWorkCityLabels = getWorkerPreferredWorkCityLabels(worker)
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
                              {worker.mobile} | City: {worker.homeCity || worker.city || 'No city'} | {getWorkerStatusLabel(effectiveWorkerStatus)} | {worker.isVisible ? 'Visible' : 'Hidden'} | {formatCurrency(worker.walletBalance)}
                            </p>
                            {preferredWorkCityLabels.length > 0 ? (
                              <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                                Required Work Location: {preferredWorkCityLabels.join(', ')}
                              </p>
                            ) : null}
                            <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                              Categories: {getWorkerCategoryLabel(worker)} | Wage {formatWorkerExpectedWageRange(worker)} | Availability {workerAvailabilityLabel}
                            </p>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                              Address: {worker.address || 'No address added'}
                            </p>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                              Company: {getWorkerCompanyName(worker)} | {getWorkerIndustryCategoryLabel(worker)} | {getWorkerBusinessTypeLabel(worker)}{worker.createdAt ? ` | Registered ${formatDate(worker.createdAt)}` : ''}
                            </p>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                              Plan: {snapshot.plans.find(plan => plan.id === worker.activePlan)?.name || 'No worker plan assigned'} | Valid till: {worker.planValidUntil ? formatDate(worker.planValidUntil) : 'Not set'} | Daily charge: {formatCurrency(snapshot.plans.find(plan => plan.id === worker.activePlan)?.dailyCharge || 0)}
                            </p>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                              Proof: {formatIdentityProofType(worker.identityProofType)} {worker.identityProofNumber ? `| ${worker.identityProofNumber}` : '| No proof number'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                            <button
                              type="button"
                              onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                openWorkerKycReview(worker.id)
                              }}
                              style={subtleButtonStyle}
                            >
                              Review KYC
                            </button>
                            <button
                              type="button"
                              onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                setWorkerDraft(buildWorkerEditorDraft(worker))
                                setWorkerHomeStateId(inferWorkerHomeStateId(worker.homeCity || worker.city))
                                setShowAllWorkerPreferredStates(false)
                                setExpandedWorkerPreferredCityStates([])
                                setEditingWorkerId(worker.id)
                                setIsWorkerCategoryMenuOpen(false)
                                setWorkerCategorySearch('')
                              }}
                              style={subtleButtonStyle}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                void removeEntity('workers', worker.id, worker.fullName)
                              }}
                              style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}
                            >
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
                <div ref={workerKycPanelRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
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
                      Needs correction {snapshot.workers.filter(worker => getWorkerKycState(worker) === 'needs_correction').length}
                    </span>
                    <span style={{ ...subtleButtonStyle, cursor: 'default' }}>
                      Rejected {snapshot.workers.filter(worker => getWorkerKycState(worker) === 'rejected').length}
                    </span>
                  </div>
                </div>

                {!isWorkerKycReviewOpen || !selectedWorkerReview ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Choose a worker from the list and click `Review KYC` to open the review panel.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>{selectedWorkerReview.fullName || 'Unnamed worker'}</p>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                            {selectedWorkerReview.mobile || 'No mobile'} | {selectedWorkerReview.city || 'No city'} | {getWorkerCategoryLabel(selectedWorkerReview)}
                          </p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                            Worker status: {getWorkerStatusLabel(selectedWorkerReview.status)} | KYC state: {getWorkerKycLabel(selectedWorkerReview)} | Company: {getWorkerCompanyName(selectedWorkerReview)} | Industry: {getWorkerIndustryCategoryLabel(selectedWorkerReview)} | Business type: {getWorkerBusinessTypeLabel(selectedWorkerReview)}
                          </p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: getWorkerKycTone(selectedWorkerReview).background, color: getWorkerKycTone(selectedWorkerReview).color, border: `1px solid ${getWorkerKycTone(selectedWorkerReview).border}`, alignSelf: 'flex-start' }}>
                          {getWorkerKycLabel(selectedWorkerReview)}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.createdAt ? formatDateTime(selectedWorkerReview.createdAt) : 'Not available'}</p>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Completed</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.registrationCompletedAt ? formatDateTime(selectedWorkerReview.registrationCompletedAt) : 'Not completed yet'}</p>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Identity Proof</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{formatIdentityProofType(selectedWorkerReview.identityProofType)}</p>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proof Number</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.identityProofNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {!isWorkerKycSubmitted(selectedWorkerReview) ? (
                      <div style={{ border: '1px solid #fed7aa', borderRadius: '14px', background: '#fff7ed', color: '#9a3412', padding: '14px 16px', fontSize: '13px', lineHeight: 1.6 }}>
                        This worker has not submitted the full KYC set yet. You can still mark the review as pending, rejected, or needs correction, but verification requires profile photo, proof type, proof number, proof file, and completed registration.
                      </div>
                    ) : null}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                        <p style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: '700' }}>Profile / Worker Photo</p>
                        {selectedWorkerReview.profilePhotoPath ? (
                          <>
                            {isImageDocumentPath(selectedWorkerReview.profilePhotoPath) ? (
                              <img
                                src={getWorkerDocumentHref(selectedWorkerReview.profilePhotoPath)}
                                alt={`${selectedWorkerReview.fullName} profile`}
                                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px' }}
                              />
                            ) : null}
                            <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>{selectedWorkerReview.profilePhotoPath}</p>
                            <a href={getWorkerDocumentHref(selectedWorkerReview.profilePhotoPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                              View Photo
                            </a>
                          </>
                        ) : (
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>No profile photo uploaded yet.</p>
                        )}
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                        <p style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: '700' }}>Identity Proof Document</p>
                        {selectedWorkerReview.identityProofPath ? (
                          <>
                            {isImageDocumentPath(selectedWorkerReview.identityProofPath) ? (
                              <img
                                src={getWorkerDocumentHref(selectedWorkerReview.identityProofPath)}
                                alt={`${selectedWorkerReview.fullName} identity proof`}
                                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px' }}
                              />
                            ) : null}
                            <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{formatIdentityProofType(selectedWorkerReview.identityProofType)}</p>
                            <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>{selectedWorkerReview.identityProofPath}</p>
                            <a href={getWorkerDocumentHref(selectedWorkerReview.identityProofPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                              View Document
                            </a>
                          </>
                        ) : (
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>No identity proof uploaded yet.</p>
                        )}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>KYC Decision</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            Use existing backend statuses only. Needs Correction saves through the current blocked worker status.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {([
                          { key: 'pending', label: 'Pending', background: '#f8fafc', color: '#475569', border: '#cbd5e1' },
                          { key: 'verified', label: 'Verified', background: '#ecfdf5', color: '#047857', border: '#86efac' },
                          { key: 'rejected', label: 'Rejected', background: '#fff1f2', color: '#be123c', border: '#fda4af' },
                          { key: 'needs_correction', label: 'Needs Correction', background: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' }
                        ] as Array<{ key: WorkerKycReviewDecision; label: string; background: string; color: string; border: string }>).map(option => {
                          const active = workerKycReviewDraft.decision === option.key
                          return (
                            <button
                              type="button"
                              key={option.key}
                              onClick={() => {
                                setWorkerKycReviewDraft(current => ({ ...current, decision: option.key }))
                                setWorkerKycReviewValidation('')
                              }}
                              style={{
                                borderRadius: '999px',
                                border: `1px solid ${active ? option.border : '#d7dfeb'}`,
                                background: active ? option.background : '#ffffff',
                                color: active ? option.color : '#334155',
                                padding: '9px 14px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>

                      <div>
                        <label style={labelStyle}>Remarks / Review Reason</label>
                        <textarea
                          value={workerKycReviewDraft.remarks}
                          onChange={event => {
                            setWorkerKycReviewDraft(current => ({ ...current, remarks: event.target.value }))
                            setWorkerKycReviewValidation('')
                          }}
                          rows={4}
                          placeholder="Enter the rejection, correction, or review reason."
                          style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
                        />
                        {workerKycReviewValidation ? (
                          <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
                            {workerKycReviewValidation}
                          </p>
                        ) : null}
                      </div>

                      {selectedWorkerKycAuditLog ? (
                        <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                          <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>Latest saved KYC note</p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>{selectedWorkerKycAuditLog.summary}</p>
                          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '11px' }}>
                            {selectedWorkerKycAuditLog.actor} • {formatDateTime(selectedWorkerKycAuditLog.createdAt)}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkerDraft(buildWorkerEditorDraft(selectedWorkerReview))
                          setEditingWorkerId(selectedWorkerReview.id)
                          setIsWorkerCategoryMenuOpen(false)
                          setWorkerCategorySearch('')
                        }}
                        style={subtleButtonStyle}
                      >
                        Open in Worker Editor
                      </button>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={closeWorkerKycReview} style={subtleButtonStyle}>Cancel</button>
                        <button type="button" onClick={() => void saveWorkerKycReview()} style={primaryButtonStyle}>Save KYC Review</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'referrals' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Refer & Earn</h2>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>
                    Manage referral profiles and category rewards without changing workers, wallets, KYC, or registration flows.
                  </p>
                </div>
                <button
                  onClick={() => {
                    void fetchReferralSnapshot()
                    void fetchReferralWithdrawals()
                  }}
                  style={subtleButtonStyle}
                  disabled={referralLoading || referralWithdrawalsLoading}
                >
                  <RefreshCw size={16} /> Refresh Referrals
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {([
                  ['dashboard', 'Dashboard'],
                  ['referrers', 'Referrer Workers'],
                  ['tracking', 'Referral Tracking'],
                  ['ledger', 'Reward Ledger'],
                  ['settings', 'Referral Settings'],
                  ['withdrawals', 'Withdrawal Requests']
                ] as Array<[ReferralAdminTab, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setReferralAdminTab(key)}
                    style={referralAdminTab === key ? primaryButtonStyle : subtleButtonStyle}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {referralAdminTab === 'dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                {referralMetricCards.map(card => (
                  <div key={card.label} style={{ ...cardStyle, padding: '16px' }}>
                    <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      {card.label}
                    </p>
                    <p style={{ margin: 0, color: card.accent, fontSize: '24px', fontWeight: 800 }}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {referralAdminTab === 'referrers' && (
              <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '18px' }}>Select Worker 1</h3>
                  <input
                    value={referralWorkerSearch}
                    onChange={event => setReferralWorkerSearch(event.target.value)}
                    placeholder="Search by worker name, ID, mobile, or city"
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {referralWorkerStatusFilterOptions.map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setReferralWorkerStatusFilter(option.key)}
                        style={{
                          ...(referralWorkerStatusFilter === option.key ? primaryButtonStyle : subtleButtonStyle),
                          padding: '8px 10px',
                          fontSize: '12px'
                        }}
                      >
                        {option.label} ({option.count})
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                    {referralWorkerRows.map(worker => {
                      const profile = getReferralProfileByWorkerId(worker.id)
                      return (
                        <button
                          key={worker.id}
                          onClick={() => openReferralWorker(worker.id)}
                          style={{
                            ...subtleButtonStyle,
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            borderColor: selectedReferralWorkerId === worker.id ? '#2563eb' : '#d7dfeb'
                          }}
                        >
                          <span>
                            <strong>{worker.fullName || worker.id}</strong>
                            <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginTop: '3px' }}>
                              {worker.mobile} | KYC {worker.kycStatus || getWorkerKycLabel(worker)}
                            </span>
                          </span>
                          <span style={{ color: profile?.isActive ? '#047857' : '#64748b', fontSize: '12px' }}>
                            {profile?.isActive ? 'Enabled' : profile ? 'Disabled' : 'Not enabled'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={cardStyle}>
                  {!selectedReferralWorker ? (
                    <p style={{ margin: 0, color: '#64748b' }}>Select a worker to manage their permanent referral link and eligible categories.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>{selectedReferralWorker.fullName}</h3>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                            ID: {selectedReferralWorker.id} | Mobile: {selectedReferralWorker.mobile} | KYC: {selectedReferralWorker.kycStatus || getWorkerKycLabel(selectedReferralWorker)}
                          </p>
                          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>
                            Current worker categories: {getWorkerCategoryIds(selectedReferralWorker).map(getCategoryName).join(', ') || 'None'}
                          </p>
                        </div>
                        <button
                          onClick={() => void saveReferralProfileActive(selectedReferralWorker.id, !selectedReferralProfile?.isActive)}
                          disabled={referralSaving}
                          style={selectedReferralProfile?.isActive ? subtleButtonStyle : primaryButtonStyle}
                        >
                          {selectedReferralProfile?.isActive ? 'Disable Refer & Earn' : 'Enable Refer & Earn'}
                        </button>
                      </div>

                      {selectedReferralProfile ? (
                        <>
                          <div style={{ ...compactFilterPanelStyle, alignItems: 'center' }}>
                            <div style={{ flex: '1 1 180px' }}>
                              <label style={labelStyle}>Referral Code</label>
                              <strong style={{ color: '#0f172a', fontSize: '18px' }}>{selectedReferralProfile.referralCode}</strong>
                            </div>
                            <div style={{ flex: '2 1 320px' }}>
                              <label style={labelStyle}>Future Referral Link</label>
                              <code style={{ color: '#334155', fontSize: '13px', wordBreak: 'break-all' }}>
                                https://rozgar.scalevyapar.in/r/{selectedReferralProfile.referralCode}
                              </code>
                              <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                                Public landing page comes in Phase 3; this is display-only in Phase 2.
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: '12px' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>Eligible Categories & Rewards</h4>
                            <div style={{ ...compactFilterPanelStyle, alignItems: 'flex-end' }}>
                              <div style={{ flex: '2 1 260px' }}>
                                <label style={labelStyle}>Search</label>
                                <input
                                  value={referralCategorySearch}
                                  onChange={event => setReferralCategorySearch(event.target.value)}
                                  placeholder="Search industry, business type or worker category..."
                                  style={inputStyle}
                                />
                              </div>
                              <div style={{ flex: '1 1 190px' }}>
                                <label style={labelStyle}>Industry Category</label>
                                <select
                                  value={referralIndustryFilter}
                                  onChange={event => {
                                    setReferralIndustryFilter(event.target.value)
                                    setReferralBusinessTypeFilter('')
                                  }}
                                  style={inputStyle}
                                >
                                  <option value="">All Industries</option>
                                  {referralIndustryOptions.map(option => (
                                    <option key={option.id} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ flex: '1 1 190px' }}>
                                <label style={labelStyle}>Business Type</label>
                                <select
                                  value={referralBusinessTypeFilter}
                                  onChange={event => setReferralBusinessTypeFilter(event.target.value)}
                                  style={inputStyle}
                                  disabled={!referralIndustryFilter}
                                >
                                  <option value="">{referralIndustryFilter ? 'All Business Types' : 'Select Industry first'}</option>
                                  {referralBusinessTypeOptions.map(option => (
                                    <option key={option.id} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '12px', background: '#f8fafc' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                <strong style={{ color: '#0f172a', fontSize: '13px' }}>Selected Categories ({selectedReferralCategorySummaries.length})</strong>
                                <span style={{ color: '#64748b', fontSize: '12px' }}>Selections stay saved while you filter.</span>
                              </div>
                              {selectedReferralCategorySummaries.length === 0 ? (
                                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>No referral categories selected yet.</p>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {selectedReferralCategorySummaries.map(category => (
                                    <span key={category.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: '999px', padding: '7px 10px', fontSize: '12px', fontWeight: 700 }}>
                                      {category.name} - {formatCurrency(Number(category.reward || 0))}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReferralCategoryIds(current => current.filter(id => id !== category.id))}
                                        style={{ border: '0', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                                        aria-label={`Remove ${category.name}`}
                                      >
                                        x
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', background: '#fff' }}>
                              <div style={{ display: 'grid', gap: '0', maxHeight: '430px', overflowY: 'auto' }}>
                                {referralCategoryResultGroups.length === 0 ? (
                                  <p style={{ margin: 0, padding: '16px', color: '#64748b', fontSize: '13px' }}>
                                    No mapped worker categories found for the current search/filter.
                                  </p>
                                ) : referralCategoryResultGroups.map(group => (
                                  <div key={group.key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ padding: '12px 14px', background: '#f8fafc' }}>
                                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>{group.industryLabel}</strong>
                                      <span style={{ color: '#64748b', fontSize: '12px' }}>{group.businessTypeLabel}</span>
                                    </div>
                                    <div style={{ display: 'grid' }}>
                                      {group.rows.map(category => {
                                        const existing = selectedReferralEligibilityByCategory.get(category.id)
                                        const selected = selectedReferralCategoryIds.includes(category.id)
                                        return (
                                          <div key={category.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: '10px', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid #f1f5f9' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>
                                              <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={event => setSelectedReferralCategoryIds(current =>
                                                  event.target.checked
                                                    ? Array.from(new Set([...current, category.id]))
                                                    : current.filter(id => id !== category.id)
                                                )}
                                              />
                                              {category.name}
                                              {existing && !existing.isActive ? <span style={{ color: '#94a3b8', fontSize: '12px' }}>(inactive mapping)</span> : null}
                                            </label>
                                            <input
                                              value={referralRewardDraft[category.id] ?? String(existing?.rewardAmount || 0)}
                                              onChange={event => setReferralRewardDraft(current => ({ ...current, [category.id]: event.target.value.replace(/[^\d.]/g, '') }))}
                                              placeholder="Reward Rs"
                                              style={inputStyle}
                                              disabled={!selected}
                                            />
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button onClick={() => void saveReferralEligibility()} disabled={referralSaving} style={primaryButtonStyle}>
                              Save Category Eligibility
                            </button>
                          </div>
                        </>
                      ) : (
                        <p style={{ margin: 0, color: '#64748b' }}>Enable Refer & Earn to generate one permanent server-side referral code.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {referralAdminTab === 'tracking' && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '18px' }}>Referral Tracking</h3>
                <div style={compactFilterPanelStyle}>
                  <div style={{ minWidth: '260px', flex: '1 1 320px' }}>
                    <label style={labelStyle}>Search Agent</label>
                    <input
                      value={referralTrackingFilters.search}
                      onChange={event => setReferralTrackingFilters(current => ({ ...current, search: event.target.value }))}
                      placeholder="Search agent name, mobile or referral code..."
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ minWidth: '180px', flex: '0 1 240px' }}>
                    <label style={labelStyle}>Agent</label>
                    <select
                      value={referralTrackingFilters.agentWorkerId}
                      onChange={event => setReferralTrackingFilters(current => ({ ...current, agentWorkerId: event.target.value }))}
                      style={inputStyle}
                    >
                      <option value="all">All Agents</option>
                      {referralTrackingAgentOptions.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.label}{agent.mobile ? ` - ${agent.mobile}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReferralTrackingFilters({ search: '', agentWorkerId: 'all' })}
                    style={{ ...subtleButtonStyle, alignSelf: 'flex-end' }}
                  >
                    Clear Filters
                  </button>
                  <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, alignSelf: 'center' }}>
                    Showing {filteredReferralTrackingRows.length} of {referralSnapshot.referrals.length} referrals
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Referral Date', 'Worker 1', 'Worker 1 Mobile', 'Referral Code', 'Worker 2', 'Worker 2 Mobile', 'Category', 'Referral Status', 'KYC Status', 'Reward Snapshot', 'Reward Status', 'Qualified At', 'Action'].map(label => (
                          <th key={label} style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferralTrackingRows.length === 0 ? (
                        <tr><td colSpan={13} style={{ padding: '14px', color: '#64748b' }}>{hasReferralTrackingFilters ? 'No referrals found for the selected filters.' : 'No referrals found yet.'}</td></tr>
                      ) : filteredReferralTrackingRows.map(referral => {
                        const referrer = getWorkerById(referral.referrerWorkerId)
                        const referred = getWorkerById(referral.referredWorkerId)
                        const canCreditReward = referral.referralStatus === 'qualified' && referral.rewardStatus === 'pending'
                        const isRewardCredited = referral.referralStatus === 'qualified' && referral.rewardStatus === 'available'
                        const isCreditingReward = creditingReferralId === referral.id
                        return (
                          <tr key={referral.id}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatDateTime(referral.attributedAt)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referrer?.fullName || referral.referrerWorkerId}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referrer?.mobile || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referral.referralCodeSnapshot}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referred?.fullName || referral.referredWorkerId}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{maskMobile(referred?.mobile || '')}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{getCategoryName(referral.categoryId)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referral.referralStatus}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referred?.kycStatus || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(referral.rewardAmountSnapshot)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referral.rewardStatus}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referral.qualifiedAt ? formatDateTime(referral.qualifiedAt) : '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              {canCreditReward ? (
                                <button
                                  type="button"
                                  onClick={() => void creditReferralReward(referral)}
                                  disabled={Boolean(creditingReferralId)}
                                  style={{
                                    ...primaryButtonStyle,
                                    padding: '7px 10px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    opacity: isCreditingReward ? 0.72 : 1,
                                    cursor: creditingReferralId ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {isCreditingReward ? 'Crediting...' : 'Credit Reward'}
                                </button>
                              ) : isRewardCredited ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 9px',
                                  borderRadius: '999px',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  <CheckCircle size={14} /> Reward Credited
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {referralAdminTab === 'ledger' && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '18px' }}>Reward Ledger</h3>
                <div style={compactFilterPanelStyle}>
                  <div style={{ minWidth: '260px', flex: '1 1 320px' }}>
                    <label style={labelStyle}>Search</label>
                    <input
                      value={referralLedgerFilters.search}
                      onChange={event => setReferralLedgerFilters(current => ({ ...current, search: event.target.value }))}
                      placeholder="Search agent, Worker 2, mobile, referral code..."
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ minWidth: '170px', flex: '1 1 190px' }}>
                    <label style={labelStyle}>Agent</label>
                    <select value={referralLedgerFilters.agentWorkerId} onChange={event => setReferralLedgerFilters(current => ({ ...current, agentWorkerId: event.target.value }))} style={inputStyle}>
                      <option value="all">All Agents</option>
                      {referralLedgerAgentOptions.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.label}{agent.mobile ? ` - ${agent.mobile}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: '170px', flex: '1 1 190px' }}>
                    <label style={labelStyle}>Worker 2</label>
                    <select value={referralLedgerFilters.referredWorkerId} onChange={event => setReferralLedgerFilters(current => ({ ...current, referredWorkerId: event.target.value }))} style={inputStyle}>
                      <option value="all">All Referred Workers</option>
                      {referralLedgerReferredWorkerOptions.map(worker => (
                        <option key={worker.id} value={worker.id}>{worker.label}{worker.mobile ? ` - ${worker.mobile}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: '170px', flex: '1 1 190px' }}>
                    <label style={labelStyle}>Category</label>
                    <select value={referralLedgerFilters.categoryId} onChange={event => setReferralLedgerFilters(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
                      <option value="all">All Categories</option>
                      {referralLedgerCategoryOptions.map(category => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: '150px', flex: '1 1 160px' }}>
                    <label style={labelStyle}>Entry Type</label>
                    <select value={referralLedgerFilters.entryType} onChange={event => setReferralLedgerFilters(current => ({ ...current, entryType: event.target.value }))} style={inputStyle}>
                      <option value="all">All Entry Types</option>
                      {referralLedgerEntryTypeOptions.map(entryType => (
                        <option key={entryType} value={entryType}>{entryType}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: '140px', flex: '1 1 150px' }}>
                    <label style={labelStyle}>Status</label>
                    <select value={referralLedgerFilters.status} onChange={event => setReferralLedgerFilters(current => ({ ...current, status: event.target.value }))} style={inputStyle}>
                      <option value="all">All Statuses</option>
                      {referralLedgerStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: '140px', flex: '1 1 150px' }}>
                    <label style={labelStyle}>Date From</label>
                    <input
                      type="date"
                      value={referralLedgerFilters.dateFrom}
                      onChange={event => {
                        const value = event.currentTarget.value
                        setReferralLedgerFilters(current => ({ ...current, dateFrom: value }))
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ minWidth: '140px', flex: '1 1 150px' }}>
                    <label style={labelStyle}>Date To</label>
                    <input
                      type="date"
                      value={referralLedgerFilters.dateTo}
                      onChange={event => {
                        const value = event.currentTarget.value
                        setReferralLedgerFilters(current => ({ ...current, dateTo: value }))
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <button type="button" onClick={() => setReferralLedgerFilters(blankReferralLedgerFilters)} style={{ ...subtleButtonStyle, alignSelf: 'flex-end' }}>
                    Clear Filters
                  </button>
                  <button type="button" onClick={exportReferralLedgerExcel} style={{ ...subtleButtonStyle, alignSelf: 'flex-end' }}>
                    Export Excel
                  </button>
                  <button type="button" onClick={exportReferralLedgerPdf} style={{ ...subtleButtonStyle, alignSelf: 'flex-end' }}>
                    Export PDF
                  </button>
                  <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, alignSelf: 'center' }}>
                    Showing {filteredReferralLedgerRows.length} of {referralSnapshot.ledger.length} ledger entries
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Date/Time', 'Agent / Worker 1', 'Agent Mobile', 'Worker 2', 'Worker 2 Mobile', 'Referral Code', 'Category', 'Referral ID', 'Entry Type', 'Amount', 'Balance After', 'Status', 'Reference', 'Remarks'].map(label => (
                          <th key={label} style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferralLedgerRows.length === 0 ? (
                        <tr><td colSpan={14} style={{ padding: '14px', color: '#64748b' }}>{hasReferralLedgerFilters ? 'No reward ledger entries found for the selected filters.' : 'No referral ledger entries yet.'}</td></tr>
                      ) : filteredReferralLedgerRows.map(({ entry, referral, agent, referred, categoryName, referralCode }) => {
                        return (
                          <tr key={entry.id}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatDateTime(entry.createdAt)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{agent?.fullName || entry.workerId}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{agent?.mobile || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referred?.fullName || referral?.referredWorkerId || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referred?.mobile || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{referralCode}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{categoryName}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{entry.referralId}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{entry.entryType}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(entry.amount)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(entry.balanceAfter)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{entry.status}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{entry.reference}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{entry.remarks || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {referralAdminTab === 'settings' && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '18px' }}>Referral Settings</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Configure the live Refer & Earn withdrawal threshold without changing payout processing, reward logic, or worker eligibility rules.
                </p>
                <div style={{ ...compactFilterPanelStyle, marginTop: '16px', alignItems: 'end', gridTemplateColumns: 'minmax(220px, 320px) 1fr auto' }}>
                  <div>
                    <label style={labelStyle}>Minimum Withdrawal Amount</label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#475569',
                          fontWeight: 700
                        }}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={String(referralSettingsDraft.minimumWithdrawalAmount || '')}
                        onChange={event => setReferralSettingsDraft(current => ({
                          ...current,
                          minimumWithdrawalAmount: Number(event.target.value || 0)
                        }))}
                        style={{ ...inputStyle, paddingLeft: '32px' }}
                        placeholder="250"
                        disabled={referralSettingsLoading}
                      />
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                      Minimum referral earnings required before an Agent can submit a withdrawal request.
                    </p>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
                    <div><strong style={{ color: '#0f172a' }}>Source:</strong> live referral settings table</div>
                    <div><strong style={{ color: '#0f172a' }}>Last updated:</strong> {referralSettingsDraft.updatedAt || 'Just now after first save'}</div>
                    <div>Category-specific rewards remain managed per referrer worker in the Referrer Workers tab.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveReferralSettings()}
                    disabled={referralSettingsLoading || referralSettingsSaving}
                    style={primaryButtonStyle}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {referralAdminTab === 'withdrawals' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px' }}>Withdrawal Requests</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                        Review Agent referral withdrawal requests. Approval reserves the amount for payout, then approved withdrawals can be marked paid after manual transfer.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void fetchReferralWithdrawals()}
                      style={subtleButtonStyle}
                      disabled={referralWithdrawalsLoading || referralWithdrawalSaving}
                    >
                      <RefreshCw size={16} /> Refresh Requests
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                  {referralWithdrawalMetricCards.map(card => (
                    <div key={card.label} style={{ ...cardStyle, padding: '16px' }}>
                      <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                        {card.label}
                      </p>
                      <p style={{ margin: 0, color: card.accent, fontSize: '24px', fontWeight: 800 }}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <div style={compactFilterPanelStyle}>
                    <div style={{ minWidth: '240px', flex: '2 1 260px' }}>
                      <label style={labelStyle}>Search</label>
                      <input
                        value={referralWithdrawalFilters.search}
                        onChange={event => setReferralWithdrawalFilters(current => ({ ...current, search: event.target.value }))}
                        placeholder="Agent name, mobile, referral code, request ID"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ minWidth: '150px', flex: '1 1 160px' }}>
                      <label style={labelStyle}>Status</label>
                      <select
                        value={referralWithdrawalFilters.status}
                        onChange={event => setReferralWithdrawalFilters(current => ({ ...current, status: event.target.value }))}
                        style={inputStyle}
                      >
                        <option value="all">All Statuses</option>
                        {referralWithdrawalStatusOptions.map(status => (
                          <option key={status} value={status}>{titleCase(status)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ minWidth: '150px', flex: '1 1 160px' }}>
                      <label style={labelStyle}>Payout Method</label>
                      <select
                        value={referralWithdrawalFilters.payoutMethod}
                        onChange={event => setReferralWithdrawalFilters(current => ({ ...current, payoutMethod: event.target.value }))}
                        style={inputStyle}
                      >
                        <option value="all">All Methods</option>
                        {referralWithdrawalMethodOptions.map(method => (
                          <option key={method} value={method}>{method === 'bank' ? 'Bank Account' : 'UPI'}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReferralWithdrawalFilters(blankReferralWithdrawalFilters)}
                      style={{ ...subtleButtonStyle, alignSelf: 'flex-end' }}
                    >
                      Clear Filters
                    </button>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, alignSelf: 'center' }}>
                      Showing {filteredReferralWithdrawalRows.length} of {referralWithdrawalSnapshot.withdrawals.length} withdrawal requests
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {['Request Date', 'Agent', 'Mobile', 'Referral Code', 'Amount', 'Method', 'Destination', 'Status', 'Actions'].map(label => (
                            <th key={label} style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferralWithdrawalRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ padding: '14px', color: '#64748b' }}>
                              {hasReferralWithdrawalFilters ? 'No withdrawal requests found for the selected filters.' : 'No withdrawal requests yet.'}
                            </td>
                          </tr>
                        ) : filteredReferralWithdrawalRows.map(withdrawal => (
                          <tr key={withdrawal.id}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{formatDateTime(withdrawal.requestedAt)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'grid', gap: '4px' }}>
                                <strong style={{ color: '#0f172a' }}>{withdrawal.agentName || withdrawal.workerId}</strong>
                                <span style={{ color: '#64748b', fontSize: '12px' }}>KYC {withdrawal.kycStatus || '-'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{withdrawal.mobile || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{withdrawal.referralCode || '-'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{formatCurrency(withdrawal.amount)}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{withdrawal.payoutMethod === 'bank' ? 'Bank Account' : 'UPI'}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{withdrawal.maskedDestination}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'grid', gap: '4px' }}>
                                <span style={{ fontWeight: 700, color: withdrawal.status === 'rejected' ? '#b91c1c' : withdrawal.status === 'approved' ? '#047857' : '#0f172a' }}>
                                  {titleCase(withdrawal.status)}
                                </span>
                                {withdrawal.status === 'paid' && withdrawal.paidAt ? (
                                  <span style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                                    Paid at: {formatDateTime(withdrawal.paidAt)}
                                  </span>
                                ) : null}
                                {withdrawal.status === 'paid' && withdrawal.paymentReference ? (
                                  <span style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                                    Ref: {withdrawal.paymentReference}
                                  </span>
                                ) : null}
                                {withdrawal.status === 'rejected' && withdrawal.rejectionReason ? (
                                  <span style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                                    Reason: {withdrawal.rejectionReason}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              {withdrawal.status === 'requested' ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => openWithdrawalReview(withdrawal.id, 'approve')}
                                    style={primaryButtonStyle}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openWithdrawalReview(withdrawal.id, 'reject')}
                                    style={subtleButtonStyle}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : withdrawal.status === 'approved' ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => void loadWithdrawalPaymentDetails(withdrawal.id)}
                                    style={subtleButtonStyle}
                                  >
                                    View Payment Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openWithdrawalReview(withdrawal.id, 'mark-paid')}
                                    style={{ ...primaryButtonStyle, background: '#0f766e' }}
                                  >
                                    Pay / Mark Paid
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                                  {withdrawal.status === 'paid' ? 'Paid recorded' : 'No action'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
                    <label style={labelStyle}>Owner Number *</label>
                    <input value={companyDraft.mobile} maxLength={10} onChange={event => setCompanyDraft(current => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Number (WhatsApp)</label>
                    <input value={companyDraft.contactMobile} maxLength={10} onChange={event => setCompanyDraft(current => ({ ...current, contactMobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Industry Category *</label>
                    <select value={companyDraft.industryCategory} onChange={event => setCompanyDraft(current => ({ ...current, industryCategory: event.target.value }))} style={inputStyle}>
                      <option value="">Select industry category</option>
                      {companyIndustryCategoryOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Business Type *</label>
                    <select
                      value={companyDraft.businessType}
                      onChange={event => setCompanyDraft(current => ({ ...current, businessType: event.target.value }))}
                      style={inputStyle}
                      disabled={!hasCompanyIndustrySelection}
                    >
                      <option value="">
                        {hasCompanyIndustrySelection ? 'Select business type' : 'Select industry category first'}
                      </option>
                      {companyBusinessTypeOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {!hasCompanyIndustrySelection ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>Select Industry Category to load Business Types.</p>
                    ) : !hasMappedBusinessTypesForCompany ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>No Business Type mappings found for this Industry Category.</p>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>GST Number</label>
                    <input value={companyDraft.gstNumber} onChange={event => setCompanyDraft(current => ({ ...current, gstNumber: event.target.value.toUpperCase() }))} style={inputStyle} />
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
                </div>
                <div>
                  <label style={labelStyle}>Company Address *</label>
                  <textarea value={companyDraft.companyAddress} onChange={event => setCompanyDraft(current => ({ ...current, companyAddress: event.target.value }))} style={{ ...inputStyle, minHeight: '82px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <select
                      value={companyDraft.state}
                      onChange={event => {
                        const nextState = event.target.value
                        setCompanyDraft(current => {
                          if (!nextState.trim()) {
                            return { ...current, state: nextState }
                          }

                          const nextCityOptions = getCompanyCityOptionsForState(nextState)
                          const hasValidCurrentCity = current.city.trim()
                            ? nextCityOptions.some(city => city.toLowerCase() === current.city.trim().toLowerCase())
                            : false

                          return {
                            ...current,
                            state: nextState,
                            city: hasValidCurrentCity ? current.city : ''
                          }
                        })
                      }}
                      style={inputStyle}
                    >
                      <option value="">Select state</option>
                      {companyStateOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <select value={companyDraft.city} onChange={event => setCompanyDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle}>
                      <option value="">Select city</option>
                      {companyCityOptions.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Area</label>
                    <input value={companyDraft.area} onChange={event => setCompanyDraft(current => ({ ...current, area: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode</label>
                    <input value={companyDraft.pincode} maxLength={6} onChange={event => setCompanyDraft(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={companyDraft.status} onChange={event => setCompanyDraft(current => ({ ...current, status: event.target.value as CompanyStatus }))} style={inputStyle}>
                      {companyStatusOptions.map(option => (
                        <option key={option.id} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>GST Certificate Path</label>
                    <input value={companyDraft.gstCertificatePath} onChange={event => setCompanyDraft(current => ({ ...current, gstCertificatePath: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company Proof Path</label>
                    <input value={companyDraft.companyProofPath} onChange={event => setCompanyDraft(current => ({ ...current, companyProofPath: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Owner ID Proof Path</label>
                    <input value={companyDraft.ownerIdProofPath} onChange={event => setCompanyDraft(current => ({ ...current, ownerIdProofPath: event.target.value }))} style={inputStyle} />
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
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input placeholder="Search companies" value={companyFilters.search} onChange={event => setCompanyFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                  <select value={companyFilters.status} onChange={event => setCompanyFilters(current => ({ ...current, status: event.target.value as CompanyFilters['status'] }))} style={{ ...inputStyle, width: '150px' }}>
                    <option value="all">All Status</option>
                    {companyStatusFilterOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select value={companyFilters.industryCategory} onChange={event => setCompanyFilters(current => ({ ...current, industryCategory: event.target.value }))} style={{ ...inputStyle, width: '190px' }}>
                    <option value="">All Industry Categories</option>
                    {companyFilterIndustryCategoryOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={companyFilters.businessType}
                    onChange={event => setCompanyFilters(current => ({ ...current, businessType: event.target.value }))}
                    style={{ ...inputStyle, width: '180px' }}
                    disabled={!companyFilters.industryCategory}
                  >
                    <option value="">{companyFilters.industryCategory ? 'All Business Types' : 'Select Industry Category first'}</option>
                    {companyFilterBusinessTypeOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
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
                  <input type="date" value={companyFilters.dateFrom} onChange={event => setCompanyFilters(current => ({ ...current, dateFrom: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="From Date" />
                  <input type="date" value={companyFilters.dateTo} onChange={event => setCompanyFilters(current => ({ ...current, dateTo: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="To Date" />
                  <select value={companyFilters.sort} onChange={event => setCompanyFilters(current => ({ ...current, sort: event.target.value as CompanyFilters['sort'] }))} style={{ ...inputStyle, width: '190px' }}>
                    <option value="name_asc">Company Name A to Z</option>
                    <option value="name_desc">Company Name Z to A</option>
                    <option value="created_desc">Newest Registered First</option>
                    <option value="created_asc">Oldest Registered First</option>
                  </select>
                  <button onClick={() => setCompanyFilters(blankCompanyFilters)} style={subtleButtonStyle}>Clear Filters</button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredCompanies.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No companies found for the selected filters.</p>
                    <button onClick={() => setCompanyFilters(blankCompanyFilters)} style={subtleButtonStyle}>Clear Filters</button>
                  </div>
                ) : (
                  filteredCompanies.map(company => (
                    <div key={company.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{company.companyName}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {company.contactPerson} | Owner {company.mobile || 'No owner number'} | Contact {company.contactMobile || company.mobile || 'No contact number'} | {company.city || 'No city'}{company.state ? `, ${company.state}` : ''}{company.area ? ` | ${company.area}` : ''} | {company.status} | {company.registrationFeePaid ? 'Fee paid' : 'Fee pending'}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                          Categories: {getCompanyCategoryLabel(company)} | Plan {getPlanName(company.activePlan)}
                        </p>
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>
                          {getCompanyBusinessTypeLabel(company)} | {getCompanyIndustryCategoryLabel(company)} | Workers {company.workersNeeded || 0} | {company.hiringType || 'No hiring type'}{company.createdAt ? ` | Registered ${formatDate(company.createdAt)}` : ''}
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
              {(() => {
                const selectedJobCompany = getCompanyById(jobPostDraft.companyId)
                const resolvedPublishedAt = jobPostDraft.publishedAt || getTodayDateValue()
                const resolvedValidityDays = resolveJobPostValidityDays(jobPostDraft.validityDays)
                const resolvedExpiresAt = jobPostDraft.expiresAt || addDays(resolvedPublishedAt, resolvedValidityDays)
                return (
                  <>
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
                    <select
                      value={jobPostDraft.categoryId}
                      onChange={event => setJobPostDraft(current => ({ ...current, categoryId: event.target.value }))}
                      style={inputStyle}
                      disabled={!hasSelectedJobCompanyIndustry || !hasSelectedJobCompanyBusiness}
                    >
                      <option value="">
                        {!jobPostDraft.companyId
                          ? 'Select company first'
                          : !hasSelectedJobCompanyIndustry
                            ? 'Company industry category required'
                            : !hasSelectedJobCompanyBusiness
                              ? 'Company business type required'
                              : 'Select category'}
                      </option>
                      {jobPostCategoryOptions.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {!jobPostDraft.companyId ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>Select a company to load its Industry Category and Business Type.</p>
                    ) : !hasSelectedJobCompanyIndustry ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>The selected company needs an Industry Category before categories can load.</p>
                    ) : !hasSelectedJobCompanyBusiness ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>The selected company needs a mapped Business Type before categories can load.</p>
                    ) : jobPostCategoryOptions.length === 0 ? (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>No categories mapped for this Industry Category and Business Type.</p>
                    ) : null}
                  </div>
                </div>
                {selectedJobCompany ? (
                  <div style={{ border: '1px solid #dbeafe', borderRadius: '18px', padding: '12px 14px', background: '#f8fbff' }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: '13px' }}>
                      Company: <strong>{selectedJobCompany.companyName || 'Selected company'}</strong>
                      {selectedJobCompany.mobile ? ` | Contact: ${selectedJobCompany.mobile}` : ''}
                      {selectedJobCompany.city ? ` | City: ${selectedJobCompany.city}` : ''}
                    </p>
                  </div>
                ) : null}
                <div>
                  <label style={labelStyle}>Job Description</label>
                  <textarea value={jobPostDraft.description} onChange={event => setJobPostDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'grid', gap: '12px', background: '#fcfdff' }}>
                  <div>
                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '15px' }}>Job requirement details</div>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                      Add the same workforce requirement details used in the public company job-post form.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Connected Plan</label>
                      <select value={jobPostDraft.connectedPlan} onChange={event => handleJobPostConnectedPlanChange(event.target.value)} style={inputStyle}>
                        <option value="">Select connected plan</option>
                        {activeCompanyPlans.map(plan => (
                          <option key={plan.id} value={plan.name}>{plan.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Worker Category</label>
                      <select value={jobPostDraft.workerCategory} onChange={event => setJobPostDraft(current => ({ ...current, workerCategory: event.target.value }))} style={inputStyle}>
                        <option value="">Select worker category</option>
                        {JOB_POST_WORKER_CATEGORIES.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Gender Preference</label>
                      <select value={jobPostDraft.genderPreference} onChange={event => setJobPostDraft(current => ({ ...current, genderPreference: event.target.value }))} style={inputStyle}>
                        <option value="">Select gender preference</option>
                        {jobGenderOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Age Requirement</label>
                      <input value={jobPostDraft.ageRequirement} onChange={event => setJobPostDraft(current => ({ ...current, ageRequirement: event.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Experience Required</label>
                      <select value={jobPostDraft.experienceRequired} onChange={event => setJobPostDraft(current => ({ ...current, experienceRequired: event.target.value }))} style={inputStyle}>
                        <option value="">Select experience requirement</option>
                        {jobExperienceRequiredOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Job Location</label>
                      <input value={jobPostDraft.jobLocation} onChange={event => setJobPostDraft(current => ({ ...current, jobLocation: event.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Duty Hours</label>
                      <input value={jobPostDraft.dutyHours} onChange={event => setJobPostDraft(current => ({ ...current, dutyHours: event.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Shift Type</label>
                      <select value={jobPostDraft.shiftType} onChange={event => setJobPostDraft(current => ({ ...current, shiftType: event.target.value }))} style={inputStyle}>
                        <option value="">Select shift type</option>
                        {jobShiftTypeOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Weekly Off</label>
                      <select value={jobPostDraft.weeklyOff} onChange={event => setJobPostDraft(current => ({ ...current, weeklyOff: event.target.value }))} style={inputStyle}>
                        <option value="">Select weekly off</option>
                        {jobWeeklyOffOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Job Duration</label>
                      <select value={jobPostDraft.jobDuration} onChange={event => setJobPostDraft(current => ({ ...current, jobDuration: event.target.value }))} style={inputStyle}>
                        <option value="">Select job duration</option>
                        {jobDurationOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Salary Type</label>
                      <select value={jobPostDraft.salaryType} onChange={event => setJobPostDraft(current => ({ ...current, salaryType: event.target.value }))} style={inputStyle}>
                        <option value="">Select salary type</option>
                        {jobSalaryTypeOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Overtime Available</label>
                      <select value={jobPostDraft.overtimeAvailable} onChange={event => setJobPostDraft(current => ({ ...current, overtimeAvailable: event.target.value }))} style={inputStyle}>
                        <option value="">Select overtime option</option>
                        {jobOvertimeOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Food Facility</label>
                      <select value={jobPostDraft.foodFacility} onChange={event => setJobPostDraft(current => ({ ...current, foodFacility: event.target.value }))} style={inputStyle}>
                        <option value="">Select food facility</option>
                        {jobFoodFacilityOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Accommodation</label>
                      <select value={jobPostDraft.accommodation} onChange={event => setJobPostDraft(current => ({ ...current, accommodation: event.target.value }))} style={inputStyle}>
                        <option value="">Select accommodation option</option>
                        {jobAccommodationOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Transport Facility</label>
                      <select value={jobPostDraft.transportFacility} onChange={event => setJobPostDraft(current => ({ ...current, transportFacility: event.target.value }))} style={inputStyle}>
                        <option value="">Select transport facility</option>
                        {jobTransportFacilityOptions.map(option => (
                          <option key={option.id} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Submission Mode</label>
                      <input value={jobPostDraft.submissionMode || 'Pending review for publish'} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Required Skills</label>
                      <input value={jobPostDraft.requiredSkills} onChange={event => setJobPostDraft(current => ({ ...current, requiredSkills: event.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Special Instructions</label>
                      <textarea value={jobPostDraft.specialInstructions} onChange={event => setJobPostDraft(current => ({ ...current, specialInstructions: event.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Languages Preferred</label>
                      <input value={jobPostDraft.languagesPreferred} onChange={event => setJobPostDraft(current => ({ ...current, languagesPreferred: event.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <select value={jobPostDraft.city} onChange={event => setJobPostDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle}>
                      {getCitySelectOptions(jobPostDraft.city).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Workers Needed - Quantity</label>
                    <input type="number" min="1" value={jobPostDraft.workersNeeded} onChange={event => setJobPostDraft(current => ({ ...current, workersNeeded: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Area / Locality</label>
                    <input
                      value={jobPostDraft.locationLabel}
                      onChange={event => setJobPostDraft(current => ({ ...current, locationLabel: event.target.value }))}
                      placeholder="Ajmer Road, Dholai, Gandhi Path"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={jobPostDraft.latitude}
                      onChange={event => setJobPostDraft(current => ({ ...current, latitude: event.target.value === '' ? '' : Number(event.target.value) }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={jobPostDraft.longitude}
                      onChange={event => setJobPostDraft(current => ({ ...current, longitude: event.target.value === '' ? '' : Number(event.target.value) }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Salary Amount</label>
                    <input type="number" min="0" value={jobPostDraft.wageAmount} onChange={event => setJobPostDraft(current => ({ ...current, wageAmount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Validity Days</label>
                    <input
                      type="number"
                      min="1"
                      value={resolvedValidityDays}
                      onChange={event => handleJobPostValidityDaysChange(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={jobPostDraft.status || 'draft'} onChange={event => setJobPostDraft(current => ({ ...current, status: event.target.value as JobPostStatus }))} style={inputStyle}>
                      {jobPostStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Published At</label>
                    <input
                      type="date"
                      value={jobPostDraft.publishedAt || ''}
                      onChange={event => handleJobPostPublishedAtChange(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Expires At</label>
                    <input
                      type="date"
                      value={jobPostDraft.expiresAt || resolvedExpiresAt}
                      onChange={event => handleJobPostExpiresAtChange(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveJobPost} style={primaryButtonStyle}>Save Job Post</button>
                  <button onClick={resetJobPostDraft} style={subtleButtonStyle}>Reset</button>
                </div>
              </div>
                  </>
                )
              })()}
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
                  <select value={jobFilters.industryCategory} onChange={event => setJobFilters(current => ({ ...current, industryCategory: event.target.value }))} style={{ ...inputStyle, width: '190px' }}>
                    <option value="">All Industry Categories</option>
                    {jobFilterIndustryCategoryOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={jobFilters.businessType}
                    onChange={event => setJobFilters(current => ({ ...current, businessType: event.target.value }))}
                    style={{ ...inputStyle, width: '180px' }}
                    disabled={!jobFilters.industryCategory}
                  >
                    <option value="">{jobFilters.industryCategory ? 'All Business Types' : 'Select Industry Category first'}</option>
                    {jobFilterBusinessTypeOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input type="date" value={jobFilters.dateFrom} onChange={event => setJobFilters(current => ({ ...current, dateFrom: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="From Date" />
                  <input type="date" value={jobFilters.dateTo} onChange={event => setJobFilters(current => ({ ...current, dateTo: event.target.value }))} style={{ ...inputStyle, width: '155px' }} aria-label="To Date" />
                  <select value={jobFilters.sort} onChange={event => setJobFilters(current => ({ ...current, sort: event.target.value as JobFilters['sort'] }))} style={{ ...inputStyle, width: '210px' }}>
                    <option value="title_asc">Job Title A to Z</option>
                    <option value="title_desc">Job Title Z to A</option>
                    <option value="created_desc">Newest Job Posts First</option>
                    <option value="created_asc">Oldest Job Posts First</option>
                    <option value="company_asc">Company Name A to Z</option>
                    <option value="company_desc">Company Name Z to A</option>
                  </select>
                  <button onClick={() => setJobFilters(blankJobFilters)} style={subtleButtonStyle}>Clear Filters</button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredJobPosts.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No job posts found for the selected filters.</p>
                    <button onClick={() => setJobFilters(blankJobFilters)} style={subtleButtonStyle}>Clear Filters</button>
                  </div>
                ) : (
                  filteredJobPosts.map(jobPost => {
                    const effectiveStatus = isExpiredJobPost(jobPost) ? 'expired' : jobPost.status

                    return (
                      <div key={jobPost.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{jobPost.title}</p>
                        <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                          {getJobPostCompanyName(jobPost)} | {getCategoryName(jobPost.categoryId)} | {jobPost.city || 'No city'} | {effectiveStatus}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>
                          {getJobPostBusinessTypeLabel(jobPost)} | {getJobPostIndustryCategoryLabel(jobPost)}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>
                          {jobPost.locationLabel || 'No area/locality'} | Lat {jobPost.latitude === '' ? '—' : jobPost.latitude} | Lng {jobPost.longitude === '' ? '—' : jobPost.longitude}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{jobPost.description || 'No description yet.'}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                            {jobPost.workersNeeded} workers | {formatCurrency(jobPost.wageAmount)} | Job live {jobPost.validityDays} days | Live period {formatDate(jobPost.publishedAt)}{jobPost.expiresAt ? ` to ${formatDate(jobPost.expiresAt)}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <button onClick={() => { setJobPostDraft(parseJobPostDraft(jobPost, getCompanyActivePlan(jobPost.companyId)?.name || '')); setEditingJobPostId(jobPost.id) }} style={subtleButtonStyle}>Edit</button>
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
                        Owner number: {getCompanyById(selectedJobApplication.companyId)?.mobile || 'Not available'}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '13px' }}>
                        Contact number: {getCompanyById(selectedJobApplication.companyId)?.contactMobile || getCompanyById(selectedJobApplication.companyId)?.mobile || 'Not available'}
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
                        const relatedEntityType = requestType === 'company_follow_up' ? 'company' : 'worker'
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
                      <option value="worker_support">worker_support</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Related Entity *</label>
                    <select
                      value={rechargeRequestDraft.relatedEntityId}
                      onChange={event => {
                        const relatedEntityId = event.target.value
                        const relatedEntityType = rechargeRequestDraft.requestType === 'company_follow_up' ? 'company' : 'worker'
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
                        <option value="">Select {rechargeRequestDraft.requestType === 'company_follow_up' ? 'company' : 'worker'}</option>
                        {(rechargeRequestDraft.requestType === 'company_follow_up' ? snapshot.companies : snapshot.workers).map(entity => (
                          <option key={entity.id} value={entity.id}>{rechargeRequestDraft.requestType === 'company_follow_up' ? (entity as LabourCompany).companyName : (entity as LabourWorker).fullName}</option>
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

        {activeSection === 'supportRequests' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Support requests from worker app</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Review workers who tapped Help in the Rozgar app. Open now: {openSupportRequestsCount}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input placeholder="Search support requests" value={rechargeFilters.search} onChange={event => setRechargeFilters(current => ({ ...current, search: event.target.value }))} style={{ ...inputStyle, width: '220px' }} />
                <select value={rechargeFilters.priority} onChange={event => setRechargeFilters(current => ({ ...current, priority: event.target.value as RechargeFilters['priority'] }))} style={{ ...inputStyle, width: '130px' }}>
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
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
              {filteredSupportRequests.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No support requests match the current filters.</p>
              ) : (
                filteredSupportRequests.map(request => (
                  <div key={request.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1.15fr 0.7fr 0.7fr 0.5fr 0.6fr 0.6fr', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{request.name}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Worker Support | {request.statusLabel}</p>
                      <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>{request.note}</p>
                    </div>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{request.city || 'No city'}</p>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{request.categoryLabel || 'Unassigned'}</p>
                    <p style={{ margin: 0, color: request.priority === 'high' ? '#b91c1c' : request.priority === 'medium' ? '#b45309' : '#2563eb', fontSize: '12px', fontWeight: '700' }}>
                      {titleCase(request.priority)}
                    </p>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '12px', fontWeight: '700' }}>{titleCase(request.requestStatus)}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => {
                          setRechargeRequestDraft(request)
                          setEditingRechargeRequestId(request.id)
                          setActiveSection('rechargeRequests')
                        }}
                        style={subtleButtonStyle}
                      >
                        Edit
                      </button>
                      <button onClick={() => void removeEntity('rechargeRequests', request.id, request.name)} style={{ ...subtleButtonStyle, background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'workerRechargeHistory' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>History Rows</p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{filteredWorkerRechargeHistoryRows.length}</p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recharge Credits</p>
                <p style={{ margin: 0, color: '#047857', fontSize: '24px', fontWeight: '800' }}>
                  {formatCurrency(
                    filteredWorkerRechargeHistoryRows
                      .filter(transaction => transaction.direction === 'credit')
                      .reduce((total, transaction) => total + transaction.amount, 0)
                  )}
                </p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deductions</p>
                <p style={{ margin: 0, color: '#b45309', fontSize: '24px', fontWeight: '800' }}>
                  {formatCurrency(
                    filteredWorkerRechargeHistoryRows
                      .filter(transaction => transaction.direction === 'debit')
                      .reduce((total, transaction) => total + transaction.amount, 0)
                  )}
                </p>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Worker Recharge & Deduction History</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    Read-only ledger view for worker wallet recharges, deductions, and manual wallet corrections.
                  </p>
                </div>
                <button onClick={() => setActiveSection('walletTransactions')} style={subtleButtonStyle}>
                  Open Wallet Transactions
                </button>
              </div>
              <div style={compactFilterPanelStyle}>
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={labelStyle}>Search</label>
                  <input
                    placeholder="Worker name or mobile"
                    value={workerRechargeHistoryFilters.search}
                    onChange={event => setWorkerRechargeHistoryFilters(current => ({ ...current, search: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '160px' }}>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={workerRechargeHistoryFilters.type}
                    onChange={event => setWorkerRechargeHistoryFilters(current => ({ ...current, type: event.target.value as WorkerRechargeHistoryFilters['type'] }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="recharge">Recharge</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date From</label>
                  <input
                    type="date"
                    value={workerRechargeHistoryFilters.dateFrom}
                    onChange={event => setWorkerRechargeHistoryFilters(current => ({ ...current, dateFrom: event.target.value }))}
                    style={inputStyle}
                    aria-label="Worker history from date"
                  />
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date To</label>
                  <input
                    type="date"
                    value={workerRechargeHistoryFilters.dateTo}
                    onChange={event => setWorkerRechargeHistoryFilters(current => ({ ...current, dateTo: event.target.value }))}
                    style={inputStyle}
                    aria-label="Worker history to date"
                  />
                </div>
                <button onClick={() => setWorkerRechargeHistoryFilters(blankWorkerRechargeHistoryFilters)} style={subtleButtonStyle}>
                  Clear Filters
                </button>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredWorkerRechargeHistoryRows.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {workerRechargeHistoryRows.length === 0
                        ? 'No worker recharge or deduction history is available yet.'
                        : 'No worker recharge or deduction history matches the current filters.'}
                    </p>
                    <button onClick={() => setWorkerRechargeHistoryFilters(blankWorkerRechargeHistoryFilters)} style={subtleButtonStyle}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredWorkerRechargeHistoryRows.map(transaction => (
                    <div key={transaction.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1.2fr 0.7fr 0.75fr 0.65fr 0.7fr', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{transaction.entityName}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                          {titleCase(transaction.transactionType)} | {transaction.reference || 'No reference'}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>{transaction.note || 'No note added'}</p>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{transaction.city || 'No city'}</p>
                      <p style={{ margin: 0, color: transaction.direction === 'credit' ? '#047857' : '#b45309', fontSize: '13px', fontWeight: '700' }}>
                        {transaction.direction === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                      <p style={{ margin: 0, color: transaction.status === 'completed' ? '#2563eb' : transaction.status === 'failed' ? '#b91c1c' : '#b45309', fontSize: '12px', fontWeight: '700' }}>
                        {titleCase(transaction.status)}
                      </p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{formatDateTime(transaction.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              {isWorkerKycReviewOpen && selectedWorkerReview ? (
                <div
                  onClick={closeWorkerKycReview}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.58)',
                    zIndex: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                  }}
                >
                  <div
                    onClick={event => event.stopPropagation()}
                    style={{
                      width: 'min(960px, 100%)',
                      maxHeight: 'calc(100vh - 48px)',
                      overflowY: 'auto',
                      background: '#ffffff',
                      borderRadius: '24px',
                      boxShadow: '0 30px 80px rgba(15, 23, 42, 0.24)',
                      padding: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                      <div>
                        <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '22px' }}>Worker KYC Review</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                          Review worker documents, update the KYC outcome, and save the status directly from this panel.
                        </p>
                      </div>
                      <button type="button" onClick={closeWorkerKycReview} style={subtleButtonStyle}>Close</button>
                    </div>

                    <div style={{ display: 'grid', gap: '18px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>{selectedWorkerReview.fullName || 'Unnamed worker'}</p>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '13px' }}>
                              {selectedWorkerReview.mobile || 'No mobile'} | {selectedWorkerReview.city || 'No city'} | {getWorkerCategoryLabel(selectedWorkerReview)}
                            </p>
                            <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                              Worker status: {getWorkerStatusLabel(selectedWorkerReview.status)} | KYC state: {getWorkerKycLabel(selectedWorkerReview)} | Industry: {getWorkerIndustryCategoryLabel(selectedWorkerReview)} | Business type: {getWorkerBusinessTypeLabel(selectedWorkerReview)}
                            </p>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '800', borderRadius: '999px', padding: '8px 12px', background: getWorkerKycTone(selectedWorkerReview).background, color: getWorkerKycTone(selectedWorkerReview).color, border: `1px solid ${getWorkerKycTone(selectedWorkerReview).border}`, alignSelf: 'flex-start' }}>
                            {getWorkerKycLabel(selectedWorkerReview)}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created</p>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.createdAt ? formatDateTime(selectedWorkerReview.createdAt) : 'Not available'}</p>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Completed</p>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.registrationCompletedAt ? formatDateTime(selectedWorkerReview.registrationCompletedAt) : 'Not completed yet'}</p>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Identity Proof</p>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{formatIdentityProofType(selectedWorkerReview.identityProofType)}</p>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                            <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proof Number</p>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{selectedWorkerReview.identityProofNumber || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      {!isWorkerKycSubmitted(selectedWorkerReview) ? (
                        <div style={{ border: '1px solid #fed7aa', borderRadius: '14px', background: '#fff7ed', color: '#9a3412', padding: '14px 16px', fontSize: '13px', lineHeight: 1.6 }}>
                          This worker has not submitted the full KYC set yet. You can still mark the review as pending, rejected, or needs correction, but verification requires profile photo, proof type, proof number, proof file, and completed registration.
                        </div>
                      ) : null}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                          <p style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: '700' }}>Profile / Worker Photo</p>
                          {selectedWorkerReview.profilePhotoPath ? (
                            <>
                              {isImageDocumentPath(selectedWorkerReview.profilePhotoPath) ? (
                                <img
                                  src={getWorkerDocumentHref(selectedWorkerReview.profilePhotoPath)}
                                  alt={`${selectedWorkerReview.fullName} profile`}
                                  style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px' }}
                                />
                              ) : null}
                              <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>{selectedWorkerReview.profilePhotoPath}</p>
                              <a href={getWorkerDocumentHref(selectedWorkerReview.profilePhotoPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                                View Photo
                              </a>
                            </>
                          ) : (
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>No profile photo uploaded yet.</p>
                          )}
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                          <p style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: '700' }}>Identity Proof Document</p>
                          {selectedWorkerReview.identityProofPath ? (
                            <>
                              {isImageDocumentPath(selectedWorkerReview.identityProofPath) ? (
                                <img
                                  src={getWorkerDocumentHref(selectedWorkerReview.identityProofPath)}
                                  alt={`${selectedWorkerReview.fullName} identity proof`}
                                  style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px' }}
                                />
                              ) : null}
                              <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{formatIdentityProofType(selectedWorkerReview.identityProofType)}</p>
                              <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', wordBreak: 'break-word' }}>{selectedWorkerReview.identityProofPath}</p>
                              <a href={getWorkerDocumentHref(selectedWorkerReview.identityProofPath)} target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex' }}>
                                View Document
                              </a>
                            </>
                          ) : (
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>No identity proof uploaded yet.</p>
                          )}
                        </div>
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>KYC Decision</p>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                              Use existing backend statuses only. “Needs Correction” saves through the current blocked worker status.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          {([
                            { key: 'pending', label: 'Pending', background: '#f8fafc', color: '#475569', border: '#cbd5e1' },
                            { key: 'verified', label: 'Verified', background: '#ecfdf5', color: '#047857', border: '#86efac' },
                            { key: 'rejected', label: 'Rejected', background: '#fff1f2', color: '#be123c', border: '#fda4af' },
                            { key: 'needs_correction', label: 'Needs Correction', background: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' }
                          ] as Array<{ key: WorkerKycReviewDecision; label: string; background: string; color: string; border: string }>).map(option => {
                            const active = workerKycReviewDraft.decision === option.key
                            return (
                                <button
                                  type="button"
                                  key={option.key}
                                  onClick={() => {
                                    setWorkerKycReviewDraft(current => ({ ...current, decision: option.key }))
                                    setWorkerKycReviewValidation('')
                                  }}
                                style={{
                                  borderRadius: '999px',
                                  border: `1px solid ${active ? option.border : '#d7dfeb'}`,
                                  background: active ? option.background : '#ffffff',
                                  color: active ? option.color : '#334155',
                                  padding: '9px 14px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>

                        <div>
                          <label style={labelStyle}>Remarks / Review Reason</label>
                          <textarea
                            value={workerKycReviewDraft.remarks}
                            onChange={event => {
                              setWorkerKycReviewDraft(current => ({ ...current, remarks: event.target.value }))
                              setWorkerKycReviewValidation('')
                            }}
                            rows={4}
                            placeholder="Enter the rejection, correction, or review reason."
                            style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
                          />
                          {workerKycReviewValidation ? (
                            <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
                              {workerKycReviewValidation}
                            </p>
                          ) : null}
                        </div>

                        {selectedWorkerKycAuditLog ? (
                          <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                            <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>Latest saved KYC note</p>
                            <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>{selectedWorkerKycAuditLog.summary}</p>
                            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '11px' }}>
                              {selectedWorkerKycAuditLog.actor} • {formatDateTime(selectedWorkerKycAuditLog.createdAt)}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={closeWorkerKycReview} style={subtleButtonStyle}>Cancel</button>
                        <button type="button" onClick={() => void saveWorkerKycReview()} style={primaryButtonStyle}>Save KYC Review</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeSection === 'jobPostPaymentHistory' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jobs With Activity</p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{filteredJobPostPaymentHistoryRows.length}</p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>With Billing Row</p>
                <p style={{ margin: 0, color: '#1d4ed8', fontSize: '24px', fontWeight: '800' }}>{filteredJobPostPaymentHistoryRows.filter(row => row.latestBillingRow).length}</p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Open Follow-ups</p>
                <p style={{ margin: 0, color: '#b45309', fontSize: '24px', fontWeight: '800' }}>{filteredJobPostPaymentHistoryRows.filter(row => row.latestFollowUp?.requestStatus === 'open').length}</p>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Job Post Recharge & Payment History</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    This read-only view uses the current company billing ledger and payment follow-up queue because the live labour dataset does not store separate per-job-post payment rows yet.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveSection('companyBillingHistory')} style={subtleButtonStyle}>Open Company Billing History</button>
                  <button onClick={() => setActiveSection('rechargeRequests')} style={subtleButtonStyle}>Open Recharge Requests</button>
                </div>
              </div>
              <div style={compactFilterPanelStyle}>
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={labelStyle}>Company Name</label>
                  <input
                    placeholder="Search by company name"
                    value={jobPostPaymentHistoryFilters.searchCompanyName}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, searchCompanyName: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '170px' }}>
                  <label style={labelStyle}>Company Mobile</label>
                  <input
                    placeholder="Search by mobile"
                    value={jobPostPaymentHistoryFilters.searchCompanyMobile}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, searchCompanyMobile: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={labelStyle}>Job Title</label>
                  <input
                    placeholder="Search by job title"
                    value={jobPostPaymentHistoryFilters.searchJobTitle}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, searchJobTitle: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '170px' }}>
                  <label style={labelStyle}>Payment Type</label>
                  <select
                    value={jobPostPaymentHistoryFilters.paymentType}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, paymentType: event.target.value as JobPostPaymentHistoryFilters['paymentType'] }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="recharge">Recharge</option>
                    <option value="payment">Payment</option>
                    <option value="deduction">Deduction</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ width: '150px' }}>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={jobPostPaymentHistoryFilters.status}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, status: event.target.value as JobPostPaymentHistoryFilters['status'] }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="rejected">Rejected</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date From</label>
                  <input
                    type="date"
                    value={jobPostPaymentHistoryFilters.dateFrom}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, dateFrom: event.target.value }))}
                    style={inputStyle}
                    aria-label="Job payment history from date"
                  />
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date To</label>
                  <input
                    type="date"
                    value={jobPostPaymentHistoryFilters.dateTo}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, dateTo: event.target.value }))}
                    style={inputStyle}
                    aria-label="Job payment history to date"
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <label style={labelStyle}>Amount Min</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={jobPostPaymentHistoryFilters.amountMin}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, amountMin: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <label style={labelStyle}>Amount Max</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={jobPostPaymentHistoryFilters.amountMax}
                    onChange={event => setJobPostPaymentHistoryFilters(current => ({ ...current, amountMax: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <button onClick={() => setJobPostPaymentHistoryFilters(blankJobPostPaymentHistoryFilters)} style={subtleButtonStyle}>
                  Clear Filters
                </button>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredJobPostPaymentHistoryRows.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {jobPostPaymentHistoryRows.length === 0
                        ? 'No job posts currently have related company billing or follow-up activity.'
                        : 'No job post recharge or payment history matches the current filters.'}
                    </p>
                    <button onClick={() => setJobPostPaymentHistoryFilters(blankJobPostPaymentHistoryFilters)} style={subtleButtonStyle}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredJobPostPaymentHistoryRows.map(row => (
                    <div key={row.jobPost.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{row.jobPost.title}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                          {(row.company?.companyName || getCompanyName(row.jobPost.companyId))} | {row.company?.contactMobile || row.company?.mobile || 'No mobile'} | {row.jobPost.id}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px' }}>
                          Job status {titleCase(row.jobPost.status)} | Published {formatDate(row.jobPost.publishedAt)} | Expires {formatDate(row.jobPost.expiresAt)}
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Date / Time</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{formatDateTime(row.activityTimestamp)}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Payment Type</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{titleCase(row.trackingType)}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Amount</p>
                          <p style={{ margin: 0, color: '#1d4ed8', fontSize: '12px', fontWeight: '700' }}>{formatCurrency(row.trackingAmount)}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Status</p>
                          <p style={{ margin: 0, color: row.trackingStatus === 'success' ? '#2563eb' : row.trackingStatus === 'failed' ? '#b91c1c' : row.trackingStatus === 'pending' ? '#b45309' : '#475569', fontSize: '12px', fontWeight: '700' }}>
                            {titleCase(row.trackingStatus)}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Source</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{row.trackingSource}</p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Reference ID</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{row.trackingReferenceId || 'Not available'}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Notes / Reason</p>
                          <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{row.trackingNote || 'No note added'}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Related Job Status</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{titleCase(row.jobPost.status)}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Tracked Types</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{row.paymentTypes.map(type => titleCase(type)).join(', ') || 'Payment'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'companyBillingHistory' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Billing Rows</p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{filteredCompanyBillingHistoryRows.length}</p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed Billing</p>
                <p style={{ margin: 0, color: '#047857', fontSize: '24px', fontWeight: '800' }}>
                  {formatCurrency(
                    filteredCompanyBillingHistoryRows
                      .filter(transaction => transaction.status === 'completed')
                      .reduce((total, transaction) => total + transaction.amount, 0)
                  )}
                </p>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending / Attention</p>
                <p style={{ margin: 0, color: '#b45309', fontSize: '24px', fontWeight: '800' }}>{filteredCompanyBillingHistoryRows.filter(transaction => transaction.status !== 'completed').length}</p>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Company Billing History</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                    Read-only history of company registration fees, plan purchases, wallet recharges, and manual billing adjustments.
                  </p>
                </div>
                <button onClick={() => setActiveSection('walletTransactions')} style={subtleButtonStyle}>
                  Open Wallet Transactions
                </button>
              </div>
              <div style={compactFilterPanelStyle}>
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={labelStyle}>Search</label>
                  <input
                    placeholder="Company name or mobile"
                    value={companyBillingHistoryFilters.search}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, search: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '170px' }}>
                  <label style={labelStyle}>Billing Type</label>
                  <select
                    value={companyBillingHistoryFilters.billingType}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, billingType: event.target.value as CompanyBillingHistoryFilters['billingType'] }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="recharge">Recharge</option>
                    <option value="subscription">Subscription</option>
                    <option value="payment">Payment</option>
                    <option value="deduction">Deduction</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ width: '150px' }}>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={companyBillingHistoryFilters.status}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, status: event.target.value as CompanyBillingHistoryFilters['status'] }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="rejected">Rejected</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date From</label>
                  <input
                    type="date"
                    value={companyBillingHistoryFilters.dateFrom}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, dateFrom: event.target.value }))}
                    style={inputStyle}
                    aria-label="Company billing history from date"
                  />
                </div>
                <div style={{ width: '155px' }}>
                  <label style={labelStyle}>Date To</label>
                  <input
                    type="date"
                    value={companyBillingHistoryFilters.dateTo}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, dateTo: event.target.value }))}
                    style={inputStyle}
                    aria-label="Company billing history to date"
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <label style={labelStyle}>Amount Min</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={companyBillingHistoryFilters.amountMin}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, amountMin: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <label style={labelStyle}>Amount Max</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={companyBillingHistoryFilters.amountMax}
                    onChange={event => setCompanyBillingHistoryFilters(current => ({ ...current, amountMax: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <button onClick={() => setCompanyBillingHistoryFilters(blankCompanyBillingHistoryFilters)} style={subtleButtonStyle}>
                  Clear Filters
                </button>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredCompanyBillingHistoryRows.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {companyBillingHistoryRows.length === 0
                        ? 'No company billing history is available yet.'
                        : 'No company billing history matches the current filters.'}
                    </p>
                    <button onClick={() => setCompanyBillingHistoryFilters(blankCompanyBillingHistoryFilters)} style={subtleButtonStyle}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredCompanyBillingHistoryRows.map(transaction => (
                    <div key={transaction.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{transaction.entityName}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                          {getCompanyById(transaction.entityId)?.contactMobile || getCompanyById(transaction.entityId)?.mobile || 'No mobile'} | {transaction.reference || transaction.id}
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Date / Time</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{formatDateTime(transaction.createdAt)}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Billing Type</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{titleCase(getCompanyBillingHistoryType(transaction))}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Status</p>
                          <p style={{ margin: 0, color: normalizeLedgerStatus(transaction.status) === 'success' ? '#2563eb' : normalizeLedgerStatus(transaction.status) === 'failed' ? '#b91c1c' : normalizeLedgerStatus(transaction.status) === 'pending' ? '#b45309' : '#475569', fontSize: '12px', fontWeight: '700' }}>
                            {titleCase(normalizeLedgerStatus(transaction.status))}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Amount</p>
                          <p style={{ margin: 0, color: transaction.direction === 'credit' ? '#047857' : '#b45309', fontSize: '12px', fontWeight: '700' }}>
                            {transaction.direction === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Reference ID</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '12px' }}>{transaction.reference || transaction.id}</p>
                        </div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Notes / Reason</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{transaction.note || 'No note added'}</p>
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
                      <span>{getWorkerStatusLabel(item.status)}</span>
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
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Worker app languages</h3>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    Control the first language-selection page for new worker installs. Only enabled languages will be shown inside the worker app.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {workerLanguageOptions.map(option => {
                      const selected = settingsDraft.workerLanguageControls.enabledWorkerLanguageCodes.includes(option.code)
                      return (
                        <label key={option.code} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '999px', border: selected ? '1px solid #1d4ed8' : '1px solid #cbd5e1', background: selected ? '#eff6ff' : '#fff', color: selected ? '#1d4ed8' : '#334155', fontSize: '12px', fontWeight: '700' }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={event => toggleWorkerLanguage(option.code, event.target.checked)}
                          />
                          {option.label}
                        </label>
                      )
                    })}
                  </div>
                  <select
                    value={settingsDraft.workerLanguageControls.defaultWorkerLanguageCode}
                    onChange={event => setSettingsDraft(current => ({
                      ...current,
                      workerLanguageControls: {
                        ...current.workerLanguageControls,
                        defaultWorkerLanguageCode: event.target.value
                      }
                    }))}
                    style={inputStyle}
                  >
                    {settingsDraft.workerLanguageControls.enabledWorkerLanguageCodes.map(code => {
                      const option = workerLanguageOptions.find(item => item.code === code)
                      return (
                        <option key={code} value={code}>
                          Default: {option?.label ?? code}
                        </option>
                      )
                    })}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={settingsDraft.workerLanguageControls.showLanguageSelectionOnFirstOpen}
                      onChange={event => setSettingsDraft(current => ({
                        ...current,
                        workerLanguageControls: {
                          ...current.workerLanguageControls,
                          showLanguageSelectionOnFirstOpen: event.target.checked
                        }
                      }))}
                    />
                    Show language selection on the very first app open
                  </label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc', color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    Current worker app language setup: {settingsDraft.workerLanguageControls.enabledWorkerLanguageCodes.map(code => workerLanguageOptions.find(option => option.code === code)?.label ?? code).join(', ')}. Default language: {workerLanguageOptions.find(option => option.code === settingsDraft.workerLanguageControls.defaultWorkerLanguageCode)?.label ?? settingsDraft.workerLanguageControls.defaultWorkerLanguageCode}.
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Common city list for admin and worker app</h3>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    These city names are used in Add Worker, Edit Company, Add Job Post, and the worker app favourite cities section. Admin users will now select only from this dropdown list to avoid wrong spellings.
                  </p>
                  <textarea
                    value={settingsDraft.workerHomeControls.popularCitySuggestions.join(', ')}
                    onChange={event => setSettingsDraft(current => ({
                      ...current,
                      workerHomeControls: {
                        ...current.workerHomeControls,
                        popularCitySuggestions: parseCommaSeparatedDisplayList(event.target.value)
                      }
                    }))}
                    rows={4}
                    placeholder="Jaipur, Delhi, Mumbai, Bengaluru, Pune"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '96px', lineHeight: 1.6 }}
                  />
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', background: '#f8fafc', color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    Current common cities: {settingsDraft.workerHomeControls.popularCitySuggestions.join(', ') || 'No cities added yet'}.
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Worker app help button</h3>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                    These settings control the Help button in the worker app header. Workers can use it to contact your team on WhatsApp, open your chatbot link, or use one extra custom button you configure here.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={settingsDraft.helpControls.showHeaderHelpButton}
                      onChange={event => setSettingsDraft(current => ({
                        ...current,
                        helpControls: {
                          ...current.helpControls,
                          showHeaderHelpButton: event.target.checked
                        }
                      }))}
                    />
                    Show Help button in worker app header
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Help title</label>
                      <input
                        value={settingsDraft.helpControls.supportTitle}
                        onChange={event => setSettingsDraft(current => ({
                          ...current,
                          helpControls: {
                            ...current.helpControls,
                            supportTitle: event.target.value
                          }
                        }))}
                        placeholder="Need help?"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp number</label>
                      <input
                        value={settingsDraft.helpControls.supportWhatsappNumber}
                        onChange={event => setSettingsDraft(current => ({
                          ...current,
                          helpControls: {
                            ...current.helpControls,
                            supportWhatsappNumber: event.target.value
                          }
                        }))}
                        placeholder="9198XXXXXXXX"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Help subtitle</label>
                    <input
                      value={settingsDraft.helpControls.supportSubtitle}
                      onChange={event => setSettingsDraft(current => ({
                        ...current,
                        helpControls: {
                          ...current.helpControls,
                          supportSubtitle: event.target.value
                        }
                      }))}
                      placeholder="Chat with our team or message us on WhatsApp."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Chatbot URL</label>
                    <input
                      value={settingsDraft.helpControls.supportChatbotUrl}
                      onChange={event => setSettingsDraft(current => ({
                        ...current,
                        helpControls: {
                          ...current.helpControls,
                          supportChatbotUrl: event.target.value
                        }
                      }))}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Other button text</label>
                      <input
                        value={settingsDraft.helpControls.supportExtraLabel}
                        onChange={event => setSettingsDraft(current => ({
                          ...current,
                          helpControls: {
                            ...current.helpControls,
                            supportExtraLabel: event.target.value
                          }
                        }))}
                        placeholder="Visit support page"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Other link URL</label>
                      <input
                        value={settingsDraft.helpControls.supportExtraUrl}
                        onChange={event => setSettingsDraft(current => ({
                          ...current,
                          helpControls: {
                            ...current.helpControls,
                            supportExtraUrl: event.target.value
                          }
                        }))}
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Default WhatsApp message</label>
                    <textarea
                      value={settingsDraft.helpControls.supportPrefilledMessage}
                      onChange={event => setSettingsDraft(current => ({
                        ...current,
                        helpControls: {
                          ...current.helpControls,
                          supportPrefilledMessage: event.target.value
                        }
                      }))}
                      rows={3}
                      placeholder="Hello Team, I need help with the Rozgar worker app."
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Module navigation and linked tools</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {(['overview', 'workers', 'referrals', 'companies', 'categories', 'jobPosts', 'jobApplications', 'savedJobs', 'workerNotifications', 'plans', 'walletTransactions', 'rechargeRequests', 'supportRequests', 'reports', 'auditLogs'] as LabourSection[]).map(section => (
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
            <div style={{ display: 'grid', gap: '12px', marginBottom: '18px' }}>
              <LabourWhatsappMetaStatusCard />
              <div style={{ border: '1px solid #dbeafe', borderRadius: '16px', padding: '14px 16px', background: '#f8fbff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px' }}>WhatsApp delivery statuses</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                      Live webhook updates from Meta are saved here automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => setAuditFilters(current => ({ ...current, search: 'WhatsApp status' }))}
                    style={subtleButtonStyle}
                  >
                    Filter WhatsApp Logs
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {whatsappAuditLogs.length === 0 ? (
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No WhatsApp webhook statuses have been recorded yet.</p>
                  ) : (
                    whatsappAuditLogs.slice(0, 8).map(({ log, details }) => {
                      const statusTone = getWhatsappStatusTone(details.status)
                      return (
                        <div
                          key={log.id}
                          style={{
                            border: '1px solid #dbeafe',
                            borderRadius: '12px',
                            background: '#ffffff',
                            padding: '12px 14px',
                            display: 'grid',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: '999px',
                                  padding: '5px 10px',
                                  background: statusTone.background,
                                  color: statusTone.color,
                                  border: `1px solid ${statusTone.border}`,
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}
                              >
                                {details.status || 'unknown'}
                              </span>
                              <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: '700' }}>
                                {details.waId ? `Recipient ${details.waId}` : 'Recipient unknown'}
                              </span>
                            </div>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>{formatDateTime(log.createdAt)}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                            <div style={{ color: '#334155', fontSize: '12px' }}>
                              <strong>Message ID:</strong> {details.messageId || log.entityId}
                            </div>
                            <div style={{ color: '#334155', fontSize: '12px' }}>
                              <strong>Conversation:</strong> {details.conversationId || '-'}
                            </div>
                            <div style={{ color: '#334155', fontSize: '12px' }}>
                              <strong>Origin:</strong> {details.origin || '-'}
                            </div>
                            <div style={{ color: '#334155', fontSize: '12px' }}>
                              <strong>Pricing:</strong> {details.pricingCategory || '-'}{details.billable ? ` | billable=${details.billable}` : ''}
                            </div>
                          </div>
                          {details.errors ? (
                            <div style={{ color: '#b91c1c', fontSize: '12px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '10px 12px' }}>
                              <strong>Errors:</strong> {details.errors}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
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

        {withdrawalPaymentDetailsRequestId && selectedWithdrawalPaymentRequest ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.56)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 90
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '720px',
                background: '#ffffff',
                borderRadius: '22px',
                border: '1px solid #dce4ef',
                boxShadow: '0 28px 70px rgba(15, 23, 42, 0.2)',
                padding: '22px',
                display: 'grid',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '20px' }}>
                    Payment Details
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                    Use these details only to process this withdrawal. Payment details are securely retrieved for this request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeWithdrawalPaymentDetails}
                  style={subtleButtonStyle}
                >
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Agent Name</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{selectedWithdrawalPaymentRequest.agentName || '-'}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Mobile</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{selectedWithdrawalPaymentRequest.mobile || '-'}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Withdrawal Amount</div>
                  <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800, marginTop: '6px' }}>{formatCurrency(selectedWithdrawalPaymentRequest.amount)}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Payout Method</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                    {selectedWithdrawalPaymentRequest.payoutMethod === 'bank' ? 'Bank Account' : 'UPI'}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Request Date</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                    {selectedWithdrawalPaymentRequest.requestedAt ? formatDateTime(selectedWithdrawalPaymentRequest.requestedAt) : '-'}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Status</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                    {titleCase(selectedWithdrawalPaymentRequest.status)}
                  </div>
                </div>
              </div>

              {withdrawalPaymentDetailsLoading ? (
                <div style={{ border: '1px solid #dbeafe', borderRadius: '16px', padding: '18px', background: '#f8fbff', color: '#1d4ed8', fontWeight: 700 }}>
                  Loading secure payout destination...
                </div>
              ) : withdrawalPaymentDetailsError ? (
                <div style={{ border: '1px solid #fecaca', borderRadius: '16px', padding: '18px', background: '#fff1f2', color: '#b91c1c', fontWeight: 700 }}>
                  {withdrawalPaymentDetailsError}
                </div>
              ) : withdrawalPaymentDetails ? (
                <div style={{ border: '1px solid #dbeafe', borderRadius: '16px', padding: '18px', background: '#f8fbff', display: 'grid', gap: '14px' }}>
                  {withdrawalPaymentDetails.bank ? (
                    <>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Account Holder Name</div>
                        <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, wordBreak: 'break-word' }}>{withdrawalPaymentDetails.bank.accountHolderName}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Account Number</div>
                          <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, wordBreak: 'break-word' }}>{withdrawalPaymentDetails.bank.accountNumber}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyTextToClipboard('Account Number', withdrawalPaymentDetails.bank?.accountNumber || '')}
                          style={subtleButtonStyle}
                        >
                          Copy Account Number
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>IFSC Code</div>
                          <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, wordBreak: 'break-word' }}>{withdrawalPaymentDetails.bank.ifsc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyTextToClipboard('IFSC', withdrawalPaymentDetails.bank?.ifsc || '')}
                          style={subtleButtonStyle}
                        >
                          Copy IFSC
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => void copyTextToClipboard(
                            'Bank Details',
                            [
                              `Account Holder Name: ${withdrawalPaymentDetails.bank?.accountHolderName || ''}`,
                              `Account Number: ${withdrawalPaymentDetails.bank?.accountNumber || ''}`,
                              `IFSC Code: ${withdrawalPaymentDetails.bank?.ifsc || ''}`,
                            ].join('\n'),
                          )}
                          style={subtleButtonStyle}
                        >
                          Copy All Bank Details
                        </button>
                      </div>
                    </>
                  ) : null}

                  {withdrawalPaymentDetails.upi ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>UPI ID</div>
                        <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, wordBreak: 'break-word' }}>{withdrawalPaymentDetails.upi.upiId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyTextToClipboard('UPI ID', withdrawalPaymentDetails.upi?.upiId || '')}
                        style={subtleButtonStyle}
                      >
                        Copy UPI ID
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {withdrawalReviewDraft && selectedWithdrawalReview ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 80
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #dce4ef',
                boxShadow: '0 28px 70px rgba(15, 23, 42, 0.18)',
                padding: '22px',
                display: 'grid',
                gap: '16px'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '20px' }}>
                  {withdrawalReviewDraft.action === 'approve'
                    ? 'Approve Withdrawal Request?'
                    : withdrawalReviewDraft.action === 'reject'
                      ? 'Reject Withdrawal Request'
                      : 'Manual Payout'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                  {withdrawalReviewDraft.action === 'approve'
                    ? 'The amount will remain reserved for payout. Payment is not completed in this step.'
                    : withdrawalReviewDraft.action === 'reject'
                      ? 'Rejecting this request releases the reserved amount back to the Agent withdrawal balance.'
                      : 'Record a payout that has already been completed manually outside Rozgar.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Agent</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{selectedWithdrawalReview.agentName}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{selectedWithdrawalReview.mobile || '-'}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Referral Code</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{selectedWithdrawalReview.referralCode || '-'}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Amount</div>
                  <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800, marginTop: '6px' }}>{formatCurrency(selectedWithdrawalReview.amount)}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Method</div>
                  <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                    {selectedWithdrawalReview.payoutMethod === 'bank' ? 'Bank Account' : 'UPI'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{selectedWithdrawalReview.maskedDestination}</div>
                </div>
                {withdrawalReviewDraft.action === 'mark-paid' ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', background: '#f8fafc' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Approved Date</div>
                    <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                      {selectedWithdrawalReview.approvedAt ? formatDateTime(selectedWithdrawalReview.approvedAt) : '-'}
                    </div>
                  </div>
                ) : null}
              </div>

              {withdrawalReviewDraft.action === 'reject' ? (
                <div>
                  <label style={labelStyle}>Reason</label>
                  <textarea
                    value={withdrawalReviewDraft.rejectionReason}
                    onChange={event => setWithdrawalReviewDraft(current =>
                      current
                        ? { ...current, rejectionReason: event.target.value.slice(0, 500) }
                        : current
                    )}
                    rows={4}
                    placeholder="Write why this request is being rejected"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', lineHeight: 1.6 }}
                  />
                  <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '11px' }}>
                    {withdrawalReviewDraft.rejectionReason.trim().length}/500 characters
                  </div>
                </div>
              ) : withdrawalReviewDraft.action === 'mark-paid' ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                      Review the immutable payout destination stored with this approved withdrawal before marking it paid.
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadWithdrawalPaymentDetails(selectedWithdrawalReview.id)}
                      style={subtleButtonStyle}
                      disabled={withdrawalPaymentDetailsLoading}
                    >
                      {withdrawalPaymentDetailsLoading ? 'Loading...' : 'View Payment Details'}
                    </button>
                  </div>

                  <div>
                    <label style={labelStyle}>Payment Reference / UTR</label>
                    <input
                      value={withdrawalReviewDraft.paymentReference}
                      onChange={event => setWithdrawalReviewDraft(current =>
                        current
                          ? { ...current, paymentReference: event.target.value.slice(0, 120) }
                          : current
                      )}
                      placeholder="Enter UPI reference, UTR, IMPS, or NEFT reference"
                      style={inputStyle}
                    />
                    <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '11px' }}>
                      {withdrawalReviewDraft.paymentReference.trim().length}/120 characters
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '13px', lineHeight: 1.5 }}>
                    <input
                      type="checkbox"
                      checked={withdrawalReviewDraft.paymentConfirmed}
                      onChange={event => setWithdrawalReviewDraft(current =>
                        current
                          ? { ...current, paymentConfirmed: event.target.checked }
                          : current
                      )}
                      style={{ marginTop: '3px' }}
                    />
                    <span>I confirm that this payment has been completed manually and this action will permanently debit the Agent&apos;s referral earnings.</span>
                  </label>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalReviewDraft(null)
                    closeWithdrawalPaymentDetails()
                  }}
                  style={subtleButtonStyle}
                  disabled={referralWithdrawalSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitReferralWithdrawalReview()}
                  style={withdrawalReviewDraft.action === 'approve' ? primaryButtonStyle : { ...primaryButtonStyle, background: '#b91c1c' }}
                  disabled={referralWithdrawalSaving}
                >
                  {referralWithdrawalSaving
                    ? 'Saving...'
                    : withdrawalReviewDraft.action === 'approve'
                      ? 'Approve Request'
                      : withdrawalReviewDraft.action === 'reject'
                        ? 'Reject Request'
                        : 'Mark As Paid'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
          </div>
        </main>
      </div>
    </div>
  )
}
