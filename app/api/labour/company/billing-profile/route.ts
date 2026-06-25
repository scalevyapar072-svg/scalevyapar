import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyApp, updateCompanyAppBillingProfile } from '@/lib/labour-company-app'

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i

const normalizeText = (value: unknown) => String(value ?? '').trim()
const normalizeGstIdentifier = (value: unknown) => normalizeText(value).replace(/\s+/g, '').toUpperCase()

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const body = await request.json().catch(() => ({}))

    const gstNumber = normalizeGstIdentifier(body.gstNumber)
    const isdGstin = normalizeGstIdentifier(body.isdGstin)

    if (gstNumber && !GST_REGEX.test(gstNumber)) {
      return NextResponse.json({ error: 'Enter a valid 15-character GSTIN.' }, { status: 400 })
    }

    if (isdGstin && !GST_REGEX.test(isdGstin)) {
      return NextResponse.json({ error: 'Enter a valid 15-character ISD-GSTIN.' }, { status: 400 })
    }

    if (gstNumber && isdGstin && gstNumber !== isdGstin) {
      return NextResponse.json(
        { error: 'Enter either GSTIN or ISD-GSTIN for the billing profile, not two different values.' },
        { status: 400 }
      )
    }

    const companyName = normalizeText(body.companyName)
    if (!companyName) {
      return NextResponse.json({ error: 'Business legal name is required.' }, { status: 400 })
    }

    const dashboard = await updateCompanyAppBillingProfile(auth.companyId, {
      companyName,
      gstNumber: isdGstin || gstNumber,
      companyAddress: normalizeText(body.companyAddress),
      city: normalizeText(body.city),
      area: normalizeText(body.area),
      state: normalizeText(body.state),
      pincode: normalizeText(body.pincode)
    })

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update company billing profile.' },
      { status: 400 }
    )
  }
}
