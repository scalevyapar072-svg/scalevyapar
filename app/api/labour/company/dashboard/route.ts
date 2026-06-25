import { NextRequest, NextResponse } from 'next/server'
import { getCompanyAppDashboard, requireCompanyApp } from '@/lib/labour-company-app'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const dashboard = await getCompanyAppDashboard(auth.companyId)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load company dashboard.' },
      { status: 401 }
    )
  }
}
