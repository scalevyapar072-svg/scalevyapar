import { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  WHATSAPP_CONSENT_COLLECTION_POINTS,
  WHATSAPP_CONSENT_TYPE_DESCRIPTORS,
  maskWhatsappMobile,
} from '@/lib/whatsapp/consent'
import {
  WHATSAPP_GLOBAL_OPT_OUT_COMMANDS,
  WHATSAPP_RESTORE_REQUEST_COMMANDS,
} from '@/lib/whatsapp/opt-out'
import { withNoStore } from '@/lib/whatsapp/admin-status-route'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return withNoStore(admin)
    }

    return withNoStore(
      Response.json({
        success: true,
        overview: {
          migrationApplied: false,
          readOnlyMode: true,
          persistenceState:
            'Consent and suppression persistence remain inactive until the reviewed migration is approved and applied.',
          consentTypes: WHATSAPP_CONSENT_TYPE_DESCRIPTORS,
          workerCollectionPoints: [...WHATSAPP_CONSENT_COLLECTION_POINTS.worker],
          companyCollectionPoints: [...WHATSAPP_CONSENT_COLLECTION_POINTS.company],
          globalOptOutCommands: [...WHATSAPP_GLOBAL_OPT_OUT_COMMANDS],
          restoreRequestCommands: [...WHATSAPP_RESTORE_REQUEST_COMMANDS],
          generalOptOutEffect:
            'A general STOP command suppresses every WhatsApp category for the mobile number.',
          restorationPolicy:
            'START or SUBSCRIBE records only a restoration request. Matching and Marketing consent still require a fresh approved flow.',
          noManualConsentOverride: true,
          recipientActionsEnabled: false,
          maskedExampleMobile: maskWhatsappMobile('+919876543210'),
        },
      }),
    )
  } catch (error) {
    console.error('WhatsApp consent overview fetch failed:', error)
    return withNoStore(
      Response.json(
        {
          error: 'Failed to load WhatsApp consent architecture.',
        },
        { status: 500 },
      ),
    )
  }
}
