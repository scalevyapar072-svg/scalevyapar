import { createHmac } from 'node:crypto'

import type { WhatsappMetaHealthConfig } from './meta-config.ts'
import { assertWhatsappServerOnly } from './server-runtime.ts'

assertWhatsappServerOnly('lib/whatsapp/meta-client')

type MetaPhoneNumbersResponse = {
  data?: Array<{
    id?: string
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
    name_status?: string
  }>
}

export type WhatsappMetaPhoneNumberRecord = {
  id: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string
  nameStatus: string
}

export class WhatsappMetaReadOnlyClientError extends Error {
  statusCode: number
  requestPath: string

  constructor(message: string, statusCode: number, requestPath: string) {
    super(message)
    this.name = 'WhatsappMetaReadOnlyClientError'
    this.statusCode = statusCode
    this.requestPath = requestPath
  }
}

const normalizeText = (value: unknown) => String(value || '').trim()

const buildAppSecretProof = (accessToken: string, appSecret: string) =>
  createHmac('sha256', appSecret).update(accessToken).digest('hex')

const PHONE_NUMBERS_FIELDS = [
  'id',
  'display_phone_number',
  'verified_name',
  'quality_rating',
  'name_status',
].join(',')

export const createWhatsappMetaReadOnlyClient = (
  config: WhatsappMetaHealthConfig,
  fetchImplementation: typeof fetch = fetch,
) => {
  const requestPath = `/${config.businessAccountId}/phone_numbers`

  return {
    requestPath,
    async getBusinessPhoneNumbers() {
      const url = new URL(
        `https://graph.facebook.com/${config.graphApiVersion}/${config.businessAccountId}/phone_numbers`,
      )
      url.searchParams.set('fields', PHONE_NUMBERS_FIELDS)
      url.searchParams.set(
        'appsecret_proof',
        buildAppSecretProof(config.accessToken, config.appSecret),
      )

      const response = await fetchImplementation(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      })

      const responseBody = await response.text()
      if (!response.ok) {
        throw new WhatsappMetaReadOnlyClientError(
          `Meta read-only request failed with status ${response.status}.`,
          response.status,
          requestPath,
        )
      }

      const parsed = responseBody
        ? (JSON.parse(responseBody) as MetaPhoneNumbersResponse)
        : {}

      const phoneNumbers = (parsed.data || []).map((entry) => ({
        id: normalizeText(entry.id),
        displayPhoneNumber: normalizeText(entry.display_phone_number),
        verifiedName: normalizeText(entry.verified_name),
        qualityRating: normalizeText(entry.quality_rating),
        nameStatus: normalizeText(entry.name_status),
      }))

      return {
        requestPath,
        phoneNumbers,
      }
    },
  }
}
