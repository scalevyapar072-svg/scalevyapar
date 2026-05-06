import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await context.params
    const newPassword = Math.random().toString(36).slice(-8)
    const password_hash = await bcrypt.hash(newPassword, 10)

    const { error } = await supabaseAdmin
      .from('clients')
      .update({ password_hash })
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      password: newPassword
    })
  } catch (error) {
    console.error('Failed to reset password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
