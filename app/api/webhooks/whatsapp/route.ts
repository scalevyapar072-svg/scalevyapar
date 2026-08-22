import { NextRequest } from 'next/server'
import {
  extractWhatsappWebhookStatusEvents,
  persistWhatsappWebhookStatusEvents,
} from '@/lib/labour-whatsapp-webhook'
import {
  getWhatsappWebhookVerifyToken,
  resolveWhatsappWebhookPostConfig,
} from '@/lib/whatsapp/meta-config'
import { verifyMetaWebhookSignature } from '@/lib/whatsapp/meta-signature'
import {
  handleWhatsappWebhookGet,
  handleWhatsappWebhookPost,
} from '@/lib/whatsapp/webhook-route'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return handleWhatsappWebhookGet({
    searchParams: request.nextUrl.searchParams,
    expectedToken: getWhatsappWebhookVerifyToken(),
  })
}

export async function POST(request: NextRequest) {
  return handleWhatsappWebhookPost({
    request,
    resolveWebhookPostConfig: () => resolveWhatsappWebhookPostConfig(),
    verifySignature: verifyMetaWebhookSignature,
    extractStatusEvents: (payload) =>
      extractWhatsappWebhookStatusEvents(
        payload as Parameters<typeof extractWhatsappWebhookStatusEvents>[0],
      ),
    persistStatusEvents: async (events) => persistWhatsappWebhookStatusEvents(events),
  })
}
