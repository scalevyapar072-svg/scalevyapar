import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyApp } from '@/lib/labour-company-app'
import { activateCompanyPlanFromRazorpay } from '@/lib/labour-company-payment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured.')
  }

  return {
    keySecret,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
  }
}

const safeString = (value: unknown) => String(value || '').trim()

const getOrderNotes = (order: unknown) => {
  const notes = (order as { notes?: Record<string, unknown> }).notes || {}
  return {
    companyId: safeString(notes.companyId),
    companyPlanId: safeString(notes.companyPlanId),
    billingMode: safeString(notes.billingMode) || 'monthly',
    checkoutPlanTitle: safeString(notes.checkoutPlanTitle) || 'Company plan'
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const body = await request.json().catch(() => ({}))
    const razorpayOrderId = safeString(body.razorpay_order_id || body.orderId)
    const razorpayPaymentId = safeString(body.razorpay_payment_id || body.paymentId)
    const razorpaySignature = safeString(body.razorpay_signature || body.signature)

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Payment verification details are incomplete.' }, { status: 400 })
    }

    const { client, keySecret } = getRazorpay()
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    const signatureBuffer = Buffer.from(razorpaySignature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 })
    }

    const order = await client.orders.fetch(razorpayOrderId)
    const notes = getOrderNotes(order)
    if (notes.companyId !== auth.companyId) {
      return NextResponse.json({ error: 'Payment order does not belong to this company account.' }, { status: 403 })
    }

    if (!notes.companyPlanId) {
      return NextResponse.json({ error: 'Payment order is missing selected plan details.' }, { status: 400 })
    }

    const orderAmount = Number((order as { amount?: number | string }).amount || 0)
    const dashboard = await activateCompanyPlanFromRazorpay({
      companyId: auth.companyId,
      planId: notes.companyPlanId,
      amount: Math.round(orderAmount / 100),
      razorpayOrderId,
      razorpayPaymentId,
      billingMode: notes.billingMode,
      checkoutPlanTitle: notes.checkoutPlanTitle
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Your Rozgar plan is active.',
      redirectTo: '/labour/company/job-post',
      dashboard
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed.'
    const status = /authorization token/i.test(message) ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
