import { CompanySiteShell } from '../company-site-shell'
import { CheckoutPageClient } from './checkout-page-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyCheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>
}) {
  const { content } = await getLabourCompanyWebsiteContent()
  const params = await searchParams

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/checkout">
      <CheckoutPageClient
        pricingContent={content.pricingPage}
        initialPlan={params.plan || ''}
        initialBilling={params.billing || ''}
      />
    </CompanySiteShell>
  )
}
