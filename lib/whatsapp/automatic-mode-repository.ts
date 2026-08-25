import type { SupabaseClient } from '@supabase/supabase-js'

import {
  DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
  DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
  WHATSAPP_AUTOMATIC_MODE_SETTING_KEY,
  WHATSAPP_AUTOMATION_PRICING_SETTING_KEY,
  evaluateWhatsappCompanyEntitlement,
  parseWhatsappAutomaticModeSettingValue,
  parseWhatsappAutomationPricingSettingValue,
} from './automatic-mode'
import type {
  WhatsappAutomaticMessageMode,
  WhatsappAutomaticModeResolution,
  WhatsappAutomationPricingResolution,
  WhatsappCompanyAutomationEntitlementRow,
  WhatsappCompanyEntitlementCheckResult,
  WhatsappSettingRow,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/automatic-mode-repository')

const SETTINGS_SELECT =
  'id, settings_key, settings_value, description, created_at, updated_at'
const ENTITLEMENT_SELECT =
  'id, company_id, entitlement_status, entitlement_mode, valid_from, valid_until, payment_order_reference, payment_reference, source, metadata, created_at, updated_at'

type AutomaticModeStore = {
  getSetting: (key: string) => Promise<WhatsappSettingRow | null>
  listEntitlements: (companyId: string, limit: number) => Promise<WhatsappCompanyAutomationEntitlementRow[]>
}

const ensureJsonObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const normalizeRequiredText = (value: string, label: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${label} is required.`)
  }

  return normalized
}

const mapSettingRow = (row: Record<string, unknown>): WhatsappSettingRow => ({
  id: String(row.id || ''),
  settingsKey: String(row.settings_key || ''),
  settingsValue: row.settings_value,
  description: String(row.description || ''),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const mapEntitlementRow = (
  row: Record<string, unknown>,
): WhatsappCompanyAutomationEntitlementRow => ({
  id: String(row.id || ''),
  companyId: String(row.company_id || ''),
  entitlementStatus: String(row.entitlement_status || '') as WhatsappCompanyAutomationEntitlementRow['entitlementStatus'],
  entitlementMode: String(row.entitlement_mode || '') as WhatsappCompanyAutomationEntitlementRow['entitlementMode'],
  validFrom: String(row.valid_from || ''),
  validUntil: String(row.valid_until || ''),
  paymentOrderReference: row.payment_order_reference
    ? String(row.payment_order_reference)
    : null,
  paymentReference: row.payment_reference ? String(row.payment_reference) : null,
  source: String(row.source || ''),
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseAutomaticModeStore = (
  client: SupabaseClient,
): AutomaticModeStore => ({
  async getSetting(key) {
    const { data, error } = await client
      .from('labour_whatsapp_settings')
      .select(SETTINGS_SELECT)
      .eq('settings_key', key)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp automatic-mode setting.')
    }

    return data ? mapSettingRow(data as Record<string, unknown>) : null
  },

  async listEntitlements(companyId, limit) {
    const { data, error } = await client
      .from('labour_whatsapp_company_automation_entitlements')
      .select(ENTITLEMENT_SELECT)
      .eq('company_id', companyId)
      .order('valid_until', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Unable to read WhatsApp company automation entitlements.')
    }

    return (data || []).map((row) =>
      mapEntitlementRow(row as Record<string, unknown>),
    )
  },
})

export const createWhatsappAutomaticModeRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: AutomaticModeStore
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseAutomaticModeStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp automatic-mode repository store is required.')
  }

  const resolveAutomaticMode = async (): Promise<WhatsappAutomaticModeResolution> => {
    try {
      const row = await resolvedStore.getSetting(WHATSAPP_AUTOMATIC_MODE_SETTING_KEY)

      if (!row) {
        return {
          mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
          source: 'missing',
        }
      }

      const parsed = parseWhatsappAutomaticModeSettingValue(row.settingsValue)
      if (!parsed) {
        return {
          mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
          source: 'invalid',
        }
      }

      return {
        mode: parsed,
        source: 'stored',
      }
    } catch {
      return {
        mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
        source: 'query_error',
      }
    }
  }

  const getAutomationPricingSettings =
    async (): Promise<WhatsappAutomationPricingResolution> => {
      try {
        const row = await resolvedStore.getSetting(WHATSAPP_AUTOMATION_PRICING_SETTING_KEY)

        if (!row) {
          return {
            pricing: DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
            source: 'missing',
          }
        }

        const parsed = parseWhatsappAutomationPricingSettingValue(row.settingsValue)
        if (!parsed) {
          return {
            pricing: DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
            source: 'invalid',
          }
        }

        return {
          pricing: parsed,
          source: 'stored',
        }
      } catch {
        return {
          pricing: DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
          source: 'query_error',
        }
      }
    }

  const checkCompanyEntitlement = async ({
    companyId,
    mode,
    now = new Date(),
  }: {
    companyId: string
    mode?: WhatsappAutomaticMessageMode
    now?: Date
  }): Promise<WhatsappCompanyEntitlementCheckResult> => {
    const normalizedCompanyId = normalizeRequiredText(companyId, 'companyId')
    const resolvedMode = mode || (await resolveAutomaticMode()).mode

    if (resolvedMode !== 'paid') {
      return evaluateWhatsappCompanyEntitlement({
        mode: resolvedMode,
        entitlements: [],
        now,
      })
    }

    try {
      const entitlements = await resolvedStore.listEntitlements(normalizedCompanyId, 20)
      return evaluateWhatsappCompanyEntitlement({
        mode: resolvedMode,
        entitlements,
        now,
      })
    } catch {
      return {
        eligible: false,
        evaluatedMode: resolvedMode,
        reason: 'query_error',
        entitlement: null,
      }
    }
  }

  return {
    async resolveAutomaticMode() {
      return resolveAutomaticMode()
    },

    async getAutomationPricingSettings() {
      return getAutomationPricingSettings()
    },

    async checkCompanyEntitlement(input: {
      companyId: string
      mode?: WhatsappAutomaticMessageMode
      now?: Date
    }) {
      return checkCompanyEntitlement(input)
    },
  }
}
