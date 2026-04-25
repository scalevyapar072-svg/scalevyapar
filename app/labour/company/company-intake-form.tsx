'use client'

import { useState } from 'react'

type CategoryOption = {
  id: string
  name: string
  description: string
  demandLevel: 'high' | 'medium' | 'low'
}

type PlanOption = {
  id: string
  name: string
  planAmount: number
  registrationFee: number
  validityDays: number
  description: string
  categoryId?: string
}

type Props = {
  categories: CategoryOption[]
  plans: PlanOption[]
}

type FormState = {
  companyName: string
  contactPerson: string
  mobile: string
  city: string
  categoryIds: string[]
  activePlan: string
  categoryId: string
  jobTitle: string
  jobDescription: string
  workersNeeded: number
  wageAmount: number
  validityDays: number
}

const initialState: FormState = {
  companyName: '',
  contactPerson: '',
  mobile: '',
  city: '',
  categoryIds: [],
  activePlan: '',
  categoryId: '',
  jobTitle: '',
  jobDescription: '',
  workersNeeded: 1,
  wageAmount: 0,
  validityDays: 3
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export function CompanyIntakeForm({ categories, plans }: Props) {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    color: '#0f172a',
    fontSize: '14px',
    padding: '12px 14px',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  }

  const labelStyle = {
    fontSize: '12px',
    color: '#334155',
    fontWeight: '700' as const,
    display: 'block' as const,
    marginBottom: '6px'
  }

  const visiblePlans = plans.filter(plan => !plan.categoryId || form.categoryIds.includes(plan.categoryId))

  const toggleCategory = (categoryId: string) => {
    setForm(current => {
      const nextCategoryIds = current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter(id => id !== categoryId)
        : [...current.categoryIds, categoryId]

      return {
        ...current,
        categoryIds: nextCategoryIds,
        categoryId: nextCategoryIds.includes(current.categoryId) ? current.categoryId : nextCategoryIds[0] || '',
        activePlan: nextCategoryIds.some(id => visiblePlans.find(plan => plan.categoryId === id && plan.id === current.activePlan)) || !current.activePlan
          ? current.activePlan
          : ''
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/labour/company-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))
      if (!response.ok) {
        setError(data.error || 'Unable to submit company enquiry.')
        return
      }

      setSuccess(data.message || 'Company enquiry submitted successfully.')
      setForm(initialState)
    } catch {
      setError('Something went wrong while submitting the enquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '24px', padding: '24px', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' }}>
      <div style={{ marginBottom: '18px' }}>
        <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: '800', fontSize: '20px' }}>Post Your Labour Requirement</p>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
          Submit your company details and first hiring requirement. We will review the enquiry, activate your company profile, and publish the requirement.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '14px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#b91c1c', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', fontWeight: '700' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', fontWeight: '700' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input value={form.companyName} onChange={event => setForm(current => ({ ...current, companyName: event.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Person *</label>
            <input value={form.contactPerson} onChange={event => setForm(current => ({ ...current, contactPerson: event.target.value }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Mobile *</label>
            <input value={form.mobile} maxLength={10} onChange={event => setForm(current => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>City *</label>
            <input value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Labour Categories *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {categories.map(category => (
              <label key={category.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', border: `1px solid ${form.categoryIds.includes(category.id) ? '#0f172a' : '#dbe2ea'}`, borderRadius: '14px', cursor: 'pointer', background: form.categoryIds.includes(category.id) ? '#f8fafc' : '#ffffff' }}>
                <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} style={{ marginTop: '3px' }} />
                <span>
                  <span style={{ display: 'block', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{category.name}</span>
                  <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{category.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Plan *</label>
            <select value={form.activePlan} onChange={event => {
              const selectedPlan = plans.find(plan => plan.id === event.target.value)
              setForm(current => ({
                ...current,
                activePlan: event.target.value,
                validityDays: selectedPlan?.validityDays || current.validityDays
              }))
            }} style={inputStyle}>
              <option value="">Select a plan</option>
              {visiblePlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} | {formatCurrency(plan.planAmount)} | {plan.validityDays} days
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Main Category for First Requirement *</label>
            <select value={form.categoryId} onChange={event => setForm(current => ({ ...current, categoryId: event.target.value }))} style={inputStyle}>
              <option value="">Select a category</option>
              {categories.filter(category => form.categoryIds.includes(category.id)).map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Requirement Title *</label>
          <input value={form.jobTitle} onChange={event => setForm(current => ({ ...current, jobTitle: event.target.value }))} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Requirement Description</label>
          <textarea value={form.jobDescription} onChange={event => setForm(current => ({ ...current, jobDescription: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'none' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Workers Needed *</label>
            <input type="number" min="1" value={form.workersNeeded} onChange={event => setForm(current => ({ ...current, workersNeeded: Number(event.target.value) }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Daily Wage</label>
            <input type="number" min="0" value={form.wageAmount} onChange={event => setForm(current => ({ ...current, wageAmount: Number(event.target.value) }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Validity Days</label>
            <input type="number" min="1" value={form.validityDays} onChange={event => setForm(current => ({ ...current, validityDays: Number(event.target.value) }))} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={submitting} style={{ background: submitting ? '#94a3b8' : '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '14px 18px', fontSize: '14px', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? 'Submitting Requirement...' : 'Submit Company Requirement'}
        </button>
      </form>
    </div>
  )
}
