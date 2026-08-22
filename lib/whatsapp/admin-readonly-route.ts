import { withNoStore } from './admin-status-route'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/admin-readonly-route')

export const handleAdminWhatsappReadOnlyGet = async <Payload>({
  request,
  requireAdmin,
  getPayload,
  errorMessage,
  logger = console,
}: {
  request: Request
  requireAdmin: (request: Request) => Promise<Response | unknown>
  getPayload: () => Promise<Payload>
  errorMessage: string
  logger?: Pick<typeof console, 'error'>
}) => {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return withNoStore(admin)
    }

    return withNoStore(Response.json(await getPayload()))
  } catch (error) {
    logger.error(errorMessage, error)
    return withNoStore(
      Response.json(
        {
          error: errorMessage,
        },
        { status: 500 },
      ),
    )
  }
}
