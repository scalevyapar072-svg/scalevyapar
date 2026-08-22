import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { getWhatsappPersistenceClient } from '@/lib/whatsapp/persistence-client'
import { createWhatsappTemplateInventoryRepository } from '@/lib/whatsapp/template-inventory-repository'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp template persistence summary.',
    getPayload: async () => {
      const persistence = getWhatsappPersistenceClient()
      if (!persistence.available) {
        return {
          success: true,
          summary: {
            available: false,
            persistenceStatus: 'Persistence unavailable',
            failClosed: true,
            totalTemplates: 0,
            byStatus: {},
            byCategory: {},
            templates: [],
          },
        }
      }

      const repository = createWhatsappTemplateInventoryRepository({
        client: persistence.client,
      })

      return {
        success: true,
        summary: await repository.getTemplateInventorySummary({ limit: 24 }),
      }
    },
  })
}
