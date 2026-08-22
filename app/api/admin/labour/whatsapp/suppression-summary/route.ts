import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { getWhatsappPersistenceClient } from '@/lib/whatsapp/persistence-client'
import { createWhatsappSuppressionRepository } from '@/lib/whatsapp/suppression-repository'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp suppression summary.',
    getPayload: async () => {
      const persistence = getWhatsappPersistenceClient()
      if (!persistence.available) {
        return {
          success: true,
          summary: {
            available: false,
            persistenceStatus: 'Persistence unavailable',
            failClosed: true,
            activeSuppressionCount: 0,
            recentRecords: [],
          },
        }
      }

      const repository = createWhatsappSuppressionRepository({
        client: persistence.client,
      })

      return {
        success: true,
        summary: await repository.getSuppressionSummary({ limit: 8 }),
      }
    },
  })
}
