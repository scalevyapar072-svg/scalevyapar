import { NextRequest, NextResponse } from 'next/server'

import { createAuthCookie, generateToken } from '@/lib/auth-token'

const PREVIEW_ADMIN_USER = {
  id: 'preview-admin-11c2',
  name: 'Preview Refer & Earn Admin',
  email: 'preview-admin-11c2@preview.local',
  role: 'ADMIN',
  status: 'active',
} as const

const notFound = () =>
  NextResponse.json(
    { error: 'Not found' },
    {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return notFound()
  }

  const token = await generateToken(PREVIEW_ADMIN_USER)
  const redirectUrl = new URL('/admin/labour', request.url)
  const response = NextResponse.redirect(redirectUrl, 307)
  const authCookie = createAuthCookie(token, request.nextUrl.hostname)

  response.cookies.set(authCookie.name, authCookie.value, authCookie.options)
  response.headers.set('Cache-Control', 'no-store')

  return response
}
