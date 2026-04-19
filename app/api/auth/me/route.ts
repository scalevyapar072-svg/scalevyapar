import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode('scalevyapar-secret-key-2024')

export async function GET(request: Request) {
  try {
    const authToken = request.headers.get('cookie')
      ?.split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('auth-token='))
      ?.split('=')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(authToken, JWT_SECRET)
    return NextResponse.json({
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}