import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { getWhatsappAutomationPreviewSummary } from '@/lib/whatsapp/automation-preview'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp automation preview.',
    getPayload: async () => ({
      success: true,
      summary: await getWhatsappAutomationPreviewSummary(),
    }),
  })
}
