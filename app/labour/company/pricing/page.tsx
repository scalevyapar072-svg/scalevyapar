import { CompanySiteShell } from '../company-site-shell'
import { PricingPageClient } from './pricing-page-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyPricingPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/pricing">
      <PricingPageClient content={content.pricingPage} />
    </CompanySiteShell>
  )
}
