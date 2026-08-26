import {
  isJobPostLiveRecord,
  isWorkerSearchActiveRecord,
  type LabourCompanyRecord,
  type LabourJobPostRecord,
  type LabourMarketplaceSnapshot,
  type LabourWorkerRecord,
} from '../labour-marketplace'
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
  planWorkerMatchingDigests,
  type WhatsappAutomationDigestPlan,
} from './automation-executor'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/automation-preview')

type AutomationTemplateSelection = {
  automationEventType: 'company_matching_digest' | 'worker_matching_digest'
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
}

type AutomationPreviewPlan = {
  automationEventType: 'company_matching_digest' | 'worker_matching_digest'
  recipientType: 'worker' | 'company'
  maskedMobile: string
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
  ctaUrl: string | null
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
  consentEligible: boolean
  templateEligible: boolean
  deepLinkEligible: boolean
  dispatchDecision: 'ready' | 'queued' | 'blocked'
  dispatchable: boolean
}

type AutomationPreviewFunnel = {
  marketplaceCandidatePlans: number
  consentEligiblePlans: number
  templateEligiblePlans: number
  deepLinkEligiblePlans: number
  dispatchReadyPlans: number
  queuedPlans: number
  blockedPlans: number
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
  companyFunnel: AutomationPreviewFunnel
  workerFunnel: AutomationPreviewFunnel
  companyPlans: AutomationPreviewPlan[]
  workerPlans: AutomationPreviewPlan[]
}

type PreviewBuildInput = {
  snapshot: LabourMarketplaceSnapshot
  snapshotSource?: 'supabase' | 'unavailable'
  snapshotReasonCategory?: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
  vercelEnv?: string
  now?: Date
  safetySummary?: WhatsappSafetyStatusSummary
  companyConsentStates?: Record<string, { matching_alerts_allowed?: boolean }>
  workerConsentStates?: Record<string, { matching_alerts_allowed?: boolean }>
  suppressedMobiles?: Iterable<string>
  templateSelections?: Record<
    'company_matching_digest' | 'worker_matching_digest',
    AutomationTemplateSelection
  >
}

type ReadModel = {
  snapshot: LabourMarketplaceSnapshot
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory: WhatsappAutomationPreviewSummary['snapshotReasonCategory']
  safetySummary: WhatsappSafetyStatusSummary
  companyConsentStates: Record<string, { matching_alerts_allowed?: boolean }>
  workerConsentStates: Record<string, { matching_alerts_allowed?: boolean }>
  suppressedMobiles: string[]
  templateSelections: Record<
    'company_matching_digest' | 'worker_matching_digest',
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
    const [workersResult, companiesResult, jobPostsResult] = await Promise.all([
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
    ])

    if (workersResult.error || companiesResult.error || jobPostsResult.error) {
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
  automationEventType: 'company_matching_digest' | 'worker_matching_digest',
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
  automationEventType: 'company_matching_digest' | 'worker_matching_digest',
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
      },
      templateReadState: 'connected' as const,
    }
  } catch {
    return {
      templateSelections: {
        company_matching_digest: createTemplateSelection('company_matching_digest', null),
        worker_matching_digest: createTemplateSelection('worker_matching_digest', null),
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

    const companyConsentStates: Record<string, { matching_alerts_allowed?: boolean }> = {}
    const workerConsentStates: Record<string, { matching_alerts_allowed?: boolean }> = {}

    for (const row of data || []) {
      const candidate = row as Record<string, unknown>
      const recipientType = toString(candidate.recipient_type)
      const recipientId = toString(candidate.recipient_id)
      const consentType = toString(candidate.consent_type)
      if (!recipientId || consentType !== 'matching_alerts_allowed') {
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
        matching_alerts_allowed: Boolean(candidate.allowed),
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

const resolvePreviewDispatchState = ({
  snapshotSource,
  plan,
  selection,
  previewSendingDisabled,
}: {
  snapshotSource: 'supabase' | 'unavailable'
  plan: WhatsappAutomationDigestPlan
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
  plan: WhatsappAutomationDigestPlan,
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
      ctaUrl: plan.ctaUrl,
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
      consentEligible,
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
  const templateEligiblePlans = plans.filter(
    (plan) => plan.consentEligible && plan.templateEligible,
  ).length
  const deepLinkEligiblePlans = plans.filter(
    (plan) =>
      plan.consentEligible &&
      plan.templateEligible &&
      (recipientType === 'company' || plan.deepLinkEligible),
  ).length

  return {
    marketplaceCandidatePlans: plans.length,
    consentEligiblePlans,
    templateEligiblePlans,
    deepLinkEligiblePlans,
    dispatchReadyPlans: plans.filter((plan) => plan.dispatchDecision === 'ready').length,
    queuedPlans: plans.filter((plan) => plan.dispatchDecision === 'queued').length,
    blockedPlans: plans.filter((plan) => plan.dispatchDecision === 'blocked').length,
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
  },
}: PreviewBuildInput): WhatsappAutomationPreviewSummary => {
  const normalizedEnv = String(vercelEnv || '').trim().toLowerCase()
  const previewSendingDisabled = normalizedEnv !== 'production'
  const allowLivePlans = snapshotSource === 'supabase'
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
          templateSelections.company_matching_digest,
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
          templateSelections.worker_matching_digest,
          snapshotSource,
          previewSendingDisabled,
        ),
      )
    : []

  const companyFunnel = buildPreviewFunnel(companyPlans, 'company')
  const workerFunnel = buildPreviewFunnel(workerPlans, 'worker')

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
    companyFunnel,
    workerFunnel,
    companyPlans,
    workerPlans,
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
