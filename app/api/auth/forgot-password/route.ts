import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db'
import { generatePasswordResetToken } from '@/lib/auth-token'

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESET_EMAIL_FROM

  if (!apiKey || !from) {
    return { sent: false }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Reset your ScaleVyapar password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">Reset your ScaleVyapar password</h2>
          <p style="margin-bottom: 16px;">We received a request to reset your password. Click the button below to choose a new one.</p>
          <p style="margin-bottom: 20px;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #0f2240; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">
              Reset password
            </a>
          </p>
          <p style="margin-bottom: 8px;">If the button does not work, open this link:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p style="margin-top: 16px; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Failed to send reset email: ${body || response.statusText}`)
  }

  return { sent: true }
}

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
    const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESET_EMAIL_FROM)

    if (!emailConfigured) {
      console.info(`Password reset link for ${user.email}: ${resetUrl}`)
    } else {
      await sendResetEmail(user.email, resetUrl)
    }

    return NextResponse.json({
      success: true,
      message: emailConfigured
        ? 'If an account exists for that email, a password reset email has been sent.'
        : 'Password reset email is not configured yet. Please contact your administrator to reset your password.',
      emailConfigured,
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
