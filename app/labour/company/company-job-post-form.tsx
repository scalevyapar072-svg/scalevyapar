'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import styles from './company-site.module.css'
import { toRozgarPublicPath } from '@/lib/labour-company-host'
import {
  LabourCategoryDependency,
  LabourIndustryBusinessDependency,
  LabourMasterOption,
  buildLabourMasterSelectOptions,
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  getVisibleLabourMasterOptions
} from '@/lib/labour-masters-schema'
import { calculateJobLiveWindow, countUsedJobPostsForPlan, getJobPostLiveDays, getPlanValidityDays, type CompanyJobPostingPlanSummary } from '@/lib/labour-plan-utils'
import { createPricingPlanSlug } from '@/lib/labour-company-checkout'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'
const resolveRozgarHref = (href: string, initialHostname?: string | null) =>
  toRozgarPublicPath(href, typeof window === 'undefined' ? initialHostname : window.location.hostname)
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const getCheckoutPlanSlug = (planName: string) => {
  const normalized = planName.trim().toLowerCase()
  if (normalized.includes('starter')) return 'starter'
  if (normalized.includes('professional')) return 'professional'
  if (normalized.includes('enterprise')) return 'enterprise'
  if (normalized.includes('bundle')) return 'bundle'
  return createPricingPlanSlug(planName)
}

type CategoryOption = {
  id: string
  name: string
  description: string
}

type PlanOption = {
  id: string
  name: string
  planValidityDays: number
  jobPostLiveDays: number
  validityDays: number
  planAmount: number
  jobPostLimit: number
  industryCategoryValues: string[]
  businessTypeValues: string[]
  labourCategoryIds: string[]
}

type Props = {
  categories: CategoryOption[]
  plans: PlanOption[]
  cityOptions: string[]
  industryCategoryOptions: LabourMasterOption[]
  businessTypeOptions: LabourMasterOption[]
  categoryDependencies: LabourCategoryDependency[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  accentColor?: string
  initialHostname?: string | null
}

type UploadKey = 'companyLogo' | 'workplacePhotos' | 'requirementPdf' | 'supportingDocuments'
type PlanUpgradeReason = 'plan-required' | 'plan-payment-required' | 'plan-expired' | 'job-post-limit-reached'

type PublishModalVariant = 'confirm' | 'upgrade'

type PublishModalState = {
  variant: PublishModalVariant
  title: string
  eyebrow: string
  planName: string
  usageLine?: string
  liveWindowLine?: string
  message: string
  reason?: PlanUpgradeReason
  checkoutHref?: string
  primaryLabel: string
}

type CompanySessionProfile = {
  id: string
  activePlanId?: string
  companyName: string
  contactPerson: string
  email: string
  mobile: string
  contactMobile: string
  businessType: string
  industryCategory: string
  companyAddress: string
  state: string
  city: string
  area: string
  pincode: string
  planValidFrom?: string
  planValidUntil?: string
  categoryLabels: string[]
}

type FormState = {
  companyName: string
  contactPerson: string
  companyEmail: string
  mobile: string
  whatsAppNumber: string
  industryType: string
  businessType: string
  companyAddress: string
  state: string
  city: string
  area: string
  pincode: string
  jobTitle: string
  labourCategoryId: string
  selectedPlanId: string
  workerCategory: string
  workersRequired: string
  genderPreference: string
  ageRequirement: string
  experienceRequired: string
  joiningDate: string
  jobLocation: string
  dutyHours: string
  shiftType: string
  weeklyOff: string
  jobDuration: string
  salaryType: string
  salaryAmount: string
  overtimeAvailable: string
  foodFacility: string
  accommodation: string
  transportFacility: string
  jobDescription: string
  requiredSkills: string
  specialInstructions: string
  languagesPreferred: string
}

type UploadState = {
  file: File | null
  progress: number
  status: 'idle' | 'ready' | 'uploading' | 'uploaded' | 'error'
  error: string
  storagePath: string
  fileName: string
}

type SuccessState = {
  message: string
  statusLabel: string
  jobId: string
}

type CompanyDashboardJob = {
  id: string
  companyId?: string
  planId?: string
  title: string
  description: string
  city: string
  locationLabel: string
  categoryId: string
  status: string
  workersNeeded: number
  wageAmount: number
  publishedAt?: string
  expiresAt?: string
}

type CompanyDashboardResponse = {
  error?: string
  token?: string
  dashboard?: {
    profile?: CompanySessionProfile
    jobs?: CompanyDashboardJob[]
    currentJobPostingPlan?: CompanyJobPostingPlanSummary | null
    currentJobPostingPlans?: CompanyJobPostingPlanSummary[]
  }
}

const WORKER_CATEGORIES = ['Skilled', 'Semi-Skilled', 'Unskilled']
const GENDER_PREFERENCES = ['Male', 'Female', 'Any']
const EXPERIENCE_OPTIONS = ['Fresher', '1+ Years', '2+ Years', '5+ Years', 'Experienced Only']
const SHIFT_TYPES = ['Day Shift', 'Night Shift', 'Rotational Shift']
const JOB_DURATIONS = ['1 Day', '1 Week', '1 Month', 'Contract Basis', 'Permanent']
const SALARY_TYPES = ['Daily Wage', 'Weekly Payment', 'Monthly Salary', 'Contract Payment']
const YES_NO_OPTIONS = ['Yes', 'No']
const FACILITY_OPTIONS = ['Available', 'Not Available']

const JOB_POST_BENEFITS = [
  'Share detailed workforce needs so admins and workers understand the requirement clearly before response.',
  'Submit worker category, salary, shift, joining date, and facilities in one connected ScaleVyapar workflow.',
  'Keep your company data tied to the worker admin panel so approvals, edits, and visibility remain centrally managed.',
  'Use a structured requirement to reach more suitable workers faster across city and category filters.'
]

const JOB_POST_FAST_FLOW = [
  'Sign in with your registered company email and password to unlock the job post workflow instantly.',
  'Choose the correct worker category and describe shift, salary, facilities, and work conditions clearly.',
  'Publish the requirement for admin review so it appears with the correct company and job details in the worker panel.',
  'After review, workers can discover the job faster and the company team can manage status from one panel.'
]

const initialFormState: FormState = {
  companyName: '',
  contactPerson: '',
  companyEmail: '',
  mobile: '',
  whatsAppNumber: '',
  industryType: '',
  businessType: '',
  companyAddress: '',
  state: '',
  city: '',
  area: '',
  pincode: '',
  jobTitle: '',
  labourCategoryId: '',
  selectedPlanId: '',
  workerCategory: '',
  workersRequired: '',
  genderPreference: '',
  ageRequirement: '',
  experienceRequired: '',
  joiningDate: '',
  jobLocation: '',
  dutyHours: '',
  shiftType: '',
  weeklyOff: '',
  jobDuration: '',
  salaryType: '',
  salaryAmount: '',
  overtimeAvailable: '',
  foodFacility: '',
  accommodation: '',
  transportFacility: '',
  jobDescription: '',
  requiredSkills: '',
  specialInstructions: '',
  languagesPreferred: ''
}

const emptyUploadState = (): UploadState => ({
  file: null,
  progress: 0,
  status: 'idle',
  error: '',
  storagePath: '',
  fileName: ''
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const normalizeLookup = (value: string) => value.trim().toLowerCase()

const splitJobPostDescription = (value: string) => {
  const normalized = String(value || '').replace(/\r/g, '')
  const detailMarker = '\n\nJob requirement details\n'
  const docsMarker = '\n\nDocuments\n'
  const detailIndex = normalized.indexOf(detailMarker)

  if (detailIndex === -1) {
    return {
      baseDescription: normalized.trim(),
      detailBlock: ''
    }
  }

  const baseDescription = normalized.slice(0, detailIndex).trim()
  const afterDetails = normalized.slice(detailIndex + detailMarker.length)
  const docsIndex = afterDetails.indexOf(docsMarker)

  return {
    baseDescription,
    detailBlock: (docsIndex === -1 ? afterDetails : afterDetails.slice(0, docsIndex)).trim()
  }
}

const parseJobRequirementDetailMap = (description: string) => {
  const { baseDescription, detailBlock } = splitJobPostDescription(description)
  const detailMap = new Map<string, string>()

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

  return {
    baseDescription,
    detailMap
  }
}

export function CompanyJobPostForm({
  categories,
  plans,
  cityOptions,
  industryCategoryOptions,
  businessTypeOptions,
  categoryDependencies,
  industryBusinessDependencies,
  accentColor = '#2563eb',
  initialHostname = null
}: Props) {
  const resolveHref = (href: string) => resolveRozgarHref(href, initialHostname)
  const searchParams = useSearchParams()
  const editJobId = searchParams.get('edit') || ''
  const duplicateJobId = searchParams.get('duplicate') || ''
  const prefillJobId = editJobId || duplicateJobId
  const isEditMode = Boolean(editJobId)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | UploadKey | 'form', string>>>({})
  const [submissionId, setSubmissionId] = useState(() => `company-job-post-${Date.now()}`)
  const [companyToken, setCompanyToken] = useState('')
  const [companyProfileId, setCompanyProfileId] = useState('')
  const [companyActivePlanId, setCompanyActivePlanId] = useState('')
  const [companyPlanValidFrom, setCompanyPlanValidFrom] = useState('')
  const [companyPlanValidUntil, setCompanyPlanValidUntil] = useState('')
  const [autofillState, setAutofillState] = useState<'idle' | 'loading' | 'ready' | 'not-found'>('loading')
  const [submitMode, setSubmitMode] = useState<'publish' | 'draft' | 'checkout'>('publish')
  const [submitting, setSubmitting] = useState(false)
  const submitInFlightRef = useRef(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [prefillState, setPrefillState] = useState<'idle' | 'loading' | 'ready' | 'missing'>('idle')
  const [prefilledJobId, setPrefilledJobId] = useState('')
  const [publishModal, setPublishModal] = useState<PublishModalState | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [companyJobs, setCompanyJobs] = useState<CompanyDashboardJob[]>([])
  const [currentJobPostingPlan, setCurrentJobPostingPlan] = useState<CompanyJobPostingPlanSummary | null>(null)
  const [currentJobPostingPlans, setCurrentJobPostingPlans] = useState<CompanyJobPostingPlanSummary[]>([])
  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    companyLogo: emptyUploadState(),
    workplacePhotos: emptyUploadState(),
    requirementPdf: emptyUploadState(),
    supportingDocuments: emptyUploadState()
  })
  const companyFieldsLocked = autofillState === 'ready'
  const isAccessLocked = autofillState === 'loading' || autofillState === 'not-found'
  const jobLockedFields = isEditMode

  const availableCities = useMemo(() => {
    return cityOptions.reduce<string[]>((list, city) => {
      const normalized = city.trim()
      if (!normalized) return list
      if (list.some(item => item.toLowerCase() === normalized.toLowerCase())) return list
      return [...list, normalized]
    }, [])
  }, [cityOptions])

  const visibleIndustryCategoryOptions = useMemo(
    () => buildLabourMasterSelectOptions(getVisibleLabourMasterOptions(industryCategoryOptions)),
    [industryCategoryOptions]
  )

  const visibleBusinessTypeOptions = useMemo(
    () =>
      buildLabourMasterSelectOptions(
        filterBusinessTypesByIndustryDependency(
          businessTypeOptions,
          industryCategoryOptions,
          industryBusinessDependencies,
          form.industryType
        )
      ),
    [businessTypeOptions, form.industryType, industryBusinessDependencies, industryCategoryOptions]
  )

  const visibleLabourCategories = useMemo(
    () =>
      filterCategoriesByLabourDependency(
        categories,
        categoryDependencies,
        {
          city: [],
          business_type: businessTypeOptions,
          industry_category: industryCategoryOptions,
          state: [],
          worker_experience_years: [],
          worker_status_availability: [],
          worker_salary_type: [],
          company_status: [],
          job_gender_preference: [],
          job_experience_required: [],
          job_shift_type: [],
          job_weekly_off: [],
          job_duration: [],
          job_salary_type: [],
          job_overtime_available: [],
          job_food_facility: [],
          job_accommodation: [],
          job_transport_facility: []
        },
        form.businessType,
        form.industryType
      ),
    [businessTypeOptions, categories, categoryDependencies, form.businessType, form.industryType, industryCategoryOptions]
  )
  const selectedPlan = useMemo(
    () => plans.find(plan => plan.id === form.selectedPlanId) || null,
    [form.selectedPlanId, plans]
  )
  const activeJobPostingPlanSummaries = useMemo(
    () => currentJobPostingPlans.filter(plan => plan.status === 'active'),
    [currentJobPostingPlans]
  )
  const connectedJobPostingPlans = useMemo(
    () =>
      activeJobPostingPlanSummaries
        .map(summary => plans.find(plan => plan.id === summary.planId) || null)
        .filter((plan): plan is PlanOption => Boolean(plan)),
    [activeJobPostingPlanSummaries, plans]
  )
  const hasActiveConnectedPlans = connectedJobPostingPlans.length > 0
  const selectableJobPostingPlans = hasActiveConnectedPlans ? connectedJobPostingPlans : plans
  const selectedCurrentPlan = selectedPlan
    ? currentJobPostingPlans.find(plan => plan.planId === selectedPlan.id) || null
    : null
  const selectedPlanUsedPosts = useMemo(() => {
    if (!selectedPlan || !companyProfileId) return 0
    return countUsedJobPostsForPlan(companyJobs.map(job => ({
      id: job.id,
      companyId: job.companyId || companyProfileId,
      description: job.description,
      planId: job.planId
    })), companyProfileId, selectedPlan, editJobId)
  }, [companyJobs, companyProfileId, editJobId, selectedPlan])
  const selectedPlanRemainingPosts = selectedCurrentPlan
    ? selectedCurrentPlan.remainingJobPosts
    : selectedPlan
      ? Math.max(0, Number(selectedPlan.jobPostLimit || 0) - selectedPlanUsedPosts)
      : 0
  const selectedPlanValidUntil = selectedCurrentPlan?.validUntil
    || (selectedPlan && companyActivePlanId && selectedPlan.id === companyActivePlanId ? companyPlanValidUntil : '')
  const selectedPlanValidFrom = selectedCurrentPlan?.validFrom
    || (selectedPlan && companyActivePlanId && selectedPlan.id === companyActivePlanId ? companyPlanValidFrom : '')
  const selectedPlanLiveStartDate = useMemo(
    () => formatLocalDate(new Date()),
    []
  )
  const selectedPlanLiveEndDate = useMemo(() => {
    if (!selectedPlan) return ''
    return calculateJobLiveWindow({
      startDate: selectedPlanLiveStartDate,
      plan: selectedPlan,
      planEndDate: selectedPlanValidUntil
    }).endDate
  }, [selectedPlan, selectedPlanLiveStartDate, selectedPlanValidUntil])
  const selectedPlanCompatibilityError = useMemo(() => {
    if (!selectedPlan) return ''
    if (selectedPlan.industryCategoryValues.length > 0 && form.industryType && !selectedPlan.industryCategoryValues.includes(form.industryType)) {
      return 'This plan is not available for the selected industry category.'
    }
    if (selectedPlan.businessTypeValues.length > 0 && form.businessType && !selectedPlan.businessTypeValues.includes(form.businessType)) {
      return 'This plan is not available for the selected business type.'
    }
    if (selectedPlan.labourCategoryIds.length > 0 && form.labourCategoryId && !selectedPlan.labourCategoryIds.includes(form.labourCategoryId)) {
      return 'This labour category is not allowed under the selected plan.'
    }
    return ''
  }, [form.businessType, form.industryType, form.labourCategoryId, selectedPlan])

  const selectedPlanUsageLine = selectedPlan
    ? `Job post limit: ${Number(selectedCurrentPlan?.totalJobPosts ?? selectedPlan.jobPostLimit ?? 0)} | Used posts: ${Number(selectedCurrentPlan?.usedJobPosts ?? selectedPlanUsedPosts ?? 0)} | Remaining posts: ${Math.max(0, Number(selectedPlanRemainingPosts || 0))}`
    : ''
  const selectedPlanStatus = selectedCurrentPlan?.status
    || (
      selectedPlan
        ? companyActivePlanId && selectedPlan.id === companyActivePlanId && selectedPlanValidUntil
          ? 'active'
          : 'inactive'
        : null
    )

  const selectedPlanUpgradeWarning = useMemo<PublishModalState | null>(() => {
    if (!selectedPlan || isEditMode) return null
    if (!selectedCurrentPlan || selectedPlanStatus === 'inactive') {
      return {
        variant: 'upgrade',
        title: 'Plan Payment Required',
        eyebrow: 'Plan Payment Required',
        reason: 'plan-payment-required',
        planName: selectedPlan.name,
        usageLine: selectedPlanUsageLine || 'Job post limit: 0 | Remaining posts: 0',
        message: 'Payment has not been completed for this plan. Please complete payment before publishing a job requirement.',
        checkoutHref: resolveHref(`/labour/company/checkout?plan=${encodeURIComponent(getCheckoutPlanSlug(selectedPlan.name))}&billing=monthly`),
        primaryLabel: 'Pay Now'
      }
    }
    if (selectedPlanStatus === 'limit_used' || selectedPlanRemainingPosts <= 0) {
      return {
        variant: 'upgrade',
        title: 'Plan Upgrade Required',
        eyebrow: 'Plan Upgrade Required',
        reason: 'job-post-limit-reached',
        planName: selectedPlan.name,
        usageLine: selectedPlanUsageLine,
        message: `${selectedPlanUsageLine}. Please upgrade or buy another plan to post more jobs.`,
        checkoutHref: resolveHref(`/labour/company/checkout?plan=${encodeURIComponent(getCheckoutPlanSlug(selectedPlan.name))}&billing=monthly`),
        primaryLabel: 'Upgrade Your Plan'
      }
    }
    if (selectedPlanStatus === 'expired' || (selectedPlanValidUntil && new Date(selectedPlanValidUntil).getTime() < new Date(selectedPlanLiveStartDate).getTime())) {
      return {
        variant: 'upgrade',
        title: 'Plan Upgrade Required',
        eyebrow: 'Plan Upgrade Required',
        reason: 'plan-expired',
        planName: selectedPlan.name,
        usageLine: selectedPlanUsageLine,
        message: 'Your plan has expired. Please renew or buy a new plan to publish job requirements.',
        checkoutHref: resolveHref(`/labour/company/checkout?plan=${encodeURIComponent(getCheckoutPlanSlug(selectedPlan.name))}&billing=monthly`),
        primaryLabel: 'Upgrade Your Plan'
      }
    }
    return null
  }, [isEditMode, selectedCurrentPlan, selectedPlan, selectedPlanLiveStartDate, selectedPlanRemainingPosts, selectedPlanStatus, selectedPlanUsageLine, selectedPlanValidUntil])

  const openPlanUpgradeModal = (reason: PlanUpgradeReason, message: string) => {
    const planName = selectedPlan?.name || 'Selected plan'
    const checkoutHref = selectedPlan
      ? resolveHref(`/labour/company/checkout?plan=${encodeURIComponent(getCheckoutPlanSlug(selectedPlan.name))}&billing=monthly`)
      : resolveHref('/labour/company/pricing')
    const selectedPlanUsageMessage = selectedPlanUsageLine
      ? `${selectedPlanUsageLine}. Please upgrade or buy another plan to post more jobs.`
      : ''
    const modalTitle =
      reason === 'plan-payment-required'
        ? 'Plan Payment Required'
        : reason === 'plan-expired'
          ? 'Plan Expired'
          : 'Plan Upgrade Required'
    const primaryLabel =
      reason === 'plan-payment-required'
        ? 'Pay Now'
        : reason === 'plan-expired'
          ? 'Renew Plan'
          : 'Upgrade Your Plan'

    setPublishModal({
      variant: 'upgrade',
      title: modalTitle,
      eyebrow: modalTitle,
      reason,
      planName,
      usageLine: selectedPlanUsageLine,
      message:
        ((reason === 'job-post-limit-reached' || reason === 'plan-required') && selectedPlanUsageMessage)
          ? selectedPlanUsageMessage
          : reason === 'plan-payment-required'
            ? 'Payment has not been completed for this plan. Please complete payment before publishing a job requirement.'
          : message,
      checkoutHref,
      primaryLabel
    })
    setErrors(current => ({ ...current, selectedPlanId: '', form: '' }))
  }

  const openPublishConfirmModal = () => {
    if (!selectedPlan) return

    setPublishModal({
      variant: 'confirm',
      title: 'Confirm Job Publish',
      eyebrow: 'Confirm Job Publish',
      planName: selectedPlan.name,
      usageLine: selectedPlanUsageLine,
      liveWindowLine: `This job will be live from: ${selectedPlanLiveStartDate} | It will expire on: ${selectedPlanLiveEndDate || 'Will be calculated after posting'}`,
      message: 'Are you sure you want to publish this job requirement?',
      primaryLabel: 'Publish Now'
    })
    setErrors(current => ({ ...current, form: '' }))
  }

  const closePublishModal = () => setPublishModal(null)

  const goToPlanUpgrade = () => {
    if (!publishModal?.checkoutHref || typeof window === 'undefined') return
    window.location.assign(publishModal.checkoutHref)
  }

  useEffect(() => {
    let cancelled = false

    const applyCompanyProfile = (profile: CompanySessionProfile, token: string) => {
      if (cancelled) return

      setCompanyToken(token)
      setCompanyProfileId(profile.id || '')
      setCompanyActivePlanId(profile.activePlanId || '')
      setCompanyPlanValidFrom(profile.planValidFrom || '')
      setCompanyPlanValidUntil(profile.planValidUntil || '')
      setAutofillState('ready')
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile))
      }

      const matchedCategory = profile.categoryLabels
        .map(label => categories.find(category => category.name.toLowerCase() === label.toLowerCase())?.id || '')
        .find(Boolean)

      setForm(current => ({
        ...current,
        companyName: current.companyName || profile.companyName || '',
        contactPerson: current.contactPerson || profile.contactPerson || '',
        companyEmail: current.companyEmail || profile.email || '',
        mobile: current.mobile || profile.mobile || '',
        whatsAppNumber: current.whatsAppNumber || profile.contactMobile || profile.mobile || '',
        industryType: current.industryType || profile.industryCategory || '',
        businessType: current.businessType || profile.businessType || '',
        companyAddress: current.companyAddress || profile.companyAddress || '',
        state: current.state || profile.state || '',
        city: current.city || profile.city || '',
        area: current.area || profile.area || '',
        pincode: current.pincode || profile.pincode || '',
        labourCategoryId: current.labourCategoryId || matchedCategory || '',
        jobLocation: current.jobLocation || profile.city || ''
      }))
    }

    const loadCompanySession = async () => {
      setAutofillState('loading')

      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_TOKEN_KEY) : null
        const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_PROFILE_KEY) : null

        if (cachedProfile && storedToken) {
          try {
            const parsedProfile = JSON.parse(cachedProfile) as CompanySessionProfile
            if (parsedProfile?.companyName) {
              applyCompanyProfile(parsedProfile, storedToken)
            }
          } catch {
            localStorage.removeItem(COMPANY_PROFILE_KEY)
          }
        }

        if (storedToken) {
          const dashboardResponse = await fetch('/api/labour/company/dashboard', {
            headers: {
              Authorization: `Bearer ${storedToken}`
            },
            cache: 'no-store'
          })

          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json() as CompanyDashboardResponse
            const profile = dashboardData?.dashboard?.profile as CompanySessionProfile | undefined
            const jobs = Array.isArray(dashboardData?.dashboard?.jobs) ? dashboardData.dashboard.jobs as CompanyDashboardJob[] : []
            const resolvedCurrentPlan = dashboardData?.dashboard?.currentJobPostingPlan || null
            const resolvedCurrentPlans = Array.isArray(dashboardData?.dashboard?.currentJobPostingPlans)
              ? dashboardData.dashboard.currentJobPostingPlans
              : resolvedCurrentPlan
                ? [resolvedCurrentPlan]
                : []
            if (profile) {
              setCompanyJobs(jobs)
              setCurrentJobPostingPlan(resolvedCurrentPlan)
              setCurrentJobPostingPlans(resolvedCurrentPlans)
              applyCompanyProfile(profile, storedToken)
              return
            }
          } else if (typeof window !== 'undefined') {
            localStorage.removeItem(COMPANY_TOKEN_KEY)
            localStorage.removeItem(COMPANY_PROFILE_KEY)
          }
        }

        const response = await fetch('/api/labour/company/auth/dashboard-session', { cache: 'no-store' })
        if (!response.ok) {
          if (!cancelled) {
            setAutofillState('not-found')
          }
          return
        }

        const data = await response.json() as CompanyDashboardResponse & { token?: string }
        const profile = data?.dashboard?.profile as CompanySessionProfile | undefined
        const jobs = Array.isArray(data?.dashboard?.jobs) ? data.dashboard.jobs as CompanyDashboardJob[] : []
        const resolvedCurrentPlan = data?.dashboard?.currentJobPostingPlan || null
        const resolvedCurrentPlans = Array.isArray(data?.dashboard?.currentJobPostingPlans)
          ? data.dashboard.currentJobPostingPlans
          : resolvedCurrentPlan
            ? [resolvedCurrentPlan]
            : []
        const token = String(data?.token || '')
        if (!profile || !token) {
          if (!cancelled) {
            setAutofillState('not-found')
          }
          return
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(COMPANY_TOKEN_KEY, token)
        }

        setCompanyJobs(jobs)
        setCurrentJobPostingPlan(resolvedCurrentPlan)
        setCurrentJobPostingPlans(resolvedCurrentPlans)
        applyCompanyProfile(profile, token)
      } catch {
        if (!cancelled) {
          setAutofillState('not-found')
        }
      }
    }

    void loadCompanySession()

    return () => {
      cancelled = true
    }
  }, [categories])

  useEffect(() => {
    if (!successState || !companyToken) return

    const timeoutId = window.setTimeout(() => {
      window.location.href = resolveHref('/labour/company/panel')
    }, 2200)

    return () => window.clearTimeout(timeoutId)
  }, [successState, companyToken])

  useEffect(() => {
    if (typeof document === 'undefined' || !isAccessLocked) return

    const { body } = document
    const previousOverflow = body.style.overflow

    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [isAccessLocked])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!publishModal || typeof document === 'undefined') return

    const { body } = document
    const previousOverflow = body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPublishModal(null)
      }
    }

    body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [publishModal])

  useEffect(() => {
    if (!prefillJobId || !companyToken) {
      if (!prefillJobId) {
        setPrefillState('idle')
        setPrefilledJobId('')
      }
      return
    }

    if (prefilledJobId === prefillJobId) {
      return
    }

    let cancelled = false

    const loadExistingJob = async () => {
      setPrefillState('loading')

      try {
        const response = await fetch('/api/labour/company/dashboard', {
          headers: {
            Authorization: `Bearer ${companyToken}`
          },
          cache: 'no-store'
        })

        const data = await response.json().catch(() => ({} as CompanyDashboardResponse))
        if (!response.ok) {
          throw new Error(String(data?.error || 'Failed to load company jobs for editing.'))
        }

        const jobs = Array.isArray(data?.dashboard?.jobs) ? data.dashboard.jobs as CompanyDashboardJob[] : []
        const resolvedCurrentPlan = data?.dashboard?.currentJobPostingPlan || null
        const resolvedCurrentPlans = Array.isArray(data?.dashboard?.currentJobPostingPlans)
          ? data.dashboard.currentJobPostingPlans
          : resolvedCurrentPlan
            ? [resolvedCurrentPlan]
            : []
        setCompanyJobs(jobs)
        setCurrentJobPostingPlan(resolvedCurrentPlan)
        setCurrentJobPostingPlans(resolvedCurrentPlans)
        const currentJob = jobs.find(job => job.id === prefillJobId)

        if (!currentJob) {
          throw new Error('The selected company job could not be found.')
        }

        const { baseDescription, detailMap } = parseJobRequirementDetailMap(currentJob.description)
        const connectedPlanLabel = detailMap.get('connected plan') || ''
        const matchedPlanId = plans.find(plan => normalizeLookup(plan.name) === normalizeLookup(connectedPlanLabel))?.id || ''

        if (cancelled) return

        setForm(current => ({
          ...current,
          jobTitle: currentJob.title || '',
          labourCategoryId: currentJob.categoryId || '',
          selectedPlanId: matchedPlanId || current.selectedPlanId,
          workerCategory: detailMap.get('worker category') || '',
          workersRequired: currentJob.workersNeeded > 0 ? String(currentJob.workersNeeded) : '',
          genderPreference: detailMap.get('gender preference') || '',
          ageRequirement: detailMap.get('age requirement') || '',
          experienceRequired: detailMap.get('experience required') || '',
          joiningDate: detailMap.get('joining date') || '',
          jobLocation: detailMap.get('job location') || currentJob.city || '',
          dutyHours: detailMap.get('duty hours') || '',
          shiftType: detailMap.get('shift type') || '',
          weeklyOff: detailMap.get('weekly off') || '',
          jobDuration: detailMap.get('job duration') || '',
          salaryType: detailMap.get('salary type') || '',
          salaryAmount: detailMap.get('salary amount') || (currentJob.wageAmount > 0 ? String(currentJob.wageAmount) : ''),
          overtimeAvailable: detailMap.get('overtime available') || '',
          foodFacility: detailMap.get('food facility') || '',
          accommodation: detailMap.get('accommodation') || '',
          transportFacility: detailMap.get('transport facility') || '',
          jobDescription: baseDescription,
          requiredSkills: detailMap.get('required skills') || '',
          specialInstructions: detailMap.get('special instructions') || '',
          languagesPreferred: detailMap.get('languages preferred') || ''
        }))
        setPrefillState('ready')
        setPrefilledJobId(prefillJobId)
        setErrors(current => ({ ...current, form: '' }))
      } catch (error) {
        if (cancelled) return
        setPrefillState('missing')
        setErrors(current => ({
          ...current,
          form: error instanceof Error ? error.message : 'Failed to open this company job.'
        }))
      }
    }

    void loadExistingJob()

    return () => {
      cancelled = true
    }
  }, [companyToken, prefillJobId, prefilledJobId, plans])

  useEffect(() => {
    if (isEditMode) return
    if (!hasActiveConnectedPlans) return

    const resolvedPlanId = activeJobPostingPlanSummaries[0]?.planId || currentJobPostingPlan?.planId || ''
    if (resolvedPlanId === form.selectedPlanId) return

    setForm(current => ({
      ...current,
      selectedPlanId: resolvedPlanId
    }))
    setErrors(current => ({ ...current, selectedPlanId: '', form: '' }))
  }, [activeJobPostingPlanSummaries, currentJobPostingPlan?.planId, form.selectedPlanId, hasActiveConnectedPlans, isEditMode])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: '', form: '' }))
  }

  useEffect(() => {
    if (!form.industryType) return
    if (visibleIndustryCategoryOptions.some(option => option.value === form.industryType)) return

    setForm(current => ({
      ...current,
      industryType: '',
      businessType: '',
      labourCategoryId: ''
    }))
    if (companyFieldsLocked) {
      setAutofillState('idle')
    }
    setErrors(current => ({ ...current, industryType: '', businessType: '', labourCategoryId: '', form: '' }))
  }, [companyFieldsLocked, form.industryType, visibleIndustryCategoryOptions])

  useEffect(() => {
    if (!form.industryType) {
      if (!form.businessType && !form.labourCategoryId) return
      setForm(current => ({
        ...current,
        businessType: '',
        labourCategoryId: ''
      }))
      setErrors(current => ({ ...current, businessType: '', labourCategoryId: '', form: '' }))
      return
    }

    if (!form.businessType) return
    if (visibleBusinessTypeOptions.some(option => option.value === form.businessType)) return

    setForm(current => ({
      ...current,
      businessType: '',
      labourCategoryId: ''
    }))
    if (companyFieldsLocked) {
      setAutofillState('idle')
    }
    setErrors(current => ({ ...current, businessType: '', labourCategoryId: '', form: '' }))
  }, [companyFieldsLocked, form.businessType, form.industryType, form.labourCategoryId, visibleBusinessTypeOptions])

  useEffect(() => {
    if (!form.businessType) {
      if (!form.labourCategoryId) return
      setForm(current => ({ ...current, labourCategoryId: '' }))
      setErrors(current => ({ ...current, labourCategoryId: '', form: '' }))
      return
    }

    if (!form.labourCategoryId) return
    if (visibleLabourCategories.some(category => category.id === form.labourCategoryId)) return

    setForm(current => ({ ...current, labourCategoryId: '' }))
    setErrors(current => ({ ...current, labourCategoryId: '', form: '' }))
  }, [form.businessType, form.labourCategoryId, visibleLabourCategories])

  const setUploadState = (key: UploadKey, next: Partial<UploadState>) => {
    setUploads(current => ({
      ...current,
      [key]: {
        ...current[key],
        ...next
      }
    }))
    setErrors(current => ({ ...current, [key]: '', form: '' }))
  }

  const getMissingCompanyProfileFields = () => {
    const missing: string[] = []

    if (!form.companyName.trim()) missing.push('company name')
    if (!form.contactPerson.trim()) missing.push('contact person')
    if (!EMAIL_REGEX.test(form.companyEmail.trim())) missing.push('company email')
    if (!/^\d{10}$/.test(form.mobile.trim())) missing.push('mobile number')
    if (!/^\d{10}$/.test(form.whatsAppNumber.trim())) missing.push('WhatsApp number')
    if (!form.industryType) missing.push('industry type')
    if (!form.businessType) missing.push('business type')
    if (!form.companyAddress.trim()) missing.push('company address')
    if (!form.state.trim()) missing.push('state')
    if (!form.city.trim()) missing.push('city')
    if (!form.area.trim()) missing.push('area')
    if (!/^\d{6}$/.test(form.pincode.trim())) missing.push('pincode')

    return missing
  }

  const validate = (mode: 'publish' | 'draft' | 'checkout') => {
    const nextErrors: Partial<Record<keyof FormState | UploadKey | 'form', string>> = {}

    if (!form.jobTitle.trim()) nextErrors.jobTitle = 'Job title is required.'
    if (!form.labourCategoryId) nextErrors.labourCategoryId = 'Please select Labour Category.'
    if (!form.selectedPlanId) nextErrors.selectedPlanId = hasActiveConnectedPlans ? 'Select a connected plan.' : 'Select a job posting plan.'
    if (!form.workersRequired.trim()) nextErrors.workersRequired = 'Number of workers required is mandatory.'
    else if (Number(form.workersRequired) <= 0) nextErrors.workersRequired = 'Enter a valid number of workers.'

    if (!form.salaryType) nextErrors.salaryType = 'Select a salary type.'
    if (!form.salaryAmount.trim()) nextErrors.salaryAmount = 'Salary amount is required.'
    else if (Number(form.salaryAmount) <= 0) nextErrors.salaryAmount = 'Enter a valid salary amount.'

    if (!form.jobDescription.trim()) nextErrors.jobDescription = 'Job description is required.'
    if (selectedPlanCompatibilityError) nextErrors.selectedPlanId = selectedPlanCompatibilityError

    const missingCompanyProfileFields = getMissingCompanyProfileFields()
    if (mode !== 'draft' && missingCompanyProfileFields.length > 0) {
      nextErrors.form = `Company profile details are missing. Please update your company profile: ${missingCompanyProfileFields.join(', ')}.`
    }

    setErrors(nextErrors)
    return nextErrors
  }

  const isValid = useMemo(() => {
    return (
      form.jobTitle.trim() &&
      form.labourCategoryId &&
      form.selectedPlanId &&
      !selectedPlanCompatibilityError &&
      Number(form.workersRequired) > 0 &&
      form.salaryType &&
      Number(form.salaryAmount) > 0 &&
      form.jobDescription.trim()
    )
  }, [form, selectedPlanCompatibilityError])

  const handleFileChange = (key: UploadKey, file: File | null) => {
    if (!file) {
      setUploadState(key, emptyUploadState())
      return
    }

    setUploadState(key, {
      file,
      fileName: file.name,
      progress: 10,
      status: 'ready',
      error: '',
      storagePath: ''
    })
  }

  const uploadDocumentIfPresent = async (key: UploadKey, documentKind: string) => {
    const current = uploads[key]
    if (!current.file) {
      return null
    }

    setUploadState(key, { status: 'uploading', progress: 16, error: '' })
    const formData = new FormData()
    formData.append('submissionId', submissionId)
    formData.append('documentKind', documentKind)
    formData.append('file', current.file)

    const progressSteps = [34, 58, 82]
    let stepIndex = 0
    const timer = window.setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setUploadState(key, { progress: progressSteps[stepIndex] })
        stepIndex += 1
      }
    }, 160)

    try {
      const response = await fetch('/api/labour/company/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected upload response.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file.')
      }

      setUploadState(key, {
        progress: 100,
        status: 'uploaded',
        storagePath: String(data.storagePath || ''),
        fileName: String(data.fileName || current.file.name)
      })

      return {
        label:
          key === 'companyLogo' ? 'Company Logo' :
          key === 'workplacePhotos' ? 'Workplace Photos' :
          key === 'requirementPdf' ? 'Requirement PDF' :
          'Supporting Documents',
        fileName: String(data.fileName || current.file.name),
        storagePath: String(data.storagePath || '')
      }
    } catch (error) {
      setUploadState(key, {
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload file.'
      })
      throw error
    } finally {
      window.clearInterval(timer)
    }
  }

  const executeSubmit = async (mode: 'publish' | 'draft', options?: { redirectingToCheckout?: boolean }) => {
    if (isAccessLocked) {
      setErrors(current => ({
        ...current,
        form: 'Register & login to post a job. Please sign in with your company account first.'
      }))
      return false
    }

    if (submitInFlightRef.current) {
      return false
    }

    submitInFlightRef.current = true
    setSubmitMode(options?.redirectingToCheckout ? 'checkout' : mode)
    setSuccessState(null)

    setSubmitting(true)

    try {
      const response = await fetch('/api/labour/company/job-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(companyToken ? { Authorization: `Bearer ${companyToken}` } : {})
        },
        body: JSON.stringify({
          mode,
          editJobId,
          companyName: form.companyName.trim(),
          contactPerson: form.contactPerson.trim(),
          companyEmail: form.companyEmail.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          whatsAppNumber: form.whatsAppNumber.trim(),
          industryType: form.industryType,
          businessType: form.businessType,
          companyAddress: form.companyAddress.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
          pincode: form.pincode.trim(),
          jobTitle: form.jobTitle.trim(),
          labourCategoryId: form.labourCategoryId,
          selectedPlanId: form.selectedPlanId,
          workerCategory: form.workerCategory,
          workersRequired: Number(form.workersRequired),
          genderPreference: form.genderPreference,
          ageRequirement: form.ageRequirement.trim(),
          experienceRequired: form.experienceRequired,
          jobLocation: form.jobLocation.trim(),
          dutyHours: form.dutyHours.trim(),
          shiftType: form.shiftType,
          weeklyOff: form.weeklyOff.trim(),
          jobDuration: form.jobDuration,
          salaryType: form.salaryType,
          salaryAmount: Number(form.salaryAmount),
          overtimeAvailable: form.overtimeAvailable,
          foodFacility: form.foodFacility,
          accommodation: form.accommodation,
          transportFacility: form.transportFacility,
          jobDescription: form.jobDescription.trim(),
          requiredSkills: form.requiredSkills.trim(),
          specialInstructions: form.specialInstructions.trim(),
          languagesPreferred: form.languagesPreferred.trim(),
          uploadedDocuments: []
        })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from job posting.' }))
      if (!response.ok) {
        if (
          mode === 'publish' &&
          typeof data.code === 'string' &&
          ['PLAN_REQUIRED', 'PLAN_PAYMENT_REQUIRED', 'PLAN_EXPIRED', 'JOB_POST_LIMIT_REACHED'].includes(data.code)
        ) {
          const reason =
            data.code === 'PLAN_PAYMENT_REQUIRED'
              ? 'plan-payment-required'
              : data.code === 'PLAN_EXPIRED'
              ? 'plan-expired'
              : data.code === 'JOB_POST_LIMIT_REACHED'
                ? 'job-post-limit-reached'
                : 'plan-required'
          openPlanUpgradeModal(reason as PlanUpgradeReason, data.error || 'Please buy a plan to publish job requirements.')
          return false
        }
        throw new Error(data.error || 'Failed to submit job requirement.')
      }

      setSuccessState({
        message: String(data.message || 'Job requirement submitted successfully.'),
        statusLabel: String(data.statusLabel || (mode === 'draft' ? 'Draft' : 'Pending Review')),
        jobId: String(data.jobId || '')
      })

      setErrors({})
      if (!options?.redirectingToCheckout) {
        setUploads({
          companyLogo: emptyUploadState(),
          workplacePhotos: emptyUploadState(),
          requirementPdf: emptyUploadState(),
          supportingDocuments: emptyUploadState()
        })
        setSubmissionId(`company-job-post-${Date.now()}`)
        setForm(current => ({
          ...initialFormState,
          companyName: current.companyName,
          contactPerson: current.contactPerson,
          companyEmail: current.companyEmail,
          mobile: current.mobile,
          whatsAppNumber: current.whatsAppNumber,
          industryType: current.industryType,
          businessType: current.businessType,
          companyAddress: current.companyAddress,
          state: current.state,
          city: current.city,
          area: current.area,
          pincode: current.pincode,
          jobLocation: current.jobLocation
        }))
      }
      return true
    } catch (error) {
      setErrors(current => ({
        ...current,
        form: error instanceof Error ? error.message : 'Failed to submit job requirement.'
      }))
      return false
    } finally {
      setSubmitting(false)
      submitInFlightRef.current = false
    }
  }

  const submitForm = async (mode: 'publish' | 'draft' | 'checkout') => {
    if (submitInFlightRef.current || submitting) {
      return
    }

    if (isAccessLocked) {
      setErrors(current => ({
        ...current,
        form: 'Register & login to post a job. Please sign in with your company account first.'
      }))
      return
    }

    setSubmitMode(mode)
    setSuccessState(null)

    const nextErrors = validate(mode)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (mode === 'draft') {
      await executeSubmit('draft')
      return
    }

    if (mode === 'checkout') {
      if (!selectedPlan) {
        setErrors(current => ({ ...current, selectedPlanId: 'Select a job posting plan before checkout.' }))
        return
      }

      const saved = await executeSubmit('draft', { redirectingToCheckout: true })
      if (!saved || typeof window === 'undefined') return

      submitInFlightRef.current = true
      setSubmitting(true)
      setSubmitMode('checkout')
      window.location.assign(resolveHref(`/labour/company/checkout?plan=${encodeURIComponent(getCheckoutPlanSlug(selectedPlan.name))}&billing=monthly`))
      return
    }

    if (!selectedPlan) {
      openPlanUpgradeModal('plan-required', 'Please buy a plan to publish job requirements.')
      return
    }

    if (!selectedCurrentPlan || selectedPlanStatus === 'inactive') {
      openPlanUpgradeModal('plan-payment-required', 'Payment has not been completed for this plan. Please complete payment before publishing a job requirement.')
      return
    }

    if (selectedPlanStatus === 'expired' || (selectedPlanValidUntil && new Date(selectedPlanValidUntil).getTime() < new Date(selectedPlanLiveStartDate).getTime())) {
      openPlanUpgradeModal('plan-expired', 'Your plan has expired. Please renew or buy a new plan to publish job requirements.')
      return
    }

    if (!isEditMode && (selectedPlanStatus === 'limit_used' || selectedPlanRemainingPosts <= 0)) {
      openPlanUpgradeModal('job-post-limit-reached', 'Your selected plan job post limit is over. Please upgrade or buy another plan.')
      return
    }

    openPublishConfirmModal()
  }

  const confirmPublishNow = () => {
    setPublishModal(null)
    void executeSubmit('publish')
  }

  const fieldClass = (name: keyof FormState) =>
    `${styles.companyRegisterInput} ${errors[name] ? styles.companyRegisterInputError : ''}`

  const renderUploadCard = (key: UploadKey, label: string, subtitle: string, accept: string) => {
    const state = uploads[key]
    return (
      <label
        className={`${styles.companyRegisterUploadCard} ${errors[key] ? styles.companyRegisterUploadCardError : ''}`}
        htmlFor={key}
      >
        <input
          id={key}
          type="file"
          className={styles.companyRegisterUploadInput}
          accept={accept}
          onChange={event => handleFileChange(key, event.target.files?.[0] || null)}
        />
        <div className={styles.companyRegisterUploadIcon} />
        <div className={styles.companyRegisterUploadBody}>
          <p className={styles.companyRegisterUploadTitle}>{label}</p>
          <p className={styles.companyRegisterUploadText}>{state.file ? state.fileName : subtitle}</p>
          <div className={styles.companyRegisterUploadProgressTrack}>
            <span
              className={styles.companyRegisterUploadProgressBar}
              style={{ width: `${state.progress}%`, background: state.status === 'error' ? '#dc2626' : accentColor }}
            />
          </div>
          <p className={styles.companyRegisterUploadMeta}>
            {state.status === 'uploaded' ? 'Uploaded successfully' :
              state.status === 'uploading' ? `Uploading ${state.progress}%` :
              state.status === 'ready' ? 'Ready to upload on submit' :
              'Optional upload'}
          </p>
          {state.error ? <p className={styles.companyRegisterFieldError}>{state.error}</p> : null}
        </div>
      </label>
    )
  }

  return (
    <section className={`${styles.companyRegisterShell} ${styles.companyJobPostLockedShell}`}>
      <div className={`${styles.companyRegisterSplit} ${isAccessLocked ? styles.companyJobPostLockedContentBlurred : ''}`}>
        <aside className={styles.companyRegisterAside}>
          <div className={styles.companyRegisterIllustration}>
            <div className={styles.companyRegisterIllustrationOrb} />
            <div className={styles.companyRegisterIllustrationCard}>
              <span className={styles.companyRegisterIllustrationTag}>Registered companies only</span>
              <p className={styles.companyRegisterIllustrationHeadline}>Post worker requirement with enterprise-ready hiring detail</p>
              <p className={styles.companyRegisterIllustrationText}>
                Share complete job details so ScaleVyapar Rozgar can route the requirement cleanly into admin review,
                worker visibility, and company dashboard follow-up.
              </p>

              <div className={styles.companyRegisterBenefitGrid}>
                {JOB_POST_BENEFITS.map(item => (
                  <div key={item} className={styles.companyRegisterBenefitCard}>
                    <span className={styles.companyRegisterBenefitDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className={styles.companyRegisterInfoCard}>
                <p className={styles.companyRegisterInfoTitle}>How to get workers faster from ScaleVyapar</p>
                <div className={styles.companyRegisterBenefitGrid}>
                  {JOB_POST_FAST_FLOW.map(item => (
                    <div key={item} className={styles.companyRegisterBenefitCard}>
                      <span className={styles.companyRegisterBenefitDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className={styles.companyRegisterFormWrap}>
          {prefillJobId ? (
            <div className={styles.jobPostAutofillNotice}>
              {prefillState === 'loading'
                ? 'Loading your selected job details for quick posting.'
                : isEditMode
                  ? 'Edit mode is active. Worker Category and Select Plan stay locked while you update the rest of the job.'
                  : 'Duplicate mode is active. Review the copied job details and publish the new requirement.'}
            </div>
          ) : null}

          <form
            className={styles.companyRegisterForm}
            onSubmit={event => {
              event.preventDefault()
              void submitForm(hasActiveConnectedPlans ? 'publish' : 'checkout')
            }}
            noValidate
          >
            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 1 - Job Requirement Details</p>
              <div className={styles.companyRegisterGridTwo}>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Job Title / Role *</label>
                  <input className={fieldClass('jobTitle')} value={form.jobTitle} onChange={event => setField('jobTitle', event.target.value)} placeholder="Factory Helper, Loader, Delivery Staff, Machine Operator" />
                  {errors.jobTitle ? <p className={styles.companyRegisterFieldError}>{errors.jobTitle}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Labour Category *</label>
                  <select
                    className={fieldClass('labourCategoryId')}
                    value={form.labourCategoryId}
                    onChange={event => setField('labourCategoryId', event.target.value)}
                    disabled={jobLockedFields || !form.industryType || !form.businessType}
                  >
                    <option value="">Select labour category</option>
                    {visibleLabourCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  {form.industryType && form.businessType && visibleLabourCategories.length === 0 ? (
                    <p className={styles.jobPostPlanWarningHint}>
                      No mapped labour categories found for this Industry Category and Business Type. Please update Category Mappings in Admin Masters.
                    </p>
                  ) : null}
                  {errors.labourCategoryId ? <p className={styles.companyRegisterFieldError}>{errors.labourCategoryId}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Select Plan *</label>
                  <select
                    className={fieldClass('selectedPlanId')}
                    value={form.selectedPlanId}
                    onChange={event => setField('selectedPlanId', event.target.value)}
                    disabled={jobLockedFields || (!isEditMode && selectableJobPostingPlans.length === 0)}
                  >
                    <option value="">{hasActiveConnectedPlans ? 'Select connected plan' : 'Select plan to purchase'}</option>
                    {isEditMode && selectedPlan ? (
                      <option value={selectedPlan.id}>
                        {`${selectedPlan.name} - Plan valid ${getPlanValidityDays(selectedPlan)} days - Job live ${getJobPostLiveDays(selectedPlan)} days - Rs ${selectedPlan.planAmount}`}
                      </option>
                    ) : null}
                    {!isEditMode
                      ? selectableJobPostingPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {hasActiveConnectedPlans
                            ? `${plan.name} - Remaining ${currentJobPostingPlans.find(summary => summary.planId === plan.id)?.remainingJobPosts ?? Math.max(0, plan.jobPostLimit)} - Job live ${getJobPostLiveDays(plan)} days`
                            : `${plan.name} - ${plan.jobPostLimit} posts - Job live ${getJobPostLiveDays(plan)} days - Rs ${plan.planAmount}`}
                        </option>
                      ))
                      : null}
                  </select>
                  {errors.selectedPlanId ? <p className={styles.companyRegisterFieldError}>{errors.selectedPlanId}</p> : null}
                  {!isEditMode && !hasActiveConnectedPlans ? (
                    <p className={styles.jobPostPlanWarningHint}>
                      No active job posting plan is connected yet. Select a plan, save this requirement, then continue to checkout before publishing.
                    </p>
                  ) : null}
                </div>
                {selectedPlan ? (
                  <div className={styles.companyRegisterGridWide} style={{ border: '1px solid #dbeafe', borderRadius: '18px', padding: '16px 18px', background: '#f8fbff' }}>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{selectedPlan.name}</p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                        Used: {selectedCurrentPlan?.usedJobPosts ?? selectedPlanUsedPosts} / {selectedCurrentPlan?.totalJobPosts ?? selectedPlan.jobPostLimit} job posts | Remaining posts: {selectedPlanRemainingPosts}
                      </p>
                      {selectedPlanUpgradeWarning ? (
                        <p className={styles.jobPostPlanWarningHint}>
                          {selectedPlanStatus === 'limit_used'
                            ? 'Your job posting limit is used. Please renew your paid plan to continue posting jobs.'
                            : selectedPlanStatus === 'expired'
                              ? 'This plan has expired. Please renew or buy another plan before publishing.'
                              : 'Upgrade required to publish with this plan.'
                          }
                        </p>
                      ) : null}
                      <p style={{ margin: 0, color: '#2563eb', fontSize: '13px', fontWeight: 700 }}>
                        {selectedCurrentPlan
                          ? `Active plan status: ${selectedCurrentPlan.status.replace(/_/g, ' ')}`
                          : 'Purchase option: checkout is required before this job can be published.'}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                        {selectedPlanValidUntil
                          ? `Plan valid from: ${selectedPlanValidFrom || 'Activation date'} | Plan valid until: ${selectedPlanValidUntil}`
                          : `Plan validity: ${getPlanValidityDays(selectedPlan)} days`
                        }
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                        This job will be live from: {selectedPlanLiveStartDate} | It will expire on: {selectedPlanLiveEndDate || 'Will be calculated after posting'}
                      </p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                        Plan validity: {getPlanValidityDays(selectedPlan)} days | Job post live period: {getJobPostLiveDays(selectedPlan)} days | Amount: Rs {selectedPlan.planAmount}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div>
                  <label className={styles.companyRegisterLabel}>Worker Category *</label>
                  <select className={fieldClass('workerCategory')} value={form.workerCategory} onChange={event => setField('workerCategory', event.target.value)}>
                    <option value="">Select worker category</option>
                    {WORKER_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.workerCategory ? <p className={styles.companyRegisterFieldError}>{errors.workerCategory}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Number of Workers Required *</label>
                  <input className={fieldClass('workersRequired')} type="number" min="1" value={form.workersRequired} onChange={event => setField('workersRequired', event.target.value)} />
                  {errors.workersRequired ? <p className={styles.companyRegisterFieldError}>{errors.workersRequired}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Gender Preference</label>
                  <select className={fieldClass('genderPreference')} value={form.genderPreference} onChange={event => setField('genderPreference', event.target.value)}>
                    <option value="">Select gender preference</option>
                    {GENDER_PREFERENCES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.genderPreference ? <p className={styles.companyRegisterFieldError}>{errors.genderPreference}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Experience Required</label>
                  <select className={fieldClass('experienceRequired')} value={form.experienceRequired} onChange={event => setField('experienceRequired', event.target.value)}>
                    <option value="">Select experience requirement</option>
                    {EXPERIENCE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.experienceRequired ? <p className={styles.companyRegisterFieldError}>{errors.experienceRequired}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Shift Type</label>
                  <select className={fieldClass('shiftType')} value={form.shiftType} onChange={event => setField('shiftType', event.target.value)}>
                    <option value="">Select shift type</option>
                    {SHIFT_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.shiftType ? <p className={styles.companyRegisterFieldError}>{errors.shiftType}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Weekly Off</label>
                  <input className={fieldClass('weeklyOff')} value={form.weeklyOff} onChange={event => setField('weeklyOff', event.target.value)} placeholder="Sunday" />
                  {errors.weeklyOff ? <p className={styles.companyRegisterFieldError}>{errors.weeklyOff}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Job Duration</label>
                  <select className={fieldClass('jobDuration')} value={form.jobDuration} onChange={event => setField('jobDuration', event.target.value)}>
                    <option value="">Select job duration</option>
                    {JOB_DURATIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.jobDuration ? <p className={styles.companyRegisterFieldError}>{errors.jobDuration}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Joining Date</label>
                  <input className={fieldClass('joiningDate')} type="date" value={form.joiningDate} onChange={event => setField('joiningDate', event.target.value)} />
                  {errors.joiningDate ? <p className={styles.companyRegisterFieldError}>{errors.joiningDate}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 2 - Work Details</p>
              <div className={styles.companyRegisterGridTwo}>
                <div>
                  <label className={styles.companyRegisterLabel}>Job Location</label>
                  <input
                    list="job-post-location-options"
                    className={fieldClass('jobLocation')}
                    value={form.jobLocation}
                    onChange={event => setField('jobLocation', event.target.value)}
                    placeholder="Enter job city or location"
                  />
                  <datalist id="job-post-location-options">
                    {availableCities.map(city => <option key={`job-${city}`} value={city} />)}
                  </datalist>
                  {errors.jobLocation ? <p className={styles.companyRegisterFieldError}>{errors.jobLocation}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Age Requirement</label>
                  <input className={fieldClass('ageRequirement')} value={form.ageRequirement} onChange={event => setField('ageRequirement', event.target.value)} placeholder="18-35 years" />
                  {errors.ageRequirement ? <p className={styles.companyRegisterFieldError}>{errors.ageRequirement}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Duty Hours</label>
                  <input className={fieldClass('dutyHours')} value={form.dutyHours} onChange={event => setField('dutyHours', event.target.value)} placeholder="9 AM - 6 PM" />
                  {errors.dutyHours ? <p className={styles.companyRegisterFieldError}>{errors.dutyHours}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 3 - Salary & Facilities</p>
              <div className={styles.companyRegisterGridTwo}>
                <div>
                  <label className={styles.companyRegisterLabel}>Salary Type *</label>
                  <select className={fieldClass('salaryType')} value={form.salaryType} onChange={event => setField('salaryType', event.target.value)}>
                    <option value="">Select salary type</option>
                    {SALARY_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.salaryType ? <p className={styles.companyRegisterFieldError}>{errors.salaryType}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Salary Amount *</label>
                  <input className={fieldClass('salaryAmount')} type="number" min="1" value={form.salaryAmount} onChange={event => setField('salaryAmount', event.target.value)} />
                  {errors.salaryAmount ? <p className={styles.companyRegisterFieldError}>{errors.salaryAmount}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Overtime Available</label>
                  <select className={fieldClass('overtimeAvailable')} value={form.overtimeAvailable} onChange={event => setField('overtimeAvailable', event.target.value)}>
                    <option value="">Select option</option>
                    {YES_NO_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.overtimeAvailable ? <p className={styles.companyRegisterFieldError}>{errors.overtimeAvailable}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Food Facility</label>
                  <select className={fieldClass('foodFacility')} value={form.foodFacility} onChange={event => setField('foodFacility', event.target.value)}>
                    <option value="">Select option</option>
                    {FACILITY_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.foodFacility ? <p className={styles.companyRegisterFieldError}>{errors.foodFacility}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Accommodation</label>
                  <select className={fieldClass('accommodation')} value={form.accommodation} onChange={event => setField('accommodation', event.target.value)}>
                    <option value="">Select option</option>
                    {FACILITY_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.accommodation ? <p className={styles.companyRegisterFieldError}>{errors.accommodation}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Transport Facility</label>
                  <select className={fieldClass('transportFacility')} value={form.transportFacility} onChange={event => setField('transportFacility', event.target.value)}>
                    <option value="">Select option</option>
                    {FACILITY_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.transportFacility ? <p className={styles.companyRegisterFieldError}>{errors.transportFacility}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 4 - Job Description</p>
              <div className={styles.companyRegisterGridTwo}>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Job Description *</label>
                  <textarea className={fieldClass('jobDescription')} rows={5} value={form.jobDescription} onChange={event => setField('jobDescription', event.target.value)} />
                  {errors.jobDescription ? <p className={styles.companyRegisterFieldError}>{errors.jobDescription}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Required Skills</label>
                  <textarea className={fieldClass('requiredSkills')} rows={4} value={form.requiredSkills} onChange={event => setField('requiredSkills', event.target.value)} placeholder="Machine handling, loading, stitching, packing" />
                  {errors.requiredSkills ? <p className={styles.companyRegisterFieldError}>{errors.requiredSkills}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Special Instructions</label>
                  <textarea className={fieldClass('specialInstructions')} rows={4} value={form.specialInstructions} onChange={event => setField('specialInstructions', event.target.value)} />
                  {errors.specialInstructions ? <p className={styles.companyRegisterFieldError}>{errors.specialInstructions}</p> : null}
                </div>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Languages Preferred</label>
                  <input className={fieldClass('languagesPreferred')} value={form.languagesPreferred} onChange={event => setField('languagesPreferred', event.target.value)} placeholder="Hindi, Gujarati, English" />
                  {errors.languagesPreferred ? <p className={styles.companyRegisterFieldError}>{errors.languagesPreferred}</p> : null}
                </div>
              </div>
            </div>
            <div className={styles.companyRegisterSubmitRow}>
              {errors.form ? <p className={styles.companyRegisterFieldError}>{errors.form}</p> : null}
              <div className={styles.jobPostActionRow}>
                <button
                  type="button"
                  className={styles.companyRegisterSecondaryButton}
                  disabled={submitting || isAccessLocked}
                  onClick={() => void submitForm('draft')}
                >
                  {submitting && submitMode === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || isAccessLocked}
                  className={styles.companyRegisterPrimaryButton}
                  style={{ background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${accentColor}, #1d4ed8)` }}
                >
                  {submitting && submitMode === 'publish'
                    ? (isEditMode ? 'Updating Job Requirement...' : 'Submitting Job Requirement...')
                    : submitting && submitMode === 'checkout'
                      ? 'Preparing checkout...'
                      : isEditMode
                        ? 'Update Job Requirement'
                        : hasActiveConnectedPlans
                          ? 'Publish Job Requirement'
                          : 'Checkout'}
                </button>
              </div>
              {successState ? (
                <div className={styles.jobPostInlineSuccess}>
                  <div className={styles.jobPostInlineSuccessIcon}>✓</div>
                  <div className={styles.jobPostInlineSuccessContent}>
                    <p className={styles.jobPostInlineSuccessTitle}>
                      {successState.statusLabel.toLowerCase() === 'draft'
                        ? 'Job post saved as draft successfully.'
                        : isEditMode
                          ? 'Job post updated successfully.'
                          : 'Job post submitted successfully. Our admin team will review it shortly.'}
                    </p>
                    <p className={styles.jobPostInlineSuccessText}>
                      {successState.statusLabel.toLowerCase() === 'draft'
                        ? 'You can continue editing this requirement from your company panel.'
                        : 'You can track this requirement from your company panel.'}
                    </p>
                  </div>
                </div>
              ) : null}
              <p className={styles.companyRegisterSubmitNote}>
                {isValid
                  ? hasActiveConnectedPlans
                    ? 'The requirement is ready to submit into ScaleVyapar worker admin for review and visibility control.'
                    : 'The requirement can be saved as draft and continued to checkout. It will not publish until payment/plan activation succeeds.'
                  : 'Complete these required fields: Job Title, Labour Category, Select Plan, Number of Workers Required, Salary Type, Salary Amount, and Job Description.'}
              </p>
            </div>
          </form>
        </div>
      </div>
      {isAccessLocked ? (
        <div className={styles.companyJobPostGateOverlay}>
          <div className={styles.companyJobPostGateCard}>
            <div className={styles.companyJobPostGateIcon} aria-hidden="true">
              {autofillState === 'loading' ? '...' : '🔒'}
            </div>
            <h2 className={styles.companyJobPostGateTitle}>
              {autofillState === 'loading' ? 'Checking company access...' : 'Register or Log In to Post a Job'}
            </h2>
            <p className={styles.companyJobPostGateText}>
              {autofillState === 'loading'
                ? 'We are verifying whether your company session is active before opening the job posting workflow.'
                : 'Please register your company or log in to your account before posting a job requirement.'}
            </p>
            {autofillState === 'not-found' ? (
              <div className={styles.companyJobPostGateActions}>
                <Link href={resolveHref('/labour/company/signin')} className={styles.companyJobPostGatePrimary}>
                  Log In Here
                </Link>
                <Link href={resolveHref('/labour/company/company-registration')} className={styles.companyJobPostGateSecondary}>
                  Register Company
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {isMounted && publishModal ? createPortal(
        <div className={styles.jobPostPlanModalOverlay} role="presentation" onClick={closePublishModal}>
          <div
            className={styles.jobPostPlanModalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-upgrade-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.jobPostPlanModalClose}
              onClick={closePublishModal}
              aria-label="Close plan upgrade popup"
            >
              ×
            </button>
            <p className={styles.jobPostPlanModalEyebrow}>{publishModal.eyebrow}</p>
            <h2 id="plan-upgrade-modal-title" className={styles.jobPostPlanModalTitle}>{publishModal.title}</h2>
            <p className={styles.jobPostPlanModalPlanName}>{publishModal.planName}</p>
            {publishModal.usageLine ? <p className={styles.jobPostPlanModalMessage}>{publishModal.usageLine}</p> : null}
            {publishModal.liveWindowLine ? <p className={styles.jobPostPlanModalMessage}>{publishModal.liveWindowLine}</p> : null}
            <p className={styles.jobPostPlanModalMessage}>{publishModal.message}</p>
            <div className={styles.jobPostPlanModalActions}>
              <button type="button" className={styles.jobPostPlanModalSecondary} onClick={closePublishModal}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.jobPostPlanModalPrimary}
                onClick={publishModal.variant === 'confirm' ? confirmPublishNow : goToPlanUpgrade}
                disabled={submitting}
              >
                {publishModal.primaryLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </section>
  )
}



