import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT_DIR = process.cwd()
const ENV_FILE_PATH = path.join(ROOT_DIR, '.env.local')

const WORKER_BUCKET = 'labour-worker-files'
const COMPANY_BUCKET = 'labour-company-registration'

const DEMO_WORKERS_PER_CATEGORY = 20
const DEMO_COMPANY_COUNT = 40
const DEMO_JOB_COUNT = 40

const WORKER_MOBILE_BASE = 9001000001
const COMPANY_MOBILE_BASE = 9002000001
const COMPANY_WHATSAPP_BASE = 9003000001

const args = new Set(process.argv.slice(2))
const isDryRun = !args.has('--confirm-run')

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Kunal', 'Rohan',
  'Manav', 'Deepak', 'Yash', 'Harsh', 'Nitin',
  'Sahil', 'Ishaan', 'Vikas', 'Pankaj', 'Tarun',
  'Mohan', 'Ritesh', 'Aniket', 'Lokesh', 'Pradeep'
]

const LAST_NAMES = [
  'Mehta', 'Saini', 'Verma', 'Yadav', 'Sharma',
  'Khan', 'Ali', 'Patel', 'Jain', 'Kumar',
  'Sahu', 'Singh', 'Joshi', 'Chauhan', 'Mishra',
  'Solanki', 'Gupta', 'Malik', 'Prajapati', 'Bhardwaj'
]

const COMPANY_PREFIXES = [
  'Bright', 'Prime', 'Metro', 'Orbit', 'Shiv',
  'Urban', 'Apex', 'Vertex', 'Reliable', 'Northstar',
  'Solid', 'Rapid', 'Triveni', 'Neelam', 'Modern',
  'Pioneer', 'Everest', 'Galaxy', 'Classic', 'Unified'
]

const COMPANY_SUFFIXES = [
  'Textiles', 'Manufacturing', 'Packaging', 'Engineering', 'Apparels',
  'Print Works', 'Fabrication', 'Exports', 'Solutions', 'Enterprises',
  'Industries', 'Garments', 'Logistics', 'Plastics', 'Assemblies',
  'Components', 'Processors', 'Technocraft', 'Workforce', 'Craft House'
]

const AREA_SUFFIXES = [
  'Industrial Area', 'Market Road', 'Textile Hub', 'Commerce Park', 'Labour Chowk',
  'Estate', 'Main Road', 'Ring Road', 'Service Lane', 'Trade Centre'
]

const STATE_BY_CITY = {
  Jaipur: 'Rajasthan',
  Delhi: 'Delhi',
  Mumbai: 'Maharashtra',
  Bengaluru: 'Karnataka',
  Pune: 'Maharashtra',
  Kolkata: 'West Bengal',
  Ahmedabad: 'Gujarat',
  Hyderabad: 'Telangana',
  Chennai: 'Tamil Nadu',
  Surat: 'Gujarat',
  Lucknow: 'Uttar Pradesh',
  Nagpur: 'Maharashtra',
  Vadodara: 'Gujarat',
  Indore: 'Madhya Pradesh',
  Patna: 'Bihar',
  Rajkot: 'Gujarat',
  Chandigarh: 'Chandigarh',
  Bhopal: 'Madhya Pradesh',
  Ludhiana: 'Punjab',
  Kanpur: 'Uttar Pradesh',
  Nashik: 'Maharashtra',
  Bhubaneswar: 'Odisha'
}

const SHIFT_FALLBACK = 'Day Shift'
const WEEKLY_OFF_FALLBACK = 'Sunday'
const SALARY_TYPE_FALLBACK = 'Per Day'
const YES_NO_FALLBACK = 'Yes'
const FACILITY_FALLBACK = 'Available'

const normalizeString = value => String(value ?? '').trim()
const normalizeLookup = value => normalizeString(value).toLowerCase()
const toStringArray = value => Array.isArray(value)
  ? value.map(item => normalizeString(item)).filter(Boolean)
  : []

const slugify = value =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const pickFrom = (items, index) => items[index % items.length]

const getMasterKey = option =>
  normalizeString(
    option?.masterKey ??
    option?.master_key ??
    option?.key ??
    option?.type ??
    option?.group
  )

const isActiveRecord = record => {
  if (typeof record?.isActive === 'boolean') return record.isActive
  if (typeof record?.active === 'boolean') return record.active
  if (typeof record?.deleted === 'boolean') return !record.deleted
  if (typeof record?.status === 'string') {
    const status = normalizeLookup(record.status)
    return !['inactive', 'disabled', 'deleted', 'archived'].includes(status)
  }
  return true
}

const getOptionTokenSet = option => new Set(
  [option?.id, option?.value, option?.slug, option?.label]
    .map(item => normalizeLookup(item))
    .filter(Boolean)
)

const getLookupTokens = value => {
  const raw = normalizeString(value)
  if (!raw) return []

  const variants = new Set([
    raw,
    raw.toLowerCase(),
    raw.replace(/[_-]+/g, ' '),
    raw.replace(/\s+/g, '_'),
    raw.replace(/\s+/g, '-'),
    slugify(raw)
  ])

  raw
    .split(/[^a-zA-Z0-9]+/)
    .map(part => normalizeString(part))
    .filter(Boolean)
    .forEach(part => {
      variants.add(part.toLowerCase())
      variants.add(slugify(part))
    })

  return [...variants].map(item => normalizeLookup(item)).filter(Boolean)
}

const buildOptionLookup = options => {
  const lookup = new Map()

  options.forEach(option => {
    getOptionTokenSet(option).forEach(token => lookup.set(token, option))
    getLookupTokens(option?.id).forEach(token => lookup.set(token, option))
    getLookupTokens(option?.value).forEach(token => lookup.set(token, option))
    getLookupTokens(option?.slug).forEach(token => lookup.set(token, option))
    getLookupTokens(option?.label).forEach(token => lookup.set(token, option))
  })

  return lookup
}

const resolveOptionFromDependency = (lookup, rawValue) => {
  for (const token of getLookupTokens(rawValue)) {
    if (lookup.has(token)) return lookup.get(token)
  }
  return null
}

const createSafeMobile = (base, index) => String(base + index)

const addDays = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(part => Number(part))
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTimestamp = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`
}

const createSafeGstin = index => {
  const stateCode = String((index % 27) + 1).padStart(2, '0')
  const alpha = String.fromCharCode(65 + (index % 26))
  return `${stateCode}DUMMO${String(index + 1).padStart(4, '0')}${alpha}1Z${(index % 9) + 1}`
}

const createProofNumber = index => `DUMMY-AADHAAR-${String(index + 1).padStart(4, '0')}`

const createAvatarSvg = (name, index) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
  const colors = ['#0f766e', '#2563eb', '#7c3aed', '#dc2626', '#0891b2', '#ca8a04']
  const fill = colors[index % colors.length]
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${name}">
  <rect width="512" height="512" rx="64" fill="#e2e8f0"/>
  <circle cx="256" cy="224" r="126" fill="${fill}"/>
  <text x="256" y="256" text-anchor="middle" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">${initials}</text>
  <text x="256" y="418" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#1e293b">${name}</text>
  <text x="256" y="456" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">DUMMY PROFILE PHOTO</text>
</svg>`
}

const createProofSvg = ({ title, subtitle, subject, number, extraLine }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754">
  <rect width="1240" height="1754" fill="#f8fafc"/>
  <rect x="60" y="60" width="1120" height="1634" rx="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="8"/>
  <text x="620" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#b91c1c">${title}</text>
  <text x="620" y="272" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${subtitle}</text>
  <text x="120" y="430" font-family="Arial, sans-serif" font-size="34" fill="#0f172a">Name / Entity: ${subject}</text>
  <text x="120" y="500" font-family="Arial, sans-serif" font-size="34" fill="#0f172a">Reference No: ${number}</text>
  <text x="120" y="570" font-family="Arial, sans-serif" font-size="34" fill="#0f172a">${extraLine}</text>
  <text x="120" y="700" font-family="Arial, sans-serif" font-size="30" fill="#334155">This file is generated for demo seeding only.</text>
  <text x="120" y="760" font-family="Arial, sans-serif" font-size="30" fill="#334155">It does not belong to a real person, company, Aadhaar, PAN, GSTIN or government record.</text>
  <text x="620" y="1520" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#1d4ed8">FOR TESTING ONLY</text>
  <text x="620" y="1600" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#64748b">Generated by scripts/seed-labour-demo-data.mjs</text>
</svg>`

const getEnvValue = async key => {
  if (process.env[key]) return process.env[key]
  const content = await readFile(ENV_FILE_PATH, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue
    const envKey = line.slice(0, separatorIndex).trim()
    if (envKey !== key) continue
    const envValue = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    process.env[key] = envValue
    return envValue
  }
  return ''
}

const ensureBucket = async (supabase, bucketName, fileSizeLimit) => {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Failed to list storage buckets: ${error.message}`)
  if ((buckets || []).some(bucket => bucket.name === bucketName)) return

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit
  })

  if (createError && !normalizeLookup(createError.message).includes('already')) {
    throw new Error(`Failed to create storage bucket ${bucketName}: ${createError.message}`)
  }
}

const uploadSvgAsset = async (supabase, bucketName, storagePath, svgContent) => {
  const { error } = await supabase.storage.from(bucketName).upload(
    storagePath,
    Buffer.from(svgContent, 'utf8'),
    {
      contentType: 'image/svg+xml',
      upsert: true
    }
  )

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`)
  }
}

const columnMissing = (message, columnName) =>
  normalizeLookup(message).includes(`'${normalizeLookup(columnName)}' column`)

const upsertWorkersWithFallback = async (supabase, workerRows) => {
  let payload = workerRows
  let result = await supabase.from('labour_workers').upsert(payload, { onConflict: 'id' })

  if (result.error && ['company_id', 'industry_category', 'business_type'].some(column => columnMissing(result.error.message, column))) {
    payload = payload.map(({ company_id, industry_category, business_type, ...row }) => row)
    result = await supabase.from('labour_workers').upsert(payload, { onConflict: 'id' })
  }

  if (result.error && columnMissing(result.error.message, 'registration_fee_paid')) {
    payload = payload.map(({ registration_fee_paid, ...row }) => row)
    result = await supabase.from('labour_workers').upsert(payload, { onConflict: 'id' })
  }

  if (result.error && ['active_plan', 'plan_valid_from', 'plan_valid_until', 'last_wallet_deduction_date'].some(column => columnMissing(result.error.message, column))) {
    payload = payload.map(({ active_plan, plan_valid_from, plan_valid_until, last_wallet_deduction_date, ...row }) => row)
    result = await supabase.from('labour_workers').upsert(payload, { onConflict: 'id' })
  }

  return result
}

const upsertCompaniesWithFallback = async (supabase, companyRows) => {
  let payload = companyRows
  let result = await supabase.from('labour_companies').upsert(payload, { onConflict: 'id' })

  if (result.error && columnMissing(result.error.message, 'contact_mobile')) {
    payload = payload.map(({ contact_mobile, ...row }) => row)
    result = await supabase.from('labour_companies').upsert(payload, { onConflict: 'id' })
  }

  if (result.error && columnMissing(result.error.message, 'area')) {
    payload = payload.map(({ area, ...row }) => row)
    result = await supabase.from('labour_companies').upsert(payload, { onConflict: 'id' })
  }

  if (result.error && [
    'business_type',
    'industry_category',
    'gst_number',
    'company_address',
    'state',
    'pincode',
    'workers_needed',
    'hiring_type',
    'business_description',
    'gst_certificate_path',
    'company_proof_path',
    'owner_id_proof_path'
  ].some(column => columnMissing(result.error.message, column))) {
    payload = payload.map(({
      business_type,
      industry_category,
      gst_number,
      company_address,
      state,
      pincode,
      workers_needed,
      hiring_type,
      business_description,
      gst_certificate_path,
      company_proof_path,
      owner_id_proof_path,
      ...row
    }) => row)
    result = await supabase.from('labour_companies').upsert(payload, { onConflict: 'id' })
  }

  return result
}

const doesPlanMatchCombination = (plan, combo) => {
  const industryTokens = getOptionTokenSet(combo.industryOption)
  const businessTokens = getOptionTokenSet(combo.businessOption)
  const planIndustryTokens = new Set(plan.industryCategoryValues.map(normalizeLookup).filter(Boolean))
  const planBusinessTokens = new Set(plan.businessTypeValues.map(normalizeLookup).filter(Boolean))
  const planCategoryIds = new Set([plan.categoryId, ...plan.labourCategoryIds].map(normalizeString).filter(Boolean))

  const industryMatch = planIndustryTokens.size === 0 || [...industryTokens].some(token => planIndustryTokens.has(token))
  const businessMatch = planBusinessTokens.size === 0 || [...businessTokens].some(token => planBusinessTokens.has(token))
  const categoryMatch = planCategoryIds.size === 0 || planCategoryIds.has(combo.category.id)

  return industryMatch && businessMatch && categoryMatch
}

const detailLinesToDescription = (intro, details) => {
  const metaLines = details
    .map(([label, value]) => [label, normalizeString(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)

  return [normalizeString(intro), metaLines.length ? ['Job requirement details', ...metaLines].join('\n') : '']
    .filter(Boolean)
    .join('\n\n')
}

const main = async () => {
  const supabaseUrl = await getEnvValue('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceRoleKey = await getEnvValue('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env.local')
  }

  const projectHost = new URL(supabaseUrl).hostname
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  const [
    plansResult,
    categoriesResult,
    mastersResult,
    existingWorkersResult,
    existingCompaniesResult,
    existingJobsResult
  ] = await Promise.all([
    supabase.from('labour_plans').select('*'),
    supabase.from('labour_categories').select('*'),
    supabase.from('labour_admin_settings').select('settings_json').eq('id', 'labour-master-data').maybeSingle(),
    supabase.from('labour_workers').select('id,mobile').like('id', 'demo-worker-%'),
    supabase.from('labour_companies').select('id,mobile,email').like('id', 'demo-company-%'),
    supabase.from('labour_job_posts').select('id').like('id', 'demo-job-%')
  ])

  if (plansResult.error) throw new Error(`Failed to load labour_plans: ${plansResult.error.message}`)
  if (categoriesResult.error) throw new Error(`Failed to load labour_categories: ${categoriesResult.error.message}`)
  if (mastersResult.error) throw new Error(`Failed to load labour_admin_settings: ${mastersResult.error.message}`)
  if (existingWorkersResult.error) throw new Error(`Failed to inspect existing demo workers: ${existingWorkersResult.error.message}`)
  if (existingCompaniesResult.error) throw new Error(`Failed to inspect existing demo companies: ${existingCompaniesResult.error.message}`)
  if (existingJobsResult.error) throw new Error(`Failed to inspect existing demo job posts: ${existingJobsResult.error.message}`)

  const masterPayload = mastersResult.data?.settings_json || {}
  const activeOptions = Array.isArray(masterPayload.options)
    ? masterPayload.options.filter(option => isActiveRecord(option))
    : []
  const activeCategoryDependencies = Array.isArray(masterPayload.categoryDependencies)
    ? masterPayload.categoryDependencies.filter(dependency => isActiveRecord(dependency))
    : []

  const normalizedOptions = activeOptions.map(option => ({
    id: normalizeString(option.id),
    label: normalizeString(option.label),
    value: normalizeString(option.value || option.label),
    slug: normalizeString(option.slug),
    masterKey: getMasterKey(option)
  }))

  const industryOptions = normalizedOptions.filter(option => option.masterKey === 'industry_category')
  const businessOptions = normalizedOptions.filter(option => option.masterKey === 'business_type')
  const industryOptionLookup = buildOptionLookup(industryOptions)
  const businessOptionLookup = buildOptionLookup(businessOptions)

  const activeCategories = (categoriesResult.data || [])
    .filter(category => isActiveRecord({
      isActive: category.is_active ?? category.isActive,
      status: category.status
    }))
    .map(category => ({
      id: normalizeString(category.id),
      name: normalizeString(category.name),
      slug: normalizeString(category.slug) || slugify(category.name)
    }))

  const categoryById = new Map(activeCategories.map(category => [category.id, category]))

  const combinations = activeCategoryDependencies
    .map(dependency => {
      const categoryId = normalizeString(dependency.categoryId ?? dependency.category_id)
      const industryOptionId = normalizeString(dependency.industryCategoryOptionId ?? dependency.industry_category_option_id)
      const businessOptionId = normalizeString(dependency.businessTypeOptionId ?? dependency.business_type_option_id)
      const category = categoryById.get(categoryId)
      const industryOption = resolveOptionFromDependency(industryOptionLookup, industryOptionId)
      const businessOption = resolveOptionFromDependency(businessOptionLookup, businessOptionId)

      if (!category || !industryOption || !businessOption) return null
      return { category, industryOption, businessOption }
    })
    .filter(Boolean)
    .reduce((list, combo) => {
      const key = `${combo.industryOption.id}::${combo.businessOption.id}::${combo.category.id}`
      if (list.some(item => `${item.industryOption.id}::${item.businessOption.id}::${item.category.id}` === key)) {
        return list
      }
      return [...list, combo]
    }, [])

  if (combinations.length === 0) {
    throw new Error('No active industry/business/category dependency combinations are available for demo seeding.')
  }

  const combosByCategoryId = new Map()
  const categoriesByGroupKey = new Map()

  combinations.forEach(combo => {
    const byCategory = combosByCategoryId.get(combo.category.id) || []
    byCategory.push(combo)
    combosByCategoryId.set(combo.category.id, byCategory)

    const groupKey = `${combo.industryOption.id}::${combo.businessOption.id}`
    const groupedCategories = categoriesByGroupKey.get(groupKey) || []
    if (!groupedCategories.some(item => item.id === combo.category.id)) {
      groupedCategories.push(combo.category)
    }
    categoriesByGroupKey.set(groupKey, groupedCategories)
  })

  const blockedCategories = activeCategories
    .filter(category => !combosByCategoryId.has(category.id))
    .map(category => {
      const rawDependencies = activeCategoryDependencies.filter(dependency =>
        normalizeString(dependency.categoryId ?? dependency.category_id) === category.id
      )

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        hasDependencyRows: rawDependencies.length > 0,
        dependencyRows: rawDependencies.map(dependency => ({
          industryCategoryOptionId: normalizeString(dependency.industryCategoryOptionId ?? dependency.industry_category_option_id),
          businessTypeOptionId: normalizeString(dependency.businessTypeOptionId ?? dependency.business_type_option_id)
        }))
      }
    })

  const validActiveCategories = activeCategories.filter(category => combosByCategoryId.has(category.id))

  if (blockedCategories.length > 0) {
    const blockedResponse = {
      ok: false,
      reason: 'missing-active-dependencies',
      mode: isDryRun ? 'dry-run' : 'execute',
      projectHost,
      demoPrefixes: ['demo-worker-', 'demo-company-', 'demo-job-'],
      willDeleteRealRecords: false,
      tablesAffected: ['labour_workers', 'labour_companies', 'labour_job_posts'],
      storageBuckets: {
        worker: WORKER_BUCKET,
        company: COMPANY_BUCKET
      },
      activeCategoriesFound: activeCategories.length,
      categoriesWithValidDependencies: validActiveCategories.length,
      blockedCategories,
      workersPerCategory: DEMO_WORKERS_PER_CATEGORY,
      totalsRequested: {
        demoWorkers: activeCategories.length * DEMO_WORKERS_PER_CATEGORY,
        demoCompanies: DEMO_COMPANY_COUNT,
        demoJobPosts: DEMO_JOB_COUNT
      },
      totalsPossibleWithCurrentMasters: {
        demoWorkers: validActiveCategories.length * DEMO_WORKERS_PER_CATEGORY,
        demoCompanies: DEMO_COMPANY_COUNT,
        demoJobPosts: DEMO_JOB_COUNT
      },
      safeDataOnly: true,
      nextStep: 'Fix the active master dependency mapping for the blocked categories, then re-run this seed script.'
    }

    if (isDryRun) {
      console.log(JSON.stringify(blockedResponse, null, 2))
      return
    }

    throw new Error(`Cannot seed because some active labour categories are missing valid active dependency mappings: ${blockedCategories.map(category => category.name).join(', ')}`)
  }

  const activeCities = activeOptions
    .filter(option => getMasterKey(option) === 'city')
    .map(option => normalizeString(option.label || option.value))
    .filter(Boolean)

  if (activeCities.length === 0) {
    throw new Error('No active city master options are available for demo seeding.')
  }

  const activePlans = (plansResult.data || [])
    .map(plan => ({
      id: normalizeString(plan.id),
      audience: normalizeLookup(plan.audience),
      name: normalizeString(plan.name),
      categoryId: normalizeString(plan.category_id),
      industryCategoryValues: toStringArray(plan.industry_category_values),
      businessTypeValues: toStringArray(plan.business_type_values),
      labourCategoryIds: toStringArray(plan.labour_category_ids),
      jobPostLimit: toNumber(plan.job_post_limit, 1),
      planAmount: toNumber(plan.plan_amount),
      registrationFee: toNumber(plan.registration_fee),
      walletCredit: toNumber(plan.wallet_credit),
      dailyCharge: toNumber(plan.daily_charge),
      planValidityDays: toNumber(plan.plan_validity_days ?? plan.validity_days, 0),
      jobPostLiveDays: toNumber(plan.job_post_live_days ?? plan.validity_days, 0),
      validityDays: toNumber(plan.validity_days, 0),
      isActive: Boolean(plan.is_active ?? plan.isActive)
    }))
    .filter(plan => plan.isActive)

  const workerPlan =
    activePlans.find(plan =>
      plan.audience === 'worker' &&
      plan.registrationFee <= 0 &&
      plan.planAmount <= 0 &&
      plan.dailyCharge <= 0
    ) ||
    activePlans.find(plan => plan.audience === 'worker')

  if (!workerPlan) {
    throw new Error('No active worker plan is available for demo workers.')
  }

  const companyPlans = activePlans.filter(plan => plan.audience === 'company')
  if (companyPlans.length === 0) {
    throw new Error('No active company plan is available for demo companies and jobs.')
  }

  const shiftOptions = activeOptions.filter(option => getMasterKey(option) === 'job_shift_type')
  const weeklyOffOptions = activeOptions.filter(option => getMasterKey(option) === 'job_weekly_off')
  const salaryTypeOptions = activeOptions.filter(option => getMasterKey(option) === 'salary_type')
  const overtimeOptions = activeOptions.filter(option => getMasterKey(option) === 'job_overtime_available')
  const foodOptions = activeOptions.filter(option => getMasterKey(option) === 'job_food_facility')
  const accommodationOptions = activeOptions.filter(option => getMasterKey(option) === 'job_accommodation')
  const transportOptions = activeOptions.filter(option => getMasterKey(option) === 'job_transport_facility')
  const durationOptions = activeOptions.filter(option => getMasterKey(option) === 'job_duration')
  const experienceOptions = activeOptions.filter(option => getMasterKey(option) === 'experience_requirement')

  const today = new Date()
  const workerRows = []
  const companyRows = []
  const jobRows = []

  let workerGlobalIndex = 0

  for (const category of activeCategories) {
    const categoryCombos = combosByCategoryId.get(category.id) || []

    for (let localIndex = 0; localIndex < DEMO_WORKERS_PER_CATEGORY; localIndex += 1) {
      const combo = pickFrom(categoryCombos, localIndex)
      const city = pickFrom(activeCities, workerGlobalIndex)
      const state = STATE_BY_CITY[city] || 'Rajasthan'
      const fullName = `${pickFrom(FIRST_NAMES, workerGlobalIndex)} ${pickFrom(LAST_NAMES, workerGlobalIndex)}`
      const workerId = `demo-worker-${category.slug}-${String(localIndex + 1).padStart(3, '0')}`
      const proofNumber = createProofNumber(workerGlobalIndex)
      const planValidFrom = formatDate(today)
      const planValidityDays = workerPlan.planValidityDays || workerPlan.validityDays || 7
      const planValidUntil = addDays(planValidFrom, planValidityDays)
      const createdAt = formatTimestamp(new Date(today.getTime() - workerGlobalIndex * 86400000))

      workerRows.push({
        id: workerId,
        full_name: fullName,
        mobile: createSafeMobile(WORKER_MOBILE_BASE, workerGlobalIndex),
        city,
        home_city: city,
        company_id: null,
        industry_category: combo.industryOption.value || combo.industryOption.label,
        business_type: combo.businessOption.value || combo.businessOption.label,
        address: `Demo ${pickFrom(AREA_SUFFIXES, workerGlobalIndex)}, ${city}, ${state}`,
        profile_photo_path: `workers/${workerId}/profile-photo.svg`,
        skills: [
          category.name,
          `${combo.businessOption.label} workflow`,
          `${combo.industryOption.label} operations`
        ],
        experience_years: 1 + (workerGlobalIndex % 8),
        expected_daily_wage: 650 + workerGlobalIndex * 15,
        wallet_balance: workerPlan.walletCredit > 0 ? workerPlan.walletCredit : 0,
        registration_fee_paid: true,
        active_plan: workerPlan.id,
        plan_valid_from: planValidFrom,
        plan_valid_until: planValidUntil,
        last_wallet_deduction_date: null,
        status: 'active',
        availability: workerGlobalIndex % 3 === 0 ? 'available_today' : 'available_this_week',
        is_visible: true,
        category_ids: [category.id],
        identity_proof_type: 'aadhaar',
        identity_proof_number: proofNumber,
        identity_proof_path: `workers/${workerId}/identity-proof.svg`,
        registration_completed_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt
      })

      workerGlobalIndex += 1
    }
  }

  for (let index = 0; index < DEMO_COMPANY_COUNT; index += 1) {
    const combo = pickFrom(combinations, index)
    const groupKey = `${combo.industryOption.id}::${combo.businessOption.id}`
    const groupedCategories = categoriesByGroupKey.get(groupKey) || [combo.category]
    const selectedCategories = groupedCategories.slice(0, Math.min(2, groupedCategories.length)).map(category => category.id)
    const city = pickFrom(activeCities, index)
    const state = STATE_BY_CITY[city] || 'Rajasthan'
    const companyId = `demo-company-${String(index + 1).padStart(3, '0')}`
    const companyName = `${pickFrom(COMPANY_PREFIXES, index)} ${pickFrom(COMPANY_SUFFIXES, index)}`
    const contactPerson = `${pickFrom(FIRST_NAMES, index + 4)} ${pickFrom(LAST_NAMES, index + 9)}`
    const companyPlan = companyPlans.find(plan => doesPlanMatchCombination(plan, combo)) || companyPlans[0]
    const createdAt = formatTimestamp(new Date(today.getTime() - index * 43200000))

    companyRows.push({
      id: companyId,
      company_name: companyName,
      contact_person: contactPerson,
      email: `demo.company${String(index + 1).padStart(3, '0')}@example.com`,
      mobile: createSafeMobile(COMPANY_MOBILE_BASE, index),
      contact_mobile: createSafeMobile(COMPANY_WHATSAPP_BASE, index),
      business_type: combo.businessOption.value || combo.businessOption.label,
      industry_category: combo.industryOption.value || combo.industryOption.label,
      gst_number: createSafeGstin(index),
      company_address: `Plot ${index + 11}, Demo ${pickFrom(AREA_SUFFIXES, index)}, ${city}`,
      state,
      city,
      area: `Sector ${index % 9 + 1}`,
      pincode: String(300000 + index * 13).slice(0, 6),
      workers_needed: 6 + (index % 8),
      hiring_type: index % 2 === 0 ? 'Daily Basis' : 'Contract Basis',
      business_description: `Synthetic demo company for ${combo.industryOption.label} / ${combo.businessOption.label} labour hiring flows.`,
      gst_certificate_path: `demo-companies/${companyId}/gst-certificate.svg`,
      company_proof_path: `demo-companies/${companyId}/company-proof.svg`,
      owner_id_proof_path: `demo-companies/${companyId}/owner-proof.svg`,
      category_ids: selectedCategories,
      status: 'active',
      registration_fee_paid: true,
      active_plan: companyPlan.id,
      created_at: createdAt,
      updated_at: createdAt
    })
  }

  for (let index = 0; index < DEMO_JOB_COUNT; index += 1) {
    const company = companyRows[index % companyRows.length]
    const category = pickFrom(activeCategories, index)
    const combo = pickFrom(combosByCategoryId.get(category.id) || [], index)
    const companyPlan = companyPlans.find(plan => plan.id === company.active_plan) || companyPlans[0]
    const publishedAt = formatDate(new Date(today.getTime() - (index % 4) * 86400000))
    const jobLiveDays = companyPlan.jobPostLiveDays || companyPlan.planValidityDays || companyPlan.validityDays || 7
    const expiresAt = addDays(publishedAt, jobLiveDays)
    const shiftType = pickFrom(shiftOptions, index)?.label || SHIFT_FALLBACK
    const weeklyOff = pickFrom(weeklyOffOptions, index)?.label || WEEKLY_OFF_FALLBACK
    const salaryType = pickFrom(salaryTypeOptions, index)?.label || SALARY_TYPE_FALLBACK
    const overtimeAvailable = pickFrom(overtimeOptions, index)?.label || YES_NO_FALLBACK
    const foodFacility = pickFrom(foodOptions, index)?.label || FACILITY_FALLBACK
    const accommodation = pickFrom(accommodationOptions, index)?.label || FACILITY_FALLBACK
    const transportFacility = pickFrom(transportOptions, index)?.label || FACILITY_FALLBACK
    const jobDuration = pickFrom(durationOptions, index)?.label || `${jobLiveDays} days`
    const experienceRequired = pickFrom(experienceOptions, index)?.label || `${1 + (index % 5)} years`
    const salaryAmount = 700 + index * 40
    const createdAt = formatTimestamp(new Date(today.getTime() - index * 21600000))
    const jobId = `demo-job-${String(index + 1).padStart(3, '0')}`
    const workersNeeded = 4 + (index % 6)

    jobRows.push({
      id: jobId,
      company_id: company.id,
      plan_id: company.active_plan,
      category_id: category.id,
      title: `${category.name} Required for ${company.company_name}`,
      description: detailLinesToDescription(
        `Demo job post for ${category.name} in ${company.city}. This posting contains synthetic data for product testing only.`,
        [
          ['Industry category', combo.industryOption.label],
          ['Business type', combo.businessOption.label],
          ['Worker category', category.name],
          ['Number of workers required', String(workersNeeded)],
          ['Experience required', experienceRequired],
          ['Job location', `${company.city}, ${company.area}`],
          ['Shift type', shiftType],
          ['Weekly off', weeklyOff],
          ['Job duration', jobDuration],
          ['Salary type', salaryType],
          ['Salary amount', String(salaryAmount)],
          ['Overtime available', overtimeAvailable],
          ['Food facility', foodFacility],
          ['Accommodation', accommodation],
          ['Transport facility', transportFacility],
          ['Required skills', `${category.name}, ${combo.businessOption.label}`],
          ['Special instructions', 'Synthetic demo job post for testing only.'],
          ['Applications count', '0'],
          ['Shortlisted count', '0'],
          ['Hired count', '0']
        ]
      ),
      city: company.city,
      location_label: `${company.city}, ${company.area} | ${shiftType}`,
      latitude: null,
      longitude: null,
      workers_needed: workersNeeded,
      wage_amount: salaryAmount,
      validity_days: jobLiveDays,
      status: 'live',
      published_at: publishedAt,
      expires_at: expiresAt,
      created_at: createdAt,
      updated_at: createdAt
    })
  }

  const existingWorkerIds = new Set((existingWorkersResult.data || []).map(row => normalizeString(row.id)))
  const existingCompanyIds = new Set((existingCompaniesResult.data || []).map(row => normalizeString(row.id)))
  const existingJobIds = new Set((existingJobsResult.data || []).map(row => normalizeString(row.id)))

  const [workerConflictRows, companyMobileConflictRows, companyEmailConflictRows] = await Promise.all([
    supabase.from('labour_workers').select('id,mobile').in('mobile', workerRows.map(worker => worker.mobile)),
    supabase.from('labour_companies').select('id,mobile').in('mobile', companyRows.map(company => company.mobile)),
    supabase.from('labour_companies').select('id,email').in('email', companyRows.map(company => company.email))
  ])

  if (workerConflictRows.error) throw new Error(`Failed to verify worker mobile conflicts: ${workerConflictRows.error.message}`)
  if (companyMobileConflictRows.error) throw new Error(`Failed to verify company mobile conflicts: ${companyMobileConflictRows.error.message}`)
  if (companyEmailConflictRows.error) throw new Error(`Failed to verify company email conflicts: ${companyEmailConflictRows.error.message}`)

  const nonDemoWorkerConflicts = workerRows.filter(worker =>
    (workerConflictRows.data || []).some(existing =>
      normalizeString(existing.mobile) === worker.mobile &&
      normalizeString(existing.id) !== worker.id
    )
  )
  const nonDemoCompanyConflicts = companyRows.filter(company =>
    (companyMobileConflictRows.data || []).some(existing =>
      normalizeString(existing.mobile) === company.mobile &&
      normalizeString(existing.id) !== company.id
    ) ||
    (companyEmailConflictRows.data || []).some(existing =>
      normalizeLookup(existing.email) === normalizeLookup(company.email) &&
      normalizeString(existing.id) !== company.id
    )
  )

  if (nonDemoWorkerConflicts.length > 0) {
    throw new Error(`Aborting because demo worker mobile conflicts already exist: ${nonDemoWorkerConflicts.map(worker => worker.mobile).join(', ')}`)
  }

  if (nonDemoCompanyConflicts.length > 0) {
    throw new Error(`Aborting because demo company email/mobile conflicts already exist: ${nonDemoCompanyConflicts.map(company => company.email).join(', ')}`)
  }

  const workerCounts = {
    created: workerRows.filter(worker => !existingWorkerIds.has(worker.id)).length,
    updated: workerRows.filter(worker => existingWorkerIds.has(worker.id)).length
  }
  const companyCounts = {
    created: companyRows.filter(company => !existingCompanyIds.has(company.id)).length,
    updated: companyRows.filter(company => existingCompanyIds.has(company.id)).length
  }
  const jobCounts = {
    created: jobRows.filter(job => !existingJobIds.has(job.id)).length,
    updated: jobRows.filter(job => existingJobIds.has(job.id)).length
  }

  const summary = {
    mode: isDryRun ? 'dry-run' : 'execute',
    projectHost,
    demoPrefixes: ['demo-worker-', 'demo-company-', 'demo-job-'],
    willDeleteRealRecords: false,
    tablesAffected: ['labour_workers', 'labour_companies', 'labour_job_posts'],
    storageBuckets: {
      worker: WORKER_BUCKET,
      company: COMPANY_BUCKET
    },
    activeCategoriesFound: activeCategories.length,
    categoriesWithValidDependencies: validActiveCategories.length,
    blockedCategories,
    workersPerCategory: DEMO_WORKERS_PER_CATEGORY,
    counts: {
      workers: workerCounts,
      companies: companyCounts,
      jobPosts: jobCounts
    },
    totalsPlanned: {
      demoWorkers: workerRows.length,
      demoCompanies: companyRows.length,
      demoJobPosts: jobRows.length
    },
    dummyAssetsPlanned: {
      workerProfilePhotos: workerRows.length,
      workerIdentityProofs: workerRows.length,
      companyDocuments: companyRows.length * 3
    },
    safeDataOnly: true
  }

  if (isDryRun) {
    console.log(JSON.stringify({
      ok: true,
      ...summary,
      nextStep: 'Re-run with --confirm-run to write demo data to the currently configured Supabase project.'
    }, null, 2))
    return
  }

  await Promise.all([
    ensureBucket(supabase, WORKER_BUCKET, '10MB'),
    ensureBucket(supabase, COMPANY_BUCKET, '12MB')
  ])

  for (let index = 0; index < workerRows.length; index += 1) {
    const worker = workerRows[index]
    await uploadSvgAsset(supabase, WORKER_BUCKET, worker.profile_photo_path, createAvatarSvg(worker.full_name, index))
    await uploadSvgAsset(
      supabase,
      WORKER_BUCKET,
      worker.identity_proof_path,
      createProofSvg({
        title: 'DUMMY ID PROOF - NOT REAL',
        subtitle: 'AADHAAR',
        subject: worker.full_name,
        number: worker.identity_proof_number,
        extraLine: `Demo Worker ID: ${worker.id}`
      })
    )
  }

  for (let index = 0; index < companyRows.length; index += 1) {
    const company = companyRows[index]
    const serial = String(index + 1).padStart(3, '0')

    await uploadSvgAsset(
      supabase,
      COMPANY_BUCKET,
      company.gst_certificate_path,
      createProofSvg({
        title: 'DUMMY GST CERTIFICATE - NOT REAL',
        subtitle: 'FOR DEMO COMPANY SEEDING',
        subject: company.company_name,
        number: company.gst_number,
        extraLine: `Demo Company ID: ${company.id}`
      })
    )
    await uploadSvgAsset(
      supabase,
      COMPANY_BUCKET,
      company.company_proof_path,
      createProofSvg({
        title: 'DUMMY COMPANY PROOF - NOT REAL',
        subtitle: 'FOR DEMO COMPANY SEEDING',
        subject: company.company_name,
        number: `COMP-PROOF-${serial}`,
        extraLine: `Contact Person: ${company.contact_person}`
      })
    )
    await uploadSvgAsset(
      supabase,
      COMPANY_BUCKET,
      company.owner_id_proof_path,
      createProofSvg({
        title: 'DUMMY OWNER ID PROOF - NOT REAL',
        subtitle: 'FOR DEMO COMPANY SEEDING',
        subject: company.contact_person,
        number: `OWNER-DUMMY-${serial}`,
        extraLine: `Company: ${company.company_name}`
      })
    )
  }

  const [workerUpsert, companyUpsert] = await Promise.all([
    upsertWorkersWithFallback(supabase, workerRows),
    upsertCompaniesWithFallback(supabase, companyRows)
  ])

  if (workerUpsert.error) throw new Error(`Failed to upsert demo workers: ${workerUpsert.error.message}`)
  if (companyUpsert.error) throw new Error(`Failed to upsert demo companies: ${companyUpsert.error.message}`)

  const jobUpsert = await supabase.from('labour_job_posts').upsert(jobRows, { onConflict: 'id' })
  if (jobUpsert.error) throw new Error(`Failed to upsert demo job posts: ${jobUpsert.error.message}`)

  const [workerVerify, companyVerify, jobVerify] = await Promise.all([
    supabase.from('labour_workers').select('id', { count: 'exact', head: true }).like('id', 'demo-worker-%'),
    supabase.from('labour_companies').select('id', { count: 'exact', head: true }).like('id', 'demo-company-%'),
    supabase.from('labour_job_posts').select('id', { count: 'exact', head: true }).like('id', 'demo-job-%')
  ])

  if (workerVerify.error) throw new Error(`Failed to verify demo workers: ${workerVerify.error.message}`)
  if (companyVerify.error) throw new Error(`Failed to verify demo companies: ${companyVerify.error.message}`)
  if (jobVerify.error) throw new Error(`Failed to verify demo job posts: ${jobVerify.error.message}`)

  console.log(JSON.stringify({
    ok: true,
    ...summary,
    totalsAfterSeed: {
      demoWorkers: workerVerify.count ?? 0,
      demoCompanies: companyVerify.count ?? 0,
      demoJobPosts: jobVerify.count ?? 0
    },
    workerPlanUsed: {
      id: workerPlan.id,
      name: workerPlan.name,
      validityDays: workerPlan.planValidityDays || workerPlan.validityDays || 0
    }
  }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
