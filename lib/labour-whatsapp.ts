type SendWhatsappTextPayload = {
  to: string
  body: string
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

const getWhatsappConfig = () => {
  const accessToken = (
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN ||
    ''
  ).trim()
  const phoneNumberId = (
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID ||
    ''
  ).trim()
  const graphVersion = (process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0').trim()

  return {
    accessToken,
    phoneNumberId,
    graphVersion
  }
}

export const sendWhatsappTextMessage = async ({ to, body }: SendWhatsappTextPayload) => {
  const { accessToken, phoneNumberId, graphVersion } = getWhatsappConfig()
  const recipient = toInternationalWhatsappNumber(to)
  const trimmedBody = String(body || '').trim()

  if (!recipient || !trimmedBody) {
    return { delivered: false, skipped: true, reason: 'missing-recipient-or-body' as const }
  }

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp send skipped because WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID is not configured.')
    return { delivered: false, skipped: true, reason: 'whatsapp-not-configured' as const }
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

  if (!response.ok) {
    const responseBody = await response.text()
    throw new Error(`WhatsApp send failed (${response.status}): ${responseBody}`)
  }

  return { delivered: true, skipped: false as const }
}
