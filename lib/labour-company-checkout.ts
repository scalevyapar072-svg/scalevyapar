import type { LabourCompanyWebsiteContent } from './labour-company-website'

export type PricingBillingMode = 'monthly' | 'yearly'

export type ResolvedCheckoutPlan = LabourCompanyWebsiteContent['pricingPage']['plans'][number] & {
  slug: string
  index: number
}

export type CheckoutSummary = {
  plan: ResolvedCheckoutPlan
  billingMode: PricingBillingMode
  planTitle: string
  priceLabel: string
  baseAmount: number
  discountAmount: number
  subtotal: number
  gstPercent: number
  gstAmount: number
  total: number
  creditsLabel: string
  validityDays: number | null
  validityLabel: string
  discountLabel: string
  paymentButtonLabel: string
  securityText: string
  policyText: string
  paymentProviderMode: string
  gatewayComingSoonMessage: string
  gstin: string
  savingsMessage: string
  discountCode: string
  autoDiscountEnabled: boolean
}

const DEFAULT_GST_PERCENT = 18

const sanitizeNumber = (value: string | number | null | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const roundCurrency = (value: number) => Math.max(0, Math.round(value))

export const formatRupees = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(roundCurrency(value))

export const createPricingPlanSlug = (planName: string, index = 0) => {
  const base = planName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || `plan-${index + 1}`
}

export const normalizeBillingMode = (value: string | undefined): PricingBillingMode =>
  value === 'yearly' ? 'yearly' : 'monthly'

export const resolveCheckoutPlan = (
  plans: LabourCompanyWebsiteContent['pricingPage']['plans'],
  requestedSlug?: string | null
): ResolvedCheckoutPlan => {
  const entries = plans.map((plan, index) => ({
    ...plan,
    slug: createPricingPlanSlug(plan.name, index),
    index
  }))

  if (requestedSlug) {
    const matched = entries.find(plan => plan.slug === requestedSlug.trim().toLowerCase())
    if (matched) return matched
  }

  return entries[0]
}

const inferCreditsLabel = (plan: LabourCompanyWebsiteContent['pricingPage']['plans'][number]) => {
  const feature = plan.features.find(item => /job requirement|job credit|job credits|job postings?/i.test(item)) || ''
  if (/unlimited/i.test(feature)) {
    return 'Unlimited Job Credits'
  }

  const numberMatch = feature.match(/(\d+)/)
  if (numberMatch) {
    const credits = Number(numberMatch[1])
    return `${credits} Job Credit${credits === 1 ? '' : 's'}`
  }

  const fallbackByPlan = ['1 Job Credit', '1 Job Credit', '3 Job Credits']
  return fallbackByPlan[createPricingPlanSlug(plan.name, 0) === 'enterprise' ? 2 : plan.name.toLowerCase().includes('professional') ? 1 : 0]
}

const inferValidityDays = (plan: LabourCompanyWebsiteContent['pricingPage']['plans'][number]) => {
  const feature = plan.features.find(item => /valid/i.test(item)) || ''
  const match = feature.match(/(\d+)\s*days?/i)
  return match ? Number(match[1]) : null
}

const formatSavingsMessage = (template: string, amount: number) => {
  const amountLabel = formatRupees(amount)
  if (!template.trim()) {
    return `Yay! You’re saving ${amountLabel} on this purchase`
  }

  if (template.includes('{amount}')) {
    return template.replace(/\{amount\}/g, amountLabel)
  }

  if (/₹\s?[\d,]+/.test(template)) {
    return template.replace(/₹\s?[\d,]+/, amountLabel)
  }

  return template
}

export const createCheckoutSummary = ({
  pricingPage,
  planSlug,
  billingMode,
  discountCode,
  gstinOverride
}: {
  pricingPage: LabourCompanyWebsiteContent['pricingPage']
  planSlug?: string | null
  billingMode?: string | null
  discountCode?: string | null
  gstinOverride?: string | null
}): CheckoutSummary => {
  const selectedPlan = resolveCheckoutPlan(pricingPage.plans, planSlug)
  const resolvedBillingMode = normalizeBillingMode(billingMode || undefined)
  const priceLabel = resolvedBillingMode === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice
  const baseAmount = roundCurrency(sanitizeNumber(priceLabel))
  const configuredDiscountAmount = roundCurrency(sanitizeNumber(pricingPage.checkout.defaultDiscountAmount))
  const configuredDiscountPercent = sanitizeNumber(pricingPage.checkout.defaultDiscountPercentage)
  const normalizedCode = (discountCode || '').trim().toLowerCase()
  const configuredCode = pricingPage.checkout.discountCode.trim().toLowerCase()
  const canApplyCode = Boolean(configuredCode) && normalizedCode === configuredCode
  const shouldApplyDiscount = pricingPage.checkout.enableAutoDiscount || canApplyCode
  const rawDiscountAmount = shouldApplyDiscount
    ? roundCurrency(configuredDiscountAmount > 0 ? configuredDiscountAmount : (baseAmount * configuredDiscountPercent) / 100)
    : 0
  const discountAmount = Math.min(baseAmount, Math.max(0, rawDiscountAmount))
  const subtotal = roundCurrency(baseAmount - discountAmount)
  const gstPercent = sanitizeNumber(pricingPage.checkout.gstPercentage) || DEFAULT_GST_PERCENT
  const gstAmount = roundCurrency((subtotal * gstPercent) / 100)
  const total = roundCurrency(subtotal + gstAmount)
  const validityDays = inferValidityDays(selectedPlan)
  const validityLabel = validityDays ? `${validityDays} days` : 'the active plan period'
  const creditsLabel = inferCreditsLabel(selectedPlan)

  return {
    plan: selectedPlan,
    billingMode: resolvedBillingMode,
    planTitle: /plan/i.test(selectedPlan.name) ? selectedPlan.name : `${selectedPlan.name} Plan`,
    priceLabel,
    baseAmount,
    discountAmount,
    subtotal,
    gstPercent,
    gstAmount,
    total,
    creditsLabel,
    validityDays,
    validityLabel,
    discountLabel: pricingPage.checkout.discountLabel || 'Plan discount',
    paymentButtonLabel: pricingPage.checkout.paymentButtonLabel || 'Proceed to Pay',
    securityText: pricingPage.checkout.securityText,
    policyText: pricingPage.checkout.policyText,
    paymentProviderMode: pricingPage.checkout.paymentProviderMode || 'dummy',
    gatewayComingSoonMessage: pricingPage.checkout.gatewayComingSoonMessage || 'Payment gateway will be connected soon.',
    gstin: gstinOverride?.trim() || pricingPage.checkout.gstin,
    savingsMessage: formatSavingsMessage(pricingPage.checkout.savingsMessage, discountAmount),
    discountCode: pricingPage.checkout.discountCode,
    autoDiscountEnabled: pricingPage.checkout.enableAutoDiscount
  }
}
