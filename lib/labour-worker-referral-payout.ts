import { supabaseAdmin } from './supabase-admin'
import {
  decryptReferralPayoutValue,
  encryptReferralPayoutValue,
  getReferralPayoutEncryptionVersion,
  maskReferralBankAccount,
  maskReferralUpiId,
} from './labour-worker-referral-payout-crypto'
import {
  enqueueReferralPayoutDetailsAddedAdminEmail,
  enqueueReferralPayoutDetailsChangedAdminEmail,
} from './labour-worker-referral-email-outbox'

const PAYOUT_TABLE = 'worker_referral_payout_accounts'
const PAYOUT_AUDIT_TABLE = 'worker_referral_payout_account_audit'
const DEFAULT_PAYOUT_AUDIT_ACTOR = 'worker-app'

export type LabourWorkerReferralPayoutMethod = 'bank' | 'upi'

export type LabourWorkerReferralPayoutBankSummary = {
  configured: boolean
  accountHolderName: string
  maskedAccountNumber: string
  ifsc: string
}

export type LabourWorkerReferralPayoutUpiSummary = {
  configured: boolean
  maskedUpiId: string
}

type LabourWorkerReferralPayoutAuditAction = 'create' | 'update' | 'replace'

export type LabourWorkerReferralPayoutAccount = {
  id: string
  workerId: string
  method: LabourWorkerReferralPayoutMethod
  preferredMethod: LabourWorkerReferralPayoutMethod | null
  bank: LabourWorkerReferralPayoutBankSummary
  upi: LabourWorkerReferralPayoutUpiSummary
  accountHolderName: string
  maskedAccountNumber: string
  ifsc: string
  maskedUpiId: string
  updatedAt: string
}

type LabourWorkerReferralPayoutRow = {
  id: string
  worker_id: string
  method: LabourWorkerReferralPayoutMethod
  preferred_method: LabourWorkerReferralPayoutMethod | null
  account_holder_name: string
  account_number_ciphertext: string
  account_number_last4: string
  ifsc: string
  upi_id_ciphertext: string
  upi_id_masked: string
  encryption_version: string
  created_at: string
  updated_at: string
}

export class LabourWorkerReferralPayoutError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode = 400) {
    super(message)
    this.name = 'LabourWorkerReferralPayoutError'
    this.code = code
    this.statusCode = statusCode
  }
}

export type LabourWorkerReferralPayoutBankInput = {
  method: 'bank'
  accountHolderName: string
  accountNumber: string
  ifsc: string
}

export type LabourWorkerReferralPayoutUpiInput = {
  method: 'upi'
  upiId: string
}

export type LabourWorkerReferralPayoutSaveInput =
  | LabourWorkerReferralPayoutBankInput
  | LabourWorkerReferralPayoutUpiInput

type LabourWorkerReferralPayoutAuditRecord = {
  id: string
  payoutAccountId: string
  workerId: string
  action: LabourWorkerReferralPayoutAuditAction
  method: LabourWorkerReferralPayoutMethod
  maskedDestination: string
  actor: string
  createdAt: string
}

type LabourWorkerReferralPayoutChangeNotification =
  | {
      kind: 'added'
      label: string
      method: LabourWorkerReferralPayoutMethod
      maskedDestination: string
    }
  | {
      kind: 'changed'
      label: string
      method: LabourWorkerReferralPayoutMethod
      maskedDestination: string
      previousPreferredMethod: LabourWorkerReferralPayoutMethod | null
      newPreferredMethod: LabourWorkerReferralPayoutMethod
    }

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const normalizeText = (value: unknown) => String(value || '').trim()

const normalizeBankAccountHolderName = (value: unknown) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')

const normalizeBankAccountNumber = (value: unknown) =>
  String(value || '').replace(/[\s-]+/g, '')

const normalizeIfsc = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

const normalizeUpiId = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()

const normalizePayoutMethod = (
  value: unknown,
): LabourWorkerReferralPayoutMethod | null => {
  const nextValue = normalizeText(value)
  if (nextValue === 'bank' || nextValue === 'upi') return nextValue
  return null
}

const formatPayoutMethodLabel = (method: LabourWorkerReferralPayoutMethod) =>
  method === 'bank' ? 'Bank Account' : 'UPI'

const hasConfiguredBankFields = (
  row: Pick<
    LabourWorkerReferralPayoutRow,
    | 'account_holder_name'
    | 'account_number_ciphertext'
    | 'account_number_last4'
    | 'ifsc'
  >,
) =>
  normalizeBankAccountHolderName(row.account_holder_name).length >= 2 &&
  normalizeText(row.account_number_ciphertext).length > 0 &&
  /^\d{4}$/.test(normalizeText(row.account_number_last4)) &&
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizeIfsc(row.ifsc))

const hasConfiguredUpiFields = (
  row: Pick<LabourWorkerReferralPayoutRow, 'upi_id_ciphertext' | 'upi_id_masked'>,
) =>
  normalizeText(row.upi_id_ciphertext).length > 0 &&
  normalizeText(row.upi_id_masked).length > 0

const getConfiguredPreferredMethod = (
  row: LabourWorkerReferralPayoutRow | null,
): LabourWorkerReferralPayoutMethod | null => {
  if (!row) return null

  const preferredMethod = normalizePayoutMethod(row.preferred_method)
  const method = normalizePayoutMethod(row.method)
  const bankConfigured = hasConfiguredBankFields(row)
  const upiConfigured = hasConfiguredUpiFields(row)

  if (preferredMethod === 'bank' && bankConfigured) return preferredMethod
  if (preferredMethod === 'upi' && upiConfigured) return preferredMethod
  if (method === 'bank' && bankConfigured) return method
  if (method === 'upi' && upiConfigured) return method
  return null
}

const safeDecryptReferralPayoutValue = (value: string) => {
  const normalized = normalizeText(value)
  if (!normalized) return ''

  try {
    return decryptReferralPayoutValue(normalized)
  } catch {
    return ''
  }
}

const classifyBankPayoutNotification = (
  existing: LabourWorkerReferralPayoutRow | null,
  normalized: ReturnType<typeof validateBankInput>,
): LabourWorkerReferralPayoutChangeNotification | null => {
  const maskedDestination = maskReferralBankAccount(normalized.accountNumber)
  const hadExistingPayout =
    existing
      ? hasConfiguredBankFields(existing) || hasConfiguredUpiFields(existing)
      : false

  if (!hadExistingPayout) {
    return {
      kind: 'added',
      label: 'Bank Account Added',
      method: 'bank',
      maskedDestination,
    }
  }

  const previousPreferredMethod = getConfiguredPreferredMethod(existing)
  const bankConfigured = existing ? hasConfiguredBankFields(existing) : false
  const previousAccountNumber = existing
    ? safeDecryptReferralPayoutValue(existing.account_number_ciphertext)
    : ''
  const bankValueChanged =
    !bankConfigured ||
    normalizeBankAccountHolderName(existing?.account_holder_name) !== normalized.accountHolderName ||
    normalizeIfsc(existing?.ifsc) !== normalized.ifsc ||
    previousAccountNumber !== normalized.accountNumber
  const preferredChanged = previousPreferredMethod !== 'bank'

  if (!bankValueChanged && !preferredChanged) {
    return null
  }

  return {
    kind: 'changed',
    label: bankValueChanged
      ? bankConfigured
        ? 'Bank Account Changed'
        : 'Bank Account Added'
      : 'Preferred Method Changed to Bank Account',
    method: 'bank',
    maskedDestination,
    previousPreferredMethod,
    newPreferredMethod: 'bank',
  }
}

const classifyUpiPayoutNotification = (
  existing: LabourWorkerReferralPayoutRow | null,
  normalized: ReturnType<typeof validateUpiInput>,
): LabourWorkerReferralPayoutChangeNotification | null => {
  const maskedDestination = maskReferralUpiId(normalized.upiId)
  const hadExistingPayout =
    existing
      ? hasConfiguredBankFields(existing) || hasConfiguredUpiFields(existing)
      : false

  if (!hadExistingPayout) {
    return {
      kind: 'added',
      label: 'UPI Added',
      method: 'upi',
      maskedDestination,
    }
  }

  const previousPreferredMethod = getConfiguredPreferredMethod(existing)
  const upiConfigured = existing ? hasConfiguredUpiFields(existing) : false
  const previousUpiId = existing
    ? safeDecryptReferralPayoutValue(existing.upi_id_ciphertext)
    : ''
  const upiValueChanged = !upiConfigured || previousUpiId !== normalized.upiId
  const preferredChanged = previousPreferredMethod !== 'upi'

  if (!upiValueChanged && !preferredChanged) {
    return null
  }

  return {
    kind: 'changed',
    label: upiValueChanged
      ? upiConfigured
        ? 'UPI Changed'
        : 'UPI Added'
      : 'Preferred Method Changed to UPI',
    method: 'upi',
    maskedDestination,
    previousPreferredMethod,
    newPreferredMethod: 'upi',
  }
}

const assertWorkerExists = async (workerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('id')
    .eq('id', workerId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new LabourWorkerReferralPayoutError(
      'Worker account was not found.',
      'worker-not-found',
      404,
    )
  }
}

const rowToPayoutAccount = (
  row: LabourWorkerReferralPayoutRow,
): LabourWorkerReferralPayoutAccount => {
  const bankConfigured = hasConfiguredBankFields(row)
  const upiConfigured = hasConfiguredUpiFields(row)
  const preferredMethod = normalizePayoutMethod(row.preferred_method)
  const legacyMethod = normalizePayoutMethod(row.method)
  const activeMethod =
    (preferredMethod === 'bank' && bankConfigured) ||
    (preferredMethod === 'upi' && upiConfigured)
      ? preferredMethod
      : (legacyMethod === 'bank' && bankConfigured) ||
          (legacyMethod === 'upi' && upiConfigured)
        ? legacyMethod
        : bankConfigured
          ? 'bank'
          : 'upi'

  const bank: LabourWorkerReferralPayoutBankSummary = {
    configured: bankConfigured,
    accountHolderName: bankConfigured
      ? normalizeBankAccountHolderName(row.account_holder_name)
      : '',
    maskedAccountNumber:
      bankConfigured && row.account_number_last4
        ? maskReferralBankAccount(row.account_number_last4)
        : '',
    ifsc: bankConfigured ? normalizeIfsc(row.ifsc) : '',
  }

  const upi: LabourWorkerReferralPayoutUpiSummary = {
    configured: upiConfigured,
    maskedUpiId: upiConfigured ? normalizeText(row.upi_id_masked) : '',
  }

  return {
    id: normalizeText(row.id),
    workerId: normalizeText(row.worker_id),
    method: activeMethod,
    preferredMethod:
      preferredMethod && preferredMethod === activeMethod ? preferredMethod : activeMethod,
    bank,
    upi,
    accountHolderName: activeMethod === 'bank' ? bank.accountHolderName : '',
    maskedAccountNumber: activeMethod === 'bank' ? bank.maskedAccountNumber : '',
    ifsc: activeMethod === 'bank' ? bank.ifsc : '',
    maskedUpiId: activeMethod === 'upi' ? upi.maskedUpiId : '',
    updatedAt: normalizeText(row.updated_at),
  }
}

const validateBankInput = (input: LabourWorkerReferralPayoutBankInput) => {
  const accountHolderName = normalizeBankAccountHolderName(input.accountHolderName)
  const accountNumber = normalizeBankAccountNumber(input.accountNumber)
  const ifsc = normalizeIfsc(input.ifsc)

  if (accountHolderName.length < 2) {
    throw new LabourWorkerReferralPayoutError(
      'Account holder name is required.',
      'account-holder-required',
    )
  }

  if (!/^\d{6,20}$/.test(accountNumber)) {
    throw new LabourWorkerReferralPayoutError(
      'Enter a valid bank account number.',
      'invalid-account-number',
    )
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    throw new LabourWorkerReferralPayoutError(
      'Enter a valid IFSC code.',
      'invalid-ifsc',
    )
  }

  return {
    accountHolderName,
    accountNumber,
    ifsc,
  }
}

const validateUpiInput = (input: LabourWorkerReferralPayoutUpiInput) => {
  const upiId = normalizeUpiId(input.upiId)

  if (!/^[a-z0-9.\-_]{2,}@[a-z][a-z0-9.\-_]{1,}$/i.test(upiId)) {
    throw new LabourWorkerReferralPayoutError(
      'Enter a valid UPI ID.',
      'invalid-upi-id',
    )
  }

  return { upiId }
}

const writePayoutAudit = async ({
  payoutAccountId,
  workerId,
  action,
  method,
  maskedDestination,
  actor = DEFAULT_PAYOUT_AUDIT_ACTOR,
}: {
  payoutAccountId: string
  workerId: string
  action: LabourWorkerReferralPayoutAuditAction
  method: LabourWorkerReferralPayoutMethod
  maskedDestination: string
  actor?: string
}) => {
  const createdAt = new Date().toISOString()
  const auditRecord: LabourWorkerReferralPayoutAuditRecord = {
    id: createId('ref-payout-audit'),
    payoutAccountId,
    workerId,
    action,
    method,
    maskedDestination,
    actor: actor || DEFAULT_PAYOUT_AUDIT_ACTOR,
    createdAt,
  }

  const { error } = await supabaseAdmin.from(PAYOUT_AUDIT_TABLE).insert({
    id: auditRecord.id,
    payout_account_id: payoutAccountId,
    worker_id: workerId,
    action,
    method,
    masked_destination: maskedDestination,
    actor: auditRecord.actor,
    created_at: createdAt,
  })

  if (error) {
    throw error
  }

  return auditRecord
}

const getExistingPayoutRow = async (
  workerId: string,
): Promise<LabourWorkerReferralPayoutRow | null> => {
  const { data, error } = await supabaseAdmin
    .from(PAYOUT_TABLE)
    .select('*')
    .eq('worker_id', workerId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as LabourWorkerReferralPayoutRow | null) || null
}

export const getWorkerReferralPayoutAccount = async (
  workerId: string,
): Promise<LabourWorkerReferralPayoutAccount | null> => {
  const existing = await getExistingPayoutRow(workerId)
  return existing ? rowToPayoutAccount(existing) : null
}

export const saveWorkerReferralPayoutAccount = async (
  workerId: string,
  input: LabourWorkerReferralPayoutSaveInput,
  options?: { actor?: string },
): Promise<LabourWorkerReferralPayoutAccount> => {
  await assertWorkerExists(workerId)

  const existing = await getExistingPayoutRow(workerId)
  const timestamp = new Date().toISOString()
  const id = existing?.id || createId('ref-payout')
  const baseRow = {
    id,
    worker_id: workerId,
    method: input.method,
    preferred_method: input.method,
    encryption_version: getReferralPayoutEncryptionVersion(),
    created_at: existing?.created_at || timestamp,
    updated_at: timestamp,
  }

  let row: Record<string, unknown>
  let maskedDestination = ''
  let changeNotification: LabourWorkerReferralPayoutChangeNotification | null = null

  if (input.method === 'bank') {
    const normalized = validateBankInput(input)
    maskedDestination = maskReferralBankAccount(normalized.accountNumber)
    changeNotification = classifyBankPayoutNotification(existing, normalized)
    row = {
      ...baseRow,
      upi_id_ciphertext: existing?.upi_id_ciphertext || '',
      upi_id_masked: existing?.upi_id_masked || '',
      account_holder_name: normalized.accountHolderName,
      account_number_ciphertext: encryptReferralPayoutValue(
        normalized.accountNumber,
      ),
      account_number_last4: normalized.accountNumber.slice(-4),
      ifsc: normalized.ifsc,
    }
  } else {
    const normalized = validateUpiInput(input)
    maskedDestination = maskReferralUpiId(normalized.upiId)
    changeNotification = classifyUpiPayoutNotification(existing, normalized)
    row = {
      ...baseRow,
      account_holder_name: existing?.account_holder_name || '',
      account_number_ciphertext: existing?.account_number_ciphertext || '',
      account_number_last4: existing?.account_number_last4 || '',
      ifsc: existing?.ifsc || '',
      upi_id_ciphertext: encryptReferralPayoutValue(normalized.upiId),
      upi_id_masked: maskedDestination,
    }
  }

  const { data, error } = await supabaseAdmin
    .from(PAYOUT_TABLE)
    .upsert(row, { onConflict: 'worker_id' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const payoutAccount = rowToPayoutAccount(data as LabourWorkerReferralPayoutRow)

  const payoutAudit = await writePayoutAudit({
    payoutAccountId: id,
    workerId,
    action: !existing ? 'create' : 'update',
    method: input.method,
    maskedDestination,
    actor: options?.actor,
  })

  if (changeNotification) {
    try {
      if (changeNotification.kind === 'added') {
        await enqueueReferralPayoutDetailsAddedAdminEmail({
          workerId,
          payoutAuditId: payoutAudit.id,
          method: changeNotification.method,
          methodLabel: changeNotification.label,
          maskedDestination: changeNotification.maskedDestination,
          savedAt: payoutAudit.createdAt,
        })
      } else {
        await enqueueReferralPayoutDetailsChangedAdminEmail({
          workerId,
          payoutAuditId: payoutAudit.id,
          method: changeNotification.method,
          methodLabel: changeNotification.label,
          maskedDestination: changeNotification.maskedDestination,
          changedAt: payoutAudit.createdAt,
          previousPreferredMethod: changeNotification.previousPreferredMethod,
          newPreferredMethod: changeNotification.newPreferredMethod,
        })
      }
    } catch (error) {
      console.error('Failed to enqueue referral payout admin email', {
        workerId,
        payoutAuditId: payoutAudit.id,
        notificationKind: changeNotification.kind,
        payoutMethod: formatPayoutMethodLabel(changeNotification.method),
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return payoutAccount
}
