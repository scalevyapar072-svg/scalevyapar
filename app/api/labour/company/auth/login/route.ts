import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { createAuthCookie, generateToken } from '@/lib/auth-token'
import { getUserByEmail } from '@/lib/db'
import { loginCompanyAppFromDashboard } from '@/lib/labour-company-app'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const normalizedEmail = String(payload.email || '').trim().toLowerCase()
    const rawPassword = String(payload.password || payload.identity || '')

    if (!normalizedEmail || !rawPassword) {
      return NextResponse.json(
        { error: 'Email address and password are required.' },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(rawPassword, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 })
    }

    const result = await loginCompanyAppFromDashboard(user.email)
    const authToken = await generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      plan: user.plan,
      status: user.status
    })

    const response = NextResponse.json({
      success: true,
      token: result.token,
      dashboard: result.dashboard
    })
    const authCookie = createAuthCookie(authToken)
    response.cookies.set(authCookie.name, authCookie.value, authCookie.options)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign in company account.' },
      { status: 400 }
    )
  }
}
