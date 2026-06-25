import { headers } from 'next/headers'
import { LabourCompanyHomeClient } from './labour-company-home-client'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { getVisibleLabourMasterOptions } from '@/lib/labour-masters-schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyHomePage() {
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null
  const [website, snapshot, masters] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourMastersSnapshot()
  ])

  const content = website.content
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const industryCategoryOptions = getVisibleLabourMasterOptions(
    masters.options.filter(option => option.masterKey === 'industry_category')
  )
  const businessTypeOptions = getVisibleLabourMasterOptions(
    masters.options.filter(option => option.masterKey === 'business_type')
  )
  const cityOptions = masters.activeCities
    .map(option => option.value.trim() || option.label.trim())
    .filter(Boolean)
  const categoryOptions = snapshot.categories
    .filter(category => category.isActive)
    .map(category => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  return (
    <LabourCompanyHomeClient
      content={content}
      industryCategoryOptions={industryCategoryOptions}
      businessTypeOptions={businessTypeOptions}
      categoryOptions={categoryOptions}
      industryBusinessDependencies={masters.industryBusinessDependencies}
      categoryDependencies={masters.categoryDependencies}
      cityOptions={cityOptions}
      companyPlans={companyPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        planAmount: plan.planAmount,
        registrationFee: plan.registrationFee,
        validityDays: plan.validityDays,
        description: plan.description,
        categoryId: plan.categoryId
      }))}
      stats={{
        activeCompanies: snapshot.companies.length,
        activeWorkers: snapshot.stats.activeWorkers,
        liveJobs: snapshot.jobPosts.length,
        totalJobs: snapshot.jobPosts.length,
        industriesCovered: 8
      }}
      initialHostname={hostname}
    />
  )
}
