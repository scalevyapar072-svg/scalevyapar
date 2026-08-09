import { NextRequest, NextResponse } from 'next/server'
import { getWorkerRegistrationReferralEligibility, requireWorkerApp } from '@/lib/labour-worker-app'

export async function GET(request: NextRequest) {
  try {
    await requireWorkerApp(request)
    const referralCode = request.nextUrl.searchParams.get('code') || ''
    const result = await getWorkerRegistrationReferralEligibility(referralCode)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load referral eligibility.' },
      { status: 401 }
    )
  }
}
