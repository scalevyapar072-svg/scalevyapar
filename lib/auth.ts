'use server'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserByEmail } from './db'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'scalevyapar-secret-key-2024'
)

export interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  plan?: string
  status?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
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

export function createAuthCookie(token: string) {
  return {
    name: 'auth-token',
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    }
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: 'Invalid credentials' }
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
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
  } catch {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

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
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null

    const token = cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('auth-token='))
      ?.split('=')[1]

    if (!token) return null

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
