'use client'

import { useEffect, useState } from 'react'

type AutomationPreviewPlan = {
  automationEventType:
    | 'company_matching_digest'
    | 'worker_matching_digest'
    | 'worker_payment_or_plan_reminder'
    | 'worker_kyc_rejected'
  recipientType: 'worker' | 'company'
  maskedMobile: string
  templateName: string | null
  templateLanguage: string | null
  templateConfigured: boolean
  templateApproved: boolean
  templateEnabled: boolean
  templateStatus:
    | 'configured'
    | 'not_configured'
    | 'not_approved'
    | 'not_enabled'
  ctaUrl: string | null
  ctaStatus: 'configured' | 'not_available'
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
  subreason: string | null
  messagePreview: string | null
  consentEligible: boolean
  suppressionEligible: boolean
  templateEligible: boolean
  deepLinkEligible: boolean
  dispatchDecision: 'ready' | 'queued' | 'blocked'
  dispatchable: boolean
}

type AutomationPreviewFunnel = {
  marketplaceCandidatePlans: number
  consentEligiblePlans: number
  suppressionEligiblePlans: number
  templateEligiblePlans: number
  deepLinkEligiblePlans: number
  dispatchReadyPlans: number
  queuedPlans: number
  blockedPlans: number
}

type AutomationPreviewSummary = {
  checkedAt: string
  vercelEnv: string
  snapshotSource: 'supabase' | 'unavailable'
  snapshotReasonCategory:
    | 'live_read_ok'
    | 'missing_configuration'
    | 'marketplace_query_failed'
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
  workerPaymentPlanCount: number
  workerKycRejectedPlanCount: number
  companyFunnel: AutomationPreviewFunnel
  workerFunnel: AutomationPreviewFunnel
  workerPaymentFunnel: AutomationPreviewFunnel
  workerKycRejectedFunnel: AutomationPreviewFunnel
  companyPlans: AutomationPreviewPlan[]
  workerPlans: AutomationPreviewPlan[]
  workerPaymentPlans: AutomationPreviewPlan[]
  workerKycRejectedPlans: AutomationPreviewPlan[]
  workerLifecycleReconciliation: {
    source: 'supabase' | 'unavailable'
    reasonCategory:
      | 'live_read_ok'
      | 'missing_configuration'
      | 'marketplace_query_failed'
    totalWorkersChecked: number
    unchangedCount: number
    changeRequiredCount: number
    activeToInactiveWalletEmptyCount: number
    activeToInactiveSubscriptionExpiredCount: number
    otherTransitionCount: number
    transitions: Array<{
      fromStatus: string
      toStatus: string
      count: number
    }>
    changedWorkers: Array<{
      maskedMobile: string
      persistedStatus: string
      derivedStatus: string
      reasonCategory:
        | 'persisted_blocked'
        | 'persisted_rejected'
        | 'persisted_pending'
        | 'registration_incomplete'
        | 'kyc_not_approved'
        | 'worker_paused'
        | 'missing_active_plan'
        | 'expired_active_plan'
        | 'registration_fee_unpaid'
        | 'wallet_balance_non_positive'
        | 'eligible_active'
    }>
  }
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

const formatSnapshotReason = (
  value: AutomationPreviewSummary['snapshotReasonCategory'],
) => {
  switch (value) {
    case 'live_read_ok':
      return 'Live marketplace read succeeded'
    case 'missing_configuration':
      return 'Server-side Supabase configuration unavailable'
    case 'marketplace_query_failed':
      return 'Live marketplace read failed'
    default:
      return value
  }
}

const formatLifecycleReason = (
  value: AutomationPreviewSummary['workerLifecycleReconciliation']['changedWorkers'][number]['reasonCategory'],
) => {
  switch (value) {
    case 'persisted_blocked':
      return 'Persisted blocked status preserved'
    case 'persisted_rejected':
      return 'Persisted rejected status preserved'
    case 'persisted_pending':
      return 'Persisted pending status preserved'
    case 'registration_incomplete':
      return 'Registration incomplete'
    case 'kyc_not_approved':
      return 'KYC not approved'
    case 'worker_paused':
      return 'Paused by worker'
    case 'missing_active_plan':
      return 'No active plan'
    case 'expired_active_plan':
      return 'Plan expired'
    case 'registration_fee_unpaid':
      return 'Registration fee unpaid'
    case 'wallet_balance_non_positive':
      return 'Wallet balance non-positive'
    case 'eligible_active':
      return 'Eligible for active status'
    default:
      return value
  }
}

const renderFunnel = (
  funnel: AutomationPreviewFunnel,
  options: { label: string; showDeepLink: boolean },
) => (
  <div
    style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      background: '#f8fafc',
      padding: '12px 14px',
      display: 'grid',
      gap: '6px',
      color: '#0f172a',
      fontSize: '12px',
      lineHeight: 1.6,
    }}
  >
    <strong style={{ fontSize: '13px' }}>{options.label}</strong>
    <div>Marketplace candidate plans: {funnel.marketplaceCandidatePlans}</div>
    <div>Consent-eligible plans: {funnel.consentEligiblePlans}</div>
    <div>Suppression-eligible plans: {funnel.suppressionEligiblePlans}</div>
    <div>Template-eligible plans: {funnel.templateEligiblePlans}</div>
    {options.showDeepLink ? (
      <div>Deep-link eligible plans: {funnel.deepLinkEligiblePlans}</div>
    ) : null}
    <div>Dispatch-ready plans: {funnel.dispatchReadyPlans}</div>
    <div>Queued plans: {funnel.queuedPlans}</div>
    <div>Blocked plans: {funnel.blockedPlans}</div>
  </div>
)

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
              <div>Template status: {plan.templateStatus}</div>
              <div>CTA URL: {plan.ctaUrl || 'Not available'}</div>
              <div>CTA status: {plan.ctaStatus}</div>
              <div>Controlled subreason: {plan.subreason || 'None'}</div>
              <div>Preview copy: {plan.messagePreview || 'Not applicable'}</div>
              <div>Matching workers: {plan.matchingWorkerCount}</div>
              <div>Matching companies: {plan.matchingCompanyCount}</div>
              <div>Matching jobs: {plan.matchingJobCount}</div>
              <div>Live jobs considered: {plan.liveJobCount}</div>
              <div>Consent eligible: {plan.consentEligible ? 'YES' : 'NO'}</div>
              <div>Suppression eligible: {plan.suppressionEligible ? 'YES' : 'NO'}</div>
              <div>Template eligible: {plan.templateEligible ? 'YES' : 'NO'}</div>
              <div>Deep-link eligible: {plan.deepLinkEligible ? 'YES' : 'NO'}</div>
              <div>Dispatch decision: {plan.dispatchDecision}</div>
              <div>Dispatchable now: {plan.dispatchable ? 'YES' : 'NO'}</div>
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

const renderLifecycleReconciliation = (
  lifecycle: AutomationPreviewSummary['workerLifecycleReconciliation'],
) => (
  <div style={{ display: 'grid', gap: '12px' }}>
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#f8fafc',
        padding: '12px 14px',
        display: 'grid',
        gap: '6px',
        color: '#0f172a',
        fontSize: '12px',
        lineHeight: 1.7,
      }}
    >
      <strong style={{ fontSize: '13px' }}>Worker lifecycle reconciliation preview</strong>
      <div>Lifecycle source: {lifecycle.source}</div>
      <div>Lifecycle reason: {formatSnapshotReason(lifecycle.reasonCategory)}</div>
      <div>Total workers checked: {lifecycle.totalWorkersChecked}</div>
      <div>Persisted status unchanged: {lifecycle.unchangedCount}</div>
      <div>Status change required: {lifecycle.changeRequiredCount}</div>
      <div>
        active → inactive_wallet_empty: {lifecycle.activeToInactiveWalletEmptyCount}
      </div>
      <div>
        active → inactive_subscription_expired:{' '}
        {lifecycle.activeToInactiveSubscriptionExpiredCount}
      </div>
      <div>Other transitions: {lifecycle.otherTransitionCount}</div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
      }}
    >
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#ffffff',
          padding: '12px 14px',
          display: 'grid',
          gap: '6px',
          fontSize: '12px',
          color: '#0f172a',
        }}
      >
        <strong style={{ fontSize: '13px' }}>Transition counts</strong>
        {lifecycle.transitions.length > 0 ? (
          lifecycle.transitions.map((transition) => (
            <div key={`${transition.fromStatus}-${transition.toStatus}`}>
              {transition.fromStatus} → {transition.toStatus}: {transition.count}
            </div>
          ))
        ) : (
          <div style={{ color: '#64748b' }}>No lifecycle changes required in the current read.</div>
        )}
      </div>
    </div>

    {lifecycle.changedWorkers.length > 0 ? (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
        }}
      >
        {lifecycle.changedWorkers.map((worker) => (
          <div
            key={`${worker.maskedMobile}-${worker.persistedStatus}-${worker.derivedStatus}`}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              background: '#ffffff',
              padding: '14px',
              display: 'grid',
              gap: '6px',
              color: '#0f172a',
              fontSize: '12px',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ fontSize: '13px' }}>{worker.maskedMobile}</strong>
            <div>Persisted status: {worker.persistedStatus}</div>
            <div>Derived status: {worker.derivedStatus}</div>
            <div>Reason: {formatLifecycleReason(worker.reasonCategory)}</div>
          </div>
        ))}
      </div>
    ) : (
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
        No lifecycle reconciliation changes are visible in the current read-only snapshot.
      </div>
    )}
  </div>
)

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
            <div>Snapshot source: {summary.snapshotSource}</div>
            <div>Snapshot reason: {formatSnapshotReason(summary.snapshotReasonCategory)}</div>
            <div>Persistence status: {summary.persistenceStatus}</div>
            <div>pause_all_sending: {summary.pauseAllSending ? 'TRUE' : 'FALSE'}</div>
            <div>Pause reason: {summary.pauseReason}</div>
            <div>Preview sending disabled: {summary.previewSendingDisabled ? 'YES' : 'NO'}</div>
            <div>No database writes: {summary.noDatabaseWrites ? 'YES' : 'NO'}</div>
            <div>No Meta /messages calls: {summary.noMessagesCalls ? 'YES' : 'NO'}</div>
            <div>Worker deep link available: {summary.workerDeepLinkAvailable ? 'YES' : 'NO'}</div>
            <div>Automatic event categories: {summary.automaticEventCategories.join(', ')}</div>
          </div>

          {summary.snapshotSource !== 'supabase' ? (
            <div
              style={{
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                background: '#fffbeb',
                color: '#b45309',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              Live marketplace data is unavailable for this dry-run. Candidate plans are intentionally hidden until a
              Supabase snapshot read succeeds.
            </div>
          ) : null}

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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {renderLifecycleReconciliation(summary.workerLifecycleReconciliation)}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {renderFunnel(summary.companyFunnel, {
              label: 'Company digest funnel',
              showDeepLink: false,
            })}
            {renderFunnel(summary.workerFunnel, {
              label: 'Worker digest funnel',
              showDeepLink: true,
            })}
            {renderFunnel(summary.workerPaymentFunnel, {
              label: 'Worker payment/plan reminder funnel',
              showDeepLink: true,
            })}
            {renderFunnel(summary.workerKycRejectedFunnel, {
              label: 'Worker KYC rejected funnel',
              showDeepLink: true,
            })}
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

            <div>
              <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '14px' }}>
                Worker payment or plan reminder plans ({summary.workerPaymentPlanCount})
              </h4>
              {renderPlanGrid(
                summary.workerPaymentPlans,
                'No eligible worker payment or plan reminder candidates are visible in the current dry-run snapshot.',
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '14px' }}>
                Worker KYC rejected plans ({summary.workerKycRejectedPlanCount})
              </h4>
              {renderPlanGrid(
                summary.workerKycRejectedPlans,
                'No eligible worker KYC rejection candidates are visible in the current dry-run snapshot.',
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
