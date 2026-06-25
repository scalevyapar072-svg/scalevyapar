'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BriefcaseBusiness, CheckCircle2, Download, Heart, MapPin, MessageCircle, Phone, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  type LabourCategoryDependency,
  type LabourIndustryBusinessDependency,
  type LabourMasterOption
} from '@/lib/labour-masters-schema'
import { toRozgarPublicPath } from '@/lib/labour-company-host'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'
const SHORTLIST_STORAGE_KEY = 'labour_company_search_shortlist'
const WORKERS_PER_PAGE = 20

type SearchPageContent = {
  eyebrow: string
  title: string
  highlightedText: string
  subtitle: string
  helperText: string
  trustPoints: string[]
  imageSrc: string
  floatingCardTitle: string
  floatingCardDescription: string
  emptyTitle: string
  emptyDescription: string
}

type WorkerItem = {
  id: string
  fullName: string
  mobile: string
  city: string
  homeCity: string
  address: string
  salaryType: string
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  status: string
  isVisible: boolean
  profilePhotoPath: string
  profilePhotoUrl: string
  industryCategory: string
  industryCategoryLabel: string
  businessType: string
  businessTypeLabel: string
  createdAt: string
  identityProofType: string
  identityProofNumber: string
  identityProofPath: string
  isVerified: boolean
  categoryIds: string[]
  canAccessDirectly: boolean
  categoryLabels: string[]
}

type CategoryOption = {
  id: string
  name: string
  isActive?: boolean
}

type FeaturedCompany = {
  id: string
  companyName: string
  contactPerson: string
  email: string
  city: string
  status: string
  industryCategory: string
  industryCategoryLabel: string
  businessType: string
  businessTypeLabel: string
  companyCategoryLabels: string[]
  activeJobCategoryIds: string[]
  activeJobCategoryLabels: string[]
  canUnlockWorkers: boolean
}

type SearchJobContext = {
  jobId: string
  title: string
  city: string
  industryCategory: string
  industryCategoryLabel: string
  businessType: string
  businessTypeLabel: string
  categoryId: string
  categoryLabel: string
}

type SearchJobPostLite = {
  id: string
  companyId: string
  title: string
  city: string
  categoryId: string
  status: string
  createdAt: string
  publishedAt: string
  expiresAt: string
}

type PriorityCategoryTab = {
  key: string
  jobId: string
  categoryId: string
  categoryLabel: string
  city: string
  title: string
  createdAt: string
  publishedAt: string
}

type StoredCompanyProfile = {
  id?: string
  email?: string
  companyName?: string
  contactPerson?: string
}

type WorkerMatchMeta = {
  bucket: number
  exactCategoryMatch: boolean
  businessMatch: boolean
  industryMatch: boolean
  cityMatch: boolean
  activeStatusMatch: boolean
  visibleMatch: boolean
  availableMatch: boolean
  score: number
}

type RankedWorker = {
  worker: WorkerItem
  matchMeta: WorkerMatchMeta
}

type Props = {
  workers: WorkerItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  initialFilters: {
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
  searchPage: SearchPageContent
  categories: CategoryOption[]
  cities: string[]
  featuredCompanies: FeaturedCompany[]
  jobPosts: SearchJobPostLite[]
  industryCategoryOptions: LabourMasterOption[]
  businessTypeOptions: LabourMasterOption[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  categoryDependencies: LabourCategoryDependency[]
  jobContext: SearchJobContext | null
  accentColor: string
  highlightColor: string
  featuredCompany: FeaturedCompany | null
  authenticatedCompany: FeaturedCompany | null
  initialRequestedJobId: string
  initialHostname?: string | null
}

const sortOptions = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'name-asc', label: 'Name A to Z' },
  { id: 'name-desc', label: 'Name Z to A' },
  { id: 'newest', label: 'Newest' },
  { id: 'wage-asc', label: 'Wage Low to High' },
  { id: 'wage-desc', label: 'Wage High to Low' }
] as const

const experienceFilters = [
  { id: '0-1', label: '0-1 yrs', match: (years: number) => years < 2 },
  { id: '2-4', label: '2-4 yrs', match: (years: number) => years >= 2 && years < 5 },
  { id: '5+', label: '5+ yrs', match: (years: number) => years >= 5 }
]

const wageFilters = [
  { id: 'under-600', label: 'Up to Rs 600', match: (wage: number) => wage <= 600 },
  { id: '601-900', label: 'Rs 601-900', match: (wage: number) => wage > 600 && wage <= 900 },
  { id: '901-1200', label: 'Rs 901-1200', match: (wage: number) => wage > 900 && wage <= 1200 },
  { id: '1200-plus', label: 'Rs 1200+', match: (wage: number) => wage > 1200 }
]

const workerStatusOptions = [
  { id: '', label: 'All Workers' },
  { id: 'active', label: 'Active Workers' },
  { id: 'inactive', label: 'Inactive Workers' }
] as const

const normalize = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[&/+,_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')

const matchesValue = (left: string, right: string) => {
  const normalizedLeft = normalize(left)
  const normalizedRight = normalize(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

const getOptionMatchValues = (option: LabourMasterOption) => [option.id, option.value, option.slug, option.label]

const getMatchingOptionIds = (options: LabourMasterOption[], selectedValue: string) => {
  const normalizedSelectedValue = normalize(selectedValue)
  if (!normalizedSelectedValue) return [] as string[]

  return options
    .filter(option => getOptionMatchValues(option).some(value => matchesValue(value, selectedValue)))
    .map(option => option.id)
}

const workerMatchesMasterSelection = (selectedValue: string, workerValues: string[], options: LabourMasterOption[]) => {
  if (!selectedValue.trim()) return true

  const matchingSelectedOptionIds = new Set(getMatchingOptionIds(options, selectedValue))
  const normalizedSelectedValue = normalize(selectedValue)

  return workerValues.some(value => {
    if (!value) return false
    if (matchesValue(value, selectedValue)) return true
    if (matchingSelectedOptionIds.size === 0) {
      return normalize(value) === normalizedSelectedValue
    }

    const matchingWorkerOptionIds = getMatchingOptionIds(options, value)
    return matchingWorkerOptionIds.some(optionId => matchingSelectedOptionIds.has(optionId))
  })
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const getWhatsappHref = (mobile: string, fallbackHref: string) => {
  const digits = mobile.replace(/\D/g, '')
  return digits ? `https://wa.me/91${digits}` : fallbackHref
}

const getAvailabilityMeta = (availability: string, status = 'active') => {
  if (normalize(status) !== 'active') {
    return { label: 'Not Available', className: styles.searchWorkerAvailabilityMuted, isActive: false }
  }

  const normalized = normalize(availability)
  if (normalized === normalize('available_today')) {
    return { label: 'Available Today', className: styles.searchWorkerAvailabilityToday, isActive: true }
  }

  if (normalized === normalize('available_this_week')) {
    return { label: 'Available This Week', className: styles.searchWorkerAvailabilitySoon, isActive: true }
  }

  return { label: 'Not Available', className: styles.searchWorkerAvailabilityMuted, isActive: false }
}

const getAvailabilityPriority = (availability: string) => {
  const normalized = normalize(availability)
  if (normalized === normalize('available_today')) return 2
  if (normalized === normalize('available_this_week')) return 1
  return 0
}

const getWorkerStatusMeta = (status: string) => {
  if (normalize(status) === 'active') {
    return {
      label: 'Active',
      className: styles.searchWorkerStatusActive
    }
  }

  return {
    label: 'Inactive',
    className: styles.searchWorkerStatusInactive
  }
}

const getWorkerSalaryTypeLabel = (salaryType: string) => {
  const normalized = normalize(salaryType)

  if (normalized === normalize('daily wage')) return 'Daily Wage'
  if (normalized === normalize('monthly salary')) return 'Monthly Salary'
  if (normalized === normalize('weekly')) return 'Weekly'
  if (normalized === normalize('per piece')) return 'Per Piece'
  if (normalized === normalize('contract')) return 'Contract'
  if (normalized === normalize('hourly')) return 'Hourly'

  return 'Daily Wage'
}

const getWorkerSalaryDisplay = (worker: WorkerItem) =>
  `${formatCurrency(worker.expectedDailyWage)} / ${getWorkerSalaryTypeLabel(worker.salaryType)}`.trim()

const getWorkerCardToneClass = (isCategoryMatch: boolean, status: string) => {
  const isActiveStatus = normalize(status) === 'active'

  if (isCategoryMatch && isActiveStatus) return styles.searchWorkerCardMatchActive
  if (isCategoryMatch && !isActiveStatus) return styles.searchWorkerCardMatchInactive
  if (!isCategoryMatch && isActiveStatus) return styles.searchWorkerCardOtherActive
  return styles.searchWorkerCardOtherInactive
}

const getWorkerPriorityRank = (worker: WorkerItem) => {
  const isActiveStatus = normalize(worker.status) === 'active'
  return (
    (isActiveStatus ? 1000 : 0) +
    (worker.isVisible ? 120 : 0) +
    getAvailabilityPriority(worker.availability) * 20
  )
}

const getWorkerNameFallback = (worker: WorkerItem) => normalize(worker.fullName) || worker.id

const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 5) {
    return [...Array.from({ length: 9 }, (_, index) => index + 1), 'ellipsis-right', totalPages] as const
  }

  if (currentPage >= totalPages - 4) {
    return [1, 'ellipsis-left', ...Array.from({ length: 9 }, (_, index) => totalPages - 8 + index)] as const
  }

  return [
    1,
    'ellipsis-left',
    ...Array.from({ length: 7 }, (_, index) => currentPage - 3 + index),
    'ellipsis-right',
    totalPages
  ] as const
}

const isExpiredSearchJobPost = (jobPost: Pick<SearchJobPostLite, 'status' | 'expiresAt'>) => {
  if (normalize(jobPost.status) === 'expired') return true
  const expiryValue = String(jobPost.expiresAt || '').trim()
  if (!expiryValue) return false

  const expiresAt = new Date(expiryValue)
  if (Number.isNaN(expiresAt.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiresAt.setHours(0, 0, 0, 0)
  return expiresAt < today
}

const isLiveSearchJobPost = (jobPost: Pick<SearchJobPostLite, 'status' | 'expiresAt'>) =>
  normalize(jobPost.status) === 'live' && !isExpiredSearchJobPost(jobPost)

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')

const splitHighlightedTitle = (title: string, highlightedText: string) => {
  if (!highlightedText.trim()) {
    return { before: title, highlight: '', after: '' }
  }

  const matchIndex = title.toLowerCase().indexOf(highlightedText.toLowerCase())
  if (matchIndex === -1) {
    return { before: title, highlight: '', after: '' }
  }

  return {
    before: title.slice(0, matchIndex),
    highlight: title.slice(matchIndex, matchIndex + highlightedText.length),
    after: title.slice(matchIndex + highlightedText.length)
  }
}

export function LabourSearchClient({
  workers,
  pagination,
  initialFilters,
  searchPage,
  categories,
  cities,
  featuredCompanies,
  jobPosts,
  industryCategoryOptions,
  businessTypeOptions,
  industryBusinessDependencies,
  categoryDependencies,
  jobContext,
  accentColor,
  highlightColor,
  featuredCompany,
  authenticatedCompany,
  initialRequestedJobId,
  initialHostname = null
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [hostname, setHostname] = useState<string | null>(initialHostname)
  const hasMountedRef = useRef(false)
  const hasAppliedInitialFilterResetRef = useRef(false)
  const [search, setSearch] = useState(initialFilters.search)
  const [city, setCity] = useState(initialFilters.city)
  const [category, setCategory] = useState(initialFilters.category)
  const [industryCategory, setIndustryCategory] = useState(initialFilters.industryCategory)
  const [businessType, setBusinessType] = useState(initialFilters.businessType)
  const [availability, setAvailability] = useState(initialFilters.availability)
  const [workerStatus, setWorkerStatus] = useState(initialFilters.workerStatus)
  const [experience, setExperience] = useState(initialFilters.experience)
  const [wage, setWage] = useState(initialFilters.wage)
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['id']>(
    sortOptions.some(option => option.id === initialFilters.sortBy)
      ? initialFilters.sortBy as (typeof sortOptions)[number]['id']
      : 'relevance'
  )
  const [currentPage, setCurrentPage] = useState(pagination.page)
  const [openingCompanyPanel, setOpeningCompanyPanel] = useState(false)
  const [expandedWorkerIds, setExpandedWorkerIds] = useState<string[]>([])
  const [shortlistedWorkerIds, setShortlistedWorkerIds] = useState<string[]>([])
  const [revealedContactWorkerIds, setRevealedContactWorkerIds] = useState<string[]>([])
  const [imageFallbackWorkerIds, setImageFallbackWorkerIds] = useState<string[]>([])
  const [storedCompanyProfile, setStoredCompanyProfile] = useState<StoredCompanyProfile | null>(null)
  const [hasStoredCompanyToken, setHasStoredCompanyToken] = useState(false)
  const [requestedJobId, setRequestedJobId] = useState(initialRequestedJobId)
  const [identityProofUrls, setIdentityProofUrls] = useState<Record<string, string>>({})
  const [identityProofLoadingIds, setIdentityProofLoadingIds] = useState<string[]>([])

  const searchTitle = splitHighlightedTitle(searchPage.title, searchPage.highlightedText)
  const resolveHref = (href: string) => toRozgarPublicPath(href, hostname)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setHostname(window.location.hostname)

    const storedProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
    setHasStoredCompanyToken(Boolean(window.localStorage.getItem(COMPANY_TOKEN_KEY)))
    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile)
        if (parsedProfile && typeof parsedProfile === 'object') {
          setStoredCompanyProfile(parsedProfile as StoredCompanyProfile)
        }
      } catch {
        window.localStorage.removeItem(COMPANY_PROFILE_KEY)
      }
    }

    const stored = window.localStorage.getItem(SHORTLIST_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setShortlistedWorkerIds(parsed.filter(item => typeof item === 'string'))
      }
    } catch {
      window.localStorage.removeItem(SHORTLIST_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    setSearch(initialFilters.search)
    setCity(initialFilters.city)
    setCategory(initialFilters.category)
    setIndustryCategory(initialFilters.industryCategory)
    setBusinessType(initialFilters.businessType)
    setAvailability(initialFilters.availability)
    setWorkerStatus(initialFilters.workerStatus)
    setExperience(initialFilters.experience)
    setWage(initialFilters.wage)
    setSortBy(
      sortOptions.some(option => option.id === initialFilters.sortBy)
        ? initialFilters.sortBy as (typeof sortOptions)[number]['id']
        : 'relevance'
    )
    setCurrentPage(pagination.page)
    setRequestedJobId(initialRequestedJobId)
  }, [
    initialFilters.availability,
    initialFilters.businessType,
    initialFilters.category,
    initialFilters.city,
    initialFilters.experience,
    initialFilters.industryCategory,
    initialFilters.search,
    initialFilters.sortBy,
    initialFilters.workerStatus,
    initialFilters.wage,
    initialRequestedJobId,
    pagination.page
  ])

  const buildSearchUrl = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (city.trim()) params.set('city', city.trim())
    if (industryCategory.trim()) params.set('industryCategory', industryCategory.trim())
    if (businessType.trim()) params.set('businessType', businessType.trim())
    if (category.trim()) params.set('category', category.trim())
    if (availability.trim()) params.set('availability', availability.trim())
    if (workerStatus.trim()) params.set('workerStatus', workerStatus.trim())
    if (experience.trim()) params.set('experience', experience.trim())
    if (wage.trim()) params.set('wage', wage.trim())
    if (sortBy !== 'relevance') params.set('sort', sortBy)
    if (requestedJobId.trim()) params.set('jobId', requestedJobId.trim())
    if (nextPage > 1) params.set('page', String(nextPage))

    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    const timeout = window.setTimeout(() => {
      const nextUrl = buildSearchUrl(currentPage)
      const currentUrl = `${window.location.pathname}${window.location.search}`
      if (nextUrl === currentUrl) return

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    }, search.trim() ? 300 : 0)

    return () => window.clearTimeout(timeout)
  }, [
    availability,
    businessType,
    category,
    city,
    currentPage,
    experience,
    industryCategory,
    pathname,
    requestedJobId,
    router,
    search,
    sortBy,
    workerStatus,
    wage
  ])

  const runtimeCompany = useMemo(() => {
    if (!hasStoredCompanyToken || !storedCompanyProfile) return null

    const normalizedStoredId = normalize(storedCompanyProfile.id || '')
    const normalizedStoredEmail = normalize(storedCompanyProfile.email || '')
    const normalizedStoredCompanyName = normalize(storedCompanyProfile.companyName || '')
    const normalizedStoredContactPerson = normalize(storedCompanyProfile.contactPerson || '')

    return (
      featuredCompanies.find(company => {
        if (normalizedStoredId && normalize(company.id) === normalizedStoredId) return true
        if (normalizedStoredEmail && normalize(company.email) === normalizedStoredEmail) return true
        if (normalizedStoredCompanyName && normalize(company.companyName) === normalizedStoredCompanyName) return true
        if (normalizedStoredContactPerson && normalize(company.contactPerson) === normalizedStoredContactPerson) return true
        return false
      }) || null
    )
  }, [featuredCompanies, hasStoredCompanyToken, storedCompanyProfile])

  const getCategoryLabel = (categoryId: string) =>
    categories.find(option => matchesValue(option.id, categoryId) || matchesValue(option.name, categoryId))?.name || categoryId

  const buildJobContext = (selectedJobPost: SearchJobPostLite | null, selectedCompany: FeaturedCompany | null): SearchJobContext | null => {
    if (!selectedJobPost || !selectedCompany) return null

    return {
      jobId: selectedJobPost.id,
      title: selectedJobPost.title,
      city: selectedJobPost.city || selectedCompany.city || '',
      industryCategory: selectedCompany.industryCategory || '',
      industryCategoryLabel: selectedCompany.industryCategoryLabel || '',
      businessType: selectedCompany.businessType || '',
      businessTypeLabel: selectedCompany.businessTypeLabel || '',
      categoryId: selectedJobPost.categoryId,
      categoryLabel: getCategoryLabel(selectedJobPost.categoryId)
    }
  }

  const latestLiveJobForRuntimeCompany = useMemo(() => {
    if (!runtimeCompany) return null

    let latestJob: SearchJobPostLite | null = null

    for (const jobPost of jobPosts) {
      if (jobPost.companyId !== runtimeCompany.id || !isLiveSearchJobPost(jobPost)) continue

      if (
        !latestJob ||
        jobPost.createdAt.localeCompare(latestJob.createdAt) > 0 ||
        (jobPost.createdAt === latestJob.createdAt &&
          jobPost.publishedAt.localeCompare(latestJob.publishedAt) > 0)
      ) {
        latestJob = jobPost
      }
    }

    return latestJob
  }, [jobPosts, runtimeCompany])

  const requestedJobPost = useMemo(
    () => (
      requestedJobId && runtimeCompany
        ? jobPosts.find(jobPost => jobPost.id === requestedJobId && jobPost.companyId === runtimeCompany.id) || null
        : null
    ),
    [jobPosts, requestedJobId, runtimeCompany]
  )

  const requestedJobCompany = useMemo(
    () => (requestedJobPost && runtimeCompany && requestedJobPost.companyId === runtimeCompany.id ? runtimeCompany : null),
    [requestedJobPost, runtimeCompany]
  )

  const accessCompany = useMemo(() => {
    if (authenticatedCompany) return authenticatedCompany
    if (runtimeCompany) return runtimeCompany
    return null
  }, [authenticatedCompany, runtimeCompany])

  const effectiveJobContext = useMemo(() => {
    if (requestedJobPost && requestedJobCompany) {
      return buildJobContext(requestedJobPost, requestedJobCompany)
    }

    if (jobContext && accessCompany) {
      return jobContext
    }

    if (accessCompany && latestLiveJobForRuntimeCompany) {
      return buildJobContext(latestLiveJobForRuntimeCompany, accessCompany)
    }

    return null
  }, [accessCompany, jobContext, latestLiveJobForRuntimeCompany, requestedJobCompany, requestedJobPost])

  const isCompanyAuthenticated = Boolean(accessCompany)
  const canViewWorkerContacts = Boolean(accessCompany?.canUnlockWorkers)
  const hasActiveJobCategories = Boolean(accessCompany?.activeJobCategoryLabels.length)
  const effectiveCompanyJobs = useMemo(
    () => (accessCompany ? jobPosts.filter(jobPost => jobPost.companyId === accessCompany.id) : []),
    [accessCompany, jobPosts]
  )
  const effectiveCompanyLiveJobs = useMemo(
    () => effectiveCompanyJobs.filter(jobPost => isLiveSearchJobPost(jobPost)),
    [effectiveCompanyJobs]
  )
  const effectiveCompanyExpiredJobs = useMemo(
    () => effectiveCompanyJobs.filter(jobPost => isExpiredSearchJobPost(jobPost)),
    [effectiveCompanyJobs]
  )
  const priorityCategoryTabs = useMemo(() => {
    if (!accessCompany) return [] as PriorityCategoryTab[]

    const sortedLiveJobs = [...effectiveCompanyLiveJobs].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      right.publishedAt.localeCompare(left.publishedAt) ||
      right.id.localeCompare(left.id)
    )

    const groupedTabs = new Map<string, PriorityCategoryTab>()
    sortedLiveJobs.forEach(jobPost => {
      const categoryLabel = getCategoryLabel(jobPost.categoryId)
      const categoryKey = normalize(jobPost.categoryId || categoryLabel || jobPost.id)
      if (!categoryKey || groupedTabs.has(categoryKey)) return

      groupedTabs.set(categoryKey, {
        key: categoryKey,
        jobId: jobPost.id,
        categoryId: jobPost.categoryId,
        categoryLabel,
        city: jobPost.city || accessCompany.city || '',
        title: jobPost.title,
        createdAt: jobPost.createdAt,
        publishedAt: jobPost.publishedAt
      })
    })

    return Array.from(groupedTabs.values())
  }, [accessCompany, effectiveCompanyLiveJobs])
  const activeJobCategoryIdSet = useMemo(
    () => new Set(accessCompany?.activeJobCategoryIds || []),
    [accessCompany]
  )
  const expiredJobCategoryIdSet = useMemo(
    () => new Set(effectiveCompanyExpiredJobs.map(jobPost => jobPost.categoryId)),
    [effectiveCompanyExpiredJobs]
  )
  const workerCanAccessDirectly = (worker: WorkerItem) =>
    Boolean(
      accessCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => activeJobCategoryIdSet.has(categoryId))
    )

  const getLockedAccessCopy = (worker: WorkerItem) => {
    if (!isCompanyAuthenticated) {
      return {
        message: 'Please login as a company to contact workers.',
        primaryLabel: 'Company Login',
        primaryHref: resolveHref('/labour/company/signin'),
        secondaryLabel: 'Post Job',
        secondaryHref: resolveHref('/labour/company/job-post')
      }
    }

    const workerMatchesLiveCategory = worker.categoryIds.some(categoryId => activeJobCategoryIdSet.has(categoryId))
    const workerMatchesExpiredCategory = worker.categoryIds.some(categoryId => expiredJobCategoryIdSet.has(categoryId))

    if (workerMatchesLiveCategory) {
      return {
        message: 'Direct worker contact is active for this live job category.',
        primaryLabel: 'Open Company Panel',
        primaryHref: resolveHref('/labour/company/panel'),
        secondaryLabel: 'Post New Job',
        secondaryHref: resolveHref('/labour/company/job-post')
      }
    }

    if (workerMatchesExpiredCategory) {
      return {
        message: 'Your job post is expired. Repost or create an active job to contact workers.',
        primaryLabel: 'Repost Job',
        primaryHref: resolveHref('/labour/company/panel'),
        secondaryLabel: 'Post New Job',
        secondaryHref: resolveHref('/labour/company/job-post')
      }
    }

    if (effectiveCompanyLiveJobs.length > 0) {
      return {
        message: 'Post a live job in this worker category to unlock direct worker contact access.',
        primaryLabel: 'Post New Job',
        primaryHref: resolveHref('/labour/company/job-post'),
        secondaryLabel: 'Open Company Panel',
        secondaryHref: resolveHref('/labour/company/panel')
      }
    }

    if (effectiveCompanyExpiredJobs.length > 0) {
      return {
        message: 'Your job post is expired. Repost or create an active job to contact workers.',
        primaryLabel: 'Repost Job',
        primaryHref: resolveHref('/labour/company/panel'),
        secondaryLabel: 'Post New Job',
        secondaryHref: resolveHref('/labour/company/job-post')
      }
    }

    return {
      message: 'Post or repost a job to unlock direct worker contact access.',
      primaryLabel: 'Post New Job',
      primaryHref: resolveHref('/labour/company/job-post'),
      secondaryLabel: 'Open Company Panel',
      secondaryHref: resolveHref('/labour/company/panel')
    }
  }

  useEffect(() => {
    if (!industryCategory) {
      if (businessType) setBusinessType('')
      return
    }

    const nextBusinessTypes = filterBusinessTypesByIndustryDependency(
      businessTypeOptions,
      industryCategoryOptions,
      industryBusinessDependencies,
      industryCategory
    )

    const isCurrentBusinessTypeVisible = nextBusinessTypes.some(option =>
      normalize(option.label) === normalize(businessType) || normalize(option.value) === normalize(businessType)
    )

    if (businessType && !isCurrentBusinessTypeVisible) {
      setBusinessType('')
    }
  }, [businessType, businessTypeOptions, industryBusinessDependencies, industryCategory, industryCategoryOptions])

  useEffect(() => {
    const filteredCategoryRecords = filterCategoriesByLabourDependency(
      categories,
      categoryDependencies,
      {
        business_type: businessTypeOptions,
        industry_category: industryCategoryOptions
      } as never,
      businessType,
      industryCategory
    )

    const visibleCategoryOptions = filteredCategoryRecords.length ? filteredCategoryRecords : categories
    const isCurrentCategoryVisible = visibleCategoryOptions.some(option => normalize(option.name) === normalize(category))

    if (category && !isCurrentCategoryVisible) {
      setCategory('')
    }
  }, [businessType, businessTypeOptions, categories, category, categoryDependencies, industryCategory, industryCategoryOptions])

  useEffect(() => {
    if (!hasAppliedInitialFilterResetRef.current) {
      hasAppliedInitialFilterResetRef.current = true
      return
    }

    setCurrentPage(1)
  }, [availability, businessType, category, city, experience, industryCategory, search, sortBy, wage, workerStatus])

  const availabilityOptions = ['available_today', 'available_this_week', 'not_available']

  const matchingIndustryCategoryOptionIds = useMemo(
    () => new Set(getMatchingOptionIds(industryCategoryOptions, industryCategory)),
    [industryCategory, industryCategoryOptions]
  )

  const matchingBusinessTypeOptionIds = useMemo(
    () => new Set(getMatchingOptionIds(businessTypeOptions, businessType)),
    [businessType, businessTypeOptions]
  )

  const matchingCategoryIds = useMemo(
    () =>
      new Set(
        categories
          .filter(option => matchesValue(option.id, category) || matchesValue(option.name, category))
          .map(option => option.id)
      ),
    [categories, category]
  )

  const jobContextCategoryOptionIds = useMemo(() => {
    if (!effectiveJobContext) return new Set<string>()

    return new Set(
      categories
        .filter(option =>
          matchesValue(option.id, effectiveJobContext.categoryId) ||
          matchesValue(option.name, effectiveJobContext.categoryId) ||
          matchesValue(option.id, effectiveJobContext.categoryLabel) ||
          matchesValue(option.name, effectiveJobContext.categoryLabel)
        )
        .map(option => option.id)
    )
  }, [categories, effectiveJobContext])

  const jobContextCategoryMatchValues = useMemo(() => {
    if (!effectiveJobContext) return new Set<string>()

    const values = new Set<string>()
    const addValue = (value: string) => {
      const normalizedValue = normalize(value)
      if (normalizedValue) {
        values.add(normalizedValue)
      }
    }

    addValue(effectiveJobContext.categoryId)
    addValue(effectiveJobContext.categoryLabel)
    categories.forEach(option => {
      if (
        matchesValue(option.id, effectiveJobContext.categoryId) ||
        matchesValue(option.name, effectiveJobContext.categoryId) ||
        matchesValue(option.id, effectiveJobContext.categoryLabel) ||
        matchesValue(option.name, effectiveJobContext.categoryLabel)
      ) {
        addValue(option.id)
        addValue(option.name)
      }
    })

    return values
  }, [categories, effectiveJobContext])

  const availableBusinessTypeOptions = useMemo(() => {
    if (!industryCategory) return []

    return filterBusinessTypesByIndustryDependency(
      businessTypeOptions,
      industryCategoryOptions,
      industryBusinessDependencies,
      industryCategory
    )
  }, [businessTypeOptions, industryCategoryOptions, industryBusinessDependencies, industryCategory])

  const filteredCategoryOptions = useMemo(() => {
    const matchingCategories = filterCategoriesByLabourDependency(
      categories,
      categoryDependencies,
      {
        business_type: businessTypeOptions,
        industry_category: industryCategoryOptions
      } as never,
      businessType,
      industryCategory
    )

    return matchingCategories.length ? matchingCategories : categories
  }, [businessType, businessTypeOptions, categories, categoryDependencies, industryCategory, industryCategoryOptions])

  const matchingCategoryDependencies = useMemo(
    () =>
      categoryDependencies.filter(dependency => {
        if (!dependency.isActive) return false
        if (matchingIndustryCategoryOptionIds.size && !matchingIndustryCategoryOptionIds.has(dependency.industryCategoryOptionId)) return false
        if (matchingBusinessTypeOptionIds.size && !matchingBusinessTypeOptionIds.has(dependency.businessTypeOptionId)) return false
        return true
      }),
    [categoryDependencies, matchingBusinessTypeOptionIds, matchingIndustryCategoryOptionIds]
  )

  const hasIndustrySelection = Boolean(industryCategory.trim())
  const hasBusinessTypeSelection = Boolean(businessType.trim())
  const hasIndustryBusinessMappings = useMemo(
    () =>
      matchingIndustryCategoryOptionIds.size > 0 &&
      industryBusinessDependencies.some(
        dependency => dependency.isActive && matchingIndustryCategoryOptionIds.has(dependency.industryCategoryOptionId)
      ),
    [industryBusinessDependencies, matchingIndustryCategoryOptionIds]
  )
  const hasIndustryCategoryMappings = useMemo(
    () =>
      matchingIndustryCategoryOptionIds.size > 0 &&
      categoryDependencies.some(
        dependency => dependency.isActive && matchingIndustryCategoryOptionIds.has(dependency.industryCategoryOptionId)
      ),
    [categoryDependencies, matchingIndustryCategoryOptionIds]
  )
  const hasSelectedPairMappings = matchingCategoryDependencies.length > 0

  const rankedWorkers = useMemo(() => {
    const matchingIndustryOptionIds = effectiveJobContext?.industryCategory
      ? new Set(getMatchingOptionIds(industryCategoryOptions, effectiveJobContext.industryCategory))
      : new Set<string>()
    const matchingBusinessOptionIds = effectiveJobContext?.businessType
      ? new Set(getMatchingOptionIds(businessTypeOptions, effectiveJobContext.businessType))
      : new Set<string>()

    const getExactCategoryMatch = (worker: WorkerItem) => {
      if (!effectiveJobContext) return false

      const directCategoryIdMatch = worker.categoryIds.some(categoryId =>
        matchesValue(categoryId, effectiveJobContext.categoryId) || jobContextCategoryOptionIds.has(categoryId)
      )
      const normalizedCategoryIdMatch = worker.categoryIds.some(categoryId =>
        jobContextCategoryMatchValues.has(normalize(categoryId))
      )
      const categoryLabelMatch = worker.categoryLabels.some(label =>
        matchesValue(label, effectiveJobContext.categoryLabel) || jobContextCategoryMatchValues.has(normalize(label))
      )

      return directCategoryIdMatch || normalizedCategoryIdMatch || categoryLabelMatch
    }

    const getMatchMeta = (worker: WorkerItem): WorkerMatchMeta => {
      const activeStatusMatch = normalize(worker.status) === 'active'
      const visibleMatch = worker.isVisible
      const availableMatch = getAvailabilityPriority(worker.availability) > 0

      if (!effectiveJobContext) {
        return {
          bucket: 4,
          exactCategoryMatch: false,
          businessMatch: false,
          industryMatch: false,
          cityMatch: false,
          activeStatusMatch,
          visibleMatch,
          availableMatch,
          score:
            (activeStatusMatch ? 1000 : 0) +
            (visibleMatch ? 240 : 0) +
            (availableMatch ? 160 : 0) +
            (worker.isVerified ? 100 : 0)
        }
      }

      const workerCategoryIdSet = new Set(worker.categoryIds)
      const cityMatch = Boolean(
        effectiveJobContext.city &&
        (normalize(worker.city) === normalize(effectiveJobContext.city) ||
          normalize(worker.homeCity) === normalize(effectiveJobContext.city))
      )
      const directIndustryMatch = Boolean(
        effectiveJobContext.industryCategory &&
        workerMatchesMasterSelection(
          effectiveJobContext.industryCategory,
          [worker.industryCategory, worker.industryCategoryLabel],
          industryCategoryOptions
        )
      )
      const inferredIndustryMatch = Boolean(
        effectiveJobContext.industryCategory &&
        categoryDependencies.some(dependency =>
          workerCategoryIdSet.has(dependency.categoryId) &&
          (!matchingIndustryOptionIds.size || matchingIndustryOptionIds.has(dependency.industryCategoryOptionId))
        )
      )
      const industryMatch = directIndustryMatch || inferredIndustryMatch
      const directBusinessMatch = Boolean(
        effectiveJobContext.businessType &&
        workerMatchesMasterSelection(
          effectiveJobContext.businessType,
          [worker.businessType, worker.businessTypeLabel],
          businessTypeOptions
        )
      )
      const inferredBusinessMatch = Boolean(
        effectiveJobContext.businessType &&
        categoryDependencies.some(dependency =>
          workerCategoryIdSet.has(dependency.categoryId) &&
          (!matchingBusinessOptionIds.size || matchingBusinessOptionIds.has(dependency.businessTypeOptionId))
        )
      )
      const businessMatch = directBusinessMatch || inferredBusinessMatch
      const exactCategoryMatch = getExactCategoryMatch(worker)
      const bucket = exactCategoryMatch ? 0 : businessMatch ? 1 : industryMatch ? 2 : cityMatch ? 3 : 4

      let score = 0
      if (activeStatusMatch) score += 1000
      if (visibleMatch) score += 240
      if (availableMatch) score += 160
      if (cityMatch) score += 500
      if (industryMatch) score += 300
      if (businessMatch) score += 300
      if (exactCategoryMatch) score += 500
      if (worker.isVerified) score += 100

      return {
        bucket,
        exactCategoryMatch,
        businessMatch,
        industryMatch,
        cityMatch,
        activeStatusMatch,
        visibleMatch,
        availableMatch,
        score
      }
    }

    const ranked = workers.map(worker => ({
      worker,
      matchMeta: getMatchMeta(worker)
    }))

    return ranked
  }, [
    businessTypeOptions,
    categoryDependencies,
    effectiveJobContext,
    industryCategoryOptions,
    jobContextCategoryMatchValues,
    jobContextCategoryOptionIds,
    workers
  ])

  const totalPages = pagination.totalPages

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedWorkers = useMemo(
    () =>
      [...rankedWorkers].sort((left, right) => {
        const hasCategoryPriority = Boolean(effectiveJobContext)
        if (!hasCategoryPriority) {
          const activeDelta = Number(right.matchMeta.activeStatusMatch) - Number(left.matchMeta.activeStatusMatch)
          if (activeDelta !== 0) return activeDelta
        }

        const bucketDelta = left.matchMeta.bucket - right.matchMeta.bucket
        if (bucketDelta !== 0) return bucketDelta

        if (left.matchMeta.exactCategoryMatch && right.matchMeta.exactCategoryMatch) {
          const cityDelta = Number(right.matchMeta.cityMatch) - Number(left.matchMeta.cityMatch)
          if (cityDelta !== 0) return cityDelta

          const activeDelta = Number(right.matchMeta.activeStatusMatch) - Number(left.matchMeta.activeStatusMatch)
          if (activeDelta !== 0) return activeDelta
        }

        const activeDelta = Number(right.matchMeta.activeStatusMatch) - Number(left.matchMeta.activeStatusMatch)
        if (activeDelta !== 0) return activeDelta

        const cityDelta = Number(right.matchMeta.cityMatch) - Number(left.matchMeta.cityMatch)
        if (cityDelta !== 0) return cityDelta

        const priorityDelta = getWorkerPriorityRank(right.worker) - getWorkerPriorityRank(left.worker)
        if (priorityDelta !== 0) return priorityDelta

        const verifiedDelta = Number(right.worker.isVerified) - Number(left.worker.isVerified)
        if (verifiedDelta !== 0) return verifiedDelta

        const scoreDelta = right.matchMeta.score - left.matchMeta.score
        if (scoreDelta !== 0) return scoreDelta

        return getWorkerNameFallback(left.worker).localeCompare(getWorkerNameFallback(right.worker))
      }),
    [effectiveJobContext, rankedWorkers]
  )

  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages])

  const activeFilterChips = [
    city ? { key: `city-${city}`, label: city, clear: () => setCity('') } : null,
    industryCategory ? { key: `industry-${industryCategory}`, label: industryCategory, clear: () => setIndustryCategory('') } : null,
    businessType ? { key: `business-${businessType}`, label: businessType, clear: () => setBusinessType('') } : null,
    category ? { key: `category-${category}`, label: category, clear: () => setCategory('') } : null,
    availability
      ? { key: `availability-${availability}`, label: getAvailabilityMeta(availability).label, clear: () => setAvailability('') }
      : null,
    workerStatus
      ? {
          key: `worker-status-${workerStatus}`,
          label: workerStatusOptions.find(option => option.id === workerStatus)?.label || workerStatus,
          clear: () => setWorkerStatus('')
        }
      : null,
    experience
      ? { key: `experience-${experience}`, label: experienceFilters.find(option => option.id === experience)?.label || experience, clear: () => setExperience('') }
      : null,
    wage
      ? { key: `wage-${wage}`, label: wageFilters.find(option => option.id === wage)?.label || wage, clear: () => setWage('') }
      : null
  ].filter((value): value is { key: string; label: string; clear: () => void } => Boolean(value))

  const clearAllFilters = () => {
    setSearch('')
    setCity('')
    setCategory('')
    setIndustryCategory('')
    setBusinessType('')
    setAvailability('')
    setWorkerStatus('')
    setExperience('')
    setWage('')
    setSortBy('relevance')
  }

  const emptyStateCopy = useMemo(() => {
    if (hasIndustrySelection && !hasIndustryBusinessMappings && !hasIndustryCategoryMappings) {
      return {
        title: searchPage.emptyTitle || 'No workers match these filters yet',
        description: 'No worker category mappings found for this Industry Category yet.'
      }
    }

    if (hasIndustrySelection && hasBusinessTypeSelection && !hasSelectedPairMappings) {
      return {
        title: searchPage.emptyTitle || 'No workers match these filters yet',
        description: 'No labour category mappings found for this Industry Category and Business Type yet.'
      }
    }

    return {
      title: searchPage.emptyTitle || 'No workers found for the selected filters.',
      description: searchPage.emptyDescription || 'Try another search or clear the filters to see more workers.'
    }
  }, [
    hasBusinessTypeSelection,
    hasIndustryBusinessMappings,
    hasIndustryCategoryMappings,
    hasIndustrySelection,
    hasSelectedPairMappings,
    searchPage.emptyDescription,
    searchPage.emptyTitle
  ])

  const selectedPriorityCategoryLabel = effectiveJobContext?.categoryLabel || effectiveJobContext?.categoryId || ''
  const selectedPriorityCategoryCity = effectiveJobContext?.city || ''

  const handlePriorityCategorySelect = (jobId: string) => {
    if (!jobId || jobId === requestedJobId) return
    setRequestedJobId(jobId)
    setCurrentPage(1)
  }

  const toggleShortlist = (workerId: string) => {
    setShortlistedWorkerIds(current => {
      const next = current.includes(workerId)
        ? current.filter(id => id !== workerId)
        : [...current, workerId]

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(next))
      }

      return next
    })
  }

  const toggleExpandedWorker = (workerId: string) => {
    setExpandedWorkerIds(current =>
      current.includes(workerId)
        ? current.filter(id => id !== workerId)
        : [...current, workerId]
    )
  }

  const toggleContact = (workerId: string) => {
    setRevealedContactWorkerIds(current =>
      current.includes(workerId)
        ? current.filter(id => id !== workerId)
        : [...current, workerId]
    )
  }

  const openIdentityProof = async (worker: WorkerItem) => {
    if (typeof window === 'undefined' || !worker.identityProofPath) return

    const cachedUrl = identityProofUrls[worker.id]
    if (cachedUrl) {
      window.open(cachedUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (identityProofLoadingIds.includes(worker.id)) return
    setIdentityProofLoadingIds(current => [...current, worker.id])

    try {
      const response = await fetch(`/api/labour/company/search/worker-proof?workerId=${encodeURIComponent(worker.id)}`, {
        cache: 'no-store'
      })
      const payload = await response.json()
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Unable to open identity proof')
      }
      setIdentityProofUrls(current => ({ ...current, [worker.id]: payload.url }))
      window.open(payload.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to open identity proof')
    } finally {
      setIdentityProofLoadingIds(current => current.filter(id => id !== worker.id))
    }
  }

  const openCompanyPanel = async () => {
    if (openingCompanyPanel) return
    setOpeningCompanyPanel(true)

    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_TOKEN_KEY) : null
      if (localToken) {
        router.push(resolveHref('/labour/company/panel'))
        return
      }

      const response = await fetch('/api/labour/company/auth/dashboard-session', {
        cache: 'no-store'
      })

      if (response.ok) {
        router.push(resolveHref('/labour/company/panel'))
        return
      }

      router.push(resolveHref('/labour/company/signin'))
    } catch {
      router.push(resolveHref('/labour/company/signin'))
    } finally {
      setOpeningCompanyPanel(false)
    }
  }

  return (
    <>
      <section className={styles.searchHeroSection}>
        <div className={styles.searchHeroContent}>
          <p className={styles.searchHeroEyebrow}>{searchPage.eyebrow}</p>
          <h1 className={styles.searchHeroTitle}>
            {searchTitle.before}
            {searchTitle.highlight ? <span className={styles.searchHeroTitleHighlight}>{searchTitle.highlight}</span> : null}
            {searchTitle.after}
          </h1>
          <p className={styles.searchHeroText}>{searchPage.subtitle}</p>
          <div className={styles.searchHeroMobileInfoGroup}>
            <div className={styles.searchHeroTrustRow}>
              {(searchPage.trustPoints || []).slice(0, 3).map((point, index) => (
                <div key={`${point}-${index}`} className={styles.searchHeroTrustItem}>
                  {index === 0 ? <ShieldCheck size={16} strokeWidth={2.2} /> : null}
                  {index === 1 ? <Sparkles size={16} strokeWidth={2.2} /> : null}
                  {index === 2 ? <CheckCircle2 size={16} strokeWidth={2.2} /> : null}
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.searchHeroMedia}>
          <div className={styles.searchHeroImageFrame}>
            <img
              src={searchPage.imageSrc || '/worker-hero-reference.png'}
              alt="Search Worker banner"
              className={styles.searchHeroImage}
            />
            <div className={styles.searchHeroFloatingCard}>
              <div className={styles.searchHeroFloatingIcon}>
                <Users size={18} strokeWidth={2.2} />
              </div>
              <div className={styles.searchHeroFloatingContent}>
                <strong>{searchPage.floatingCardTitle}</strong>
                <p>{searchPage.floatingCardDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.searchDirectorySection}>
        <div className={styles.directoryLayout}>
          <aside className={styles.filterSidebar}>
            <div className={styles.filterSidebarHeader}>
              <div>
                <p className={styles.filterSidebarTitle}>Search Filters</p>
                <p className={styles.filterSidebarHint}>
                  {!isCompanyAuthenticated
                    ? 'Login / Post a job to contact workers.'
                    : canViewWorkerContacts && hasActiveJobCategories
                      ? `Direct worker access is active for these live job categories: ${accessCompany?.activeJobCategoryLabels.join(', ')}.`
                      : 'Post or repost a job to unlock direct worker contact access.'}
                </p>
              </div>
              {(activeFilterChips.length || search) ? (
                <button type="button" onClick={clearAllFilters} className={styles.filterClearButton}>
                  Clear all
                </button>
              ) : null}
            </div>

            {(activeFilterChips.length || search) ? (
              <div className={styles.activeFilterChipRow}>
                {search ? (
                  <button type="button" onClick={() => setSearch('')} className={styles.activeFilterChip}>
                    Search: {search}
                  </button>
                ) : null}
                {activeFilterChips.map(item => (
                  <button key={item.key} type="button" onClick={item.clear} className={styles.activeFilterChip}>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Search Worker</label>
              <div className={styles.searchInputWrap}>
                <Search size={16} strokeWidth={2.2} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search by worker, skill, city or category"
                  className={styles.searchInputField}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Worker Status</label>
              <select value={workerStatus} onChange={event => setWorkerStatus(event.target.value)} className={styles.selectField}>
                {workerStatusOptions.map(option => (
                  <option key={option.id || 'all'} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>City</label>
              <select value={city} onChange={event => setCity(event.target.value)} className={styles.selectField}>
                <option value="">All cities</option>
                {cities.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Industry Category</label>
              <select
                value={industryCategory}
                onChange={event => {
                  setIndustryCategory(event.target.value)
                  setBusinessType('')
                  setCategory('')
                }}
                className={styles.selectField}
              >
                <option value="">All Industry Categories</option>
                {industryCategoryOptions.map(option => (
                  <option key={option.id} value={option.label}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Business Type</label>
              <select
                value={businessType}
                onChange={event => {
                  setBusinessType(event.target.value)
                  setCategory('')
                }}
                className={styles.selectField}
                disabled={!industryCategory}
              >
                <option value="">{industryCategory ? 'All Business Types' : 'Select Industry Category first'}</option>
                {availableBusinessTypeOptions.map(option => (
                  <option key={option.id} value={option.label}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Categories</label>
              <select value={category} onChange={event => setCategory(event.target.value)} className={styles.selectField}>
                <option value="">All categories</option>
                {filteredCategoryOptions.map(option => (
                  <option key={option.id} value={option.name}>{option.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Availability</label>
              <select value={availability} onChange={event => setAvailability(event.target.value)} className={styles.selectField}>
                <option value="">All availability</option>
                {availabilityOptions.map(option => (
                  <option key={option} value={option}>{getAvailabilityMeta(option).label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Experience</label>
              <select value={experience} onChange={event => setExperience(event.target.value)} className={styles.selectField}>
                <option value="">All experience</option>
                {experienceFilters.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.fieldLabel}>Expected wage</label>
              <select value={wage} onChange={event => setWage(event.target.value)} className={styles.selectField}>
                <option value="">All wages</option>
                {wageFilters.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          </aside>

          <div className={styles.resultsPane}>
            <div className={styles.searchResultsToolbar}>
              <div>
                <p className={styles.searchResultsCount}>
                  Showing {pagination.totalCount === 0 ? 0 : (currentPage - 1) * pagination.pageSize + 1}-
                  {Math.min(currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} workers
                </p>
                <p className={styles.searchResultsHint}>
                  {isPending ? 'Loading updated matches...' : 'Use the filters to narrow results by industry, business type, city, availability and skills.'}
                </p>
                {priorityCategoryTabs.length > 0 && selectedPriorityCategoryLabel ? (
                  <div className={styles.searchPriorityCategoryBlock}>
                    <div className={styles.searchPriorityCategoryHeader}>
                      <p className={styles.searchPriorityCategory}>
                        Priority category: <strong>{selectedPriorityCategoryLabel}</strong>
                      </p>
                      {selectedPriorityCategoryCity ? (
                        <p className={styles.searchPriorityCategoryMeta}>
                          Matching workers from <strong>{selectedPriorityCategoryCity}</strong> are shown first.
                        </p>
                      ) : null}
                    </div>
                    <div className={styles.searchPriorityCategoryTabRow} aria-label="Active job categories">
                      {priorityCategoryTabs.map(tab => {
                        const isSelected = Boolean(
                          tab.jobId === requestedJobId ||
                          (
                            !requestedJobId &&
                            effectiveJobContext &&
                            matchesValue(tab.categoryId, effectiveJobContext.categoryId)
                          )
                        )

                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => handlePriorityCategorySelect(tab.jobId)}
                            className={isSelected ? styles.searchPriorityCategoryTabActive : styles.searchPriorityCategoryTab}
                            aria-pressed={isSelected}
                            title={tab.city ? `${tab.categoryLabel} • ${tab.city}` : tab.categoryLabel}
                          >
                            {tab.categoryLabel}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={styles.searchResultsActions}>
                <select value={sortBy} onChange={event => setSortBy(event.target.value as (typeof sortOptions)[number]['id'])} className={styles.searchSortSelect}>
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>Sort by: {option.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={openCompanyPanel}
                  className={`${styles.searchPanelMiniButton} ${styles.companyActionPulse}`}
                  disabled={openingCompanyPanel}
                >
                  {openingCompanyPanel ? 'Opening...' : accessCompany ? 'Open Company Panel' : 'Company Login'}
                </button>
              </div>
            </div>

            {pagination.totalCount === 0 ? (
              <div className={styles.resultsEmptyCard}>
                <h2 className={styles.sectionTitle}>{emptyStateCopy.title}</h2>
                <p className={styles.textMuted}>{emptyStateCopy.description}</p>
                <div className={styles.buttonRow} style={{ marginTop: '18px' }}>
                  <button type="button" onClick={clearAllFilters} className={styles.homeHeroSecondaryButton}>
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.searchWorkerCardList}>
                {paginatedWorkers.map(({ worker, matchMeta }) => {
                  const availabilityMeta = getAvailabilityMeta(worker.availability, worker.status)
                  const statusMeta = getWorkerStatusMeta(worker.status)
                  const workerTags = Array.from(new Set([...worker.categoryLabels, ...worker.skills])).slice(0, 4)
                  const isExpanded = expandedWorkerIds.includes(worker.id)
                  const isShortlisted = shortlistedWorkerIds.includes(worker.id)
                  const hasCategoryPriority = Boolean(effectiveJobContext)
                  const isCategoryMatch = hasCategoryPriority && matchMeta.exactCategoryMatch
                  const matchBadgeLabel = isCategoryMatch ? 'Category Match' : 'Other Category'
                  const cardToneClass = getWorkerCardToneClass(isCategoryMatch, worker.status)
                  const lockedAccessCopy = getLockedAccessCopy(worker)

                  return (
                    <article
                      key={worker.id}
                      className={`${styles.searchWorkerCard} ${cardToneClass}`}
                      data-worker-name={worker.fullName}
                      data-match-bucket={matchMeta.bucket}
                      data-exact-category-match={matchMeta.exactCategoryMatch ? 'true' : 'false'}
                      data-worker-status={statusMeta.label.toLowerCase()}
                    >
                      <div className={styles.searchWorkerMedia}>
                        <div className={styles.searchWorkerAvatarWrap}>
                          {worker.profilePhotoPath && !imageFallbackWorkerIds.includes(worker.id) ? (
                            <img
                              src={worker.profilePhotoUrl || worker.profilePhotoPath}
                              alt={worker.fullName}
                              className={styles.searchWorkerAvatarImage}
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                setImageFallbackWorkerIds(current =>
                                  current.includes(worker.id) ? current : [...current, worker.id]
                                )
                              }
                            />
                          ) : (
                            <div className={styles.searchWorkerAvatarFallback}>
                              {getInitials(worker.fullName)}
                            </div>
                          )}
                          {availabilityMeta.isActive ? <span className={styles.searchWorkerActiveDot} /> : null}
                          {worker.isVerified ? (
                            <span className={styles.searchWorkerVerifiedPill}>
                              <ShieldCheck size={13} strokeWidth={2.2} />
                              Verified
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.searchWorkerBody}>
                        <div className={styles.searchWorkerIdentityRow}>
                          <div>
                            <div className={styles.searchWorkerNameRow}>
                              <h2 className={styles.searchWorkerName}>{worker.fullName}</h2>
                              {worker.isVerified ? <CheckCircle2 size={18} strokeWidth={2.2} className={styles.searchWorkerVerifiedIcon} /> : null}
                              {hasCategoryPriority ? (
                                <span className={`${styles.searchWorkerMatchBadge} ${isCategoryMatch ? styles.searchWorkerMatchBadgePositive : styles.searchWorkerMatchBadgeNeutral}`}>
                                  {matchBadgeLabel}
                                </span>
                              ) : null}
                              <span className={`${styles.searchWorkerStatusBadge} ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className={styles.searchWorkerRole}>{worker.categoryLabels[0] || worker.businessTypeLabel || 'Skilled Worker'}</p>
                          </div>
                        </div>

                        <div className={styles.searchWorkerMetaRow}>
                          <span className={styles.searchWorkerMetaItem}>
                            <MapPin size={14} strokeWidth={2.1} />
                            {worker.city || worker.homeCity || 'Location not added'}
                          </span>
                          <span className={styles.searchWorkerMetaItem}>
                            <BriefcaseBusiness size={14} strokeWidth={2.1} />
                            {worker.industryCategoryLabel}
                          </span>
                          <span className={styles.searchWorkerMetaItem}>
                            <Users size={14} strokeWidth={2.1} />
                            {worker.businessTypeLabel}
                          </span>
                        </div>

                        <div className={styles.searchWorkerChipRow}>
                          {workerTags.map(tag => (
                            <span key={`${worker.id}-${tag}`} className={styles.searchWorkerChip}>{tag}</span>
                          ))}
                        </div>

                        {isExpanded ? (
                          <div className={styles.searchWorkerExpandedPanel}>
                            <div className={`${styles.searchWorkerExpandedGrid} ${styles.searchWorkerExpandedGridDesktopOnly}`}>
                              <div className={styles.searchWorkerExpandedItem}>
                                <span>Experience</span>
                                <strong>{worker.experienceYears} years</strong>
                              </div>
                              <div className={styles.searchWorkerExpandedItem}>
                                <span>Home City</span>
                                <strong>{worker.homeCity || 'Not added'}</strong>
                              </div>
                              <div className={styles.searchWorkerExpandedItem}>
                                <span>Address</span>
                                <strong>{worker.address || 'Not added yet'}</strong>
                              </div>
                            </div>
                            {(worker.identityProofType || worker.identityProofNumber || worker.identityProofPath) ? (
                              <div className={`${styles.searchWorkerProofCard} ${styles.searchWorkerProofCardDesktopOnly}`}>
                                <div className={styles.searchWorkerProofMeta}>
                                  {worker.identityProofType ? (
                                    <p>
                                      <span>Identity proof</span>
                                      <strong>{worker.identityProofType}</strong>
                                    </p>
                                  ) : null}
                                  {worker.identityProofNumber ? (
                                    <p>
                                      <span>Proof number</span>
                                      <strong>{worker.identityProofNumber}</strong>
                                    </p>
                                  ) : null}
                                </div>
                                {worker.identityProofPath ? (
                                  <button
                                    type="button"
                                    onClick={() => openIdentityProof(worker)}
                                    className={styles.searchWorkerProofButton}
                                    disabled={identityProofLoadingIds.includes(worker.id)}
                                  >
                                    <Download size={15} strokeWidth={2.2} />
                                    {identityProofLoadingIds.includes(worker.id) ? 'Opening...' : 'View Identity Proof'}
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                            <div
                              className={`${styles.searchWorkerExpandedActions} ${
                                canViewWorkerContacts && workerCanAccessDirectly(worker)
                                  ? styles.searchWorkerExpandedActionsUnlocked
                                  : styles.searchWorkerExpandedActionsLocked
                              }`}
                            >
                              {canViewWorkerContacts && workerCanAccessDirectly(worker) ? (
                                <>
                                  {revealedContactWorkerIds.includes(worker.id) ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleContact(worker.id)}
                                      className={`${styles.workerActionPrimary} ${styles.searchWorkerContactButton}`}
                                      style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}
                                    >
                                      <Phone size={14} strokeWidth={2.3} />
                                      {worker.mobile}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleContact(worker.id)}
                                      className={`${styles.workerActionPrimary} ${styles.searchWorkerContactButton}`}
                                      style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}
                                    >
                                      <Phone size={14} strokeWidth={2.3} />
                                      View Contact
                                    </button>
                                  )}
                                  <a
                                    href={getWhatsappHref(worker.mobile, resolveHref('/labour/company/contact'))}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.whatsappButtonCompact} ${styles.searchWorkerWhatsappButtonCompact}`}
                                    aria-label={`Open WhatsApp for ${worker.fullName}`}
                                    title={`WhatsApp ${worker.fullName}`}
                                  >
                                    <MessageCircle size={18} strokeWidth={2.3} />
                                  </a>
                                </>
                              ) : (
                                <>
                                  <p className={styles.searchWorkerAccessLockNotice}>{lockedAccessCopy.message}</p>
                                  <Link href={lockedAccessCopy.primaryHref} className={`${styles.workerActionSecondary} ${styles.searchWorkerLockButton}`}>
                                    {lockedAccessCopy.primaryLabel}
                                  </Link>
                                  <Link href={lockedAccessCopy.secondaryHref} className={`${styles.workerActionSecondary} ${styles.searchWorkerLockButton}`}>
                                    {lockedAccessCopy.secondaryLabel}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className={styles.searchWorkerActions}>
                        <span className={`${styles.searchWorkerAvailabilityLabel} ${availabilityMeta.className}`}>
                          {availabilityMeta.label}
                        </span>
                        <div className={styles.searchWorkerWageBlock}>
                          <span>Expected salary</span>
                          <strong>{getWorkerSalaryDisplay(worker)}</strong>
                        </div>
                        <button type="button" onClick={() => toggleExpandedWorker(worker.id)} className={styles.searchWorkerPrimaryButton}>
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        <button type="button" onClick={() => toggleShortlist(worker.id)} className={styles.searchWorkerShortlistButton}>
                          <Heart size={16} strokeWidth={2.2} fill={isShortlisted ? 'currentColor' : 'none'} />
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {pagination.totalCount > pagination.pageSize ? (
              <div className={styles.searchPagination}>
                <button
                  type="button"
                  className={styles.searchPaginationButton}
                  onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <div className={styles.searchPaginationNumbers}>
                  {paginationItems.map(item => (
                    item === 'ellipsis-left' || item === 'ellipsis-right' ? (
                      <span key={item} className={styles.searchPaginationEllipsis}>...</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={item === currentPage ? styles.searchPaginationButtonActive : styles.searchPaginationButton}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    )
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.searchPaginationButton}
                  onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${accentColor}, ${highlightColor})` }}>
        <div className={styles.sectionFooter} style={{ marginBottom: 0 }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>Need faster matching?</h2>
            <p className={styles.textMutedDark}>Post your job requirement so the admin team can help you activate the right worker search faster.</p>
          </div>
          <div className={styles.buttonRow}>
            <Link href={resolveHref('/labour/company/job-post')} className={styles.secondaryButton}>
              Submit company enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

