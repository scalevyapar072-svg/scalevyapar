export type WorkerFilterSort = 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc'

export type WorkerFilterCriteria = {
  search: string
  companyId: string
  status: string
  availability: string
  categoryId: string
  industryCategory: string
  businessType: string
  dateFrom: string
  dateTo: string
  sort: WorkerFilterSort
  visibility: string
  kyc: string
}

export type WorkerFilterEntry<T> = {
  worker: T
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
  kycState: string
  searchValues?: Array<string | number | null | undefined>
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const isValidDateOnly = (value: string) => {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const validateWorkerRegistrationDateRange = (filters: Pick<WorkerFilterCriteria, 'dateFrom' | 'dateTo'>) => {
  const dateFrom = filters.dateFrom.trim()
  const dateTo = filters.dateTo.trim()

  if ((dateFrom && !isValidDateOnly(dateFrom)) || (dateTo && !isValidDateOnly(dateTo))) {
    return 'Enter a valid registration date.'
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return 'Registration From date must be on or before Registration To date.'
  }

  return ''
}

const formatDateOnlyParts = (year: number, month: number, day: number) =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const toLocalDateOnly = (value: string) => {
  const normalizedValue = value.trim()
  if (isValidDateOnly(normalizedValue)) return normalizedValue

  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return ''
  return formatDateOnlyParts(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export const toDateOnlyAtOffset = (value: string, offsetMinutes: number) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000)
  return formatDateOnlyParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate())
}

const normalizeMobile = (value: string) => value.replace(/\D/g, '').slice(-10)

const normalizeText = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase()

export const filterAndSortWorkerEntries = <T>(
  entries: WorkerFilterEntry<T>[],
  filters: WorkerFilterCriteria,
  options: { resolveDateOnly?: (value: string) => string } = {}
) => {
  const validationError = validateWorkerRegistrationDateRange(filters)
  if (validationError) return { workers: [] as T[], validationError }

  const search = normalizeText(filters.search)
  const exactSearchMobile = normalizeMobile(filters.search)
  const isExactMobileSearch = exactSearchMobile.length === 10
  const resolveDateOnly = options.resolveDateOnly || toLocalDateOnly

  const matchingEntries = entries.filter(entry => {
    const searchMatches = !search || (
      (isExactMobileSearch && normalizeMobile(entry.mobile) === exactSearchMobile)
      || [entry.fullName, entry.mobile, ...(entry.searchValues || [])]
        .some(value => normalizeText(value).includes(search))
    )
    if (!searchMatches) return false
    if (filters.companyId && entry.companyId !== filters.companyId) return false
    if (filters.status !== 'all' && entry.status !== filters.status) return false
    if (filters.availability !== 'all' && entry.availability !== filters.availability) return false
    if (filters.categoryId && !entry.categoryIds.includes(filters.categoryId)) return false
    if (filters.industryCategory && entry.industryCategory !== filters.industryCategory) return false
    if (filters.businessType && entry.businessType !== filters.businessType) return false
    if (filters.visibility === 'visible' && !entry.isVisible) return false
    if (filters.visibility === 'hidden' && entry.isVisible) return false
    if (filters.kyc !== 'all' && entry.kycState !== filters.kyc) return false

    if (filters.dateFrom || filters.dateTo) {
      const registrationDate = resolveDateOnly(entry.createdAt)
      if (!registrationDate) return false
      if (filters.dateFrom && registrationDate < filters.dateFrom) return false
      if (filters.dateTo && registrationDate > filters.dateTo) return false
    }

    return true
  })

  matchingEntries.sort((left, right) => {
    let comparison = 0
    if (filters.sort === 'name_asc') comparison = left.fullName.localeCompare(right.fullName)
    if (filters.sort === 'name_desc') comparison = right.fullName.localeCompare(left.fullName)
    if (filters.sort === 'created_asc') comparison = left.createdAt.localeCompare(right.createdAt)
    if (filters.sort === 'created_desc') comparison = right.createdAt.localeCompare(left.createdAt)
    return comparison || left.id.localeCompare(right.id)
  })

  return { workers: matchingEntries.map(entry => entry.worker), validationError: '' }
}

export const WORKER_RESULTS_PAGE_SIZES = [25, 50, 100, 500, 1_000] as const
export type WorkerResultsPageSize = (typeof WORKER_RESULTS_PAGE_SIZES)[number]

export const WORKER_RESULTS_PAGE_SIZE: WorkerResultsPageSize = WORKER_RESULTS_PAGE_SIZES[0]

export const paginateWorkerResults = <T>(items: T[], requestedPage: number, pageSize: number = WORKER_RESULTS_PAGE_SIZE) => {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Worker page size must be a positive integer.')

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    page,
    pageItems: items.slice(start, start + pageSize),
    pageSize,
    total: items.length,
    totalPages
  }
}

export const getWorkerPaginationBounds = (
  pagination: Pick<ReturnType<typeof paginateWorkerResults>, 'page' | 'pageSize' | 'total'>
) => ({
  from: pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1,
  to: Math.min(pagination.page * pagination.pageSize, pagination.total)
})

export const getWorkerPageSelectionIds = <T>(pageItems: T[], getId: (item: T) => string) =>
  [...new Set(pageItems.map(getId).filter(Boolean))]

export const getWorkerPageSelectionState = (selectedWorkerIds: string[], currentPageWorkerIds: string[]) => {
  const pageIds = [...new Set(currentPageWorkerIds.filter(Boolean))]
  const selectedIds = new Set(selectedWorkerIds)
  const selectedOnPage = pageIds.filter(workerId => selectedIds.has(workerId)).length

  return {
    checked: pageIds.length > 0 && selectedOnPage === pageIds.length,
    indeterminate: selectedOnPage > 0 && selectedOnPage < pageIds.length,
    selectedOnPage,
    totalOnPage: pageIds.length
  }
}

export const updateWorkerPageSelection = (
  selectedWorkerIds: string[],
  currentPageWorkerIds: string[],
  shouldSelect: boolean
) => {
  const selectedIds = [...new Set(selectedWorkerIds.filter(Boolean))]
  const pageIds = [...new Set(currentPageWorkerIds.filter(Boolean))]

  if (shouldSelect) return [...new Set([...selectedIds, ...pageIds])]

  const currentPageIdSet = new Set(pageIds)
  return selectedIds.filter(workerId => !currentPageIdSet.has(workerId))
}
