import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db'
import { generatePasswordResetToken } from '@/lib/auth-token'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    const genericMessage = 'If an account exists for that email, a password reset link has been generated.'
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ success: true, message: genericMessage })
    }

    const token = await generatePasswordResetToken({
      id: user.id,
      email: user.email
    })

    const origin = new URL(request.url).origin
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`
    const allowPreview = process.env.NODE_ENV !== 'production' || process.env.ENABLE_FORGOT_PASSWORD_PREVIEW === 'true'

    if (!process.env.RESET_EMAIL_FROM) {
      console.info(`Password reset link for ${user.email}: ${resetUrl}`)
    }

    return NextResponse.json({
      success: true,
      message: genericMessage,
      ...(allowPreview ? { resetUrl } : {})
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to start password reset.' },
      { status: 500 }
    )
  }
}
