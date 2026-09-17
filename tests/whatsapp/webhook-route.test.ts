import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature'
import {
  handleWhatsappWebhookGet,
  handleWhatsappWebhookPost,
} from '../../lib/whatsapp/webhook-route'

const appSecret = 'test-app-secret'
const businessAccountId = '1234567890123573'
const phoneNumberId = '1234567890120825'

const buildSignature = (body: string) =>
  `sha256=${createHmac('sha256', appSecret).update(Buffer.from(body, 'utf8')).digest('hex')}`

const resolveConfig = () => ({
  ok: true as const,
  config: { appSecret, businessAccountId, phoneNumberId },
})

const disabledPersistence = () => ({
  enabled: false as const,
  reason: 'environment_not_production' as const,
  message: 'Disabled for test Preview.',
})

const enabledPersistence = () => ({ enabled: true as const })

const buildStatusPayload = ({
  wabaId = businessAccountId,
  phoneId = phoneNumberId,
}: {
  wabaId?: string
  phoneId?: string
} = {}) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: wabaId,
      changes: [
        {
          field: 'messages',
          value: {
            metadata: {
              display_phone_number: '+00 0000000000',
              phone_number_id: phoneId,
            },
            statuses: [
              {
                id: 'wamid-test-status',
                status: 'delivered',
                timestamp: '1724186400',
                recipient_id: '000000000000',
              },
            ],
          },
        },
      ],
    },
  ],
})

const createLogger = () => {
  const entries: Array<{ message: string; details: Record<string, unknown> }> = []
  return {
    entries,
    logger: {
      log(message: string, details: Record<string, unknown>) {
        entries.push({ message, details })
      },
      error(message: string, details: Record<string, unknown>) {
        entries.push({ message, details })
      },
    },
  }
}

const postBody = async ({
  body,
  signature = buildSignature(body),
  resolveWebhookPostConfig = resolveConfig,
  resolvePersistenceWriteAvailability = disabledPersistence,
  persistStatusEvents = async (_events: unknown[]) => {},
  verifySignature = verifyMetaWebhookSignature,
  logger,
}: {
  body: string
  signature?: string | null
  resolveWebhookPostConfig?: typeof resolveConfig | (() => { ok: false; missingVariables: string[] })
  resolvePersistenceWriteAvailability?: typeof disabledPersistence | typeof enabledPersistence
  persistStatusEvents?: (events: unknown[]) => Promise<void>
  verifySignature?: typeof verifyMetaWebhookSignature
  logger?: ReturnType<typeof createLogger>['logger']
}) =>
  handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(signature === null ? {} : { 'x-hub-signature-256': signature }),
      },
      body,
    }),
    resolveWebhookPostConfig,
    verifySignature,
    extractStatusEvents: (payload) => {
      const entry = payload.entry as Array<Record<string, unknown>>
      const changes = entry[0].changes as Array<Record<string, unknown>>
      const value = changes[0].value as { statuses?: unknown[] }
      return value.statuses || []
    },
    persistStatusEvents,
    resolvePersistenceWriteAvailability,
    logger,
  })

test('webhook GET uses timing-safe verification and fixed responses', async () => {
  const success = handleWhatsappWebhookGet({
    searchParams: new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-token',
      'hub.challenge': 'challenge-token',
    }),
    expectedToken: 'verify-token',
  })
  const failure = handleWhatsappWebhookGet({
    searchParams: new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'challenge-token',
    }),
    expectedToken: 'verify-token',
  })
  const unavailable = handleWhatsappWebhookGet({
    searchParams: new URLSearchParams(),
    expectedToken: '',
  })

  assert.equal(success.status, 200)
  assert.equal(await success.text(), 'challenge-token')
  assert.equal(failure.status, 403)
  assert.deepEqual(await failure.json(), {
    verified: false,
    reason: 'verification-failed',
  })
  assert.equal(unavailable.status, 503)
  assert.deepEqual(await unavailable.json(), {
    verified: false,
    reason: 'configuration-invalid',
  })
})

test('webhook POST fails closed without exposing missing configuration names', async () => {
  const { entries, logger } = createLogger()
  const body = JSON.stringify(buildStatusPayload())
  const response = await postBody({
    body,
    resolveWebhookPostConfig: () => ({
      ok: false,
      missingVariables: ['WHATSAPP_APP_SECRET'],
    }),
    logger,
  })

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'configuration-invalid',
  })
  assert.equal(entries.length, 1)
  assert.doesNotMatch(JSON.stringify(entries), /WHATSAPP_APP_SECRET/)
})

test('signature verification occurs before JSON parsing', async () => {
  let signatureCalls = 0
  const response = await postBody({
    body: '{',
    signature: null,
    verifySignature: (input) => {
      signatureCalls += 1
      return verifyMetaWebhookSignature(input)
    },
  })

  assert.equal(signatureCalls, 1)
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'missing-signature',
  })
})

test('validly signed malformed payloads receive a fixed 400 response', async () => {
  for (const body of ['{', JSON.stringify({ object: 'page' })]) {
    const response = await postBody({ body })
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
      received: false,
      reason: 'malformed-payload',
    })
  }
})

test('body-size limit rejects before signature verification', async () => {
  let signatureCalls = 0
  const body = 'x'.repeat(1024 * 1024 + 1)
  const response = await postBody({
    body,
    verifySignature: (input) => {
      signatureCalls += 1
      return verifyMetaWebhookSignature(input)
    },
  })

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), {
    received: false,
    reason: 'body-too-large',
  })
  assert.equal(signatureCalls, 0)
})

test('exact WABA and phone allowlists fail closed independently', async () => {
  const wrongWabaBody = JSON.stringify(buildStatusPayload({ wabaId: '1234567890129999' }))
  const wrongPhoneBody = JSON.stringify(buildStatusPayload({ phoneId: '1234567890129999' }))

  for (const body of [wrongWabaBody, wrongPhoneBody]) {
    const response = await postBody({ body })
    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), {
      received: false,
      reason: 'asset-mismatch',
    })
  }
})

test('Preview accepts an isolated event without persistence', async () => {
  let persistCalls = 0
  let inboundContextCalls = 0
  const { entries, logger } = createLogger()
  const body = JSON.stringify(buildStatusPayload())
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(body),
      },
      body,
    }),
    resolveWebhookPostConfig: resolveConfig,
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [{ safe: true }],
    persistStatusEvents: async () => {
      persistCalls += 1
    },
    resolveInboundProcessingContext: () => {
      inboundContextCalls += 1
      throw new Error('Preview must not resolve persistence dependencies.')
    },
    resolvePersistenceWriteAvailability: disabledPersistence,
    logger,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: true,
    statusEvents: 1,
    inboundCommandEvents: 0,
  })
  assert.equal(persistCalls, 0)
  assert.equal(inboundContextCalls, 0)
  assert.equal(entries.length, 1)
  assert.deepEqual(entries[0], {
    message: 'WhatsApp webhook request.',
    details: {
      component: 'whatsapp-webhook',
      stage: 'accepted',
      accepted: true,
      signatureAccepted: true,
      payloadValid: true,
      wabaMatched: true,
      phoneMatched: true,
      classification: 'message_status',
      inboundTextCount: 0,
      otherMessageCount: 0,
      statusCount: 1,
      persistenceAttempted: false,
      outboundAttempted: false,
    },
  })
  const serializedLog = JSON.stringify(entries)
  assert.doesNotMatch(serializedLog, new RegExp(appSecret, 'i'))
  assert.doesNotMatch(serializedLog, new RegExp(businessAccountId))
  assert.doesNotMatch(serializedLog, new RegExp(phoneNumberId))
  assert.doesNotMatch(serializedLog, /wamid|recipient|display_phone/i)
})

test('Production behavior remains available only after all security gates pass', async () => {
  const persistedEvents: unknown[] = []
  const body = JSON.stringify(buildStatusPayload())
  const response = await postBody({
    body,
    resolvePersistenceWriteAvailability: enabledPersistence,
    persistStatusEvents: async (events) => {
      persistedEvents.push(...events)
    },
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: true,
    statusEvents: 1,
    inboundCommandEvents: 0,
  })
  assert.equal(persistedEvents.length, 1)
})
