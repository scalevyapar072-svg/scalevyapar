import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyApp } from '@/lib/labour-company-app'
import { createCheckoutSummary } from '@/lib/labour-company-checkout'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { resolveCompanyPlanForCheckout } from '@/lib/labour-company-payment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured.')
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
  }
}

const normalizeAmountInPaise = (value: number) => Math.max(100, Math.round(value * 100))

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const body = await request.json().catch(() => ({}))
    const { content } = await getLabourCompanyWebsiteContent()

    const summary = createCheckoutSummary({
      pricingPage: content.pricingPage,
      planSlug: typeof body.plan === 'string' ? body.plan : '',
      billingMode: typeof body.billing === 'string' ? body.billing : '',
      discountCode: typeof body.discountCode === 'string' ? body.discountCode : '',
      gstinOverride: typeof body.gstin === 'string' ? body.gstin : '',
      buyerStateOverride: typeof body.buyerState === 'string' ? body.buyerState : ''
    })

    const snapshot = await getLabourMarketplaceSnapshot()
    const company = snapshot.companies.find(item => item.id === auth.companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company account not found.' }, { status: 404 })
    }

    const selectedCompanyPlan = resolveCompanyPlanForCheckout(
      snapshot,
      typeof body.plan === 'string' ? body.plan : summary.plan.slug,
      summary
    )
    if (!selectedCompanyPlan) {
      return NextResponse.json({ error: 'No active company plan is available for checkout.' }, { status: 400 })
    }

    const { client, keyId } = getRazorpay()
    const amount = normalizeAmountInPaise(summary.total)
    const receipt = `rzp_${Date.now().toString(36)}_${auth.companyId.replace(/[^a-z0-9]/gi, '').slice(-8)}`
    const order = await client.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        companyId: company.id,
        companyEmail: company.email,
        checkoutPlanSlug: summary.plan.slug,
        checkoutPlanTitle: summary.planTitle,
        billingMode: summary.billingMode,
        companyPlanId: selectedCompanyPlan.id
      }
    })

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planTitle: summary.planTitle,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      email: company.email,
      mobile: company.mobile,
      companyPlanId: selectedCompanyPlan.id
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Razorpay order.'
    const status = /authorization token/i.test(message) ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
