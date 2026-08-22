import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { getWhatsappMetaConnectionStatus } from '@/lib/whatsapp/meta-status'

export const runtime = 'nodejs'

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

const withNoStore = (response: NextResponse) => {
  Object.entries(noStoreHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return withNoStore(admin)
    }

    const status = await getWhatsappMetaConnectionStatus()

    return NextResponse.json(
      {
        success: true,
        status,
      },
      {
        headers: noStoreHeaders,
      },
    )
  } catch (error) {
    console.error('WhatsApp Meta status fetch failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to load WhatsApp Meta connection status.',
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    )
  }
}
