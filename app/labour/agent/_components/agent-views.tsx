'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Gift,
  Headset,
  Info,
  Link2,
  type LucideIcon,
  MessageCircle,
  Phone,
  Scissors,
  Search,
  Share2,
  Shield,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import type { AgentDashboardCategory, AgentDashboardHistoryItem, AgentPageData } from '../_lib/agent-types'
import {
  buildAgentCategoryShareText,
  buildAgentCategoryWhatsappHref,
  buildAgentShareText,
  buildAgentWhatsappHref,
  formatAgentCurrency,
  formatAgentDate,
  getAgentHistoryEffectiveStatus,
} from '../_lib/agent-utils'
import { getAgentCategoryDisplayName } from '../_lib/agent-category-labels'
import styles from '../agent.module.css'
import {
  AgentBrandLockup,
  AgentHeaderControls,
  AgentHeaderIconButton,
  AgentInstallCta,
  AgentLogoutButton,
  useAgentLocale,
} from './agent-chrome'

type DisplayStatus = 'qualified' | 'pending' | 'rejected'
type ReferralHeroCardMode = 'home' | 'earnings'

type AgentPayoutBankSummary = {
  configured: boolean
  accountHolderName: string
  maskedAccountNumber: string
  ifsc: string
}

type AgentPayoutUpiSummary = {
  configured: boolean
  maskedUpiId: string
}

type AgentPayoutAccount = {
  id: string
  workerId: string
  method: 'bank' | 'upi'
  preferredMethod: 'bank' | 'upi' | null
  bank: AgentPayoutBankSummary
  upi: AgentPayoutUpiSummary
  accountHolderName: string
  maskedAccountNumber: string
  ifsc: string
  maskedUpiId: string
  updatedAt: string
}

type AgentWithdrawalHistoryItem = {
  id: string
  amount: number
  payoutMethod: 'bank' | 'upi'
  maskedDestination: string
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled'
  requestedAt: string
  approvedAt: string
  rejectedAt: string
  rejectionReason: string
  paidAt: string
  createdAt: string
  updatedAt: string
}

type AgentWithdrawalOverview = {
  availableBalance: number
  reservedBalance: number
  withdrawableBalance: number
  minimumWithdrawal: number
  kycApproved: boolean
  activeAgent: boolean
  payoutAccount: AgentPayoutAccount | null
  bankConfigured: boolean
  upiConfigured: boolean
  existingOpenRequest: AgentWithdrawalHistoryItem | null
  history: AgentWithdrawalHistoryItem[]
  canRequest: boolean
  eligibilityCode: string | null
  eligibilityMessage: string
}

function getAgentPayoutCopy(locale: 'en' | 'hi') {
  if (locale === 'hi') {
    return {
      title: 'निकासी रिक्वेस्ट',
      withdrawalIntro: 'उपलब्ध referral earnings से withdrawal request भेजें। राशि तुरंत reserve होगी, payment बाद के approval चरण में होगा।',
      availableReferralBalance: 'Available Referral Balance',
      reservedAmount: 'Reserved Amount',
      availableToWithdraw: 'Available To Withdraw',
      minimumWithdrawal: 'Minimum Withdrawal',
      requestFormTitle: 'Request Withdrawal',
      withdrawalAmount: 'Withdrawal Amount',
      payoutMethod: 'Payout Method',
      requestWithdrawal: 'Request Withdrawal',
      requestInProgress: 'Requesting...',
      requestSuccessPrefix: 'Withdrawal requested successfully.',
      withdrawalHistory: 'Withdrawal History',
      noWithdrawalHistory: 'अभी तक कोई withdrawal request नहीं है।',
      requestedStatus: 'Requested',
      openRequestTitle: 'Current Withdrawal Request',
      dateLabel: 'Date',
      amountLabel: 'Amount',
      methodLabel: 'Method',
      statusLabel: 'Status',
      setupHint: 'जरूरत पड़ने पर नीचे Bank या UPI अपडेट कर सकते हैं।',
      savedPayoutAccounts: 'Saved Payout Accounts',
      noPayoutAccountYet: 'अभी तक कोई पेआउट अकाउंट नहीं जोड़ा गया है',
      payoutDetailsTitle: 'पेआउट डिटेल्स',
      payoutDetailsSubtitle: 'Referral withdrawal के लिए इस्तेमाल होने वाले Bank Account और UPI को जोड़ें या मैनेज करें।',
      addPayoutDetails: 'Payout Details जोड़ें',
      managePayoutDetails: 'Payout Details मैनेज करें',
      addPayoutDetailsHint: 'Withdrawal request भेजने से पहले Bank Account या UPI जोड़ें।',
      managePayoutDetailsHint: 'Bank और UPI details सुरक्षित रूप से saved हैं।',
      addPayoutDetailsBeforeWithdrawal: 'Withdrawal request भेजने से पहले payout details जोड़ें।',
      chooseMethod: 'पेआउट मेथड चुनें',
      methodHint: 'Withdrawal request भेजने से पहले सही Bank या UPI method चुनें और verify करें।',
      bank: 'बैंक अकाउंट',
      upi: 'UPI',
      setupBank: 'बैंक अकाउंट सेट अप करें',
      editBank: 'बैंक अकाउंट एडिट करें',
      setupUpi: 'UPI सेट अप करें',
      editUpi: 'UPI एडिट करें',
      accountHolderName: 'Account Holder Name',
      accountNumber: 'Account Number',
      ifsc: 'IFSC Code',
      upiId: 'UPI ID',
      save: 'Save Payout Account',
      editOrSwitch: 'आप बैंक और UPI के बीच कभी भी बदल सकते हैं।',
      edit: 'Edit',
      addBank: 'Add Bank Account',
      addUpi: 'Add UPI',
      currentDefault: 'Current default payout method',
      loading: 'Payout account लोड किया जा रहा है...',
      saveSuccess: 'Payout account successfully saved.',
      bankSaveSuccess: 'Bank account successfully saved.',
      upiSaveSuccess: 'UPI successfully saved.',
      done: 'Done',
      cancel: 'Cancel',
      withdrawButton: 'Withdraw Now',
      openSetup: 'Withdrawal request खोलें',
      savePayoutAccount: 'Save Payout Account',
      saveBankAccount: 'Save Bank Account',
      saveUpi: 'Save UPI',
      withdrawTo: 'Withdraw To',
      currentWithdrawalRequestedMessage: 'आपकी withdrawal request अभी review में है।',
      currentWithdrawalApprovedMessage: 'आपकी withdrawal request approve हो चुकी है और payout का इंतजार कर रही है।',
      currentWithdrawalProcessingMessage: 'आपकी withdrawal payout process की जा रही है।',
      currentWithdrawalRejectedMessage: 'आपकी withdrawal request reject कर दी गई है।',
      currentWithdrawalPaidMessage: 'Withdrawal सफलतापूर्वक paid हो गया।',
      currentWithdrawalFailedMessage: 'आपकी withdrawal payout पूरी नहीं हो सकी।',
      currentWithdrawalCancelledMessage: 'आपकी withdrawal request cancel कर दी गई है।',
      rejectionReasonLabel: 'Reason',
      notAddedYet: 'अभी जोड़ा नहीं गया',
    }
  }

  return {
    title: 'Withdrawal Request',
    withdrawalIntro:
      'Request withdrawal from available referral earnings. The amount is reserved immediately and paid in a later approval step.',
    availableReferralBalance: 'Available Referral Balance',
    reservedAmount: 'Reserved Amount',
    availableToWithdraw: 'Available To Withdraw',
    minimumWithdrawal: 'Minimum Withdrawal',
    requestFormTitle: 'Request Withdrawal',
    withdrawalAmount: 'Withdrawal Amount',
    payoutMethod: 'Payout Method',
    requestWithdrawal: 'Request Withdrawal',
    requestInProgress: 'Requesting...',
    requestSuccessPrefix: 'Withdrawal requested successfully.',
    withdrawalHistory: 'Withdrawal History',
    noWithdrawalHistory: 'No withdrawal request yet.',
    requestedStatus: 'Requested',
    openRequestTitle: 'Current Withdrawal Request',
    dateLabel: 'Date',
    amountLabel: 'Amount',
    methodLabel: 'Method',
    statusLabel: 'Status',
    setupHint: 'You can still update your saved bank or UPI details below when needed.',
    savedPayoutAccounts: 'Saved Payout Accounts',
    noPayoutAccountYet: 'No payout account added yet',
    payoutDetailsTitle: 'Payout Details',
    payoutDetailsSubtitle:
      'Add or manage the Bank Account and UPI used for referral withdrawals.',
    addPayoutDetails: 'Add Payout Details',
    managePayoutDetails: 'Manage Payout Details',
    addPayoutDetailsHint: 'Add Bank Account or UPI before requesting withdrawal.',
    managePayoutDetailsHint: 'Bank and UPI details saved securely.',
    addPayoutDetailsBeforeWithdrawal: 'Add payout details before requesting withdrawal.',
    chooseMethod: 'Choose Payout Method',
    methodHint:
      'Choose the payout method you want to use for this withdrawal request, and keep your saved payout details updated below.',
    bank: 'Bank Account',
    upi: 'UPI',
    setupBank: 'Set Up Bank Account',
    editBank: 'Edit Bank Account',
    setupUpi: 'Set Up UPI',
    editUpi: 'Edit UPI',
    accountHolderName: 'Account Holder Name',
    accountNumber: 'Account Number',
    ifsc: 'IFSC Code',
    upiId: 'UPI ID',
    save: 'Save Payout Account',
    editOrSwitch: 'You can edit or switch between Bank and UPI any time.',
    edit: 'Edit',
    addBank: 'Add Bank Account',
    addUpi: 'Add UPI',
    currentDefault: 'Current default payout method',
    loading: 'Loading payout account...',
    saveSuccess: 'Payout account successfully saved.',
    bankSaveSuccess: 'Bank account successfully saved.',
    upiSaveSuccess: 'UPI successfully saved.',
    done: 'Done',
    cancel: 'Cancel',
    withdrawButton: 'Withdraw Now',
    openSetup: 'Open withdrawal request',
    savePayoutAccount: 'Save Payout Account',
    saveBankAccount: 'Save Bank Account',
    saveUpi: 'Save UPI',
    withdrawTo: 'Withdraw To',
    currentWithdrawalRequestedMessage: 'Your withdrawal request is under review.',
    currentWithdrawalApprovedMessage: 'Your withdrawal request has been approved and is awaiting payout.',
    currentWithdrawalProcessingMessage: 'Your withdrawal payout is being processed.',
    currentWithdrawalRejectedMessage: 'Your withdrawal request was rejected.',
    currentWithdrawalPaidMessage: 'Withdrawal paid successfully.',
    currentWithdrawalFailedMessage: 'Your withdrawal payout could not be completed.',
    currentWithdrawalCancelledMessage: 'Your withdrawal request was cancelled.',
    rejectionReasonLabel: 'Reason',
    notAddedYet: 'Not added yet',
  }
}

function StatusBadge({
  status,
  label,
}: {
  status: DisplayStatus | 'active'
  label: string
}) {
  const className =
    status === 'qualified' || status === 'active'
      ? styles.statusSuccess
      : status === 'rejected'
        ? styles.statusDanger
        : styles.statusWarning

  return <span className={`${styles.statusBadge} ${className}`}>{label}</span>
}

function AppHeader({
  title,
  left,
  right,
}: {
  title: string
  left: ReactNode
  right?: ReactNode
}) {
  const isCompact = !title.trim()

  return (
    <header className={`${styles.pageHeader} ${isCompact ? styles.pageHeaderCompact : ''}`}>
      <div className={styles.pageHeaderEdge}>{left}</div>
      {title ? <div className={styles.pageHeaderTitle}>{title}</div> : null}
      {right ? <div className={styles.pageHeaderEdge}>{right}</div> : null}
    </header>
  )
}

function SectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className={styles.sectionHeaderRow}>
      <h2 className={styles.sectionHeading}>{title}</h2>
      {action ? <div className={styles.sectionHeaderAction}>{action}</div> : null}
    </div>
  )
}

function PageSurface({ children }: { children: ReactNode }) {
  return <div className={styles.pageStack}>{children}</div>
}

function buildInitials(name: string) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'RA'
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

function formatDisplayName(name: string) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getDisplayLink(link: string) {
  return String(link || '').replace(/^https?:\/\//, '')
}

function getLocalizedCategoryName(categoryName: string, locale: 'en' | 'hi') {
  return getAgentCategoryDisplayName(categoryName, locale)
}

function getPendingMetric(data: AgentPageData) {
  return data.dashboard.metrics.registered + data.dashboard.metrics.kycPending
}

function getDisplayStatus(item: AgentDashboardHistoryItem): DisplayStatus {
  const effectiveStatus = getAgentHistoryEffectiveStatus(item)
  if (effectiveStatus === 'qualified' || effectiveStatus === 'rejected') {
    return effectiveStatus
  }
  return 'pending'
}

function getDisplayStatusLabel(status: DisplayStatus, copy: ReturnType<typeof useAgentLocale>['copy']) {
  if (status === 'qualified') return copy.qualified
  if (status === 'rejected') return copy.rejected
  return copy.pending
}

function sortHistory(items: AgentDashboardHistoryItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.rewardedAt || left.qualifiedAt || left.referralDate).getTime()
    const rightTime = new Date(right.rewardedAt || right.qualifiedAt || right.referralDate).getTime()
    return rightTime - leftTime
  })
}

function deriveAgentSince(data: AgentPageData, locale: 'en' | 'hi') {
  const dates = data.dashboard.history
    .map(item => new Date(item.referralDate).getTime())
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right)

  if (!dates.length) return null
  return formatAgentDate(new Date(dates[0]).toISOString(), locale)
}

function getWithdrawalMethodLabel(
  method: 'bank' | 'upi',
  payoutCopy: ReturnType<typeof getAgentPayoutCopy>,
) {
  return method === 'bank' ? payoutCopy.bank : payoutCopy.upi
}

function getWithdrawalStatusLabel(
  status: AgentWithdrawalHistoryItem['status'],
  payoutCopy: ReturnType<typeof getAgentPayoutCopy>,
) {
  if (status === 'requested') return payoutCopy.requestedStatus
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getCurrentWithdrawalMessage(
  item: AgentWithdrawalHistoryItem,
  payoutCopy: ReturnType<typeof getAgentPayoutCopy>,
) {
  if (item.status === 'approved') {
    return payoutCopy.currentWithdrawalApprovedMessage
  }

  if (item.status === 'processing') {
    return payoutCopy.currentWithdrawalProcessingMessage
  }

  if (item.status === 'rejected') {
    return item.rejectionReason
      ? `${payoutCopy.currentWithdrawalRejectedMessage} ${payoutCopy.rejectionReasonLabel}: ${item.rejectionReason}`
      : payoutCopy.currentWithdrawalRejectedMessage
  }

  if (item.status === 'paid') {
    return payoutCopy.currentWithdrawalPaidMessage
  }

  if (item.status === 'failed') {
    return payoutCopy.currentWithdrawalFailedMessage
  }

  if (item.status === 'cancelled') {
    return payoutCopy.currentWithdrawalCancelledMessage
  }

  return payoutCopy.currentWithdrawalRequestedMessage
}

async function fetchAgentWithdrawalOverviewRequest() {
  const response = await fetch('/api/labour/agent/withdrawals', {
    method: 'GET',
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({
    error: 'Unexpected response from server.',
  }))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load withdrawal overview.')
  }

  const nextOverview =
    data && typeof data === 'object' && data.withdrawalOverview
      ? (data.withdrawalOverview as AgentWithdrawalOverview)
      : null

  if (!nextOverview) {
    throw new Error('Failed to load withdrawal overview.')
  }

  return nextOverview
}

async function saveAgentPayoutAccountRequest(
  payload:
    | {
        method: 'bank'
        accountHolderName: string
        accountNumber: string
        ifsc: string
      }
    | {
        method: 'upi'
        upiId: string
      },
) {
  const response = await fetch('/api/labour/agent/referral-payout-account', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({
    error: 'Unexpected response from server.',
  }))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save payout account.')
  }

  return data && typeof data === 'object' && data.payoutAccount
    ? (data.payoutAccount as AgentPayoutAccount)
    : null
}

async function createAgentWithdrawalRequest(input: {
  amount: string
  payoutMethod: 'bank' | 'upi'
}) {
  const response = await fetch('/api/labour/agent/withdrawals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await response.json().catch(() => ({
    error: 'Unexpected response from server.',
  }))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to request withdrawal.')
  }

  return data && typeof data === 'object' && data.overview
    ? (data.overview as AgentWithdrawalOverview)
    : null
}

function AgentPayoutSetupDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { locale } = useAgentLocale()
  const payoutCopy = getAgentPayoutCopy(locale)
  const withdrawalAmountInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [withdrawalOverview, setWithdrawalOverview] = useState<AgentWithdrawalOverview | null>(null)
  const [selectedWithdrawalMethod, setSelectedWithdrawalMethod] = useState<'bank' | 'upi'>('bank')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const syncOverviewState = useCallback((overview: AgentWithdrawalOverview) => {
    setWithdrawalOverview(overview)

    const fallbackMethod =
      (overview.payoutAccount?.preferredMethod === 'bank' && overview.bankConfigured) ||
      (overview.payoutAccount?.preferredMethod === 'upi' && overview.upiConfigured)
        ? overview.payoutAccount.preferredMethod
        : overview.bankConfigured
          ? 'bank'
          : overview.upiConfigured
            ? 'upi'
            : 'bank'

    setSelectedWithdrawalMethod(currentMethod => {
      if (currentMethod === 'bank' && overview.bankConfigured) return currentMethod
      if (currentMethod === 'upi' && overview.upiConfigured) return currentMethod
      return fallbackMethod || 'bank'
    })
  }, [])

  const loadWithdrawalOverview = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const nextOverview = await fetchAgentWithdrawalOverviewRequest()
      syncOverviewState(nextOverview)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load withdrawal overview.',
      )
    } finally {
      setLoading(false)
    }
  }, [syncOverviewState])

  useEffect(() => {
    if (!open) return

    let disposed = false

    const load = async () => {
      if (disposed) return
      setMessage('')
      await loadWithdrawalOverview()
    }

    void load()

    return () => {
      disposed = true
    }
  }, [loadWithdrawalOverview, open])

  if (!open) {
    return null
  }

  const openPayoutDetails = () => {
    onClose()
    router.push('/labour/agent/payout-details')
  }

  const requestWithdrawal = async () => {
    setRequesting(true)
    setError('')
    setMessage('')

    try {
      const nextOverview = await createAgentWithdrawalRequest({
        amount: withdrawalAmount,
        payoutMethod: selectedWithdrawalMethod,
      })

      if (nextOverview) {
        syncOverviewState(nextOverview)
      }

      setWithdrawalAmount('')

      const methodLabel = getWithdrawalMethodLabel(selectedWithdrawalMethod, payoutCopy)
      const amountLabel = formatAgentCurrency(Number(withdrawalAmount || 0), locale)
      setMessage(
        `${payoutCopy.requestSuccessPrefix} ${payoutCopy.amountLabel}: ${amountLabel} | ${payoutCopy.methodLabel}: ${methodLabel} | ${payoutCopy.statusLabel}: ${payoutCopy.requestedStatus}`,
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to request withdrawal.',
      )
    } finally {
      setRequesting(false)
    }
  }

  const payoutAccount = withdrawalOverview?.payoutAccount || null
  const bankConfigured = withdrawalOverview?.bankConfigured || payoutAccount?.bank.configured || false
  const upiConfigured = withdrawalOverview?.upiConfigured || payoutAccount?.upi.configured || false
  const configuredWithdrawalMethods = [
    bankConfigured ? 'bank' : null,
    upiConfigured ? 'upi' : null,
  ].filter(Boolean) as Array<'bank' | 'upi'>
  const hasConfiguredMethods = configuredWithdrawalMethods.length > 0
  const hasOpenBlockingRequest =
    withdrawalOverview?.existingOpenRequest != null &&
    ['requested', 'approved', 'processing'].includes(withdrawalOverview.existingOpenRequest.status)
  const selectedDestinationLabel =
    selectedWithdrawalMethod === 'bank'
      ? [payoutAccount?.bank.maskedAccountNumber, payoutAccount?.bank.ifsc && `IFSC: ${payoutAccount.bank.ifsc}`]
          .filter(Boolean)
          .join(' | ')
      : payoutAccount?.upi.maskedUpiId || ''
  const showRequestForm =
    Boolean(withdrawalOverview?.canRequest) &&
    hasConfiguredMethods &&
    !withdrawalOverview?.existingOpenRequest

  return (
    <div className={styles.modalScrim} role="presentation" onClick={onClose}>
      <section
        className={`${styles.agentNoticeDialog} ${styles.payoutModalDialog} ${hasOpenBlockingRequest ? styles.payoutModalDialogCompact : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-payout-title"
        aria-describedby="agent-payout-body"
        onClick={event => event.stopPropagation()}
      >
        <div className={`${styles.agentNoticeIcon} ${styles.payoutModalIcon}`}>
          <Wallet size={24} strokeWidth={2.2} />
        </div>
        <h2 id="agent-payout-title" className={`${styles.agentNoticeTitle} ${styles.payoutModalTitle}`}>
          {payoutCopy.title}
        </h2>
        <p id="agent-payout-body" className={`${styles.agentNoticeBody} ${styles.payoutModalSubtitle}`}>
          {payoutCopy.withdrawalIntro}
        </p>

        <div className={styles.payoutModalBody}>
          {loading ? <div className={`${styles.messageCard} ${styles.payoutModalStatus}`}>{payoutCopy.loading}</div> : null}
          {message ? <div className={`${styles.messageCard} ${styles.payoutModalStatus}`}>{message}</div> : null}
          {error ? <div className={`${styles.errorCard} ${styles.payoutModalStatus}`}>{error}</div> : null}

          <div className={`${styles.referenceCard} ${styles.withdrawalEligibilityCard}`}>
            <h3 className={styles.payoutEditorHeading}>{payoutCopy.requestFormTitle}</h3>
            <div className={styles.withdrawalEligibilityGrid}>
              <div className={styles.withdrawalMetricCard}>
                <div className={styles.withdrawalMetricLabel}>{payoutCopy.availableReferralBalance}</div>
                <div className={styles.withdrawalMetricValue}>
                  {formatAgentCurrency(withdrawalOverview?.availableBalance || 0, locale)}
                </div>
              </div>
              <div className={styles.withdrawalMetricCard}>
                <div className={styles.withdrawalMetricLabel}>{payoutCopy.reservedAmount}</div>
                <div className={styles.withdrawalMetricValue}>
                  {formatAgentCurrency(withdrawalOverview?.reservedBalance || 0, locale)}
                </div>
              </div>
              <div className={styles.withdrawalMetricCard}>
                <div className={styles.withdrawalMetricLabel}>{payoutCopy.availableToWithdraw}</div>
                <div className={styles.withdrawalMetricValue}>
                  {formatAgentCurrency(withdrawalOverview?.withdrawableBalance || 0, locale)}
                </div>
              </div>
              <div className={styles.withdrawalMetricCard}>
                <div className={styles.withdrawalMetricLabel}>{payoutCopy.minimumWithdrawal}</div>
                <div className={styles.withdrawalMetricValue}>
                  {withdrawalOverview
                    ? formatAgentCurrency(withdrawalOverview.minimumWithdrawal, locale)
                    : '--'}
                </div>
              </div>
            </div>
          </div>

          {withdrawalOverview?.existingOpenRequest ? (
            <div className={`${styles.referenceCard} ${styles.withdrawalOpenCard}`}>
              <div className={styles.withdrawalOpenTitle}>{payoutCopy.openRequestTitle}</div>
              <div className={styles.withdrawalOpenMetaGrid}>
                <div className={styles.withdrawalOpenMetaItem}>
                  <div className={styles.withdrawalOpenMetaLabel}>{payoutCopy.amountLabel}</div>
                  <div className={styles.withdrawalOpenMetaValue}>
                    {formatAgentCurrency(withdrawalOverview.existingOpenRequest.amount, locale)}
                  </div>
                </div>
                <div className={styles.withdrawalOpenMetaItem}>
                  <div className={styles.withdrawalOpenMetaLabel}>{payoutCopy.methodLabel}</div>
                  <div className={styles.withdrawalOpenMetaValue}>
                    {getWithdrawalMethodLabel(withdrawalOverview.existingOpenRequest.payoutMethod, payoutCopy)}
                  </div>
                </div>
                <div className={styles.withdrawalOpenMetaItem}>
                  <div className={styles.withdrawalOpenMetaLabel}>{payoutCopy.statusLabel}</div>
                  <div className={styles.withdrawalOpenMetaValue}>
                    {getWithdrawalStatusLabel(withdrawalOverview.existingOpenRequest.status, payoutCopy)}
                  </div>
                </div>
                <div className={styles.withdrawalOpenMetaItem}>
                  <div className={styles.withdrawalOpenMetaLabel}>{payoutCopy.dateLabel}</div>
                  <div className={styles.withdrawalOpenMetaValue}>
                    {formatAgentDate(withdrawalOverview.existingOpenRequest.requestedAt, locale)}
                  </div>
                </div>
              </div>
               <div className={styles.withdrawalRequestMeta}>
                 {getCurrentWithdrawalMessage(withdrawalOverview.existingOpenRequest, payoutCopy)}
               </div>
             </div>
           ) : null}

          {withdrawalOverview && !withdrawalOverview.canRequest && !hasOpenBlockingRequest ? (
            <div className={`${styles.messageCard} ${styles.payoutModalStatus}`}>
              {withdrawalOverview.eligibilityMessage}
            </div>
          ) : null}

          {!loading && withdrawalOverview && !hasConfiguredMethods && !hasOpenBlockingRequest ? (
            <div className={`${styles.referenceCard} ${styles.payoutSummaryCard}`}>
              <div className={styles.payoutEditorHeading}>{payoutCopy.payoutMethod}</div>
              <div className={styles.payoutEditorMeta}>{payoutCopy.addPayoutDetailsBeforeWithdrawal}</div>
              <div className={styles.payoutEditorActions}>
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.payoutFooterButton}`}
                  onClick={openPayoutDetails}
                >
                  {payoutCopy.addPayoutDetails}
                </button>
              </div>
            </div>
          ) : null}

          {hasConfiguredMethods && !hasOpenBlockingRequest ? (
            <div className={`${styles.referenceCard} ${styles.payoutSummaryCard}`}>
              <div className={styles.payoutSummaryHeaderRow}>
                <div className={`${styles.infoBlockLabel} ${styles.payoutSummaryLabel}`}>
                  {payoutCopy.withdrawTo}
                </div>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${styles.payoutSavedMethodAction}`}
                  onClick={openPayoutDetails}
                >
                  {payoutCopy.managePayoutDetails}
                </button>
              </div>
              <div className={styles.payoutSavedMethodList}>
                {bankConfigured ? (
                  <div className={styles.payoutSavedMethodCard}>
                    <div className={styles.payoutSavedMethodLabel}>{payoutCopy.bank}</div>
                    <div className={styles.payoutSavedMethodValue}>{payoutAccount?.bank.maskedAccountNumber}</div>
                    {payoutAccount?.bank.ifsc ? (
                      <div className={styles.payoutSavedMethodMeta}>IFSC: {payoutAccount.bank.ifsc}</div>
                    ) : null}
                  </div>
                ) : null}

                {upiConfigured ? (
                  <div className={styles.payoutSavedMethodCard}>
                    <div className={styles.payoutSavedMethodLabel}>{payoutCopy.upi}</div>
                    <div className={styles.payoutSavedMethodValue}>{payoutAccount?.upi.maskedUpiId}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {showRequestForm ? (
            <div className={`${styles.referenceCard} ${styles.withdrawalRequestCard}`}>
              <div className={styles.withdrawalFieldLabel}>{payoutCopy.withdrawalAmount}</div>
              <input
                ref={withdrawalAmountInputRef}
                className={`${styles.input} ${styles.payoutInput} ${styles.withdrawalAmountInput}`}
                inputMode="decimal"
                value={withdrawalAmount}
                onChange={event => setWithdrawalAmount(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder={String(withdrawalOverview?.minimumWithdrawal || '')}
                autoComplete="off"
              />

              <div className={styles.withdrawalFieldLabel}>{payoutCopy.payoutMethod}</div>
              <div className={styles.withdrawalMethodGrid}>
                {configuredWithdrawalMethods.map(methodOption => {
                  const isSelected = selectedWithdrawalMethod === methodOption
                  const methodValue =
                    methodOption === 'bank'
                      ? payoutAccount?.bank.maskedAccountNumber || ''
                      : payoutAccount?.upi.maskedUpiId || ''

                  return (
                    <button
                      key={methodOption}
                      type="button"
                      className={`${styles.withdrawalMethodCard} ${isSelected ? styles.withdrawalMethodCardActive : ''}`}
                      onClick={() => setSelectedWithdrawalMethod(methodOption)}
                    >
                      <div className={styles.withdrawalMethodName}>
                        {getWithdrawalMethodLabel(methodOption, payoutCopy)}
                      </div>
                      <div className={styles.withdrawalMethodValue}>{methodValue}</div>
                    </button>
                  )
                })}
              </div>

              {selectedDestinationLabel ? (
                <div className={styles.withdrawalRequestMeta}>{selectedDestinationLabel}</div>
              ) : null}

              <button
                type="button"
                className={`${styles.primaryButton} ${styles.withdrawalRequestAction}`}
                onClick={() => void requestWithdrawal()}
                disabled={requesting || loading}
              >
                {requesting ? payoutCopy.requestInProgress : payoutCopy.requestWithdrawal}
              </button>
            </div>
          ) : null}

          <section className={`${styles.referenceCard} ${styles.withdrawalHistoryCard}`}>
            <h3 className={styles.payoutEditorHeading}>{payoutCopy.withdrawalHistory}</h3>
            {withdrawalOverview?.history.length ? (
              <div className={styles.withdrawalHistoryList}>
                {withdrawalOverview.history.map(item => (
                  <article key={item.id} className={styles.withdrawalHistoryRow}>
                    <div className={styles.withdrawalHistoryMain}>
                      <div className={styles.withdrawalHistoryAmount}>
                        {formatAgentCurrency(item.amount, locale)}
                      </div>
                      <div className={styles.withdrawalHistoryMeta}>
                        {formatAgentDate(item.requestedAt, locale)} | {getWithdrawalMethodLabel(item.payoutMethod, payoutCopy)}
                      </div>
                      {item.status === 'rejected' && item.rejectionReason ? (
                        <div style={{ color: '#b91c1c', fontSize: '12px', lineHeight: 1.5, marginTop: '6px' }}>
                          Reason: {item.rejectionReason}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.withdrawalHistoryStatus}>
                      {getWithdrawalStatusLabel(item.status, payoutCopy)}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.withdrawalEmptyState}>{payoutCopy.noWithdrawalHistory}</div>
            )}
          </section>
        </div>

        <div className={styles.payoutModalFooter}>
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.payoutFooterButton}`}
            onClick={onClose}
            disabled={requesting}
          >
            {payoutCopy.done}
          </button>
        </div>
      </section>
    </div>
  )
}

function AgentPayoutDetailsEntryCard() {
  const { locale } = useAgentLocale()
  const payoutCopy = getAgentPayoutCopy(locale)
  const [loading, setLoading] = useState(true)
  const [hasPayoutDetails, setHasPayoutDetails] = useState(false)

  useEffect(() => {
    let disposed = false

    const load = async () => {
      try {
        const overview = await fetchAgentWithdrawalOverviewRequest()
        if (disposed) return
        setHasPayoutDetails(Boolean(overview.bankConfigured || overview.upiConfigured))
      } catch {
        if (disposed) return
        setHasPayoutDetails(false)
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      disposed = true
    }
  }, [])

  const title = hasPayoutDetails ? payoutCopy.managePayoutDetails : payoutCopy.addPayoutDetails
  const body = hasPayoutDetails ? payoutCopy.managePayoutDetailsHint : payoutCopy.addPayoutDetailsHint

  return (
    <Link href="/labour/agent/payout-details" prefetch className={`${styles.referenceCard} ${styles.payoutManageCard}`}>
      <div className={styles.payoutManageCardIcon}>
        <Wallet size={22} strokeWidth={2.2} />
      </div>
      <div className={styles.payoutManageCardContent}>
        <div className={styles.payoutManageCardTitle}>{title}</div>
        <div className={styles.payoutManageCardBody}>{loading ? payoutCopy.loading : body}</div>
      </div>
      <ChevronRight className={styles.payoutManageCardChevron} size={18} strokeWidth={2.2} />
    </Link>
  )
}

function AgentPayoutDetailsSection() {
  const { locale } = useAgentLocale()
  const payoutCopy = getAgentPayoutCopy(locale)
  const bankCardRef = useRef<HTMLDivElement | null>(null)
  const upiCardRef = useRef<HTMLDivElement | null>(null)
  const bankAccountHolderInputRef = useRef<HTMLInputElement | null>(null)
  const upiInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'bank' | 'upi' | null>(null)
  const [withdrawalOverview, setWithdrawalOverview] = useState<AgentWithdrawalOverview | null>(null)
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [upiId, setUpiId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const overview = await fetchAgentWithdrawalOverviewRequest()
      setWithdrawalOverview(overview)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load payout account.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const focusEditor = useCallback((method: 'bank' | 'upi') => {
    const targetCard = method === 'bank' ? bankCardRef.current : upiCardRef.current
    const targetInput = method === 'bank' ? bankAccountHolderInputRef.current : upiInputRef.current

    window.setTimeout(() => {
      targetCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      targetInput?.focus()
    }, 80)
  }, [])

  const payoutAccount = withdrawalOverview?.payoutAccount || null
  const bankConfigured = withdrawalOverview?.bankConfigured || payoutAccount?.bank.configured || false
  const upiConfigured = withdrawalOverview?.upiConfigured || payoutAccount?.upi.configured || false

  const saveBank = async () => {
    setSaving('bank')
    setMessage('')
    setError('')

    try {
      await saveAgentPayoutAccountRequest({
        method: 'bank',
        accountHolderName,
        accountNumber,
        ifsc,
      })
      setAccountHolderName('')
      setAccountNumber('')
      setIfsc('')
      setMessage(payoutCopy.bankSaveSuccess)
      await loadOverview()
      focusEditor('bank')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save payout account.',
      )
    } finally {
      setSaving(null)
    }
  }

  const saveUpi = async () => {
    setSaving('upi')
    setMessage('')
    setError('')

    try {
      await saveAgentPayoutAccountRequest({
        method: 'upi',
        upiId,
      })
      setUpiId('')
      setMessage(payoutCopy.upiSaveSuccess)
      await loadOverview()
      focusEditor('upi')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save payout account.',
      )
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      {loading ? <div className={styles.messageCard}>{payoutCopy.loading}</div> : null}
      {message ? <div className={styles.messageCard}>{message}</div> : null}
      {error ? <div className={styles.errorCard}>{error}</div> : null}

      <section className={`${styles.referenceCard} ${styles.payoutSummaryCard}`}>
        <div className={styles.payoutEditorHeading}>{payoutCopy.savedPayoutAccounts}</div>
        <div className={styles.payoutSavedMethodList}>
          <article className={styles.payoutSavedMethodCard}>
            <div className={styles.payoutSavedMethodHeader}>
              <div>
                <div className={styles.payoutSavedMethodLabel}>{payoutCopy.bank}</div>
                <div className={styles.payoutSavedMethodValue}>
                  {bankConfigured ? payoutAccount?.bank.maskedAccountNumber : payoutCopy.notAddedYet}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.payoutSavedMethodAction}`}
                onClick={() => focusEditor('bank')}
              >
                {bankConfigured ? payoutCopy.edit : payoutCopy.addBank}
              </button>
            </div>
            {bankConfigured && payoutAccount?.bank.accountHolderName ? (
              <div className={styles.payoutSavedMethodMeta}>
                {payoutCopy.accountHolderName}: {payoutAccount.bank.accountHolderName}
              </div>
            ) : null}
            {bankConfigured && payoutAccount?.bank.ifsc ? (
              <div className={styles.payoutSavedMethodMeta}>IFSC: {payoutAccount.bank.ifsc}</div>
            ) : null}
          </article>

          <article className={styles.payoutSavedMethodCard}>
            <div className={styles.payoutSavedMethodHeader}>
              <div>
                <div className={styles.payoutSavedMethodLabel}>{payoutCopy.upi}</div>
                <div className={styles.payoutSavedMethodValue}>
                  {upiConfigured ? payoutAccount?.upi.maskedUpiId : payoutCopy.notAddedYet}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.payoutSavedMethodAction}`}
                onClick={() => focusEditor('upi')}
              >
                {upiConfigured ? payoutCopy.edit : payoutCopy.addUpi}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section ref={bankCardRef} className={`${styles.referenceCard} ${styles.payoutEditorCard}`}>
        <div className={styles.payoutSummaryHeaderRow}>
          <div>
            <h3 className={styles.payoutEditorHeading}>{payoutCopy.bank}</h3>
            <div className={styles.payoutEditorMeta}>{payoutCopy.setupHint}</div>
          </div>
        </div>
        <div className={`${styles.fieldStack} ${styles.payoutFieldStack}`}>
          <input
            ref={bankAccountHolderInputRef}
            className={`${styles.input} ${styles.payoutInput}`}
            value={accountHolderName}
            onChange={event => setAccountHolderName(event.target.value)}
            placeholder={payoutCopy.accountHolderName}
            autoComplete="off"
          />
          <input
            className={`${styles.input} ${styles.payoutInput}`}
            inputMode="numeric"
            value={accountNumber}
            onChange={event => setAccountNumber(event.target.value.replace(/[^\d]/g, ''))}
            placeholder={payoutCopy.accountNumber}
            autoComplete="off"
          />
          <input
            className={`${styles.input} ${styles.payoutInput}`}
            value={ifsc}
            onChange={event => setIfsc(event.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder={payoutCopy.ifsc}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <div className={styles.payoutEditorActions}>
          <button
            type="button"
            className={`${styles.primaryButton} ${styles.payoutFooterButton}`}
            onClick={() => void saveBank()}
            disabled={saving === 'bank' || loading}
          >
            {saving === 'bank' ? 'Saving...' : payoutCopy.saveBankAccount}
          </button>
        </div>
      </section>

      <section ref={upiCardRef} className={`${styles.referenceCard} ${styles.payoutEditorCard}`}>
        <div className={styles.payoutSummaryHeaderRow}>
          <div>
            <h3 className={styles.payoutEditorHeading}>{payoutCopy.upi}</h3>
            <div className={styles.payoutEditorMeta}>{payoutCopy.setupHint}</div>
          </div>
        </div>
        <div className={`${styles.fieldStack} ${styles.payoutFieldStack}`}>
          <input
            ref={upiInputRef}
            className={`${styles.input} ${styles.payoutInput}`}
            value={upiId}
            onChange={event => setUpiId(event.target.value)}
            placeholder={payoutCopy.upiId}
            autoComplete="off"
          />
        </div>
        <div className={styles.payoutEditorActions}>
          <button
            type="button"
            className={`${styles.primaryButton} ${styles.payoutFooterButton}`}
            onClick={() => void saveUpi()}
            disabled={saving === 'upi' || loading}
          >
            {saving === 'upi' ? 'Saving...' : payoutCopy.saveUpi}
          </button>
        </div>
      </section>
    </>
  )
}

function copyToClipboard(value: string) {
  return navigator.clipboard.writeText(value)
}

async function shareReferral(referralCode: string, referralLink: string) {
  const text = buildAgentShareText(referralCode, referralLink)
  if (navigator.share) {
    await navigator.share({
      title: 'Rozgar Agent',
      text,
    })
    return
  }

  window.open(buildAgentWhatsappHref(referralCode, referralLink), '_blank', 'noopener,noreferrer')
}

async function shareCategory(category: AgentDashboardCategory, referralLink: string, locale: 'en' | 'hi') {
  const shareCategoryLabel = getLocalizedCategoryName(category.categoryName, locale)
  const shareBody = buildAgentCategoryShareText({
    categoryLabel: shareCategoryLabel,
    locale,
    referralLink,
  })

  if (navigator.share) {
    await navigator.share({
      title: `Rozgar Agent - ${shareCategoryLabel}`,
      text: shareBody,
    })
    return
  }

  window.open(buildAgentCategoryWhatsappHref(shareBody), '_blank', 'noopener,noreferrer')

  /* Legacy share path intentionally disabled.

  const rewardLabel = new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    maximumFractionDigits: 0,
  }).format(category.rewardAmount)
  const categoryLabel = getLocalizedCategoryName(category.categoryName, locale)
  const body =
    locale === 'hi'
      ? `${categoryLabel} के लिए कामगार रेफर करें और प्रति योग्य कामगार Rs ${rewardLabel} कमाएं।\n${referralLink}`
      : `Refer workers for ${categoryLabel} and earn Rs ${rewardLabel} per qualified worker.\n${referralLink}`

  if (navigator.share) {
    await navigator.share({
      title: `Rozgar Agent - ${categoryLabel}`,
      text: body,
      url: referralLink,
    })
    return
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(`${body}\nCode: ${referralCode}`)}`, '_blank', 'noopener,noreferrer')
  */
}

function ThemeIcon({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}) {
  return (
    <span className={`${styles.themeIcon} ${styles[`themeIcon${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <Icon size={22} strokeWidth={2.2} />
    </span>
  )
}

function MetricCard({
  icon,
  tone,
  value,
  label,
}: {
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  value: ReactNode
  label: string
}) {
  return (
    <article className={styles.metricCard}>
      <ThemeIcon icon={icon} tone={tone} />
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
    </article>
  )
}

function QuickActionCard({
  href,
  icon,
  tone,
  title,
  body,
  onClick,
}: {
  href?: string
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  title: string
  body: string
  onClick?: () => void
}) {
  const content = (
    <>
      <ThemeIcon icon={icon} tone={tone} />
      <div className={styles.quickActionTitle}>{title}</div>
      <div className={styles.quickActionBody}>{body}</div>
    </>
  )

  if (href) {
    return (
      <Link href={href} prefetch className={styles.quickActionCard}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={styles.quickActionCardButton} onClick={onClick}>
      {content}
    </button>
  )
}

function HomeHeader({ data }: { data: AgentPageData }) {
  const { locale, copy } = useAgentLocale()
  const shortName = formatDisplayName(data.agentName).split(/\s+/).slice(0, 2).join(' ')
  const sinceLabel = deriveAgentSince(data, locale)

  return (
    <>
      <div className={styles.brandHeaderRow}>
        <AgentBrandLockup />
        <AgentHeaderControls />
      </div>

      <section className={styles.greetingCard}>
        <h1 className={styles.greetingTitle}>
          Namaste, {shortName} <span aria-hidden="true">👋</span>
        </h1>
        <div className={styles.greetingMeta}>
          <span className={styles.activeDot} />
          <span>{copy.activeAgent}</span>
          {sinceLabel ? (
            <>
              <span className={styles.greetingDivider}>•</span>
              <span>Since {sinceLabel}</span>
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}

function ReferralHeroCard({
  data,
  mode = 'home',
}: {
  data: AgentPageData
  mode?: ReferralHeroCardMode
}) {
  const { copy, locale } = useAgentLocale()
  const payoutCopy = getAgentPayoutCopy(locale)
  const router = useRouter()
  const [showPayoutSetup, setShowPayoutSetup] = useState(false)
  const liveBalanceLabel = formatAgentCurrency(data.dashboard.earnings.available, locale)
  const opensPayoutSetup = mode === 'earnings'

  return (
    <>
      <section className={styles.heroShowcaseCard}>
        <div className={styles.heroShowcaseContent}>
          <div className={styles.heroTextStack}>
            <div className={styles.heroEyebrow}>Your Referral Earnings</div>
            <div className={styles.heroValue}>{liveBalanceLabel}</div>
            <div className={styles.heroSubtext}>Available Balance</div>
          </div>

          <button
            type="button"
            className={styles.heroWithdrawButton}
            onClick={() => {
              if (opensPayoutSetup) {
                setShowPayoutSetup(true)
                return
              }

              router.push('/labour/agent/earnings')
            }}
            aria-label={opensPayoutSetup ? payoutCopy.openSetup : copy.viewEarnings}
          >
            <span>{payoutCopy.withdrawButton}</span>
            <ArrowRight size={20} strokeWidth={2.3} />
          </button>
        </div>

        <div className={styles.heroIllustrationWrap} aria-hidden="true">
          <Image
            src="/images/agent-ui/agent-home-hero.jpg"
            alt=""
            fill
            priority
            className={styles.heroReferenceImage}
            sizes="(max-width: 430px) 42vw, 190px"
          />
        </div>
      </section>

      <AgentPayoutSetupDialog
        open={opensPayoutSetup && showPayoutSetup}
        onClose={() => setShowPayoutSetup(false)}
      />
    </>
  )
}

function ReferHeroCard() {
  const { copy, locale } = useAgentLocale()

  return (
    <section className={styles.referHeroCard}>
      <Image
        src="/images/agent-ui/refer-hero-reference.jpg"
        alt={copy.refer}
        fill
        priority
        className={styles.referHeroReferenceImage}
        sizes="(max-width: 540px) 100vw, 456px"
      />
      <div className={styles.referHeroOverlay} />
      <div className={styles.referHeroContent}>
        <div className={styles.referHeroTitle}>
          {copy.referHeroTitleLine1}
          <br />
          <span className={styles.referHeroHighlight}>{copy.referHeroTitleLine2}</span>
        </div>
        <p className={styles.referHeroBody}>{copy.referHeroSubtitle}</p>
        <div className={styles.trustPill}>
          <Shield size={16} strokeWidth={2.1} />
          <span>{copy.referHeroTrusted}</span>
        </div>
      </div>
      {locale === 'hi' ? <div className={styles.referHeroArtworkMask} aria-hidden="true" /> : null}
    </section>
  )
}

function ProfileHeroCard({ data }: { data: AgentPageData }) {
  const { copy, locale } = useAgentLocale()
  const sinceLabel = deriveAgentSince(data, locale)

  return (
    <section className={styles.profileHeroCard}>
      <div className={styles.profileHeroAvatar}>
        <div className={styles.profileHeroAvatarCore}>{buildInitials(data.agentName)}</div>
      </div>

      <div className={styles.profileHeroMain}>
        <h1 className={styles.profileHeroName}>{formatDisplayName(data.agentName)}</h1>
        <StatusBadge status="active" label={copy.activeAgent} />
        {sinceLabel ? (
          <div className={styles.profileHeroMeta}>
            <CalendarDays size={18} strokeWidth={2.2} />
            <span>Agent Since: {sinceLabel}</span>
          </div>
        ) : null}
        <p className={styles.profileHeroQuote}>Helping workers find jobs and referral rewards.</p>
      </div>
    </section>
  )
}

function SummaryMetrics({ data }: { data: AgentPageData }) {
  const { copy } = useAgentLocale()

  return (
    <div className={styles.metricGrid}>
      <MetricCard icon={Users} tone="blue" value={data.dashboard.metrics.totalReferred} label={copy.totalReferred} />
      <MetricCard icon={CheckCircle2} tone="green" value={data.dashboard.metrics.qualified} label={copy.qualified} />
      <MetricCard icon={Clock3} tone="orange" value={getPendingMetric(data)} label={copy.pending} />
      <MetricCard icon={XCircle} tone="red" value={data.dashboard.metrics.rejected} label={copy.rejected} />
    </div>
  )
}

function InfoRow({
  icon,
  tone,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  label: string
  value: ReactNode
  href?: string
}) {
  const content = (
    <>
      <ThemeIcon icon={icon} tone={tone} />
      <div className={styles.infoRowContent}>
        <div className={styles.infoRowLabel}>{label}</div>
      </div>
      <div className={styles.infoRowValueWrap}>{value}</div>
      <ChevronRight size={20} strokeWidth={2.3} className={styles.infoRowChevron} />
    </>
  )

  if (href) {
    return (
      <a className={styles.infoRow} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return <div className={styles.infoRow}>{content}</div>
}

function WorkerBadge({ item }: { item: AgentDashboardHistoryItem }) {
  const { copy } = useAgentLocale()
  const status = getDisplayStatus(item)
  return <StatusBadge status={status} label={getDisplayStatusLabel(status, copy)} />
}

function ReferralListCard({ item }: { item: AgentDashboardHistoryItem }) {
  const { copy, locale } = useAgentLocale()
  const categoryLabel = getLocalizedCategoryName(item.categoryName, locale)

  return (
    <article className={styles.referralCard}>
      <div className={styles.referralAvatarWrap}>
        <div className={styles.referralAvatarFallback}>{buildInitials(item.referredWorkerName || 'Worker')}</div>
      </div>

      <div className={styles.referralCardMain}>
        <div className={styles.referralCardTop}>
          <div>
            <h3 className={styles.referralCardName}>{formatDisplayName(item.referredWorkerName || '--')}</h3>
            <div className={styles.referralCardCategoryLabel}>{copy.category}</div>
            <div className={styles.referralCardCategoryValue}>{categoryLabel}</div>
          </div>

          <div className={styles.referralCardMeta}>
            <WorkerBadge item={item} />
            <div className={styles.referralCardDate}>
              <CalendarDays size={17} strokeWidth={2.2} />
              <span>{formatAgentDate(item.referralDate, locale)}</span>
            </div>
            <div className={styles.referralCardRewardLabel}>{copy.rewardAmount}</div>
            <div className={styles.referralCardRewardValue}>{formatAgentCurrency(item.rewardSnapshot, locale)}</div>
          </div>
        </div>
      </div>

      <ChevronRight size={24} strokeWidth={2.3} className={styles.referralCardChevron} />
    </article>
  )
}

function RecentTransactionRow({ item }: { item: AgentDashboardHistoryItem }) {
  const { locale } = useAgentLocale()
  const status = getDisplayStatus(item)
  const categoryLabel = getLocalizedCategoryName(item.categoryName, locale)
  const amountClass =
    status === 'qualified'
      ? styles.amountSuccess
      : status === 'rejected'
        ? styles.amountDanger
        : styles.amountWarning

  return (
    <article className={styles.transactionRow}>
      <div className={styles.transactionIcon}>
        <span className={`${styles.transactionIconBadge} ${styles[`transactionIcon${status[0].toUpperCase()}${status.slice(1)}`]}`}>+</span>
      </div>
      <div className={styles.transactionMain}>
        <div className={`${styles.transactionAmount} ${amountClass}`}>
          + {formatAgentCurrency(item.rewardSnapshot, locale)}
        </div>
        <div className={styles.transactionName}>
          {formatDisplayName(item.referredWorkerName)} ({categoryLabel})
        </div>
        <div className={`${styles.transactionStatus} ${amountClass}`}>
          {status === 'qualified' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
        </div>
      </div>
      <div className={styles.transactionDate}>{formatAgentDate(item.referralDate, locale)}</div>
    </article>
  )
}

function CategoryShowcaseCard({
  category,
  index,
  data,
}: {
  category: AgentDashboardCategory
  index: number
  data: AgentPageData
}) {
  const { locale, copy } = useAgentLocale()
  const icons: LucideIcon[] = [Scissors, Shirt, Sparkles, Users, Ticket]
  const tones: Array<'orange' | 'blue' | 'purple' | 'green' | 'red'> = ['orange', 'blue', 'purple', 'green', 'red']
  const Icon = icons[index % icons.length]
  const tone = tones[index % tones.length]
  const categoryLabel = getLocalizedCategoryName(category.categoryName, locale)

  return (
    <article className={styles.categoryShowcaseCard}>
      <div className={styles.categoryShowcaseLeft}>
        <ThemeIcon icon={Icon} tone={tone} />
        <div>
          <h3 className={styles.categoryShowcaseName}>{categoryLabel}</h3>
          <div className={styles.categoryShowcaseSubtext}>{copy.perQualifiedWorker}</div>
        </div>
      </div>

      <div className={styles.categoryShowcaseRight}>
        <div className={styles.categoryEarnLabel}>{copy.earnPrefix}</div>
        <div className={styles.categoryEarnValue}>{formatAgentCurrency(category.rewardAmount, locale)}</div>
        <button
          type="button"
          className={styles.categoryShareButton}
          onClick={() => {
            void shareCategory(category, data.dashboard.referralLink, locale)
          }}
        >
          <Share2 size={17} strokeWidth={2.2} />
          {copy.shareNow}
        </button>
      </div>
    </article>
  )
}

function EligibleCategoriesSection({
  data,
  showHeader = true,
}: {
  data: AgentPageData
  showHeader?: boolean
}) {
  const { copy, locale } = useAgentLocale()
  const [expandedBatches, setExpandedBatches] = useState(0)
  const totalCategories = data.dashboard.eligibleCategories.length
  const visibleCount = totalCategories <= 6 ? totalCategories : Math.min(totalCategories, 6 + expandedBatches * 6)
  const visibleCategories = data.dashboard.eligibleCategories.slice(0, visibleCount)
  const remainingCount = Math.max(totalCategories - visibleCategories.length, 0)
  const nextBatchCount = Math.min(6, remainingCount)
  const canShowLess = totalCategories > 6 && expandedBatches > 0

  const showMoreLabel =
    locale === 'hi'
      ? `${nextBatchCount} और दिखाएँ`
      : `Show ${nextBatchCount} More`
  const showLessLabel = copy.showLess

  return (
    <section className={styles.referenceCard}>
      {showHeader ? (
        <SectionTitle
          title={copy.eligibleCategories}
          action={
            <span className={styles.inlineIconWrap}>
              <Info size={20} strokeWidth={2.2} />
            </span>
          }
        />
      ) : null}

      <section className={styles.softPromoCard}>
        <ThemeIcon icon={Gift} tone="orange" />
        <div>
          <div className={styles.softPromoTitle}>
            {copy.eligibleCategoriesHint}
          </div>
        </div>
      </section>

      <div className={styles.embeddedCategoryStack}>
        {totalCategories === 0 ? (
          <section className={styles.emptyStateCard}>
            <div className={styles.emptyStateTitle}>{copy.noCategories}</div>
          </section>
        ) : (
          visibleCategories.map((category, index) => (
            <CategoryShowcaseCard
              key={category.categoryId}
              category={category}
              index={index}
              data={data}
            />
          ))
        )}
      </div>

      {remainingCount > 0 || canShowLess ? (
        <div className={styles.showMoreWrap}>
          {canShowLess ? (
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={() => setExpandedBatches(current => Math.max(0, current - 1))}
            >
              {showLessLabel}
            </button>
          ) : null}

          {remainingCount > 0 ? (
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={() => setExpandedBatches(current => current + 1)}
            >
              {showMoreLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export function AgentDisabledState() {
  const { copy } = useAgentLocale()

  return (
    <section className={styles.authViewport}>
      <div className={styles.authScreenCard}>
        <AgentBrandLockup />
        <div className={styles.authIconWrap}>
          <Shield size={28} strokeWidth={2.1} />
        </div>
        <h1 className={styles.authTitle}>{copy.disabledTitle}</h1>
        <p className={styles.authBody}>{copy.disabledBody}</p>
        <div className={styles.authActions}>
          <AgentLogoutButton className={styles.secondaryButton} />
        </div>
      </div>
    </section>
  )
}

export function AgentAuthCard() {
  const router = useRouter()
  const { copy } = useAgentLocale()
  const [mobile, setMobile] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSessionToken, setOtpSessionToken] = useState('')
  const [previewQaOtp, setPreviewQaOtp] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [disabledState, setDisabledState] = useState(false)
  const isOtpStep = otpRequested

  const resetOtpStep = () => {
    setOtpRequested(false)
    setOtpCode('')
    setOtpSessionToken('')
    setPreviewQaOtp('')
    setMessage('')
    setError('')
    setDisabledState(false)
  }

  const requestOtp = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    setPreviewQaOtp('')
    setDisabledState(false)

    try {
      const response = await fetch('/api/labour/agent/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request OTP.')
      }

      setOtpCode('')
      setOtpSessionToken(typeof data.otpSessionToken === 'string' ? data.otpSessionToken : '')
      setPreviewQaOtp(typeof data.previewQaOtp === 'string' ? data.previewQaOtp : '')
      setOtpRequested(true)
      setMessage(data.message || copy.otpRequested)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to request OTP.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    setDisabledState(false)

    try {
      const response = await fetch('/api/labour/agent/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otpCode, otpSessionToken }),
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (response.status === 403 && data.enabled === false) {
        setDisabledState(true)
        setMessage(data.message || copy.disabledTitle)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP.')
      }

      router.replace('/labour/agent')
      router.refresh()
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Failed to verify OTP.')
    } finally {
      setLoading(false)
    }
  }

  if (disabledState) {
    return <AgentDisabledState />
  }

  return (
    <section className={styles.authViewport}>
      <div className={`${styles.authScreenCard} ${styles.authScreenCardCompact}`}>
        <AgentBrandLockup />

        <h1 className={styles.authTitle}>{copy.loginTitle}</h1>
        <p className={styles.authBody}>{copy.loginSubtitle}</p>

        <div className={styles.fieldStack}>
          <input
            className={styles.input}
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            readOnly={isOtpStep}
            onChange={event => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={copy.mobilePlaceholder}
          />
          {isOtpStep ? (
            <input
              className={styles.input}
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={copy.otpPlaceholder}
            />
          ) : null}
        </div>

        <div className={styles.authActions}>
          {!isOtpStep ? (
            <button type="button" className={styles.primaryButton} onClick={requestOtp} disabled={loading}>
              {loading ? copy.requesting : copy.requestOtp}
            </button>
          ) : (
            <>
              <button type="button" className={styles.primaryButton} onClick={verifyOtp} disabled={loading}>
                {loading ? copy.verifying : copy.verifyOtp}
              </button>
              <div className={styles.authSecondaryActions}>
                <button type="button" className={styles.authTextAction} onClick={requestOtp} disabled={loading}>
                  {copy.resendOtp}
                </button>
                <button type="button" className={styles.authTextAction} onClick={resetOtpStep} disabled={loading}>
                  {copy.changeMobileNumber}
                </button>
              </div>
            </>
          )}
        </div>

        {message ? <div className={styles.messageCard}>{message}</div> : null}
        {previewQaOtp ? <div className={styles.messageCard}>Preview QA OTP: {previewQaOtp}</div> : null}
        {error ? <div className={styles.errorCard}>{error}</div> : null}
        <p className={styles.authFootnote}>User enters OTP directly on the phone. No OTP is exposed in chat.</p>
      </div>
    </section>
  )
}

function ReferSharePanel({ data }: { data: AgentPageData }) {
  const { copy } = useAgentLocale()
  const [toast, setToast] = useState('')

  const onCopyCode = async () => {
    try {
      await copyToClipboard(data.dashboard.referralCode)
      setToast(copy.codeCopied)
    } catch {
      setToast(copy.pageError)
    }
  }

  const onCopyLink = async () => {
    try {
      await copyToClipboard(data.dashboard.referralLink)
      setToast(copy.linkCopied)
    } catch {
      setToast(copy.pageError)
    }
  }

  const onShare = async () => {
    try {
      await shareReferral(data.dashboard.referralCode, data.dashboard.referralLink)
    } catch {
      setToast(copy.pageError)
    }
  }

  return (
    <section className={styles.referenceCard}>
      <div className={styles.infoBlockCard}>
        <div className={styles.infoBlockLabel}>{copy.yourReferralCode}</div>
        <div className={styles.infoBlockValueRow}>
          <div className={styles.referralCodeValue}>{data.dashboard.referralCode}</div>
          <button type="button" className={styles.copyButton} onClick={onCopyCode}>
            <Copy size={20} strokeWidth={2.2} />
            {copy.copyCode}
          </button>
        </div>
      </div>

      <div className={styles.infoBlockCard}>
        <div className={styles.infoBlockLabel}>{copy.yourReferralLink}</div>
        <div className={styles.infoBlockValueRow}>
          <div className={styles.referralLinkValue}>{getDisplayLink(data.dashboard.referralLink)}</div>
          <button type="button" className={styles.copyButton} onClick={onCopyLink}>
            <Copy size={20} strokeWidth={2.2} />
            {copy.copyLink}
          </button>
        </div>
      </div>

      <a
        className={styles.whatsappButton}
        href={buildAgentWhatsappHref(data.dashboard.referralCode, data.dashboard.referralLink)}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={24} strokeWidth={2.2} />
        {copy.shareOnWhatsapp}
      </a>

      <button type="button" className={styles.moreShareButton} onClick={() => void onShare()}>
        <Share2 size={22} strokeWidth={2.2} />
        {copy.moreShareOptions}
      </button>

      {toast ? <div className={styles.messageCard}>{toast}</div> : null}
    </section>
  )
}

function HowItWorks() {
  const { copy } = useAgentLocale()
  const steps = [
    { icon: Share2, label: copy.stepShareLink },
    { icon: Users, label: copy.stepWorkerRegisters },
    { icon: Shield, label: copy.stepCompletesVerification },
    { icon: Gift, label: copy.stepYouEarnReward },
  ]

  return (
    <section className={styles.referenceCard}>
      <SectionTitle title={copy.howItWorks} action={<span className={styles.inlineLink}>{copy.viewDetails}</span>} />
      <div className={styles.stepsRow}>
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.label} className={styles.stepItem}>
              <div className={styles.stepIconCircle}>
                <Icon size={28} strokeWidth={2.1} />
              </div>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepLabel}>
                {step.label.split('\n').map(line => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function AgentHomeView({ data }: { data: AgentPageData }) {
  const { copy, locale } = useAgentLocale()

  return (
    <PageSurface>
      <HomeHeader data={data} />
      <ReferralHeroCard data={data} />
      <SummaryMetrics data={data} />

      <section className={styles.referenceCard}>
        <SectionTitle title={copy.quickActions} />
        <div className={styles.quickActionGrid}>
          <QuickActionCard
            icon={Link2}
            tone="orange"
            title={copy.shareReferralLink}
            body={data.dashboard.referralCode}
            onClick={() => {
              void shareReferral(data.dashboard.referralCode, data.dashboard.referralLink)
            }}
          />
          <QuickActionCard
            href="/labour/agent/referrals"
            icon={Users}
            tone="blue"
            title="My Referrals"
            body={`${data.dashboard.metrics.totalReferred}`}
          />
          <QuickActionCard
            href="/labour/agent/earnings"
            icon={Wallet}
            tone="green"
            title={copy.viewEarnings}
            body={formatAgentCurrency(data.dashboard.earnings.available, locale)}
          />
        </div>
      </section>

      <AgentInstallCta />
    </PageSurface>
  )
}

export function AgentReferView({ data }: { data: AgentPageData }) {
  const { copy } = useAgentLocale()

  return (
    <PageSurface>
      <div className={styles.subpageHeaderStack}>
        <AppHeader title="" left={<AgentBrandLockup />} right={<AgentHeaderControls />} />
        <AppHeader
          title={copy.refer}
          left={
            <Link href="/labour/agent" className={styles.headerNavLink} aria-label="Back">
              <ArrowLeft size={28} strokeWidth={2.2} />
            </Link>
          }
          right={
            <AgentHeaderIconButton
              ariaLabel="Share"
              onClick={() => {
                void shareReferral(data.dashboard.referralCode, data.dashboard.referralLink)
              }}
            >
              <Share2 size={24} strokeWidth={2.2} />
            </AgentHeaderIconButton>
          }
        />
      </div>

      <ReferHeroCard />
      <ReferSharePanel data={data} />
      <HowItWorks />
      <EligibleCategoriesSection data={data} />
    </PageSurface>
  )
}

export function AgentReferralsView({ data }: { data: AgentPageData }) {
  const { copy } = useAgentLocale()
  const [filter, setFilter] = useState<'all' | 'qualified' | 'pending' | 'rejected'>('all')

  const sortedItems = useMemo(() => sortHistory(data.dashboard.history), [data.dashboard.history])
  const items = useMemo(() => {
    if (filter === 'all') return sortedItems
    return sortedItems.filter(item => getDisplayStatus(item) === filter)
  }, [filter, sortedItems])

  const filters = [
    { key: 'all', label: copy.all },
    { key: 'qualified', label: copy.qualified },
    { key: 'pending', label: copy.pending },
    { key: 'rejected', label: copy.rejected },
  ] as const

  return (
    <PageSurface>
      <AppHeader
        title=""
        left={<AgentBrandLockup />}
        right={<AgentHeaderControls />}
      />

      <div className={styles.pageTitleRow}>
        <h1 className={styles.pageTitleMobile}>{copy.referrals}</h1>
        <div className={styles.headerActionRow}>
          <AgentHeaderIconButton ariaLabel="Search">
            <Search size={24} strokeWidth={2.2} />
          </AgentHeaderIconButton>
          <AgentHeaderIconButton ariaLabel="Filter">
            <SlidersHorizontal size={24} strokeWidth={2.2} />
          </AgentHeaderIconButton>
        </div>
      </div>

      <div className={styles.filterRow}>
        {filters.map(option => (
          <button
            key={option.key}
            type="button"
            className={`${styles.filterPill} ${filter === option.key ? styles.filterPillActive : ''}`}
            onClick={() => setFilter(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className={styles.referenceCard}>
        <SummaryMetrics data={data} />
      </section>

      <div className={styles.listStack}>
        {items.length === 0 ? (
          <section className={styles.emptyStateCard}>
            <div className={styles.emptyStateTitle}>{copy.noReferralHistory}</div>
          </section>
        ) : (
          items.map(item => (
            <ReferralListCard
              key={`${item.referredWorkerName}-${item.referralDate}-${item.categoryId}-${item.rewardStatus}`}
              item={item}
            />
          ))
        )}
      </div>

      <section className={styles.softPromoCard}>
        <ThemeIcon icon={Gift} tone="blue" />
        <div>
          <div className={styles.softPromoTitle}>Refer more workers and earn rewards</div>
          <div className={styles.softPromoBody}>Earnings will be added after worker verification.</div>
        </div>
      </section>
    </PageSurface>
  )
}

export function AgentEarningsView({ data }: { data: AgentPageData }) {
  const { copy, locale } = useAgentLocale()
  const history = useMemo(() => sortHistory(data.dashboard.history), [data.dashboard.history])

  return (
    <PageSurface>
      <AppHeader title="" left={<AgentBrandLockup />} right={<AgentHeaderControls />} />
      <h1 className={styles.pageTitleMobile}>{copy.earnings}</h1>
      <ReferralHeroCard data={data} mode="earnings" />

      <div className={styles.statQuadGrid}>
        <MetricCard icon={Wallet} tone="blue" value={formatAgentCurrency(data.dashboard.earnings.lifetimeEarned, locale)} label={copy.lifetimeEarned} />
        <MetricCard icon={Clock3} tone="orange" value={formatAgentCurrency(data.dashboard.earnings.pending, locale)} label="Pending Amount" />
        <MetricCard icon={ArrowRight} tone="green" value={formatAgentCurrency(data.dashboard.earnings.withdrawn, locale)} label="Withdrawn Amount" />
        <MetricCard icon={Wallet} tone="purple" value={formatAgentCurrency(data.workerWalletBalance, locale)} label={copy.workerWallet} />
      </div>

      <AgentPayoutDetailsEntryCard />

      <section className={styles.referenceCard}>
        <SectionTitle
          title="Recent Transactions"
          action={<Link href="/labour/agent/referrals" className={styles.inlineLink}>View All</Link>}
        />
        <div className={styles.transactionList}>
          {history.slice(0, 4).map(item => (
            <RecentTransactionRow
              key={`${item.referredWorkerName}-${item.referralDate}-${item.categoryId}-recent`}
              item={item}
            />
          ))}
        </div>
      </section>

      <section className={styles.softPromoCard}>
        <ThemeIcon icon={Shield} tone="blue" />
        <div>
          <div className={styles.softPromoTitle}>Keep referring & keep earning!</div>
          <div className={styles.softPromoBody}>Earnings will be added after worker verification.</div>
        </div>
      </section>
    </PageSurface>
  )
}

export function AgentPayoutDetailsView({ data: _data }: { data: AgentPageData }) {
  const { locale } = useAgentLocale()
  const payoutCopy = getAgentPayoutCopy(locale)
  void _data

  return (
    <PageSurface>
      <div className={styles.subpageHeaderStack}>
        <AppHeader title="" left={<AgentBrandLockup />} right={<AgentHeaderControls />} />
        <AppHeader
          title={payoutCopy.payoutDetailsTitle}
          left={
            <Link href="/labour/agent/earnings" className={styles.headerNavLink} aria-label="Back">
              <ArrowLeft size={28} strokeWidth={2.2} />
            </Link>
          }
        />
      </div>

      <section className={styles.referenceCard}>
        <div className={styles.payoutManageCardTitle}>{payoutCopy.payoutDetailsTitle}</div>
        <div className={styles.payoutManageCardBody}>{payoutCopy.payoutDetailsSubtitle}</div>
      </section>

      <AgentPayoutDetailsSection />
    </PageSurface>
  )
}

export function AgentCategoriesView({ data }: { data: AgentPageData }) {
  return (
    <PageSurface>
      <AppHeader
        title="Eligible Categories"
        left={
          <Link href="/labour/agent/refer" className={styles.headerNavLink} aria-label="Back">
            <ArrowLeft size={28} strokeWidth={2.2} />
          </Link>
        }
        right={
          <AgentHeaderIconButton ariaLabel="Info">
            <Info size={25} strokeWidth={2.2} />
          </AgentHeaderIconButton>
        }
      />

      <EligibleCategoriesSection data={data} showHeader={false} />

      <section className={styles.softPromoCard}>
        <ThemeIcon icon={Sparkles} tone="blue" />
        <div>
          <div className={styles.softPromoTitle}>More Categories Coming Soon!</div>
          <div className={styles.softPromoBody}>We are adding more job categories. Stay connected and keep referring.</div>
        </div>
      </section>
    </PageSurface>
  )
}

export function AgentProfileView({ data }: { data: AgentPageData }) {
  const { copy, locale } = useAgentLocale()
  const supportWhatsappHref = 'https://wa.me/919660768352'
  const supportCallHref = 'tel:9660768352'

  return (
    <PageSurface>
      <AppHeader title="" left={<AgentBrandLockup />} right={<AgentHeaderControls />} />
      <h1 className={styles.pageTitleMobile}>{copy.profile}</h1>
      <ProfileHeroCard data={data} />

      <section className={styles.referenceCard}>
        <InfoRow icon={Phone} tone="blue" label="Mobile Number" value={<span className={styles.infoValueStrong}>{data.session.mobile}</span>} />
        <InfoRow icon={Ticket} tone="green" label={copy.referralCode} value={<span className={styles.infoValueStrong}>{data.dashboard.referralCode}</span>} />
        <InfoRow icon={Link2} tone="orange" label={copy.referralLink} value={<span className={styles.infoValueLink}>{getDisplayLink(data.dashboard.referralLink)}</span>} />
        <InfoRow icon={Shield} tone="purple" label={copy.agentStatus} value={<StatusBadge status="active" label="Active" />} />
        <InfoRow icon={Wallet} tone="orange" label={copy.workerWallet} value={<span className={styles.infoValueStrong}>{formatAgentCurrency(data.workerWalletBalance, locale)}</span>} />
        <InfoRow icon={Headset} tone="blue" label={copy.support} value={<span className={styles.infoValueLink}>rozgar.scalevyapar.in/contact</span>} href="https://rozgar.scalevyapar.in/contact" />
        <div className={styles.supportActionGrid}>
          <a className={styles.supportActionButton} href={supportWhatsappHref} target="_blank" rel="noreferrer">
            <ThemeIcon icon={MessageCircle} tone="green" />
            <div className={styles.supportActionText}>
              <div className={styles.supportActionLabel}>Connect on WhatsApp</div>
              <div className={styles.supportActionHint}>9660768352</div>
            </div>
          </a>
          <a className={styles.supportActionButton} href={supportCallHref}>
            <ThemeIcon icon={Phone} tone="blue" />
            <div className={styles.supportActionText}>
              <div className={styles.supportActionLabel}>Call Us</div>
              <div className={styles.supportActionHint}>9660768352</div>
            </div>
          </a>
        </div>
      </section>

      <section className={styles.referenceCard}>
        <SectionTitle title="Your Performance" />
        <SummaryMetrics data={data} />
      </section>

      <section className={styles.referenceCard}>
        <div className={styles.logoutButtonWrap}>
          <AgentLogoutButton className={styles.logoutButton} />
        </div>
      </section>
    </PageSurface>
  )
}
