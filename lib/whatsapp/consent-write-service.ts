import type { JsonObject, WhatsappConsentRow } from './persistence-types'

import {
  maskWhatsappMobile,
  normalizeIndianMobileToE164,
  resolveWhatsappConsentTextVersion,
  WHATSAPP_CONSENT_TEXT_VERSION,
  type WhatsappConsentChoiceMap,
  type WhatsappConsentSource,
  type WhatsappConsentType,
} from './consent'
import { createWhatsappConsentRepository } from './consent-repository'
import {
  getWhatsappPersistenceClient,
  getWhatsappPersistenceWriteAvailability,
} from './persistence-client'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/consent-write-service')

export type WhatsappConsentPreferenceState = Record<WhatsappConsentType, boolean | null>

type ConsentRecipientType = 'worker' | 'company'

type ConsentRecipientInput = {
  recipientType: ConsentRecipientType
  recipientId: string
  mobile: string
}

type ConsentReadResult = {
  available: boolean
  readOnly: boolean
  writeEnabled: boolean
  disabledReason: string | null
  disabledMessage: string | null
  consentTextVersion: string
  state: WhatsappConsentPreferenceState
}

type ConsentWriteResult = ConsentReadResult & {
  persisted: boolean
}

const createUnknownConsentPreferenceState = (): WhatsappConsentPreferenceState => ({
  service_allowed: null,
  matching_alerts_allowed: null,
  marketing_allowed: null,
})

const toSanitizedLogContext = (input: ConsentRecipientInput, source: WhatsappConsentSource) => ({
  recipientType: input.recipientType,
  recipientId: input.recipientId,
  maskedMobile: maskWhatsappMobile(input.mobile),
  source,
})

const resolveEventType = (current: WhatsappConsentRow | null, nextAllowed: boolean) => {
  if (nextAllowed) {
    return current?.optedOutAt ? 'restored' : 'granted'
  }

  return 'denied'
}

const buildStateFromRows = (rows: WhatsappConsentRow[]): WhatsappConsentPreferenceState => {
  const state = createUnknownConsentPreferenceState()

  rows.forEach((row) => {
    state[row.consentType] = row.allowed
  })

  return state
}

const getConsentRows = async (input: ConsentRecipientInput) => {
  const normalizedMobileResult = normalizeIndianMobileToE164(input.mobile)
  if (!normalizedMobileResult.ok) {
    throw new Error('Invalid WhatsApp mobile.')
  }

  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    throw new Error(persistence.message)
  }

  const repository = createWhatsappConsentRepository({
    client: persistence.client,
  })

  const rows = await repository.listRecipientConsents({
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    normalizedMobile: normalizedMobileResult.normalized,
  })

  return {
    repository,
    rows,
  }
}

export const getWhatsappConsentPreferences = async (
  input: ConsentRecipientInput,
): Promise<ConsentReadResult> => {
  const writeAvailability = getWhatsappPersistenceWriteAvailability()
  if (!writeAvailability.enabled) {
    return {
      available: false,
      readOnly: true,
      writeEnabled: false,
      disabledReason: writeAvailability.reason,
      disabledMessage: writeAvailability.message,
      consentTextVersion: WHATSAPP_CONSENT_TEXT_VERSION,
      state: createUnknownConsentPreferenceState(),
    }
  }

  const { rows } = await getConsentRows(input)

  return {
    available: true,
    readOnly: false,
    writeEnabled: true,
    disabledReason: null,
    disabledMessage: null,
    consentTextVersion:
      rows.find((row) => row.consentTextVersion)?.consentTextVersion ||
      WHATSAPP_CONSENT_TEXT_VERSION,
    state: buildStateFromRows(rows),
  }
}

export const persistWhatsappConsentPreferences = async ({
  recipient,
  consents,
  source,
  consentTextVersion,
  metadata = {},
}: {
  recipient: ConsentRecipientInput
  consents: WhatsappConsentChoiceMap
  source: WhatsappConsentSource
  consentTextVersion?: string
  metadata?: JsonObject
}): Promise<ConsentWriteResult> => {
  const writeAvailability = getWhatsappPersistenceWriteAvailability()
  if (!writeAvailability.enabled) {
    return {
      available: false,
      readOnly: true,
      writeEnabled: false,
      disabledReason: writeAvailability.reason,
      disabledMessage: writeAvailability.message,
      consentTextVersion: resolveWhatsappConsentTextVersion(consentTextVersion),
      state: createUnknownConsentPreferenceState(),
      persisted: false,
    }
  }

  const { repository, rows } = await getConsentRows(recipient)
  const textVersion = resolveWhatsappConsentTextVersion(consentTextVersion)
  const currentByType = new Map(rows.map((row) => [row.consentType, row]))

  for (const consentType of Object.keys(consents) as WhatsappConsentType[]) {
    const nextAllowed = consents[consentType]
    if (typeof nextAllowed !== 'boolean') continue

    const current = currentByType.get(consentType) || null
    if (current?.allowed === nextAllowed) {
      continue
    }

    const result = await repository.recordConsentDecision({
      recipientType: recipient.recipientType,
      recipientId: recipient.recipientId,
      mobile: recipient.mobile,
      consentType,
      allowed: nextAllowed,
      eventType: resolveEventType(current, nextAllowed),
      source,
      consentTextVersion: textVersion,
      metadata,
    })

    currentByType.set(consentType, result.currentConsent)
  }

  return {
    available: true,
    readOnly: false,
    writeEnabled: true,
    disabledReason: null,
    disabledMessage: null,
    consentTextVersion: textVersion,
    state: buildStateFromRows(Array.from(currentByType.values())),
    persisted: true,
  }
}

export const logWhatsappConsentWriteFailure = ({
  error,
  recipient,
  source,
  logger = console,
}: {
  error: unknown
  recipient: ConsentRecipientInput
  source: WhatsappConsentSource
  logger?: Pick<typeof console, 'error'>
}) => {
  logger.error('WhatsApp consent persistence failed', {
    ...(error instanceof Error ? { error: error.message } : { error: 'Unknown error' }),
    ...toSanitizedLogContext(recipient, source),
  })
}
