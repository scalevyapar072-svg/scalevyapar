import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp } from '@/lib/labour-worker-app'
import { registerWorkerPushToken, unregisterWorkerPushToken } from '@/lib/labour-worker-push'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const fcmToken = String(body.fcmToken || '').trim()
    const locale = String(body.locale || 'hi').trim()
    const platform = String(body.platform || 'android').trim()
    const deviceLabel = body.deviceLabel ? String(body.deviceLabel).trim() : undefined

    if (!fcmToken) {
      throw new Error('FCM token is required.')
    }

    await registerWorkerPushToken(auth.workerId, {
      fcmToken,
      locale,
      platform,
      deviceLabel
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register push token.' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const body = await request.json().catch(() => ({}))
    const fcmToken = body.fcmToken ? String(body.fcmToken).trim() : undefined

    await unregisterWorkerPushToken(auth.workerId, fcmToken)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unregister push token.' },
      { status: 400 }
    )
  }
}
