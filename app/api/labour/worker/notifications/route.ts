import { NextRequest, NextResponse } from 'next/server'
import { markWorkerNotificationsRead, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds.map((value: unknown) => String(value)).filter(Boolean)
      : undefined

    const dashboard = await markWorkerNotificationsRead(auth.workerId, notificationIds)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update notifications.' },
      { status: 400 }
    )
  }
}
