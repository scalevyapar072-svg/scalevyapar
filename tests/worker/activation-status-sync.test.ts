import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const readWorkspaceFile = (...segments: string[]) =>
  readFileSync(path.join(workspaceRoot, ...segments), 'utf8')
const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`

const extractVariableInitializer = (source: string, variableName: string) => {
  const sourceFile = ts.createSourceFile(
    `${variableName}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  let initializer = ''

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      initializer = node.initializer.getText(sourceFile)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  assert.ok(initializer, `Expected ${variableName} in production source`)
  return initializer
}

const workerAppSource = readWorkspaceFile('lib', 'labour-worker-app.ts')
const marketplaceSource = readWorkspaceFile('lib', 'labour-marketplace.ts')
const renewalSource = readWorkspaceFile('lib', 'labour-worker-plan-renewal.ts')
const adminRouteSource = readWorkspaceFile('app', 'api', 'admin', 'labour', 'route.ts')
const renewalRouteSource = readWorkspaceFile(
  'app',
  'api',
  'admin',
  'labour',
  'worker-renewal',
  'route.ts',
)
const adminPageSource = readWorkspaceFile('app', 'admin', 'labour', 'page.tsx')
const dashboardRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'dashboard', 'route.ts')
const verifyOtpRouteSource = readWorkspaceFile('app', 'api', 'labour', 'worker', 'auth', 'verify-otp', 'route.ts')
const flutterGuideSource = readWorkspaceFile('docs', 'flutterflow-worker-app-guide.md')

const addDaysExpression = extractVariableInitializer(renewalSource, 'addDays')
const renewalDecisionExpression = extractVariableInitializer(
  renewalSource,
  'buildWorkerPlanRenewalDecision',
)
const planAssignmentExpression = extractVariableInitializer(
  marketplaceSource,
  'syncWorkerPlanAssignment',
)
const renewalHarnessSource = ts.transpileModule(
  `
    const addDays = ${addDaysExpression}
    export const buildWorkerPlanRenewalDecision = ${renewalDecisionExpression}
  `,
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText
const { buildWorkerPlanRenewalDecision } = await import(toDataUrl(renewalHarnessSource))
const planAssignmentHarnessSource = ts.transpileModule(
  `
    const getDefaultWorkerPlan = () => null
    const getWorkerPlanById = (plans, planId) =>
      plans.find(plan => plan.id === planId && plan.audience === 'worker') || null
    const getTodayDateValue = () => '2026-09-16'
    const addDays = (dateValue, days) => {
      const timestamp = Date.parse(dateValue + 'T00:00:00.000Z')
      return new Date(timestamp + days * 86400000).toISOString().slice(0, 10)
    }
    const getPlanValidityDays = (plan) => plan.planValidityDays || plan.validityDays || 0
    export const syncWorkerPlanAssignment = ${planAssignmentExpression}
  `,
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText
const { syncWorkerPlanAssignment } = await import(toDataUrl(planAssignmentHarnessSource))

const loadRenewalRouteModule = async () => {
  const authStubUrl = toDataUrl(`
    export const requireAdmin = async () => {
      throw new Error('requireAdmin stub should not be called directly in tests')
    }
  `)
  const renewalStubUrl = toDataUrl(`
    export const renewWorkerPlan = async () => {
      throw new Error('renewWorkerPlan stub should not be called directly in tests')
    }
  `)
  const guardStubUrl = toDataUrl(`
    export const shouldBlockWorkerLifecycleMutation = (runtime) =>
      runtime?.allowNonProductionForTests ? false : runtime?.vercelEnv !== 'production'
    export const buildWorkerLifecycleMutationBlockedResponse = () =>
      Response.json(
        { error: 'Worker lifecycle mutations are disabled in Preview.' },
        { status: 503 },
      )
  `)

  const routeModuleSource = renewalRouteSource
    .replace("'@/lib/auth'", `'${authStubUrl}'`)
    .replace("'@/lib/labour-worker-plan-renewal'", `'${renewalStubUrl}'`)
    .replace("'@/lib/worker-lifecycle-mutation-guard'", `'${guardStubUrl}'`)
  const transpiled = ts.transpileModule(routeModuleSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })

  return import(toDataUrl(transpiled.outputText))
}

const { handleWorkerPlanRenewal } = await loadRenewalRouteModule()

test('dashboard contract separates profile, plan, access, remaining days, and wallet coverage', () => {
  for (const expected of [
    'lifecycle: WorkerLifecyclePresentation',
    "operationalStatus: WorkerLifecyclePresentation['profileStatus']",
    'operationalStatus: lifecycle.profileStatus',
    'balanceCoverageDays: number',
    "status: WorkerLifecyclePresentation['planStatus']",
    'remainingDays: number',
    'estimatedDaysRemaining: lifecycle.remainingDays',
    'balanceCoverageDays: lifecycle.balanceCoverageDays',
    'status: lifecycle.planStatus',
    'remainingDays: lifecycle.remainingDays',
    'lifecycle.planStatus === \'expired\'',
    'Wallet balance does not extend the plan period.',
  ]) {
    assert.ok(workerAppSource.includes(expected), expected)
  }

  assert.equal(
    workerAppSource.includes('estimatedDaysRemaining: dailyCharge > 0 ? Math.floor(worker.walletBalance / dailyCharge) : 0'),
    false,
  )
})

test('expired plans cannot be silently renewed by worker activation', () => {
  assert.ok(
    workerAppSource.includes('until an admin explicitly renews the expired plan'),
  )
  assert.equal(workerAppSource.includes('buildReactivatedWorkerPlanWindow'), false)
  assert.equal(workerAppSource.includes('reactivatedPlanWindow'), false)
})

test('ordinary Admin save cannot write financial lifecycle fields or issue plan credits', () => {
  for (const field of [
    "'walletBalance'",
    "'registrationFeePaid'",
    "'planValidFrom'",
    "'planValidUntil'",
    "'lastWalletDeductionDate'",
  ]) {
    assert.ok(adminRouteSource.includes(field), `Admin route must strip ${field}`)
    assert.ok(adminPageSource.includes(field), `Admin payload must strip ${field}`)
  }

  assert.equal(marketplaceSource.includes('buildWorkerPlanWalletCreditTransaction'), false)
  assert.ok(marketplaceSource.includes('walletCreditTransaction: null as LabourWalletTransactionRecord | null'))
  assert.ok(adminPageSource.includes('Plan Wallet Credit (not applied by Save)'))
})

test('ordinary Active save preserves an expired period while a different plan starts one period without credit', () => {
  const expiredWorker = {
    id: 'worker-1',
    activePlan: 'plan-1',
    registrationCompletedAt: '2026-09-03T00:00:00.000Z',
    planValidFrom: '2026-09-03',
    planValidUntil: '2026-09-13',
    lastWalletDeductionDate: '',
    registrationFeePaid: true,
    walletBalance: 50,
    updatedAt: '2026-09-16T00:00:00.000Z',
  }
  const plans = [
    {
      id: 'plan-1',
      audience: 'worker',
      isActive: true,
      planValidityDays: 10,
      validityDays: 10,
      registrationFee: 0,
    },
    {
      id: 'plan-2',
      audience: 'worker',
      isActive: true,
      planValidityDays: 30,
      validityDays: 30,
      registrationFee: 0,
    },
  ]

  const samePlanSave = syncWorkerPlanAssignment(
    { ...expiredWorker, status: 'active' },
    plans,
    expiredWorker,
  )
  assert.equal(samePlanSave.worker.planValidFrom, '2026-09-03')
  assert.equal(samePlanSave.worker.planValidUntil, '2026-09-13')
  assert.equal(samePlanSave.worker.walletBalance, 50)
  assert.equal(samePlanSave.walletCreditTransaction, null)

  const differentPlanSave = syncWorkerPlanAssignment(
    { ...expiredWorker, activePlan: 'plan-2' },
    plans,
    expiredWorker,
  )
  assert.equal(differentPlanSave.worker.planValidFrom, '2026-09-16')
  assert.equal(differentPlanSave.worker.planValidUntil, '2026-10-16')
  assert.equal(differentPlanSave.worker.walletBalance, 50)
  assert.equal(differentPlanSave.walletCreditTransaction, null)
})

test('explicit renewal creates one effective period and duplicate renewal is a no-op', () => {
  assert.deepEqual(
    buildWorkerPlanRenewalDecision({
      currentPlanId: 'worker-plan',
      requestedPlanId: 'worker-plan',
      currentPlanValidFrom: '2026-09-03',
      currentPlanValidUntil: '2026-09-13',
      currentDateValue: '2026-09-16',
      validityDays: 10,
    }),
    {
      shouldRenew: true,
      planValidFrom: '2026-09-16',
      planValidUntil: '2026-09-26',
    },
  )

  assert.deepEqual(
    buildWorkerPlanRenewalDecision({
      currentPlanId: 'worker-plan',
      requestedPlanId: 'worker-plan',
      currentPlanValidFrom: '2026-09-16',
      currentPlanValidUntil: '2026-09-26',
      currentDateValue: '2026-09-16',
      validityDays: 10,
    }),
    {
      shouldRenew: false,
      planValidFrom: '2026-09-16',
      planValidUntil: '2026-09-26',
    },
  )

  assert.deepEqual(
    buildWorkerPlanRenewalDecision({
      currentPlanId: 'old-plan',
      requestedPlanId: 'new-plan',
      currentPlanValidFrom: '2026-09-16',
      currentPlanValidUntil: '2026-09-26',
      currentDateValue: '2026-09-16',
      validityDays: 30,
    }),
    {
      shouldRenew: true,
      planValidFrom: '2026-09-16',
      planValidUntil: '2026-10-16',
    },
  )
})

test('explicit renewal uses compare-and-set and never changes wallet or financial ledger', () => {
  for (const expected of [
    ".eq('id', worker.id)",
    ".eq('active_plan', worker.activePlan)",
    ".eq('plan_valid_until', currentPlanEnd)",
    "from('labour_audit_logs')",
  ]) {
    assert.ok(renewalSource.includes(expected), expected)
  }

  assert.equal(renewalSource.includes('wallet_balance'), false)
  assert.equal(renewalSource.includes('labour_wallet_transactions'), false)
})

test('explicit renewal endpoint authenticates first and blocks Preview before parsing or writing', async () => {
  let unauthenticatedBodyReads = 0
  let unauthenticatedRenewals = 0
  const unauthorized = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const unauthenticatedResponse = await handleWorkerPlanRenewal(
    {
      json: async () => {
        unauthenticatedBodyReads += 1
        return { workerId: 'worker-1', planId: 'plan-1' }
      },
    } as Request,
    {
      requireAdmin: async () => unauthorized,
      renewWorkerPlan: async () => {
        unauthenticatedRenewals += 1
        throw new Error('Unauthenticated request must not renew a plan')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(unauthenticatedResponse, unauthorized)
  assert.equal(unauthenticatedBodyReads, 0)
  assert.equal(unauthenticatedRenewals, 0)

  let previewBodyReads = 0
  let previewRenewals = 0
  const previewResponse = await handleWorkerPlanRenewal(
    {
      json: async () => {
        previewBodyReads += 1
        return { workerId: 'worker-1', planId: 'plan-1' }
      },
    } as Request,
    {
      requireAdmin: async () => ({ email: 'admin@example.test' }),
      renewWorkerPlan: async () => {
        previewRenewals += 1
        throw new Error('Preview request must not renew a plan')
      },
      mutationRuntime: { vercelEnv: 'preview' },
    },
  )

  assert.equal(previewResponse.status, 503)
  assert.deepEqual(await previewResponse.json(), {
    error: 'Worker lifecycle mutations are disabled in Preview.',
  })
  assert.equal(previewBodyReads, 0)
  assert.equal(previewRenewals, 0)

  let productionRenewals = 0
  const productionResponse = await handleWorkerPlanRenewal(
    new Request('https://example.test/api/admin/labour/worker-renewal', {
      method: 'POST',
      body: JSON.stringify({ workerId: 'worker-1', planId: 'plan-1' }),
      headers: { 'content-type': 'application/json' },
    }),
    {
      requireAdmin: async () => ({ email: 'admin@example.test' }),
      renewWorkerPlan: async ({ workerId, planId, actor }: {
        workerId: string
        planId?: string
        actor: string
      }) => {
        productionRenewals += 1
        assert.deepEqual({ workerId, planId, actor }, {
          workerId: 'worker-1',
          planId: 'plan-1',
          actor: 'admin@example.test',
        })
        return {
          renewed: true,
          workerId,
          planId: planId || '',
          planValidFrom: '2026-09-16',
          planValidUntil: '2026-09-26',
        }
      },
      mutationRuntime: { vercelEnv: 'production' },
    },
  )

  assert.equal(productionResponse.status, 200)
  assert.equal(productionRenewals, 1)
})

test('authoritative worker responses are no-store and Flutter refresh replaces the full snapshot', () => {
  for (const source of [dashboardRouteSource, verifyOtpRouteSource]) {
    assert.ok(source.includes("'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'"))
    assert.ok(source.includes("Pragma: 'no-cache'"))
  }

  for (const expected of [
    'dashboard.lifecycle.profileStatus',
    'dashboard.lifecycle.planStatus',
    'dashboard.lifecycle.accessEligibility',
    'dashboard.lifecycle.remainingDays',
    'whenever the app returns to the foreground',
    'pull-to-refresh or taps Refresh',
    'replace the complete local dashboard state',
  ]) {
    assert.ok(flutterGuideSource.includes(expected), expected)
  }
})
