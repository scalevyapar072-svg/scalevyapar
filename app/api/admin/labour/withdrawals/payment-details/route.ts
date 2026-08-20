import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  getWithdrawalPaymentDetailsForAdmin,
  LabourWorkerReferralWithdrawalError,
} from '@/lib/labour-worker-referral-withdrawal'

const normalizeText = (value: unknown) => String(value || '').trim()

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await request.json().catch(() => ({}))
    const requestId = normalizeText((body as { requestId?: unknown }).requestId)

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400, headers: noStoreHeaders },
      )
    }

    const paymentDetails = await getWithdrawalPaymentDetailsForAdmin(requestId)

    return NextResponse.json(
      {
        success: true,
        paymentDetails,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error('Referral withdrawal payment details fetch failed:', error)
    const status =
      error instanceof LabourWorkerReferralWithdrawalError ? error.statusCode : 500
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load withdrawal payment details',
      },
      { status, headers: noStoreHeaders },
    )
  }
}
