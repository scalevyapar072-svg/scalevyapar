'use client'

import Link from 'next/link'
import { BriefcaseBusiness, CheckCircle2, Heart, MapPin, MessageCircle, Phone, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  type LabourCategoryDependency,
  type LabourIndustryBusinessDependency,
  type LabourMasterOption
} from '@/lib/labour-masters-schema'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const SHORTLIST_STORAGE_KEY = 'labour_company_search_shortlist'

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
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  profilePhotoPath: string
  industryCategory: string
  industryCategoryLabel: string
  businessType: string
  businessTypeLabel: string
  createdAt: string
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
  activePlan: string
  companyCategoryLabels: string[]
  activeJobCategoryIds: string[]
  activeJobCategoryLabels: string[]
  canUnlockWorkers: boolean
  stats: {
    liveJobs: number
    totalApplications: number
    shortlistedApplications: number
    hiredApplications: number
  }
}

type Props = {
  workers: WorkerItem[]
  searchPage: SearchPageContent
  categories: CategoryOption[]
  cities: string[]
  industryCategoryOptions: LabourMasterOption[]
  businessTypeOptions: LabourMasterOption[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  categoryDependencies: LabourCategoryDependency[]
  accentColor: string
  highlightColor: string
  featuredCompany: FeaturedCompany | null
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

const normalize = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[&/+,_-]+/g, ' ')
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

const getWhatsappHref = (mobile: string) => {
  const digits = mobile.replace(/\D/g, '')
  return digits ? `https://wa.me/91${digits}` : '/labour/company/contact'
}

const getAvailabilityMeta = (availability: string) => {
  const normalized = normalize(availability)
  if (normalized === normalize('available_today')) {
    return { label: 'Available Today', className: styles.searchWorkerAvailabilityToday, isActive: true }
  }

  if (normalized === normalize('available_this_week')) {
    return { label: 'Available This Week', className: styles.searchWorkerAvailabilitySoon, isActive: true }
  }

  return { label: 'Not Available', className: styles.searchWorkerAvailabilityMuted, isActive: false }
}

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
  searchPage,
  categories,
  cities,
  industryCategoryOptions,
  businessTypeOptions,
  industryBusinessDependencies,
  categoryDependencies,
  accentColor,
  highlightColor,
  featuredCompany
}: Props) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [industryCategory, setIndustryCategory] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [availability, setAvailability] = useState('')
  const [experience, setExperience] = useState('')
  const [wage, setWage] = useState('')
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['id']>('relevance')
  const [openingCompanyPanel, setOpeningCompanyPanel] = useState(false)
  const [expandedWorkerIds, setExpandedWorkerIds] = useState<string[]>([])
  const [shortlistedWorkerIds, setShortlistedWorkerIds] = useState<string[]>([])
  const [revealedContactWorkerIds, setRevealedContactWorkerIds] = useState<string[]>([])
  const [imageFallbackWorkerIds, setImageFallbackWorkerIds] = useState<string[]>([])

  const canViewWorkerContacts = Boolean(featuredCompany?.canUnlockWorkers)
  const hasActiveJobCategories = Boolean(featuredCompany?.activeJobCategoryLabels.length)
  const searchTitle = splitHighlightedTitle(searchPage.title, searchPage.highlightedText)

  useEffect(() => {
    if (typeof window === 'undefined') return

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

  const availabilityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workers
            .map(worker => worker.availability)
            .filter(Boolean)
        )
      ),
    [workers]
  )

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

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const combinedSearch = [
        worker.fullName,
        worker.city,
        worker.homeCity,
        worker.address,
        worker.industryCategoryLabel,
        worker.businessTypeLabel,
        worker.skills.join(' '),
        worker.categoryLabels.join(' ')
      ]
        .join(' ')
        .toLowerCase()

      const searchMatch = !search || combinedSearch.includes(search.toLowerCase())
      const cityMatch = !city || normalize(worker.city) === normalize(city) || normalize(worker.homeCity) === normalize(city)
      const workerCategoryIdSet = new Set(worker.categoryIds)
      const categoryMatch =
        !category ||
        Array.from(matchingCategoryIds).some(categoryId => workerCategoryIdSet.has(categoryId)) ||
        worker.categoryLabels.some(label => matchesValue(label, category))
      const inferredIndustryMatch =
        !industryCategory ||
        matchingCategoryDependencies.some(dependency =>
          workerCategoryIdSet.has(dependency.categoryId) &&
          (!matchingIndustryCategoryOptionIds.size || matchingIndustryCategoryOptionIds.has(dependency.industryCategoryOptionId))
        )
      const inferredBusinessMatch =
        !businessType ||
        matchingCategoryDependencies.some(dependency =>
          workerCategoryIdSet.has(dependency.categoryId) &&
          (!matchingBusinessTypeOptionIds.size || matchingBusinessTypeOptionIds.has(dependency.businessTypeOptionId))
        )
      const directIndustryMatch = workerMatchesMasterSelection(
        industryCategory,
        [worker.industryCategory, worker.industryCategoryLabel],
        industryCategoryOptions
      )
      const directBusinessMatch = workerMatchesMasterSelection(
        businessType,
        [worker.businessType, worker.businessTypeLabel],
        businessTypeOptions
      )
      const industryMatch = !industryCategory || directIndustryMatch || inferredIndustryMatch
      const businessMatch = !businessType || directBusinessMatch || inferredBusinessMatch
      const availabilityMatch = !availability || worker.availability === availability
      const selectedExperience = experienceFilters.find(option => option.id === experience)
      const selectedWage = wageFilters.find(option => option.id === wage)
      const experienceMatch = !selectedExperience || selectedExperience.match(worker.experienceYears)
      const wageMatch = !selectedWage || selectedWage.match(worker.expectedDailyWage)

      return searchMatch && cityMatch && categoryMatch && industryMatch && businessMatch && availabilityMatch && experienceMatch && wageMatch
    })
  }, [
    availability,
    businessType,
    businessTypeOptions,
    category,
    city,
    experience,
    industryCategory,
    industryCategoryOptions,
    matchingBusinessTypeOptionIds,
    matchingCategoryDependencies,
    matchingCategoryIds,
    matchingIndustryCategoryOptionIds,
    search,
    wage,
    workers
  ])

  const sortedWorkers = useMemo(() => {
    const nextWorkers = [...filteredWorkers]

    switch (sortBy) {
      case 'name-asc':
        nextWorkers.sort((left, right) => left.fullName.localeCompare(right.fullName))
        break
      case 'name-desc':
        nextWorkers.sort((left, right) => right.fullName.localeCompare(left.fullName))
        break
      case 'newest':
        nextWorkers.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        break
      case 'wage-asc':
        nextWorkers.sort((left, right) => left.expectedDailyWage - right.expectedDailyWage)
        break
      case 'wage-desc':
        nextWorkers.sort((left, right) => right.expectedDailyWage - left.expectedDailyWage)
        break
      default:
        break
    }

    return nextWorkers
  }, [filteredWorkers, sortBy])

  const activeFilterChips = [
    city ? { key: `city-${city}`, label: city, clear: () => setCity('') } : null,
    industryCategory ? { key: `industry-${industryCategory}`, label: industryCategory, clear: () => setIndustryCategory('') } : null,
    businessType ? { key: `business-${businessType}`, label: businessType, clear: () => setBusinessType('') } : null,
    category ? { key: `category-${category}`, label: category, clear: () => setCategory('') } : null,
    availability
      ? { key: `availability-${availability}`, label: getAvailabilityMeta(availability).label, clear: () => setAvailability('') }
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

  const openCompanyPanel = async () => {
    if (openingCompanyPanel) return
    setOpeningCompanyPanel(true)

    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_TOKEN_KEY) : null
      if (localToken) {
        window.location.assign('/labour/company/panel')
        return
      }

      const response = await fetch('/api/labour/company/auth/dashboard-session', {
        cache: 'no-store'
      })

      if (response.ok) {
        window.location.assign('/labour/company/panel')
        return
      }

      window.location.assign('/login')
    } catch {
      window.location.assign('/login')
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

        <div className={styles.searchHeroMedia}>
          <div className={styles.searchHeroImageFrame}>
            <img
              src={searchPage.imageSrc || '/worker-hero-reference.png'}
              alt="Search worker banner"
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
                  {canViewWorkerContacts && hasActiveJobCategories
                    ? `Direct worker access is active for these live job categories: ${featuredCompany?.activeJobCategoryLabels.join(', ')}.`
                    : searchPage.helperText}
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
              <label className={styles.fieldLabel}>Search worker</label>
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
              <label className={styles.fieldLabel}>Cities</label>
              <select value={city} onChange={event => setCity(event.target.value)} className={styles.selectField}>
                <option value="">All cities</option>
                {cities.map(option => (
                  <option key={option} value={option}>{option}</option>
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
                <p className={styles.searchResultsCount}>Showing {sortedWorkers.length} workers</p>
                <p className={styles.searchResultsHint}>Use the filters to narrow results by industry, business type, city, availability and skills.</p>
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
                  {openingCompanyPanel ? 'Opening...' : 'Open Company Panel'}
                </button>
              </div>
            </div>

            {sortedWorkers.length === 0 ? (
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
                {sortedWorkers.map(worker => {
                  const availabilityMeta = getAvailabilityMeta(worker.availability)
                  const workerTags = Array.from(new Set([...worker.categoryLabels, ...worker.skills])).slice(0, 4)
                  const isExpanded = expandedWorkerIds.includes(worker.id)
                  const isShortlisted = shortlistedWorkerIds.includes(worker.id)

                  return (
                    <article key={worker.id} className={styles.searchWorkerCard}>
                      <div className={styles.searchWorkerMedia}>
                        <div className={styles.searchWorkerAvatarWrap}>
                          {worker.profilePhotoPath && !imageFallbackWorkerIds.includes(worker.id) ? (
                            <img
                              src={worker.profilePhotoPath}
                              alt={worker.fullName}
                              className={styles.searchWorkerAvatarImage}
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
                            <div className={styles.searchWorkerExpandedGrid}>
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
                            <div className={styles.searchWorkerExpandedActions}>
                              {canViewWorkerContacts && worker.canAccessDirectly ? (
                                <>
                                  {revealedContactWorkerIds.includes(worker.id) ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleContact(worker.id)}
                                      className={styles.workerActionPrimary}
                                      style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}
                                    >
                                      <Phone size={14} strokeWidth={2.3} />
                                      {worker.mobile}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleContact(worker.id)}
                                      className={styles.workerActionPrimary}
                                      style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}
                                    >
                                      <Phone size={14} strokeWidth={2.3} />
                                      View Contact
                                    </button>
                                  )}
                                  <a
                                    href={getWhatsappHref(worker.mobile)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.whatsappButtonCompact}
                                    aria-label={`Open WhatsApp for ${worker.fullName}`}
                                    title={`WhatsApp ${worker.fullName}`}
                                  >
                                    <MessageCircle size={18} strokeWidth={2.3} />
                                  </a>
                                </>
                              ) : (
                                <>
                                  <Link href="/labour/company/job-post" className={styles.workerActionSecondary}>
                                    Post your requirement
                                  </Link>
                                  <Link href="/labour/company/contact" className={styles.workerActionSecondary}>
                                    Contact us
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
                          <strong>{formatCurrency(worker.expectedDailyWage)} / day</strong>
                        </div>
                        <button type="button" onClick={() => toggleExpandedWorker(worker.id)} className={styles.searchWorkerPrimaryButton}>
                          {isExpanded ? 'Hide Profile' : 'View Profile'}
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
            <Link href="/labour/company/job-post" className={styles.secondaryButton}>
              Submit company enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
