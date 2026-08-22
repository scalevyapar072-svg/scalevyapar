import type { WhatsappMetaConnectionStatus } from './meta-status'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/admin-status-route')

export const whatsappMetaNoStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

export const withNoStore = (response: Response) => {
  Object.entries(whatsappMetaNoStoreHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const handleAdminWhatsappMetaStatusGet = async ({
  request,
  requireAdmin,
  getStatus,
  logger = console,
}: {
  request: Request
  requireAdmin: (request: Request) => Promise<Response | unknown>
  getStatus: () => Promise<WhatsappMetaConnectionStatus>
  logger?: Pick<typeof console, 'error'>
}) => {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return withNoStore(admin)
    }

    const status = await getStatus()
    return withNoStore(
      Response.json({
        success: true,
        status,
      }),
    )
  } catch (error) {
    logger.error('WhatsApp Meta status fetch failed:', error)
    return withNoStore(
      Response.json(
        {
          error: 'Failed to load WhatsApp Meta connection status.',
        },
        { status: 500 },
      ),
    )
  }
}
