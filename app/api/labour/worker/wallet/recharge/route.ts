import { NextRequest, NextResponse } from 'next/server'
import { rechargeWorkerWallet, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const amount = Number(body.amount)
    const note = typeof body.note === 'string' ? body.note : undefined
    const paymentProvider = body.paymentProvider === 'razorpay' ? 'razorpay' : 'dummy'

    const dashboard = await rechargeWorkerWallet(auth.workerId, {
      amount,
      note,
      paymentProvider
    })

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recharge wallet.' },
      { status: 400 }
    )
  }
}
