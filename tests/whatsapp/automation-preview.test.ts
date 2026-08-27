import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import type {
  LabourMarketplaceSnapshot,
  LabourPlanRecord,
  LabourWalletTransactionRecord,
  LabourWorkerRecord,
} from '../../lib/labour-marketplace'
import { handleAdminWhatsappReadOnlyGet } from '../../lib/whatsapp/admin-readonly-route'
import { buildWhatsappAutomationPreviewSummary } from '../../lib/whatsapp/automation-preview'

const previewSourcePath = path.join(
  process.cwd(),
  'lib',
  'whatsapp',
  'automation-preview.ts',
)
const routeSourcePath = path.join(
  process.cwd(),
  'app',
  'api',
  'admin',
  'labour',
  'whatsapp',
  'automation-preview',
  'route.ts',
)
const componentSourcePath = path.join(
  process.cwd(),
  'components',
  'admin',
  'labour-whatsapp-automation-preview.tsx',
)

const makeSnapshot = (): LabourMarketplaceSnapshot => ({
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
  storage: 'json',
})

const makeWorker = (
  id: string,
  overrides: Partial<LabourWorkerRecord> = {},
): LabourWorkerRecord => ({
  id,
  fullName: `Worker ${id}`,
  mobile: (() => {
    const digits = id.replace(/\D/g, '').slice(-4).padStart(4, '0')
    return `987650${digits}`
  })(),
  city: 'Surat',
  homeCity: 'Surat',
  salaryType: 'daily',
  companyId: '',
  industryCategory: 'Textile',
  businessType: '',
  address: '',
  preferredWorkLocations: [],
  profilePhotoPath: '/uploads/profile.jpg',
  resumeDocumentPath: '',
  skills: [],
  experienceYears: 2,
  expectedDailyWage: 500,
  minimumExpectedWage: 450,
  maximumExpectedWage: 550,
  walletBalance: 100,
  registrationFeePaid: true,
  activePlan: 'worker-plan',
  planValidFrom: '2026-08-01',
  planValidUntil: '2099-01-01',
  lastWalletDeductionDate: '',
  workerPausedByWorker: false,
  workerPausedAt: '',
  workerReactivatedAt: '',
  status: 'active',
  kycStatus: 'approved',
  kycRemarks: '',
  availability: 'available_today',
  isVisible: true,
  categoryIds: ['cat-stitching'],
  identityProofType: 'aadhaar',
  identityProofNumber: '123456789012',
  identityProofPath: '/uploads/proof.jpg',
  registrationCompletedAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

const makePlan = (
  id: string,
  overrides: Partial<LabourPlanRecord> = {},
): LabourPlanRecord => ({
  id,
  audience: 'worker',
  name: 'Paid Worker Plan',
  categoryId: undefined,
  industryCategoryValues: [],
  businessTypeValues: [],
  labourCategoryIds: [],
  jobPostLimit: 1,
  registrationFee: 0,
  walletCredit: 0,
  planAmount: 199,
  planValidityDays: 30,
  jobPostLiveDays: 30,
  validityDays: 30,
  dailyCharge: 5,
  description: '',
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

const makeWalletTransaction = (
  id: string,
  overrides: Partial<LabourWalletTransactionRecord> = {},
): LabourWalletTransactionRecord => ({
  id,
  entityType: 'worker',
  entityId: 'worker-1',
  entityName: 'Worker',
  city: 'Surat',
  transactionType: 'registration_fee',
  amount: 99,
  direction: 'debit',
  status: 'completed',
  reference: '',
  note: '',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  ...overrides,
})

const assertNoStoreHeaders = (response: Response) => {
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, no-cache, max-age=0, must-revalidate',
  )
  assert.equal(response.headers.get('pragma'), 'no-cache')
  assert.equal(response.headers.get('expires'), '0')
}

test('automation dry-run preview source remains read-only and never reaches /messages', () => {
  const source = readFileSync(previewSourcePath, 'utf8')

  for (const disallowedWrite of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    assert.equal(
      source.includes(disallowedWrite),
      false,
      `Expected dry-run source to exclude ${disallowedWrite}`,
    )
  }

  assert.equal(source.includes('/messages'), false)
  assert.ok(source.includes("resolveWorkerAppLink: () => null"))
  assert.ok(source.includes('noDatabaseWrites: true'))
  assert.ok(source.includes('noMessagesCalls: true'))
  assert.ok(source.includes('evaluateWorkerLifecycle'))
  assert.equal(source.includes('return parseJsonSnapshot()'), false)
  assert.equal(source.includes('company_id, industry_category, business_type'), false)
  assert.equal(source.includes('city, area, pincode'), false)
  assert.equal(source.includes("toString(worker.kycStatus).toLowerCase() === 'rejected'"), false)
})

test('automation dry-run route stays admin-only and the card fetches the read-only endpoint', () => {
  const routeSource = readFileSync(routeSourcePath, 'utf8')
  const componentSource = readFileSync(componentSourcePath, 'utf8')

  assert.ok(routeSource.includes('requireAdmin'))
  assert.ok(routeSource.includes('handleAdminWhatsappReadOnlyGet'))
  assert.ok(componentSource.includes('/api/admin/labour/whatsapp/automation-preview'))
})

test('read-only automation preview helper preserves admin protection and no-store headers', async () => {
  const response = await handleAdminWhatsappReadOnlyGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/automation-preview'),
    requireAdmin: async () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
    getPayload: async () => ({ success: true }),
    errorMessage: 'Failed to load WhatsApp automation preview.',
  })

  assert.equal(response.status, 401)
  assertNoStoreHeaders(response)
})

test('automation preview masks recipients and reports preview, pause, quiet-hours, consent, and suppression blocks', () => {
  const snapshot = makeSnapshot()
  snapshot.plans.push(makePlan('worker-plan'))
  snapshot.companies.push({
    id: 'company-1',
    companyName: 'ScaleVyapar Textile',
    contactPerson: 'Owner',
    email: 'owner@example.com',
    mobile: '9876500000',
    contactMobile: '9876500000',
    businessType: 'Factory',
    industryCategory: 'Textile',
    gstNumber: '',
    companyAddress: '',
    state: 'Gujarat',
    city: 'Surat',
    area: '',
    pincode: '',
    workersNeeded: 8,
    hiringType: 'daily',
    businessDescription: '',
    gstCertificatePath: '',
    companyProofPath: '',
    ownerIdProofPath: '',
    categoryIds: ['cat-stitching'],
    status: 'active',
    registrationFeePaid: true,
    activePlan: 'company-plan',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  })
  snapshot.jobPosts.push({
    id: 'job-1',
    companyId: 'company-1',
    planId: 'company-plan',
    categoryId: 'cat-stitching',
    title: 'Stitching helper',
    description: '',
    city: 'Surat',
    locationLabel: 'Surat',
    latitude: null,
    longitude: null,
    workersNeeded: 3,
    wageAmount: 550,
    validityDays: 15,
    status: 'live',
    publishedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
  })
  snapshot.workers.push({
    id: 'worker-1',
    fullName: 'Worker One',
    mobile: '9876543210',
    city: 'Surat',
    homeCity: 'Surat',
    salaryType: 'daily',
    companyId: '',
    industryCategory: 'Textile',
    businessType: '',
    address: '',
    preferredWorkLocations: [],
    profilePhotoPath: '/uploads/profile.jpg',
    resumeDocumentPath: '',
    skills: [],
    experienceYears: 2,
    expectedDailyWage: 500,
    minimumExpectedWage: 450,
    maximumExpectedWage: 550,
    walletBalance: 0,
    registrationFeePaid: true,
    activePlan: 'worker-plan',
    planValidFrom: '2026-08-01',
    planValidUntil: '2099-01-01',
    lastWalletDeductionDate: '',
    workerPausedByWorker: false,
    workerPausedAt: '',
    workerReactivatedAt: '',
    status: 'active',
    kycStatus: 'approved',
    kycRemarks: '',
    availability: 'available_today',
    isVisible: true,
    categoryIds: ['cat-stitching'],
    identityProofType: 'aadhaar',
    identityProofNumber: '123456789012',
    identityProofPath: '/uploads/proof.jpg',
    registrationCompletedAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  })
  snapshot.workers.push(
    {
      id: 'worker-wallet',
      fullName: 'Worker Wallet',
      mobile: '9876543211',
      city: 'Surat',
      homeCity: 'Surat',
      salaryType: 'daily',
      companyId: '',
      industryCategory: 'Textile',
      businessType: '',
      address: '',
      preferredWorkLocations: [],
      profilePhotoPath: '/uploads/profile.jpg',
      resumeDocumentPath: '',
      skills: [],
      experienceYears: 2,
      expectedDailyWage: 500,
      minimumExpectedWage: 450,
      maximumExpectedWage: 550,
      walletBalance: 0,
      registrationFeePaid: true,
      activePlan: 'worker-plan',
      planValidFrom: '2026-08-01',
      planValidUntil: '2099-01-01',
      lastWalletDeductionDate: '',
      workerPausedByWorker: false,
      workerPausedAt: '',
      workerReactivatedAt: '',
      status: 'inactive_wallet_empty',
      kycStatus: 'approved',
      kycRemarks: '',
      availability: 'available_today',
      isVisible: false,
      categoryIds: ['cat-stitching'],
      identityProofType: 'aadhaar',
      identityProofNumber: '123456789012',
      identityProofPath: '/uploads/proof.jpg',
      registrationCompletedAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'worker-rejected',
      fullName: 'Worker Rejected',
      mobile: '9876543212',
      city: 'Surat',
      homeCity: 'Surat',
      salaryType: 'daily',
      companyId: '',
      industryCategory: 'Textile',
      businessType: '',
      address: '',
      preferredWorkLocations: [],
      profilePhotoPath: '/uploads/profile.jpg',
      resumeDocumentPath: '',
      skills: [],
      experienceYears: 2,
      expectedDailyWage: 500,
      minimumExpectedWage: 450,
      maximumExpectedWage: 550,
      walletBalance: 0,
      registrationFeePaid: true,
      activePlan: 'worker-plan',
      planValidFrom: '2026-08-01',
      planValidUntil: '2099-01-01',
      lastWalletDeductionDate: '',
      workerPausedByWorker: false,
      workerPausedAt: '',
      workerReactivatedAt: '',
      status: 'rejected',
      kycStatus: 'rejected',
      kycRemarks: 'unsafe admin note',
      availability: 'available_today',
      isVisible: false,
      categoryIds: ['cat-stitching'],
      identityProofType: 'aadhaar',
      identityProofNumber: '123456789012',
      identityProofPath: '/uploads/proof.jpg',
      registrationCompletedAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-25T08:30:00.000Z',
    },
  )

  const previewSummary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'preview',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      pauseAllSending: false,
      pauseReason: 'explicit_false',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
    companyConsentStates: {
      'company-1': { matching_alerts_allowed: true },
    },
    workerConsentStates: {
      'worker-1': { matching_alerts_allowed: true },
      'worker-wallet': { service_allowed: true },
      'worker-rejected': { service_allowed: true },
    },
    templateSelections: {
      company_matching_digest: {
        automationEventType: 'company_matching_digest',
        templateName: 'company_matching_digest_hi',
        templateLanguage: 'hi',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
      worker_matching_digest: {
        automationEventType: 'worker_matching_digest',
        templateName: 'worker_matching_digest_en',
        templateLanguage: 'en',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
    },
  })

  assert.equal(previewSummary.snapshotSource, 'supabase')
  assert.equal(previewSummary.snapshotReasonCategory, 'live_read_ok')
  assert.equal(previewSummary.companyPlans.length, 1)
  assert.equal(previewSummary.workerPlans.length, 1)
  assert.equal(previewSummary.companyFunnel.marketplaceCandidatePlans, 1)
  assert.equal(previewSummary.companyFunnel.consentEligiblePlans, 1)
  assert.equal(previewSummary.companyFunnel.templateEligiblePlans, 1)
  assert.equal(previewSummary.companyFunnel.dispatchReadyPlans, 0)
  assert.equal(previewSummary.workerFunnel.marketplaceCandidatePlans, 1)
  assert.equal(previewSummary.workerFunnel.consentEligiblePlans, 1)
  assert.equal(previewSummary.workerFunnel.suppressionEligiblePlans, 1)
  assert.equal(previewSummary.workerFunnel.templateEligiblePlans, 1)
  assert.equal(previewSummary.workerFunnel.deepLinkEligiblePlans, 0)
  assert.equal(previewSummary.workerPaymentPlanCount, 1)
  assert.equal(previewSummary.workerKycRejectedPlanCount, 1)
  assert.equal(previewSummary.workerPaymentFunnel.marketplaceCandidatePlans, 1)
  assert.equal(previewSummary.workerPaymentFunnel.consentEligiblePlans, 1)
  assert.equal(previewSummary.workerPaymentFunnel.suppressionEligiblePlans, 1)
  assert.equal(previewSummary.workerPaymentFunnel.templateEligiblePlans, 0)
  assert.equal(previewSummary.workerPaymentFunnel.deepLinkEligiblePlans, 0)
  assert.equal(previewSummary.workerKycRejectedFunnel.marketplaceCandidatePlans, 1)
  assert.equal(previewSummary.companyPlans[0]?.maskedMobile, '+91******0000')
  assert.equal(
    previewSummary.companyPlans[0]?.exclusionReason,
    'whatsapp-disabled-outside-production',
  )
  assert.equal(previewSummary.companyPlans[0]?.dispatchDecision, 'blocked')
  assert.equal(previewSummary.workerPlans[0]?.exclusionReason, 'missing_cta_url')
  assert.equal(previewSummary.workerPlans[0]?.dispatchDecision, 'blocked')
  assert.equal(previewSummary.companyPlans[0]?.templateName, 'company_matching_digest_hi')
  assert.equal(previewSummary.workerPlans[0]?.templateLanguage, 'en')
  assert.equal(previewSummary.companyPlans[0]?.consentEligible, true)
  assert.equal(previewSummary.companyPlans[0]?.templateEligible, true)
  assert.equal(previewSummary.workerPlans[0]?.deepLinkEligible, false)
  assert.equal(previewSummary.workerPaymentPlans[0]?.maskedMobile, '+91******3211')
  assert.equal(previewSummary.workerPaymentPlans[0]?.subreason, 'wallet_empty')
  assert.equal(previewSummary.workerPaymentPlans[0]?.templateStatus, 'not_configured')
  assert.equal(previewSummary.workerPaymentPlans[0]?.ctaStatus, 'not_available')
  assert.equal(previewSummary.workerPaymentPlans[0]?.exclusionReason, 'template_not_configured')
  assert.equal(previewSummary.workerKycRejectedPlans[0]?.subreason, 'kyc_rejected')
  assert.equal(previewSummary.workerKycRejectedPlans[0]?.messagePreview?.includes('unsafe admin note'), false)
  assert.equal(previewSummary.workerKycRejectedPlans[0]?.templateEligible, false)
  assert.equal(previewSummary.workerLifecycleReconciliation.source, 'supabase')
  assert.equal(previewSummary.workerLifecycleReconciliation.totalWorkersChecked, 3)
  assert.equal(previewSummary.workerLifecycleReconciliation.changeRequiredCount, 1)
  assert.equal(
    previewSummary.workerLifecycleReconciliation.activeToInactiveWalletEmptyCount,
    1,
  )
  assert.equal(
    previewSummary.workerLifecycleReconciliation.changedWorkers[0]?.maskedMobile,
    '+91******3210',
  )
  assert.equal(
    previewSummary.workerLifecycleReconciliation.changedWorkers[0]?.persistedStatus,
    'active',
  )
  assert.equal(
    previewSummary.workerLifecycleReconciliation.changedWorkers[0]?.derivedStatus,
    'inactive_wallet_empty',
  )
  assert.equal(
    previewSummary.workerLifecycleReconciliation.changedWorkers[0]?.reasonCategory,
    'wallet_balance_non_positive',
  )

  const quietHoursSummary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T17:30:00.000Z'),
    vercelEnv: 'production',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      pauseAllSending: false,
      pauseReason: 'explicit_false',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
    companyConsentStates: {
      'company-1': { matching_alerts_allowed: true },
    },
    templateSelections: {
      company_matching_digest: {
        automationEventType: 'company_matching_digest',
        templateName: 'company_matching_digest_hi',
        templateLanguage: 'hi',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
      worker_matching_digest: {
        automationEventType: 'worker_matching_digest',
        templateName: 'worker_matching_digest_en',
        templateLanguage: 'en',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
    },
  })

  assert.equal(quietHoursSummary.companyPlans[0]?.eligibilityResult, 'queued')
  assert.equal(quietHoursSummary.companyPlans[0]?.dispatchDecision, 'queued')
  assert.equal(quietHoursSummary.companyPlans[0]?.quietHoursDecision, 'queue_until_allowed')
  assert.equal(quietHoursSummary.companyPlans[0]?.exclusionReason, 'inside_quiet_hours')

  const pausedSummary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'production',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: true,
      pauseAllSending: true,
      pauseReason: 'explicit_true',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
    companyConsentStates: {
      'company-1': { matching_alerts_allowed: true },
    },
    templateSelections: {
      company_matching_digest: {
        automationEventType: 'company_matching_digest',
        templateName: 'company_matching_digest_hi',
        templateLanguage: 'hi',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
      worker_matching_digest: {
        automationEventType: 'worker_matching_digest',
        templateName: 'worker_matching_digest_en',
        templateLanguage: 'en',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
    },
  })

  assert.equal(pausedSummary.companyPlans[0]?.exclusionReason, 'whatsapp-paused')

  const suppressedSummary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'production',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      pauseAllSending: false,
      pauseReason: 'explicit_false',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
    companyConsentStates: {
      'company-1': { matching_alerts_allowed: true },
    },
    suppressedMobiles: ['9876500000'],
    templateSelections: {
      company_matching_digest: {
        automationEventType: 'company_matching_digest',
        templateName: 'company_matching_digest_hi',
        templateLanguage: 'hi',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
      worker_matching_digest: {
        automationEventType: 'worker_matching_digest',
        templateName: 'worker_matching_digest_en',
        templateLanguage: 'en',
        templateConfigured: true,
        templateApproved: true,
        templateEnabled: true,
      },
    },
  })

  assert.equal(suppressedSummary.companyPlans[0]?.exclusionReason, 'suppressed')

  const missingConsentSummary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'production',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      pauseAllSending: false,
      pauseReason: 'explicit_false',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
  })

  assert.equal(
    missingConsentSummary.companyPlans[0]?.exclusionReason,
    'missing_consent_matching_alerts_allowed',
  )
  assert.equal(missingConsentSummary.companyPlans[0]?.consentEligible, false)
  assert.equal(missingConsentSummary.companyFunnel.consentEligiblePlans, 0)
})

test('automation preview blocks missing templates after consent succeeds', () => {
  const snapshot = makeSnapshot()
  snapshot.plans.push(makePlan('worker-plan'))
  snapshot.companies.push({
    id: 'company-1',
    companyName: 'ScaleVyapar Textile',
    contactPerson: 'Owner',
    email: 'owner@example.com',
    mobile: '9876500000',
    contactMobile: '9876500000',
    businessType: 'Factory',
    industryCategory: 'Textile',
    gstNumber: '',
    companyAddress: '',
    state: 'Gujarat',
    city: 'Surat',
    area: '',
    pincode: '',
    workersNeeded: 8,
    hiringType: 'daily',
    businessDescription: '',
    gstCertificatePath: '',
    companyProofPath: '',
    ownerIdProofPath: '',
    categoryIds: ['cat-stitching'],
    status: 'active',
    registrationFeePaid: true,
    activePlan: 'company-plan',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  })
  snapshot.jobPosts.push({
    id: 'job-1',
    companyId: 'company-1',
    planId: 'company-plan',
    categoryId: 'cat-stitching',
    title: 'Stitching helper',
    description: '',
    city: 'Surat',
    locationLabel: 'Surat',
    latitude: null,
    longitude: null,
    workersNeeded: 3,
    wageAmount: 550,
    validityDays: 15,
    status: 'live',
    publishedAt: '2026-08-24T00:00:00.000Z',
    expiresAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
  })
  snapshot.workers.push({
    id: 'worker-1',
    fullName: 'Worker One',
    mobile: '9876543210',
    city: 'Surat',
    homeCity: 'Surat',
    salaryType: 'daily',
    companyId: '',
    industryCategory: 'Textile',
    businessType: '',
    address: '',
    preferredWorkLocations: [],
    profilePhotoPath: '/uploads/profile.jpg',
    resumeDocumentPath: '',
    skills: [],
    experienceYears: 2,
    expectedDailyWage: 500,
    minimumExpectedWage: 450,
    maximumExpectedWage: 550,
    walletBalance: 0,
    registrationFeePaid: true,
    activePlan: 'worker-plan',
    planValidFrom: '2026-08-01',
    planValidUntil: '2099-01-01',
    lastWalletDeductionDate: '',
    workerPausedByWorker: false,
    workerPausedAt: '',
    workerReactivatedAt: '',
    status: 'active',
    kycStatus: 'approved',
    kycRemarks: '',
    availability: 'available_today',
    isVisible: true,
    categoryIds: ['cat-stitching'],
    identityProofType: 'aadhaar',
    identityProofNumber: '123456789012',
    identityProofPath: '/uploads/proof.jpg',
    registrationCompletedAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  })

  const summary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'production',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      pauseAllSending: false,
      pauseReason: 'explicit_false',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
    companyConsentStates: {
      'company-1': { matching_alerts_allowed: true },
    },
  })

  assert.equal(summary.companyPlans[0]?.templateEligible, false)
  assert.equal(summary.companyPlans[0]?.exclusionReason, 'template_not_configured')
  assert.equal(summary.companyFunnel.templateEligiblePlans, 0)
})

test('automation preview fails closed when the live marketplace snapshot is unavailable', () => {
  const snapshot = makeSnapshot()
  snapshot.companies.push({
    id: 'company-1',
    companyName: 'ScaleVyapar Textile',
    contactPerson: 'Owner',
    email: 'owner@example.com',
    mobile: '9876500000',
    contactMobile: '9876500000',
    businessType: 'Factory',
    industryCategory: 'Textile',
    gstNumber: '',
    companyAddress: '',
    state: 'Gujarat',
    city: 'Surat',
    area: '',
    pincode: '',
    workersNeeded: 8,
    hiringType: 'daily',
    businessDescription: '',
    gstCertificatePath: '',
    companyProofPath: '',
    ownerIdProofPath: '',
    categoryIds: ['cat-stitching'],
    status: 'active',
    registrationFeePaid: true,
    activePlan: 'company-plan',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  })

  const summary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'unavailable',
    snapshotReasonCategory: 'marketplace_query_failed',
    now: new Date('2026-08-25T06:00:00.000Z'),
    vercelEnv: 'preview',
  })

  assert.equal(summary.snapshotSource, 'unavailable')
  assert.equal(summary.snapshotReasonCategory, 'marketplace_query_failed')
  assert.equal(summary.companyPlanCount, 0)
  assert.equal(summary.workerPlanCount, 0)
  assert.equal(summary.companyFunnel.marketplaceCandidatePlans, 0)
  assert.equal(summary.workerFunnel.marketplaceCandidatePlans, 0)
  assert.equal(summary.workerLifecycleReconciliation.source, 'unavailable')
  assert.equal(summary.workerLifecycleReconciliation.totalWorkersChecked, 0)
})

test('worker lifecycle reconciliation stays read-only and preserves approved precedence rules', () => {
  const snapshot = makeSnapshot()
  snapshot.plans.push(
    makePlan('worker-plan', {
      name: 'Paid Worker Plan',
      registrationFee: 100,
      dailyCharge: 5,
      planAmount: 199,
    }),
    makePlan('worker-plan-free', {
      id: 'plan-worker-free-7-days',
      name: 'Free Worker Plan',
      registrationFee: 0,
      dailyCharge: 0,
      planAmount: 0,
      planValidityDays: 7,
      validityDays: 7,
    }),
  )

  snapshot.workers.push(
    makeWorker('pending-complete', {
      status: 'pending',
      walletBalance: 200,
    }),
  )

  for (let index = 0; index < 245; index += 1) {
    snapshot.workers.push(
      makeWorker(`pending-${index}`, {
        status: 'pending',
        walletBalance: 0,
        registrationFeePaid: true,
        activePlan: '',
        registrationCompletedAt: '',
        profilePhotoPath: '',
        identityProofType: '',
        identityProofNumber: '',
        identityProofPath: '',
        kycStatus: 'submitted',
      }),
    )
  }

  snapshot.workers.push(
    makeWorker('blocked', { status: 'blocked' }),
    makeWorker('rejected', { status: 'rejected', kycStatus: 'rejected', kycRemarks: 'unsafe note' }),
    makeWorker('legacy-blank-kyc', {
      status: 'active',
      activePlan: 'plan-worker-free-7-days',
      walletBalance: 0,
      kycStatus: '',
    }),
    makeWorker('legacy-pending-review-kyc', {
      status: 'active',
      activePlan: 'plan-worker-free-7-days',
      walletBalance: 0,
      kycStatus: 'pending_review',
    }),
    makeWorker('incomplete-active', {
      status: 'active',
      profilePhotoPath: '',
      identityProofType: '',
      identityProofNumber: '',
      identityProofPath: '',
      kycStatus: '',
    }),
    makeWorker('paused', {
      status: 'active',
      workerPausedByWorker: true,
      walletBalance: 200,
    }),
    makeWorker('expired', {
      status: 'active',
      planValidUntil: '2026-08-10',
      walletBalance: 200,
    }),
    makeWorker('fee-gap', {
      status: 'active',
      registrationFeePaid: false,
      walletBalance: 50,
    }),
    makeWorker('fee-tx-complete', {
      status: 'active',
      registrationFeePaid: false,
      walletBalance: 200,
    }),
    makeWorker('free-zero-wallet', {
      status: 'active',
      activePlan: 'plan-worker-free-7-days',
      walletBalance: 0,
    }),
    makeWorker('paid-zero-wallet', {
      status: 'active',
      walletBalance: 0,
    }),
    makeWorker('missing-plan', {
      status: 'active',
      activePlan: '',
      walletBalance: 200,
    }),
    makeWorker('eligible', {
      status: 'active',
      walletBalance: 250,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
    }),
  )
  snapshot.walletTransactions.push(
    makeWalletTransaction('fee-tx-complete-transaction', {
      entityId: 'fee-tx-complete',
      entityName: 'Worker fee-tx-complete',
    }),
  )

  const summary = buildWhatsappAutomationPreviewSummary({
    snapshot,
    snapshotSource: 'supabase',
    snapshotReasonCategory: 'live_read_ok',
    now: new Date('2026-08-26T06:00:00.000Z'),
    vercelEnv: 'preview',
    safetySummary: {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: true,
      pauseAllSending: true,
      pauseReason: 'explicit_true',
      reviewOnlyDefaults: {
        workerDailyLimit: 3,
        companyJobDailyLimit: 5,
        manualBulkCap: 100,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        timeZone: 'Asia/Kolkata',
      },
    },
  })

  assert.equal(summary.workerLifecycleReconciliation.source, 'supabase')
  assert.equal(summary.workerLifecycleReconciliation.totalWorkersChecked, 259)
  assert.equal(summary.workerLifecycleReconciliation.unchangedCount, 253)
  assert.equal(summary.workerLifecycleReconciliation.changeRequiredCount, 6)
  assert.equal(
    summary.workerLifecycleReconciliation.activeToInactiveWalletEmptyCount,
    2,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.activeToInactiveSubscriptionExpiredCount,
    2,
  )
  assert.equal(summary.workerLifecycleReconciliation.otherTransitionCount, 2)
  assert.equal(
    summary.workerLifecycleReconciliation.transitions.some(
      (transition) =>
        transition.fromStatus === 'active' &&
        transition.toStatus === 'inactive_wallet_empty' &&
        transition.count === 2,
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.transitions.some(
      (transition) =>
        transition.fromStatus === 'active' &&
        transition.toStatus === 'inactive_subscription_expired' &&
        transition.count === 2,
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.transitions.some(
      (transition) =>
        transition.fromStatus === 'active' &&
        transition.toStatus === 'inactive_paused_by_worker' &&
        transition.count === 1,
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.transitions.some(
      (transition) =>
        transition.fromStatus === 'active' &&
        transition.toStatus === 'pending' &&
        transition.count === 1,
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.every(
      (worker) => worker.maskedMobile.includes('******'),
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'inactive_wallet_empty' &&
        worker.reasonCategory === 'registration_fee_unpaid',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'inactive_wallet_empty' &&
        worker.reasonCategory === 'wallet_balance_non_positive',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'inactive_subscription_expired' &&
        worker.reasonCategory === 'expired_active_plan',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'inactive_subscription_expired' &&
        worker.reasonCategory === 'missing_active_plan',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'inactive_paused_by_worker' &&
        worker.reasonCategory === 'worker_paused',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) =>
        worker.derivedStatus === 'pending' &&
        worker.reasonCategory === 'registration_incomplete',
    ),
    true,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) => worker.reasonCategory === 'persisted_pending',
    ),
    false,
  )
  assert.equal(
    summary.workerLifecycleReconciliation.changedWorkers.some(
      (worker) => worker.derivedStatus === 'pending' && worker.reasonCategory === 'persisted_pending',
    ),
    false,
  )
})
