import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildWhatsappConsentState,
  getWhatsappConsentCopy,
  getMissingWhatsappConsentTypes,
  getRequiredWhatsappConsentTypes,
  maskWhatsappMobile,
  parseCompanyRegistrationWhatsappConsents,
  parseCompanySettingsWhatsappConsents,
  resolveWhatsappConsentTextVersion,
  WHATSAPP_CONSENT_TEXT_VERSION,
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

test('company registration consent parsing remains optional and marketing is excluded from registration', () => {
  assert.deepEqual(parseCompanyRegistrationWhatsappConsents(undefined), {
    service_allowed: false,
    matching_alerts_allowed: false,
  })

  assert.deepEqual(parseCompanyRegistrationWhatsappConsents({
    service_allowed: true,
    matching_alerts_allowed: 'true',
    marketing_allowed: true,
  }), {
    service_allowed: true,
    matching_alerts_allowed: true,
  })

  assert.deepEqual(parseCompanySettingsWhatsappConsents({
    service_allowed: false,
    matching_alerts_allowed: true,
    marketing_allowed: true,
  }), {
    service_allowed: false,
    matching_alerts_allowed: true,
    marketing_allowed: true,
  })
})

test('consent copy stays separate by audience and language and uses the approved version', () => {
  const companyRegistrationCopy = getWhatsappConsentCopy({
    recipientType: 'company',
    language: 'hi',
    includeMarketing: false,
  })
  const workerCopy = getWhatsappConsentCopy({
    recipientType: 'worker',
    language: 'en',
    includeMarketing: true,
  })

  assert.equal(companyRegistrationCopy.length, 2)
  assert.equal(workerCopy.length, 3)
  assert.equal(companyRegistrationCopy[0]?.type, 'service_allowed')
  assert.equal(companyRegistrationCopy[1]?.type, 'matching_alerts_allowed')
  assert.match(String(companyRegistrationCopy[0]?.description || ''), /WhatsApp/i)
  assert.match(String(workerCopy[2]?.description || ''), /promotional|campaign/i)
  assert.equal(resolveWhatsappConsentTextVersion(''), WHATSAPP_CONSENT_TEXT_VERSION)
})
