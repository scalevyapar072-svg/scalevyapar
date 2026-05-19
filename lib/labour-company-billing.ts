export const RUPEE_SYMBOL = '\u20B9'
const DEFAULT_GST_PERCENTAGE = 18
const DEFAULT_HSN_CODE = '998519'

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
  taxableValue: number
  taxAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstPercentage: number
  totalAmount: number
  amountInWords: string
  particulars: string
  declaration: string
  note: string
}

export const FALLBACK_BILLING_HISTORY: CompanyBillingRecord[] = [
  {
    id: 'pending-3-months-2026-05-19',
    date: '19 May 2026',
    time: '11:13:45 PM',
    planDetails: '3 Months Plan',
    appliesUntil: 'Ordered on: May 19, 2026',
    amount: 4306,
    status: 'Pending',
    statusType: 'pending',
    actionLabel: 'Retry payment',
    actionType: 'retry'
  },
  {
    id: 'success-2-job-credit-2026-04-30',
    date: '30 Apr 2026',
    time: '3:52:33 PM',
    planDetails: '2 Job Credit Package',
    appliesUntil: 'Paid on: Apr 30, 2026',
    amount: 1651,
    status: 'Success',
    statusType: 'success',
    actionLabel: 'Invoice',
    actionType: 'invoice'
  },
  {
    id: 'failed-2-job-credit-2026-05-06',
    date: '06 May 2026',
    time: '3:03:54 AM',
    planDetails: '2 Job Credit Package',
    appliesUntil: 'Ordered on: May 6, 2026',
    amount: 1651,
    status: 'Cancelled',
    statusType: 'failed',
    actionLabel: 'Contact us',
    actionType: 'contact'
  }
]

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
  if (status === 'pending' || status === 'processing') {
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
    actionType
  }
}

export const resolveCompanyBillingHistory = (source: CompanyBillingDashboardSource | null | undefined): CompanyBillingRecord[] => {
  const records = Array.isArray(source?.billingHistory)
    ? source.billingHistory
      .map((record, index) => normalizeBillingRecord(record, index))
      .filter((record): record is CompanyBillingRecord => Boolean(record))
    : []

  return records.length ? records : FALLBACK_BILLING_HISTORY
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

const normalizeGstin = (value: string | undefined) => String(value || '').trim().toUpperCase()

const derivePanFromGstin = (gstin: string) => {
  const normalized = normalizeGstin(gstin)
  if (normalized.length >= 12) {
    return normalized.slice(2, 12)
  }
  return ''
}

const deriveStateCodeFromGstin = (gstin: string) => {
  const normalized = normalizeGstin(gstin)
  return normalized.length >= 2 ? normalized.slice(0, 2) : ''
}

export const buildInvoiceBuyer = (profile: CompanyBillingProfile, fallbackGstin: string): CompanyInvoiceParty => {
  const gstin = normalizeGstin(profile.gstNumber) || normalizeGstin(fallbackGstin) || 'Not added'
  const stateCode = gstin !== 'Not added' ? deriveStateCodeFromGstin(gstin) : ''
  const placeOfSupply = [profile.state?.trim(), stateCode ? `Code ${stateCode}` : ''].filter(Boolean).join(' - ') || 'Not available'

  return {
    name: profile.companyName?.trim() || profile.contactPerson?.trim() || 'Company account holder',
    address: buildBillingAddress(profile) || 'Address not added',
    gstin,
    pan: gstin !== 'Not added' ? derivePanFromGstin(gstin) : '',
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
}): CompanyInvoiceSeller => {
  const gstin = normalizeGstin(input.gstin) || '08AJOPM0347B1ZE'
  const stateCode = deriveStateCodeFromGstin(gstin)

  return {
    name: input.name?.trim() || 'ScaleVyapar Rozgar',
    address: input.address?.trim() || 'ScaleVyapar, India',
    gstin,
    pan: derivePanFromGstin(gstin),
    placeOfSupply: stateCode ? `Code ${stateCode}` : 'Not available',
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

const parseGstPercentage = (value: number | string | undefined) => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_GST_PERCENTAGE
  }
  return parsed
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
}): CompanyTaxInvoiceDocument => {
  const gstPercentage = parseGstPercentage(input.gstPercentage)
  const totalAmount = Math.max(0, Math.round(input.record.amount))
  const taxableValue = Math.max(0, Math.round((totalAmount * 100) / (100 + gstPercentage)))
  const taxAmount = Math.max(0, totalAmount - taxableValue)
  const buyerStateCode = input.buyer.placeOfSupplyCode
  const sellerStateCode = input.seller.placeOfSupplyCode
  const isInterState = !buyerStateCode || !sellerStateCode || buyerStateCode !== sellerStateCode
  const igstAmount = isInterState ? taxAmount : 0
  const cgstAmount = isInterState ? 0 : Math.round(taxAmount / 2)
  const sgstAmount = isInterState ? 0 : taxAmount - cgstAmount
  const invoiceNumber = `SVRZ-${input.record.id.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toUpperCase()}`
  const particulars = `ScaleVyapar Rozgar Recruitment Services: ${inferPlanSummary(input.record)}`

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
    hsnCode: DEFAULT_HSN_CODE,
    taxableValue,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    gstPercentage,
    totalAmount,
    amountInWords: amountToWords(totalAmount),
    particulars,
    declaration: 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
    note: 'This is a computer-generated Invoice and does not require signature.'
  }
}
