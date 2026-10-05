import { createHash, timingSafeEqual } from 'node:crypto'

import {
  createWhatsappAtomicInboundCommandProcessor,
  type WhatsappAtomicInboundCommandResult,
  type WhatsappAtomicInboundCommandRpcClient,
} from './inbound-command-processor'
import {
  extractWhatsappInboundMessageEvents,
  type WhatsappInboundMessageEvent,
} from './inbound-message'
import type { MetaWebhookSignatureVerificationResult } from './meta-signature'
import {
  getWhatsappPersistenceClient,
  getWhatsappPersistenceWriteAvailability,
  type WhatsappPersistenceWriteAvailability,
} from './persistence-client'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/webhook-route')

type WebhookConfigResolution =
  | {
      ok: true
      config: {
        appSecret: string
        businessAccountId: string
        phoneNumberId: string
      }
    }
  | {
      ok: false
      missingVariables: string[]
    }

type InboundProcessingContext =
  | {
      available: false
      reason: string
      message: string
    }
  | {
      available: true
      processInboundCommand: (
        event: WhatsappInboundMessageEvent,
      ) => Promise<WhatsappAtomicInboundCommandResult>
    }

type SafeLogger = Pick<typeof console, 'log' | 'error'>

type JsonRecord = Record<string, unknown>

type PayloadSummary = {
  shapeValid: boolean
  wabaMatches: boolean
  phonePresent: boolean
  phoneMatches: boolean
  inboundTextCount: number
  otherMessageCount: number
  statusCount: number
}

type RawBodyResult =
  | {
      ok: true
      rawBody: Buffer
    }
  | {
      ok: false
      reason: 'body-too-large' | 'malformed-payload'
      status: 413 | 400
    }

const MAX_BODY_BYTES = 1024 * 1024

const asObject = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null

const isNonEmptyString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0

const readRawBody = async (request: Request): Promise<RawBodyResult> => {
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    const normalizedLength = contentLength.trim()
    if (!/^\d+$/.test(normalizedLength)) {
      return { ok: false, reason: 'malformed-payload', status: 400 }
    }

    if (Number(normalizedLength) > MAX_BODY_BYTES) {
      return { ok: false, reason: 'body-too-large', status: 413 }
    }
  }

  if (!request.body) {
    return { ok: true, rawBody: Buffer.alloc(0) }
  }

  const reader = request.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0

  try {
    while (true) {
      const result = await reader.read()
      if (result.done) break

      const chunk = Buffer.from(result.value)
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        try {
          await reader.cancel()
        } catch {
          // The size failure remains authoritative even if stream cancellation fails.
        }
        return { ok: false, reason: 'body-too-large', status: 413 }
      }

      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock()
  }

  return { ok: true, rawBody: Buffer.concat(chunks, totalBytes) }
}

const constantTimeUtf8Equal = (left: string, right: string) => {
  const leftDigest = createHash('sha256').update(left, 'utf8').digest()
  const rightDigest = createHash('sha256').update(right, 'utf8').digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

const summarizePayload = (
  payload: JsonRecord,
  expectedBusinessAccountId: string,
  expectedPhoneNumberId: string,
): PayloadSummary => {
  const summary: PayloadSummary = {
    shapeValid: true,
    wabaMatches: true,
    phonePresent: true,
    phoneMatches: true,
    inboundTextCount: 0,
    otherMessageCount: 0,
    statusCount: 0,
  }

  if (payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
    return { ...summary, shapeValid: false, wabaMatches: false, phonePresent: false }
  }

  if (payload.entry.length === 0) {
    return { ...summary, shapeValid: false, wabaMatches: false, phonePresent: false }
  }

  for (const rawEntry of payload.entry) {
    const entry = asObject(rawEntry)
    if (!entry || !isNonEmptyString(entry.id) || !Array.isArray(entry.changes)) {
      summary.shapeValid = false
      continue
    }

    if (entry.id !== expectedBusinessAccountId) {
      summary.wabaMatches = false
    }

    if (entry.changes.length === 0) {
      summary.shapeValid = false
      continue
    }

    for (const rawChange of entry.changes) {
      const change = asObject(rawChange)
      const value = asObject(change?.value)
      const metadata = asObject(value?.metadata)

      if (!change || change.field !== 'messages' || !value || !metadata) {
        summary.shapeValid = false
        continue
      }

      const phoneNumberId = metadata.phone_number_id
      if (!isNonEmptyString(phoneNumberId)) {
        summary.shapeValid = false
        summary.phonePresent = false
      } else if (phoneNumberId !== expectedPhoneNumberId) {
        summary.phoneMatches = false
      }

      const messagesValue = value.messages
      const statusesValue = value.statuses
      if (messagesValue !== undefined && !Array.isArray(messagesValue)) {
        summary.shapeValid = false
      }
      if (statusesValue !== undefined && !Array.isArray(statusesValue)) {
        summary.shapeValid = false
      }

      const messages = Array.isArray(messagesValue) ? messagesValue : []
      const statuses = Array.isArray(statusesValue) ? statusesValue : []
      if (messages.length === 0 && statuses.length === 0) {
        summary.shapeValid = false
      }

      for (const rawMessage of messages) {
        const message = asObject(rawMessage)
        if (
          !message ||
          !isNonEmptyString(message.id) ||
          !isNonEmptyString(message.from) ||
          !isNonEmptyString(message.timestamp) ||
          !isNonEmptyString(message.type)
        ) {
          summary.shapeValid = false
          continue
        }

        if (message.type === 'text') {
          const text = asObject(message.text)
          if (!text || typeof text.body !== 'string') {
            summary.shapeValid = false
            continue
          }
          summary.inboundTextCount += 1
        } else {
          summary.otherMessageCount += 1
        }
      }

      for (const rawStatus of statuses) {
        const status = asObject(rawStatus)
        if (
          !status ||
          !isNonEmptyString(status.id) ||
          !isNonEmptyString(status.status) ||
          !isNonEmptyString(status.timestamp)
        ) {
          summary.shapeValid = false
          continue
        }
        summary.statusCount += 1
      }
    }
  }

  return summary
}

const classifyPayload = (summary: PayloadSummary) => {
  const inboundCount = summary.inboundTextCount + summary.otherMessageCount
  if (inboundCount > 0 && summary.statusCount > 0) return 'mixed'
  if (summary.inboundTextCount > 0 && summary.otherMessageCount > 0) {
    return 'inbound_mixed'
  }
  if (summary.inboundTextCount > 0) return 'inbound_text'
  if (summary.otherMessageCount > 0) return 'inbound_non_text'
  if (summary.statusCount > 0) return 'message_status'
  return 'messages_field_empty'
}

const writeSafeWebhookLog = (
  logger: SafeLogger,
  level: 'log' | 'error',
  details: Record<string, unknown>,
) => {
  logger[level]('WhatsApp webhook request.', {
    component: 'whatsapp-webhook',
    ...details,
  })
}

const createDefaultInboundProcessingContext = (): InboundProcessingContext => {
  const writeAvailability = getWhatsappPersistenceWriteAvailability()
  if (!writeAvailability.enabled) {
    return {
      available: false,
      reason: writeAvailability.reason,
      message: writeAvailability.message,
    }
  }

  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      available: false,
      reason: 'missing_configuration',
      message: persistence.message,
    }
  }

  return {
    available: true,
    processInboundCommand: createWhatsappAtomicInboundCommandProcessor({
      client: persistence.client as unknown as WhatsappAtomicInboundCommandRpcClient,
    }),
  }
}

const processInboundCommandEvent = async ({
  event,
  context,
}: {
  event: WhatsappInboundMessageEvent
  context: Extract<InboundProcessingContext, { available: true }>
}) => {
  const result = await context.processInboundCommand(event)
  return result.processed ? 1 : 0
}

export const handleWhatsappWebhookGet = ({
  searchParams,
  expectedToken,
}: {
  searchParams: URLSearchParams
  expectedToken: string
}) => {
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (!expectedToken) {
    return Response.json(
      { verified: false, reason: 'configuration-invalid' },
      { status: 503 },
    )
  }

  if (
    mode === 'subscribe' &&
    verifyToken !== null &&
    constantTimeUtf8Equal(verifyToken, expectedToken) &&
    challenge
  ) {
    return new Response(challenge, { status: 200 })
  }

  return Response.json(
    { verified: false, reason: 'verification-failed' },
    { status: 403 },
  )
}

export const handleWhatsappWebhookPost = async <WebhookEvent>({
  request,
  resolveWebhookPostConfig,
  verifySignature,
  extractStatusEvents,
  persistStatusEvents,
  resolveInboundProcessingContext = createDefaultInboundProcessingContext,
  resolvePersistenceWriteAvailability = getWhatsappPersistenceWriteAvailability,
  logger = console,
}: {
  request: Request
  resolveWebhookPostConfig: () => WebhookConfigResolution
  verifySignature: (input: {
    rawBody: Buffer
    signatureHeader: string | null
    appSecret: string
  }) => MetaWebhookSignatureVerificationResult
  extractStatusEvents: (payload: Record<string, unknown>) => WebhookEvent[]
  persistStatusEvents: (events: WebhookEvent[]) => Promise<unknown>
  resolveInboundProcessingContext?: () =>
    | InboundProcessingContext
    | Promise<InboundProcessingContext>
  resolvePersistenceWriteAvailability?: () => WhatsappPersistenceWriteAvailability
  logger?: SafeLogger
}) => {
  let persistenceAttempted = false

  try {
    const webhookConfig = resolveWebhookPostConfig()
    if (!webhookConfig.ok) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'configuration',
        accepted: false,
        reason: 'configuration-invalid',
      })
      return Response.json(
        {
          received: false,
          reason: 'configuration-invalid',
        },
        { status: 503 },
      )
    }

    const rawBodyResult = await readRawBody(request)
    if (!rawBodyResult.ok) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'body',
        accepted: false,
        reason: rawBodyResult.reason,
      })
      return Response.json(
        { received: false, reason: rawBodyResult.reason },
        { status: rawBodyResult.status },
      )
    }

    const { rawBody } = rawBodyResult
    const verification = verifySignature({
      rawBody,
      signatureHeader: request.headers.get('x-hub-signature-256'),
      appSecret: webhookConfig.config.appSecret,
    })
    if (!verification.valid) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'signature',
        accepted: false,
        signatureAccepted: false,
        reason: verification.reason,
      })
      return Response.json(
        {
          received: false,
          reason: verification.reason,
        },
        { status: 401 },
      )
    }

    let payload: JsonRecord
    try {
      const parsed = JSON.parse(rawBody.toString('utf8')) as unknown
      const parsedObject = asObject(parsed)
      if (!parsedObject) throw new SyntaxError('invalid-payload-shape')
      payload = parsedObject
    } catch {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'payload',
        accepted: false,
        signatureAccepted: true,
        payloadValid: false,
      })
      return Response.json(
        { received: false, reason: 'malformed-payload' },
        { status: 400 },
      )
    }

    const summary = summarizePayload(
      payload,
      webhookConfig.config.businessAccountId,
      webhookConfig.config.phoneNumberId,
    )
    if (!summary.shapeValid || !summary.phonePresent) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'payload',
        accepted: false,
        signatureAccepted: true,
        payloadValid: false,
      })
      return Response.json(
        { received: false, reason: 'malformed-payload' },
        { status: 400 },
      )
    }

    if (!summary.wabaMatches || !summary.phoneMatches) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'asset-isolation',
        accepted: false,
        signatureAccepted: true,
        payloadValid: true,
        wabaMatched: summary.wabaMatches,
        phoneMatched: summary.phoneMatches,
      })
      return Response.json(
        { received: false, reason: 'asset-mismatch' },
        { status: 403 },
      )
    }

    const inboundCommands = extractWhatsappInboundMessageEvents(payload).filter(
      (event) => event.classification.kind !== 'none',
    )
    const statusEvents = extractStatusEvents(payload)
    const writeAvailability = resolvePersistenceWriteAvailability()
    const persistenceRequired = inboundCommands.length > 0 || statusEvents.length > 0

    if (
      !writeAvailability.enabled &&
      writeAvailability.reason === 'missing_configuration' &&
      persistenceRequired
    ) {
      writeSafeWebhookLog(logger, 'error', {
        stage: 'persistence',
        accepted: false,
        reason: 'persistence-unavailable',
        persistenceAttempted: false,
        outboundAttempted: false,
      })
      return Response.json(
        {
          received: false,
          reason: 'persistence-unavailable',
        },
        { status: 503 },
      )
    }

    let processedInboundCommands = 0
    if (writeAvailability.enabled && inboundCommands.length > 0) {
      const inboundProcessingContext = await resolveInboundProcessingContext()

      if (!inboundProcessingContext.available) {
        writeSafeWebhookLog(logger, 'error', {
          stage: 'persistence',
          accepted: false,
          reason: 'persistence-unavailable',
          persistenceAttempted: false,
          outboundAttempted: false,
        })
        return Response.json(
          {
            received: false,
            reason: 'persistence-unavailable',
          },
          { status: 503 },
        )
      }

      for (const inboundCommand of inboundCommands) {
        persistenceAttempted = true
        processedInboundCommands += await processInboundCommandEvent({
          event: inboundCommand,
          context: inboundProcessingContext,
        })
      }
    }

    if (writeAvailability.enabled && statusEvents.length > 0) {
      persistenceAttempted = true
      await persistStatusEvents(statusEvents)
    }

    writeSafeWebhookLog(logger, 'log', {
      stage: 'accepted',
      accepted: true,
      signatureAccepted: true,
      payloadValid: true,
      wabaMatched: true,
      phoneMatched: true,
      classification: classifyPayload(summary),
      inboundTextCount: summary.inboundTextCount,
      otherMessageCount: summary.otherMessageCount,
      statusCount: summary.statusCount,
      persistenceAttempted,
      outboundAttempted: false,
    })

    return Response.json(
      {
        received: true,
        statusEvents: statusEvents.length,
        inboundCommandEvents: processedInboundCommands,
      },
      { status: 200 },
    )
  } catch {
    writeSafeWebhookLog(logger, 'error', {
      stage: 'processing',
      accepted: false,
      reason: 'processing-failed',
      persistenceAttempted,
      outboundAttempted: false,
    })
    return Response.json(
      {
        received: false,
        reason: 'processing-failed',
      },
      { status: 500 },
    )
  }
}
