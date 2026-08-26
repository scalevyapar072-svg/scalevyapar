'use client'

import { useEffect, useState } from 'react'

type AutomationPreviewPlan = {
  automationEventType: 'company_matching_digest' | 'worker_matching_digest'
  recipientType: 'worker' | 'company'
  maskedMobile: string
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
  ctaUrl: string | null
  matchingWorkerCount: number
  matchingCompanyCount: number
  matchingJobCount: number
  liveJobCount: number
  eligibilityResult: 'eligible' | 'blocked' | 'queued'
  exclusionReason: string | null
  quietHoursDecision: 'send_now' | 'queue_until_allowed' | 'blocked'
  idempotencyKey: string
  requiredConsents: string[]
  missingConsents: string[]
  resolvedRecipientSource: 'contact_mobile' | 'mobile' | 'direct' | 'none'
  matchedCategoryIds: string[]
  matchedCities: string[]
}

type AutomationPreviewSummary = {
  checkedAt: string
  vercelEnv: string
  snapshotStorage: 'supabase' | 'json'
  previewSendingDisabled: boolean
  pauseAllSending: boolean
  pauseReason: string
  failClosed: boolean
  persistenceAvailable: boolean
  persistenceStatus: string
  consentReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  suppressionReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  templateReadState: 'connected' | 'persistence_unavailable' | 'query_error'
  noDatabaseWrites: true
  noMessagesCalls: true
  workerDeepLinkAvailable: false
  automaticEventCategories: string[]
  companyPlanCount: number
  workerPlanCount: number
  companyPlans: AutomationPreviewPlan[]
  workerPlans: AutomationPreviewPlan[]
}

const sectionCardStyle = {
  border: '1px solid #dbeafe',
  borderRadius: '16px',
  padding: '16px 18px',
  background: '#ffffff',
  display: 'grid',
  gap: '14px',
} as const

const badgeStyle = (tone: 'blue' | 'amber' | 'slate' | 'green' | 'red') => {
  const palette = {
    blue: { border: '#bfdbfe', color: '#1d4ed8', background: '#eff6ff' },
    amber: { border: '#fcd34d', color: '#b45309', background: '#fffbeb' },
    slate: { border: '#cbd5e1', color: '#475569', background: '#f8fafc' },
    green: { border: '#99f6e4', color: '#0f766e', background: '#f0fdfa' },
    red: { border: '#fecaca', color: '#b91c1c', background: '#fff1f2' },
  }[tone]

  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 700,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.color,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  }
}

const formatDateTime = (value: string) => {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const formatList = (items: string[]) => (items.length > 0 ? items.join(', ') : 'None')

const renderPlanGrid = (plans: AutomationPreviewPlan[], emptyLabel: string) => {
  if (plans.length === 0) {
    return (
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#f8fafc',
          padding: '14px',
          color: '#64748b',
          fontSize: '13px',
        }}
      >
        {emptyLabel}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
      }}
    >
      {plans.map((plan) => {
        const eligibilityTone =
          plan.eligibilityResult === 'eligible'
            ? 'green'
            : plan.eligibilityResult === 'queued'
              ? 'amber'
              : 'red'

        return (
          <div
            key={plan.idempotencyKey}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              background: '#ffffff',
              padding: '14px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'grid', gap: '4px' }}>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                  {plan.automationEventType}
                </strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {plan.recipientType} · {plan.maskedMobile}
                </span>
              </div>
              <span style={badgeStyle(eligibilityTone)}>{plan.eligibilityResult}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '5px',
                color: '#0f172a',
                fontSize: '12px',
                lineHeight: 1.7,
              }}
            >
              <div>Template: {plan.templateName || 'Not configured'}</div>
              <div>Template language: {plan.templateLanguage || 'Not configured'}</div>
              <div>CTA URL: {plan.ctaUrl || 'Not available'}</div>
              <div>Matching workers: {plan.matchingWorkerCount}</div>
              <div>Matching companies: {plan.matchingCompanyCount}</div>
              <div>Matching jobs: {plan.matchingJobCount}</div>
              <div>Live jobs considered: {plan.liveJobCount}</div>
              <div>Quiet-hours decision: {plan.quietHoursDecision}</div>
              <div>Block reason: {plan.exclusionReason || 'None'}</div>
              <div>Recipient source: {plan.resolvedRecipientSource}</div>
              <div>Required consents: {formatList(plan.requiredConsents)}</div>
              <div>Missing consents: {formatList(plan.missingConsents)}</div>
              <div>Matched categories: {formatList(plan.matchedCategoryIds)}</div>
              <div>Matched cities: {formatList(plan.matchedCities)}</div>
              <div>Idempotency key: {plan.idempotencyKey}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LabourWhatsappAutomationPreviewCard() {
  const [summary, setSummary] = useState<AutomationPreviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/whatsapp/automation-preview', {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({
        error: 'Unexpected response from server.',
      }))

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load WhatsApp automation preview.')
      }

      setSummary((data.summary as AutomationPreviewSummary | undefined) || null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load WhatsApp automation preview.',
      )
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  return (
    <div id="whatsapp-automation-preview" style={sectionCardStyle}>
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
            Automatic-message planning preview
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
            Admin-only dry-run visibility for the existing 72-hour automation foundation.
            This preview is read-only and never sends WhatsApp messages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          style={{
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            color: '#0f172a',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Dry-Run'}
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

      {loading && !summary ? (
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
          Loading automatic-message planning preview...
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
              gap: '8px',
              color: '#0f172a',
              fontSize: '13px',
              lineHeight: 1.7,
            }}
          >
            <div>Last checked: {formatDateTime(summary.checkedAt)}</div>
            <div>Runtime environment: {summary.vercelEnv}</div>
            <div>Snapshot source: {summary.snapshotStorage}</div>
            <div>Persistence status: {summary.persistenceStatus}</div>
            <div>pause_all_sending: {summary.pauseAllSending ? 'TRUE' : 'FALSE'}</div>
            <div>Pause reason: {summary.pauseReason}</div>
            <div>Preview sending disabled: {summary.previewSendingDisabled ? 'YES' : 'NO'}</div>
            <div>No database writes: {summary.noDatabaseWrites ? 'YES' : 'NO'}</div>
            <div>No Meta /messages calls: {summary.noMessagesCalls ? 'YES' : 'NO'}</div>
            <div>Worker deep link available: {summary.workerDeepLinkAvailable ? 'YES' : 'NO'}</div>
            <div>Automatic event categories: {summary.automaticEventCategories.join(', ')}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={badgeStyle(summary.persistenceAvailable ? 'green' : 'amber')}>
              persistence: {summary.persistenceAvailable ? 'connected' : 'fallback'}
            </span>
            <span
              style={badgeStyle(
                summary.consentReadState === 'connected' ? 'green' : 'amber',
              )}
            >
              consent read: {summary.consentReadState}
            </span>
            <span
              style={badgeStyle(
                summary.suppressionReadState === 'connected' ? 'green' : 'amber',
              )}
            >
              suppression read: {summary.suppressionReadState}
            </span>
            <span
              style={badgeStyle(
                summary.templateReadState === 'connected' ? 'green' : 'amber',
              )}
            >
              template read: {summary.templateReadState}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '14px' }}>
                Company digest plans ({summary.companyPlanCount})
              </h4>
              {renderPlanGrid(
                summary.companyPlans,
                'No eligible company digest candidates are visible in the current dry-run snapshot.',
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '14px' }}>
                Worker digest plans ({summary.workerPlanCount})
              </h4>
              {renderPlanGrid(
                summary.workerPlans,
                'No eligible worker digest candidates are visible in the current dry-run snapshot.',
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
