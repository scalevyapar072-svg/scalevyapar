import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'node:crypto'

import {
  buildWhatsappConsentState,
  maskWhatsappMobile,
  WHATSAPP_CONSENT_TEXT_VERSION,
  WHATSAPP_CONSENT_TYPES,
} from './consent'
import { createWhatsappConsentRepository } from './consent-repository'
import {
  extractWhatsappInboundMessageEvents,
  type WhatsappInboundMessageEvent,
} from './inbound-message'
import { createWhatsappInboundEventRepository } from './inbound-event-repository'
import type { MetaWebhookSignatureVerificationResult } from './meta-signature'
import {
  getWhatsappPersistenceClient,
  getWhatsappPersistenceWriteAvailability,
  type WhatsappPersistenceWriteAvailability,
} from './persistence-client'
import type { JsonObject, WhatsappPersistenceRecipientType } from './persistence-types'
import { createWhatsappSuppressionRepository } from './suppression-repository'
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

type RecipientResolution =
  | {
      category: 'resolved_worker'
      matchedRecipientType: 'worker'
      matchedRecipientId: string
      matchedRecipientSource: 'direct'
    }
  | {
      category: 'resolved_company'
      matchedRecipientType: 'company'
      matchedRecipientId: string
      matchedRecipientSource: 'contact_mobile' | 'mobile'
    }
  | {
      category: 'unknown_recipient' | 'ambiguous_recipient'
      matchedRecipientType: null
      matchedRecipientId: null
      matchedRecipientSource: 'none'
    }

type InboundEventRepository = {
  getInboundMessage: (messageId: string) => Promise<{
    id: string
    messageId: string
    suppressionApplied: boolean
    metadata: JsonObject
  } | null>
  classifyAndPrepareInboundEvent: (input: {
    messageId: string
    mobile: string
    rawText: string
    timestamp?: string | Date
    matchedRecipientType?: WhatsappPersistenceRecipientType | null
    matchedRecipientId?: string | null
    currentlySuppressed?: boolean
    metadata?: JsonObject
  }) => Promise<{
    messageId: string
    normalizedMobile: string | null
    matchedRecipientType: WhatsappPersistenceRecipientType | null
    matchedRecipientId: string | null
    eventKind: 'opt_out_all' | 'restore_request' | 'message' | 'unknown'
    rawText: string
    normalizedText: string
    commandKey: string | null
    suppressionApplied: boolean
    metadata: JsonObject
    classification: {
      kind: 'opt_out_all' | 'restore_request' | 'none'
      normalizedCommand: string
    }
  }>
  recordInboundEvent: (row: {
    messageId: string
    normalizedMobile: string | null
    matchedRecipientType: WhatsappPersistenceRecipientType | null
    matchedRecipientId: string | null
    eventKind: 'opt_out_all' | 'restore_request' | 'message' | 'unknown'
    rawText: string
    normalizedText: string
    commandKey: string | null
    suppressionApplied: boolean
    metadata: JsonObject
  }) => Promise<{
    duplicate: boolean
    event: {
      id: string
      suppressionApplied: boolean
      metadata: JsonObject
    }
  }>
  updateInboundEvent: (
    id: string,
    row: {
      suppressionApplied?: boolean
      metadata?: JsonObject
    },
  ) => Promise<{
    id: string
    suppressionApplied: boolean
    metadata: JsonObject
  }>
}

type SuppressionRepository = {
  getActiveSuppression: (input: { normalizedMobile: string }) => Promise<{
    id: string
    restorationRequestedAt: string | null
    restorationMessageId: string | null
    metadata: JsonObject
  } | null>
  recordSuppression: (input: {
    mobile: string
    triggerSource: string
    triggerCommand: string
    triggerMessageId?: string | null
    previousConsentSnapshot?: JsonObject
    metadata?: JsonObject
  }) => Promise<{
    created: boolean
    duplicate: boolean
  }>
  recordRestorationRequest: (input: {
    mobile: string
    restorationMessageId?: string | null
    metadata?: JsonObject
  }) => Promise<{
    updated: boolean
    duplicate: boolean
  }>
}

type ConsentRepository = {
  listRecipientConsents: (query: {
    recipientType: 'worker' | 'company'
    recipientId?: string | null
    normalizedMobile: string
  }) => Promise<
    Array<{
      consentType: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
      allowed: boolean
      consentTextVersion: string
    }>
  >
  recordConsentDecision: (input: {
    recipientType: 'worker' | 'company'
    recipientId?: string | null
    mobile: string
    consentType: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
    allowed: boolean
    eventType: 'opted_out'
    source: 'inbound_opt_out'
    consentTextVersion?: string
    eventMessageId?: string | null
    metadata?: JsonObject
    occurredAt?: string
  }) => Promise<unknown>
  recordConsentEvent: (input: {
    recipientType: 'worker' | 'company'
    recipientId?: string | null
    normalizedMobile: string
    consentType: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
    previousAllowed: boolean | null
    newAllowed: boolean
    eventType: 'restoration_requested'
    source: 'inbound_restore_request'
    consentTextVersion?: string
    eventMessageId?: string | null
    metadata?: JsonObject
    occurredAt?: string
  }) => Promise<unknown>
}

type InboundProcessingContext =
  | {
      available: false
      reason: string
      message: string
    }
  | {
      available: true
      inboundEventRepository: InboundEventRepository
      suppressionRepository: SuppressionRepository
      consentRepository: ConsentRepository
      resolveRecipientOwnership: (normalizedMobile: string) => Promise<RecipientResolution>
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

const normalizeIsoTimestamp = (value: string) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null

  if (/^\d{10,13}$/.test(trimmed)) {
    const numeric = Number(trimmed)
    if (Number.isFinite(numeric)) {
      const date = new Date(trimmed.length === 13 ? numeric : numeric * 1000)
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const isCompletedInboundEvent = (metadata: JsonObject) =>
  String(metadata.processingState || '').trim().toLowerCase() === 'completed'

const toCommandType = (kind: 'opt_out_all' | 'restore_request' | 'none') =>
  kind === 'opt_out_all' ? 'STOP' : kind === 'restore_request' ? 'START' : 'NONE'

const toRecipientMetadata = (resolution: RecipientResolution): JsonObject => ({
  resolutionCategory: resolution.category,
  matchedRecipientSource: resolution.matchedRecipientSource,
  matchedRecipientType: resolution.matchedRecipientType,
})

const buildConsentSnapshot = (
  rows: Array<{
    consentType: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
    allowed: boolean
  }>,
) =>
  rows.reduce(
    (state, row) => ({
      ...state,
      [row.consentType]: row.allowed,
    }),
    buildWhatsappConsentState(),
  )

const createRecipientResolver = (client: SupabaseClient) => async (
  normalizedMobile: string,
): Promise<RecipientResolution> => {
  const [workerResponse, companyContactResponse, companyMobileResponse] = await Promise.all([
    client.from('labour_workers').select('id').eq('mobile', normalizedMobile).limit(2),
    client
      .from('labour_companies')
      .select('id')
      .eq('contact_mobile', normalizedMobile)
      .limit(2),
    client.from('labour_companies').select('id').eq('mobile', normalizedMobile).limit(2),
  ])

  if (workerResponse.error || companyContactResponse.error || companyMobileResponse.error) {
    throw new Error('Unable to resolve WhatsApp recipient ownership.')
  }

  const workers = (workerResponse.data || [])
    .map((row) => String((row as { id?: string }).id || '').trim())
    .filter(Boolean)
  const companyMatches = new Map<string, 'contact_mobile' | 'mobile'>()

  for (const row of companyMobileResponse.data || []) {
    const id = String((row as { id?: string }).id || '').trim()
    if (id) {
      companyMatches.set(id, 'mobile')
    }
  }

  for (const row of companyContactResponse.data || []) {
    const id = String((row as { id?: string }).id || '').trim()
    if (id) {
      companyMatches.set(id, 'contact_mobile')
    }
  }

  const companyEntries = Array.from(companyMatches.entries()).map(([id, source]) => ({
    id,
    source,
  }))

  if (workers.length === 0 && companyEntries.length === 0) {
    return {
      category: 'unknown_recipient',
      matchedRecipientType: null,
      matchedRecipientId: null,
      matchedRecipientSource: 'none',
    }
  }

  if (workers.length === 1 && companyEntries.length === 0) {
    return {
      category: 'resolved_worker',
      matchedRecipientType: 'worker',
      matchedRecipientId: workers[0],
      matchedRecipientSource: 'direct',
    }
  }

  if (workers.length === 0 && companyEntries.length === 1) {
    return {
      category: 'resolved_company',
      matchedRecipientType: 'company',
      matchedRecipientId: companyEntries[0].id,
      matchedRecipientSource: companyEntries[0].source,
    }
  }

  return {
    category: 'ambiguous_recipient',
    matchedRecipientType: null,
    matchedRecipientId: null,
    matchedRecipientSource: 'none',
  }
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
    inboundEventRepository: createWhatsappInboundEventRepository({
      client: persistence.client,
    }) as InboundEventRepository,
    suppressionRepository: createWhatsappSuppressionRepository({
      client: persistence.client,
    }) as SuppressionRepository,
    consentRepository: createWhatsappConsentRepository({
      client: persistence.client,
    }) as ConsentRepository,
    resolveRecipientOwnership: createRecipientResolver(persistence.client),
  }
}

const processInboundCommandEvent = async ({
  event,
  context,
}: {
  event: WhatsappInboundMessageEvent
  context: Extract<InboundProcessingContext, { available: true }>
}) => {
  const existingEvent = await context.inboundEventRepository.getInboundMessage(event.messageId)
  if (existingEvent && isCompletedInboundEvent(existingEvent.metadata)) {
    return 0
  }

  const normalizedMobile = String(event.normalizedMobile || '').trim()
  if (!normalizedMobile) {
    return 0
  }

  const currentSuppression = await context.suppressionRepository.getActiveSuppression({
    normalizedMobile,
  })
  const recipientResolution = await context.resolveRecipientOwnership(normalizedMobile)
  const eventTimestamp = normalizeIsoTimestamp(event.timestamp)
  const commandType = toCommandType(event.classification.kind)
  const isPendingRetry = Boolean(existingEvent && !isCompletedInboundEvent(existingEvent.metadata))

  const baseMetadata: JsonObject = {
    commandType,
    deduplicationOutcome: 'processed_unique_message',
    maskedMobile: maskWhatsappMobile(normalizedMobile),
    processingState: 'pending',
    receivedAt: eventTimestamp,
    ...toRecipientMetadata(recipientResolution),
  }

  const predictedOutcome =
    event.classification.kind === 'opt_out_all'
      ? currentSuppression
        ? 'suppression_already_active'
        : 'suppression_created'
      : currentSuppression
        ? currentSuppression.restorationRequestedAt || currentSuppression.restorationMessageId
          ? 'restoration_already_requested'
          : 'restoration_requested'
        : 'no_active_suppression'

  const prepared = await context.inboundEventRepository.classifyAndPrepareInboundEvent({
    messageId: event.messageId,
    mobile: normalizedMobile,
    rawText: event.rawText,
    timestamp: eventTimestamp || event.timestamp,
    matchedRecipientType: recipientResolution.matchedRecipientType,
    matchedRecipientId: recipientResolution.matchedRecipientId,
    currentlySuppressed: Boolean(currentSuppression),
    metadata: {
      ...baseMetadata,
      processingOutcome: predictedOutcome,
      restorationRequested: predictedOutcome === 'restoration_requested',
    },
  })

  const persistedEvent = existingEvent
    ? existingEvent
    : (
        await context.inboundEventRepository.recordInboundEvent({
          messageId: prepared.messageId,
          normalizedMobile: prepared.normalizedMobile,
          matchedRecipientType: prepared.matchedRecipientType,
          matchedRecipientId: prepared.matchedRecipientId,
          eventKind: prepared.eventKind,
          rawText: prepared.rawText,
          normalizedText: prepared.normalizedText,
          commandKey: prepared.commandKey,
          suppressionApplied: prepared.suppressionApplied,
          metadata: prepared.metadata,
        })
      ).event

  const recipientConsents =
    recipientResolution.matchedRecipientType && recipientResolution.matchedRecipientId
      ? await context.consentRepository.listRecipientConsents({
          recipientType: recipientResolution.matchedRecipientType,
          recipientId: recipientResolution.matchedRecipientId,
          normalizedMobile,
        })
      : []
  const consentByType = new Map(recipientConsents.map((row) => [row.consentType, row]))

  let suppressionApplied = prepared.suppressionApplied
  let restorationRequested = false

  if (prepared.classification.kind === 'opt_out_all') {
    if (!currentSuppression) {
      await context.suppressionRepository.recordSuppression({
        mobile: normalizedMobile,
        triggerSource: 'inbound_opt_out',
        triggerCommand: prepared.commandKey || prepared.normalizedText || 'stop',
        triggerMessageId: prepared.messageId,
        previousConsentSnapshot:
          recipientResolution.matchedRecipientType && recipientResolution.matchedRecipientId
            ? buildConsentSnapshot(recipientConsents)
            : {},
        metadata: {
          ...toRecipientMetadata(recipientResolution),
          messageId: prepared.messageId,
        },
      })
    }

    if (
      recipientResolution.matchedRecipientType &&
      recipientResolution.matchedRecipientId &&
      (!currentSuppression || isPendingRetry)
    ) {
      for (const consentType of WHATSAPP_CONSENT_TYPES) {
        const currentConsent = consentByType.get(consentType) || null
        if (currentConsent?.allowed === false) {
          continue
        }

        await context.consentRepository.recordConsentDecision({
          recipientType: recipientResolution.matchedRecipientType,
          recipientId: recipientResolution.matchedRecipientId,
          mobile: normalizedMobile,
          consentType,
          allowed: false,
          eventType: 'opted_out',
          source: 'inbound_opt_out',
          consentTextVersion:
            currentConsent?.consentTextVersion || WHATSAPP_CONSENT_TEXT_VERSION,
          eventMessageId: prepared.messageId,
          metadata: {
            ...toRecipientMetadata(recipientResolution),
            messageId: prepared.messageId,
            commandType,
          },
          occurredAt: eventTimestamp || undefined,
        })
      }
    }

    suppressionApplied = true
  } else if (prepared.classification.kind === 'restore_request') {
    const restorationResult = await context.suppressionRepository.recordRestorationRequest({
      mobile: normalizedMobile,
      restorationMessageId: prepared.messageId,
      metadata: {
        ...toRecipientMetadata(recipientResolution),
        messageId: prepared.messageId,
      },
    })

    restorationRequested = restorationResult.updated

    if (
      restorationResult.updated &&
      recipientResolution.matchedRecipientType &&
      recipientResolution.matchedRecipientId
    ) {
      for (const consentRow of recipientConsents) {
        await context.consentRepository.recordConsentEvent({
          recipientType: recipientResolution.matchedRecipientType,
          recipientId: recipientResolution.matchedRecipientId,
          normalizedMobile,
          consentType: consentRow.consentType,
          previousAllowed: consentRow.allowed,
          newAllowed: consentRow.allowed,
          eventType: 'restoration_requested',
          source: 'inbound_restore_request',
          consentTextVersion:
            consentRow.consentTextVersion || WHATSAPP_CONSENT_TEXT_VERSION,
          eventMessageId: prepared.messageId,
          metadata: {
            ...toRecipientMetadata(recipientResolution),
            messageId: prepared.messageId,
            commandType,
          },
          occurredAt: eventTimestamp || undefined,
        })
      }
    }
  }

  await context.inboundEventRepository.updateInboundEvent(persistedEvent.id, {
    suppressionApplied,
    metadata: {
      ...persistedEvent.metadata,
      ...prepared.metadata,
      processingState: 'completed',
      processingOutcome: predictedOutcome,
      restorationRequested,
    },
  })

  return 1
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
  persistStatusEvents: (events: WebhookEvent[]) => Promise<void>
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

    let processedInboundCommands = 0
    if (writeAvailability.enabled && inboundCommands.length > 0) {
      const inboundProcessingContext = await resolveInboundProcessingContext()

      if (inboundProcessingContext.available) {
        for (const inboundCommand of inboundCommands) {
          persistenceAttempted = true
          processedInboundCommands += await processInboundCommandEvent({
            event: inboundCommand,
            context: inboundProcessingContext,
          })
        }
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
