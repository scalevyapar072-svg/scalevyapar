import type { SupabaseClient } from '@supabase/supabase-js'

import {
  buildWhatsappConsentState,
  normalizeIndianMobileToE164,
  type WhatsappConsentState,
  type WhatsappConsentType,
} from './consent'
import type {
  JsonObject,
  WhatsappConsentCountRow,
  WhatsappConsentEventRecipientType,
  WhatsappConsentEventRow,
  WhatsappConsentEventType,
  WhatsappConsentRow,
  WhatsappPersistenceRecipientType,
  WhatsappConsentSummary,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/consent-repository')

const CONSENT_SELECT =
  'id, recipient_type, recipient_id, normalized_mobile, consent_type, allowed, source, consent_text_version, consented_at, opted_out_at, metadata, created_at, updated_at'
const CONSENT_EVENT_SELECT =
  'id, recipient_type, recipient_id, normalized_mobile, consent_type, previous_allowed, new_allowed, event_type, source, consent_text_version, event_message_id, metadata, occurred_at, created_at'

type ConsentQuery = {
  recipientType: WhatsappPersistenceRecipientType
  recipientId?: string | null
  normalizedMobile: string
  consentType?: WhatsappConsentType
  limit?: number
}

type RecordConsentEventInput = {
  recipientType: WhatsappConsentEventRecipientType
  recipientId?: string | null
  normalizedMobile: string
  consentType: WhatsappConsentType
  previousAllowed: boolean | null
  newAllowed: boolean
  eventType: WhatsappConsentEventType
  source: string
  consentTextVersion?: string
  eventMessageId?: string | null
  metadata?: JsonObject
  occurredAt?: string | Date
}

type RecordConsentDecisionInput = {
  recipientType: WhatsappPersistenceRecipientType
  recipientId?: string | null
  mobile: string
  consentType: WhatsappConsentType
  allowed: boolean
  eventType: WhatsappConsentEventType
  source: string
  consentTextVersion?: string
  eventMessageId?: string | null
  metadata?: JsonObject
  occurredAt?: string | Date
}

type ConsentStore = {
  listCurrentConsents: (query: ConsentQuery) => Promise<WhatsappConsentRow[]>
  listRecentConsentEvents: (limit: number) => Promise<WhatsappConsentEventRow[]>
  insertConsentEvent: (row: Omit<WhatsappConsentEventRow, 'id' | 'createdAt'>) => Promise<WhatsappConsentEventRow>
  insertCurrentConsent: (row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WhatsappConsentRow>
  updateCurrentConsent: (
    id: string,
    row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<WhatsappConsentRow>
  countCurrentConsents: (input: {
    recipientType: 'worker' | 'company'
    consentType: WhatsappConsentType
    allowed: boolean
  }) => Promise<number>
}

const normalizeRecipientId = (value: string | null | undefined) => {
  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

const normalizeRequiredText = (value: string, label: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${label} is required.`)
  }

  return normalized
}

const normalizeConsentMobile = (value: string) => {
  const normalized = normalizeIndianMobileToE164(value)
  if (!normalized.ok) {
    throw new Error('Invalid WhatsApp mobile.')
  }

  return normalized.normalized
}

const toIsoString = (value?: string | Date) => {
  if (!value) return new Date().toISOString()
  if (value instanceof Date) return value.toISOString()

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid occurredAt timestamp.')
  }

  return parsed.toISOString()
}

const ensureJsonObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}

const mapConsentRow = (row: Record<string, unknown>): WhatsappConsentRow => ({
  id: String(row.id || ''),
  recipientType: String(row.recipient_type || '') as WhatsappPersistenceRecipientType,
  recipientId: row.recipient_id ? String(row.recipient_id) : null,
  normalizedMobile: String(row.normalized_mobile || ''),
  consentType: String(row.consent_type || '') as WhatsappConsentType,
  allowed: Boolean(row.allowed),
  source: String(row.source || ''),
  consentTextVersion: String(row.consent_text_version || ''),
  consentedAt: row.consented_at ? String(row.consented_at) : null,
  optedOutAt: row.opted_out_at ? String(row.opted_out_at) : null,
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const mapConsentEventRow = (row: Record<string, unknown>): WhatsappConsentEventRow => ({
  id: String(row.id || ''),
  recipientType: String(row.recipient_type || '') as WhatsappConsentEventRecipientType,
  recipientId: row.recipient_id ? String(row.recipient_id) : null,
  normalizedMobile: String(row.normalized_mobile || ''),
  consentType: String(row.consent_type || '') as WhatsappConsentType,
  previousAllowed:
    typeof row.previous_allowed === 'boolean' ? row.previous_allowed : null,
  newAllowed: Boolean(row.new_allowed),
  eventType: String(row.event_type || '') as WhatsappConsentEventType,
  source: String(row.source || ''),
  consentTextVersion: String(row.consent_text_version || ''),
  eventMessageId: row.event_message_id ? String(row.event_message_id) : null,
  metadata: ensureJsonObject(row.metadata),
  occurredAt: String(row.occurred_at || ''),
  createdAt: String(row.created_at || ''),
})

const createSupabaseConsentStore = (client: SupabaseClient): ConsentStore => ({
  async listCurrentConsents(query) {
    let request = client
      .from('labour_whatsapp_consents')
      .select(CONSENT_SELECT)
      .eq('recipient_type', query.recipientType)
      .eq('normalized_mobile', query.normalizedMobile)

    if (typeof query.consentType !== 'undefined') {
      request = request.eq('consent_type', query.consentType)
    }

    if (typeof query.recipientId !== 'undefined') {
      if (query.recipientId === null) {
        request = request.is('recipient_id', null)
      } else {
        request = request.eq('recipient_id', query.recipientId)
      }
    }

    const { data, error } = await request
      .order('updated_at', { ascending: false })
      .limit(query.limit ?? 50)

    if (error) {
      throw new Error('Unable to read WhatsApp consents.')
    }

    return (data || []).map((row) => mapConsentRow(row as Record<string, unknown>))
  },

  async listRecentConsentEvents(limit) {
    const { data, error } = await client
      .from('labour_whatsapp_consent_events')
      .select(CONSENT_EVENT_SELECT)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Unable to read WhatsApp consent event history.')
    }

    return (data || []).map((row) => mapConsentEventRow(row as Record<string, unknown>))
  },

  async insertConsentEvent(row) {
    const payload = {
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      normalized_mobile: row.normalizedMobile,
      consent_type: row.consentType,
      previous_allowed: row.previousAllowed,
      new_allowed: row.newAllowed,
      event_type: row.eventType,
      source: row.source,
      consent_text_version: row.consentTextVersion,
      event_message_id: row.eventMessageId,
      metadata: row.metadata,
      occurred_at: row.occurredAt,
    }

    const { data, error } = await client
      .from('labour_whatsapp_consent_events')
      .insert(payload)
      .select(CONSENT_EVENT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to append WhatsApp consent event history.')
    }

    return mapConsentEventRow(data as Record<string, unknown>)
  },

  async insertCurrentConsent(row) {
    const payload = {
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      normalized_mobile: row.normalizedMobile,
      consent_type: row.consentType,
      allowed: row.allowed,
      source: row.source,
      consent_text_version: row.consentTextVersion,
      consented_at: row.consentedAt,
      opted_out_at: row.optedOutAt,
      metadata: row.metadata,
    }

    const { data, error } = await client
      .from('labour_whatsapp_consents')
      .insert(payload)
      .select(CONSENT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to create WhatsApp consent state.')
    }

    return mapConsentRow(data as Record<string, unknown>)
  },

  async updateCurrentConsent(id, row) {
    const payload = {
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      normalized_mobile: row.normalizedMobile,
      consent_type: row.consentType,
      allowed: row.allowed,
      source: row.source,
      consent_text_version: row.consentTextVersion,
      consented_at: row.consentedAt,
      opted_out_at: row.optedOutAt,
      metadata: row.metadata,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client
      .from('labour_whatsapp_consents')
      .update(payload)
      .eq('id', id)
      .select(CONSENT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to update WhatsApp consent state.')
    }

    return mapConsentRow(data as Record<string, unknown>)
  },

  async countCurrentConsents(input) {
    const { count, error } = await client
      .from('labour_whatsapp_consents')
      .select('id', { head: true, count: 'exact' })
      .eq('recipient_type', input.recipientType)
      .eq('consent_type', input.consentType)
      .eq('allowed', input.allowed)

    if (error) {
      throw new Error('Unable to count WhatsApp consents.')
    }

    return count ?? 0
  },
})

const mapCurrentRecipientTypeToEventType = (
  recipientType: WhatsappPersistenceRecipientType,
): WhatsappConsentEventRecipientType =>
  recipientType === 'external_test' ? 'unknown' : recipientType

export const createWhatsappConsentRepository = ({
  client,
  store,
  runAtomically,
}: {
  client?: SupabaseClient
  store?: ConsentStore
  runAtomically?: <T>(callback: () => Promise<T>) => Promise<T>
} = {}) => {
  const resolvedStore =
    store || (client ? createSupabaseConsentStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp consent repository store is required.')
  }

  const getCurrentConsent = async (query: ConsentQuery) => {
    const rows = await resolvedStore.listCurrentConsents({
      ...query,
      limit: 2,
    })

    if (rows.length > 1) {
      throw new Error('Ambiguous recipient consent lookup.')
    }

    return rows[0] || null
  }

  const listRecipientConsents = async (query: ConsentQuery) =>
    resolvedStore.listCurrentConsents(query)

  const getEffectiveConsentState = async (
    query: Omit<ConsentQuery, 'consentType' | 'limit'>,
  ) =>
    (await resolvedStore.listCurrentConsents(query)).reduce<WhatsappConsentState>(
      (state, row) => ({
        ...state,
        [row.consentType]: row.allowed,
      }),
      buildWhatsappConsentState(),
    )

  const recordConsentEvent = async (input: RecordConsentEventInput) => {
    const normalizedMobile = normalizeConsentMobile(input.normalizedMobile)

    return resolvedStore.insertConsentEvent({
      recipientType: input.recipientType,
      recipientId: normalizeRecipientId(input.recipientId),
      normalizedMobile,
      consentType: input.consentType,
      previousAllowed: input.previousAllowed,
      newAllowed: input.newAllowed,
      eventType: input.eventType,
      source: normalizeRequiredText(input.source, 'source'),
      consentTextVersion: String(input.consentTextVersion || '').trim(),
      eventMessageId: normalizeRecipientId(input.eventMessageId),
      metadata: ensureJsonObject(input.metadata),
      occurredAt: toIsoString(input.occurredAt),
    })
  }

  const recordConsentDecision = async (input: RecordConsentDecisionInput) => {
    const normalizedMobile = normalizeConsentMobile(input.mobile)
    const normalizedRecipientId = normalizeRecipientId(input.recipientId)
    const occurredAt = toIsoString(input.occurredAt)
    const current = await getCurrentConsent({
      recipientType: input.recipientType,
      recipientId: normalizedRecipientId,
      normalizedMobile,
      consentType: input.consentType,
    })

    if (current?.optedOutAt && input.allowed && input.eventType === 'granted') {
      throw new Error('Opted-out consent cannot be silently restored.')
    }

    const nextConsentRow = {
      recipientType: input.recipientType,
      recipientId: normalizedRecipientId,
      normalizedMobile,
      consentType: input.consentType,
      allowed: input.allowed,
      source: normalizeRequiredText(input.source, 'source'),
      consentTextVersion: String(input.consentTextVersion || '').trim(),
      consentedAt: input.allowed ? occurredAt : current?.consentedAt || null,
      optedOutAt:
        input.allowed && input.eventType !== 'restored' && input.eventType !== 'admin_correction'
          ? current?.optedOutAt || null
          : input.allowed
            ? null
            : input.eventType === 'opted_out'
              ? occurredAt
              : current?.optedOutAt || null,
      metadata: ensureJsonObject(input.metadata),
    }

    const nextEventRow = {
      recipientType: mapCurrentRecipientTypeToEventType(input.recipientType),
      recipientId: normalizedRecipientId,
      normalizedMobile,
      consentType: input.consentType,
      previousAllowed: current?.allowed ?? null,
      newAllowed: input.allowed,
      eventType: input.eventType,
      source: nextConsentRow.source,
      consentTextVersion: nextConsentRow.consentTextVersion,
      eventMessageId: normalizeRecipientId(input.eventMessageId),
      metadata: nextConsentRow.metadata,
      occurredAt,
    }

    const persist = async () => {
      const updatedConsent = current
        ? await resolvedStore.updateCurrentConsent(current.id, nextConsentRow)
        : await resolvedStore.insertCurrentConsent(nextConsentRow)
      const consentEvent = await resolvedStore.insertConsentEvent(nextEventRow)

      return {
        currentConsent: updatedConsent,
        consentEvent,
        atomicWriteApplied: Boolean(runAtomically),
      }
    }

    return runAtomically ? runAtomically(persist) : persist()
  }

  const getConsentSummary = async (): Promise<WhatsappConsentSummary> => {
    const counts: WhatsappConsentCountRow[] = []

    for (const recipientType of ['worker', 'company'] as const) {
      for (const consentType of [
        'service_allowed',
        'matching_alerts_allowed',
        'marketing_allowed',
      ] as const) {
        const [allowedCount, blockedCount] = await Promise.all([
          resolvedStore.countCurrentConsents({
            recipientType,
            consentType,
            allowed: true,
          }),
          resolvedStore.countCurrentConsents({
            recipientType,
            consentType,
            allowed: false,
          }),
        ])

        counts.push({
          recipientType,
          consentType,
          allowedCount,
          blockedCount,
        })
      }
    }

    return {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: false,
      counts,
    }
  }

  return {
    async getCurrentConsent(query: ConsentQuery) {
      return getCurrentConsent(query)
    },

    async listRecipientConsents(query: ConsentQuery) {
      return listRecipientConsents(query)
    },

    async listRecentConsentEvents(input: { limit?: number } = {}) {
      return resolvedStore.listRecentConsentEvents(input.limit ?? 10)
    },

    async getEffectiveConsentState(query: Omit<ConsentQuery, 'consentType' | 'limit'>) {
      return getEffectiveConsentState(query)
    },

    async recordConsentEvent(input: RecordConsentEventInput) {
      return recordConsentEvent(input)
    },

    async recordConsentDecision(input: RecordConsentDecisionInput) {
      return recordConsentDecision(input)
    },

    async getConsentSummary(): Promise<WhatsappConsentSummary> {
      return getConsentSummary()
    },
  }
}
