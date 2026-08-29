import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  planWorkerJobMatchOutboxPreview,
  WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT,
  type WorkerJobMatchCandidateSnapshot,
  type WorkerJobMatchOutboxRevalidation,
} from '../../lib/whatsapp/worker-job-match-outbox-contract'
import type { WorkerJobMatchDryRunPlan } from '../../lib/whatsapp/worker-job-match-contract'

const now = new Date('2026-08-29T08:00:00.000Z')

const matchPlan: WorkerJobMatchDryRunPlan = {
  dryRun: true,
  dispatchState: 'blocked',
  decision: 'eligible',
  dispatchReason: 'dry_run_only',
  eventType: 'worker_job_match_alert',
  recipientType: 'worker',
  recipientId: 'worker-1',
  jobId: 'job-1',
  companyId: 'company-1',
  maskedMobile: '+91******3210',
  templateName: 'worker_job_match_alert',
  templateCategory: 'UTILITY',
  notificationPurpose: 'matching',
  matchKey: 'worker-job-match:worker-1:job-1',
  matchedCategoryId: 'cat-stitching',
  matchedCity: 'Jaipur',
  structuralReasonCodes: [],
  eligibility: {
    eligible: true,
    reasonCodes: [],
    maskedMobile: '+91******3210',
    normalizedMobile: '+919876543210',
    deliveryWindow: 'send_now',
    missingConsents: [],
    requiredConsents: ['matching_alerts_allowed'],
    resolvedRecipientSource: 'direct',
  },
}

const candidate: WorkerJobMatchCandidateSnapshot = {
  id: 'candidate-1',
  matchKey: 'worker-job-match:worker-1:job-1',
  workerId: 'worker-1',
  jobPostId: 'job-1',
  companyId: 'company-1',
  candidateState: 'eligible',
  lastValidatedAt: '2026-08-29T07:55:00.000Z',
}

const safeRevalidation: WorkerJobMatchOutboxRevalidation = {
  matchStillValid: true,
  matchingConsentAllowed: true,
  suppressed: false,
  withinDailyLimit: true,
  pauseAllSending: false,
  templateConfigured: true,
  templateApproved: true,
  templateEnabled: true,
  insideQuietHours: false,
  quietHoursEndAt: null,
}

test('contract is a worker-only Utility outbox with a bounded retry policy', () => {
  assert.deepEqual(WHATSAPP_WORKER_JOB_MATCH_OUTBOX_CONTRACT, {
    eventType: 'worker_job_match_alert',
    recipientType: 'worker',
    templateName: 'worker_job_match_alert',
    templateLanguage: 'hi',
    templateCategory: 'UTILITY',
    maximumAttempts: 4,
    retryDelaysSeconds: [60, 300, 1800],
  })
})

test('eligible revalidated candidate produces one deterministic Preview enqueue plan', () => {
  const first = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: safeRevalidation,
    now,
  })
  const repeated = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: safeRevalidation,
    now,
  })

  assert.equal(first.queueDecision, 'would_enqueue')
  assert.equal(first.dispatchState, 'blocked')
  assert.equal(first.persistenceAllowed, false)
  assert.equal(first.metaRequestAllowed, false)
  assert.equal(first.idempotencyKey, repeated.idempotencyKey)
  assert.equal(
    first.idempotencyKey,
    'worker-job-match-outbox:worker-job-match%3Aworker-1%3Ajob-1:worker_job_match_alert:hi',
  )
  assert.deepEqual(first.reasonCodes, ['preview_only'])
})

test('candidate identity, state, freshness, and current match validity fail closed', () => {
  const plan = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate: {
      ...candidate,
      workerId: 'worker-2',
      candidateState: 'invalidated',
      lastValidatedAt: '2026-08-29T07:00:00.000Z',
    },
    revalidation: { ...safeRevalidation, matchStillValid: false },
    now,
  })

  assert.equal(plan.queueDecision, 'blocked')
  assert.ok(plan.reasonCodes.includes('candidate_not_eligible'))
  assert.ok(plan.reasonCodes.includes('candidate_identity_mismatch'))
  assert.ok(plan.reasonCodes.includes('candidate_stale'))
  assert.ok(plan.reasonCodes.includes('match_no_longer_valid'))
})

test('consent, suppression, limits, template readiness, and pause are revalidated', () => {
  const plan = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: {
      ...safeRevalidation,
      matchingConsentAllowed: false,
      suppressed: true,
      withinDailyLimit: false,
      pauseAllSending: true,
      templateConfigured: false,
      templateApproved: false,
      templateEnabled: false,
    },
    now,
  })

  assert.equal(plan.queueDecision, 'blocked')
  assert.ok(plan.reasonCodes.includes('matching_consent_not_allowed'))
  assert.ok(plan.reasonCodes.includes('suppressed'))
  assert.ok(plan.reasonCodes.includes('daily_limit_exceeded'))
  assert.ok(plan.reasonCodes.includes('whatsapp_paused'))
  assert.ok(plan.reasonCodes.includes('template_not_configured'))
})

test('missing pause state fails closed independently of all other checks', () => {
  const plan = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: { ...safeRevalidation, pauseAllSending: null },
    now,
  })
  assert.equal(plan.queueDecision, 'blocked')
  assert.equal(plan.primaryReason, 'pause_state_missing_or_invalid')
})

test('quiet hours schedule only after a valid future boundary', () => {
  const scheduled = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: {
      ...safeRevalidation,
      insideQuietHours: true,
      quietHoursEndAt: '2026-08-29T09:00:00.000Z',
    },
    now,
  })
  assert.equal(scheduled.queueDecision, 'would_schedule_after_quiet_hours')
  assert.equal(scheduled.availableAt, '2026-08-29T09:00:00.000Z')

  const blocked = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: { ...safeRevalidation, insideQuietHours: true, quietHoursEndAt: null },
    now,
  })
  assert.equal(blocked.queueDecision, 'blocked')
  assert.ok(blocked.reasonCodes.includes('quiet_hours_end_missing_or_invalid'))
})

test('existing pending, processing, sent, and terminal rows never create duplicates', () => {
  for (const [status, reason] of [
    ['pending', 'duplicate_pending'],
    ['processing', 'duplicate_processing'],
    ['sent', 'duplicate_sent'],
    ['failed_terminal', 'duplicate_terminal'],
  ] as const) {
    const plan = planWorkerJobMatchOutboxPreview({
      matchPlan,
      candidate,
      revalidation: safeRevalidation,
      existingOutbox: {
        idempotencyKey: 'worker-job-match-outbox:worker-job-match%3Aworker-1%3Ajob-1:worker_job_match_alert:hi',
        status,
        attemptCount: 1,
        nextAttemptAt: null,
      },
      now,
    })
    assert.equal(plan.queueDecision, 'duplicate')
    assert.ok(plan.reasonCodes.includes(reason))
  }
})

test('retry is Preview-planned only when due and below the maximum attempt count', () => {
  const due = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: safeRevalidation,
    existingOutbox: {
      idempotencyKey: 'worker-job-match-outbox:worker-job-match%3Aworker-1%3Ajob-1:worker_job_match_alert:hi',
      status: 'retry_scheduled',
      attemptCount: 2,
      nextAttemptAt: '2026-08-29T07:59:00.000Z',
    },
    now,
  })
  assert.equal(due.queueDecision, 'would_retry_existing')
  assert.equal(due.dispatchState, 'blocked')

  const exhausted = planWorkerJobMatchOutboxPreview({
    matchPlan,
    candidate,
    revalidation: safeRevalidation,
    existingOutbox: {
      idempotencyKey: due.idempotencyKey || '',
      status: 'retry_scheduled',
      attemptCount: 4,
      nextAttemptAt: '2026-08-29T07:59:00.000Z',
    },
    now,
  })
  assert.equal(exhausted.queueDecision, 'blocked')
  assert.ok(exhausted.reasonCodes.includes('maximum_attempts_reached'))
})

test('Phase 16H.1 contract has no persistence or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/worker-job-match-outbox-contract.ts', import.meta.url),
    'utf8',
  )

  assert.equal(source.includes("from './meta-client'"), false)
  assert.equal(source.includes("from './persistence-client'"), false)
  assert.equal(source.includes('/messages'), false)
  assert.equal(source.includes('.insert('), false)
  assert.equal(source.includes('.update('), false)
  assert.equal(source.includes('.upsert('), false)
  assert.match(source, /persistenceAllowed: false/)
  assert.match(source, /metaRequestAllowed: false/)
  assert.match(source, /dispatchState: 'blocked'/)
})
