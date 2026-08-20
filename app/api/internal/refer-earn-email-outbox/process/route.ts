import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { processReferralAdminEmailOutboxBatch } from '@/lib/labour-worker-referral-email-outbox'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const summary = await processReferralAdminEmailOutboxBatch()

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Refer & Earn email outbox processor failed:', error)
    return NextResponse.json(
      { error: 'Failed to process Refer & Earn email outbox' },
      { status: 500 },
    )
  }
}
