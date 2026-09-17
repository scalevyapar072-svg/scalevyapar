import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getWhatsappWebhookVerifyToken,
  readWhatsappMetaConfig,
  resolveWhatsappHealthConfig,
  resolveWhatsappSendConfig,
  resolveWhatsappWebhookPostConfig,
} from '../../lib/whatsapp/meta-config'

test('reads canonical configuration and reports missing canonical app fields', () => {
  const snapshot = readWhatsappMetaConfig({
    WHATSAPP_ACCESS_TOKEN: 'canonical-token',
    WHATSAPP_PHONE_NUMBER_ID: 'canonical-phone-id',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'canonical-verify-token',
  })

  assert.equal(snapshot.accessTokenConfigured, true)
  assert.equal(snapshot.phoneNumberIdConfigured, true)
  assert.equal(snapshot.webhookVerifyTokenConfigured, true)
  assert.deepEqual(snapshot.missingCanonicalVariables, [
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_APP_ID',
    'WHATSAPP_APP_SECRET',
  ])
})

test('preserves legacy alias compatibility for outbound sending', () => {
  const result = resolveWhatsappSendConfig({
    WHATSAPP_CLOUD_API_ACCESS_TOKEN: 'legacy-token',
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: 'legacy-phone-id',
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    assert.fail('Expected legacy send config to remain compatible.')
  }

  assert.deepEqual(result.config, {
    accessToken: 'legacy-token',
    phoneNumberId: 'legacy-phone-id',
    graphApiVersion: 'v23.0',
  })
  assert.equal(result.snapshot.legacyCompatibility.usesLegacyAccessTokenAlias, true)
  assert.equal(result.snapshot.legacyCompatibility.usesLegacyPhoneNumberIdAlias, true)
})

test('fails closed for provider health checks when app secret is missing', () => {
  const result = resolveWhatsappHealthConfig({
    WHATSAPP_ACCESS_TOKEN: 'token',
    WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
    WHATSAPP_APP_ID: 'app-id',
  })

  assert.equal(result.ok, false)
  if (result.ok) {
    assert.fail('Expected health config to fail closed without an app secret.')
  }

  assert.deepEqual(result.missingVariables, ['WHATSAPP_APP_SECRET'])
})

test('canonical configuration takes precedence over legacy fallback', () => {
  const result = resolveWhatsappSendConfig({
    WHATSAPP_ACCESS_TOKEN: 'canonical-token',
    WHATSAPP_CLOUD_API_ACCESS_TOKEN: 'legacy-token',
    WHATSAPP_PHONE_NUMBER_ID: 'canonical-phone-id',
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: 'legacy-phone-id',
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    assert.fail('Expected canonical values to resolve successfully.')
  }

  assert.deepEqual(result.config, {
    accessToken: 'canonical-token',
    phoneNumberId: 'canonical-phone-id',
    graphApiVersion: 'v23.0',
  })
  assert.equal(result.snapshot.legacyCompatibility.usesLegacyAccessTokenAlias, false)
  assert.equal(result.snapshot.legacyCompatibility.usesLegacyPhoneNumberIdAlias, false)
})

test('fails closed for invalid graph api versions', () => {
  const result = resolveWhatsappHealthConfig({
    WHATSAPP_ACCESS_TOKEN: 'token',
    WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
    WHATSAPP_APP_ID: 'app-id',
    WHATSAPP_APP_SECRET: 'app-secret',
    WHATSAPP_GRAPH_API_VERSION: '25.0',
  })

  assert.equal(result.ok, false)
  if (result.ok) {
    assert.fail('Expected invalid graph API version to fail closed.')
  }

  assert.equal(result.error, 'WHATSAPP_GRAPH_API_VERSION must match the format vNN.N.')
})

test('resolves exact canonical webhook security configuration', () => {
  const result = resolveWhatsappWebhookPostConfig({
    WHATSAPP_APP_SECRET: 'test-app-secret',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '1234567890123573',
    WHATSAPP_PHONE_NUMBER_ID: '1234567890120825',
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    assert.fail('Expected canonical webhook configuration to resolve.')
  }

  assert.deepEqual(result.config, {
    appSecret: 'test-app-secret',
    businessAccountId: '1234567890123573',
    phoneNumberId: '1234567890120825',
  })
})

test('webhook POST configuration requires canonical numeric asset identifiers', () => {
  const legacyPhone = resolveWhatsappWebhookPostConfig({
    WHATSAPP_APP_SECRET: 'test-app-secret',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '1234567890123573',
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: '1234567890120825',
  })
  const malformedAssets = resolveWhatsappWebhookPostConfig({
    WHATSAPP_APP_SECRET: 'test-app-secret',
    WHATSAPP_BUSINESS_ACCOUNT_ID: 'test-waba',
    WHATSAPP_PHONE_NUMBER_ID: 'test-phone',
  })

  assert.equal(legacyPhone.ok, false)
  if (legacyPhone.ok) assert.fail('Expected legacy phone alias to fail for webhook POST.')
  assert.deepEqual(legacyPhone.missingVariables, ['WHATSAPP_PHONE_NUMBER_ID'])

  assert.equal(malformedAssets.ok, false)
  if (malformedAssets.ok) assert.fail('Expected malformed asset identifiers to fail.')
  assert.deepEqual(malformedAssets.missingVariables, [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
  ])
})

test('webhook secrets reject embedded control characters after surrounding trim', () => {
  const result = resolveWhatsappWebhookPostConfig({
    WHATSAPP_APP_SECRET: 'test\napp-secret',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '1234567890123573',
    WHATSAPP_PHONE_NUMBER_ID: '1234567890120825',
  })

  assert.equal(result.ok, false)
  if (result.ok) assert.fail('Expected control characters in the app secret to fail.')
  assert.deepEqual(result.missingVariables, ['WHATSAPP_APP_SECRET'])
  assert.equal(
    getWhatsappWebhookVerifyToken({
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify\ntoken',
    }),
    '',
  )
  assert.equal(
    getWhatsappWebhookVerifyToken({
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: '  verify-token  ',
    }),
    'verify-token',
  )
})
