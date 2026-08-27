import { requireAdmin } from '@/lib/auth'
import {
  createLabourEntity,
  deleteLabourEntity,
  getLabourAdminVisibleCategories,
  getLabourMarketplaceSnapshot,
  LabourEntityConflictError,
  LabourEntityType,
  updateLabourEntity
} from '@/lib/labour-marketplace'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime
} from '@/lib/worker-lifecycle-mutation-guard'

const isEntityType = (value: unknown): value is LabourEntityType =>
  value === 'categories' ||
  value === 'plans' ||
  value === 'workers' ||
  value === 'companies' ||
  value === 'jobPosts' ||
  value === 'jobApplications' ||
  value === 'savedJobs' ||
  value === 'workerNotifications' ||
  value === 'walletTransactions' ||
  value === 'rechargeRequests'

type AdminLabourMutationDependencies = {
  createLabourEntity: typeof createLabourEntity
  getLabourAdminVisibleCategories: typeof getLabourAdminVisibleCategories
  requireAdmin: typeof requireAdmin
  updateLabourEntity: typeof updateLabourEntity
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

const isWorkerLifecycleAdminMutation = (entityType: LabourEntityType) =>
  entityType === 'workers'

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    const snapshot = await getLabourMarketplaceSnapshot()
    const adminCategories = await getLabourAdminVisibleCategories()
    return Response.json({ ...snapshot, adminCategories })
  } catch (error) {
    console.error('Labour marketplace fetch failed:', error)
    return Response.json({ error: 'Failed to load labour marketplace data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleAdminLabourPost(request)
}

export async function handleAdminLabourPost(
  request: Request,
  dependencies: AdminLabourMutationDependencies = {
    createLabourEntity,
    getLabourAdminVisibleCategories,
    requireAdmin,
    updateLabourEntity
  }
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    const { entityType, payload } = await request.json()
    if (!isEntityType(entityType) || !payload || typeof payload !== 'object') {
      return Response.json({ error: 'entityType and payload are required' }, { status: 400 })
    }

    if (
      isWorkerLifecycleAdminMutation(entityType) &&
      shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)
    ) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const snapshot = await dependencies.createLabourEntity(
      entityType,
      payload as Record<string, unknown>,
      admin.email
    )
    const adminCategories = await dependencies.getLabourAdminVisibleCategories()
    return Response.json({ success: true, snapshot: { ...snapshot, adminCategories } })
  } catch (error) {
    console.error('Labour marketplace create failed:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create labour record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  return handleAdminLabourPut(request)
}

export async function handleAdminLabourPut(
  request: Request,
  dependencies: AdminLabourMutationDependencies = {
    createLabourEntity,
    getLabourAdminVisibleCategories,
    requireAdmin,
    updateLabourEntity
  }
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    const { entityType, id, payload } = await request.json()
    if (!isEntityType(entityType) || !id || !payload || typeof payload !== 'object') {
      return Response.json({ error: 'entityType, id and payload are required' }, { status: 400 })
    }

    if (
      isWorkerLifecycleAdminMutation(entityType) &&
      shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)
    ) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const snapshot = await dependencies.updateLabourEntity(
      entityType,
      String(id),
      payload as Record<string, unknown>,
      admin.email
    )
    if (!snapshot) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    const adminCategories = await dependencies.getLabourAdminVisibleCategories()
    return Response.json({ success: true, snapshot: { ...snapshot, adminCategories } })
  } catch (error) {
    console.error('Labour marketplace update failed:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update labour record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    const { entityType, id } = await request.json()
    if (!isEntityType(entityType) || !id) {
      return Response.json({ error: 'entityType and id are required' }, { status: 400 })
    }

    const snapshot = await deleteLabourEntity(entityType, String(id), admin.email)
    if (!snapshot) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    const adminCategories = await getLabourAdminVisibleCategories()
    return Response.json({ success: true, snapshot: { ...snapshot, adminCategories } })
  } catch (error) {
    console.error('Labour marketplace delete failed:', error)
    if (error instanceof LabourEntityConflictError) {
      return Response.json({ error: error.message }, { status: error.statusCode })
    }
    return Response.json({ error: 'Failed to delete labour record' }, { status: 500 })
  }
}
