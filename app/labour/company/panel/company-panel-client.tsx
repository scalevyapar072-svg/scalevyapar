'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'

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
  whatsappUrl: string | null
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
  city: string
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
    email?: string
    mobile: string
    city: string
    status: string
    activePlan: string
    categoryLabels: string[]
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

type PanelTab = 'jobs' | 'usage' | 'billing' | 'support'

const supportFaqs = [
  {
    question: 'How do I contact workers directly?',
    answer: 'Direct worker mobile and WhatsApp access are unlocked only when your company has an active plan and the worker profile is visible.'
  },
  {
    question: 'What happens when my plan expires?',
    answer: 'Your jobs remain visible in history, but direct worker access and premium hiring actions should be renewed through the next plan purchase.'
  },
  {
    question: 'Can I schedule training for my hiring team?',
    answer: 'Yes. Use the support actions below to request onboarding or training support for job posting, applicant handling, and hiring workflow.'
  }
]

type Props = {
  signinMode?: boolean
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

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
  if (value === 'reviewed' || value === 'paused') {
    return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' }
  }
  return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
}

const countJobsByStatus = (jobs: CompanyJob[], status: string) =>
  jobs.filter(job => job.status === status).length

export function CompanyPanelClient({ signinMode = false }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null)
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<PanelTab>('jobs')
  const [openedJobId, setOpenedJobId] = useState<string | null>(null)
  const [showMatchedOnly, setShowMatchedOnly] = useState(false)
  const [showWithResumeOnly, setShowWithResumeOnly] = useState(false)
  const [showTriedContactOnly, setShowTriedContactOnly] = useState(false)
  const [loading, setLoading] = useState(true)
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
  }

  useEffect(() => {
    if (signinMode) {
      setLoading(false)
      return
    }

    const stored = localStorage.getItem(COMPANY_TOKEN_KEY)
    if (!stored) {
      setLoading(false)
      return
    }

    loadDashboard(stored)
      .catch(() => {
        localStorage.removeItem(COMPANY_TOKEN_KEY)
        setToken(null)
        setDashboard(null)
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
          identity
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
      setDashboard(data.dashboard as CompanyDashboard)
      setToken(authToken)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in company panel.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(COMPANY_TOKEN_KEY)
    setToken(null)
    setDashboard(null)
    setError('')
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

  const filteredJobs = useMemo(() => {
    if (!dashboard) return []

    return dashboard.jobs
      .map(job => ({
        ...job,
        applicants: job.applicants.filter(applicant => (selectedStatus === 'all' ? true : applicant.status === selectedStatus))
      }))
      .filter(job => (selectedJobId === 'all' ? true : job.id === selectedJobId))
  }, [dashboard, selectedJobId, selectedStatus])

  const selectedJob = useMemo(() => {
    if (!dashboard || !openedJobId) return null
    return dashboard.jobs.find(job => job.id === openedJobId) || null
  }, [dashboard, openedJobId])

  const selectedJobApplicants = useMemo(() => {
    if (!selectedJob) return []

    return selectedJob.applicants.filter(applicant => {
      if (showMatchedOnly && applicant.categoryLabels.length === 0) return false
      if (showWithResumeOnly && !applicant.profilePhotoPath) return false
      if (showTriedContactOnly && !applicant.canContactDirectly) return false
      if (selectedStatus !== 'all' && applicant.status !== selectedStatus) return false
      return true
    })
  }, [selectedJob, showMatchedOnly, showWithResumeOnly, showTriedContactOnly, selectedStatus])

  const usageSummary = useMemo(() => {
    if (!dashboard) {
      return {
        jobCredits: 0,
        databaseCredits: 0,
        aiCallingCredits: 0
      }
    }

    return {
      jobCredits: Math.max(0, dashboard.stats.liveJobPosts * 2 - dashboard.stats.totalApplications),
      databaseCredits: Math.max(0, dashboard.stats.totalApplications * 3 + 30),
      aiCallingCredits: Math.max(0, dashboard.stats.shortlistedApplications * 2)
    }
  }, [dashboard])

  if (loading) {
    return (
      <section className={styles.panelLoadingShell}>
        <div className={styles.panelLoadingCard}>
          <p className={styles.sectionTitle}>Loading company dashboard...</p>
          <p className={styles.textMuted}>Fetching jobs, plan usage, billing, and support details.</p>
        </div>
      </section>
    )
  }

  if (!dashboard) {
    return (
      <section className={styles.panelAuthShell}>
        <div className={styles.panelAuthCard}>
          <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Company dashboard</p>
          <h1 className={styles.pageTitle}>Sign in to manage jobs, plans, billing, and support</h1>
          <p className={styles.textMuted} style={{ marginBottom: '20px' }}>
            Use your registered company email and your company name or contact person to access the employer dashboard.
          </p>
          <form className={styles.stack} onSubmit={submitLogin}>
            <label className={styles.stack}>
              <span className={styles.fieldLabel}>Company email</span>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Registered company email"
                className={styles.inputField}
              />
            </label>
            <label className={styles.stack}>
              <span className={styles.fieldLabel}>Company name or contact person</span>
              <input
                value={identity}
                onChange={event => setIdentity(event.target.value)}
                placeholder="Company name or contact person"
                className={styles.inputField}
              />
            </label>
            {error ? <div className={styles.errorBanner}>{error}</div> : null}
            <button
              type="submit"
              className={styles.primaryButton}
              style={{ background: '#0f766e', color: '#ffffff', border: '1px solid transparent' }}
              disabled={submitting}
            >
              {submitting ? 'Opening dashboard...' : 'Open dashboard'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.companyDashboardShell}>
      <aside className={styles.companyDashboardSidebar}>
        <div className={styles.companyDashboardBrand}>
          <div className={styles.companyDashboardLogo}>{dashboard.profile.companyName.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className={styles.companyDashboardName}>{dashboard.profile.companyName}</p>
            <p className={styles.companyDashboardMeta}>{dashboard.profile.city} | {dashboard.profile.contactPerson}</p>
          </div>
        </div>

        <nav className={styles.companyDashboardNav}>
          {[
            { id: 'jobs' as const, label: `All Jobs (${dashboard.jobs.length})` },
            { id: 'usage' as const, label: 'Plan & Usage' },
            { id: 'billing' as const, label: 'Billing' },
            { id: 'support' as const, label: 'Help & Support' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id)
                if (item.id !== 'jobs') {
                  setOpenedJobId(null)
                }
              }}
              className={`${styles.companyDashboardNavItem} ${activeTab === item.id ? styles.companyDashboardNavItemActive : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.companyDashboardSupportCard}>
          <p className={styles.companyDashboardSupportTitle}>Contact us</p>
          <p className={styles.companyDashboardSupportText}>( Mon to Sun | 9:00 AM - 7:00 PM )</p>
          <div className={styles.stack}>
            <a href="/labour/company/contact" className={styles.secondaryButton}>Chat with us</a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className={styles.primaryButton} style={{ background: '#16a34a', color: '#ffffff', border: '1px solid transparent' }}>
              Chat on Whatsapp
            </a>
            <span className={styles.companyDashboardRecommended}>Recommended</span>
            <a href="/labour/company/contact" className={styles.secondaryButton}>Schedule Training</a>
            <a href="/labour/company/contact" className={styles.secondaryButton}>HR Best practices</a>
          </div>
        </div>

        <button type="button" className={styles.ghostButton} onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <div className={styles.companyDashboardContent}>
        {activeTab === 'jobs' && !selectedJob ? (
          <section className={styles.companyDashboardSection}>
            <div className={styles.companyDashboardHeaderRow}>
              <div>
                <h1 className={styles.companyDashboardHeading}>All Jobs ({dashboard.jobs.length})</h1>
                <p className={styles.textMuted}>Manage live jobs, monitor applicants, and take action quickly.</p>
              </div>
              <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: '#0f766e', color: '#ffffff', border: '1px solid transparent' }}>
                Post a new job
              </a>
            </div>

            <div className={styles.companyDashboardFilters}>
              <button type="button" className={styles.companyDashboardFilterPill}>All Filters</button>
              <button type="button" className={styles.companyDashboardFilterPill}>Active ({countJobsByStatus(dashboard.jobs, 'live')})</button>
              <button type="button" className={styles.companyDashboardFilterPill}>Under Review ({dashboard.stats.shortlistedApplications})</button>
              <button type="button" className={styles.companyDashboardFilterPill}>Expired ({countJobsByStatus(dashboard.jobs, 'expired')})</button>
              <button type="button" className={styles.companyDashboardFilterPill}>Select Plan ({dashboard.profile.activePlan ? 1 : 0})</button>
            </div>

            <div className={styles.companyDashboardJobList}>
              {filteredJobs.map(job => (
                <article
                  key={job.id}
                  className={styles.companyDashboardJobCard}
                  onClick={() => setOpenedJobId(job.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.companyDashboardJobTop}>
                    <div>
                      <div className={styles.companyDashboardJobTitleRow}>
                        <h2 className={styles.companyDashboardJobTitle}>{job.title}</h2>
                        <span className={styles.chip} style={statusTone(job.status)}>{job.status}</span>
                      </div>
                      <p className={styles.textMuted}>
                        {job.city} | Posted on: {formatDateTime(job.publishedAt)} | {dashboard.profile.contactPerson}
                      </p>
                    </div>
                    <div className={styles.companyDashboardJobActions}>
                      <span className={styles.companyDashboardMetricBox}>
                        <strong>{job.totalApplications}</strong>
                        <span>Applied to job</span>
                      </span>
                      <span className={styles.companyDashboardMetricBox}>
                        <strong>{job.applicants.length * 61}</strong>
                        <span>Database Matches</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'jobs' && selectedJob ? (
          <section className={styles.companyDashboardSection}>
            <div className={styles.companyDashboardDetailTopbar}>
              <button
                type="button"
                className={styles.companyDashboardBackButton}
                onClick={() => setOpenedJobId(null)}
              >
                Back
              </button>
              <div className={styles.companyDashboardDetailMeta}>
                <h1 className={styles.companyDashboardDetailTitle}>{selectedJob.title}</h1>
                <span className={styles.chip} style={statusTone(selectedJob.status)}>{selectedJob.status}</span>
                <span className={styles.companyDashboardDetailCity}>{selectedJob.city}</span>
              </div>
              <a href="/labour/company/search" className={styles.companyDashboardMatchesLink}>
                See Database Matches ({selectedJob.applicants.length * 61})
              </a>
            </div>

            <div className={styles.companyDashboardDetailStats}>
              <div className={styles.companyDashboardDetailStatCard}>
                <strong>{selectedJob.applicants.length}</strong>
                <span>All candidates</span>
              </div>
              <div className={styles.companyDashboardDetailStatCard}>
                <strong>{selectedJob.applicants.filter(applicant => applicant.status === 'submitted').length}</strong>
                <span>Action Pending</span>
              </div>
              <div className={styles.companyDashboardDetailStatCard}>
                <strong>{selectedJob.applicants.filter(applicant => applicant.status === 'reviewed').length}</strong>
                <span>Viewed Number</span>
              </div>
              <div className={styles.companyDashboardDetailStatCard}>
                <strong>{selectedJob.applicants.filter(applicant => applicant.status === 'shortlisted').length}</strong>
                <span>Shortlisted</span>
              </div>
              <div className={styles.companyDashboardDetailStatCard}>
                <strong>{selectedJob.applicants.filter(applicant => applicant.status === 'rejected').length}</strong>
                <span>Rejected</span>
              </div>
            </div>

            <div className={styles.companyDashboardCandidateLayout}>
              <aside className={styles.companyDashboardCandidateFilters}>
                <div className={styles.companyDashboardCandidateFilterCard}>
                  <p className={styles.companyDashboardFilterHeading}>Filters</p>

                  <div className={styles.companyDashboardCheckboxRow}>
                    <input
                      id="matchedOnly"
                      type="checkbox"
                      checked={showMatchedOnly}
                      onChange={event => setShowMatchedOnly(event.target.checked)}
                    />
                    <label htmlFor="matchedOnly">Matched to job requirements ({selectedJob.applicants.length})</label>
                  </div>

                  <div className={styles.companyDashboardCheckboxRow}>
                    <input
                      id="resumeOnly"
                      type="checkbox"
                      checked={showWithResumeOnly}
                      onChange={event => setShowWithResumeOnly(event.target.checked)}
                    />
                    <label htmlFor="resumeOnly">Have profile attached ({selectedJob.applicants.filter(applicant => applicant.profilePhotoPath).length})</label>
                  </div>

                  <div className={styles.companyDashboardCheckboxRow}>
                    <input
                      id="contactOnly"
                      type="checkbox"
                      checked={showTriedContactOnly}
                      onChange={event => setShowTriedContactOnly(event.target.checked)}
                    />
                    <label htmlFor="contactOnly">Direct contact unlocked ({selectedJob.applicants.filter(applicant => applicant.canContactDirectly).length})</label>
                  </div>
                </div>
              </aside>

              <div className={styles.companyDashboardCandidateColumn}>
                <div className={styles.companyDashboardCandidateHeader}>
                  <p className={styles.companyDashboardFilterHeading}>Showing {selectedJobApplicants.length} candidates</p>
                </div>

                {selectedJobApplicants.map(applicant => (
                  <article key={applicant.applicationId} className={styles.companyDashboardCandidateCard}>
                    <div className={styles.companyDashboardCandidateTop}>
                      <div>
                        <p className={styles.companyDashboardCandidateName}>{applicant.fullName}</p>
                        <p className={styles.textMuted}>
                          {applicant.city} | {availabilityLabel(applicant.availability)} | {formatCurrency(applicant.expectedDailyWage)}
                        </p>
                      </div>
                      <span className={styles.chip} style={statusTone(applicant.status)}>{applicant.status}</span>
                    </div>

                    <div className={styles.companyDashboardMatchingBox}>
                      <span className={styles.companyDashboardMatchingLabel}>Matching:</span>
                      <div className={styles.chipRow}>
                        {applicant.categoryLabels.map(label => (
                          <span
                            key={`${applicant.applicationId}-${label}`}
                            className={styles.chip}
                            style={{ background: '#ffffff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                          >
                            {label}
                          </span>
                        ))}
                        {applicant.skills.slice(0, 3).map(skill => (
                          <span
                            key={`${applicant.applicationId}-${skill}`}
                            className={styles.chip}
                            style={{ background: '#ffffff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.companyDashboardCandidateFacts}>
                      <span><strong>Experience:</strong> {applicant.experienceYears} years</span>
                      <span><strong>Skills:</strong> {applicant.skills.join(', ') || 'Not added'}</span>
                      <span><strong>Categories:</strong> {applicant.categoryLabels.join(', ') || 'Not mapped'}</span>
                      <span><strong>Note:</strong> {applicant.note || 'No note added by worker'}</span>
                    </div>

                    <div className={styles.buttonRow}>
                      {applicant.whatsappUrl ? (
                        <a
                          href={applicant.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.primaryButton}
                          style={{ background: '#16a34a', color: '#ffffff', border: '1px solid transparent' }}
                        >
                          Chat on Whatsapp
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={submitting || applicant.status === 'rejected'}
                        onClick={() => updateStatus(applicant.applicationId, 'rejected')}
                        style={{ color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={submitting || applicant.status === 'reviewed'}
                        onClick={() => updateStatus(applicant.applicationId, 'reviewed')}
                      >
                        Mark reviewed
                      </button>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        style={{ background: '#2563eb', color: '#ffffff', border: '1px solid transparent' }}
                        disabled={submitting || applicant.status === 'shortlisted'}
                        onClick={() => updateStatus(applicant.applicationId, 'shortlisted')}
                      >
                        Shortlist
                      </button>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        style={{ background: '#0f766e', color: '#ffffff', border: '1px solid transparent' }}
                        disabled={submitting || applicant.status === 'hired'}
                        onClick={() => updateStatus(applicant.applicationId, 'hired')}
                      >
                        Mark hired
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'usage' ? (
          <section className={styles.companyDashboardSection}>
            <div className={styles.companyDashboardHeaderRow}>
              <div>
                <h1 className={styles.companyDashboardHeading}>Plan & Usage</h1>
                <p className={styles.textMuted}>Track plan status, credits, and recent usage signals.</p>
              </div>
              <a href="/labour/company/pricing" className={styles.primaryButton} style={{ background: '#0f766e', color: '#ffffff', border: '1px solid transparent' }}>
                Buy more credits
              </a>
            </div>

            <div className={styles.companyDashboardWarning}>
              <strong>{dashboard.profile.contactPerson}, plan usage update</strong>
              <span>
                Active plan: {dashboard.profile.activePlan || 'Not assigned'} | Upgrade or renew to continue premium worker access and job visibility.
              </span>
            </div>

            <div className={styles.companyDashboardUsageGrid}>
              {[
                ['Job Credits', String(usageSummary.jobCredits), 'credits'],
                ['AI Calling Credits', String(usageSummary.aiCallingCredits), 'credits'],
                ['Database Credits', String(usageSummary.databaseCredits), 'credits']
              ].map(([label, value, unit]) => (
                <div key={label} className={styles.companyDashboardUsageCard}>
                  <p className={styles.companyDashboardUsageLabel}>{label}</p>
                  <p className={styles.companyDashboardUsageValue}>{value}</p>
                  <p className={styles.textMuted}>{unit}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'billing' ? (
          <section className={styles.companyDashboardSection}>
            <div className={styles.companyDashboardHeaderRow}>
              <div>
                <h1 className={styles.companyDashboardHeading}>Billing</h1>
                <p className={styles.textMuted}>Billing profile, active plan snapshot, and payment history.</p>
              </div>
              <a href="/labour/company/contact" className={styles.secondaryButton}>Update GST / Billing</a>
            </div>

            <div className={styles.companyDashboardInfoCard}>
              <h2 className={styles.sectionTitle}>Billing profile</h2>
              <div className={styles.stack}>
                <p className={styles.textMuted}><strong>Company name:</strong> {dashboard.profile.companyName}</p>
                <p className={styles.textMuted}><strong>Contact person:</strong> {dashboard.profile.contactPerson}</p>
                <p className={styles.textMuted}><strong>City:</strong> {dashboard.profile.city}</p>
                <p className={styles.textMuted}><strong>Active plan:</strong> {dashboard.profile.activePlan || 'Not assigned'}</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'support' ? (
          <section className={styles.companyDashboardSection}>
            <div className={styles.companyDashboardHeaderRow}>
              <div>
                <h1 className={styles.companyDashboardHeading}>Help & Support FAQ</h1>
                <p className={styles.textMuted}>Training, chat support, and HR best-practice guidance for your team.</p>
              </div>
            </div>

            <div className={styles.companyDashboardSupportGrid}>
              <div className={styles.companyDashboardInfoCard}>
                <h2 className={styles.sectionTitle}>Contact us</h2>
                <p className={styles.textMuted}>( Mon to Sun | 9:00 AM - 7:00 PM )</p>
                <div className={styles.stack}>
                  <a href="/labour/company/contact" className={styles.secondaryButton}>Chat with us</a>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className={styles.primaryButton} style={{ background: '#16a34a', color: '#ffffff', border: '1px solid transparent' }}>
                    Chat on Whatsapp
                  </a>
                  <span className={styles.companyDashboardRecommended}>Recommended</span>
                  <a href="/labour/company/contact" className={styles.secondaryButton}>Schedule Training</a>
                  <a href="/labour/company/contact" className={styles.secondaryButton}>HR Best practices</a>
                </div>
              </div>

              <div className={styles.companyDashboardInfoCard}>
                <h2 className={styles.sectionTitle}>FAQ</h2>
                <div className={styles.stack}>
                  {supportFaqs.map(item => (
                    <div key={item.question} className={styles.softCard}>
                      <p className={styles.companyDashboardFaqQuestion}>{item.question}</p>
                      <p className={styles.textMuted}>{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}
