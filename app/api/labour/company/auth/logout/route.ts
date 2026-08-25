import { NextRequest, NextResponse } from 'next/server'
import { createCompanyLogoutCookie } from '../../../../../../lib/auth-token'

export async function handleCompanyLogoutPost(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  const logoutCookie = createCompanyLogoutCookie(request.nextUrl.hostname)

  response.cookies.set(logoutCookie.name, logoutCookie.value, logoutCookie.options)

  return response
}

export async function POST(request: NextRequest) {
  return handleCompanyLogoutPost(request)
}
