import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp, updateWorkerAppProfile } from '@/lib/labour-worker-app'

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const payload = await request.json()
    const dashboard = await updateWorkerAppProfile(auth.workerId, payload)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update worker profile.' }, { status: 400 })
  }
}
