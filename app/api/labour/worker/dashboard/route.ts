import { NextRequest, NextResponse } from 'next/server'
import { getWorkerAppDashboard, requireWorkerApp } from '@/lib/labour-worker-app'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const dashboard = await getWorkerAppDashboard(auth.workerId)
    return NextResponse.json({ success: true, dashboard }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load worker dashboard.' },
      { status: 401, headers: NO_STORE_HEADERS }
    )
  }
}
