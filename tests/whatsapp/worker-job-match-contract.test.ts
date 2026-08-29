import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  planWorkerJobMatchDryRun,
  WHATSAPP_WORKER_JOB_MATCH_CONTRACT,
  type WorkerJobMatchJobSnapshot,
  type WorkerJobMatchWorkerSnapshot,
} from '../../lib/whatsapp/worker-job-match-contract'

const now = new Date('2026-08-29T06:00:00.000Z')

const worker: WorkerJobMatchWorkerSnapshot = {
  id: 'worker-1',
  mobile: '9876543210',
  status: 'active',
  isVisible: true,
  activePlan: 'worker-plan',
  planValidUntil: '2099-12-31',
  availability: 'available_today',
  categoryIds: ['cat-stitching'],
  city: 'Jaipur',
  homeCity: 'Jaipur',
  preferredWorkLocations: [],
}

const job: WorkerJobMatchJobSnapshot = {
  id: 'job-1',
  companyId: 'company-1',
  categoryId: 'cat-stitching',
  city: 'Jaipur',
  status: 'live',
  reviewStatus: 'approved',
  reviewedAt: '2026-08-29T05:00:00.000Z',
  publishedAt: '2026-08-29T05:00:00.000Z',
  expiresAt: '2026-09-28',
  updatedAt: '2026-08-29T05:00:00.000Z',
}

const eligibleInput = {
  consentState: { matching_alerts_allowed: true },
  templateState: { configured: true, approved: true, enabled: true },
  pauseAllSending: false,
  now,
}

test('contract is a Utility matching alert for workers only', () => {
  assert.deepEqual(WHATSAPP_WORKER_JOB_MATCH_CONTRACT, {
    eventType: 'worker_job_match_alert',
    templateName: 'worker_job_match_alert',
    templateCategory: 'UTILITY',
    notificationPurpose: 'matching',
    recipientType: 'worker',
  })
})

test('approved live job and eligible worker produce one deterministic Preview match', () => {
  const first = planWorkerJobMatchDryRun({ worker, job, ...eligibleInput })
  const repeated = planWorkerJobMatchDryRun({ worker, job, ...eligibleInput })

  assert.equal(first.decision, 'eligible')
  assert.equal(first.dispatchState, 'blocked')
  assert.equal(first.dispatchReason, 'dry_run_only')
  assert.equal(first.matchKey, repeated.matchKey)
  assert.equal(first.matchKey, 'worker-job-match:worker-1:job-1')
  assert.equal(first.maskedMobile, '+91******3210')
  assert.deepEqual(first.structuralReasonCodes, [])
})

test('unreviewed, non-live, or expired jobs fail closed', () => {
  const plan = planWorkerJobMatchDryRun({
    worker,
    job: {
      ...job,
      status: 'draft',
      reviewStatus: 'under_review',
      expiresAt: '2026-08-28',
    },
    ...eligibleInput,
  })

  assert.equal(plan.decision, 'blocked')
  assert.deepEqual(plan.structuralReasonCodes.slice(0, 3), [
    'job_not_approved',
    'job_not_live',
    'job_expired',
  ])
})

test('inactive, hidden, expired-plan, or unavailable workers fail closed', () => {
  const plan = planWorkerJobMatchDryRun({
    worker: {
      ...worker,
      status: 'inactive_paused_by_worker',
      isVisible: false,
      planValidUntil: '2026-08-28',
      availability: 'not_available',
    },
    job,
    ...eligibleInput,
  })

  assert.equal(plan.decision, 'blocked')
  assert.ok(plan.structuralReasonCodes.includes('worker_not_available'))
  assert.ok(plan.eligibility.reasonCodes.includes('automatic_worker_status_not_active'))
  assert.ok(plan.eligibility.reasonCodes.includes('worker_not_visible'))
  assert.ok(plan.eligibility.reasonCodes.includes('worker_plan_expired'))
})

test('category and city must both match, including preferred work cities', () => {
  const mismatch = planWorkerJobMatchDryRun({
    worker: { ...worker, city: 'Ajmer', homeCity: 'Ajmer', categoryIds: ['cat-cutting'] },
    job,
    ...eligibleInput,
  })
  assert.ok(mismatch.structuralReasonCodes.includes('category_mismatch'))
  assert.ok(mismatch.structuralReasonCodes.includes('location_mismatch'))

  const preferredCity = planWorkerJobMatchDryRun({
    worker: {
      ...worker,
      city: 'Ajmer',
      homeCity: 'Ajmer',
      preferredWorkLocations: [{ cityLabels: ['Jaipur'] }],
    },
    job,
    ...eligibleInput,
  })
  assert.equal(preferredCity.decision, 'eligible')
})

test('matching consent, suppression, limit, template readiness, and pause fail closed', () => {
  assert.equal(
    planWorkerJobMatchDryRun({ worker, job, now }).dispatchReason,
    'missing_consent_matching_alerts_allowed',
  )
  assert.equal(
    planWorkerJobMatchDryRun({ worker, job, ...eligibleInput, suppressed: true }).dispatchReason,
    'suppressed',
  )
  assert.equal(
    planWorkerJobMatchDryRun({ worker, job, ...eligibleInput, withinLimit: false }).dispatchReason,
    'limit_exceeded',
  )
  assert.equal(
    planWorkerJobMatchDryRun({
      worker,
      job,
      consentState: { matching_alerts_allowed: true },
      now,
    }).dispatchReason,
    'template_not_configured',
  )
  assert.equal(
    planWorkerJobMatchDryRun({ worker, job, ...eligibleInput, pauseAllSending: true })
      .dispatchReason,
    'whatsapp_paused',
  )
})

test('an existing worker-job pair is classified without creating another candidate', () => {
  const plan = planWorkerJobMatchDryRun({ worker, job, ...eligibleInput, existingMatch: true })
  assert.equal(plan.decision, 'already_matched')
  assert.equal(plan.dispatchReason, 'already_matched')
})

test('Phase 16G.1 remains Preview-only with no persistence or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/worker-job-match-contract.ts', import.meta.url),
    'utf8',
  )

  assert.equal(source.includes("from './meta-client'"), false)
  assert.equal(source.includes("from './persistence-client'"), false)
  assert.equal(source.includes('/messages'), false)
  assert.equal(source.includes('.insert('), false)
  assert.equal(source.includes('.update('), false)
  assert.match(source, /dispatchState: 'blocked'/)
  assert.match(source, /dryRun: true/)
})
