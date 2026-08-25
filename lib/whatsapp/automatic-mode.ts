import type {
  WhatsappAutomaticMessageMode,
  WhatsappAutomationPricingSettings,
  WhatsappCompanyAutomationEntitlementRow,
  WhatsappCompanyEntitlementCheckResult,
} from './persistence-types'

export const WHATSAPP_AUTOMATIC_MODE_SETTING_KEY = 'automatic_messaging_mode' as const
export const WHATSAPP_AUTOMATION_PRICING_SETTING_KEY = 'automatic_addon_pricing' as const

export const DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE: WhatsappAutomaticMessageMode = 'off'

export const DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS: WhatsappAutomationPricingSettings = {
  currency: 'INR',
  amountMinor: 0,
  active: false,
}

const ensureJsonObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const normalizeTrimmedString = (value: unknown) => String(value || '').trim()

export const normalizeWhatsappAutomaticMessageMode = (
  value: unknown,
): WhatsappAutomaticMessageMode | null => {
  const normalized = normalizeTrimmedString(value).toLowerCase()

  switch (normalized) {
    case 'off':
    case 'free':
    case 'paid':
      return normalized
    default:
      return null
  }
}

export const parseWhatsappAutomaticModeSettingValue = (
  value: unknown,
): WhatsappAutomaticMessageMode | null => {
  const record = ensureJsonObject(value)
  if (!record) {
    return null
  }

  return normalizeWhatsappAutomaticMessageMode(record.mode)
}

const normalizeCurrency = (value: unknown) => {
  const normalized = normalizeTrimmedString(value).toUpperCase()
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null
}

const normalizeAmountMinor = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const normalized = Math.trunc(value)
  return normalized >= 0 ? normalized : null
}

export const parseWhatsappAutomationPricingSettingValue = (
  value: unknown,
): WhatsappAutomationPricingSettings | null => {
  const record = ensureJsonObject(value)
  if (!record) {
    return null
  }

  const currency = normalizeCurrency(record.currency)
  const amountMinor = normalizeAmountMinor(record.amountMinor)
  const active = typeof record.active === 'boolean' ? record.active : null

  if (!currency || amountMinor === null || active === null) {
    return null
  }

  return {
    currency,
    amountMinor,
    active,
  }
}

const parseIsoDate = (value: string) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const isWhatsappAutomationEntitlementActive = ({
  entitlement,
  now = new Date(),
}: {
  entitlement: WhatsappCompanyAutomationEntitlementRow
  now?: Date
}) => {
  if (entitlement.entitlementStatus !== 'active') {
    return false
  }

  if (entitlement.entitlementMode !== 'paid') {
    return false
  }

  const validFrom = parseIsoDate(entitlement.validFrom)
  const validUntil = parseIsoDate(entitlement.validUntil)

  if (!validFrom || !validUntil) {
    return false
  }

  return validFrom.getTime() <= now.getTime() && validUntil.getTime() >= now.getTime()
}

export const evaluateWhatsappCompanyEntitlement = ({
  mode,
  entitlements,
  now = new Date(),
}: {
  mode: WhatsappAutomaticMessageMode
  entitlements: WhatsappCompanyAutomationEntitlementRow[]
  now?: Date
}): WhatsappCompanyEntitlementCheckResult => {
  if (mode !== 'paid') {
    return {
      eligible: true,
      evaluatedMode: mode,
      reason: 'not_required',
      entitlement: null,
    }
  }

  if (entitlements.length === 0) {
    return {
      eligible: false,
      evaluatedMode: mode,
      reason: 'missing',
      entitlement: null,
    }
  }

  const activeEntitlement = entitlements.find((entitlement) =>
    isWhatsappAutomationEntitlementActive({ entitlement, now }),
  )

  if (activeEntitlement) {
    return {
      eligible: true,
      evaluatedMode: mode,
      reason: 'active',
      entitlement: activeEntitlement,
    }
  }

  const mostRelevantEntitlement = entitlements[0] || null
  const hasExpiredEntitlement = entitlements.some((entitlement) => {
    if (entitlement.entitlementMode !== 'paid') return false

    const validUntil = parseIsoDate(entitlement.validUntil)
    return entitlement.entitlementStatus === 'active' && Boolean(validUntil && validUntil.getTime() < now.getTime())
  })

  return {
    eligible: false,
    evaluatedMode: mode,
    reason: hasExpiredEntitlement ? 'expired' : 'inactive',
    entitlement: mostRelevantEntitlement,
  }
}
