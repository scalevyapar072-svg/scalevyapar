import { createLabourEntity, getLabourMarketplaceSnapshot, type LabourMarketplaceSnapshot } from './labour-marketplace'
import { createPricingPlanSlug, type CheckoutSummary } from './labour-company-checkout'
import { getCompanyAppDashboard } from './labour-company-app'
import { supabaseAdmin } from './supabase-admin'

const normalize = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const tierRank = (slug: string) => {
  if (slug.includes('enterprise')) return 3
  if (slug.includes('professional')) return 2
  if (slug.includes('starter') || slug.includes('basic')) return 1
  return 0
}

const sortCompanyPlansByAmount = (snapshot: LabourMarketplaceSnapshot) =>
  snapshot.plans
    .filter(plan => plan.audience === 'company' && plan.isActive)
    .sort((left, right) => {
      const amountDelta = Number(left.planAmount || 0) - Number(right.planAmount || 0)
      if (amountDelta !== 0) return amountDelta
      return left.name.localeCompare(right.name)
    })

export const resolveCompanyPlanForCheckout = (
  snapshot: LabourMarketplaceSnapshot,
  planSlug: string,
  summary: CheckoutSummary
) => {
  const companyPlans = sortCompanyPlansByAmount(snapshot)
  if (!companyPlans.length) {
    return null
  }

  const requestedSlug = normalize(planSlug)
  const summarySlug = normalize(summary.plan.slug || summary.plan.name)

  const exactPlan = companyPlans.find(plan =>
    normalize(plan.id) === requestedSlug ||
    normalize(plan.name) === requestedSlug ||
    createPricingPlanSlug(plan.name) === requestedSlug
  )
  if (exactPlan) return exactPlan

  const summaryNameMatch = companyPlans.find(plan =>
    normalize(plan.name).includes(summarySlug) ||
    summarySlug.includes(normalize(plan.name))
  )
  if (summaryNameMatch) return summaryNameMatch

  const requestedTier = tierRank(requestedSlug || summarySlug)
  if (requestedTier >= 3) {
    return companyPlans[companyPlans.length - 1]
  }
  if (requestedTier === 2) {
    return companyPlans[Math.min(1, companyPlans.length - 1)]
  }

  return companyPlans[0]
}

const buildRazorpayTransactionId = (paymentId: string) =>
  `txn-razorpay-${paymentId.replace(/[^a-z0-9_-]+/gi, '').slice(0, 60)}`

export const activateCompanyPlanFromRazorpay = async ({
  companyId,
  planId,
  amount,
  razorpayOrderId,
  razorpayPaymentId,
  billingMode,
  checkoutPlanTitle
}: {
  companyId: string
  planId: string
  amount: number
  razorpayOrderId: string
  razorpayPaymentId: string
  billingMode: string
  checkoutPlanTitle: string
}) => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const company = snapshot.companies.find(item => item.id === companyId)
  const plan = snapshot.plans.find(item => item.id === planId && item.audience === 'company')

  if (!company) {
    throw new Error('Company account not found for this payment.')
  }

  if (!plan) {
    throw new Error('Selected company plan is no longer available.')
  }

  const now = new Date().toISOString()
  const transactionId = buildRazorpayTransactionId(razorpayPaymentId)
  const existingTransaction = snapshot.walletTransactions.find(transaction =>
    transaction.id === transactionId ||
    (
      transaction.entityType === 'company' &&
      transaction.entityId === companyId &&
      transaction.transactionType === 'plan_purchase' &&
      transaction.note.includes(razorpayPaymentId)
    )
  )

  if (company.activePlan !== plan.id || company.status !== 'active') {
    if (snapshot.storage === 'supabase') {
      const { error } = await supabaseAdmin
        .from('labour_companies')
        .update({
          active_plan: plan.id,
          status: 'active',
          updated_at: now
        })
        .eq('id', company.id)

      if (error) {
        throw new Error(`Failed to activate company plan: ${error.message}`)
      }
    } else {
      await import('./labour-marketplace').then(({ updateLabourEntity }) =>
        updateLabourEntity('companies', company.id, {
          ...company,
          activePlan: plan.id,
          status: 'active'
        }, 'razorpay-payment')
      )
    }
  }

  if (!existingTransaction) {
    await createLabourEntity('walletTransactions', {
      id: transactionId,
      entityType: 'company',
      entityId: company.id,
      entityName: company.companyName || company.email,
      city: company.city,
      transactionType: 'plan_purchase',
      amount,
      direction: 'credit',
      status: 'completed',
      reference: plan.id,
      note: `Razorpay payment ${razorpayPaymentId} for ${checkoutPlanTitle} (${billingMode}). Order ${razorpayOrderId}.`,
      createdAt: now,
      updatedAt: now
    }, 'razorpay-payment')
  }

  return getCompanyAppDashboard(company.id)
}
