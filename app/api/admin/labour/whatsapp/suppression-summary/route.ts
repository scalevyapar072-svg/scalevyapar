import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { maskWhatsappMobile } from '@/lib/whatsapp/consent'
import { createWhatsappInboundEventRepository } from '@/lib/whatsapp/inbound-event-repository'
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
            recentInboundEvents: [],
          },
        }
      }

      const repository = createWhatsappSuppressionRepository({
        client: persistence.client,
      })
      const inboundRepository = createWhatsappInboundEventRepository({
        client: persistence.client,
      })

      const [summary, recentInboundEvents] = await Promise.all([
        repository.getSuppressionSummary({ limit: 8 }),
        inboundRepository.listRecentInboundEvents({ limit: 8 }),
      ])

      return {
        success: true,
        summary: {
          ...summary,
          recentInboundEvents: recentInboundEvents.map((event) => ({
            maskedMobile: event.normalizedMobile
              ? maskWhatsappMobile(event.normalizedMobile)
              : String(event.metadata.maskedMobile || ''),
            commandType: String(event.metadata.commandType || event.commandKey || '').toUpperCase(),
            resolutionCategory: String(event.metadata.resolutionCategory || 'unknown'),
            deduplicationOutcome: String(
              event.metadata.deduplicationOutcome || 'processed_unique_message',
            ),
            suppressionApplied: Boolean(event.suppressionApplied),
            restorationRequested: Boolean(event.metadata.restorationRequested),
            processingOutcome: String(event.metadata.processingOutcome || ''),
            eventTimestamp:
              String(event.metadata.receivedAt || '').trim() || event.createdAt,
          })),
        },
      }
    },
  })
}
