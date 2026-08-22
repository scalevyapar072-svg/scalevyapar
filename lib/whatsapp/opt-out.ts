import {
  WHATSAPP_CONSENT_TYPES,
  type WhatsappConsentType,
} from './consent'

export const WHATSAPP_GLOBAL_OPT_OUT_COMMANDS = [
  'stop',
  'unsubscribe',
  'बंद',
  'मैसेज बंद करें',
] as const

export const WHATSAPP_RESTORE_REQUEST_COMMANDS = [
  'start',
  'subscribe',
  'चालू',
] as const

export type WhatsappOptOutClassification =
  | {
      kind: 'opt_out_all'
      normalizedCommand: string
      affectsConsentTypes: WhatsappConsentType[]
      suppressesAllCategories: true
      duplicate: boolean
    }
  | {
      kind: 'restore_request'
      normalizedCommand: string
      affectsConsentTypes: []
      suppressesAllCategories: false
      duplicate: boolean
      restoresConsents: []
      requiresFreshConsentFlow: true
    }
  | {
      kind: 'none'
      normalizedCommand: string
      affectsConsentTypes: []
      suppressesAllCategories: false
      duplicate: false
    }

export const normalizeWhatsappCommandText = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export const classifyWhatsappOptOutCommand = ({
  text,
  currentlySuppressed = false,
}: {
  text: unknown
  currentlySuppressed?: boolean
}): WhatsappOptOutClassification => {
  const normalizedCommand = normalizeWhatsappCommandText(text)

  if ((WHATSAPP_GLOBAL_OPT_OUT_COMMANDS as readonly string[]).includes(normalizedCommand)) {
    return {
      kind: 'opt_out_all',
      normalizedCommand,
      affectsConsentTypes: [...WHATSAPP_CONSENT_TYPES],
      suppressesAllCategories: true,
      duplicate: currentlySuppressed,
    }
  }

  if ((WHATSAPP_RESTORE_REQUEST_COMMANDS as readonly string[]).includes(normalizedCommand)) {
    return {
      kind: 'restore_request',
      normalizedCommand,
      affectsConsentTypes: [],
      suppressesAllCategories: false,
      duplicate: false,
      restoresConsents: [],
      requiresFreshConsentFlow: true,
    }
  }

  return {
    kind: 'none',
    normalizedCommand,
    affectsConsentTypes: [],
    suppressesAllCategories: false,
    duplicate: false,
  }
}
