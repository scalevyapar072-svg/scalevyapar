import { NextRequest, NextResponse } from 'next/server'

import { requireWorkerApp } from '@/lib/labour-worker-app'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import {
  parseWorkerSettingsWhatsappConsents,
  resolveWhatsappConsentTextVersion,
  WHATSAPP_CONSENT_TEXT_VERSION,
} from '@/lib/whatsapp/consent'
import {
  getWhatsappConsentPreferences,
  logWhatsappConsentWriteFailure,
  persistWhatsappConsentPreferences,
} from '@/lib/whatsapp/consent-write-service'

export const runtime = 'nodejs'

const withNoStore = (response: NextResponse) => {
  response.headers.set('cache-control', 'no-store, no-cache, max-age=0, must-revalidate')
  response.headers.set('pragma', 'no-cache')
  response.headers.set('expires', '0')
  return response
}

const getWorkerRecipient = async (request: NextRequest) => {
  const auth = await requireWorkerApp(request)
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = snapshot.workers.find((item) => item.id === auth.workerId) || null

  if (!worker) {
    throw new Error('Worker account not found.')
  }

  return {
    recipientType: 'worker' as const,
    recipientId: worker.id,
    mobile: worker.mobile,
  }
}

export async function GET(request: NextRequest) {
  try {
    const recipient = await getWorkerRecipient(request)
    const preferences = await getWhatsappConsentPreferences(recipient)

    return withNoStore(
      NextResponse.json({
        success: true,
        preferences: {
          ...preferences,
          consentTextVersion: preferences.consentTextVersion || WHATSAPP_CONSENT_TEXT_VERSION,
        },
      }),
    )
  } catch (error) {
    return withNoStore(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load worker communication preferences.',
        },
        { status: 400 },
      ),
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const recipient = await getWorkerRecipient(request)
    const body = await request.json().catch(() => ({}))
    const consents = parseWorkerSettingsWhatsappConsents(body.whatsappConsents)
    const consentTextVersion = resolveWhatsappConsentTextVersion(body.whatsappConsentTextVersion)

    const result = await persistWhatsappConsentPreferences({
      recipient,
      consents,
      source: 'worker_settings',
      consentTextVersion,
      metadata: {
        origin: 'worker_settings',
      },
    })

    if (!result.writeEnabled) {
      return withNoStore(
        NextResponse.json(
          {
            error: result.disabledMessage || 'WhatsApp consent updates are unavailable.',
            preferences: result,
          },
          { status: 503 },
        ),
      )
    }

    return withNoStore(
      NextResponse.json({
        success: true,
        preferences: result,
      }),
    )
  } catch (error) {
    try {
      const recipient = await getWorkerRecipient(request)
      logWhatsappConsentWriteFailure({
        error,
        recipient,
        source: 'worker_settings',
      })
    } catch {
      // Ignore recipient lookup failures in the error path.
    }

    return withNoStore(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update worker communication preferences.',
        },
        { status: 400 },
      ),
    )
  }
}
