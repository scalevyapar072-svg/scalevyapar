import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp } from '@/lib/labour-worker-app'
import { creditWorkerWalletFromRazorpay } from '@/lib/labour-worker-payment'

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
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
    const notes = (order as { notes?: Record<string, unknown> }).notes || {}
    if (safeString(notes.workerId) !== auth.workerId) {
      return NextResponse.json({ error: 'Payment order does not belong to this worker account.' }, { status: 403 })
    }

    const rechargeAmount = Math.round(Number(notes.rechargeAmount || 0))
    if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      return NextResponse.json({ error: 'Payment order is missing recharge amount.' }, { status: 400 })
    }

    const dashboard = await creditWorkerWalletFromRazorpay({
      workerId: auth.workerId,
      amount: rechargeAmount,
      razorpayOrderId,
      razorpayPaymentId
    })

    return NextResponse.json({
      success: true,
      message: `Wallet credited with ₹${rechargeAmount}.`,
      dashboard
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed.'
    const status = /authorization token/i.test(message) ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
