import { NextRequest, NextResponse } from 'next/server'
import { LabourWorkerReferralError } from '@/lib/labour-worker-referral'
import { buildReferralDashboard } from '@/lib/labour-referral-dashboard'
import { requireWorkerApp } from '@/lib/labour-worker-app'

const selectStatusCode = (error: unknown) => {
  if (error instanceof LabourWorkerReferralError) return error.statusCode
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
    const dashboard = await buildReferralDashboard(auth.workerId)

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    console.error('Worker referral dashboard load failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load referral dashboard.' },
      { status: selectStatusCode(error) }
    )
  }
}
