import { NextRequest, NextResponse } from 'next/server'
import { getCompanyAppDashboard, requireCompanyApp } from '@/lib/labour-company-app'
import { logSafeServerEvent } from '@/lib/safe-observability'

type CompanyDashboardReadDependencies = {
  getCompanyAppDashboard: typeof getCompanyAppDashboard
  requireCompanyApp: typeof requireCompanyApp
}

export async function handleCompanyDashboardGet(
  request: NextRequest,
  dependencies: CompanyDashboardReadDependencies = {
    getCompanyAppDashboard,
    requireCompanyApp,
  },
) {
  let auth: Awaited<ReturnType<typeof requireCompanyApp>>

  try {
    auth = await dependencies.requireCompanyApp(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dashboard = await dependencies.getCompanyAppDashboard(auth.companyId)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    if (error instanceof Error && error.message === 'Company account not found.') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logSafeServerEvent({ event: 'company_dashboard_read', outcome: 'failure', status: 503 })
    return NextResponse.json({ error: 'Company dashboard is temporarily unavailable.' }, { status: 503 })
  }
}

export async function GET(request: NextRequest) {
  return handleCompanyDashboardGet(request)
}
