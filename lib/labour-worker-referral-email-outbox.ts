import { randomUUID } from 'crypto'

import { getRozgarAdminNotificationEmail, sendResendAdminNotification } from './rozgar-notification-email'
import { supabaseAdmin } from './supabase-admin'

const OUTBOX_TABLE = 'worker_referral_email_outbox'
const CLAIM_RPC = 'claim_worker_referral_email_outbox'
const MAX_ATTEMPTS = 4
const MAX_BATCH_SIZE = 25
const MAX_PAYLOAD_BYTES = 8 * 1024

export const REFERRAL_EMAIL_OUTBOX_TEST_TEMPLATE_ID = 'referral_email_outbox_test_admin'
export const REFERRAL_JOINED_ADMIN_TEMPLATE_ID = 'referral_joined_admin'
export const REFERRAL_QUALIFIED_ADMIN_TEMPLATE_ID = 'referral_qualified_admin'
export const REFERRAL_REWARD_CREDITED_ADMIN_TEMPLATE_ID = 'referral_reward_credited_admin'
export const REFERRAL_PAYOUT_DETAILS_ADDED_ADMIN_TEMPLATE_ID =
  'referral_payout_details_added_admin'
export const REFERRAL_PAYOUT_DETAILS_CHANGED_ADMIN_TEMPLATE_ID =
  'referral_payout_details_changed_admin'
export const REFERRAL_WITHDRAWAL_REQUESTED_ADMIN_TEMPLATE_ID =
  'referral_withdrawal_requested_admin'
export const REFERRAL_WITHDRAWAL_APPROVED_ADMIN_TEMPLATE_ID =
  'referral_withdrawal_approved_admin'
export const REFERRAL_WITHDRAWAL_REJECTED_ADMIN_TEMPLATE_ID =
  'referral_withdrawal_rejected_admin'
export const REFERRAL_WITHDRAWAL_PAID_ADMIN_TEMPLATE_ID =
  'referral_withdrawal_paid_admin'

export type ReferralEmailOutboxStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped'

type ReferralEmailOutboxRow = {
  id: string
  event_key: string
  event_type: string
  recipient_email: string
  template_id: string
  payload_json: Record<string, unknown>
  status: ReferralEmailOutboxStatus
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

type EnqueueReferralAdminEmailInput = {
  eventKey: string
  eventType: string
  templateId: string
  payload: Record<string, unknown>
}

type ProcessReferralEmailOutboxCounts = {
  claimed: number
  sent: number
  retried: number
  failed: number
  skipped: number
}

type ReferralAdminEmailContext = {
  referralId: string
  referralCode: string
  agentName: string
  agentMobile: string
  workerName: string
  workerMobile: string
  workerCity: string
  categoryName: string
  attributedAt: string
  registeredAt: string
  qualifiedAt: string
  rewardedAt: string
  rewardAmount: number
}

type ReferralPayoutAdminEmailContext = {
  workerId: string
  referralCode: string
  agentName: string
  agentMobile: string
}

type ReferralWithdrawalAdminEmailContext = {
  requestId: string
  workerId: string
  referralCode: string
  agentName: string
  agentMobile: string
  amount: number
  payoutMethod: string
  maskedDestination: string
  status: string
  requestedAt: string
  approvedAt: string
  rejectedAt: string
  rejectionReason: string
  paidAt: string
  paymentReference: string
}

const normalizeText = (value: unknown) => String(value || '').trim()
const nowIso = () => new Date().toISOString()
const outboxId = () => `referral-email-outbox-${randomUUID()}`

const DUPLICATE_ERROR_CODES = new Set(['23505'])

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  'account_number',
  'accountnumber',
  'upi_id',
  'upiid',
  'encrypted_value',
  'ciphertext',
  'otp',
  'jwt',
  'cookie',
  'password',
  'password_hash',
  'secret',
  'session',
  'resend_api_key',
  'razorpay_key',
  'supabase_service_role_key',
  'kyc_docs',
  'kycdocs',
])

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

const sanitizePayloadValue = (value: unknown, depth = 0): unknown => {
  if (depth > 5) {
    throw new Error('Outbox payload nesting is too deep.')
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'string') {
    return value.trim().slice(0, 1000)
  }

  if (Array.isArray(value)) {
    return value.map(entry => sanitizePayloadValue(entry, depth + 1))
  }

  if (isPlainObject(value)) {
    const next: Record<string, unknown> = {}

    for (const [rawKey, rawValue] of Object.entries(value)) {
      const key = normalizeText(rawKey)
      if (!key) {
        continue
      }

      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '')
      if (FORBIDDEN_PAYLOAD_KEYS.has(normalizedKey)) {
        throw new Error(`Outbox payload contains a forbidden key: ${key}`)
      }

      next[key] = sanitizePayloadValue(rawValue, depth + 1)
    }

    return next
  }

  return normalizeText(value).slice(0, 1000)
}

const sanitizeReferralEmailPayload = (payload: Record<string, unknown>) => {
  const sanitized = sanitizePayloadValue(payload)

  if (!isPlainObject(sanitized)) {
    throw new Error('Outbox payload must be a plain object.')
  }

  const serialized = JSON.stringify(sanitized)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_PAYLOAD_BYTES) {
    throw new Error('Outbox payload is too large.')
  }

  return sanitized
}

const formatCurrencyAmount = (value: unknown) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) {
    return ''
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDisplayTimestamp = (value: unknown) => {
  const normalized = normalizeText(value)
  if (!normalized) {
    return ''
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return normalized
  }

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const escapeHtml = (value: unknown) =>
  normalizeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getRozgarAdminDashboardUrl = () => {
  const baseUrl = normalizeText(process.env.NEXT_PUBLIC_APP_URL || 'https://www.scalevyapar.in').replace(/\/+$/, '')
  return `${baseUrl}/admin/labour`
}

const buildSummaryPairs = (
  entries: Array<[label: string, value: unknown]>,
) =>
  entries.filter(([, value]) => normalizeText(value).length > 0)

const buildAdminEventMessage = ({
  subject,
  heading,
  intro,
  summaryPairs,
}: {
  subject: string
  heading: string
  intro: string
  summaryPairs: Array<[label: string, value: unknown]>
}) => {
  const filteredPairs = buildSummaryPairs(summaryPairs)
  const dashboardUrl = getRozgarAdminDashboardUrl()
  const text = [
    intro,
    '',
    ...filteredPairs.map(([label, value]) => `${label}: ${normalizeText(value)}`),
    '',
    `Open Admin: ${dashboardUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:24px">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">Rozgar Refer &amp; Earn</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155">${escapeHtml(intro)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse">
          ${filteredPairs
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding:8px 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#0f172a;vertical-align:top;width:36%">${escapeHtml(label)}</td>
                  <td style="padding:8px 0;border-top:1px solid #e2e8f0;font-size:14px;color:#334155">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join('')}
        </table>
        <div style="margin-top:20px">
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600">Open Admin</a>
        </div>
      </div>
    </div>
  `

  return { subject, text, html }
}

const formatPayoutMethodLabel = (value: unknown) => {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'bank') return 'Bank Account'
  if (normalized === 'upi') return 'UPI'
  return normalizeText(value)
}

const readOutboxRowByEventKey = async (eventKey: string) => {
  const { data, error } = await supabaseAdmin
    .from(OUTBOX_TABLE)
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as ReferralEmailOutboxRow | null
}

export const enqueueReferralAdminEmail = async ({
  eventKey,
  eventType,
  templateId,
  payload,
}: EnqueueReferralAdminEmailInput) => {
  const normalizedEventKey = normalizeText(eventKey)
  const normalizedEventType = normalizeText(eventType)
  const normalizedTemplateId = normalizeText(templateId)

  if (!normalizedEventKey) {
    throw new Error('eventKey is required.')
  }

  if (!normalizedEventType) {
    throw new Error('eventType is required.')
  }

  if (!normalizedTemplateId) {
    throw new Error('templateId is required.')
  }

  const sanitizedPayload = sanitizeReferralEmailPayload(payload)
  const timestamp = nowIso()
  const row = {
    id: outboxId(),
    event_key: normalizedEventKey,
    event_type: normalizedEventType,
    recipient_email: getRozgarAdminNotificationEmail(),
    template_id: normalizedTemplateId,
    payload_json: sanitizedPayload,
    status: 'pending' as const,
    attempt_count: 0,
    next_attempt_at: null,
    last_attempt_at: null,
    processing_started_at: null,
    sent_at: null,
    provider_message_id: null,
    last_error_code: null,
    last_error_message_safe: null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  const { data, error } = await supabaseAdmin
    .from(OUTBOX_TABLE)
    .insert(row)
    .select('*')
    .single()

  if (!error) {
    return {
      inserted: true,
      duplicate: false,
      row: data as ReferralEmailOutboxRow,
    }
  }

  if (DUPLICATE_ERROR_CODES.has(normalizeText((error as { code?: unknown }).code))) {
    const existing = await readOutboxRowByEventKey(normalizedEventKey)
    return {
      inserted: false,
      duplicate: true,
      row: existing,
    }
  }

  throw new Error(error.message)
}

const fetchReferralAdminEmailContext = async (
  referralId: string,
): Promise<ReferralAdminEmailContext | null> => {
  const normalizedReferralId = normalizeText(referralId)
  if (!normalizedReferralId) {
    return null
  }

  const { data: referral, error: referralError } = await supabaseAdmin
    .from('worker_referrals')
    .select(
      'id,referrer_worker_id,referred_worker_id,referral_code_snapshot,category_id,reward_amount_snapshot,attributed_at,registered_at,qualified_at,rewarded_at',
    )
    .eq('id', normalizedReferralId)
    .maybeSingle()

  if (referralError) {
    throw new Error(referralError.message)
  }

  if (!referral) {
    return null
  }

  const [agentResult, workerResult, categoryResult] = await Promise.all([
    supabaseAdmin
      .from('labour_workers')
      .select('id,full_name,mobile')
      .eq('id', normalizeText(referral.referrer_worker_id))
      .maybeSingle(),
    supabaseAdmin
      .from('labour_workers')
      .select('id,full_name,mobile,city,home_city')
      .eq('id', normalizeText(referral.referred_worker_id))
      .maybeSingle(),
    supabaseAdmin
      .from('labour_categories')
      .select('id,name')
      .eq('id', normalizeText(referral.category_id))
      .maybeSingle(),
  ])

  for (const result of [agentResult, workerResult, categoryResult]) {
    if (result.error) {
      throw new Error(result.error.message)
    }
  }

  return {
    referralId: normalizeText(referral.id),
    referralCode: normalizeText(referral.referral_code_snapshot),
    agentName: normalizeText(agentResult.data?.full_name),
    agentMobile: normalizeText(agentResult.data?.mobile),
    workerName: normalizeText(workerResult.data?.full_name),
    workerMobile: normalizeText(workerResult.data?.mobile),
    workerCity:
      normalizeText(workerResult.data?.city) ||
      normalizeText(workerResult.data?.home_city),
    categoryName: normalizeText(categoryResult.data?.name),
    attributedAt: normalizeText(referral.attributed_at),
    registeredAt: normalizeText(referral.registered_at),
    qualifiedAt: normalizeText(referral.qualified_at),
    rewardedAt: normalizeText(referral.rewarded_at),
    rewardAmount: Number(referral.reward_amount_snapshot || 0),
  }
}

const fetchReferralPayoutAdminEmailContext = async (
  workerId: string,
): Promise<ReferralPayoutAdminEmailContext | null> => {
  const normalizedWorkerId = normalizeText(workerId)
  if (!normalizedWorkerId) {
    return null
  }

  const [workerResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('labour_workers')
      .select('id,full_name,mobile')
      .eq('id', normalizedWorkerId)
      .maybeSingle(),
    supabaseAdmin
      .from('worker_referral_profiles')
      .select('worker_id,referral_code')
      .eq('worker_id', normalizedWorkerId)
      .maybeSingle(),
  ])

  if (workerResult.error) {
    throw new Error(workerResult.error.message)
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (!workerResult.data || !profileResult.data) {
    return null
  }

  return {
    workerId: normalizeText(workerResult.data.id),
    referralCode: normalizeText(profileResult.data.referral_code),
    agentName: normalizeText(workerResult.data.full_name),
    agentMobile: normalizeText(workerResult.data.mobile),
  }
}

const fetchReferralWithdrawalAdminEmailContext = async (
  requestId: string,
): Promise<ReferralWithdrawalAdminEmailContext | null> => {
  const normalizedRequestId = normalizeText(requestId)
  if (!normalizedRequestId) {
    return null
  }

  const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
    .from('worker_referral_withdrawal_requests')
    .select(
      'id,worker_id,amount,payout_method,masked_destination,status,requested_at,approved_at,rejected_at,rejection_reason,paid_at,payment_reference',
    )
    .eq('id', normalizedRequestId)
    .maybeSingle()

  if (withdrawalError) {
    throw new Error(withdrawalError.message)
  }

  if (!withdrawal) {
    return null
  }

  const workerId = normalizeText(withdrawal.worker_id)
  if (!workerId) {
    return null
  }

  const [workerResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('labour_workers')
      .select('id,full_name,mobile')
      .eq('id', workerId)
      .maybeSingle(),
    supabaseAdmin
      .from('worker_referral_profiles')
      .select('worker_id,referral_code')
      .eq('worker_id', workerId)
      .maybeSingle(),
  ])

  if (workerResult.error) {
    throw new Error(workerResult.error.message)
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (!workerResult.data || !profileResult.data) {
    return null
  }

  return {
    requestId: normalizeText(withdrawal.id),
    workerId,
    referralCode: normalizeText(profileResult.data.referral_code),
    agentName: normalizeText(workerResult.data.full_name),
    agentMobile: normalizeText(workerResult.data.mobile),
    amount: Number(withdrawal.amount || 0),
    payoutMethod: formatPayoutMethodLabel(withdrawal.payout_method),
    maskedDestination: normalizeText(withdrawal.masked_destination),
    status: normalizeText(withdrawal.status),
    requestedAt: normalizeText(withdrawal.requested_at),
    approvedAt: normalizeText(withdrawal.approved_at),
    rejectedAt: normalizeText(withdrawal.rejected_at),
    rejectionReason: normalizeText(withdrawal.rejection_reason),
    paidAt: normalizeText(withdrawal.paid_at),
    paymentReference: normalizeText(withdrawal.payment_reference),
  }
}

export const enqueueReferralJoinedAdminEmail = async ({
  referralId,
}: {
  referralId: string
}) => {
  const context = await fetchReferralAdminEmailContext(referralId)
  if (!context) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `referral:${context.referralId}:joined`,
    eventType: 'referral_joined',
    templateId: REFERRAL_JOINED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      worker_name: context.workerName,
      worker_mobile: context.workerMobile,
      category_name: context.categoryName,
      worker_city: context.workerCity,
      joined_at: context.registeredAt || context.attributedAt,
    },
  })
}

export const enqueueReferralQualifiedAdminEmail = async ({
  referralId,
}: {
  referralId: string
}) => {
  const context = await fetchReferralAdminEmailContext(referralId)
  if (!context) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `referral:${context.referralId}:qualified`,
    eventType: 'referral_qualified',
    templateId: REFERRAL_QUALIFIED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      worker_name: context.workerName,
      worker_mobile: context.workerMobile,
      category_name: context.categoryName,
      qualification_status: 'qualified',
      qualified_at: context.qualifiedAt,
    },
  })
}

export const enqueueReferralRewardCreditedAdminEmail = async ({
  referralId,
  ledgerReference,
  rewardAmount,
  availableBalance,
  creditedAt,
}: {
  referralId: string
  ledgerReference: string
  rewardAmount: number
  availableBalance: number
  creditedAt: string
}) => {
  const context = await fetchReferralAdminEmailContext(referralId)
  if (!context) {
    return null
  }

  const normalizedLedgerReference = normalizeText(ledgerReference)
  if (!normalizedLedgerReference) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `reward:${normalizedLedgerReference}:credited`,
    eventType: 'referral_reward_credited',
    templateId: REFERRAL_REWARD_CREDITED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      worker_name: context.workerName,
      worker_mobile: context.workerMobile,
      category_name: context.categoryName,
      reward_amount: rewardAmount,
      available_balance: availableBalance,
      credited_at: creditedAt || context.rewardedAt,
    },
  })
}

export const enqueueReferralPayoutDetailsAddedAdminEmail = async ({
  workerId,
  payoutAuditId,
  method,
  methodLabel,
  maskedDestination,
  savedAt,
}: {
  workerId: string
  payoutAuditId: string
  method: 'bank' | 'upi'
  methodLabel: string
  maskedDestination: string
  savedAt: string
}) => {
  const context = await fetchReferralPayoutAdminEmailContext(workerId)
  const normalizedAuditId = normalizeText(payoutAuditId)
  if (!context || !normalizedAuditId) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `payout-account:${normalizedAuditId}:added`,
    eventType: 'referral_payout_details_added',
    templateId: REFERRAL_PAYOUT_DETAILS_ADDED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      payout_method: formatPayoutMethodLabel(method),
      change_label: normalizeText(methodLabel),
      masked_destination: normalizeText(maskedDestination),
      saved_at: normalizeText(savedAt),
    },
  })
}

export const enqueueReferralPayoutDetailsChangedAdminEmail = async ({
  workerId,
  payoutAuditId,
  method,
  methodLabel,
  maskedDestination,
  changedAt,
  previousPreferredMethod,
  newPreferredMethod,
}: {
  workerId: string
  payoutAuditId: string
  method: 'bank' | 'upi'
  methodLabel: string
  maskedDestination: string
  changedAt: string
  previousPreferredMethod?: 'bank' | 'upi' | null
  newPreferredMethod?: 'bank' | 'upi' | null
}) => {
  const context = await fetchReferralPayoutAdminEmailContext(workerId)
  const normalizedAuditId = normalizeText(payoutAuditId)
  if (!context || !normalizedAuditId) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `payout-account:${normalizedAuditId}:changed`,
    eventType: 'referral_payout_details_changed',
    templateId: REFERRAL_PAYOUT_DETAILS_CHANGED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      payout_method: formatPayoutMethodLabel(method),
      change_label: normalizeText(methodLabel),
      masked_destination: normalizeText(maskedDestination),
      changed_at: normalizeText(changedAt),
      previous_preferred_method: formatPayoutMethodLabel(previousPreferredMethod),
      new_preferred_method: formatPayoutMethodLabel(newPreferredMethod),
    },
  })
}

export const enqueueReferralWithdrawalRequestedAdminEmail = async ({
  requestId,
  availableBalance,
  reservedAmount,
}: {
  requestId: string
  availableBalance?: number
  reservedAmount?: number
}) => {
  const context = await fetchReferralWithdrawalAdminEmailContext(requestId)
  const normalizedRequestId = normalizeText(requestId)
  if (!context || !normalizedRequestId) {
    return null
  }

  const payload: Record<string, unknown> = {
    agent_name: context.agentName,
    agent_mobile: context.agentMobile,
    referral_code: context.referralCode,
    amount: context.amount,
    payout_method: context.payoutMethod,
    masked_destination: context.maskedDestination,
    requested_at: context.requestedAt,
  }

  if (Number.isFinite(Number(availableBalance))) {
    payload.available_balance = Number(availableBalance)
  }

  if (Number.isFinite(Number(reservedAmount))) {
    payload.reserved_amount = Number(reservedAmount)
  }

  return enqueueReferralAdminEmail({
    eventKey: `withdrawal:${normalizedRequestId}:requested`,
    eventType: 'referral_withdrawal_requested',
    templateId: REFERRAL_WITHDRAWAL_REQUESTED_ADMIN_TEMPLATE_ID,
    payload,
  })
}

export const enqueueReferralWithdrawalApprovedAdminEmail = async ({
  requestId,
}: {
  requestId: string
}) => {
  const context = await fetchReferralWithdrawalAdminEmailContext(requestId)
  const normalizedRequestId = normalizeText(requestId)
  if (!context || !normalizedRequestId) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `withdrawal:${normalizedRequestId}:approved`,
    eventType: 'referral_withdrawal_approved',
    templateId: REFERRAL_WITHDRAWAL_APPROVED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      amount: context.amount,
      payout_method: context.payoutMethod,
      masked_destination: context.maskedDestination,
      status_text: 'APPROVED — AWAITING PAYMENT',
      approved_at: context.approvedAt,
    },
  })
}

export const enqueueReferralWithdrawalRejectedAdminEmail = async ({
  requestId,
}: {
  requestId: string
}) => {
  const context = await fetchReferralWithdrawalAdminEmailContext(requestId)
  const normalizedRequestId = normalizeText(requestId)
  if (!context || !normalizedRequestId) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `withdrawal:${normalizedRequestId}:rejected`,
    eventType: 'referral_withdrawal_rejected',
    templateId: REFERRAL_WITHDRAWAL_REJECTED_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      amount: context.amount,
      payout_method: context.payoutMethod,
      masked_destination: context.maskedDestination,
      rejection_reason: context.rejectionReason,
      rejected_at: context.rejectedAt,
    },
  })
}

export const enqueueReferralWithdrawalPaidAdminEmail = async ({
  requestId,
}: {
  requestId: string
}) => {
  const context = await fetchReferralWithdrawalAdminEmailContext(requestId)
  const normalizedRequestId = normalizeText(requestId)
  if (!context || !normalizedRequestId) {
    return null
  }

  return enqueueReferralAdminEmail({
    eventKey: `withdrawal:${normalizedRequestId}:paid`,
    eventType: 'referral_withdrawal_paid',
    templateId: REFERRAL_WITHDRAWAL_PAID_ADMIN_TEMPLATE_ID,
    payload: {
      agent_name: context.agentName,
      agent_mobile: context.agentMobile,
      referral_code: context.referralCode,
      amount: context.amount,
      payout_method: context.payoutMethod,
      masked_destination: context.maskedDestination,
      payment_reference: context.paymentReference,
      paid_at: context.paidAt,
    },
  })
}

const buildAdminTestMessage = (row: ReferralEmailOutboxRow) => {
  const createdAt = nowIso()
  const text = [
    'This is a Preview-only test of the Refer & Earn email notification infrastructure.',
    '',
    `Event key: ${row.event_key}`,
    `Template: ${row.template_id}`,
    `Preview environment: ${process.env.VERCEL_ENV || 'local'}`,
    `Generated at: ${createdAt}`,
    '',
    'No real business event data.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:24px">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">Rozgar Refer &amp; Earn</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2">Email System Test</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6">This is a Preview-only test of the Refer &amp; Earn email notification infrastructure.</p>
        <ul style="margin:0;padding-left:20px;color:#334155;line-height:1.6">
          <li><strong>Event key:</strong> ${row.event_key}</li>
          <li><strong>Template:</strong> ${row.template_id}</li>
          <li><strong>Preview environment:</strong> ${process.env.VERCEL_ENV || 'local'}</li>
          <li><strong>Generated at:</strong> ${createdAt}</li>
        </ul>
        <p style="margin:16px 0 0;font-size:14px;color:#475569">No real business event data.</p>
      </div>
    </div>
  `

  return {
    subject: '[Rozgar Refer & Earn] Email System Test',
    text,
    html,
  }
}

const renderReferralAdminTemplate = (row: ReferralEmailOutboxRow) => {
  if (row.template_id === REFERRAL_EMAIL_OUTBOX_TEST_TEMPLATE_ID) {
    return buildAdminTestMessage(row)
  }

  if (row.template_id === REFERRAL_JOINED_ADMIN_TEMPLATE_ID) {
    return buildAdminEventMessage({
      subject: '[Rozgar Refer & Earn] New Referral Joined',
      heading: 'New Referral Joined',
      intro: 'A new referred worker has completed registration on Rozgar.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Worker Name', row.payload_json.worker_name],
        ['Worker Mobile', row.payload_json.worker_mobile],
        ['Category', row.payload_json.category_name],
        ['City', row.payload_json.worker_city],
        ['Joined At', formatDisplayTimestamp(row.payload_json.joined_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_QUALIFIED_ADMIN_TEMPLATE_ID) {
    return buildAdminEventMessage({
      subject: '[Rozgar Refer & Earn] Referral Qualified',
      heading: 'Referral Qualified',
      intro: 'A referred worker has qualified after KYC approval.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Worker Name', row.payload_json.worker_name],
        ['Worker Mobile', row.payload_json.worker_mobile],
        ['Category', row.payload_json.category_name],
        ['Qualification Status', row.payload_json.qualification_status],
        ['Qualified At', formatDisplayTimestamp(row.payload_json.qualified_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_REWARD_CREDITED_ADMIN_TEMPLATE_ID) {
    const rewardAmount = formatCurrencyAmount(row.payload_json.reward_amount)
    const subjectAmount = rewardAmount ? `\u20B9${rewardAmount}` : ''

    return buildAdminEventMessage({
      subject: `[Rozgar Refer & Earn] Reward Credited \u2014 ${subjectAmount}`,
      heading: 'Reward Credited',
      intro: 'A referral reward has been credited and is now available in Refer & Earn.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Worker Name', row.payload_json.worker_name],
        ['Worker Mobile', row.payload_json.worker_mobile],
        ['Category', row.payload_json.category_name],
        ['Reward Amount', rewardAmount ? `\u20B9${rewardAmount}` : ''],
        [
          'Available Balance',
          Number.isFinite(Number(row.payload_json.available_balance || 0))
            ? `\u20B9${formatCurrencyAmount(row.payload_json.available_balance)}`
            : '',
        ],
        ['Credited At', formatDisplayTimestamp(row.payload_json.credited_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_PAYOUT_DETAILS_ADDED_ADMIN_TEMPLATE_ID) {
    return buildAdminEventMessage({
      subject: '[Rozgar Refer & Earn] Payout Details Added',
      heading: 'Payout Details Added',
      intro: 'An agent has added payout details for Refer & Earn withdrawals.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Change', row.payload_json.change_label],
        ['Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        ['Saved At', formatDisplayTimestamp(row.payload_json.saved_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_PAYOUT_DETAILS_CHANGED_ADMIN_TEMPLATE_ID) {
    return buildAdminEventMessage({
      subject: '[Rozgar Refer & Earn] Payout Details Changed',
      heading: 'Payout Details Changed',
      intro: 'An agent has changed payout details for Refer & Earn withdrawals.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Change', row.payload_json.change_label],
        ['Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        ['Previous Preferred Method', row.payload_json.previous_preferred_method],
        ['New Preferred Method', row.payload_json.new_preferred_method],
        ['Changed At', formatDisplayTimestamp(row.payload_json.changed_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_WITHDRAWAL_REQUESTED_ADMIN_TEMPLATE_ID) {
    const amount = formatCurrencyAmount(row.payload_json.amount)
    return buildAdminEventMessage({
      subject: `[Rozgar Refer & Earn] Withdrawal Requested — ₹${amount}`,
      heading: 'Withdrawal Requested',
      intro: 'A new Refer & Earn withdrawal request is ready for Admin review.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Amount', amount ? `₹${amount}` : ''],
        ['Payout Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        [
          'Available Balance',
          Number.isFinite(Number(row.payload_json.available_balance))
            ? `₹${formatCurrencyAmount(row.payload_json.available_balance)}`
            : '',
        ],
        [
          'Reserved Amount',
          Number.isFinite(Number(row.payload_json.reserved_amount))
            ? `₹${formatCurrencyAmount(row.payload_json.reserved_amount)}`
            : '',
        ],
        ['Requested At', formatDisplayTimestamp(row.payload_json.requested_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_WITHDRAWAL_APPROVED_ADMIN_TEMPLATE_ID) {
    const amount = formatCurrencyAmount(row.payload_json.amount)
    return buildAdminEventMessage({
      subject: `[Rozgar Refer & Earn] Withdrawal Approved — ₹${amount}`,
      heading: 'Withdrawal Approved',
      intro: 'A Refer & Earn withdrawal request has been approved and is awaiting payment.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Amount', amount ? `₹${amount}` : ''],
        ['Payout Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        ['Status', row.payload_json.status_text],
        ['Approved At', formatDisplayTimestamp(row.payload_json.approved_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_WITHDRAWAL_REJECTED_ADMIN_TEMPLATE_ID) {
    const amount = formatCurrencyAmount(row.payload_json.amount)
    return buildAdminEventMessage({
      subject: `[Rozgar Refer & Earn] Withdrawal Rejected — ₹${amount}`,
      heading: 'Withdrawal Rejected',
      intro: 'A Refer & Earn withdrawal request has been rejected.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Amount', amount ? `₹${amount}` : ''],
        ['Payout Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        ['Rejection Reason', row.payload_json.rejection_reason],
        ['Rejected At', formatDisplayTimestamp(row.payload_json.rejected_at)],
      ],
    })
  }

  if (row.template_id === REFERRAL_WITHDRAWAL_PAID_ADMIN_TEMPLATE_ID) {
    const amount = formatCurrencyAmount(row.payload_json.amount)
    return buildAdminEventMessage({
      subject: `[Rozgar Refer & Earn] Withdrawal Paid — ₹${amount}`,
      heading: 'Withdrawal Paid',
      intro: 'A Refer & Earn withdrawal has been paid successfully.',
      summaryPairs: [
        ['Agent Name', row.payload_json.agent_name],
        ['Agent Mobile', row.payload_json.agent_mobile],
        ['Referral Code', row.payload_json.referral_code],
        ['Amount', amount ? `₹${amount}` : ''],
        ['Payout Method', row.payload_json.payout_method],
        ['Masked Destination', row.payload_json.masked_destination],
        ['Payment Reference', row.payload_json.payment_reference],
        ['Paid At', formatDisplayTimestamp(row.payload_json.paid_at)],
      ],
    })
  }

  return null
}

const markProcessingRow = async (
  rowId: string,
  update: Partial<ReferralEmailOutboxRow>,
) => {
  const { error } = await supabaseAdmin
    .from(OUTBOX_TABLE)
    .update({
      ...update,
      updated_at: nowIso(),
    })
    .eq('id', rowId)
    .eq('status', 'processing')

  if (error) {
    throw new Error(error.message)
  }
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
  if (statusCode !== 400 && statusCode !== 422) {
    return false
  }

  return (
    message.includes('invalid') &&
    (message.includes('email') || message.includes('recipient'))
  )
}

const claimReferralAdminEmailOutboxRows = async (limit = MAX_BATCH_SIZE) => {
  const boundedLimit = Math.min(Math.max(Math.round(Number(limit || 0)), 1), MAX_BATCH_SIZE)
  const { data, error } = await supabaseAdmin.rpc(CLAIM_RPC, {
    p_limit: boundedLimit,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as ReferralEmailOutboxRow[]
}

const finalizeRetry = async (
  row: ReferralEmailOutboxRow,
  safeErrorCode: string,
  safeErrorMessage: string,
) => {
  if (row.attempt_count >= MAX_ATTEMPTS) {
    await markProcessingRow(row.id, {
      status: 'failed',
      next_attempt_at: null,
      processing_started_at: null,
      last_error_code: safeErrorCode,
      last_error_message_safe: safeErrorMessage,
    })

    return 'failed' as const
  }

  const delayMs = getRetryDelayMs(row.attempt_count)
  await markProcessingRow(row.id, {
    status: 'pending',
    next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
    processing_started_at: null,
    last_error_code: safeErrorCode,
    last_error_message_safe: safeErrorMessage,
  })

  return 'retried' as const
}

const processClaimedRow = async (row: ReferralEmailOutboxRow) => {
  const message = renderReferralAdminTemplate(row)

  if (!message) {
    await markProcessingRow(row.id, {
      status: 'skipped',
      processing_started_at: null,
      last_error_code: 'unknown-template',
      last_error_message_safe: 'No renderer is configured for this template.',
    })
    return 'skipped' as const
  }

  const result = await sendResendAdminNotification({
    recipient: row.recipient_email,
    subject: message.subject,
    text: message.text,
    html: message.html,
    idempotencyKey: row.event_key,
  })

  if (result.delivered) {
    await markProcessingRow(row.id, {
      status: 'sent',
      sent_at: nowIso(),
      processing_started_at: null,
      provider_message_id: normalizeText(result.providerMessageId),
      last_error_code: null,
      last_error_message_safe: null,
      next_attempt_at: null,
    })
    return 'sent' as const
  }

  if (result.skipped) {
    await markProcessingRow(row.id, {
      status: 'skipped',
      processing_started_at: null,
      last_error_code: normalizeText(result.safeErrorCode || 'mail-not-configured'),
      last_error_message_safe: normalizeText(
        result.safeErrorMessage || 'Resend sender is not configured.',
      ),
      next_attempt_at: null,
    })
    return 'skipped' as const
  }

  const safeErrorCode = normalizeText(result.safeErrorCode || 'provider-error')
  const safeErrorMessage = normalizeText(
    result.safeErrorMessage || 'Provider request failed.',
  )

  if (isClearlyPermanentRecipientFailure(result.statusCode, safeErrorMessage)) {
    await markProcessingRow(row.id, {
      status: 'failed',
      next_attempt_at: null,
      processing_started_at: null,
      last_error_code: safeErrorCode,
      last_error_message_safe: safeErrorMessage,
    })
    return 'failed' as const
  }

  return finalizeRetry(row, safeErrorCode, safeErrorMessage)
}

export const processReferralAdminEmailOutboxBatch = async (limit = MAX_BATCH_SIZE) => {
  const claimedRows = await claimReferralAdminEmailOutboxRows(limit)
  const counts: ProcessReferralEmailOutboxCounts = {
    claimed: claimedRows.length,
    sent: 0,
    retried: 0,
    failed: 0,
    skipped: 0,
  }

  for (const row of claimedRows) {
    const outcome = await processClaimedRow(row)
    counts[outcome] += 1
  }

  return counts
}
