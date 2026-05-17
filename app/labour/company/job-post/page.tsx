import { CompanyJobPostForm } from '../company-job-post-form'
import { CompanySiteShell } from '../company-site-shell'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { groupLabourMasterOptions } from '@/lib/labour-masters-schema'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyJobPostPage() {
  const [website, snapshot, adminSettings, mastersSnapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourAdminSettings(),
    getLabourMastersSnapshot()
  ])

  const content = website.content
  const activeCategories = snapshot.categories.filter(category => category.isActive)
  const activeCompanyPlans = snapshot.plans.filter(plan => plan.isActive && plan.audience === 'company')
  const cityOptions = adminSettings.settings.workerHomeControls.popularCitySuggestions
  const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/job-post">
      <CompanyJobPostForm
        categories={activeCategories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description
        }))}
        plans={activeCompanyPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          validityDays: plan.validityDays,
          planAmount: plan.planAmount
        }))}
        industryCategoryOptions={masterOptionsByKey.industry_category || []}
        businessTypeOptions={masterOptionsByKey.business_type || []}
        categoryDependencies={mastersSnapshot.categoryDependencies || []}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies || []}
        cityOptions={cityOptions}
        accentColor={content.theme.highlightColor || content.theme.accentColor}
      />
    </CompanySiteShell>
  )
}
