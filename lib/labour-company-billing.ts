import {
  calculateInclusiveTaxBreakdown,
  derivePanFromGstin,
  deriveStateCodeFromGstin,
  normalizeGstin,
  resolveCompanyTaxResolution,
  resolveLabourCompanyTaxSettings,
  resolveStateCodeFromName,
  resolveStateNameFromCode,
  type LabourCompanyTaxSettings,
  type LabourCompanyTaxType
} from './labour-company-tax'
import { createPricingPlanSlug } from './labour-company-checkout'
import type {
  LabourCompanyRecord,
  LabourPlanRecord,
  LabourWalletTransactionRecord,
  WalletTransactionType
} from './labour-marketplace'

export const RUPEE_SYMBOL = '\u20B9'

export type BillingHistoryTab = 'all' | 'success' | 'pending' | 'failed'

export type CompanyBillingRecord = {
  id: string
  date: string
  time: string
  planDetails: string
  appliesUntil: string
  amount: number
  status: string
  statusType: Exclude<BillingHistoryTab, 'all'>
  actionLabel: string
  actionType: 'retry' | 'invoice' | 'contact'
  createdAt?: string
  planId?: string
  referenceId?: string
  retryHref?: string | null
  invoiceAvailable?: boolean
}

export type CompanyBillingDashboardSource = {
  billingHistory?: Array<Partial<CompanyBillingRecord> & Record<string, unknown>> | null
}

export type CompanyBillingProfile = {
  companyName?: string
  contactPerson?: string
  companyAddress?: string
  area?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  email?: string
}

export type CompanyInvoiceParty = {
  name: string
  address: string
  gstin: string
  pan: string
  placeOfSupply: string
  placeOfSupplyCode: string
  email: string
  phone: string
}

export type CompanyInvoiceSeller = CompanyInvoiceParty & {
  bankName: string
  accountName: string
  accountNumber: string
  ifsc: string
  branch: string
}

export type CompanyTaxInvoiceDocument = {
  invoiceNumber: string
  invoiceDate: string
  acknowledgementNumber: string
  acknowledgementDate: string
  irnNumber: string
  modeOfPayment: string
  termsOfPayment: string
  record: CompanyBillingRecord
  seller: CompanyInvoiceSeller
  buyer: CompanyInvoiceParty
  hsnCode: string
  serviceDescription: string
  taxableValue: number
  taxAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstPercentage: number
  cgstPercentage: number
  sgstPercentage: number
  igstPercentage: number
  taxType: LabourCompanyTaxType
  taxTypeLabel: string
  totalAmount: number
  amountInWords: string
  particulars: string
  declaration: string
  note: string
}

const formatRecordDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatRecordTime = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '')
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const normalizeStatusType = (value: unknown): CompanyBillingRecord['statusType'] => {
  if (value === 'success' || value === 'pending' || value === 'failed') {
    return value
  }

  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (status === 'success' || status === 'paid' || status === 'completed') {
    return 'success'
  }
  if (status === 'pending' || status === 'processing' || status === 'attention') {
    return 'pending'
  }
  return 'failed'
}

const normalizeActionType = (value: unknown, statusType: CompanyBillingRecord['statusType']): CompanyBillingRecord['actionType'] => {
  if (value === 'retry' || value === 'invoice' || value === 'contact') {
    return value
  }

  if (statusType === 'success') return 'invoice'
  if (statusType === 'pending') return 'retry'
  return 'contact'
}

const defaultActionLabel = (actionType: CompanyBillingRecord['actionType']) => {
  if (actionType === 'invoice') return 'Invoice'
  if (actionType === 'retry') return 'Retry payment'
  return 'Contact us'
}

const normalizeBillingRecord = (
  item: Partial<CompanyBillingRecord> & Record<string, unknown>,
  index: number
): CompanyBillingRecord | null => {
  const rawDate = typeof item.date === 'string' && item.date.trim()
    ? item.date.trim()
    : typeof item.createdAt === 'string' && item.createdAt.trim()
      ? formatRecordDate(item.createdAt.trim())
      : ''

  const rawTime = typeof item.time === 'string' && item.time.trim()
    ? item.time.trim()
    : typeof item.createdAt === 'string' && item.createdAt.trim()
      ? formatRecordTime(item.createdAt.trim())
      : ''

  const planDetails = typeof item.planDetails === 'string' && item.planDetails.trim()
    ? item.planDetails.trim()
    : typeof item.planName === 'string' && item.planName.trim()
      ? item.planName.trim()
      : typeof item.title === 'string' && item.title.trim()
        ? item.title.trim()
        : ''

  if (!rawDate || !planDetails) {
    return null
  }

  const statusType = normalizeStatusType(item.statusType || item.status)
  const actionType = normalizeActionType(item.actionType, statusType)

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `billing-record-${index + 1}`,
    date: rawDate,
    time: rawTime || '--',
    planDetails,
    appliesUntil: typeof item.appliesUntil === 'string' && item.appliesUntil.trim()
      ? item.appliesUntil.trim()
      : typeof item.summaryLabel === 'string' && item.summaryLabel.trim()
        ? item.summaryLabel.trim()
        : 'Ordered recently',
    amount: Math.max(0, Math.round(toNumber(item.amount))),
    status: typeof item.status === 'string' && item.status.trim()
      ? item.status.trim()
      : statusType === 'success'
        ? 'Success'
        : statusType === 'pending'
          ? 'Pending'
          : 'Cancelled',
    statusType,
    actionLabel: typeof item.actionLabel === 'string' && item.actionLabel.trim()
      ? item.actionLabel.trim()
      : defaultActionLabel(actionType),
    actionType,
    createdAt: typeof item.createdAt === 'string' && item.createdAt.trim() ? item.createdAt.trim() : undefined,
    planId: typeof item.planId === 'string' && item.planId.trim() ? item.planId.trim() : undefined,
    referenceId: typeof item.referenceId === 'string' && item.referenceId.trim()
      ? item.referenceId.trim()
      : typeof item.reference === 'string' && item.reference.trim()
        ? item.reference.trim()
        : undefined,
    retryHref: typeof item.retryHref === 'string' && item.retryHref.trim() ? item.retryHref.trim() : null,
    invoiceAvailable: item.invoiceAvailable !== false
  }
}

export const resolveCompanyBillingHistory = (source: CompanyBillingDashboardSource | null | undefined): CompanyBillingRecord[] => {
  const records = Array.isArray(source?.billingHistory)
    ? source.billingHistory
      .map((record, index) => normalizeBillingRecord(record, index))
      .filter((record): record is CompanyBillingRecord => Boolean(record))
    : []

  return records
}

const addDaysToIsoDate = (value: string, days: number) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || days <= 0) {
    return ''
  }

  parsed.setDate(parsed.getDate() + days)
  return parsed.toISOString()
}

const titleCaseWords = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

const inferPlanNameFromNote = (note: string) => {
  const checkoutMatch = note.match(/for\s+(.+?)\s+\((monthly|yearly)\)/i)
  if (checkoutMatch?.[1]) {
    return checkoutMatch[1].trim()
  }

  const adminActivationMatch = note.match(/Company plan\s+(.+?)\s+activated/i)
  if (adminActivationMatch?.[1]) {
    return adminActivationMatch[1].trim()
  }

  return ''
}

const inferBillingModeFromNote = (note: string): 'monthly' | 'yearly' =>
  /\b(yearly|annual|annually)\b/i.test(note) ? 'yearly' : 'monthly'

const labelForTransactionType = (transactionType: WalletTransactionType) => {
  if (transactionType === 'plan_purchase') return 'Plan Purchase'
  if (transactionType === 'wallet_recharge') return 'Wallet Recharge'
  if (transactionType === 'registration_fee') return 'Registration Fee'
  if (transactionType === 'manual_adjustment') return 'Manual Adjustment'
  return titleCaseWords(transactionType)
}

const resolvePlanForTransaction = (
  transaction: LabourWalletTransactionRecord,
  plans: LabourPlanRecord[]
) => {
  const byReference = plans.find(plan => plan.id === transaction.reference)
  if (byReference) {
    return byReference
  }

  const normalizedNote = transaction.note.trim().toLowerCase()
  return plans.find(plan => normalizedNote.includes(plan.name.trim().toLowerCase()))
}

const shouldAllowInvoice = (
  statusType: CompanyBillingRecord['statusType'],
  transactionType: WalletTransactionType
) =>
  statusType === 'success' &&
  ['plan_purchase', 'wallet_recharge', 'registration_fee'].includes(transactionType)

const shouldAllowRetry = (
  statusType: CompanyBillingRecord['statusType'],
  transactionType: WalletTransactionType,
  plan: LabourPlanRecord | undefined
) =>
  statusType !== 'success' &&
  Boolean(plan) &&
  ['plan_purchase', 'wallet_recharge'].includes(transactionType)

export const buildCompanyBillingHistoryFromLedger = ({
  company,
  plans,
  walletTransactions
}: {
  company: LabourCompanyRecord
  plans: LabourPlanRecord[]
  walletTransactions: LabourWalletTransactionRecord[]
}): CompanyBillingRecord[] => {
  return walletTransactions
    .filter(transaction => transaction.entityType === 'company' && transaction.entityId === company.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(transaction => {
      const plan = resolvePlanForTransaction(transaction, plans)
      const statusType = normalizeStatusType(transaction.status)
      const invoiceAvailable = shouldAllowInvoice(statusType, transaction.transactionType)
      const retryAvailable = shouldAllowRetry(statusType, transaction.transactionType, plan)
      const planLabel = inferPlanNameFromNote(transaction.note) || plan?.name || labelForTransactionType(transaction.transactionType)
      const status = statusType === 'success' ? 'Success' : statusType === 'pending' ? 'Pending' : 'Failed'
      const actionType: CompanyBillingRecord['actionType'] = invoiceAvailable
        ? 'invoice'
        : retryAvailable
          ? 'retry'
          : 'contact'
      const billingMode = inferBillingModeFromNote(transaction.note)
      const planExpiresAt = plan ? addDaysToIsoDate(transaction.createdAt, plan.validityDays || plan.planValidityDays || 0) : ''

      return {
        id: transaction.id,
        date: formatRecordDate(transaction.createdAt),
        time: formatRecordTime(transaction.createdAt) || '--',
        planDetails: planLabel,
        appliesUntil: invoiceAvailable && planExpiresAt
          ? `Applies until: ${formatRecordDate(planExpiresAt)}`
          : statusType === 'success'
            ? `Paid on: ${formatRecordDate(transaction.createdAt)}`
            : `Ordered on: ${formatRecordDate(transaction.createdAt)}`,
        amount: Math.max(0, Math.round(Number(transaction.amount || 0))),
        status,
        statusType,
        actionLabel: invoiceAvailable ? 'Invoice' : retryAvailable ? 'Retry payment' : 'Contact us',
        actionType,
        createdAt: transaction.createdAt,
        planId: plan?.id,
        referenceId: transaction.reference || transaction.id,
        retryHref: retryAvailable && plan
          ? `/labour/company/checkout?plan=${encodeURIComponent(createPricingPlanSlug(plan.name))}&billing=${billingMode}`
          : null,
        invoiceAvailable
      } satisfies CompanyBillingRecord
    })
}

export const formatBillingAmount = (value: number) => `${RUPEE_SYMBOL} ${Math.max(0, Math.round(Number(value || 0))).toLocaleString('en-IN')}`

export const billingStatusTone = (statusType: CompanyBillingRecord['statusType']) => {
  if (statusType === 'success') {
    return { background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0' }
  }

  if (statusType === 'pending') {
    return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }
  }

  return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
}

export const buildBillingAddress = (profile: CompanyBillingProfile) => {
  const seen = new Set<string>()
  const parts = [
    profile.companyAddress,
    profile.area,
    profile.city,
    profile.state,
    profile.pincode
  ]
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .filter(part => {
      const normalized = part.toLowerCase()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })

  return parts.join(', ')
}

export const buildInvoiceBuyer = (profile: CompanyBillingProfile): CompanyInvoiceParty => {
  const gstin = normalizeGstin(profile.gstNumber)
  const stateCode = deriveStateCodeFromGstin(gstin) || resolveStateCodeFromName(profile.state)
  const stateName = profile.state?.trim() || resolveStateNameFromCode(stateCode)
  const placeOfSupply = [stateName, stateCode ? `Code ${stateCode}` : ''].filter(Boolean).join(' - ') || 'Not available'

  return {
    name: profile.companyName?.trim() || profile.contactPerson?.trim() || 'Company account holder',
    address: buildBillingAddress(profile) || 'Address not added',
    gstin: gstin || 'Not added',
    pan: gstin ? derivePanFromGstin(gstin) : '',
    placeOfSupply,
    placeOfSupplyCode: stateCode,
    email: profile.email?.trim() || 'Not added',
    phone: ''
  }
}

export const buildInvoiceSeller = (input: {
  name?: string
  address?: string
  gstin?: string
  email?: string
  phone?: string
  state?: string
  stateCode?: string
}): CompanyInvoiceSeller => {
  const gstin = normalizeGstin(input.gstin) || '08AJOPM0347B1ZE'
  const stateCode = input.stateCode?.trim() || deriveStateCodeFromGstin(gstin) || resolveStateCodeFromName(input.state)
  const stateName = input.state?.trim() || resolveStateNameFromCode(stateCode)

  return {
    name: input.name?.trim() || 'ScaleVyapar Rozgar',
    address: input.address?.trim() || 'ScaleVyapar, India',
    gstin,
    pan: derivePanFromGstin(gstin),
    placeOfSupply: [stateName, stateCode ? `Code ${stateCode}` : ''].filter(Boolean).join(' - ') || 'Not available',
    placeOfSupplyCode: stateCode,
    email: input.email?.trim() || 'support@scalevyapar.in',
    phone: input.phone?.trim() || '+91 00000 00000',
    bankName: 'Bank details available on request',
    accountName: 'ScaleVyapar Rozgar',
    accountNumber: 'To be shared by billing desk',
    ifsc: 'TBA0000000',
    branch: 'India'
  }
}

const inferJobCreditCount = (planDetails: string) => {
  const jobCreditMatch = planDetails.match(/(\d+)\s*job credit/i)
  if (jobCreditMatch) {
    return Number(jobCreditMatch[1])
  }
  return 1
}

const inferPlanSummary = (record: CompanyBillingRecord) => {
  if (/job credit/i.test(record.planDetails)) {
    const count = inferJobCreditCount(record.planDetails)
    return `${count} Job Credit${count === 1 ? '' : 's'}`
  }

  return record.planDetails
}

const toWordsBelowThousand = (value: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

  if (value === 0) return ''
  if (value < 10) return ones[value]
  if (value < 20) return teens[value - 10]
  if (value < 100) {
    const remainder = value % 10
    return `${tens[Math.floor(value / 10)]}${remainder ? ` ${ones[remainder]}` : ''}`.trim()
  }

  const remainder = value % 100
  return `${ones[Math.floor(value / 100)]} hundred${remainder ? ` ${toWordsBelowThousand(remainder)}` : ''}`.trim()
}

export const amountToWords = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 'Zero rupees only'
  }

  const segments: Array<[number, string]> = [
    [10000000, 'crore'],
    [100000, 'lakh'],
    [1000, 'thousand'],
    [1, '']
  ]

  let remaining = Math.floor(value)
  const words: string[] = []

  for (const [base, label] of segments) {
    if (remaining >= base) {
      const chunk = Math.floor(remaining / base)
      remaining %= base
      const chunkWords = toWordsBelowThousand(chunk)
      if (chunkWords) {
        words.push(label ? `${chunkWords} ${label}` : chunkWords)
      }
    }
  }

  const sentence = words.join(' ').replace(/\s+/g, ' ').trim()
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} rupees only`
}

export const buildTaxInvoiceDocument = (input: {
  record: CompanyBillingRecord
  buyer: CompanyInvoiceParty
  seller: CompanyInvoiceSeller
  gstPercentage?: number | string
  taxSettings?: Partial<LabourCompanyTaxSettings> | null
}): CompanyTaxInvoiceDocument => {
  const totalAmount = Math.max(0, Math.round(input.record.amount))
  const taxSettings = resolveLabourCompanyTaxSettings(input.taxSettings, input.gstPercentage)
  const taxResolution = resolveCompanyTaxResolution({
    buyerGstin: input.buyer.gstin,
    buyerState: input.buyer.placeOfSupply,
    buyerStateCode: input.buyer.placeOfSupplyCode,
    sellerGstin: input.seller.gstin,
    sellerState: input.seller.placeOfSupply,
    sellerStateCode: input.seller.placeOfSupplyCode,
    settings: taxSettings
  })
  const taxBreakdown = calculateInclusiveTaxBreakdown(totalAmount, taxResolution)
  const invoiceNumber = `SVRZ-${input.record.id.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toUpperCase()}`
  const particulars = `${taxSettings.serviceDescription}: ${inferPlanSummary(input.record)}`

  return {
    invoiceNumber,
    invoiceDate: input.record.date,
    acknowledgementNumber: 'Not applicable',
    acknowledgementDate: input.record.date,
    irnNumber: 'Not applicable',
    modeOfPayment: 'Online',
    termsOfPayment: 'Due on receipt',
    record: input.record,
    seller: input.seller,
    buyer: input.buyer,
    hsnCode: taxSettings.hsnCode,
    serviceDescription: taxSettings.serviceDescription,
    taxableValue: taxBreakdown.taxableValue,
    taxAmount: taxBreakdown.taxAmount,
    cgstAmount: taxBreakdown.cgstAmount,
    sgstAmount: taxBreakdown.sgstAmount,
    igstAmount: taxBreakdown.igstAmount,
    gstPercentage: taxBreakdown.totalGstPercent,
    cgstPercentage: taxBreakdown.cgstPercent,
    sgstPercentage: taxBreakdown.sgstPercent,
    igstPercentage: taxBreakdown.igstPercent,
    taxType: taxBreakdown.taxType,
    taxTypeLabel: taxBreakdown.label,
    totalAmount,
    amountInWords: amountToWords(totalAmount),
    particulars,
    declaration: 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
    note: 'This is a computer-generated Invoice and does not require signature.'
  }
}
