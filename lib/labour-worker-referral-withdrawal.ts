import { buildReferralDashboard } from './labour-referral-dashboard'
import {
  formatReferralMinimumWithdrawal,
  getMinimumWithdrawalAmount,
} from './labour-referral-settings'
import { getReferralProfileForWorker } from './labour-worker-referral'
import {
  enqueueReferralWithdrawalApprovedAdminEmail,
  enqueueReferralWithdrawalPaidAdminEmail,
  enqueueReferralWithdrawalRejectedAdminEmail,
  enqueueReferralWithdrawalRequestedAdminEmail,
} from './labour-worker-referral-email-outbox'
import {
  getWorkerReferralPayoutAccount,
  type LabourWorkerReferralPayoutAccount,
  type LabourWorkerReferralPayoutMethod,
} from './labour-worker-referral-payout'
import { decryptReferralPayoutValue } from './labour-worker-referral-payout-crypto'
import { supabaseAdmin } from './supabase-admin'

const WITHDRAWAL_TABLE = 'worker_referral_withdrawal_requests'
const OPEN_WITHDRAWAL_STATUSES = ['requested', 'approved', 'processing'] as const

export type LabourWorkerReferralWithdrawalStatus =
  | 'requested'
  | 'approved'
  | 'processing'
  | 'paid'
  | 'rejected'
  | 'failed'
  | 'cancelled'

export type LabourWorkerReferralWithdrawalHistoryItem = {
  id: string
  amount: number
  payoutMethod: LabourWorkerReferralPayoutMethod
  maskedDestination: string
  status: LabourWorkerReferralWithdrawalStatus
  requestedAt: string
  approvedAt: string
  rejectedAt: string
  rejectionReason: string
  paidAt: string
  createdAt: string
  updatedAt: string
}

export type LabourWorkerReferralWithdrawalOverview = {
  availableBalance: number
  reservedBalance: number
  withdrawableBalance: number
  minimumWithdrawal: number
  kycApproved: boolean
  activeAgent: boolean
  payoutAccount: LabourWorkerReferralPayoutAccount | null
  bankConfigured: boolean
  upiConfigured: boolean
  existingOpenRequest: LabourWorkerReferralWithdrawalHistoryItem | null
  history: LabourWorkerReferralWithdrawalHistoryItem[]
  canRequest: boolean
  eligibilityCode: string | null
  eligibilityMessage: string
}

export class LabourWorkerReferralWithdrawalError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode = 400) {
    super(message)
    this.name = 'LabourWorkerReferralWithdrawalError'
    this.code = code
    this.statusCode = statusCode
  }
}

export type AdminReferralWithdrawalPaymentDetails = {
  requestId: string
  amount: number
  payoutMethod: LabourWorkerReferralPayoutMethod
  maskedDestination: string
  approvedAt: string
  bank:
    | {
        accountHolderName: string
        accountNumber: string
        ifsc: string
      }
    | null
  upi:
    | {
        upiId: string
      }
    | null
}

export type AdminReferralWithdrawalItem = {
  id: string
  workerId: string
  agentName: string
  mobile: string
  referralCode: string
  kycStatus: string
  amount: number
  payoutMethod: LabourWorkerReferralPayoutMethod
  maskedDestination: string
  status: LabourWorkerReferralWithdrawalStatus
  requestedAt: string
  approvedAt: string
  rejectedAt: string
  rejectionReason: string
  paidAt: string
  paymentReference: string
  createdAt: string
  updatedAt: string
}

export type AdminReferralWithdrawalSummary = {
  requestedCount: number
  approvedCount: number
  paidCount: number
  rejectedCount: number
  totalRequestedAmount: number
  totalApprovedAmount: number
  totalPaidAmount: number
}

type AdminReferralWithdrawalSnapshot = {
  withdrawals: AdminReferralWithdrawalItem[]
  summary: AdminReferralWithdrawalSummary
}

type LabourWorkerReferralWithdrawalRow = {
  id: string
  worker_id: string
  amount: number
  payout_method: LabourWorkerReferralPayoutMethod
  payout_account_id: string
  masked_destination: string
  status: LabourWorkerReferralWithdrawalStatus
  requested_at: string
  approved_at: string | null
  rejected_at: string | null
  paid_at: string | null
  rejection_reason: string | null
  payment_reference: string | null
  encrypted_destination_snapshot?: unknown
  created_at: string
  updated_at: string
}

type CreateWithdrawalRpcResult = {
  success: boolean
  code?: string
  message?: string
  withdrawalId?: string
  availableBalance?: number
  reservedBalance?: number
  withdrawableBalance?: number
}

type ReviewWithdrawalRpcResult = {
  success: boolean
  code?: string
  message?: string
  withdrawal?: LabourWorkerReferralWithdrawalRow | null
}

type MarkPaidWithdrawalRpcResult = {
  success: boolean
  code?: string
  message?: string
  withdrawal?: LabourWorkerReferralWithdrawalRow | null
  balanceAfter?: number
}

const roundCurrency = (value: number) => Math.round(Number(value || 0) * 100) / 100

const normalizeText = (value: unknown) => String(value || '').trim()

const normalizeWithdrawalMethod = (
  value: unknown,
): LabourWorkerReferralPayoutMethod | null => {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'bank' || normalized === 'upi') return normalized
  return null
}

const parseWithdrawalAmount = (value: unknown) => {
  const amount = roundCurrency(Number(value || 0))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new LabourWorkerReferralWithdrawalError(
      'Enter a valid withdrawal amount.',
      'invalid-withdrawal-amount',
    )
  }
  return amount
}

const rowToWithdrawalHistoryItem = (
  row: LabourWorkerReferralWithdrawalRow,
): LabourWorkerReferralWithdrawalHistoryItem => ({
  id: normalizeText(row.id),
  amount: roundCurrency(row.amount),
  payoutMethod: row.payout_method,
  maskedDestination: normalizeText(row.masked_destination),
  status: row.status,
  requestedAt: normalizeText(row.requested_at),
  approvedAt: normalizeText(row.approved_at),
  rejectedAt: normalizeText(row.rejected_at),
  rejectionReason: normalizeText(row.rejection_reason),
  paidAt: normalizeText(row.paid_at),
  createdAt: normalizeText(row.created_at),
  updatedAt: normalizeText(row.updated_at),
})

const mapAdminSummary = (
  withdrawals: AdminReferralWithdrawalItem[],
): AdminReferralWithdrawalSummary => ({
  requestedCount: withdrawals.filter(item => item.status === 'requested').length,
  approvedCount: withdrawals.filter(item => item.status === 'approved').length,
  paidCount: withdrawals.filter(item => item.status === 'paid').length,
  rejectedCount: withdrawals.filter(item => item.status === 'rejected').length,
  totalRequestedAmount: roundCurrency(
    withdrawals.reduce(
      (sum, item) => (item.status === 'requested' ? sum + item.amount : sum),
      0,
    ),
  ),
  totalApprovedAmount: roundCurrency(
    withdrawals.reduce(
      (sum, item) => (item.status === 'approved' ? sum + item.amount : sum),
      0,
    ),
  ),
  totalPaidAmount: roundCurrency(
    withdrawals.reduce(
      (sum, item) => (item.status === 'paid' ? sum + item.amount : sum),
      0,
    ),
  ),
})

const readWorkerKycStatus = async (workerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('id, kyc_status')
    .eq('id', workerId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new LabourWorkerReferralWithdrawalError(
      'Worker account was not found.',
      'worker-not-found',
      404,
    )
  }

  return normalizeText((data as { kyc_status?: string | null }).kyc_status)
}

const readWithdrawalRows = async (
  workerId: string,
): Promise<LabourWorkerReferralWithdrawalHistoryItem[]> => {
  const { data, error } = await supabaseAdmin
    .from(WITHDRAWAL_TABLE)
    .select(
      'id, amount, payout_method, masked_destination, status, requested_at, approved_at, rejected_at, rejection_reason, paid_at, created_at, updated_at',
    )
    .eq('worker_id', workerId)
    .order('requested_at', { ascending: false })

  if (error) {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      String((error as { message?: string }).message || '').includes(WITHDRAWAL_TABLE)
    ) {
      return []
    }
    throw error
  }

  return ((data || []) as LabourWorkerReferralWithdrawalRow[]).map(rowToWithdrawalHistoryItem)
}

const readAllWithdrawalRows = async (): Promise<LabourWorkerReferralWithdrawalRow[]> => {
  const { data, error } = await supabaseAdmin
    .from(WITHDRAWAL_TABLE)
    .select(
      'id, worker_id, amount, payout_method, payout_account_id, masked_destination, status, requested_at, approved_at, rejected_at, rejection_reason, paid_at, payment_reference, created_at, updated_at',
    )
    .order('requested_at', { ascending: false })

  if (error) {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      String((error as { message?: string }).message || '').includes(WITHDRAWAL_TABLE)
    ) {
      return []
    }
    throw error
  }

  return (data || []) as LabourWorkerReferralWithdrawalRow[]
}

const getEligibilityState = ({
  activeAgent,
  kycApproved,
  payoutAccount,
  withdrawableBalance,
  existingOpenRequest,
  minimumWithdrawal,
}: {
  activeAgent: boolean
  kycApproved: boolean
  payoutAccount: LabourWorkerReferralPayoutAccount | null
  withdrawableBalance: number
  existingOpenRequest: LabourWorkerReferralWithdrawalHistoryItem | null
  minimumWithdrawal: number
}) => {
  const bankConfigured = payoutAccount?.bank.configured || false
  const upiConfigured = payoutAccount?.upi.configured || false

  if (!activeAgent) {
    return {
      canRequest: false,
      eligibilityCode: 'referral-profile-inactive',
      eligibilityMessage: 'Refer and Earn is not enabled for this account.',
    }
  }

  if (!kycApproved) {
    return {
      canRequest: false,
      eligibilityCode: 'kyc-required',
      eligibilityMessage: 'Complete KYC approval before requesting withdrawal.',
    }
  }

  if (!bankConfigured && !upiConfigured) {
    return {
      canRequest: false,
      eligibilityCode: 'payout-method-required',
      eligibilityMessage: 'Add Bank or UPI before withdrawal.',
    }
  }

  if (existingOpenRequest) {
    return {
      canRequest: false,
      eligibilityCode: 'open-request-exists',
      eligibilityMessage: 'You already have a withdrawal request under review.',
    }
  }

  if (withdrawableBalance < minimumWithdrawal) {
    return {
      canRequest: false,
      eligibilityCode: 'minimum-withdrawal',
      eligibilityMessage: `Minimum withdrawal is Rs ${formatReferralMinimumWithdrawal(minimumWithdrawal)}.`,
    }
  }

  return {
    canRequest: true,
    eligibilityCode: null,
    eligibilityMessage: '',
  }
}

export const getWorkerReferralWithdrawalOverview = async (
  workerId: string,
): Promise<LabourWorkerReferralWithdrawalOverview> => {
  const [dashboard, profile, payoutAccount, kycStatus, history, minimumWithdrawal] = await Promise.all([
    buildReferralDashboard(workerId),
    getReferralProfileForWorker(workerId),
    getWorkerReferralPayoutAccount(workerId),
    readWorkerKycStatus(workerId),
    readWithdrawalRows(workerId),
    getMinimumWithdrawalAmount(),
  ])

  const activeAgent = Boolean(profile?.isActive && dashboard.enabled)
  const kycApproved = kycStatus === 'approved'
  const availableBalance = roundCurrency(dashboard.earnings.available)
  const reservedBalance = roundCurrency(
    history.reduce((sum, item) => {
      if ((OPEN_WITHDRAWAL_STATUSES as readonly string[]).includes(item.status)) {
        return sum + item.amount
      }
      return sum
    }, 0),
  )
  const withdrawableBalance = roundCurrency(
    Math.max(availableBalance - reservedBalance, 0),
  )
  const existingOpenRequest =
    history.find(item =>
      (OPEN_WITHDRAWAL_STATUSES as readonly string[]).includes(item.status),
    ) || null

  const eligibility = getEligibilityState({
    activeAgent,
    kycApproved,
    payoutAccount,
    withdrawableBalance,
    existingOpenRequest,
    minimumWithdrawal,
  })

  return {
    availableBalance,
    reservedBalance,
    withdrawableBalance,
    minimumWithdrawal,
    kycApproved,
    activeAgent,
    payoutAccount,
    bankConfigured: payoutAccount?.bank.configured || false,
    upiConfigured: payoutAccount?.upi.configured || false,
    existingOpenRequest,
    history,
    canRequest: eligibility.canRequest,
    eligibilityCode: eligibility.eligibilityCode,
    eligibilityMessage: eligibility.eligibilityMessage,
  }
}

export const createWorkerReferralWithdrawalRequest = async (
  workerId: string,
  input: { amount: unknown; payoutMethod: unknown },
) => {
  const payoutMethod = normalizeWithdrawalMethod(input.payoutMethod)
  if (!payoutMethod) {
    throw new LabourWorkerReferralWithdrawalError(
      'Select a valid payout method before requesting withdrawal.',
      'invalid-payout-method',
    )
  }

  const amount = parseWithdrawalAmount(input.amount)

  const { data, error } = (await supabaseAdmin.rpc(
    'create_worker_referral_withdrawal_request',
    {
      p_worker_id: workerId,
      p_amount: amount,
      p_payout_method: payoutMethod,
    },
  )) as { data: CreateWithdrawalRpcResult | null; error: unknown }

  if (error) {
    throw error
  }

  if (!data?.success) {
    throw new LabourWorkerReferralWithdrawalError(
      normalizeText(data?.message) || 'Failed to create withdrawal request.',
      normalizeText(data?.code) || 'withdrawal-request-failed',
      normalizeText(data?.code) === 'worker-not-found' ? 404 : 400,
    )
  }

  const overview = await getWorkerReferralWithdrawalOverview(workerId)
  const withdrawal =
    overview.history.find(item => item.id === normalizeText(data.withdrawalId)) ||
    overview.existingOpenRequest

  if (withdrawal?.id) {
    try {
      await enqueueReferralWithdrawalRequestedAdminEmail({
        requestId: withdrawal.id,
        availableBalance: overview.availableBalance,
        reservedAmount: overview.reservedBalance,
      })
    } catch (error) {
      console.error('Failed to enqueue referral withdrawal requested admin email', {
        workerId,
        requestId: withdrawal.id,
        payoutMethod,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    withdrawal,
    overview,
  }
}

export const getAdminReferralWithdrawals = async (
  filters?: {
    search?: string
    status?: string
    payoutMethod?: string
  },
): Promise<AdminReferralWithdrawalSnapshot> => {
  const [rows, workersResult, profilesResult] = await Promise.all([
    readAllWithdrawalRows(),
    supabaseAdmin
      .from('labour_workers')
      .select('id, full_name, mobile, kyc_status'),
    supabaseAdmin
      .from('worker_referral_profiles')
      .select('worker_id, referral_code'),
  ])

  if (workersResult.error) throw workersResult.error
  if (profilesResult.error) throw profilesResult.error

  const workersById = new Map(
    ((workersResult.data || []) as Array<{
      id?: string | null
      full_name?: string | null
      mobile?: string | null
      kyc_status?: string | null
    }>).map(row => [
      normalizeText(row.id),
      {
        fullName: normalizeText(row.full_name),
        mobile: normalizeText(row.mobile),
        kycStatus: normalizeText(row.kyc_status),
      },
    ]),
  )

  const profileByWorkerId = new Map(
    ((profilesResult.data || []) as Array<{
      worker_id?: string | null
      referral_code?: string | null
    }>).map(row => [normalizeText(row.worker_id), normalizeText(row.referral_code)]),
  )

  const withdrawals = rows.map(row => {
    const workerId = normalizeText(row.worker_id)
    const worker = workersById.get(workerId)

    return {
      id: normalizeText(row.id),
      workerId,
      agentName: worker?.fullName || workerId,
      mobile: worker?.mobile || '',
      referralCode: profileByWorkerId.get(workerId) || '',
      kycStatus: worker?.kycStatus || '',
      amount: roundCurrency(row.amount),
      payoutMethod: row.payout_method,
      maskedDestination: normalizeText(row.masked_destination),
      status: row.status,
      requestedAt: normalizeText(row.requested_at),
      approvedAt: normalizeText(row.approved_at),
      rejectedAt: normalizeText(row.rejected_at),
      rejectionReason: normalizeText(row.rejection_reason),
      paidAt: normalizeText(row.paid_at),
      paymentReference: normalizeText(row.payment_reference),
      createdAt: normalizeText(row.created_at),
      updatedAt: normalizeText(row.updated_at),
    } satisfies AdminReferralWithdrawalItem
  })

  const searchTerm = normalizeText(filters?.search).toLowerCase()
  const statusFilter = normalizeText(filters?.status).toLowerCase()
  const payoutMethodFilter = normalizeText(filters?.payoutMethod).toLowerCase()

  const filteredWithdrawals = withdrawals.filter(item => {
    const matchesSearch =
      !searchTerm ||
      [
        item.id,
        item.agentName,
        item.mobile,
        item.referralCode,
      ].some(value => String(value || '').toLowerCase().includes(searchTerm))
    const matchesStatus =
      !statusFilter || statusFilter === 'all' || item.status === statusFilter
    const matchesMethod =
      !payoutMethodFilter ||
      payoutMethodFilter === 'all' ||
      item.payoutMethod === payoutMethodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  return {
    withdrawals: filteredWithdrawals,
    summary: mapAdminSummary(withdrawals),
  }
}

const readWithdrawalRowById = async (
  requestId: string,
): Promise<LabourWorkerReferralWithdrawalRow | null> => {
  const { data, error } = await supabaseAdmin
    .from(WITHDRAWAL_TABLE)
    .select(
      'id, worker_id, amount, payout_method, payout_account_id, masked_destination, status, requested_at, approved_at, rejected_at, rejection_reason, paid_at, payment_reference, encrypted_destination_snapshot, created_at, updated_at',
    )
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as LabourWorkerReferralWithdrawalRow | null) || null
}

const readWithdrawalSnapshot = (row: LabourWorkerReferralWithdrawalRow) => {
  const snapshot =
    row.encrypted_destination_snapshot &&
    typeof row.encrypted_destination_snapshot === 'object' &&
    !Array.isArray(row.encrypted_destination_snapshot)
      ? (row.encrypted_destination_snapshot as Record<string, unknown>)
      : null

  if (!snapshot) {
    throw new LabourWorkerReferralWithdrawalError(
      'Withdrawal payout snapshot is missing.',
      'withdrawal-snapshot-missing',
      500,
    )
  }

  return snapshot
}

export const getWithdrawalPaymentDetailsForAdmin = async (
  requestId: unknown,
): Promise<AdminReferralWithdrawalPaymentDetails> => {
  const normalizedRequestId = normalizeText(requestId)
  if (!normalizedRequestId) {
    throw new LabourWorkerReferralWithdrawalError(
      'Withdrawal request ID is required.',
      'request-required',
      400,
    )
  }

  const row = await readWithdrawalRowById(normalizedRequestId)
  if (!row) {
    throw new LabourWorkerReferralWithdrawalError(
      'Withdrawal request was not found.',
      'request-not-found',
      404,
    )
  }

  if (row.status !== 'approved') {
    throw new LabourWorkerReferralWithdrawalError(
      'Payment details are available only for approved withdrawals.',
      'payment-details-not-available',
      400,
    )
  }

  const snapshot = readWithdrawalSnapshot(row)
  const payoutMethod = row.payout_method

  if (payoutMethod === 'bank') {
    const accountHolderName = normalizeText(snapshot.accountHolderName)
    const accountNumberCiphertext = normalizeText(snapshot.accountNumberCiphertext)
    const ifsc = normalizeText(snapshot.ifsc).toUpperCase()

    if (!accountHolderName || !accountNumberCiphertext || !ifsc) {
      throw new LabourWorkerReferralWithdrawalError(
        'Stored bank payout snapshot is incomplete.',
        'bank-snapshot-incomplete',
        500,
      )
    }

    return {
      requestId: normalizedRequestId,
      amount: roundCurrency(row.amount),
      payoutMethod,
      maskedDestination: normalizeText(row.masked_destination),
      approvedAt: normalizeText(row.approved_at),
      bank: {
        accountHolderName,
        accountNumber: decryptReferralPayoutValue(accountNumberCiphertext),
        ifsc,
      },
      upi: null,
    }
  }

  const upiIdCiphertext = normalizeText(snapshot.upiIdCiphertext)
  if (!upiIdCiphertext) {
    throw new LabourWorkerReferralWithdrawalError(
      'Stored UPI payout snapshot is incomplete.',
      'upi-snapshot-incomplete',
      500,
    )
  }

  return {
    requestId: normalizedRequestId,
    amount: roundCurrency(row.amount),
    payoutMethod,
    maskedDestination: normalizeText(row.masked_destination),
    approvedAt: normalizeText(row.approved_at),
    bank: null,
    upi: {
      upiId: decryptReferralPayoutValue(upiIdCiphertext),
    },
  }
}

export const markReferralWithdrawalPaid = async (input: {
  requestId: unknown
  paymentReference: unknown
}) => {
  const requestId = normalizeText(input.requestId)
  const paymentReference = normalizeText(input.paymentReference).replace(/\s+/g, ' ')

  if (!requestId) {
    throw new LabourWorkerReferralWithdrawalError(
      'Withdrawal request ID is required.',
      'request-required',
      400,
    )
  }

  if (!paymentReference) {
    throw new LabourWorkerReferralWithdrawalError(
      'Payment reference is required.',
      'payment-reference-required',
      400,
    )
  }

  if (paymentReference.length > 120) {
    throw new LabourWorkerReferralWithdrawalError(
      'Payment reference must be 120 characters or less.',
      'payment-reference-too-long',
      400,
    )
  }

  const { data, error } = (await supabaseAdmin.rpc(
    'mark_worker_referral_withdrawal_paid',
    {
      p_request_id: requestId,
      p_payment_reference: paymentReference,
    },
  )) as { data: MarkPaidWithdrawalRpcResult | null; error: unknown }

  if (error) {
    throw error
  }

  if (!data?.success || !data.withdrawal) {
    throw new LabourWorkerReferralWithdrawalError(
      normalizeText(data?.message) || 'Failed to mark withdrawal paid.',
      normalizeText(data?.code) || 'withdrawal-mark-paid-failed',
      normalizeText(data?.code) === 'request-not-found' ? 404 : 400,
    )
  }

  const snapshot = await getAdminReferralWithdrawals()
  const paidWithdrawal = snapshot.withdrawals.find(item => item.id === requestId) || null

  if (normalizeText(data.withdrawal?.id || requestId)) {
    try {
      await enqueueReferralWithdrawalPaidAdminEmail({
        requestId: normalizeText(data.withdrawal?.id || requestId),
      })
    } catch (error) {
      console.error('Failed to enqueue referral withdrawal paid admin email', {
        requestId,
        paymentReference,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    withdrawal: paidWithdrawal,
    snapshot,
    balanceAfter: roundCurrency(Number(data.balanceAfter || 0)),
  }
}

export const reviewReferralWithdrawal = async (input: {
  requestId: unknown
  action: unknown
  rejectionReason?: unknown
}) => {
  const requestId = normalizeText(input.requestId)
  const action = normalizeText(input.action).toLowerCase()
  const rejectionReason = normalizeText(input.rejectionReason)

  if (!requestId) {
    throw new LabourWorkerReferralWithdrawalError(
      'Withdrawal request ID is required.',
      'request-required',
      400,
    )
  }

  if (action !== 'approve' && action !== 'reject') {
    throw new LabourWorkerReferralWithdrawalError(
      'Select a valid review action.',
      'invalid-action',
      400,
    )
  }

  if (action === 'reject' && !rejectionReason) {
    throw new LabourWorkerReferralWithdrawalError(
      'Rejection reason is required.',
      'rejection-reason-required',
      400,
    )
  }

  if (rejectionReason.length > 500) {
    throw new LabourWorkerReferralWithdrawalError(
      'Rejection reason must be 500 characters or less.',
      'rejection-reason-too-long',
      400,
    )
  }

  const { data, error } = (await supabaseAdmin.rpc(
    'review_worker_referral_withdrawal',
    {
      p_request_id: requestId,
      p_action: action,
      p_rejection_reason: rejectionReason,
    },
  )) as { data: ReviewWithdrawalRpcResult | null; error: unknown }

  if (error) {
    throw error
  }

  if (!data?.success || !data.withdrawal) {
    throw new LabourWorkerReferralWithdrawalError(
      normalizeText(data?.message) || 'Failed to review withdrawal request.',
      normalizeText(data?.code) || 'withdrawal-review-failed',
      normalizeText(data?.code) === 'request-not-found' ? 404 : 400,
    )
  }

  const snapshot = await getAdminReferralWithdrawals()
  const reviewedWithdrawal =
    snapshot.withdrawals.find(item => item.id === requestId) || null

  const successfulRequestId = normalizeText(data.withdrawal?.id || requestId)
  if (successfulRequestId) {
    try {
      if (action === 'approve') {
        await enqueueReferralWithdrawalApprovedAdminEmail({
          requestId: successfulRequestId,
        })
      } else {
        await enqueueReferralWithdrawalRejectedAdminEmail({
          requestId: successfulRequestId,
        })
      }
    } catch (error) {
      console.error('Failed to enqueue referral withdrawal review admin email', {
        requestId: successfulRequestId,
        action,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    withdrawal: reviewedWithdrawal,
    snapshot,
  }
}
