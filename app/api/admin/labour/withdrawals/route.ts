import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  getAdminReferralWithdrawals,
  LabourWorkerReferralWithdrawalError,
  markReferralWithdrawalPaid,
  reviewReferralWithdrawal,
} from '@/lib/labour-worker-referral-withdrawal'

const normalizeText = (value: unknown) => String(value || '').trim()

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { searchParams } = new URL(request.url)
    const snapshot = await getAdminReferralWithdrawals({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      payoutMethod: searchParams.get('payoutMethod') || 'all',
    })

    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Referral withdrawal admin fetch failed:', error)
    const status =
      error instanceof LabourWorkerReferralWithdrawalError ? error.statusCode : 500
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load withdrawal requests',
      },
      { status },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await request.json().catch(() => ({}))
    const action = normalizeText((body as { action?: unknown }).action).toLowerCase()
    const requestId = normalizeText((body as { requestId?: unknown }).requestId)
    const rejectionReason = normalizeText(
      (body as { rejectionReason?: unknown }).rejectionReason,
    )
    const paymentReference = normalizeText(
      (body as { paymentReference?: unknown }).paymentReference,
    )

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 },
      )
    }

    if (action !== 'approve' && action !== 'reject' && action !== 'mark-paid') {
      return NextResponse.json(
        { error: 'Valid review action is required' },
        { status: 400 },
      )
    }

    const result =
      action === 'mark-paid'
        ? await markReferralWithdrawalPaid({
            requestId,
            paymentReference,
          })
        : await reviewReferralWithdrawal({
            requestId,
            action,
            rejectionReason,
          })

    return NextResponse.json({
      success: true,
      withdrawal: result.withdrawal,
      snapshot: result.snapshot,
    })
  } catch (error) {
    console.error('Referral withdrawal admin review failed:', error)
    const status =
      error instanceof LabourWorkerReferralWithdrawalError ? error.statusCode : 500
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to review withdrawal request',
      },
      { status },
    )
  }
}
