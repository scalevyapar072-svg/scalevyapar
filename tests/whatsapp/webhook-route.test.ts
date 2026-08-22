import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { extractWhatsappWebhookStatusEvents } from '../../lib/labour-whatsapp-webhook'
import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature'
import {
  handleWhatsappWebhookGet,
  handleWhatsappWebhookPost,
} from '../../lib/whatsapp/webhook-route'

const appSecret = 'app-secret'

const buildSignature = (body: string) =>
  `sha256=${createHmac('sha256', appSecret).update(Buffer.from(body, 'utf8')).digest('hex')}`

test('webhook GET verification remains compatible', async () => {
  const response = handleWhatsappWebhookGet({
    searchParams: new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-token',
      'hub.challenge': 'challenge-token',
    }),
    expectedToken: 'verify-token',
  })

  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'challenge-token')
})

test('webhook POST fails closed when app secret configuration is missing', async () => {
  const body = JSON.stringify({ object: 'whatsapp_business_account' })
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(body),
      },
      body,
    }),
    resolveWebhookPostConfig: () => ({
      ok: false,
      missingVariables: ['WHATSAPP_APP_SECRET'],
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
  })

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'meta-signature-not-configured',
    missingVariables: ['WHATSAPP_APP_SECRET'],
  })
})

test('webhook POST rejects missing signature', async () => {
  const body = JSON.stringify({ object: 'whatsapp_business_account' })
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'missing-signature',
  })
})

test('webhook POST rejects invalid JSON after a valid signature', async () => {
  const body = '{'
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(body),
      },
      body,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
    logger: {
      log() {},
      error() {},
    },
  })

  const payload = await response.json()

  assert.equal(response.status, 500)
  assert.match(String(payload.error || ''), /JSON|property name|Unexpected/i)
})

test('webhook POST rejects unsupported webhook objects', async () => {
  const body = JSON.stringify({ object: 'page' })
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(body),
      },
      body,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'unsupported-object',
  })
})

test('webhook POST persists a valid delivery-status payload', async () => {
  const persistedEvents: unknown[] = []
  const body = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              metadata: {
                display_phone_number: '+91 9999999999',
                phone_number_id: 'phone-id',
              },
              statuses: [
                {
                  id: 'wamid-123',
                  status: 'delivered',
                  timestamp: '1724186400',
                  recipient_id: '919876543210',
                  conversation: {
                    id: 'conversation-123',
                    origin: {
                      type: 'utility',
                    },
                  },
                  pricing: {
                    billable: true,
                    category: 'utility',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  })

  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(body),
      },
      body,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: extractWhatsappWebhookStatusEvents,
    persistStatusEvents: async (events) => {
      persistedEvents.push(...events)
    },
    logger: {
      log() {},
      error() {},
    },
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: true,
    statusEvents: 1,
  })
  assert.deepEqual(persistedEvents, [
    {
      messageId: 'wamid-123',
      status: 'delivered',
      recipientWaId: '919876543210',
      timestamp: '1724186400',
      phoneNumberId: 'phone-id',
      displayPhoneNumber: '+91 9999999999',
      conversationId: 'conversation-123',
      conversationOrigin: 'utility',
      pricingCategory: 'utility',
      pricingBillable: true,
      rawErrors: [],
    },
  ])
})
