import { NextRequest, NextResponse } from 'next/server'
import { createWorkerHelpRequest, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const note = typeof body?.note === 'string' ? body.note : ''
    const dashboard = await createWorkerHelpRequest(auth.workerId, note)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create help request.' },
      { status: 400 }
    )
  }
}
