import {
  evaluateWorkerKycCompleteness,
  getWorkerKycReviewState,
  type WorkerKycReviewState
} from './worker-kyc-completeness'

export const WORKER_BULK_MAX_SELECTION = 1000
export const WORKER_BULK_BATCH_SIZE = 20

export const WORKER_BULK_STATUSES = [
  'pending',
  'active',
  'inactive_wallet_empty',
  'inactive_subscription_expired',
  'inactive_paused_by_worker',
  'blocked',
  'rejected'
] as const

export const WORKER_BULK_KYC_DESTINATIONS = [
  'not_submitted',
  'ready_for_review',
  'approved',
  'rejected'
] as const

export type WorkerBulkStatus = (typeof WORKER_BULK_STATUSES)[number]
export type WorkerBulkField = 'status' | 'visibility' | 'kyc'
export type WorkerBulkKycDestination = (typeof WORKER_BULK_KYC_DESTINATIONS)[number]
export type WorkerBulkVisibilityDestination = 'visible' | 'hidden'
export type WorkerBulkDestination = WorkerBulkStatus | WorkerBulkVisibilityDestination | WorkerBulkKycDestination
export type WorkerBulkMode = 'dry-run' | 'apply'
export type WorkerBulkKycState = WorkerKycReviewState

export type WorkerBulkRecord = {
  id: string
  fullName: string
  city: string
  status: WorkerBulkStatus
  isVisible: boolean
  categoryIds: string[]
  profilePhotoPath: string
  identityProofType: string
  identityProofNumber: string
  identityProofPath: string
  registrationCompletedAt: string
  kycStatus: string
  kycRemarks: string
}

export type WorkerBulkSafeReason = {
  reason: string
  count: number
}

export type WorkerBulkResult = {
  mode: WorkerBulkMode
  selected: number
  eligible: number
  changed: number
  unchanged: number
  skipped: number
  failed: number
  field: WorkerBulkField
  destination: WorkerBulkDestination
  rejectionReason?: string
  overwriteExistingRejectionReason: boolean
  reasons: WorkerBulkSafeReason[]
  confirmationToken?: string
  idempotencyKey?: string
  replayed?: boolean
}

export type ParsedWorkerBulkRequest = {
  mode: WorkerBulkMode
  workerIds: string[]
  field: WorkerBulkField
  destination: WorkerBulkDestination
  rejectionReason: string
  overwriteExistingRejectionReason: boolean
  idempotencyKey: string
  confirmationToken: string
  confirmed: boolean
}

export type WorkerBulkAssessment = {
  outcome: 'eligible' | 'unchanged' | 'skipped'
  reason?: string
}

export class WorkerBulkValidationError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'WorkerBulkValidationError'
    this.statusCode = statusCode
  }
}

const toBase64Url = (value: string) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64url')
  }

  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const normalizeText = (value: unknown) => String(value || '').trim()

const isWorkerBulkStatus = (value: string): value is WorkerBulkStatus =>
  WORKER_BULK_STATUSES.includes(value as WorkerBulkStatus)

const isWorkerBulkKycDestination = (value: string): value is WorkerBulkKycDestination =>
  WORKER_BULK_KYC_DESTINATIONS.includes(value as WorkerBulkKycDestination)

export const parseWorkerBulkRequest = (value: unknown): ParsedWorkerBulkRequest => {
  if (!value || typeof value !== 'object') {
    throw new WorkerBulkValidationError('A bulk update request is required.')
  }

  const body = value as Record<string, unknown>
  const mode = normalizeText(body.mode)
  if (mode !== 'dry-run' && mode !== 'apply') {
    throw new WorkerBulkValidationError('Bulk mode must be dry-run or apply.')
  }

  const field = normalizeText(body.field)
  if (field !== 'status' && field !== 'visibility' && field !== 'kyc') {
    throw new WorkerBulkValidationError('Choose exactly one supported bulk field.')
  }

  const destination = normalizeText(body.destination)
  const validDestination =
    (field === 'status' && isWorkerBulkStatus(destination)) ||
    (field === 'visibility' && (destination === 'visible' || destination === 'hidden')) ||
    (field === 'kyc' && isWorkerBulkKycDestination(destination))

  if (!validDestination) {
    throw new WorkerBulkValidationError('Choose a valid destination for the selected field.')
  }

  if (!Array.isArray(body.workerIds)) {
    throw new WorkerBulkValidationError('Select at least one worker.')
  }

  const workerIds = Array.from(new Set(body.workerIds.map(normalizeText).filter(Boolean)))
  if (workerIds.length === 0) {
    throw new WorkerBulkValidationError('Select at least one worker.')
  }
  if (workerIds.length > WORKER_BULK_MAX_SELECTION) {
    throw new WorkerBulkValidationError(`Select no more than ${WORKER_BULK_MAX_SELECTION} workers per operation.`)
  }

  const rejectionReason = normalizeText(body.rejectionReason)
  if (field === 'kyc' && destination === 'rejected' && !rejectionReason) {
    throw new WorkerBulkValidationError('A rejection reason is required for bulk KYC rejection.')
  }
  if (rejectionReason.length > 500) {
    throw new WorkerBulkValidationError('The rejection reason must be 500 characters or fewer.')
  }

  const idempotencyKey = normalizeText(body.idempotencyKey)
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(idempotencyKey)) {
    throw new WorkerBulkValidationError('A valid idempotency key is required.')
  }

  const confirmationToken = normalizeText(body.confirmationToken)
  const confirmed = body.confirmed === true
  if (mode === 'apply' && (!confirmationToken || !confirmed)) {
    throw new WorkerBulkValidationError('Run the dry run and explicitly confirm it before applying.')
  }

  return {
    mode,
    workerIds,
    field,
    destination: destination as WorkerBulkDestination,
    rejectionReason,
    overwriteExistingRejectionReason: body.overwriteExistingRejectionReason === true,
    idempotencyKey,
    confirmationToken,
    confirmed
  }
}

export const getWorkerKycEvidenceIssues = (worker: WorkerBulkRecord) => {
  const missing = new Set(evaluateWorkerKycCompleteness(worker).missingComponents)
  const issues: string[] = []
  if (missing.has('registration')) issues.push('Required profile fields are incomplete.')
  if (missing.has('profile_photo') || missing.has('identity_proof_document')) {
    issues.push('Required document references are missing.')
  }
  if (missing.has('identity_proof_type') || missing.has('identity_proof_number')) {
    issues.push('Identity-proof metadata is incomplete.')
  }
  return issues
}

export const isWorkerKycEvidenceComplete = (worker: WorkerBulkRecord) =>
  getWorkerKycEvidenceIssues(worker).length === 0

type StructuredWorkerAuditData = {
  operationId: string
  field: WorkerBulkField
  destination: WorkerBulkDestination
  outcome: 'changed'
  rejectionReason?: string
}

export const buildWorkerBulkAuditSummary = (data: StructuredWorkerAuditData) => {
  const encoded = toBase64Url(JSON.stringify(data))
  const fieldLabel = data.field === 'kyc' ? 'KYC' : data.field === 'status' ? 'Worker Status' : 'Visibility'
  const destinationLabel = data.destination.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
  const reason = data.field === 'kyc' && data.destination === 'rejected' && data.rejectionReason
    ? ` - ${data.rejectionReason}`
    : ''
  return `[bulk-worker-update:v1] ${fieldLabel}: ${destinationLabel}${reason} [bulk-worker-data:v1:${encoded}]`
}

export const getWorkerBulkKycState = (worker: WorkerBulkRecord): WorkerBulkKycState =>
  getWorkerKycReviewState(worker)

export const assessWorkerBulkUpdate = (input: {
  worker: WorkerBulkRecord
  field: WorkerBulkField
  destination: WorkerBulkDestination
  rejectionReason: string
  overwriteExistingRejectionReason: boolean
  storageReferencesValid?: boolean
}): WorkerBulkAssessment => {
  const { worker, field, destination } = input

  if (field === 'status') {
    return worker.status === destination ? { outcome: 'unchanged' } : { outcome: 'eligible' }
  }

  if (field === 'visibility') {
    const destinationVisibility = destination === 'visible'
    return worker.isVisible === destinationVisibility ? { outcome: 'unchanged' } : { outcome: 'eligible' }
  }

  const currentState = getWorkerBulkKycState(worker)
  if (destination === 'approved') {
    if (normalizeText(worker.kycStatus).toLowerCase() === 'approved') {
      return { outcome: 'unchanged' }
    }
    const firstEvidenceIssue = getWorkerKycEvidenceIssues(worker)[0]
    if (firstEvidenceIssue) return { outcome: 'skipped', reason: firstEvidenceIssue }
    if (input.storageReferencesValid !== true) {
      return { outcome: 'skipped', reason: 'Required document references could not be validated.' }
    }
    return { outcome: 'eligible' }
  }

  if (destination === 'rejected') {
    if (normalizeText(worker.kycStatus).toLowerCase() !== 'rejected') {
      return { outcome: 'eligible' }
    }
    const existingReason = normalizeText(worker.kycRemarks)
    if (existingReason === input.rejectionReason) return { outcome: 'unchanged' }
    if (existingReason && !input.overwriteExistingRejectionReason) {
      return { outcome: 'skipped', reason: 'An existing rejection reason was preserved.' }
    }
    return { outcome: 'eligible' }
  }

  if (destination === 'not_submitted') {
    if (currentState === 'not_submitted' && !normalizeText(worker.kycStatus)) {
      return { outcome: 'unchanged' }
    }
    const stateAfterClearingDecision = getWorkerKycReviewState({ ...worker, kycStatus: '' })
    return stateAfterClearingDecision === 'not_submitted'
      ? { outcome: 'eligible' }
      : { outcome: 'skipped', reason: 'Not Submitted is derived from incomplete required evidence and cannot be forced.' }
  }

  return currentState === 'ready_for_review'
    ? { outcome: 'unchanged' }
    : { outcome: 'skipped', reason: 'Ready for Review is derived from complete evidence awaiting a decision and cannot be set directly.' }
}

export const addSafeReason = (reasons: Map<string, number>, reason: string) => {
  const safeReason = normalizeText(reason) || 'Validation failed.'
  reasons.set(safeReason, (reasons.get(safeReason) || 0) + 1)
}

export const toSafeReasons = (reasons: Map<string, number>): WorkerBulkSafeReason[] =>
  Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count }))
