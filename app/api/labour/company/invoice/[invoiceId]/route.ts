import { NextRequest, NextResponse } from 'next/server'
import { getCompanyUserFromRequest } from '@/lib/auth'
import { getCompanyAppDashboard, loginCompanyAppFromDashboard, requireCompanyApp } from '@/lib/labour-company-app'
import {
  buildInvoiceBuyer,
  buildInvoiceSeller,
  buildTaxInvoiceDocument,
  type CompanyBillingDashboardSource,
  resolveCompanyBillingHistory
} from '@/lib/labour-company-billing'
import { renderBillingInvoicePdf } from '@/lib/labour-company-billing-pdf'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { resolveLabourCompanyInvoiceSellerProfileForIssuedAt } from '@/lib/labour-company-tax'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice id is required.' }, { status: 400 })
    }

    let dashboard

    try {
      const auth = await requireCompanyApp(request)
      dashboard = await getCompanyAppDashboard(auth.companyId)
    } catch {
      const user = await getCompanyUserFromRequest(request)

      if (!user?.email) {
        return NextResponse.json({ error: 'Company authorization token is missing.' }, { status: 401 })
      }

      const companyResult = await loginCompanyAppFromDashboard(user.email)
      dashboard = companyResult.dashboard
    }

    const websitePayload = await getLabourCompanyWebsiteContent()
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
    const taxSettings = checkoutSettings.taxSettings
    const legalSellerProfile = resolveLabourCompanyInvoiceSellerProfileForIssuedAt(
      taxSettings,
      record.createdAt,
      checkoutSettings.gstPercentage
    )
    const buyer = buildInvoiceBuyer(dashboard.profile)
    const seller = buildInvoiceSeller({
      name: legalSellerProfile.legalName,
      tradeName: legalSellerProfile.tradeName,
      address: legalSellerProfile.address,
      gstin: legalSellerProfile.gstin,
      email: legalSellerProfile.email,
      phone: legalSellerProfile.phone,
      state: legalSellerProfile.state,
      stateCode: legalSellerProfile.stateCode
    })
    const invoice = buildTaxInvoiceDocument({
      record,
      buyer,
      seller,
      gstPercentage: checkoutSettings.gstPercentage,
      taxSettings
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
