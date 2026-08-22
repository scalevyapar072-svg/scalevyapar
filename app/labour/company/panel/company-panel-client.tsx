'use client'

import { BadgeCheck, CircleAlert, Download, PhoneCall, RotateCcw, X } from 'lucide-react'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../company-site.module.css'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import {
  billingStatusTone as getBillingStatusTone,
  buildBillingAddress,
  type BillingHistoryTab,
  type CompanyBillingRecord,
  formatBillingAmount as formatCompanyBillingAmount,
  resolveCompanyBillingHistory
} from '@/lib/labour-company-billing'
import type { CompanyJobPostingPlanSummary } from '@/lib/labour-plan-utils'
import {
  getWhatsappConsentCopy,
  normalizeWhatsappConsentLanguage,
  WHATSAPP_CONSENT_TEXT_VERSION,
  type WhatsappConsentLanguage,
} from '@/lib/whatsapp/consent'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'
type CompanyApplicant = {
  applicationId: string
  appliedAt: string
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  note: string
  workerId: string
  fullName: string
  city: string
  mobile: string | null
  canContactDirectly: boolean
  categoryLabels: string[]
  skills: string[]
  experienceYears: number
  expectedDailyWage: number
  availability: string
  walletBalance: number
  profilePhotoPath: string
}

type CompanyJob = {
  id: string
  title: string
  description: string
  city: string
  locationLabel: string
  categoryId: string
  categoryLabel: string
  status: string
  workersNeeded: number
  wageAmount: number
  publishedAt: string
  expiresAt: string
  workerCategory: string
  salaryType: string
  shiftType: string
  weeklyOff: string
  overtimeAvailable: string
  foodFacility: string
  accommodation: string
  transportFacility: string
  jobDuration: string
  requiredSkills: string
  specialInstructions: string
  totalApplications: number
  shortlistedCount: number
  hiredCount: number
  applicants: CompanyApplicant[]
}

type CompanyDashboard = {
  profile: {
    id: string
    companyName: string
    contactPerson: string
    email: string
    mobile: string
    gstNumber?: string
    companyAddress?: string
    pincode?: string
    city: string
    area?: string
    state?: string
    status: string
    activePlan: string
    categoryLabels: string[]
    activeJobCategoryLabels: string[]
  }
  currentJobPostingPlan?: CompanyJobPostingPlanSummary | null
  stats: {
    liveJobPosts: number
    totalApplications: number
    shortlistedApplications: number
    hiredApplications: number
  }
  jobs: CompanyJob[]
  recentApplications: CompanyApplicant[]
  billingHistory?: CompanyBillingRecord[] | null
}

type Props = {
  signinMode?: boolean
  jobId?: string
  content: LabourCompanyWebsiteContent['companyPanel']
}

type BillingProfileDraft = {
  companyName: string
  gstNumber: string
  isdGstin: string
  companyAddress: string
  area: string
  city: string
  state: string
  pincode: string
}

type CompanyCommunicationPreferences = {
  available: boolean
  readOnly: boolean
  writeEnabled: boolean
  disabledReason: string | null
  disabledMessage: string | null
  consentTextVersion: string
  state: {
    service_allowed: boolean | null
    matching_alerts_allowed: boolean | null
    marketing_allowed: boolean | null
  }
}

type CommunicationPreferencesDraft = {
  service_allowed: boolean
  matching_alerts_allowed: boolean
  marketing_allowed: boolean
}

type ApplicantWorkflowStatus = 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

const formatPlanStatusLabel = (status: CompanyJobPostingPlanSummary['status'] | '') => {
  if (status === 'limit_used') return 'Limit Used'
  if (status === 'expired') return 'Expired'
  if (status === 'active') return 'Active'
  return 'Inactive'
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const normalizeApplicantWorkflowStatus = (value: string | null | undefined): ApplicantWorkflowStatus => {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'reviewed') return 'reviewed'
  if (normalized === 'shortlisted') return 'shortlisted'
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'hired') return 'hired'

  return 'submitted'
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

const availabilityLabel = (value: string) => {
  if (value === 'available_today') return 'Available today'
  if (value === 'available_this_week') return 'Available this week'
  return 'Not available'
}

const statusTone = (value: string) => {
  if (value === 'shortlisted' || value === 'active' || value === 'hired' || value === 'live') {
    return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
  }
  if (value === 'rejected' || value === 'blocked' || value === 'expired') {
    return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
  }
  return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
}

const companyJobStatusLabel = (value: string) => {
  if (value === 'live' || value === 'active' || value === 'hired') return 'Active'
  if (value === 'expired') return 'Expired'
  if (value === 'pending' || value === 'under_review') return 'Under Review'
  if (value === 'select_plan') return 'Select Plan'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const truncateJobTitle = (value: string, maxWords = 5) => {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return value
  return `${words.slice(0, maxWords).join(' ')}...`
}

const initialsFromName = (value: string) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return 'NA'
  return parts.map(part => part.charAt(0).toUpperCase()).join('')
}

const optionalText = (value: unknown) => {
  const text = String(value || '').trim()
  return text || ''
}

const labelFromStatus = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const createBillingProfileDraft = (dashboard: CompanyDashboard | null): BillingProfileDraft => ({
  companyName: dashboard?.profile.companyName || '',
  gstNumber: dashboard?.profile.gstNumber || '',
  isdGstin: '',
  companyAddress: dashboard?.profile.companyAddress || '',
  area: dashboard?.profile.area || '',
  city: dashboard?.profile.city || '',
  state: dashboard?.profile.state || '',
  pincode: dashboard?.profile.pincode || ''
})

const createCommunicationPreferencesDraft = (
  preferences: CompanyCommunicationPreferences | null,
): CommunicationPreferencesDraft => ({
  service_allowed: preferences?.state.service_allowed === true,
  matching_alerts_allowed: preferences?.state.matching_alerts_allowed === true,
  marketing_allowed: preferences?.state.marketing_allowed === true,
})

type PanelView = 'dashboard' | 'billing' | 'communication'

export function CompanyPanelClient({ signinMode = false, jobId, content }: Props) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null)
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [selectedPanelView, setSelectedPanelView] = useState<PanelView>('dashboard')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedBillingTab, setSelectedBillingTab] = useState<BillingHistoryTab>('all')
  const [billingActionLoadingId, setBillingActionLoadingId] = useState<string | null>(null)
  const [openJobMenuId, setOpenJobMenuId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [isBillingProfileModalOpen, setIsBillingProfileModalOpen] = useState(false)
  const [billingProfileDraft, setBillingProfileDraft] = useState<BillingProfileDraft>(() => createBillingProfileDraft(null))
  const [billingProfileSaving, setBillingProfileSaving] = useState(false)
  const [billingProfileError, setBillingProfileError] = useState('')
  const [communicationPreferences, setCommunicationPreferences] = useState<CompanyCommunicationPreferences | null>(null)
  const [communicationPreferencesDraft, setCommunicationPreferencesDraft] = useState<CommunicationPreferencesDraft>(() =>
    createCommunicationPreferencesDraft(null),
  )
  const [communicationPreferencesLoading, setCommunicationPreferencesLoading] = useState(false)
  const [communicationPreferencesSaving, setCommunicationPreferencesSaving] = useState(false)
  const [communicationPreferencesError, setCommunicationPreferencesError] = useState('')
  const [communicationPreferencesNotice, setCommunicationPreferencesNotice] = useState('')
  const [consentLanguage, setConsentLanguage] = useState<WhatsappConsentLanguage>('en')
  const [isApplicationNoteModalOpen, setIsApplicationNoteModalOpen] = useState(false)
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null)
  const [applicationNoteDraft, setApplicationNoteDraft] = useState('')
  const [applicationNoteError, setApplicationNoteError] = useState('')
  const [applicationNoteSaving, setApplicationNoteSaving] = useState(false)
  const [brokenApplicationAvatars, setBrokenApplicationAvatars] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState<'recent' | 'wage-high' | 'experience-high'>('recent')
  const [detailFilters, setDetailFilters] = useState({
    contactOnly: false,
    withSkills: false,
    withNote: false
  })
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(!signinMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const companyConsentCopy = useMemo(
    () =>
      getWhatsappConsentCopy({
        recipientType: 'company',
        language: consentLanguage,
        includeMarketing: true,
      }),
    [consentLanguage],
  )

  const loadDashboard = async (authToken: string) => {
    const response = await fetch('/api/labour/company/dashboard', {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      cache: 'no-store'
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load company panel.')
    }

    setDashboard(data.dashboard as CompanyDashboard)
    setToken(authToken)
    localStorage.setItem(COMPANY_TOKEN_KEY, authToken)
    localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify((data.dashboard as CompanyDashboard).profile))
  }

  const applyCommunicationPreferences = (next: CompanyCommunicationPreferences) => {
    setCommunicationPreferences(next)
    setCommunicationPreferencesDraft(createCommunicationPreferencesDraft(next))
  }

  const loadCommunicationPreferences = useEffectEvent(async (authToken: string) => {
    setCommunicationPreferencesLoading(true)
    setCommunicationPreferencesError('')

    try {
      const response = await fetch('/api/labour/company/communication-preferences', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      })

      const data = await response.json().catch(() => ({
        error: 'Failed to load communication preferences.',
      }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load communication preferences.')
      }

      applyCommunicationPreferences(data.preferences as CompanyCommunicationPreferences)
    } catch (preferencesError) {
      setCommunicationPreferences(null)
      setCommunicationPreferencesError(
        preferencesError instanceof Error
          ? preferencesError.message
          : 'Failed to load communication preferences.',
      )
    } finally {
      setCommunicationPreferencesLoading(false)
    }
  })

  useEffect(() => {
    if (signinMode) {
      setLoading(false)
      return
    }

    const stored = localStorage.getItem(COMPANY_TOKEN_KEY)
    if (!stored) {
      fetch('/api/labour/company/auth/dashboard-session', { cache: 'no-store' })
        .then(async response => {
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || 'Company dashboard session was not found.')
          }

          const authToken = String(data.token || '')
          if (!authToken) {
            throw new Error('Company token is missing from the dashboard session response.')
          }

          setDashboard(data.dashboard as CompanyDashboard)
          setToken(authToken)
          localStorage.setItem(COMPANY_TOKEN_KEY, authToken)
          localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify((data.dashboard as CompanyDashboard).profile))
        })
        .catch(() => {
          setToken(null)
          setDashboard(null)
        })
        .finally(() => setLoading(false))
      return
    }

    loadDashboard(stored)
      .catch(() => {
        localStorage.removeItem(COMPANY_TOKEN_KEY)
        return fetch('/api/labour/company/auth/dashboard-session', { cache: 'no-store' })
          .then(async response => {
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error || 'Company dashboard session was not found.')
            }

            const authToken = String(data.token || '')
            if (!authToken) {
              throw new Error('Company token is missing from the dashboard session response.')
            }

            setDashboard(data.dashboard as CompanyDashboard)
            setToken(authToken)
            localStorage.setItem(COMPANY_TOKEN_KEY, authToken)
            localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify((data.dashboard as CompanyDashboard).profile))
          })
          .catch(() => {
            setToken(null)
            setDashboard(null)
          })
      })
      .finally(() => setLoading(false))
  }, [signinMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setConsentLanguage(normalizeWhatsappConsentLanguage(window.navigator.language))
  }, [])

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/labour/company/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: identity
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in company panel.')
      }

      const authToken = String(data.token || '')
      if (!authToken) {
        throw new Error('Company token is missing from the login response.')
      }

      localStorage.setItem(COMPANY_TOKEN_KEY, authToken)
      if (data.dashboard?.profile) {
        localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(data.dashboard.profile))
      }
      window.dispatchEvent(new Event('labour-company-auth-change'))

      if (signinMode) {
        router.push('/labour/company/panel')
        return
      }

      setDashboard(data.dashboard as CompanyDashboard)
      setToken(authToken)
      localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify((data.dashboard as CompanyDashboard).profile))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in company panel.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(COMPANY_TOKEN_KEY)
    localStorage.removeItem(COMPANY_PROFILE_KEY)
    window.dispatchEvent(new Event('labour-company-auth-change'))
    setToken(null)
    setDashboard(null)
    setError('')
    if (signinMode) {
      router.refresh()
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || signinMode) {
      return
    }

    const syncViewFromHash = () => {
      if (window.location.hash === '#billing-plan') {
        setSelectedPanelView('billing')
        return
      }

      if (window.location.hash === '#communication-preferences') {
        setSelectedPanelView('communication')
        return
      }

      setSelectedPanelView('dashboard')
    }

    syncViewFromHash()
    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [signinMode])

  useEffect(() => {
    if (selectedPanelView !== 'communication' || !token) {
      return
    }

    void loadCommunicationPreferences(token)
  }, [selectedPanelView, token])

  const setPanelHash = (view: PanelView) => {
    if (typeof window === 'undefined') {
      return
    }

    const nextUrl = view === 'billing'
      ? `${window.location.pathname}#billing-plan`
      : view === 'communication'
        ? `${window.location.pathname}#communication-preferences`
        : window.location.pathname
    window.history.replaceState(null, '', nextUrl)
  }

  const openDashboardView = () => {
    setSelectedPanelView('dashboard')
    setPanelHash('dashboard')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const openBillingView = () => {
    setSelectedPanelView('billing')
    setSelectedBillingTab('all')
    setPanelHash('billing')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const openCommunicationView = () => {
    setSelectedPanelView('communication')
    setCommunicationPreferencesNotice('')
    setPanelHash('communication')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const openDashboardSection = (sectionId: string) => {
    setSelectedPanelView('dashboard')
    setPanelHash('dashboard')
    window.setTimeout(() => scrollToSection(sectionId), 40)
  }

  const handleBillingProfileUpdate = () => {
    setBillingProfileDraft(createBillingProfileDraft(dashboard))
    setBillingProfileError('')
    setIsBillingProfileModalOpen(true)
  }

  const closeBillingProfileModal = () => {
    if (billingProfileSaving) {
      return
    }

    setIsBillingProfileModalOpen(false)
    setBillingProfileError('')
  }

  const saveBillingProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      setBillingProfileError('Company session expired. Please sign in again and retry.')
      return
    }

    setBillingProfileSaving(true)
    setBillingProfileError('')
    setActionMessage('')

    try {
      const response = await fetch('/api/labour/company/billing-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(billingProfileDraft)
      })

      const data = await response.json().catch(() => ({ error: 'Failed to save billing profile.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save billing profile.')
      }

      const nextDashboard = data.dashboard as CompanyDashboard
      setDashboard(nextDashboard)
      localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(nextDashboard.profile))
      setIsBillingProfileModalOpen(false)
      setActionMessage('Billing profile updated successfully.')
    } catch (billingProfileUpdateError) {
      setBillingProfileError(
        billingProfileUpdateError instanceof Error
          ? billingProfileUpdateError.message
          : 'Failed to save billing profile.'
      )
    } finally {
      setBillingProfileSaving(false)
    }
  }

  const saveCommunicationPreferences = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      setCommunicationPreferencesError('Company session expired. Please sign in again and retry.')
      return
    }

    setCommunicationPreferencesSaving(true)
    setCommunicationPreferencesError('')
    setCommunicationPreferencesNotice('')

    try {
      const response = await fetch('/api/labour/company/communication-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappConsents: communicationPreferencesDraft,
          whatsappConsentTextVersion: WHATSAPP_CONSENT_TEXT_VERSION,
        }),
      })

      const data = await response.json().catch(() => ({
        error: 'Failed to save communication preferences.',
      }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save communication preferences.')
      }

      applyCommunicationPreferences(data.preferences as CompanyCommunicationPreferences)
      setCommunicationPreferencesNotice('Communication preferences updated successfully.')
    } catch (preferencesError) {
      setCommunicationPreferencesError(
        preferencesError instanceof Error
          ? preferencesError.message
          : 'Failed to save communication preferences.',
      )
    } finally {
      setCommunicationPreferencesSaving(false)
    }
  }

  const updateStatus = async (applicationId: string, status: 'reviewed' | 'shortlisted' | 'rejected' | 'hired') => {
    setSubmitting(true)
    setActiveApplicationId(applicationId)
    setError('')
    setActionMessage('')

    try {
      const data = await persistApplicationUpdate({ applicationId, status })
      setActionMessage(
        data.message || `Candidate moved to ${status === 'shortlisted' ? 'Shortlisted' : status === 'rejected' ? 'Rejected' : status}.`
      )
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update worker application.')
    } finally {
      setSubmitting(false)
      setActiveApplicationId(null)
    }
  }

  const openApplicationNoteModal = (applicationId: string, currentNote: string) => {
    setActiveApplicationId(applicationId)
    setApplicationNoteDraft(currentNote)
    setApplicationNoteError('')
    setIsApplicationNoteModalOpen(true)
  }

  const closeApplicationNoteModal = (force = false) => {
    if (applicationNoteSaving && !force) return
    setIsApplicationNoteModalOpen(false)
    setActiveApplicationId(null)
    setApplicationNoteDraft('')
    setApplicationNoteError('')
  }

  const saveApplicationNote = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token || !activeApplicationId) {
      setApplicationNoteError('Company session expired. Please sign in again and retry.')
      return
    }

    setApplicationNoteSaving(true)
    setApplicationNoteError('')
    setError('')
    setActionMessage('')

    try {
      const applicant = findApplicantByApplicationId(activeApplicationId)
      const nextStatus = applicant && normalizeApplicantWorkflowStatus(applicant.status) === 'submitted'
        ? 'reviewed'
        : undefined

      await persistApplicationUpdate({
        applicationId: activeApplicationId,
        note: applicationNoteDraft,
        status: nextStatus
      })
      setActionMessage(applicationNoteDraft.trim() ? 'Application note saved successfully.' : 'Application note cleared successfully.')
      closeApplicationNoteModal(true)
    } catch (noteError) {
      setApplicationNoteError(noteError instanceof Error ? noteError.message : 'Failed to save application note.')
    } finally {
      setApplicationNoteSaving(false)
    }
  }

  const handleCandidateContactReveal = async (applicationId: string) => {
    toggleContactReveal(applicationId)
    setError('')

    try {
      await markApplicationReviewedIfNeeded(applicationId)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to update worker application.')
    }
  }

  const handleCandidateWhatsAppClick = async (applicant: CompanyApplicant) => {
    if (!applicant.canContactDirectly || !applicant.mobile) {
      return
    }

    setError('')

    try {
      await markApplicationReviewedIfNeeded(applicant.applicationId)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to update worker application.')
    }
  }

  const pendingApplications = useMemo(() => {
    if (!dashboard) return []
    return dashboard.recentApplications.filter(applicant => applicant.status === 'submitted')
  }, [dashboard])

  const currentJobPostingPlan = dashboard?.currentJobPostingPlan || null
  const billingHistoryRecords = useMemo(() => resolveCompanyBillingHistory(dashboard), [dashboard])

  const filteredBillingHistory = useMemo(() => {
    if (selectedBillingTab === 'all') {
      return billingHistoryRecords
    }

    return billingHistoryRecords.filter(record => record.statusType === selectedBillingTab)
  }, [billingHistoryRecords, selectedBillingTab])

  const companyInitials = useMemo(() => {
    if (!dashboard?.profile.companyName) return 'SV'
    return dashboard.profile.companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('')
  }, [dashboard?.profile.companyName])

  const heroTitleParts = useMemo(() => {
    const fullTitle = content.hero.title || ''
    const highlighted = content.hero.highlightedText || ''

    if (!highlighted || !fullTitle.includes(highlighted)) {
      return { leading: fullTitle, highlighted: '' }
    }

    return {
      leading: fullTitle.replace(highlighted, '').trim(),
      highlighted
    }
  }, [content.hero.highlightedText, content.hero.title])

  const panelHeaderCopy = useMemo(() => {
    const panelTitle = content.header.panelTitle?.trim() || 'Company Panel'
    const panelSubtitle = content.header.panelSubtitle?.trim() || ''

    if (/^manage your hiring workflow[, ]/i.test(panelSubtitle)) {
      const remainder = panelSubtitle
        .replace(/^manage your hiring workflow,?\s*/i, '')
        .replace(/\.$/, '')

      return {
        eyebrow: panelTitle,
        title: 'Manage your hiring workflow',
        subtitle: remainder ? `Track ${remainder}.` : ''
      }
    }

    return {
      eyebrow: panelTitle,
      title: panelTitle,
      subtitle: panelSubtitle
    }
  }, [content.header.panelSubtitle, content.header.panelTitle])

  const quickActionItems = useMemo(() => {
    const defaults = [
      {
        title: 'Post New Requirement',
        description: 'Post a new job and find the right worker'
      },
      {
        title: 'Browse Workers',
        description: 'Search and filter workers as per your need'
      },
      {
        title: 'View All Applications',
        description: 'Review applications for your job posts'
      },
      {
        title: 'Shortlisted Workers',
        description: 'Manage shortlisted worker profiles'
      },
      {
        title: 'Hired Workers',
        description: 'View and manage your hired workforce'
      }
    ]

    return defaults.map((fallback, index) => ({
      title: content.quickActions.items[index]?.title || fallback.title,
      description: content.quickActions.items[index]?.description || fallback.description
    }))
  }, [content.quickActions.items])

  const billingPanelCopy = useMemo(() => ({
    eyebrow: content.sidebar.billingPlanLabel || 'Billing & Plan',
    title: 'Billing',
    subtitle: 'Review GST details, payment history, and invoices from one place.'
  }), [content.sidebar.billingPlanLabel])

  const billingProfileName = useMemo(
    () => dashboard?.profile.companyName?.trim() || dashboard?.profile.contactPerson?.trim() || 'Company account holder',
    [dashboard?.profile.companyName, dashboard?.profile.contactPerson]
  )

  const billingProfileAddress = useMemo(
    () => buildBillingAddress(dashboard?.profile || {}) || 'Address not added',
    [dashboard?.profile]
  )

  const billingProfileGstin = useMemo(
    () => dashboard?.profile.gstNumber?.trim() || 'Not added',
    [dashboard?.profile.gstNumber]
  )

  const billingProfileStatus = useMemo(() => {
    if (dashboard?.profile.status === 'blocked') {
      return 'Review required'
    }

    return 'Verified'
  }, [dashboard?.profile.status])

  const latestJobs = useMemo(() => dashboard?.jobs.slice(0, 4) ?? [], [dashboard])

  const recentApplicationItems = useMemo(() => {
    if (!dashboard) return []

    return dashboard.jobs
      .flatMap(job =>
        job.applicants.map(applicant => ({
          ...applicant,
          jobId: job.id,
          jobTitle: job.title,
          jobLocation: job.city
        }))
      )
      .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))
      .slice(0, 5)
  }, [dashboard])

  const jobLookup = useMemo(
    () => new Map((dashboard?.jobs || []).map(job => [job.id, job])),
    [dashboard]
  )

  const findApplicantByApplicationId = (applicationId: string) => {
    if (!dashboard) return null

    for (const job of dashboard.jobs) {
      const applicant = job.applicants.find(item => item.applicationId === applicationId)
      if (applicant) {
        return applicant
      }
    }

    return null
  }

  const persistApplicationUpdate = async (payload: { applicationId: string, status?: ApplicantWorkflowStatus, note?: string | null }) => {
    if (!token) {
      throw new Error('Company session expired. Please sign in again and retry.')
    }

    const response = await fetch('/api/labour/company/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json().catch(() => ({ error: 'Failed to update worker application.' }))
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update worker application.')
    }

    setDashboard(data.dashboard as CompanyDashboard)
    return data as { dashboard: CompanyDashboard, message?: string }
  }

  const markApplicationReviewedIfNeeded = async (applicationId: string) => {
    const applicant = findApplicantByApplicationId(applicationId)
    if (!applicant) return
    if (normalizeApplicantWorkflowStatus(applicant.status) !== 'submitted') return

    await persistApplicationUpdate({
      applicationId,
      status: 'reviewed'
    })
  }

  const totalJobPosts = dashboard?.jobs.length ?? 0
  const selectedDashboardJob = useMemo(
    () => jobId ? dashboard?.jobs.find(job => job.id === jobId) ?? null : null,
    [dashboard, jobId]
  )
  const detailApplicants = useMemo(() => {
    if (!selectedDashboardJob) return []

    const items = selectedDashboardJob.applicants
      .filter(applicant => selectedStatus === 'all' ? true : normalizeApplicantWorkflowStatus(applicant.status) === selectedStatus)
      .filter(applicant => detailFilters.contactOnly ? applicant.canContactDirectly : true)
      .filter(applicant => detailFilters.withSkills ? applicant.skills.length > 0 : true)
      .filter(applicant => detailFilters.withNote ? Boolean(applicant.note) : true)

    const sorted = [...items]
    if (sortBy === 'wage-high') {
      sorted.sort((left, right) => right.expectedDailyWage - left.expectedDailyWage)
    } else if (sortBy === 'experience-high') {
      sorted.sort((left, right) => right.experienceYears - left.experienceYears)
    } else {
      sorted.sort((left, right) => new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime())
    }

    return sorted
  }, [detailFilters.contactOnly, detailFilters.withNote, detailFilters.withSkills, selectedDashboardJob, selectedStatus, sortBy])

  const openCompanyIntake = (job: CompanyJob, intent: 'duplicate' | 'edit') => {
    setActionMessage(intent === 'duplicate'
      ? `${job.title} is ready to repost from the company requirement page.`
      : `${job.title} can be updated from the company requirement page.`)
    setOpenJobMenuId(null)

    if (typeof window !== 'undefined') {
      const nextUrl = intent === 'duplicate'
        ? `/labour/company/job-post?duplicate=${encodeURIComponent(job.id)}`
        : `/labour/company/job-post?edit=${encodeURIComponent(job.id)}`
      window.open(nextUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const buildJobShareMessage = (job: CompanyJob) => {
    const siteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/labour/company/search`
      : 'https://www.scalevyapar.in/labour/company/search'

    return [
      truncateJobTitle(job.title, 12),
      `Location: ${job.city}`,
      `Salary: ${formatCurrency(job.wageAmount)}`,
      `Workers needed: ${job.workersNeeded}`,
      'Explore more worker hiring on ScaleVyapar Rozgar',
      siteUrl
    ].join('\n')
  }

  const shareJob = async (job: CompanyJob, channel: 'whatsapp' | 'facebook' | 'instagram') => {
    const shareText = buildJobShareMessage(job)
    const siteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/labour/company/search`
      : 'https://www.scalevyapar.in/labour/company/search'
    setOpenJobMenuId(null)

    try {
      if (channel === 'instagram') {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareText)
        }
        if (typeof window !== 'undefined') {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
        }
        setActionMessage(`Copied ${job.title} details. Paste them into Instagram post or DM.`)
        return
      }

      if (channel === 'whatsapp' && typeof window !== 'undefined') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
        setActionMessage(`Opened WhatsApp sharing for ${job.title}.`)
        return
      }

      if (channel === 'facebook' && typeof window !== 'undefined') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}&quote=${encodeURIComponent(shareText)}`
        window.open(facebookUrl, '_blank', 'noopener,noreferrer')
        setActionMessage(`Opened Facebook sharing for ${job.title}.`)
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
        setActionMessage(`Copied ${job.title} details for sharing.`)
        return
      }
    } catch {
      // Fallback message below.
    }

    setActionMessage(`Share ${job.title} from the company panel.`)
  }

  const expireJobNotice = (job: CompanyJob) => {
    setOpenJobMenuId(null)
    setActionMessage(`${job.title} expiry changes should be handled in worker admin right now.`)
  }

  const handleBillingAction = async (record: CompanyBillingRecord) => {
    if (record.actionType === 'retry') {
      if (record.retryHref) {
        router.push(record.retryHref)
        return
      }

      setActionMessage('Retry payment will be available after the original plan details are confirmed.')
      return
    }

    if (record.actionType === 'invoice') {
      if (!record.invoiceAvailable) {
        setActionMessage('Invoice will be available after payment confirmation.')
        return
      }

      setBillingActionLoadingId(record.id)
      setActionMessage('')

      try {
        const link = document.createElement('a')
        link.href = `/api/labour/company/invoice/${encodeURIComponent(record.id)}`
        link.download = `invoice-${record.id}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        setActionMessage(`Invoice download started for "${record.planDetails}".`)
      } catch (billingError) {
        setActionMessage(billingError instanceof Error ? billingError.message : 'Failed to download invoice.')
      } finally {
        window.setTimeout(() => setBillingActionLoadingId(null), 1200)
      }

      return
    }

    setActionMessage('Retry is not available for this billing entry yet. Please contact support for help.')
    router.push('/labour/company/contact')
  }

  const openJobDetailWindow = (job: CompanyJob) => {
    if (typeof window !== 'undefined') {
      window.open(`/labour/company/panel/${job.id}`, '_blank', 'noopener,noreferrer')
    }
  }

  const toggleContactReveal = (applicationId: string) => {
    setRevealedContacts(current => ({
      ...current,
      [applicationId]: !current[applicationId]
    }))
  }

  const scrollToSection = (sectionId: string) => {
    if (typeof document === 'undefined') return
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const downloadApplicantsCsv = (job: CompanyJob) => {
    const rows = [
      ['Name', 'City', 'Status', 'Availability', 'Expected Wage', 'Experience', 'Mobile'],
      ...detailApplicants.map(applicant => ([
        applicant.fullName,
        applicant.city,
        applicant.status,
        availabilityLabel(applicant.availability),
        String(applicant.expectedDailyWage),
        String(applicant.experienceYears),
        applicant.mobile || ''
      ]))
    ]

    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${job.title.replace(/\s+/g, '-').toLowerCase()}-candidates.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <section className={styles.card}>
        <p className={styles.sectionTitle}>Loading company panel...</p>
        <p className={styles.textMuted}>Fetching job posts and worker applications.</p>
      </section>
    )
  }

  if (!dashboard) {
    return (
      <section className={styles.splitGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Company panel</p>
          <h1 className={styles.pageTitle}>Receive worker applications in one place</h1>
          <p className={styles.textMuted} style={{ marginBottom: '20px' }}>
            Sign in with your registered company email address and password to open the company dashboard.
          </p>
          <form className={styles.stack} onSubmit={submitLogin}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Email address</span>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Enter your registered email address"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Password</span>
              <input
                type="password"
                value={identity}
                onChange={event => setIdentity(event.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
              />
            </label>
            <div className={styles.softCard} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 700 }}>Use the email address and password from your registered company account.</p>
            </div>
            {error ? (
              <div className={styles.softCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                <p style={{ margin: 0, color: '#b91c1c', fontWeight: 700 }}>{error}</p>
              </div>
            ) : null}
            <div className={styles.buttonRow}>
              <button
                type="submit"
                className={styles.primaryButton}
                style={{ background: '#2563eb', color: '#ffffff', border: '1px solid transparent', flex: '1 1 220px' }}
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                style={{ flex: '1 1 220px' }}
                onClick={() => router.push('/labour/company/company-registration')}
              >
                Register Company
              </button>
            </div>
          </form>
        </div>

        <div className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #374655, #202c39)' }}>
          <p className={styles.sectionTitle} style={{ color: '#ffffff', fontSize: '26px' }}>What companies can do here</p>
          <p className={styles.textMutedDark} style={{ marginBottom: '18px' }}>
            Use this company panel to manage hiring activity, review worker interest, and move every applicant through the next step from one place.
          </p>
          <div className={styles.stack}>
            {[
              'View every worker application per job post',
              'Shortlist, review, reject, or hire applicants',
              'See direct worker contact when the worker account is active',
              'Track recent applicant movement across live job posts',
              'Open each job separately and review matching worker profiles',
              'Monitor live, expired, and duplicated jobs from the same panel'
            ].map(item => (
              <div key={item} className={styles.bullet} style={{ color: '#ffffff' }}>
                <span className={styles.bulletDot} style={{ background: '#ffffff' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className={styles.stack} style={{ marginTop: '24px' }}>
            <div className={styles.softCard} style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.16)' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '14px', fontWeight: 700 }}>How access works</p>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.82)', fontSize: '13px', lineHeight: 1.7 }}>
                Sign in using the registered company email address and password saved for your company account.
              </p>
            </div>
            <div className={styles.softCard} style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.16)' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '14px', fontWeight: 700 }}>What to do next</p>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.82)', fontSize: '13px', lineHeight: 1.7 }}>
                Open the company panel for hiring activity, or use Register Company if you need to create a new company account first.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (jobId) {
    if (!selectedDashboardJob) {
      return (
        <section className={styles.card}>
          <div className={styles.buttonRow} style={{ marginBottom: '16px' }}>
            <button type="button" className={styles.secondaryButton} onClick={() => router.push('/labour/company/panel')}>
              Back to all jobs
            </button>
          </div>
          <p className={styles.sectionTitle}>Job not found</p>
          <p className={styles.textMuted}>This company job could not be found in the current dashboard.</p>
        </section>
      )
    }

    const statusCounts = {
      all: selectedDashboardJob.applicants.length,
      submitted: selectedDashboardJob.applicants.filter(applicant => normalizeApplicantWorkflowStatus(applicant.status) === 'submitted').length,
      reviewed: selectedDashboardJob.applicants.filter(applicant => normalizeApplicantWorkflowStatus(applicant.status) === 'reviewed').length,
      shortlisted: selectedDashboardJob.applicants.filter(applicant => normalizeApplicantWorkflowStatus(applicant.status) === 'shortlisted').length,
      rejected: selectedDashboardJob.applicants.filter(applicant => normalizeApplicantWorkflowStatus(applicant.status) === 'rejected').length
    }

    return (
      <section className={styles.companyPanelDetailPage}>
        <div className={styles.companyPanelDetailTopbar}>
          <div className={styles.companyPanelDetailTopbarLeft}>
            <button type="button" className={styles.companyPanelBackButton} onClick={() => router.push('/labour/company/panel')}>
              Back
            </button>
            <p className={styles.companyPanelDetailTitle}>{selectedDashboardJob.title}</p>
            <span className={styles.chip} style={statusTone(selectedDashboardJob.status)}>
              {companyJobStatusLabel(selectedDashboardJob.status)}
            </span>
            <span className={styles.companyPanelDetailMeta}>{selectedDashboardJob.city}</span>
            <button
              type="button"
              className={styles.companyPanelDetailEditLink}
              onClick={() => openCompanyIntake(selectedDashboardJob, 'edit')}
            >
              Edit
            </button>
          </div>

          <div className={styles.companyPanelDetailTopbarRight}>
            <button type="button" className={styles.companyPanelDetailMatchLink}>
              See Database Matches ({selectedDashboardJob.applicants.length})
            </button>
            <button
              type="button"
              className={styles.companyPanelMenuButton}
              onClick={() => setOpenJobMenuId(current => current === selectedDashboardJob.id ? null : selectedDashboardJob.id)}
            >
              ...
            </button>
            {openJobMenuId === selectedDashboardJob.id ? (
              <div className={styles.companyPanelMenu}>
                <button type="button" className={styles.companyPanelMenuItem} onClick={() => openCompanyIntake(selectedDashboardJob, 'duplicate')}>
                  Duplicate
                </button>
                <button type="button" className={styles.companyPanelMenuItem} onClick={() => openCompanyIntake(selectedDashboardJob, 'edit')}>
                  Edit job
                </button>
                <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(selectedDashboardJob, 'whatsapp')}>
                  Share on WhatsApp
                </button>
                <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(selectedDashboardJob, 'facebook')}>
                  Share on Facebook
                </button>
                <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(selectedDashboardJob, 'instagram')}>
                  Share on Instagram
                </button>
                <button type="button" className={`${styles.companyPanelMenuItem} ${styles.companyPanelMenuItemDanger}`} onClick={() => expireJobNotice(selectedDashboardJob)}>
                  Expire job
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.companyPanelDetailLayout}>
          <aside className={styles.companyPanelDetailFilters}>
            <div className={styles.companyPanelDetailFiltersHeader}>
              <p className={styles.companyPanelDetailFiltersTitle}>Filters</p>
              <button
                type="button"
                className={styles.companyPanelDetailClear}
                onClick={() => {
                  setDetailFilters({ contactOnly: false, withSkills: false, withNote: false })
                  setSelectedStatus('all')
                }}
              >
                Clear all
              </button>
            </div>

            <div className={styles.companyPanelDetailFilterGroup}>
              <p className={styles.companyPanelDetailFilterLabel}>Show candidates who</p>
              <label className={styles.companyPanelDetailCheckbox}>
                <input
                  type="checkbox"
                  checked={detailFilters.contactOnly}
                  onChange={event => setDetailFilters(current => ({ ...current, contactOnly: event.target.checked }))}
                />
                <span>Can be contacted directly</span>
              </label>
              <label className={styles.companyPanelDetailCheckbox}>
                <input
                  type="checkbox"
                  checked={detailFilters.withSkills}
                  onChange={event => setDetailFilters(current => ({ ...current, withSkills: event.target.checked }))}
                />
                <span>Have skills added</span>
              </label>
              <label className={styles.companyPanelDetailCheckbox}>
                <input
                  type="checkbox"
                  checked={detailFilters.withNote}
                  onChange={event => setDetailFilters(current => ({ ...current, withNote: event.target.checked }))}
                />
                <span>Have application note</span>
              </label>
            </div>

            <div className={styles.companyPanelDetailFilterGroup}>
              <p className={styles.companyPanelDetailFilterLabel}>Applied in</p>
              <div className={styles.companyPanelDetailStatusList}>
                {[
                  { label: 'All candidates', value: 'all' },
                  { label: 'Action pending', value: 'submitted' },
                  { label: 'Reviewed', value: 'reviewed' },
                  { label: 'Shortlisted', value: 'shortlisted' },
                  { label: 'Rejected', value: 'rejected' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    className={selectedStatus === item.value ? styles.companyPanelDetailStatusButtonActive : styles.companyPanelDetailStatusButton}
                    onClick={() => setSelectedStatus(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.companyPanelDetailMain}>
            <div className={styles.companyPanelDetailStatsRow}>
              {[
                { label: 'All candidates', value: statusCounts.all, key: 'all' },
                { label: 'Action Pending', value: statusCounts.submitted, key: 'submitted' },
                { label: 'Reviewed', value: statusCounts.reviewed, key: 'reviewed' },
                { label: 'Shortlisted', value: statusCounts.shortlisted, key: 'shortlisted' },
                { label: 'Rejected', value: statusCounts.rejected, key: 'rejected' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={selectedStatus === item.key ? styles.companyPanelDetailStatCardActive : styles.companyPanelDetailStatCard}
                  onClick={() => setSelectedStatus(item.key)}
                >
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </button>
              ))}

              <div className={styles.companyPanelDetailSort}>
                <span>Sort By:</span>
                <select value={sortBy} onChange={event => setSortBy(event.target.value as 'recent' | 'wage-high' | 'experience-high')}>
                  <option value="recent">Recent</option>
                  <option value="wage-high">Highest wage</option>
                  <option value="experience-high">Experience</option>
                </select>
              </div>
            </div>

            <div className={styles.companyPanelDetailToolbar}>
              <p className={styles.textMuted}>Showing {detailApplicants.length} candidates</p>
              <button type="button" className={styles.companyPanelDetailDownload} onClick={() => downloadApplicantsCsv(selectedDashboardJob)}>
                Download Excel
              </button>
            </div>

            {actionMessage ? (
              <div className={styles.companyPanelActionNotice}>
                <p style={{ margin: 0 }}>{actionMessage}</p>
              </div>
            ) : null}

            <div className={styles.companyPanelDetailList}>
              {detailApplicants.length === 0 ? (
                <div className={styles.softCard}>
                  <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>No candidates match the current filters.</p>
                </div>
              ) : detailApplicants.map(applicant => (
                <article key={applicant.applicationId} className={styles.companyPanelDetailCandidateCard}>
                  <div className={styles.companyPanelDetailCandidateHeader}>
                    <div>
                      <div className={styles.companyPanelDetailCandidateTitleRow}>
                        <p className={styles.companyPanelApplicantName}>{applicant.fullName}</p>
                        <button type="button" className={styles.companyPanelDetailProfileLink}>
                          View full profile
                        </button>
                      </div>
                      <p className={styles.textMuted}>
                        {applicant.city} | {applicant.experienceYears} yrs | {formatCurrency(applicant.expectedDailyWage)} / day
                      </p>
                    </div>
                    <span className={styles.companyPanelDetailMatchedBadge}>Matched</span>
                  </div>

                  <div className={styles.companyPanelDetailMatchPanel}>
                    <span className={styles.companyPanelDetailMatchLabel}>Matching :</span>
                    <div className={styles.companyPanelDetailMatchChips}>
                      {[
                        applicant.skills.length ? 'Skills' : null,
                        applicant.experienceYears > 0 ? 'Work Experience' : null,
                        applicant.categoryLabels.length ? 'Category Match' : null,
                        applicant.expectedDailyWage > 0 ? 'Salary' : null,
                        applicant.availability ? 'Availability' : null
                      ].filter(Boolean).map(label => (
                        <span key={label} className={styles.companyPanelDetailMatchChip}>{label}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.companyPanelDetailCandidateMeta}>
                    <span><strong>Skills</strong> {applicant.skills.length ? applicant.skills.join(' | ') : 'Not added'}</span>
                    <span><strong>Categories</strong> {applicant.categoryLabels.join(' | ') || 'Not mapped'}</span>
                    <span><strong>Availability</strong> {availabilityLabel(applicant.availability)}</span>
                    <span><strong>Note</strong> {applicant.note || 'No note added yet'}</span>
                  </div>

                  <div className={styles.companyPanelDetailCandidateActions}>
                    <div className={styles.companyPanelDetailContactRow}>
                      <button
                        type="button"
                        className={styles.companyPanelDetailContactButton}
                        onClick={() => handleCandidateContactReveal(applicant.applicationId)}
                      >
                        {revealedContacts[applicant.applicationId] && applicant.canContactDirectly
                          ? (applicant.mobile || 'Unavailable')
                          : 'View Number'}
                      </button>
                      <a
                        href={applicant.canContactDirectly && applicant.mobile ? `https://wa.me/91${applicant.mobile}` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.companyPanelDetailWhatsappButton}
                        onClick={() => handleCandidateWhatsAppClick(applicant)}
                      >
                        WhatsApp
                      </a>
                    </div>

                    <div className={styles.companyPanelDetailDecisionRow}>
                      <button type="button" className={styles.companyPanelDetailRejectButton} onClick={() => updateStatus(applicant.applicationId, 'rejected')}>
                        {submitting && activeApplicationId === applicant.applicationId ? 'Saving...' : 'Reject'}
                      </button>
                      <button type="button" className={styles.companyPanelDetailShortlistButton} onClick={() => updateStatus(applicant.applicationId, 'shortlisted')}>
                        {submitting && activeApplicationId === applicant.applicationId ? 'Saving...' : 'Shortlist'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.companyPanelDetailFooter}>
                    <span>Applied {formatDateTime(applicant.appliedAt)}</span>
                    <button
                      type="button"
                      className={styles.companyPanelDetailNoteButton}
                      onClick={() => openApplicationNoteModal(applicant.applicationId, applicant.note)}
                    >
                      Add a note
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {isApplicationNoteModalOpen ? (
          <div className={styles.companyBillingModalBackdrop} onClick={() => closeApplicationNoteModal()}>
            <div
              className={styles.companyBillingModalCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="company-application-note-title"
              onClick={event => event.stopPropagation()}
            >
              <div className={styles.companyBillingModalHeader}>
                <div>
                  <h3 id="company-application-note-title" className={styles.companyDashboardSectionTitle}>Add a note</h3>
                  <p className={styles.companyDashboardSectionText}>
                    Save a note for this applicant so your hiring team can review it later.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.companyBillingModalClose}
                  onClick={() => closeApplicationNoteModal()}
                  aria-label="Close application note form"
                >
                  <X size={18} />
                </button>
              </div>

              <form className={styles.companyBillingModalForm} onSubmit={saveApplicationNote}>
                <label className={styles.companyBillingField}>
                  <span>Applicant note</span>
                  <textarea
                    className={styles.companyBillingInput}
                    value={applicationNoteDraft}
                    onChange={event => setApplicationNoteDraft(event.target.value)}
                    placeholder="Add an interview note, follow-up detail, or rejection reason."
                    rows={5}
                    style={{ minHeight: 132, resize: 'vertical' }}
                  />
                  <p className={styles.companyBillingFieldHint}>
                    Leave blank if you do not want to save any note for this application.
                  </p>
                </label>

                {applicationNoteError ? (
                  <p className={styles.companyBillingFieldError}>{applicationNoteError}</p>
                ) : null}

                <div className={styles.companyBillingModalActions}>
                  <button type="button" className={styles.companyPanelDetailNoteButton} onClick={() => closeApplicationNoteModal()}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.companyBillingProfileButton} disabled={applicationNoteSaving}>
                    {applicationNoteSaving ? 'Saving...' : 'Save note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <>
      <section className={styles.companyDashboardShell}>
        <aside className={styles.companyDashboardSidebar}>
          <div id="company-profile" className={styles.companyDashboardSidebarBrand}>
            <span className={styles.companyDashboardSidebarMark}>SV</span>
            <div>
              <p className={styles.companyDashboardSidebarBrandTitle}>{content.header.sidebarBrandLabel}</p>
              <p className={styles.companyDashboardSidebarBrandMeta}>{content.header.sidebarSubtitle}</p>
            </div>
          </div>

          <nav className={styles.companyDashboardSidebarNav}>
            <button
              type="button"
              className={`${styles.companyDashboardSidebarItem} ${selectedPanelView === 'dashboard' ? styles.companyDashboardSidebarItemActive : ''}`}
              onClick={openDashboardView}
            >
              <span className={styles.companyDashboardSidebarIcon}>D</span>
              <span>{content.sidebar.dashboardLabel}</span>
            </button>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => openDashboardSection('recent-job-posts')}>
              <span className={styles.companyDashboardSidebarIcon}>J</span>
              <span>{content.sidebar.jobRequirementsLabel}</span>
            </button>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => openDashboardSection('recent-applications')}>
              <span className={styles.companyDashboardSidebarIcon}>A</span>
              <span>{content.sidebar.applicationsLabel}</span>
            </button>
            <button
              type="button"
              className={styles.companyDashboardSidebarItem}
              onClick={() => {
                openDashboardSection('recent-applications')
              }}
            >
              <span className={styles.companyDashboardSidebarIcon}>S</span>
              <span>{content.sidebar.shortlistedLabel}</span>
            </button>
            <button
              type="button"
              className={styles.companyDashboardSidebarItem}
              onClick={() => {
                openDashboardSection('recent-applications')
              }}
            >
              <span className={styles.companyDashboardSidebarIcon}>H</span>
              <span>{content.sidebar.hiredWorkersLabel}</span>
            </button>
            <a href="/labour/company/search" className={styles.companyDashboardSidebarItem}>
              <span className={styles.companyDashboardSidebarIcon}>W</span>
              <span>{content.sidebar.searchWorkersLabel}</span>
            </a>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={handleBillingProfileUpdate}>
              <span className={styles.companyDashboardSidebarIcon}>P</span>
              <span>{content.sidebar.companyProfileLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.companyDashboardSidebarItem} ${selectedPanelView === 'billing' ? styles.companyDashboardSidebarItemActive : ''}`}
              onClick={openBillingView}
            >
              <span className={styles.companyDashboardSidebarIcon}>B</span>
              <span>{content.sidebar.billingPlanLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.companyDashboardSidebarItem} ${selectedPanelView === 'communication' ? styles.companyDashboardSidebarItemActive : ''}`}
              onClick={openCommunicationView}
            >
              <span className={styles.companyDashboardSidebarIcon}>C</span>
              <span>WhatsApp Preferences</span>
            </button>
            <a href="/labour/company/contact" className={styles.companyDashboardSidebarItem}>
              <span className={styles.companyDashboardSidebarIcon}>M</span>
              <span>{content.sidebar.messagesLabel}</span>
            </a>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => openDashboardSection('need-help')}>
              <span className={styles.companyDashboardSidebarIcon}>T</span>
              <span>{content.sidebar.settingsLabel}</span>
            </button>
          </nav>

          <div className={styles.companyDashboardSidebarUpgrade}>
            <p className={styles.companyDashboardSidebarUpgradeTitle}>{content.upgradeCard.title}</p>
            <p className={styles.companyDashboardSidebarUpgradeText}>
              {content.upgradeCard.description}
            </p>
            <a href="/labour/company/pricing" className={styles.companyDashboardSidebarUpgradeButton}>
              {content.upgradeCard.buttonLabel}
            </a>
          </div>

          <button type="button" className={styles.companyDashboardSidebarLogout} onClick={handleLogout}>
            Log out
          </button>
        </aside>

        <div className={styles.companyDashboardMain}>
          <section id="dashboard-top" className={styles.companyDashboardTopbar}>
            <div className={styles.companyDashboardTopbarIdentity}>
              <span className={styles.companyDashboardTopbarAvatar}>{companyInitials}</span>
              <div>
                <div className={styles.companyDashboardTopbarTitleRow}>
                  <h1 className={styles.companyDashboardTopbarTitle}>{dashboard.profile.companyName}</h1>
                  {dashboard.profile.status === 'active' ? (
                    <span className={styles.companyDashboardVerifiedBadge}>Verified</span>
                  ) : null}
                </div>
                <p className={styles.companyDashboardTopbarMeta}>
                  {[dashboard.profile.city, dashboard.profile.state, dashboard.profile.activePlan].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>

            <div className={styles.companyDashboardTopbarUtilities}>
              <span className={styles.companyDashboardTopbarNotice}>Pending reviews: {pendingApplications.length}</span>
              <a href="/labour/company/contact" className={styles.companyDashboardTopbarHelp}>
                Help
              </a>
              <span className={styles.companyDashboardTopbarAvatarSmall}>{companyInitials}</span>
            </div>
          </section>

          {selectedPanelView === 'dashboard' ? (
            <>
          <div className={styles.companyDashboardActionRow}>
            <div>
              <p className={styles.eyebrow}>{panelHeaderCopy.eyebrow}</p>
              <h2 className={styles.companyDashboardPageTitle}>{panelHeaderCopy.title}</h2>
              {panelHeaderCopy.subtitle ? (
                <p className={styles.companyDashboardPageText}>{panelHeaderCopy.subtitle}</p>
              ) : null}
            </div>
            <div className={styles.companyDashboardHeaderButtons}>
              <a href="/labour/company/job-post" className={styles.companyDashboardPrimaryButton}>
                {content.actions.postNewRequirementLabel}
              </a>
              <a href="/labour/company/search" className={styles.companyDashboardSecondaryButton}>
                {content.actions.browseWorkersLabel}
              </a>
            </div>
          </div>

          <section className={styles.companyDashboardHero}>
            <div className={styles.companyDashboardHeroContent}>
              <p className={styles.eyebrow}>{content.hero.eyebrow}</p>
              <h2 className={styles.companyDashboardHeroTitle}>
                {heroTitleParts.leading} {heroTitleParts.highlighted ? <span>{heroTitleParts.highlighted}</span> : null}
              </h2>
              <p className={styles.companyDashboardHeroText}>
                {content.hero.description}
              </p>
              <div className={styles.companyDashboardHeroChips}>
                <div className={styles.companyDashboardHeroChipGroup}>
                  <span className={styles.companyDashboardHeroChip}>{content.hero.featureChip1Title}</span>
                  <small>{content.hero.featureChip1Description}</small>
                </div>
                <div className={styles.companyDashboardHeroChipGroup}>
                  <span className={styles.companyDashboardHeroChip}>{content.hero.featureChip2Title}</span>
                  <small>{content.hero.featureChip2Description}</small>
                </div>
              </div>
            </div>

            <div className={styles.companyDashboardHeroMedia}>
              <img
                src={content.hero.imageSrc || '/worker-hero-reference.png'}
                alt="Skilled workers at work"
                className={styles.companyDashboardHeroImage}
              />
              <div className={styles.companyDashboardHeroFloatingCard}>
                <p className={styles.companyDashboardHeroFloatingTitle}>{content.hero.trustCardTitle}</p>
                <p className={styles.companyDashboardHeroFloatingMeta}>{content.hero.trustCardSubtitle}</p>
                <div className={styles.companyDashboardHeroFloatingFooter}>
                  <span className={styles.companyDashboardHeroFloatingFaces}>AA • RK • SM • IP</span>
                  <span className={styles.companyDashboardHeroFloatingRating}>{content.hero.trustRatingText}</span>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className={styles.companyPanelActionNotice}>
              <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
            </div>
          ) : null}

          {actionMessage ? (
            <div className={styles.companyPanelActionNotice}>
              <p style={{ margin: 0 }}>{actionMessage}</p>
            </div>
          ) : null}

          <section className={styles.companyDashboardStatsGrid}>
            {[
              {
                label: content.stats.totalJobPostsLabel,
                value: totalJobPosts,
                description: content.stats.totalJobPostsDescription
              },
              {
                label: content.stats.activeJobPostsLabel,
                value: dashboard.stats.liveJobPosts,
                description: content.stats.activeJobPostsDescription
              },
              {
                label: content.stats.totalApplicationsLabel,
                value: dashboard.stats.totalApplications,
                description: content.stats.totalApplicationsDescription
              },
              {
                label: content.stats.shortlistedLabel,
                value: dashboard.stats.shortlistedApplications,
                description: content.stats.shortlistedDescription
              }
            ].map((item, index) => (
              <article key={item.label} className={styles.companyDashboardStatCard}>
                <span className={styles.companyDashboardStatIcon}>{['J', 'L', 'A', 'S'][index]}</span>
                <p className={styles.companyDashboardStatLabel}>{item.label}</p>
                <strong className={styles.companyDashboardStatValue}>{item.value}</strong>
                <p className={styles.companyDashboardStatDescription}>{item.description}</p>
                <button
                  type="button"
                  className={styles.companyDashboardStatLink}
                  onClick={() => scrollToSection(index < 2 ? 'recent-job-posts' : 'recent-applications')}
                >
                  View All
                </button>
              </article>
            ))}
          </section>

          <section id="recent-job-posts" className={styles.companyDashboardSectionCard}>
            <div className={styles.companyDashboardSectionHeader}>
              <div>
                <h3 className={styles.companyDashboardSectionTitle}>{content.recentJobs.title}</h3>
                <p className={styles.companyDashboardSectionText}>Your latest worker requirements and their current hiring progress.</p>
              </div>
              <button type="button" className={styles.companyDashboardSectionLink} onClick={() => scrollToSection('recent-job-posts')}>
                {content.recentJobs.viewAllLabel}
              </button>
            </div>

            {latestJobs.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                  {content.recentJobs.emptyTitle} {content.recentJobs.emptyDescription}
                </p>
              </div>
            ) : (
              <div className={styles.companyDashboardJobList}>
                {latestJobs.map(job => (
                  <article
                    key={job.id}
                    className={`${styles.companyDashboardJobRow} ${openJobMenuId === job.id ? styles.companyDashboardJobRowMenuOpen : ''}`}
                  >
                    <div className={styles.companyDashboardJobRowMain}>
                      <button
                        type="button"
                        className={styles.companyDashboardJobMainButton}
                        onClick={() => openJobDetailWindow(job)}
                      >
                        <div className={styles.companyDashboardJobIdentityCompact}>
                          <div className={styles.companyDashboardJobTitleWrap}>
                            <p className={styles.companyDashboardJobTitle}>{truncateJobTitle(job.title, 8)}</p>
                            <span className={styles.companyPanelJobStatusChip} style={statusTone(job.status)}>
                              {companyJobStatusLabel(job.status)}
                            </span>
                          </div>
                          <div className={styles.companyDashboardJobMetaStack}>
                            <p className={styles.companyDashboardJobMeta}>
                              {optionalText(job.locationLabel) || job.city || 'Location not added'}
                            </p>
                            <p className={styles.companyDashboardJobMeta}>
                              Posted on {formatDate(job.publishedAt)}
                            </p>
                            <p className={styles.companyDashboardJobMeta}>
                              {job.status === 'expired' ? 'Expired on' : 'Live until'} {formatDate(job.expiresAt)}
                            </p>
                            {optionalText(dashboard.profile.contactPerson) ? (
                              <p className={styles.companyDashboardJobMeta}>
                                Posted by {dashboard.profile.contactPerson}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>

                      <div className={styles.companyDashboardJobStatsCompact}>
                        <div className={styles.companyDashboardJobMetricCompact}>
                          <strong>{job.totalApplications || 0}</strong>
                          <span>Applied to job</span>
                        </div>
                        <div className={styles.companyDashboardJobMetricCompact}>
                          <strong>{job.applicants.length || 0}</strong>
                          <span>Database Matches</span>
                        </div>
                      </div>

                      <div className={styles.companyDashboardJobActionsCompact}>
                        {job.status === 'expired' ? (
                          <button
                            type="button"
                            className={styles.companyDashboardJobRepostButton}
                            onClick={() => openCompanyIntake(job, 'duplicate')}
                          >
                            Repost now
                          </button>
                        ) : null}

                        <div className={styles.companyPanelMenuWrap}>
                          <button
                            type="button"
                            className={styles.companyDashboardMoreButton}
                            onClick={() => setOpenJobMenuId(current => current === job.id ? null : job.id)}
                            aria-label={`Open actions for ${job.title}`}
                          >
                            ...
                          </button>
                          {openJobMenuId === job.id ? (
                            <div className={styles.companyPanelMenu}>
                              <button type="button" className={styles.companyPanelMenuItem} onClick={() => openJobDetailWindow(job)}>
                                View details
                              </button>
                              <button type="button" className={styles.companyPanelMenuItem} onClick={() => openCompanyIntake(job, 'edit')}>
                                Edit job
                              </button>
                              <button type="button" className={styles.companyPanelMenuItem} onClick={() => openCompanyIntake(job, 'duplicate')}>
                                Duplicate
                              </button>
                              <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(job, 'whatsapp')}>
                                Share on WhatsApp
                              </button>
                              <button type="button" className={`${styles.companyPanelMenuItem} ${styles.companyPanelMenuItemDanger}`} onClick={() => expireJobNotice(job)}>
                                Expire job
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {job.status === 'expired' ? (
                      <div className={styles.companyDashboardJobReminderStrip}>
                        <span>Repost now to receive new candidates</span>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.companyDashboardSplitGrid}>
            <div id="recent-applications" className={styles.companyDashboardSectionCard}>
              <div className={styles.companyDashboardSectionHeader}>
                <div>
                  <h3 className={styles.companyDashboardSectionTitle}>{content.recentApplications.title}</h3>
                  <p className={styles.companyDashboardSectionText}>Latest worker responses from your active and recent job posts.</p>
                </div>
                <button type="button" className={styles.companyDashboardSectionLink} onClick={() => scrollToSection('recent-applications')}>
                  {content.recentApplications.viewAllLabel}
                </button>
              </div>

              {recentApplicationItems.length === 0 ? (
                <div className={styles.softCard}>
                  <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                    {content.recentApplications.emptyTitle} {content.recentApplications.emptyDescription}
                  </p>
                </div>
              ) : (
                <div className={styles.companyDashboardApplicationsList}>
                  {recentApplicationItems.map(application => {
                    const relatedJob = jobLookup.get(application.jobId)

                    return (
                      <article key={application.applicationId} className={styles.companyDashboardApplicationRow}>
                        <div className={styles.companyDashboardApplicationIdentity}>
                          <span className={styles.companyDashboardApplicationAvatar}>
                            {application.profilePhotoPath && !brokenApplicationAvatars[application.applicationId] ? (
                              <img
                                src={application.profilePhotoPath}
                                alt={application.fullName}
                                className={styles.companyDashboardApplicationAvatarImage}
                                onError={() =>
                                  setBrokenApplicationAvatars(current => ({
                                    ...current,
                                    [application.applicationId]: true
                                  }))
                                }
                              />
                            ) : (
                              initialsFromName(application.fullName)
                            )}
                          </span>
                          <div>
                            <div className={styles.companyDashboardApplicationTitleRow}>
                              <p className={styles.companyDashboardApplicationName}>{application.fullName}</p>
                              <span className={styles.companyDashboardApplicationStatus} style={statusTone(application.status)}>
                                {labelFromStatus(application.status)}
                              </span>
                            </div>
                            <p className={styles.companyDashboardApplicationMeta}>
                              {truncateJobTitle(application.jobTitle, 5)} • Applied on {formatDate(application.appliedAt)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={styles.companyDashboardListButton}
                          onClick={() => relatedJob ? openJobDetailWindow(relatedJob) : scrollToSection('recent-applications')}
                        >
                          {content.recentApplications.viewProfileLabel}
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.companyDashboardSideColumn}>
              <div id="company-actions" className={styles.companyDashboardSectionCard}>
                <div className={styles.companyDashboardSectionHeader}>
                  <div>
                    <h3 className={styles.companyDashboardSectionTitle}>{content.quickActions.title}</h3>
                    <p className={styles.companyDashboardSectionText}>Jump into the most common hiring tasks from here.</p>
                  </div>
                </div>

                <div className={styles.companyDashboardQuickActions}>
                  <a href="/labour/company/job-post" className={styles.companyDashboardQuickAction}>
                    <span className={styles.companyDashboardQuickActionIcon}>+</span>
                    <span>
                      <strong>{quickActionItems[0]?.title}</strong>
                      <small>{quickActionItems[0]?.description}</small>
                    </span>
                    <em>›</em>
                  </a>
                  <a href="/labour/company/search" className={styles.companyDashboardQuickAction}>
                    <span className={styles.companyDashboardQuickActionIcon}>W</span>
                    <span>
                      <strong>{quickActionItems[1]?.title}</strong>
                      <small>{quickActionItems[1]?.description}</small>
                    </span>
                    <em>›</em>
                  </a>
                  <button type="button" className={styles.companyDashboardQuickAction} onClick={() => scrollToSection('recent-applications')}>
                    <span className={styles.companyDashboardQuickActionIcon}>A</span>
                    <span>
                      <strong>{quickActionItems[2]?.title}</strong>
                      <small>{quickActionItems[2]?.description}</small>
                    </span>
                    <em>›</em>
                  </button>
                  <button
                    type="button"
                    className={styles.companyDashboardQuickAction}
                    onClick={() => {
                      scrollToSection('recent-applications')
                    }}
                  >
                    <span className={styles.companyDashboardQuickActionIcon}>S</span>
                    <span>
                      <strong>{quickActionItems[3]?.title}</strong>
                      <small>{quickActionItems[3]?.description}</small>
                    </span>
                    <em>›</em>
                  </button>
                  <button
                    type="button"
                    className={styles.companyDashboardQuickAction}
                    onClick={() => {
                      scrollToSection('recent-applications')
                    }}
                  >
                    <span className={styles.companyDashboardQuickActionIcon}>H</span>
                    <span>
                      <strong>{quickActionItems[4]?.title}</strong>
                      <small>{quickActionItems[4]?.description}</small>
                    </span>
                    <em>›</em>
                  </button>
                </div>
              </div>

              <div id="need-help" className={styles.companyDashboardHelpCard}>
                <div>
                  <h3 className={styles.companyDashboardSectionTitle}>{content.support.title}</h3>
                  <p className={styles.companyDashboardSectionText}>
                    {content.support.description}
                  </p>
                </div>
                {content.support.imageSrc ? (
                  <img
                    src={content.support.imageSrc}
                    alt={content.support.title}
                    className={styles.companyDashboardHelpImage}
                  />
                ) : null}
                <a href="/labour/company/contact" className={styles.companyDashboardHelpButton}>
                  {content.support.buttonLabel}
                </a>
              </div>
            </div>
          </section>

          <section id="plan-summary" className={styles.companyDashboardPlanBar}>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.currentPlanLabel}</span>
              <strong>{currentJobPostingPlan?.planName || dashboard.profile.activePlan || 'No active plan found'}</strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.validTillLabel}</span>
              <strong>{currentJobPostingPlan?.validUntil || 'Plan details unavailable'}</strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.jobPostsLabel}</span>
              <strong>
                {currentJobPostingPlan
                  ? `${currentJobPostingPlan.usedJobPosts} used / ${currentJobPostingPlan.totalJobPosts} total`
                  : totalJobPosts
                    ? `${dashboard.stats.liveJobPosts} live / ${totalJobPosts} total`
                    : 'No job posts yet'}
              </strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.applicationsLabel}</span>
              <strong>{currentJobPostingPlan ? formatPlanStatusLabel(currentJobPostingPlan.status) : (dashboard.stats.totalApplications ? `${dashboard.stats.totalApplications} handled` : 'No applications yet')}</strong>
            </div>
            <a href="/labour/company/pricing" className={styles.companyDashboardPlanButton}>
              {content.planSummary.upgradeButtonLabel}
            </a>
          </section>

            </>
          ) : selectedPanelView === 'communication' ? (
            <>
              <div className={styles.companyDashboardActionRow}>
                <div>
                  <p className={styles.eyebrow}>WhatsApp preferences</p>
                  <h2 className={styles.companyDashboardPageTitle}>Manage optional WhatsApp consent</h2>
                  <p className={styles.companyDashboardPageText}>
                    Service, matching, and marketing consent stay separate, optional, and versioned.
                    Registration never implies consent.
                  </p>
                </div>
              </div>

              {communicationPreferencesError ? (
                <div className={styles.companyPanelActionNotice}>
                  <p style={{ margin: 0, color: '#b91c1c' }}>{communicationPreferencesError}</p>
                </div>
              ) : null}

              {communicationPreferencesNotice ? (
                <div className={styles.companyPanelActionNotice}>
                  <p style={{ margin: 0 }}>{communicationPreferencesNotice}</p>
                </div>
              ) : null}

              <section id="communication-preferences" className={styles.companyDashboardSectionCard}>
                <div className={styles.companyDashboardSectionHeader}>
                  <div>
                    <h3 className={styles.companyDashboardSectionTitle}>Communication preferences</h3>
                    <p className={styles.companyDashboardSectionText}>
                      These choices are optional. You can keep all WhatsApp consent categories turned off.
                    </p>
                  </div>
                </div>

                {communicationPreferencesLoading ? (
                  <div className={styles.softCard}>
                    <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 700 }}>
                      Loading communication preferences...
                    </p>
                  </div>
                ) : !communicationPreferences ? (
                  <div className={styles.softCard}>
                    <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>
                      Communication preferences are unavailable right now.
                    </p>
                  </div>
                ) : (
                  <form className={styles.companyBillingModalForm} onSubmit={saveCommunicationPreferences}>
                    <div className={styles.softCard} style={{ background: '#f8fafc', borderColor: '#dbeafe' }}>
                      <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 700 }}>
                        Consent text version
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                        {(communicationPreferences?.consentTextVersion || WHATSAPP_CONSENT_TEXT_VERSION)}
                      </p>
                    </div>

                    {communicationPreferences?.disabledMessage ? (
                      <div className={styles.softCard} style={{ background: '#fff7ed', borderColor: '#fdba74' }}>
                        <p style={{ margin: 0, color: '#9a3412', fontWeight: 700 }}>
                          {communicationPreferences.disabledMessage}
                        </p>
                      </div>
                    ) : null}

                    {companyConsentCopy.map((item) => (
                      <label
                        key={item.type}
                        className={styles.companyBillingField}
                        style={{ border: '1px solid #dbe2ea', borderRadius: '16px', padding: '14px 16px', background: '#ffffff' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={communicationPreferencesDraft[item.type]}
                            onChange={(event) =>
                              setCommunicationPreferencesDraft((current) => ({
                                ...current,
                                [item.type]: event.target.checked,
                              }))
                            }
                            disabled={communicationPreferencesSaving || communicationPreferences?.writeEnabled === false}
                            style={{ marginTop: '3px' }}
                          />
                          <span style={{ display: 'grid', gap: '4px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13px' }}>{item.label}</strong>
                            <span style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>{item.description}</span>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              Current state:{' '}
                              {communicationPreferences?.state[item.type] === true
                                ? 'Allowed'
                                : communicationPreferences?.state[item.type] === false
                                  ? 'Declined'
                                  : 'Unknown / not collected'}
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}

                    <div className={styles.companyBillingModalActions}>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={communicationPreferencesSaving || communicationPreferences?.writeEnabled === false}
                      >
                        {communicationPreferencesSaving ? 'Saving...' : 'Save preferences'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </>
          ) : (
            <>
              {error ? (
                <div className={styles.companyPanelActionNotice}>
                  <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                </div>
              ) : null}

              {actionMessage ? (
                <div className={styles.companyPanelActionNotice}>
                  <p style={{ margin: 0 }}>{actionMessage}</p>
                </div>
              ) : null}

              <div className={styles.companyDashboardActionRow}>
                <div>
                  <p className={styles.eyebrow}>{billingPanelCopy.eyebrow}</p>
                  <h2 className={styles.companyDashboardPageTitle}>{billingPanelCopy.title}</h2>
                  <p className={styles.companyDashboardPageText}>{billingPanelCopy.subtitle}</p>
                </div>
              </div>

              <section className={styles.companyDashboardSectionCard}>
                <div className={styles.companyDashboardSectionHeader}>
                  <div>
                    <h3 className={styles.companyDashboardSectionTitle}>Current Job Posting Plan</h3>
                    <p className={styles.companyDashboardSectionText}>
                      Review your active posting plan, usage, remaining posts, and renewal status before creating a new job post.
                    </p>
                  </div>
                  <a href="/labour/company/pricing" className={styles.companyDashboardPlanButton}>
                    {currentJobPostingPlan && currentJobPostingPlan.status === 'active' ? 'Upgrade plan' : 'Renew / Buy plan'}
                  </a>
                </div>

                {currentJobPostingPlan ? (
                  <div className={styles.companyBillingPlanStatusGrid}>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Status</span>
                      <strong>{formatPlanStatusLabel(currentJobPostingPlan.status)}</strong>
                    </div>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Plan name</span>
                      <strong>{currentJobPostingPlan.planName}</strong>
                    </div>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Job post usage</span>
                      <strong>{currentJobPostingPlan.usedJobPosts} used / {currentJobPostingPlan.totalJobPosts} total</strong>
                    </div>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Remaining posts</span>
                      <strong>{currentJobPostingPlan.remainingJobPosts}</strong>
                    </div>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Valid until</span>
                      <strong>{currentJobPostingPlan.validUntil || 'Not available in billing history'}</strong>
                    </div>
                    <div className={styles.companyBillingPlanStatusCard}>
                      <span className={styles.companyBillingPlanStatusLabel}>Plan source</span>
                      <strong>{currentJobPostingPlan.source === 'job_history_inferred' ? 'Connected job history' : currentJobPostingPlan.source === 'paid_plan' ? 'Paid plan' : 'Assigned plan'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className={styles.companyBillingPlanEmptyState}>
                    No active job posting plan found. Please renew or purchase a plan to post jobs.
                  </div>
                )}
              </section>

              <section id="billing-plan" className={styles.companyDashboardSectionCard}>
                <div className={styles.companyBillingProfileHeader}>
                  <div>
                    <h3 className={styles.companyDashboardSectionTitle}>Billing profile</h3>
                    <div className={styles.companyBillingProfileMeta}>
                      <span>GSTIN: {billingProfileGstin}</span>
                      <span className={styles.companyBillingVerifiedText}>
                        <BadgeCheck size={16} />
                        {billingProfileStatus}
                      </span>
                    </div>
                  </div>
                  <button type="button" className={styles.companyBillingProfileButton} onClick={handleBillingProfileUpdate}>
                    Update GSTIN / ISD-GSTIN
                  </button>
                </div>

                <div className={styles.companyBillingProfileDetails}>
                  <p><strong>Company name:</strong> {billingProfileName}</p>
                  <p><strong>Address:</strong> {billingProfileAddress}</p>
                </div>
              </section>

              {isBillingProfileModalOpen ? (
                <div className={styles.companyBillingModalBackdrop} onClick={closeBillingProfileModal}>
                  <div
                    className={styles.companyBillingModalCard}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="company-billing-profile-title"
                    onClick={event => event.stopPropagation()}
                  >
                    <div className={styles.companyBillingModalHeader}>
                      <div>
                        <h3 id="company-billing-profile-title" className={styles.companyDashboardSectionTitle}>Update billing profile</h3>
                        <p className={styles.companyDashboardSectionText}>
                          Save your company GST details and billing address for invoices and plan payments.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.companyBillingModalClose}
                        onClick={closeBillingProfileModal}
                        aria-label="Close billing profile form"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form className={styles.companyBillingModalForm} onSubmit={saveBillingProfile}>
                      <div className={styles.companyBillingFormGrid}>
                        <label className={styles.companyBillingField}>
                          <span>Business legal name</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.companyName}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, companyName: event.target.value }))}
                            required
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>GSTIN</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.gstNumber}
                            onChange={event =>
                              setBillingProfileDraft(current => ({
                                ...current,
                                gstNumber: event.target.value.replace(/\s+/g, '').toUpperCase()
                              }))
                            }
                            placeholder="Optional"
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>ISD-GSTIN</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.isdGstin}
                            onChange={event =>
                              setBillingProfileDraft(current => ({
                                ...current,
                                isdGstin: event.target.value.replace(/\s+/g, '').toUpperCase()
                              }))
                            }
                            placeholder="Optional"
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>Billing address</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.companyAddress}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, companyAddress: event.target.value }))}
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>Area</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.area}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, area: event.target.value }))}
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>City</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.city}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, city: event.target.value }))}
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>State</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.state}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, state: event.target.value }))}
                          />
                        </label>

                        <label className={styles.companyBillingField}>
                          <span>Pincode</span>
                          <input
                            className={styles.companyBillingInput}
                            value={billingProfileDraft.pincode}
                            onChange={event => setBillingProfileDraft(current => ({ ...current, pincode: event.target.value }))}
                          />
                        </label>
                      </div>

                      <p className={styles.companyBillingFieldHint}>
                        Use either GSTIN or ISD-GSTIN for billing. The current billing profile stores one GST identifier at a time.
                      </p>

                      {billingProfileError ? (
                        <p className={styles.companyBillingFieldError}>{billingProfileError}</p>
                      ) : null}

                      <div className={styles.companyBillingModalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={closeBillingProfileModal} disabled={billingProfileSaving}>
                          Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton} disabled={billingProfileSaving}>
                          {billingProfileSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}

              <div className={styles.companyBillingInfoBanner}>
                <div className={styles.companyBillingInfoBannerCopy}>
                  <CircleAlert size={18} />
                  <span>If you&apos;re registered with ISD-GSTIN, kindly update your GSTIN accordingly.</span>
                </div>
                <button type="button" className={styles.companyBillingInfoBannerLink} onClick={handleBillingProfileUpdate}>
                  Update GSTIN / ISD-GSTIN
                </button>
              </div>

          <section id="billing-history" className={styles.companyDashboardSectionCard}>
            <div className={styles.companyDashboardSectionHeader}>
              <div>
                <h3 className={styles.companyDashboardSectionTitle}>Billing History</h3>
                <p className={styles.companyDashboardSectionText}>Review your latest plan and payment activity from one place.</p>
              </div>
            </div>

            <div className={styles.companyBillingTabs}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Success', value: 'success' },
                { label: 'Pending', value: 'pending' },
                { label: 'Failed', value: 'failed' }
              ].map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  className={selectedBillingTab === tab.value ? styles.companyBillingTabActive : styles.companyBillingTab}
                  onClick={() => setSelectedBillingTab(tab.value as BillingHistoryTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.companyBillingTableWrap}>
              <table className={styles.companyBillingTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan details</th>
                    <th>Applies until</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.companyBillingEmptyState}>No billing history found.</td>
                    </tr>
                  ) : (
                    filteredBillingHistory.map(record => {
                      const isActionLoading = billingActionLoadingId === record.id
                      const actionIcon = record.actionType === 'retry'
                        ? <RotateCcw size={16} />
                        : record.actionType === 'invoice'
                          ? <Download size={16} />
                          : <PhoneCall size={16} />

                      return (
                        <tr key={record.id}>
                          <td>
                            <div className={styles.companyBillingDateCell}>
                              <strong>{record.date}</strong>
                              <span>{record.time}</span>
                            </div>
                          </td>
                          <td>
                            <a href={record.retryHref || '/labour/company/pricing'} className={styles.companyBillingPlanLink}>
                              {record.planDetails}
                            </a>
                          </td>
                          <td className={styles.companyBillingMetaCell}>{record.appliesUntil}</td>
                          <td className={styles.companyBillingAmountCell}>{formatCompanyBillingAmount(record.amount)}</td>
                          <td>
                            <span className={styles.companyBillingStatusBadge} style={getBillingStatusTone(record.statusType)}>
                              {record.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.companyBillingActionButton}
                              onClick={() => void handleBillingAction(record)}
                              disabled={isActionLoading}
                            >
                              {actionIcon}
                              <span>{isActionLoading ? 'Loading...' : record.actionLabel}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}
        </div>
      </section>
    </>
  )

  /*
  return (
    <>
      <section className={styles.heroGrid} style={{ marginBottom: '18px' }}>
        <div className={styles.companySnapshotCard}>
          <div className={styles.companySnapshotBadgeRow}>
            <span className={styles.companySnapshotCity}>{dashboard.profile.city || 'Worker hub'}</span>
          </div>

          <h2 className={styles.companySnapshotTitle}>{dashboard.profile.companyName}</h2>

          {dashboard.profile.activeJobCategoryLabels.length ? (
            <div className={styles.companySnapshotJobCategoryBlock}>
              <p className={styles.companySnapshotJobCategoryLabel}>Active job post categories</p>
              <div className={styles.companySnapshotJobCategoryRow}>
                {dashboard.profile.activeJobCategoryLabels.map(label => (
                  <span key={label} className={styles.companySnapshotJobCategoryChip}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.companySnapshotMetrics}>
            {[
              { label: 'Live Jobs', value: dashboard.stats.liveJobPosts },
              { label: 'Applications', value: dashboard.stats.totalApplications },
              { label: 'Shortlisted', value: dashboard.stats.shortlistedApplications },
              { label: 'Hired', value: dashboard.stats.hiredApplications }
            ].map(item => (
              <div key={item.label} className={styles.companySnapshotMetric}>
                <p className={styles.companySnapshotMetricLabel}>{item.label}</p>
                <p className={styles.companySnapshotMetricValue}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.companyActionCard}>
          <p className={styles.eyebrow} style={{ color: '#0f172a' }}>Connected workflow</p>
          <h1 className={styles.sectionTitle}>Company visibility follows live hiring activity</h1>
          <p className={styles.textMuted}>
            This company card is synced with the same worker marketplace data used by `/admin/labour`.
          </p>

          <div className={styles.stack} style={{ marginTop: '18px' }}>
            {[
              'This card shows real company numbers pulled from the current worker marketplace snapshot.',
              'Active job post categories here stay synced with the live Job Posts data in worker admin.',
              canUnlockWorkers
                ? "Visible worker search access stays tied to this company's live hiring categories."
                : 'This company must stay active and post a live job before worker contacts are unlocked.'
            ].map(item => (
              <div key={item} className={styles.bullet}>
                <span className={styles.bulletDot} style={{ background: '#0f172a' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className={styles.companyActionInlineRow}>
            <a href="/labour/company/job-post" target="_blank" rel="noreferrer" className={`${styles.companyActionMiniSecondary} ${styles.companyActionPulse}`}>
              {content.actions.postNewRequirementLabel}
            </a>
            <a href="/labour/company/panel" target="_blank" rel="noreferrer" className={`${styles.companyActionMiniPrimary} ${styles.companyActionPulse}`}>
              {content.sidebar.dashboardLabel}
            </a>
          </div>
        </div>
      </section>

      <section id="company-panel-jobs" className={styles.companyPanelShell}>
        <aside className={styles.companyPanelSidebar}>
        <div className={styles.companyPanelSidebarBrand}>
          <span className={styles.companyPanelSidebarLogo}>NC</span>
          <div>
            <p className={styles.companyPanelSidebarName}>{dashboard.profile.companyName}</p>
            <p className={styles.companyPanelSidebarMeta}>{dashboard.profile.city} | {dashboard.profile.status}</p>
          </div>
        </div>

        <div className={styles.companyPanelSidebarNav}>
          <div className={`${styles.companyPanelSidebarItem} ${styles.companyPanelSidebarItemActive}`}>Jobs</div>
          <a href="/labour/company/search" className={styles.companyPanelSidebarItemLink}>{content.sidebar.searchWorkersLabel}</a>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarItemLink}>{content.sidebar.billingPlanLabel}</a>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarItemLink}>{content.sidebar.billingPlanLabel}</a>
          <a href="/labour/company/contact" className={styles.companyPanelSidebarItemLink}>{content.support.title}</a>
        </div>

        <div className={styles.companyPanelSidebarPromo}>
          <p className={styles.companyPanelSidebarPromoTitle}>Oh no! You&apos;ve run out of credits.</p>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarPromoLink}>View</a>
        </div>

        <div className={styles.companyPanelSidebarFooter}>
          <button type="button" className={styles.companyPanelSidebarLogout} onClick={handleLogout}>
            Log out
          </button>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarBuyButton}>
            Buy credits
          </a>
        </div>
        </aside>

        <div className={styles.companyPanelMain}>
        <details className={styles.companyPanelPendingBar}>
          <summary className={styles.companyPanelPendingSummary}>
            <span>{content.recentApplications.title} ({pendingApplications.length})</span>
            <span className={styles.companyPanelPendingCaret}>v</span>
          </summary>
          <div className={styles.companyPanelPendingContent}>
            <div className={styles.companyPanelPendingStats}>
              {[
                { label: 'Live jobs', value: String(dashboard.stats.liveJobPosts) },
                { label: 'Applications', value: String(dashboard.stats.totalApplications) },
                { label: 'Shortlisted', value: String(dashboard.stats.shortlistedApplications) },
                { label: 'Hired', value: String(dashboard.stats.hiredApplications) }
              ].map(item => (
                <div key={item.label} className={styles.companyPanelSidebarStat}>
                  <span className={styles.companyPanelSidebarStatValue}>{item.value}</span>
                  <span className={styles.companyPanelSidebarStatLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            {pendingApplications.length === 0 ? (
              <p className={styles.textMuted}>{content.recentApplications.emptyTitle} {content.recentApplications.emptyDescription}</p>
            ) : pendingApplications.slice(0, 4).map(applicant => (
              <div key={applicant.applicationId} className={styles.companyPanelPendingItem}>
                <div>
                  <p className={styles.companyPanelPendingName}>{applicant.fullName}</p>
                  <p className={styles.textMuted}>{applicant.city} | {formatCurrency(applicant.expectedDailyWage)} expected</p>
                </div>
                <span className={styles.chip} style={statusTone(applicant.status)}>{applicant.status}</span>
              </div>
            ))}
          </div>
        </details>

        <div className={styles.companyPanelCanvas}>
          <div className={styles.companyPanelHeaderRow}>
            <div>
              <p className={styles.eyebrow}>{panelHeaderCopy.eyebrow}</p>
              <h1 className={styles.companyPanelTitle}>{content.recentJobs.title} ({filteredJobs.length})</h1>
              <p className={styles.textMuted}>{panelHeaderCopy.subtitle || content.hero.description}</p>
            </div>
            <div className={styles.buttonRow}>
              <a href="/labour/company/job-post" target="_blank" rel="noreferrer" className={styles.primaryButton} style={{ background: '#0f172a', color: '#ffffff', border: '1px solid transparent' }}>
                {content.actions.postNewRequirementLabel}
              </a>
              <a href="/labour/company/search" className={styles.secondaryButton}>
                {content.actions.browseWorkersLabel}
              </a>
            </div>
          </div>

          <div className={styles.companyPanelFilterRow}>
            <select
              value={selectedJobId}
              onChange={event => setSelectedJobId(event.target.value)}
              className={styles.companyPanelSelect}
            >
              <option value="all">All job posts</option>
              {dashboard.jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>

            <div className={styles.companyPanelStatusPills}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Reviewed', value: 'reviewed' },
                { label: 'Shortlisted', value: 'shortlisted' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Hired', value: 'hired' }
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  className={selectedStatus === item.value ? styles.companyPanelFilterPillActive : styles.companyPanelFilterPill}
                  onClick={() => setSelectedStatus(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className={styles.softCard} style={{ marginBottom: '18px', borderColor: '#fecaca', background: '#fef2f2' }}>
              <p style={{ margin: 0, color: '#b91c1c', fontWeight: 700 }}>{error}</p>
            </div>
          ) : null}

          {actionMessage ? (
            <div className={styles.companyPanelActionNotice}>
              <p style={{ margin: 0 }}>{actionMessage}</p>
            </div>
          ) : null}

          <div className={styles.stack}>
            {filteredJobs.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>No worker applications match the current filter.</p>
              </div>
            ) : paginatedJobs.map(job => {
              const pendingCount = job.applicants.filter(applicant => applicant.status === 'submitted').length

              return (
                <article key={job.id} className={styles.companyPanelJobCard}>
                  <div className={styles.companyPanelJobSummary} onClick={() => openJobDetailWindow(job)} role="button" tabIndex={0} onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openJobDetailWindow(job)
                    }
                  }}>
                  <div className={styles.companyPanelJobSummaryMain}>
                    <div className={styles.companyPanelJobSummaryIdentity}>
                        {isLiveCompanyJob(job.status) ? (
                          <span className={styles.companyPanelJobStar} aria-hidden="true">★</span>
                        ) : null}
                        <div>
                          <div className={styles.companyPanelJobTitleRow}>
                           <p className={styles.companyPanelJobTitle}>{truncateJobTitle(job.title)}</p>
                             <span className={styles.companyPanelJobStatusChip} style={statusTone(job.status)}>{companyJobStatusLabel(job.status)}</span>
                           </div>
                           <p className={styles.companyPanelJobMeta}>
                             {job.city} | Posted on : {formatDateTime(job.publishedAt)}
                           </p>
                         </div>
                       </div>

                      <div className={styles.companyPanelJobSummaryBadges}>
                        <span className={styles.companyPanelSummaryMetric}>
                          <strong>{job.totalApplications}</strong>
                          <span>Applied to job</span>
                        </span>
                        <span className={styles.companyPanelSummaryMetric}>
                          <strong>{job.applicants.length}</strong>
                          <span>Database matches</span>
                        </span>
                        {pendingCount > 0 ? (
                          <span className={styles.companyPanelPendingMiniBadge}>{pendingCount} pending</span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.companyPanelJobSummaryActions} onClick={event => {
                      event.stopPropagation()
                    }}>
                      <button
                        type="button"
                        className={styles.companyPanelSummaryButton}
                        onClick={() => openCompanyIntake(job, 'duplicate')}
                      >
                        Duplicate
                      </button>

                      <div className={styles.companyPanelMenuWrap}>
                        <button
                          type="button"
                          className={styles.companyPanelMenuButton}
                          onClick={() => setOpenJobMenuId(current => current === job.id ? null : job.id)}
                        >
                          ...
                        </button>

                        {openJobMenuId === job.id ? (
                          <div className={styles.companyPanelMenu}>
                            <button type="button" className={styles.companyPanelMenuItem} onClick={() => openCompanyIntake(job, 'edit')}>
                              Edit job
                            </button>
                            <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(job, 'whatsapp')}>
                              Share on WhatsApp
                            </button>
                            <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(job, 'facebook')}>
                              Share on Facebook
                            </button>
                            <button type="button" className={styles.companyPanelMenuItem} onClick={() => shareJob(job, 'instagram')}>
                              Share on Instagram
                            </button>
                            <button type="button" className={`${styles.companyPanelMenuItem} ${styles.companyPanelMenuItemDanger}`} onClick={() => expireJobNotice(job)}>
                              Expire job
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {filteredJobs.length > JOBS_PER_PAGE ? (
            <div className={styles.companyPanelPagination}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === currentPage ? styles.companyPanelPaginationButtonActive : styles.companyPanelPaginationButton}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        </div>
      </section>
    </>
  )
  */
}
