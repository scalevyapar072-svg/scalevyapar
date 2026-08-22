'use client'

import { useEffect, useState } from 'react'

type TemplateSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  totalTemplates: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  templates: Array<{
    name: string
    language: string
    category: string
    status: string
    headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    enabled: boolean
    safeTestAvailable: boolean
    eligibility: {
      eligible: boolean
      reasonCodes: string[]
      approved: boolean
      headerValid: boolean
      bodySchemaValid: boolean
      buttonSchemaValid: boolean
      safeTestAllowed: boolean
    }
    bodyVariableCount: number
    buttons: Array<{
      type: 'CALL_PHONE_NUMBER' | 'URL' | 'QUICK_REPLY'
      label: string
      targetSummary: string
      optOutQuickReply: boolean
    }>
    updatedAt: string
  }>
}

export const WHATSAPP_FUTURE_CONTROLLED_LABEL = 'Disabled — future controlled phase'

export const WHATSAPP_TEMPLATE_HEADER_PREVIEW = [
  {
    type: 'NONE',
    title: 'No Header Template',
    detail: 'Body-only template preview. No media upload or header binding is active in this phase.',
  },
  {
    type: 'TEXT',
    title: 'Text Header Template',
    detail: 'Visible architecture for text headers only. Header variables stay disabled until a later phase.',
  },
  {
    type: 'IMAGE',
    title: 'Image Header Template',
    detail: 'Visible future image-header architecture only. Media upload and send remain disabled.',
  },
  {
    type: 'VIDEO',
    title: 'Video Header Template',
    detail: 'Visible future video-header architecture only. Preview does not upload or send media.',
  },
  {
    type: 'DOCUMENT',
    title: 'Document Header Template',
    detail: 'Visible future document-header architecture only. No file selection or delivery is active.',
  },
] as const

export const WHATSAPP_TEMPLATE_BUTTON_PREVIEW = [
  {
    type: 'CALL_PHONE_NUMBER',
    label: 'Call',
    detail: 'Future controlled button for approved business callback numbers only.',
  },
  {
    type: 'URL',
    label: 'Open Link',
    detail: 'Future controlled CTA for approved URLs only.',
  },
  {
    type: 'QUICK_REPLY',
    label: 'Stop Messages',
    detail: 'Mapped to the future opt-out flow. It is not represented as a phone or URL button.',
  },
] as const

export const WHATSAPP_TEST_TEMPLATE_RULES = [
  'Admin-only',
  'approved template only',
  'one allowlisted test number',
  'explicit confirmation',
  'no bulk recipients',
  'exact approved media/header type',
  'unavailable in Preview',
  'cannot bypass pause_all_sending',
] as const

export const WHATSAPP_WORKER_STATUS_PREVIEW_OPTIONS = [
  'All Status',
  'Active',
  'Paused by Worker',
  'Inactive',
  'Pending/Under Review',
  'Rejected',
  'Blocked',
  'Expired',
  'Wallet Empty',
  'Plan Expired',
] as const

export const WHATSAPP_COMPANY_STATUS_PREVIEW_OPTIONS = [
  'All Status',
  'Active',
  'Pending',
  'Inactive',
  'Blocked',
] as const

export const WHATSAPP_JOB_STATUS_PREVIEW_OPTIONS = [
  'All Status',
  'Draft',
  'Under Review',
  'Live',
  'Rejected',
  'Paused',
  'Expired',
] as const

export const WHATSAPP_AUTOMATIC_MATCHING_RULES = [
  'Automatic matching uses eligible Active Workers only.',
  'Paused by Worker never qualifies for automatic matching messages.',
  'Paused by Worker remains visible in the future manual Worker status filter only.',
  'Manual selection must still respect consent, suppression, Meta category, quiet hours, limits, pause_all_sending, and pre-send revalidation.',
] as const

const sectionCardStyle = {
  border: '1px solid #dbeafe',
  borderRadius: '16px',
  padding: '16px 18px',
  background: '#ffffff',
  display: 'grid',
  gap: '14px',
} as const

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '999px',
  padding: '5px 10px',
  fontSize: '11px',
  fontWeight: 700,
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  color: '#475569',
  letterSpacing: '0.03em',
  textTransform: 'uppercase' as const,
} as const

const architecturePanelStyle = {
  border: '1px solid #dbeafe',
  borderRadius: '14px',
  background: '#f8fbff',
  padding: '14px',
  display: 'grid',
  gap: '14px',
} as const

const disabledBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '999px',
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 700,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  color: '#64748b',
} as const

const previewInputStyle = {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #dbeafe',
  background: '#f8fafc',
  color: '#94a3b8',
  padding: '10px 12px',
  fontSize: '12px',
} as const

const disabledButtonStyle = {
  borderRadius: '10px',
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  color: '#94a3b8',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'not-allowed',
} as const

const previewCardStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#ffffff',
  padding: '12px',
  display: 'grid',
  gap: '10px',
} as const

const previewLabelStyle = {
  display: 'grid',
  gap: '6px',
  color: '#0f172a',
  fontSize: '12px',
  fontWeight: 700,
} as const

const previewNoteStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.6,
} as const

const formatDateTime = (value: string) => {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const formatCounts = (counts: Record<string, number>) => {
  const entries = Object.entries(counts)
  if (entries.length === 0) {
    return 'None'
  }

  return entries.map(([label, count]) => `${label}: ${count}`).join(', ')
}

export default function LabourWhatsappTemplatesCard() {
  const [summary, setSummary] = useState<TemplateSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/labour/whatsapp/template-inventory', {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({
          error: 'Unexpected response from server.',
        }))

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load WhatsApp template persistence summary.')
        }

        if (active) {
          setSummary((data.summary as TemplateSummary | undefined) || null)
        }
      } catch (loadError) {
        if (active) {
          setSummary(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load WhatsApp template persistence summary.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [])

  return (
    <div id="whatsapp-templates" style={sectionCardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px' }}>
            Template Inventory
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
            Read-only database-backed template inventory plus disabled future UI architecture for
            headers, buttons, and recipient targeting. Sending, safe-test execution, and template
            synchronization remain disabled in this phase.
          </p>
        </div>
        <button
          type="button"
          disabled
          style={disabledButtonStyle}
        >
          Test Template — {WHATSAPP_FUTURE_CONTROLLED_LABEL}
        </button>
      </div>

      <div style={architecturePanelStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: '4px' }}>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              Template, media, and CTA architecture preview
            </strong>
            <p style={previewNoteStyle}>
              Visible Admin-only planning surface for future controlled phases. Media upload,
              template execution, and message sending remain disabled.
            </p>
          </div>
          <span style={disabledBadgeStyle}>{WHATSAPP_FUTURE_CONTROLLED_LABEL}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {WHATSAPP_TEMPLATE_HEADER_PREVIEW.map((header) => (
            <div key={header.type} style={previewCardStyle}>
              <div style={{ display: 'grid', gap: '4px' }}>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>{header.title}</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Header type: {header.type}</span>
              </div>
              <p style={previewNoteStyle}>{header.detail}</p>
              <input
                disabled
                readOnly
                value={header.type === 'TEXT' ? 'Header text preview' : ''}
                placeholder={
                  header.type === 'NONE'
                    ? 'No header field required'
                    : `${header.type} header binding preview`
                }
                aria-label={`${header.type} header preview`}
                style={previewInputStyle}
              />
              <button type="button" disabled style={disabledButtonStyle}>
                {header.type === 'TEXT' ? 'Text binding' : 'Attach media'} — {WHATSAPP_FUTURE_CONTROLLED_LABEL}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {WHATSAPP_TEMPLATE_BUTTON_PREVIEW.map((button) => (
            <div key={button.type} style={previewCardStyle}>
              <div style={{ display: 'grid', gap: '4px' }}>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>{button.label}</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  Button type: {button.type}
                </span>
              </div>
              <p style={previewNoteStyle}>{button.detail}</p>
              <button type="button" disabled style={disabledButtonStyle}>
                {button.label} — {WHATSAPP_FUTURE_CONTROLLED_LABEL}
              </button>
            </div>
          ))}
        </div>

        <div style={previewCardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>Test Template</strong>
              <p style={previewNoteStyle}>
                Visible only as future controlled architecture. Preview cannot send, bypass
                safeguards, or target bulk recipients.
              </p>
            </div>
            <span style={disabledBadgeStyle}>{WHATSAPP_FUTURE_CONTROLLED_LABEL}</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
            }}
          >
            {WHATSAPP_TEST_TEMPLATE_RULES.map((rule) => (
              <div
                key={rule}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  padding: '10px 12px',
                  color: '#475569',
                  fontSize: '12px',
                }}
              >
                {rule}
              </div>
            ))}
          </div>
          <button type="button" disabled style={disabledButtonStyle}>
            Test Template — {WHATSAPP_FUTURE_CONTROLLED_LABEL}
          </button>
        </div>
      </div>

      <div style={architecturePanelStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: '4px' }}>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              Recipient filters, selection, and count preview
            </strong>
            <p style={previewNoteStyle}>
              Disabled future-controlled preview only. No actual Workers, Companies, or Jobs are
              loaded, queried, or selected here.
            </p>
          </div>
          <span style={disabledBadgeStyle}>{WHATSAPP_FUTURE_CONTROLLED_LABEL}</span>
        </div>

        <div
          style={{
            border: '1px solid #dbeafe',
            borderRadius: '12px',
            background: '#ffffff',
            padding: '12px 14px',
            display: 'grid',
            gap: '8px',
          }}
        >
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>Automatic matching guardrails</strong>
          <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
            {WHATSAPP_AUTOMATIC_MATCHING_RULES.map((rule) => (
              <div key={rule}>{rule}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={previewCardStyle}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>Worker filters preview</strong>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                Active-only automatic eligibility. Paused by Worker remains manual-only in a later phase.
              </span>
            </div>
            <label style={previewLabelStyle}>
              Worker All Status
              <select disabled aria-label="Worker All Status" style={previewInputStyle}>
                {WHATSAPP_WORKER_STATUS_PREVIEW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={previewLabelStyle}>
              Worker name/mobile
              <input disabled placeholder="Search Worker name/mobile" aria-label="Worker name/mobile" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Industry Category
              <input disabled placeholder="Industry Category" aria-label="Worker Industry Category" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Business Type
              <input disabled placeholder="Business Type" aria-label="Worker Business Type" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Worker Category
              <input disabled placeholder="Worker Category" aria-label="Worker Category" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              State
              <input disabled placeholder="State" aria-label="Worker State" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              City
              <input disabled placeholder="City" aria-label="Worker City" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Availability
              <select disabled aria-label="Worker Availability" style={previewInputStyle}>
                <option>All Availability</option>
                <option>Available Today</option>
                <option>Available This Week</option>
                <option>Not Available</option>
              </select>
            </label>
            <label style={previewLabelStyle}>
              Visibility
              <select disabled aria-label="Worker Visibility" style={previewInputStyle}>
                <option>All Visibility</option>
                <option>Visible</option>
                <option>Hidden</option>
              </select>
            </label>
            <label style={previewLabelStyle}>
              KYC / review status
              <select disabled aria-label="Worker KYC review status" style={previewInputStyle}>
                <option>All KYC / review status</option>
                <option>Not Submitted</option>
                <option>Ready for Review</option>
                <option>Needs Correction</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </label>
            <label style={previewLabelStyle}>
              Registration date from
              <input disabled placeholder="YYYY-MM-DD" aria-label="Worker registration date from" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Registration date to
              <input disabled placeholder="YYYY-MM-DD" aria-label="Worker registration date to" style={previewInputStyle} />
            </label>
          </div>

          <div style={previewCardStyle}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>Company filters preview</strong>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                Future manual Company recipient architecture only.
              </span>
            </div>
            <label style={previewLabelStyle}>
              Company All Status
              <select disabled aria-label="Company All Status" style={previewInputStyle}>
                {WHATSAPP_COMPANY_STATUS_PREVIEW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={previewLabelStyle}>
              Company name/mobile
              <input disabled placeholder="Search Company name/mobile" aria-label="Company name/mobile" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Industry Category
              <input disabled placeholder="Industry Category" aria-label="Company Industry Category" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Business Type
              <input disabled placeholder="Business Type" aria-label="Company Business Type" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              State
              <input disabled placeholder="State" aria-label="Company State" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              City
              <input disabled placeholder="City" aria-label="Company City" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Registration date from
              <input disabled placeholder="YYYY-MM-DD" aria-label="Company registration date from" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Registration date to
              <input disabled placeholder="YYYY-MM-DD" aria-label="Company registration date to" style={previewInputStyle} />
            </label>
          </div>

          <div style={previewCardStyle}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>Job filters preview</strong>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                Future manual Job targeting only. No matching or recipient load runs from this preview.
              </span>
            </div>
            <label style={previewLabelStyle}>
              Job All Status
              <select disabled aria-label="Job All Status" style={previewInputStyle}>
                {WHATSAPP_JOB_STATUS_PREVIEW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={previewLabelStyle}>
              Job Category filter
              <select disabled aria-label="Job Category filter" style={previewInputStyle}>
                <option>All Categories</option>
                <option>Specific category — future controlled phase</option>
              </select>
            </label>
            <label style={previewLabelStyle}>
              Company
              <input disabled placeholder="Company" aria-label="Job Company" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Industry Category
              <input disabled placeholder="Industry Category" aria-label="Job Industry Category" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Business Type
              <input disabled placeholder="Business Type" aria-label="Job Business Type" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              State
              <input disabled placeholder="State" aria-label="Job State" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              City
              <input disabled placeholder="City" aria-label="Job City" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Created date from
              <input disabled placeholder="YYYY-MM-DD" aria-label="Job created date from" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Created date to
              <input disabled placeholder="YYYY-MM-DD" aria-label="Job created date to" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Expiry date from
              <input disabled placeholder="YYYY-MM-DD" aria-label="Job expiry date from" style={previewInputStyle} />
            </label>
            <label style={previewLabelStyle}>
              Expiry date to
              <input disabled placeholder="YYYY-MM-DD" aria-label="Job expiry date to" style={previewInputStyle} />
            </label>
          </div>
        </div>

        <div style={previewCardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                Recipient selection and counts preview
              </strong>
              <p style={previewNoteStyle}>
                Select All, individual selection, and eligible/excluded totals are visible only as
                disabled planning controls in this phase.
              </p>
            </div>
            <button type="button" disabled style={disabledButtonStyle}>
              Select All — {WHATSAPP_FUTURE_CONTROLLED_LABEL}
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
            }}
          >
            {[
              'Eligible preview: 0',
              'Excluded preview: 0',
              'Selected preview: 0',
              'Recipient queries executed: NONE',
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  padding: '10px 12px',
                  color: '#0f172a',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              'Select eligible Worker recipients',
              'Select eligible Company recipients',
              'Select job-linked preview recipients',
            ].map((label) => (
              <label
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                <input type="checkbox" disabled aria-label={label} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            border: '1px solid #fecaca',
            borderRadius: '12px',
            background: '#fff1f2',
            color: '#b91c1c',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div
          style={{
            border: '1px solid #dbeafe',
            borderRadius: '12px',
            background: '#f8fbff',
            color: '#1d4ed8',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          Loading template inventory...
        </div>
      ) : null}

      {summary ? (
        <>
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc',
              padding: '12px 14px',
              display: 'grid',
              gap: '6px',
              color: '#0f172a',
              fontSize: '13px',
              lineHeight: 1.7,
            }}
          >
            <div>
              Persistence state: {summary.available ? 'CONNECTED' : summary.persistenceStatus}
            </div>
            <div>Fail-closed state: {summary.failClosed ? 'YES' : 'NO'}</div>
            <div>Total templates: {summary.totalTemplates}</div>
            <div>By status: {formatCounts(summary.byStatus)}</div>
            <div>By category: {formatCounts(summary.byCategory)}</div>
          </div>

          {summary.templates.length === 0 ? (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#f8fafc',
                padding: '12px 14px',
                color: '#475569',
                fontSize: '13px',
              }}
            >
              {summary.available
                ? 'No persisted template inventory rows are available yet.'
                : 'Persistence unavailable. Preview remains fail-closed until safe server-only database configuration exists.'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {summary.templates.map((template) => (
                <div
                  key={`${template.name}:${template.language}`}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '14px',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '14px' }}>{template.name}</strong>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      Language: {template.language || 'unknown'} | Meta category: {template.category || 'UNKNOWN'} | Meta status: {template.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={pillStyle}>Header: {template.headerType}</span>
                    <span style={pillStyle}>Enabled: {template.enabled ? 'YES' : 'NO'}</span>
                    <span style={pillStyle}>
                      Safe Test: {template.safeTestAvailable ? 'YES' : 'NO'}
                    </span>
                  </div>

                  <div style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.7 }}>
                    <div>Last updated: {formatDateTime(template.updatedAt)}</div>
                    <div>Body variables: {template.bodyVariableCount}</div>
                    <div>
                      Eligibility: {template.eligibility.eligible ? 'READY' : 'BLOCKED'}
                    </div>
                    <div>
                      Buttons:{' '}
                      {template.buttons.length > 0
                        ? template.buttons
                            .map((button) =>
                              `${button.type} (${button.label}${button.optOutQuickReply ? ', opt-out' : ''})`,
                            )
                            .join(', ')
                        : 'None'}
                    </div>
                  </div>

                  {template.eligibility.reasonCodes.length > 0 ? (
                    <div
                      style={{
                        border: '1px solid #fed7aa',
                        borderRadius: '10px',
                        background: '#fff7ed',
                        color: '#c2410c',
                        padding: '10px 12px',
                        fontSize: '12px',
                        lineHeight: 1.6,
                      }}
                    >
                      Eligibility blockers: {template.eligibility.reasonCodes.join(', ')}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
