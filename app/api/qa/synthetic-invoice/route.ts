import { NextResponse } from 'next/server'
import {
  buildInvoiceBuyer,
  buildInvoiceSeller,
  buildTaxInvoiceDocument,
  type CompanyBillingRecord
} from '@/lib/labour-company-billing'
import { renderBillingInvoicePdf } from '@/lib/labour-company-billing-pdf'
import {
  resolveLabourCompanyInvoiceSellerProfileForIssuedAt,
  resolveLabourCompanyTaxSettings
} from '@/lib/labour-company-tax'

export const dynamic = 'force-dynamic'

const syntheticRecord: CompanyBillingRecord = {
  id: 'synthetic-preview-invoice',
  date: '19 Sep 2026',
  time: '1:30 PM',
  planDetails: 'Synthetic QA Plan',
  appliesUntil: 'Synthetic preview verification only',
  amount: 1180,
  status: 'Success',
  statusType: 'success',
  actionLabel: 'Invoice',
  actionType: 'invoice',
  createdAt: '2026-09-19T08:00:00.000Z',
  referenceId: 'SYNTHETIC-NO-PAYMENT',
  invoiceAvailable: true
}

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const taxSettings = resolveLabourCompanyTaxSettings(null, '18')
  const legalSellerProfile = resolveLabourCompanyInvoiceSellerProfileForIssuedAt(
    taxSettings,
    syntheticRecord.createdAt,
    '18'
  )
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
  const buyer = buildInvoiceBuyer({
    companyName: 'Synthetic Preview Buyer',
    contactPerson: 'QA Verification',
    companyAddress: '1 Test Lane',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    gstNumber: '08AAAAA0000A1Z5',
    email: 'preview-buyer@example.test'
  })
  const invoice = buildTaxInvoiceDocument({
    record: syntheticRecord,
    buyer,
    seller,
    gstPercentage: '18',
    taxSettings
  })
  const pdf = renderBillingInvoicePdf(invoice)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Synthetic-Test-Data': 'true'
    }
  })
}
