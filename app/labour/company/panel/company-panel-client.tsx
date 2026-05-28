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
  if (value === 'reviewed') {
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
      .filter(job => job.applicants.length > 0 || selectedStatus === 'all')
  }, [dashboard, selectedJobId, selectedStatus])

  const selectedJob = useMemo(() => {
    if (!dashboard) return null
    if (selectedJobId === 'all') return dashboard.jobs[0] || null
    return dashboard.jobs.find(job => job.id === selectedJobId) || null
  }, [dashboard, selectedJobId])

  const activityRows = useMemo(() => {
    if (!dashboard) return []
    return dashboard.recentApplications.slice(0, 6).map(applicant => ({
      id: applicant.applicationId,
      title: `${applicant.fullName} applied`,
      detail: `${applicant.city} • ${availabilityLabel(applicant.availability)} • ${formatDateTime(applicant.appliedAt)}`,
      status: applicant.status
    }))
  }, [dashboard])

  if (loading) {
    return (
      <section className={styles.card}>
        <p className={styles.sectionTitle}>Loading company panel...</p>
        <p className={styles.textMuted}>Fetching job posts, applications, and hiring activity.</p>
      </section>
    )
  }

  if (!dashboard) {
    return (
      <section className={styles.heroGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Company panel</p>
          <h1 className={styles.pageTitle}>Secure employer workspace</h1>
          <p className={styles.textMuted} style={{ marginBottom: '22px' }}>
            Sign in with your registered company email and your company name or contact person. This keeps the current ScaleVyapar labour company authentication flow intact without introducing a disconnected login system.
          </p>

          <form className={styles.stack} onSubmit={submitLogin}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className={styles.fieldLabel}>Company email</span>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Registered company email"
                className={styles.inputField}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className={styles.fieldLabel}>Company name or contact person</span>
              <input
                value={identity}
                onChange={event => setIdentity(event.target.value)}
                placeholder="Company name or contact person"
                className={styles.inputField}
              />
            </label>
            <div className={styles.softCard} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 700 }}>Use company email + company/contact name.</p>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                Example: <strong>neelufercreation@gmail.com</strong> with <strong>Neelufer Creations</strong> or <strong>Neelu</strong>.
              </p>
            </div>
            {error ? (
              <div className={styles.errorBanner}>{error}</div>
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

        <div className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #1d4ed8, #111827)' }}>
          <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.72)' }}>What this portal gives you</p>
          <h2 className={styles.sectionTitle} style={{ color: '#ffffff', fontSize: '30px' }}>Professional hiring operations in one view</h2>
          <div className={styles.stack} style={{ marginTop: '18px' }}>
            {[
              'Track every worker application against the right job post.',
              'Shortlist, review, reject, or hire without leaving the company dashboard.',
              'Surface direct worker contact only when the worker account is active, preserving the current business rules.',
              'Stay fully connected to the labour admin module and live marketplace data.'
            ].map(item => (
              <div key={item} className={styles.bullet} style={{ color: '#ffffff' }}>
                <span className={styles.bulletDot} style={{ background: '#ffffff' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.stack}>
      <div className={styles.heroGrid}>
        <div className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #0f172a, #1d4ed8)' }}>
          <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.72)' }}>Company command center</p>
          <h1 className={styles.pageTitle} style={{ color: '#ffffff', marginBottom: '12px' }}>{dashboard.profile.companyName}</h1>
          <p className={styles.textMutedDark}>
            Managed by {dashboard.profile.contactPerson}. Operate live jobs, worker applications, and hiring status from one integrated workspace.
          </p>

          <div className={styles.fourColGrid} style={{ marginTop: '24px' }}>
            {[
              { label: 'Live jobs', value: String(dashboard.stats.liveJobPosts) },
              { label: 'Applications', value: String(dashboard.stats.totalApplications) },
              { label: 'Shortlisted', value: String(dashboard.stats.shortlistedApplications) },
              { label: 'Hired', value: String(dashboard.stats.hiredApplications) }
            ].map(item => (
              <div key={item.label} className={styles.metricCard}>
                <p className={styles.metricLabel}>{item.label}</p>
                <p className={styles.metricValue}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className={styles.chipRow} style={{ marginTop: '18px' }}>
            {dashboard.profile.categoryLabels.map(label => (
              <span key={label} className={styles.chip}>{label}</span>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Company profile</p>
              <h2 className={styles.sectionTitle}>Account snapshot</h2>
              <p className={styles.textMuted}>Current company status, plan, and hiring ownership details.</p>
            </div>
            <div className={styles.buttonRow}>
              <a
                href="/labour/company/search"
                className={styles.primaryButton}
                style={{ background: '#2563eb', color: '#ffffff', border: '1px solid transparent' }}
              >
                Browse Labour Search
              </a>
              <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          <div className={styles.stack}>
            {[
              ['Contact person', dashboard.profile.contactPerson],
              ['Email', dashboard.profile.email || 'Not added'],
              ['Primary mobile', dashboard.profile.mobile || 'Not added'],
              ['City', dashboard.profile.city || 'Not added'],
              ['Status', dashboard.profile.status],
              ['Active plan', dashboard.profile.activePlan || 'Not assigned']
            ].map(([label, value]) => (
              <div key={label} className={styles.softCard} style={{ padding: '16px 18px' }}>
                <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.twoColGrid}>
        <div className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>Hiring pipeline</h2>
              <p className={styles.textMuted}>A simple enterprise-style snapshot of live hiring performance.</p>
            </div>
          </div>

          <div className={styles.fourColGrid}>
            {[
              { label: 'Open jobs', value: dashboard.jobs.filter(job => job.status === 'live').length },
              { label: 'Reviewed', value: dashboard.jobs.reduce((sum, job) => sum + job.applicants.filter(applicant => applicant.status === 'reviewed').length, 0) },
              { label: 'Shortlisted', value: dashboard.stats.shortlistedApplications },
              { label: 'Hired', value: dashboard.stats.hiredApplications }
            ].map(item => (
              <div key={item.label} className={styles.softCard}>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>Recent activity</h2>
              <p className={styles.textMuted}>Latest applicant movement across your jobs.</p>
            </div>
          </div>

          <div className={styles.stack}>
            {activityRows.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: 0, color: '#475569', fontWeight: '700' }}>No recent activity yet.</p>
                <div className={styles.buttonRow} style={{ marginTop: '12px' }}>
                  <a href="/labour/company/search" className={styles.secondaryButton}>
                    Explore workers
                  </a>
                </div>
              </div>
            ) : (
              activityRows.map(activity => (
                <div key={activity.id} className={styles.softCard} style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '15px', fontWeight: '800' }}>{activity.title}</p>
                      <p className={styles.textMuted} style={{ fontSize: '13px' }}>{activity.detail}</p>
                    </div>
                    <span className={styles.chip} style={statusTone(activity.status)}>{activity.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>Worker applications</h2>
              <p className={styles.textMuted}>Filter by job and application stage, then update worker status without breaking the existing admin-linked application flow.</p>
            </div>
            <div className={styles.buttonRow}>
              <a href="/labour/company/search" className={styles.secondaryButton}>
                Search more workers
              </a>
              <select
                value={selectedJobId}
                onChange={event => setSelectedJobId(event.target.value)}
              className={styles.selectField}
            >
              <option value="all">All job posts</option>
              {dashboard.jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={event => setSelectedStatus(event.target.value)}
              className={styles.selectField}
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className={styles.errorBanner} style={{ marginBottom: '18px' }}>{error}</div>
        ) : null}

        <div className={styles.heroGrid}>
          <div className={styles.stack}>
            {filteredJobs.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>No applications match the current filters</p>
                <p className={styles.textMuted}>Try a different job or status filter to see active candidates.</p>
              </div>
            ) : (
              filteredJobs.map(job => {
                const selected = selectedJob?.id === job.id
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={styles.softCard}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderColor: selected ? '#93c5fd' : '#e2e8f0',
                      background: selected ? '#f8fbff' : '#fbfdff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{job.title}</p>
                        <p className={styles.textMuted}>{job.city} • {formatCurrency(job.wageAmount)} • Need {job.workersNeeded} workers</p>
                      </div>
                      <div className={styles.chipRow}>
                        <span className={styles.chip} style={statusTone(job.status)}>{job.status}</span>
                        <span className={styles.chip} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          {job.totalApplications} applicants
                        </span>
                      </div>
                    </div>
                    <div className={styles.fourColGrid} style={{ marginTop: '14px' }}>
                      {[
                        ['Published', formatDateTime(job.publishedAt)],
                        ['Expiry', formatDateTime(job.expiresAt)],
                        ['Shortlisted', String(job.shortlistedCount)],
                        ['Hired', String(job.hiredCount)]
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                          <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: '800' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className={styles.card} style={{ padding: '24px' }}>
            <div className={styles.sectionFooter}>
              <div>
                <h3 className={styles.sectionTitle} style={{ fontSize: '26px' }}>{selectedJob?.title || 'Job detail'}</h3>
                <p className={styles.textMuted}>Applicants and worker details for the selected job post.</p>
              </div>
              {selectedJob ? (
                <span className={styles.chip} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                  {selectedJob.applicants.length} visible applicants
                </span>
              ) : null}
            </div>

            {!selectedJob ? (
              <div className={styles.softCard}>
                <p style={{ margin: 0, color: '#475569', fontWeight: '700' }}>Select a job post to review applicants.</p>
              </div>
            ) : selectedJob.applicants.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: '800' }}>No applicants in this filtered view</p>
                <p className={styles.textMuted}>This job exists, but no applicant matches the selected filter right now.</p>
              </div>
            ) : (
              <div className={styles.stack}>
                {selectedJob.applicants.map(applicant => (
                  <div key={applicant.applicationId} className={styles.listCard}>
                    <div className={styles.sectionFooter}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900' }}>{applicant.fullName}</p>
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

                    <div className={styles.buttonRow} style={{ marginTop: '16px' }}>
                      {(['reviewed', 'shortlisted', 'rejected', 'hired'] as const).map(nextStatus => (
                        <button
                          key={nextStatus}
                          type="button"
                          className={nextStatus === 'hired' || nextStatus === 'shortlisted' ? styles.primaryButton : styles.secondaryButton}
                          style={
                            nextStatus === 'hired' || nextStatus === 'shortlisted'
                              ? { background: '#2563eb', color: '#ffffff', border: '1px solid transparent' }
                              : undefined
                          }
                          disabled={submitting || applicant.status === nextStatus}
                          onClick={() => updateStatus(applicant.applicationId, nextStatus)}
                        >
                          Mark {nextStatus}
                        </button>
                      ))}
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
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
