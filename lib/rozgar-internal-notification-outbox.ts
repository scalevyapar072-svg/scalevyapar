import {
  buildRozgarAdminNotificationMessage,
  getRozgarAdminDashboardUrl,
  sendResendAdminNotification,
} from './rozgar-notification-email'
import { supabaseAdmin } from './supabase-admin'

const OUTBOX_TABLE = 'rozgar_internal_notification_outbox'
const CLAIM_RPC = 'claim_rozgar_internal_notification_outbox'
const MAX_ATTEMPTS = 4
const MAX_BATCH_SIZE = 25

export const ROZGAR_COMPANY_REGISTRATION_TEMPLATE_ID = 'rozgar_company_registration_admin'
export const ROZGAR_JOB_PUBLISHED_TEMPLATE_ID = 'rozgar_job_published_admin'

export type RozgarInternalNotificationOutboxStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'

export type RozgarInternalNotificationOutboxRow = {
  id: string
  event_key: string
  event_type: 'company_registration' | 'job_published'
  recipient_email: string
  template_id: string
  payload_json: Record<string, unknown>
  status: RozgarInternalNotificationOutboxStatus
  attempt_count: number
  next_attempt_at: string | null
  last_attempt_at: string | null
  processing_started_at: string | null
  sent_at: string | null
  provider_message_id: string | null
  last_error_code: string | null
  last_error_message_safe: string | null
  created_at: string
  updated_at: string
}

type OutboxRowUpdate = Partial<RozgarInternalNotificationOutboxRow>

type SendResult = Awaited<ReturnType<typeof sendResendAdminNotification>>

export type RozgarInternalNotificationProcessorDependencies = {
  claim: (limit: number) => Promise<RozgarInternalNotificationOutboxRow[]>
  mark: (rowId: string, update: OutboxRowUpdate) => Promise<void>
  send: (message: {
    recipient: string
    subject: string
    text: string
    html: string
    idempotencyKey: string
    productionOnly: true
  }) => Promise<SendResult>
  now: () => Date
}

export type RozgarInternalNotificationProcessorSummary = {
  claimed: number
  sent: number
  retried: number
  failed: number
  synthetic: number
}

const normalizeText = (value: unknown) => String(value ?? '').trim()

const formatDisplayTimestamp = (value: unknown) => {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return normalized
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(date)
}

const renderTemplate = (row: RozgarInternalNotificationOutboxRow) => {
  const payload = row.payload_json || {}

  if (row.template_id === ROZGAR_COMPANY_REGISTRATION_TEMPLATE_ID) {
    const companyName = normalizeText(payload.company_name)
    return buildRozgarAdminNotificationMessage({
      subject: `New Rozgar Company Registration — ${companyName}`,
      title: 'New Rozgar Company Registration',
      rows: [
        ['Company Name', companyName],
        ['Company ID', payload.company_id],
        ['Contact Person', payload.contact_person],
        ['Registered Mobile', payload.registered_mobile],
        ['Registered Email', payload.registered_email],
        ['City', payload.city],
        ['State', payload.state],
        ['Industry Category', payload.industry_category],
        ['Business Type', payload.business_type],
        ['Registration Date & Time', formatDisplayTimestamp(payload.registered_at)],
        ['Admin', getRozgarAdminDashboardUrl()],
      ],
    })
  }

  if (row.template_id === ROZGAR_JOB_PUBLISHED_TEMPLATE_ID) {
    const jobTitle = normalizeText(payload.job_title)
    const companyName = normalizeText(payload.company_name)
    return buildRozgarAdminNotificationMessage({
      subject: `New Rozgar Job Published — ${jobTitle} — ${companyName}`,
      title: 'New Rozgar Job Published',
      rows: [
        ['Job ID', payload.job_id],
        ['Job Title', jobTitle],
        ['Company Name', companyName],
        ['Company ID', payload.company_id],
        ['Matched Labour Categories', payload.labour_categories],
        ['City / Location', payload.city],
        ['Workers Required', payload.workers_required],
        ['Selected Plan', payload.selected_plan],
        ['Publication Date & Time', formatDisplayTimestamp(payload.published_at)],
        ['Expiry Date & Time', formatDisplayTimestamp(payload.expires_at)],
        ['Admin', getRozgarAdminDashboardUrl()],
      ],
    })
  }

  return null
}

const claimRows = async (limit: number) => {
  const boundedLimit = Math.min(Math.max(Math.round(Number(limit || 0)), 1), MAX_BATCH_SIZE)
  const { data, error } = await supabaseAdmin.rpc(CLAIM_RPC, { p_limit: boundedLimit })
  if (error) throw new Error(error.message)
  return (data || []) as RozgarInternalNotificationOutboxRow[]
}

const markRow = async (rowId: string, update: OutboxRowUpdate) => {
  const { error } = await supabaseAdmin
    .from(OUTBOX_TABLE)
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', rowId)
    .eq('status', 'processing')
  if (error) throw new Error(error.message)
}

const defaultDependencies: RozgarInternalNotificationProcessorDependencies = {
  claim: claimRows,
  mark: markRow,
  send: sendResendAdminNotification,
  now: () => new Date(),
}

const getRetryDelayMs = (attemptCount: number) => {
  if (attemptCount <= 1) return 5 * 60 * 1000
  if (attemptCount === 2) return 30 * 60 * 1000
  if (attemptCount === 3) return 2 * 60 * 60 * 1000
  return 0
}

const isClearlyPermanentRecipientFailure = (
  statusCode?: number,
  safeErrorMessage?: string,
) => {
  const message = normalizeText(safeErrorMessage).toLowerCase()
  return (
    (statusCode === 400 || statusCode === 422) &&
    message.includes('invalid') &&
    (message.includes('email') || message.includes('recipient'))
  )
}

const finalizeRetry = async (
  row: RozgarInternalNotificationOutboxRow,
  safeErrorCode: string,
  safeErrorMessage: string,
  dependencies: RozgarInternalNotificationProcessorDependencies,
) => {
  if (row.attempt_count >= MAX_ATTEMPTS) {
    await dependencies.mark(row.id, {
      status: 'failed',
      next_attempt_at: null,
      processing_started_at: null,
      last_error_code: safeErrorCode,
      last_error_message_safe: safeErrorMessage,
    })
    return 'failed' as const
  }

  const nextAttemptAt = new Date(
    dependencies.now().getTime() + getRetryDelayMs(row.attempt_count),
  ).toISOString()
  await dependencies.mark(row.id, {
    status: 'pending',
    next_attempt_at: nextAttemptAt,
    processing_started_at: null,
    last_error_code: safeErrorCode,
    last_error_message_safe: safeErrorMessage,
  })
  return 'retried' as const
}

const processClaimedRow = async (
  row: RozgarInternalNotificationOutboxRow,
  dependencies: RozgarInternalNotificationProcessorDependencies,
) => {
  const message = renderTemplate(row)
  if (!message) {
    await dependencies.mark(row.id, {
      status: 'failed',
      next_attempt_at: null,
      processing_started_at: null,
      last_error_code: 'unknown-template',
      last_error_message_safe: 'No renderer is configured for this template.',
    })
    return 'failed' as const
  }

  let result: SendResult
  try {
    result = await dependencies.send({
      recipient: row.recipient_email,
      ...message,
      idempotencyKey: row.event_key,
      productionOnly: true,
    })
  } catch (error) {
    return finalizeRetry(
      row,
      'send-error',
      error instanceof Error ? error.message : 'Send failed.',
      dependencies,
    )
  }

  if (result.delivered) {
    await dependencies.mark(row.id, {
      status: 'sent',
      sent_at: dependencies.now().toISOString(),
      processing_started_at: null,
      provider_message_id: normalizeText(result.providerMessageId),
      last_error_code: null,
      last_error_message_safe: null,
      next_attempt_at: null,
    })
    return 'sent' as const
  }

  if (result.skipped && result.reason === 'non-production-sink') {
    await dependencies.mark(row.id, {
      status: 'sent',
      sent_at: dependencies.now().toISOString(),
      processing_started_at: null,
      provider_message_id: `synthetic-sink:${row.event_key}`,
      last_error_code: null,
      last_error_message_safe: null,
      next_attempt_at: null,
    })
    return 'synthetic' as const
  }

  const safeErrorCode = normalizeText(result.safeErrorCode || 'provider-error')
  const safeErrorMessage = normalizeText(
    result.safeErrorMessage || 'Provider request failed.',
  )
  if (isClearlyPermanentRecipientFailure(result.statusCode, safeErrorMessage)) {
    await dependencies.mark(row.id, {
      status: 'failed',
      next_attempt_at: null,
      processing_started_at: null,
      last_error_code: safeErrorCode,
      last_error_message_safe: safeErrorMessage,
    })
    return 'failed' as const
  }

  return finalizeRetry(row, safeErrorCode, safeErrorMessage, dependencies)
}

export const processRozgarInternalNotificationOutboxBatch = async (
  limit = MAX_BATCH_SIZE,
  dependencyOverrides: Partial<RozgarInternalNotificationProcessorDependencies> = {},
) => {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides }
  const rows = await dependencies.claim(limit)
  const summary: RozgarInternalNotificationProcessorSummary = {
    claimed: rows.length,
    sent: 0,
    retried: 0,
    failed: 0,
    synthetic: 0,
  }

  for (const row of rows) {
    const outcome = await processClaimedRow(row, dependencies)
    if (outcome === 'synthetic') {
      summary.sent += 1
      summary.synthetic += 1
    } else {
      summary[outcome] += 1
    }
  }

  return summary
}
