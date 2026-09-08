import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  planWorkerLifecycleWhatsappDryRun,
  sanitizeWorkerWhatsappRejectionReason,
  WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS,
  type WorkerLifecycleEventSnapshot,
  type WhatsappWorkerLifecycleEventType,
} from '../../lib/whatsapp/worker-lifecycle-events'

const makeWorker = (
  overrides: Partial<WorkerLifecycleEventSnapshot> = {},
): WorkerLifecycleEventSnapshot => ({
  id: 'worker-1',
  mobile: '9876543210',
  status: 'pending',
  isVisible: false,
  activePlan: '',
  planValidUntil: '',
  kycStatus: 'pending_review',
  kycRemarks: '',
  registrationCompletedAt: '',
  updatedAt: '2026-08-29T08:00:00.000Z',
  ...overrides,
})

const readyTemplateStates = Object.fromEntries(
  Object.keys(WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS).map((eventType) => [
    eventType,
    { configured: true, approved: true, enabled: true },
  ]),
) as Record<
  WhatsappWorkerLifecycleEventType,
  { configured: boolean; approved: boolean; enabled: boolean }
>

const eligibleInput = {
  consentState: { service_allowed: true },
  pauseAllSending: false,
  templateStates: readyTemplateStates,
  now: new Date('2026-08-29T06:00:00.000Z'),
}

test('contracts expose only the three approved Worker lifecycle utility events', () => {
  assert.deepEqual(Object.keys(WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS), [
    'worker_registration_under_review',
    'worker_account_approved',
    'worker_account_rejected',
  ])
  assert.deepEqual(
    WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS.worker_account_rejected.parameterNames,
    ['rejection_reason'],
  )
  for (const contract of Object.values(WHATSAPP_WORKER_LIFECYCLE_EVENT_CONTRACTS)) {
    assert.equal(contract.recipientType, 'worker')
    assert.equal(contract.notificationPurpose, 'service')
    assert.equal(contract.templateCategory, 'UTILITY')
  }
})

test('first completed registration produces one deterministic under-review dry-run event', () => {
  const previous = makeWorker()
  const current = makeWorker({
    registrationCompletedAt: '2026-08-29T09:00:00.000Z',
    updatedAt: '2026-08-29T09:00:00.000Z',
  })
  const first = planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })
  const repeated = planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })

  assert.equal(first?.eventType, 'worker_registration_under_review')
  assert.equal(first?.dispatchState, 'blocked')
  assert.equal(first?.dispatchReason, 'dry_run_only')
  assert.equal(first?.maskedMobile, '+91******3210')
  assert.equal(first?.idempotencyKey, repeated?.idempotencyKey)
  assert.equal(first?.idempotencyKey?.includes('9876543210'), false)
})

test('an already completed registration is not emitted again', () => {
  const previous = makeWorker({ registrationCompletedAt: '2026-08-29T09:00:00.000Z' })
  const current = makeWorker({
    registrationCompletedAt: '2026-08-29T09:00:00.000Z',
    updatedAt: '2026-08-30T09:00:00.000Z',
  })

  assert.equal(planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput }), null)
})

test('KYC approval transition is authoritative even when wallet status is inactive', () => {
  const previous = makeWorker({ registrationCompletedAt: '2026-08-20T09:00:00.000Z' })
  const current = makeWorker({
    registrationCompletedAt: '2026-08-20T09:00:00.000Z',
    kycStatus: 'approved',
    status: 'inactive_wallet_empty',
    updatedAt: '2026-08-29T10:00:00.000Z',
  })
  const plan = planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })

  assert.equal(plan?.eventType, 'worker_account_approved')
  assert.equal(plan?.dispatchReason, 'dry_run_only')
})

test('rejection requires the actual saved reason and sanitizes sensitive fragments', () => {
  const previous = makeWorker({ registrationCompletedAt: '2026-08-20T09:00:00.000Z' })
  const current = makeWorker({
    registrationCompletedAt: '2026-08-20T09:00:00.000Z',
    status: 'rejected',
    kycStatus: 'rejected',
    kycRemarks:
      'Aadhaar 123456789012 does not match. See https://private.example and contact admin@example.com.',
    updatedAt: '2026-08-29T11:00:00.000Z',
  })
  const plan = planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })
  const reason = plan?.templateParameters.rejection_reason || ''

  assert.equal(plan?.eventType, 'worker_account_rejected')
  assert.equal(plan?.dispatchReason, 'dry_run_only')
  assert.match(reason, /\[redacted-number\]/)
  assert.match(reason, /\[redacted-link\]/)
  assert.match(reason, /\[redacted-email\]/)
  assert.equal(reason.includes('123456789012'), false)
})

test('missing or generic rejection reasons fail closed', () => {
  const previous = makeWorker({ registrationCompletedAt: '2026-08-20T09:00:00.000Z' })
  const current = makeWorker({
    registrationCompletedAt: '2026-08-20T09:00:00.000Z',
    status: 'rejected',
    kycStatus: 'rejected',
    kycRemarks: 'KYC could not be approved',
    updatedAt: '2026-08-29T11:00:00.000Z',
  })
  const plan = planWorkerLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })

  assert.equal(plan?.dispatchReason, 'missing_rejection_reason')
  assert.deepEqual(plan?.templateParameters, {})
  assert.equal(sanitizeWorkerWhatsappRejectionReason(''), null)
})

test('service consent, suppression, limits, template approval, and pause state fail closed', () => {
  const previous = makeWorker()
  const current = makeWorker({ registrationCompletedAt: '2026-08-29T09:00:00.000Z' })

  assert.equal(
    planWorkerLifecycleWhatsappDryRun({ previous, current, now: eligibleInput.now })?.dispatchReason,
    'missing_consent_service_allowed',
  )
  assert.equal(
    planWorkerLifecycleWhatsappDryRun({
      previous,
      current,
      consentState: { service_allowed: true },
      suppressed: true,
      now: eligibleInput.now,
    })?.dispatchReason,
    'suppressed',
  )
  assert.equal(
    planWorkerLifecycleWhatsappDryRun({
      previous,
      current,
      consentState: { service_allowed: true },
      withinLimit: false,
      now: eligibleInput.now,
    })?.dispatchReason,
    'limit_exceeded',
  )
  assert.equal(
    planWorkerLifecycleWhatsappDryRun({
      previous,
      current,
      consentState: { service_allowed: true },
      now: eligibleInput.now,
    })?.dispatchReason,
    'template_not_configured',
  )
  assert.equal(
    planWorkerLifecycleWhatsappDryRun({
      previous,
      current,
      consentState: { service_allowed: true },
      templateStates: readyTemplateStates,
      now: eligibleInput.now,
    })?.dispatchReason,
    'whatsapp_paused',
  )
})

test('the Phase 16E.1 module remains dry-run only with no persistence or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/worker-lifecycle-events.ts', import.meta.url),
    'utf8',
  )

  assert.equal(source.includes("from './meta-client'"), false)
  assert.equal(source.includes("from './persistence-client'"), false)
  assert.equal(source.includes("from './automation-execution-repository'"), false)
  assert.equal(source.includes('/messages'), false)
  assert.equal(source.includes('.insert('), false)
  assert.equal(source.includes('.update('), false)
  assert.match(source, /dispatchState: 'blocked'/)
  assert.match(source, /dryRun: true/)
})
