import { NextRequest, NextResponse } from 'next/server'
import {
  clearLabourAgentSession,
  requireLabourAgentSession,
} from '@/lib/labour-agent-session'
import { buildReferralDashboard } from '@/lib/labour-referral-dashboard'

export async function GET(request: NextRequest) {
  const session = await requireLabourAgentSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const dashboard = await buildReferralDashboard(session.workerId)
    if (!dashboard.enabled) {
      const response = NextResponse.json(
        { error: 'Refer & Earn is not enabled for your account yet.' },
        { status: 403 }
      )
      clearLabourAgentSession(response, request)
      return response
    }

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load agent dashboard.' },
      { status: 500 }
    )
  }
}
