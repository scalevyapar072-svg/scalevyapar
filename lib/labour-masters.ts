import { promises as fs } from 'fs'
import path from 'path'
import {
  getSeededMasterAliases,
  getSeededMasterCatalogForKey
} from './labour-dependency-seeds'
import { supabaseAdmin } from './supabase-admin'
import {
  findMatchingMasterOption,
  LabourCategoryDependency,
  LabourIndustryBusinessDependency,
  LabourMasterKey,
  LabourMasterOption,
  LabourMastersSnapshot,
  labourMasterDefinitions,
  labourMasterKeys,
  labourMasterSeedValues,
  slugifyLabourMaster,
  sortLabourMasterOptions
} from './labour-masters-schema'

interface LabourMastersData {
  options: LabourMasterOption[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  categoryDependencies: LabourCategoryDependency[]
  catalogSyncVersions?: Partial<Record<LabourMasterKey, number>>
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-masters.json')
const TABLE_NAME = 'labour_admin_settings'
const RECORD_ID = 'labour-master-data'
const AUDIT_TABLE_NAME = 'labour_audit_logs'
const INDUSTRY_CATEGORY_CATALOG_SYNC_VERSION = 1
const BUSINESS_TYPE_CATALOG_SYNC_VERSION = 1

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const compareText = (value: string) => value.trim().toLowerCase()

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const ensureMasterKey = (value: unknown): LabourMasterKey | null => {
  if (typeof value !== 'string') return null
  return labourMasterKeys.includes(value as LabourMasterKey) ? (value as LabourMasterKey) : null
}

const normalizeString = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback
  return value.trim()
}

const normalizeBoolean = (value: unknown, fallback = true) =>
  typeof value === 'boolean' ? value : fallback

const normalizeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map(item => normalizeString(item))
    .filter(Boolean)
}

const toSnakeCaseCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const optionMatchesSeed = (
  option: LabourMasterOption,
  masterKey: LabourMasterKey,
  seed: { label: string; value: string; aliases?: string[] }
) => {
  if (option.masterKey !== masterKey) return false
  const comparisons = [
    option.id,
    option.label,
    option.value,
    option.slug,
    seed.label,
    seed.value,
    ...(seed.aliases || []),
    ...getSeededMasterAliases(masterKey, seed.value)
  ].map(compareText)

  const optionValues = [option.id, option.label, option.value, option.slug].map(compareText)
  return optionValues.some(value => comparisons.includes(value))
}

const shouldAutoSeedMasterKey = (masterKey: LabourMasterKey) =>
  !['industry_category', 'business_type'].includes(masterKey)

const syncMasterCatalog = (
  masterKey: LabourMasterKey,
  options: LabourMasterOption[],
  currentVersion: number,
  targetVersion: number
) => {
  if (currentVersion >= targetVersion) {
    return {
      options,
      version: currentVersion
    }
  }

  const timestamp = new Date().toISOString()
  const nextOptions = [...options]
  const seededCatalog = getSeededMasterCatalogForKey(masterKey)

  seededCatalog.forEach((seed, index) => {
    const existing = nextOptions.find(option => optionMatchesSeed(option, masterKey, seed))
    if (existing) {
      existing.label = seed.label
      existing.value = seed.value
      existing.slug = slugifyLabourMaster(seed.value || seed.label) || existing.slug
      existing.description = masterKey === 'business_type'
        ? (existing.description || '')
        : existing.description
      existing.isActive = true
      existing.sortOrder = index + 1
      existing.updatedAt = timestamp
      return
    }

    nextOptions.unshift({
      id: `master-${masterKey}-${slugifyLabourMaster(seed.value || seed.label) || index + 1}`,
      masterKey,
      label: seed.label,
      value: seed.value,
      slug: slugifyLabourMaster(seed.value || seed.label) || `${masterKey}-${index + 1}`,
      description: '',
      isActive: true,
      sortOrder: index + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  })

  return {
    options: nextOptions.reduce<LabourMasterOption[]>((list, option) => {
      if (list.some(item => item.id === option.id)) return list
      return [...list, option]
    }, []),
    version: targetVersion
  }
}

const mergeSeededMasterOptions = (options: LabourMasterOption[]) => {
  const timestamp = new Date().toISOString()
  const nextOptions = [...options]

  labourMasterKeys.forEach(masterKey => {
    if (!shouldAutoSeedMasterKey(masterKey)) return
    const seededCatalog = getSeededMasterCatalogForKey(masterKey)
    if (seededCatalog.length === 0) return

    seededCatalog.forEach((seed, index) => {
      const existing = nextOptions.find(option => optionMatchesSeed(option, masterKey, seed))
      if (existing) {
        existing.label = seed.label
        existing.value = seed.value
        existing.slug = slugifyLabourMaster(seed.value || seed.label) || existing.slug
        existing.description = existing.description || seed.label
        existing.isActive = true
        existing.sortOrder = index + 1
        existing.updatedAt = existing.updatedAt || timestamp
        return
      }

      nextOptions.unshift({
        id: `master-${masterKey}-${slugifyLabourMaster(seed.value || seed.label) || index + 1}`,
        masterKey,
        label: seed.label,
        value: seed.value,
        slug: slugifyLabourMaster(seed.value || seed.label) || `${masterKey}-${index + 1}`,
        description: seed.label,
        isActive: true,
        sortOrder: index + 1,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    })
  })

  return nextOptions.reduce<LabourMasterOption[]>((list, option) => {
    if (list.some(item => item.id === option.id)) return list
    return [...list, option]
  }, [])
}

const normalizeOptionSemanticKey = (option: LabourMasterOption) =>
  `${option.masterKey}::${compareText(option.value || option.label)}`

const collapseDuplicateOptions = (
  options: LabourMasterOption[],
  categoryDependencies: LabourCategoryDependency[],
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
) => {
  const canonicalBySemanticKey = new Map<string, LabourMasterOption>()
  const optionIdRedirects = new Map<string, string>()

  const chooseCanonicalOption = (current: LabourMasterOption, candidate: LabourMasterOption) => {
    if (candidate.isActive && !current.isActive) return candidate
    if (candidate.createdAt < current.createdAt) return candidate
    return current
  }

  options.forEach(option => {
    const semanticKey = normalizeOptionSemanticKey(option)
    const current = canonicalBySemanticKey.get(semanticKey)
    if (!current) {
      canonicalBySemanticKey.set(semanticKey, option)
      return
    }

    const canonical = chooseCanonicalOption(current, option)
    const duplicate = canonical.id === current.id ? option : current
    canonicalBySemanticKey.set(semanticKey, canonical)
    optionIdRedirects.set(duplicate.id, canonical.id)

    canonical.description = canonical.description || duplicate.description
    canonical.sortOrder = Math.min(canonical.sortOrder, duplicate.sortOrder)
    canonical.isActive = canonical.isActive || duplicate.isActive
    canonical.updatedAt = canonical.updatedAt > duplicate.updatedAt ? canonical.updatedAt : duplicate.updatedAt
  })

  if (optionIdRedirects.size === 0) {
    return {
      options,
      categoryDependencies,
      industryBusinessDependencies
    }
  }

  const resolvedOptionId = (optionId: string) => optionIdRedirects.get(optionId) || optionId

  const remappedIndustryBusinessDependencies = industryBusinessDependencies.map(dependency => ({
    ...dependency,
    industryCategoryOptionId: resolvedOptionId(dependency.industryCategoryOptionId),
    businessTypeOptionId: resolvedOptionId(dependency.businessTypeOptionId)
  }))

  const remappedCategoryDependencies = categoryDependencies.map(dependency => ({
    ...dependency,
    industryCategoryOptionId: resolvedOptionId(dependency.industryCategoryOptionId),
    businessTypeOptionId: resolvedOptionId(dependency.businessTypeOptionId)
  }))

  return {
    options: Array.from(canonicalBySemanticKey.values()),
    industryBusinessDependencies: remappedIndustryBusinessDependencies,
    categoryDependencies: remappedCategoryDependencies
  }
}

const defaultLabourMastersData = (): LabourMastersData => {
  const timestamp = new Date().toISOString()

  const syncedIndustryCategoryCatalog = syncMasterCatalog(
    'industry_category',
    labourMasterKeys.flatMap(masterKey =>
      shouldAutoSeedMasterKey(masterKey)
        ? labourMasterSeedValues[masterKey].map((seed, index) => {
            const label = seed.label.trim()
            const value = (seed.value || seed.label).trim()
            return {
              id: `master-${masterKey}-${slugifyLabourMaster(value) || index + 1}`,
              masterKey,
              label,
              value,
              slug: slugifyLabourMaster(value || label) || `${masterKey}-${index + 1}`,
              description: seed.description || '',
              isActive: true,
              sortOrder: index + 1,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          })
        : []
    ),
    0,
    INDUSTRY_CATEGORY_CATALOG_SYNC_VERSION
  )
  const syncedBusinessTypeCatalog = syncMasterCatalog(
    'business_type',
    syncedIndustryCategoryCatalog.options,
    0,
    BUSINESS_TYPE_CATALOG_SYNC_VERSION
  )

  return {
    options: syncedBusinessTypeCatalog.options,
    industryBusinessDependencies: [],
    categoryDependencies: [],
    catalogSyncVersions: {
      industry_category: INDUSTRY_CATEGORY_CATALOG_SYNC_VERSION,
      business_type: BUSINESS_TYPE_CATALOG_SYNC_VERSION
    }
  }
}

const normalizeOptionRecord = (value: unknown, fallback: LabourMasterOption): LabourMasterOption => {
  const candidate = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const masterKey = ensureMasterKey(candidate.masterKey) || fallback.masterKey
  const label = normalizeString(candidate.label, fallback.label)
  const rawValue = normalizeString(candidate.value, fallback.value || label)
  const optionValue = rawValue || label

  return {
    id: normalizeString(candidate.id, fallback.id) || fallback.id,
    masterKey,
    label: label || fallback.label,
    value: optionValue || fallback.value,
    slug: normalizeString(candidate.slug, fallback.slug) || slugifyLabourMaster(optionValue || label) || fallback.slug,
    description: normalizeString(candidate.description, fallback.description),
    isActive: normalizeBoolean(candidate.isActive, fallback.isActive),
    sortOrder: normalizeNumber(candidate.sortOrder, fallback.sortOrder),
    createdAt: normalizeString(candidate.createdAt, fallback.createdAt),
    updatedAt: normalizeString(candidate.updatedAt, fallback.updatedAt)
  }
}

const normalizeDependencyRecord = (value: unknown, fallback: LabourCategoryDependency): LabourCategoryDependency => {
  const candidate = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>

  return {
    id: normalizeString(candidate.id, fallback.id) || fallback.id,
    categoryId: normalizeString(candidate.categoryId, fallback.categoryId),
    businessTypeOptionId: normalizeString(candidate.businessTypeOptionId, fallback.businessTypeOptionId),
    industryCategoryOptionId: normalizeString(candidate.industryCategoryOptionId, fallback.industryCategoryOptionId),
    isActive: normalizeBoolean(candidate.isActive, fallback.isActive),
    createdAt: normalizeString(candidate.createdAt, fallback.createdAt),
    updatedAt: normalizeString(candidate.updatedAt, fallback.updatedAt)
  }
}

const normalizeIndustryBusinessDependencyRecord = (
  value: unknown,
  fallback: LabourIndustryBusinessDependency
): LabourIndustryBusinessDependency => {
  const candidate = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>

  return {
    id: normalizeString(candidate.id, fallback.id) || fallback.id,
    industryCategoryOptionId: normalizeString(candidate.industryCategoryOptionId, fallback.industryCategoryOptionId),
    businessTypeOptionId: normalizeString(candidate.businessTypeOptionId, fallback.businessTypeOptionId),
    isActive: normalizeBoolean(candidate.isActive, fallback.isActive),
    createdAt: normalizeString(candidate.createdAt, fallback.createdAt),
    updatedAt: normalizeString(candidate.updatedAt, fallback.updatedAt)
  }
}

const normalizeLabourMastersData = (value: unknown): LabourMastersData => {
  const fallback = defaultLabourMastersData()
  const candidate = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const optionFallbackMap = new Map(fallback.options.map(option => [option.id, option]))
  const catalogSyncVersionsInput =
    candidate.catalogSyncVersions && typeof candidate.catalogSyncVersions === 'object'
      ? (candidate.catalogSyncVersions as Record<string, unknown>)
      : {}
  const catalogSyncVersions: Partial<Record<LabourMasterKey, number>> = {}

  labourMasterKeys.forEach(masterKey => {
    catalogSyncVersions[masterKey] = normalizeNumber(catalogSyncVersionsInput[masterKey], 0)
  })

  const options = Array.isArray(candidate.options)
    ? candidate.options
        .map(item => {
          const rawId = normalizeString((item as Record<string, unknown>)?.id)
          const optionFallback = optionFallbackMap.get(rawId) || fallback.options[0]
          return normalizeOptionRecord(item, optionFallback)
        })
        .filter(option => Boolean(option.id && option.label && option.value && labourMasterDefinitions[option.masterKey]))
    : fallback.options

  const dependencies = Array.isArray(candidate.categoryDependencies)
    ? candidate.categoryDependencies
        .map((item, index) =>
          normalizeDependencyRecord(item, {
            id: `dependency-${index + 1}`,
            categoryId: '',
            businessTypeOptionId: '',
            industryCategoryOptionId: '',
            isActive: true,
            createdAt: fallback.options[0]?.createdAt || new Date().toISOString(),
            updatedAt: fallback.options[0]?.updatedAt || new Date().toISOString()
          })
        )
        .filter(dependency => Boolean(dependency.id && dependency.categoryId))
    : []

  const industryBusinessDependencies = Array.isArray(candidate.industryBusinessDependencies)
    ? candidate.industryBusinessDependencies
        .map((item, index) =>
          normalizeIndustryBusinessDependencyRecord(item, {
            id: `industry-business-${index + 1}`,
            industryCategoryOptionId: '',
            businessTypeOptionId: '',
            isActive: true,
            createdAt: fallback.options[0]?.createdAt || new Date().toISOString(),
            updatedAt: fallback.options[0]?.updatedAt || new Date().toISOString()
          })
        )
        .filter(dependency => Boolean(dependency.id && dependency.industryCategoryOptionId && dependency.businessTypeOptionId))
    : []

  const syncedIndustryCategoryCatalog = syncMasterCatalog(
    'industry_category',
    options,
    catalogSyncVersions.industry_category || 0,
    INDUSTRY_CATEGORY_CATALOG_SYNC_VERSION
  )
  catalogSyncVersions.industry_category = syncedIndustryCategoryCatalog.version
  const syncedBusinessTypeCatalog = syncMasterCatalog(
    'business_type',
    syncedIndustryCategoryCatalog.options,
    catalogSyncVersions.business_type || 0,
    BUSINESS_TYPE_CATALOG_SYNC_VERSION
  )
  catalogSyncVersions.business_type = syncedBusinessTypeCatalog.version
  const seededOptions = mergeSeededMasterOptions(syncedBusinessTypeCatalog.options)
  const collapsedOptions = collapseDuplicateOptions(
    seededOptions,
    dependencies,
    industryBusinessDependencies
  )

  const dedupedOptions = collapsedOptions.options.reduce<LabourMasterOption[]>((list, option) => {
    if (list.some(item => item.id === option.id)) return list
    return [...list, option]
  }, [])

  const dedupedIndustryBusinessDependencies = collapsedOptions.industryBusinessDependencies.reduce<LabourIndustryBusinessDependency[]>((list, dependency) => {
    if (list.some(item => item.id === dependency.id)) return list
    return [...list, dependency]
  }, [])

  const syncedIndustryBusinessDependencies = [...dedupedIndustryBusinessDependencies]
  collapsedOptions.categoryDependencies.forEach(dependency => {
    if (!dependency.industryCategoryOptionId || !dependency.businessTypeOptionId) return
    const existing = syncedIndustryBusinessDependencies.find(item =>
      item.industryCategoryOptionId === dependency.industryCategoryOptionId &&
      item.businessTypeOptionId === dependency.businessTypeOptionId
    )

    if (existing) {
      if (dependency.isActive) {
        existing.isActive = true
        existing.updatedAt = dependency.updatedAt
      }
      return
    }

    syncedIndustryBusinessDependencies.push({
      id: `industry-business-${dependency.industryCategoryOptionId}-${dependency.businessTypeOptionId}`,
      industryCategoryOptionId: dependency.industryCategoryOptionId,
      businessTypeOptionId: dependency.businessTypeOptionId,
      isActive: dependency.isActive,
      createdAt: dependency.createdAt,
      updatedAt: dependency.updatedAt
    })
  })

  return {
    options: sortLabourMasterOptions(dedupedOptions),
    industryBusinessDependencies: syncedIndustryBusinessDependencies.reduce<LabourIndustryBusinessDependency[]>((list, dependency) => {
      if (list.some(item => item.id === dependency.id)) return list
      return [...list, dependency]
    }, []),
    categoryDependencies: dependencies.reduce<LabourCategoryDependency[]>((list, dependency) => {
      if (list.some(item => item.id === dependency.id)) return list
      return [...list, dependency]
    }, []),
    catalogSyncVersions
  }
}

const readJsonData = async () => {
  try {
    const content = await fs.readFile(DATA_FILE_PATH, 'utf8')
    const parsed = JSON.parse(content)
    const normalized = normalizeLabourMastersData(parsed)

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      await writeJsonData(normalized)
    }

    return normalized
  } catch {
    return defaultLabourMastersData()
  }
}

const writeJsonData = async (data: LabourMastersData) => {
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const readSupabaseData = async () => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('settings_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return null
  }

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return defaultLabourMastersData()
  }

  const normalized = normalizeLabourMastersData(data.settings_json)
  if (JSON.stringify(data.settings_json) !== JSON.stringify(normalized)) {
    const { error: persistError } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        id: RECORD_ID,
        settings_json: normalized,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (persistError && !isMissingSupabaseTableError(persistError.message)) {
      console.warn('Labour master canonical sync skipped:', persistError.message)
    }
  }

  return normalized
}

const writeSupabaseData = async (data: LabourMastersData) => {
  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert({
      id: RECORD_ID,
      settings_json: data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error && isMissingSupabaseTableError(error.message)) {
    return false
  }

  if (error) {
    throw new Error(error.message)
  }

  return true
}

const writeAuditLog = async (
  action: 'create' | 'update',
  entityType: 'masters' | 'categoryDependencies',
  entityId: string,
  summary: string,
  actor: string
) => {
  try {
    const { error } = await supabaseAdmin.from(AUDIT_TABLE_NAME).insert({
      id: createId('audit'),
      action,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      actor,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.warn('Labour master audit log skipped:', error.message)
    }
  } catch (error) {
    console.warn('Labour master audit log skipped:', error)
  }
}

const readDataWithStorage = async (): Promise<{ data: LabourMastersData; storage: 'supabase' | 'json' }> => {
  const supabaseData = await readSupabaseData()
  if (supabaseData) {
    return { data: supabaseData, storage: 'supabase' }
  }

  return { data: await readJsonData(), storage: 'json' }
}

const writeDataWithStorage = async (data: LabourMastersData): Promise<'supabase' | 'json'> => {
  const wroteToSupabase = await writeSupabaseData(data)
  if (wroteToSupabase) return 'supabase'
  await writeJsonData(data)
  return 'json'
}

const createSnapshot = (data: LabourMastersData, storage: 'supabase' | 'json'): LabourMastersSnapshot => ({
  options: sortLabourMasterOptions(data.options),
  industryBusinessDependencies: [...data.industryBusinessDependencies].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  ),
  categoryDependencies: [...data.categoryDependencies].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  ),
  storage
})

const assertUniqueOptionValue = (
  options: LabourMasterOption[],
  masterKey: LabourMasterKey,
  nextValue: string,
  ignoreId?: string
) => {
  const duplicate = options.find(option =>
    option.masterKey === masterKey &&
    option.id !== ignoreId &&
    compareText(option.value) === compareText(nextValue)
  )

  if (duplicate) {
    if (masterKey === 'business_type') {
      throw new Error('A Business Type with this value/code already exists.')
    }

    throw new Error(`"${nextValue}" already exists in ${labourMasterDefinitions[masterKey].label}.`)
  }
}

const normalizeOptionInput = (
  payload: Record<string, unknown>,
  existing?: LabourMasterOption
): LabourMasterOption => {
  const masterKey = ensureMasterKey(payload.masterKey) || existing?.masterKey
  if (!masterKey) {
    throw new Error('A valid master key is required.')
  }

  const label = normalizeString(payload.label, existing?.label || '')
  if (!label) {
    throw new Error('Master label is required.')
  }

  const rawValue = normalizeString(payload.value, existing?.value || '')
  const fallbackValue = existing?.value || label
  const value = masterKey === 'business_type'
    ? toSnakeCaseCode(rawValue || label)
    : (rawValue || fallbackValue || label)
  const timestamp = new Date().toISOString()

  return {
    id: existing?.id || createId('master'),
    masterKey,
    label,
    value,
    slug: slugifyLabourMaster(normalizeString(payload.slug, existing?.slug || value) || value) || createId(masterKey),
    description: normalizeString(payload.description, existing?.description || ''),
    isActive: normalizeBoolean(payload.isActive, existing?.isActive ?? true),
    sortOrder: normalizeNumber(payload.sortOrder, existing?.sortOrder ?? 0),
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  }
}

const validateDependencyFields = (
  payload: Record<string, unknown>,
  options: LabourMasterOption[],
  existing?: Partial<LabourCategoryDependency>
) => {
  const businessTypeOptionId = normalizeString(payload.businessTypeOptionId, existing?.businessTypeOptionId || '')
  const industryCategoryOptionId = normalizeString(payload.industryCategoryOptionId, existing?.industryCategoryOptionId || '')
  const isActive = normalizeBoolean(payload.isActive, existing?.isActive ?? true)

  if (!industryCategoryOptionId) {
    throw new Error('Industry Category is required for category dependency mapping.')
  }

  if (!businessTypeOptionId) {
    throw new Error('Business Type is required for category dependency mapping.')
  }

  const businessTypeOption = findMatchingMasterOption(
    options.filter(item => item.masterKey === 'business_type'),
    businessTypeOptionId
  )
  if (!businessTypeOption) {
    throw new Error('Selected Business Type was not found in master values. Please refresh and try again.')
  }

  const industryCategoryOption = findMatchingMasterOption(
    options.filter(item => item.masterKey === 'industry_category'),
    industryCategoryOptionId
  )
  if (!industryCategoryOption) {
    throw new Error('Selected Industry Category was not found in master values. Please refresh and try again.')
  }

  return {
    businessTypeOptionId: businessTypeOption.id,
    industryCategoryOptionId: industryCategoryOption.id,
    isActive
  }
}

const validateIndustryBusinessFields = (
  payload: Record<string, unknown>,
  options: LabourMasterOption[],
  existing?: Partial<LabourIndustryBusinessDependency>
) => {
  const industryCategoryOptionId = normalizeString(payload.industryCategoryOptionId, existing?.industryCategoryOptionId || '')
  const isActive = normalizeBoolean(payload.isActive, existing?.isActive ?? true)
  const businessTypeOptionIds = Array.from(new Set(normalizeStringArray(payload.businessTypeOptionIds)))

  if (!industryCategoryOptionId) {
    throw new Error('Industry Category is required for this mapping.')
  }

  if (!businessTypeOptionIds.length) {
    const singleBusinessTypeOptionId = normalizeString(payload.businessTypeOptionId)
    if (singleBusinessTypeOptionId) {
      businessTypeOptionIds.push(singleBusinessTypeOptionId)
    }
  }

  if (!businessTypeOptionIds.length) {
    throw new Error('Select at least one Business Type for this Industry Category.')
  }

  const industryCategoryOption = findMatchingMasterOption(
    options.filter(item => item.masterKey === 'industry_category'),
    industryCategoryOptionId
  )
  if (!industryCategoryOption) {
    throw new Error('Selected Industry Category was not found in master values. Please refresh and try again.')
  }

  const resolvedBusinessTypeOptionIds = Array.from(
    new Set(
      businessTypeOptionIds.map(businessTypeOptionId => {
        const option = findMatchingMasterOption(
          options.filter(item => item.masterKey === 'business_type'),
          businessTypeOptionId
        )
        if (!option) {
          throw new Error('Selected Business Type was not found in master values. Please refresh and try again.')
        }
        return option.id
      })
    )
  )

  const originalIndustryCategoryOptionId = normalizeString(
    payload.originalIndustryCategoryOptionId,
    existing?.industryCategoryOptionId || ''
  )

  return {
    industryCategoryOptionId: industryCategoryOption.id,
    businessTypeOptionIds: resolvedBusinessTypeOptionIds,
    originalIndustryCategoryOptionId,
    isActive
  }
}

const normalizeDependencySetInput = (
  payload: Record<string, unknown>,
  options: LabourMasterOption[],
  existing?: Partial<LabourCategoryDependency>
) => {
  const categoryIds = Array.from(new Set(normalizeStringArray(payload.categoryIds)))
  if (!categoryIds.length) {
    const singleCategoryId = normalizeString(payload.categoryId)
    if (singleCategoryId) {
      categoryIds.push(singleCategoryId)
    }
  }

  if (!categoryIds.length) {
    throw new Error('Select at least one labour category for this mapping.')
  }

  const validated = validateDependencyFields(payload, options, existing)
  const originalBusinessTypeOptionId = normalizeString(
    payload.originalBusinessTypeOptionId,
    existing?.businessTypeOptionId || ''
  )
  const originalIndustryCategoryOptionId = normalizeString(
    payload.originalIndustryCategoryOptionId,
    existing?.industryCategoryOptionId || ''
  )

  return {
    categoryIds,
    businessTypeOptionId: validated.businessTypeOptionId,
    industryCategoryOptionId: validated.industryCategoryOptionId,
    originalBusinessTypeOptionId,
    originalIndustryCategoryOptionId,
    isActive: validated.isActive
  }
}

const assertUniqueDependency = (
  dependencies: LabourCategoryDependency[],
  nextDependency: LabourCategoryDependency,
  ignoreId?: string
) => {
  if (!nextDependency.isActive) return

  const duplicate = dependencies.find(dependency =>
    dependency.id !== ignoreId &&
    dependency.isActive &&
    dependency.categoryId === nextDependency.categoryId &&
    dependency.businessTypeOptionId === nextDependency.businessTypeOptionId &&
    dependency.industryCategoryOptionId === nextDependency.industryCategoryOptionId
  )

  if (duplicate) {
    throw new Error('This active category dependency mapping already exists.')
  }
}

const assertUniqueIndustryBusinessDependency = (
  dependencies: LabourIndustryBusinessDependency[],
  nextDependency: LabourIndustryBusinessDependency,
  ignoreId?: string
) => {
  if (!nextDependency.isActive) return

  const duplicate = dependencies.find(dependency =>
    dependency.id !== ignoreId &&
    dependency.isActive &&
    dependency.industryCategoryOptionId === nextDependency.industryCategoryOptionId &&
    dependency.businessTypeOptionId === nextDependency.businessTypeOptionId
  )

  if (duplicate) {
    throw new Error('This active Industry Category to Business Type mapping already exists.')
  }
}

const ensureIndustryBusinessDependency = (
  dependencies: LabourIndustryBusinessDependency[],
  industryCategoryOptionId: string,
  businessTypeOptionId: string,
  timestamp: string
) => {
  if (!industryCategoryOptionId || !businessTypeOptionId) return

  const existing = dependencies.find(
    dependency =>
      dependency.industryCategoryOptionId === industryCategoryOptionId &&
      dependency.businessTypeOptionId === businessTypeOptionId
  )

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true
      existing.updatedAt = timestamp
    }
    return
  }

  const record: LabourIndustryBusinessDependency = {
    id: createId('industry-business'),
    industryCategoryOptionId,
    businessTypeOptionId,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  assertUniqueIndustryBusinessDependency(dependencies, record)
  dependencies.unshift(record)
}

const resolveLabelForAudit = (
  options: LabourMasterOption[],
  masterKey: LabourMasterKey,
  optionId: string
) =>
  options.find(option => option.masterKey === masterKey && option.id === optionId)?.label || optionId

export const getLabourMastersSnapshot = async (): Promise<LabourMastersSnapshot> => {
  const { data, storage } = await readDataWithStorage()
  return createSnapshot(data, storage)
}

export const createLabourMasterOption = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const record = normalizeOptionInput(payload)
  assertUniqueOptionValue(data.options, record.masterKey, record.value)
  data.options.unshift(record)
  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    await writeAuditLog('create', 'masters', record.id, `Created ${labourMasterDefinitions[record.masterKey].label} option ${record.label}`, actor)
  }
  return createSnapshot(data, storage)
}

export const updateLabourMasterOption = async (
  id: string,
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot | null> => {
  const { data } = await readDataWithStorage()
  const existing = data.options.find(option => option.id === id)
  if (!existing) return null

  const record = normalizeOptionInput(payload, existing)
  assertUniqueOptionValue(data.options, record.masterKey, record.value, id)
  data.options = data.options.map(option => option.id === id ? record : option)
  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    await writeAuditLog('update', 'masters', record.id, `Updated ${labourMasterDefinitions[record.masterKey].label} option ${record.label}`, actor)
  }
  return createSnapshot(data, storage)
}

export const deleteLabourMasterOption = async (
  id: string,
  actor: string
): Promise<LabourMastersSnapshot | null> => {
  const { data } = await readDataWithStorage()
  const existing = data.options.find(option => option.id === id)
  if (!existing) return null

  const semanticKey = normalizeOptionSemanticKey(existing)
  const relatedOptionIds = new Set(
    data.options
      .filter(option => normalizeOptionSemanticKey(option) === semanticKey)
      .map(option => option.id)
  )

  data.options = data.options.filter(option => !relatedOptionIds.has(option.id))

  if (existing.masterKey === 'industry_category') {
    data.industryBusinessDependencies = data.industryBusinessDependencies.filter(
      dependency => !relatedOptionIds.has(dependency.industryCategoryOptionId)
    )

    data.categoryDependencies = data.categoryDependencies.filter(
      dependency => !relatedOptionIds.has(dependency.industryCategoryOptionId)
    )
  }

  if (existing.masterKey === 'business_type') {
    data.industryBusinessDependencies = data.industryBusinessDependencies.filter(
      dependency => !relatedOptionIds.has(dependency.businessTypeOptionId)
    )

    data.categoryDependencies = data.categoryDependencies.filter(
      dependency => !relatedOptionIds.has(dependency.businessTypeOptionId)
    )
  }

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    await writeAuditLog(
      'update',
      'masters',
      existing.id,
      `Deleted ${labourMasterDefinitions[existing.masterKey].label} option ${existing.label}`,
      actor
    )
  }
  return createSnapshot(data, storage)
}

export const createLabourCategoryDependency = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const input = normalizeDependencySetInput(payload, data.options)
  const timestamp = new Date().toISOString()
  const nextDependencies = [...data.categoryDependencies]
  const createdOrUpdated: LabourCategoryDependency[] = []

  ensureIndustryBusinessDependency(
    data.industryBusinessDependencies,
    input.industryCategoryOptionId,
    input.businessTypeOptionId,
    timestamp
  )

  input.categoryIds.forEach(categoryId => {
    const existing = nextDependencies.find(
      dependency =>
        dependency.categoryId === categoryId &&
        dependency.businessTypeOptionId === input.businessTypeOptionId &&
        dependency.industryCategoryOptionId === input.industryCategoryOptionId
    )

    if (existing) {
      if (existing.isActive !== input.isActive) {
        existing.isActive = input.isActive
        existing.updatedAt = timestamp
        createdOrUpdated.push(existing)
      }
      return
    }

    const record: LabourCategoryDependency = {
      id: createId('dependency'),
      categoryId,
      businessTypeOptionId: input.businessTypeOptionId,
      industryCategoryOptionId: input.industryCategoryOptionId,
      isActive: input.isActive,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    assertUniqueDependency(nextDependencies, record)
    nextDependencies.unshift(record)
    createdOrUpdated.push(record)
  })

  data.categoryDependencies = nextDependencies
  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase' && createdOrUpdated.length > 0) {
    for (const record of createdOrUpdated) {
      await writeAuditLog('create', 'categoryDependencies', record.id, `Created category dependency ${record.categoryId}`, actor)
    }
  }
  return createSnapshot(data, storage)
}

export const updateLabourCategoryDependency = async (
  id: string,
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot | null> => {
  const { data } = await readDataWithStorage()
  const existing = data.categoryDependencies.find(dependency => dependency.id === id)
  const input = normalizeDependencySetInput(payload, data.options, existing)
  const sourceBusinessTypeOptionId =
    input.originalBusinessTypeOptionId ||
    existing?.businessTypeOptionId ||
    input.businessTypeOptionId
  const sourceIndustryCategoryOptionId =
    input.originalIndustryCategoryOptionId ||
    existing?.industryCategoryOptionId ||
    input.industryCategoryOptionId
  const timestamp = new Date().toISOString()
  const selectedCategoryIds = new Set(input.categoryIds)

  const sourceGroup = data.categoryDependencies.filter(
    dependency =>
      dependency.businessTypeOptionId === sourceBusinessTypeOptionId &&
      dependency.industryCategoryOptionId === sourceIndustryCategoryOptionId
  )

  const targetGroup = data.categoryDependencies.filter(
    dependency =>
      dependency.businessTypeOptionId === input.businessTypeOptionId &&
      dependency.industryCategoryOptionId === input.industryCategoryOptionId
  )

  const groupRecordsByCategoryId = new Map(sourceGroup.map(dependency => [dependency.categoryId, dependency]))
  const targetRecordsByCategoryId = new Map(targetGroup.map(dependency => [dependency.categoryId, dependency]))
  const touchedIds = new Set<string>()
  const updatedRecords: LabourCategoryDependency[] = []

  ensureIndustryBusinessDependency(
    data.industryBusinessDependencies,
    input.industryCategoryOptionId,
    input.businessTypeOptionId,
    timestamp
  )

  input.categoryIds.forEach(categoryId => {
    const currentInTarget = targetRecordsByCategoryId.get(categoryId)
    const movableSourceRecord = groupRecordsByCategoryId.get(categoryId)

    if (currentInTarget) {
      currentInTarget.isActive = input.isActive
      currentInTarget.updatedAt = timestamp
      touchedIds.add(currentInTarget.id)
      updatedRecords.push(currentInTarget)
      return
    }

    if (movableSourceRecord) {
      movableSourceRecord.businessTypeOptionId = input.businessTypeOptionId
      movableSourceRecord.industryCategoryOptionId = input.industryCategoryOptionId
      movableSourceRecord.isActive = input.isActive
      movableSourceRecord.updatedAt = timestamp
      touchedIds.add(movableSourceRecord.id)
      updatedRecords.push(movableSourceRecord)
      return
    }

    const record: LabourCategoryDependency = {
      id: createId('dependency'),
      categoryId,
      businessTypeOptionId: input.businessTypeOptionId,
      industryCategoryOptionId: input.industryCategoryOptionId,
      isActive: input.isActive,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    assertUniqueDependency(data.categoryDependencies, record)
    data.categoryDependencies.unshift(record)
    touchedIds.add(record.id)
    updatedRecords.push(record)
  })

  sourceGroup.forEach(record => {
    if (selectedCategoryIds.has(record.categoryId) || touchedIds.has(record.id)) return
    record.isActive = false
    record.updatedAt = timestamp
    updatedRecords.push(record)
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    for (const record of updatedRecords) {
      await writeAuditLog('update', 'categoryDependencies', record.id, `Updated category dependency ${record.categoryId}`, actor)
    }
  }
  return createSnapshot(data, storage)
}

export const createIndustryBusinessDependency = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const input = validateIndustryBusinessFields(payload, data.options)
  const timestamp = new Date().toISOString()
  const createdOrUpdated: LabourIndustryBusinessDependency[] = []

  input.businessTypeOptionIds.forEach(businessTypeOptionId => {
    const existing = data.industryBusinessDependencies.find(
      dependency =>
        dependency.industryCategoryOptionId === input.industryCategoryOptionId &&
        dependency.businessTypeOptionId === businessTypeOptionId
    )

    if (existing) {
      if (existing.isActive !== input.isActive) {
        existing.isActive = input.isActive
        existing.updatedAt = timestamp
        createdOrUpdated.push(existing)
      }
      return
    }

    const record: LabourIndustryBusinessDependency = {
      id: createId('industry-business'),
      industryCategoryOptionId: input.industryCategoryOptionId,
      businessTypeOptionId,
      isActive: input.isActive,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    assertUniqueIndustryBusinessDependency(data.industryBusinessDependencies, record)
    data.industryBusinessDependencies.unshift(record)
    createdOrUpdated.push(record)
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase' && createdOrUpdated.length > 0) {
    for (const record of createdOrUpdated) {
      await writeAuditLog('create', 'categoryDependencies', record.id, `Created industry-business dependency ${record.industryCategoryOptionId}`, actor)
    }
  }
  return createSnapshot(data, storage)
}

export const updateIndustryBusinessDependency = async (
  id: string,
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot | null> => {
  const { data } = await readDataWithStorage()
  const existing = data.industryBusinessDependencies.find(dependency => dependency.id === id)
  const input = validateIndustryBusinessFields(payload, data.options, existing)
  const sourceIndustryCategoryOptionId =
    input.originalIndustryCategoryOptionId ||
    existing?.industryCategoryOptionId ||
    input.industryCategoryOptionId
  const timestamp = new Date().toISOString()
  const selectedBusinessTypeIds = new Set(input.businessTypeOptionIds)
  const sourceGroup = data.industryBusinessDependencies.filter(
    dependency => dependency.industryCategoryOptionId === sourceIndustryCategoryOptionId
  )
  const targetGroup = data.industryBusinessDependencies.filter(
    dependency => dependency.industryCategoryOptionId === input.industryCategoryOptionId
  )
  const sourceRecordsByBusinessTypeId = new Map(sourceGroup.map(dependency => [dependency.businessTypeOptionId, dependency]))
  const targetRecordsByBusinessTypeId = new Map(targetGroup.map(dependency => [dependency.businessTypeOptionId, dependency]))
  const touchedIds = new Set<string>()
  const updatedRecords: LabourIndustryBusinessDependency[] = []

  input.businessTypeOptionIds.forEach(businessTypeOptionId => {
    const currentInTarget = targetRecordsByBusinessTypeId.get(businessTypeOptionId)
    const movableSourceRecord = sourceRecordsByBusinessTypeId.get(businessTypeOptionId)

    if (currentInTarget) {
      currentInTarget.isActive = input.isActive
      currentInTarget.updatedAt = timestamp
      touchedIds.add(currentInTarget.id)
      updatedRecords.push(currentInTarget)
      return
    }

    if (movableSourceRecord) {
      movableSourceRecord.industryCategoryOptionId = input.industryCategoryOptionId
      movableSourceRecord.isActive = input.isActive
      movableSourceRecord.updatedAt = timestamp
      touchedIds.add(movableSourceRecord.id)
      updatedRecords.push(movableSourceRecord)
      return
    }

    const record: LabourIndustryBusinessDependency = {
      id: createId('industry-business'),
      industryCategoryOptionId: input.industryCategoryOptionId,
      businessTypeOptionId,
      isActive: input.isActive,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    assertUniqueIndustryBusinessDependency(data.industryBusinessDependencies, record)
    data.industryBusinessDependencies.unshift(record)
    touchedIds.add(record.id)
    updatedRecords.push(record)
  })

  sourceGroup.forEach(record => {
    if (selectedBusinessTypeIds.has(record.businessTypeOptionId) || touchedIds.has(record.id)) return
    record.isActive = false
    record.updatedAt = timestamp
    updatedRecords.push(record)
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    for (const record of updatedRecords) {
      await writeAuditLog('update', 'categoryDependencies', record.id, `Updated industry-business dependency ${record.industryCategoryOptionId}`, actor)
    }
  }
  return createSnapshot(data, storage)
}

export const removeIndustryBusinessDependency = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const industryCategoryOptionId = normalizeString(payload.industryCategoryOptionId)
  const businessTypeOptionId = normalizeString(payload.businessTypeOptionId)

  if (!industryCategoryOptionId || !businessTypeOptionId) {
    throw new Error('Industry Category and Business Type are required to remove this mapping.')
  }

  const timestamp = new Date().toISOString()
  const updatedRecords: Array<LabourIndustryBusinessDependency | LabourCategoryDependency> = []

  data.industryBusinessDependencies.forEach(record => {
    if (
      record.industryCategoryOptionId === industryCategoryOptionId &&
      record.businessTypeOptionId === businessTypeOptionId &&
      record.isActive
    ) {
      record.isActive = false
      record.updatedAt = timestamp
      updatedRecords.push(record)
    }
  })

  data.categoryDependencies.forEach(record => {
    if (
      record.industryCategoryOptionId === industryCategoryOptionId &&
      record.businessTypeOptionId === businessTypeOptionId &&
      record.isActive
    ) {
      record.isActive = false
      record.updatedAt = timestamp
      updatedRecords.push(record)
    }
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    const industryLabel = resolveLabelForAudit(data.options, 'industry_category', industryCategoryOptionId)
    const businessTypeLabel = resolveLabelForAudit(data.options, 'business_type', businessTypeOptionId)
    await writeAuditLog(
      'update',
      'categoryDependencies',
      `${industryCategoryOptionId}:${businessTypeOptionId}`,
      `Removed Business Type mapping ${businessTypeLabel} from ${industryLabel}`,
      actor
    )
  }

  return createSnapshot(data, storage)
}

export const removeLabourCategoryDependency = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const industryCategoryOptionId = normalizeString(payload.industryCategoryOptionId)
  const businessTypeOptionId = normalizeString(payload.businessTypeOptionId)
  const categoryId = normalizeString(payload.categoryId)

  if (!industryCategoryOptionId || !businessTypeOptionId || !categoryId) {
    throw new Error('Industry Category, Business Type and Labour Category are required to remove this mapping.')
  }

  const timestamp = new Date().toISOString()

  data.categoryDependencies.forEach(record => {
    if (
      record.industryCategoryOptionId === industryCategoryOptionId &&
      record.businessTypeOptionId === businessTypeOptionId &&
      record.categoryId === categoryId &&
      record.isActive
    ) {
      record.isActive = false
      record.updatedAt = timestamp
    }
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    const industryLabel = resolveLabelForAudit(data.options, 'industry_category', industryCategoryOptionId)
    const businessTypeLabel = resolveLabelForAudit(data.options, 'business_type', businessTypeOptionId)
    await writeAuditLog(
      'update',
      'categoryDependencies',
      `${industryCategoryOptionId}:${businessTypeOptionId}:${categoryId}`,
      `Removed Labour Category mapping ${categoryId} from ${industryLabel} + ${businessTypeLabel}`,
      actor
    )
  }

  return createSnapshot(data, storage)
}

export const clearLabourCategoryDependencyGroup = async (
  payload: Record<string, unknown>,
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const industryCategoryOptionId = normalizeString(payload.industryCategoryOptionId)
  const businessTypeOptionId = normalizeString(payload.businessTypeOptionId)

  if (!industryCategoryOptionId || !businessTypeOptionId) {
    throw new Error('Industry Category and Business Type are required to clear Labour Category mappings.')
  }

  const timestamp = new Date().toISOString()

  data.categoryDependencies.forEach(record => {
    if (
      record.industryCategoryOptionId === industryCategoryOptionId &&
      record.businessTypeOptionId === businessTypeOptionId &&
      record.isActive
    ) {
      record.isActive = false
      record.updatedAt = timestamp
    }
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    const industryLabel = resolveLabelForAudit(data.options, 'industry_category', industryCategoryOptionId)
    const businessTypeLabel = resolveLabelForAudit(data.options, 'business_type', businessTypeOptionId)
    await writeAuditLog(
      'update',
      'categoryDependencies',
      `${industryCategoryOptionId}:${businessTypeOptionId}`,
      `Cleared Labour Category mappings for ${industryLabel} + ${businessTypeLabel}`,
      actor
    )
  }

  return createSnapshot(data, storage)
}

export const clearAllDependencyMappings = async (
  actor: string
): Promise<LabourMastersSnapshot> => {
  const { data } = await readDataWithStorage()
  const timestamp = new Date().toISOString()

  data.industryBusinessDependencies.forEach(record => {
    if (!record.isActive) return
    record.isActive = false
    record.updatedAt = timestamp
  })

  data.categoryDependencies.forEach(record => {
    if (!record.isActive) return
    record.isActive = false
    record.updatedAt = timestamp
  })

  const storage = await writeDataWithStorage(data)
  if (storage === 'supabase') {
    await writeAuditLog(
      'update',
      'categoryDependencies',
      'all-dependencies',
      'Cleared all Industry Category to Business Type and Labour Category dependency mappings',
      actor
    )
  }

  return createSnapshot(data, storage)
}
