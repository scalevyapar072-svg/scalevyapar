import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth-token'
import { isRozgarSubdomainHost, ROZGAR_CANONICAL_PREFIX } from '@/lib/labour-company-host'

function withRequestPathHeaders(request: NextRequest, resolvedPathname?: string) {
  const headers = new Headers(request.headers)
  headers.set('x-public-pathname', request.nextUrl.pathname)
  headers.set('x-resolved-pathname', resolvedPathname || request.nextUrl.pathname)
  return headers
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || ''
  const headerHost = request.headers.get('host')?.trim() || ''
  const hostname =
    forwardedHost.split(':')[0] ||
    headerHost.split(':')[0] ||
    request.nextUrl.hostname

  const isLocalDev =
    process.env.NODE_ENV !== 'production' &&
    (hostname === '127.0.0.1' || hostname === 'localhost')

  if (process.env.NODE_ENV === 'production' && hostname === 'scalevyapar.in') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.hostname = 'www.scalevyapar.in'
    redirectUrl.protocol = 'https'
    return NextResponse.redirect(redirectUrl, 308)
  }

  if (pathname === '/search') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `${ROZGAR_CANONICAL_PREFIX}/search`
    return NextResponse.redirect(redirectUrl, 307)
  }

  const publicRozgarSubdomainRoutes = [
    '/',
    '/about',
    '/pricing',
    '/search',
    '/contact',
    '/panel',
    '/job-post',
    '/company-registration',
    '/signin',
    '/reset-password',
    '/checkout',
    '/delete-account',
    '/privacy-policy',
    '/terms-of-service',
    '/user-data-deletion'
  ]

  if (isRozgarSubdomainHost(hostname)) {
    const passthroughPrefixes = ['/admin', '/dashboard', '/login', '/api', '/_next', '/images', '/assets', '/public']
    const isCanonicalRozgarRoute =
      pathname === ROZGAR_CANONICAL_PREFIX ||
      pathname.startsWith(`${ROZGAR_CANONICAL_PREFIX}/`)
    const isPublicRozgarSubdomainRoute =
      publicRozgarSubdomainRoutes.includes(pathname) ||
      pathname.startsWith('/panel/')
    const isPassthroughRoute =
      isCanonicalRozgarRoute ||
      passthroughPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
      pathname === '/favicon.ico'

    if (isPublicRozgarSubdomainRoute && !isPassthroughRoute) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = pathname === '/' ? ROZGAR_CANONICAL_PREFIX : `${ROZGAR_CANONICAL_PREFIX}${pathname}`
      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: withRequestPathHeaders(request, rewriteUrl.pathname),
        },
      })
    }
  }

  const publicPages = [
    '/',
    '/tools',
    '/pricing',
    '/about',
    '/contact',
    '/search',
    '/panel',
    '/job-post',
    '/company-registration',
    '/signin',
    '/reset-password',
    '/checkout',
    '/delete-account',
    '/privacy-policy',
    '/terms-of-service',
    '/user-data-deletion',
    '/data-deletion-status',
    '/privacy/scalevyapar-rozgar'
  ]
  const isPublicRozgarVanityRoute = pathname.startsWith('/panel/')
  const isPublicLabourCompanyRoute =
    pathname === '/labour/company' || pathname.startsWith('/labour/company/')

  if (publicPages.includes(pathname) || isPublicRozgarVanityRoute || isPublicLabourCompanyRoute) {
    return NextResponse.next({
      request: {
        headers: withRequestPathHeaders(request),
      },
    })
  }

  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next({
      request: {
        headers: withRequestPathHeaders(request),
      },
    })
  }

  if (isLocalDev && pathname.startsWith('/leads')) {
    return NextResponse.next({
      request: {
        headers: withRequestPathHeaders(request),
      },
    })
  }

  const authToken =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.cookies.get(LEGACY_AUTH_COOKIE_NAME)?.value

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
    return NextResponse.next({
      request: {
        headers: withRequestPathHeaders(request),
      },
    })
  }

  if (pathname.startsWith('/dashboard')) {
    if (user.role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next({
      request: {
        headers: withRequestPathHeaders(request),
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: withRequestPathHeaders(request),
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
