import type { AgentDashboardHistoryItem, AgentLocale } from './agent-types'

export const formatAgentCurrency = (value: number, locale: AgentLocale) =>
  new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const formatAgentDate = (value: string, locale: AgentLocale) => {
  const parsed = Date.parse(String(value || ''))
  if (!Number.isFinite(parsed)) {
    return '--'
  }

  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parsed))
}

export const normalizeAgentKycStatus = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')

export const getAgentHistoryEffectiveStatus = (item: AgentDashboardHistoryItem) => {
  const referralStatus = String(item.referralStatus || '').trim().toLowerCase()
  const kycStatus = normalizeAgentKycStatus(item.kycStatus)

  if (referralStatus === 'qualified' || referralStatus === 'reward_credited') {
    return 'qualified'
  }

  if (referralStatus === 'rejected' || referralStatus === 'invalid' || kycStatus === 'rejected') {
    return 'rejected'
  }

  if (referralStatus === 'registered' && kycStatus === 'pending review') {
    return 'kyc_pending'
  }

  return 'registered'
}

export const getAgentStatusTone = (status: string) => {
  if (status === 'qualified') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'kyc_pending') return 'warning'
  return 'neutral'
}

export const buildAgentShareText = (referralCode: string, referralLink: string) =>
  `Join Rozgar with my referral code ${referralCode}. ${referralLink}`

export const buildAgentWhatsappHref = (referralCode: string, referralLink: string) =>
  `https://wa.me/?text=${encodeURIComponent(buildAgentShareText(referralCode, referralLink))}`

export const buildAgentCategoryShareText = ({
  categoryLabel,
  locale,
  referralLink,
}: {
  categoryLabel: string
  locale: AgentLocale
  referralLink: string
}) => {
  const message =
    locale === 'hi'
      ? `${categoryLabel} के कामगारों को Rozgar से जोड़ें - इस लिंक पर क्लिक करें`
      : `Refer workers for ${categoryLabel} on Rozgar - click this link`

  return `${message}\n\n${referralLink}`
}

export const buildAgentCategoryWhatsappHref = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`
