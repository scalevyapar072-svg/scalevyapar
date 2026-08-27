import { requireWorkerApp, updateWorkerWalletStatus } from '@/lib/labour-worker-app'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime
} from '@/lib/worker-lifecycle-mutation-guard'

type WorkerWalletStatusDependencies = {
  requireWorkerApp: typeof requireWorkerApp
  updateWorkerWalletStatus: typeof updateWorkerWalletStatus
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

export async function POST(request: Request) {
  return handleWorkerWalletStatusPost(request)
}

export async function handleWorkerWalletStatusPost(
  request: Request,
  dependencies: WorkerWalletStatusDependencies = {
    requireWorkerApp,
    updateWorkerWalletStatus
  }
) {
  try {
    const auth = await dependencies.requireWorkerApp(request)
    if (shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const body = await request.json().catch(() => ({}))
    if (typeof body.active !== 'boolean') {
      return Response.json({ error: 'Active flag is required.' }, { status: 400 })
    }

    const dashboard = await dependencies.updateWorkerWalletStatus(auth.workerId, body.active)
    return Response.json({ success: true, dashboard })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update worker wallet status.' },
      { status: 400 }
    )
  }
}
