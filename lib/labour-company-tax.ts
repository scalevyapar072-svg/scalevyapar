export type LabourCompanyTaxSettings = {
  sellerGstin: string
  sellerState: string
  sellerStateCode: string
  gstEnabled: boolean
  intraStateCgstPercent: string
  intraStateSgstPercent: string
  interStateIgstPercent: string
  hsnCode: string
  serviceDescription: string
  sellerLegalName: string
  sellerAddress: string
  sellerEmail: string
  sellerPhone: string
}

export type LabourCompanyResolvedTaxSettings = LabourCompanyTaxSettings & {
  intraStateCgstPercentValue: number
  intraStateSgstPercentValue: number
  interStateIgstPercentValue: number
}

export type LabourCompanyTaxType = 'intra_state' | 'inter_state' | 'gst_disabled'

export type LabourCompanyTaxResolution = {
  taxType: LabourCompanyTaxType
  sellerState: string
  sellerStateCode: string
  buyerState: string
  buyerStateCode: string
  cgstPercent: number
  sgstPercent: number
  igstPercent: number
  totalGstPercent: number
  label: string
}

export type LabourCompanyTaxBreakdown = LabourCompanyTaxResolution & {
  taxableValue: number
  taxAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
}

const DEFAULT_GST_PERCENTAGE = 18
const DEFAULT_SELLER_GSTIN = '08AJOPM0347B1ZE'
const DEFAULT_SELLER_STATE = 'Rajasthan'
const DEFAULT_SELLER_STATE_CODE = '08'

const STATE_CODE_TO_NAME: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
}

const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([code, name]) => [name.toLowerCase(), code])
)

const normalizeString = (value: string | null | undefined) => String(value || '').trim()

const normalizeBoolean = (value: boolean | string | null | undefined, fallback: boolean) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

const sanitizePercentage = (value: string | number | null | undefined, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

const roundCurrency = (value: number) => Math.max(0, Math.round(value))

export const normalizeGstin = (value: string | undefined) => normalizeString(value).toUpperCase()

export const derivePanFromGstin = (gstin: string) => {
  const normalized = normalizeGstin(gstin)
  return normalized.length >= 12 ? normalized.slice(2, 12) : ''
}

export const deriveStateCodeFromGstin = (gstin: string) => {
  const normalized = normalizeGstin(gstin)
  return /^\d{2}/.test(normalized) ? normalized.slice(0, 2) : ''
}

export const resolveStateCodeFromName = (state: string | undefined) => {
  const normalized = normalizeString(state).toLowerCase()
  return STATE_NAME_TO_CODE[normalized] || ''
}

export const resolveStateNameFromCode = (code: string | undefined) => {
  const normalized = normalizeString(code)
  return STATE_CODE_TO_NAME[normalized] || ''
}

const resolveComparableStateName = (state: string | undefined, stateCode: string | undefined) => {
  const fromName = normalizeString(state)
  if (fromName) return fromName.toLowerCase()
  const fromCode = resolveStateNameFromCode(stateCode)
  return fromCode.toLowerCase()
}

export const resolveLabourCompanyTaxSettings = (
  settings: Partial<LabourCompanyTaxSettings> | null | undefined,
  fallbackGstPercentage?: string | number | null
): LabourCompanyResolvedTaxSettings => {
  const genericGstPercent = sanitizePercentage(fallbackGstPercentage, DEFAULT_GST_PERCENTAGE)
  const sellerGstin = normalizeGstin(settings?.sellerGstin) || DEFAULT_SELLER_GSTIN
  const sellerStateCode = normalizeString(settings?.sellerStateCode) || deriveStateCodeFromGstin(sellerGstin) || DEFAULT_SELLER_STATE_CODE
  const sellerState = normalizeString(settings?.sellerState) || resolveStateNameFromCode(sellerStateCode) || DEFAULT_SELLER_STATE

  const intraStateCgstPercentValue = sanitizePercentage(settings?.intraStateCgstPercent, genericGstPercent / 2)
  const intraStateSgstPercentValue = sanitizePercentage(settings?.intraStateSgstPercent, genericGstPercent / 2)
  const interStateIgstPercentValue = sanitizePercentage(settings?.interStateIgstPercent, genericGstPercent)

  return {
    sellerGstin,
    sellerState,
    sellerStateCode,
    gstEnabled: normalizeBoolean(settings?.gstEnabled, true),
    intraStateCgstPercent: normalizeString(settings?.intraStateCgstPercent) || String(intraStateCgstPercentValue),
    intraStateSgstPercent: normalizeString(settings?.intraStateSgstPercent) || String(intraStateSgstPercentValue),
    interStateIgstPercent: normalizeString(settings?.interStateIgstPercent) || String(interStateIgstPercentValue),
    hsnCode: normalizeString(settings?.hsnCode) || '998519',
    serviceDescription: normalizeString(settings?.serviceDescription) || 'ScaleVyapar Rozgar Recruitment Services',
    sellerLegalName: normalizeString(settings?.sellerLegalName) || 'ScaleVyapar Rozgar',
    sellerAddress: normalizeString(settings?.sellerAddress) || 'ScaleVyapar Private Limited, Surat, Gujarat, India - 395002',
    sellerEmail: normalizeString(settings?.sellerEmail) || 'support@scalevyapar.in',
    sellerPhone: normalizeString(settings?.sellerPhone) || '+91 63588 36897',
    intraStateCgstPercentValue,
    intraStateSgstPercentValue,
    interStateIgstPercentValue
  }
}

export const resolveCompanyTaxResolution = ({
  buyerGstin,
  buyerState,
  buyerStateCode,
  sellerGstin,
  sellerState,
  sellerStateCode,
  settings
}: {
  buyerGstin?: string
  buyerState?: string
  buyerStateCode?: string
  sellerGstin?: string
  sellerState?: string
  sellerStateCode?: string
  settings: LabourCompanyResolvedTaxSettings
}): LabourCompanyTaxResolution => {
  const resolvedSellerStateCode =
    normalizeString(sellerStateCode) ||
    deriveStateCodeFromGstin(sellerGstin || '') ||
    settings.sellerStateCode
  const resolvedSellerState =
    normalizeString(sellerState) ||
    resolveStateNameFromCode(resolvedSellerStateCode) ||
    settings.sellerState

  const resolvedBuyerStateCode =
    deriveStateCodeFromGstin(buyerGstin || '') ||
    normalizeString(buyerStateCode) ||
    resolveStateCodeFromName(buyerState)
  const resolvedBuyerState =
    normalizeString(buyerState) ||
    resolveStateNameFromCode(resolvedBuyerStateCode)

  if (!settings.gstEnabled) {
    return {
      taxType: 'gst_disabled',
      sellerState: resolvedSellerState,
      sellerStateCode: resolvedSellerStateCode,
      buyerState: resolvedBuyerState,
      buyerStateCode: resolvedBuyerStateCode,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      totalGstPercent: 0,
      label: 'GST disabled'
    }
  }

  const sellerComparable = resolveComparableStateName(resolvedSellerState, resolvedSellerStateCode)
  const buyerComparable = resolveComparableStateName(resolvedBuyerState, resolvedBuyerStateCode)

  const isIntraState = Boolean(
    resolvedBuyerStateCode && resolvedSellerStateCode
      ? resolvedBuyerStateCode === resolvedSellerStateCode
      : sellerComparable && buyerComparable && sellerComparable === buyerComparable
  )

  if (isIntraState) {
    const totalGstPercent = settings.intraStateCgstPercentValue + settings.intraStateSgstPercentValue
    return {
      taxType: 'intra_state',
      sellerState: resolvedSellerState,
      sellerStateCode: resolvedSellerStateCode,
      buyerState: resolvedBuyerState,
      buyerStateCode: resolvedBuyerStateCode,
      cgstPercent: settings.intraStateCgstPercentValue,
      sgstPercent: settings.intraStateSgstPercentValue,
      igstPercent: 0,
      totalGstPercent,
      label: `CGST (${settings.intraStateCgstPercentValue}%) + SGST (${settings.intraStateSgstPercentValue}%)`
    }
  }

  return {
    taxType: 'inter_state',
    sellerState: resolvedSellerState,
    sellerStateCode: resolvedSellerStateCode,
    buyerState: resolvedBuyerState,
    buyerStateCode: resolvedBuyerStateCode,
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: settings.interStateIgstPercentValue,
    totalGstPercent: settings.interStateIgstPercentValue,
    label: `IGST (${settings.interStateIgstPercentValue}%)`
  }
}

export const calculateInclusiveTaxBreakdown = (totalAmount: number, resolution: LabourCompanyTaxResolution): LabourCompanyTaxBreakdown => {
  const roundedTotal = roundCurrency(totalAmount)
  if (resolution.totalGstPercent <= 0) {
    return {
      ...resolution,
      taxableValue: roundedTotal,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: roundedTotal
    }
  }

  const taxableValue = roundCurrency((roundedTotal * 100) / (100 + resolution.totalGstPercent))
  const taxAmount = Math.max(0, roundedTotal - taxableValue)
  const igstAmount = resolution.taxType === 'inter_state' ? taxAmount : 0
  const cgstAmount = resolution.taxType === 'intra_state' ? roundCurrency(taxAmount / 2) : 0
  const sgstAmount = resolution.taxType === 'intra_state' ? Math.max(0, taxAmount - cgstAmount) : 0

  return {
    ...resolution,
    taxableValue,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount: roundedTotal
  }
}

export const calculateExclusiveTaxBreakdown = (taxableValue: number, resolution: LabourCompanyTaxResolution): LabourCompanyTaxBreakdown => {
  const roundedTaxableValue = roundCurrency(taxableValue)
  const taxAmount = resolution.totalGstPercent > 0
    ? roundCurrency((roundedTaxableValue * resolution.totalGstPercent) / 100)
    : 0
  const igstAmount = resolution.taxType === 'inter_state' ? taxAmount : 0
  const cgstAmount = resolution.taxType === 'intra_state' ? roundCurrency(taxAmount / 2) : 0
  const sgstAmount = resolution.taxType === 'intra_state' ? Math.max(0, taxAmount - cgstAmount) : 0

  return {
    ...resolution,
    taxableValue: roundedTaxableValue,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount: roundCurrency(roundedTaxableValue + taxAmount)
  }
}
