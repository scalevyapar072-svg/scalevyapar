import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createWorkerBulkPostHandler } from '../lib/labour-worker-bulk-api'
import {
  createWorkerBulkProcessor,
  type StoredWorkerBulkOperation,
  type WorkerBulkProcessorDependencies
} from '../lib/labour-worker-bulk-core'
import {
  parseWorkerBulkRequest,
  WorkerBulkValidationError,
  type WorkerBulkRecord
} from '../lib/labour-worker-bulk-domain'

const validWorker = (id: string, overrides: Partial<WorkerBulkRecord> = {}): WorkerBulkRecord => ({
  id,
  fullName: `Worker ${id}`,
  city: 'Surat',
  status: 'pending',
  isVisible: false,
  categoryIds: ['cat-tailor'],
  profilePhotoPath: `workers/${id}/profile_photo-100.jpg`,
  identityProofType: 'aadhaar',
  identityProofNumber: 'XXXX-XXXX-1234',
  identityProofPath: `workers/${id}/identity_proof-100.pdf`,
  registrationCompletedAt: '2026-09-01T10:00:00.000Z',
  kycStatus: 'pending_review',
  kycRemarks: '',
  ...overrides
})

const requestBody = (overrides: Record<string, unknown> = {}) => ({
  mode: 'dry-run',
  workerIds: ['worker-1'],
  field: 'kyc',
  destination: 'approved',
  rejectionReason: '',
  overwriteExistingRejectionReason: false,
  idempotencyKey: 'bulk-test-0001',
  ...overrides
})

const createFakeDependencies = (initialWorkers: WorkerBulkRecord[]) => {
  const workers = new Map(initialWorkers.map(worker => [worker.id, { ...worker }]))
  const audits = new Map<string, { workerId: string; summary: string; createdAt: string }>()
  const operations = new Map<string, StoredWorkerBulkOperation>()
  const storageObjects = new Set<string>()
  initialWorkers.forEach(worker => {
    storageObjects.add(worker.profilePhotoPath)
    storageObjects.add(worker.identityProofPath)
  })
  const counters = { updates: 0, restores: 0, workerAudits: 0, storageReads: 0, storageWrites: 0 }
  const protectedDomains = {
    plans: ['plan-free'],
    wallet: [{ balance: 900 }],
    payments: [{ id: 'payment-1' }],
    referrals: [{ id: 'referral-1' }],
    jobs: [{ id: 'job-1' }],
    email: [{ id: 'email-1' }],
    whatsapp: [{ id: 'whatsapp-1' }],
    auth: [{ id: 'worker-session-1' }]
  }
  const protectedSnapshot = JSON.stringify(protectedDomains)

  const dependencies: WorkerBulkProcessorDependencies = {
    async loadWorkers(workerIds) {
      return workerIds
        .map(id => workers.get(id))
        .filter((worker): worker is WorkerBulkRecord => Boolean(worker))
        .map(worker => ({ ...worker }))
    },
    async storageObjectExists(storagePath) {
      counters.storageReads += 1
      return storageObjects.has(storagePath)
    },
    async readOperation(operationAuditId) {
      return operations.get(operationAuditId) || null
    },
    async claimOperation({ operationAuditId, fingerprint }) {
      if (operations.has(operationAuditId)) return 'exists'
      operations.set(operationAuditId, { fingerprint, state: 'started' })
      return 'claimed'
    },
    async completeOperation({ operationAuditId, fingerprint, result }) {
      operations.set(operationAuditId, { fingerprint, state: 'complete', result })
    },
    async updateWorkerField({ worker, field, destination, rejectionReason }) {
      const current = workers.get(worker.id)
      if (!current) return 'missing'

      if (field === 'status') {
        if (current.status === destination) return 'unchanged'
        if (current.status !== worker.status) return 'conflict'
        counters.updates += 1
        workers.set(worker.id, { ...current, status: destination as WorkerBulkRecord['status'] })
        return 'changed'
      }

      if (field === 'visibility') {
        const destinationValue = destination === 'visible'
        if (current.isVisible === destinationValue) return 'unchanged'
        if (current.isVisible !== worker.isVisible) return 'conflict'
        counters.updates += 1
        workers.set(worker.id, { ...current, isVisible: destinationValue })
        return 'changed'
      }

      const destinationStatus = destination === 'not_submitted' ? '' : destination
      const destinationRemarks = destination === 'rejected' ? rejectionReason : current.kycRemarks
      if (current.kycStatus === destinationStatus && current.kycRemarks === destinationRemarks) return 'unchanged'
      if (current.kycStatus !== worker.kycStatus) return 'conflict'
      if (destination === 'rejected' && current.kycRemarks !== worker.kycRemarks) return 'conflict'
      counters.updates += 1
      workers.set(worker.id, { ...current, kycStatus: destinationStatus, kycRemarks: destinationRemarks })
      return 'changed'
    },
    async restoreWorkerField({ worker, field, destination, rejectionReason }) {
      const current = workers.get(worker.id)
      if (!current) return false

      if (field === 'status') {
        if (current.status !== destination) return false
        counters.restores += 1
        workers.set(worker.id, { ...current, status: worker.status })
        return true
      }

      if (field === 'visibility') {
        if (current.isVisible !== (destination === 'visible')) return false
        counters.restores += 1
        workers.set(worker.id, { ...current, isVisible: worker.isVisible })
        return true
      }

      const destinationStatus = destination === 'not_submitted' ? '' : destination
      if (current.kycStatus !== destinationStatus) return false
      if (destination === 'rejected' && current.kycRemarks !== rejectionReason) return false
      counters.restores += 1
      workers.set(worker.id, { ...current, kycStatus: worker.kycStatus, kycRemarks: worker.kycRemarks })
      return true
    },
    async createWorkerAudit({ auditId, workerId, summary }) {
      if (audits.has(auditId)) return 'exists'
      counters.workerAudits += 1
      audits.set(auditId, { workerId, summary, createdAt: new Date().toISOString() })
      return 'created'
    }
  }

  return {
    dependencies,
    workers,
    audits,
    operations,
    storageObjects,
    counters,
    protectedDomains,
    protectedSnapshot
  }
}

const applyAfterDryRun = async (
  processor: ReturnType<typeof createWorkerBulkProcessor>,
  body: ReturnType<typeof requestBody>
) => {
  const dryRun = await processor.dryRun(body, 'admin@example.com')
  const applied = await processor.apply({
    ...body,
    mode: 'apply',
    confirmationToken: dryRun.confirmationToken,
    confirmed: true
  }, 'admin@example.com')
  return { dryRun, applied }
}

test('dedicated API rejects unauthenticated and non-Admin requests before processing', async () => {
  let calls = 0
  const run = async () => {
    calls += 1
    throw new Error('must not run')
  }
  for (const status of [401, 403]) {
    const handler = createWorkerBulkPostHandler({
      authorize: async () => Response.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
      dryRun: run,
      apply: run
    })
    const response = await handler(new Request('http://localhost/api/admin/labour/workers/bulk', {
      method: 'POST',
      body: JSON.stringify(requestBody())
    }))
    assert.equal(response.status, status)
  }
  assert.equal(calls, 0)
})

test('Preview dry run remains read-only and does not create worker or operation audits', async () => {
  const worker = validWorker('preview-dry-run')
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const handler = createWorkerBulkPostHandler({
    authorize: async () => ({ email: 'admin@example.com' }),
    dryRun: processor.dryRun,
    apply: processor.apply,
    getDeploymentIdentity: () => ({
      vercel: '1',
      vercelEnv: 'preview',
      vercelTargetEnv: 'preview'
    })
  })

  const response = await handler(new Request('http://localhost/api/admin/labour/workers/bulk', {
    method: 'POST',
    body: JSON.stringify(requestBody({ workerIds: [worker.id] }))
  }))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(payload.result.mode, 'dry-run')
  assert.equal(fake.counters.updates, 0)
  assert.equal(fake.counters.workerAudits, 0)
  assert.equal(fake.operations.size, 0)
  assert.equal(fake.counters.storageWrites, 0)
  assert.deepEqual(fake.workers.get(worker.id), worker)
})

test('Preview apply, commit, and mutation modes return 503 before Storage checks, worker writes, and audit writes', async () => {
  const worker = validWorker('preview-apply-denied')
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const dryRunBody = requestBody({
    workerIds: [worker.id],
    field: 'status',
    destination: 'active',
    idempotencyKey: 'preview-apply-denied-0001'
  })
  const dryRun = await processor.dryRun(dryRunBody, 'admin@example.com')
  const storageReadsBeforeApply = fake.counters.storageReads
  const handler = createWorkerBulkPostHandler({
    authorize: async () => ({ email: 'admin@example.com' }),
    dryRun: processor.dryRun,
    apply: processor.apply,
    getDeploymentIdentity: () => ({
      vercel: '1',
      vercelEnv: 'preview',
      vercelTargetEnv: 'preview'
    })
  })

  for (const mode of ['apply', 'commit', 'mutation']) {
    const response = await handler(new Request('http://localhost/api/admin/labour/workers/bulk', {
      method: 'POST',
      body: JSON.stringify({
        ...dryRunBody,
        mode,
        confirmationToken: dryRun.confirmationToken,
        confirmed: true
      })
    }))

    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      success: false,
      code: 'WORKER_BULK_APPLY_DISABLED_IN_PREVIEW',
      error: 'Bulk apply is disabled in Preview environments.'
    })
  }

  assert.equal(fake.counters.storageReads, storageReadsBeforeApply)
  assert.equal(fake.counters.storageWrites, 0)
  assert.equal(fake.counters.updates, 0)
  assert.equal(fake.counters.workerAudits, 0)
  assert.equal(fake.operations.size, 0)
  assert.deepEqual(fake.workers.get(worker.id), worker)
})

test('Production apply retains the existing worker update and audit behavior', async () => {
  const worker = validWorker('production-apply')
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const dryRunBody = requestBody({
    workerIds: [worker.id],
    field: 'visibility',
    destination: 'visible',
    idempotencyKey: 'production-apply-0001'
  })
  const dryRun = await processor.dryRun(dryRunBody, 'admin@example.com')
  const handler = createWorkerBulkPostHandler({
    authorize: async () => ({ email: 'admin@example.com' }),
    dryRun: processor.dryRun,
    apply: processor.apply,
    getDeploymentIdentity: () => ({
      vercel: '1',
      vercelEnv: 'production',
      vercelTargetEnv: 'production'
    })
  })

  const response = await handler(new Request('http://localhost/api/admin/labour/workers/bulk', {
    method: 'POST',
    body: JSON.stringify({
      ...dryRunBody,
      mode: 'apply',
      confirmationToken: dryRun.confirmationToken,
      confirmed: true
    })
  }))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.result.mode, 'apply')
  assert.equal(payload.result.changed, 1)
  assert.equal(fake.workers.get(worker.id)?.isVisible, true)
  assert.equal(fake.counters.updates, 1)
  assert.equal(fake.counters.workerAudits, 1)
  assert.equal(fake.operations.size, 1)
})

test('missing or ambiguous deployment identity fails closed before apply', async () => {
  const deniedIdentities = [
    {},
    { vercel: '1', vercelEnv: 'production' },
    { vercel: '1', vercelEnv: 'production', vercelTargetEnv: 'preview' },
    { vercel: '1', vercelEnv: 'preview', vercelTargetEnv: 'production' },
    { vercel: '0', vercelEnv: 'production', vercelTargetEnv: 'production' }
  ]

  for (const identity of deniedIdentities) {
    let applyCalls = 0
    const handler = createWorkerBulkPostHandler({
      authorize: async () => ({ email: 'admin@example.com' }),
      dryRun: async () => { throw new Error('dry run must not run') },
      apply: async () => {
        applyCalls += 1
        throw new Error('apply must not run')
      },
      getDeploymentIdentity: () => identity
    })
    const response = await handler(new Request('http://localhost/api/admin/labour/workers/bulk', {
      method: 'POST',
      body: JSON.stringify(requestBody({ mode: 'apply' }))
    }))

    assert.equal(response.status, 503)
    assert.equal((await response.json()).code, 'WORKER_BULK_APPLY_ENVIRONMENT_UNVERIFIED')
    assert.equal(applyCalls, 0)
  }
})

test('KYC approval skips incomplete, invalid, and missing Storage evidence and leaves approved workers unchanged', async () => {
  const eligible = validWorker('eligible')
  const incomplete = validWorker('incomplete', { city: '' })
  const invalidPath = validWorker('invalid-path', { identityProofPath: 'workers/another-worker/identity_proof-100.pdf' })
  const missingObject = validWorker('missing-object')
  const approved = validWorker('approved', { kycStatus: 'approved' })
  const fake = createFakeDependencies([eligible, incomplete, invalidPath, missingObject, approved])
  fake.storageObjects.delete(missingObject.identityProofPath)
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')

  const result = await processor.dryRun(requestBody({
    workerIds: ['eligible', 'incomplete', 'invalid-path', 'missing-object', 'approved']
  }), 'admin@example.com')

  assert.deepEqual(
    { selected: result.selected, eligible: result.eligible, unchanged: result.unchanged, skipped: result.skipped, failed: result.failed },
    { selected: 5, eligible: 1, unchanged: 1, skipped: 3, failed: 0 }
  )
  assert.ok(result.reasons.some(item => item.reason === 'Required profile fields are incomplete.'))
  assert.ok(result.reasons.some(item => item.reason === 'Required document references could not be validated.'))
  assert.equal(fake.counters.updates, 0)
  assert.equal(fake.counters.storageWrites, 0)
})

test('KYC rejection requires a reason and preserves an existing reason unless overwrite is explicitly confirmed', async () => {
  assert.throws(
    () => parseWorkerBulkRequest(requestBody({ destination: 'rejected' })),
    (error: unknown) => error instanceof WorkerBulkValidationError && /reason is required/i.test(error.message)
  )

  const worker = validWorker('worker-1', { kycStatus: 'rejected', kycRemarks: 'Existing reason' })
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const preserved = await processor.dryRun(requestBody({ destination: 'rejected', rejectionReason: 'New reason' }), 'admin@example.com')
  assert.equal(preserved.skipped, 1)
  assert.equal(preserved.eligible, 0)

  const overwrite = await processor.dryRun(requestBody({
    destination: 'rejected',
    rejectionReason: 'New reason',
    overwriteExistingRejectionReason: true
  }), 'admin@example.com')
  assert.equal(overwrite.eligible, 1)
})

test('KYC apply writes the Production KYC fields only and retries do not duplicate updates or audits', async () => {
  const worker = validWorker('worker-1', { status: 'active', isVisible: true })
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const dryRunBody = requestBody({ destination: 'rejected', rejectionReason: 'Evidence mismatch' })
  const dryRun = await processor.dryRun(dryRunBody, 'admin@example.com')
  const applyBody = {
    ...dryRunBody,
    mode: 'apply',
    confirmationToken: dryRun.confirmationToken,
    confirmed: true
  }

  const first = await processor.apply(applyBody, 'admin@example.com')
  const retry = await processor.apply(applyBody, 'admin@example.com')
  const storedWorker = fake.workers.get(worker.id)

  assert.equal(first.changed, 1)
  assert.equal(retry.replayed, true)
  assert.equal(fake.counters.updates, 1)
  assert.equal(fake.counters.workerAudits, 1)
  assert.equal(fake.operations.size, 1)
  assert.equal(storedWorker?.kycStatus, 'rejected')
  assert.equal(storedWorker?.kycRemarks, 'Evidence mismatch')
  assert.equal(storedWorker?.status, 'active')
  assert.equal(storedWorker?.isVisible, true)
  assert.equal(fake.counters.storageWrites, 0)
  assert.equal(JSON.stringify(fake.protectedDomains), fake.protectedSnapshot)
})

test('concurrent retries share one update and do not duplicate audit entries', async () => {
  const worker = validWorker('worker-1', { isVisible: false })
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const dryRunBody = requestBody({ field: 'visibility', destination: 'visible', idempotencyKey: 'bulk-concurrency-1' })
  const dryRun = await processor.dryRun(dryRunBody, 'admin@example.com')
  const applyBody = { ...dryRunBody, mode: 'apply', confirmationToken: dryRun.confirmationToken, confirmed: true }

  const [left, right] = await Promise.all([
    processor.apply(applyBody, 'admin@example.com'),
    processor.apply(applyBody, 'admin@example.com')
  ])

  assert.equal(left.changed, 1)
  assert.equal(right.changed, 1)
  assert.equal(fake.counters.updates, 1)
  assert.equal(fake.counters.workerAudits, 1)
  assert.equal(fake.operations.size, 1)
})

test('Status and Visibility preserve KYC fields, while KYC preserves Status and Visibility', async () => {
  const worker = validWorker('worker-1', {
    status: 'pending',
    isVisible: false,
    kycStatus: 'approved',
    kycRemarks: 'Historical review note'
  })
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')

  await applyAfterDryRun(processor, requestBody({ field: 'status', destination: 'active', idempotencyKey: 'bulk-status-0001' }))
  assert.equal(fake.workers.get(worker.id)?.kycStatus, 'approved')
  assert.equal(fake.workers.get(worker.id)?.kycRemarks, 'Historical review note')
  assert.equal(fake.workers.get(worker.id)?.isVisible, false)

  await applyAfterDryRun(processor, requestBody({ field: 'visibility', destination: 'visible', idempotencyKey: 'bulk-visible-001' }))
  assert.equal(fake.workers.get(worker.id)?.kycStatus, 'approved')
  assert.equal(fake.workers.get(worker.id)?.kycRemarks, 'Historical review note')
  assert.equal(fake.workers.get(worker.id)?.status, 'active')

  await applyAfterDryRun(processor, requestBody({
    destination: 'rejected',
    rejectionReason: 'Review mismatch',
    idempotencyKey: 'bulk-kyc-isolate-1'
  }))
  assert.equal(fake.workers.get(worker.id)?.status, 'active')
  assert.equal(fake.workers.get(worker.id)?.isVisible, true)
  assert.equal(fake.counters.storageWrites, 0)
  assert.equal(JSON.stringify(fake.protectedDomains), fake.protectedSnapshot)
})

test('mixed eligible, unchanged, skipped, and missing selections report accurate counts', async () => {
  const change = validWorker('change')
  const unchanged = validWorker('unchanged', { kycStatus: 'approved' })
  const skipped = validWorker('skipped', { city: '' })
  const fake = createFakeDependencies([change, unchanged, skipped])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const body = requestBody({
    workerIds: ['change', 'unchanged', 'skipped', 'missing'],
    idempotencyKey: 'bulk-mixed-0001'
  })
  const { applied } = await applyAfterDryRun(processor, body)

  assert.deepEqual(
    { selected: applied.selected, eligible: applied.eligible, changed: applied.changed, unchanged: applied.unchanged, skipped: applied.skipped, failed: applied.failed },
    { selected: 4, eligible: 1, changed: 1, unchanged: 1, skipped: 1, failed: 1 }
  )
})

test('Ready for Review remains derived, and Not Submitted clears only the stored decision', async () => {
  const ready = validWorker('ready')
  const notReady = validWorker('not-ready', { kycStatus: 'approved' })
  const incompleteRejected = validWorker('incomplete-rejected', {
    city: '',
    kycStatus: 'rejected',
    kycRemarks: 'Original rejection reason'
  })
  const fake = createFakeDependencies([ready, notReady, incompleteRejected])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')

  const derived = await processor.dryRun(requestBody({
    workerIds: ['ready', 'not-ready'],
    destination: 'ready_for_review'
  }), 'admin@example.com')
  assert.equal(derived.eligible, 0)
  assert.equal(derived.unchanged, 1)
  assert.equal(derived.skipped, 1)
  assert.equal(fake.counters.updates, 0)

  const beforePaths = {
    photo: incompleteRejected.profilePhotoPath,
    identity: incompleteRejected.identityProofPath
  }
  const { applied } = await applyAfterDryRun(processor, requestBody({
    workerIds: ['incomplete-rejected'],
    destination: 'not_submitted',
    idempotencyKey: 'bulk-not-submitted-1'
  }))
  const stored = fake.workers.get('incomplete-rejected')
  assert.equal(applied.changed, 1)
  assert.equal(stored?.kycStatus, '')
  assert.equal(stored?.kycRemarks, 'Original rejection reason')
  assert.equal(stored?.profilePhotoPath, beforePaths.photo)
  assert.equal(stored?.identityProofPath, beforePaths.identity)
  assert.equal(fake.counters.storageWrites, 0)
})

test('apply rechecks KYC evidence and Storage after the dry run', async () => {
  const worker = validWorker('worker-1')
  const fake = createFakeDependencies([worker])
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const body = requestBody({ idempotencyKey: 'bulk-recheck-0001' })
  const dryRun = await processor.dryRun(body, 'admin@example.com')
  assert.equal(dryRun.eligible, 1)

  fake.storageObjects.delete(worker.identityProofPath)
  const applied = await processor.apply({
    ...body,
    mode: 'apply',
    confirmationToken: dryRun.confirmationToken,
    confirmed: true
  }, 'admin@example.com')

  assert.equal(applied.changed, 0)
  assert.equal(applied.skipped, 1)
  assert.equal(fake.workers.get(worker.id)?.kycStatus, 'pending_review')
  assert.equal(fake.counters.updates, 0)
})

test('a failed per-worker audit compensates the KYC update instead of leaving an unaudited partial change', async () => {
  const worker = validWorker('worker-1')
  const fake = createFakeDependencies([worker])
  fake.dependencies.createWorkerAudit = async () => {
    throw new Error('simulated audit outage')
  }
  const processor = createWorkerBulkProcessor(fake.dependencies, 'test-signing-secret')
  const body = requestBody({
    destination: 'rejected',
    rejectionReason: 'Mismatch',
    idempotencyKey: 'bulk-rollback-01'
  })
  const { applied } = await applyAfterDryRun(processor, body)

  assert.equal(applied.changed, 0)
  assert.equal(applied.failed, 1)
  assert.equal(fake.workers.get(worker.id)?.kycStatus, 'pending_review')
  assert.equal(fake.workers.get(worker.id)?.kycRemarks, '')
  assert.equal(fake.counters.updates, 1)
  assert.equal(fake.counters.restores, 1)
})

test('the Production adapter cannot mutate Storage or protected business domains', () => {
  const source = readFileSync(new URL('../lib/labour-worker-bulk.ts', import.meta.url), 'utf8')
  assert.match(source, /\.storage\.from\(WORKER_UPLOAD_BUCKET\)\.exists\(storagePath\)/)
  assert.doesNotMatch(source, /\.storage\.[\s\S]*?\.(?:upload|download|remove|move|copy)\s*\(/)
  assert.doesNotMatch(source, /labour_wallet|payment|referral|job_post|whatsapp|email_outbox/i)
})
