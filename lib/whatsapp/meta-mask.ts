import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/meta-mask')

const normalizeText = (value: string | undefined | null) => String(value || '').trim()

export const maskIdentifier = (
  value: string | undefined | null,
  visiblePrefix = 2,
  visibleSuffix = 2,
) => {
  const normalized = normalizeText(value)
  if (!normalized) return ''

  if (normalized.length <= visiblePrefix + visibleSuffix) {
    return '*'.repeat(Math.max(4, normalized.length))
  }

  const maskedLength = Math.max(4, normalized.length - visiblePrefix - visibleSuffix)
  return `${normalized.slice(0, visiblePrefix)}${'*'.repeat(maskedLength)}${normalized.slice(-visibleSuffix)}`
}

export const maskPhoneNumber = (value: string | undefined | null) => {
  const normalized = normalizeText(value)
  const digits = normalized.replace(/\D/g, '')
  if (!digits) return ''

  const prefix = digits.slice(0, Math.min(2, digits.length))
  const suffix = digits.slice(-2)
  const maskedLength = Math.max(4, digits.length - prefix.length - suffix.length)
  const maskedDigits = `${prefix}${'*'.repeat(maskedLength)}${suffix}`

  return normalized.startsWith('+') ? `+${maskedDigits}` : maskedDigits
}
