import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { createWorkerNotification, resendWorkerNotification } from '@/lib/labour-worker-app'

export const runtime = 'nodejs'

const isNotificationType = (value: unknown) =>
  value === 'application_submitted' ||
  value === 'job_saved' ||
  value === 'application_status' ||
  value === 'wallet_reminder'

const isNotificationPriority = (value: unknown) =>
  value === 'high' ||
  value === 'medium' ||
  value === 'low'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const {
      workerId,
      type,
      title,
      message,
      priority,
      relatedJobPostId,
      relatedCompanyId
    } = await request.json()

    if (!workerId || !isNotificationType(type) || !isNotificationPriority(priority)) {
      return NextResponse.json(
        { error: 'workerId, type and priority are required.' },
        { status: 400 }
      )
    }

    if (!String(title || '').trim() || !String(message || '').trim()) {
      return NextResponse.json(
        { error: 'Notification title and message are required.' },
        { status: 400 }
      )
    }

    await createWorkerNotification(
      String(workerId),
      {
        type,
        title: String(title).trim(),
        message: String(message).trim(),
        priority,
        relatedJobPostId: String(relatedJobPostId || '').trim() || undefined,
        relatedCompanyId: String(relatedCompanyId || '').trim() || undefined
      },
      admin.email
    )

    const snapshot = await getLabourMarketplaceSnapshot()
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Admin worker notification create failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send worker notification.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 })
    }

    await resendWorkerNotification(String(id), admin.email)
    const snapshot = await getLabourMarketplaceSnapshot()
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Admin worker notification resend failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend worker notification.' },
      { status: 500 }
    )
  }
}
