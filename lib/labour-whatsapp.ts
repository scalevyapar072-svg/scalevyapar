import { resolveWhatsappSendConfig } from './whatsapp/meta-config'
import { getWhatsappPersistenceClient } from './whatsapp/persistence-client'
import { assertWhatsappServerOnly } from './whatsapp/server-runtime'
import { createWhatsappSettingsRepository } from './whatsapp/settings-repository'

assertWhatsappServerOnly('lib/labour-whatsapp')

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

type WhatsappSendBlockedReason =
  | 'missing-recipient-or-body'
  | 'missing-recipient-or-template'
  | 'whatsapp-disabled-outside-production'
  | 'whatsapp-not-configured'
  | 'whatsapp-paused'
  | 'whatsapp-pause-setting-missing'
  | 'whatsapp-pause-setting-invalid'
  | 'whatsapp-pause-setting-unavailable'

type WhatsappSendSkippedResult = {
  accepted: false
  skipped: true
  reason: WhatsappSendBlockedReason
  messageId?: string
  messageStatus?: string
  recipientWaId?: string
}

type WhatsappSendAcceptedResult = {
  accepted: true
  skipped: false
  reason: 'accepted'
  messageId: string
  messageStatus: string
  recipientWaId: string
}

export type WhatsappSendResult = WhatsappSendSkippedResult | WhatsappSendAcceptedResult

type WhatsappSendDependencies = {
  env: NodeJS.ProcessEnv
  fetchImplementation: typeof fetch
  getPersistenceClient: typeof getWhatsappPersistenceClient
  createSettingsRepository: typeof createWhatsappSettingsRepository
  resolveSendConfig: typeof resolveWhatsappSendConfig
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

const getDefaultWhatsappSendDependencies = (): WhatsappSendDependencies => ({
  env: process.env,
  fetchImplementation: globalThis.fetch,
  getPersistenceClient: getWhatsappPersistenceClient,
  createSettingsRepository: createWhatsappSettingsRepository,
  resolveSendConfig: resolveWhatsappSendConfig,
})

const buildBlockedResult = (reason: WhatsappSendBlockedReason): WhatsappSendSkippedResult => ({
  accepted: false,
  skipped: true,
  reason,
})

const logBlockedWhatsappSend = (reason: WhatsappSendBlockedReason) => {
  switch (reason) {
    case 'whatsapp-disabled-outside-production':
      console.warn('WhatsApp send skipped because outbound sending is disabled outside production.')
      return
    case 'whatsapp-not-configured':
      console.warn(
        'WhatsApp send skipped because canonical Meta sender configuration is unavailable.',
      )
      return
    case 'whatsapp-paused':
    case 'whatsapp-pause-setting-missing':
    case 'whatsapp-pause-setting-invalid':
    case 'whatsapp-pause-setting-unavailable':
      console.warn(
        'WhatsApp send skipped because the universal safety gate is blocking outbound sending.',
        { reason },
      )
      return
    default:
      return
  }
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

const resolvePauseBlockedReason = (
  reason: 'missing' | 'invalid' | 'query_error' | 'explicit_true' | 'explicit_false',
): WhatsappSendBlockedReason | null => {
  switch (reason) {
    case 'missing':
      return 'whatsapp-pause-setting-missing'
    case 'invalid':
      return 'whatsapp-pause-setting-invalid'
    case 'query_error':
      return 'whatsapp-pause-setting-unavailable'
    case 'explicit_true':
      return 'whatsapp-paused'
    case 'explicit_false':
      return null
  }
}

const resolveWhatsappSendAuthorization = async (
  dependencies: WhatsappSendDependencies,
): Promise<
  | {
      allowed: true
      config: {
        accessToken: string
        phoneNumberId: string
        graphVersion: string
      }
    }
  | {
      allowed: false
      result: WhatsappSendSkippedResult
    }
> => {
  if (String(dependencies.env.VERCEL_ENV || '').trim().toLowerCase() !== 'production') {
    return {
      allowed: false,
      result: buildBlockedResult('whatsapp-disabled-outside-production'),
    }
  }

  const persistence = dependencies.getPersistenceClient()
  if (!persistence.available) {
    return {
      allowed: false,
      result: buildBlockedResult('whatsapp-pause-setting-unavailable'),
    }
  }

  const repository = dependencies.createSettingsRepository({
    client: persistence.client,
  })
  const pauseStatus = await repository.isAllSendingPaused()
  const pauseBlockedReason = resolvePauseBlockedReason(pauseStatus.reason)
  if (pauseStatus.paused && pauseBlockedReason) {
    return {
      allowed: false,
      result: buildBlockedResult(pauseBlockedReason),
    }
  }

  const resolved = dependencies.resolveSendConfig(dependencies.env)
  if (!resolved.ok) {
    return {
      allowed: false,
      result: buildBlockedResult('whatsapp-not-configured'),
    }
  }

  return {
    allowed: true,
    config: {
      accessToken: resolved.config.accessToken,
      phoneNumberId: resolved.config.phoneNumberId,
      graphVersion: resolved.config.graphApiVersion,
    },
  }
}

export const sendWhatsappTextMessage = async (
  { to, body }: SendWhatsappTextPayload,
  dependencies: WhatsappSendDependencies = getDefaultWhatsappSendDependencies(),
): Promise<WhatsappSendResult> => {
  const recipient = toInternationalWhatsappNumber(to)
  const trimmedBody = String(body || '').trim()

  if (!recipient || !trimmedBody) {
    return buildBlockedResult('missing-recipient-or-body')
  }

  const authorization = await resolveWhatsappSendAuthorization(dependencies)
  if (!authorization.allowed) {
    logBlockedWhatsappSend(authorization.result.reason)
    return authorization.result
  }

  const { accessToken, phoneNumberId, graphVersion } = authorization.config
  const response = await dependencies.fetchImplementation(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: trimmedBody,
        },
      }),
    },
  )

  const responseBody = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp send failed (${response.status}): ${responseBody}`)
  }

  const parsed = responseBody ? JSON.parse(responseBody) as WhatsappAcceptedResponse : {}
  const firstMessage = parsed.messages?.[0]
  const firstContact = parsed.contacts?.[0]

  return {
    accepted: true,
    skipped: false,
    reason: 'accepted',
    messageId: firstMessage?.id || '',
    messageStatus: firstMessage?.message_status || '',
    recipientWaId: firstContact?.wa_id || recipient,
  }
}

export const sendWhatsappTemplateMessage = async ({
  to,
  templateName,
  languageCode = 'en',
  bodyParameters = [],
}: SendWhatsappTemplatePayload,
dependencies: WhatsappSendDependencies = getDefaultWhatsappSendDependencies(),
): Promise<WhatsappSendResult> => {
  const recipient = toInternationalWhatsappNumber(to)
  const trimmedTemplateName = String(templateName || '').trim()
  const normalizedParameters = bodyParameters
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  if (!recipient || !trimmedTemplateName) {
    return buildBlockedResult('missing-recipient-or-template')
  }

  const authorization = await resolveWhatsappSendAuthorization(dependencies)
  if (!authorization.allowed) {
    logBlockedWhatsappSend(authorization.result.reason)
    return authorization.result
  }

  const { accessToken, phoneNumberId, graphVersion } = authorization.config
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

  const response = await dependencies.fetchImplementation(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: trimmedTemplateName,
          language: {
            code: String(languageCode || 'en').trim() || 'en',
          },
          ...(components ? { components } : {}),
        },
      }),
    },
  )

  const responseBody = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp template send failed (${response.status}): ${responseBody}`)
  }

  const parsed = responseBody ? JSON.parse(responseBody) as WhatsappAcceptedResponse : {}
  const firstMessage = parsed.messages?.[0]
  const firstContact = parsed.contacts?.[0]

  return {
    accepted: true,
    skipped: false,
    reason: 'accepted',
    messageId: firstMessage?.id || '',
    messageStatus: firstMessage?.message_status || '',
    recipientWaId: firstContact?.wa_id || recipient,
  }
}
