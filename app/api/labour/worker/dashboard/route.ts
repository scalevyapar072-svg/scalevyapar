import { NextRequest, NextResponse } from 'next/server'
import { getWorkerAppDashboard, requireWorkerApp } from '@/lib/labour-worker-app'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const dashboard = await getWorkerAppDashboard(auth.workerId)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load worker dashboard.' }, { status: 401 })
  }
}
