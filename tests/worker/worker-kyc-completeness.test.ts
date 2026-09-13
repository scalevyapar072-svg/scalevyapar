import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const {
  evaluateWorkerKycCompleteness,
  getWorkerKycReviewState,
  isWorkerKycComplete,
  reconcileWorkerKycVisibility,
} = await import(
  pathToFileURL(
    path.join(workspaceRoot, 'lib', 'worker-kyc-completeness.ts'),
  ).href,
)

type WorkerKycMissingComponent =
  | 'registration'
  | 'profile_photo'
  | 'identity_proof_type'
  | 'identity_proof_number'
  | 'identity_proof_document'

type WorkerKycCompletenessInput = {
  fullName?: unknown
  city?: unknown
  categoryIds?: unknown
  profilePhotoPath?: unknown
  identityProofType?: unknown
  identityProofNumber?: unknown
  identityProofPath?: unknown
}
const adminPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'admin', 'labour', 'page.tsx'),
  'utf8',
)
const adminRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'admin', 'labour', 'route.ts'),
  'utf8',
)
const workerAppSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-worker-app.ts'),
  'utf8',
)
const completenessSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'worker-kyc-completeness.ts'),
  'utf8',
)

const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`

const loadAdminLabourRoute = async () => {
  const authStubUrl = toDataUrl('export const requireAdmin = async () => ({ email: "admin@test.invalid" })')
  const marketplaceStubUrl = toDataUrl(`
    export const createLabourEntity = async () => ({})
    export const deleteLabourEntity = async () => ({})
    export const getLabourAdminVisibleCategories = async () => []
    export const getLabourMarketplaceSnapshot = async () => ({ workers: [], jobPosts: [] })
    export const updateLabourEntity = async () => ({})
    export class LabourEntityConflictError extends Error {
      constructor(message, statusCode = 409) {
        super(message)
        this.statusCode = statusCode
      }
    }
  `)
  const guardStubUrl = toDataUrl(`
    export const shouldBlockWorkerLifecycleMutation = () => false
    export const buildWorkerLifecycleMutationBlockedResponse = () =>
      Response.json({ error: 'blocked' }, { status: 503 })
  `)
  const completenessModuleUrl = toDataUrl(
    ts.transpileModule(completenessSource, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )
  const routeSource = adminRouteSource
    .replace("'@/lib/auth'", `'${authStubUrl}'`)
    .replace("'@/lib/labour-marketplace'", `'${marketplaceStubUrl}'`)
    .replace("'@/lib/worker-lifecycle-mutation-guard'", `'${guardStubUrl}'`)
    .replace("'@/lib/worker-kyc-completeness'", `'${completenessModuleUrl}'`)

  return import(toDataUrl(ts.transpileModule(routeSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText))
}

const { handleAdminLabourPut } = await loadAdminLabourRoute()

type TestWorker = WorkerKycCompletenessInput & {
  status: string
  kycStatus: string
  isVisible: boolean
  registrationCompletedAt: string
}

const makeCompleteWorker = (overrides: Partial<TestWorker> = {}): TestWorker => ({
  fullName: 'Synthetic KYC Worker',
  city: 'Test City',
  categoryIds: ['test-category'],
  profilePhotoPath: 'workers/test-worker/profile_photo/photo.png',
  identityProofType: 'other',
  identityProofNumber: 'QA-KYC-TEST',
  identityProofPath: 'workers/test-worker/identity_proof/document.png',
  registrationCompletedAt: '',
  status: 'pending',
  kycStatus: 'pending_review',
  isVisible: false,
  ...overrides,
})

test('complete Admin-uploaded KYC is reviewable without a worker-app timestamp', () => {
  const worker = makeCompleteWorker()

  assert.equal(isWorkerKycComplete(worker), true)
  assert.equal(getWorkerKycReviewState(worker), 'ready_for_review')
  assert.equal(worker.registrationCompletedAt, '')
})

test('server approval accepts complete persisted Admin KYC and updates once', async () => {
  const worker = makeCompleteWorker()
  let updateCalls = 0
  const response = await handleAdminLabourPut(
    new Request('https://example.test/api/admin/labour', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        entityType: 'workers',
        id: 'test-worker',
        payload: { kycReviewStatusLabel: 'Verified' },
      }),
    }),
    {
      requireAdmin: async () => ({ email: 'admin@test.invalid' }),
      createLabourEntity: async () => ({}),
      deleteLabourEntity: async () => ({}),
      getLabourAdminVisibleCategories: async () => [],
      getLabourMarketplaceSnapshot: async () => ({ workers: [{ ...worker, id: 'test-worker' }], jobPosts: [] }),
      updateLabourEntity: async () => {
        updateCalls += 1
        return { workers: [{ ...worker, id: 'test-worker' }] }
      },
      mutationRuntime: { vercelEnv: 'production' },
    },
  )

  assert.equal(response.status, 200)
  assert.equal(updateCalls, 1)
})

test('every missing KYC component blocks approval eligibility', async t => {
  const cases: Array<{
    name: string
    worker: TestWorker
    expectedMissing: WorkerKycMissingComponent
  }> = [
    {
      name: 'profile photo',
      worker: makeCompleteWorker({ profilePhotoPath: '' }),
      expectedMissing: 'profile_photo',
    },
    {
      name: 'identity document',
      worker: makeCompleteWorker({ identityProofPath: '' }),
      expectedMissing: 'identity_proof_document',
    },
    {
      name: 'proof type',
      worker: makeCompleteWorker({ identityProofType: '' }),
      expectedMissing: 'identity_proof_type',
    },
    {
      name: 'invalid proof type',
      worker: makeCompleteWorker({ identityProofType: 'unsupported' }),
      expectedMissing: 'identity_proof_type',
    },
    {
      name: 'proof number',
      worker: makeCompleteWorker({ identityProofNumber: '   ' }),
      expectedMissing: 'identity_proof_number',
    },
    {
      name: 'required registration name',
      worker: makeCompleteWorker({ fullName: '' }),
      expectedMissing: 'registration',
    },
    {
      name: 'required registration city',
      worker: makeCompleteWorker({ city: '' }),
      expectedMissing: 'registration',
    },
    {
      name: 'required registration category',
      worker: makeCompleteWorker({ categoryIds: [] }),
      expectedMissing: 'registration',
    },
  ]

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      const evaluation = evaluateWorkerKycCompleteness(testCase.worker)
      assert.equal(evaluation.isComplete, false)
      assert.ok(evaluation.missingComponents.includes(testCase.expectedMissing))
      assert.equal(getWorkerKycReviewState(testCase.worker), 'not_submitted')
    })
  }
})

test('server approval blocks every incomplete persisted KYC variant without writing', async t => {
  const cases: TestWorker[] = [
    makeCompleteWorker({ profilePhotoPath: '' }),
    makeCompleteWorker({ identityProofPath: '' }),
    makeCompleteWorker({ identityProofType: '' }),
    makeCompleteWorker({ identityProofNumber: '' }),
    makeCompleteWorker({ fullName: '' }),
    makeCompleteWorker({ city: '' }),
    makeCompleteWorker({ categoryIds: [] }),
  ]

  for (const [index, worker] of cases.entries()) {
    await t.test(`incomplete variant ${index + 1}`, async () => {
      let updateCalls = 0
      const response = await handleAdminLabourPut(
        new Request('https://example.test/api/admin/labour', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            entityType: 'workers',
            id: 'test-worker',
            payload: { kycReviewStatusLabel: 'Verified' },
          }),
        }),
        {
          requireAdmin: async () => ({ email: 'admin@test.invalid' }),
          createLabourEntity: async () => ({}),
          deleteLabourEntity: async () => ({}),
          getLabourAdminVisibleCategories: async () => [],
          getLabourMarketplaceSnapshot: async () => ({ workers: [{ ...worker, id: 'test-worker' }], jobPosts: [] }),
          updateLabourEntity: async () => {
            updateCalls += 1
            return { workers: [] }
          },
          mutationRuntime: { vercelEnv: 'production' },
        },
      )

      assert.equal(response.status, 409)
      assert.equal(updateCalls, 0)
    })
  }
})

test('direct KYC status transition is guarded without blocking ordinary edits to an approved worker', async () => {
  const incompleteWorker = makeCompleteWorker({
    identityProofPath: '',
    kycStatus: 'pending_review',
  })
  let updateCalls = 0
  const dependencies = {
    requireAdmin: async () => ({ email: 'admin@test.invalid' }),
    createLabourEntity: async () => ({}),
    deleteLabourEntity: async () => ({}),
    getLabourAdminVisibleCategories: async () => [],
    getLabourMarketplaceSnapshot: async () => ({
      workers: [{ ...incompleteWorker, id: 'test-worker' }],
      jobPosts: [],
    }),
    updateLabourEntity: async () => {
      updateCalls += 1
      return { workers: [] }
    },
    mutationRuntime: { vercelEnv: 'production' },
  }

  const transitionResponse = await handleAdminLabourPut(
    new Request('https://example.test/api/admin/labour', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        entityType: 'workers',
        id: 'test-worker',
        payload: { kycStatus: 'approved' },
      }),
    }),
    dependencies,
  )
  assert.equal(transitionResponse.status, 409)
  assert.equal(updateCalls, 0)

  incompleteWorker.kycStatus = 'approved'
  const ordinaryEditResponse = await handleAdminLabourPut(
    new Request('https://example.test/api/admin/labour', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        entityType: 'workers',
        id: 'test-worker',
        payload: { fullName: 'Updated Synthetic Worker', kycStatus: 'approved' },
      }),
    }),
    dependencies,
  )
  assert.equal(ordinaryEditResponse.status, 200)
  assert.equal(updateCalls, 1)
})

test('existing worker-app KYC submission behavior remains reviewable', () => {
  const worker = makeCompleteWorker({
    registrationCompletedAt: '2026-09-13T00:00:00.000Z',
    kycStatus: '',
  })

  assert.equal(isWorkerKycComplete(worker), true)
  assert.equal(getWorkerKycReviewState(worker), 'ready_for_review')
  assert.match(workerAppSource, /registrationCompletedAt: existing\.registrationCompletedAt \|\| new Date\(\)\.toISOString\(\)/)
})

test('pending-review KYC is not automatically approved for an operationally active worker', () => {
  const worker = makeCompleteWorker({ status: 'active', kycStatus: 'pending_review' })
  assert.equal(getWorkerKycReviewState(worker), 'ready_for_review')
})

test('explicit false visibility survives approval and reconciliation', () => {
  const worker = makeCompleteWorker({ status: 'active', isVisible: false })

  assert.equal(reconcileWorkerKycVisibility(worker.isVisible, worker, 'active'), false)
  assert.match(adminPageSource, /nextVisibility = reconcileWorkerKycVisibility\(/)
})

test('inactive and otherwise ineligible workers remain hidden', () => {
  const worker = makeCompleteWorker({ isVisible: true })

  for (const status of [
    'pending',
    'blocked',
    'rejected',
    'inactive_wallet_empty',
    'inactive_subscription_expired',
    'inactive_paused_by_worker',
  ]) {
    assert.equal(reconcileWorkerKycVisibility(worker.isVisible, worker, status), false)
  }
})

test('Admin labels, Ready lists, approval and worker reconciliation use the shared evaluator', () => {
  assert.match(adminPageSource, /getWorkerKycReviewState\(worker\)/)
  assert.match(adminPageSource, /getWorkerRegistrationCompletionLabel\(selectedWorkerReview\)/)
  assert.match(adminPageSource, /!isWorkerKycComplete\(selectedWorkerReview\)/)
  assert.match(adminRouteSource, /isWorkerKycApprovalMutation\(mutationPayload, currentWorker\.kycStatus\)/)
  assert.match(adminRouteSource, /!isWorkerKycComplete\(currentWorker\)/)
  assert.match(workerAppSource, /registrationComplete: isWorkerKycComplete\(worker\)/)
  assert.match(workerAppSource, /isRegistrationComplete: isWorkerKycComplete\(worker\)/)
  assert.doesNotMatch(completenessSource, /registrationCompletedAt/)
})

test('approved KYC remains approved while incomplete data never does', () => {
  assert.equal(
    getWorkerKycReviewState(makeCompleteWorker({ status: 'active', kycStatus: 'approved' })),
    'approved',
  )
  assert.equal(
    getWorkerKycReviewState(makeCompleteWorker({
      status: 'active',
      kycStatus: 'approved',
      identityProofPath: '',
    })),
    'not_submitted',
  )
})
