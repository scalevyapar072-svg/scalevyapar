import { NextRequest, NextResponse } from 'next/server'
import { applyToWorkerJob, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const dashboard = await applyToWorkerJob(
      auth.workerId,
      typeof body.jobPostId === 'string' ? body.jobPostId : '',
      typeof body.note === 'string' ? body.note : undefined
    )

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply to job.' },
      { status: 400 }
    )
  }
}
