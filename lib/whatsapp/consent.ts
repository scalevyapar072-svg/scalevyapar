export const WHATSAPP_CONSENT_TYPES = [
  'service_allowed',
  'matching_alerts_allowed',
  'marketing_allowed',
] as const

export const WHATSAPP_RECIPIENT_TYPES = ['worker', 'company', 'external_test'] as const
export const WHATSAPP_CONSENT_TEXT_VERSION = 'rozgar_whatsapp_consent_v1_20260822'

export type WhatsappConsentType = (typeof WHATSAPP_CONSENT_TYPES)[number]
export type WhatsappRecipientType = (typeof WHATSAPP_RECIPIENT_TYPES)[number]
export type WhatsappNotificationPurpose = 'service' | 'matching' | 'marketing'
export type WhatsappConsentLanguage = 'en' | 'hi'
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

export type WhatsappConsentChoiceMap = Partial<Record<WhatsappConsentType, boolean>>

export type WorkerRegistrationWhatsappConsentInput = Pick<
  Record<WhatsappConsentType, boolean>,
  'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
>

export type CompanyRegistrationWhatsappConsentInput = Pick<
  Record<WhatsappConsentType, boolean>,
  'service_allowed' | 'matching_alerts_allowed'
>

export type CompanySettingsWhatsappConsentInput = Record<WhatsappConsentType, boolean>

export type WhatsappConsentCopyItem = {
  type: WhatsappConsentType
  label: string
  description: string
}

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

const parseConsentBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true') return true
  if (value === 'false') return false
  return false
}

const consentCopyByLanguage: Record<WhatsappConsentLanguage, Record<WhatsappConsentType, WhatsappConsentCopyItem>> = {
  en: {
    service_allowed: {
      type: 'service_allowed',
      label: 'Essential WhatsApp updates',
      description:
        'I want to receive essential WhatsApp updates about my ScaleVyapar Worker account, verification, applications, and support.',
    },
    matching_alerts_allowed: {
      type: 'matching_alerts_allowed',
      label: 'WhatsApp matching alerts',
      description:
        'I want to receive WhatsApp job matching alerts for relevant work opportunities.',
    },
    marketing_allowed: {
      type: 'marketing_allowed',
      label: 'Promotional WhatsApp messages',
      description:
        'I want to receive separate promotional or campaign messages on WhatsApp.',
    },
  },
  hi: {
    service_allowed: {
      type: 'service_allowed',
      label: 'जरूरी WhatsApp updates',
      description:
        'मैं अपने ScaleVyapar Worker खाते, verification, applications और support से जुड़ी जरूरी WhatsApp updates पाना चाहता/चाहती हूँ.',
    },
    matching_alerts_allowed: {
      type: 'matching_alerts_allowed',
      label: 'WhatsApp matching alerts',
      description:
        'मैं मेरे लिए उपयुक्त काम के WhatsApp matching alerts पाना चाहता/चाहती हूँ.',
    },
    marketing_allowed: {
      type: 'marketing_allowed',
      label: 'Promotional WhatsApp messages',
      description:
        'मैं WhatsApp पर अलग से promotional/campaign messages पाना चाहता/चाहती हूँ.',
    },
  },
}

const companyConsentCopyByLanguage: Record<WhatsappConsentLanguage, Record<WhatsappConsentType, WhatsappConsentCopyItem>> = {
  en: {
    service_allowed: {
      type: 'service_allowed',
      label: 'Essential company WhatsApp updates',
      description:
        'I want to receive essential WhatsApp updates about my company account, job posts, applications, billing, and support.',
    },
    matching_alerts_allowed: {
      type: 'matching_alerts_allowed',
      label: 'Worker matching alerts',
      description:
        'I want to receive WhatsApp alerts when relevant Workers or hiring matches are available.',
    },
    marketing_allowed: {
      type: 'marketing_allowed',
      label: 'Promotional WhatsApp messages',
      description:
        'I want to receive separate promotional or campaign messages on WhatsApp.',
    },
  },
  hi: {
    service_allowed: {
      type: 'service_allowed',
      label: 'जरूरी company WhatsApp updates',
      description:
        'मैं अपने company account, job posts, applications, billing और support से जुड़ी जरूरी WhatsApp updates पाना चाहता/चाहती हूँ.',
    },
    matching_alerts_allowed: {
      type: 'matching_alerts_allowed',
      label: 'Worker matching alerts',
      description:
        'जब उपयुक्त Workers या hiring matches उपलब्ध हों, तब मैं WhatsApp alerts पाना चाहता/चाहती हूँ.',
    },
    marketing_allowed: {
      type: 'marketing_allowed',
      label: 'Promotional WhatsApp messages',
      description:
        'मैं WhatsApp पर अलग से promotional/campaign messages पाना चाहता/चाहती हूँ.',
    },
  },
}

export const normalizeWhatsappConsentLanguage = (value: unknown): WhatsappConsentLanguage =>
  String(value || '').trim().toLowerCase().startsWith('hi') ? 'hi' : 'en'

export const getWhatsappConsentCopy = ({
  recipientType,
  language,
  includeMarketing = true,
}: {
  recipientType: 'worker' | 'company'
  language: WhatsappConsentLanguage
  includeMarketing?: boolean
}): WhatsappConsentCopyItem[] => {
  const source = recipientType === 'worker'
    ? consentCopyByLanguage[language]
    : companyConsentCopyByLanguage[language]

  const types = includeMarketing
    ? WHATSAPP_CONSENT_TYPES
    : (['service_allowed', 'matching_alerts_allowed'] as const)

  return types.map((type) => source[type])
}

export const parseWorkerRegistrationWhatsappConsents = (value: unknown): WorkerRegistrationWhatsappConsentInput => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    service_allowed: parseConsentBoolean(source.service_allowed),
    matching_alerts_allowed: parseConsentBoolean(source.matching_alerts_allowed),
    marketing_allowed: parseConsentBoolean(source.marketing_allowed),
  }
}

export const parseCompanyRegistrationWhatsappConsents = (value: unknown): CompanyRegistrationWhatsappConsentInput => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    service_allowed: parseConsentBoolean(source.service_allowed),
    matching_alerts_allowed: parseConsentBoolean(source.matching_alerts_allowed),
  }
}

export const parseCompanySettingsWhatsappConsents = (value: unknown): CompanySettingsWhatsappConsentInput => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    service_allowed: parseConsentBoolean(source.service_allowed),
    matching_alerts_allowed: parseConsentBoolean(source.matching_alerts_allowed),
    marketing_allowed: parseConsentBoolean(source.marketing_allowed),
  }
}

export const parseWorkerSettingsWhatsappConsents = parseCompanySettingsWhatsappConsents

export const resolveWhatsappConsentTextVersion = (value: unknown) => {
  const normalized = String(value || '').trim()
  return normalized || WHATSAPP_CONSENT_TEXT_VERSION
}

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
    'Dedicated authenticated Worker communication-preferences flow for updating service, matching, and marketing consent',
    'Registration must not imply consent and existing Workers remain unknown until explicitly updated',
  ],
  company: [
    'Registration flow for explicit service and matching consent on the business contact mobile',
    'Dedicated signed-in Company communication-preferences flow for updating service, matching, and marketing consent',
    'Company registration does not collect marketing consent and existing Companies remain unknown until explicitly updated',
  ],
} as const
