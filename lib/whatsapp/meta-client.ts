import { createHmac } from 'node:crypto'

import type { WhatsappMetaHealthConfig } from './meta-config'
import { assertWhatsappServerOnly } from './server-runtime'
import {
  parseWhatsappTemplateContractFromMetaComponents,
  type WhatsappTemplateButtonContract,
  type WhatsappTemplateHeaderType,
} from './template-inventory'

assertWhatsappServerOnly('lib/whatsapp/meta-client')

export const DEFAULT_WHATSAPP_META_TIMEOUT_MS = 8000

type MetaPhoneNumberResponse = {
  id?: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
  name_status?: string
  code_verification_status?: string
}

type MetaWabaResponse = {
  id?: string
  name?: string
}

type MetaMessageTemplatesResponse = {
  data?: Array<{
    name?: string
    language?: string
    category?: string
    status?: string
    components?: unknown[]
  }>
}

type MetaDebugTokenResponse = {
  data?: {
    app_id?: string | number
    is_valid?: boolean
    scopes?: string[]
    type?: string
  }
}

export type WhatsappMetaPhoneNumberRecord = {
  id: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string
  nameStatus: string
  registrationStatus: string
}

export type WhatsappMetaWabaRecord = {
  id: string
  name: string
}

export type WhatsappMetaTemplateRecord = {
  name: string
  language: string
  category: string
  status: string
  headerType: WhatsappTemplateHeaderType
  bodyVariableCount: number
  footerText: string
  buttons: WhatsappTemplateButtonContract[]
  validationErrors: string[]
}

export type WhatsappMetaTokenHealth = {
  state: 'valid' | 'invalid'
  appId: string
  scopes: string[]
  tokenType: string
}

export type WhatsappMetaReadOnlyClientErrorCode =
  | 'timeout'
  | 'http-error'
  | 'network-error'
  | 'invalid-json'

export class WhatsappMetaReadOnlyClientError extends Error {
  code: WhatsappMetaReadOnlyClientErrorCode
  statusCode: number | null
  requestPath: string

  constructor(
    message: string,
    code: WhatsappMetaReadOnlyClientErrorCode,
    statusCode: number | null,
    requestPath: string,
  ) {
    super(message)
    this.name = 'WhatsappMetaReadOnlyClientError'
    this.code = code
    this.statusCode = statusCode
    this.requestPath = requestPath
  }
}

const normalizeText = (value: unknown) => String(value || '').trim()

const buildAppSecretProof = (accessToken: string, appSecret: string) =>
  createHmac('sha256', appSecret).update(accessToken).digest('hex')

const buildAppAccessToken = (appId: string, appSecret: string) => `${appId}|${appSecret}`

const PHONE_NUMBER_FIELDS = [
  'id',
  'display_phone_number',
  'verified_name',
  'quality_rating',
  'name_status',
  'code_verification_status',
].join(',')

const WABA_FIELDS = ['id', 'name'].join(',')
const TEMPLATE_FIELDS = ['name', 'language', 'category', 'status', 'components'].join(',')

const buildMetaUrl = (graphApiVersion: string, requestPath: string) =>
  new URL(`https://graph.facebook.com/${graphApiVersion}${requestPath}`)

export const sanitizeMetaReadOnlyError = (error: unknown) => {
  if (error instanceof WhatsappMetaReadOnlyClientError) {
    return error.message
  }

  return 'Meta read-only request failed unexpectedly.'
}

export const createWhatsappMetaReadOnlyClient = (
  config: WhatsappMetaHealthConfig,
  fetchImplementation: typeof fetch = fetch,
  timeoutMs = DEFAULT_WHATSAPP_META_TIMEOUT_MS,
) => {
  const executeReadOnlyRequest = async <T>({
    requestPath,
    query,
    headers = {},
  }: {
    requestPath: string
    query?: Record<string, string>
    headers?: Record<string, string>
  }): Promise<T> => {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => {
      controller.abort()
    }, timeoutMs)

    try {
      const url = buildMetaUrl(config.graphApiVersion, requestPath)
      Object.entries(query || {}).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      const response = await fetchImplementation(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      const responseBody = await response.text()
      if (!response.ok) {
        throw new WhatsappMetaReadOnlyClientError(
          `Meta read-only request failed with status ${response.status}.`,
          'http-error',
          response.status,
          requestPath,
        )
      }

      if (!responseBody) {
        return {} as T
      }

      try {
        return JSON.parse(responseBody) as T
      } catch {
        throw new WhatsappMetaReadOnlyClientError(
          'Meta read-only response was not valid JSON.',
          'invalid-json',
          response.status,
          requestPath,
        )
      }
    } catch (error) {
      if (error instanceof WhatsappMetaReadOnlyClientError) {
        throw error
      }

      if (controller.signal.aborted) {
        throw new WhatsappMetaReadOnlyClientError(
          `Meta read-only request timed out after ${timeoutMs}ms.`,
          'timeout',
          null,
          requestPath,
        )
      }

      throw new WhatsappMetaReadOnlyClientError(
        'Meta read-only request failed before Meta responded.',
        'network-error',
        null,
        requestPath,
      )
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  return {
    timeoutMs,
    async getPhoneNumberMetadata(): Promise<{
      requestPath: string
      phoneNumber: WhatsappMetaPhoneNumberRecord
    }> {
      const requestPath = `/${config.phoneNumberId}`
      const parsed = await executeReadOnlyRequest<MetaPhoneNumberResponse>({
        requestPath,
        query: {
          fields: PHONE_NUMBER_FIELDS,
          appsecret_proof: buildAppSecretProof(config.accessToken, config.appSecret),
        },
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      })

      return {
        requestPath,
        phoneNumber: {
          id: normalizeText(parsed.id),
          displayPhoneNumber: normalizeText(parsed.display_phone_number),
          verifiedName: normalizeText(parsed.verified_name),
          qualityRating: normalizeText(parsed.quality_rating),
          nameStatus: normalizeText(parsed.name_status),
          registrationStatus: normalizeText(parsed.code_verification_status),
        },
      }
    },
    async getWabaMetadata(): Promise<{
      requestPath: string
      waba: WhatsappMetaWabaRecord
    }> {
      const requestPath = `/${config.businessAccountId}`
      const parsed = await executeReadOnlyRequest<MetaWabaResponse>({
        requestPath,
        query: {
          fields: WABA_FIELDS,
          appsecret_proof: buildAppSecretProof(config.accessToken, config.appSecret),
        },
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      })

      return {
        requestPath,
        waba: {
          id: normalizeText(parsed.id),
          name: normalizeText(parsed.name),
        },
      }
    },
    async getTemplateInventory(): Promise<{
      requestPath: string
      templates: WhatsappMetaTemplateRecord[]
    }> {
      const requestPath = `/${config.businessAccountId}/message_templates`
      const parsed = await executeReadOnlyRequest<MetaMessageTemplatesResponse>({
        requestPath,
        query: {
          fields: TEMPLATE_FIELDS,
          limit: '200',
          appsecret_proof: buildAppSecretProof(config.accessToken, config.appSecret),
        },
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      })

      return {
        requestPath,
        templates: (parsed.data || []).map((template) => {
          const contract = parseWhatsappTemplateContractFromMetaComponents(
            template.components || [],
          )

          return {
            name: normalizeText(template.name),
            language: normalizeText(template.language),
            category: normalizeText(template.category),
            status: normalizeText(template.status),
            headerType: contract.headerType,
            bodyVariableCount: contract.bodyVariableCount,
            footerText: contract.footerText,
            buttons: contract.buttons,
            validationErrors: contract.validationErrors,
          }
        }),
      }
    },
    async getTokenHealth(): Promise<{
      requestPath: string
      tokenHealth: WhatsappMetaTokenHealth
    }> {
      const requestPath = '/debug_token'
      const parsed = await executeReadOnlyRequest<MetaDebugTokenResponse>({
        requestPath,
        query: {
          input_token: config.accessToken,
          access_token: buildAppAccessToken(config.appId, config.appSecret),
        },
      })

      return {
        requestPath,
        tokenHealth: {
          state: parsed.data?.is_valid === false ? 'invalid' : 'valid',
          appId: normalizeText(parsed.data?.app_id),
          scopes: Array.isArray(parsed.data?.scopes)
            ? parsed.data.scopes.map((scope) => normalizeText(scope)).filter(Boolean)
            : [],
          tokenType: normalizeText(parsed.data?.type),
        },
      }
    },
    async getReadinessSnapshot() {
      const tokenHealthResult = await this.getTokenHealth()
      if (tokenHealthResult.tokenHealth.state !== 'valid') {
        return {
          tokenHealthResult,
          phoneMetadataResult: null,
          wabaMetadataResult: null,
          templateInventoryResult: null,
        }
      }

      const [phoneMetadataResult, wabaMetadataResult, templateInventoryResult] =
        await Promise.all([
          this.getPhoneNumberMetadata(),
          this.getWabaMetadata(),
          this.getTemplateInventory(),
        ])

      return {
        tokenHealthResult,
        phoneMetadataResult,
        wabaMetadataResult,
        templateInventoryResult,
      }
    },
  }
}
