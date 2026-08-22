import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { normalizeIndianMobileToE164 } from '@/lib/whatsapp/consent'
import { handleAdminWhatsappReadOnlyGet } from '@/lib/whatsapp/admin-readonly-route'
import { createWhatsappConsentRepository } from '@/lib/whatsapp/consent-repository'
import { getWhatsappPersistenceClient } from '@/lib/whatsapp/persistence-client'

export const runtime = 'nodejs'

const countRecipientsWithWhatsappTarget = async () => {
  const snapshot = await getLabourMarketplaceSnapshot()

  const workerCount = snapshot.workers.filter((worker) => normalizeIndianMobileToE164(worker.mobile).ok).length
  const companyCount = snapshot.companies.filter((company) =>
    normalizeIndianMobileToE164(company.contactMobile || company.mobile).ok,
  ).length

  return {
    worker: workerCount,
    company: companyCount,
  }
}

export async function GET(request: NextRequest) {
  return handleAdminWhatsappReadOnlyGet({
    request,
    requireAdmin,
    errorMessage: 'Failed to load WhatsApp consent persistence summary.',
    getPayload: async () => {
      const recipientTotals = await countRecipientsWithWhatsappTarget()
      const persistence = getWhatsappPersistenceClient()
      if (!persistence.available) {
        return {
          success: true,
          summary: {
            available: false,
            persistenceStatus: 'Persistence unavailable',
            failClosed: true,
            recipientTotals,
            counts: [
              { recipientType: 'worker', consentType: 'service_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.worker },
              { recipientType: 'worker', consentType: 'matching_alerts_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.worker },
              { recipientType: 'worker', consentType: 'marketing_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.worker },
              { recipientType: 'company', consentType: 'service_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.company },
              { recipientType: 'company', consentType: 'matching_alerts_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.company },
              { recipientType: 'company', consentType: 'marketing_allowed', allowedCount: 0, blockedCount: 0, unknownCount: recipientTotals.company },
            ],
          },
        }
      }

      const repository = createWhatsappConsentRepository({
        client: persistence.client,
      })
      const summary = await repository.getConsentSummary()

      return {
        success: true,
        summary: {
          ...summary,
          recipientTotals,
          counts: summary.counts.map((row) => ({
            ...row,
            unknownCount: Math.max(
              0,
              recipientTotals[row.recipientType] - row.allowedCount - row.blockedCount,
            ),
          })),
        },
      }
    },
  })
}
