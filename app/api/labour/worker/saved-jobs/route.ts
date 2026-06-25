import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp, toggleWorkerSavedJob } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const dashboard = await toggleWorkerSavedJob(
      auth.workerId,
      typeof body.jobPostId === 'string' ? body.jobPostId : ''
    )

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update saved jobs.' },
      { status: 400 }
    )
  }
}
