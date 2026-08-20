import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  enqueueReferralAdminEmail,
  REFERRAL_EMAIL_OUTBOX_TEST_TEMPLATE_ID,
} from '@/lib/labour-worker-referral-email-outbox'

const notFound = () =>
  NextResponse.json(
    { error: 'Not found' },
    {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )

const normalizeText = (value: unknown) => String(value || '').trim()

export async function POST(request: NextRequest) {
  try {
    if (process.env.VERCEL_ENV !== 'preview') {
      return notFound()
    }

    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await request.json().catch(() => ({}))
    const eventKey =
      normalizeText((body as { eventKey?: unknown }).eventKey) ||
      'referral-email-outbox-preview-test'

    const result = await enqueueReferralAdminEmail({
      eventKey,
      eventType: 'referral_email_outbox_test',
      templateId: REFERRAL_EMAIL_OUTBOX_TEST_TEMPLATE_ID,
      payload: {
        status: 'preview-test',
        timestamps: {
          requested_at: new Date().toISOString(),
        },
        requested_by: {
          email: admin.email,
          role: admin.role,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        inserted: result.inserted,
        duplicate: result.duplicate,
        eventKey,
        rowStatus: result.row?.status || null,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Refer & Earn email outbox test enqueue failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enqueue test email' },
      { status: 500 },
    )
  }
}
