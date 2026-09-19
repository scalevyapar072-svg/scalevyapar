import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const source = (relativePath: string) =>
  readFileSync(path.join(workspaceRoot, relativePath), 'utf8')

const taxModule = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'labour-company-tax.ts')).href
)
const billingModule = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'labour-company-billing.ts')).href
)
const pdfModule = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'labour-company-billing-pdf.ts')).href
)

const {
  GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT,
  VERIFIED_GST_SELLER_IDENTITY,
  findLabourCompanyInvoiceSellerProfileIssues,
  resolveLabourCompanyInvoiceSellerProfile,
  resolveLabourCompanyInvoiceSellerProfileForIssuedAt,
  resolveLabourCompanyTaxSettings
} = taxModule
const { buildInvoiceBuyer, buildInvoiceSeller, buildTaxInvoiceDocument } = billingModule
const { renderBillingInvoicePdf } = pdfModule

test('GST certificate identity replaces the legacy legal seller fields in dedicated Tax Settings', () => {
  const settings = resolveLabourCompanyTaxSettings({
    sellerLegalName: 'ScaleVyapar Rozgar',
    sellerTradeName: '',
    sellerAddress: 'ScaleVyapar Private Limited, Surat, Gujarat, India - 395002',
    sellerGstin: '08AAOPU8577G1ZR',
    sellerEmail: 'billing@example.test',
    sellerPhone: '+91 9876543210',
    sellerState: 'Gujarat',
    sellerStateCode: '24'
  })
  const profile = resolveLabourCompanyInvoiceSellerProfile(settings)

  assert.deepEqual(profile, {
    legalName: 'POONAM MANUEL',
    tradeName: 'SCALE VYAPAR',
    address: VERIFIED_GST_SELLER_IDENTITY.address,
    gstin: '08AAOPU8577G1ZR',
    email: 'billing@example.test',
    phone: '+91 9876543210',
    state: 'Rajasthan',
    stateCode: '08'
  })
  assert.deepEqual(findLabourCompanyInvoiceSellerProfileIssues(profile), [])
})

test('profile versioning preserves issued invoices and applies the certificate to future invoices', () => {
  const taxSettings = resolveLabourCompanyTaxSettings({
    sellerGstin: '08AAOPU8577G1ZR',
    sellerEmail: 'support@scalevyapar.in',
    sellerPhone: '+91 9660768352'
  })
  const effectiveAt = Date.parse(GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT)

  const historical = resolveLabourCompanyInvoiceSellerProfileForIssuedAt(
    taxSettings,
    new Date(effectiveAt - 1).toISOString()
  )
  const future = resolveLabourCompanyInvoiceSellerProfileForIssuedAt(
    taxSettings,
    new Date(effectiveAt).toISOString()
  )

  assert.deepEqual(historical, {
    legalName: 'ScaleVyapar Rozgar',
    tradeName: '',
    address: 'ScaleVyapar Private Limited, Surat, Gujarat, India - 395002',
    gstin: '08AAOPU8577G1ZR',
    email: 'support@scalevyapar.in',
    phone: '+91 9660768352',
    state: 'Rajasthan',
    stateCode: '08'
  })
  assert.equal(buildInvoiceSeller({
    name: historical.legalName,
    tradeName: historical.tradeName,
    address: historical.address,
    gstin: historical.gstin,
    email: historical.email,
    phone: historical.phone,
    state: historical.state,
    stateCode: historical.stateCode
  }).tradeName, '')
  assert.equal(future.legalName, 'POONAM MANUEL')
  assert.equal(future.tradeName, 'SCALE VYAPAR')
  assert.equal(future.address, VERIFIED_GST_SELLER_IDENTITY.address)
  assert.equal(future.gstin, '08AAOPU8577G1ZR')
})

test('synthetic future invoice renders only the verified legal seller identity', () => {
  const taxSettings = resolveLabourCompanyTaxSettings(null, '18')
  const profile = resolveLabourCompanyInvoiceSellerProfileForIssuedAt(
    taxSettings,
    GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT,
    '18'
  )
  const seller = buildInvoiceSeller({
    name: profile.legalName,
    tradeName: profile.tradeName,
    address: profile.address,
    gstin: profile.gstin,
    email: profile.email,
    phone: profile.phone,
    state: profile.state,
    stateCode: profile.stateCode
  })
  const buyer = buildInvoiceBuyer({
    companyName: 'Synthetic Test Buyer',
    companyAddress: '1 Test Lane',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    gstNumber: '08AAAAA0000A1Z5',
    email: 'buyer@example.test'
  })
  const invoice = buildTaxInvoiceDocument({
    record: {
      id: 'synthetic-test-invoice',
      date: '19 Sep 2026',
      time: '1:30 PM',
      planDetails: 'Synthetic QA Plan',
      appliesUntil: 'Test only',
      amount: 1180,
      status: 'Success',
      statusType: 'success',
      actionLabel: 'Invoice',
      actionType: 'invoice',
      createdAt: GST_CERTIFICATE_SELLER_PROFILE_EFFECTIVE_AT
    },
    buyer,
    seller,
    gstPercentage: '18',
    taxSettings
  })
  const pdfText = Buffer.from(renderBillingInvoicePdf(invoice)).toString('latin1')

  assert.match(pdfText, /POONAM MANUEL/)
  assert.match(pdfText, /SCALE VYAPAR/)
  assert.match(pdfText, /A-42, SUN PRIDE BHASKAR/)
  assert.match(pdfText, /ENCLAVE-II, PATRAKAR/)
  assert.match(pdfText, /JAIPUR, Jaipur, Rajasthan/)
  assert.match(pdfText, /- 302020, India/)
  assert.match(pdfText, /08AAOPU8577G1ZR/)
  assert.doesNotMatch(pdfText, /ScaleVyapar Private Limited/)
  assert.doesNotMatch(pdfText, /Surat, Gujarat/)
})

test('invoice API never falls back to ordinary Rozgar website contact fields', () => {
  const route = source('app/api/labour/company/invoice/[invoiceId]/route.ts')

  assert.ok(route.includes('resolveLabourCompanyInvoiceSellerProfileForIssuedAt'))
  assert.ok(route.includes('record.createdAt'))
  assert.ok(route.includes('legalSellerProfile.legalName'))
  assert.ok(route.includes('legalSellerProfile.tradeName'))
  assert.ok(route.includes('legalSellerProfile.address'))
  assert.ok(route.includes('legalSellerProfile.gstin'))
  assert.ok(route.includes('legalSellerProfile.email'))
  assert.ok(route.includes('legalSellerProfile.phone'))
  assert.equal(route.includes('websiteContent.contactPage'), false)
  assert.equal(route.includes('websiteContent.footer'), false)
  assert.equal(route.includes('websiteContent.header'), false)
  assert.equal(route.includes('websiteContent.theme'), false)
})

test('invoice generation remains read-only and cannot mutate issued invoice records', () => {
  const route = source('app/api/labour/company/invoice/[invoiceId]/route.ts')

  for (const mutation of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    assert.equal(route.includes(mutation), false)
  }
  assert.ok(route.includes("'Cache-Control': 'no-store'"))
})

test('Preview synthetic invoice route is isolated from payments and Production', () => {
  const route = source('app/api/qa/synthetic-invoice/route.ts')

  assert.ok(route.includes("process.env.VERCEL_ENV !== 'preview'"))
  assert.ok(route.includes("'X-Synthetic-Test-Data': 'true'"))
  assert.equal(route.includes('supabase'), false)
  assert.equal(route.includes('payment'), false)
  assert.equal(route.includes('transaction'), false)
})
