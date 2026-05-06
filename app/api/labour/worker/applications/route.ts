import { NextRequest, NextResponse } from 'next/server'
import { applyToWorkerJob, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const result = await applyToWorkerJob(
      auth.workerId,
      typeof body.jobPostId === 'string' ? body.jobPostId : '',
      typeof body.note === 'string' ? body.note : undefined
    )

    console.log('Worker application API response summary', {
      workerId: auth.workerId,
      jobPostId: typeof body.jobPostId === 'string' ? body.jobPostId : '',
      deliveryDebug: result.deliveryDebug
    })

    return NextResponse.json({ success: true, dashboard: result.dashboard, deliveryDebug: result.deliveryDebug })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply to job.' },
      { status: 400 }
    )
  }
}
