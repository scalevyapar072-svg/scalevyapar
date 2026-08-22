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
            Read-only database-backed template inventory. Sending, safe-test execution, and
            template synchronization remain disabled in this phase.
          </p>
        </div>
        <button
          type="button"
          disabled
          style={{
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            color: '#94a3b8',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'not-allowed',
          }}
        >
          Test Template (Disabled)
        </button>
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
