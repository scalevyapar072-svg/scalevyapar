import { WorkerBulkValidationError, type WorkerBulkResult } from './labour-worker-bulk-domain'

type WorkerBulkApiDependencies = {
  authorize: (request: Request) => Promise<{ email: string } | Response>
  dryRun: (body: unknown, actor: string) => Promise<WorkerBulkResult>
  apply: (body: unknown, actor: string) => Promise<WorkerBulkResult>
  getDeploymentIdentity?: () => WorkerBulkDeploymentIdentity
}

export type WorkerBulkDeploymentIdentity = {
  vercel?: string
  vercelEnv?: string
  vercelTargetEnv?: string
}

type WorkerBulkMutationEnvironment = 'production' | 'preview' | 'unverified'

const readDeploymentIdentity = (): WorkerBulkDeploymentIdentity => ({
  vercel: process.env.VERCEL,
  vercelEnv: process.env.VERCEL_ENV,
  vercelTargetEnv: process.env.VERCEL_TARGET_ENV
})

const classifyMutationEnvironment = ({
  vercel,
  vercelEnv,
  vercelTargetEnv
}: WorkerBulkDeploymentIdentity): WorkerBulkMutationEnvironment => {
  const isVercel = String(vercel || '').trim() === '1'
  const environment = String(vercelEnv || '').trim()
  const targetEnvironment = String(vercelTargetEnv || '').trim()

  if (!isVercel || !environment || !targetEnvironment) return 'unverified'
  if (environment === 'production' && targetEnvironment === 'production') return 'production'
  if (environment === 'preview' && targetEnvironment !== 'production') return 'preview'
  return 'unverified'
}

const buildMutationDeniedResponse = (environment: Exclude<WorkerBulkMutationEnvironment, 'production'>) =>
  environment === 'preview'
    ? Response.json({
        success: false,
        code: 'WORKER_BULK_APPLY_DISABLED_IN_PREVIEW',
        error: 'Bulk apply is disabled in Preview environments.'
      }, { status: 503 })
    : Response.json({
        success: false,
        code: 'WORKER_BULK_APPLY_ENVIRONMENT_UNVERIFIED',
        error: 'Bulk apply is disabled because the deployment environment could not be verified as Production.'
      }, { status: 503 })

export const createWorkerBulkPostHandler = (dependencies: WorkerBulkApiDependencies) =>
  async (request: Request) => {
    const authorization = await dependencies.authorize(request)
    if (authorization instanceof Response) return authorization

    try {
      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return Response.json({ error: 'A valid bulk update request is required.' }, { status: 400 })
      }

      const mode = String((body as Record<string, unknown>).mode || '')
      if (mode !== 'dry-run') {
        const environment = classifyMutationEnvironment(
          dependencies.getDeploymentIdentity?.() || readDeploymentIdentity()
        )
        if (environment !== 'production') return buildMutationDeniedResponse(environment)
      }

      const result = mode === 'dry-run'
        ? await dependencies.dryRun(body, authorization.email)
        : await dependencies.apply(body, authorization.email)
      return Response.json({ success: true, result })
    } catch (error) {
      if (error instanceof WorkerBulkValidationError) {
        return Response.json({ error: error.message }, { status: error.statusCode })
      }
      console.error('Admin worker bulk update failed:', error)
      return Response.json({ error: 'The bulk operation could not be completed safely.' }, { status: 500 })
    }
  }
