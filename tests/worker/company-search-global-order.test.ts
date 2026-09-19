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
  city: string
  eligible: boolean
  availabilityRank: number
  sourceRank: number
}

const jobCategoryIds = ['category-cutting-master', 'category-stitching-karigar']
const pageSize = 20

const makeWorkers = (
  prefix: string,
  count: number,
  input: Pick<FixtureWorker, 'categoryIds' | 'active' | 'city' | 'eligible' | 'availabilityRank'>,
  startRank: number,
) => Array.from({ length: count }, (_, index): FixtureWorker => ({
  id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
  sourceRank: startRank + index,
  ...input,
}))

const fixtures = [
  ...makeWorkers('match-active-jaipur', 22, {
    categoryIds: ['category-cutting-master'],
    active: true,
    city: 'Jaipur',
    eligible: true,
    availabilityRank: 2,
  }, 0),
  ...makeWorkers('match-active-ajmer', 9, {
    categoryIds: ['category-stitching-karigar'],
    active: true,
    city: 'Ajmer',
    eligible: true,
    availabilityRank: 1,
  }, 22),
  ...makeWorkers('match-inactive-jaipur', 14, {
    categoryIds: ['category-stitching-karigar'],
    active: false,
    city: 'Jaipur',
    eligible: true,
    availabilityRank: 0,
  }, 31),
  ...makeWorkers('other-active-jaipur', 31, {
    categoryIds: ['category-electrician'],
    active: true,
    city: 'Jaipur',
    eligible: true,
    availabilityRank: 2,
  }, 45),
  ...makeWorkers('other-active-ajmer', 12, {
    categoryIds: ['category-plumber'],
    active: true,
    city: 'Ajmer',
    eligible: true,
    availabilityRank: 1,
  }, 76),
  ...makeWorkers('other-inactive-jaipur', 17, {
    categoryIds: ['category-painter'],
    active: false,
    city: 'Jaipur',
    eligible: true,
    availabilityRank: 0,
  }, 88),
  ...makeWorkers('filtered-out', 7, {
    categoryIds: ['category-cutting-master'],
    active: true,
    city: 'Jaipur',
    eligible: false,
    availabilityRank: 2,
  }, 105),
]

const isCategoryMatch = (worker: FixtureWorker) =>
  worker.categoryIds.some(categoryId => jobCategoryIds.includes(categoryId))

const orderedWorkers = fixtures
  .filter(worker => worker.eligible)
  .map(worker => ({
    worker,
    key: {
      id: worker.id,
      categoryMatch: isCategoryMatch(worker),
      active: worker.active,
      secondaryRank: worker.city === 'Jaipur' ? 0 : 1,
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

test('the complete eligible set is ordered into the required four tiers before pagination', () => {
  const tiers = orderedWorkers.map(worker => getWorkerGlobalOrderTier({
    categoryMatch: isCategoryMatch(worker),
    active: worker.active,
  }))

  assert.deepEqual([...tiers].sort((left, right) => left - right), tiers)
  assert.deepEqual(
    [0, 1, 2, 3].map(tier => tiers.filter(value => value === tier).length),
    [31, 14, 43, 17],
  )
})

test('all matching active workers precede matching inactive workers', () => {
  const firstMatchingInactive = orderedWorkers.findIndex(worker => isCategoryMatch(worker) && !worker.active)
  const lastMatchingActive = orderedWorkers.findLastIndex(worker => isCategoryMatch(worker) && worker.active)
  assert.ok(lastMatchingActive < firstMatchingInactive)
})

test('all matching workers precede every other-category worker', () => {
  const lastMatch = orderedWorkers.findLastIndex(isCategoryMatch)
  const firstOther = orderedWorkers.findIndex(worker => !isCategoryMatch(worker))
  assert.equal(lastMatch + 1, firstOther)
})

test('page 1 contains no other-category worker while matches can fill it', () => {
  assert.equal(pages[0].length, pageSize)
  assert.ok(pages[0].every(isCategoryMatch))
})

test('matching workers continue on later pages without being displaced by other categories', () => {
  assert.ok(pages[1].some(isCategoryMatch))
  const firstOtherGlobalIndex = orderedWorkers.findIndex(worker => !isCategoryMatch(worker))
  assert.equal(firstOtherGlobalIndex, 45)
})

test('matching any one of multiple job category IDs is authoritative', () => {
  assert.ok(orderedWorkers.some(worker => worker.categoryIds.includes('category-cutting-master') && isCategoryMatch(worker)))
  assert.ok(orderedWorkers.some(worker => worker.categoryIds.includes('category-stitching-karigar') && isCategoryMatch(worker)))
  assert.ok(orderedWorkers.every(worker =>
    isCategoryMatch(worker) === worker.categoryIds.some(categoryId => jobCategoryIds.includes(categoryId))
  ))
})

test('location priority remains intact inside every tier', () => {
  for (const tier of [0, 1, 2, 3]) {
    const tierWorkers = orderedWorkers.filter(worker => getWorkerGlobalOrderTier({
      categoryMatch: isCategoryMatch(worker),
      active: worker.active,
    }) === tier)
    const firstOtherCity = tierWorkers.findIndex(worker => worker.city !== 'Jaipur')
    if (firstOtherCity === -1) continue
    assert.ok(tierWorkers.slice(firstOtherCity).every(worker => worker.city !== 'Jaipur'))
  }
})

test('availability priority remains intact inside every location/relevance group', () => {
  const mixedAvailability = [
    { id: 'available-week', categoryMatch: true, active: true, secondaryRank: 0, availabilityRank: 1, sourceRank: 0 },
    { id: 'unavailable', categoryMatch: true, active: true, secondaryRank: 0, availabilityRank: 0, sourceRank: 1 },
    { id: 'available-today', categoryMatch: true, active: true, secondaryRank: 0, availabilityRank: 2, sourceRank: 2 },
  ].sort(compareWorkerGlobalOrderKeys)

  assert.deepEqual(mixedAvailability.map(worker => worker.id), [
    'available-today',
    'available-week',
    'unavailable',
  ])
})

test('filters are applied before ordering and pagination', () => {
  assert.equal(orderedWorkers.length, 105)
  assert.equal(orderedWorkers.some(worker => worker.id.startsWith('filtered-out')), false)
  assert.equal(pages.length, 6)
})

test('page boundaries contain no duplicate or missing worker IDs', () => {
  const pageIds = pages.flat().map(worker => worker.id)
  assert.equal(new Set(pageIds).size, pageIds.length)
  assert.deepEqual(new Set(pageIds), new Set(fixtures.filter(worker => worker.eligible).map(worker => worker.id)))
})

test('missing and invalid job IDs preserve legacy ordering mode', () => {
  assert.equal(shouldUseGlobalWorkerTierOrdering('', 'job-live'), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering('job-invalid', undefined), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering('job-invalid', 'job-live'), false)
  assert.equal(shouldUseGlobalWorkerTierOrdering('job-live', 'job-live'), true)
})

test('a valid URL job ID is resolved server-side before worker pagination', () => {
  assert.match(
    searchPageSource,
    /jobPostRows\.find\(jobPost => jobPost\.id === requestedJobId && isLiveJobPost\(jobPost\)\)/,
  )
  assert.ok(searchPageSource.indexOf('const requestedLiveJobPost =') < searchPageSource.indexOf('await getPaginatedWorkers('))
  assert.match(searchPageSource, /\.slice\(start, start \+ pageSize\)/)
})

test('the worker ID is the deterministic final tie-breaker', () => {
  const left = { id: 'worker-a', categoryMatch: true, active: true, secondaryRank: 0, availabilityRank: 2, sourceRank: 0 }
  const right = { ...left, id: 'worker-b' }
  assert.ok(compareWorkerGlobalOrderKeys(left, right) < 0)
})
