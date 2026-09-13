const VALID_WORKER_IDENTITY_PROOF_TYPES = new Set([
  'aadhaar',
  'pan',
  'voter_id',
  'driving_license',
  'other',
])

export type NormalizedWorkerIdentityProofType =
  | ''
  | 'aadhaar'
  | 'pan'
  | 'voter_id'
  | 'driving_license'
  | 'other'

export type WorkerKycMissingComponent =
  | 'registration'
  | 'profile_photo'
  | 'identity_proof_type'
  | 'identity_proof_number'
  | 'identity_proof_document'

export type WorkerKycCompletenessInput = {
  fullName?: unknown
  city?: unknown
  categoryIds?: unknown
  profilePhotoPath?: unknown
  identityProofType?: unknown
  identityProofNumber?: unknown
  identityProofPath?: unknown
}

export type WorkerKycStateInput = WorkerKycCompletenessInput & {
  status?: unknown
  kycStatus?: unknown
}

export type WorkerKycReviewState =
  | 'not_submitted'
  | 'ready_for_review'
  | 'needs_correction'
  | 'approved'
  | 'rejected'

export type WorkerKycCompleteness = {
  isComplete: boolean
  missingComponents: WorkerKycMissingComponent[]
}

const hasText = (value: unknown) => Boolean(String(value || '').trim())

const normalizeStatus = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

export const normalizeWorkerIdentityProofType = (
  value: unknown,
): NormalizedWorkerIdentityProofType => {
  const normalized = normalizeStatus(value)
  return VALID_WORKER_IDENTITY_PROOF_TYPES.has(normalized)
    ? normalized as NormalizedWorkerIdentityProofType
    : ''
}

export const evaluateWorkerKycCompleteness = (
  worker: WorkerKycCompletenessInput,
): WorkerKycCompleteness => {
  const missingComponents: WorkerKycMissingComponent[] = []
  const hasRequiredRegistration =
    hasText(worker.fullName) &&
    hasText(worker.city) &&
    Array.isArray(worker.categoryIds) &&
    worker.categoryIds.some(categoryId => hasText(categoryId))

  if (!hasRequiredRegistration) missingComponents.push('registration')
  if (!hasText(worker.profilePhotoPath)) missingComponents.push('profile_photo')
  if (!normalizeWorkerIdentityProofType(worker.identityProofType)) missingComponents.push('identity_proof_type')
  if (!hasText(worker.identityProofNumber)) missingComponents.push('identity_proof_number')
  if (!hasText(worker.identityProofPath)) missingComponents.push('identity_proof_document')

  return {
    isComplete: missingComponents.length === 0,
    missingComponents,
  }
}

export const isWorkerKycComplete = (worker: WorkerKycCompletenessInput) =>
  evaluateWorkerKycCompleteness(worker).isComplete

export const getWorkerKycReviewState = (
  worker: WorkerKycStateInput,
): WorkerKycReviewState => {
  const workerStatus = normalizeStatus(worker.status)
  const kycStatus = normalizeStatus(worker.kycStatus)

  if (workerStatus === 'rejected' || kycStatus === 'rejected') return 'rejected'
  if (
    workerStatus === 'blocked' ||
    kycStatus === 'needs_correction' ||
    kycStatus === 'need_correction'
  ) {
    return 'needs_correction'
  }
  if (!isWorkerKycComplete(worker)) return 'not_submitted'
  if (kycStatus === 'pending' || kycStatus === 'pending_review') return 'ready_for_review'
  if (kycStatus === 'approved' || kycStatus === 'verified') return 'approved'

  return workerStatus === 'pending' ? 'ready_for_review' : 'approved'
}

export const reconcileWorkerKycVisibility = (
  savedVisibility: boolean,
  worker: WorkerKycCompletenessInput,
  status: unknown,
) => savedVisibility && isWorkerKycComplete(worker) && normalizeStatus(status) === 'active'
