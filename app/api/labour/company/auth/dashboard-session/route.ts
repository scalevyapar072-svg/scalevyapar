import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { loginCompanyAppFromDashboard } from '@/lib/labour-company-app'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (user instanceof NextResponse) {
      return user
    }

    const result = await loginCompanyAppFromDashboard(user.email, user.name)

    return NextResponse.json({
      success: true,
      token: result.token,
      dashboard: result.dashboard
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to open company panel from dashboard session.' },
      { status: 400 }
    )
  }
}
