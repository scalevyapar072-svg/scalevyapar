import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import type { LabourMarketplaceSnapshot } from '../../lib/labour-marketplace'
import { buildWorkerJobMatchPreview } from '../../lib/whatsapp/worker-job-match-preview'

const snapshot: LabourMarketplaceSnapshot = {
  categories: [{
    id: 'cat-stitching',
    name: 'Stitching',
    slug: 'stitching',
    description: '',
    imageUrl: '',
    showOnHome: true,
    homeOrder: 1,
    demandLevel: 'high',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }],
  plans: [],
  workers: [{
    id: 'worker-1',
    fullName: 'Worker One',
    mobile: '9876543210',
    city: 'Jaipur',
    homeCity: 'Jaipur',
    salaryType: 'daily',
    companyId: '',
    industryCategory: 'Textile',
    businessType: '',
    address: '',
    preferredWorkLocations: [],
    profilePhotoPath: '',
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
    identityProofNumber: '',
    identityProofPath: '',
    registrationCompletedAt: '',
    createdAt: '',
    updatedAt: '',
  }],
  companies: [],
  jobPosts: [{
    id: 'job-1',
    companyId: 'company-1',
    planId: 'company-plan',
    categoryId: 'cat-stitching',
    title: 'Stitching Karigar',
    description: '',
    city: 'Jaipur',
    locationLabel: 'Jaipur',
    latitude: null,
    longitude: null,
    workersNeeded: 2,
    wageAmount: 700,
    validityDays: 30,
    status: 'live',
    reviewStatus: 'approved',
    reviewReason: '',
    submittedAt: '2026-08-28T05:00:00.000Z',
    reviewedAt: '2026-08-29T05:00:00.000Z',
    publishedAt: '2026-08-29T05:00:00.000Z',
    expiresAt: '2026-09-28',
    createdAt: '',
    updatedAt: '',
  }],
  jobApplications: [],
  savedJobs: [],
  workerNotifications: [],
  walletTransactions: [],
  rechargeRequests: [],
  auditLogs: [],
  stats: {
    activeWorkers: 1,
    inactiveWorkers: 0,
    activeCompanies: 0,
    liveJobPosts: 1,
    totalWalletBalance: 100,
    recentAuditLogs: [],
  },
  storage: 'supabase',
}

const build = (overrides: Partial<Parameters<typeof buildWorkerJobMatchPreview>[0]> = {}) =>
  buildWorkerJobMatchPreview({
    snapshot,
    source: 'supabase',
    duplicateReadState: 'connected',
    workerConsentStates: { 'worker-1': { matching_alerts_allowed: true } },
    templateState: { configured: true, approved: true, enabled: true },
    pauseAllSending: false,
    now: new Date('2026-08-29T06:00:00.000Z'),
    timeZone: 'Asia/Kolkata',
    ...overrides,
  })

test('read-only integration summarizes one eligible masked Worker-job pair', () => {
  const summary = build()
  assert.equal(summary.totalPossiblePairs, 1)
  assert.equal(summary.evaluatedPairCount, 1)
  assert.equal(summary.eligibleCount, 1)
  assert.equal(summary.blockedCount, 0)
  assert.equal(summary.rows[0]?.maskedMobile, '+91******3210')
  assert.equal(JSON.stringify(summary).includes('9876543210'), false)
})

test('existing match keys produce already-matched rows without persistence', () => {
  const summary = build({ existingMatchKeys: ['worker-job-match:worker-1:job-1'] })
  assert.equal(summary.alreadyMatchedCount, 1)
  assert.equal(summary.rows[0]?.decision, 'already_matched')
})

test('unavailable duplicate reads are explicit and do not invent existing matches', () => {
  const summary = build({ duplicateReadState: 'query_error' })
  assert.equal(summary.duplicateCheckAvailable, false)
  assert.equal(summary.alreadyMatchedCount, 0)
})

test('pair evaluation is bounded and reports truncation', () => {
  const summary = build({ maxPairs: 0 })
  assert.equal(summary.evaluatedPairCount, 0)
  assert.equal(summary.truncated, true)
})

test('unavailable marketplace snapshot returns no rows', () => {
  const summary = build({ source: 'unavailable' })
  assert.equal(summary.source, 'unavailable')
  assert.equal(summary.rows.length, 0)
})

test('integration module has no write or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/worker-job-match-preview.ts', import.meta.url),
    'utf8',
  )
  assert.equal(source.includes('.insert('), false)
  assert.equal(source.includes('.update('), false)
  assert.equal(source.includes('.upsert('), false)
  assert.equal(source.includes('.delete('), false)
  assert.equal(source.includes('/messages'), false)
})
