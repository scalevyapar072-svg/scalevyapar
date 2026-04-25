'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type DemandLevel = 'high' | 'medium' | 'low'
type WorkerStatus = 'pending' | 'active' | 'inactive_wallet_empty' | 'inactive_subscription_expired' | 'blocked'
type CompanyStatus = 'pending' | 'active' | 'inactive' | 'blocked'
type JobPostStatus = 'draft' | 'live' | 'expired' | 'paused'
type PlanAudience = 'worker' | 'company'
type WorkerAvailability = 'available_today' | 'available_this_week' | 'not_available'
type LabourSection = 'overview' | 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts' | 'auditLogs'
type LabourEntityType = 'categories' | 'plans' | 'workers' | 'companies' | 'jobPosts'

type LabourCategory = {
  id: string
  name: string
  slug: string
  description: string
  demandLevel: DemandLevel
  isActive: boolean
}

type LabourPlan = {
  id: string
  audience: PlanAudience
  name: string
  categoryId?: string
  registrationFee: number
  walletCredit: number
  planAmount: number
  validityDays: number
  dailyCharge: number
  description: string
  isActive: boolean
}

type LabourWorker = {
  id: string
  fullName: string
  mobile: string
  city: string
  experienceYears: number
  expectedDailyWage: number
  walletBalance: number
  status: WorkerStatus
  availability: WorkerAvailability
  isVisible: boolean
  categoryIds: string[]
}

type LabourCompany = {
  id: string
  companyName: string
  contactPerson: string
  mobile: string
  city: string
  categoryIds: string[]
  status: CompanyStatus
  registrationFeePaid: boolean
  activePlan: string
}

type LabourJobPost = {
  id: string
  companyId: string
  categoryId: string
  title: string
  description: string
  city: string
  workersNeeded: number
  wageAmount: number
  validityDays: number
  status: JobPostStatus
  publishedAt: string
  expiresAt: string
}

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string
  summary: string
  actor: string
  createdAt: string
}

type LabourSnapshot = {
  categories: LabourCategory[]
  plans: LabourPlan[]
  workers: LabourWorker[]
  companies: LabourCompany[]
  jobPosts: LabourJobPost[]
  auditLogs: AuditLog[]
  stats: {
    activeWorkers: number
    inactiveWorkers: number
    activeCompanies: number
    liveJobPosts: number
    totalWalletBalance: number
    recentAuditLogs: AuditLog[]
  }
  storage: 'supabase' | 'json'
}

const blankCategory: LabourCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  demandLevel: 'medium',
  isActive: true
}

const blankPlan: LabourPlan = {
  id: '',
  audience: 'worker',
  name: '',
  categoryId: '',
  registrationFee: 0,
  walletCredit: 0,
  planAmount: 0,
  validityDays: 0,
  dailyCharge: 0,
  description: '',
  isActive: true
}

const blankWorker: LabourWorker = {
  id: '',
  fullName: '',
  mobile: '',
  city: '',
  experienceYears: 0,
  expectedDailyWage: 0,
  walletBalance: 0,
  status: 'pending',
  availability: 'available_today',
  isVisible: true,
  categoryIds: []
}

const blankCompany: LabourCompany = {
  id: '',
  companyName: '',
  contactPerson: '',
  mobile: '',
  city: '',
  categoryIds: [],
  status: 'pending',
  registrationFeePaid: false,
  activePlan: ''
}

const blankJobPost: LabourJobPost = {
  id: '',
  companyId: '',
  categoryId: '',
  title: '',
  description: '',
  city: '',
  workersNeeded: 1,
  wageAmount: 0,
  validityDays: 3,
  status: 'draft',
  publishedAt: '',
  expiresAt: ''
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const formatDateTime = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function LabourExchangeAdminPage() {
  const [snapshot, setSnapshot] = useState<LabourSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [activeSection, setActiveSection] = useState<LabourSection>('overview')

  const [categoryDraft, setCategoryDraft] = useState<LabourCategory>(blankCategory)
  const [planDraft, setPlanDraft] = useState<LabourPlan>(blankPlan)
  const [workerDraft, setWorkerDraft] = useState<LabourWorker>(blankWorker)
  const [companyDraft, setCompanyDraft] = useState<LabourCompany>(blankCompany)
  const [jobPostDraft, setJobPostDraft] = useState<LabourJobPost>(blankJobPost)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [editingJobPostId, setEditingJobPostId] = useState<string | null>(null)

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    color: '#0f172a',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  }

  const labelStyle = {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600' as const,
    display: 'block' as const,
    marginBottom: '4px'
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
  }

  const fetchSnapshot = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Unable to load labour exchange data.')
      }

      const data = await response.json()
      setSnapshot(data)
    } catch {
      setError('Unable to load labour exchange data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSnapshot()
  }, [])

  const showSaved = (message: string) => {
    setSaved(message)
    setTimeout(() => setSaved(''), 2500)
  }

  const replaceSnapshot = (nextSnapshot: LabourSnapshot) => {
    setSnapshot(nextSnapshot)
    setError('')
  }

  const persistEntity = async (
    method: 'POST' | 'PUT',
    entityType: LabourEntityType,
    payload: Record<string, unknown>,
    id?: string
  ) => {
    const response = await fetch('/api/admin/labour', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(method === 'POST' ? { entityType, payload } : { entityType, id, payload })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to save record.')
      return false
    }

    replaceSnapshot(data.snapshot)
    return true
  }

  const removeEntity = async (entityType: LabourEntityType, id: string, label: string) => {
    setError('')
    const confirmed = window.confirm(`Delete ${label}?`)
    if (!confirmed) return

    const response = await fetch('/api/admin/labour', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, id })
    })

    const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!response.ok) {
      setError(data.error || 'Failed to delete record.')
      return
    }

    replaceSnapshot(data.snapshot)
    showSaved(`${label} deleted`)
  }

  const saveCategory = async () => {
    setError('')
    const payload = {
      ...categoryDraft,
      slug: categoryDraft.slug || slugify(categoryDraft.name)
    }

    if (!payload.name.trim()) {
      setError('Category name is required.')
      return
    }

    const ok = await persistEntity(
      editingCategoryId ? 'PUT' : 'POST',
      'categories',
      payload,
      editingCategoryId || undefined
    )

    if (!ok) return
    setCategoryDraft(blankCategory)
    setEditingCategoryId(null)
    showSaved('Category saved')
  }

  const savePlan = async () => {
    setError('')
    if (!planDraft.name.trim()) {
      setError('Plan name is required.')
      return
    }

    const ok = await persistEntity(
      editingPlanId ? 'PUT' : 'POST',
      'plans',
      planDraft,
      editingPlanId || undefined
    )

    if (!ok) return
    setPlanDraft(blankPlan)
    setEditingPlanId(null)
    showSaved('Plan saved')
  }

  const saveWorker = async () => {
    setError('')
    if (!workerDraft.fullName.trim() || !workerDraft.mobile.trim()) {
      setError('Worker name and mobile are required.')
      return
    }

    const ok = await persistEntity(
      editingWorkerId ? 'PUT' : 'POST',
      'workers',
      workerDraft,
      editingWorkerId || undefined
    )

    if (!ok) return
    setWorkerDraft(blankWorker)
    setEditingWorkerId(null)
    showSaved('Worker saved')
  }

  const saveCompany = async () => {
    setError('')
    if (!companyDraft.companyName.trim() || !companyDraft.contactPerson.trim()) {
      setError('Company name and contact person are required.')
      return
    }

    const ok = await persistEntity(
      editingCompanyId ? 'PUT' : 'POST',
      'companies',
      companyDraft,
      editingCompanyId || undefined
    )

    if (!ok) return
    setCompanyDraft(blankCompany)
    setEditingCompanyId(null)
    showSaved('Company saved')
  }

  const saveJobPost = async () => {
    setError('')
    if (!jobPostDraft.title.trim() || !jobPostDraft.companyId || !jobPostDraft.categoryId) {
      setError('Job title, company and category are required.')
      return
    }

    const ok = await persistEntity(
      editingJobPostId ? 'PUT' : 'POST',
      'jobPosts',
      jobPostDraft,
      editingJobPostId || undefined
    )

    if (!ok) return
    setJobPostDraft(blankJobPost)
    setEditingJobPostId(null)
    showSaved('Job post saved')
  }

  const onMultiSelectChange = (values: string[], nextValue: string) =>
    values.includes(nextValue) ? values.filter(item => item !== nextValue) : [...values, nextValue]

  const getCategoryName = (categoryId: string) =>
    snapshot?.categories.find(category => category.id === categoryId)?.name || categoryId

  const getPlanName = (planId: string) =>
    snapshot?.plans.find(plan => plan.id === planId)?.name || planId

  const getCompanyName = (companyId: string) =>
    snapshot?.companies.find(company => company.id === companyId)?.companyName || companyId

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading labour exchange admin...</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error || 'Unable to load the labour exchange module.'}</p>
        <button onClick={() => void fetchSnapshot()} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {(saved || error) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          {error || saved}
        </div>
      )}

      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '800' }}>
            LX
          </div>
          <div>
            <p style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>Labour Exchange</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>Admin control center for workers, companies, plans and job posts</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
            Back To Admin
          </Link>
          <button onClick={() => void fetchSnapshot()} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 32px 40px' }}>
        <div style={{ ...cardStyle, marginBottom: '20px', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Storage Mode
            </p>
            <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
              {snapshot.storage === 'supabase'
                ? 'This module is currently reading and writing live Supabase tables.'
                : 'This module is currently using the local JSON fallback because the Supabase labour tables do not exist yet.'}
            </p>
          </div>
          {snapshot.storage === 'json' && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px' }}>
                Run [labour-marketplace.sql](/C:/Users/neelu/Documents/New%20project/scalevyapar/supabase/labour-marketplace.sql:1) in the Supabase SQL editor, then sync the seed data.
              </p>
              <button
                onClick={async () => {
                  setError('')
                  const response = await fetch('/api/admin/labour/sync', { method: 'POST' })
                  const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
                  if (!response.ok) {
                    setError(data.error || 'Failed to sync labour data to Supabase.')
                    return
                  }
                  replaceSnapshot(data.snapshot)
                  showSaved('Labour data synced to Supabase')
                }}
                style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
              >
                Sync To Supabase
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {[
            { label: 'Active Workers', value: snapshot.stats.activeWorkers, accent: '#10b981' },
            { label: 'Inactive Workers', value: snapshot.stats.inactiveWorkers, accent: '#f59e0b' },
            { label: 'Active Companies', value: snapshot.stats.activeCompanies, accent: '#2563eb' },
            { label: 'Live Job Posts', value: snapshot.stats.liveJobPosts, accent: '#7c3aed' },
            { label: 'Wallet Balance', value: formatCurrency(snapshot.stats.totalWalletBalance), accent: '#0f172a' }
          ].map(card => (
            <div key={card.label} style={{ ...cardStyle, padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '26px', color: card.accent, fontWeight: '800' }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
          {[
            ['overview', 'Overview'],
            ['categories', 'Categories'],
            ['plans', 'Plans'],
            ['workers', 'Workers'],
            ['companies', 'Companies'],
            ['jobPosts', 'Job Posts'],
            ['auditLogs', 'Audit Logs']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as LabourSection)}
              style={{
                padding: '10px 16px',
                border: `1px solid ${activeSection === key ? '#cbd5e1' : '#e2e8f0'}`,
                background: activeSection === key ? '#ffffff' : '#f8fafc',
                color: activeSection === key ? '#0f172a' : '#64748b',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeSection === key ? '700' : '600'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '20px' }}>Module scope ready for build-out</h2>
              <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                This admin module now gives you an editable control center for labour categories, worker and company plans, worker profiles, company accounts and job posts. Every create, update and delete action is logged in the audit trail below so we can keep financial and operational changes traceable.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                {[
                  `Categories: ${snapshot.categories.length}`,
                  `Plans: ${snapshot.plans.length}`,
                  `Workers: ${snapshot.workers.length}`,
                  `Companies: ${snapshot.companies.length}`,
                  `Job Posts: ${snapshot.jobPosts.length}`,
                  `Audit Logs: ${snapshot.auditLogs.length}`
                ].map(item => (
                  <div key={item} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '17px' }}>Recent admin activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {snapshot.stats.recentAuditLogs.length === 0 ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No changes logged yet. Start editing the data and the audit trail will populate automatically.</p>
                ) : (
                  snapshot.stats.recentAuditLogs.map(log => (
                    <div key={log.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{log.summary}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{log.actor} • {formatDateTime(log.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>{editingCategoryId ? 'Edit Category' : 'Add Category'}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Category Name *</label>
                  <input value={categoryDraft.name} onChange={event => setCategoryDraft(current => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Slug</label>
                  <input value={categoryDraft.slug} onChange={event => setCategoryDraft(current => ({ ...current, slug: slugify(event.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Demand Level</label>
                  <select value={categoryDraft.demandLevel} onChange={event => setCategoryDraft(current => ({ ...current, demandLevel: event.target.value as DemandLevel }))} style={inputStyle}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={categoryDraft.description} onChange={event => setCategoryDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={categoryDraft.isActive} onChange={event => setCategoryDraft(current => ({ ...current, isActive: event.target.checked }))} />
                  Category is active
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveCategory} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Save Category</button>
                  <button onClick={() => { setCategoryDraft(blankCategory); setEditingCategoryId(null) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Categories</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshot.categories.map(category => (
                  <div key={category.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{category.name}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>{category.slug} • {category.demandLevel} demand • {category.isActive ? 'Active' : 'Inactive'}</p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{category.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button onClick={() => { setCategoryDraft(category); setEditingCategoryId(category.id) }} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                      <button onClick={() => void removeEntity('categories', category.id, category.name)} style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'plans' && (
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>{editingPlanId ? 'Edit Plan' : 'Add Plan'}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Plan Name *</label>
                  <input value={planDraft.name} onChange={event => setPlanDraft(current => ({ ...current, name: event.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Audience</label>
                    <select value={planDraft.audience} onChange={event => setPlanDraft(current => ({ ...current, audience: event.target.value as PlanAudience }))} style={inputStyle}>
                      <option value="worker">Worker</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category Override</label>
                    <select value={planDraft.categoryId || ''} onChange={event => setPlanDraft(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
                      <option value="">All Categories</option>
                      {snapshot.categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Registration Fee</label>
                    <input type="number" value={planDraft.registrationFee} onChange={event => setPlanDraft(current => ({ ...current, registrationFee: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Credit</label>
                    <input type="number" value={planDraft.walletCredit} onChange={event => setPlanDraft(current => ({ ...current, walletCredit: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Plan Amount</label>
                    <input type="number" value={planDraft.planAmount} onChange={event => setPlanDraft(current => ({ ...current, planAmount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Validity Days</label>
                    <input type="number" value={planDraft.validityDays} onChange={event => setPlanDraft(current => ({ ...current, validityDays: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Daily Charge</label>
                    <input type="number" value={planDraft.dailyCharge} onChange={event => setPlanDraft(current => ({ ...current, dailyCharge: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={planDraft.description} onChange={event => setPlanDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={planDraft.isActive} onChange={event => setPlanDraft(current => ({ ...current, isActive: event.target.checked }))} />
                  Plan is active
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={savePlan} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Save Plan</button>
                  <button onClick={() => { setPlanDraft(blankPlan); setEditingPlanId(null) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Plans</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshot.plans.map(plan => (
                  <div key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{plan.name}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                        {plan.audience} • {formatCurrency(plan.planAmount)} • {plan.validityDays} days • {plan.isActive ? 'Active' : 'Inactive'}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>{plan.description || 'No description yet.'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button onClick={() => { setPlanDraft(plan); setEditingPlanId(plan.id) }} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                      <button onClick={() => void removeEntity('plans', plan.id, plan.name)} style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'workers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>{editingWorkerId ? 'Edit Worker' : 'Add Worker'}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input value={workerDraft.fullName} onChange={event => setWorkerDraft(current => ({ ...current, fullName: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mobile *</label>
                    <input value={workerDraft.mobile} onChange={event => setWorkerDraft(current => ({ ...current, mobile: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={workerDraft.city} onChange={event => setWorkerDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Experience Years</label>
                    <input type="number" value={workerDraft.experienceYears} onChange={event => setWorkerDraft(current => ({ ...current, experienceYears: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Expected Daily Wage</label>
                    <input type="number" value={workerDraft.expectedDailyWage} onChange={event => setWorkerDraft(current => ({ ...current, expectedDailyWage: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Balance</label>
                    <input type="number" value={workerDraft.walletBalance} onChange={event => setWorkerDraft(current => ({ ...current, walletBalance: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={workerDraft.status} onChange={event => setWorkerDraft(current => ({ ...current, status: event.target.value as WorkerStatus }))} style={inputStyle}>
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="inactive_wallet_empty">inactive_wallet_empty</option>
                      <option value="inactive_subscription_expired">inactive_subscription_expired</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Availability</label>
                    <select value={workerDraft.availability} onChange={event => setWorkerDraft(current => ({ ...current, availability: event.target.value as WorkerAvailability }))} style={inputStyle}>
                      <option value="available_today">available_today</option>
                      <option value="available_this_week">available_this_week</option>
                      <option value="not_available">not_available</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Categories</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {snapshot.categories.map(category => (
                      <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={workerDraft.categoryIds.includes(category.id)}
                          onChange={() => setWorkerDraft(current => ({ ...current, categoryIds: onMultiSelectChange(current.categoryIds, category.id) }))}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={workerDraft.isVisible} onChange={event => setWorkerDraft(current => ({ ...current, isVisible: event.target.checked }))} />
                  Worker profile visible to companies
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveWorker} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Save Worker</button>
                  <button onClick={() => { setWorkerDraft(blankWorker); setEditingWorkerId(null) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Workers</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshot.workers.map(worker => (
                  <div key={worker.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{worker.fullName}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                        {worker.mobile} • {worker.city} • {worker.status} • {formatCurrency(worker.walletBalance)}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                        Categories: {worker.categoryIds.map(getCategoryName).join(', ') || 'None'} • Wage {formatCurrency(worker.expectedDailyWage)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button onClick={() => { setWorkerDraft(worker); setEditingWorkerId(worker.id) }} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                      <button onClick={() => void removeEntity('workers', worker.id, worker.fullName)} style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'companies' && (
          <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>{editingCompanyId ? 'Edit Company' : 'Add Company'}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input value={companyDraft.companyName} onChange={event => setCompanyDraft(current => ({ ...current, companyName: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Person *</label>
                    <input value={companyDraft.contactPerson} onChange={event => setCompanyDraft(current => ({ ...current, contactPerson: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Mobile</label>
                    <input value={companyDraft.mobile} onChange={event => setCompanyDraft(current => ({ ...current, mobile: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={companyDraft.city} onChange={event => setCompanyDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Categories</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {snapshot.categories.map(category => (
                      <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={companyDraft.categoryIds.includes(category.id)}
                          onChange={() => setCompanyDraft(current => ({ ...current, categoryIds: onMultiSelectChange(current.categoryIds, category.id) }))}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={companyDraft.status} onChange={event => setCompanyDraft(current => ({ ...current, status: event.target.value as CompanyStatus }))} style={inputStyle}>
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Active Plan</label>
                    <select value={companyDraft.activePlan} onChange={event => setCompanyDraft(current => ({ ...current, activePlan: event.target.value }))} style={inputStyle}>
                      <option value="">Select plan</option>
                      {snapshot.plans.filter(plan => plan.audience === 'company').map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
                  <input type="checkbox" checked={companyDraft.registrationFeePaid} onChange={event => setCompanyDraft(current => ({ ...current, registrationFeePaid: event.target.checked }))} />
                  Registration fee paid
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveCompany} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Save Company</button>
                  <button onClick={() => { setCompanyDraft(blankCompany); setEditingCompanyId(null) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Companies</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshot.companies.map(company => (
                  <div key={company.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{company.companyName}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                        {company.contactPerson} • {company.city} • {company.status} • {company.registrationFeePaid ? 'Fee Paid' : 'Fee Pending'}
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                        Categories: {company.categoryIds.map(getCategoryName).join(', ') || 'None'} • Plan {getPlanName(company.activePlan)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button onClick={() => { setCompanyDraft(company); setEditingCompanyId(company.id) }} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                      <button onClick={() => void removeEntity('companies', company.id, company.companyName)} style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'jobPosts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>{editingJobPostId ? 'Edit Job Post' : 'Add Job Post'}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Job Title *</label>
                  <input value={jobPostDraft.title} onChange={event => setJobPostDraft(current => ({ ...current, title: event.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <select value={jobPostDraft.companyId} onChange={event => setJobPostDraft(current => ({ ...current, companyId: event.target.value }))} style={inputStyle}>
                      <option value="">Select company</option>
                      {snapshot.companies.map(company => (
                        <option key={company.id} value={company.id}>{company.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select value={jobPostDraft.categoryId} onChange={event => setJobPostDraft(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
                      <option value="">Select category</option>
                      {snapshot.categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={jobPostDraft.description} onChange={event => setJobPostDraft(current => ({ ...current, description: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={jobPostDraft.city} onChange={event => setJobPostDraft(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Workers Needed</label>
                    <input type="number" value={jobPostDraft.workersNeeded} onChange={event => setJobPostDraft(current => ({ ...current, workersNeeded: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Wage Amount</label>
                    <input type="number" value={jobPostDraft.wageAmount} onChange={event => setJobPostDraft(current => ({ ...current, wageAmount: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Validity Days</label>
                    <input type="number" value={jobPostDraft.validityDays} onChange={event => setJobPostDraft(current => ({ ...current, validityDays: Number(event.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={jobPostDraft.status} onChange={event => setJobPostDraft(current => ({ ...current, status: event.target.value as JobPostStatus }))} style={inputStyle}>
                      <option value="draft">draft</option>
                      <option value="live">live</option>
                      <option value="expired">expired</option>
                      <option value="paused">paused</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Published At</label>
                    <input type="date" value={jobPostDraft.publishedAt} onChange={event => setJobPostDraft(current => ({ ...current, publishedAt: event.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expires At</label>
                    <input type="date" value={jobPostDraft.expiresAt} onChange={event => setJobPostDraft(current => ({ ...current, expiresAt: event.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveJobPost} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Save Job Post</button>
                  <button onClick={() => { setJobPostDraft(blankJobPost); setEditingJobPostId(null) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Job Posts</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {snapshot.jobPosts.map(jobPost => (
                  <div key={jobPost.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: '700' }}>{jobPost.title}</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px' }}>
                        {getCompanyName(jobPost.companyId)} • {getCategoryName(jobPost.categoryId)} • {jobPost.city} • {jobPost.status}
                      </p>
                      <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '13px' }}>{jobPost.description}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                        {jobPost.workersNeeded} workers • {formatCurrency(jobPost.wageAmount)} • {jobPost.validityDays} days • {jobPost.publishedAt} to {jobPost.expiresAt}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button onClick={() => { setJobPostDraft(jobPost); setEditingJobPostId(jobPost.id) }} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                      <button onClick={() => void removeEntity('jobPosts', jobPost.id, jobPost.title)} style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'auditLogs' && (
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Audit Logs</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {snapshot.auditLogs.length === 0 ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No audit logs yet.</p>
              ) : (
                snapshot.auditLogs.map(log => (
                  <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{log.summary}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{log.action.toUpperCase()} • {log.entityType} • {log.entityId}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px', color: '#334155', fontSize: '12px', fontWeight: '600' }}>{log.actor}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
