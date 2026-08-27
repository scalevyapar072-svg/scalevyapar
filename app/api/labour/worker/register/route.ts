import { completeWorkerAppRegistration, requireWorkerApp } from '@/lib/labour-worker-app'
import { parseRozgarRegistrationReferralContext } from '@/lib/rozgar-referral-context'
import {
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
  type WorkerLifecycleMutationRuntime
} from '@/lib/worker-lifecycle-mutation-guard'

type WorkerRegisterDependencies = {
  completeWorkerAppRegistration: typeof completeWorkerAppRegistration
  requireWorkerApp: typeof requireWorkerApp
  mutationRuntime?: WorkerLifecycleMutationRuntime
}

export async function POST(request: Request) {
  return handleWorkerRegisterPost(request)
}

export async function handleWorkerRegisterPost(
  request: Request,
  dependencies: WorkerRegisterDependencies = {
    completeWorkerAppRegistration,
    requireWorkerApp
  }
) {
  try {
    const auth = await dependencies.requireWorkerApp(request)
    if (shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)) {
      return buildWorkerLifecycleMutationBlockedResponse()
    }

    const payload = await request.json()
    const parsedReferralContext = payload.referralContext
      ? parseRozgarRegistrationReferralContext(payload.referralContext)
      : null
    const result = await dependencies.completeWorkerAppRegistration(auth.workerId, {
      fullName: String(payload.fullName || ''),
      city: String(payload.city || ''),
      homeCity: String(payload.homeCity || ''),
      address: String(payload.address || ''),
      preferredWorkLocations: Array.isArray(payload.preferredWorkLocations)
        ? payload.preferredWorkLocations
        : [],
      salaryType: String(payload.salaryType || 'Daily Wage'),
      categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds.map((item: unknown) => String(item)) : [],
      skills: Array.isArray(payload.skills) ? payload.skills.map((item: unknown) => String(item)) : [],
      experienceYears: Number(payload.experienceYears || 0),
      expectedDailyWage: Number(payload.expectedDailyWage || 0),
      minimumExpectedWage: Number(payload.minimumExpectedWage || 0),
      maximumExpectedWage: Number(payload.maximumExpectedWage || 0),
      availability: String(payload.availability || 'available_today'),
      profilePhotoPath: String(payload.profilePhotoPath || ''),
      identityProofType: payload.identityProofType || '',
      identityProofNumber: String(payload.identityProofNumber || ''),
      identityProofPath: String(payload.identityProofPath || ''),
      resumeDocumentPath: String(payload.resumeDocumentPath || ''),
      referralContext: parsedReferralContext?.ok ? parsedReferralContext.context : undefined,
      referralContextInvalid: Boolean(parsedReferralContext && !parsedReferralContext.ok)
    })

    return Response.json({
      success: true,
      dashboard: result.dashboard,
      referral: result.referral
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to complete worker registration.' },
      { status: 400 }
    )
  }
}
