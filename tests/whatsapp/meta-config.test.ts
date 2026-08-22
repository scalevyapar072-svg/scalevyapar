import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_WHATSAPP_GRAPH_API_VERSION,
  readWhatsappMetaConfig,
  resolveWhatsappHealthConfig,
  resolveWhatsappSendConfig,
} from '../../lib/whatsapp/meta-config.ts'

test('reads canonical configuration and reports missing canonical app fields', () => {
  const snapshot = readWhatsappMetaConfig({
    WHATSAPP_ACCESS_TOKEN: 'token',
    WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
    WHATSAPP_GRAPH_API_VERSION: 'v25.0',
  })

  assert.equal(snapshot.accessTokenSource, 'canonical')
  assert.equal(snapshot.phoneNumberIdSource, 'canonical')
  assert.equal(snapshot.webhookVerifyTokenSource, 'canonical')
  assert.equal(snapshot.graphApiVersion, 'v25.0')
  assert.deepEqual(snapshot.missingCanonicalVariables.sort(), [
    'WHATSAPP_APP_ID',
    'WHATSAPP_APP_SECRET',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
  ])
})

test('preserves legacy alias compatibility for outbound sending', () => {
  const sendConfig = resolveWhatsappSendConfig({
    WHATSAPP_CLOUD_API_ACCESS_TOKEN: 'legacy-token',
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: 'legacy-phone-id',
  })

  assert.equal(sendConfig.ok, true)
  if (!sendConfig.ok) {
    throw new Error('Expected WhatsApp send config to resolve through legacy aliases.')
  }

  assert.equal(sendConfig.config.accessToken, 'legacy-token')
  assert.equal(sendConfig.config.phoneNumberId, 'legacy-phone-id')
  assert.equal(sendConfig.config.graphApiVersion, DEFAULT_WHATSAPP_GRAPH_API_VERSION)
  assert.equal(sendConfig.snapshot.legacyCompatibility.usesLegacyAccessTokenAlias, true)
  assert.equal(sendConfig.snapshot.legacyCompatibility.usesLegacyPhoneNumberIdAlias, true)
})

test('fails closed for provider health checks when app secret is missing', () => {
  const healthConfig = resolveWhatsappHealthConfig({
    WHATSAPP_ACCESS_TOKEN: 'token',
    WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
  })

  assert.equal(healthConfig.ok, false)
  if (healthConfig.ok) {
    throw new Error('Expected WhatsApp health config to fail without an app secret.')
  }

  assert.ok(healthConfig.missingVariables.includes('WHATSAPP_APP_SECRET'))
})
