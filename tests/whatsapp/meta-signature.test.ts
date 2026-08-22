import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature'

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

test('rejects invalid signatures with equal-length digests', () => {
  const rawBody = Buffer.from('{"object":"whatsapp_business_account"}', 'utf8')
  const validDigest = createHmac('sha256', 'app-secret').update(rawBody).digest('hex')
  const invalidDigest = `${validDigest.slice(0, -1)}${validDigest.endsWith('a') ? 'b' : 'a'}`

  const result = verifyMetaWebhookSignature({
    rawBody,
    signatureHeader: `sha256=${invalidDigest}`,
    appSecret: 'app-secret',
  })

  assert.deepEqual(result, {
    valid: false,
    reason: 'invalid-signature',
  })
})

test('rejects missing signatures', () => {
  const result = verifyMetaWebhookSignature({
    rawBody: '{"object":"whatsapp_business_account"}',
    signatureHeader: null,
    appSecret: 'app-secret',
  })

  assert.deepEqual(result, {
    valid: false,
    reason: 'missing-signature',
  })
})
