import { CompanySiteShell } from '../company-site-shell'
import { CheckoutPageClient } from './checkout-page-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyCheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>
}) {
  const { content } = await getLabourCompanyWebsiteContent()
  const params = await searchParams
  const headerStore = await headers()
  const hostname = (headerStore.get('x-forwarded-host') || headerStore.get('host'))?.split(',')[0]?.split(':')[0] ?? null

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/checkout" initialHostname={hostname}>
      <CheckoutPageClient
        pricingContent={content.pricingPage}
        initialPlan={params.plan || ''}
        initialBilling={params.billing || ''}
        initialHostname={hostname}
      />
    </CompanySiteShell>
  )
}
