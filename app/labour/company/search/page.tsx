import { CompanySiteShell } from '../company-site-shell'
import { LabourSearchClient } from './labour-search-client'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { getVisibleLabourMasterOptions, resolveLabourMasterLabel } from '@/lib/labour-masters-schema'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanySearchPage() {
  const [website, snapshot, adminSettings, mastersSnapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourAdminSettings(),
    getLabourMastersSnapshot()
  ])

  const content = website.content
  const industryCategoryOptions = getVisibleLabourMasterOptions(
    mastersSnapshot.options.filter(option => option.masterKey === 'industry_category')
  )
  const businessTypeOptions = getVisibleLabourMasterOptions(
    mastersSnapshot.options.filter(option => option.masterKey === 'business_type')
  )
  const activeCategoryMap = new Map(
    snapshot.categories
      .filter(category => category.isActive)
      .map(category => [category.id, category.name])
  )

  const activeWorkers = snapshot.workers
    .filter(worker => worker.status === 'active' && worker.isVisible)
    .map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      mobile: worker.mobile,
      city: worker.city,
      homeCity: worker.homeCity,
      address: worker.address,
      skills: worker.skills,
      experienceYears: worker.experienceYears,
      expectedDailyWage: worker.expectedDailyWage,
      availability: worker.availability,
      profilePhotoPath: worker.profilePhotoPath,
      industryCategory: worker.industryCategory,
      industryCategoryLabel: resolveLabourMasterLabel(
        industryCategoryOptions,
        worker.industryCategory,
        worker.industryCategory || 'General'
      ),
      businessType: worker.businessType,
      businessTypeLabel: resolveLabourMasterLabel(
        businessTypeOptions,
        worker.businessType,
        worker.businessType || 'General business'
      ),
      createdAt: worker.createdAt,
      isVerified: worker.status === 'active' || Boolean(worker.identityProofNumber || worker.identityProofPath),
      categoryIds: worker.categoryIds,
      canAccessDirectly: false,
      categoryLabels: worker.categoryIds
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
    }))

  const featuredCompanies = snapshot.companies
    .map(company => {
      const companyJobs = snapshot.jobPosts.filter(jobPost => jobPost.companyId === company.id)
      const liveCompanyJobs = companyJobs.filter(jobPost => jobPost.status === 'live')
      const companyApplications = snapshot.jobApplications.filter(application => application.companyId === company.id)
      const companyCategoryLabels = company.categoryIds
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
      const activeJobCategoryIds = Array.from(
        new Set(liveCompanyJobs.map(jobPost => jobPost.categoryId))
      )
      const activeJobCategoryLabels = activeJobCategoryIds
        .map(categoryId => activeCategoryMap.get(categoryId))
        .filter((value): value is string => Boolean(value))
      const planLabel = snapshot.plans.find(plan => plan.id === company.activePlan)?.name || company.activePlan || 'Not assigned'
      const canUnlockWorkers = company.status === 'active' && activeJobCategoryIds.length > 0

      return {
        id: company.id,
        companyName: company.companyName,
        contactPerson: company.contactPerson,
        email: company.email,
        city: company.city,
        status: company.status,
        activePlan: planLabel,
        companyCategoryLabels,
        activeJobCategoryIds,
        activeJobCategoryLabels,
        canUnlockWorkers,
        stats: {
          liveJobs: liveCompanyJobs.length,
          totalApplications: companyApplications.length,
          shortlistedApplications: companyApplications.filter(application => application.status === 'shortlisted').length,
          hiredApplications: companyApplications.filter(application => application.status === 'hired').length
        }
      }
    })
    .sort((left, right) =>
      Number(right.status === 'active') - Number(left.status === 'active') ||
      Number(right.canUnlockWorkers) - Number(left.canUnlockWorkers) ||
      right.stats.totalApplications - left.stats.totalApplications ||
      right.stats.liveJobs - left.stats.liveJobs ||
      left.companyName.localeCompare(right.companyName)
    )

  const featuredCompany = featuredCompanies[0] || null
  const visibleWorkers = activeWorkers.map(worker => ({
    ...worker,
    canAccessDirectly: Boolean(
      featuredCompany?.canUnlockWorkers &&
      worker.categoryIds.some(categoryId => featuredCompany.activeJobCategoryIds.includes(categoryId))
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

  adminSettings.settings.workerHomeControls.popularCitySuggestions.forEach(pushCity)
  snapshot.workers.forEach(worker => {
    pushCity(worker.city)
    pushCity(worker.homeCity)
  })
  snapshot.companies.forEach(company => pushCity(company.city))
  snapshot.jobPosts.forEach(jobPost => pushCity(jobPost.city))

  const cities = Array.from(cityMap.values()).sort((left, right) => left.localeCompare(right))

  const categories = snapshot.categories
    .filter(category => category.isActive)
    .map(category => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/search">
      <LabourSearchClient
        workers={visibleWorkers}
        searchPage={content.searchPage}
        categories={categories}
        cities={cities}
        industryCategoryOptions={industryCategoryOptions}
        businessTypeOptions={businessTypeOptions}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies}
        categoryDependencies={mastersSnapshot.categoryDependencies}
        accentColor={content.theme.accentColor}
        highlightColor={content.theme.highlightColor}
        featuredCompany={featuredCompany}
      />
    </CompanySiteShell>
  )
}
