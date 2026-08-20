import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { processReferralAdminEmailOutboxBatch } from '@/lib/labour-worker-referral-email-outbox'

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
  const summary = await processReferralAdminEmailOutboxBatch()

  return NextResponse.json(summary, {
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
