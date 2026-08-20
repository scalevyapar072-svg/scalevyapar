import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  getReferralSettings,
  updateReferralSettings,
} from '@/lib/labour-referral-settings'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const settings = await getReferralSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Referral settings fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load referral settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { settings } = await request.json()
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings payload is required' }, { status: 400 })
    }

    const updated = await updateReferralSettings({
      minimumWithdrawalAmount: (settings as { minimumWithdrawalAmount?: unknown }).minimumWithdrawalAmount,
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    console.error('Referral settings update failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save referral settings',
      },
      { status: 500 },
    )
  }
}
