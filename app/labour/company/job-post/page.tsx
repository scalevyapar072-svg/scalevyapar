import { headers } from 'next/headers'
import { CompanyJobPostForm } from '../company-job-post-form'
import { CompanySiteShell } from '../company-site-shell'
import { getPublicLabourMastersSnapshot } from '@/lib/labour-masters'
import { groupLabourMasterOptions } from '@/lib/labour-masters-schema'
import { getPublicLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getPublicLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { PublicDataNotice } from '../public-data-notice'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyJobPostPage() {
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null
  const [website, marketplaceResult, mastersResult] = await Promise.all([
    getPublicLabourCompanyWebsiteContent(),
    getPublicLabourMarketplaceSnapshot(),
    getPublicLabourMastersSnapshot()
  ])

  const content = website.content
  const snapshot = marketplaceResult.snapshot
  const mastersSnapshot = mastersResult.snapshot
  const activeCategories = (snapshot?.categories || []).filter(category => category.isActive)
  const activeCompanyPlans = (snapshot?.plans || []).filter(plan => plan.isActive && plan.audience === 'company')
  const cityOptions = mastersSnapshot.activeCities
    .map(option => option.value.trim() || option.label.trim())
    .filter(Boolean)
  const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/job-post" initialHostname={hostname}>
      {website.degraded || mastersResult.degraded ? (
        <PublicDataNotice retryHref="/labour/company/job-post" />
      ) : null}
      {!snapshot ? (
        <PublicDataNotice
          retryHref="/labour/company/job-post"
          message="Job posting options are temporarily unavailable. No job was created or changed."
        />
      ) : <CompanyJobPostForm
        categories={activeCategories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description
        }))}
        plans={activeCompanyPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          planValidityDays: plan.planValidityDays,
          jobPostLiveDays: plan.jobPostLiveDays,
          validityDays: plan.validityDays,
          planAmount: plan.planAmount,
          jobPostLimit: plan.jobPostLimit,
          industryCategoryValues: plan.industryCategoryValues,
          businessTypeValues: plan.businessTypeValues,
          labourCategoryIds: plan.labourCategoryIds?.length ? plan.labourCategoryIds : plan.categoryId ? [plan.categoryId] : []
        }))}
        industryCategoryOptions={masterOptionsByKey.industry_category || []}
        businessTypeOptions={masterOptionsByKey.business_type || []}
        categoryDependencies={mastersSnapshot.categoryDependencies || []}
        industryBusinessDependencies={mastersSnapshot.industryBusinessDependencies || []}
        cityOptions={cityOptions}
        accentColor={content.theme.highlightColor || content.theme.accentColor}
        initialHostname={hostname}
      />}
    </CompanySiteShell>
  )
}
