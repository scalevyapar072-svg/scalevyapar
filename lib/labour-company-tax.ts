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
  sellerTradeName: string
  sellerAddress: string
  sellerEmail: string
  sellerPhone: string
}

export type LabourCompanyResolvedTaxSettings = LabourCompanyTaxSettings & {
  intraStateCgstPercentValue: number
  intraStateSgstPercentValue: number
  interStateIgstPercentValue: number
}

export type LabourCompanyInvoiceSellerProfile = {
  legalName: string
  tradeName: string
  address: string
  gstin: string
  email: string
  phone: string
  state: string
  stateCode: string
}

export type LabourCompanyInvoiceSellerProfileIssue = {
  code: 'gstin_state_mismatch' | 'address_state_mismatch'
  message: string
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

export const VERIFIED_GST_SELLER_IDENTITY = Object.freeze({
  legalName: 'POONAM MANUEL',
  tradeName: 'SCALE VYAPAR',
  constitution: 'Proprietorship',
  gstin: '08AAOPU8577G1ZR',
  address: '2ND FLOOR FLAT NO S-1, A-42, SUN PRIDE BHASKAR ENCLAVE-II, PATRAKAR COLONY OPP. MANSAROVER, JAIPUR, Jaipur, Rajasthan - 302020, India',
  state: 'Rajasthan',
  stateCode: '08',
  pinCode: '302020'
})

export const GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT = '2026-09-19T07:45:00.000Z'

const VERIFIED_SELLER_EMAIL = 'support@scalevyapar.in'
const VERIFIED_SELLER_PHONE = '+91 9660768352'
const DEFAULT_SELLER_GSTIN = VERIFIED_GST_SELLER_IDENTITY.gstin
const DEFAULT_SELLER_STATE = VERIFIED_GST_SELLER_IDENTITY.state
const DEFAULT_SELLER_STATE_CODE = VERIFIED_GST_SELLER_IDENTITY.stateCode

const LEGACY_INVOICE_SELLER_PROFILE: LabourCompanyInvoiceSellerProfile = Object.freeze({
  legalName: 'ScaleVyapar Rozgar',
  tradeName: '',
  address: 'ScaleVyapar Private Limited, Surat, Gujarat, India - 395002',
  gstin: VERIFIED_GST_SELLER_IDENTITY.gstin,
  email: VERIFIED_SELLER_EMAIL,
  phone: VERIFIED_SELLER_PHONE,
  state: VERIFIED_GST_SELLER_IDENTITY.state,
  stateCode: VERIFIED_GST_SELLER_IDENTITY.stateCode
})

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

export const applyVerifiedGstSellerIdentity = <T extends Partial<LabourCompanyTaxSettings>>(
  settings: T
): T & Pick<LabourCompanyTaxSettings, 'sellerGstin' | 'sellerState' | 'sellerStateCode' | 'sellerLegalName' | 'sellerTradeName' | 'sellerAddress'> => {
  const sellerGstin = normalizeGstin(settings.sellerGstin)

  if (sellerGstin && sellerGstin !== VERIFIED_GST_SELLER_IDENTITY.gstin) {
    return settings as T & Pick<LabourCompanyTaxSettings, 'sellerGstin' | 'sellerState' | 'sellerStateCode' | 'sellerLegalName' | 'sellerTradeName' | 'sellerAddress'>
  }

  return {
    ...settings,
    sellerGstin: VERIFIED_GST_SELLER_IDENTITY.gstin,
    sellerState: VERIFIED_GST_SELLER_IDENTITY.state,
    sellerStateCode: VERIFIED_GST_SELLER_IDENTITY.stateCode,
    sellerLegalName: VERIFIED_GST_SELLER_IDENTITY.legalName,
    sellerTradeName: VERIFIED_GST_SELLER_IDENTITY.tradeName,
    sellerAddress: VERIFIED_GST_SELLER_IDENTITY.address
  }
}

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
  const legalSettings = applyVerifiedGstSellerIdentity(settings || {})
  const genericGstPercent = sanitizePercentage(fallbackGstPercentage, DEFAULT_GST_PERCENTAGE)
  const sellerGstin = normalizeGstin(legalSettings.sellerGstin) || DEFAULT_SELLER_GSTIN
  const sellerStateCode = normalizeString(legalSettings.sellerStateCode) || deriveStateCodeFromGstin(sellerGstin) || DEFAULT_SELLER_STATE_CODE
  const sellerState = normalizeString(legalSettings.sellerState) || resolveStateNameFromCode(sellerStateCode) || DEFAULT_SELLER_STATE

  const intraStateCgstPercentValue = sanitizePercentage(legalSettings.intraStateCgstPercent, genericGstPercent / 2)
  const intraStateSgstPercentValue = sanitizePercentage(legalSettings.intraStateSgstPercent, genericGstPercent / 2)
  const interStateIgstPercentValue = sanitizePercentage(legalSettings.interStateIgstPercent, genericGstPercent)

  return {
    sellerGstin,
    sellerState,
    sellerStateCode,
    gstEnabled: normalizeBoolean(legalSettings.gstEnabled, true),
    intraStateCgstPercent: normalizeString(legalSettings.intraStateCgstPercent) || String(intraStateCgstPercentValue),
    intraStateSgstPercent: normalizeString(legalSettings.intraStateSgstPercent) || String(intraStateSgstPercentValue),
    interStateIgstPercent: normalizeString(legalSettings.interStateIgstPercent) || String(interStateIgstPercentValue),
    hsnCode: normalizeString(legalSettings.hsnCode) || '998519',
    serviceDescription: normalizeString(legalSettings.serviceDescription) || 'ScaleVyapar Rozgar Recruitment Services',
    sellerLegalName: normalizeString(legalSettings.sellerLegalName) || VERIFIED_GST_SELLER_IDENTITY.legalName,
    sellerTradeName: normalizeString(legalSettings.sellerTradeName) || VERIFIED_GST_SELLER_IDENTITY.tradeName,
    sellerAddress: normalizeString(legalSettings.sellerAddress) || VERIFIED_GST_SELLER_IDENTITY.address,
    sellerEmail: normalizeString(legalSettings.sellerEmail) || VERIFIED_SELLER_EMAIL,
    sellerPhone: normalizeString(legalSettings.sellerPhone) || VERIFIED_SELLER_PHONE,
    intraStateCgstPercentValue,
    intraStateSgstPercentValue,
    interStateIgstPercentValue
  }
}

export const resolveLabourCompanyInvoiceSellerProfile = (
  settings: Partial<LabourCompanyTaxSettings> | null | undefined,
  fallbackGstPercentage?: string | number | null
): LabourCompanyInvoiceSellerProfile => {
  const resolved = resolveLabourCompanyTaxSettings(settings, fallbackGstPercentage)

  return {
    legalName: resolved.sellerLegalName,
    tradeName: resolved.sellerTradeName,
    address: resolved.sellerAddress,
    gstin: resolved.sellerGstin,
    email: resolved.sellerEmail,
    phone: resolved.sellerPhone,
    state: resolved.sellerState,
    stateCode: resolved.sellerStateCode
  }
}

export const resolveLabourCompanyInvoiceSellerProfileForIssuedAt = (
  settings: Partial<LabourCompanyTaxSettings> | null | undefined,
  issuedAt: string | null | undefined,
  fallbackGstPercentage?: string | number | null
): LabourCompanyInvoiceSellerProfile => {
  const issuedAtTimestamp = Date.parse(normalizeString(issuedAt))
  const effectiveAtTimestamp = Date.parse(GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT)

  if (!Number.isFinite(issuedAtTimestamp) || issuedAtTimestamp < effectiveAtTimestamp) {
    return { ...LEGACY_INVOICE_SELLER_PROFILE }
  }

  return resolveLabourCompanyInvoiceSellerProfile(settings, fallbackGstPercentage)
}

export const findLabourCompanyInvoiceSellerProfileIssues = (
  profile: LabourCompanyInvoiceSellerProfile
): LabourCompanyInvoiceSellerProfileIssue[] => {
  const issues: LabourCompanyInvoiceSellerProfileIssue[] = []
  const gstinStateCode = deriveStateCodeFromGstin(profile.gstin)
  const configuredStateCode = normalizeString(profile.stateCode) || resolveStateCodeFromName(profile.state)

  if (gstinStateCode && configuredStateCode && gstinStateCode !== configuredStateCode) {
    issues.push({
      code: 'gstin_state_mismatch',
      message: `Seller GSTIN state code ${gstinStateCode} does not match configured seller state code ${configuredStateCode}.`
    })
  }

  const address = normalizeString(profile.address).toLowerCase()
  const addressState = Object.values(STATE_CODE_TO_NAME).find(state =>
    address.includes(state.toLowerCase())
  )
  const configuredState = resolveStateNameFromCode(configuredStateCode) || normalizeString(profile.state)

  if (
    addressState &&
    configuredState &&
    addressState.toLowerCase() !== configuredState.toLowerCase()
  ) {
    issues.push({
      code: 'address_state_mismatch',
      message: `Seller address names ${addressState}, but the GST seller state is ${configuredState}.`
    })
  }

  return issues
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
