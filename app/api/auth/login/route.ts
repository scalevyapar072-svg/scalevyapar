import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode('scalevyapar-secret-key-2024')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('Login API called with email:', email)
    console.log('Entered password:', password)

    if (!email || !password) {
      console.log('Login failed: Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const dbPath = path.join(process.cwd(), 'data', 'db.json')
    console.log('Reading db.json from:', dbPath)

    if (!fs.existsSync(dbPath)) {
      console.log('Login failed: db.json not found')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const fileContents = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContents)

    const user = db.users?.find((u: any) => u.email === email)
    console.log('User found:', user ? 'YES' : 'NO')

    if (!user) {
      console.log('Login failed: User not found')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Stored password hash:', user.password)
    console.log('Comparing passwords with bcrypt...')

    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password match result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Login failed: Password mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Password verified successfully, creating JWT token...')

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    console.log('JWT token created, setting cookie...')

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    console.log('Login successful! Cookie set and response sent.')
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}