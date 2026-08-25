import type { SupabaseClient } from '@supabase/supabase-js'

import { maskWhatsappMobile, normalizeIndianMobileToE164 } from './consent'
import type {
  JsonObject,
  WhatsappSuppressionHistoryRecord,
  WhatsappSuppressionRow,
  WhatsappSuppressionSummary,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/suppression-repository')

const SUPPRESSION_SELECT =
  'id, normalized_mobile, suppression_scope, trigger_source, trigger_command, trigger_message_id, previous_consent_snapshot, restoration_requested_at, restoration_message_id, active, metadata, created_at, updated_at'

type RecordSuppressionInput = {
  mobile: string
  suppressionScope?: string
  triggerSource: string
  triggerCommand: string
  triggerMessageId?: string | null
  previousConsentSnapshot?: JsonObject
  metadata?: JsonObject
}

type RecordRestorationRequestInput = {
  mobile: string
  restorationMessageId?: string | null
  metadata?: JsonObject
}

type SuppressionStore = {
  getActiveSuppression: (normalizedMobile: string) => Promise<WhatsappSuppressionRow | null>
  insertSuppression: (
    row: Omit<WhatsappSuppressionRow, 'id' | 'createdAt' | 'updatedAt' | 'restorationRequestedAt' | 'restorationMessageId'>,
  ) => Promise<WhatsappSuppressionRow>
  updateSuppression: (
    id: string,
    row: Partial<WhatsappSuppressionRow>,
  ) => Promise<WhatsappSuppressionRow>
  listSuppressionHistory: (limit: number) => Promise<WhatsappSuppressionRow[]>
  countActiveSuppressions: () => Promise<number>
}

const normalizeRequiredText = (value: string, label: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${label} is required.`)
  }

  return normalized
}

const normalizeMobile = (value: string) => {
  const normalized = normalizeIndianMobileToE164(value)
  if (!normalized.ok) {
    throw new Error('Invalid WhatsApp mobile.')
  }

  return normalized.normalized
}

const normalizeNullableText = (value: string | null | undefined) => {
  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

const ensureJsonObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}

const mapSuppressionRow = (row: Record<string, unknown>): WhatsappSuppressionRow => ({
  id: String(row.id || ''),
  normalizedMobile: String(row.normalized_mobile || ''),
  suppressionScope: String(row.suppression_scope || ''),
  triggerSource: String(row.trigger_source || ''),
  triggerCommand: String(row.trigger_command || ''),
  triggerMessageId: row.trigger_message_id ? String(row.trigger_message_id) : null,
  previousConsentSnapshot: ensureJsonObject(row.previous_consent_snapshot),
  restorationRequestedAt: row.restoration_requested_at
    ? String(row.restoration_requested_at)
    : null,
  restorationMessageId: row.restoration_message_id
    ? String(row.restoration_message_id)
    : null,
  active: Boolean(row.active),
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseSuppressionStore = (client: SupabaseClient): SuppressionStore => ({
  async getActiveSuppression(normalizedMobile) {
    const { data, error } = await client
      .from('labour_whatsapp_suppressions')
      .select(SUPPRESSION_SELECT)
      .eq('normalized_mobile', normalizedMobile)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp suppression state.')
    }

    return data ? mapSuppressionRow(data as Record<string, unknown>) : null
  },

  async insertSuppression(row) {
    const payload = {
      normalized_mobile: row.normalizedMobile,
      suppression_scope: row.suppressionScope,
      trigger_source: row.triggerSource,
      trigger_command: row.triggerCommand,
      trigger_message_id: row.triggerMessageId,
      previous_consent_snapshot: row.previousConsentSnapshot,
      active: row.active,
      metadata: row.metadata,
    }

    const { data, error } = await client
      .from('labour_whatsapp_suppressions')
      .insert(payload)
      .select(SUPPRESSION_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to record WhatsApp suppression state.')
    }

    return mapSuppressionRow(data as Record<string, unknown>)
  },

  async updateSuppression(id, row) {
    const payload = {
      ...(typeof row.restorationRequestedAt !== 'undefined'
        ? { restoration_requested_at: row.restorationRequestedAt }
        : {}),
      ...(typeof row.restorationMessageId !== 'undefined'
        ? { restoration_message_id: row.restorationMessageId }
        : {}),
      ...(typeof row.active !== 'undefined' ? { active: row.active } : {}),
      ...(typeof row.metadata !== 'undefined' ? { metadata: row.metadata } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client
      .from('labour_whatsapp_suppressions')
      .update(payload)
      .eq('id', id)
      .select(SUPPRESSION_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to update WhatsApp suppression state.')
    }

    return mapSuppressionRow(data as Record<string, unknown>)
  },

  async listSuppressionHistory(limit) {
    const { data, error } = await client
      .from('labour_whatsapp_suppressions')
      .select(SUPPRESSION_SELECT)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Unable to read WhatsApp suppression history.')
    }

    return (data || []).map((row) => mapSuppressionRow(row as Record<string, unknown>))
  },

  async countActiveSuppressions() {
    const { count, error } = await client
      .from('labour_whatsapp_suppressions')
      .select('id', { head: true, count: 'exact' })
      .eq('active', true)

    if (error) {
      throw new Error('Unable to count WhatsApp suppressions.')
    }

    return count ?? 0
  },
})

const toHistoryRecord = (row: WhatsappSuppressionRow): WhatsappSuppressionHistoryRecord => ({
  maskedMobile: maskWhatsappMobile(row.normalizedMobile),
  suppressionScope: row.suppressionScope,
  triggerCommand: row.triggerCommand,
  triggerSource: row.triggerSource,
  active: row.active,
  createdAt: row.createdAt,
  restorationRequestedAt: row.restorationRequestedAt,
  hasRestorationRequest: Boolean(row.restorationRequestedAt),
})

export const createWhatsappSuppressionRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: SuppressionStore
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseSuppressionStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp suppression repository store is required.')
  }

  return {
    async getActiveSuppression(input: { normalizedMobile: string }) {
      return resolvedStore.getActiveSuppression(normalizeMobile(input.normalizedMobile))
    },

    async isMobileSuppressed(input: { normalizedMobile: string }) {
      return Boolean(
        await resolvedStore.getActiveSuppression(normalizeMobile(input.normalizedMobile)),
      )
    },

    async recordSuppression(input: RecordSuppressionInput) {
      const normalizedMobile = normalizeMobile(input.mobile)
      const current = await resolvedStore.getActiveSuppression(normalizedMobile)

      if (current) {
        return {
          created: false,
          duplicate: true,
          suppression: current,
        }
      }

      return {
        created: true,
        duplicate: false,
        suppression: await resolvedStore.insertSuppression({
          normalizedMobile,
          suppressionScope:
            normalizeNullableText(input.suppressionScope) || 'all_whatsapp',
          triggerSource: normalizeRequiredText(input.triggerSource, 'triggerSource'),
          triggerCommand: normalizeRequiredText(input.triggerCommand, 'triggerCommand'),
          triggerMessageId: normalizeNullableText(input.triggerMessageId),
          previousConsentSnapshot: ensureJsonObject(input.previousConsentSnapshot),
          active: true,
          metadata: ensureJsonObject(input.metadata),
        }),
      }
    },

    async recordRestorationRequest(input: RecordRestorationRequestInput) {
      const normalizedMobile = normalizeMobile(input.mobile)
      const current = await resolvedStore.getActiveSuppression(normalizedMobile)

      if (!current) {
        return {
          updated: false,
          duplicate: false,
          suppression: null,
        }
      }

      if (current.restorationRequestedAt || current.restorationMessageId) {
        return {
          updated: false,
          duplicate: true,
          suppression: current,
        }
      }

      const restorationMessageId = normalizeNullableText(input.restorationMessageId)
      if (
        restorationMessageId &&
        current.restorationMessageId &&
        current.restorationMessageId === restorationMessageId
      ) {
        return {
          updated: false,
          duplicate: true,
          suppression: current,
        }
      }

      return {
        updated: true,
        duplicate: false,
        suppression: await resolvedStore.updateSuppression(current.id, {
          restorationRequestedAt: new Date().toISOString(),
          restorationMessageId,
          metadata: {
            ...current.metadata,
            ...ensureJsonObject(input.metadata),
          },
        }),
      }
    },

    async listSuppressionHistory(input: { limit?: number } = {}) {
      return resolvedStore.listSuppressionHistory(input.limit ?? 10)
    },

    async getSuppressionSummary(input: { limit?: number } = {}): Promise<WhatsappSuppressionSummary> {
      const [activeSuppressionCount, recentRows] = await Promise.all([
        resolvedStore.countActiveSuppressions(),
        resolvedStore.listSuppressionHistory(input.limit ?? 10),
      ])

      return {
        available: true,
        persistenceStatus: 'Connected',
        failClosed: false,
        activeSuppressionCount,
        recentRecords: recentRows.map(toHistoryRecord),
      }
    },
  }
}
