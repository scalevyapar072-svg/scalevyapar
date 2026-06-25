import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth-token'
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
      const fallbackAuthToken =
        request.cookies.get(AUTH_COOKIE_NAME)?.value ||
        request.cookies.get(LEGACY_AUTH_COOKIE_NAME)?.value ||
        ''
      const user = fallbackAuthToken ? await verifyToken(fallbackAuthToken) : null

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
    const buyer = buildInvoiceBuyer(dashboard.profile)
    const seller = buildInvoiceSeller({
      name: taxSettings.sellerLegalName || websiteContent.header.logoTitle || websiteContent.theme.brandName,
      address: taxSettings.sellerAddress || websiteContent.contactPage.address || websiteContent.footer.address,
      gstin: taxSettings.sellerGstin || checkoutSettings.gstin,
      email: taxSettings.sellerEmail || websiteContent.contactPage.supportEmail || websiteContent.footer.supportEmail,
      phone: taxSettings.sellerPhone || websiteContent.contactPage.phone || websiteContent.footer.phone,
      state: taxSettings.sellerState,
      stateCode: taxSettings.sellerStateCode
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
