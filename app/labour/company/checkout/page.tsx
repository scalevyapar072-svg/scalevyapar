import { CompanySiteShell } from '../company-site-shell'
import { CheckoutPageClient } from './checkout-page-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyCheckoutPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/checkout">
      <CheckoutPageClient pricingContent={content.pricingPage} />
    </CompanySiteShell>
  )
}
