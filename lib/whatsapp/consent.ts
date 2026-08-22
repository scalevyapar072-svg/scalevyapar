export const WHATSAPP_CONSENT_TYPES = [
  'service_allowed',
  'matching_alerts_allowed',
  'marketing_allowed',
] as const

export const WHATSAPP_RECIPIENT_TYPES = ['worker', 'company', 'external_test'] as const

export type WhatsappConsentType = (typeof WHATSAPP_CONSENT_TYPES)[number]
export type WhatsappRecipientType = (typeof WHATSAPP_RECIPIENT_TYPES)[number]
export type WhatsappNotificationPurpose = 'service' | 'matching' | 'marketing'
export type WhatsappConsentSource =
  | 'worker_registration'
  | 'worker_settings'
  | 'company_registration'
  | 'company_settings'
  | 'inbound_opt_out'
  | 'inbound_restore_request'
  | 'manual_test'

export type WhatsappConsentState = Record<WhatsappConsentType, boolean>

export type IndianMobileNormalizationFailureReason =
  | 'missing'
  | 'invalid_country_code'
  | 'invalid_length'
  | 'invalid_mobile_range'

export type IndianMobileNormalizationResult =
  | {
      ok: true
      normalized: string
      nationalNumber: string
    }
  | {
      ok: false
      reason: IndianMobileNormalizationFailureReason
    }

export const createEmptyWhatsappConsentState = (): WhatsappConsentState => ({
  service_allowed: false,
  matching_alerts_allowed: false,
  marketing_allowed: false,
})

export const buildWhatsappConsentState = (
  partial: Partial<WhatsappConsentState> = {},
): WhatsappConsentState => ({
  ...createEmptyWhatsappConsentState(),
  ...partial,
})

const normalizeDigits = (value: unknown) => String(value || '').replace(/\D/g, '')

const looksLikeIndianMobile = (nationalNumber: string) => /^[6-9]\d{9}$/.test(nationalNumber)

export const normalizeIndianMobileToE164 = (value: unknown): IndianMobileNormalizationResult => {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    return { ok: false, reason: 'missing' }
  }

  const digits = normalizeDigits(trimmed)
  if (!digits) {
    return { ok: false, reason: 'missing' }
  }

  let nationalNumber = ''

  if (digits.length === 10) {
    nationalNumber = digits
  } else if (digits.length === 11 && digits.startsWith('0')) {
    nationalNumber = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith('91')) {
    nationalNumber = digits.slice(2)
  } else if (digits.length === 13 && trimmed.startsWith('+') && digits.startsWith('91')) {
    nationalNumber = digits.slice(2)
  } else if (digits.length > 0 && !digits.startsWith('91') && digits.length !== 10 && digits.length !== 11) {
    return { ok: false, reason: 'invalid_length' }
  } else {
    return { ok: false, reason: digits.startsWith('91') ? 'invalid_length' : 'invalid_country_code' }
  }

  if (!looksLikeIndianMobile(nationalNumber)) {
    return { ok: false, reason: 'invalid_mobile_range' }
  }

  return {
    ok: true,
    normalized: `+91${nationalNumber}`,
    nationalNumber,
  }
}

export const maskWhatsappMobile = (value: unknown) => {
  const normalized = normalizeIndianMobileToE164(value)
  if (!normalized.ok) return ''

  const national = normalized.nationalNumber
  return `+91${'*'.repeat(6)}${national.slice(-4)}`
}

export const getRequiredWhatsappConsentTypes = ({
  notificationPurpose,
  templateCategory,
}: {
  notificationPurpose: WhatsappNotificationPurpose
  templateCategory: string
}): WhatsappConsentType[] => {
  const normalizedCategory = String(templateCategory || '').trim().toUpperCase()

  if (notificationPurpose === 'service') {
    return ['service_allowed']
  }

  if (notificationPurpose === 'marketing') {
    return ['marketing_allowed']
  }

  if (normalizedCategory === 'MARKETING') {
    return ['matching_alerts_allowed', 'marketing_allowed']
  }

  return ['matching_alerts_allowed']
}

export const getMissingWhatsappConsentTypes = ({
  consentState,
  requiredConsentTypes,
}: {
  consentState: WhatsappConsentState
  requiredConsentTypes: readonly WhatsappConsentType[]
}) =>
  requiredConsentTypes.filter((consentType) => !consentState[consentType])

export const WHATSAPP_CONSENT_TYPE_DESCRIPTORS: Array<{
  type: WhatsappConsentType
  label: string
  description: string
}> = [
  {
    type: 'service_allowed',
    label: 'Service messages',
    description:
      'Covers operational account/service messages that are allowed by policy and product flow.',
  },
  {
    type: 'matching_alerts_allowed',
    label: 'Matching alerts',
    description:
      'Covers Worker or Company matching alerts when the recipient has explicitly allowed matching notifications.',
  },
  {
    type: 'marketing_allowed',
    label: 'Marketing messages',
    description:
      'Covers any template that Meta classifies as Marketing. This consent remains fully separate.',
  },
]

export const WHATSAPP_CONSENT_COLLECTION_POINTS = {
  worker: [
    'Registration flow for explicit service consent',
    'Profile or settings flow for updating service and marketing consent',
    'Dedicated matching-alert preference flow for matching_alerts_allowed',
  ],
  company: [
    'Registration flow for explicit service consent on the business contact mobile',
    'Dashboard or settings flow for updating service and marketing consent',
    'Dedicated matching-worker alert preference flow for matching_alerts_allowed',
  ],
} as const
