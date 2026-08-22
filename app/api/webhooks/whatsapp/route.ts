import { NextRequest, NextResponse } from 'next/server'
import {
  extractWhatsappWebhookStatusEvents,
  persistWhatsappWebhookStatusEvents,
} from '@/lib/labour-whatsapp-webhook'
import {
  getWhatsappWebhookVerifyToken,
  resolveWhatsappWebhookPostConfig,
} from '@/lib/whatsapp/meta-config'
import { verifyMetaWebhookSignature } from '@/lib/whatsapp/meta-signature'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  const expectedToken = getWhatsappWebhookVerifyToken()

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured.' },
      { status: 500 },
    )
  }

  if (mode === 'subscribe' && verifyToken === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Webhook verification failed.' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const webhookConfig = resolveWhatsappWebhookPostConfig()
    if (!webhookConfig.ok) {
      return NextResponse.json(
        {
          received: false,
          reason: 'meta-signature-not-configured',
          missingVariables: webhookConfig.missingVariables,
        },
        { status: 503 },
      )
    }

    const rawBody = Buffer.from(await request.arrayBuffer())
    const verification = verifyMetaWebhookSignature({
      rawBody,
      signatureHeader: request.headers.get('x-hub-signature-256'),
      appSecret: webhookConfig.config.appSecret,
    })
    if (!verification.valid) {
      return NextResponse.json(
        {
          received: false,
          reason: verification.reason,
        },
        { status: 401 },
      )
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      object?: string
    }

    if (payload?.object !== 'whatsapp_business_account') {
      return NextResponse.json(
        { received: false, reason: 'unsupported-object' },
        { status: 200 },
      )
    }

    const events = extractWhatsappWebhookStatusEvents(payload)

    if (events.length === 0) {
      console.log('WhatsApp webhook received with no status events.')
      return NextResponse.json({ received: true, statusEvents: 0 }, { status: 200 })
    }

    console.log('WhatsApp webhook status events', events)
    await persistWhatsappWebhookStatusEvents(events)

    return NextResponse.json({ received: true, statusEvents: events.length }, { status: 200 })
  } catch (error) {
    console.error('Failed to process WhatsApp webhook', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process WhatsApp webhook.',
      },
      { status: 500 },
    )
  }
}
