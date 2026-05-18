'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './company-site.module.css'
import {
  LabourCategoryDependency,
  LabourIndustryBusinessDependency,
  LabourMasterOption,
  buildLabourMasterSelectOptions,
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  getVisibleLabourMasterOptions
} from '@/lib/labour-masters-schema'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'

type CategoryOption = {
  id: string
  name: string
  description: string
}

type PlanOption = {
  id: string
  name: string
  validityDays: number
  planAmount: number
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
}

type UploadKey = 'companyLogo' | 'workplacePhotos' | 'requirementPdf' | 'supportingDocuments'

type CompanySessionProfile = {
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
  title: string
  description: string
  city: string
  locationLabel: string
  categoryId: string
  status: string
  workersNeeded: number
  wageAmount: number
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

const JOB_POST_STEPS = [
  'Company Details',
  'Job Requirement',
  'Work Details',
  'Salary & Facilities',
  'Description'
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
  accentColor = '#2563eb'
}: Props) {
  const searchParams = useSearchParams()
  const editJobId = searchParams.get('edit') || ''
  const duplicateJobId = searchParams.get('duplicate') || ''
  const prefillJobId = editJobId || duplicateJobId
  const isEditMode = Boolean(editJobId)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | UploadKey | 'form', string>>>({})
  const [submissionId, setSubmissionId] = useState(() => `company-job-post-${Date.now()}`)
  const [companyToken, setCompanyToken] = useState('')
  const [autofillState, setAutofillState] = useState<'idle' | 'loading' | 'ready' | 'not-found'>('loading')
  const [submitMode, setSubmitMode] = useState<'publish' | 'draft'>('publish')
  const [submitting, setSubmitting] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [prefillState, setPrefillState] = useState<'idle' | 'loading' | 'ready' | 'missing'>('idle')
  const [prefilledJobId, setPrefilledJobId] = useState('')
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

  useEffect(() => {
    let cancelled = false

    const applyCompanyProfile = (profile: CompanySessionProfile, token: string) => {
      if (cancelled) return

      setCompanyToken(token)
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
            const dashboardData = await dashboardResponse.json()
            const profile = dashboardData?.dashboard?.profile as CompanySessionProfile | undefined
            if (profile) {
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

        const data = await response.json()
        const profile = data?.dashboard?.profile as CompanySessionProfile | undefined
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
      window.location.href = '/labour/company/panel'
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

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(String(data?.error || 'Failed to load company jobs for editing.'))
        }

        const jobs = Array.isArray(data?.dashboard?.jobs) ? data.dashboard.jobs as CompanyDashboardJob[] : []
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

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState | UploadKey | 'form', string>> = {}

    if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.'
    if (!form.contactPerson.trim()) nextErrors.contactPerson = 'Contact person name is required.'
    if (!EMAIL_REGEX.test(form.companyEmail.trim())) nextErrors.companyEmail = 'Enter a valid company email.'
    if (!/^\d{10}$/.test(form.mobile.trim())) nextErrors.mobile = 'Mobile number must be exactly 10 digits.'
    if (!/^\d{10}$/.test(form.whatsAppNumber.trim())) nextErrors.whatsAppNumber = 'WhatsApp number must be exactly 10 digits.'
    if (!form.industryType) nextErrors.industryType = 'Select an industry type.'
    if (!form.businessType) nextErrors.businessType = 'Select a business type.'
    if (!form.companyAddress.trim()) nextErrors.companyAddress = 'Company address is required.'
    if (!form.state.trim()) nextErrors.state = 'State is required.'
    if (!form.city.trim()) nextErrors.city = 'City is required.'
    if (!form.area.trim()) nextErrors.area = 'Area is required.'
    if (!/^\d{6}$/.test(form.pincode.trim())) nextErrors.pincode = 'Pincode must be exactly 6 digits.'

    if (!form.jobTitle.trim()) nextErrors.jobTitle = 'Job title is required.'
    if (!form.labourCategoryId) nextErrors.labourCategoryId = 'Select a worker category.'
    if (!form.selectedPlanId) nextErrors.selectedPlanId = 'Select a connected plan.'
    if (!form.workersRequired.trim()) nextErrors.workersRequired = 'Number of workers required is mandatory.'
    else if (Number(form.workersRequired) <= 0) nextErrors.workersRequired = 'Enter a valid number of workers.'

    if (!form.salaryType) nextErrors.salaryType = 'Select a salary type.'
    if (!form.salaryAmount.trim()) nextErrors.salaryAmount = 'Salary amount is required.'
    else if (Number(form.salaryAmount) <= 0) nextErrors.salaryAmount = 'Enter a valid salary amount.'

    if (!form.jobDescription.trim()) nextErrors.jobDescription = 'Job description is required.'

    setErrors(nextErrors)
    return nextErrors
  }

  const isValid = useMemo(() => {
    return (
      form.companyName.trim() &&
      form.contactPerson.trim() &&
      EMAIL_REGEX.test(form.companyEmail.trim()) &&
      /^\d{10}$/.test(form.mobile.trim()) &&
      /^\d{10}$/.test(form.whatsAppNumber.trim()) &&
      form.industryType &&
      form.businessType &&
      form.companyAddress.trim() &&
      form.state.trim() &&
      form.city.trim() &&
      form.area.trim() &&
      /^\d{6}$/.test(form.pincode.trim()) &&
      form.jobTitle.trim() &&
      form.labourCategoryId &&
      form.selectedPlanId &&
      Number(form.workersRequired) > 0 &&
      form.salaryType &&
      Number(form.salaryAmount) > 0 &&
      form.jobDescription.trim()
    )
  }, [form])

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

  const submitForm = async (mode: 'publish' | 'draft') => {
    if (isAccessLocked) {
      setErrors(current => ({
        ...current,
        form: 'Register & login to post a job. Please sign in with your company account first.'
      }))
      return
    }

    setSubmitMode(mode)
    setSuccessState(null)

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      return
    }

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
        throw new Error(data.error || 'Failed to submit job requirement.')
      }

      setSuccessState({
        message: String(data.message || 'Job requirement submitted successfully.'),
        statusLabel: String(data.statusLabel || (mode === 'draft' ? 'Draft' : 'Pending Review')),
        jobId: String(data.jobId || '')
      })

      setErrors({})
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
    } catch (error) {
      setErrors(current => ({
        ...current,
        form: error instanceof Error ? error.message : 'Failed to submit job requirement.'
      }))
    } finally {
      setSubmitting(false)
    }
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
          <div className={styles.companyRegisterHeader}>
            <p className={styles.companyRegisterEyebrow}>Post Worker Requirement</p>
            <p className={styles.companyRegisterSubtitle}>
              Share your workforce requirement and connect with suitable workers faster.
            </p>
          </div>

          <div className={styles.jobPostStepRow}>
            {JOB_POST_STEPS.map((step, index) => (
              <span key={step} className={styles.jobPostStepPill}>
                <span className={styles.jobPostStepCount}>{index + 1}</span>
                {step}
              </span>
            ))}
          </div>

          {autofillState === 'ready' ? (
            <div className={styles.jobPostAutofillNotice}>
              Company details are auto-filled from your logged-in company dashboard and locked here for posting.
            </div>
          ) : null}

          {prefillJobId ? (
            <div className={styles.jobPostAutofillNotice}>
              {prefillState === 'loading'
                ? 'Loading your selected job details for quick posting.'
                : isEditMode
                  ? 'Edit mode is active. Worker Category and Select Plan stay locked while you update the rest of the job.'
                  : 'Duplicate mode is active. Review the copied job details and publish the new requirement.'}
            </div>
          ) : null}

          {successState ? (
            <div className={styles.companyRegisterSuccessCard}>
              <div className={styles.companyRegisterSuccessIcon}>✓</div>
              <p className={styles.companyRegisterSuccessTitle}>
                {isEditMode
                  ? 'Job requirement updated successfully'
                  : successState.statusLabel.toLowerCase() === 'draft'
                    ? 'Job requirement saved successfully'
                    : 'Job requirement submitted successfully'}
              </p>
              <p className={styles.companyRegisterSuccessText}>{successState.message}</p>
              <p className={styles.jobPostSuccessMeta}>
                Current status: <strong>{successState.statusLabel}</strong>{successState.jobId ? ` | Job ID: ${successState.jobId}` : ''}
              </p>
              <div className={styles.companyRegisterSuccessActions}>
                <Link href="/labour/company/panel" className={styles.companyRegisterPrimaryButton}>Open Company Panel</Link>
                <Link href="/labour/company/search" className={styles.companyRegisterSecondaryButton}>Search Workers</Link>
              </div>
            </div>
          ) : null}

          <form
            className={styles.companyRegisterForm}
            onSubmit={event => {
              event.preventDefault()
              void submitForm('publish')
            }}
            noValidate
          >
            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 1 - Company Details</p>
              <p className={styles.companyRegisterSectionNote}>Auto-fetched if your company dashboard session is already active.</p>
              <div className={styles.companyRegisterGridTwo}>
                <div>
                  <label className={styles.companyRegisterLabel}>Company Name *</label>
                  <input className={fieldClass('companyName')} value={form.companyName} onChange={event => setField('companyName', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.companyName ? <p className={styles.companyRegisterFieldError}>{errors.companyName}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Contact Person Name *</label>
                  <input className={fieldClass('contactPerson')} value={form.contactPerson} onChange={event => setField('contactPerson', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.contactPerson ? <p className={styles.companyRegisterFieldError}>{errors.contactPerson}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Company Email *</label>
                  <input className={fieldClass('companyEmail')} value={form.companyEmail} onChange={event => setField('companyEmail', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.companyEmail ? <p className={styles.companyRegisterFieldError}>{errors.companyEmail}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Mobile Number *</label>
                  <input className={fieldClass('mobile')} maxLength={10} value={form.mobile} onChange={event => setField('mobile', event.target.value.replace(/\D/g, '').slice(0, 10))} readOnly={companyFieldsLocked} />
                  {errors.mobile ? <p className={styles.companyRegisterFieldError}>{errors.mobile}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>WhatsApp Number *</label>
                  <input className={fieldClass('whatsAppNumber')} maxLength={10} value={form.whatsAppNumber} onChange={event => setField('whatsAppNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} readOnly={companyFieldsLocked} />
                  {errors.whatsAppNumber ? <p className={styles.companyRegisterFieldError}>{errors.whatsAppNumber}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Industry Type *</label>
                  <select className={fieldClass('industryType')} value={form.industryType} onChange={event => setField('industryType', event.target.value)} disabled={companyFieldsLocked}>
                    <option value="">Select industry type</option>
                    {visibleIndustryCategoryOptions.map(item => <option key={item.id} value={item.value}>{item.label}</option>)}
                  </select>
                  {errors.industryType ? <p className={styles.companyRegisterFieldError}>{errors.industryType}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Business Type *</label>
                  <select
                    className={fieldClass('businessType')}
                    value={form.businessType}
                    onChange={event => setField('businessType', event.target.value)}
                    disabled={companyFieldsLocked || !form.industryType}
                  >
                    <option value="">Select business type</option>
                    {visibleBusinessTypeOptions.map(item => <option key={item.id} value={item.value}>{item.label}</option>)}
                  </select>
                  {errors.businessType ? <p className={styles.companyRegisterFieldError}>{errors.businessType}</p> : null}
                </div>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Company Address *</label>
                  <textarea className={fieldClass('companyAddress')} rows={4} value={form.companyAddress} onChange={event => setField('companyAddress', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.companyAddress ? <p className={styles.companyRegisterFieldError}>{errors.companyAddress}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>State *</label>
                  <input className={fieldClass('state')} value={form.state} onChange={event => setField('state', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.state ? <p className={styles.companyRegisterFieldError}>{errors.state}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>City *</label>
                  <select className={fieldClass('city')} value={form.city} onChange={event => setField('city', event.target.value)} disabled={companyFieldsLocked}>
                    <option value="">Select city</option>
                    {availableCities.map(city => <option key={`company-city-${city}`} value={city}>{city}</option>)}
                  </select>
                  {errors.city ? <p className={styles.companyRegisterFieldError}>{errors.city}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Area *</label>
                  <input className={fieldClass('area')} value={form.area} onChange={event => setField('area', event.target.value)} readOnly={companyFieldsLocked} />
                  {errors.area ? <p className={styles.companyRegisterFieldError}>{errors.area}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Pincode *</label>
                  <input className={fieldClass('pincode')} maxLength={6} value={form.pincode} onChange={event => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} readOnly={companyFieldsLocked} />
                  {errors.pincode ? <p className={styles.companyRegisterFieldError}>{errors.pincode}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 2 - Job Requirement Details</p>
              <div className={styles.companyRegisterGridTwo}>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Job Title *</label>
                  <input className={fieldClass('jobTitle')} value={form.jobTitle} onChange={event => setField('jobTitle', event.target.value)} placeholder="Factory Helper, Loader, Delivery Staff, Machine Operator" />
                  {errors.jobTitle ? <p className={styles.companyRegisterFieldError}>{errors.jobTitle}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Worker Category</label>
                  <select className={fieldClass('workerCategory')} value={form.workerCategory} onChange={event => setField('workerCategory', event.target.value)}>
                    <option value="">Select worker category</option>
                    {WORKER_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.workerCategory ? <p className={styles.companyRegisterFieldError}>{errors.workerCategory}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Worker Category *</label>
                  <select
                    className={fieldClass('labourCategoryId')}
                    value={form.labourCategoryId}
                    onChange={event => setField('labourCategoryId', event.target.value)}
                    disabled={jobLockedFields || !form.industryType || !form.businessType}
                  >
                    <option value="">Select worker category</option>
                    {visibleLabourCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  {errors.labourCategoryId ? <p className={styles.companyRegisterFieldError}>{errors.labourCategoryId}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Select Plan *</label>
                  <select className={fieldClass('selectedPlanId')} value={form.selectedPlanId} onChange={event => setField('selectedPlanId', event.target.value)} disabled={jobLockedFields}>
                    <option value="">Select connected plan</option>
                    {plans.map(plan => <option key={plan.id} value={plan.id}>{`${plan.name} - ${plan.validityDays} days - Rs ${plan.planAmount}`}</option>)}
                  </select>
                  {errors.selectedPlanId ? <p className={styles.companyRegisterFieldError}>{errors.selectedPlanId}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Workers Needed - Quantity *</label>
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
                  <label className={styles.companyRegisterLabel}>Age Requirement</label>
                  <input className={fieldClass('ageRequirement')} value={form.ageRequirement} onChange={event => setField('ageRequirement', event.target.value)} placeholder="18-35 years" />
                  {errors.ageRequirement ? <p className={styles.companyRegisterFieldError}>{errors.ageRequirement}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Experience Required</label>
                  <select className={fieldClass('experienceRequired')} value={form.experienceRequired} onChange={event => setField('experienceRequired', event.target.value)}>
                    <option value="">Select experience requirement</option>
                    {EXPERIENCE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.experienceRequired ? <p className={styles.companyRegisterFieldError}>{errors.experienceRequired}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 3 - Work Details</p>
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
                  <label className={styles.companyRegisterLabel}>Duty Hours</label>
                  <input className={fieldClass('dutyHours')} value={form.dutyHours} onChange={event => setField('dutyHours', event.target.value)} placeholder="9 AM - 6 PM" />
                  {errors.dutyHours ? <p className={styles.companyRegisterFieldError}>{errors.dutyHours}</p> : null}
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
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Section 4 - Salary & Facilities</p>
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
              <p className={styles.companyRegisterSectionTitle}>Section 5 - Job Description</p>
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
                  disabled={!isValid || submitting || isAccessLocked}
                  className={styles.companyRegisterPrimaryButton}
                  style={{ background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${accentColor}, #1d4ed8)` }}
                >
                  {submitting && submitMode === 'publish'
                    ? (isEditMode ? 'Updating Job Requirement...' : 'Submitting Job Requirement...')
                    : (isEditMode ? 'Update Job Requirement' : 'Publish Job Requirement')}
                </button>
              </div>
              <p className={styles.companyRegisterSubmitNote}>
                {isValid
                  ? 'The requirement is ready to submit into ScaleVyapar worker admin for review and visibility control.'
                  : 'Complete these required fields to publish: Job Title, Worker Category, Select Plan, Workers Needed, Salary Type, Salary Amount, and Job Description.'}
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
              {autofillState === 'loading' ? 'Checking company access...' : 'Register & Login to Post a Job'}
            </h2>
            <p className={styles.companyJobPostGateText}>
              {autofillState === 'loading'
                ? 'We are verifying whether your company session is active before opening the job posting workflow.'
                : 'Please register your company or log in to your account before posting a job requirement.'}
            </p>
            {autofillState === 'not-found' ? (
              <div className={styles.companyJobPostGateActions}>
                <Link href="/labour/company/signin" className={styles.companyJobPostGatePrimary}>
                  Login Here
                </Link>
                <Link href="/labour/company/company-registration" className={styles.companyJobPostGateSecondary}>
                  Register Company
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

