import type { SupabaseClient } from '@supabase/supabase-js'

import type { WhatsappMetaTemplateRecord } from './meta-client'
import {
  normalizeWhatsappButtonType,
  normalizeWhatsappHeaderType,
  normalizeWhatsappTemplateCategory,
  type WhatsappTemplateButtonType,
} from './template-inventory'
import type {
  JsonObject,
  WhatsappStoredTemplateButton,
  WhatsappTemplateEligibilityResult,
  WhatsappTemplateInventoryRow,
  WhatsappTemplateInventorySummary,
  WhatsappTemplateRecipientType,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/template-inventory-repository')

const TEMPLATE_SELECT =
  'id, meta_template_name, language, meta_category, meta_status, intended_recipient_type, intended_business_event, header_type, body_variable_schema, footer_text, button_schema, enabled, safe_test_available, metadata, last_synchronized_at, created_at, updated_at'

type TemplateStore = {
  listTemplates: (limit: number) => Promise<WhatsappTemplateInventoryRow[]>
  getTemplateByNameAndLanguage: (
    templateName: string,
    language: string,
  ) => Promise<WhatsappTemplateInventoryRow | null>
}

const normalizeRequiredText = (value: string, label: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${label} is required.`)
  }

  return normalized
}

const normalizeNullableText = (value: string | null | undefined) => {
  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

const ensureJsonObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}

const ensureArray = (value: unknown) => (Array.isArray(value) ? value : [])

const isStoredTemplateButton = (value: unknown): value is WhatsappStoredTemplateButton => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const normalizedType = normalizeWhatsappButtonType(candidate.type)

  return (
    Boolean(normalizedType) &&
    typeof candidate.label === 'string' &&
    typeof candidate.targetSummary === 'string' &&
    typeof candidate.optOutQuickReply === 'boolean'
  )
}

const mapTemplateRow = (row: Record<string, unknown>): WhatsappTemplateInventoryRow => ({
  id: String(row.id || ''),
  metaTemplateName: String(row.meta_template_name || ''),
  language: String(row.language || ''),
  metaCategory: String(row.meta_category || ''),
  metaStatus: String(row.meta_status || ''),
  intendedRecipientType: row.intended_recipient_type
    ? (String(row.intended_recipient_type) as WhatsappTemplateRecipientType)
    : null,
  intendedBusinessEvent: row.intended_business_event
    ? String(row.intended_business_event)
    : null,
  headerType:
    normalizeWhatsappHeaderType(row.header_type) || 'NONE',
  bodyVariableSchema: ensureArray(row.body_variable_schema),
  footerText: String(row.footer_text || ''),
  buttonSchema: ensureArray(row.button_schema).filter(isStoredTemplateButton),
  enabled: Boolean(row.enabled),
  safeTestAvailable: Boolean(row.safe_test_available),
  metadata: ensureJsonObject(row.metadata),
  lastSynchronizedAt: row.last_synchronized_at ? String(row.last_synchronized_at) : null,
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseTemplateStore = (client: SupabaseClient): TemplateStore => ({
  async listTemplates(limit) {
    const { data, error } = await client
      .from('labour_whatsapp_template_inventory')
      .select(TEMPLATE_SELECT)
      .order('meta_template_name', { ascending: true })
      .order('language', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error('Unable to read WhatsApp template inventory.')
    }

    return (data || []).map((row) => mapTemplateRow(row as Record<string, unknown>))
  },

  async getTemplateByNameAndLanguage(templateName, language) {
    const { data, error } = await client
      .from('labour_whatsapp_template_inventory')
      .select(TEMPLATE_SELECT)
      .eq('meta_template_name', templateName)
      .eq('language', language)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp template inventory.')
    }

    return data ? mapTemplateRow(data as Record<string, unknown>) : null
  },
})

const validateBodyVariableSchema = (value: unknown) => Array.isArray(value)
const validateButtonSchema = (value: unknown) =>
  Array.isArray(value) && value.every((item) => isStoredTemplateButton(item))

const createBodyVariableSchema = (bodyVariableCount: number) =>
  Array.from({ length: Math.max(0, bodyVariableCount) }, (_value, index) => ({
    placeholder: `{{${index + 1}}}`,
    position: index + 1,
  }))

const countTemplateSummary = (
  rows: WhatsappTemplateInventoryRow[],
  key: 'metaStatus' | 'metaCategory',
) =>
  rows.reduce<Record<string, number>>((counts, row) => {
    const bucket = String(row[key] || 'UNKNOWN').trim() || 'UNKNOWN'
    counts[bucket] = (counts[bucket] || 0) + 1
    return counts
  }, {})

export const evaluateTemplateSendEligibility = ({
  template,
  testMode = false,
  requestedLanguage,
}: {
  template: WhatsappTemplateInventoryRow
  testMode?: boolean
  requestedLanguage?: string
}): WhatsappTemplateEligibilityResult => {
  const reasonCodes: string[] = []
  const approved = String(template.metaStatus || '').trim().toUpperCase() === 'APPROVED'
  const headerValid = Boolean(normalizeWhatsappHeaderType(template.headerType))
  const bodySchemaValid = validateBodyVariableSchema(template.bodyVariableSchema)
  const buttonSchemaValid = validateButtonSchema(template.buttonSchema)
  const requestedLanguageNormalized = String(requestedLanguage || '').trim()

  if (!approved) {
    reasonCodes.push('meta_status_not_approved')
  }

  if (!template.enabled) {
    reasonCodes.push('template_not_enabled')
  }

  if (testMode && !template.safeTestAvailable) {
    reasonCodes.push('safe_test_unavailable')
  }

  if (
    requestedLanguageNormalized &&
    requestedLanguageNormalized !== String(template.language || '').trim()
  ) {
    reasonCodes.push('unsupported_language')
  }

  if (!headerValid) {
    reasonCodes.push('invalid_header_type')
  }

  if (!bodySchemaValid) {
    reasonCodes.push('invalid_body_variable_schema')
  }

  if (!buttonSchemaValid) {
    reasonCodes.push('invalid_button_schema')
  }

  return {
    eligible: reasonCodes.length === 0,
    reasonCodes,
    approved,
    headerValid,
    bodySchemaValid,
    buttonSchemaValid,
    safeTestAllowed: !testMode || template.safeTestAvailable,
  }
}

export const prepareTemplateInventoryUpsert = ({
  template,
  intendedRecipientType = null,
  intendedBusinessEvent = null,
  enabled = false,
  safeTestAvailable = false,
  metadata = {},
}: {
  template: WhatsappMetaTemplateRecord
  intendedRecipientType?: WhatsappTemplateRecipientType | null
  intendedBusinessEvent?: string | null
  enabled?: boolean
  safeTestAvailable?: boolean
  metadata?: JsonObject
}) => ({
  metaTemplateName: normalizeRequiredText(template.name, 'template.name'),
  language: normalizeRequiredText(template.language, 'template.language'),
  metaCategory: normalizeWhatsappTemplateCategory(template.category),
  metaStatus: normalizeRequiredText(template.status, 'template.status').toUpperCase(),
  intendedRecipientType,
  intendedBusinessEvent: normalizeNullableText(intendedBusinessEvent),
  headerType: normalizeWhatsappHeaderType(template.headerType) || 'NONE',
  bodyVariableSchema: createBodyVariableSchema(template.bodyVariableCount),
  footerText: String(template.footerText || '').trim(),
  buttonSchema: template.buttons
    .filter((button) => Boolean(normalizeWhatsappButtonType(button.type as WhatsappTemplateButtonType)))
    .map((button) => ({
      type: normalizeWhatsappButtonType(button.type as WhatsappTemplateButtonType) || 'QUICK_REPLY',
      label: String(button.label || '').trim(),
      targetSummary: String(button.targetSummary || '').trim(),
      optOutQuickReply: Boolean(button.optOutQuickReply),
    })),
  enabled,
  safeTestAvailable,
  metadata: ensureJsonObject(metadata),
  lastSynchronizedAt: new Date().toISOString(),
})

export const createWhatsappTemplateInventoryRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: TemplateStore
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseTemplateStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp template-inventory repository store is required.')
  }

  return {
    async listTemplateInventory(input: { limit?: number } = {}) {
      return resolvedStore.listTemplates(input.limit ?? 50)
    },

    async getTemplateByNameAndLanguage(input: { templateName: string; language: string }) {
      return resolvedStore.getTemplateByNameAndLanguage(
        normalizeRequiredText(input.templateName, 'templateName'),
        normalizeRequiredText(input.language, 'language'),
      )
    },

    evaluateTemplateSendEligibility,

    prepareTemplateInventoryUpsert,

    async getTemplateInventorySummary(
      input: { limit?: number } = {},
    ): Promise<WhatsappTemplateInventorySummary> {
      const rows = await resolvedStore.listTemplates(input.limit ?? 50)

      return {
        available: true,
        persistenceStatus: 'Connected',
        failClosed: false,
        totalTemplates: rows.length,
        byStatus: countTemplateSummary(rows, 'metaStatus'),
        byCategory: countTemplateSummary(rows, 'metaCategory'),
        templates: rows.map((row) => ({
          name: row.metaTemplateName,
          language: row.language,
          category: String(row.metaCategory || 'UNKNOWN'),
          status: row.metaStatus,
          headerType: row.headerType,
          enabled: row.enabled,
          safeTestAvailable: row.safeTestAvailable,
          eligibility: evaluateTemplateSendEligibility({
            template: row,
            testMode: false,
          }),
          bodyVariableCount: row.bodyVariableSchema.length,
          buttons: row.buttonSchema,
          updatedAt: row.updatedAt,
        })),
      }
    },
  }
}
