import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyDashboardUser } from '../../../../../../lib/auth'
import { loginCompanyAppFromDashboard } from '../../../../../../lib/labour-company-app'

type CompanyDashboardSessionDependencies = {
  loginCompanyAppFromDashboard: typeof loginCompanyAppFromDashboard
  requireCompanyDashboardUser: typeof requireCompanyDashboardUser
}

export async function handleCompanyDashboardSessionGet(
  request: NextRequest,
  dependencies: CompanyDashboardSessionDependencies = {
    loginCompanyAppFromDashboard,
    requireCompanyDashboardUser
  }
) {
  try {
    const user = await dependencies.requireCompanyDashboardUser(request)
    if (user instanceof NextResponse) {
      return user
    }

    const result = await dependencies.loginCompanyAppFromDashboard(user.email)

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

export async function GET(request: NextRequest) {
  return handleCompanyDashboardSessionGet(request)
}
