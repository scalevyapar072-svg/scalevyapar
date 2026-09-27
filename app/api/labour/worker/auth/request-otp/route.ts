import { NextRequest, NextResponse } from 'next/server'
import { requestWorkerOtp } from '@/lib/labour-worker-app'
import { getSafeWorkerAuthErrorMessage } from '@/lib/labour-worker-otp'

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json()
    if (!mobile || typeof mobile !== 'string') {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 })
    }

    const result = await requestWorkerOtp(mobile)
    return NextResponse.json({
      success: true,
      message: result.message,
      mobile: result.mobile,
      expiresAt: result.expiresAt,
      workerId: result.workerId,
      otpSessionToken: result.otpSessionToken
    })
  } catch (error) {
    return NextResponse.json(
      { error: getSafeWorkerAuthErrorMessage(error, 'Failed to request OTP.') },
      { status: 400 }
    )
  }
}
