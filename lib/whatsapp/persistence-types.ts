import type { WhatsappConsentType } from './consent'
import type {
  WhatsappMetaTemplateCategory,
  WhatsappTemplateButtonType,
  WhatsappTemplateHeaderType,
} from './template-inventory'

export const WHATSAPP_PERSISTENCE_RECIPIENT_TYPES = [
  'worker',
  'company',
  'external_test',
] as const

export const WHATSAPP_CONSENT_EVENT_RECIPIENT_TYPES = [
  'worker',
  'company',
  'unknown',
] as const

export const WHATSAPP_TEMPLATE_RECIPIENT_TYPES = [
  'worker',
  'company',
  'both',
  'external_test',
] as const

export const WHATSAPP_CONSENT_EVENT_TYPES = [
  'granted',
  'denied',
  'opted_out',
  'restoration_requested',
  'restored',
  'admin_correction',
] as const

export const WHATSAPP_INBOUND_EVENT_KINDS = [
  'opt_out_all',
  'restore_request',
  'message',
  'unknown',
] as const

export const WHATSAPP_SETTINGS_KEYS = [
  'pause_all_sending',
  'worker_daily_limit',
  'company_job_daily_limit',
  'manual_bulk_cap',
  'quiet_hours_start',
  'quiet_hours_end',
  'timezone',
  'automatic_messaging_mode',
  'automatic_addon_pricing',
] as const

export const WHATSAPP_AUTOMATIC_MESSAGE_MODES = [
  'off',
  'free',
  'paid',
] as const

export const WHATSAPP_AUTOMATION_ENTITLEMENT_STATUSES = [
  'pending',
  'active',
  'inactive',
  'expired',
  'revoked',
] as const

export const WHATSAPP_AUTOMATION_ENTITLEMENT_MODES = [
  'paid',
] as const

export const WHATSAPP_AUTOMATIC_EXECUTION_EVENT_TYPES = [
  'job_post_matching',
  'worker_recharge_required',
  'worker_kyc_rejected',
] as const

export const WHATSAPP_AUTOMATIC_EXECUTION_STATUSES = [
  'queued',
  'blocked',
  'completed',
  'failed',
] as const

export const WHATSAPP_AUTOMATIC_DELIVERY_ELIGIBILITY_OUTCOMES = [
  'eligible',
  'ineligible',
  'revalidated_blocked',
] as const

export const WHATSAPP_AUTOMATIC_DELIVERY_STATUSES = [
  'blocked',
  'skipped',
  'sent',
  'failed',
] as const

export const REVIEW_ONLY_WHATSAPP_DEFAULTS = {
  workerDailyLimit: 3,
  companyJobDailyLimit: 5,
  manualBulkCap: 100,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  timeZone: 'Asia/Kolkata',
} as const

export type WhatsappPersistenceRecipientType =
  (typeof WHATSAPP_PERSISTENCE_RECIPIENT_TYPES)[number]
export type WhatsappConsentEventRecipientType =
  (typeof WHATSAPP_CONSENT_EVENT_RECIPIENT_TYPES)[number]
export type WhatsappTemplateRecipientType =
  (typeof WHATSAPP_TEMPLATE_RECIPIENT_TYPES)[number]
export type WhatsappConsentEventType =
  (typeof WHATSAPP_CONSENT_EVENT_TYPES)[number]
export type WhatsappInboundEventKind = (typeof WHATSAPP_INBOUND_EVENT_KINDS)[number]
export type WhatsappSettingsKey = (typeof WHATSAPP_SETTINGS_KEYS)[number]
export type WhatsappAutomaticMessageMode =
  (typeof WHATSAPP_AUTOMATIC_MESSAGE_MODES)[number]
export type WhatsappAutomationEntitlementStatus =
  (typeof WHATSAPP_AUTOMATION_ENTITLEMENT_STATUSES)[number]
export type WhatsappAutomationEntitlementMode =
  (typeof WHATSAPP_AUTOMATION_ENTITLEMENT_MODES)[number]
export type WhatsappAutomaticExecutionEventType =
  (typeof WHATSAPP_AUTOMATIC_EXECUTION_EVENT_TYPES)[number]
export type WhatsappAutomaticExecutionStatus =
  (typeof WHATSAPP_AUTOMATIC_EXECUTION_STATUSES)[number]
export type WhatsappAutomaticDeliveryEligibilityOutcome =
  (typeof WHATSAPP_AUTOMATIC_DELIVERY_ELIGIBILITY_OUTCOMES)[number]
export type WhatsappAutomaticDeliveryStatus =
  (typeof WHATSAPP_AUTOMATIC_DELIVERY_STATUSES)[number]

export type JsonObject = Record<string, unknown>

export type WhatsappPersistenceAvailability =
  | {
      available: true
      presentConfigurationNames: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    }
  | {
      available: false
      missingConfigurationNames: Array<'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'>
      message: string
    }

export type WhatsappConsentRow = {
  id: string
  recipientType: WhatsappPersistenceRecipientType
  recipientId: string | null
  normalizedMobile: string
  consentType: WhatsappConsentType
  allowed: boolean
  source: string
  consentTextVersion: string
  consentedAt: string | null
  optedOutAt: string | null
  metadata: JsonObject
  createdAt: string
  updatedAt: string
}

export type WhatsappConsentEventRow = {
  id: string
  recipientType: WhatsappConsentEventRecipientType
  recipientId: string | null
  normalizedMobile: string
  consentType: WhatsappConsentType
  previousAllowed: boolean | null
  newAllowed: boolean
  eventType: WhatsappConsentEventType
  source: string
  consentTextVersion: string
  eventMessageId: string | null
  metadata: JsonObject
  occurredAt: string
  createdAt: string
}

export type WhatsappSuppressionRow = {
  id: string
  normalizedMobile: string
  suppressionScope: string
  triggerSource: string
  triggerCommand: string
  triggerMessageId: string | null
  previousConsentSnapshot: JsonObject
  restorationRequestedAt: string | null
  restorationMessageId: string | null
  active: boolean
  metadata: JsonObject
  createdAt: string
  updatedAt: string
}

export type WhatsappInboundEventRow = {
  id: string
  messageId: string
  normalizedMobile: string | null
  matchedRecipientType: WhatsappPersistenceRecipientType | null
  matchedRecipientId: string | null
  eventKind: WhatsappInboundEventKind
  rawText: string
  normalizedText: string
  commandKey: string | null
  suppressionApplied: boolean
  metadata: JsonObject
  createdAt: string
  updatedAt: string
}

export type WhatsappStoredTemplateButton = {
  type: WhatsappTemplateButtonType
  label: string
  targetSummary: string
  optOutQuickReply: boolean
}

export type WhatsappTemplateInventoryRow = {
  id: string
  metaTemplateName: string
  language: string
  metaCategory: WhatsappMetaTemplateCategory | string
  metaStatus: string
  intendedRecipientType: WhatsappTemplateRecipientType | null
  intendedBusinessEvent: string | null
  headerType: WhatsappTemplateHeaderType
  bodyVariableSchema: unknown[]
  footerText: string
  buttonSchema: WhatsappStoredTemplateButton[]
  enabled: boolean
  safeTestAvailable: boolean
  metadata: JsonObject
  lastSynchronizedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WhatsappSettingRow = {
  id: string
  settingsKey: WhatsappSettingsKey | string
  settingsValue: unknown
  description: string
  createdAt: string
  updatedAt: string
}

export type WhatsappAutomationPricingSettings = {
  currency: string
  amountMinor: number
  active: boolean
}

export type WhatsappCompanyAutomationEntitlementRow = {
  id: string
  companyId: string
  entitlementStatus: WhatsappAutomationEntitlementStatus
  entitlementMode: WhatsappAutomationEntitlementMode
  validFrom: string
  validUntil: string
  paymentOrderReference: string | null
  paymentReference: string | null
  source: string
  metadata: JsonObject
  createdAt: string
  updatedAt: string
}

export type WhatsappAutomaticExecutionRow = {
  id: string
  automationEventType: WhatsappAutomaticExecutionEventType
  companyId: string
  jobPostId: string | null
  modeSnapshot: WhatsappAutomaticMessageMode
  executionStatus: WhatsappAutomaticExecutionStatus
  eligibleCount: number
  excludedCount: number
  selectedCount: number
  sentCount: number
  failedCount: number
  idempotencyKey: string
  metadata: JsonObject
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  updatedAt: string
}

export type WhatsappAutomaticDeliveryAttemptRow = {
  id: string
  executionId: string
  recipientType: 'worker' | 'company'
  recipientId: string
  templateName: string
  templateLanguage: string
  eligibilityOutcome: WhatsappAutomaticDeliveryEligibilityOutcome
  attemptStatus: WhatsappAutomaticDeliveryStatus
  reasonCode: string | null
  providerMessageId: string | null
  metadata: JsonObject
  createdAt: string
  updatedAt: string
}

export type WhatsappAutomaticModeResolution = {
  mode: WhatsappAutomaticMessageMode
  source: 'stored' | 'missing' | 'invalid' | 'query_error'
}

export type WhatsappAutomationPricingResolution = {
  pricing: WhatsappAutomationPricingSettings
  source: 'stored' | 'missing' | 'invalid' | 'query_error'
}

export type WhatsappCompanyEntitlementCheckResult = {
  eligible: boolean
  evaluatedMode: WhatsappAutomaticMessageMode
  reason: 'active' | 'not_required' | 'missing' | 'inactive' | 'expired' | 'query_error'
  entitlement: WhatsappCompanyAutomationEntitlementRow | null
}

export type WhatsappConsentCountRow = {
  recipientType: 'worker' | 'company'
  consentType: WhatsappConsentType
  allowedCount: number
  blockedCount: number
}

export type WhatsappConsentSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  counts: WhatsappConsentCountRow[]
}

export type WhatsappSuppressionHistoryRecord = {
  maskedMobile: string
  suppressionScope: string
  triggerCommand: string
  triggerSource: string
  active: boolean
  createdAt: string
  restorationRequestedAt: string | null
  hasRestorationRequest: boolean
}

export type WhatsappSuppressionSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  activeSuppressionCount: number
  recentRecords: WhatsappSuppressionHistoryRecord[]
}

export type WhatsappTemplateEligibilityResult = {
  eligible: boolean
  reasonCodes: string[]
  approved: boolean
  headerValid: boolean
  bodySchemaValid: boolean
  buttonSchemaValid: boolean
  safeTestAllowed: boolean
}

export type WhatsappTemplateInventorySummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  totalTemplates: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  templates: Array<{
    name: string
    language: string
    category: string
    status: string
    headerType: WhatsappTemplateHeaderType
    enabled: boolean
    safeTestAvailable: boolean
    eligibility: WhatsappTemplateEligibilityResult
    bodyVariableCount: number
    buttons: WhatsappStoredTemplateButton[]
    updatedAt: string
  }>
}

export type WhatsappSafetyStatusSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  pauseAllSending: boolean
  pauseReason:
    | 'explicit_true'
    | 'explicit_false'
    | 'missing'
    | 'invalid'
    | 'query_error'
    | 'persistence_unavailable'
  reviewOnlyDefaults: typeof REVIEW_ONLY_WHATSAPP_DEFAULTS
}
