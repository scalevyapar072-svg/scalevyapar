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
import { isWorkerKycComplete } from '@/lib/worker-kyc-completeness'

const getCompanyPlanAmountValidationError = (audience: unknown, planAmount: unknown) => {
  if (audience !== 'company') return ''
  if (typeof planAmount !== 'number' || !Number.isFinite(planAmount)) {
    return 'Company plan amount must be a valid number.'
  }
  return planAmount < 0 ? 'Plan amounts cannot be negative.' : ''
}

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
  deleteLabourEntity: typeof deleteLabourEntity
  getLabourAdminVisibleCategories: typeof getLabourAdminVisibleCategories
  requireAdmin: typeof requireAdmin
  updateLabourEntity: typeof updateLabourEntity
  getLabourMarketplaceSnapshot?: typeof getLabourMarketplaceSnapshot
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

const isWorkerLifecycleAdminMutation = (entityType: LabourEntityType) =>
  entityType === 'workers'

const hasReviewFieldMutation = (
  payload: Record<string, unknown>,
  current: {
    reviewStatus: string | null
    reviewReason: string
    submittedAt: string
    reviewedAt: string
  },
) =>
  (Object.hasOwn(payload, 'reviewStatus') && payload.reviewStatus !== current.reviewStatus) ||
  (Object.hasOwn(payload, 'reviewReason') && payload.reviewReason !== current.reviewReason) ||
  (Object.hasOwn(payload, 'submittedAt') && payload.submittedAt !== current.submittedAt) ||
  (Object.hasOwn(payload, 'reviewedAt') && payload.reviewedAt !== current.reviewedAt)

const isWorkerKycApprovalMutation = (
  payload: Record<string, unknown>,
  currentKycStatus: unknown,
) => {
  const reviewLabel = String(payload.kycReviewStatusLabel || '')
    .trim()
    .toLowerCase()
  const hasExplicitKycStatus = Object.hasOwn(payload, 'kycStatus') || Object.hasOwn(payload, 'kyc_status')
  const nextKycStatus = String(payload.kycStatus || payload.kyc_status || '')
    .trim()
    .toLowerCase()
  const previousKycStatus = String(currentKycStatus || '').trim().toLowerCase()

  return reviewLabel === 'verified' ||
    reviewLabel === 'approved' ||
    (hasExplicitKycStatus && nextKycStatus === 'approved' && previousKycStatus !== 'approved')
}

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
    deleteLabourEntity,
    getLabourAdminVisibleCategories,
    requireAdmin,
    updateLabourEntity,
    getLabourMarketplaceSnapshot,
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

    if (
      entityType === 'jobPosts' &&
      String((payload as Record<string, unknown>).status || 'draft') === 'live'
    ) {
      return Response.json(
        { error: 'Create the job as a draft, then use the controlled job review workflow.' },
        { status: 409 },
      )
    }

    if (entityType === 'plans') {
      const planPayload = payload as Record<string, unknown>
      const planAmountError = getCompanyPlanAmountValidationError(planPayload.audience, planPayload.planAmount)
      if (planAmountError) {
        return Response.json({ error: planAmountError }, { status: 400 })
      }
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
    deleteLabourEntity,
    getLabourAdminVisibleCategories,
    requireAdmin,
    updateLabourEntity,
    getLabourMarketplaceSnapshot,
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

    const mutationPayload = payload as Record<string, unknown>
    if (entityType === 'plans') {
      const currentPlan = (
        await (dependencies.getLabourMarketplaceSnapshot || getLabourMarketplaceSnapshot)()
      ).plans.find(plan => plan.id === String(id))
      if (!currentPlan) {
        return Response.json({ error: 'Record not found' }, { status: 404 })
      }
      const nextAudience = Object.hasOwn(mutationPayload, 'audience')
        ? mutationPayload.audience
        : currentPlan.audience
      const nextPlanAmount = Object.hasOwn(mutationPayload, 'planAmount')
        ? mutationPayload.planAmount
        : currentPlan.planAmount
      const planAmountError = getCompanyPlanAmountValidationError(nextAudience, nextPlanAmount)
      if (planAmountError) {
        return Response.json({ error: planAmountError }, { status: 400 })
      }
    }

    if (entityType === 'workers') {
      const currentWorker = (
        await (dependencies.getLabourMarketplaceSnapshot || getLabourMarketplaceSnapshot)()
      ).workers.find(worker => worker.id === String(id))
      if (!currentWorker) {
        return Response.json({ error: 'Record not found' }, { status: 404 })
      }
      if (
        isWorkerKycApprovalMutation(mutationPayload, currentWorker.kycStatus) &&
        !isWorkerKycComplete(currentWorker)
      ) {
        return Response.json(
          { error: 'Worker has not submitted the full KYC set yet.' },
          { status: 409 },
        )
      }
    }

    if (entityType === 'jobPosts') {
      const current = (await (dependencies.getLabourMarketplaceSnapshot || getLabourMarketplaceSnapshot)()).jobPosts.find(
        (jobPost) => jobPost.id === String(id),
      )
      if (!current) {
        return Response.json({ error: 'Record not found' }, { status: 404 })
      }
      const jobPayload = mutationPayload
      if (
        hasReviewFieldMutation(jobPayload, current) ||
        (current.reviewStatus !== 'approved' &&
          current.status !== 'live' &&
          jobPayload.status === 'live')
      ) {
        return Response.json(
          { error: 'Use the controlled job review workflow to approve or reject this job.' },
          { status: 409 },
        )
      }
    }

    const snapshot = await dependencies.updateLabourEntity(
      entityType,
      String(id),
      mutationPayload,
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
  return handleAdminLabourDelete(request)
}

export async function handleAdminLabourDelete(
  request: Request,
  dependencies: AdminLabourMutationDependencies = {
    createLabourEntity,
    deleteLabourEntity,
    getLabourAdminVisibleCategories,
    requireAdmin,
    updateLabourEntity,
    getLabourMarketplaceSnapshot,
  }
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) {
      return admin
    }

    const { entityType, id } = await request.json()
    if (!isEntityType(entityType) || !id) {
      return Response.json({ error: 'entityType and id are required' }, { status: 400 })
    }

    if (
      isWorkerLifecycleAdminMutation(entityType) &&
      shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)
    ) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const snapshot = await dependencies.deleteLabourEntity(entityType, String(id), admin.email)
    if (!snapshot) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    const adminCategories = await dependencies.getLabourAdminVisibleCategories()
    return Response.json({ success: true, snapshot: { ...snapshot, adminCategories } })
  } catch (error) {
    console.error('Labour marketplace delete failed:', error)
    if (error instanceof LabourEntityConflictError) {
      return Response.json({ error: error.message }, { status: error.statusCode })
    }
    return Response.json({ error: 'Failed to delete labour record' }, { status: 500 })
  }
}
