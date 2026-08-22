import { assertWhatsappServerOnly } from './server-runtime'
import type { MetaWebhookSignatureVerificationResult } from './meta-signature'

assertWhatsappServerOnly('lib/whatsapp/webhook-route')

type WebhookConfigResolution =
  | {
      ok: true
      config: {
        appSecret: string
      }
    }
  | {
      ok: false
      missingVariables: string[]
    }

const toBuffer = async (request: Request) => Buffer.from(await request.arrayBuffer())

export const handleWhatsappWebhookGet = ({
  searchParams,
  expectedToken,
}: {
  searchParams: URLSearchParams
  expectedToken: string
}) => {
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (!expectedToken) {
    return Response.json(
      { error: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured.' },
      { status: 500 },
    )
  }

  if (mode === 'subscribe' && verifyToken === expectedToken && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return Response.json({ error: 'Webhook verification failed.' }, { status: 403 })
}

export const handleWhatsappWebhookPost = async <WebhookEvent>({
  request,
  resolveWebhookPostConfig,
  verifySignature,
  extractStatusEvents,
  persistStatusEvents,
  logger = console,
}: {
  request: Request
  resolveWebhookPostConfig: () => WebhookConfigResolution
  verifySignature: (input: {
    rawBody: Buffer
    signatureHeader: string | null
    appSecret: string
  }) => MetaWebhookSignatureVerificationResult
  extractStatusEvents: (payload: Record<string, unknown>) => WebhookEvent[]
  persistStatusEvents: (events: WebhookEvent[]) => Promise<void>
  logger?: Pick<typeof console, 'log' | 'error'>
}) => {
  try {
    const webhookConfig = resolveWebhookPostConfig()
    if (!webhookConfig.ok) {
      return Response.json(
        {
          received: false,
          reason: 'meta-signature-not-configured',
          missingVariables:
            'missingVariables' in webhookConfig ? webhookConfig.missingVariables : [],
        },
        { status: 503 },
      )
    }

    const rawBody = await toBuffer(request)
    const verification = verifySignature({
      rawBody,
      signatureHeader: request.headers.get('x-hub-signature-256'),
      appSecret: webhookConfig.config.appSecret,
    })
    if (!verification.valid) {
      return Response.json(
        {
          received: false,
          reason: verification.reason,
        },
        { status: 401 },
      )
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>
    if (payload.object !== 'whatsapp_business_account') {
      return Response.json(
        { received: false, reason: 'unsupported-object' },
        { status: 200 },
      )
    }

    const events = extractStatusEvents(payload)
    if (events.length === 0) {
      logger.log('WhatsApp webhook received with no status events.')
      return Response.json({ received: true, statusEvents: 0 }, { status: 200 })
    }

    logger.log('WhatsApp webhook status events', events)
    await persistStatusEvents(events)

    return Response.json({ received: true, statusEvents: events.length }, { status: 200 })
  } catch (error) {
    logger.error('Failed to process WhatsApp webhook', error)
    return Response.json(
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
