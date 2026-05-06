import { NextRequest, NextResponse } from 'next/server'
import { requestWorkerOtp } from '@/lib/labour-worker-app'

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
      otpCode: result.otpCode
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to request OTP.' }, { status: 400 })
  }
}
