import { NextRequest, NextResponse } from 'next/server'

import {
  getWorkerReferralPayoutAccount,
  LabourWorkerReferralPayoutError,
  saveWorkerReferralPayoutAccount,
} from '@/lib/labour-worker-referral-payout'
import { requireLabourAgentSession } from '@/lib/labour-agent-session'

const selectStatusCode = (error: unknown) => {
  if (error instanceof LabourWorkerReferralPayoutError) return error.statusCode
  if (error instanceof Error) {
    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('unauthorized') ||
      error.message.includes('authorization') ||
      error.message.includes('Worker account not found')
    ) {
      return 401
    }
  }
  return 500
}

export async function GET(request: NextRequest) {
  const session = await requireLabourAgentSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const payoutAccount = await getWorkerReferralPayoutAccount(session.workerId)
    return NextResponse.json({ success: true, payoutAccount })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load agent referral payout account.',
      },
      { status: selectStatusCode(error) },
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireLabourAgentSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const payload = await request.json()
    const payoutAccount = await saveWorkerReferralPayoutAccount(
      session.workerId,
      payload,
      { actor: 'agent-app' },
    )
    return NextResponse.json({ success: true, payoutAccount })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save agent referral payout account.',
      },
      { status: selectStatusCode(error) },
    )
  }
}
