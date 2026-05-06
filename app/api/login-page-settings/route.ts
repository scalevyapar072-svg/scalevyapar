import { NextResponse } from 'next/server'
import { getLoginPageSettings } from '@/lib/login-page-settings'

export async function GET() {
  try {
    const payload = await getLoginPageSettings()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Login page settings fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to load login page settings.' },
      { status: 500 }
    )
  }
}
