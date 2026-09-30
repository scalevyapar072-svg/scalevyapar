import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { readCompleteAdminWorkerDataset } from '../lib/labour-worker-admin-dataset'
import { createAdminWorkerDatasetGetHandler } from '../lib/labour-worker-dataset-api'
import {
  filterAndSortWorkerEntries,
  getWorkerPageSelectionState,
  getWorkerPageSelectionIds,
  getWorkerPaginationBounds,
  paginateWorkerResults,
  toDateOnlyAtOffset,
  updateWorkerPageSelection,
  WORKER_RESULTS_PAGE_SIZES,
  type WorkerFilterCriteria,
  type WorkerFilterEntry
} from '../lib/labour-worker-filters'
import { getWorkerKycReviewState } from '../lib/worker-kyc-completeness'

type TestWorker = {
  id: string
  fullName: string
  mobile: string
  createdAt: string
  companyId: string
  status: string
  availability: string
  categoryIds: string[]
  industryCategory: string
  businessType: string
  isVisible: boolean
  city: string
  profilePhotoPath: string
  identityProofType: string
  identityProofNumber: string
  identityProofPath: string
  kycStatus: string
}

const worker = (id: string, overrides: Partial<TestWorker> = {}): TestWorker => ({
  id,
  fullName: `Worker ${id}`,
  mobile: `90000${id.replace(/\D/g, '').padStart(5, '0').slice(-5)}`,
  createdAt: '2026-09-15T10:00:00.000Z',
  companyId: 'company-a',
  status: 'active',
  availability: 'available_today',
  categoryIds: ['category-a'],
  industryCategory: 'industry-a',
  businessType: 'business-a',
  isVisible: true,
  city: 'Surat',
  profilePhotoPath: `workers/${id}/profile.jpg`,
  identityProofType: 'aadhaar',
  identityProofNumber: 'XXXX-1234',
  identityProofPath: `workers/${id}/identity.pdf`,
  kycStatus: 'approved',
  ...overrides
})

const entry = (value: TestWorker): WorkerFilterEntry<TestWorker> => ({
  worker: value,
  id: value.id,
  fullName: value.fullName,
  mobile: value.mobile,
  createdAt: value.createdAt,
  companyId: value.companyId,
  status: value.status,
  availability: value.availability,
  categoryIds: value.categoryIds,
  industryCategory: value.industryCategory,
  businessType: value.businessType,
  isVisible: value.isVisible,
  kycState: getWorkerKycReviewState(value),
  searchValues: [value.city, value.status, value.industryCategory, value.businessType]
})

const filters = (overrides: Partial<WorkerFilterCriteria> = {}): WorkerFilterCriteria => ({
  search: '',
  companyId: '',
  status: 'all',
  availability: 'all',
  categoryId: '',
  industryCategory: '',
  businessType: '',
  dateFrom: '',
  dateTo: '',
  sort: 'name_asc',
  visibility: 'all',
  kyc: 'all',
  ...overrides
})

const idsFor = (workers: TestWorker[], criteria: WorkerFilterCriteria) =>
  filterAndSortWorkerEntries(workers.map(entry), criteria).workers.map(item => item.id)

test('every Workers filter independently narrows the dataset', () => {
  const alpha = worker('1', { fullName: 'Alpha Tailor', mobile: '9876543210' })
  const target = worker('2', {
    fullName: 'Bravo Plumber',
    mobile: '9123456789',
    companyId: 'company-b',
    status: 'blocked',
    availability: 'not_available',
    categoryIds: ['category-b'],
    industryCategory: 'industry-b',
    businessType: 'business-b',
    isVisible: false,
    city: 'Pune',
    kycStatus: 'rejected'
  })
  const rows = [alpha, target]
  const cases: Array<[string, Partial<WorkerFilterCriteria>]> = [
    ['name search', { search: 'Bravo' }],
    ['mobile search', { search: '9123456789' }],
    ['company', { companyId: 'company-b' }],
    ['status', { status: 'blocked' }],
    ['availability', { availability: 'not_available' }],
    ['category', { categoryId: 'category-b' }],
    ['industry', { industryCategory: 'industry-b' }],
    ['business type', { businessType: 'business-b' }],
    ['visibility', { visibility: 'hidden' }],
    ['KYC', { kyc: 'rejected' }]
  ]

  for (const [label, selected] of cases) {
    assert.deepEqual(idsFor(rows, filters(selected)), ['2'], label)
  }
})

test('multiple Workers filters compose with AND semantics', () => {
  const rows = [
    worker('1', { fullName: 'Ravi Electrician', companyId: 'company-b', status: 'active', isVisible: true }),
    worker('2', { fullName: 'Ravi Plumber', companyId: 'company-b', status: 'blocked', isVisible: false }),
    worker('3', { fullName: 'Ravi Painter', companyId: 'company-a', status: 'blocked', isVisible: false })
  ]

  assert.deepEqual(idsFor(rows, filters({
    search: 'Ravi',
    companyId: 'company-b',
    status: 'blocked',
    visibility: 'hidden'
  })), ['2'])
})

test('exact-mobile search does not bypass another selected filter', () => {
  const rows = [worker('1', { mobile: '9876543210', status: 'active', isVisible: true })]

  assert.deepEqual(idsFor(rows, filters({ search: '9876543210', status: 'blocked' })), [])
  assert.deepEqual(idsFor(rows, filters({ search: '9876543210', visibility: 'hidden' })), [])
  assert.deepEqual(idsFor(rows, filters({ search: '+91 98765 43210', status: 'active', visibility: 'visible' })), ['1'])
})

test('Ready for Review stays derived from the shared KYC evaluator beyond row 1,000', () => {
  const rows = Array.from({ length: 1_005 }, (_, index) => worker(String(index + 1), {
    kycStatus: index === 1_002 ? 'pending_review' : 'approved'
  }))

  assert.deepEqual(idsFor(rows, filters({ kyc: 'ready_for_review' })), ['1003'])
})

test('registration From, To and combined bounds are inclusive date-only filters', () => {
  const rows = [
    worker('1', { createdAt: '2026-09-30T18:29:59.999Z' }),
    worker('2', { createdAt: '2026-09-30T18:30:00.000Z' }),
    worker('3', { createdAt: '2026-10-01T18:29:59.999Z' }),
    worker('4', { createdAt: '2026-10-01T18:30:00.000Z' })
  ].map(entry)
  const run = (criteria: WorkerFilterCriteria) => filterAndSortWorkerEntries(rows, criteria, {
    resolveDateOnly: value => toDateOnlyAtOffset(value, 330)
  }).workers.map(item => item.id)

  assert.deepEqual(run(filters({ dateFrom: '2026-10-01' })), ['2', '3', '4'])
  assert.deepEqual(run(filters({ dateTo: '2026-10-01' })), ['1', '2', '3'])
  assert.deepEqual(run(filters({ dateFrom: '2026-10-01', dateTo: '2026-10-01' })), ['2', '3'])
})

test('date-only conversion honors the selected timezone boundary without browser UTC drift', () => {
  assert.equal(toDateOnlyAtOffset('2026-09-30T18:29:59.999Z', 330), '2026-09-30')
  assert.equal(toDateOnlyAtOffset('2026-09-30T18:30:00.000Z', 330), '2026-10-01')
  assert.equal(toDateOnlyAtOffset('2026-10-01T05:29:59.999Z', -300), '2026-10-01')
  assert.equal(toDateOnlyAtOffset('2026-10-01T04:59:59.999Z', -300), '2026-09-30')
})

test('reversed registration dates return a friendly validation error and no misleading rows', () => {
  const result = filterAndSortWorkerEntries([entry(worker('1'))], filters({
    dateFrom: '2026-10-02',
    dateTo: '2026-10-01'
  }))

  assert.equal(result.validationError, 'Registration From date must be on or before Registration To date.')
  assert.deepEqual(result.workers, [])
})

test('clearing either registration date restores normal one-sided filtering', () => {
  const rows = [
    worker('1', { createdAt: '2026-09-30T10:00:00.000Z' }),
    worker('2', { createdAt: '2026-10-01T10:00:00.000Z' })
  ]

  assert.deepEqual(idsFor(rows, filters({ dateFrom: '', dateTo: '2026-09-30' })), ['1'])
  assert.deepEqual(idsFor(rows, filters({ dateFrom: '2026-10-01', dateTo: '' })), ['2'])
  assert.deepEqual(idsFor(rows, filters({ dateFrom: '', dateTo: '' })), ['1', '2'])
})

test('bounded range retrieval reads a complete dataset larger than 1,000 rows', async () => {
  const source = Array.from({ length: 1_205 }, (_, index) => ({ id: `worker-${index + 1}` }))
  const ranges: Array<[number, number]> = []
  const result = await readCompleteAdminWorkerDataset(async (from, to) => {
    ranges.push([from, to])
    return source.slice(from, to + 1)
  }, 500)

  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]])
  assert.equal(result.length, 1_205)
  assert.equal(new Set(result.map(item => item.id)).size, 1_205)
  assert.deepEqual(result, source)
})

test('deterministic Workers pagination has no duplicates or omissions', () => {
  const rows = Array.from({ length: 1_007 }, (_, index) => worker(String(index + 1).padStart(4, '0')))
  const ordered = filterAndSortWorkerEntries(rows.map(entry), filters({ sort: 'created_asc' })).workers
  const collected: string[] = []
  const firstPage = paginateWorkerResults(ordered, 1, 37)

  for (let page = 1; page <= firstPage.totalPages; page += 1) {
    collected.push(...paginateWorkerResults(ordered, page, 37).pageItems.map(item => item.id))
  }

  assert.equal(collected.length, 1_007)
  assert.equal(new Set(collected).size, 1_007)
  assert.deepEqual(collected, ordered.map(item => item.id))
})

test('supported Workers page sizes report correct totals and final partial pages', () => {
  assert.deepEqual([...WORKER_RESULTS_PAGE_SIZES], [25, 50, 100, 500, 1_000])

  const rows = Array.from({ length: 1_205 }, (_, index) => worker(String(index + 1).padStart(4, '0')))
  for (const pageSize of WORKER_RESULTS_PAGE_SIZES) {
    const firstPage = paginateWorkerResults(rows, 1, pageSize)
    const lastPage = paginateWorkerResults(rows, firstPage.totalPages, pageSize)
    const bounds = getWorkerPaginationBounds(lastPage)
    const expectedLastPageSize = rows.length - (firstPage.totalPages - 1) * pageSize

    assert.equal(firstPage.pageSize, pageSize)
    assert.equal(firstPage.pageItems.length, Math.min(pageSize, rows.length))
    assert.equal(firstPage.totalPages, Math.ceil(rows.length / pageSize))
    assert.equal(lastPage.pageItems.length, expectedLastPageSize)
    assert.deepEqual(bounds, {
      from: rows.length - expectedLastPageSize + 1,
      to: rows.length
    })
  }
})

test('every supported Workers page size paginates without duplicate or missing IDs', () => {
  const rows = Array.from({ length: 1_237 }, (_, index) => worker(String(index + 1).padStart(4, '0')))

  for (const pageSize of WORKER_RESULTS_PAGE_SIZES) {
    const firstPage = paginateWorkerResults(rows, 1, pageSize)
    const collected = Array.from({ length: firstPage.totalPages }, (_, index) =>
      paginateWorkerResults(rows, index + 1, pageSize).pageItems
    ).flat()

    assert.equal(collected.length, rows.length, `page size ${pageSize}`)
    assert.equal(new Set(collected.map(item => item.id)).size, rows.length, `page size ${pageSize}`)
    assert.deepEqual(collected.map(item => item.id), rows.map(item => item.id), `page size ${pageSize}`)
  }
})

test('Select this page returns only IDs visible on that result page', () => {
  const rows = Array.from({ length: 70 }, (_, index) => worker(String(index + 1).padStart(2, '0')))
  const page = paginateWorkerResults(rows, 2, 25)

  assert.deepEqual(getWorkerPageSelectionIds(page.pageItems, item => item.id), rows.slice(25, 50).map(item => item.id))

  const pageSource = readFileSync(new URL('../app/admin/labour/page.tsx', import.meta.url), 'utf8')
  assert.match(pageSource, /getWorkerPageSelectionIds\(visibleWorkers, worker => worker\.id\)/)
  assert.match(pageSource, /visibleWorkers\.map\(worker =>/)
  assert.doesNotMatch(pageSource, /currentPageWorkerIds = filteredWorkers\.map/)
})

test('page-level Select All exposes unchecked, indeterminate and checked states', () => {
  const pageIds = ['worker-1', 'worker-2', 'worker-3']

  assert.deepEqual(getWorkerPageSelectionState([], pageIds), {
    checked: false,
    indeterminate: false,
    selectedOnPage: 0,
    totalOnPage: 3
  })
  assert.deepEqual(getWorkerPageSelectionState(['worker-2'], pageIds), {
    checked: false,
    indeterminate: true,
    selectedOnPage: 1,
    totalOnPage: 3
  })
  assert.deepEqual(getWorkerPageSelectionState(pageIds, pageIds), {
    checked: true,
    indeterminate: false,
    selectedOnPage: 3,
    totalOnPage: 3
  })
})

test('page-level Select All changes only current-page selections', () => {
  const selected = ['off-page-before', 'worker-2', 'off-page-after']
  const pageIds = ['worker-1', 'worker-2', 'worker-3']

  assert.deepEqual(
    updateWorkerPageSelection(selected, pageIds, true),
    ['off-page-before', 'worker-2', 'off-page-after', 'worker-1', 'worker-3']
  )
  assert.deepEqual(
    updateWorkerPageSelection(selected, pageIds, false),
    ['off-page-before', 'off-page-after']
  )
})

test('page-level Select All selects exactly the displayed count for every supported page size', () => {
  const rows = Array.from({ length: 1_205 }, (_, index) => worker(`worker-${index + 1}`))

  for (const pageSize of WORKER_RESULTS_PAGE_SIZES) {
    const page = paginateWorkerResults(rows, 1, pageSize)
    const pageIds = getWorkerPageSelectionIds(page.pageItems, item => item.id)
    const selected = updateWorkerPageSelection([], pageIds, true)

    assert.equal(selected.length, page.pageItems.length, `page size ${pageSize}`)
    assert.deepEqual(selected, page.pageItems.map(item => item.id), `page size ${pageSize}`)
  }
})

test('Workers UI clears stale selections for filters, sorting, page and page-size changes', () => {
  const pageSource = readFileSync(new URL('../app/admin/labour/page.tsx', import.meta.url), 'utf8')

  assert.match(pageSource, /setWorkerPage\(1\)\s+setSelectedWorkerIds\(\[\]\)[\s\S]*workerFilters\.sort,[\s\S]*workerPageSize/)
  assert.match(pageSource, /const changeWorkerPage = \(nextPage: number\) => \{\s+setWorkerPage\(nextPage\)\s+setSelectedWorkerIds\(\[\]\)/)
  assert.match(pageSource, /const changeWorkerPageSize = \(nextPageSize: WorkerResultsPageSize\) => \{\s+setWorkerPageSize\(nextPageSize\)\s+setWorkerPage\(1\)\s+setSelectedWorkerIds\(\[\]\)/)
  assert.match(pageSource, /aria-label="Select all on this page"/)
  assert.match(pageSource, /element\.indeterminate = workerPageSelectionState\.indeterminate/)
  assert.match(pageSource, /checked=\{workerPageSelectionState\.checked\}/)
  assert.match(pageSource, /<span>Rows per page<\/span>/)
  assert.doesNotMatch(pageSource, /Select all matching/i)
})

test('complete Workers endpoint rejects unauthenticated and non-Admin requests before loading data', async () => {
  for (const status of [401, 403]) {
    let loadCount = 0
    const handler = createAdminWorkerDatasetGetHandler({
      authorize: async () => Response.json({ error: 'Forbidden' }, { status }),
      loadWorkers: async () => {
        loadCount += 1
        return [{ id: 'worker-1' }]
      }
    })

    const response = await handler(new Request('http://localhost/api/admin/labour/workers'))
    assert.equal(response.status, status)
    assert.equal(loadCount, 0)
  }
})

test('complete Workers endpoint returns the authorized dataset and count', async () => {
  const handler = createAdminWorkerDatasetGetHandler({
    authorize: async () => ({ email: 'admin@example.com' }),
    loadWorkers: async () => [{ id: 'worker-1' }, { id: 'worker-2' }]
  })
  const response = await handler(new Request('http://localhost/api/admin/labour/workers'))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    workers: [{ id: 'worker-1' }, { id: 'worker-2' }],
    count: 2
  })
})
