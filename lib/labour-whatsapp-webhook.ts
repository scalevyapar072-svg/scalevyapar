import { createHash } from 'node:crypto'

import {
  getWhatsappPersistenceClient,
  getWhatsappPersistenceWriteAvailability,
  type WhatsappPersistenceWriteAvailability,
} from './whatsapp/persistence-client'

type WhatsappWebhookStatusError = {
  code?: number
  title?: string
  message?: string
  error_data?: {
    details?: string
  }
}

export type WhatsappWebhookStatusEvent = {
  messageId: string
  status: string
  recipientWaId: string
  timestamp: string
  phoneNumberId: string
  displayPhoneNumber: string
  conversationId: string
  conversationOrigin: string
  pricingCategory: string
  pricingBillable: boolean | null
  rawErrors: WhatsappWebhookStatusError[]
}

type WhatsappWebhookPayload = {
  object?: string
  entry?: Array<{
    changes?: Array<{
      field?: string
      value?: {
        metadata?: {
          display_phone_number?: string
          phone_number_id?: string
        }
        statuses?: Array<{
          id?: string
          status?: string
          timestamp?: string
          recipient_id?: string
          conversation?: {
            id?: string
            origin?: {
              type?: string
            }
          }
          pricing?: {
            pricing_model?: string
            billable?: boolean
            category?: string
          }
          errors?: WhatsappWebhookStatusError[]
        }>
      }
    }>
  }>
}

type WhatsappStatusRpcRow = {
  inserted?: boolean
  duplicate?: boolean
}

export type WhatsappStatusRpcClient = {
  rpc: (
    functionName: string,
    parameters: Record<string, unknown>,
  ) => {
    single: () => Promise<{
      data: WhatsappStatusRpcRow | null
      error: unknown
    }>
  }
}

export const createWhatsappWebhookStatusEventKey = (event: WhatsappWebhookStatusEvent) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        'whatsapp-status-v1',
        event.messageId,
        event.status,
        event.timestamp,
        event.recipientWaId,
        event.phoneNumberId,
      ]),
      'utf8',
    )
    .digest('hex')

const formatWebhookSummary = (event: WhatsappWebhookStatusEvent) => {
  const errorSummary = event.rawErrors.length > 0
    ? ` | errorCodes=${event.rawErrors
        .map((error) => String(error.code ?? 'unknown'))
        .join(',')}`
    : ''

  return [
    'WhatsApp status',
    `status=${event.status}`,
    `origin=${event.conversationOrigin || 'unknown'}`,
    `pricingCategory=${event.pricingCategory || 'unknown'}`,
    `billable=${event.pricingBillable === null ? 'unknown' : String(event.pricingBillable)}${errorSummary}`
  ].join(' | ')
}

export const extractWhatsappWebhookStatusEvents = (payload: WhatsappWebhookPayload): WhatsappWebhookStatusEvent[] => {
  const events: WhatsappWebhookStatusEvent[] = []

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue

      const metadata = change.value?.metadata
      for (const status of change.value?.statuses || []) {
        if (!status.id || !status.status) continue

        events.push({
          messageId: status.id,
          status: status.status,
          recipientWaId: status.recipient_id || '',
          timestamp: status.timestamp || '',
          phoneNumberId: metadata?.phone_number_id || '',
          displayPhoneNumber: metadata?.display_phone_number || '',
          conversationId: status.conversation?.id || '',
          conversationOrigin: status.conversation?.origin?.type || '',
          pricingCategory: status.pricing?.category || '',
          pricingBillable: typeof status.pricing?.billable === 'boolean' ? status.pricing.billable : null,
          rawErrors: status.errors || []
        })
      }
    }
  }

  return events
}

export const persistWhatsappWebhookStatusEvents = async (
  events: WhatsappWebhookStatusEvent[],
  options: {
    resolveWriteAvailability?: () => WhatsappPersistenceWriteAvailability
    resolvePersistenceClient?: typeof getWhatsappPersistenceClient
  } = {},
) => {
  if (events.length === 0) return { inserted: 0, duplicates: 0 }

  const resolveWriteAvailability =
    options.resolveWriteAvailability || getWhatsappPersistenceWriteAvailability
  const writeAvailability = resolveWriteAvailability()
  if (!writeAvailability.enabled) {
    if (writeAvailability.reason === 'missing_configuration') {
      throw new Error('WhatsApp status persistence is unavailable.')
    }

    return { inserted: 0, duplicates: 0 }
  }

  const persistence = (options.resolvePersistenceClient || getWhatsappPersistenceClient)()
  if (!persistence.available) {
    throw new Error('WhatsApp status persistence is unavailable.')
  }

  const client = persistence.client as unknown as WhatsappStatusRpcClient
  const uniqueEvents = new Map<string, WhatsappWebhookStatusEvent>()
  for (const event of events) {
    uniqueEvents.set(createWhatsappWebhookStatusEventKey(event), event)
  }

  let inserted = 0
  let duplicates = events.length - uniqueEvents.size

  for (const [eventKey, event] of uniqueEvents) {
    const { data, error } = await client
      .rpc('record_labour_whatsapp_status_event', {
        p_event_key: eventKey,
        p_message_id: event.messageId,
        p_status: event.status,
        p_summary: formatWebhookSummary(event),
        p_recorded_at: null,
      })
      .single()

    if (
      error ||
      !data ||
      typeof data.inserted !== 'boolean' ||
      typeof data.duplicate !== 'boolean'
    ) {
      throw new Error('Unable to persist WhatsApp status event idempotently.')
    }

    inserted += data.inserted ? 1 : 0
    duplicates += data.duplicate ? 1 : 0
  }

  return { inserted, duplicates }
}
