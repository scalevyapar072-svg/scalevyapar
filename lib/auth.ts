import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserByEmail } from './db'
import bcrypt from 'bcryptjs'
import {
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  createAuthCookie,
  generateToken,
  getTokenFromCookieHeader,
  type User,
  verifyToken
} from './auth-token'

export type { User } from './auth-token'

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export { createAuthCookie, generateToken, verifyToken }

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: 'Invalid credentials' }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' }
    }

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      plan: user.plan,
      status: user.status
    }

    const token = await generateToken(userData)
    const authCookie = createAuthCookie(token)

    const cookieStore = await cookies()
    cookieStore.set(authCookie.name, authCookie.value, authCookie.options)

    return { success: true, user: userData }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
  cookieStore.delete(LEGACY_AUTH_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || cookieStore.get(LEGACY_AUTH_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
  try {
    const nextRequest = request as Request & {
      cookies?: { get: (name: string) => { value?: string } | undefined }
    }

    const token = nextRequest.cookies?.get?.(AUTH_COOKIE_NAME)?.value
      ?? nextRequest.cookies?.get?.(LEGACY_AUTH_COOKIE_NAME)?.value
      ?? getTokenFromCookieHeader(request.headers.get('cookie'))

    if (!token) {
      return null
    }

    return await verifyToken(token)
  } catch {
    return null
  }
}

export async function requireUser(request: Request): Promise<User | NextResponse> {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}

export async function requireAdmin(request: Request): Promise<User | NextResponse> {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return user
}

