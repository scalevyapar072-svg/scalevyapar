import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyApp, updateCompanyApplicationStatus } from '@/lib/labour-company-app'

const ALLOWED_STATUSES = new Set(['reviewed', 'shortlisted', 'rejected', 'hired'])

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const payload = await request.json()
    const applicationId = String(payload.applicationId || '')
    const status = String(payload.status || '')

    if (!applicationId) {
      return NextResponse.json({ error: 'Application id is required.' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid application status.' }, { status: 400 })
    }

    const dashboard = await updateCompanyApplicationStatus(
      auth.companyId,
      applicationId,
      status as 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
    )

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update worker application.' },
      { status: 400 }
    )
  }
}
