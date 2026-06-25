import { NextRequest, NextResponse } from 'next/server'
import {
  requireCompanyApp,
  updateCompanyApplicationNote,
  updateCompanyApplicationStatus
} from '@/lib/labour-company-app'

const ALLOWED_STATUSES = new Set(['reviewed', 'shortlisted', 'rejected', 'hired'])

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const payload = await request.json()
    const applicationId = String(payload.applicationId || '')
    const statusValue = typeof payload.status === 'string' ? payload.status : ''
    const noteValue = typeof payload.note === 'string' ? payload.note : null

    if (!applicationId) {
      return NextResponse.json({ error: 'Application id is required.' }, { status: 400 })
    }

    if (!statusValue && noteValue === null) {
      return NextResponse.json({ error: 'Application update payload is required.' }, { status: 400 })
    }

    let dashboard
    let successMessage = 'Application updated successfully.'

    if (statusValue) {
      if (!ALLOWED_STATUSES.has(statusValue)) {
        return NextResponse.json({ error: 'Invalid application status.' }, { status: 400 })
      }

      dashboard = await updateCompanyApplicationStatus(
        auth.companyId,
        applicationId,
        statusValue as 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
      )
      successMessage = `Application marked as ${statusValue}.`
    }

    if (noteValue !== null) {
      dashboard = await updateCompanyApplicationNote(
        auth.companyId,
        applicationId,
        noteValue || ''
      )
      if (!statusValue) {
        successMessage = noteValue?.trim()
          ? 'Application note saved successfully.'
          : 'Application note cleared successfully.'
      }
    }

    return NextResponse.json({ success: true, dashboard, message: successMessage })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update worker application.' },
      { status: 400 }
    )
  }
}
