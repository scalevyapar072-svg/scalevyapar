import { NextRequest, NextResponse } from 'next/server'
import { getCompanyAppDashboard, requireCompanyApp } from '@/lib/labour-company-app'
import {
  buildInvoiceBuyer,
  buildInvoiceSeller,
  buildTaxInvoiceDocument,
  type CompanyBillingDashboardSource,
  resolveCompanyBillingHistory
} from '@/lib/labour-company-billing'
import { renderBillingInvoicePdf } from '@/lib/labour-company-billing-pdf'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const auth = await requireCompanyApp(request)
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice id is required.' }, { status: 400 })
    }

    const [dashboard, websitePayload] = await Promise.all([
      getCompanyAppDashboard(auth.companyId),
      getLabourCompanyWebsiteContent()
    ])
    const websiteContent = websitePayload.content

    const billingHistory = resolveCompanyBillingHistory(dashboard as CompanyBillingDashboardSource)
    const record = billingHistory.find(item => item.id === invoiceId)

    if (!record) {
      return NextResponse.json({ error: 'Billing record not found.' }, { status: 404 })
    }

    if (record.actionType !== 'invoice') {
      return NextResponse.json({ error: 'Invoice is not available for this billing record.' }, { status: 400 })
    }

    const checkoutSettings = websiteContent.pricingPage.checkout
    const buyer = buildInvoiceBuyer(dashboard.profile, checkoutSettings.gstin)
    const seller = buildInvoiceSeller({
      name: websiteContent.header.logoTitle || websiteContent.theme.brandName,
      address: websiteContent.contactPage.address || websiteContent.footer.address,
      gstin: checkoutSettings.gstin,
      email: websiteContent.contactPage.supportEmail || websiteContent.footer.supportEmail,
      phone: websiteContent.contactPage.phone || websiteContent.footer.phone
    })
    const invoice = buildTaxInvoiceDocument({
      record,
      buyer,
      seller,
      gstPercentage: checkoutSettings.gstPercentage
    })
    const pdf = renderBillingInvoicePdf(invoice)

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invoice.' },
      { status: 500 }
    )
  }
}
