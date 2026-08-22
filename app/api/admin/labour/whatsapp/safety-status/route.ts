import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { getWhatsappPersistenceClient } from '@/lib/whatsapp/persistence-client'
import { createWhatsappSettingsRepository } from '@/lib/whatsapp/settings-repository'
import { REVIEW_ONLY_WHATSAPP_DEFAULTS } from '@/lib/whatsapp/persistence-types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp safety status.',
    getPayload: async () => {
      const persistence = getWhatsappPersistenceClient()
      if (!persistence.available) {
        return {
          success: true,
          summary: {
            available: false,
            persistenceStatus: 'Persistence unavailable',
            failClosed: true,
            pauseAllSending: true,
            pauseReason: 'persistence_unavailable',
            reviewOnlyDefaults: REVIEW_ONLY_WHATSAPP_DEFAULTS,
          },
        }
      }

      const repository = createWhatsappSettingsRepository({
        client: persistence.client,
      })

      return {
        success: true,
        summary: await repository.getWhatsappSafetySettings(),
      }
    },
  })
}
