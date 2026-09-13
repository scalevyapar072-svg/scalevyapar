import { NextRequest, NextResponse } from 'next/server'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  findMatchingMasterOption,
  getVisibleLabourMasterOptions,
  groupLabourMasterOptions
} from '@/lib/labour-masters-schema'
import {
  calculateJobLiveWindow,
  countUsedJobPostsForPlan,
  getJobPostLiveDays,
  getPlanLabourCategoryIds,
  getPlanValidityDays,
  resolveCompanyCurrentJobPostingPlan,
  resolveCompanyJobPostingPlans,
  resolveLatestCompanyPlanPurchase,
  resolveCompanyPlanWindow
} from '@/lib/labour-plan-utils'
import { requireCompanyApp } from '@/lib/labour-company-app'
import { createLabourEntity, getLabourMarketplaceSnapshot, updateLabourEntity, type LabourCompanyRecord } from '@/lib/labour-marketplace'
import { sendNewJobSubmittedForReviewEmail } from '@/lib/rozgar-notification-email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_REGEX = /^\d{10}$/

const normalize = (value: unknown) => String(value || '').trim()
const normalizeEmail = (value: unknown) => normalize(value).toLowerCase()
const normalizeLookup = (value: unknown) => normalize(value).toLowerCase()
type CompanyJobProfileDetails = Pick<
  LabourCompanyRecord,
  | 'companyName'
  | 'contactPerson'
  | 'email'
  | 'mobile'
  | 'contactMobile'
  | 'businessType'
  | 'industryCategory'
  | 'companyAddress'
  | 'state'
  | 'city'
  | 'area'
  | 'pincode'
>
const normalizeCompanyJobProfileDetails = (
  details: Partial<Record<keyof CompanyJobProfileDetails, unknown>>,
): CompanyJobProfileDetails => {
  const mobile = normalize(details.mobile)

  return {
    companyName: normalize(details.companyName),
    contactPerson: normalize(details.contactPerson),
    email: normalizeEmail(details.email),
    mobile,
    contactMobile: normalize(details.contactMobile) || mobile,
    businessType: normalize(details.businessType),
    industryCategory: normalize(details.industryCategory),
    companyAddress: normalize(details.companyAddress),
    state: normalize(details.state),
    city: normalize(details.city),
    area: normalize(details.area),
    pincode: normalize(details.pincode),
  }
}
const hasMeaningfulCompanyProfileChange = (
  current: Partial<Record<keyof CompanyJobProfileDetails, unknown>>,
  submitted: Partial<Record<keyof CompanyJobProfileDetails, unknown>>,
) => {
  const normalizedCurrent = normalizeCompanyJobProfileDetails(current)
  const normalizedSubmitted = normalizeCompanyJobProfileDetails(submitted)

  return (Object.keys(normalizedCurrent) as Array<keyof CompanyJobProfileDetails>)
    .some(field => normalizedCurrent[field] !== normalizedSubmitted[field])
}
const applyCompanyUpdateWhenRequired = async <T,>(
  shouldUpdate: boolean,
  update: () => Promise<T>,
): Promise<T | null> => shouldUpdate ? update() : null
const isPublishedJobStatus = (value: unknown) =>
  ['live', 'published', 'active'].includes(normalizeLookup(value))
const normalizeCompanyJobSubmissionId = (value: unknown) => {
  const normalized = normalize(value)
  return /^company-job-post-\d{13}$/.test(normalized) ? normalized : ''
}
const buildCompanyJobSubmissionId = (companyId: string, submissionId: string) => {
  const safeCompanyId = normalize(companyId).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80)
  const safeSubmissionId = normalizeCompanyJobSubmissionId(submissionId)
  return safeCompanyId && safeSubmissionId ? `job-${safeCompanyId}-${safeSubmissionId}` : ''
}
const isFirstCompanyJobPublication = (mode: 'draft' | 'publish', existingStatus: unknown) =>
  mode === 'publish' && !isPublishedJobStatus(existingStatus)
const buildCompanyJobSubmissionFields = ({
  mode,
  existingJob,
  today,
  liveWindowEndDate
}: {
  mode: 'draft' | 'publish'
  existingJob: {
    status?: unknown
    reviewStatus?: 'under_review' | 'approved' | 'rejected' | null
    reviewReason?: string
    submittedAt?: string
    reviewedAt?: string
    publishedAt?: string
    expiresAt?: string
  } | null
  today: string
  liveWindowEndDate: string
}) => {
  if (mode === 'draft') {
    return {
      status: 'draft' as const,
      reviewStatus: null,
      reviewReason: '',
      submittedAt: '',
      reviewedAt: '',
      publishedAt: '',
      expiresAt: ''
    }
  }

  const alreadyPublished = isPublishedJobStatus(existingJob?.status)
  return {
    status: 'live' as const,
    reviewStatus: alreadyPublished ? existingJob?.reviewStatus ?? null : null,
    reviewReason: alreadyPublished ? existingJob?.reviewReason || '' : '',
    submittedAt: alreadyPublished ? existingJob?.submittedAt || '' : '',
    reviewedAt: alreadyPublished ? existingJob?.reviewedAt || '' : '',
    publishedAt: alreadyPublished && existingJob?.publishedAt ? existingJob.publishedAt : today,
    expiresAt: alreadyPublished && existingJob?.expiresAt ? existingJob.expiresAt : liveWindowEndDate
  }
}
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

    const mode = normalize(body.mode) === 'draft' ? 'draft' : 'publish'
    const editJobId = normalize(body.editJobId)
    const submissionId = normalizeCompanyJobSubmissionId(body.submissionId)

    const uploadedDocuments = Array.isArray(body.uploadedDocuments)
      ? body.uploadedDocuments
          .map((item: unknown) => ({
            label: normalize((item as Record<string, unknown>)?.label),
            fileName: normalize((item as Record<string, unknown>)?.fileName),
            storagePath: normalize((item as Record<string, unknown>)?.storagePath)
          }))
          .filter((item: { label: string; fileName: string; storagePath: string }) => item.fileName || item.storagePath)
      : []

    if (!labourCategoryId) {
      return NextResponse.json({ error: 'Please select Labour Category.' }, { status: 400 })
    }

    if (
      !jobTitle ||
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

    const resolvedCompanyName = companyName || normalize(company.companyName)
    const resolvedContactPerson = contactPerson || normalize(company.contactPerson)
    const resolvedCompanyEmail = companyEmail || normalizeEmail(company.email)
    const resolvedMobile = mobile || normalize(company.mobile)
    const resolvedWhatsAppNumber = whatsAppNumber || normalize(company.contactMobile) || normalize(company.mobile)
    const resolvedIndustryType = industryType || normalize(company.industryCategory)
    const resolvedBusinessType = businessType || normalize(company.businessType)
    const resolvedCompanyAddress = companyAddress || normalize(company.companyAddress)
    const resolvedState = state || normalize(company.state)
    const resolvedCity = city || normalize(company.city)
    const resolvedArea = area || normalize(company.area)
    const resolvedPincode = pincode || normalize(company.pincode)

    if (!resolvedCompanyName || !resolvedContactPerson || !resolvedCompanyEmail || !resolvedMobile || !resolvedWhatsAppNumber || !resolvedIndustryType || !resolvedBusinessType || !resolvedCompanyAddress || !resolvedState || !resolvedCity || !resolvedArea || !resolvedPincode) {
      return NextResponse.json({ error: 'Company profile details are missing. Please update your company profile before publishing this job requirement.' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(resolvedCompanyEmail)) {
      return NextResponse.json({ error: 'Enter a valid company email.' }, { status: 400 })
    }

    if (!MOBILE_REGEX.test(resolvedMobile) || !MOBILE_REGEX.test(resolvedWhatsAppNumber)) {
      return NextResponse.json({ error: 'Mobile and WhatsApp numbers must be exactly 10 digits.' }, { status: 400 })
    }

    if (!/^\d{6}$/.test(resolvedPincode)) {
      return NextResponse.json({ error: 'Pincode must be exactly 6 digits.' }, { status: 400 })
    }

    if (company.status === 'blocked') {
      return NextResponse.json({ error: 'This company account is blocked. Please contact labour support.' }, { status: 400 })
    }

    if (mode === 'publish' && company.status !== 'active') {
      return NextResponse.json({ error: 'Only an active company account can publish job requirements.' }, { status: 400 })
    }

    const idempotentJobId = editJobId ? '' : buildCompanyJobSubmissionId(company.id, submissionId)
    const existingJob = editJobId
      ? snapshot.jobPosts.find(jobPost => jobPost.id === editJobId && jobPost.companyId === company.id) || null
      : idempotentJobId
        ? snapshot.jobPosts.find(jobPost => jobPost.id === idempotentJobId && jobPost.companyId === company.id) || null
        : null

    if (editJobId && !existingJob) {
      return NextResponse.json({ error: 'This company job could not be found for editing.' }, { status: 404 })
    }

    const visibleIndustryCategoryOptions = getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
    if (!findMatchingMasterOption(visibleIndustryCategoryOptions, resolvedIndustryType)) {
      return NextResponse.json({ error: 'Selected industry category is hidden or not available.' }, { status: 400 })
    }

    const visibleBusinessTypeOptions = filterBusinessTypesByIndustryDependency(
      masterOptionsByKey.business_type || [],
      masterOptionsByKey.industry_category || [],
      mastersSnapshot.industryBusinessDependencies || [],
      resolvedIndustryType
    )
    if (!findMatchingMasterOption(visibleBusinessTypeOptions, resolvedBusinessType)) {
      return NextResponse.json({ error: 'Selected business type is hidden or not available for this industry category.' }, { status: 400 })
    }

    const effectiveCategoryId = existingJob ? existingJob.categoryId : labourCategoryId
    const visibleCategories = filterCategoriesByLabourDependency(
      snapshot.categories,
      mastersSnapshot.categoryDependencies || [],
      masterOptionsByKey,
      resolvedBusinessType,
      resolvedIndustryType
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
    const lockedPlan = existingJob?.planId
      ? snapshot.plans.find(plan => plan.id === existingJob.planId && plan.audience === 'company') || null
      : lockedPlanLabel
        ? snapshot.plans.find(plan => plan.audience === 'company' && normalizeLookup(plan.name) === normalizeLookup(lockedPlanLabel)) || null
        : null

    const selectedPlan = existingJob
      ? (lockedPlan || snapshot.plans.find(plan => plan.id === selectedPlanId && plan.audience === 'company' && plan.isActive))
      : snapshot.plans.find(plan => plan.id === selectedPlanId && plan.audience === 'company' && plan.isActive)

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Select a valid connected company plan.' }, { status: 400 })
    }

    const isFirstPublication = isFirstCompanyJobPublication(mode, existingJob?.status)
    if (isFirstPublication && !selectedPlan.isActive) {
      return NextResponse.json({ error: 'The selected company plan is inactive and cannot publish job requirements.' }, { status: 400 })
    }

    if (selectedPlan.industryCategoryValues.length > 0 && !selectedPlan.industryCategoryValues.includes(resolvedIndustryType)) {
      return NextResponse.json({ error: 'This plan is not mapped to the selected industry category.' }, { status: 400 })
    }

    if (selectedPlan.businessTypeValues.length > 0 && !selectedPlan.businessTypeValues.includes(resolvedBusinessType)) {
      return NextResponse.json({ error: 'This plan is not mapped to the selected business type.' }, { status: 400 })
    }

    const allowedPlanCategoryIds = getPlanLabourCategoryIds(selectedPlan)
    if (mode !== 'draft' && allowedPlanCategoryIds.length > 0 && !allowedPlanCategoryIds.includes(effectiveCategoryId)) {
      return NextResponse.json({ error: 'This labour category is not allowed under the selected plan.' }, { status: 400 })
    }

    const usedJobPostsCount = countUsedJobPostsForPlan(
      snapshot.jobPosts.map(jobPost => ({
        id: jobPost.id,
        companyId: jobPost.companyId,
        description: jobPost.description,
        planId: jobPost.planId,
        status: jobPost.status,
        publishedAt: jobPost.publishedAt,
        expiresAt: jobPost.expiresAt,
        createdAt: jobPost.createdAt
      })),
      company.id,
      selectedPlan,
      existingJob?.id || ''
    )

    const latestPaidPlanPurchase = resolveLatestCompanyPlanPurchase(company.id, selectedPlan, snapshot.walletTransactions)
    const currentPostingPlan = resolveCompanyCurrentJobPostingPlan({
      companyId: company.id,
      activePlanId: company.activePlan,
      plans: snapshot.plans,
      walletTransactions: snapshot.walletTransactions,
      jobs: snapshot.jobPosts.map(jobPost => ({
        id: jobPost.id,
        companyId: jobPost.companyId,
        description: jobPost.description,
        planId: jobPost.planId,
        status: jobPost.status,
        publishedAt: jobPost.publishedAt,
        expiresAt: jobPost.expiresAt,
        createdAt: jobPost.createdAt
      }))
    })
    const currentPostingPlans = resolveCompanyJobPostingPlans({
      companyId: company.id,
      activePlanId: company.activePlan,
      plans: snapshot.plans,
      walletTransactions: snapshot.walletTransactions,
      jobs: snapshot.jobPosts.map(jobPost => ({
        id: jobPost.id,
        companyId: jobPost.companyId,
        description: jobPost.description,
        planId: jobPost.planId,
        status: jobPost.status,
        publishedAt: jobPost.publishedAt,
        expiresAt: jobPost.expiresAt,
        createdAt: jobPost.createdAt
      }))
    })
    const selectedPostingPlan = currentPostingPlans.find(plan => plan.planId === selectedPlan.id) || null
    const canUseSelectedPlanFromCurrentSummary =
      Boolean(selectedPostingPlan && selectedPostingPlan.status !== 'inactive') ||
      (
        currentPostingPlan?.planId === selectedPlan.id &&
        currentPostingPlan.status !== 'inactive'
      )
    const planWindow = latestPaidPlanPurchase?.createdAt
      ? resolveCompanyPlanWindow(company.id, selectedPlan, snapshot.walletTransactions)
      : selectedPostingPlan
        ? { startDate: selectedPostingPlan.validFrom, endDate: selectedPostingPlan.validUntil }
        : canUseSelectedPlanFromCurrentSummary && currentPostingPlan
          ? { startDate: currentPostingPlan.validFrom, endDate: currentPostingPlan.validUntil }
        : { startDate: '', endDate: '' }

    if (mode !== 'draft' && !latestPaidPlanPurchase?.createdAt && !canUseSelectedPlanFromCurrentSummary) {
      return NextResponse.json(
        {
          code: 'PLAN_PAYMENT_REQUIRED',
          error: 'Payment has not been completed for this plan. Please complete payment before publishing a job requirement.',
          redirectTo: '/labour/company/checkout'
        },
        { status: 400 }
      )
    }

    if (
      isFirstPublication &&
      (
        usedJobPostsCount >= selectedPlan.jobPostLimit ||
        selectedPostingPlan?.status === 'limit_used' ||
        (canUseSelectedPlanFromCurrentSummary && currentPostingPlan?.status === 'limit_used')
      )
    ) {
      return NextResponse.json(
        {
          code: 'JOB_POST_LIMIT_REACHED',
          error: 'Your selected plan job post limit is over. Please upgrade or buy another plan.',
          redirectTo: '/labour/company/pricing?reason=job-post-limit-reached'
        },
        { status: 400 }
      )
    }

    const today = formatLocalDate(new Date())
    const planValidityDays = getPlanValidityDays(selectedPlan)
    const jobPostLiveDays = getJobPostLiveDays(selectedPlan) > 0 ? getJobPostLiveDays(selectedPlan) : 30
    if (
      isFirstPublication &&
      (
        (planWindow.endDate && new Date(planWindow.endDate).getTime() < new Date(today).getTime()) ||
        selectedPostingPlan?.status === 'expired' ||
        (canUseSelectedPlanFromCurrentSummary && currentPostingPlan?.status === 'expired')
      )
    ) {
      return NextResponse.json(
        {
          code: 'PLAN_EXPIRED',
          error: 'Your plan has expired. Please renew or buy a new plan to publish job requirements.',
          redirectTo: '/labour/company/pricing?reason=plan-expired'
        },
        { status: 400 }
      )
    }
    const liveWindow = calculateJobLiveWindow({
      startDate: existingJob?.publishedAt || today,
      plan: selectedPlan,
      planEndDate: planWindow.endDate
    })
    const submissionFields = buildCompanyJobSubmissionFields({
      mode,
      existingJob,
      today,
      liveWindowEndDate: liveWindow.endDate
    })
    const submittedCompanyDetails = normalizeCompanyJobProfileDetails({
      companyName: resolvedCompanyName,
      contactPerson: resolvedContactPerson,
      email: resolvedCompanyEmail,
      mobile: resolvedMobile,
      contactMobile: resolvedWhatsAppNumber,
      businessType: resolvedBusinessType,
      industryCategory: resolvedIndustryType,
      companyAddress: resolvedCompanyAddress,
      state: resolvedState,
      city: resolvedCity,
      area: resolvedArea,
      pincode: resolvedPincode
    })
    const shouldUpdateCompany = !existingJob || hasMeaningfulCompanyProfileChange(company, submittedCompanyDetails)
    const updatedCompanySnapshot = await applyCompanyUpdateWhenRequired(
      shouldUpdateCompany,
      () => updateLabourEntity(
        'companies',
        company.id,
        {
          ...company,
          ...submittedCompanyDetails
        },
        'company-job-post'
      )
    )

    const refreshedCompany = updatedCompanySnapshot?.companies.find(item => item.id === company.id) || company
    const resolvedJobLocation = jobLocation || city
    const finalDescription = buildJobRequirementDescription(
      jobDescription,
      [
        ['Connected plan', selectedPlan.name],
        ['Connected plan id', selectedPlan.id],
        ['Plan validity', `${planValidityDays} days`],
        ['Job post live period', `${jobPostLiveDays} days`],
        ['Plan job post limit', String(selectedPlan.jobPostLimit)],
        ['Plan valid from', planWindow.startDate],
        ['Plan valid until', planWindow.endDate],
        ['Estimated live start date', existingJob?.publishedAt || today],
        ['Estimated live end date', liveWindow.endDate],
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
        ['Submission mode', mode === 'draft' ? 'Saved as draft' : 'Published live']
      ],
      uploadedDocuments
    )

    if (existingJob) {
      const updatedSnapshot = await updateLabourEntity(
        'jobPosts',
        existingJob.id,
        {
          ...existingJob,
          planId: selectedPlan.id,
          categoryId: effectiveCategoryId,
          title: jobTitle,
          description: finalDescription,
          city: resolvedJobLocation,
          locationLabel: `${resolvedJobLocation}${dutyHours ? ` | ${dutyHours}` : ''}`,
          workersNeeded: workersRequired,
          wageAmount: salaryAmount,
          validityDays: jobPostLiveDays,
          ...submissionFields
        },
        'company-job-post'
      )

      const updatedJob = updatedSnapshot?.jobPosts.find(jobPost => jobPost.id === existingJob.id) || existingJob

      return NextResponse.json({
        success: true,
        message: mode === 'draft'
          ? 'Job requirement saved as draft successfully.'
          : 'Job requirement published successfully.',
        jobId: updatedJob.id,
        statusLabel: mode === 'draft' ? 'Draft' : 'Active'
      })
    }

    const finalSnapshot = await createLabourEntity(
      'jobPosts',
      {
        ...(idempotentJobId ? { id: idempotentJobId } : {}),
        companyId: refreshedCompany.id,
        planId: selectedPlan.id,
        categoryId: effectiveCategoryId,
        title: jobTitle,
        description: finalDescription,
        city: resolvedJobLocation,
        locationLabel: `${resolvedJobLocation}${dutyHours ? ` | ${dutyHours}` : ''}`,
        workersNeeded: workersRequired,
        wageAmount: salaryAmount,
        validityDays: jobPostLiveDays,
        ...submissionFields
      },
      'company-job-post'
    )

    const createdJob = idempotentJobId
      ? finalSnapshot.jobPosts.find(jobPost => jobPost.id === idempotentJobId) || null
      : [...finalSnapshot.jobPosts].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]

    if (createdJob && mode !== 'draft') {
      await sendNewJobSubmittedForReviewEmail({
        jobPostId: createdJob.id,
        companyName: refreshedCompany.companyName || resolvedCompanyName,
        companyId: refreshedCompany.id,
        companyMobile: refreshedCompany.mobile || resolvedMobile,
        jobTitle: createdJob.title,
        industryCategory: resolvedIndustryType,
        businessType: resolvedBusinessType,
        workerCategory: labourCategory?.name || workerCategory,
        workLocation: createdJob.city || resolvedJobLocation,
        salary: createdJob.wageAmount,
        salaryType,
        workersRequired: createdJob.workersNeeded,
        experience: experienceRequired,
        genderPreference,
        shift: shiftType,
        facilities: [
          foodFacility ? `Food: ${foodFacility}` : '',
          accommodation ? `Accommodation: ${accommodation}` : '',
          transportFacility ? `Transport: ${transportFacility}` : '',
          overtimeAvailable ? `Overtime: ${overtimeAvailable}` : ''
        ].filter(Boolean),
        createdAt: createdJob.createdAt
      })
    }

    return NextResponse.json({
      success: true,
      message: mode === 'draft'
        ? 'Job requirement saved as draft successfully.'
        : 'Job requirement published successfully.',
      jobId: createdJob?.id || '',
      statusLabel: mode === 'draft' ? 'Draft' : 'Active'
    })
  } catch (error) {
    console.error('Company job post failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to submit job requirement.' }, { status: 500 })
  }
}
