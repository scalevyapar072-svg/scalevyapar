import { NextRequest, NextResponse } from 'next/server'

import { requireLabourAgentSession } from '@/lib/labour-agent-session'
import {
  createWorkerReferralWithdrawalRequest,
  getWorkerReferralWithdrawalOverview,
  LabourWorkerReferralWithdrawalError,
} from '@/lib/labour-worker-referral-withdrawal'

const selectStatusCode = (error: unknown) => {
  if (error instanceof LabourWorkerReferralWithdrawalError) return error.statusCode
  if (error instanceof Error) {
    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('unauthorized') ||
      error.message.includes('authorization')
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
    const withdrawalOverview = await getWorkerReferralWithdrawalOverview(session.workerId)
    return NextResponse.json({ success: true, withdrawalOverview })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load agent withdrawal overview.',
      },
      { status: selectStatusCode(error) },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireLabourAgentSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const payload = await request.json()
    const result = await createWorkerReferralWithdrawalRequest(session.workerId, payload)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create withdrawal request.',
      },
      { status: selectStatusCode(error) },
    )
  }
}
