import { CompanyRegistrationForm } from '../company-registration-form'
import { CompanySiteShell } from '../company-site-shell'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { groupLabourMasterOptions } from '@/lib/labour-masters-schema'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyRegistrationPage() {
  const [website, snapshot, adminSettings, mastersSnapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourAdminSettings(),
    getLabourMastersSnapshot()
  ])
  const content = website.content
  const categories = snapshot.categories.filter(category => category.isActive)
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/company-registration">
      <CompanyRegistrationForm
        categories={categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          demandLevel: category.demandLevel
        }))}
        plans={companyPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          planAmount: plan.planAmount,
          registrationFee: plan.registrationFee,
          validityDays: plan.validityDays,
          description: plan.description,
          categoryId: plan.categoryId
        }))}
        industryCategoryOptions={masterOptionsByKey.industry_category || []}
        businessTypeOptions={masterOptionsByKey.business_type || []}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies || []}
        cityOptions={adminSettings.settings.workerHomeControls.popularCitySuggestions}
        accentColor={content.theme.accentColor}
      />
    </CompanySiteShell>
  )
}
