import { NextRequest, NextResponse } from 'next/server'
import { applyLabourAgentSession, generateLabourAgentSessionToken } from '@/lib/labour-agent-session'
import { getReferralProfileForWorker } from '@/lib/labour-worker-referral'
import { verifyLabourAgentOtp } from '@/lib/labour-worker-app'

const disabledMessage = 'Refer & Earn is not enabled for your account yet.'

export async function POST(request: NextRequest) {
  try {
    const { mobile, otpCode, otpSessionToken } = await request.json()
    if (!mobile || !otpCode) {
      return NextResponse.json(
        { error: 'Mobile number and OTP code are required.' },
        { status: 400 }
      )
    }

    const auth = await verifyLabourAgentOtp(
      String(mobile),
      String(otpCode),
      typeof otpSessionToken === 'string' ? otpSessionToken : undefined
    )
    if (!auth.workerId) {
      return NextResponse.json(
        {
          success: false,
          enabled: false,
          message: disabledMessage,
        },
        { status: 403 }
      )
    }

    const profile = await getReferralProfileForWorker(auth.workerId)
    if (!profile || !profile.isActive) {
      return NextResponse.json(
        {
          success: false,
          enabled: false,
          message: disabledMessage,
        },
        { status: 403 }
      )
    }

    const token = await generateLabourAgentSessionToken({
      workerId: auth.workerId,
      mobile: auth.mobile,
      role: 'LABOUR_AGENT',
    })

    const response = NextResponse.json({
      success: true,
      enabled: true,
    })
    applyLabourAgentSession(response, token, request)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify OTP.' },
      { status: 400 }
    )
  }
}
