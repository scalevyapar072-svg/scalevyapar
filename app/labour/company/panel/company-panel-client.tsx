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
            {error ? (
              <div className={styles.errorBanner}>
                {error}
              </div>
            ) : null}
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
              onClick={() => setActiveTab(item.id)}
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
        {activeTab === 'jobs' ? (
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
                <article key={job.id} className={styles.companyDashboardJobCard}>
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

                  <div className={styles.companyDashboardApplicantStrip}>
                    {job.applicants.length === 0 ? (
                      <p className={styles.textMuted}>No applicants yet for this job.</p>
                    ) : (
                      job.applicants.slice(0, 3).map(applicant => (
                        <div key={applicant.applicationId} className={styles.companyDashboardApplicantCard}>
                          <div className={styles.sectionFooter}>
                            <div>
                              <p className={styles.companyDashboardApplicantName}>{applicant.fullName}</p>
                              <p className={styles.textMuted}>
                                {applicant.city} | {availabilityLabel(applicant.availability)} | {formatCurrency(applicant.expectedDailyWage)}
                              </p>
                            </div>
                            <span className={styles.chip} style={statusTone(applicant.status)}>{applicant.status}</span>
                          </div>
                          <p className={styles.textMuted}>Skills: {applicant.skills.join(', ') || 'Not added'}</p>
                          <p className={styles.textMuted}>
                            Contact: {applicant.canContactDirectly ? applicant.mobile || 'Unavailable' : 'Locked until your company has an active plan and the worker profile is visible'}
                          </p>
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
                            {(['reviewed', 'shortlisted', 'rejected', 'hired'] as const).map(nextStatus => (
                              <button
                                key={nextStatus}
                                type="button"
                                className={nextStatus === 'hired' || nextStatus === 'shortlisted' ? styles.primaryButton : styles.secondaryButton}
                                style={nextStatus === 'hired' || nextStatus === 'shortlisted'
                                  ? { background: '#2563eb', color: '#ffffff', border: '1px solid transparent' }
                                  : undefined}
                                disabled={submitting || applicant.status === nextStatus}
                                onClick={() => updateStatus(applicant.applicationId, nextStatus)}
                              >
                                Mark {nextStatus}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
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

            <div className={styles.companyDashboardInfoCard}>
              <h2 className={styles.sectionTitle}>Transaction history</h2>
              <p className={styles.textMuted}>A simple usage trail connected to your current hiring activity.</p>
              <div className={styles.stack}>
                {dashboard.jobs.slice(0, 5).map(job => (
                  <div key={job.id} className={styles.companyDashboardTimelineRow}>
                    <div>
                      <p className={styles.companyDashboardTimelineTitle}>{job.title}</p>
                      <p className={styles.textMuted}>Posted premium job and received labour applications.</p>
                    </div>
                    <div className={styles.companyDashboardTimelineMeta}>
                      <span>+ {job.totalApplications * 3} database credits</span>
                      <span>{formatDateTime(job.publishedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
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

            <div className={styles.companyDashboardInfoCard}>
              <h2 className={styles.sectionTitle}>Billing history</h2>
              <div className={styles.companyDashboardBillingTable}>
                <div className={styles.companyDashboardBillingHead}>
                  <span>Date</span>
                  <span>Plan details</span>
                  <span>Applies until</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {dashboard.jobs.slice(0, 5).map(job => (
                  <div key={job.id} className={styles.companyDashboardBillingRow}>
                    <span>{formatDateTime(job.publishedAt)}</span>
                    <span>{dashboard.profile.activePlan || 'Company plan'}</span>
                    <span>{formatDateTime(job.expiresAt)}</span>
                    <span>{formatCurrency(job.wageAmount)}</span>
                    <span className={styles.chip} style={statusTone('active')}>Success</span>
                  </div>
                ))}
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
