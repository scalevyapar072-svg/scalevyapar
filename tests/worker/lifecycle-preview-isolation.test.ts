import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const workspaceRoot = process.cwd()

const {
  WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE,
  buildWorkerLifecycleMutationBlockedResponse,
  shouldBlockWorkerLifecycleMutation,
} = await import(
  pathToFileURL(
    path.join(
      workspaceRoot,
      'lib',
      'worker-lifecycle-mutation-guard.ts',
    ),
  ).href
)

const readWorkspaceFile = (...segments: string[]) =>
  readFileSync(path.join(workspaceRoot, ...segments), 'utf8')

const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`

const adminRouteSource = readWorkspaceFile('app', 'api', 'admin', 'labour', 'route.ts')
const registerRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'register', 'route.ts')
const profileRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'profile', 'route.ts')
const walletRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'wallet', 'status', 'route.ts')
const razorpayRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'payments', 'razorpay', 'verify', 'route.ts')
const dashboardRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'dashboard', 'route.ts')
const verifyOtpRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'auth', 'verify-otp', 'route.ts')
const workerAppSource = readWorkspaceFile('lib', 'labour-worker-app.ts')
const workerPaymentSource = readWorkspaceFile('lib', 'labour-worker-payment.ts')

const loadAdminLabourRouteModule = async () => {
  const authStubUrl = toDataUrl(`
    export const requireAdmin = async () => {
      throw new Error('requireAdmin stub should not be called directly in tests')
    }
  `)
  const marketplaceStubUrl = toDataUrl(`
    export const createLabourEntity = async () => {
      throw new Error('createLabourEntity stub should not be called directly in tests')
    }
    export const deleteLabourEntity = async () => {
      throw new Error('deleteLabourEntity stub should not be called directly in tests')
    }
    export const getLabourAdminVisibleCategories = async () => []
    export const getLabourMarketplaceSnapshot = async () => ({})
    export class LabourEntityConflictError extends Error {
      constructor(message, statusCode = 409) {
        super(message)
        this.statusCode = statusCode
      }
    }
    export const updateLabourEntity = async () => {
      throw new Error('updateLabourEntity stub should not be called directly in tests')
    }
  `)
  const guardStubUrl = toDataUrl(`
    export const WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE =
      'Worker lifecycle mutations are disabled in Preview.'
    export const shouldBlockWorkerLifecycleMutation = (runtime) =>
      runtime?.allowNonProductionForTests ? false : runtime?.vercelEnv !== 'production'
    export const buildWorkerLifecycleMutationBlockedResponse = (status = 503) =>
      Response.json({ error: WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE }, { status })
  `)

  const routeModuleSource = adminRouteSource
    .replace("'@/lib/auth'", `'${authStubUrl}'`)
    .replace("'@/lib/labour-marketplace'", `'${marketplaceStubUrl}'`)
    .replace("'@/lib/worker-lifecycle-mutation-guard'", `'${guardStubUrl}'`)

  const transpiled = ts.transpileModule(routeModuleSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })

  return import(toDataUrl(transpiled.outputText))
}

const { handleAdminLabourDelete } = await loadAdminLabourRouteModule()

const assertOrdered = (source: string, needles: string[], context: string) => {
  let previousIndex = -1

  for (const needle of needles) {
    const nextIndex = source.indexOf(needle)
    assert.notEqual(
      nextIndex,
      -1,
      `Expected ${context} to include ${needle}`,
    )
    assert.ok(
      nextIndex > previousIndex,
      `Expected ${context} to keep ${needle} after the prior safety step`,
    )
    previousIndex = nextIndex
  }
}

const sliceBetween = (source: string, startNeedle: string, endNeedle: string) => {
  const startIndex = source.indexOf(startNeedle)
  const endIndex = source.indexOf(endNeedle, startIndex)

  assert.notEqual(startIndex, -1, `Expected source to include ${startNeedle}`)
  assert.notEqual(endIndex, -1, `Expected source to include ${endNeedle}`)

  return source.slice(startIndex, endIndex)
}

test('worker lifecycle mutation guard fails closed outside production unless tests opt in explicitly', async () => {
  assert.equal(
    shouldBlockWorkerLifecycleMutation({ vercelEnv: 'preview' }),
    true,
  )
  assert.equal(
    shouldBlockWorkerLifecycleMutation({ vercelEnv: 'production' }),
    false,
  )
  assert.equal(
    shouldBlockWorkerLifecycleMutation({
      vercelEnv: null,
      allowNonProductionForTests: true,
    }),
    false,
  )

  const response = buildWorkerLifecycleMutationBlockedResponse()
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    error: WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE,
  })
})

test('admin worker lifecycle mutation handlers keep auth checks before the preview write block', () => {
  const postBlock = sliceBetween(
    adminRouteSource,
    'export async function handleAdminLabourPost',
    'export async function PUT',
  )
  const putBlock = sliceBetween(
    adminRouteSource,
    'export async function handleAdminLabourPut',
    'export async function DELETE',
  )
  const deleteBlock = sliceBetween(
    adminRouteSource,
    'export async function handleAdminLabourDelete',
    '} catch (error) {',
  )

  assert.ok(adminRouteSource.includes("entityType === 'workers'"))

  assertOrdered(
    postBlock,
    [
      'const admin = await dependencies.requireAdmin(request)',
      'if (admin instanceof Response)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const snapshot = await dependencies.createLabourEntity(',
    ],
    'handleAdminLabourPost',
  )

  assertOrdered(
    putBlock,
    [
      'const admin = await dependencies.requireAdmin(request)',
      'if (admin instanceof Response)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const snapshot = await dependencies.updateLabourEntity(',
    ],
    'handleAdminLabourPut',
  )

  assertOrdered(
    deleteBlock,
    [
      'const admin = await dependencies.requireAdmin(request)',
      'if (admin instanceof Response)',
      "if (!isEntityType(entityType) || !id)",
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const snapshot = await dependencies.deleteLabourEntity(',
    ],
    'handleAdminLabourDelete',
  )
})

test('admin worker delete preview isolation blocks only authenticated worker deletion and preserves other delete cases', async () => {
  const unauthenticatedResponse = new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 },
  )

  let previewDeleteCalls = 0
  let previewCategoriesCalls = 0

  const previewBlockedResponse = await handleAdminLabourDelete(
    new Request('https://example.com/api/admin/labour', {
      method: 'DELETE',
      body: JSON.stringify({ entityType: 'workers', id: 'worker-1' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      createLabourEntity: async () => {
        throw new Error('createLabourEntity should not run during DELETE tests')
      },
      deleteLabourEntity: async () => {
        previewDeleteCalls += 1
        throw new Error('Preview worker delete should have been blocked before deleteLabourEntity')
      },
      getLabourAdminVisibleCategories: async () => {
        previewCategoriesCalls += 1
        return []
      },
      requireAdmin: async () => ({ email: 'admin@example.com' }),
      updateLabourEntity: async () => {
        throw new Error('updateLabourEntity should not run during DELETE tests')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(previewBlockedResponse.status, 503)
  assert.deepEqual(await previewBlockedResponse.json(), {
    error: WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE,
  })
  assert.equal(previewDeleteCalls, 0)
  assert.equal(previewCategoriesCalls, 0)

  const unauthenticatedDeleteResponse = await handleAdminLabourDelete(
    new Request('https://example.com/api/admin/labour', {
      method: 'DELETE',
      body: JSON.stringify({ entityType: 'workers', id: 'worker-1' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      createLabourEntity: async () => {
        throw new Error('createLabourEntity should not run during DELETE tests')
      },
      deleteLabourEntity: async () => {
        throw new Error('Unauthenticated delete should not reach deleteLabourEntity')
      },
      getLabourAdminVisibleCategories: async () => [],
      requireAdmin: async () => unauthenticatedResponse,
      updateLabourEntity: async () => {
        throw new Error('updateLabourEntity should not run during DELETE tests')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(unauthenticatedDeleteResponse.status, 401)
  assert.deepEqual(await unauthenticatedDeleteResponse.json(), {
    error: 'Unauthorized',
  })

  let productionDeleteCalls = 0
  const productionResponse = await handleAdminLabourDelete(
    new Request('https://example.com/api/admin/labour', {
      method: 'DELETE',
      body: JSON.stringify({ entityType: 'workers', id: 'worker-2' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      createLabourEntity: async () => {
        throw new Error('createLabourEntity should not run during DELETE tests')
      },
      deleteLabourEntity: async (
        entityType: string,
        id: string,
        email: string,
      ) => {
        productionDeleteCalls += 1
        assert.equal(entityType, 'workers')
        assert.equal(id, 'worker-2')
        assert.equal(email, 'admin@example.com')
        return { workers: [], auditLogs: [], workerPlans: [] }
      },
      getLabourAdminVisibleCategories: async () => [],
      requireAdmin: async () => ({ email: 'admin@example.com' }),
      updateLabourEntity: async () => {
        throw new Error('updateLabourEntity should not run during DELETE tests')
      },
      mutationRuntime: { vercelEnv: 'production' },
    },
  )

  assert.equal(productionResponse.status, 200)
  assert.equal(productionDeleteCalls, 1)
  assert.deepEqual(await productionResponse.json(), {
    success: true,
    snapshot: { workers: [], auditLogs: [], workerPlans: [], adminCategories: [] },
  })

  let unrelatedDeleteCalls = 0
  const unrelatedPreviewResponse = await handleAdminLabourDelete(
    new Request('https://example.com/api/admin/labour', {
      method: 'DELETE',
      body: JSON.stringify({ entityType: 'companies', id: 'company-1' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      createLabourEntity: async () => {
        throw new Error('createLabourEntity should not run during DELETE tests')
      },
      deleteLabourEntity: async (
        entityType: string,
        id: string,
      ) => {
        unrelatedDeleteCalls += 1
        assert.equal(entityType, 'companies')
        assert.equal(id, 'company-1')
        return { companies: [] }
      },
      getLabourAdminVisibleCategories: async () => [],
      requireAdmin: async () => ({ email: 'admin@example.com' }),
      updateLabourEntity: async () => {
        throw new Error('updateLabourEntity should not run during DELETE tests')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(unrelatedPreviewResponse.status, 200)
  assert.equal(unrelatedDeleteCalls, 1)
  assert.deepEqual(await unrelatedPreviewResponse.json(), {
    success: true,
    snapshot: { companies: [], adminCategories: [] },
  })

  let invalidDeleteCalls = 0
  const invalidResponse = await handleAdminLabourDelete(
    new Request('https://example.com/api/admin/labour', {
      method: 'DELETE',
      body: JSON.stringify({ entityType: 'invalid', id: 'worker-3' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      createLabourEntity: async () => {
        throw new Error('createLabourEntity should not run during DELETE tests')
      },
      deleteLabourEntity: async () => {
        invalidDeleteCalls += 1
        throw new Error('Invalid entityType should not reach deleteLabourEntity')
      },
      getLabourAdminVisibleCategories: async () => [],
      requireAdmin: async () => ({ email: 'admin@example.com' }),
      updateLabourEntity: async () => {
        throw new Error('updateLabourEntity should not run during DELETE tests')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(invalidResponse.status, 400)
  assert.deepEqual(await invalidResponse.json(), {
    error: 'entityType and id are required',
  })
  assert.equal(invalidDeleteCalls, 0)
})

test('worker mutation routes fail closed before payload-driven writes or Razorpay side effects', () => {
  assertOrdered(
    registerRouteSource,
    [
      'const auth = await dependencies.requireWorkerApp(request)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const payload = await request.json()',
      'await dependencies.completeWorkerAppRegistration(',
    ],
    'worker register route',
  )

  assertOrdered(
    profileRouteSource,
    [
      'const auth = await dependencies.requireWorkerApp(request)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const payload = await request.json()',
      'await dependencies.updateWorkerAppProfile(',
    ],
    'worker profile route',
  )

  assertOrdered(
    walletRouteSource,
    [
      'const auth = await dependencies.requireWorkerApp(request)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const body = await request.json().catch(() => ({}))',
      'await dependencies.updateWorkerWalletStatus(',
    ],
    'worker wallet status route',
  )

  assertOrdered(
    razorpayRouteSource,
    [
      'const auth = await dependencies.requireWorkerApp(request)',
      'shouldBlockWorkerLifecycleMutation(dependencies.mutationRuntime)',
      'return buildWorkerLifecycleMutationBlockedResponse()',
      'const body = await request.json().catch(() => ({}))',
      'const { client, keySecret } = dependencies.getRazorpay()',
      'await dependencies.creditWorkerWalletFromRazorpay({',
    ],
    'worker Razorpay verification route',
  )
})

test('dashboard construction and OTP bootstrap remain read-only after the preview-isolation refactor', () => {
  const dashboardBlock = sliceBetween(
    workerAppSource,
    'export const getWorkerAppDashboard = async',
    'export const completeWorkerAppRegistration = async',
  )

  for (const disallowedWrite of [
    'reconcileWorkerRegistrationFee(',
    'reconcileWorkerDailyCharge(',
    'createLabourEntity(',
    'updateLabourEntity(',
    'deleteLabourEntity(',
  ]) {
    assert.equal(
      dashboardBlock.includes(disallowedWrite),
      false,
      `Expected getWorkerAppDashboard to stay read-only without ${disallowedWrite}`,
    )
  }

  assert.ok(dashboardRouteSource.includes('getWorkerAppDashboard(auth.workerId)'))
  assert.equal(dashboardRouteSource.includes('createLabourEntity('), false)
  assert.equal(dashboardRouteSource.includes('updateLabourEntity('), false)

  assert.ok(verifyOtpRouteSource.includes('getWorkerAppDashboard(auth.workerId)'))
  assert.equal(verifyOtpRouteSource.includes('createLabourEntity('), false)
  assert.equal(verifyOtpRouteSource.includes('updateLabourEntity('), false)
})

test('server-side lifecycle and payment mutators are explicitly guarded even if called outside routes', () => {
  for (const requiredGuardedFunction of [
    'export const reconcileWorkerRegistrationFee = async',
    'export const reconcileWorkerDailyCharge = async',
    'const settleWorkerDailyChargeForToday = async',
    'export const completeWorkerAppRegistration = async',
    'export const updateWorkerAppProfile = async',
    'export const updateWorkerWalletStatus = async',
  ]) {
    const functionIndex = workerAppSource.indexOf(requiredGuardedFunction)
    assert.notEqual(
      functionIndex,
      -1,
      `Expected worker lifecycle source to include ${requiredGuardedFunction}`,
    )

    const guardIndex = workerAppSource.indexOf(
      'assertWorkerLifecycleMutationAllowed()',
      functionIndex,
    )

    assert.notEqual(
      guardIndex,
      -1,
      `Expected ${requiredGuardedFunction} to assert the centralized preview guard`,
    )
  }

  assert.ok(
    workerPaymentSource.includes('assertWorkerLifecycleMutationAllowed()'),
  )
})

test('preview-isolated lifecycle paths cannot reach Meta messages and keep production flow available after the guard', () => {
  for (const source of [
    adminRouteSource,
    registerRouteSource,
    profileRouteSource,
    walletRouteSource,
    razorpayRouteSource,
    workerAppSource,
    workerPaymentSource,
  ]) {
    assert.equal(source.includes('/messages'), false)
  }

  assert.ok(adminRouteSource.includes('dependencies.updateLabourEntity('))
  assert.ok(registerRouteSource.includes('dependencies.completeWorkerAppRegistration('))
  assert.ok(profileRouteSource.includes('dependencies.updateWorkerAppProfile('))
  assert.ok(walletRouteSource.includes('dependencies.updateWorkerWalletStatus('))
  assert.ok(razorpayRouteSource.includes('dependencies.creditWorkerWalletFromRazorpay({'))
})
