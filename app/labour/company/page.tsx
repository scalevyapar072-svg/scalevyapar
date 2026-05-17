import { LabourCompanyHomeClient } from './labour-company-home-client'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyHomePage() {
  const [website, snapshot, masters] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourMastersSnapshot()
  ])

  const content = website.content
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const industryCategories = masters.options
    .filter(option => option.masterKey === 'industry_category' && option.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label))
    .map(option => option.label)

  return (
    <LabourCompanyHomeClient
      content={content}
      industryCategories={industryCategories}
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
    />
  )
}
