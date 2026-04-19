'use server'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getUserByEmail } from './db'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string
    }
  } catch (error) {
    return null
  }
}

// Login function
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('Login attempt for email:', email)

    const user = await getUserByEmail(email)
    console.log('User found in database:', user ? 'YES' : 'NO')

    if (!user) {
      console.log('Login failed: User not found')
      return { success: false, error: 'Invalid credentials' }
    }

    console.log('Stored password hash starts with:', user.password.substring(0, 10) + '...')
    console.log('Comparing entered password with stored hash...')

    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password comparison result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Login failed: Invalid password')
      return { success: false, error: 'Invalid credentials' }
    }

    console.log('Login successful for user:', user.email, 'role:', user.role)

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }

    const token = await generateToken(userData)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return { success: true, user: userData }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

// Logout function
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// Get current user from token
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    return await verifyToken(token)
  } catch (error) {
    return null
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

// Check if user has role
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

// Middleware helper - get user from request cookies
export async function getUserFromRequest(request: Request): Promise<User | null> {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null

    // Parse cookie manually
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const token = cookies['auth-token']
    if (!token) return null

    return await verifyToken(token)
  } catch (error) {
    return null
  }
}