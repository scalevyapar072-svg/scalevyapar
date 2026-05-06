import { NextRequest, NextResponse } from 'next/server'
import { loginCompanyApp } from '@/lib/labour-company-app'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const result = await loginCompanyApp(
      String(payload.mobile || ''),
      String(payload.identity || '')
    )

    return NextResponse.json({
      success: true,
      token: result.token,
      dashboard: result.dashboard
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign in company account.' },
      { status: 400 }
    )
  }
}
