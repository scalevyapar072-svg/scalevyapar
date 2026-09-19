import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const searchPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'page.tsx'),
  'utf8',
)
const searchClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'labour-search-client.tsx'),
  'utf8',
)
const {
  compareWorkerGlobalOrderKeys,
  getWorkerGlobalOrderTier,
  shouldUseGlobalWorkerTierOrdering,
} = await import(
  pathToFileURL(
    path.join(workspaceRoot, 'lib', 'labour-worker-search-order.ts'),
  ).href
)

type FixtureWorker = {
  id: string
  categoryIds: string[]
  active: boolean
  eligibleCities: string[]
  eligible: boolean
  secondaryRank: number
  availabilityRank: number
  sourceRank: number
}

const jobCategoryIds = ['category-cutting-master', 'category-stitching-karigar']
const requiredJobCity = 'Jaipur'
const pageSize = 20

const makeWorkers = (
  prefix: string,
  count: number,
  input: Pick<
    FixtureWorker,
    'categoryIds' | 'active' | 'eligibleCities' | 'eligible' | 'secondaryRank' | 'availabilityRank'
  >,
  startRank: number,
) => Array.from({ length: count }, (_, index): FixtureWorker => ({
  id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
  sourceRank: startRank + index,
  ...input,
}))

const fixtures = [
  ...makeWorkers('tier-1-category-city-active', 24, {
    categoryIds: ['category-cutting-master'],
    active: true,
    eligibleCities: ['Ajmer', 'Jaipur'],
    eligible: true,
    secondaryRank: 0,
    availabilityRank: 2,
  }, 0),
  ...makeWorkers('tier-2-category-city-inactive', 9, {
    categoryIds: ['category-stitching-karigar'],
    active: false,
    eligibleCities: ['Jaipur'],
    eligible: true,
    secondaryRank: 0,
    availabilityRank: 0,
  }, 24),
  ...makeWorkers('tier-3-category-other-active', 17, {
    categoryIds: ['category-stitching-karigar'],
    active: true,
    eligibleCities: ['Ajmer'],
    eligible: true,
    secondaryRank: 1,
    availabilityRank: 1,
  }, 33),
  ...makeWorkers('tier-4-category-other-inactive', 8, {
    categoryIds: ['category-cutting-master'],
    active: false,
    eligibleCities: ['Ajmer'],
    eligible: true,
    secondaryRank: 1,
    availabilityRank: 0,
  }, 50),
  ...makeWorkers('tier-5-other-city-active', 22, {
    categoryIds: ['category-electrician'],
    active: true,
    eligibleCities: ['Jaipur'],
    eligible: true,
    secondaryRank: 2,
    availabilityRank: 2,
  }, 58),
  ...makeWorkers('tier-6-other-city-inactive', 7, {
    categoryIds: ['category-plumber'],
    active: false,
    eligibleCities: ['Jaipur'],
    eligible: true,
    secondaryRank: 3,
    availabilityRank: 0,
  }, 80),
  ...makeWorkers('tier-7-other-other-active', 16, {
    categoryIds: ['category-painter'],
    active: true,
    eligibleCities: ['Ajmer'],
    eligible: true,
    secondaryRank: 4,
    availabilityRank: 1,
  }, 87),
  ...makeWorkers('tier-8-other-other-inactive', 6, {
    categoryIds: ['category-welder'],
    active: false,
    eligibleCities: ['Ajmer'],
    eligible: true,
    secondaryRank: 5,
    availabilityRank: 0,
  }, 103),
  ...makeWorkers('filtered-out', 7, {
    categoryIds: ['category-cutting-master'],
    active: true,
    eligibleCities: ['Jaipur'],
    eligible: false,
    secondaryRank: 0,
    availabilityRank: 2,
  }, 109),
]

const isCategoryMatch = (worker: FixtureWorker) =>
  worker.categoryIds.some(categoryId => jobCategoryIds.includes(categoryId))
const isCityMatch = (worker: FixtureWorker) => worker.eligibleCities.includes(requiredJobCity)
const getTier = (worker: FixtureWorker) => getWorkerGlobalOrderTier({
  categoryMatch: isCategoryMatch(worker),
  cityMatch: isCityMatch(worker),
  active: worker.active,
})

const orderedWorkers = fixtures
  .filter(worker => worker.eligible)
  .map(worker => ({
    worker,
    key: {
      id: worker.id,
      categoryMatch: isCategoryMatch(worker),
      cityMatch: isCityMatch(worker),
      active: worker.active,
      secondaryRank: worker.secondaryRank,
      availabilityRank: worker.availabilityRank,
      sourceRank: worker.sourceRank,
    },
  }))
  .sort((left, right) => compareWorkerGlobalOrderKeys(left.key, right.key))
  .map(({ worker }) => worker)

const pages = Array.from(
  { length: Math.ceil(orderedWorkers.length / pageSize) },
  (_, index) => orderedWorkers.slice(index * pageSize, (index + 1) * pageSize),
)

test('the complete eligible set is ordered into all eight exact tiers before pagination', () => {
  const tiers = orderedWorkers.map(getTier)

  assert.deepEqual([...tiers].sort((left, right) => left - right), tiers)
  assert.deepEqual(
    Array.from({ length: 8 }, (_, tier) => tiers.filter(value => value === tier).length),
    [24, 9, 17, 8, 22, 7, 16, 6],
  )
})

test('the eight-tier order remains exact across every 20-worker page boundary', () => {
  assert.deepEqual(
    pages.map(page => page.map(getTier)),
    [
      Array(20).fill(0),
      [...Array(4).fill(0), ...Array(9).fill(1), ...Array(7).fill(2)],
      [...Array(10).fill(2), ...Array(8).fill(3), ...Array(2).fill(4)],
      Array(20).fill(4),
      [...Array(7).fill(5), ...Array(13).fill(6)],
      [...Array(3).fill(6), ...Array(6).fill(7)],
    ],
  )
})

test('matching any one of multiple selected-job category IDs counts as a category match', () => {
  assert.ok(orderedWorkers.some(worker => worker.categoryIds.includes('category-cutting-master') && isCategoryMatch(worker)))
  assert.ok(orderedWorkers.some(worker => worker.categoryIds.includes('category-stitching-karigar') && isCategoryMatch(worker)))
  assert.ok(orderedWorkers.every(worker =>
    isCategoryMatch(worker) === worker.categoryIds.some(categoryId => jobCategoryIds.includes(categoryId))
  ))
})

test('pagination contains every eligible worker exactly once', () => {
  const pageIds = pages.flat().map(worker => worker.id)
  assert.equal(pageIds.length, 109)
  assert.equal(new Set(pageIds).size, pageIds.length)
  assert.deepEqual(new Set(pageIds), new Set(fixtures.filter(worker => worker.eligible).map(worker => worker.id)))
})

test('filters run before ordering and pagination, and configured sort order remains a stable tie-breaker', () => {
  assert.equal(orderedWorkers.some(worker => worker.id.startsWith('filtered-out')), false)
  assert.match(searchPageSource, /applyWorkerFilters\(selectWorkerRows\(null, selectOptions\), filters, selectedCategoryIds\)/)
  assert.match(searchPageSource, /applyWorkerOrder\([\s\S]*filters\.sortBy,[\s\S]*Boolean\(jobContext\?\.globalTierOrder\)/)

  const tiedWorkers = [
    { id: 'source-third', categoryMatch: true, cityMatch: true, active: true, secondaryRank: 0, availabilityRank: 2, sourceRank: 2 },
    { id: 'source-first', categoryMatch: true, cityMatch: true, active: true, secondaryRank: 0, availabilityRank: 2, sourceRank: 0 },
    { id: 'source-second', categoryMatch: true, cityMatch: true, active: true, secondaryRank: 0, availabilityRank: 2, sourceRank: 1 },
  ].sort(compareWorkerGlobalOrderKeys)

  assert.deepEqual(tiedWorkers.map(worker => worker.id), ['source-first', 'source-second', 'source-third'])
})

test('existing relevance and availability tie-breakers remain stable within a tier', () => {
  const sameTier = [
    { id: 'less-relevant', categoryMatch: false, cityMatch: true, active: true, secondaryRank: 4, availabilityRank: 2, sourceRank: 0 },
    { id: 'available-week', categoryMatch: false, cityMatch: true, active: true, secondaryRank: 2, availabilityRank: 1, sourceRank: 1 },
    { id: 'available-today', categoryMatch: false, cityMatch: true, active: true, secondaryRank: 2, availabilityRank: 2, sourceRank: 2 },
  ].sort(compareWorkerGlobalOrderKeys)

  assert.deepEqual(sameTier.map(worker => worker.id), [
    'available-today',
    'available-week',
    'less-relevant',
  ])
})

test('missing, invalid, expired, and unauthorized job IDs preserve safe fallback ordering', () => {
  const base = {
    selectedJobId: 'job-live',
    selectedJobCompanyId: 'company-a',
    authenticatedCompanyId: 'company-a',
    selectedJobIsLive: true,
  }

  assert.equal(shouldUseGlobalWorkerTierOrdering({ ...base, requestedJobId: '' }), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering({ ...base, requestedJobId: 'job-invalid' }), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering({ ...base, requestedJobId: 'job-live', selectedJobIsLive: false }), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering({ ...base, requestedJobId: 'job-live', authenticatedCompanyId: 'company-b' }), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering({ ...base, requestedJobId: 'job-live' }), true)
})

test('another company private job ID cannot activate privileged matching on server or client', () => {
  assert.match(
    searchPageSource,
    /selectedJobCompanyId:\s*requestedJobPostCandidate\?\.company_id/,
  )
  assert.match(
    searchPageSource,
    /authenticatedCompanyId:\s*orderingCompany\?\.id/,
  )
  assert.match(
    searchClientSource,
    /selectedJobCompanyId:\s*requestedJobPost\?\.companyId/,
  )
  assert.match(
    searchClientSource,
    /authenticatedCompanyId:\s*accessCompany\?\.id/,
  )
  assert.match(searchClientSource, /initialRequestedJobAuthorized\s*&&\s*shouldUseGlobalWorkerTierOrdering/)
})

test('the existing eligible work-location rule determines required-city matching', () => {
  assert.match(searchPageSource, /cityMatch:\s*Boolean\([\s\S]*workerMatchesLocation\(worker, jobContext\.city\)/)
  assert.match(searchClientSource, /workerMatchesLocation\(worker, effectiveJobContext\.city\)/)
})

test('the globally ordered complete set is sliced only after ordering into 20-worker pages', () => {
  assert.ok(searchPageSource.indexOf('const orderedWorkers = await loadOrderedWorkerRows') < searchPageSource.indexOf('.slice(start, start + pageSize)'))
  assert.match(searchPageSource, /const SEARCH_PAGE_SIZE = 20/)
})

test('the worker ID remains the deterministic final tie-breaker', () => {
  const left = {
    id: 'worker-a',
    categoryMatch: true,
    cityMatch: true,
    active: true,
    secondaryRank: 0,
    availabilityRank: 2,
    sourceRank: 0,
  }
  const right = { ...left, id: 'worker-b' }
  assert.ok(compareWorkerGlobalOrderKeys(left, right) < 0)
})
