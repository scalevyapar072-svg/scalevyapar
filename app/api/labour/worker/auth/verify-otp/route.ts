import { NextRequest, NextResponse } from 'next/server'
import { getWorkerAppDashboard, verifyWorkerOtpCode } from '@/lib/labour-worker-app'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache'
}

export async function POST(request: NextRequest) {
  try {
    const { mobile, otpCode, otpSessionToken } = await request.json()
    if (!mobile || !otpCode) {
      return NextResponse.json(
        { error: 'Mobile number and OTP code are required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const auth = await verifyWorkerOtpCode(
      String(mobile),
      String(otpCode),
      typeof otpSessionToken === 'string' ? otpSessionToken : undefined
    )
    const dashboard = await getWorkerAppDashboard(auth.workerId)

    return NextResponse.json(
      {
        success: true,
        token: auth.token,
        dashboard
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify OTP.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
}
