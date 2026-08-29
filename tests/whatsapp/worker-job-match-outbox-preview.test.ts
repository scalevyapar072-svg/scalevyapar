import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import type { LabourMarketplaceSnapshot } from '../../lib/labour-marketplace'
import { buildWorkerJobMatchOutboxPreview } from '../../lib/whatsapp/worker-job-match-outbox-preview'

const snapshot = {
  categories: [{ id: 'cat-1', name: 'Stitching' }],
  plans: [],
  workers: [{
    id: 'worker-1', mobile: '9876543210', city: 'Jaipur', homeCity: 'Jaipur',
    status: 'active', kycStatus: 'approved', availability: 'available_today',
    isVisible: true, activePlan: 'worker-plan', planValidUntil: '2099-01-01',
    categoryIds: ['cat-1'], walletBalance: 100, registrationFeePaid: true,
    preferredWorkLocations: [],
  }],
  companies: [],
  jobPosts: [{
    id: 'job-1', companyId: 'company-1', categoryId: 'cat-1',
    title: 'Stitching Karigar', city: 'Jaipur', status: 'live',
    reviewStatus: 'approved', expiresAt: '2026-09-30',
  }],
  jobApplications: [], savedJobs: [], workerNotifications: [], walletTransactions: [],
  rechargeRequests: [], auditLogs: [],
  stats: {
    activeWorkers: 1, inactiveWorkers: 0, activeCompanies: 0, liveJobPosts: 1,
    totalWalletBalance: 100, recentAuditLogs: [],
  },
  storage: 'supabase',
} as unknown as LabourMarketplaceSnapshot

const now = new Date('2026-08-29T06:00:00.000Z')
const candidate = {
  id: 'candidate-1',
  matchKey: 'worker-job-match:worker-1:job-1',
  workerId: 'worker-1',
  jobPostId: 'job-1',
  companyId: 'company-1',
  candidateState: 'eligible',
  lastValidatedAt: '2026-08-29T05:55:00.000Z',
}

const build = (overrides: Partial<Parameters<typeof buildWorkerJobMatchOutboxPreview>[0]> = {}) =>
  buildWorkerJobMatchOutboxPreview({
    snapshot,
    source: 'supabase',
    candidateReadState: 'connected',
    outboxReadState: 'connected',
    candidates: [candidate],
    workerConsentStates: { 'worker-1': { matching_alerts_allowed: true } },
    templateState: { configured: true, approved: true, enabled: true },
    pauseAllSending: false,
    workerDailyLimit: 3,
    now,
    timeZone: 'Asia/Kolkata',
    ...overrides,
  })

test('eligible candidate produces one masked read-only outbox Preview decision', () => {
  const summary = build()
  assert.equal(summary.evaluatedCandidateCount, 1)
  assert.equal(summary.wouldEnqueueCount, 1)
  assert.equal(summary.rows[0]?.maskedMobile, '+91******3210')
  assert.equal(summary.persistenceAllowed, false)
  assert.equal(summary.metaRequestAllowed, false)
  assert.equal(JSON.stringify(summary).includes('9876543210'), false)
})

test('existing outbox rows remain duplicates and never produce a second enqueue decision', () => {
  const preview = build()
  const summary = build({
    existingOutboxRows: [{
      matchKey: candidate.matchKey,
      workerId: candidate.workerId,
      idempotencyKey: preview.rows[0]?.idempotencyKey || '',
      status: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      sentAt: null,
    }],
  })
  assert.equal(summary.duplicateCount, 1)
  assert.equal(summary.wouldEnqueueCount, 0)
})

test('unavailable candidate or outbox reads fail closed without invented rows', () => {
  for (const overrides of [
    { candidateReadState: 'query_error' as const },
    { outboxReadState: 'query_error' as const },
  ]) {
    const summary = build(overrides)
    assert.equal(summary.source, 'unavailable')
    assert.equal(summary.rows.length, 0)
  }
})

test('pause, template, consent, daily limit, and candidate freshness remain blocking', () => {
  const summary = build({
    pauseAllSending: true,
    workerDailyLimit: 0,
    workerConsentStates: {},
    templateState: { configured: false, approved: false, enabled: false },
    candidates: [{ ...candidate, lastValidatedAt: '2026-08-29T04:00:00.000Z' }],
  })
  assert.equal(summary.blockedCount, 1)
  assert.ok(summary.rows[0]?.reasonCodes.includes('candidate_stale'))
  assert.ok(summary.rows[0]?.reasonCodes.includes('matching_consent_not_allowed'))
  assert.ok(summary.rows[0]?.reasonCodes.includes('daily_limit_exceeded'))
  assert.ok(summary.rows[0]?.reasonCodes.includes('whatsapp_paused'))
  assert.ok(summary.rows[0]?.reasonCodes.includes('template_not_configured'))
})

test('candidate evaluation is bounded and reports truncation', () => {
  const summary = build({ candidates: [candidate, { ...candidate, id: 'candidate-2' }], maxCandidates: 1 })
  assert.equal(summary.evaluatedCandidateCount, 1)
  assert.equal(summary.truncated, true)
})

test('outbox Preview integration module has no write or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/worker-job-match-outbox-preview.ts', import.meta.url),
    'utf8',
  )
  for (const writeCall of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    assert.equal(source.includes(writeCall), false)
  }
  assert.equal(source.includes('/messages'), false)
  assert.match(source, /persistenceAllowed: false/)
  assert.match(source, /metaRequestAllowed: false/)
})
