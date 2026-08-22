import {
  maskWhatsappMobile,
  normalizeIndianMobileToE164,
} from './consent'
import {
  classifyWhatsappOptOutCommand,
  normalizeWhatsappCommandText,
  type WhatsappOptOutClassification,
} from './opt-out'

type WhatsappInboundPayload = {
  object?: string
  entry?: Array<{
    changes?: Array<{
      field?: string
      value?: {
        contacts?: Array<{
          wa_id?: string
          profile?: {
            name?: string
          }
        }>
        messages?: Array<{
          id?: string
          from?: string
          timestamp?: string
          type?: string
          text?: {
            body?: string
          }
        }>
      }
    }>
  }>
}

export type WhatsappInboundMessageEvent = {
  messageId: string
  normalizedMobile: string
  maskedMobile: string
  rawText: string
  normalizedText: string
  timestamp: string
  classification: WhatsappOptOutClassification
}

export const extractWhatsappInboundMessageEvents = (
  payload: WhatsappInboundPayload,
  options: { currentlySuppressed?: boolean } = {},
): WhatsappInboundMessageEvent[] => {
  const events: WhatsappInboundMessageEvent[] = []

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue

      for (const message of change.value?.messages || []) {
        const rawText = String(message.text?.body || '').trim()
        if (!message.id || !rawText) continue

        const normalizedMobileResult = normalizeIndianMobileToE164(message.from || '')
        const normalizedMobile = normalizedMobileResult.ok
          ? normalizedMobileResult.normalized
          : ''

        events.push({
          messageId: message.id,
          normalizedMobile,
          maskedMobile: maskWhatsappMobile(normalizedMobile || message.from || ''),
          rawText,
          normalizedText: normalizeWhatsappCommandText(rawText),
          timestamp: String(message.timestamp || '').trim(),
          classification: classifyWhatsappOptOutCommand({
            text: rawText,
            currentlySuppressed: options.currentlySuppressed ?? false,
          }),
        })
      }
    }
  }

  return events
}
