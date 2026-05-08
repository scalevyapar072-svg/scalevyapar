import { supabaseAdmin } from './supabase-admin'

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

const createWebhookAuditId = () =>
  `audit-whatsapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const formatWebhookSummary = (event: WhatsappWebhookStatusEvent) => {
  const errorSummary = event.rawErrors.length > 0
    ? ` | errors=${event.rawErrors
        .map(error => error.message || error.title || error.error_data?.details || `code:${error.code ?? 'unknown'}`)
        .join('; ')}`
    : ''

  return [
    'WhatsApp status',
    `messageId=${event.messageId}`,
    `status=${event.status}`,
    `waId=${event.recipientWaId || 'unknown'}`,
    `phoneNumberId=${event.phoneNumberId || 'unknown'}`,
    `conversationId=${event.conversationId || 'unknown'}`,
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

export const persistWhatsappWebhookStatusEvents = async (events: WhatsappWebhookStatusEvent[]) => {
  if (events.length === 0) return

  const payload = events.map(event => ({
    id: createWebhookAuditId(),
    action: 'update',
    entity_type: 'jobApplications',
    entity_id: event.messageId,
    summary: formatWebhookSummary(event),
    actor: 'WHATSAPP_WEBHOOK',
    created_at: new Date().toISOString()
  }))

  const { error } = await supabaseAdmin.from('labour_audit_logs').insert(payload)
  if (error) {
    throw new Error(`Failed to persist WhatsApp webhook statuses: ${error.message}`)
  }
}
