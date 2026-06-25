import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp, updateWorkerWalletStatus } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'Active flag is required.' }, { status: 400 })
    }

    const dashboard = await updateWorkerWalletStatus(auth.workerId, body.active)
    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update worker wallet status.' },
      { status: 400 }
    )
  }
}
