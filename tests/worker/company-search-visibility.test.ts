import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const { reconcileWorkerKycVisibility } = await import(
  pathToFileURL(
    path.join(workspaceRoot, 'lib', 'worker-kyc-completeness.ts'),
  ).href,
)
const companySearchSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'page.tsx'),
  'utf8',
)
const companySearchClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'labour-search-client.tsx'),
  'utf8',
)
const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`

const transpileToDataUrl = (source: string) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })

  return toDataUrl(transpiled.outputText)
}

const extractVariableInitializer = (
  source: string,
  variableName: string,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS,
) => {
  const sourceFile = ts.createSourceFile(
    `${variableName}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
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
  assert.ok(initializer, `Expected ${variableName} in source`)
  return initializer
}

const visibilityModule = await import(
  transpileToDataUrl(`
    const SEARCHABLE_WORKER_STATUSES = ${extractVariableInitializer(companySearchSource, 'SEARCHABLE_WORKER_STATUSES')}
    const applyCompanySearchVisibilityFilter = ${extractVariableInitializer(companySearchSource, 'applyCompanySearchVisibilityFilter')}
    const isWorkerVisibleInCompanySearch = ${extractVariableInitializer(companySearchSource, 'isWorkerVisibleInCompanySearch')}
    const applyWorkerFilters = ${extractVariableInitializer(companySearchSource, 'applyWorkerFilters')}

    export {
      SEARCHABLE_WORKER_STATUSES,
      applyWorkerFilters,
      isWorkerVisibleInCompanySearch,
    }
  `),
)

type SearchFilters = {
  search: string
  city: string
  industryCategory: string
  businessType: string
  category: string
  availability: string
  workerStatus: string
  experience: string
  wage: string
  sortBy: string
  page: number
}

type QueryCall = {
  method: string
  args: unknown[]
}

const makeFilters = (overrides: Partial<SearchFilters> = {}): SearchFilters => ({
  search: '',
  city: '',
  industryCategory: '',
  businessType: '',
  category: '',
  availability: '',
  workerStatus: '',
  experience: '',
  wage: '',
  sortBy: 'relevance',
  page: 1,
  ...overrides,
})

const makeQueryRecorder = () => {
  const calls: QueryCall[] = []
  const query: Record<string, (...args: unknown[]) => unknown> = {}

  for (const method of ['in', 'not', 'or', 'overlaps', 'lt', 'lte', 'gt', 'gte']) {
    query[method] = (...args: unknown[]) => {
      calls.push({ method, args })
      return query
    }
  }

  return { query, calls }
}

const applyWorkerFilters = visibilityModule.applyWorkerFilters as (
  query: Record<string, (...args: unknown[]) => unknown>,
  filters: SearchFilters,
  selectedCategoryIds: string[],
  statuses?: readonly string[],
) => unknown

const isWorkerVisibleInCompanySearch = visibilityModule.isWorkerVisibleInCompanySearch as (
  worker: { is_visible: boolean | null },
) => boolean

const assertServerVisibilityExclusion = (calls: QueryCall[]) => {
  assert.ok(calls.some(call =>
    call.method === 'not' &&
    call.args[0] === 'is_visible' &&
    call.args[1] === 'is' &&
    call.args[2] === false
  ))
}

test('explicit false is excluded from default All Workers', () => {
  const { query, calls } = makeQueryRecorder()
  applyWorkerFilters(query, makeFilters(), [])

  assertServerVisibilityExclusion(calls)
  assert.equal(isWorkerVisibleInCompanySearch({ is_visible: false }), false)
})

test('explicit false is excluded from Active Workers', () => {
  const { query, calls } = makeQueryRecorder()
  applyWorkerFilters(query, makeFilters({ workerStatus: 'active' }), [], ['active'])

  assertServerVisibilityExclusion(calls)
  assert.deepEqual(calls.find(call => call.method === 'in')?.args, ['status', ['active']])
})

test('explicit false is excluded from Inactive Workers', () => {
  const inactiveStatuses = [
    'inactive_wallet_empty',
    'inactive_subscription_expired',
    'inactive_paused_by_worker',
  ]
  const { query, calls } = makeQueryRecorder()
  applyWorkerFilters(query, makeFilters({ workerStatus: 'inactive' }), [], inactiveStatuses)

  assertServerVisibilityExclusion(calls)
  assert.deepEqual(calls.find(call => call.method === 'in')?.args, ['status', inactiveStatuses])
})

test('explicit false remains excluded with search, category, location, experience, and wage filters', () => {
  const { query, calls } = makeQueryRecorder()
  applyWorkerFilters(
    query,
    makeFilters({
      search: 'welder',
      city: 'Jaipur',
      category: 'fabrication',
      experience: '2-4',
      wage: '601-900',
    }),
    ['category-welder'],
  )

  assertServerVisibilityExclusion(calls)
  assert.ok(calls.some(call => call.method === 'or'))
  assert.ok(calls.some(call => call.method === 'overlaps'))
  assert.ok(calls.some(call => call.method === 'gte'))
  assert.ok(calls.some(call => call.method === 'lt'))
  assert.ok(calls.some(call => call.method === 'lte'))
})

test('visible active workers remain eligible for company-search assembly', () => {
  assert.equal(isWorkerVisibleInCompanySearch({ is_visible: true }), true)
})

test('visible inactive workers retain their existing company-search eligibility', () => {
  const worker = { status: 'inactive_wallet_empty', is_visible: true as boolean | null }
  assert.equal(isWorkerVisibleInCompanySearch(worker), true)
  assert.equal(worker.status, 'inactive_wallet_empty')
})

test('legacy null visibility retains its current eligible behavior', () => {
  assert.equal(isWorkerVisibleInCompanySearch({ is_visible: null }), true)
})

test('combined active and inactive assembly cannot reintroduce explicit false', () => {
  const rows = [
    { id: 'active-visible', status: 'active', is_visible: true as boolean | null },
    { id: 'active-hidden', status: 'active', is_visible: false as boolean | null },
    { id: 'inactive-visible', status: 'inactive_wallet_empty', is_visible: true as boolean | null },
    { id: 'inactive-hidden', status: 'inactive_wallet_empty', is_visible: false as boolean | null },
    { id: 'legacy-null', status: 'active', is_visible: null as boolean | null },
  ]
  const eligibleRows = rows.filter(isWorkerVisibleInCompanySearch)
  const activeRows = eligibleRows.filter(worker => worker.status === 'active')
  const inactiveRows = eligibleRows.filter(worker => worker.status !== 'active')
  const combinedRows = [...activeRows, ...inactiveRows]

  assert.deepEqual(
    combinedRows.map(worker => worker.id),
    ['active-visible', 'legacy-null', 'inactive-visible'],
  )
  assert.equal(combinedRows.some(worker => worker.is_visible === false), false)
  assert.ok(companySearchSource.includes('.filter(isWorkerVisibleInCompanySearch)'))
})

test('admin-hidden false survives worker reconciliation', () => {
  const worker = {
    fullName: 'Synthetic Worker',
    city: 'Jaipur',
    categoryIds: ['category-welder'],
    profilePhotoPath: 'workers/synthetic/profile.png',
    identityProofType: 'other',
    identityProofNumber: 'QA-TEST',
    identityProofPath: 'workers/synthetic/identity.png',
    isVisible: false,
  }

  assert.equal(reconcileWorkerKycVisibility(worker.isVisible, worker, 'active'), false)
})

test('visibility exclusion stays server-side without changing company-search controls', () => {
  assert.ok(companySearchClientSource.includes("{ id: '', label: 'All Workers' }"))
  assert.ok(companySearchClientSource.includes("{ id: 'active', label: 'Active Workers' }"))
  assert.ok(companySearchClientSource.includes("{ id: 'inactive', label: 'Inactive Workers' }"))
  assert.ok(companySearchSource.includes("query.not('is_visible', 'is', false)"))
})
