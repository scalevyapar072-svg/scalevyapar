import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { getWhatsappMetaConnectionStatus } from '@/lib/whatsapp/meta-status'
import { handleAdminWhatsappMetaStatusGet } from '@/lib/whatsapp/admin-status-route'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappMetaStatusGet({
    request,
    requireAdmin,
    getStatus: () => getWhatsappMetaConnectionStatus(),
  })
}
