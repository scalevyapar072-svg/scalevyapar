'use client'

import { useEffect, useState } from 'react'

type TemplateButton = {
  type: 'CALL_PHONE_NUMBER' | 'URL' | 'QUICK_REPLY'
  label: string
  targetSummary: string
  optOutQuickReply: boolean
}

type TemplateOverview = {
  checkedAt: string
  connectionState: 'connected' | 'misconfigured' | 'timed_out' | 'error'
  previewSendingDisabled: boolean
  migrationApplied: false
  testActionEnabled: false
  persistenceState: string
  missingVariableNames: string[]
  sanitizedError: string | null
  templates: Array<{
    name: string
    language: string
    category: string
    status: string
    headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    bodyVariableCount: number
    footerTextPresent: boolean
    buttons: TemplateButton[]
    enabled: boolean
    enabledReason: string
    safeTestAvailable: boolean
    validationErrors: string[]
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

export default function LabourWhatsappTemplatesCard() {
  const [overview, setOverview] = useState<TemplateOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/labour/whatsapp/templates', {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({
          error: 'Unexpected response from server.',
        }))

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load WhatsApp template architecture.')
        }

        if (active) {
          setOverview((data.overview as TemplateOverview | undefined) || null)
        }
      } catch (loadError) {
        if (active) {
          setOverview(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load WhatsApp template architecture.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadOverview()

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
            Templates
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
            Read-only template architecture using the secure Meta inspection path. Persisted
            enablement stays inactive until the reviewed migration is approved and applied.
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
          Loading template architecture...
        </div>
      ) : null}

      {overview ? (
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
            <div>Connection state: {overview.connectionState}</div>
            <div>Last checked: {formatDateTime(overview.checkedAt)}</div>
            <div>Preview sending disabled: {overview.previewSendingDisabled ? 'YES' : 'NO'}</div>
            <div>Persistence state: {overview.persistenceState}</div>
            <div>
              Missing variables:{' '}
              {overview.missingVariableNames.length > 0
                ? overview.missingVariableNames.join(', ')
                : 'None'}
            </div>
            {overview.sanitizedError ? <div>Error: {overview.sanitizedError}</div> : null}
          </div>

          {overview.templates.length === 0 ? (
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
              No template inventory is available from the read-only Meta inspection path yet.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {overview.templates.map((template) => (
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
                    <span style={pillStyle}>Safe Test: {template.safeTestAvailable ? 'YES' : 'NO'}</span>
                  </div>

                  <div style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.7 }}>
                    <div>Body variables: {template.bodyVariableCount}</div>
                    <div>Footer present: {template.footerTextPresent ? 'YES' : 'NO'}</div>
                    <div>Enablement: {template.enabledReason}</div>
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

                  {template.validationErrors.length > 0 ? (
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
                      Validation warnings: {template.validationErrors.join(', ')}
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
