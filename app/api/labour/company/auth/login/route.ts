import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { createCompanyAuthCookie, generateToken } from '../../../../../../lib/auth-token'
import { getUserByEmail } from '../../../../../../lib/db'
import { loginCompanyAppFromDashboard } from '../../../../../../lib/labour-company-app'

type CompanyLoginDependencies = {
  comparePassword: typeof bcrypt.compare
  createCookie: typeof createCompanyAuthCookie
  generateSessionToken: typeof generateToken
  getUserByEmail: typeof getUserByEmail
  loginCompanyAppFromDashboard: typeof loginCompanyAppFromDashboard
}

export async function handleCompanyLoginPost(
  request: NextRequest,
  dependencies: CompanyLoginDependencies = {
    comparePassword: bcrypt.compare,
    createCookie: createCompanyAuthCookie,
    generateSessionToken: generateToken,
    getUserByEmail,
    loginCompanyAppFromDashboard
  }
) {
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

    const user = await dependencies.getUserByEmail(normalizedEmail)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 })
    }

    const isValidPassword = await dependencies.comparePassword(rawPassword, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 })
    }

    const result = await dependencies.loginCompanyAppFromDashboard(user.email)
    const authToken = await dependencies.generateSessionToken({
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
    const authCookie = dependencies.createCookie(authToken, request.nextUrl.hostname)
    response.cookies.set(authCookie.name, authCookie.value, authCookie.options)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign in company account.' },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleCompanyLoginPost(request)
}
