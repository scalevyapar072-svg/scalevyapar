import {
  isJobPostLiveRecord,
  isWorkerPlanExpiredRecord,
  isWorkerSearchActiveRecord,
  type LabourCompanyRecord,
  type LabourJobPostRecord,
  type LabourMarketplaceSnapshot,
  type LabourPlanRecord,
  type LabourWalletTransactionRecord,
  type LabourWorkerRecord,
} from '../labour-marketplace'
import { maskWhatsappMobile, type WhatsappConsentState } from './consent'
import type {
  WhatsappSafetyStatusSummary,
  WhatsappTemplateInventoryRow,
} from './persistence-types'
import { REVIEW_ONLY_WHATSAPP_DEFAULTS } from './persistence-types'
import { createWhatsappSettingsRepository } from './settings-repository'
import { createWhatsappTemplateInventoryRepository } from './template-inventory-repository'
import { getWhatsappPersistenceClient } from './persistence-client'
import {
  planCompanyMatchingDigests,
  planWorkerKycRejectedNotifications,
  planWorkerMatchingDigests,
  planWorkerPaymentOrPlanReminders,
  type WhatsappAutomationPlan,
} from './automation-executor'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/automation-preview')

type AutomationTemplateSelection = {
  automationEventType:
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected'
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
}

type AutomationPreviewPlan = {
  automationEventType:
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected'
  recipientType: 'worker' | 'company'
  maskedMobile: string
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
  templateStatus:
    | 'configured'
    | 'not_configured'
    | 'not_approved'
    | 'not_enabled'
  ctaUrl: string | null
  ctaStatus: 'configured' | 'not_available'
  matchingWorkerCount: number
  matchingCompanyCount: number
  matchingJobCount: number
  liveJobCount: number
  eligibilityResult: 'eligible' | 'blocked' | 'queued'
  exclusionReason: string | null
  quietHoursDecision: 'send_now' | 'queue_until_allowed' | 'blocked'
  idempotencyKey: string
  requiredConsents: string[]
  missingConsents: string[]
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
  matchedCategoryIds: string[]
  matchedCities: string[]
  subreason: string | null
  messagePreview: string | null
  consentEligible: boolean
  suppressionEligible: boolean
  templateEligible: boolean
  deepLinkEligible: boolean
  dispatchDecision: 'ready' | 'queued' | 'blocked'
  dispatchable: boolean
}

type AutomationPreviewFunnel = {
  marketplaceCandidatePlans: number
  consentEligiblePlans: number
  suppressionEligiblePlans: number
  templateEligiblePlans: number
  deepLinkEligiblePlans: number
  dispatchReadyPlans: number
  queuedPlans: number
  blockedPlans: number
}

export type WorkerLifecycleReasonCategory =
  | 'persisted_blocked'
  | 'persisted_rejected'
  | 'persisted_pending'
  | 'registration_incomplete'
  | 'worker_paused'
  | 'missing_active_plan'
  | 'expired_active_plan'
  | 'registration_fee_unpaid'
  | 'wallet_balance_non_positive'
  | 'eligible_active'

export type WorkerLifecycleEvaluation = {
  derivedStatus: LabourWorkerRecord['status']
  reasonCategory: WorkerLifecycleReasonCategory
}

export type WorkerLifecycleReconciliationRow = {
  maskedMobile: string
  persistedStatus: LabourWorkerRecord['status']
  derivedStatus: LabourWorkerRecord['status']
  reasonCategory: WorkerLifecycleReasonCategory
}

export type WorkerLifecycleTransitionSummary = {
  fromStatus: LabourWorkerRecord['status']
  toStatus: LabourWorkerRecord['status']
  count: number
}

export type WorkerLifecycleReconciliationSummary = {
  source: 'supabase' | 'unavailable'
  reasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
  totalWorkersChecked: number
  unchangedCount: number
  changeRequiredCount: number
  activeToInactiveWalletEmptyCount: number
  activeToInactiveSubscriptionExpiredCount: number
  otherTransitionCount: number
  transitions: WorkerLifecycleTransitionSummary[]
  changedWorkers: WorkerLifecycleReconciliationRow[]
}

export type WhatsappAutomationPreviewSummary = {
  checkedAt: string
  vercelEnv: string
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory:
    | 'live_read_ok'
    | 'missing_configuration'
    | 'marketplace_query_failed'
  previewSendingDisabled: boolean
  pauseAllSending: boolean
  pauseReason: WhatsappSafetyStatusSummary['pauseReason']
  failClosed: boolean
  persistenceAvailable: boolean
  persistenceStatus: string
  consentReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  suppressionReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  templateReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  noDatabaseWrites: true
  noMessagesCalls: true
  workerDeepLinkAvailable: false
  automaticEventCategories: string[]
  companyPlanCount: number
  workerPlanCount: number
  workerPaymentPlanCount: number
  workerKycRejectedPlanCount: number
  companyFunnel: AutomationPreviewFunnel
  workerFunnel: AutomationPreviewFunnel
  workerPaymentFunnel: AutomationPreviewFunnel
  workerKycRejectedFunnel: AutomationPreviewFunnel
  companyPlans: AutomationPreviewPlan[]
  workerPlans: AutomationPreviewPlan[]
  workerPaymentPlans: AutomationPreviewPlan[]
  workerKycRejectedPlans: AutomationPreviewPlan[]
  workerLifecycleReconciliation: WorkerLifecycleReconciliationSummary
}

type PreviewBuildInput = {
  snapshot: LabourMarketplaceSnapshot
  snapshotSource?: 'supabase' | 'unavailable'
  snapshotReasonCategory?: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
  vercelEnv?: string
  now?: Date
  safetySummary?: WhatsappSafetyStatusSummary
  companyConsentStates?: Record<string, Partial<WhatsappConsentState>>
  workerConsentStates?: Record<string, Partial<WhatsappConsentState>>
  suppressedMobiles?: Iterable<string>
  templateSelections?: Partial<Record<
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected',
    AutomationTemplateSelection
  >>
}

type ReadModel = {
  snapshot: LabourMarketplaceSnapshot
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
  safetySummary: WhatsappSafetyStatusSummary
  companyConsentStates: Record<string, Partial<WhatsappConsentState>>
  workerConsentStates: Record<string, Partial<WhatsappConsentState>>
  suppressedMobiles: string[]
  templateSelections: Record<
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected',
    AutomationTemplateSelection
  >
  persistenceAvailable: boolean
  persistenceStatus: string
  consentReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  suppressionReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  templateReadState: 'connected' | 'persistence_unavailable' | 'query_error'
}

const AUTOMATION_EVENT_TYPES = [
  'company_matching_digest',
  'worker_matching_digest',
  'worker_payment_or_plan_reminder',
  'worker_kyc_rejected',
] as const

const createEmptySnapshot = (
  storage: 'supabase' | 'json',
): LabourMarketplaceSnapshot => ({
  categories: [],
  plans: [],
  workers: [],
  companies: [],
  jobPosts: [],
  jobApplications: [],
  savedJobs: [],
  workerNotifications: [],
  walletTransactions: [],
  rechargeRequests: [],
  auditLogs: [],
  stats: {
    activeWorkers: 0,
    inactiveWorkers: 0,
    activeCompanies: 0,
    liveJobPosts: 0,
    totalWalletBalance: 0,
    recentAuditLogs: [],
  },
  storage,
})

const finalizeSnapshot = (snapshot: LabourMarketplaceSnapshot): LabourMarketplaceSnapshot => ({
  ...snapshot,
  stats: {
    activeWorkers: snapshot.workers.filter((worker) => isWorkerSearchActiveRecord(worker)).length,
    inactiveWorkers: snapshot.workers.filter((worker) => !isWorkerSearchActiveRecord(worker)).length,
    activeCompanies: snapshot.companies.filter((company) => company.status === 'active').length,
    liveJobPosts: snapshot.jobPosts.filter((jobPost) => isJobPostLiveRecord(jobPost)).length,
    totalWalletBalance: snapshot.workers.reduce(
      (sum, worker) => sum + Number(worker.walletBalance || 0),
      0,
    ),
    recentAuditLogs: snapshot.auditLogs.slice(0, 8),
  },
})

const toString = (value: unknown) => String(value || '').trim()
const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value || 0) || 0)
const toBoolean = (value: unknown) => Boolean(value)
const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((entry) => String(entry || '').trim()).filter(Boolean) : []

const mapWorkerRow = (row: Record<string, unknown>): LabourWorkerRecord => ({
  id: toString(row.id),
  fullName: toString(row.full_name),
  mobile: toString(row.mobile),
  city: toString(row.city),
  homeCity: toString(row.home_city),
  salaryType: toString(row.salary_type),
  companyId: toString(row.company_id),
  industryCategory: toString(row.industry_category),
  businessType: toString(row.business_type),
  address: toString(row.address),
  preferredWorkLocations: Array.isArray(row.preferred_work_locations)
    ? row.preferred_work_locations
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => {
          const value = entry as Record<string, unknown>
          return {
            stateOptionId: toString(value.stateOptionId || value.state_option_id),
            stateLabel: toString(value.stateLabel || value.state_label),
            cityOptionIds: toStringArray(value.cityOptionIds || value.city_option_ids),
            cityLabels: toStringArray(value.cityLabels || value.city_labels),
          }
        })
    : [],
  profilePhotoPath: toString(row.profile_photo_path),
  resumeDocumentPath: toString(row.resume_document_path),
  skills: toStringArray(row.skills),
  experienceYears: toNumber(row.experience_years),
  expectedDailyWage: toNumber(row.expected_daily_wage),
  minimumExpectedWage: toNumber(row.minimum_expected_wage),
  maximumExpectedWage: toNumber(row.maximum_expected_wage),
  walletBalance: toNumber(row.wallet_balance),
  registrationFeePaid: toBoolean(row.registration_fee_paid),
  activePlan: toString(row.active_plan),
  planValidFrom: toString(row.plan_valid_from),
  planValidUntil: toString(row.plan_valid_until),
  lastWalletDeductionDate: toString(row.last_wallet_deduction_date),
  workerPausedByWorker: toBoolean(row.worker_paused_by_worker),
  workerPausedAt: toString(row.worker_paused_at),
  workerReactivatedAt: toString(row.worker_reactivated_at),
  status: toString(row.status) as LabourWorkerRecord['status'],
  kycStatus: toString(row.kyc_status),
  kycRemarks: toString(row.kyc_remarks),
  availability: toString(row.availability) as LabourWorkerRecord['availability'],
  isVisible: toBoolean(row.is_visible),
  categoryIds: toStringArray(row.category_ids),
  identityProofType: toString(row.identity_proof_type) as LabourWorkerRecord['identityProofType'],
  identityProofNumber: toString(row.identity_proof_number),
  identityProofPath: toString(row.identity_proof_path),
  registrationCompletedAt: toString(row.registration_completed_at),
  createdAt: toString(row.created_at),
  updatedAt: toString(row.updated_at),
})

const mapCompanyRow = (row: Record<string, unknown>): LabourCompanyRecord => ({
  id: toString(row.id),
  companyName: toString(row.company_name),
  contactPerson: toString(row.contact_person),
  email: toString(row.email),
  mobile: toString(row.mobile),
  contactMobile: toString(row.contact_mobile || row.mobile),
  businessType: toString(row.business_type),
  industryCategory: toString(row.industry_category),
  gstNumber: toString(row.gst_number),
  companyAddress: toString(row.company_address),
  state: toString(row.state),
  city: toString(row.city),
  area: toString(row.area),
  pincode: toString(row.pincode),
  workersNeeded: toNumber(row.workers_needed),
  hiringType: toString(row.hiring_type),
  businessDescription: toString(row.business_description),
  gstCertificatePath: toString(row.gst_certificate_path),
  companyProofPath: toString(row.company_proof_path),
  ownerIdProofPath: toString(row.owner_id_proof_path),
  categoryIds: toStringArray(row.category_ids),
  status: toString(row.status) as LabourCompanyRecord['status'],
  registrationFeePaid: toBoolean(row.registration_fee_paid),
  activePlan: toString(row.active_plan),
  createdAt: toString(row.created_at),
  updatedAt: toString(row.updated_at),
})

const mapJobPostRow = (row: Record<string, unknown>): LabourJobPostRecord => ({
  id: toString(row.id),
  companyId: toString(row.company_id),
  planId: toString(row.plan_id),
  categoryId: toString(row.category_id),
  title: toString(row.title),
  description: toString(row.description),
  city: toString(row.city),
  locationLabel: toString(row.location_label),
  latitude: row.latitude == null ? null : toNumber(row.latitude),
  longitude: row.longitude == null ? null : toNumber(row.longitude),
  workersNeeded: toNumber(row.workers_needed),
  wageAmount: toNumber(row.wage_amount),
  validityDays: toNumber(row.validity_days),
  status: toString(row.status) as LabourJobPostRecord['status'],
  publishedAt: toString(row.published_at),
  expiresAt: toString(row.expires_at),
  createdAt: toString(row.created_at),
  updatedAt: toString(row.updated_at),
})

const mapPlanRow = (row: Record<string, unknown>): LabourPlanRecord => ({
  id: toString(row.id),
  audience: toString(row.audience) as LabourPlanRecord['audience'],
  name: toString(row.name),
  categoryId: toString(row.category_id) || undefined,
  industryCategoryValues: toStringArray(row.industry_category_values),
  businessTypeValues: toStringArray(row.business_type_values),
  labourCategoryIds: toStringArray(
    row.labour_category_ids || (toString(row.category_id) ? [row.category_id] : []),
  ),
  jobPostLimit: toNumber(row.job_post_limit || 1),
  registrationFee: toNumber(row.registration_fee),
  walletCredit: toNumber(row.wallet_credit),
  planAmount: toNumber(row.plan_amount),
  planValidityDays: toNumber(row.plan_validity_days || row.validity_days),
  jobPostLiveDays: toNumber(row.job_post_live_days || row.validity_days),
  validityDays: toNumber(row.plan_validity_days || row.validity_days),
  dailyCharge: toNumber(row.daily_charge),
  description: toString(row.description),
  isActive: row.is_active == null ? true : toBoolean(row.is_active),
  createdAt: toString(row.created_at),
  updatedAt: toString(row.updated_at),
})

const mapWalletTransactionRow = (row: Record<string, unknown>): LabourWalletTransactionRecord => ({
  id: toString(row.id),
  entityType: toString(row.entity_type) as LabourWalletTransactionRecord['entityType'],
  entityId: toString(row.entity_id),
  entityName: toString(row.entity_name),
  city: toString(row.city),
  transactionType: toString(
    row.transaction_type,
  ) as LabourWalletTransactionRecord['transactionType'],
  amount: toNumber(row.amount),
  direction: toString(row.direction) as LabourWalletTransactionRecord['direction'],
  status: toString(row.status) as LabourWalletTransactionRecord['status'],
  reference: toString(row.reference),
  note: toString(row.note),
  createdAt: toString(row.created_at),
  updatedAt: toString(row.updated_at),
})

const loadMarketplacePreviewSnapshot = async (): Promise<{
  snapshot: LabourMarketplaceSnapshot
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
}> => {
  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      snapshot: createEmptySnapshot('json'),
      snapshotSource: 'unavailable',
      snapshotReasonCategory: 'missing_configuration',
    }
  }

  try {
    const [workersResult, companiesResult, jobPostsResult, plansResult, walletTransactionsResult] =
      await Promise.all([
      persistence.client
        .from('labour_workers')
        .select(
          'id, full_name, mobile, city, home_city, salary_type, address, preferred_work_locations, profile_photo_path, resume_document_path, skills, experience_years, expected_daily_wage, minimum_expected_wage, maximum_expected_wage, wallet_balance, registration_fee_paid, active_plan, plan_valid_from, plan_valid_until, last_wallet_deduction_date, worker_paused_by_worker, worker_paused_at, worker_reactivated_at, status, kyc_status, kyc_remarks, availability, is_visible, category_ids, identity_proof_type, identity_proof_number, identity_proof_path, registration_completed_at, created_at, updated_at',
        )
        .order('created_at', { ascending: true }),
      persistence.client
        .from('labour_companies')
        .select(
          'id, company_name, contact_person, email, mobile, contact_mobile, business_type, industry_category, gst_number, company_address, state, city, pincode, workers_needed, hiring_type, business_description, gst_certificate_path, company_proof_path, owner_id_proof_path, category_ids, status, registration_fee_paid, active_plan, created_at, updated_at',
        )
        .order('created_at', { ascending: true }),
      persistence.client
        .from('labour_job_posts')
        .select(
          'id, company_id, plan_id, category_id, title, description, city, location_label, latitude, longitude, workers_needed, wage_amount, validity_days, status, published_at, expires_at, created_at, updated_at',
        )
        .order('created_at', { ascending: true }),
      persistence.client
        .from('labour_plans')
        .select(
          'id, audience, name, category_id, industry_category_values, business_type_values, labour_category_ids, job_post_limit, plan_validity_days, job_post_live_days, registration_fee, wallet_credit, plan_amount, validity_days, daily_charge, description, is_active, created_at, updated_at',
        )
        .order('created_at', { ascending: true }),
      persistence.client
        .from('labour_wallet_transactions')
        .select(
          'id, entity_type, entity_id, entity_name, city, transaction_type, amount, direction, status, reference, note, created_at, updated_at',
        )
        .order('created_at', { ascending: true }),
    ])

    if (
      workersResult.error ||
      companiesResult.error ||
      jobPostsResult.error ||
      plansResult.error ||
      walletTransactionsResult.error
    ) {
      throw new Error('Labour preview snapshot read failed.')
    }

    const snapshot = createEmptySnapshot('supabase')
    snapshot.workers = (workersResult.data || []).map((row) =>
      mapWorkerRow(row as Record<string, unknown>),
    )
    snapshot.companies = (companiesResult.data || []).map((row) =>
      mapCompanyRow(row as Record<string, unknown>),
    )
    snapshot.jobPosts = (jobPostsResult.data || []).map((row) =>
      mapJobPostRow(row as Record<string, unknown>),
    )
    snapshot.plans = (plansResult.data || []).map((row) =>
      mapPlanRow(row as Record<string, unknown>),
    )
    snapshot.walletTransactions = (walletTransactionsResult.data || []).map((row) =>
      mapWalletTransactionRow(row as Record<string, unknown>),
    )

    return {
      snapshot: finalizeSnapshot(snapshot),
      snapshotSource: 'supabase',
      snapshotReasonCategory: 'live_read_ok',
    }
  } catch {
    return {
      snapshot: createEmptySnapshot('json'),
      snapshotSource: 'unavailable',
      snapshotReasonCategory: 'marketplace_query_failed',
    }
  }
}

const loadSafetySummary = async (): Promise<WhatsappSafetyStatusSummary> => {
  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    const unavailable = persistence
    return {
      available: false,
      persistenceStatus: unavailable.message,
      failClosed: true,
      pauseAllSending: true,
      pauseReason: 'persistence_unavailable',
      reviewOnlyDefaults: REVIEW_ONLY_WHATSAPP_DEFAULTS,
    }
  }

  return createWhatsappSettingsRepository({
    client: persistence.client,
  }).getWhatsappSafetySettings()
}

const createTemplateSelection = (
  automationEventType:
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected',
  row: WhatsappTemplateInventoryRow | null,
): AutomationTemplateSelection => ({
  automationEventType,
  templateName: row?.metaTemplateName || null,
  templateLanguage: row?.language || null,
  templateConfigured: Boolean(row),
  templateApproved: String(row?.metaStatus || '').trim().toUpperCase() === 'APPROVED',
  templateEnabled: Boolean(row?.enabled),
})

const selectBestTemplate = (
  rows: WhatsappTemplateInventoryRow[],
  automationEventType:
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected',
) => {
  const matchingRows = rows.filter(
    (row) => String(row.intendedBusinessEvent || '').trim() === automationEventType,
  )

  return (
    matchingRows.sort((left, right) => {
      const leftScore =
        (left.enabled ? 2 : 0) +
        (String(left.metaStatus || '').trim().toUpperCase() === 'APPROVED' ? 1 : 0)
      const rightScore =
        (right.enabled ? 2 : 0) +
        (String(right.metaStatus || '').trim().toUpperCase() === 'APPROVED' ? 1 : 0)
      return rightScore - leftScore
    })[0] || null
  )
}

const loadTemplateSelections = async () => {
  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      templateSelections: {
        company_matching_digest: createTemplateSelection('company_matching_digest', null),
        worker_matching_digest: createTemplateSelection('worker_matching_digest', null),
        worker_payment_or_plan_reminder: createTemplateSelection(
          'worker_payment_or_plan_reminder',
          null,
        ),
        worker_kyc_rejected: createTemplateSelection('worker_kyc_rejected', null),
      },
      templateReadState: 'persistence_unavailable' as const,
    }
  }

  try {
    const rows = await createWhatsappTemplateInventoryRepository({
      client: persistence.client,
    }).listTemplateInventory({ limit: 100 })

    return {
      templateSelections: {
        company_matching_digest: createTemplateSelection(
          'company_matching_digest',
          selectBestTemplate(rows, 'company_matching_digest'),
        ),
        worker_matching_digest: createTemplateSelection(
          'worker_matching_digest',
          selectBestTemplate(rows, 'worker_matching_digest'),
        ),
        worker_payment_or_plan_reminder: createTemplateSelection(
          'worker_payment_or_plan_reminder',
          null,
        ),
        worker_kyc_rejected: createTemplateSelection('worker_kyc_rejected', null),
      },
      templateReadState: 'connected' as const,
    }
  } catch {
    return {
      templateSelections: {
        company_matching_digest: createTemplateSelection('company_matching_digest', null),
        worker_matching_digest: createTemplateSelection('worker_matching_digest', null),
        worker_payment_or_plan_reminder: createTemplateSelection(
          'worker_payment_or_plan_reminder',
          null,
        ),
        worker_kyc_rejected: createTemplateSelection('worker_kyc_rejected', null),
      },
      templateReadState: 'query_error' as const,
    }
  }
}

const loadConsentMaps = async () => {
  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      companyConsentStates: {},
      workerConsentStates: {},
      consentReadState: 'persistence_unavailable' as const,
    }
  }

  try {
    const { data, error } = await persistence.client
      .from('labour_whatsapp_consents')
      .select('recipient_type, recipient_id, consent_type, allowed')
      .in('recipient_type', ['worker', 'company'])

    if (error) {
      throw new Error('Unable to read WhatsApp consent states.')
    }

    const companyConsentStates: Record<string, Partial<WhatsappConsentState>> = {}
    const workerConsentStates: Record<string, Partial<WhatsappConsentState>> = {}

    for (const row of data || []) {
      const candidate = row as Record<string, unknown>
      const recipientType = toString(candidate.recipient_type)
      const recipientId = toString(candidate.recipient_id)
      const consentType = toString(candidate.consent_type)
      if (
        !recipientId ||
        !['service_allowed', 'matching_alerts_allowed', 'marketing_allowed'].includes(consentType)
      ) {
        continue
      }

      const target =
        recipientType === 'company'
          ? companyConsentStates
          : recipientType === 'worker'
            ? workerConsentStates
            : null

      if (!target) {
        continue
      }

      target[recipientId] = {
        ...(target[recipientId] || {}),
        [consentType]: Boolean(candidate.allowed),
      }
    }

    return {
      companyConsentStates,
      workerConsentStates,
      consentReadState: 'connected' as const,
    }
  } catch {
    return {
      companyConsentStates: {},
      workerConsentStates: {},
      consentReadState: 'query_error' as const,
    }
  }
}

const loadSuppressedMobiles = async () => {
  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      suppressedMobiles: [],
      suppressionReadState: 'persistence_unavailable' as const,
    }
  }

  try {
    const { data, error } = await persistence.client
      .from('labour_whatsapp_suppressions')
      .select('normalized_mobile')
      .eq('active', true)

    if (error) {
      throw new Error('Unable to read WhatsApp suppressions.')
    }

    return {
      suppressedMobiles: (data || [])
        .map((row) => toString((row as Record<string, unknown>).normalized_mobile))
        .filter(Boolean),
      suppressionReadState: 'connected' as const,
    }
  } catch {
    return {
      suppressedMobiles: [],
      suppressionReadState: 'query_error' as const,
    }
  }
}

const loadReadModel = async (): Promise<ReadModel> => {
  const [snapshotState, safetySummary, consentState, suppressionState, templateState] =
    await Promise.all([
      loadMarketplacePreviewSnapshot(),
      loadSafetySummary(),
      loadConsentMaps(),
      loadSuppressedMobiles(),
      loadTemplateSelections(),
    ])

  return {
    snapshot: snapshotState.snapshot,
    snapshotSource: snapshotState.snapshotSource,
    snapshotReasonCategory: snapshotState.snapshotReasonCategory,
    safetySummary,
    companyConsentStates: consentState.companyConsentStates,
    workerConsentStates: consentState.workerConsentStates,
    suppressedMobiles: suppressionState.suppressedMobiles,
    templateSelections: templateState.templateSelections,
    persistenceAvailable: safetySummary.available,
    persistenceStatus: safetySummary.persistenceStatus,
    consentReadState: consentState.consentReadState,
    suppressionReadState: suppressionState.suppressionReadState,
    templateReadState: templateState.templateReadState,
  }
}

const resolveTemplateBlockReason = (selection: AutomationTemplateSelection) => {
  if (!selection.templateConfigured) {
    return 'template_not_configured'
  }

  if (!selection.templateApproved) {
    return 'template_not_approved'
  }

  if (!selection.templateEnabled) {
    return 'template_not_enabled'
  }

  return null
}

const resolveTemplateStatus = (
  selection: AutomationTemplateSelection,
): AutomationPreviewPlan['templateStatus'] => {
  if (!selection.templateConfigured) {
    return 'not_configured'
  }

  if (!selection.templateApproved) {
    return 'not_approved'
  }

  if (!selection.templateEnabled) {
    return 'not_enabled'
  }

  return 'configured'
}

const resolvePreviewDispatchState = ({
  snapshotSource,
  plan,
  selection,
  previewSendingDisabled,
}: {
  snapshotSource: 'supabase' | 'unavailable'
  plan: WhatsappAutomationPlan
  selection: AutomationTemplateSelection
  previewSendingDisabled: boolean
}) => {
  if (snapshotSource !== 'supabase') {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: 'marketplace_snapshot_unavailable',
      dispatchable: false,
    }
  }

  if (!plan.eligibility.eligible) {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: plan.eligibility.reasonCodes[0] || 'eligibility_blocked',
      dispatchable: false,
    }
  }

  const templateBlockReason = resolveTemplateBlockReason(selection)
  if (templateBlockReason) {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: templateBlockReason,
      dispatchable: false,
    }
  }

  if (!plan.ctaUrl) {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: 'missing_cta_url',
      dispatchable: false,
    }
  }

  if (previewSendingDisabled) {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: 'whatsapp-disabled-outside-production',
      dispatchable: false,
    }
  }

  if (plan.dispatchReason === 'whatsapp-paused') {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: 'whatsapp-paused',
      dispatchable: false,
    }
  }

  if (plan.eligibility.deliveryWindow === 'queue_until_allowed') {
    return {
      dispatchDecision: 'queued' as const,
      exclusionReason: 'inside_quiet_hours',
      dispatchable: false,
    }
  }

  if (plan.dryRun || plan.dispatchReason === 'dry_run_only') {
    return {
      dispatchDecision: 'blocked' as const,
      exclusionReason: 'dry_run_only',
      dispatchable: false,
    }
  }

  return {
    dispatchDecision: 'ready' as const,
    exclusionReason: null,
    dispatchable: true,
  }
}

const toPreviewPlan = (
  plan: WhatsappAutomationPlan,
  selection: AutomationTemplateSelection,
  snapshotSource: 'supabase' | 'unavailable',
  previewSendingDisabled: boolean,
): AutomationPreviewPlan => ({
  ...(() => {
    const dispatchState = resolvePreviewDispatchState({
      snapshotSource,
      plan,
      selection,
      previewSendingDisabled,
    })
    const consentEligible = plan.eligibility.missingConsents.length === 0
    const suppressionEligible =
      consentEligible && !plan.eligibility.reasonCodes.includes('suppressed')
    const templateEligible = resolveTemplateBlockReason(selection) === null
    const deepLinkEligible = Boolean(plan.ctaUrl)

    return {
      automationEventType: plan.automationEventType,
      recipientType: plan.recipientType,
      maskedMobile: plan.maskedMobile,
      templateName: selection.templateName,
      templateLanguage: selection.templateLanguage,
      templateConfigured: selection.templateConfigured,
      templateApproved: selection.templateApproved,
      templateEnabled: selection.templateEnabled,
      templateStatus: resolveTemplateStatus(selection),
      ctaUrl: plan.ctaUrl,
      ctaStatus: plan.ctaUrl ? 'configured' : 'not_available',
      matchingWorkerCount: plan.matchingWorkerCount,
      matchingCompanyCount: plan.matchingCompanyCount,
      matchingJobCount: plan.matchingJobCount,
      liveJobCount: plan.liveJobCount,
      eligibilityResult:
        dispatchState.dispatchDecision === 'ready'
          ? 'eligible'
          : dispatchState.dispatchDecision,
      exclusionReason: dispatchState.exclusionReason,
      quietHoursDecision: plan.eligibility.deliveryWindow,
      idempotencyKey: plan.idempotencyKey,
      requiredConsents: plan.eligibility.requiredConsents,
      missingConsents: plan.eligibility.missingConsents,
      resolvedRecipientSource: plan.eligibility.resolvedRecipientSource,
      matchedCategoryIds: plan.matchedCategoryIds,
      matchedCities: plan.matchedCities,
      subreason: plan.subreason,
      messagePreview: plan.messagePreview,
      consentEligible,
      suppressionEligible,
      templateEligible,
      deepLinkEligible,
      dispatchDecision: dispatchState.dispatchDecision,
      dispatchable: dispatchState.dispatchable,
    }
  })(),
})

const createEmptyFunnel = (): AutomationPreviewFunnel => ({
  marketplaceCandidatePlans: 0,
  consentEligiblePlans: 0,
  suppressionEligiblePlans: 0,
  templateEligiblePlans: 0,
  deepLinkEligiblePlans: 0,
  dispatchReadyPlans: 0,
  queuedPlans: 0,
  blockedPlans: 0,
})

const buildPreviewFunnel = (
  plans: AutomationPreviewPlan[],
  recipientType: 'company' | 'worker',
): AutomationPreviewFunnel => {
  if (plans.length === 0) {
    return createEmptyFunnel()
  }

  const consentEligiblePlans = plans.filter((plan) => plan.consentEligible).length
  const suppressionEligiblePlans = plans.filter(
    (plan) => plan.consentEligible && plan.suppressionEligible,
  ).length
  const templateEligiblePlans = plans.filter(
    (plan) => plan.consentEligible && plan.suppressionEligible && plan.templateEligible,
  ).length
  const deepLinkEligiblePlans = plans.filter(
    (plan) =>
      plan.consentEligible &&
      plan.suppressionEligible &&
      plan.templateEligible &&
      (recipientType === 'company' || plan.deepLinkEligible),
  ).length

  return {
    marketplaceCandidatePlans: plans.length,
    consentEligiblePlans,
    suppressionEligiblePlans,
    templateEligiblePlans,
    deepLinkEligiblePlans,
    dispatchReadyPlans: plans.filter((plan) => plan.dispatchDecision === 'ready').length,
    queuedPlans: plans.filter((plan) => plan.dispatchDecision === 'queued').length,
    blockedPlans: plans.filter((plan) => plan.dispatchDecision === 'blocked').length,
  }
}

const isWorkerProfileCompletePreview = (worker: LabourWorkerRecord) =>
  Boolean(worker.fullName.trim()) &&
  Boolean(worker.city.trim()) &&
  worker.categoryIds.length > 0

const isWorkerRegistrationCompletePreview = (worker: LabourWorkerRecord) =>
  isWorkerProfileCompletePreview(worker) &&
  Boolean(worker.profilePhotoPath.trim()) &&
  Boolean(worker.identityProofType) &&
  Boolean(worker.identityProofNumber.trim()) &&
  Boolean(worker.identityProofPath.trim())

const resolveAssignedWorkerPlanPreview = (
  worker: LabourWorkerRecord,
  plans: LabourPlanRecord[],
) => plans.find((plan) => plan.id === worker.activePlan && plan.audience === 'worker') || null

const isZeroChargeWorkerPlanPreview = (workerPlan: LabourPlanRecord | null) =>
  Boolean(
    workerPlan &&
      workerPlan.audience === 'worker' &&
      workerPlan.registrationFee <= 0 &&
      workerPlan.dailyCharge <= 0,
  )

const isFreeWorkerPlanPreview = (workerPlan: LabourPlanRecord | null) =>
  Boolean(
    workerPlan &&
      workerPlan.audience === 'worker' &&
      (workerPlan.id === 'plan-worker-free-7-days' ||
        String(workerPlan.name || '').trim().toLowerCase() === 'free worker plan' ||
        isZeroChargeWorkerPlanPreview(workerPlan)),
  )

const isPaidWorkerPlanPreview = (workerPlan: LabourPlanRecord | null) =>
  Boolean(workerPlan && workerPlan.audience === 'worker' && !isFreeWorkerPlanPreview(workerPlan))

const isWorkerPausedByWorkerPreview = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
) =>
  Boolean(
    isPaidWorkerPlanPreview(workerPlan) &&
      (worker.workerPausedByWorker || worker.status === 'inactive_paused_by_worker'),
  )

const hasCompletedWorkerRegistrationFeeTransactionPreview = (
  worker: LabourWorkerRecord,
  transactions: LabourWalletTransactionRecord[],
) =>
  transactions.some(
    (transaction) =>
      transaction.entityType === 'worker' &&
      transaction.entityId === worker.id &&
      transaction.transactionType === 'registration_fee' &&
      transaction.status === 'completed',
  )

const isWorkerRegistrationFeeSettledPreview = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[],
) => {
  if ((workerPlan?.registrationFee || 0) <= 0) {
    return true
  }

  return (
    worker.registrationFeePaid ||
    hasCompletedWorkerRegistrationFeeTransactionPreview(worker, transactions)
  )
}

const getOutstandingWorkerRegistrationFeePreview = (
  worker: LabourWorkerRecord,
  workerPlan: LabourPlanRecord | null,
  transactions: LabourWalletTransactionRecord[],
) => {
  const registrationFee = workerPlan?.registrationFee || 0
  if (
    registrationFee <= 0 ||
    isWorkerRegistrationFeeSettledPreview(worker, workerPlan, transactions)
  ) {
    return 0
  }

  return registrationFee
}

export const deriveWorkerLifecycleStatusPreview = (
  worker: LabourWorkerRecord,
  snapshot: Pick<LabourMarketplaceSnapshot, 'plans' | 'walletTransactions'>,
): WorkerLifecycleEvaluation => {
  if (worker.status === 'blocked') {
    return {
      derivedStatus: 'blocked',
      reasonCategory: 'persisted_blocked',
    }
  }

  if (worker.status === 'rejected' || toString(worker.kycStatus).toLowerCase() === 'rejected') {
    return {
      derivedStatus: 'rejected',
      reasonCategory: 'persisted_rejected',
    }
  }

  if (worker.status === 'pending') {
    return {
      derivedStatus: 'pending',
      reasonCategory: 'persisted_pending',
    }
  }

  if (!isWorkerRegistrationCompletePreview(worker)) {
    return {
      derivedStatus: 'pending',
      reasonCategory: 'registration_incomplete',
    }
  }

  const workerPlan = resolveAssignedWorkerPlanPreview(worker, snapshot.plans)
  const workerTransactions = snapshot.walletTransactions.filter(
    (transaction) => transaction.entityType === 'worker' && transaction.entityId === worker.id,
  )

  if (!worker.activePlan || !workerPlan) {
    return {
      derivedStatus: 'inactive_subscription_expired',
      reasonCategory: 'missing_active_plan',
    }
  }

  if (isWorkerPlanExpiredRecord(worker)) {
    return {
      derivedStatus: 'inactive_subscription_expired',
      reasonCategory: 'expired_active_plan',
    }
  }

  if (isWorkerPausedByWorkerPreview(worker, workerPlan)) {
    return {
      derivedStatus: 'inactive_paused_by_worker',
      reasonCategory: 'worker_paused',
    }
  }

  const outstandingRegistrationFee = getOutstandingWorkerRegistrationFeePreview(
    worker,
    workerPlan,
    workerTransactions,
  )
  if (outstandingRegistrationFee > 0 && worker.walletBalance < outstandingRegistrationFee) {
    return {
      derivedStatus: 'inactive_wallet_empty',
      reasonCategory: 'registration_fee_unpaid',
    }
  }

  if (workerPlan && isZeroChargeWorkerPlanPreview(workerPlan)) {
    return {
      derivedStatus: 'active',
      reasonCategory: 'eligible_active',
    }
  }

  if (Number(worker.walletBalance || 0) <= 0) {
    return {
      derivedStatus: 'inactive_wallet_empty',
      reasonCategory: 'wallet_balance_non_positive',
    }
  }

  return {
    derivedStatus: 'active',
    reasonCategory: 'eligible_active',
  }
}

const createEmptyWorkerLifecycleReconciliationSummary = (
  source: 'supabase' | 'unavailable',
  reasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory'],
): WorkerLifecycleReconciliationSummary => ({
  source,
  reasonCategory,
  totalWorkersChecked: 0,
  unchangedCount: 0,
  changeRequiredCount: 0,
  activeToInactiveWalletEmptyCount: 0,
  activeToInactiveSubscriptionExpiredCount: 0,
  otherTransitionCount: 0,
  transitions: [],
  changedWorkers: [],
})

const buildWorkerLifecycleReconciliationSummary = ({
  snapshot,
  snapshotSource,
  snapshotReasonCategory,
}: {
  snapshot: LabourMarketplaceSnapshot
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
}): WorkerLifecycleReconciliationSummary => {
  if (snapshotSource !== 'supabase') {
    return createEmptyWorkerLifecycleReconciliationSummary(
      'unavailable',
      snapshotReasonCategory,
    )
  }

  const evaluations = snapshot.workers.map((worker) => ({
    worker,
    evaluation: deriveWorkerLifecycleStatusPreview(worker, snapshot),
  }))

  const normalizedChangedWorkers: WorkerLifecycleReconciliationRow[] = evaluations
    .filter(({ worker, evaluation }) => worker.status !== evaluation.derivedStatus)
    .map(({ worker, evaluation }) => ({
      maskedMobile: maskWhatsappMobile(worker.mobile),
      persistedStatus: worker.status,
      derivedStatus: evaluation.derivedStatus,
      reasonCategory: evaluation.reasonCategory,
    }))

  const transitionMap = new Map<string, WorkerLifecycleTransitionSummary>()
  for (const row of normalizedChangedWorkers) {
    const key = `${row.persistedStatus}->${row.derivedStatus}`
    const existing = transitionMap.get(key)
    if (existing) {
      existing.count += 1
      continue
    }

    transitionMap.set(key, {
      fromStatus: row.persistedStatus,
      toStatus: row.derivedStatus,
      count: 1,
    })
  }

  const activeToInactiveWalletEmptyCount = normalizedChangedWorkers.filter(
    (row) =>
      row.persistedStatus === 'active' && row.derivedStatus === 'inactive_wallet_empty',
  ).length
  const activeToInactiveSubscriptionExpiredCount = normalizedChangedWorkers.filter(
    (row) =>
      row.persistedStatus === 'active' &&
      row.derivedStatus === 'inactive_subscription_expired',
  ).length

  return {
    source: 'supabase',
    reasonCategory: snapshotReasonCategory,
    totalWorkersChecked: evaluations.length,
    unchangedCount: evaluations.length - normalizedChangedWorkers.length,
    changeRequiredCount: normalizedChangedWorkers.length,
    activeToInactiveWalletEmptyCount,
    activeToInactiveSubscriptionExpiredCount,
    otherTransitionCount:
      normalizedChangedWorkers.length -
      activeToInactiveWalletEmptyCount -
      activeToInactiveSubscriptionExpiredCount,
    transitions: [...transitionMap.values()].sort((left, right) => right.count - left.count),
    changedWorkers: normalizedChangedWorkers,
  }
}

export const buildWhatsappAutomationPreviewSummary = ({
  snapshot,
  snapshotSource = 'supabase',
  snapshotReasonCategory = 'live_read_ok',
  vercelEnv = process.env.VERCEL_ENV || '',
  now = new Date(),
  safetySummary = {
    available: false,
    persistenceStatus: 'Persistence unavailable',
    failClosed: true,
    pauseAllSending: true,
    pauseReason: 'persistence_unavailable',
    reviewOnlyDefaults: REVIEW_ONLY_WHATSAPP_DEFAULTS,
  },
  companyConsentStates = {},
  workerConsentStates = {},
  suppressedMobiles = [],
  templateSelections = {
    company_matching_digest: createTemplateSelection('company_matching_digest', null),
    worker_matching_digest: createTemplateSelection('worker_matching_digest', null),
    worker_payment_or_plan_reminder: createTemplateSelection(
      'worker_payment_or_plan_reminder',
      null,
    ),
    worker_kyc_rejected: createTemplateSelection('worker_kyc_rejected', null),
  },
}: PreviewBuildInput): WhatsappAutomationPreviewSummary => {
  const normalizedEnv = String(vercelEnv || '').trim().toLowerCase()
  const previewSendingDisabled = normalizedEnv !== 'production'
  const allowLivePlans = snapshotSource === 'supabase'
  const resolvedTemplateSelections = {
    company_matching_digest: createTemplateSelection('company_matching_digest', null),
    worker_matching_digest: createTemplateSelection('worker_matching_digest', null),
    worker_payment_or_plan_reminder: createTemplateSelection(
      'worker_payment_or_plan_reminder',
      null,
    ),
    worker_kyc_rejected: createTemplateSelection('worker_kyc_rejected', null),
    ...templateSelections,
  }
  const companyPlans = allowLivePlans
    ? planCompanyMatchingDigests({
        snapshot,
        now,
        vercelEnv: normalizedEnv,
        pauseAllSending: safetySummary.pauseAllSending,
        dryRun: true,
        timeZone: safetySummary.reviewOnlyDefaults.timeZone,
        companyConsentStates,
        suppressedMobiles,
      }).map((plan) =>
        toPreviewPlan(
          plan,
          resolvedTemplateSelections.company_matching_digest,
          snapshotSource,
          previewSendingDisabled,
        ),
      )
    : []

  const workerPlans = allowLivePlans
    ? planWorkerMatchingDigests({
        snapshot,
        now,
        vercelEnv: normalizedEnv,
        pauseAllSending: safetySummary.pauseAllSending,
        dryRun: true,
        timeZone: safetySummary.reviewOnlyDefaults.timeZone,
        workerConsentStates,
        suppressedMobiles,
        resolveWorkerAppLink: () => null,
      }).map((plan) =>
        toPreviewPlan(
          plan,
          resolvedTemplateSelections.worker_matching_digest,
          snapshotSource,
          previewSendingDisabled,
        ),
      )
    : []

  const workerPaymentPlans = allowLivePlans
    ? planWorkerPaymentOrPlanReminders({
        snapshot,
        now,
        vercelEnv: normalizedEnv,
        pauseAllSending: safetySummary.pauseAllSending,
        dryRun: true,
        timeZone: safetySummary.reviewOnlyDefaults.timeZone,
        workerConsentStates,
        suppressedMobiles,
      }).map((plan) =>
        toPreviewPlan(
          plan,
          resolvedTemplateSelections.worker_payment_or_plan_reminder,
          snapshotSource,
          previewSendingDisabled,
        ),
      )
    : []

  const workerKycRejectedPlans = allowLivePlans
    ? planWorkerKycRejectedNotifications({
        snapshot,
        now,
        vercelEnv: normalizedEnv,
        pauseAllSending: safetySummary.pauseAllSending,
        dryRun: true,
        timeZone: safetySummary.reviewOnlyDefaults.timeZone,
        workerConsentStates,
        suppressedMobiles,
      }).map((plan) =>
        toPreviewPlan(
          plan,
          resolvedTemplateSelections.worker_kyc_rejected,
          snapshotSource,
          previewSendingDisabled,
        ),
      )
    : []

  const companyFunnel = buildPreviewFunnel(companyPlans, 'company')
  const workerFunnel = buildPreviewFunnel(workerPlans, 'worker')
  const workerPaymentFunnel = buildPreviewFunnel(workerPaymentPlans, 'worker')
  const workerKycRejectedFunnel = buildPreviewFunnel(workerKycRejectedPlans, 'worker')
  const workerLifecycleReconciliation = buildWorkerLifecycleReconciliationSummary({
    snapshot,
    snapshotSource,
    snapshotReasonCategory,
  })

  return {
    checkedAt: now.toISOString(),
    vercelEnv: normalizedEnv || 'development',
    snapshotSource,
    snapshotReasonCategory,
    previewSendingDisabled,
    pauseAllSending: safetySummary.pauseAllSending,
    pauseReason: safetySummary.pauseReason,
    failClosed: true,
    persistenceAvailable: safetySummary.available,
    persistenceStatus: safetySummary.persistenceStatus,
    consentReadState: 'connected',
    suppressionReadState: 'connected',
    templateReadState: 'connected',
    noDatabaseWrites: true,
    noMessagesCalls: true,
    workerDeepLinkAvailable: false,
    automaticEventCategories: [...AUTOMATION_EVENT_TYPES],
    companyPlanCount: companyPlans.length,
    workerPlanCount: workerPlans.length,
    workerPaymentPlanCount: workerPaymentPlans.length,
    workerKycRejectedPlanCount: workerKycRejectedPlans.length,
    companyFunnel,
    workerFunnel,
    workerPaymentFunnel,
    workerKycRejectedFunnel,
    companyPlans,
    workerPlans,
    workerPaymentPlans,
    workerKycRejectedPlans,
    workerLifecycleReconciliation,
  }
}

export const getWhatsappAutomationPreviewSummary = async (): Promise<WhatsappAutomationPreviewSummary> => {
  const readModel = await loadReadModel()
  const summary = buildWhatsappAutomationPreviewSummary({
    snapshot: readModel.snapshot,
    snapshotSource: readModel.snapshotSource,
    snapshotReasonCategory: readModel.snapshotReasonCategory,
    safetySummary: readModel.safetySummary,
    companyConsentStates: readModel.companyConsentStates,
    workerConsentStates: readModel.workerConsentStates,
    suppressedMobiles: readModel.suppressedMobiles,
    templateSelections: readModel.templateSelections,
  })

  return {
    ...summary,
    persistenceAvailable: readModel.persistenceAvailable,
    persistenceStatus: readModel.persistenceStatus,
    consentReadState: readModel.consentReadState,
    suppressionReadState: readModel.suppressionReadState,
    templateReadState: readModel.templateReadState,
  }
}
