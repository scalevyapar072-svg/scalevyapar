import { NextRequest, NextResponse } from 'next/server'

import {
  getWorkerReferralPayoutAccount,
  LabourWorkerReferralPayoutError,
  saveWorkerReferralPayoutAccount,
} from '@/lib/labour-worker-referral-payout'
import { requireWorkerApp } from '@/lib/labour-worker-app'

const selectStatusCode = (error: unknown) => {
  if (error instanceof LabourWorkerReferralPayoutError) return error.statusCode
  if (error instanceof Error) {
    if (
      error.message.includes('authorization token') ||
      error.message.includes('authorization') ||
      error.message.includes('Worker account not found')
    ) {
      return 401
    }
  }
  return 500
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const payoutAccount = await getWorkerReferralPayoutAccount(auth.workerId)
    return NextResponse.json({ success: true, payoutAccount })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load referral payout account.',
      },
      { status: selectStatusCode(error) },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const payload = await request.json()
    const payoutAccount = await saveWorkerReferralPayoutAccount(
      auth.workerId,
      payload,
    )
    return NextResponse.json({ success: true, payoutAccount })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save referral payout account.',
      },
      { status: selectStatusCode(error) },
    )
  }
}
