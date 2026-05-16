'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../company-site.module.css'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'

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
    city: string
    state?: string
    status: string
    activePlan: string
    categoryLabels: string[]
    activeJobCategoryLabels: string[]
  }
  stats: {
    liveJobPosts: number
    totalApplications: number
    shortlistedApplications: number
    hiredApplications: number
  }
  jobs: CompanyJob[]
  recentApplications: CompanyApplicant[]
}

type Props = {
  signinMode?: boolean
  jobId?: string
  content: LabourCompanyWebsiteContent['companyPanel']
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

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
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const truncateJobTitle = (value: string, maxWords = 5) => {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return value
  return `${words.slice(0, maxWords).join(' ')}...`
}

const labelFromStatus = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function CompanyPanelClient({ signinMode = false, jobId, content }: Props) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [openJobMenuId, setOpenJobMenuId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
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
          password
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

  const updateStatus = async (applicationId: string, status: 'reviewed' | 'shortlisted' | 'rejected' | 'hired') => {
    if (!token) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/labour/company/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId,
          status
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update worker application.')
      }

      setDashboard(data.dashboard as CompanyDashboard)
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update worker application.')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingApplications = useMemo(() => {
    if (!dashboard) return []
    return dashboard.recentApplications.filter(applicant => applicant.status === 'submitted')
  }, [dashboard])

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

  const totalJobPosts = dashboard?.jobs.length ?? 0
  const selectedDashboardJob = useMemo(
    () => jobId ? dashboard?.jobs.find(job => job.id === jobId) ?? null : null,
    [dashboard, jobId]
  )
  const detailApplicants = useMemo(() => {
    if (!selectedDashboardJob) return []

    const items = selectedDashboardJob.applicants
      .filter(applicant => selectedStatus === 'all' ? true : applicant.status === selectedStatus)
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
            Sign in with your registered company email and password to open the company dashboard.
          </p>
          <form className={styles.stack} onSubmit={submitLogin}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Company email</span>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Registered company email"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
              />
            </label>
            <div className={styles.softCard} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 700 }}>Use your company email and password.</p>
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
                {submitting ? 'Opening company panel...' : 'Open company panel'}
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
                Sign in using the registered company email and password linked to your company account.
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
      submitted: selectedDashboardJob.applicants.filter(applicant => applicant.status === 'submitted').length,
      reviewed: selectedDashboardJob.applicants.filter(applicant => applicant.status === 'reviewed').length,
      shortlisted: selectedDashboardJob.applicants.filter(applicant => applicant.status === 'shortlisted').length,
      rejected: selectedDashboardJob.applicants.filter(applicant => applicant.status === 'rejected').length
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
                    <span><strong>Note</strong> {applicant.note || 'No note added by worker'}</span>
                  </div>

                  <div className={styles.companyPanelDetailCandidateActions}>
                    <div className={styles.companyPanelDetailContactRow}>
                      <button
                        type="button"
                        className={styles.companyPanelDetailContactButton}
                        onClick={() => toggleContactReveal(applicant.applicationId)}
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
                      >
                        WhatsApp
                      </a>
                    </div>

                    <div className={styles.companyPanelDetailDecisionRow}>
                      <button type="button" className={styles.companyPanelDetailRejectButton} onClick={() => updateStatus(applicant.applicationId, 'rejected')}>
                        Reject
                      </button>
                      <button type="button" className={styles.companyPanelDetailShortlistButton} onClick={() => updateStatus(applicant.applicationId, 'shortlisted')}>
                        Shortlist
                      </button>
                    </div>
                  </div>

                  <div className={styles.companyPanelDetailFooter}>
                    <span>Applied {formatDateTime(applicant.appliedAt)}</span>
                    <button type="button" className={styles.companyPanelDetailNoteButton}>
                      Add a note
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
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
            <button type="button" className={`${styles.companyDashboardSidebarItem} ${styles.companyDashboardSidebarItemActive}`} onClick={() => scrollToSection('dashboard-top')}>
              <span className={styles.companyDashboardSidebarIcon}>D</span>
              <span>{content.sidebar.dashboardLabel}</span>
            </button>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => scrollToSection('recent-job-posts')}>
              <span className={styles.companyDashboardSidebarIcon}>J</span>
              <span>{content.sidebar.jobRequirementsLabel}</span>
            </button>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => scrollToSection('recent-applications')}>
              <span className={styles.companyDashboardSidebarIcon}>A</span>
              <span>{content.sidebar.applicationsLabel}</span>
            </button>
            <button
              type="button"
              className={styles.companyDashboardSidebarItem}
              onClick={() => {
                scrollToSection('recent-applications')
              }}
            >
              <span className={styles.companyDashboardSidebarIcon}>S</span>
              <span>{content.sidebar.shortlistedLabel}</span>
            </button>
            <button
              type="button"
              className={styles.companyDashboardSidebarItem}
              onClick={() => {
                scrollToSection('recent-applications')
              }}
            >
              <span className={styles.companyDashboardSidebarIcon}>H</span>
              <span>{content.sidebar.hiredWorkersLabel}</span>
            </button>
            <a href="/labour/company/search" className={styles.companyDashboardSidebarItem}>
              <span className={styles.companyDashboardSidebarIcon}>W</span>
              <span>{content.sidebar.searchWorkersLabel}</span>
            </a>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => scrollToSection('company-profile')}>
              <span className={styles.companyDashboardSidebarIcon}>P</span>
              <span>{content.sidebar.companyProfileLabel}</span>
            </button>
            <a href="/labour/company/pricing" className={styles.companyDashboardSidebarItem}>
              <span className={styles.companyDashboardSidebarIcon}>B</span>
              <span>{content.sidebar.billingPlanLabel}</span>
            </a>
            <a href="/labour/company/contact" className={styles.companyDashboardSidebarItem}>
              <span className={styles.companyDashboardSidebarIcon}>M</span>
              <span>{content.sidebar.messagesLabel}</span>
            </a>
            <button type="button" className={styles.companyDashboardSidebarItem} onClick={() => scrollToSection('need-help')}>
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
                  <article key={job.id} className={styles.companyDashboardJobRow}>
                    <div className={styles.companyDashboardJobIdentity}>
                      <div>
                        <div className={styles.companyDashboardJobTitleRow}>
                          <p className={styles.companyDashboardJobTitle}>{truncateJobTitle(job.title, 8)}</p>
                          <span className={styles.companyPanelJobStatusChip} style={statusTone(job.status)}>
                            {companyJobStatusLabel(job.status)}
                          </span>
                        </div>
                        <p className={styles.companyDashboardJobMeta}>
                          {job.city} • Posted on {formatDate(job.publishedAt)}
                        </p>
                      </div>
                    </div>

                    <div className={styles.companyDashboardJobMetrics}>
                      <span><strong>{job.totalApplications}</strong> Applications</span>
                      <span><strong>{job.shortlistedCount}</strong> Shortlisted</span>
                      <span><strong>{job.hiredCount}</strong> Hired</span>
                    </div>

                    <div className={styles.companyDashboardJobActions}>
                      <button type="button" className={styles.companyDashboardListButton} onClick={() => openJobDetailWindow(job)}>
                        {content.recentJobs.viewDetailsLabel}
                      </button>
                      <div className={styles.companyPanelMenuWrap}>
                        <button
                          type="button"
                          className={styles.companyDashboardMoreButton}
                          onClick={() => setOpenJobMenuId(current => current === job.id ? null : job.id)}
                        >
                          ...
                        </button>
                        {openJobMenuId === job.id ? (
                          <div className={styles.companyPanelMenu}>
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
                            {application.profilePhotoPath ? (
                              <img
                                src={application.profilePhotoPath}
                                alt={application.fullName}
                                className={styles.companyDashboardApplicationAvatarImage}
                              />
                            ) : (
                              application.fullName.slice(0, 2).toUpperCase()
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
              <strong>{dashboard.profile.activePlan || 'Plan details unavailable'}</strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.validTillLabel}</span>
              <strong>Plan details unavailable</strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.jobPostsLabel}</span>
              <strong>{totalJobPosts ? `${dashboard.stats.liveJobPosts} live / ${totalJobPosts} total` : 'No job posts yet'}</strong>
            </div>
            <div className={styles.companyDashboardPlanItem}>
              <span className={styles.companyDashboardPlanLabel}>{content.planSummary.applicationsLabel}</span>
              <strong>{dashboard.stats.totalApplications ? `${dashboard.stats.totalApplications} handled` : 'No applications yet'}</strong>
            </div>
            <a href="/labour/company/pricing" className={styles.companyDashboardPlanButton}>
              {content.planSummary.upgradeButtonLabel}
            </a>
          </section>
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
              Post Requirement
            </a>
            <a href="/labour/company/panel" target="_blank" rel="noreferrer" className={`${styles.companyActionMiniPrimary} ${styles.companyActionPulse}`}>
              Open Company Panel
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
          <a href="/labour/company/search" className={styles.companyPanelSidebarItemLink}>Search Workers</a>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarItemLink}>Credits &amp; Usage</a>
          <a href="/labour/company/pricing" className={styles.companyPanelSidebarItemLink}>Billing</a>
          <a href="/labour/company/contact" className={styles.companyPanelSidebarItemLink}>Help &amp; Support</a>
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
            <span>Pending Actions ({pendingApplications.length})</span>
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
              <p className={styles.textMuted}>No pending application reviews right now.</p>
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
              <p className={styles.eyebrow}>Company panel</p>
              <h1 className={styles.companyPanelTitle}>All Jobs ({filteredJobs.length})</h1>
              <p className={styles.textMuted}>Review applicants, track live jobs, and manage hiring from one place.</p>
            </div>
            <div className={styles.buttonRow}>
              <a href="/labour/company/job-post" target="_blank" rel="noreferrer" className={styles.primaryButton} style={{ background: '#0f172a', color: '#ffffff', border: '1px solid transparent' }}>
                Post Requirement
              </a>
              <a href="/labour/company/search" className={styles.secondaryButton}>
                Browse Worker Search
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
