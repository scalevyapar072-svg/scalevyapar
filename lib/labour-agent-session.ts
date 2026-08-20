import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

const AGENT_SESSION_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'scalevyapar-secret-key-2024'
)

export const LABOUR_AGENT_SESSION_COOKIE = 'rozgar-agent-session'

export type LabourAgentSessionPayload = {
  workerId: string
  mobile: string
  role: 'LABOUR_AGENT'
}

const resolveCookieDomain = (hostname?: string) => {
  if (process.env.NODE_ENV !== 'production') {
    return undefined
  }

  const normalizedHost = String(hostname || '').trim().toLowerCase()
  if (
    normalizedHost === 'scalevyapar.in' ||
    normalizedHost === 'www.scalevyapar.in' ||
    normalizedHost.endsWith('.scalevyapar.in')
  ) {
    return '.scalevyapar.in'
  }

  return undefined
}

const getHostnameFromRequest = (request: Request) => {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || ''
  const headerHost = request.headers.get('host')?.trim() || ''

  return (
    forwardedHost.split(':')[0] ||
    headerHost.split(':')[0] ||
    ''
  ).toLowerCase()
}

export async function generateLabourAgentSessionToken(
  payload: LabourAgentSessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(AGENT_SESSION_SECRET)
}

export async function verifyLabourAgentSessionToken(
  token: string
): Promise<LabourAgentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AGENT_SESSION_SECRET)
    if (payload.role !== 'LABOUR_AGENT') {
      return null
    }

    const workerId = String(payload.workerId || '').trim()
    const mobile = String(payload.mobile || '').trim()

    if (!workerId || !mobile) {
      return null
    }

    return {
      workerId,
      mobile,
      role: 'LABOUR_AGENT',
    }
  } catch {
    return null
  }
}

export function createLabourAgentSessionCookie(token: string, hostname?: string) {
  return {
    name: LABOUR_AGENT_SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: resolveCookieDomain(hostname),
    },
  }
}

export function clearLabourAgentSessionCookie(hostname?: string) {
  return {
    name: LABOUR_AGENT_SESSION_COOKIE,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      domain: resolveCookieDomain(hostname),
    },
  }
}

export async function getLabourAgentSessionFromRequest(
  request: Request
): Promise<LabourAgentSessionPayload | null> {
  const nextRequest = request as Request & {
    cookies?: { get: (name: string) => { value?: string } | undefined }
  }

  const token = nextRequest.cookies?.get?.(LABOUR_AGENT_SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  return verifyLabourAgentSessionToken(token)
}

export async function requireLabourAgentSession(
  request: Request
): Promise<LabourAgentSessionPayload | NextResponse> {
  const session = await getLabourAgentSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return session
}

export async function getLabourAgentSession(): Promise<LabourAgentSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(LABOUR_AGENT_SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  return verifyLabourAgentSessionToken(token)
}

export async function requireLabourAgentPageSession() {
  const session = await getLabourAgentSession()
  if (!session) {
    redirect('/labour/agent/login')
  }
  return session
}

export function applyLabourAgentSession(
  response: NextResponse,
  token: string,
  request: Request
) {
  const hostname = getHostnameFromRequest(request)
  const cookie = createLabourAgentSessionCookie(token, hostname)
  response.cookies.set(cookie.name, cookie.value, cookie.options)
}

export function clearLabourAgentSession(response: NextResponse, request?: Request) {
  const hostname = request ? getHostnameFromRequest(request) : undefined
  const cookie = clearLabourAgentSessionCookie(hostname)
  response.cookies.set(cookie.name, cookie.value, cookie.options)
}
