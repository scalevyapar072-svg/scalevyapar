import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  createWhatsappWebhookStatusEventKey,
  persistWhatsappWebhookStatusEvents,
  type WhatsappStatusRpcClient,
  type WhatsappWebhookStatusEvent,
} from '../../lib/labour-whatsapp-webhook'
import {
  createWhatsappAtomicInboundCommandProcessor,
  type WhatsappAtomicInboundCommandRpcClient,
} from '../../lib/whatsapp/inbound-command-processor'
import type { WhatsappInboundMessageEvent } from '../../lib/whatsapp/inbound-message'
import { verifyMetaWebhookSignature } from '../../lib/whatsapp/meta-signature'
import { handleWhatsappWebhookPost } from '../../lib/whatsapp/webhook-route'

const appSecret = 'test-app-secret'
const businessAccountId = '1234567890123573'
const phoneNumberId = '1234567890120825'

const buildSignature = (body: string) =>
  `sha256=${createHmac('sha256', appSecret).update(Buffer.from(body, 'utf8')).digest('hex')}`

const resolveConfig = () => ({
  ok: true as const,
  config: { appSecret, businessAccountId, phoneNumberId },
})

const enabledPersistence = () => ({ enabled: true as const })

const missingProductionPersistence = () => ({
  enabled: false as const,
  reason: 'missing_configuration' as const,
  message: 'Sensitive configuration details must never be logged.',
})

const previewPersistence = () => ({
  enabled: false as const,
  reason: 'environment_not_production' as const,
  message: 'Preview remains stateless.',
})

const buildMessageBody = ({
  messageId = 'wamid-command-1',
  from = '9876543210',
  text,
}: {
  messageId?: string
  from?: string
  text: string
}) =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: businessAccountId,
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: phoneNumberId },
              messages: [
                {
                  id: messageId,
                  from,
                  timestamp: '1724587200',
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  })

const buildStatusBody = () =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: businessAccountId,
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: phoneNumberId },
              statuses: [
                {
                  id: 'wamid-status-1',
                  status: 'delivered',
                  timestamp: '1724587200',
                  recipient_id: '919876543210',
                },
              ],
            },
          },
        ],
      },
    ],
  })

const createLogger = () => {
  const entries: string[] = []
  return {
    entries,
    logger: {
      log(message: string, details?: unknown) {
        entries.push(`${message} ${JSON.stringify(details || {})}`)
      },
      error(message: string, details?: unknown) {
        entries.push(`${message} ${JSON.stringify(details || {})}`)
      },
    },
  }
}

const postBody = async ({
  body,
  statusEvents = [],
  resolvePersistenceWriteAvailability = enabledPersistence,
  processInboundCommand = async () => ({ processed: true, duplicate: false }),
  persistStatusEvents = async () => {},
  logger,
}: {
  body: string
  statusEvents?: unknown[]
  resolvePersistenceWriteAvailability?:
    | typeof enabledPersistence
    | typeof missingProductionPersistence
    | typeof previewPersistence
  processInboundCommand?: (
    event: WhatsappInboundMessageEvent,
  ) => Promise<{ processed: boolean; duplicate: boolean }>
  persistStatusEvents?: (events: unknown[]) => Promise<void>
  logger?: ReturnType<typeof createLogger>['logger']
}) =>
  handleWhatsappWebhookPost({
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
    extractStatusEvents: () => statusEvents,
    persistStatusEvents,
    resolvePersistenceWriteAvailability,
    resolveInboundProcessingContext: () => ({
      available: true as const,
      processInboundCommand,
    }),
    logger,
  })

test('Production fails closed with a sanitized retryable response for STOP and status events when persistence is unavailable', async () => {
  const { entries, logger } = createLogger()
  let commandCalls = 0
  let statusCalls = 0

  const stopResponse = await postBody({
    body: buildMessageBody({ text: 'STOP' }),
    resolvePersistenceWriteAvailability: missingProductionPersistence,
    processInboundCommand: async () => {
      commandCalls += 1
      return { processed: true, duplicate: false }
    },
    logger,
  })

  const statusResponse = await postBody({
    body: buildStatusBody(),
    statusEvents: [{ status: 'delivered' }],
    resolvePersistenceWriteAvailability: missingProductionPersistence,
    persistStatusEvents: async () => {
      statusCalls += 1
    },
    logger,
  })

  for (const response of [stopResponse, statusResponse]) {
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      received: false,
      reason: 'persistence-unavailable',
    })
  }
  assert.equal(commandCalls, 0)
  assert.equal(statusCalls, 0)

  const serialized = entries.join('\n')
  assert.doesNotMatch(serialized, /Sensitive configuration details/)
  assert.doesNotMatch(serialized, new RegExp(appSecret, 'i'))
  assert.doesNotMatch(serialized, new RegExp(businessAccountId))
  assert.doesNotMatch(serialized, new RegExp(phoneNumberId))
  assert.doesNotMatch(serialized, /9876543210|wamid-command-1|\bSTOP\b/)
})

test('ordinary inbound messages remain acknowledged without Production persistence', async () => {
  let commandCalls = 0
  const response = await postBody({
    body: buildMessageBody({ text: 'Please share more job details.' }),
    resolvePersistenceWriteAvailability: missingProductionPersistence,
    processInboundCommand: async () => {
      commandCalls += 1
      return { processed: true, duplicate: false }
    },
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    received: true,
    statusEvents: 0,
    inboundCommandEvents: 0,
  })
  assert.equal(commandCalls, 0)
})

test('STOP and START are delegated once to the atomic command processor and never send outbound traffic', async () => {
  const receivedEvents: WhatsappInboundMessageEvent[] = []
  let fetchCalls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    fetchCalls += 1
    return Response.json({})
  }) as typeof fetch

  try {
    for (const [messageId, text, expectedKind] of [
      ['wamid-stop-atomic', 'STOP', 'opt_out_all'],
      ['wamid-start-atomic', 'START', 'restore_request'],
    ] as const) {
      const response = await postBody({
        body: buildMessageBody({ messageId, text }),
        processInboundCommand: async (event) => {
          receivedEvents.push(event)
          return { processed: true, duplicate: false }
        },
      })

      assert.equal(response.status, 200)
      assert.equal(receivedEvents.at(-1)?.classification.kind, expectedKind)
    }

    assert.equal(receivedEvents.length, 2)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('atomic RPC preserves message-id deduplication for duplicate inbound delivery', async () => {
  const completedMessageIds = new Set<string>()
  const rpcCalls: Array<Record<string, unknown>> = []
  const client: WhatsappAtomicInboundCommandRpcClient = {
    rpc(functionName, parameters) {
      assert.equal(functionName, 'process_labour_whatsapp_inbound_command')
      rpcCalls.push(parameters)
      const messageId = String(parameters.p_message_id)
      const duplicate = completedMessageIds.has(messageId)
      completedMessageIds.add(messageId)
      return {
        async single() {
          return {
            data: { processed: !duplicate, duplicate },
            error: null,
          }
        },
      }
    },
  }
  const processInboundCommand = createWhatsappAtomicInboundCommandProcessor({ client })
  const body = buildMessageBody({ messageId: 'wamid-stop-duplicate', text: 'UNSUBSCRIBE' })

  const first = await postBody({ body, processInboundCommand })
  const second = await postBody({ body, processInboundCommand })

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal((await first.json()).inboundCommandEvents, 1)
  assert.equal((await second.json()).inboundCommandEvents, 0)
  assert.equal(rpcCalls.length, 2)
  assert.deepEqual(rpcCalls[0], rpcCalls[1])
})

test('retry after a simulated pre-commit failure succeeds without leaking the database error', async () => {
  let attempts = 0
  const client: WhatsappAtomicInboundCommandRpcClient = {
    rpc() {
      attempts += 1
      return {
        async single() {
          return attempts === 1
            ? {
                data: null,
                error: { code: '23505', message: 'sensitive unique constraint details' },
              }
            : {
                data: { processed: true, duplicate: false },
                error: null,
              }
        },
      }
    },
  }
  const processInboundCommand = createWhatsappAtomicInboundCommandProcessor({ client })
  const body = buildMessageBody({ messageId: 'wamid-retry-after-rollback', text: 'STOP' })

  const first = await postBody({ body, processInboundCommand })
  const second = await postBody({ body, processInboundCommand })

  assert.equal(first.status, 500)
  assert.deepEqual(await first.json(), { received: false, reason: 'processing-failed' })
  assert.equal(second.status, 200)
  assert.equal((await second.json()).inboundCommandEvents, 1)
  assert.equal(attempts, 2)
})

test('Preview remains stateless for STOP and status events', async () => {
  let commandCalls = 0
  let statusCalls = 0
  const response = await postBody({
    body: buildMessageBody({ text: 'STOP' }),
    statusEvents: [{ status: 'delivered' }],
    resolvePersistenceWriteAvailability: previewPersistence,
    processInboundCommand: async () => {
      commandCalls += 1
      return { processed: true, duplicate: false }
    },
    persistStatusEvents: async () => {
      statusCalls += 1
    },
  })

  assert.equal(response.status, 200)
  assert.equal(commandCalls, 0)
  assert.equal(statusCalls, 0)
})

const makeStatusEvent = (): WhatsappWebhookStatusEvent => ({
  messageId: 'wamid-status-dedupe',
  status: 'delivered',
  recipientWaId: '919876543210',
  timestamp: '1724587200',
  phoneNumberId: '1234567890120825',
  displayPhoneNumber: '+91 98765 43210',
  conversationId: 'conversation-sensitive-id',
  conversationOrigin: 'utility',
  pricingCategory: 'utility',
  pricingBillable: true,
  rawErrors: [
    {
      code: 131000,
      message: 'raw provider detail containing 9876543210',
    },
  ],
})

test('duplicate status delivery uses one deterministic non-secret key and creates one audit row', async () => {
  const storedKeys = new Set<string>()
  const calls: Array<Record<string, unknown>> = []
  const client: WhatsappStatusRpcClient = {
    rpc(functionName, parameters) {
      assert.equal(functionName, 'record_labour_whatsapp_status_event')
      calls.push(parameters)
      const key = String(parameters.p_event_key)
      const duplicate = storedKeys.has(key)
      storedKeys.add(key)
      return {
        async single() {
          return {
            data: { inserted: !duplicate, duplicate },
            error: null,
          }
        },
      }
    },
  }
  const event = makeStatusEvent()
  const options = {
    resolveWriteAvailability: enabledPersistence,
    resolvePersistenceClient: () => ({
      available: true as const,
      client: client as never,
      presentConfigurationNames: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ] as ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    }),
  }

  const first = await persistWhatsappWebhookStatusEvents([event, event], options)
  const second = await persistWhatsappWebhookStatusEvents([event], options)

  assert.deepEqual(first, { inserted: 1, duplicates: 1 })
  assert.deepEqual(second, { inserted: 0, duplicates: 1 })
  assert.equal(storedKeys.size, 1)
  assert.equal(createWhatsappWebhookStatusEventKey(event), calls[0]?.p_event_key)
  assert.match(String(calls[0]?.p_event_key), /^[0-9a-f]{64}$/)
  assert.doesNotMatch(String(calls[0]?.p_summary), /9876543210/)
  assert.doesNotMatch(String(calls[0]?.p_summary), /1234567890120825/)
  assert.doesNotMatch(String(calls[0]?.p_summary), /conversation-sensitive-id/)
  assert.doesNotMatch(String(calls[0]?.p_summary), /raw provider detail/)
})

test('forward-only migration provides atomic command processing, retry safety, status idempotency, and least-privilege RPC access', async () => {
  const migrationUrl = new URL(
    '../../supabase/migrations/20260925171311_harden_whatsapp_webhook_production_processing.sql',
    import.meta.url,
  )
  const sql = (await readFile(migrationUrl, 'utf8')).toLowerCase()

  assert.match(sql, /create or replace function public\.process_labour_whatsapp_inbound_command/)
  assert.match(sql, /security definer\s+set search_path = pg_catalog, public/)
  assert.match(sql, /insert into public\.labour_whatsapp_inbound_events/)
  assert.match(sql, /insert into public\.labour_whatsapp_suppressions/)
  assert.match(sql, /insert into public\.labour_whatsapp_consents/)
  assert.match(sql, /insert into public\.labour_whatsapp_consent_events/)
  assert.match(sql, /on conflict \(message_id\) do nothing/)
  assert.match(sql, /processingstate', 'completed'/)
  assert.match(sql, /completed_pending_retry/)
  assert.match(sql, /restoration_requested_at = v_now/)
  assert.match(sql, /restoration_message_id = p_message_id/)
  assert.doesNotMatch(sql, /set\s+allowed\s*=\s*true/)

  assert.match(sql, /create or replace function public\.record_labour_whatsapp_status_event/)
  assert.match(sql, /audit-whatsapp-status-/)
  assert.match(sql, /on conflict \(id\) do nothing/)
  assert.match(sql, /revoke all[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /grant execute[\s\S]*to service_role/)
  assert.match(sql, /revoke update, delete, truncate[\s\S]*labour_whatsapp_consent_events/)

  assert.equal(sql.includes('drop table'), false)
  assert.equal(sql.includes('drop function'), false)
  assert.equal(sql.includes('alter type'), false)
  assert.equal(sql.includes('net.http'), false)
  assert.equal(sql.includes('/messages'), false)
})
