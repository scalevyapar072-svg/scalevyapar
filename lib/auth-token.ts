import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'scalevyapar-secret-key-2024'
)
export const AUTH_COOKIE_NAME = 'scalevyapar-auth'
export const LEGACY_AUTH_COOKIE_NAME = 'auth-token'

export interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  plan?: string
  status?: string
}

interface PasswordResetTokenPayload {
  id: string
  email: string
}

export async function generateToken(user: User): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    plan: user.plan,
    status: user.status
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
      phone: payload.phone as string | undefined,
      plan: payload.plan as string | undefined,
      status: payload.status as string | undefined
    }
  } catch {
    return null
  }
}

export async function generatePasswordResetToken(payload: PasswordResetTokenPayload): Promise<string> {
  return await new SignJWT({
    id: payload.id,
    email: payload.email,
    purpose: 'password-reset'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(JWT_SECRET)
}

export async function verifyPasswordResetToken(token: string): Promise<PasswordResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (payload.purpose !== 'password-reset') {
      return null
    }

    return {
      id: payload.id as string,
      email: payload.email as string
    }
  } catch {
    return null
  }
}

export function createAuthCookie(token: string) {
  const productionDomain =
    process.env.NODE_ENV === 'production'
      ? '.scalevyapar.in'
      : undefined

  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: productionDomain
    }
  }
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())

  const nextCookie = cookies
    .find(cookie => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split('=')[1]

  if (nextCookie) {
    return nextCookie
  }

  return cookies
    .find(cookie => cookie.startsWith(`${LEGACY_AUTH_COOKIE_NAME}=`))
    ?.split('=')[1] || null
}
