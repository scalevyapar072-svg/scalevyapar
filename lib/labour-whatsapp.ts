import { resolveWhatsappSendConfig } from './whatsapp/meta-config'

type SendWhatsappTextPayload = {
  to: string
  body: string
}

type SendWhatsappTemplatePayload = {
  to: string
  templateName: string
  languageCode?: string
  bodyParameters?: string[]
}

export const isWhatsappTemplateTranslationMissingError = (error: unknown) =>
  error instanceof Error &&
  error.message.includes('132001') &&
  /template name .* does not exist/i.test(error.message)

type WhatsappAcceptedResponse = {
  messaging_product?: string
  contacts?: Array<{
    input?: string
    wa_id?: string
  }>
  messages?: Array<{
    id?: string
    message_status?: string
  }>
}

const sanitizeWhatsappNumber = (value: string) => value.replace(/[^\d+]/g, '').trim()

const toInternationalWhatsappNumber = (value: string) => {
  const sanitized = sanitizeWhatsappNumber(value)
  if (!sanitized) return ''
  if (sanitized.startsWith('+')) return sanitized.slice(1)
  if (sanitized.startsWith('91') && sanitized.length === 12) return sanitized
  if (sanitized.length === 10) return `91${sanitized}`
  return sanitized
}

const isWhatsappSendingEnabledInCurrentEnvironment = () =>
  String(process.env.VERCEL_ENV || '').trim() === 'production'

const getWhatsappConfig = () => {
  const resolved = resolveWhatsappSendConfig()

  return {
    accessToken: resolved.ok ? resolved.config.accessToken : '',
    phoneNumberId: resolved.ok ? resolved.config.phoneNumberId : '',
    graphVersion: resolved.snapshot.graphApiVersion,
  }
}

export const sendWhatsappTextMessage = async ({ to, body }: SendWhatsappTextPayload) => {
  const { accessToken, phoneNumberId, graphVersion } = getWhatsappConfig()
  const recipient = toInternationalWhatsappNumber(to)
  const trimmedBody = String(body || '').trim()

  if (!recipient || !trimmedBody) {
    return { accepted: false, skipped: true, reason: 'missing-recipient-or-body' as const }
  }

  if (!isWhatsappSendingEnabledInCurrentEnvironment()) {
    console.warn('WhatsApp send skipped because outbound sending is disabled outside production.')
    return {
      accepted: false,
      skipped: true,
      reason: 'whatsapp-disabled-outside-production' as const,
    }
  }

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp send skipped because WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID is not configured.')
    return { accepted: false, skipped: true, reason: 'whatsapp-not-configured' as const }
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: trimmedBody
      }
    })
  })

  const responseBody = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp send failed (${response.status}): ${responseBody}`)
  }

  const parsed = responseBody ? JSON.parse(responseBody) as WhatsappAcceptedResponse : {}
  const firstMessage = parsed.messages?.[0]
  const firstContact = parsed.contacts?.[0]

  return {
    accepted: true,
    skipped: false as const,
    reason: 'accepted' as const,
    messageId: firstMessage?.id || '',
    messageStatus: firstMessage?.message_status || '',
    recipientWaId: firstContact?.wa_id || recipient
  }
}

export const sendWhatsappTemplateMessage = async ({
  to,
  templateName,
  languageCode = 'en',
  bodyParameters = []
}: SendWhatsappTemplatePayload) => {
  const { accessToken, phoneNumberId, graphVersion } = getWhatsappConfig()
  const recipient = toInternationalWhatsappNumber(to)
  const trimmedTemplateName = String(templateName || '').trim()
  const normalizedParameters = bodyParameters
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  if (!recipient || !trimmedTemplateName) {
    return { accepted: false, skipped: true, reason: 'missing-recipient-or-template' as const }
  }

  if (!isWhatsappSendingEnabledInCurrentEnvironment()) {
    console.warn('WhatsApp template send skipped because outbound sending is disabled outside production.')
    return {
      accepted: false,
      skipped: true,
      reason: 'whatsapp-disabled-outside-production' as const,
    }
  }

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp template send skipped because WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID is not configured.')
    return { accepted: false, skipped: true, reason: 'whatsapp-not-configured' as const }
  }

  const components = normalizedParameters.length > 0
    ? [
        {
          type: 'body',
          parameters: normalizedParameters.map(parameter => ({
            type: 'text',
            text: parameter
          }))
        }
      ]
    : undefined

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: trimmedTemplateName,
        language: {
          code: String(languageCode || 'en').trim() || 'en'
        },
        ...(components ? { components } : {})
      }
    })
  })

  const responseBody = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp template send failed (${response.status}): ${responseBody}`)
  }

  const parsed = responseBody ? JSON.parse(responseBody) as WhatsappAcceptedResponse : {}
  const firstMessage = parsed.messages?.[0]
  const firstContact = parsed.contacts?.[0]

  return {
    accepted: true,
    skipped: false as const,
    reason: 'accepted' as const,
    messageId: firstMessage?.id || '',
    messageStatus: firstMessage?.message_status || '',
    recipientWaId: firstContact?.wa_id || recipient
  }
}
