import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp } from '@/lib/labour-worker-app'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime
} from '@/lib/worker-lifecycle-mutation-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_RECHARGE_AMOUNT = 10
const MAX_RECHARGE_AMOUNT = 10000

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

const normalizeRechargeAmount = (value: unknown) => {
  const amount = Math.round(Number(value || 0))
  if (!Number.isFinite(amount) || amount < MIN_RECHARGE_AMOUNT) {
    throw new Error(`Minimum recharge amount is ₹${MIN_RECHARGE_AMOUNT}.`)
  }
  if (amount > MAX_RECHARGE_AMOUNT) {
    throw new Error(`Maximum recharge amount is ₹${MAX_RECHARGE_AMOUNT}.`)
  }
  return amount
}

type WorkerRazorpayOrderDependencies = {
  getLabourMarketplaceSnapshot: typeof getLabourMarketplaceSnapshot
  getRazorpay: typeof getRazorpay
  requireWorkerApp: typeof requireWorkerApp
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

export async function POST(request: NextRequest) {
  return handleWorkerRazorpayOrderPost(request)
}

export async function handleWorkerRazorpayOrderPost(
  request: Request,
  dependencies: WorkerRazorpayOrderDependencies = {
    getLabourMarketplaceSnapshot,
    getRazorpay,
    requireWorkerApp
  }
) {
  try {
    const auth = await dependencies.requireWorkerApp(request)
    if (shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const body = await request.json().catch(() => ({}))
    const amount = normalizeRechargeAmount(body.amount)
    const snapshot = await dependencies.getLabourMarketplaceSnapshot()
    const worker = snapshot.workers.find(item => item.id === auth.workerId)
    if (!worker) {
      return NextResponse.json({ error: 'Worker account not found.' }, { status: 404 })
    }

    const { client, keyId } = dependencies.getRazorpay()
    const order = await client.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `wr_${Date.now().toString(36)}_${worker.id.replace(/[^a-z0-9]/gi, '').slice(-8)}`,
      notes: {
        workerId: worker.id,
        mobile: worker.mobile,
        rechargeAmount: String(amount),
        source: 'rozgar-worker-app'
      }
    })

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      rechargeAmount: amount,
      workerName: worker.fullName,
      mobile: worker.mobile
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Razorpay order.'
    const status = /authorization token/i.test(message) ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
