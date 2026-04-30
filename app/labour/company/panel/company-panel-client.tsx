'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    email: string
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
  if (value === 'shortlisted' || value === 'active' || value === 'hired') {
    return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
  }
  if (value === 'rejected' || value === 'blocked') {
    return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
  }
  return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
}

export function CompanyPanelClient({ signinMode = false }: Props) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null)
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
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

      if (signinMode) {
        router.push('/labour/company/panel')
        return
      }

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

  const filteredJobs = useMemo(() => {
    if (!dashboard) return []

    return dashboard.jobs
      .map(job => ({
        ...job,
        applicants: job.applicants.filter(applicant => selectedStatus === 'all' ? true : applicant.status === selectedStatus)
      }))
      .filter(job => selectedJobId === 'all' ? true : job.id === selectedJobId)
      .filter(job => job.applicants.length > 0 || selectedStatus === 'all')
  }, [dashboard, selectedJobId, selectedStatus])

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
            Sign in with your registered company email and your company or contact name. This is the working company panel for viewing job applications.
          </p>
          <form className={styles.stack} onSubmit={submitLogin}>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Registered company email"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
            />
            <input
              value={identity}
              onChange={event => setIdentity(event.target.value)}
              placeholder="Company name or contact person"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }}
            />
            {error ? (
              <div className={styles.softCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                <p style={{ margin: 0, color: '#b91c1c', fontWeight: 700 }}>{error}</p>
              </div>
            ) : null}
            <button
              type="submit"
              className={styles.primaryButton}
              style={{ background: '#2563eb', color: '#ffffff', border: '1px solid transparent' }}
              disabled={submitting}
            >
              {submitting ? 'Opening company panel...' : 'Open company panel'}
            </button>
          </form>
        </div>

        <div className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #1d4ed8, #111827)' }}>
          <p className={styles.sectionTitle} style={{ color: '#ffffff', fontSize: '26px' }}>What companies can do here</p>
          <div className={styles.stack}>
            {[
              'View every worker application per job post',
              'Shortlist, review, reject, or hire applicants',
              'See direct worker contact when the worker account is active',
              'Track recent applicant movement across live job posts'
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
        <div className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #1d4ed8, #111827)' }}>
          <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.75)' }}>{dashboard.profile.city}</p>
          <h1 className={styles.pageTitle} style={{ color: '#ffffff', marginBottom: '12px' }}>{dashboard.profile.companyName}</h1>
          <p className={styles.textMutedDark}>
            Managed by {dashboard.profile.contactPerson}. Email: {dashboard.profile.email || 'Not added'}. Status: {dashboard.profile.status}. Active plan: {dashboard.profile.activePlan || 'Not assigned'}.
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
              <h2 className={styles.sectionTitle}>Recent applications</h2>
              <p className={styles.textMuted}>Quick view of the latest workers who applied across your job posts.</p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className={styles.stack}>
            {dashboard.recentApplications.length === 0 ? (
              <div className={styles.softCard}>
                <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>No worker applications yet.</p>
              </div>
            ) : dashboard.recentApplications.slice(0, 5).map(applicant => (
              <div key={applicant.applicationId} className={styles.softCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900 }}>{applicant.fullName}</p>
                    <p className={styles.textMuted}>{applicant.city} • {formatCurrency(applicant.expectedDailyWage)} expected wage</p>
                  </div>
                  <span className={styles.chip} style={statusTone(applicant.status)}>{applicant.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <h2 className={styles.sectionTitle}>Worker applications</h2>
            <p className={styles.textMuted}>Review applicants job by job and update their status from this panel.</p>
          </div>
          <div className={styles.buttonRow}>
            <select
              value={selectedJobId}
              onChange={event => setSelectedJobId(event.target.value)}
              style={{ minHeight: '46px', borderRadius: '14px', border: '1px solid #dbe2ea', padding: '10px 14px', background: '#ffffff' }}
            >
              <option value="all">All job posts</option>
              {dashboard.jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={event => setSelectedStatus(event.target.value)}
              style={{ minHeight: '46px', borderRadius: '14px', border: '1px solid #dbe2ea', padding: '10px 14px', background: '#ffffff' }}
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
          <div className={styles.softCard} style={{ marginBottom: '18px', borderColor: '#fecaca', background: '#fef2f2' }}>
            <p style={{ margin: 0, color: '#b91c1c', fontWeight: 700 }}>{error}</p>
          </div>
        ) : null}

        <div className={styles.stack}>
          {filteredJobs.length === 0 ? (
            <div className={styles.softCard}>
              <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>No worker applications match the current filter.</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job.id} className={styles.listCard}>
              <div className={styles.sectionFooter}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900 }}>{job.title}</p>
                  <p className={styles.textMuted}>
                    {job.city} • {formatCurrency(job.wageAmount)} • Need {job.workersNeeded} workers • Posted {formatDateTime(job.publishedAt)}
                  </p>
                </div>
                <div className={styles.chipRow}>
                  <span className={styles.chip} style={statusTone(job.status)}>{job.status}</span>
                  <span className={styles.chip} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    {job.totalApplications} applications
                  </span>
                </div>
              </div>

              <div className={styles.stack}>
                {job.applicants.length === 0 ? (
                  <div className={styles.softCard}>
                    <p style={{ margin: 0, color: '#64748b', fontWeight: 700 }}>No applicants yet for this job.</p>
                  </div>
                ) : job.applicants.map(applicant => (
                  <div key={applicant.applicationId} className={styles.softCard}>
                    <div className={styles.sectionFooter}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900 }}>{applicant.fullName}</p>
                        <p className={styles.textMuted}>
                          {applicant.city} • {formatCurrency(applicant.expectedDailyWage)} expected • {availabilityLabel(applicant.availability)}
                        </p>
                      </div>
                      <span className={styles.chip} style={statusTone(applicant.status)}>{applicant.status}</span>
                    </div>

                    <div className={styles.twoColGrid}>
                      <div className={styles.stack}>
                        <span className={styles.textMuted}>Skills: {applicant.skills.length ? applicant.skills.join(', ') : 'Not added'}</span>
                        <span className={styles.textMuted}>Experience: {applicant.experienceYears} years</span>
                        <span className={styles.textMuted}>Applied: {formatDateTime(applicant.appliedAt)}</span>
                        <span className={styles.textMuted}>Worker wallet: {formatCurrency(applicant.walletBalance)}</span>
                      </div>
                      <div className={styles.stack}>
                        <span className={styles.textMuted}>
                          Contact: {applicant.canContactDirectly ? (applicant.mobile || 'Unavailable') : 'Locked until worker account is active'}
                        </span>
                        <span className={styles.textMuted}>Categories: {applicant.categoryLabels.join(', ') || 'Not mapped'}</span>
                        <span className={styles.textMuted}>Application note: {applicant.note || 'No note added by worker'}</span>
                      </div>
                    </div>

                    <div className={styles.buttonRow} style={{ marginTop: '16px' }}>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
