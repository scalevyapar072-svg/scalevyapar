import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const readSource = (...segments: string[]) =>
  readFileSync(path.join(workspaceRoot, ...segments), 'utf8')
const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const transpileToDataUrl = (source: string) => toDataUrl(ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText)

const mobileModulePath = path.join(workspaceRoot, 'lib', 'labour-worker-mobile.ts')
const mobileModule = await import(pathToFileURL(mobileModulePath).href)
const adminRouteSource = readSource('app', 'api', 'admin', 'labour', 'route.ts')
const lookupRouteSource = readSource('app', 'api', 'admin', 'labour', 'worker-lookup', 'route.ts')
const marketplaceSource = readSource('lib', 'labour-marketplace.ts')
const adminPageSource = readSource('app', 'admin', 'labour', 'page.tsx')

const workerFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'worker-existing',
  mobile: '6000000000',
  status: 'pending',
  isVisible: true,
  kycStatus: '',
  registrationCompletedAt: '',
  ...overrides,
})

const marketplaceStubUrl = toDataUrl(`
  export class LabourEntityConflictError extends Error {}
  export const createLabourEntity = () => { throw new Error('not stubbed') }
  export const createLabourWorkerId = () => 'worker-created'
  export const deleteLabourEntity = () => { throw new Error('not stubbed') }
  export const getLabourAdminVisibleCategories = async () => []
  export const getLabourMarketplaceSnapshot = async () => ({ workers: [], plans: [] })
  export const updateLabourEntity = () => { throw new Error('not stubbed') }
  export const moveLabourPlan = () => { throw new Error('not stubbed') }
  export const findLabourWorkerById = () => null
  export const findLabourWorkerByMobile = () => null
`)
const authStubUrl = toDataUrl(`export const requireAdmin = async () => ({ email: 'admin@example.test' })`)
const guardStubUrl = toDataUrl(`
  export const shouldBlockWorkerLifecycleMutation = runtime =>
    runtime?.allowNonProductionForTests ? false : runtime?.vercelEnv !== 'production'
  export const buildWorkerLifecycleMutationBlockedResponse = () =>
    Response.json({ error: 'Worker lifecycle mutations are disabled in Preview.' }, { status: 503 })
`)
const kycStubUrl = toDataUrl(`export const isWorkerKycComplete = () => true`)
const mobileStubUrl = transpileToDataUrl(readFileSync(mobileModulePath, 'utf8'))

const transformedAdminRoute = adminRouteSource
  .replace("'@/lib/auth'", `'${authStubUrl}'`)
  .replace("'@/lib/labour-marketplace'", `'${marketplaceStubUrl}'`)
  .replace("'@/lib/worker-lifecycle-mutation-guard'", `'${guardStubUrl}'`)
  .replace("'@/lib/worker-kyc-completeness'", `'${kycStubUrl}'`)
  .replaceAll("import('@/lib/labour-marketplace')", `import('${marketplaceStubUrl}')`)
  .replaceAll("import('@/lib/labour-worker-mobile')", `import('${mobileStubUrl}')`)
const adminRoute = await import(transpileToDataUrl(transformedAdminRoute))

const lookupMockKey = '__adminWorkerLookupMocks'
const lookupAuthStubUrl = toDataUrl(`
  export const requireAdmin = (...args) =>
    globalThis.${lookupMockKey}.requireAdmin(...args)
`)
const lookupMarketplaceStubUrl = toDataUrl(`
  export const findLabourWorkerById = (...args) =>
    globalThis.${lookupMockKey}.findLabourWorkerById(...args)
  export const findLabourWorkerByMobile = (...args) =>
    globalThis.${lookupMockKey}.findLabourWorkerByMobile(...args)
`)
const transformedLookupRoute = lookupRouteSource
  .replace("'@/lib/auth'", `'${lookupAuthStubUrl}'`)
  .replace("'@/lib/labour-marketplace'", `'${lookupMarketplaceStubUrl}'`)
  .replace("'@/lib/labour-worker-mobile'", `'${mobileStubUrl}'`)
const lookupRoute = await import(transpileToDataUrl(transformedLookupRoute))

const makeRequest = (mobile: string) => new Request('https://example.test/api/admin/labour', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    entityType: 'workers',
    payload: { fullName: 'Synthetic Worker', mobile },
  }),
})

const makeDependencies = (overrides: Record<string, unknown> = {}) => ({
  createLabourEntity: async () => ({ workers: [] }),
  createLabourWorkerId: () => 'worker-created',
  deleteLabourEntity: async () => ({ workers: [] }),
  getLabourAdminVisibleCategories: async () => [],
  requireAdmin: async () => ({ email: 'admin@example.test' }),
  updateLabourEntity: async () => ({ workers: [] }),
  mutationRuntime: { vercelEnv: 'production' },
  findLabourWorkerByMobile: async () => null,
  findLabourWorkerById: async () => workerFixture({ id: 'worker-created' }),
  ...overrides,
})

test('all supported Indian mobile formats resolve to one canonical worker', () => {
  const formats = [
    '6000000000',
    '+916000000000',
    '916000000000',
    '60000-00000',
    ' 60000 00000 ',
  ]

  for (const value of formats) {
    assert.equal(mobileModule.normalizeIndianWorkerMobile(value), '6000000000')
  }

  const workers = [workerFixture({ mobile: '+91 60000-00000' })]
  for (const value of formats) {
    assert.equal(mobileModule.findWorkerByIndianMobile(workers, value)?.id, 'worker-existing')
  }
})

test('status and visibility never exclude an exact normalized lookup', () => {
  const workers = [
    workerFixture({ id: 'active', mobile: '+916000000001', status: 'active' }),
    workerFixture({ id: 'inactive', mobile: '91 60000-00002', status: 'inactive_paused_by_worker' }),
    workerFixture({ id: 'rejected', mobile: '60000-00003', status: 'rejected' }),
    workerFixture({ id: 'blocked', mobile: '6000000004', status: 'blocked' }),
    workerFixture({ id: 'pending-hidden', mobile: '6000000005', status: 'pending', isVisible: false }),
    workerFixture({ id: 'archived', mobile: '6000000006', status: 'archived', isVisible: false }),
  ]

  for (const worker of workers) {
    const match = mobileModule.findWorkerByIndianMobile(workers, worker.mobile)
    assert.equal(match?.id, worker.id)
    assert.equal(match?.status, worker.status)
    assert.equal(match?.isVisible, worker.isVisible)
  }
})

test('Admin search uses an authenticated direct lookup outside the capped snapshot', () => {
  assert.match(marketplaceSource, /export const findLabourWorkerByMobile/)
  assert.match(marketplaceSource, /\.in\('mobile', getIndianWorkerMobileLookupVariants\(canonicalMobile\)\)/)
  assert.match(marketplaceSource, /\.ilike\('mobile', separatorTolerantPattern\)/)
  assert.match(adminPageSource, /fetch\('\/api\/admin\/labour\/worker-lookup'/)
  assert.match(adminPageSource, /normalizedWorkerSearch && workerMobilesMatch\(worker\.mobile, normalizedWorkerSearch\)\) return true/)
  assert.match(adminPageSource, /Stored Status:/)
  assert.match(lookupRouteSource, /const admin = await requireAdmin\(request\)/)
  assert.ok(
    lookupRouteSource.indexOf('const admin = await requireAdmin(request)') <
      lookupRouteSource.indexOf('const body = await request.json()'),
  )
})

test('worker lookup rejects unauthenticated requests before reading worker data', async () => {
  let lookupCalls = 0
  ;(globalThis as Record<string, unknown>)[lookupMockKey] = {
    requireAdmin: async () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
    findLabourWorkerById: async () => {
      lookupCalls += 1
      return null
    },
    findLabourWorkerByMobile: async () => {
      lookupCalls += 1
      return null
    },
  }

  const response = await lookupRoute.POST(new Request(
    'https://example.test/api/admin/labour/worker-lookup',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mobile: '+91 60000-00000' }),
    },
  ))

  assert.equal(response.status, 401)
  assert.equal(lookupCalls, 0)
})

test('authorized worker lookup canonicalizes the submitted mobile before direct lookup', async () => {
  let lookedUpMobile = ''
  ;(globalThis as Record<string, unknown>)[lookupMockKey] = {
    requireAdmin: async () => ({ email: 'admin@example.test' }),
    findLabourWorkerById: async () => null,
    findLabourWorkerByMobile: async (mobile: string) => {
      lookedUpMobile = mobile
      return workerFixture({ status: 'inactive_subscription_expired', isVisible: false })
    },
  }

  const response = await lookupRoute.POST(new Request(
    'https://example.test/api/admin/labour/worker-lookup',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mobile: '+91 60000-00000' }),
    },
  ))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(lookedUpMobile, '6000000000')
  assert.equal(body.worker.status, 'inactive_subscription_expired')
  assert.equal(body.worker.isVisible, false)
})

test('duplicate pre-check returns a safe structured 409 before creation', async () => {
  let createCalls = 0
  const response = await adminRoute.handleAdminLabourPost(
    makeRequest('+91 60000-00000'),
    makeDependencies({
      findLabourWorkerByMobile: async () => workerFixture({
        status: 'rejected',
        isVisible: false,
        kycStatus: 'rejected',
      }),
      createLabourEntity: async () => {
        createCalls += 1
        return { workers: [] }
      },
    }),
  )
  const body = await response.json()

  assert.equal(response.status, 409)
  assert.equal(createCalls, 0)
  assert.equal(body.code, mobileModule.DUPLICATE_WORKER_MOBILE_CODE)
  assert.equal(body.error, mobileModule.DUPLICATE_WORKER_MOBILE_MESSAGE)
  assert.deepEqual(body.existingWorker, {
    id: 'worker-existing',
    status: 'rejected',
    isVisible: false,
    kycStatus: 'rejected',
    registrationCompleted: false,
  })
  assert.doesNotMatch(JSON.stringify(body), /duplicate key|constraint|labour_workers_mobile_key/i)
  assert.deepEqual(Object.keys(body.existingWorker).sort(), [
    'id',
    'isVisible',
    'kycStatus',
    'registrationCompleted',
    'status',
  ])
})

test('database unique-race fallback maps to the same safe conflict', async () => {
  let lookupCalls = 0
  const response = await adminRoute.handleAdminLabourPost(
    makeRequest('6000000000'),
    makeDependencies({
      findLabourWorkerByMobile: async () => {
        lookupCalls += 1
        return lookupCalls === 1 ? null : workerFixture({ status: 'blocked' })
      },
      createLabourEntity: async () => {
        throw new Error(
          'Failed to create labour worker: duplicate key value violates unique constraint "labour_workers_mobile_key"',
        )
      },
    }),
  )
  const body = await response.json()

  assert.equal(response.status, 409)
  assert.equal(lookupCalls, 2)
  assert.equal(body.error, mobileModule.DUPLICATE_WORKER_MOBILE_MESSAGE)
  assert.equal(body.existingWorker.status, 'blocked')
  assert.doesNotMatch(JSON.stringify(body), /duplicate key|constraint|labour_workers_mobile_key/i)
})

test('concurrent duplicate submissions yield one creation and one safe conflict', async () => {
  let prechecks = 0
  let releasePrechecks: () => void = () => {}
  const bothPrechecked = new Promise<void>(resolve => {
    releasePrechecks = resolve
  })
  let inserted = false
  let createCalls = 0
  const dependencies = makeDependencies({
    findLabourWorkerByMobile: async () => {
      prechecks += 1
      if (prechecks <= 2) {
        if (prechecks === 2) releasePrechecks()
        await bothPrechecked
        return null
      }
      return workerFixture({ status: 'active' })
    },
    createLabourEntity: async () => {
      createCalls += 1
      if (inserted) {
        throw new Error('duplicate key value violates unique constraint "labour_workers_mobile_key"')
      }
      inserted = true
      return { workers: [workerFixture({ status: 'active' })] }
    },
  })

  const responses = await Promise.all([
    adminRoute.handleAdminLabourPost(makeRequest('6000000000'), dependencies),
    adminRoute.handleAdminLabourPost(makeRequest('+916000000000'), dependencies),
  ])
  const bodies = await Promise.all(responses.map(response => response.json()))

  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409])
  assert.equal(createCalls, 2)
  assert.equal(
    bodies.find(body => body.code === mobileModule.DUPLICATE_WORKER_MOBILE_CODE)?.error,
    mobileModule.DUPLICATE_WORKER_MOBILE_MESSAGE,
  )
  assert.doesNotMatch(JSON.stringify(bodies), /duplicate key|constraint|labour_workers_mobile_key/i)
})

test('valid new worker creation keeps the existing response and canonicalizes only mobile', async () => {
  let submittedPayload: Record<string, unknown> | null = null
  const snapshot = { workers: [workerFixture()] }
  const response = await adminRoute.handleAdminLabourPost(
    makeRequest('91-60000-00000'),
    makeDependencies({
      createLabourEntity: async (_entityType: string, payload: Record<string, unknown>) => {
        submittedPayload = payload
        return snapshot
      },
    }),
  )
  const body = await response.json()
  const createdPayload = submittedPayload as Record<string, unknown> | null

  assert.equal(response.status, 200)
  assert.equal(createdPayload?.mobile, '6000000000')
  assert.equal(createdPayload?.id, 'worker-created')
  assert.equal(createdPayload?.fullName, 'Synthetic Worker')
  assert.equal(body.success, true)
  assert.equal(body.workerId, 'worker-created')
  assert.equal(body.worker.id, 'worker-created')
  assert.deepEqual(body.snapshot.workers, snapshot.workers)
})

test('worker creation returns the exact persistent ID even when the worker is outside the capped snapshot', async () => {
  const insertedWorker = workerFixture({ id: 'worker-1001', mobile: '6000000000' })
  const response = await adminRoute.handleAdminLabourPost(
    makeRequest('6000000000'),
    makeDependencies({
      createLabourWorkerId: () => insertedWorker.id,
      createLabourEntity: async () => ({ workers: [] }),
      findLabourWorkerById: async (workerId: string) =>
        workerId === insertedWorker.id ? insertedWorker : null,
    }),
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(body.snapshot.workers, [])
  assert.equal(body.workerId, insertedWorker.id)
  assert.equal(body.worker.id, insertedWorker.id)
})

test('UI keeps the friendly conflict and authorized Open Existing Worker action', () => {
  assert.match(adminPageSource, /\{DUPLICATE_WORKER_MOBILE_MESSAGE\}/)
  assert.equal(
    mobileModule.DUPLICATE_WORKER_MOBILE_MESSAGE,
    'A worker with this mobile number already exists. Open the existing worker record to review or update it.',
  )
  assert.match(adminPageSource, />\s*Open Existing Worker\s*</)
  assert.match(adminPageSource, /requestAdminWorkerLookup\(\{ workerId: existingWorkerConflict\.id \}\)/)
  assert.match(adminPageSource, /requestAdminWorkerLookup\(\{ workerId: creationResult\.workerId \}\)/)
  assert.match(adminPageSource, /Status: \{titleCase\(existingWorkerConflict\.status/)
  assert.doesNotMatch(adminPageSource, /labour_workers_mobile_key/)
})

test('worker insert precedes every optional upload and failed creation performs no upload', () => {
  const insertIndex = adminPageSource.indexOf("persistEntity('POST', 'workers', creationPayload)")
  const photoIndex = adminPageSource.indexOf("requestWorkerFileUpload(createdWorker.id, 'profile_photo'")
  const identityIndex = adminPageSource.indexOf("requestWorkerFileUpload(createdWorker.id, 'identity_proof'")

  assert.ok(insertIndex > 0)
  assert.ok(photoIndex > insertIndex)
  assert.ok(identityIndex > insertIndex)
  assert.match(adminPageSource, /const creationResult = await persistEntity[\s\S]*if \(!creationResult\) return[\s\S]*requestWorkerFileUpload/)
})
