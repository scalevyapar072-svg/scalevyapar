import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature.ts'

test('verifies a valid X-Hub-Signature-256 against raw webhook bytes', () => {
  const rawBody = Buffer.from('{"object":"whatsapp_business_account"}', 'utf8')
  const appSecret = 'app-secret'
  const digest = createHmac('sha256', appSecret).update(rawBody).digest('hex')

  const result = verifyMetaWebhookSignature({
    rawBody,
    signatureHeader: `sha256=${digest}`,
    appSecret,
  })

  assert.deepEqual(result, {
    valid: true,
    reason: 'valid',
  })
})

test('rejects malformed signatures and fails closed without an app secret', () => {
  const malformedSignature = verifyMetaWebhookSignature({
    rawBody: '{"object":"whatsapp_business_account"}',
    signatureHeader: 'invalid',
    appSecret: 'app-secret',
  })
  const missingSecret = verifyMetaWebhookSignature({
    rawBody: '{"object":"whatsapp_business_account"}',
    signatureHeader: 'sha256=deadbeef',
    appSecret: '',
  })

  assert.deepEqual(malformedSignature, {
    valid: false,
    reason: 'invalid-format',
  })
  assert.deepEqual(missingSecret, {
    valid: false,
    reason: 'missing-app-secret',
  })
})
