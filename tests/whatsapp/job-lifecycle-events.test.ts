import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  auditJobLifecycleModelReadiness,
  planJobLifecycleWhatsappDryRun,
  sanitizeJobWhatsappRejectionReason,
  WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS,
  type JobLifecycleEventSnapshot,
  type WhatsappJobLifecycleEventType,
} from '../../lib/whatsapp/job-lifecycle-events'

const makeJob = (
  overrides: Partial<JobLifecycleEventSnapshot> = {},
): JobLifecycleEventSnapshot => ({
  id: 'job-1',
  companyId: 'company-1',
  status: 'draft',
  reviewStatus: 'under_review',
  reviewReason: '',
  submittedAt: '2026-08-29T09:00:00.000Z',
  reviewedAt: '',
  updatedAt: '2026-08-29T09:00:00.000Z',
  ...overrides,
})

const company = {
  id: 'company-1',
  status: 'active',
  contactMobile: '9876543210',
  mobile: '9123456789',
}

const readyTemplateStates = Object.fromEntries(
  Object.keys(WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS).map((eventType) => [
    eventType,
    { configured: true, approved: true, enabled: true },
  ]),
) as Record<
  WhatsappJobLifecycleEventType,
  { configured: boolean; approved: boolean; enabled: boolean }
>

const eligibleInput = {
  company,
  consentState: { service_allowed: true },
  pauseAllSending: false,
  templateStates: readyTemplateStates,
  now: new Date('2026-08-29T06:00:00.000Z'),
}

test('contracts expose only the three Company job lifecycle Utility events', () => {
  assert.deepEqual(Object.keys(WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS), [
    'company_job_under_review',
    'company_job_approved',
    'company_job_rejected',
  ])
  assert.deepEqual(
    WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS.company_job_rejected.parameterNames,
    ['rejection_reason'],
  )
  for (const contract of Object.values(WHATSAPP_JOB_LIFECYCLE_EVENT_CONTRACTS)) {
    assert.equal(contract.recipientType, 'company')
    assert.equal(contract.notificationPurpose, 'service')
    assert.equal(contract.templateCategory, 'UTILITY')
  }
})

test('legacy live jobs fail readiness and are never inferred as reviewed', () => {
  const previous = makeJob({ reviewStatus: undefined, status: 'draft' })
  const current = makeJob({
    reviewStatus: undefined,
    status: 'live',
    updatedAt: '2026-08-29T10:00:00.000Z',
  })

  assert.deepEqual(auditJobLifecycleModelReadiness(current), {
    ready: false,
    reason: 'job_review_model_unavailable',
  })
  assert.equal(planJobLifecycleWhatsappDryRun({ previous, current, ...eligibleInput }), null)
})

test('explicit submission transition produces a deterministic under-review dry run', () => {
  const previous = makeJob({ reviewStatus: null, submittedAt: '' })
  const current = makeJob()
  const first = planJobLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })
  const repeated = planJobLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })

  assert.equal(first?.eventType, 'company_job_under_review')
  assert.equal(first?.dispatchReason, 'dry_run_only')
  assert.equal(first?.dispatchState, 'blocked')
  assert.equal(first?.idempotencyKey, repeated?.idempotencyKey)
})

test('approval requires an explicit review transition and a live job', () => {
  const previous = makeJob()
  const approved = makeJob({
    status: 'live',
    reviewStatus: 'approved',
    reviewedAt: '2026-08-29T10:00:00.000Z',
  })
  const notLive = makeJob({
    status: 'draft',
    reviewStatus: 'approved',
    reviewedAt: '2026-08-29T10:00:00.000Z',
  })

  assert.equal(
    planJobLifecycleWhatsappDryRun({ previous, current: approved, ...eligibleInput })
      ?.dispatchReason,
    'dry_run_only',
  )
  assert.equal(
    planJobLifecycleWhatsappDryRun({ previous, current: notLive, ...eligibleInput })
      ?.dispatchReason,
    'job_not_live',
  )
})

test('rejection requires and sanitizes the actual saved review reason', () => {
  const previous = makeJob()
  const current = makeJob({
    reviewStatus: 'rejected',
    reviewReason:
      'Phone 9876543210 appears in the description. See https://private.example or admin@example.com.',
    reviewedAt: '2026-08-29T11:00:00.000Z',
  })
  const plan = planJobLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })
  const reason = plan?.templateParameters.rejection_reason || ''

  assert.equal(plan?.eventType, 'company_job_rejected')
  assert.equal(plan?.dispatchReason, 'dry_run_only')
  assert.match(reason, /\[redacted-number\]/)
  assert.match(reason, /\[redacted-link\]/)
  assert.match(reason, /\[redacted-email\]/)

  const missing = planJobLifecycleWhatsappDryRun({
    previous,
    current: makeJob({
      reviewStatus: 'rejected',
      reviewReason: 'Job rejected',
      reviewedAt: '2026-08-29T11:00:00.000Z',
    }),
    ...eligibleInput,
  })
  assert.equal(missing?.dispatchReason, 'missing_rejection_reason')
  assert.equal(sanitizeJobWhatsappRejectionReason(''), null)
})

test('contact mobile is preferred and sensitive values never enter the key', () => {
  const previous = makeJob({ reviewStatus: null, submittedAt: '' })
  const current = makeJob()
  const plan = planJobLifecycleWhatsappDryRun({ previous, current, ...eligibleInput })

  assert.equal(plan?.resolvedRecipientSource, 'contact_mobile')
  assert.equal(plan?.maskedMobile, '+91******3210')
  assert.equal(plan?.idempotencyKey?.includes('9876543210'), false)
  assert.equal(plan?.idempotencyKey?.includes('9123456789'), false)
})

test('consent, suppression, limits, template readiness, and pause fail closed', () => {
  const previous = makeJob({ reviewStatus: null, submittedAt: '' })
  const current = makeJob()

  assert.equal(
    planJobLifecycleWhatsappDryRun({ previous, current, company })?.dispatchReason,
    'missing_consent_service_allowed',
  )
  assert.equal(
    planJobLifecycleWhatsappDryRun({
      previous,
      current,
      company,
      consentState: { service_allowed: true },
      suppressed: true,
    })?.dispatchReason,
    'suppressed',
  )
  assert.equal(
    planJobLifecycleWhatsappDryRun({
      previous,
      current,
      company,
      consentState: { service_allowed: true },
      withinLimit: false,
    })?.dispatchReason,
    'limit_exceeded',
  )
  assert.equal(
    planJobLifecycleWhatsappDryRun({
      previous,
      current,
      company,
      consentState: { service_allowed: true },
    })?.dispatchReason,
    'template_not_configured',
  )
  assert.equal(
    planJobLifecycleWhatsappDryRun({
      previous,
      current,
      company,
      consentState: { service_allowed: true },
      templateStates: readyTemplateStates,
    })?.dispatchReason,
    'whatsapp_paused',
  )
})

test('Phase 16F.1 remains dry-run only with no persistence or Meta request path', async () => {
  const source = await readFile(
    new URL('../../lib/whatsapp/job-lifecycle-events.ts', import.meta.url),
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
