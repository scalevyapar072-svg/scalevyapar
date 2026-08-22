import { maskWhatsappMobile } from './consent'

export const WHATSAPP_TEMPLATE_HEADER_TYPES = [
  'NONE',
  'TEXT',
  'IMAGE',
  'VIDEO',
  'DOCUMENT',
] as const

export const WHATSAPP_TEMPLATE_BUTTON_TYPES = [
  'CALL_PHONE_NUMBER',
  'URL',
  'QUICK_REPLY',
] as const

export type WhatsappTemplateHeaderType = (typeof WHATSAPP_TEMPLATE_HEADER_TYPES)[number]
export type WhatsappTemplateButtonType = (typeof WHATSAPP_TEMPLATE_BUTTON_TYPES)[number]
export type WhatsappMetaTemplateCategory =
  | 'UTILITY'
  | 'MARKETING'
  | 'AUTHENTICATION'
  | 'UNKNOWN'

export type WhatsappTemplateButtonContract = {
  type: WhatsappTemplateButtonType
  label: string
  targetSummary: string
  optOutQuickReply: boolean
}

type MetaTemplateButtonLike = {
  type?: unknown
  text?: unknown
  phone_number?: unknown
  url?: unknown
}

type MetaTemplateComponentLike = {
  type?: unknown
  format?: unknown
  text?: unknown
  buttons?: unknown
}

export type WhatsappTemplateContract = {
  headerType: WhatsappTemplateHeaderType
  bodyVariableCount: number
  footerText: string
  buttons: WhatsappTemplateButtonContract[]
  validationErrors: string[]
}

const normalizeText = (value: unknown) => String(value || '').trim()

export const normalizeWhatsappTemplateCategory = (
  value: unknown,
): WhatsappMetaTemplateCategory => {
  const normalized = normalizeText(value).toUpperCase()
  if (normalized === 'UTILITY') return 'UTILITY'
  if (normalized === 'MARKETING') return 'MARKETING'
  if (normalized === 'AUTHENTICATION') return 'AUTHENTICATION'
  return 'UNKNOWN'
}

export const normalizeWhatsappHeaderType = (value: unknown): WhatsappTemplateHeaderType | null => {
  const normalized = normalizeText(value).toUpperCase()
  if ((WHATSAPP_TEMPLATE_HEADER_TYPES as readonly string[]).includes(normalized)) {
    return normalized as WhatsappTemplateHeaderType
  }
  return null
}

export const normalizeWhatsappButtonType = (value: unknown): WhatsappTemplateButtonType | null => {
  const normalized = normalizeText(value).toUpperCase()
  if (normalized === 'PHONE_NUMBER' || normalized === 'CALL_PHONE_NUMBER') {
    return 'CALL_PHONE_NUMBER'
  }
  if (normalized === 'URL') return 'URL'
  if (normalized === 'QUICK_REPLY') return 'QUICK_REPLY'
  return null
}

export const validateWhatsappTemplateHeaderBinding = ({
  headerType,
  mediaAssetType,
  textValue,
}: {
  headerType: WhatsappTemplateHeaderType
  mediaAssetType?: Exclude<WhatsappTemplateHeaderType, 'NONE' | 'TEXT'> | null
  textValue?: string | null
}) => {
  if (headerType === 'NONE') {
    return {
      ok: !mediaAssetType && !normalizeText(textValue),
      errorCode: !mediaAssetType && !normalizeText(textValue) ? '' : 'header_none_with_content',
    }
  }

  if (headerType === 'TEXT') {
    return {
      ok: Boolean(normalizeText(textValue)) && !mediaAssetType,
      errorCode:
        Boolean(normalizeText(textValue)) && !mediaAssetType
          ? ''
          : mediaAssetType
            ? 'header_text_with_media'
            : 'header_text_missing_value',
    }
  }

  return {
    ok: mediaAssetType === headerType && !normalizeText(textValue),
    errorCode:
      mediaAssetType === headerType && !normalizeText(textValue)
        ? ''
        : mediaAssetType && mediaAssetType !== headerType
          ? 'header_media_mismatch'
          : 'header_media_missing_asset',
  }
}

export const validateWhatsappTemplateButton = (button: MetaTemplateButtonLike) => {
  const type = normalizeWhatsappButtonType(button.type)
  const label = normalizeText(button.text)

  if (!type) {
    return {
      ok: false as const,
      errorCode: 'unsupported_button_type',
    }
  }

  if (!label) {
    return {
      ok: false as const,
      errorCode: 'missing_button_label',
    }
  }

  if (type === 'CALL_PHONE_NUMBER') {
    const phone = normalizeText(button.phone_number)
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
      return {
        ok: false as const,
        errorCode: 'invalid_button_phone',
      }
    }

    return {
      ok: true as const,
      button: {
        type,
        label,
        targetSummary: phone.startsWith('+') ? maskWhatsappMobile(phone) : 'Configured phone number',
        optOutQuickReply: false,
      },
    }
  }

  if (type === 'URL') {
    const url = normalizeText(button.url)
    if (!url) {
      return {
        ok: false as const,
        errorCode: 'invalid_button_url',
      }
    }

    return {
      ok: true as const,
      button: {
        type,
        label,
        targetSummary: url.includes('{{') ? 'Dynamic URL template' : 'Configured URL',
        optOutQuickReply: false,
      },
    }
  }

  return {
    ok: true as const,
    button: {
      type,
      label,
      targetSummary: 'Quick reply',
      optOutQuickReply: /^(stop|unsubscribe|बंद|मैसेज बंद करें)$/i.test(label.trim()),
    },
  }
}

const countBodyVariables = (value: string) => {
  const matches = value.match(/\{\{\d+\}\}/g)
  return matches ? matches.length : 0
}

export const parseWhatsappTemplateContractFromMetaComponents = (
  components: unknown,
): WhatsappTemplateContract => {
  const validationErrors: string[] = []
  const buttonContracts: WhatsappTemplateButtonContract[] = []
  let headerType: WhatsappTemplateHeaderType = 'NONE'
  let bodyVariableCount = 0
  let footerText = ''

  const normalizedComponents = Array.isArray(components) ? (components as MetaTemplateComponentLike[]) : []

  normalizedComponents.forEach((component) => {
    const componentType = normalizeText(component.type).toUpperCase()

    if (componentType === 'HEADER') {
      const nextHeaderType = normalizeWhatsappHeaderType(component.format) || 'NONE'
      headerType = nextHeaderType

      const headerValidation = validateWhatsappTemplateHeaderBinding({
        headerType: nextHeaderType,
        mediaAssetType:
          nextHeaderType === 'IMAGE' || nextHeaderType === 'VIDEO' || nextHeaderType === 'DOCUMENT'
            ? nextHeaderType
            : null,
        textValue: nextHeaderType === 'TEXT' ? normalizeText(component.text) : '',
      })

      if (!headerValidation.ok && headerValidation.errorCode) {
        validationErrors.push(headerValidation.errorCode)
      }
    }

    if (componentType === 'BODY') {
      bodyVariableCount = countBodyVariables(normalizeText(component.text))
    }

    if (componentType === 'FOOTER') {
      footerText = normalizeText(component.text)
    }

    if (componentType === 'BUTTONS') {
      const buttons = Array.isArray(component.buttons) ? (component.buttons as MetaTemplateButtonLike[]) : []
      buttons.forEach((button) => {
        const validated = validateWhatsappTemplateButton(button)
        if (!validated.ok) {
          validationErrors.push(validated.errorCode)
          return
        }

        buttonContracts.push(validated.button)
      })
    }
  })

  return {
    headerType,
    bodyVariableCount,
    footerText,
    buttons: buttonContracts,
    validationErrors,
  }
}
