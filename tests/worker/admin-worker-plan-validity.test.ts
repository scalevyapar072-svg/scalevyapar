import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const marketplaceSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-marketplace.ts'),
  'utf8',
)

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
  assert.ok(initializer, `Expected to find ${variableName} in production source`)
  return initializer
}

const normalizeWorkerPlanDateValueExpression = extractVariableInitializer(
  marketplaceSource,
  'normalizeWorkerPlanDateValue',
)
const syncWorkerPlanAssignmentExpression = extractVariableInitializer(
  marketplaceSource,
  'syncWorkerPlanAssignment',
)

const harnessSource = `
  const normalizeWorkerPlanDateValue = ${normalizeWorkerPlanDateValueExpression}
  const getWorkerPlanById = (plans, planId) =>
    plans.find(plan => plan.id === planId && plan.audience === 'worker') || null
  const getDefaultWorkerPlan = plans =>
    plans.find(plan => plan.audience === 'worker' && plan.isActive) || null
  const getTodayDateValue = () => '2026-09-17'
  const getPlanValidityDays = plan => plan.planValidityDays || plan.validityDays || 0
  const addDays = (dateValue, days) => {
    const date = new Date(dateValue + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
  }
  const roundCurrency = value => Math.round((value + Number.EPSILON) * 100) / 100
  let walletTransactionSequence = 0
  const buildWorkerPlanWalletCreditTransaction = (worker, plan, createdAt) => {
    if (plan.walletCredit <= 0) return null
    walletTransactionSequence += 1
    return {
      id: 'wallet-transaction-' + walletTransactionSequence,
      entityType: 'worker',
      entityId: worker.id,
      transactionType: 'wallet_recharge',
      amount: plan.walletCredit,
      direction: 'credit',
      status: 'completed',
      reference: plan.id,
      createdAt,
      updatedAt: createdAt,
    }
  }
  const syncWorkerPlanAssignment = ${syncWorkerPlanAssignmentExpression}
  export { syncWorkerPlanAssignment }
`

const transpiledHarness = ts.transpileModule(harnessSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
})
const { syncWorkerPlanAssignment } = await import(toDataUrl(transpiledHarness.outputText))

const workerPlan = {
  id: 'worker-50-plan',
  audience: 'worker',
  name: 'Worker ₹50 Plan',
  walletCredit: 50,
  registrationFee: 0,
  planValidityDays: 10,
  validityDays: 10,
  dailyCharge: 5,
  isActive: true,
}

type Worker = {
  id: string
  fullName: string
  mobile: string
  city: string
  activePlan: string
  planValidFrom: string
  planValidUntil: string
  lastWalletDeductionDate: string
  registrationCompletedAt: string
  registrationFeePaid: boolean
  walletBalance: number
  status: string
  kycStatus: string
  isVisible: boolean
  profilePhotoPath: string
  identityProofType: string
  identityProofNumber: string
  identityProofPath: string
  updatedAt: string
}

const makeWorker = (overrides: Partial<Worker> = {}): Worker => ({
  id: 'synthetic-worker',
  fullName: 'Synthetic Worker',
  mobile: '0000000000',
  city: 'Test City',
  activePlan: workerPlan.id,
  planValidFrom: '',
  planValidUntil: '',
  lastWalletDeductionDate: '',
  registrationCompletedAt: '',
  registrationFeePaid: false,
  walletBalance: 0,
  status: 'pending',
  kycStatus: 'pending_review',
  isVisible: false,
  profilePhotoPath: '',
  identityProofType: '',
  identityProofNumber: '',
  identityProofPath: '',
  updatedAt: '2026-09-17T00:00:00.000Z',
  ...overrides,
})

const assign = (
  payload: Record<string, unknown>,
  existing?: Worker,
) => {
  const normalized = makeWorker(existing ? { ...existing, ...payload } : payload)
  return syncWorkerPlanAssignment(normalized, [workerPlan], existing, payload)
}

test('Admin assignment preserves a complete explicit plan period without registration completion', () => {
  const result = assign({
    activePlan: workerPlan.id,
    planValidFrom: '2026-09-15',
    planValidUntil: '2026-09-25',
  })

  assert.equal(result.worker.planValidFrom, '2026-09-15')
  assert.equal(result.worker.planValidUntil, '2026-09-25')
  assert.equal(result.worker.activePlan, workerPlan.id)
  assert.equal(result.worker.registrationCompletedAt, '')
  assert.equal(result.worker.walletBalance, 50)
  assert.equal(result.walletCreditTransaction?.amount, 50)
  assert.equal(result.walletCreditTransaction?.reference, workerPlan.id)
})

test('ordinary edits neither duplicate wallet credit nor create another ledger record', () => {
  const created = assign({
    activePlan: workerPlan.id,
    planValidFrom: '2026-09-15',
    planValidUntil: '2026-09-25',
  }).worker
  const result = assign({ fullName: 'Synthetic Worker Edited' }, created)

  assert.equal(result.worker.walletBalance, 50)
  assert.equal(result.walletCreditTransaction, null)
  assert.equal(result.worker.planValidFrom, '2026-09-15')
  assert.equal(result.worker.planValidUntil, '2026-09-25')
})

test('a provisional app worker without submitted dates remains fail closed', () => {
  const result = assign({ activePlan: workerPlan.id })

  assert.equal(result.worker.planValidFrom, '')
  assert.equal(result.worker.planValidUntil, '')
  assert.equal(result.worker.registrationCompletedAt, '')
})

test('submitting only one plan date never creates a partial plan period', () => {
  for (const payload of [
    { activePlan: workerPlan.id, planValidFrom: '2026-09-15' },
    { activePlan: workerPlan.id, planValidUntil: '2026-09-25' },
  ]) {
    const result = assign(payload)
    assert.equal(result.worker.planValidFrom, '')
    assert.equal(result.worker.planValidUntil, '')
  }
})

test('invalid or reversed explicit plan dates fail closed', () => {
  for (const payload of [
    {
      activePlan: workerPlan.id,
      planValidFrom: '2026-02-31',
      planValidUntil: '2026-03-12',
    },
    {
      activePlan: workerPlan.id,
      planValidFrom: '2026-09-25',
      planValidUntil: '2026-09-15',
    },
  ]) {
    const result = assign(payload)
    assert.equal(result.worker.planValidFrom, '')
    assert.equal(result.worker.planValidUntil, '')
  }
})

const makeAssignedWorker = () => makeWorker({
  walletBalance: 50,
  registrationFeePaid: true,
  planValidFrom: '2026-09-15',
  planValidUntil: '2026-09-25',
})

test('KYC approval preserves an existing valid plan period and registration timestamp', () => {
  const existing = makeAssignedWorker()
  existing.registrationCompletedAt = '2026-09-14T01:02:03.000Z'
  const result = assign({ kycStatus: 'approved', status: 'active' }, existing)

  assert.equal(result.worker.planValidFrom, existing.planValidFrom)
  assert.equal(result.worker.planValidUntil, existing.planValidUntil)
  assert.equal(result.worker.registrationCompletedAt, existing.registrationCompletedAt)
  assert.equal(result.walletCreditTransaction, null)
})

test('an unrelated partial update does not invent missing plan dates', () => {
  const existing = makeWorker({
    walletBalance: 50,
    registrationFeePaid: true,
    registrationCompletedAt: '2026-09-14T01:02:03.000Z',
  })
  const result = assign({ kycStatus: 'approved' }, existing)

  assert.equal(result.worker.planValidFrom, '')
  assert.equal(result.worker.planValidUntil, '')
  assert.equal(result.worker.registrationCompletedAt, existing.registrationCompletedAt)
  assert.equal(result.walletCreditTransaction, null)
})

test('Save Proof Details preserves an existing valid plan period', () => {
  const existing = makeAssignedWorker()
  const result = assign({
    identityProofType: 'other',
    identityProofNumber: 'SYNTHETIC-PROOF',
  }, existing)

  assert.equal(result.worker.planValidFrom, existing.planValidFrom)
  assert.equal(result.worker.planValidUntil, existing.planValidUntil)
  assert.equal(result.worker.registrationCompletedAt, '')
  assert.equal(result.walletCreditTransaction, null)
})

test('profile-photo and identity-proof uploads do not alter plan dates', () => {
  const existing = makeAssignedWorker()

  for (const payload of [
    { profilePhotoPath: 'workers/synthetic/profile.png' },
    { identityProofPath: 'workers/synthetic/identity.png' },
  ]) {
    const result = assign(payload, existing)
    assert.equal(result.worker.planValidFrom, existing.planValidFrom)
    assert.equal(result.worker.planValidUntil, existing.planValidUntil)
    assert.equal(result.worker.registrationCompletedAt, '')
    assert.equal(result.walletCreditTransaction, null)
  }
})

test('app registration completion keeps its existing plan initialization behavior', () => {
  const existing = makeWorker({
    walletBalance: 50,
    registrationFeePaid: true,
  })
  const registrationCompletedAt = '2026-09-17T01:02:03.000Z'
  const result = assign({ registrationCompletedAt }, existing)

  assert.equal(result.worker.registrationCompletedAt, registrationCompletedAt)
  assert.equal(result.worker.planValidFrom, '2026-09-17')
  assert.equal(result.worker.planValidUntil, '2026-09-27')
  assert.equal(result.worker.walletBalance, 50)
  assert.equal(result.walletCreditTransaction, null)
})

test('all production storage paths pass the original payload to plan synchronization', () => {
  const calls = marketplaceSource.match(/syncWorkerPlanAssignment\([^\n]+\)/g) || []
  assert.equal(calls.length, 4)
  assert.ok(calls.every(call => call.endsWith(', payload)')))
})
