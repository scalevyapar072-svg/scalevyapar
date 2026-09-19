const INDIAN_COUNTRY_CODE = '91'

export const normalizeIndianPhoneDigits = (value: string | null | undefined) => {
  let digits = String(value || '').replace(/\D/g, '')

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  if (digits.length === 10) {
    digits = `${INDIAN_COUNTRY_CODE}${digits}`
  }

  return digits.length === 12 && digits.startsWith(INDIAN_COUNTRY_CODE)
    ? digits
    : ''
}

export const formatIndianPhone = (value: string | null | undefined) => {
  const digits = normalizeIndianPhoneDigits(value)
  return digits ? `+${digits.slice(0, 2)} ${digits.slice(2)}` : ''
}

export const buildWhatsAppHref = (
  value: string | null | undefined,
  existingHref = ''
) => {
  const digits = normalizeIndianPhoneDigits(value)
  if (!digits) return ''

  const suffixIndex = existingHref.search(/[?#]/)
  const suffix = suffixIndex >= 0 ? existingHref.slice(suffixIndex) : ''
  return `https://wa.me/${digits}${suffix}`
}

export const buildTelHref = (value: string | null | undefined) => {
  const digits = normalizeIndianPhoneDigits(value)
  return digits ? `tel:+${digits}` : ''
}

const rewriteContactLink = (value: string, phone: string) => {
  if (/^https:\/\/wa\.me\//i.test(value)) {
    return buildWhatsAppHref(phone, value)
  }

  if (/^tel:/i.test(value)) {
    return buildTelHref(phone)
  }

  return value
}

const rewriteContactLinks = (value: unknown, phone: string): unknown => {
  if (typeof value === 'string') {
    return rewriteContactLink(value, phone)
  }

  if (Array.isArray(value)) {
    return value.map(item => rewriteContactLinks(item, phone))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteContactLinks(item, phone)])
    )
  }

  return value
}

type MainWebsiteContactShape = {
  theme: {
    whatsappNumber: string
  }
  footer: {
    contactItems: Array<{
      icon: string
      label: string
      href: string
    }>
  }
  contactPage: {
    cards: {
      whatsapp: {
        value: string
        href: string
      }
      phone: {
        value: string
        href: string
      }
    }
  }
}

export const applyAuthoritativeMainWebsitePhone = <T extends MainWebsiteContactShape>(content: T): T => {
  const digits = normalizeIndianPhoneDigits(content.theme.whatsappNumber)
  if (!digits) return content

  const canonicalPhone = `+${digits}`
  const displayPhone = formatIndianPhone(canonicalPhone)
  const normalized = rewriteContactLinks(content, canonicalPhone) as T

  return {
    ...normalized,
    theme: {
      ...normalized.theme,
      whatsappNumber: canonicalPhone
    },
    footer: {
      ...normalized.footer,
      contactItems: normalized.footer.contactItems.map(item =>
        /^tel:/i.test(item.href)
          ? { ...item, label: displayPhone, href: buildTelHref(canonicalPhone) }
          : item
      )
    },
    contactPage: {
      ...normalized.contactPage,
      cards: {
        ...normalized.contactPage.cards,
        whatsapp: {
          ...normalized.contactPage.cards.whatsapp,
          value: displayPhone,
          href: buildWhatsAppHref(canonicalPhone, normalized.contactPage.cards.whatsapp.href)
        },
        phone: {
          ...normalized.contactPage.cards.phone,
          value: displayPhone,
          href: buildTelHref(canonicalPhone)
        }
      }
    }
  }
}

type RozgarContactShape = {
  contactPage?: {
    phone?: string | null
  } | null
  footer?: {
    phone?: string | null
  } | null
}

export const resolveRozgarWhatsAppHref = (content: RozgarContactShape) =>
  buildWhatsAppHref(content.contactPage?.phone || content.footer?.phone || '')
