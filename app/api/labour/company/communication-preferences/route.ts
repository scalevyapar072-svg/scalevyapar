import { NextRequest, NextResponse } from 'next/server'

import { requireCompanyApp } from '@/lib/labour-company-app'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import {
  parseCompanySettingsWhatsappConsents,
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

const getCompanyRecipient = async (request: NextRequest) => {
  const auth = await requireCompanyApp(request)
  const snapshot = await getLabourMarketplaceSnapshot()
  const company = snapshot.companies.find((item) => item.id === auth.companyId) || null

  if (!company) {
    throw new Error('Company account not found.')
  }

  return {
    recipientType: 'company' as const,
    recipientId: company.id,
    mobile: company.contactMobile || company.mobile,
  }
}

export async function GET(request: NextRequest) {
  try {
    const recipient = await getCompanyRecipient(request)
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
              : 'Failed to load company communication preferences.',
        },
        { status: 400 },
      ),
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const recipient = await getCompanyRecipient(request)
    const body = await request.json().catch(() => ({}))
    const consents = parseCompanySettingsWhatsappConsents(body.whatsappConsents)
    const consentTextVersion = resolveWhatsappConsentTextVersion(body.whatsappConsentTextVersion)

    const result = await persistWhatsappConsentPreferences({
      recipient,
      consents,
      source: 'company_settings',
      consentTextVersion,
      metadata: {
        origin: 'company_settings',
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
      const recipient = await getCompanyRecipient(request)
      logWhatsappConsentWriteFailure({
        error,
        recipient,
        source: 'company_settings',
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
              : 'Failed to update company communication preferences.',
        },
        { status: 400 },
      ),
    )
  }
}
