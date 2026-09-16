import { requireAdmin } from '@/lib/auth'
import { renewWorkerPlan } from '@/lib/labour-worker-plan-renewal'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime,
} from '@/lib/worker-lifecycle-mutation-guard'

type WorkerRenewalDependencies = {
  requireAdmin: typeof requireAdmin
  renewWorkerPlan: typeof renewWorkerPlan
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

export async function POST(request: Request) {
  return handleWorkerPlanRenewal(request)
}

export async function handleWorkerPlanRenewal(
  request: Request,
  dependencies: WorkerRenewalDependencies = {
    requireAdmin,
    renewWorkerPlan,
  },
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    if (shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const body = await request.json()
    const workerId = String(body.workerId || '').trim()
    const planId = String(body.planId || '').trim()
    if (!workerId || !planId) {
      return Response.json({ error: 'workerId and planId are required.' }, { status: 400 })
    }

    const renewal = await dependencies.renewWorkerPlan({
      workerId,
      planId,
      actor: admin.email,
    })

    return Response.json({ success: true, renewal })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to renew worker plan.' },
      { status: 409 },
    )
  }
}
