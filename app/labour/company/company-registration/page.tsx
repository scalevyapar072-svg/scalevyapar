import { headers } from 'next/headers'
import { CompanyRegistrationForm } from '../company-registration-form'
import { CompanySiteShell } from '../company-site-shell'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import { groupLabourMasterOptions } from '@/lib/labour-masters-schema'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyRegistrationPage() {
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null
  const [website, snapshot, mastersSnapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot(),
    getLabourMastersSnapshot()
  ])
  const content = website.content
  const categories = snapshot.categories.filter(category => category.isActive)
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/company-registration" initialHostname={hostname}>
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
        stateOptions={masterOptionsByKey.state || []}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies || []}
        cityOptions={mastersSnapshot.activeCities.map(option => option.value.trim() || option.label.trim()).filter(Boolean)}
        cityOptionsByState={mastersSnapshot.activeCitiesByState || []}
        accentColor={content.theme.accentColor}
        initialHostname={hostname}
      />
    </CompanySiteShell>
  )
}
