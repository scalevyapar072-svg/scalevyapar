import type { SupabaseClient } from '@supabase/supabase-js'

import { normalizeIndianMobileToE164 } from './consent'
import { classifyWhatsappOptOutCommand, normalizeWhatsappCommandText } from './opt-out'
import type {
  JsonObject,
  WhatsappInboundEventKind,
  WhatsappInboundEventRow,
  WhatsappPersistenceRecipientType,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/inbound-event-repository')

const INBOUND_EVENT_SELECT =
  'id, message_id, normalized_mobile, matched_recipient_type, matched_recipient_id, event_kind, raw_text, normalized_text, command_key, suppression_applied, metadata, created_at, updated_at'

type PrepareInboundEventInput = {
  messageId: string
  mobile: string
  rawText: string
  timestamp?: string | Date
  matchedRecipientType?: WhatsappPersistenceRecipientType | null
  matchedRecipientId?: string | null
  currentlySuppressed?: boolean
  metadata?: JsonObject
}

type InboundEventStore = {
  getByMessageId: (messageId: string) => Promise<WhatsappInboundEventRow | null>
  listRecentInboundEvents: (limit: number) => Promise<WhatsappInboundEventRow[]>
  insertInboundEvent: (
    row: Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<WhatsappInboundEventRow>
  updateInboundEvent: (
    id: string,
    row: Partial<Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<WhatsappInboundEventRow>
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

const mapInboundEventRow = (row: Record<string, unknown>): WhatsappInboundEventRow => ({
  id: String(row.id || ''),
  messageId: String(row.message_id || ''),
  normalizedMobile: row.normalized_mobile ? String(row.normalized_mobile) : null,
  matchedRecipientType: row.matched_recipient_type
    ? (String(row.matched_recipient_type) as WhatsappPersistenceRecipientType)
    : null,
  matchedRecipientId: row.matched_recipient_id ? String(row.matched_recipient_id) : null,
  eventKind: String(row.event_kind || '') as WhatsappInboundEventKind,
  rawText: String(row.raw_text || ''),
  normalizedText: String(row.normalized_text || ''),
  commandKey: row.command_key ? String(row.command_key) : null,
  suppressionApplied: Boolean(row.suppression_applied),
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseInboundEventStore = (client: SupabaseClient): InboundEventStore => ({
  async getByMessageId(messageId) {
    const { data, error } = await client
      .from('labour_whatsapp_inbound_events')
      .select(INBOUND_EVENT_SELECT)
      .eq('message_id', messageId)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp inbound event.')
    }

    return data ? mapInboundEventRow(data as Record<string, unknown>) : null
  },

  async listRecentInboundEvents(limit) {
    const { data, error } = await client
      .from('labour_whatsapp_inbound_events')
      .select(INBOUND_EVENT_SELECT)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Unable to read WhatsApp inbound events.')
    }

    return (data || []).map((row) => mapInboundEventRow(row as Record<string, unknown>))
  },

  async insertInboundEvent(row) {
    const payload = {
      message_id: row.messageId,
      normalized_mobile: row.normalizedMobile,
      matched_recipient_type: row.matchedRecipientType,
      matched_recipient_id: row.matchedRecipientId,
      event_kind: row.eventKind,
      raw_text: row.rawText,
      normalized_text: row.normalizedText,
      command_key: row.commandKey,
      suppression_applied: row.suppressionApplied,
      metadata: row.metadata,
    }

    const { data, error } = await client
      .from('labour_whatsapp_inbound_events')
      .insert(payload)
      .select(INBOUND_EVENT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to record WhatsApp inbound event.')
    }

    return mapInboundEventRow(data as Record<string, unknown>)
  },

  async updateInboundEvent(id, row) {
    const payload = {
      ...(typeof row.normalizedMobile !== 'undefined'
        ? { normalized_mobile: row.normalizedMobile }
        : {}),
      ...(typeof row.matchedRecipientType !== 'undefined'
        ? { matched_recipient_type: row.matchedRecipientType }
        : {}),
      ...(typeof row.matchedRecipientId !== 'undefined'
        ? { matched_recipient_id: row.matchedRecipientId }
        : {}),
      ...(typeof row.eventKind !== 'undefined' ? { event_kind: row.eventKind } : {}),
      ...(typeof row.rawText !== 'undefined' ? { raw_text: row.rawText } : {}),
      ...(typeof row.normalizedText !== 'undefined'
        ? { normalized_text: row.normalizedText }
        : {}),
      ...(typeof row.commandKey !== 'undefined' ? { command_key: row.commandKey } : {}),
      ...(typeof row.suppressionApplied !== 'undefined'
        ? { suppression_applied: row.suppressionApplied }
        : {}),
      ...(typeof row.metadata !== 'undefined' ? { metadata: row.metadata } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client
      .from('labour_whatsapp_inbound_events')
      .update(payload)
      .eq('id', id)
      .select(INBOUND_EVENT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to update WhatsApp inbound event.')
    }

    return mapInboundEventRow(data as Record<string, unknown>)
  },
})

const toKind = (input: ReturnType<typeof classifyWhatsappOptOutCommand>): WhatsappInboundEventKind => {
  if (input.kind === 'opt_out_all') return 'opt_out_all'
  if (input.kind === 'restore_request') return 'restore_request'
  return 'message'
}

export const createWhatsappInboundEventRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: InboundEventStore
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseInboundEventStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp inbound-event repository store is required.')
  }

  return {
    async hasInboundMessageBeenProcessed(messageId: string) {
      return Boolean(await resolvedStore.getByMessageId(normalizeRequiredText(messageId, 'messageId')))
    },

    async getInboundMessage(messageId: string) {
      return resolvedStore.getByMessageId(normalizeRequiredText(messageId, 'messageId'))
    },

    async classifyAndPrepareInboundEvent(input: PrepareInboundEventInput) {
      const rawText = normalizeRequiredText(input.rawText, 'rawText')
      const normalizedMessageId = normalizeRequiredText(input.messageId, 'messageId')
      const normalizedMobileResult = normalizeIndianMobileToE164(input.mobile)
      const normalizedMobile = normalizedMobileResult.ok
        ? normalizedMobileResult.normalized
        : null
      const classification = classifyWhatsappOptOutCommand({
        text: rawText,
        currentlySuppressed: input.currentlySuppressed ?? false,
      })
      const normalizedText = normalizeWhatsappCommandText(rawText)

      return {
        messageId: normalizedMessageId,
        normalizedMobile,
        matchedRecipientType: input.matchedRecipientType ?? null,
        matchedRecipientId: normalizeNullableText(input.matchedRecipientId),
        eventKind: toKind(classification),
        rawText,
        normalizedText,
        commandKey: classification.kind === 'none' ? null : classification.normalizedCommand,
        suppressionApplied: classification.kind === 'opt_out_all',
        metadata: {
          classificationKind: classification.kind,
          receivedAt:
            input.timestamp instanceof Date
              ? input.timestamp.toISOString()
              : normalizeNullableText(input.timestamp) || null,
          ...ensureJsonObject(input.metadata),
        },
        classification,
      }
    },

    async listRecentInboundEvents(input: { limit?: number } = {}) {
      return resolvedStore.listRecentInboundEvents(input.limit ?? 10)
    },

    async updateInboundEvent(
      id: string,
      row: Partial<Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>>,
    ) {
      return resolvedStore.updateInboundEvent(normalizeRequiredText(id, 'id'), {
        ...row,
        metadata: typeof row.metadata === 'undefined' ? row.metadata : ensureJsonObject(row.metadata),
      })
    },

    async recordInboundEvent(
      row: Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>,
    ) {
      const existing = await resolvedStore.getByMessageId(
        normalizeRequiredText(row.messageId, 'messageId'),
      )

      if (existing) {
        return {
          duplicate: true,
          event: existing,
        }
      }

      return {
        duplicate: false,
        event: await resolvedStore.insertInboundEvent({
          ...row,
          rawText: normalizeRequiredText(row.rawText, 'rawText'),
          normalizedText: normalizeWhatsappCommandText(row.rawText),
          metadata: ensureJsonObject(row.metadata),
        }),
      }
    },
  }
}
