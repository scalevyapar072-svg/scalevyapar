import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyDashboardUser } from '../../../../../../lib/auth'
import { loginCompanyAppFromDashboard } from '../../../../../../lib/labour-company-app'
import { logSafeServerEvent } from '../../../../../../lib/safe-observability'

type CompanyDashboardSessionDependencies = {
  loginCompanyAppFromDashboard: typeof loginCompanyAppFromDashboard
  requireCompanyDashboardUser: typeof requireCompanyDashboardUser
}

const isKnownCompanySessionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  return message === 'No registered company was found for this dashboard account.' ||
    message === 'This company account is blocked. Please contact labour support.'
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
    if (isKnownCompanySessionError(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to open company panel from dashboard session.' },
        { status: 400 }
      )
    }

    logSafeServerEvent({ event: 'company_dashboard_session_read', outcome: 'failure', status: 503 })
    return NextResponse.json(
      { error: 'Company dashboard is temporarily unavailable.' },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleCompanyDashboardSessionGet(request)
}
