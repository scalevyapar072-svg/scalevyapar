import { NextRequest, NextResponse } from 'next/server'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  findMatchingMasterOption,
  getVisibleLabourMasterOptions,
  groupLabourMasterOptions
} from '@/lib/labour-masters-schema'
import { createClient, getUserByEmail } from '@/lib/db'
import { createLabourEntity, getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const isTenDigitMobile = (value: string) => /^\d{10}$/.test(value.trim())
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const buildRegistrationMetaDescription = (
  meta: Record<string, unknown> | null,
  uploadedDocuments: Array<{ label: string; fileName: string; storagePath: string }> = []
) => {
  if (!meta && uploadedDocuments.length === 0) {
    return ''
  }

  const lines = ['Company registration details']
  const textEntries: Array<[string, unknown]> = [
    ['Business type', meta?.businessType],
    ['Industry category', meta?.industryCategory],
    ['Connected plan', meta?.selectedPlanLabel],
    ['GST number', meta?.gstNumber],
    ['Company email', meta?.companyEmail],
    ['WhatsApp number', meta?.whatsAppNumber],
    ['Company address', meta?.companyAddress],
    ['State', meta?.state],
    ['Area', meta?.area],
    ['Pincode', meta?.pincode],
    ['Hiring type', meta?.hiringType],
    ['Required worker category', meta?.requiredWorkerCategoryLabel],
    ['Business description', meta?.businessDescription]
  ]

  textEntries.forEach(([label, value]) => {
    const normalized = String(value || '').trim()
    if (normalized) {
      lines.push(`${label}: ${normalized}`)
    }
  })

  uploadedDocuments.forEach(document => {
    const label = String(document.label || '').trim() || 'Document'
    const fileName = String(document.fileName || '').trim()
    const storagePath = String(document.storagePath || '').trim()
    lines.push(`${label}: ${fileName}${storagePath ? ` (${storagePath})` : ''}`)
  })

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const companyName = String(body.companyName || '').trim()
    const contactPerson = String(body.contactPerson || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const mobile = String(body.mobile || '').trim()
    const contactMobile = String(body.contactMobile || '').trim()
    const city = String(body.city || '').trim()
    const area = String((body.registrationMeta as Record<string, unknown> | undefined)?.area || '').trim()
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((item: unknown) => String(item)).filter(Boolean) : []
    const activePlan = String(body.activePlan || '').trim()
    const jobTitle = String(body.jobTitle || '').trim()
    const jobDescription = String(body.jobDescription || '').trim()
    const registrationMeta = body.registrationMeta && typeof body.registrationMeta === 'object'
      ? body.registrationMeta as Record<string, unknown>
      : null
    const uploadedDocuments = Array.isArray(body.uploadedDocuments)
      ? body.uploadedDocuments
          .map((item: unknown) => ({
            label: String((item as Record<string, unknown>)?.label || '').trim(),
            fileName: String((item as Record<string, unknown>)?.fileName || '').trim(),
            storagePath: String((item as Record<string, unknown>)?.storagePath || '').trim()
          }))
          .filter((item: { label: string; fileName: string; storagePath: string }) => item.fileName || item.storagePath)
      : []
    const workersNeeded = Number(body.workersNeeded || 1)
    const wageAmount = Number(body.wageAmount || 0)
    const validityDays = Number(body.validityDays || 3)
    const categoryId = String(body.categoryId || categoryIds[0] || '').trim()
    const actor = 'company-website'

    if (!companyName || !contactPerson || !mobile || !email || !password) {
      return NextResponse.json({ error: 'Company name, contact person, email, password and mobile are required.' }, { status: 400 })
    }

    if (!city || !area) {
      return NextResponse.json({ error: 'City and area are required.' }, { status: 400 })
    }

    if (!isTenDigitMobile(mobile)) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits.' }, { status: 400 })
    }

    if (contactMobile && !isTenDigitMobile(contactMobile)) {
      return NextResponse.json({ error: 'Contact number must be exactly 10 digits.' }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Company email is not valid.' }, { status: 400 })
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters and include letters and numbers.' }, { status: 400 })
    }

    const snapshot = await getLabourMarketplaceSnapshot()
    const mastersSnapshot = await getLabourMastersSnapshot()
    const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)
    const duplicateCompany = snapshot.companies.find(company =>
      company.mobile === mobile || (email && company.email === email)
    )
    if (duplicateCompany) {
      return NextResponse.json({ error: 'A company with this mobile number or email already exists.' }, { status: 409 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'A login account already exists with this email address.' }, { status: 409 })
    }

    const plan = activePlan
      ? snapshot.plans.find(item => item.id === activePlan && item.audience === 'company')
      : null
    if (activePlan && !plan) {
      return NextResponse.json({ error: 'Selected company plan is not valid.' }, { status: 400 })
    }

    const submittedIndustryCategory = String(registrationMeta?.industryCategory || '').trim()
    const submittedBusinessType = String(registrationMeta?.businessType || '').trim()
    const submittedCategoryIds = [...new Set([categoryId, ...categoryIds].map(item => String(item || '').trim()).filter(Boolean))]

    const visibleIndustryCategoryOptions = getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
    if (submittedIndustryCategory && !findMatchingMasterOption(visibleIndustryCategoryOptions, submittedIndustryCategory)) {
      return NextResponse.json({ error: 'Selected industry category is hidden or not available.' }, { status: 400 })
    }

    const visibleBusinessTypeOptions = submittedIndustryCategory
      ? filterBusinessTypesByIndustryDependency(
          masterOptionsByKey.business_type || [],
          masterOptionsByKey.industry_category || [],
          mastersSnapshot.industryBusinessDependencies || [],
          submittedIndustryCategory
        )
      : []

    if (submittedBusinessType && !findMatchingMasterOption(visibleBusinessTypeOptions, submittedBusinessType)) {
      return NextResponse.json({ error: 'Selected business type is hidden or not available for this industry category.' }, { status: 400 })
    }

    if (submittedCategoryIds.length > 0) {
      const visibleCategories = filterCategoriesByLabourDependency(
        snapshot.categories,
        mastersSnapshot.categoryDependencies || [],
        masterOptionsByKey,
        submittedBusinessType,
        submittedIndustryCategory
      )
      const visibleCategoryIds = new Set(visibleCategories.map(item => item.id))
      const hasInvalidCategory = submittedCategoryIds.some(item => !visibleCategoryIds.has(item))
      if (hasInvalidCategory) {
        return NextResponse.json({ error: 'Selected category is hidden or not available for this industry category and business type.' }, { status: 400 })
      }
    }

    const finalJobDescription = [
      jobDescription,
      buildRegistrationMetaDescription(registrationMeta, uploadedDocuments)
    ].filter(Boolean).join('\n\n')

    const today = new Date().toISOString().slice(0, 10)
    await createClient({
      name: companyName,
      email,
      password,
      phone: mobile,
      plan: activePlan || undefined
    })

    const companySnapshot = await createLabourEntity(
      'companies',
      {
        companyName,
        contactPerson,
        email,
        mobile,
        contactMobile: contactMobile || mobile,
        businessType: String(registrationMeta?.businessType || '').trim(),
        industryCategory: String(registrationMeta?.industryCategory || '').trim(),
        gstNumber: String(registrationMeta?.gstNumber || '').trim().toUpperCase(),
        companyAddress: String(registrationMeta?.companyAddress || '').trim(),
        state: String(registrationMeta?.state || '').trim(),
        city,
        area,
        pincode: String(registrationMeta?.pincode || '').trim(),
        workersNeeded,
        hiringType: String(registrationMeta?.hiringType || '').trim(),
        businessDescription: String(registrationMeta?.businessDescription || '').trim(),
        gstCertificatePath: uploadedDocuments[0]?.storagePath || '',
        companyProofPath: uploadedDocuments[1]?.storagePath || '',
        ownerIdProofPath: uploadedDocuments[2]?.storagePath || '',
        categoryIds,
        status: 'active',
        registrationFeePaid: false,
        activePlan
      },
      actor
    )

    const createdCompany = companySnapshot.companies.find(company => company.mobile === mobile)
    if (!createdCompany) {
      throw new Error('Company intake was created but could not be located afterwards.')
    }

    let finalSnapshot = companySnapshot
    if (jobTitle && categoryId && workersNeeded > 0 && validityDays > 0 && wageAmount >= 0) {
      finalSnapshot = await createLabourEntity(
        'jobPosts',
        {
          companyId: createdCompany.id,
          categoryId,
          title: jobTitle,
          description: finalJobDescription,
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
    }

    return NextResponse.json({
      success: true,
      message: 'Company registration submitted successfully. Your company account is active and ready for sign in.',
      companyId: createdCompany.id,
      snapshot: finalSnapshot
    })
  } catch (error) {
    console.error('Company intake failed:', error)
    return NextResponse.json({ error: 'Failed to submit company enquiry.' }, { status: 500 })
  }
}
