import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  withNoStore,
} from '@/lib/whatsapp/admin-status-route'
import { getWhatsappTemplateInventoryOverview } from '@/lib/whatsapp/meta-status'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return withNoStore(admin)
    }

    const overview = await getWhatsappTemplateInventoryOverview()
    return withNoStore(
      Response.json({
        success: true,
        overview,
      }),
    )
  } catch (error) {
    console.error('WhatsApp template overview fetch failed:', error)
    return withNoStore(
      Response.json(
        {
          error: 'Failed to load WhatsApp template architecture.',
        },
        { status: 500 },
      ),
    )
  }
}
