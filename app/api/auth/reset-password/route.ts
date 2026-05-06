import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyPasswordResetToken } from '@/lib/auth-token'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      )
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const payload = await verifyPasswordResetToken(String(token))

    if (!payload) {
      return NextResponse.json(
        { error: 'This reset link is invalid or expired.' },
        { status: 400 }
      )
    }

    const password_hash = await bcrypt.hash(String(password), 10)

    const { error } = await supabaseAdmin
      .from('clients')
      .update({ password_hash })
      .eq('id', payload.id)
      .eq('email', payload.email)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password.' },
      { status: 500 }
    )
  }
}
