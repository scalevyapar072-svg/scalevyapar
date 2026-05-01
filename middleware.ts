import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth-token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLocalDev =
    process.env.NODE_ENV !== 'production' &&
    (request.nextUrl.hostname === '127.0.0.1' || request.nextUrl.hostname === 'localhost')

  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (isLocalDev && pathname.startsWith('/leads')) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value || request.cookies.get(LEGACY_AUTH_COOKIE_NAME)?.value
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await verifyToken(authToken)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    if (user.role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  if (pathname === '/') {
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
