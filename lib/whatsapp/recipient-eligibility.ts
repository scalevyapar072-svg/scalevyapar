import {
  buildWhatsappConsentState,
  getMissingWhatsappConsentTypes,
  getRequiredWhatsappConsentTypes,
  maskWhatsappMobile,
  normalizeIndianMobileToE164,
  type WhatsappConsentState,
  type WhatsappNotificationPurpose,
} from './consent'
import { normalizeWhatsappTemplateCategory } from './template-inventory'

export type WhatsappEligibilityDeliveryWindow =
  | 'send_now'
  | 'queue_until_allowed'
  | 'blocked'

export type WhatsappEligibilityReasonCode =
  | 'automatic_worker_status_not_active'
  | 'worker_not_visible'
  | 'worker_missing_active_plan'
  | 'worker_plan_expired'
  | 'company_status_not_active'
  | 'missing_company_recipient'
  | 'invalid_mobile'
  | 'missing_consent_service_allowed'
  | 'missing_consent_matching_alerts_allowed'
  | 'missing_consent_marketing_allowed'
  | 'suppressed'
  | 'matching_invalid'
  | 'limit_exceeded'
  | 'inside_quiet_hours'

export type WorkerRecipientInput = {
  status: string
  isVisible: boolean
  activePlan: string
  planValidUntil: string
  mobile: string
}

export type CompanyRecipientInput = {
  status: string
  contactMobile: string
  mobile: string
}

type BaseEligibilityInput = {
  mode: 'automatic' | 'manual'
  notificationPurpose: WhatsappNotificationPurpose
  templateCategory: string
  consentState?: Partial<WhatsappConsentState>
  suppressed?: boolean
  withinLimit?: boolean
  matchStillValid?: boolean
  now?: Date
  timeZone?: string
  allowQueueDuringQuietHours?: boolean
}

export type WorkerEligibilityInput = BaseEligibilityInput & {
  recipientType: 'worker'
  worker: WorkerRecipientInput
}

export type CompanyEligibilityInput = BaseEligibilityInput & {
  recipientType: 'company'
  company: CompanyRecipientInput
}

export type WhatsappRecipientEligibilityResult = {
  eligible: boolean
  reasonCodes: WhatsappEligibilityReasonCode[]
  deliveryWindow: WhatsappEligibilityDeliveryWindow
  normalizedMobile: string
  maskedMobile: string
  missingConsents: Array<keyof WhatsappConsentState>
  requiredConsents: Array<keyof WhatsappConsentState>
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
}

const getLocalizedHour = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  })

  const hourPart = formatter
    .formatToParts(date)
    .find((part) => part.type === 'hour')

  return Number(hourPart?.value || '0')
}

export const isInsideWhatsappQuietHours = (
  date: Date,
  timeZone = 'Asia/Kolkata',
) => {
  const hour = getLocalizedHour(date, timeZone)
  return hour >= 21 || hour < 8
}

const isPlanExpired = (value: string) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return true

  const expiryDate = new Date(trimmed)
  if (Number.isNaN(expiryDate.getTime())) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)
  return expiryDate < today
}

const deriveAutomaticWorkerStatus = (worker: WorkerRecipientInput) => {
  if (worker.status !== 'active') return worker.status
  if (!worker.isVisible) return 'inactive_subscription_expired'
  if (!String(worker.activePlan || '').trim()) return 'inactive_subscription_expired'
  if (isPlanExpired(worker.planValidUntil)) return 'inactive_subscription_expired'
  return 'active'
}

const getConsentReasonCode = (consentType: keyof WhatsappConsentState): WhatsappEligibilityReasonCode =>
  `missing_consent_${consentType}` as WhatsappEligibilityReasonCode

const finalizeEligibility = ({
  reasonCodes,
  normalizedMobile,
  missingConsents,
  requiredConsents,
  resolvedRecipientSource,
  allowQueueDuringQuietHours,
  now,
  timeZone,
}: {
  reasonCodes: WhatsappEligibilityReasonCode[]
  normalizedMobile: string
  missingConsents: Array<keyof WhatsappConsentState>
  requiredConsents: Array<keyof WhatsappConsentState>
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
  allowQueueDuringQuietHours: boolean
  now: Date
  timeZone: string
}): WhatsappRecipientEligibilityResult => {
  const insideQuietHours = isInsideWhatsappQuietHours(now, timeZone)
  const nonQuietHourReasons = reasonCodes.filter((reasonCode) => reasonCode !== 'inside_quiet_hours')

  const deliveryWindow =
    nonQuietHourReasons.length > 0
      ? 'blocked'
      : insideQuietHours
        ? allowQueueDuringQuietHours
          ? 'queue_until_allowed'
          : 'blocked'
        : 'send_now'

  const eligible =
    nonQuietHourReasons.length === 0 &&
    (!insideQuietHours || allowQueueDuringQuietHours)

  const finalReasonCodes: WhatsappEligibilityReasonCode[] = insideQuietHours
    ? Array.from(new Set<WhatsappEligibilityReasonCode>([...reasonCodes, 'inside_quiet_hours']))
    : Array.from(new Set<WhatsappEligibilityReasonCode>(reasonCodes))

  return {
    eligible,
    reasonCodes: finalReasonCodes,
    deliveryWindow,
    normalizedMobile,
    maskedMobile: maskWhatsappMobile(normalizedMobile),
    missingConsents,
    requiredConsents,
    resolvedRecipientSource,
  }
}

const evaluateCommonRules = ({
  mobile,
  consentState,
  notificationPurpose,
  templateCategory,
  suppressed,
  withinLimit,
  matchStillValid,
  now,
  timeZone,
  allowQueueDuringQuietHours,
  resolvedRecipientSource,
}: {
  mobile: string
  consentState: Partial<WhatsappConsentState> | undefined
  notificationPurpose: WhatsappNotificationPurpose
  templateCategory: string
  suppressed: boolean
  withinLimit: boolean
  matchStillValid: boolean
  now: Date
  timeZone: string
  allowQueueDuringQuietHours: boolean
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
}) => {
  const reasonCodes: WhatsappEligibilityReasonCode[] = []
  const normalizedMobileResult = normalizeIndianMobileToE164(mobile)
  const normalizedMobile = normalizedMobileResult.ok ? normalizedMobileResult.normalized : ''

  if (!normalizedMobileResult.ok) {
    reasonCodes.push('invalid_mobile')
  }

  const requiredConsents = getRequiredWhatsappConsentTypes({
    notificationPurpose,
    templateCategory: normalizeWhatsappTemplateCategory(templateCategory),
  })
  const missingConsents = getMissingWhatsappConsentTypes({
    consentState: buildWhatsappConsentState(consentState || {}),
    requiredConsentTypes: requiredConsents,
  })

  missingConsents.forEach((consentType) => {
    reasonCodes.push(getConsentReasonCode(consentType))
  })

  if (suppressed) {
    reasonCodes.push('suppressed')
  }

  if (!withinLimit) {
    reasonCodes.push('limit_exceeded')
  }

  if (notificationPurpose === 'matching' && !matchStillValid) {
    reasonCodes.push('matching_invalid')
  }

  return finalizeEligibility({
    reasonCodes,
    normalizedMobile,
    missingConsents,
    requiredConsents,
    resolvedRecipientSource,
    allowQueueDuringQuietHours,
    now,
    timeZone,
  })
}

export const resolveCompanyRecipientMobile = (company: CompanyRecipientInput) => {
  const contactMobile = String(company.contactMobile || '').trim()
  if (contactMobile) {
    return {
      mobile: contactMobile,
      source: 'contact_mobile' as const,
    }
  }

  const mobile = String(company.mobile || '').trim()
  if (mobile) {
    return {
      mobile,
      source: 'mobile' as const,
    }
  }

  return {
    mobile: '',
    source: 'none' as const,
  }
}

export const evaluateWhatsappRecipientEligibility = (
  input: WorkerEligibilityInput | CompanyEligibilityInput,
): WhatsappRecipientEligibilityResult => {
  const now = input.now || new Date()
  const timeZone = input.timeZone || 'Asia/Kolkata'
  const allowQueueDuringQuietHours = input.allowQueueDuringQuietHours ?? true
  const suppressed = input.suppressed ?? false
  const withinLimit = input.withinLimit ?? true
  const matchStillValid = input.matchStillValid ?? true

  if (input.recipientType === 'worker') {
    const reasonCodes: WhatsappEligibilityReasonCode[] = []

    if (input.mode === 'automatic') {
      const effectiveStatus = deriveAutomaticWorkerStatus(input.worker)
      if (effectiveStatus !== 'active') {
        reasonCodes.push('automatic_worker_status_not_active')
      }

      if (!input.worker.isVisible) {
        reasonCodes.push('worker_not_visible')
      }

      if (!String(input.worker.activePlan || '').trim()) {
        reasonCodes.push('worker_missing_active_plan')
      }

      if (isPlanExpired(input.worker.planValidUntil)) {
        reasonCodes.push('worker_plan_expired')
      }
    }

    const result = evaluateCommonRules({
      mobile: input.worker.mobile,
      consentState: input.consentState,
      notificationPurpose: input.notificationPurpose,
      templateCategory: input.templateCategory,
      suppressed,
      withinLimit,
      matchStillValid,
      now,
      timeZone,
      allowQueueDuringQuietHours,
      resolvedRecipientSource: 'direct',
    })

    return {
      ...result,
      eligible: result.eligible && reasonCodes.length === 0,
      deliveryWindow:
        result.deliveryWindow === 'blocked' || reasonCodes.length > 0
          ? 'blocked'
          : result.deliveryWindow,
      reasonCodes: Array.from(new Set([...reasonCodes, ...result.reasonCodes])),
    }
  }

  const resolvedRecipient = resolveCompanyRecipientMobile(input.company)
  const reasonCodes: WhatsappEligibilityReasonCode[] = []

  if (input.mode === 'automatic' && input.company.status !== 'active') {
    reasonCodes.push('company_status_not_active')
  }

  if (resolvedRecipient.source === 'none') {
    reasonCodes.push('missing_company_recipient')
  }

  const result = evaluateCommonRules({
    mobile: resolvedRecipient.mobile,
    consentState: input.consentState,
    notificationPurpose: input.notificationPurpose,
    templateCategory: input.templateCategory,
    suppressed,
    withinLimit,
    matchStillValid,
    now,
    timeZone,
    allowQueueDuringQuietHours,
    resolvedRecipientSource: resolvedRecipient.source,
  })

  return {
    ...result,
    eligible: result.eligible && reasonCodes.length === 0,
    deliveryWindow:
      result.deliveryWindow === 'blocked' || reasonCodes.length > 0
        ? 'blocked'
        : result.deliveryWindow,
    reasonCodes: Array.from(new Set([...reasonCodes, ...result.reasonCodes])),
  }
}
