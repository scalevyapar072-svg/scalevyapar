import { NextRequest, NextResponse } from 'next/server'
import { createLabourEntity, getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const isTenDigitMobile = (value: string) => /^\d{10}$/.test(value.trim())

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const companyName = String(body.companyName || '').trim()
    const contactPerson = String(body.contactPerson || '').trim()
    const mobile = String(body.mobile || '').trim()
    const city = String(body.city || '').trim()
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((item: unknown) => String(item)).filter(Boolean) : []
    const activePlan = String(body.activePlan || '').trim()
    const jobTitle = String(body.jobTitle || '').trim()
    const jobDescription = String(body.jobDescription || '').trim()
    const workersNeeded = Number(body.workersNeeded || 1)
    const wageAmount = Number(body.wageAmount || 0)
    const validityDays = Number(body.validityDays || 3)
    const categoryId = String(body.categoryId || categoryIds[0] || '').trim()
    const actor = 'company-website'

    if (!companyName || !contactPerson || !mobile || !city) {
      return NextResponse.json({ error: 'Company name, contact person, mobile and city are required.' }, { status: 400 })
    }

    if (!isTenDigitMobile(mobile)) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits.' }, { status: 400 })
    }

    if (categoryIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one labour category.' }, { status: 400 })
    }

    if (!activePlan) {
      return NextResponse.json({ error: 'Select a pricing plan.' }, { status: 400 })
    }

    if (!jobTitle || !categoryId) {
      return NextResponse.json({ error: 'Job title and category are required.' }, { status: 400 })
    }

    if (workersNeeded <= 0 || validityDays <= 0 || wageAmount < 0) {
      return NextResponse.json({ error: 'Workers needed, validity and wage amount must be valid values.' }, { status: 400 })
    }

    const snapshot = await getLabourMarketplaceSnapshot()
    const duplicateCompany = snapshot.companies.find(company => company.mobile === mobile)
    if (duplicateCompany) {
      return NextResponse.json({ error: 'A company with this mobile number already exists.' }, { status: 409 })
    }

    const plan = snapshot.plans.find(item => item.id === activePlan && item.audience === 'company')
    if (!plan) {
      return NextResponse.json({ error: 'Selected company plan is not valid.' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const companySnapshot = await createLabourEntity(
      'companies',
      {
        companyName,
        contactPerson,
        mobile,
        city,
        categoryIds,
        status: 'pending',
        registrationFeePaid: false,
        activePlan
      },
      actor
    )

    const createdCompany = companySnapshot.companies.find(company => company.mobile === mobile)
    if (!createdCompany) {
      throw new Error('Company intake was created but could not be located afterwards.')
    }

    const finalSnapshot = await createLabourEntity(
      'jobPosts',
      {
        companyId: createdCompany.id,
        categoryId,
        title: jobTitle,
        description: jobDescription,
        city,
        workersNeeded,
        wageAmount,
        validityDays,
        status: 'draft',
        publishedAt: today,
        expiresAt: addDays(today, validityDays)
      },
      actor
    )

    return NextResponse.json({
      success: true,
      message: 'Company enquiry submitted successfully. Our team will review it and activate the account.',
      companyId: createdCompany.id,
      snapshot: finalSnapshot
    })
  } catch (error) {
    console.error('Company intake failed:', error)
    return NextResponse.json({ error: 'Failed to submit company enquiry.' }, { status: 500 })
  }
}
