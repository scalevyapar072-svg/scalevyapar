import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { createWhatsappConsentRepository } from '../../lib/whatsapp/consent-repository'
import { createWhatsappInboundEventRepository } from '../../lib/whatsapp/inbound-event-repository'
import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature'
import type {
  WhatsappConsentEventRow,
  WhatsappConsentRow,
  WhatsappInboundEventRow,
  WhatsappSuppressionRow,
} from '../../lib/whatsapp/persistence-types'
import { createWhatsappSuppressionRepository } from '../../lib/whatsapp/suppression-repository'
import { handleWhatsappWebhookPost } from '../../lib/whatsapp/webhook-route'

const appSecret = 'app-secret'

const buildSignature = (body: string) =>
  `sha256=${createHmac('sha256', appSecret).update(Buffer.from(body, 'utf8')).digest('hex')}`

const createLogger = () => {
  const entries: string[] = []

  return {
    entries,
    logger: {
      log(message: string, payload?: unknown) {
        entries.push(`${message} ${payload ? JSON.stringify(payload) : ''}`.trim())
      },
      error(message: string, payload?: unknown) {
        entries.push(`${message} ${payload ? JSON.stringify(payload) : ''}`.trim())
      },
    },
  }
}

const makeConsentStore = (seed: WhatsappConsentRow[] = []) => {
  const currentRows = [...seed]
  const eventRows: WhatsappConsentEventRow[] = []

  return {
    currentRows,
    eventRows,
    store: {
      async listCurrentConsents(query: {
        recipientType: string
        recipientId?: string | null
        normalizedMobile: string
        consentType?: string
      }) {
        return currentRows.filter((row) => {
          if (row.recipientType !== query.recipientType) return false
          if (row.normalizedMobile !== query.normalizedMobile) return false
          if (typeof query.recipientId !== 'undefined' && row.recipientId !== query.recipientId) {
            return false
          }
          if (typeof query.consentType !== 'undefined' && row.consentType !== query.consentType) {
            return false
          }
          return true
        })
      },
      async listRecentConsentEvents(limit: number) {
        return eventRows.slice(0, limit)
      },
      async insertConsentEvent(row: Omit<WhatsappConsentEventRow, 'id' | 'createdAt'>) {
        const nextRow: WhatsappConsentEventRow = {
          ...row,
          id: `event-${eventRows.length + 1}`,
          createdAt: row.occurredAt,
        }
        eventRows.push(nextRow)
        return nextRow
      },
      async insertCurrentConsent(row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>) {
        const nextRow: WhatsappConsentRow = {
          ...row,
          id: `consent-${currentRows.length + 1}`,
          createdAt: '2026-08-25T10:00:00.000Z',
          updatedAt: '2026-08-25T10:00:00.000Z',
        }
        currentRows.push(nextRow)
        return nextRow
      },
      async updateCurrentConsent(
        id: string,
        row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const index = currentRows.findIndex((candidate) => candidate.id === id)
        assert.notEqual(index, -1)
        const nextRow: WhatsappConsentRow = {
          ...currentRows[index],
          ...row,
          id,
          updatedAt: '2026-08-25T10:05:00.000Z',
        }
        currentRows[index] = nextRow
        return nextRow
      },
      async countCurrentConsents() {
        return 0
      },
    },
  }
}

const makeSuppressionStore = (seed: WhatsappSuppressionRow[] = []) => {
  const rows = [...seed]

  return {
    rows,
    store: {
      async getActiveSuppression(normalizedMobile: string) {
        return rows.find((row) => row.normalizedMobile === normalizedMobile && row.active) || null
      },
      async insertSuppression(
        row: Omit<
          WhatsappSuppressionRow,
          'id' | 'createdAt' | 'updatedAt' | 'restorationRequestedAt' | 'restorationMessageId'
        >,
      ) {
        const nextRow: WhatsappSuppressionRow = {
          ...row,
          id: `suppression-${rows.length + 1}`,
          restorationRequestedAt: null,
          restorationMessageId: null,
          createdAt: '2026-08-25T10:10:00.000Z',
          updatedAt: '2026-08-25T10:10:00.000Z',
        }
        rows.push(nextRow)
        return nextRow
      },
      async updateSuppression(id: string, row: Partial<WhatsappSuppressionRow>) {
        const index = rows.findIndex((candidate) => candidate.id === id)
        assert.notEqual(index, -1)
        const nextRow: WhatsappSuppressionRow = {
          ...rows[index],
          ...row,
          id,
          updatedAt: '2026-08-25T10:15:00.000Z',
        }
        rows[index] = nextRow
        return nextRow
      },
      async listSuppressionHistory(limit: number) {
        return rows.slice(0, limit)
      },
      async countActiveSuppressions() {
        return rows.filter((row) => row.active).length
      },
    },
  }
}

const makeInboundStore = () => {
  const rows: WhatsappInboundEventRow[] = []

  return {
    rows,
    store: {
      async getByMessageId(messageId: string) {
        return rows.find((row) => row.messageId === messageId) || null
      },
      async listRecentInboundEvents(limit: number) {
        return rows.slice(0, limit)
      },
      async insertInboundEvent(
        row: Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const nextRow: WhatsappInboundEventRow = {
          ...row,
          id: `inbound-${rows.length + 1}`,
          createdAt: '2026-08-25T10:20:00.000Z',
          updatedAt: '2026-08-25T10:20:00.000Z',
        }
        rows.push(nextRow)
        return nextRow
      },
      async updateInboundEvent(
        id: string,
        row: Partial<Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>>,
      ) {
        const index = rows.findIndex((candidate) => candidate.id === id)
        assert.notEqual(index, -1)
        const nextRow: WhatsappInboundEventRow = {
          ...rows[index],
          ...row,
          id,
          updatedAt: '2026-08-25T10:25:00.000Z',
        }
        rows[index] = nextRow
        return nextRow
      },
    },
  }
}

const buildWebhookBody = ({
  messageId,
  from,
  text,
}: {
  messageId: string
  from: string
  text: string
}) =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              messages: [
                {
                  id: messageId,
                  from,
                  timestamp: '1724587200',
                  type: 'text',
                  text: {
                    body: text,
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  })

const seedConsentRow = (
  consentType: WhatsappConsentRow['consentType'],
  allowed: boolean,
): WhatsappConsentRow => ({
  id: `seed-${consentType}`,
  recipientType: 'worker',
  recipientId: 'worker-1',
  normalizedMobile: '+919876543210',
  consentType,
  allowed,
  source: 'worker_settings',
  consentTextVersion: 'v1',
  consentedAt: allowed ? '2026-08-20T00:00:00.000Z' : null,
  optedOutAt: allowed ? null : '2026-08-22T00:00:00.000Z',
  metadata: {},
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-22T00:00:00.000Z',
})

const assertNoSensitiveData = (entries: string[]) => {
  const joined = entries.join('\n')
  assert.doesNotMatch(joined, /9876543210/)
  assert.doesNotMatch(joined, new RegExp(appSecret, 'i'))
}

const createInboundContext = ({
  resolution = {
    category: 'resolved_worker',
    matchedRecipientType: 'worker',
    matchedRecipientId: 'worker-1',
    matchedRecipientSource: 'direct',
  } as const,
  consentSeed = [
    seedConsentRow('service_allowed', true),
    seedConsentRow('matching_alerts_allowed', true),
  ],
  suppressionSeed = [],
}: {
  resolution?:
    | {
        category: 'resolved_worker'
        matchedRecipientType: 'worker'
        matchedRecipientId: string
        matchedRecipientSource: 'direct'
      }
    | {
        category: 'unknown_recipient' | 'ambiguous_recipient'
        matchedRecipientType: null
        matchedRecipientId: null
        matchedRecipientSource: 'none'
      }
  consentSeed?: WhatsappConsentRow[]
  suppressionSeed?: WhatsappSuppressionRow[]
} = {}) => {
  const inbound = makeInboundStore()
  const consent = makeConsentStore(consentSeed)
  const suppression = makeSuppressionStore(suppressionSeed)

  return {
    inboundRows: inbound.rows,
    consentRows: consent.currentRows,
    consentEventRows: consent.eventRows,
    suppressionRows: suppression.rows,
    context: {
      available: true as const,
      inboundEventRepository: createWhatsappInboundEventRepository({
        store: inbound.store,
      }),
      consentRepository: createWhatsappConsentRepository({
        store: consent.store,
      }),
      suppressionRepository: createWhatsappSuppressionRepository({
        store: suppression.store,
      }),
      resolveRecipientOwnership: async () => resolution,
    },
  }
}

test('missing signature rejects before JSON parsing for inbound payloads', async () => {
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{',
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

test('invalid signature rejects before JSON parsing for inbound payloads', async () => {
  const response = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=bad-signature',
      },
      body: '{',
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
    reason: 'invalid-format',
  })
})

test('STOP command creates one suppression and blocks unique recipient consent once', async () => {
  const { context, suppressionRows, consentRows, inboundRows, consentEventRows } =
    createInboundContext()
  const { entries, logger } = createLogger()
  const body = buildWebhookBody({
    messageId: 'wamid-stop-1',
    from: '9876543210',
    text: 'STOP',
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
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
    resolveInboundProcessingContext: () => context,
    logger,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: true,
    statusEvents: 0,
    inboundCommandEvents: 1,
  })
  assert.equal(suppressionRows.length, 1)
  assert.equal(inboundRows.length, 1)
  assert.equal(consentRows.every((row) => row.allowed === false), true)
  assert.equal(consentEventRows.length, 3)
  assert.equal(
    String(inboundRows[0]?.metadata.processingOutcome || ''),
    'suppression_created',
  )
  assertNoSensitiveData(entries)
})

test('duplicate message ids have no repeated STOP side effects', async () => {
  const { context, suppressionRows, inboundRows, consentEventRows } = createInboundContext()
  const body = buildWebhookBody({
    messageId: 'wamid-stop-duplicate',
    from: '9876543210',
    text: 'UNSUBSCRIBE',
  })

  const runRequest = () =>
    handleWhatsappWebhookPost({
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
      resolveInboundProcessingContext: () => context,
      logger: {
        log() {},
        error() {},
      },
    })

  const firstResponse = await runRequest()
  const secondResponse = await runRequest()

  assert.equal(firstResponse.status, 200)
  assert.equal(secondResponse.status, 200)
  assert.equal(suppressionRows.length, 1)
  assert.equal(inboundRows.length, 1)
  assert.equal(consentEventRows.length, 3)
})

test('unknown and ambiguous recipients never mutate recipient consent rows', async () => {
  const unknown = createInboundContext({
    resolution: {
      category: 'unknown_recipient',
      matchedRecipientType: null,
      matchedRecipientId: null,
      matchedRecipientSource: 'none',
    },
    consentSeed: [],
  })
  const ambiguous = createInboundContext({
    resolution: {
      category: 'ambiguous_recipient',
      matchedRecipientType: null,
      matchedRecipientId: null,
      matchedRecipientSource: 'none',
    },
    consentSeed: [],
  })

  for (const state of [unknown, ambiguous]) {
    const body = buildWebhookBody({
      messageId: `wamid-${state === unknown ? 'unknown' : 'ambiguous'}`,
      from: '9876543210',
      text: 'बंद',
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
      extractStatusEvents: () => [],
      persistStatusEvents: async () => {},
      resolveInboundProcessingContext: () => state.context,
      logger: {
        log() {},
        error() {},
      },
    })

    assert.equal(response.status, 200)
    assert.equal(state.suppressionRows.length, 1)
    assert.equal(state.consentRows.length, 0)
    assert.equal(state.consentEventRows.length, 0)
  }
})

test('invalid mobile fails closed before persistence and START never restores consent automatically', async () => {
  const { context, suppressionRows, consentRows, consentEventRows, inboundRows } = createInboundContext({
    suppressionSeed: [
      {
        id: 'suppression-1',
        normalizedMobile: '+919876543210',
        suppressionScope: 'all_whatsapp',
        triggerSource: 'inbound_opt_out',
        triggerCommand: 'stop',
        triggerMessageId: 'wamid-stop-seed',
        previousConsentSnapshot: {},
        restorationRequestedAt: null,
        restorationMessageId: null,
        active: true,
        metadata: {},
        createdAt: '2026-08-25T09:00:00.000Z',
        updatedAt: '2026-08-25T09:00:00.000Z',
      },
    ],
  })
  const { entries, logger } = createLogger()

  const invalidBody = buildWebhookBody({
    messageId: 'wamid-invalid',
    from: '12345',
    text: 'START',
  })
  const invalidResponse = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(invalidBody),
      },
      body: invalidBody,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
    resolveInboundProcessingContext: () => context,
    logger,
  })

  const startBody = buildWebhookBody({
    messageId: 'wamid-start-1',
    from: '9876543210',
    text: 'चालू',
  })
  const repeatedStartBody = buildWebhookBody({
    messageId: 'wamid-start-2',
    from: '9876543210',
    text: 'SUBSCRIBE',
  })

  const startResponse = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(startBody),
      },
      body: startBody,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
    resolveInboundProcessingContext: () => context,
    logger,
  })

  const repeatedStartResponse = await handleWhatsappWebhookPost({
    request: new Request('https://example.com/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': buildSignature(repeatedStartBody),
      },
      body: repeatedStartBody,
    }),
    resolveWebhookPostConfig: () => ({
      ok: true,
      config: { appSecret },
    }),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: () => [],
    persistStatusEvents: async () => {},
    resolveInboundProcessingContext: () => context,
    logger,
  })

  assert.equal(invalidResponse.status, 200)
  assert.equal(startResponse.status, 200)
  assert.equal(repeatedStartResponse.status, 200)
  assert.equal(suppressionRows.length, 1)
  assert.equal(Boolean(suppressionRows[0]?.restorationRequestedAt), true)
  assert.equal(suppressionRows[0]?.restorationMessageId, 'wamid-start-1')
  assert.equal(consentRows.every((row) => row.allowed === true), true)
  assert.equal(consentEventRows.length, 2)
  assert.equal(inboundRows.length, 2)
  assertNoSensitiveData(entries)
})
