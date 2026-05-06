import { NextRequest, NextResponse } from 'next/server'
import { getWorkerAppDashboard, verifyWorkerOtpCode } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const { mobile, otpCode } = await request.json()
    if (!mobile || !otpCode) {
      return NextResponse.json({ error: 'Mobile number and OTP code are required.' }, { status: 400 })
    }

    const auth = await verifyWorkerOtpCode(String(mobile), String(otpCode))
    const dashboard = await getWorkerAppDashboard(auth.workerId)

    return NextResponse.json({
      success: true,
      token: auth.token,
      dashboard
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to verify OTP.' }, { status: 400 })
  }
}
