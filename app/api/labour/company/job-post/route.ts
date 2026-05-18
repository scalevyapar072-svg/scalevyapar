import { NextRequest, NextResponse } from 'next/server'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  findMatchingMasterOption,
  getVisibleLabourMasterOptions,
  groupLabourMasterOptions
} from '@/lib/labour-masters-schema'
import { requireCompanyApp } from '@/lib/labour-company-app'
import { createLabourEntity, getLabourMarketplaceSnapshot, updateLabourEntity } from '@/lib/labour-marketplace'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_REGEX = /^\d{10}$/

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const normalize = (value: unknown) => String(value || '').trim()
const normalizeEmail = (value: unknown) => normalize(value).toLowerCase()
const normalizeLookup = (value: unknown) => normalize(value).toLowerCase()

const formatStatusLabel = (value: string) => {
  if (value === 'live' || value === 'active' || value === 'hired') return 'Active'
  if (value === 'expired') return 'Expired'
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Draft'
}

const parseJobRequirementDetailMap = (description: string) => {
  const normalized = String(description || '').replace(/\r/g, '')
  const detailMarker = '\n\nJob requirement details\n'
  const docsMarker = '\n\nDocuments\n'
  const detailIndex = normalized.indexOf(detailMarker)
  const detailMap = new Map<string, string>()

  if (detailIndex === -1) {
    return detailMap
  }

  const afterDetails = normalized.slice(detailIndex + detailMarker.length)
  const docsIndex = afterDetails.indexOf(docsMarker)
  const detailBlock = (docsIndex === -1 ? afterDetails : afterDetails.slice(0, docsIndex)).trim()

  detailBlock
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return
      const label = line.slice(0, separatorIndex).trim().toLowerCase()
      const value = line.slice(separatorIndex + 1).trim()
      detailMap.set(label, value)
    })

  return detailMap
}

const buildJobRequirementDescription = (
  jobDescription: string,
  details: Array<[string, string]>,
  uploadedDocuments: Array<{ label: string; fileName: string; storagePath: string }>
) => {
  const lines = [normalize(jobDescription)]

  const metaLines = details
    .map(([label, value]) => [label, normalize(value)] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)

  if (metaLines.length > 0) {
    lines.push(['Job requirement details', ...metaLines].join('\n'))
  }

  if (uploadedDocuments.length > 0) {
    lines.push(
      ['Documents', ...uploadedDocuments.map(document => `${document.label}: ${document.fileName}${document.storagePath ? ` (${document.storagePath})` : ''}`)].join('\n')
    )
  }

  return lines.filter(Boolean).join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snapshot = await getLabourMarketplaceSnapshot()
    const mastersSnapshot = await getLabourMastersSnapshot()
    const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)

    const companyName = normalize(body.companyName)
    const contactPerson = normalize(body.contactPerson)
    const companyEmail = normalizeEmail(body.companyEmail)
    const mobile = normalize(body.mobile)
    const whatsAppNumber = normalize(body.whatsAppNumber)
    const industryType = normalize(body.industryType)
    const businessType = normalize(body.businessType)
    const companyAddress = normalize(body.companyAddress)
    const state = normalize(body.state)
    const city = normalize(body.city)
    const area = normalize(body.area)
    const pincode = normalize(body.pincode)

    const jobTitle = normalize(body.jobTitle)
    const labourCategoryId = normalize(body.labourCategoryId)
    const selectedPlanId = normalize(body.selectedPlanId)
    const workerCategory = normalize(body.workerCategory)
    const workersRequired = Number(body.workersRequired || 0)
    const genderPreference = normalize(body.genderPreference)
    const ageRequirement = normalize(body.ageRequirement)
    const experienceRequired = normalize(body.experienceRequired)

    const jobLocation = normalize(body.jobLocation)
    const dutyHours = normalize(body.dutyHours)
    const shiftType = normalize(body.shiftType)
    const weeklyOff = normalize(body.weeklyOff)
    const jobDuration = normalize(body.jobDuration)

    const salaryType = normalize(body.salaryType)
    const salaryAmount = Number(body.salaryAmount || 0)
    const overtimeAvailable = normalize(body.overtimeAvailable)
    const foodFacility = normalize(body.foodFacility)
    const accommodation = normalize(body.accommodation)
    const transportFacility = normalize(body.transportFacility)

    const jobDescription = normalize(body.jobDescription)
    const requiredSkills = normalize(body.requiredSkills)
    const specialInstructions = normalize(body.specialInstructions)
    const languagesPreferred = normalize(body.languagesPreferred)

    const mode = normalize(body.mode) || 'publish'
    const editJobId = normalize(body.editJobId)

    const uploadedDocuments = Array.isArray(body.uploadedDocuments)
      ? body.uploadedDocuments
          .map((item: unknown) => ({
            label: normalize((item as Record<string, unknown>)?.label),
            fileName: normalize((item as Record<string, unknown>)?.fileName),
            storagePath: normalize((item as Record<string, unknown>)?.storagePath)
          }))
          .filter((item: { label: string; fileName: string; storagePath: string }) => item.fileName || item.storagePath)
      : []

    if (!companyName || !contactPerson || !companyEmail || !mobile || !whatsAppNumber || !industryType || !businessType || !companyAddress || !state || !city || !area || !pincode) {
      return NextResponse.json({ error: 'Complete the company details section before submitting the job requirement.' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(companyEmail)) {
      return NextResponse.json({ error: 'Enter a valid company email.' }, { status: 400 })
    }

    if (!MOBILE_REGEX.test(mobile) || !MOBILE_REGEX.test(whatsAppNumber)) {
      return NextResponse.json({ error: 'Mobile and WhatsApp numbers must be exactly 10 digits.' }, { status: 400 })
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Pincode must be exactly 6 digits.' }, { status: 400 })
    }

    if (
      !jobTitle ||
      !labourCategoryId ||
      !selectedPlanId ||
      workersRequired <= 0 ||
      !salaryType ||
      salaryAmount <= 0 ||
      !jobDescription
    ) {
      return NextResponse.json({ error: 'Complete all required job requirement fields before submitting.' }, { status: 400 })
    }

    let company = null
    try {
      const auth = await requireCompanyApp(request)
      company = snapshot.companies.find(item => item.id === auth.companyId) || null
    } catch {
      return NextResponse.json(
        { error: 'Register & login to post a job. Please sign in with your company account first.' },
        { status: 401 }
      )
    }

    if (!company) {
      return NextResponse.json({ error: 'This registered company account could not be found. Please sign in again.' }, { status: 404 })
    }

    if (company.status === 'blocked') {
      return NextResponse.json({ error: 'This company account is blocked. Please contact labour support.' }, { status: 400 })
    }

    const existingJob = editJobId
      ? snapshot.jobPosts.find(jobPost => jobPost.id === editJobId && jobPost.companyId === company.id) || null
      : null

    if (editJobId && !existingJob) {
      return NextResponse.json({ error: 'This company job could not be found for editing.' }, { status: 404 })
    }

    const visibleIndustryCategoryOptions = getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
    if (!findMatchingMasterOption(visibleIndustryCategoryOptions, industryType)) {
      return NextResponse.json({ error: 'Selected industry category is hidden or not available.' }, { status: 400 })
    }

    const visibleBusinessTypeOptions = filterBusinessTypesByIndustryDependency(
      masterOptionsByKey.business_type || [],
      masterOptionsByKey.industry_category || [],
      mastersSnapshot.industryBusinessDependencies || [],
      industryType
    )
    if (!findMatchingMasterOption(visibleBusinessTypeOptions, businessType)) {
      return NextResponse.json({ error: 'Selected business type is hidden or not available for this industry category.' }, { status: 400 })
    }

    const effectiveCategoryId = existingJob ? existingJob.categoryId : labourCategoryId
    const visibleCategories = filterCategoriesByLabourDependency(
      snapshot.categories,
      mastersSnapshot.categoryDependencies || [],
      masterOptionsByKey,
      businessType,
      industryType
    )
    const visibleCategoryIds = new Set(visibleCategories.map(category => category.id))
    const isExistingHiddenCategory = Boolean(existingJob && existingJob.categoryId === effectiveCategoryId)
    if (!visibleCategoryIds.has(effectiveCategoryId) && !isExistingHiddenCategory) {
      return NextResponse.json({ error: 'Select a valid visible labour category.' }, { status: 400 })
    }

    const labourCategory = snapshot.categories.find(category => category.id === effectiveCategoryId)
    if (!labourCategory) {
      return NextResponse.json({ error: 'Select a valid labour category.' }, { status: 400 })
    }

    const existingDetailMap = existingJob ? parseJobRequirementDetailMap(existingJob.description) : new Map<string, string>()
    const lockedPlanLabel = existingDetailMap.get('connected plan') || ''
    const lockedPlan = lockedPlanLabel
      ? snapshot.plans.find(plan => plan.audience === 'company' && normalizeLookup(plan.name) === normalizeLookup(lockedPlanLabel))
      : null

    const selectedPlan = existingJob
      ? (lockedPlan || snapshot.plans.find(plan => plan.id === selectedPlanId && plan.audience === 'company' && plan.isActive))
      : snapshot.plans.find(plan => plan.id === selectedPlanId && plan.audience === 'company' && plan.isActive)

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Select a valid connected company plan.' }, { status: 400 })
    }

    const updatedCompanySnapshot = await updateLabourEntity(
      'companies',
      company.id,
      {
        ...company,
        companyName,
        contactPerson,
        email: companyEmail,
        mobile,
        contactMobile: whatsAppNumber,
        businessType,
        industryCategory: industryType,
        companyAddress,
        state,
        city,
        area,
        pincode
      },
      'company-job-post'
    )

    const refreshedCompany = updatedCompanySnapshot?.companies.find(item => item.id === company.id) || company
    const today = new Date().toISOString().slice(0, 10)
    const validityDays = selectedPlan.validityDays > 0 ? selectedPlan.validityDays : 30
    const status = 'draft'
    const resolvedJobLocation = jobLocation || city
    const finalDescription = buildJobRequirementDescription(
      jobDescription,
      [
        ['Connected plan', selectedPlan.name],
        ['Plan validity', `${selectedPlan.validityDays} days`],
        ['Worker category', workerCategory],
        ['Number of workers required', String(workersRequired)],
        ['Gender preference', genderPreference],
        ['Age requirement', ageRequirement],
        ['Experience required', experienceRequired],
        ['Job location', resolvedJobLocation],
        ['Duty hours', dutyHours],
        ['Shift type', shiftType],
        ['Weekly off', weeklyOff],
        ['Job duration', jobDuration],
        ['Salary type', salaryType],
        ['Salary amount', String(salaryAmount)],
        ['Overtime available', overtimeAvailable],
        ['Food facility', foodFacility],
        ['Accommodation', accommodation],
        ['Transport facility', transportFacility],
        ['Required skills', requiredSkills],
        ['Special instructions', specialInstructions],
        ['Languages preferred', languagesPreferred],
        ['Submission mode', mode === 'draft' ? 'Saved as draft' : 'Pending review for publish']
      ],
      uploadedDocuments
    )

    if (existingJob) {
      const publishedAt = existingJob.publishedAt || today
      const effectiveStatus = existingJob.status || status
      const updatedSnapshot = await updateLabourEntity(
        'jobPosts',
        existingJob.id,
        {
          ...existingJob,
          categoryId: effectiveCategoryId,
          title: jobTitle,
          description: finalDescription,
          city: resolvedJobLocation,
          locationLabel: `${resolvedJobLocation}${dutyHours ? ` | ${dutyHours}` : ''}`,
          workersNeeded: workersRequired,
          wageAmount: salaryAmount,
          validityDays,
          status: effectiveStatus,
          publishedAt,
          expiresAt: addDays(publishedAt, validityDays)
        },
        'company-job-post'
      )

      const updatedJob = updatedSnapshot?.jobPosts.find(jobPost => jobPost.id === existingJob.id) || existingJob

      return NextResponse.json({
        success: true,
        message: 'Job requirement updated successfully.',
        jobId: updatedJob.id,
        statusLabel: formatStatusLabel(updatedJob.status),
        snapshot: updatedSnapshot
      })
    }

    const finalSnapshot = await createLabourEntity(
      'jobPosts',
      {
        companyId: refreshedCompany.id,
        categoryId: effectiveCategoryId,
        title: jobTitle,
        description: finalDescription,
        city: resolvedJobLocation,
        locationLabel: `${resolvedJobLocation}${dutyHours ? ` | ${dutyHours}` : ''}`,
        workersNeeded: workersRequired,
        wageAmount: salaryAmount,
        validityDays,
        status,
        publishedAt: today,
        expiresAt: addDays(today, validityDays)
      },
      'company-job-post'
    )

    const createdJob = [...finalSnapshot.jobPosts].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]

    return NextResponse.json({
      success: true,
      message: mode === 'draft'
        ? 'Job requirement saved as draft successfully.'
        : 'Job requirement submitted successfully. Status: Pending Review.',
      jobId: createdJob?.id || '',
      statusLabel: mode === 'draft' ? 'Draft' : 'Pending Review',
      snapshot: finalSnapshot
    })
  } catch (error) {
    console.error('Company job post failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to submit job requirement.' }, { status: 500 })
  }
}
