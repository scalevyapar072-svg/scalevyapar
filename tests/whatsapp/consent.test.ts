import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildWhatsappConsentState,
  getMissingWhatsappConsentTypes,
  getRequiredWhatsappConsentTypes,
  maskWhatsappMobile,
  normalizeIndianMobileToE164,
} from '../../lib/whatsapp/consent'

test('three WhatsApp consent types remain separate and registration is not implicit consent', () => {
  const state = buildWhatsappConsentState({
    service_allowed: true,
  })

  assert.deepEqual(state, {
    service_allowed: true,
    matching_alerts_allowed: false,
    marketing_allowed: false,
  })

  const requiredMarketingConsents = getRequiredWhatsappConsentTypes({
    notificationPurpose: 'matching',
    templateCategory: 'MARKETING',
  })

  assert.deepEqual(requiredMarketingConsents, [
    'matching_alerts_allowed',
    'marketing_allowed',
  ])
  assert.deepEqual(
    getMissingWhatsappConsentTypes({
      consentState: state,
      requiredConsentTypes: requiredMarketingConsents,
    }),
    ['matching_alerts_allowed', 'marketing_allowed'],
  )
})

test('normalizes valid Indian mobile numbers and rejects malformed values safely', () => {
  assert.deepEqual(normalizeIndianMobileToE164('9876543210'), {
    ok: true,
    normalized: '+919876543210',
    nationalNumber: '9876543210',
  })
  assert.deepEqual(normalizeIndianMobileToE164('+91 98765 43210'), {
    ok: true,
    normalized: '+919876543210',
    nationalNumber: '9876543210',
  })
  assert.deepEqual(normalizeIndianMobileToE164('12345'), {
    ok: false,
    reason: 'invalid_length',
  })
  assert.equal(maskWhatsappMobile('+919876543210'), '+91******3210')
})
