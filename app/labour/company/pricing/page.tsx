import { CompanySiteShell } from '../company-site-shell'
import { PricingPageClient } from './pricing-page-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyPricingPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/pricing" initialHostname={hostname}>
      <PricingPageClient content={content.pricingPage} initialHostname={hostname} />
    </CompanySiteShell>
  )
}
