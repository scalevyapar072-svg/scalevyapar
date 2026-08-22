import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateWhatsappRecipientEligibility,
  isInsideWhatsappQuietHours,
} from '../../lib/whatsapp/recipient-eligibility'

test('marketing matching requires both matching and marketing consent', () => {
  const result = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'automatic',
    notificationPurpose: 'matching',
    templateCategory: 'MARKETING',
    consentState: {
      matching_alerts_allowed: true,
      marketing_allowed: false,
    },
    worker: {
      status: 'active',
      isVisible: true,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
      mobile: '9876543210',
    },
    now: new Date('2026-08-22T05:30:00.000Z'),
  })

  assert.equal(result.eligible, false)
  assert.ok(result.reasonCodes.includes('missing_consent_marketing_allowed'))
})

test('utility matching requires matching consent and rejects inactive automatic workers', () => {
  const inactiveResult = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'automatic',
    notificationPurpose: 'matching',
    templateCategory: 'UTILITY',
    consentState: {
      matching_alerts_allowed: true,
    },
    worker: {
      status: 'inactive_paused_by_worker',
      isVisible: true,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
      mobile: '9876543210',
    },
    now: new Date('2026-08-22T05:30:00.000Z'),
  })

  assert.equal(inactiveResult.eligible, false)
  assert.ok(inactiveResult.reasonCodes.includes('automatic_worker_status_not_active'))
})

test('paused worker can appear in manual selection but still remains subject to consent', () => {
  const manualResult = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'manual',
    notificationPurpose: 'matching',
    templateCategory: 'UTILITY',
    consentState: {
      matching_alerts_allowed: false,
    },
    worker: {
      status: 'inactive_paused_by_worker',
      isVisible: true,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
      mobile: '9876543210',
    },
    now: new Date('2026-08-22T05:30:00.000Z'),
  })

  assert.equal(manualResult.eligible, false)
  assert.ok(manualResult.reasonCodes.includes('missing_consent_matching_alerts_allowed'))
  assert.equal(manualResult.reasonCodes.includes('automatic_worker_status_not_active'), false)
})

test('active eligible worker is accepted and quiet hours are queueable in Asia/Kolkata', () => {
  const result = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'automatic',
    notificationPurpose: 'matching',
    templateCategory: 'UTILITY',
    consentState: {
      matching_alerts_allowed: true,
    },
    worker: {
      status: 'active',
      isVisible: true,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
      mobile: '9876543210',
    },
    now: new Date('2026-08-22T17:00:00.000Z'),
  })

  assert.equal(isInsideWhatsappQuietHours(new Date('2026-08-22T17:00:00.000Z')), true)
  assert.equal(result.eligible, true)
  assert.equal(result.deliveryWindow, 'queue_until_allowed')
  assert.ok(result.reasonCodes.includes('inside_quiet_hours'))
})

test('company recipient precedence and invalid phone handling remain safe', () => {
  const companyResult = evaluateWhatsappRecipientEligibility({
    recipientType: 'company',
    mode: 'manual',
    notificationPurpose: 'service',
    templateCategory: 'UTILITY',
    consentState: {
      service_allowed: true,
    },
    company: {
      status: 'inactive',
      contactMobile: '9876543210',
      mobile: '9000000000',
    },
    now: new Date('2026-08-22T05:30:00.000Z'),
  })

  assert.equal(companyResult.eligible, true)
  assert.equal(companyResult.resolvedRecipientSource, 'contact_mobile')
  assert.equal(companyResult.normalizedMobile, '+919876543210')

  const invalidPhoneResult = evaluateWhatsappRecipientEligibility({
    recipientType: 'worker',
    mode: 'manual',
    notificationPurpose: 'service',
    templateCategory: 'UTILITY',
    consentState: {
      service_allowed: true,
    },
    worker: {
      status: 'active',
      isVisible: true,
      activePlan: 'worker-plan',
      planValidUntil: '2099-01-01',
      mobile: '1234',
    },
    now: new Date('2026-08-22T05:30:00.000Z'),
  })

  assert.equal(invalidPhoneResult.eligible, false)
  assert.ok(invalidPhoneResult.reasonCodes.includes('invalid_mobile'))
})
