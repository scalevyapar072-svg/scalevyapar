import { getSeededMasterAliases, seededBusinessTypeCatalog, seededIndustryCategoryCatalog } from './labour-dependency-seeds'

export type LabourMasterGroup = 'common' | 'worker' | 'company' | 'jobPost'

export type LabourMasterKey =
  | 'city'
  | 'business_type'
  | 'industry_category'
  | 'state'
  | 'worker_experience_years'
  | 'worker_status_availability'
  | 'company_status'
  | 'job_gender_preference'
  | 'job_experience_required'
  | 'job_shift_type'
  | 'job_weekly_off'
  | 'job_duration'
  | 'job_salary_type'
  | 'job_overtime_available'
  | 'job_food_facility'
  | 'job_accommodation'
  | 'job_transport_facility'

export interface LabourMasterOption {
  id: string
  masterKey: LabourMasterKey
  label: string
  value: string
  slug: string
  description: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface LabourCategoryDependency {
  id: string
  categoryId: string
  businessTypeOptionId: string
  industryCategoryOptionId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LabourIndustryBusinessDependency {
  id: string
  industryCategoryOptionId: string
  businessTypeOptionId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LabourMastersSnapshot {
  options: LabourMasterOption[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  categoryDependencies: LabourCategoryDependency[]
  storage: 'supabase' | 'json'
}

export interface LabourMasterDefinition {
  key: LabourMasterKey
  label: string
  group: LabourMasterGroup
  description: string
}

export interface LabourMasterSeed {
  label: string
  value?: string
  description?: string
}

export interface LabourMasterSelectOption {
  id: string
  label: string
  value: string
  isActive: boolean
  isFallback?: boolean
}

export const labourMasterGroupLabels: Record<LabourMasterGroup, string> = {
  common: 'Common Masters',
  worker: 'Worker Masters',
  company: 'Company Masters',
  jobPost: 'Job Post Masters'
}

export const labourMasterDefinitions: Record<LabourMasterKey, LabourMasterDefinition> = {
  city: {
    key: 'city',
    label: 'City',
    group: 'common',
    description: 'Shared city options used across worker, company, and job forms.'
  },
  business_type: {
    key: 'business_type',
    label: 'Business Type',
    group: 'common',
    description: 'Business-type options used in labour company and category dependency flows.'
  },
  industry_category: {
    key: 'industry_category',
    label: 'Industry Category',
    group: 'common',
    description: 'Industry categories used in labour company and category dependency flows.'
  },
  state: {
    key: 'state',
    label: 'State',
    group: 'common',
    description: 'Shared state options used in labour company workflows.'
  },
  worker_experience_years: {
    key: 'worker_experience_years',
    label: 'Experience Years',
    group: 'worker',
    description: 'Worker experience-year selections for create and edit flows.'
  },
  worker_status_availability: {
    key: 'worker_status_availability',
    label: 'Status Availability',
    group: 'worker',
    description: 'Worker availability selections used in labour worker forms.'
  },
  company_status: {
    key: 'company_status',
    label: 'Status',
    group: 'company',
    description: 'Company status options for labour company forms and filters.'
  },
  job_gender_preference: {
    key: 'job_gender_preference',
    label: 'Gender Preference',
    group: 'jobPost',
    description: 'Gender preference options for labour job posts.'
  },
  job_experience_required: {
    key: 'job_experience_required',
    label: 'Experience Required',
    group: 'jobPost',
    description: 'Experience requirement options for labour job posts.'
  },
  job_shift_type: {
    key: 'job_shift_type',
    label: 'Shift Type',
    group: 'jobPost',
    description: 'Shift-type options for labour job posts.'
  },
  job_weekly_off: {
    key: 'job_weekly_off',
    label: 'Weekly Off',
    group: 'jobPost',
    description: 'Weekly-off options for labour job posts.'
  },
  job_duration: {
    key: 'job_duration',
    label: 'Job Duration',
    group: 'jobPost',
    description: 'Job-duration options for labour job posts.'
  },
  job_salary_type: {
    key: 'job_salary_type',
    label: 'Salary Type',
    group: 'jobPost',
    description: 'Salary-type options for labour job posts.'
  },
  job_overtime_available: {
    key: 'job_overtime_available',
    label: 'Overtime Available',
    group: 'jobPost',
    description: 'Overtime-availability options for labour job posts.'
  },
  job_food_facility: {
    key: 'job_food_facility',
    label: 'Food Facility',
    group: 'jobPost',
    description: 'Food-facility options for labour job posts.'
  },
  job_accommodation: {
    key: 'job_accommodation',
    label: 'Accommodation',
    group: 'jobPost',
    description: 'Accommodation options for labour job posts.'
  },
  job_transport_facility: {
    key: 'job_transport_facility',
    label: 'Transport Facility',
    group: 'jobPost',
    description: 'Transport-facility options for labour job posts.'
  }
}

export const labourMasterKeys = Object.keys(labourMasterDefinitions) as LabourMasterKey[]

export const labourMasterSeedValues: Record<LabourMasterKey, LabourMasterSeed[]> = {
  city: [
    'Jaipur',
    'Delhi',
    'Mumbai',
    'Bengaluru',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Hyderabad',
    'Chennai',
    'Surat',
    'Lucknow',
    'Nagpur',
    'Vadodara',
    'Indore',
    'Patna',
    'Rajkot',
    'Chandigarh',
    'Bhopal',
    'Ludhiana',
    'Kanpur',
    'Nashik',
    'Bhubaneswar'
  ].map(label => ({ label })),
  business_type: seededBusinessTypeCatalog.map(item => ({ label: item.label, value: item.value })),
  industry_category: seededIndustryCategoryCatalog.map(item => ({ label: item.label, value: item.value })),
  state: [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ].map(label => ({ label })),
  worker_experience_years: [
    { label: 'Fresher', value: '0' },
    { label: '1 Year', value: '1' },
    { label: '2 Years', value: '2' },
    { label: '3 Years', value: '3' },
    { label: '5 Years', value: '5' },
    { label: '10+ Years', value: '10' }
  ],
  worker_status_availability: [
    { label: 'Ready to Work today', value: 'available_today' },
    { label: 'Can join in 7 days', value: 'available_this_week' },
    { label: 'Not Available', value: 'not_available' }
  ],
  company_status: [
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Blocked', value: 'blocked' }
  ],
  job_gender_preference: ['Male', 'Female', 'Any'].map(label => ({ label })),
  job_experience_required: ['Fresher', '1+ Years', '2+ Years', '5+ Years', 'Experienced Only'].map(label => ({ label })),
  job_shift_type: ['Day Shift', 'Night Shift', 'Rotational Shift'].map(label => ({ label })),
  job_weekly_off: ['Sunday', 'Saturday', 'Friday', 'Rotational', 'As Per Roster'].map(label => ({ label })),
  job_duration: ['1 Day', '1 Week', '1 Month', 'Contract Basis', 'Permanent'].map(label => ({ label })),
  job_salary_type: ['Daily Wage', 'Weekly Payment', 'Monthly Salary', 'Contract Payment'].map(label => ({ label })),
  job_overtime_available: ['Yes', 'No'].map(label => ({ label })),
  job_food_facility: ['Available', 'Not Available'].map(label => ({ label })),
  job_accommodation: ['Available', 'Not Available'].map(label => ({ label })),
  job_transport_facility: ['Available', 'Not Available'].map(label => ({ label }))
}

const compareText = (value: string) => value.trim().toLowerCase()

export const isLabourMasterOptionVisible = (option: LabourMasterOption | null | undefined) =>
  Boolean(option && option.isActive !== false)

export const slugifyLabourMaster = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const sortLabourMasterOptions = (options: LabourMasterOption[]) =>
  [...options].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
    return left.label.localeCompare(right.label, 'en', { sensitivity: 'base' })
  })

export const groupLabourMasterOptions = (options: LabourMasterOption[]) => {
  const grouped = Object.fromEntries(labourMasterKeys.map(key => [key, []])) as unknown as Record<LabourMasterKey, LabourMasterOption[]>
  options.forEach(option => {
    grouped[option.masterKey].push(option)
  })
  labourMasterKeys.forEach(key => {
    grouped[key] = sortLabourMasterOptions(grouped[key])
  })
  return grouped
}

const optionMatchesMasterValue = (option: LabourMasterOption, value: string) => {
  const normalizedValue = compareText(value)
  if (!normalizedValue) return false

  if (
    compareText(option.id) === normalizedValue ||
    compareText(option.slug) === normalizedValue ||
    compareText(option.value) === normalizedValue ||
    compareText(option.label) === normalizedValue
  ) {
    return true
  }

  return getSeededMasterAliases(option.masterKey, option.value).some(alias => compareText(alias) === normalizedValue)
}

export const findMatchingMasterOption = (options: LabourMasterOption[], value: string) => {
  return options.find(option => optionMatchesMasterValue(option, value))
}

export const getVisibleLabourMasterOptions = (options: LabourMasterOption[]) =>
  sortLabourMasterOptions(options.filter(option => isLabourMasterOptionVisible(option)))

export const buildLabourMasterSelectOptions = (
  options: LabourMasterOption[],
  selectedValues: string[] = [],
  fallbackValues: string[] = []
): LabourMasterSelectOption[] => {
  const nextOptions: LabourMasterSelectOption[] = sortLabourMasterOptions(options)
    .filter(option => option.isActive)
    .map(option => ({
      id: option.id,
      label: option.label,
      value: option.value,
      isActive: option.isActive
    }))

  const addFallbackValue = (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    const alreadyIncluded = nextOptions.some(option =>
      compareText(option.value) === compareText(trimmedValue) || compareText(option.label) === compareText(trimmedValue)
    )
    if (alreadyIncluded) return

    nextOptions.push({
      id: `fallback-${slugifyLabourMaster(trimmedValue) || 'value'}`,
      label: trimmedValue,
      value: trimmedValue,
      isActive: false,
      isFallback: true
    })
  }

  selectedValues.forEach(addFallbackValue)
  fallbackValues.forEach(addFallbackValue)
  return nextOptions
}

export const resolveLabourMasterLabel = (
  options: LabourMasterOption[],
  value: string,
  fallback = value
) => {
  const match = findMatchingMasterOption(options, value)
  return match?.label || fallback
}

export const filterBusinessTypesByIndustryDependency = (
  businessTypeOptions: LabourMasterOption[],
  industryCategoryOptions: LabourMasterOption[],
  industryBusinessDependencies: LabourIndustryBusinessDependency[],
  industryCategoryValue: string
) => {
  const visibleBusinessTypeOptions = getVisibleLabourMasterOptions(businessTypeOptions)
  const visibleIndustryCategoryOptions = getVisibleLabourMasterOptions(industryCategoryOptions)
  const selectedIndustryCategory = industryCategoryValue.trim()
  if (!selectedIndustryCategory) {
    return [] as LabourMasterOption[]
  }

  const matchingIndustryCategoryIds = visibleIndustryCategoryOptions
    .filter(option => optionMatchesMasterValue(option, selectedIndustryCategory))
    .map(option => option.id)

  if (matchingIndustryCategoryIds.length === 0) {
    return [] as LabourMasterOption[]
  }

  const allowedBusinessTypeIds = new Set(
    industryBusinessDependencies
      .filter(dependency => dependency.isActive && matchingIndustryCategoryIds.includes(dependency.industryCategoryOptionId))
      .map(dependency => dependency.businessTypeOptionId)
  )

  return visibleBusinessTypeOptions.filter(option => allowedBusinessTypeIds.has(option.id))
}

export const filterCategoriesByLabourDependency = <T extends { id: string; isActive?: boolean }>(
  categories: T[],
  categoryDependencies: LabourCategoryDependency[],
  optionsByKey: Record<LabourMasterKey, LabourMasterOption[]>,
  businessTypeValue: string,
  industryCategoryValue: string
) => {
  const activeCategories = categories.filter(category => category.isActive !== false)
  const selectedBusinessType = businessTypeValue.trim()
  const selectedIndustryCategory = industryCategoryValue.trim()
  const visibleBusinessTypeOptions = getVisibleLabourMasterOptions(optionsByKey.business_type || [])
  const visibleIndustryCategoryOptions = getVisibleLabourMasterOptions(optionsByKey.industry_category || [])

  if (!selectedBusinessType && !selectedIndustryCategory) {
    return activeCategories
  }

  const matchingBusinessTypeIds = selectedBusinessType
    ? visibleBusinessTypeOptions
        .filter(option => optionMatchesMasterValue(option, selectedBusinessType))
        .map(option => option.id)
    : []

  const matchingIndustryCategoryIds = selectedIndustryCategory
    ? visibleIndustryCategoryOptions
        .filter(option => optionMatchesMasterValue(option, selectedIndustryCategory))
        .map(option => option.id)
    : []

  const matchingDependencies = categoryDependencies.filter(dependency => {
    if (!dependency.isActive) return false
    if (selectedBusinessType && !matchingBusinessTypeIds.includes(dependency.businessTypeOptionId)) return false
    if (selectedIndustryCategory && !matchingIndustryCategoryIds.includes(dependency.industryCategoryOptionId)) return false
    return true
  })

  if (matchingDependencies.length === 0) {
    return [] as T[]
  }

  const allowedCategoryIds = new Set(matchingDependencies.map(dependency => dependency.categoryId))
  const filteredCategories = activeCategories.filter(category => allowedCategoryIds.has(category.id))
  return filteredCategories
}
