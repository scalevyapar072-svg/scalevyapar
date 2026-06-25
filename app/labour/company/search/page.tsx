import { headers } from 'next/headers'
import { CompanySiteShell } from '../company-site-shell'
import { LabourSearchClient } from './labour-search-client'
import { getCurrentUser } from '@/lib/auth'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { filterCategoriesByLabourDependency, getVisibleLabourMasterOptions, resolveLabourMasterLabel } from '@/lib/labour-masters-schema'
import type { LabourCategoryDependency, LabourMasterOption } from '@/lib/labour-masters-schema'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const WORKER_UPLOAD_BUCKET = 'labour-worker-files'
const SEARCH_PAGE_SIZE = 20

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase()
const normalizeValue = (value: string) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '-')

type PageProps = {
  searchParams: Promise<{
    jobId?: string
    jobPostId?: string
    q?: string
    search?: string
    city?: string
    industryCategory?: string
    industry?: string
    businessType?: string
    business?: string
    category?: string
    availability?: string
    workerStatus?: string
    experience?: string
    wage?: string
    sort?: string
    page?: string
  }>
}

type CategoryRow = {
  id: string
  name: string
  is_active: boolean | null
}

type CompanyRow = {
  id: string
  company_name: string
  contact_person: string
  email: string
  city: string | null
  status: string | null
  industry_category?: string | null
  business_type?: string | null
  category_ids?: string[] | null
}

type JobPostRow = {
  id: string
  company_id: string
  title: string
  city: string | null
  category_id: string
  status: string | null
  created_at: string
  published_at: string | null
  expires_at: string | null
}

type WorkerRow = {
  id: string
  full_name: string
  mobile: string
  city: string | null
  home_city: string | null
  address: string | null
  profile_photo_path: string | null
  skills: string[] | null
  experience_years: number | null
  salary_type: string | null
  expected_daily_wage: number | null
  status: string | null
  availability: string | null
  is_visible: boolean | null
  active_plan: string | null
  plan_valid_until: string | null
  category_ids: string[] | null
  identity_proof_type: string | null
  identity_proof_number: string | null
  identity_proof_path: string | null
  created_at: string
}

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

type WorkerSearchResult = {
  rows: WorkerRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

type EffectiveWorkerRow = WorkerRow & {
  effectiveStatus: SearchableWorkerStatus
  effectiveAvailability: string
}

type WorkerBucket = {
  id: string
  label: string
  includeCategoryIds?: string[]
  excludeCategoryIds?: string[]
  city?: string
  cityMode?: 'only' | 'exclude'
}

type WorkerSegment = {
  id: string
  label: string
  bucket: WorkerBucket | null
  statuses: readonly string[]
}

type JobContextBucketInput = {
  categoryIds: string[]
  businessCategoryIds: string[]
  industryCategoryIds: string[]
  city: string
}

type SupabaseQuery = any

const SEARCHABLE_WORKER_STATUSES = [
  'active',
  'inactive_wallet_empty',
  'inactive_subscription_expired',
  'inactive_paused_by_worker'
] as const

const ACTIVE_SEARCHABLE_WORKER_STATUSES = ['active'] as const
const INACTIVE_SEARCHABLE_WORKER_STATUSES = SEARCHABLE_WORKER_STATUSES.filter(
  status => !ACTIVE_SEARCHABLE_WORKER_STATUSES.includes(status as (typeof ACTIVE_SEARCHABLE_WORKER_STATUSES)[number])
)

type SearchableWorkerStatus = (typeof SEARCHABLE_WORKER_STATUSES)[number]

const getSignedWorkerFileUrl = async (storagePath: string) => {
  const trimmedPath = String(storagePath || '').trim()
  if (!trimmedPath) return ''
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath
  }

  const { data, error } = await supabaseAdmin.storage
    .from(WORKER_UPLOAD_BUCKET)
    .createSignedUrl(trimmedPath, 60 * 60 * 6)

  if (error || !data?.signedUrl) {
    return ''
  }

  return data.signedUrl
}

const getFirstString = (...values: Array<string | undefined>) =>
  values.map(value => String(value || '').trim()).find(Boolean) || ''

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const buildFilters = (params: Awaited<PageProps['searchParams']>): SearchFilters => ({
  search: getFirstString(params.q, params.search),
  city: getFirstString(params.city),
  industryCategory: getFirstString(params.industryCategory, params.industry),
  businessType: getFirstString(params.businessType, params.business),
  category: getFirstString(params.category),
  availability: getFirstString(params.availability),
  workerStatus: getFirstString(params.workerStatus),
  experience: getFirstString(params.experience),
  wage: getFirstString(params.wage),
  sortBy: getFirstString(params.sort) || 'relevance',
  page: parsePositiveInt(params.page, 1)
})

const getWorkerStatusesForFilter = (workerStatus: string): readonly string[] => {
  const normalized = normalizeValue(workerStatus)

  if (normalized === 'active') return ACTIVE_SEARCHABLE_WORKER_STATUSES
  if (normalized === 'inactive') return INACTIVE_SEARCHABLE_WORKER_STATUSES

  return SEARCHABLE_WORKER_STATUSES
}

const SEARCHABLE_WORKER_STATUS_SET = new Set<string>(SEARCHABLE_WORKER_STATUSES)

const normalizeSearchableWorkerStatus = (value: string | null | undefined): SearchableWorkerStatus => {
  const normalized = normalizeValue(value || '')
  if (SEARCHABLE_WORKER_STATUS_SET.has(normalized)) {
    return normalized as SearchableWorkerStatus
  }

  return 'inactive_subscription_expired'
}

const isActiveWorkerStatus = (status: string) => normalizeValue(status) === 'active'

const isWorkerPlanExpired = (worker: Pick<WorkerRow, 'plan_valid_until'>) => {
  const expiryValue = String(worker.plan_valid_until || '').trim()
  if (!expiryValue) return true

  const expiresAt = new Date(expiryValue)
  if (Number.isNaN(expiresAt.getTime())) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

const getEffectiveWorkerStatus = (worker: WorkerRow): SearchableWorkerStatus => {
  const rawStatus = normalizeSearchableWorkerStatus(worker.status)
  if (rawStatus !== 'active') {
    return rawStatus
  }

  if (worker.is_visible === false) {
    return 'inactive_subscription_expired'
  }

  if (!String(worker.active_plan || '').trim()) {
    return 'inactive_subscription_expired'
  }

  if (isWorkerPlanExpired(worker)) {
    return 'inactive_subscription_expired'
  }

  return 'active'
}

const getEffectiveWorkerAvailability = (worker: WorkerRow, effectiveStatus: SearchableWorkerStatus) =>
  effectiveStatus === 'active' ? (worker.availability || 'available_today') : 'not_available'

const matchesEffectiveWorkerStatusFilter = (effectiveStatus: SearchableWorkerStatus, workerStatusFilter: string) => {
  const normalized = normalizeValue(workerStatusFilter)
  if (normalized === 'active') return effectiveStatus === 'active'
  if (normalized === 'inactive') return effectiveStatus !== 'active'
  return SEARCHABLE_WORKER_STATUS_SET.has(effectiveStatus)
}

const matchesEffectiveAvailabilityFilter = (effectiveAvailability: string, availabilityFilter: string) => {
  const normalizedFilter = normalizeValue(availabilityFilter)
  if (!normalizedFilter) return true
  return normalizeValue(effectiveAvailability) === normalizedFilter
}

const isExpiredJobPost = (jobPost: { status: string | null | undefined; expires_at?: string | null; expiresAt?: string | null }) => {
  const normalizedStatus = normalizeValue(jobPost.status || '')
  if (normalizedStatus === 'expired') return true

  const expiryValue = String(jobPost.expires_at || jobPost.expiresAt || '').trim()
  if (!expiryValue) return false

  const expiresAt = new Date(expiryValue)
  if (Number.isNaN(expiresAt.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

const isLiveJobPost = (jobPost: { status: string | null | undefined; expires_at?: string | null; expiresAt?: string | null }) =>
  normalizeValue(jobPost.status || '') === 'live' && !isExpiredJobPost(jobPost)

const arrayLiteral = (values: string[]) => `{${values.map(value => `"${String(value).replace(/"/g, '\\"')}"`).join(',')}}`
const uniqueValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)))
const withoutValues = (values: string[], excluded: string[]) => {
  const excludedKeys = new Set(excluded.map(normalizeValue))
  return values.filter(value => !excludedKeys.has(normalizeValue(value)))
}
const sanitizePostgrestValue = (value: string) => String(value || '').replace(/,/g, ' ').trim()
const formatCategoryIdLabel = (categoryId: string) => {
  const trimmed = String(categoryId || '').trim()
  const withoutPrefix = trimmed.replace(/^cat[-_]/i, '')
  const readable = withoutPrefix
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
    .trim()

  return readable || trimmed
}

const getCategoryIdsForFilter = (categories: CategoryRow[], value: string) => {
  const normalized = normalizeValue(value)
  if (!normalized) return []

  return categories
    .filter(category => normalizeValue(category.id) === normalized || normalizeValue(category.name) === normalized)
    .map(category => category.id)
}

const getMasterOptionIdsForValue = (options: LabourMasterOption[], value: string) => {
  const normalized = normalizeValue(value)
  if (!normalized) return []

  return options
    .filter(option => {
      const candidates = [option.id, option.value, option.slug, option.label]
      return candidates.some(candidate => normalizeValue(candidate) === normalized)
    })
    .map(option => option.id)
}

const getCategoryIdsForMasterDependencies = (
  categoryDependencies: LabourCategoryDependency[],
  businessTypeOptionIds: string[],
  industryCategoryOptionIds: string[]
) => {
  const businessTypeIds = new Set(businessTypeOptionIds.map(normalizeValue))
  const industryCategoryIds = new Set(industryCategoryOptionIds.map(normalizeValue))

  return uniqueValues(
    categoryDependencies
      .filter(dependency => {
        if (!dependency.isActive) return false
        const matchesBusiness = businessTypeIds.size > 0 && businessTypeIds.has(normalizeValue(dependency.businessTypeOptionId))
        const matchesIndustry = industryCategoryIds.size > 0 && industryCategoryIds.has(normalizeValue(dependency.industryCategoryOptionId))
        return matchesBusiness || matchesIndustry
      })
      .map(dependency => dependency.categoryId)
  )
}

const buildSearchCategoryOptions = (
  categories: CategoryRow[],
  categoryDependencies: LabourCategoryDependency[]
) => {
  const byId = new Map<string, CategoryRow>()

  categories
    .filter(category => category.is_active)
    .forEach(category => {
      byId.set(category.id, {
        id: category.id,
        name: category.name,
        is_active: true
      })
    })

  categoryDependencies
    .filter(dependency => dependency.isActive && dependency.categoryId)
    .forEach(dependency => {
      if (byId.has(dependency.categoryId)) return

      byId.set(dependency.categoryId, {
        id: dependency.categoryId,
        name: formatCategoryIdLabel(dependency.categoryId),
        is_active: true
      })
    })

  return Array.from(byId.values())
}

const applyWorkerFilters = (
  query: SupabaseQuery,
  filters: SearchFilters,
  selectedCategoryIds: string[],
  statuses: readonly string[] = SEARCHABLE_WORKER_STATUSES
) => {
  let nextQuery = statuses.length ? query.in('status', [...statuses]) : query

  if (filters.search) {
    const escaped = filters.search.replace(/[%_]/g, value => `\\${value}`)
    nextQuery = nextQuery.or([
      `full_name.ilike.%${escaped}%`,
      `city.ilike.%${escaped}%`,
      `home_city.ilike.%${escaped}%`,
      `address.ilike.%${escaped}%`
    ].join(','))
  }

  if (filters.city) {
    nextQuery = nextQuery.or(`city.ilike.${filters.city},home_city.ilike.${filters.city}`)
  }

  if (selectedCategoryIds.length > 0) {
    nextQuery = nextQuery.overlaps('category_ids', selectedCategoryIds)
  }

  switch (filters.experience) {
    case '0-1':
      nextQuery = nextQuery.lt('experience_years', 2)
      break
    case '2-4':
      nextQuery = nextQuery.gte('experience_years', 2).lt('experience_years', 5)
      break
    case '5+':
      nextQuery = nextQuery.gte('experience_years', 5)
      break
  }

  switch (filters.wage) {
    case 'under-600':
      nextQuery = nextQuery.lte('expected_daily_wage', 600)
      break
    case '601-900':
      nextQuery = nextQuery.gt('expected_daily_wage', 600).lte('expected_daily_wage', 900)
      break
    case '901-1200':
      nextQuery = nextQuery.gt('expected_daily_wage', 900).lte('expected_daily_wage', 1200)
      break
    case '1200-plus':
      nextQuery = nextQuery.gt('expected_daily_wage', 1200)
      break
  }

  return nextQuery
}

const applyWorkerOrder = (query: SupabaseQuery, sortBy: string) => {
  const nextQuery = query

  switch (sortBy) {
    case 'name-asc':
      return nextQuery
        .order('full_name', { ascending: true })
        .order('created_at', { ascending: false })
    case 'name-desc':
      return nextQuery
        .order('full_name', { ascending: false })
        .order('created_at', { ascending: false })
    case 'newest':
      return nextQuery.order('created_at', { ascending: false })
    case 'wage-asc':
      return nextQuery
        .order('expected_daily_wage', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
    case 'wage-desc':
      return nextQuery
        .order('expected_daily_wage', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
    default:
      return nextQuery
        .order('experience_years', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
  }
}

const selectWorkerRows = (count: 'exact' | null = null) =>
  supabaseAdmin
    .from('labour_workers')
    .select(
      [
        'id',
        'full_name',
        'mobile',
        'city',
        'home_city',
        'address',
        'profile_photo_path',
        'skills',
        'experience_years',
        'salary_type',
        'expected_daily_wage',
        'status',
        'availability',
        'is_visible',
        'active_plan',
        'plan_valid_until',
        'category_ids',
        'identity_proof_type',
        'identity_proof_number',
        'identity_proof_path',
        'created_at'
      ].join(','),
      count ? { count } : undefined
    )

const getWorkerCount = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  statuses: readonly string[] = SEARCHABLE_WORKER_STATUSES
) => {
  const { count, error } = await applyWorkerFilters(
    supabaseAdmin.from('labour_workers').select('id', { count: 'exact', head: true }),
    filters,
    selectedCategoryIds,
    statuses
  )

  if (error) {
    throw new Error(`Failed to count workers: ${error.message}`)
  }

  return count || 0
}

const fetchWorkerRange = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  rangeStart: number,
  rangeEnd: number,
  statuses: readonly string[] = SEARCHABLE_WORKER_STATUSES,
  options: {
    matchingCategoryIds?: string[]
    excludeCategoryIds?: string[]
  } = {}
) => {
  let query = applyWorkerFilters(selectWorkerRows(), filters, selectedCategoryIds, statuses)

  if (options.matchingCategoryIds?.length) {
    query = query.overlaps('category_ids', options.matchingCategoryIds)
  }

  if (options.excludeCategoryIds?.length) {
    query = query.not('category_ids', 'ov', arrayLiteral(options.excludeCategoryIds))
  }

  const { data, error } = await applyWorkerOrder(query, filters.sortBy).range(rangeStart, rangeEnd)

  if (error) {
    throw new Error(`Failed to load workers: ${error.message}`)
  }

  return (data || []) as WorkerRow[]
}

const applyWorkerBucket = (query: SupabaseQuery, bucket: WorkerBucket) => {
  let nextQuery = query

  if (bucket.includeCategoryIds?.length) {
    nextQuery = nextQuery.overlaps('category_ids', bucket.includeCategoryIds)
  }

  if (bucket.excludeCategoryIds?.length) {
    nextQuery = nextQuery.not('category_ids', 'ov', arrayLiteral(bucket.excludeCategoryIds))
  }

  if (bucket.city && bucket.cityMode) {
    const cityValue = sanitizePostgrestValue(bucket.city)
    if (cityValue && bucket.cityMode === 'only') {
      nextQuery = nextQuery.or(`city.ilike.${cityValue},home_city.ilike.${cityValue}`)
    }
    if (cityValue && bucket.cityMode === 'exclude') {
      nextQuery = nextQuery
        .or(`city.not.ilike.${cityValue},city.is.null`)
        .or(`home_city.not.ilike.${cityValue},home_city.is.null`)
    }
  }

  return nextQuery
}

const getWorkerBucketCount = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  bucket: WorkerBucket,
  statuses: readonly string[] = SEARCHABLE_WORKER_STATUSES
) => {
  if (bucket.includeCategoryIds && bucket.includeCategoryIds.length === 0) return 0

  const { count, error } = await applyWorkerBucket(
    applyWorkerFilters(
      supabaseAdmin.from('labour_workers').select('id', { count: 'exact', head: true }),
      filters,
      selectedCategoryIds,
      statuses
    ),
    bucket
  )

  if (error) {
    throw new Error(`Failed to count ${bucket.label} workers: ${error.message}`)
  }

  return count || 0
}

const fetchWorkerBucketRange = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  bucket: WorkerBucket,
  rangeStart: number,
  rangeEnd: number,
  statuses: readonly string[] = SEARCHABLE_WORKER_STATUSES
) => {
  if (bucket.includeCategoryIds && bucket.includeCategoryIds.length === 0) return [] as WorkerRow[]

  const query = applyWorkerBucket(
    applyWorkerFilters(selectWorkerRows(), filters, selectedCategoryIds, statuses),
    bucket
  )
  const { data, error } = await applyWorkerOrder(query, filters.sortBy).range(rangeStart, rangeEnd)

  if (error) {
    throw new Error(`Failed to load ${bucket.label} workers: ${error.message}`)
  }

  return (data || []) as WorkerRow[]
}

const buildWorkerBuckets = (jobContext: JobContextBucketInput | null): WorkerBucket[] => {
  if (!jobContext || jobContext.categoryIds.length === 0) return []

  const categoryIds = uniqueValues(jobContext.categoryIds)
  const businessCategoryIds = withoutValues(uniqueValues(jobContext.businessCategoryIds), categoryIds)
  const industryCategoryIds = withoutValues(uniqueValues(jobContext.industryCategoryIds), [
    ...categoryIds,
    ...businessCategoryIds
  ])
  const cityExcludedCategoryIds = uniqueValues([
    ...categoryIds,
    ...businessCategoryIds,
    ...industryCategoryIds
  ])

  return [
    {
      id: 'category_city',
      label: 'category and city matches',
      includeCategoryIds: categoryIds,
      city: jobContext.city,
      cityMode: jobContext.city ? 'only' : undefined
    },
    {
      id: 'category_other_city',
      label: 'category matches from other cities',
      includeCategoryIds: categoryIds,
      city: jobContext.city,
      cityMode: jobContext.city ? 'exclude' : undefined
    },
    {
      id: 'business',
      label: 'business matches',
      includeCategoryIds: businessCategoryIds,
      excludeCategoryIds: categoryIds
    },
    {
      id: 'industry',
      label: 'industry matches',
      includeCategoryIds: industryCategoryIds,
      excludeCategoryIds: [...categoryIds, ...businessCategoryIds]
    },
    {
      id: 'city',
      label: 'city matches',
      excludeCategoryIds: cityExcludedCategoryIds,
      city: jobContext.city,
      cityMode: jobContext.city ? 'only' : undefined
    },
    {
      id: 'other',
      label: 'other workers',
      excludeCategoryIds: cityExcludedCategoryIds
    }
  ]
}

const buildWorkerSegments = (
  jobContext: JobContextBucketInput | null,
  activeStatuses: readonly string[] = ACTIVE_SEARCHABLE_WORKER_STATUSES,
  inactiveStatuses: readonly string[] = INACTIVE_SEARCHABLE_WORKER_STATUSES
): WorkerSegment[] => {
  if (!jobContext || jobContext.categoryIds.length === 0) {
    const segments: WorkerSegment[] = []

    if (activeStatuses.length) {
      segments.push({
        id: 'all-active',
        label: 'all active workers',
        bucket: null,
        statuses: activeStatuses
      })
    }

    if (inactiveStatuses.length) {
      segments.push({
        id: 'all-inactive',
        label: 'all inactive workers',
        bucket: null,
        statuses: inactiveStatuses
      })
    }

    return segments
  }

  const buckets = buildWorkerBuckets(jobContext)

  return buckets.flatMap(bucket => {
    const segments: WorkerSegment[] = []

    if (activeStatuses.length) {
      segments.push({
        id: `${bucket.id}-active`,
        label: `${bucket.label} active`,
        bucket,
        statuses: activeStatuses
      })
    }

    if (inactiveStatuses.length) {
      segments.push({
        id: `${bucket.id}-inactive`,
        label: `${bucket.label} inactive`,
        bucket,
        statuses: inactiveStatuses
      })
    }

    return segments
  })
}

const workerMatchesBucket = (worker: WorkerRow, bucket: WorkerBucket) => {
  const workerCategoryIds = worker.category_ids || []

  if (bucket.includeCategoryIds?.length && !workerCategoryIds.some(categoryId => bucket.includeCategoryIds?.includes(categoryId))) {
    return false
  }

  if (bucket.excludeCategoryIds?.length && workerCategoryIds.some(categoryId => bucket.excludeCategoryIds?.includes(categoryId))) {
    return false
  }

  if (bucket.city && bucket.cityMode) {
    const normalizedCity = normalizeValue(bucket.city)
    const cityMatches = [worker.city, worker.home_city]
      .filter((value): value is string => Boolean(String(value || '').trim()))
      .some(value => normalizeValue(value) === normalizedCity)

    if (bucket.cityMode === 'only' && !cityMatches) return false
    if (bucket.cityMode === 'exclude' && cityMatches) return false
  }

  return true
}

const loadOrderedWorkerRows = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  jobContext: JobContextBucketInput | null
) => {
  const { data, error } = await applyWorkerOrder(
    applyWorkerFilters(selectWorkerRows(), filters, selectedCategoryIds),
    filters.sortBy
  )

  if (error) {
    throw new Error(`Failed to load workers: ${error.message}`)
  }

  const effectiveRows = ((data || []) as WorkerRow[])
    .map<EffectiveWorkerRow>(worker => {
      const effectiveStatus = getEffectiveWorkerStatus(worker)
      return {
        ...worker,
        effectiveStatus,
        effectiveAvailability: getEffectiveWorkerAvailability(worker, effectiveStatus)
      }
    })
    .filter(worker =>
      matchesEffectiveWorkerStatusFilter(worker.effectiveStatus, filters.workerStatus) &&
      matchesEffectiveAvailabilityFilter(worker.effectiveAvailability, filters.availability)
    )

  const activeRows = effectiveRows.filter(worker => isActiveWorkerStatus(worker.effectiveStatus))
  const inactiveRows = effectiveRows.filter(worker => !isActiveWorkerStatus(worker.effectiveStatus))

  if (!jobContext || jobContext.categoryIds.length === 0) {
    return [...activeRows, ...inactiveRows]
  }

  const buckets = buildWorkerBuckets(jobContext)
  const orderedRows: EffectiveWorkerRow[] = []
  const assignedWorkerIds = new Set<string>()

  for (const bucket of buckets) {
    for (const group of [activeRows, inactiveRows]) {
      group.forEach(worker => {
        if (assignedWorkerIds.has(worker.id)) return
        if (!workerMatchesBucket(worker, bucket)) return
        assignedWorkerIds.add(worker.id)
        orderedRows.push(worker)
      })
    }
  }

  activeRows.forEach(worker => {
    if (assignedWorkerIds.has(worker.id)) return
    assignedWorkerIds.add(worker.id)
    orderedRows.push(worker)
  })

  inactiveRows.forEach(worker => {
    if (assignedWorkerIds.has(worker.id)) return
    assignedWorkerIds.add(worker.id)
    orderedRows.push(worker)
  })

  return orderedRows
}

const getPaginatedWorkers = async (
  filters: SearchFilters,
  selectedCategoryIds: string[],
  jobContext: JobContextBucketInput | null
): Promise<WorkerSearchResult> => {
  const pageSize = SEARCH_PAGE_SIZE
  const orderedWorkers = await loadOrderedWorkerRows(filters, selectedCategoryIds, jobContext)
  const totalCount = orderedWorkers.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(Math.max(filters.page, 1), totalPages)
  const start = (page - 1) * pageSize
  const rows = orderedWorkers
    .slice(start, start + pageSize)
    .map<WorkerRow>(worker => ({
      ...worker,
      status: worker.effectiveStatus,
      availability: worker.effectiveAvailability
    }))

  return { rows, totalCount, page, pageSize, totalPages }
}

export default async function LabourCompanySearchPage({ searchParams }: PageProps) {
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null
  const [website, categoriesResult, companiesResult, jobPostsResult, adminSettings, mastersSnapshot, resolvedSearchParams, currentUser] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    supabaseAdmin.from('labour_categories').select('id,name,is_active').order('created_at', { ascending: true }),
    supabaseAdmin
      .from('labour_companies')
      .select('id,company_name,contact_person,email,city,status,industry_category,business_type,category_ids')
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('labour_job_posts')
      .select('id,company_id,title,city,category_id,status,created_at,published_at,expires_at')
      .order('created_at', { ascending: true }),
    getLabourAdminSettings(),
    getLabourMastersSnapshot(),
    searchParams,
    getCurrentUser()
  ])

  const queryErrors = [
    categoriesResult.error,
    companiesResult.error,
    jobPostsResult.error
  ].filter(Boolean)

  if (queryErrors.length > 0) {
    throw new Error(queryErrors.map(error => error?.message).join('; '))
  }

  const categoryRows = (categoriesResult.data || []) as CategoryRow[]
  const companyRows = (companiesResult.data || []) as CompanyRow[]
  const jobPostRows = (jobPostsResult.data || []) as JobPostRow[]
  const filters = buildFilters(resolvedSearchParams)
  const content = website.content
  const industryCategoryOptions = getVisibleLabourMasterOptions(
    mastersSnapshot.options.filter(option => option.masterKey === 'industry_category')
  )
  const businessTypeOptions = getVisibleLabourMasterOptions(
    mastersSnapshot.options.filter(option => option.masterKey === 'business_type')
  )
  const searchCategoryRows = buildSearchCategoryOptions(categoryRows, mastersSnapshot.categoryDependencies)
  const activeCategoryMap = new Map(searchCategoryRows.map(category => [category.id, category.name]))

  const featuredCompanies = companyRows
    .map(company => {
      const companyJobs = jobPostRows.filter(jobPost => jobPost.company_id === company.id)
      const liveCompanyJobs = companyJobs.filter(jobPost => isLiveJobPost(jobPost))
      const companyCategoryLabels = (company.category_ids || [])
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
      const activeJobCategoryIds = Array.from(
        new Set(liveCompanyJobs.map(jobPost => jobPost.category_id))
      )
      const activeJobCategoryLabels = activeJobCategoryIds
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
      const canUnlockWorkers = company.status === 'active' && activeJobCategoryIds.length > 0

      return {
        id: company.id,
        companyName: company.company_name,
        contactPerson: company.contact_person,
        email: company.email,
        city: company.city || '',
        status: company.status || 'pending',
        industryCategory: company.industry_category || '',
        industryCategoryLabel: resolveLabourMasterLabel(
          industryCategoryOptions,
          company.industry_category || '',
          company.industry_category || 'General'
        ),
        businessType: company.business_type || '',
        businessTypeLabel: resolveLabourMasterLabel(
          businessTypeOptions,
          company.business_type || '',
          company.business_type || 'General business'
        ),
        companyCategoryLabels,
        activeJobCategoryIds,
        activeJobCategoryLabels,
        canUnlockWorkers
      }
    })
    .sort((left, right) =>
      Number(right.status === 'active') - Number(left.status === 'active') ||
      Number(right.canUnlockWorkers) - Number(left.canUnlockWorkers) ||
      right.activeJobCategoryIds.length - left.activeJobCategoryIds.length ||
      left.companyName.localeCompare(right.companyName)
    )

  const requestedJobId = String(
    resolvedSearchParams.jobPostId || resolvedSearchParams.jobId || ''
  ).trim()
  const currentCompany = currentUser
    ? companyRows.find(company => normalizeEmail(company.email) === normalizeEmail(currentUser.email)) || null
    : null
  const defaultFeaturedCompany = currentCompany
    ? featuredCompanies.find(company => company.id === currentCompany.id) || null
    : featuredCompanies[0] || null
  const currentCompanyLiveJobPosts = currentCompany
    ? jobPostRows
        .filter(jobPost => jobPost.company_id === currentCompany.id && isLiveJobPost(jobPost))
        .sort((left, right) =>
          right.created_at.localeCompare(left.created_at) ||
          String(right.published_at || '').localeCompare(String(left.published_at || ''))
        )
    : []
  const selectedJobPost = currentCompany
    ? (
        requestedJobId
          ? currentCompanyLiveJobPosts.find(jobPost => jobPost.id === requestedJobId) || null
          : currentCompanyLiveJobPosts[0] || null
      )
    : null
  const selectedJobCompany = selectedJobPost && currentCompany
    ? currentCompany
    : null

  const jobContext = selectedJobPost
    ? {
        jobId: selectedJobPost.id,
        title: selectedJobPost.title,
        city: selectedJobPost.city || selectedJobCompany?.city || '',
        industryCategory: selectedJobCompany?.industry_category || '',
        industryCategoryLabel: selectedJobCompany
          ? resolveLabourMasterLabel(
              industryCategoryOptions,
              selectedJobCompany.industry_category || '',
              selectedJobCompany.industry_category || 'General'
            )
          : '',
        businessType: selectedJobCompany?.business_type || '',
        businessTypeLabel: selectedJobCompany
          ? resolveLabourMasterLabel(
              businessTypeOptions,
              selectedJobCompany.business_type || '',
              selectedJobCompany.business_type || 'General business'
            )
          : '',
        categoryId: selectedJobPost.category_id,
        categoryLabel: activeCategoryMap.get(selectedJobPost.category_id) || selectedJobPost.category_id
      }
    : null

  const activeCategoryOptions = searchCategoryRows
    .map(category => ({
      id: category.id,
      name: category.name,
      isActive: true
    }))
  const explicitlySelectedCategoryIds = getCategoryIdsForFilter(searchCategoryRows, filters.category)
  const shouldApplyDependencyCategoryFilter = Boolean(filters.businessType || filters.industryCategory)
  const dependencyFilteredCategoryIds = explicitlySelectedCategoryIds.length || !shouldApplyDependencyCategoryFilter
    ? []
    : filterCategoriesByLabourDependency(
        activeCategoryOptions,
        mastersSnapshot.categoryDependencies,
        {
          business_type: businessTypeOptions,
          industry_category: industryCategoryOptions
        } as never,
        filters.businessType,
        filters.industryCategory
      ).map(category => category.id)
  const selectedCategoryIds = explicitlySelectedCategoryIds.length
    ? explicitlySelectedCategoryIds
    : shouldApplyDependencyCategoryFilter && dependencyFilteredCategoryIds.length === 0
      ? ['__no-category-match__']
      : dependencyFilteredCategoryIds
  const jobContextCategoryIds = jobContext
    ? getCategoryIdsForFilter(searchCategoryRows, jobContext.categoryId || jobContext.categoryLabel)
    : []
  const jobContextBusinessOptionIds = jobContext
    ? getMasterOptionIdsForValue(businessTypeOptions, jobContext.businessType)
    : []
  const jobContextIndustryOptionIds = jobContext
    ? getMasterOptionIdsForValue(industryCategoryOptions, jobContext.industryCategory)
    : []
  const jobContextBusinessCategoryIds = getCategoryIdsForMasterDependencies(
    mastersSnapshot.categoryDependencies,
    jobContextBusinessOptionIds,
    []
  )
  const jobContextIndustryCategoryIds = getCategoryIdsForMasterDependencies(
    mastersSnapshot.categoryDependencies,
    [],
    jobContextIndustryOptionIds
  )
  const jobContextBucketInput = jobContext
    ? {
        categoryIds: jobContextCategoryIds,
        businessCategoryIds: jobContextBusinessCategoryIds,
        industryCategoryIds: jobContextIndustryCategoryIds,
        city: jobContext.city
      }
    : null
  const paginatedWorkerResult = await getPaginatedWorkers(filters, selectedCategoryIds, jobContextBucketInput)

  const mappedWorkers = await Promise.all(
    paginatedWorkerResult.rows.map(async worker => ({
      id: worker.id,
      fullName: worker.full_name,
      mobile: worker.mobile,
      city: worker.city || '',
      homeCity: worker.home_city || '',
      address: worker.address || '',
      salaryType: worker.salary_type || '',
      skills: worker.skills || [],
      experienceYears: worker.experience_years ?? 0,
      expectedDailyWage: worker.expected_daily_wage ?? 0,
      availability: worker.availability || 'available_today',
      status: worker.status || 'pending',
      isVisible: worker.is_visible ?? true,
      profilePhotoPath: worker.profile_photo_path || '',
      profilePhotoUrl: await getSignedWorkerFileUrl(worker.profile_photo_path || ''),
      industryCategory: '',
      industryCategoryLabel: resolveLabourMasterLabel(
        industryCategoryOptions,
        '',
        'General'
      ),
      businessType: '',
      businessTypeLabel: resolveLabourMasterLabel(
        businessTypeOptions,
        '',
        'General business'
      ),
      createdAt: worker.created_at,
      identityProofType: worker.identity_proof_type || '',
      identityProofNumber: worker.identity_proof_number || '',
      identityProofPath: worker.identity_proof_path || '',
      isVerified: worker.status === 'active' || Boolean(worker.identity_proof_number || worker.identity_proof_path),
      categoryIds: worker.category_ids || [],
      canAccessDirectly: false,
      categoryLabels: (worker.category_ids || [])
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
    }))
  )

  const authenticatedCompany = currentCompany
    ? featuredCompanies.find(company => company.id === currentCompany.id) || null
    : null
  const publicSearchContent = {
    theme: {
      brandName: content.theme.brandName,
      accentColor: content.theme.accentColor,
      accentSoft: content.theme.accentSoft,
      highlightColor: content.theme.highlightColor
    },
    header: {
      announcement: content.header.announcement,
      logoSrc: content.header.logoSrc,
      logoWidth: content.header.logoWidth,
      logoTitle: content.header.logoTitle,
      logoSlogan: content.header.logoSlogan,
      primaryCtaLabel: content.header.primaryCtaLabel,
      primaryCtaHref: content.header.primaryCtaHref,
      navItems: content.header.navItems
    },
    home: {
      hero: {
        secondaryCtaLabel: content.home.hero.secondaryCtaLabel
      }
    },
    footer: {
      description: content.footer.description,
      linkGroups: content.footer.linkGroups,
      legalLinks: content.footer.legalLinks,
      supportEmail: content.footer.supportEmail,
      phone: '',
      address: '',
      copyrightText: content.footer.copyrightText
    }
  } as typeof content
  const featuredCompany = authenticatedCompany || defaultFeaturedCompany
  const visibleWorkers = mappedWorkers.map(worker => ({
    ...worker,
    mobile: Boolean(
      authenticatedCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => authenticatedCompany.activeJobCategoryIds.includes(categoryId))
    )
      ? worker.mobile
      : '',
    identityProofType: Boolean(
      authenticatedCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => authenticatedCompany.activeJobCategoryIds.includes(categoryId))
    )
      ? worker.identityProofType
      : '',
    identityProofNumber: Boolean(
      authenticatedCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => authenticatedCompany.activeJobCategoryIds.includes(categoryId))
    )
      ? worker.identityProofNumber
      : '',
    identityProofPath: Boolean(
      authenticatedCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => authenticatedCompany.activeJobCategoryIds.includes(categoryId))
    )
      ? worker.identityProofPath
      : '',
    canAccessDirectly: Boolean(
      authenticatedCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => authenticatedCompany.activeJobCategoryIds.includes(categoryId))
    )
  }))

  const cityMap = new Map<string, string>()
  const pushCity = (value: string | undefined) => {
    const normalized = String(value || '').trim()
    if (!normalized) return
    const key = normalized.toLowerCase()
    if (!cityMap.has(key)) {
      cityMap.set(key, normalized)
    }
  }

  getVisibleLabourMasterOptions(
    mastersSnapshot.options.filter(option => option.masterKey === 'city')
  ).forEach(option => pushCity(option.label))
  adminSettings.settings.workerHomeControls.popularCitySuggestions.forEach(pushCity)
  mappedWorkers.forEach(worker => {
    pushCity(worker.city)
    pushCity(worker.homeCity)
  })
  companyRows.forEach(company => pushCity(company.city || ''))
  jobPostRows.forEach(jobPost => pushCity(jobPost.city || ''))

  const cities = Array.from(cityMap.values()).sort((left, right) => left.localeCompare(right))

  const categories = activeCategoryOptions
    .sort((left, right) => left.name.localeCompare(right.name))

  return (
    <CompanySiteShell content={publicSearchContent} currentPath="/labour/company/search" initialHostname={hostname}>
      <LabourSearchClient
        workers={visibleWorkers}
        pagination={{
          page: paginatedWorkerResult.page,
          pageSize: paginatedWorkerResult.pageSize,
          totalCount: paginatedWorkerResult.totalCount,
          totalPages: paginatedWorkerResult.totalPages
        }}
        initialFilters={filters}
        searchPage={content.searchPage}
        categories={categories}
        cities={cities}
        featuredCompanies={featuredCompanies}
        jobPosts={jobPostRows.map(jobPost => ({
          id: jobPost.id,
          companyId: jobPost.company_id,
          title: jobPost.title,
          city: jobPost.city || '',
          categoryId: jobPost.category_id,
          status: isExpiredJobPost(jobPost) ? 'expired' : jobPost.status || 'draft',
          createdAt: jobPost.created_at,
          publishedAt: jobPost.published_at || jobPost.created_at,
          expiresAt: jobPost.expires_at || ''
        }))}
        industryCategoryOptions={industryCategoryOptions}
        businessTypeOptions={businessTypeOptions}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies}
        categoryDependencies={mastersSnapshot.categoryDependencies}
        jobContext={jobContext}
        accentColor={content.theme.accentColor}
        highlightColor={content.theme.highlightColor}
        featuredCompany={featuredCompany}
        authenticatedCompany={authenticatedCompany}
        initialRequestedJobId={requestedJobId}
        initialHostname={hostname}
      />
    </CompanySiteShell>
  )
}
