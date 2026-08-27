import { requireWorkerApp, updateWorkerAppProfile } from '@/lib/labour-worker-app'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime
} from '@/lib/worker-lifecycle-mutation-guard'

type WorkerProfileDependencies = {
  requireWorkerApp: typeof requireWorkerApp
  updateWorkerAppProfile: typeof updateWorkerAppProfile
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

export async function PUT(request: Request) {
  return handleWorkerProfilePut(request)
}

export async function handleWorkerProfilePut(
  request: Request,
  dependencies: WorkerProfileDependencies = {
    requireWorkerApp,
    updateWorkerAppProfile
  }
) {
  try {
    const auth = await dependencies.requireWorkerApp(request)
    if (shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const payload = await request.json()
    const dashboard = await dependencies.updateWorkerAppProfile(auth.workerId, payload)
    return Response.json({ success: true, dashboard })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to update worker profile.' }, { status: 400 })
  }
}
