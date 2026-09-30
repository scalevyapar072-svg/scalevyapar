import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { getWorkerRegistrationAssetPrefix } from './labour-worker-registration-assets'
import {
  WORKER_BULK_BATCH_SIZE,
  addSafeReason,
  assessWorkerBulkUpdate,
  buildWorkerBulkAuditSummary,
  parseWorkerBulkRequest,
  toSafeReasons,
  WorkerBulkValidationError,
  type ParsedWorkerBulkRequest,
  type WorkerBulkField,
  type WorkerBulkRecord,
  type WorkerBulkResult
} from './labour-worker-bulk-domain'

export type StoredWorkerBulkOperation = {
  fingerprint: string
  state: 'started' | 'complete'
  result?: WorkerBulkResult
}

export type WorkerBulkFieldUpdateResult = 'changed' | 'unchanged' | 'missing' | 'conflict'

export type WorkerBulkProcessorDependencies = {
  loadWorkers: (workerIds: string[]) => Promise<WorkerBulkRecord[]>
  storageObjectExists: (storagePath: string) => Promise<boolean>
  readOperation: (operationAuditId: string) => Promise<StoredWorkerBulkOperation | null>
  claimOperation: (input: {
    operationAuditId: string
    operationEntityId: string
    fingerprint: string
    actor: string
  }) => Promise<'claimed' | 'exists'>
  completeOperation: (input: {
    operationAuditId: string
    operationEntityId: string
    fingerprint: string
    actor: string
    result: WorkerBulkResult
  }) => Promise<void>
  updateWorkerField: (input: {
    worker: WorkerBulkRecord
    field: WorkerBulkField
    destination: string
    rejectionReason: string
  }) => Promise<WorkerBulkFieldUpdateResult>
  restoreWorkerField: (input: {
    worker: WorkerBulkRecord
    field: WorkerBulkField
    destination: string
    rejectionReason: string
  }) => Promise<boolean>
  createWorkerAudit: (input: {
    auditId: string
    workerId: string
    actor: string
    summary: string
  }) => Promise<'created' | 'exists'>
}

type AssessedWorker = {
  worker: WorkerBulkRecord
  outcome: 'eligible' | 'unchanged' | 'skipped'
  reason?: string
}

const hashValue = (value: string) => createHash('sha256').update(value).digest('hex')

const buildOperationIds = (idempotencyKey: string) => {
  const operationHash = hashValue(idempotencyKey).slice(0, 32)
  return {
    operationHash,
    operationAuditId: `bulk-worker-op-${operationHash}`,
    operationEntityId: `bulk:${operationHash}`
  }
}

const buildWorkerAuditId = (operationHash: string, workerId: string) =>
  `bulk-worker-${operationHash}-${hashValue(workerId).slice(0, 20)}`

const buildFingerprint = (request: ParsedWorkerBulkRequest, actor: string) =>
  hashValue(JSON.stringify({
    actor: actor.trim().toLowerCase(),
    workerIds: [...request.workerIds].sort(),
    field: request.field,
    destination: request.destination,
    rejectionReason: request.rejectionReason,
    overwriteExistingRejectionReason: request.overwriteExistingRejectionReason
  }))

const buildConfirmationToken = (fingerprint: string, signingSecret: string) =>
  createHmac('sha256', signingSecret).update(`worker-bulk:${fingerprint}`).digest('base64url')

const tokensMatch = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

const isOwnedWorkerStoragePath = (
  workerId: string,
  storagePath: string,
  documentKind: 'profile_photo' | 'identity_proof'
) => {
  const normalizedPath = storagePath.trim()
  if (
    !normalizedPath ||
    normalizedPath.includes('..') ||
    normalizedPath.includes('\\') ||
    /^https?:\/\//i.test(normalizedPath)
  ) return false
  try {
    const expectedPrefix = getWorkerRegistrationAssetPrefix(workerId, documentKind)
    return normalizedPath.startsWith(expectedPrefix) && normalizedPath.length > expectedPrefix.length
  } catch {
    return false
  }
}

const validateStorageReferences = async (
  dependencies: WorkerBulkProcessorDependencies,
  worker: WorkerBulkRecord
) => {
  if (!isOwnedWorkerStoragePath(worker.id, worker.profilePhotoPath, 'profile_photo')) return false
  if (!isOwnedWorkerStoragePath(worker.id, worker.identityProofPath, 'identity_proof')) return false

  try {
    const [profilePhotoExists, identityProofExists] = await Promise.all([
      dependencies.storageObjectExists(worker.profilePhotoPath),
      dependencies.storageObjectExists(worker.identityProofPath)
    ])
    return profilePhotoExists && identityProofExists
  } catch {
    return false
  }
}

const assessWorkers = async (
  dependencies: WorkerBulkProcessorDependencies,
  request: ParsedWorkerBulkRequest
) => {
  const workers = await dependencies.loadWorkers(request.workerIds)
  const workersById = new Map(workers.map(worker => [worker.id, worker]))
  const assessed: AssessedWorker[] = []
  const missingWorkerIds: string[] = []

  for (const workerId of request.workerIds) {
    const worker = workersById.get(workerId)
    if (!worker) {
      missingWorkerIds.push(workerId)
      continue
    }

    const storageReferencesValid = request.field === 'kyc' && request.destination === 'approved'
      ? await validateStorageReferences(dependencies, worker)
      : undefined
    const assessment = assessWorkerBulkUpdate({
      worker,
      field: request.field,
      destination: request.destination,
      rejectionReason: request.rejectionReason,
      overwriteExistingRejectionReason: request.overwriteExistingRejectionReason,
      storageReferencesValid
    })
    assessed.push({ worker, ...assessment })
  }

  return { assessed, missingWorkerIds }
}

const buildDryRunResult = async (
  dependencies: WorkerBulkProcessorDependencies,
  request: ParsedWorkerBulkRequest,
  actor: string,
  signingSecret: string
): Promise<WorkerBulkResult> => {
  const { assessed, missingWorkerIds } = await assessWorkers(dependencies, request)
  const reasons = new Map<string, number>()
  assessed.filter(item => item.outcome === 'skipped').forEach(item => addSafeReason(reasons, item.reason || 'Worker is not eligible.'))
  if (missingWorkerIds.length > 0) {
    reasons.set('Worker record was not found.', missingWorkerIds.length)
  }
  const fingerprint = buildFingerprint(request, actor)

  return {
    mode: 'dry-run',
    selected: request.workerIds.length,
    eligible: assessed.filter(item => item.outcome === 'eligible').length,
    changed: 0,
    unchanged: assessed.filter(item => item.outcome === 'unchanged').length,
    skipped: assessed.filter(item => item.outcome === 'skipped').length,
    failed: missingWorkerIds.length,
    field: request.field,
    destination: request.destination,
    rejectionReason: request.rejectionReason || undefined,
    overwriteExistingRejectionReason: request.overwriteExistingRejectionReason,
    reasons: toSafeReasons(reasons),
    confirmationToken: buildConfirmationToken(fingerprint, signingSecret),
    idempotencyKey: request.idempotencyKey
  }
}

const createAppliedWorkerAudit = async (
  dependencies: WorkerBulkProcessorDependencies,
  request: ParsedWorkerBulkRequest,
  actor: string,
  operationHash: string,
  worker: WorkerBulkRecord
) => dependencies.createWorkerAudit({
  auditId: buildWorkerAuditId(operationHash, worker.id),
  workerId: worker.id,
  actor,
  summary: buildWorkerBulkAuditSummary({
    operationId: operationHash,
    field: request.field,
    destination: request.destination,
    outcome: 'changed',
    rejectionReason: request.field === 'kyc' ? request.rejectionReason || undefined : undefined
  })
})

const applyEligibleWorker = async (
  dependencies: WorkerBulkProcessorDependencies,
  request: ParsedWorkerBulkRequest,
  actor: string,
  operationHash: string,
  worker: WorkerBulkRecord
) => {
  const updateResult = await dependencies.updateWorkerField({
    worker,
    field: request.field,
    destination: request.destination,
    rejectionReason: request.rejectionReason
  })
  if (updateResult !== 'changed') return updateResult

  try {
    await createAppliedWorkerAudit(dependencies, request, actor, operationHash, worker)
    return 'changed' as const
  } catch {
    const restored = await dependencies.restoreWorkerField({
      worker,
      field: request.field,
      destination: request.destination,
      rejectionReason: request.rejectionReason
    }).catch(() => false)
    if (!restored) {
      throw new WorkerBulkValidationError('A worker changed concurrently and requires review.', 409)
    }
    throw new WorkerBulkValidationError('The worker was not changed because its audit entry could not be recorded.', 503)
  }
}

const buildApplyResult = async (
  dependencies: WorkerBulkProcessorDependencies,
  request: ParsedWorkerBulkRequest,
  actor: string,
  operationHash: string
): Promise<WorkerBulkResult> => {
  const { assessed, missingWorkerIds } = await assessWorkers(dependencies, request)
  const reasons = new Map<string, number>()
  let changed = 0
  let unchanged = assessed.filter(item => item.outcome === 'unchanged').length
  const skipped = assessed.filter(item => item.outcome === 'skipped').length
  let failed = missingWorkerIds.length
  assessed.filter(item => item.outcome === 'skipped').forEach(item => addSafeReason(reasons, item.reason || 'Worker is not eligible.'))
  if (missingWorkerIds.length > 0) addSafeReason(reasons, 'Worker record was not found.')

  const eligible = assessed.filter(item => item.outcome === 'eligible')
  for (let batchStart = 0; batchStart < eligible.length; batchStart += WORKER_BULK_BATCH_SIZE) {
    const batch = eligible.slice(batchStart, batchStart + WORKER_BULK_BATCH_SIZE)
    for (const item of batch) {
      try {
        const outcome = await applyEligibleWorker(dependencies, request, actor, operationHash, item.worker)
        if (outcome === 'changed') {
          changed += 1
        } else if (outcome === 'unchanged' || outcome === 'conflict') {
          unchanged += 1
          addSafeReason(reasons, 'Worker changed after the dry run; the latest value was preserved.')
        } else {
          failed += 1
          addSafeReason(reasons, 'Worker record was not found during apply.')
        }
      } catch (error) {
        failed += 1
        addSafeReason(
          reasons,
          error instanceof WorkerBulkValidationError
            ? error.message
            : 'The update could not be completed safely.'
        )
      }
    }
  }

  return {
    mode: 'apply',
    selected: request.workerIds.length,
    eligible: eligible.length,
    changed,
    unchanged,
    skipped,
    failed,
    field: request.field,
    destination: request.destination,
    rejectionReason: request.rejectionReason || undefined,
    overwriteExistingRejectionReason: request.overwriteExistingRejectionReason,
    reasons: toSafeReasons(reasons),
    idempotencyKey: request.idempotencyKey
  }
}

export const createWorkerBulkProcessor = (
  dependencies: WorkerBulkProcessorDependencies,
  signingSecret: string
) => {
  if (!signingSecret.trim()) {
    throw new Error('Worker bulk signing secret is not configured.')
  }

  const inFlight = new Map<string, Promise<WorkerBulkResult>>()

  const dryRun = async (body: unknown, actor: string) => {
    const request = parseWorkerBulkRequest(body)
    if (request.mode !== 'dry-run') {
      throw new WorkerBulkValidationError('Use dry-run mode before applying.')
    }
    return buildDryRunResult(dependencies, request, actor, signingSecret)
  }

  const apply = async (body: unknown, actor: string) => {
    const request = parseWorkerBulkRequest(body)
    if (request.mode !== 'apply') {
      throw new WorkerBulkValidationError('Use apply mode to confirm this operation.')
    }

    const fingerprint = buildFingerprint(request, actor)
    const expectedConfirmationToken = buildConfirmationToken(fingerprint, signingSecret)
    if (!tokensMatch(request.confirmationToken, expectedConfirmationToken)) {
      throw new WorkerBulkValidationError('The dry-run confirmation no longer matches this request.', 409)
    }

    const { operationHash, operationAuditId, operationEntityId } = buildOperationIds(request.idempotencyKey)
    const existingPromise = inFlight.get(operationAuditId)
    if (existingPromise) return existingPromise

    const operation = (async () => {
      const existing = await dependencies.readOperation(operationAuditId)
      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          throw new WorkerBulkValidationError('This idempotency key was already used for a different operation.', 409)
        }
        if (existing.state === 'complete' && existing.result) {
          return { ...existing.result, replayed: true }
        }
        throw new WorkerBulkValidationError('This bulk operation is already in progress.', 409)
      }

      const claim = await dependencies.claimOperation({
        operationAuditId,
        operationEntityId,
        fingerprint,
        actor
      })
      if (claim === 'exists') {
        const claimed = await dependencies.readOperation(operationAuditId)
        if (claimed?.fingerprint === fingerprint && claimed.state === 'complete' && claimed.result) {
          return { ...claimed.result, replayed: true }
        }
        throw new WorkerBulkValidationError('This bulk operation is already in progress.', 409)
      }

      const result = await buildApplyResult(dependencies, request, actor, operationHash)
      await dependencies.completeOperation({
        operationAuditId,
        operationEntityId,
        fingerprint,
        actor,
        result
      })
      return result
    })()

    inFlight.set(operationAuditId, operation)
    try {
      return await operation
    } finally {
      inFlight.delete(operationAuditId)
    }
  }

  return { dryRun, apply }
}
