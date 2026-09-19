import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { processReferralAdminEmailOutboxBatch } from '@/lib/labour-worker-referral-email-outbox'
import { processRozgarInternalNotificationOutboxBatch } from '@/lib/rozgar-internal-notification-outbox'

const CRON_BEARER_PREFIX = 'Bearer '

const hasValidCronSecret = (request: NextRequest) => {
  const configuredSecret = process.env.CRON_SECRET?.trim()
  if (!configuredSecret) {
    return false
  }

  const authHeader = request.headers.get('authorization')?.trim() || ''
  if (!authHeader.startsWith(CRON_BEARER_PREFIX)) {
    return false
  }

  const providedSecret = authHeader.slice(CRON_BEARER_PREFIX.length).trim()
  return providedSecret.length > 0 && providedSecret === configuredSecret
}

const buildProcessorSummaryResponse = async () => {
  const [referralResult, internalNotificationResult] = await Promise.allSettled([
    processReferralAdminEmailOutboxBatch(),
    processRozgarInternalNotificationOutboxBatch(),
  ])

  if (internalNotificationResult.status === 'rejected') {
    console.error(
      'Rozgar internal notification outbox processor failed:',
      internalNotificationResult.reason,
    )
  }

  if (referralResult.status === 'rejected') {
    throw referralResult.reason
  }

  return NextResponse.json(referralResult.value, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    if (hasValidCronSecret(request)) {
      return buildProcessorSummaryResponse()
    }

    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    return buildProcessorSummaryResponse()
  } catch (error) {
    console.error('Refer & Earn email outbox processor failed:', error)
    return NextResponse.json(
      { error: 'Failed to process Refer & Earn email outbox' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (hasValidCronSecret(request)) {
      return buildProcessorSummaryResponse()
    }

    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    return buildProcessorSummaryResponse()
  } catch (error) {
    console.error('Refer & Earn email outbox processor failed:', error)
    return NextResponse.json(
      { error: 'Failed to process Refer & Earn email outbox' },
      { status: 500 },
    )
  }
}
