import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  WhatsappSafetyStatusSummary,
  WhatsappSettingRow,
  WhatsappSettingsKey,
} from './persistence-types'
import { REVIEW_ONLY_WHATSAPP_DEFAULTS } from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/settings-repository')

const SETTING_SELECT =
  'id, settings_key, settings_value, description, created_at, updated_at'

type SettingStore = {
  getSetting: (key: WhatsappSettingsKey) => Promise<WhatsappSettingRow | null>
  listSettings: (keys: WhatsappSettingsKey[]) => Promise<WhatsappSettingRow[]>
}

const mapSettingRow = (row: Record<string, unknown>): WhatsappSettingRow => ({
  id: String(row.id || ''),
  settingsKey: String(row.settings_key || ''),
  settingsValue: row.settings_value,
  description: String(row.description || ''),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseSettingStore = (client: SupabaseClient): SettingStore => ({
  async getSetting(key) {
    const { data, error } = await client
      .from('labour_whatsapp_settings')
      .select(SETTING_SELECT)
      .eq('settings_key', key)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp setting.')
    }

    return data ? mapSettingRow(data as Record<string, unknown>) : null
  },

  async listSettings(keys) {
    const { data, error } = await client
      .from('labour_whatsapp_settings')
      .select(SETTING_SELECT)
      .in('settings_key', keys)

    if (error) {
      throw new Error('Unable to read WhatsApp settings.')
    }

    return (data || []).map((row) => mapSettingRow(row as Record<string, unknown>))
  },
})

export const createWhatsappSettingsRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: SettingStore
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseSettingStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp settings repository store is required.')
  }

  const getWhatsappSetting = async (key: WhatsappSettingsKey) =>
    resolvedStore.getSetting(key)

  const isAllSendingPaused = async () => {
    try {
      const pauseRow = await resolvedStore.getSetting('pause_all_sending')

      if (!pauseRow) {
        return {
          paused: true,
          reason: 'missing' as const,
        }
      }

      if (typeof pauseRow.settingsValue !== 'boolean') {
        return {
          paused: true,
          reason: 'invalid' as const,
        }
      }

      return {
        paused: pauseRow.settingsValue,
        reason: pauseRow.settingsValue ? ('explicit_true' as const) : ('explicit_false' as const),
      }
    } catch {
      return {
        paused: true,
        reason: 'query_error' as const,
      }
    }
  }

  const getWhatsappSafetySettings = async (): Promise<WhatsappSafetyStatusSummary> => {
    const pauseStatus = await isAllSendingPaused()

    return {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: pauseStatus.paused,
      pauseAllSending: pauseStatus.paused,
      pauseReason: pauseStatus.reason,
      reviewOnlyDefaults: REVIEW_ONLY_WHATSAPP_DEFAULTS,
    }
  }

  return {
    async getWhatsappSetting(key: WhatsappSettingsKey) {
      return getWhatsappSetting(key)
    },

    async isAllSendingPaused() {
      return isAllSendingPaused()
    },

    async getWhatsappSafetySettings(): Promise<WhatsappSafetyStatusSummary> {
      return getWhatsappSafetySettings()
    },
  }
}
