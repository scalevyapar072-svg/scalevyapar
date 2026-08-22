import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { createWhatsappConsentRepository } from '@/lib/whatsapp/consent-repository'
import { getWhatsappPersistenceClient } from '@/lib/whatsapp/persistence-client'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp consent persistence summary.',
    getPayload: async () => {
      const persistence = getWhatsappPersistenceClient()
      if (!persistence.available) {
        return {
          success: true,
          summary: {
            available: false,
            persistenceStatus: 'Persistence unavailable',
            failClosed: true,
            counts: [],
          },
        }
      }

      const repository = createWhatsappConsentRepository({
        client: persistence.client,
      })

      return {
        success: true,
        summary: await repository.getConsentSummary(),
      }
    },
  })
}
