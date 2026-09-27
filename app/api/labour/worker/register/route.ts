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

const SAFE_WORKER_REGISTER_ERRORS = new Set([
  'Missing worker authorization token.',
  'Invalid worker authorization token.',
  'Worker account not found.',
  'Full name is required.',
  'City is required.',
  'Select at least one category.',
  'Profile photo upload is required.',
  'Identity proof type is required.',
  'Identity proof number is required.',
  'Identity proof upload is required.',
  'Expected wage cannot be negative.',
  'Maximum expected wage cannot be less than minimum expected wage.',
  'Uploaded worker document does not belong to the authenticated worker.',
  'Uploaded worker document was not found.',
])

const getSafeWorkerRegisterErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  return SAFE_WORKER_REGISTER_ERRORS.has(message)
    ? message
    : 'Failed to complete worker registration.'
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
      { error: getSafeWorkerRegisterErrorMessage(error) },
      { status: 400 }
    )
  }
}
