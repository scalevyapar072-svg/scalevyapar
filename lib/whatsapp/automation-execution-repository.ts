import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  JsonObject,
  WhatsappAutomaticDeliveryAttemptRow,
  WhatsappAutomaticDeliveryEligibilityOutcome,
  WhatsappAutomaticDeliveryStatus,
  WhatsappAutomaticExecutionEventType,
  WhatsappAutomaticExecutionRecipientType,
  WhatsappAutomaticExecutionRow,
  WhatsappAutomaticExecutionStatus,
} from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/automation-execution-repository')

const EXECUTION_SELECT =
  'id, automation_event_type, recipient_type, recipient_id, cycle_starts_at, cycle_ends_at, execution_status, eligible_count, excluded_count, selected_count, sent_count, failed_count, idempotency_key, metadata, created_at, started_at, completed_at, updated_at'
const DELIVERY_ATTEMPT_SELECT =
  'id, execution_id, recipient_type, recipient_id, template_name, template_language, eligibility_outcome, attempt_status, reason_code, provider_message_id, metadata, created_at, updated_at'

type ExecutionStore = {
  getExecutionByIdempotencyKey: (key: string) => Promise<WhatsappAutomaticExecutionRow | null>
  insertExecution: (
    row: Omit<WhatsappAutomaticExecutionRow, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<WhatsappAutomaticExecutionRow>
  getDeliveryAttemptByRecipient: (input: {
    executionId: string
    recipientType: 'worker' | 'company'
    recipientId: string
  }) => Promise<WhatsappAutomaticDeliveryAttemptRow | null>
  insertDeliveryAttempt: (
    row: Omit<WhatsappAutomaticDeliveryAttemptRow, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<WhatsappAutomaticDeliveryAttemptRow>
}

const ensureJsonObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}

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

const normalizeNonNegativeInteger = (value: number | undefined) => {
  const normalized = Math.trunc(Number(value || 0))
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : 0
}

const mapExecutionRow = (
  row: Record<string, unknown>,
): WhatsappAutomaticExecutionRow => ({
  id: String(row.id || ''),
  automationEventType: String(row.automation_event_type || '') as WhatsappAutomaticExecutionEventType,
  recipientType: String(row.recipient_type || '') as WhatsappAutomaticExecutionRecipientType,
  recipientId: String(row.recipient_id || ''),
  cycleStartsAt: String(row.cycle_starts_at || ''),
  cycleEndsAt: String(row.cycle_ends_at || ''),
  executionStatus: String(row.execution_status || '') as WhatsappAutomaticExecutionStatus,
  eligibleCount: Number(row.eligible_count || 0),
  excludedCount: Number(row.excluded_count || 0),
  selectedCount: Number(row.selected_count || 0),
  sentCount: Number(row.sent_count || 0),
  failedCount: Number(row.failed_count || 0),
  idempotencyKey: String(row.idempotency_key || ''),
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  startedAt: row.started_at ? String(row.started_at) : null,
  completedAt: row.completed_at ? String(row.completed_at) : null,
  updatedAt: String(row.updated_at || ''),
})

const mapDeliveryAttemptRow = (
  row: Record<string, unknown>,
): WhatsappAutomaticDeliveryAttemptRow => ({
  id: String(row.id || ''),
  executionId: String(row.execution_id || ''),
  recipientType: String(row.recipient_type || '') as 'worker' | 'company',
  recipientId: String(row.recipient_id || ''),
  templateName: String(row.template_name || ''),
  templateLanguage: String(row.template_language || ''),
  eligibilityOutcome: String(row.eligibility_outcome || '') as WhatsappAutomaticDeliveryEligibilityOutcome,
  attemptStatus: String(row.attempt_status || '') as WhatsappAutomaticDeliveryStatus,
  reasonCode: row.reason_code ? String(row.reason_code) : null,
  providerMessageId: row.provider_message_id ? String(row.provider_message_id) : null,
  metadata: ensureJsonObject(row.metadata),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
})

const createSupabaseExecutionStore = (
  client: SupabaseClient,
): ExecutionStore => ({
  async getExecutionByIdempotencyKey(key) {
    const { data, error } = await client
      .from('labour_whatsapp_automatic_executions')
      .select(EXECUTION_SELECT)
      .eq('idempotency_key', key)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp automatic execution.')
    }

    return data ? mapExecutionRow(data as Record<string, unknown>) : null
  },

  async insertExecution(row) {
    const payload = {
      automation_event_type: row.automationEventType,
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      cycle_starts_at: row.cycleStartsAt,
      cycle_ends_at: row.cycleEndsAt,
      execution_status: row.executionStatus,
      eligible_count: row.eligibleCount,
      excluded_count: row.excludedCount,
      selected_count: row.selectedCount,
      sent_count: row.sentCount,
      failed_count: row.failedCount,
      idempotency_key: row.idempotencyKey,
      metadata: row.metadata,
      started_at: row.startedAt,
      completed_at: row.completedAt,
    }

    const { data, error } = await client
      .from('labour_whatsapp_automatic_executions')
      .insert(payload)
      .select(EXECUTION_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to create WhatsApp automatic execution.')
    }

    return mapExecutionRow(data as Record<string, unknown>)
  },

  async getDeliveryAttemptByRecipient(input) {
    const { data, error } = await client
      .from('labour_whatsapp_automatic_delivery_attempts')
      .select(DELIVERY_ATTEMPT_SELECT)
      .eq('execution_id', input.executionId)
      .eq('recipient_type', input.recipientType)
      .eq('recipient_id', input.recipientId)
      .maybeSingle()

    if (error) {
      throw new Error('Unable to read WhatsApp automatic delivery attempt.')
    }

    return data ? mapDeliveryAttemptRow(data as Record<string, unknown>) : null
  },

  async insertDeliveryAttempt(row) {
    const payload = {
      execution_id: row.executionId,
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      template_name: row.templateName,
      template_language: row.templateLanguage,
      eligibility_outcome: row.eligibilityOutcome,
      attempt_status: row.attemptStatus,
      reason_code: row.reasonCode,
      provider_message_id: row.providerMessageId,
      metadata: row.metadata,
    }

    const { data, error } = await client
      .from('labour_whatsapp_automatic_delivery_attempts')
      .insert(payload)
      .select(DELIVERY_ATTEMPT_SELECT)
      .single()

    if (error || !data) {
      throw new Error('Unable to create WhatsApp automatic delivery attempt.')
    }

    return mapDeliveryAttemptRow(data as Record<string, unknown>)
  },
})

export const createWhatsappAutomationExecutionRepository = ({
  client,
  store,
}: {
  client?: SupabaseClient
  store?: ExecutionStore
} = {}) => {
  const resolvedStore = store || (client ? createSupabaseExecutionStore(client) : null)

  if (!resolvedStore) {
    throw new Error('A WhatsApp automation-execution repository store is required.')
  }

  return {
    async recordExecution(input: {
      automationEventType: WhatsappAutomaticExecutionEventType
      recipientType: WhatsappAutomaticExecutionRecipientType
      recipientId: string
      cycleStartsAt: string
      cycleEndsAt: string
      executionStatus?: WhatsappAutomaticExecutionStatus
      eligibleCount?: number
      excludedCount?: number
      selectedCount?: number
      sentCount?: number
      failedCount?: number
      idempotencyKey: string
      metadata?: JsonObject
      startedAt?: string | null
      completedAt?: string | null
    }) {
      const normalizedIdempotencyKey = normalizeRequiredText(
        input.idempotencyKey,
        'idempotencyKey',
      )
      const existing = await resolvedStore.getExecutionByIdempotencyKey(normalizedIdempotencyKey)

      if (existing) {
        return {
          duplicate: true,
          execution: existing,
        }
      }

      return {
        duplicate: false,
        execution: await resolvedStore.insertExecution({
          automationEventType: input.automationEventType,
          recipientType: normalizeRequiredText(
            input.recipientType,
            'recipientType',
          ) as WhatsappAutomaticExecutionRecipientType,
          recipientId: normalizeRequiredText(input.recipientId, 'recipientId'),
          cycleStartsAt: normalizeRequiredText(input.cycleStartsAt, 'cycleStartsAt'),
          cycleEndsAt: normalizeRequiredText(input.cycleEndsAt, 'cycleEndsAt'),
          executionStatus: input.executionStatus || 'queued',
          eligibleCount: normalizeNonNegativeInteger(input.eligibleCount),
          excludedCount: normalizeNonNegativeInteger(input.excludedCount),
          selectedCount: normalizeNonNegativeInteger(input.selectedCount),
          sentCount: normalizeNonNegativeInteger(input.sentCount),
          failedCount: normalizeNonNegativeInteger(input.failedCount),
          idempotencyKey: normalizedIdempotencyKey,
          metadata: ensureJsonObject(input.metadata),
          startedAt: normalizeNullableText(input.startedAt),
          completedAt: normalizeNullableText(input.completedAt),
        }),
      }
    },

    async recordDeliveryAttempt(input: {
      executionId: string
      recipientType: 'worker' | 'company'
      recipientId: string
      templateName: string
      templateLanguage: string
      eligibilityOutcome: WhatsappAutomaticDeliveryEligibilityOutcome
      attemptStatus: WhatsappAutomaticDeliveryStatus
      reasonCode?: string | null
      providerMessageId?: string | null
      metadata?: JsonObject
    }) {
      const normalizedExecutionId = normalizeRequiredText(input.executionId, 'executionId')
      const normalizedRecipientType =
        input.recipientType === 'company' ? 'company' : 'worker'
      const normalizedRecipientId = normalizeRequiredText(input.recipientId, 'recipientId')
      const existing = await resolvedStore.getDeliveryAttemptByRecipient({
        executionId: normalizedExecutionId,
        recipientType: normalizedRecipientType,
        recipientId: normalizedRecipientId,
      })

      if (existing) {
        return {
          duplicate: true,
          attempt: existing,
        }
      }

      return {
        duplicate: false,
        attempt: await resolvedStore.insertDeliveryAttempt({
          executionId: normalizedExecutionId,
          recipientType: normalizedRecipientType,
          recipientId: normalizedRecipientId,
          templateName: normalizeRequiredText(input.templateName, 'templateName'),
          templateLanguage: normalizeRequiredText(
            input.templateLanguage,
            'templateLanguage',
          ),
          eligibilityOutcome: input.eligibilityOutcome,
          attemptStatus: input.attemptStatus,
          reasonCode: normalizeNullableText(input.reasonCode),
          providerMessageId: normalizeNullableText(input.providerMessageId),
          metadata: ensureJsonObject(input.metadata),
        }),
      }
    },
  }
}
