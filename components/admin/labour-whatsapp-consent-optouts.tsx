'use client'

import { useEffect, useState } from 'react'

type ConsentSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  recipientTotals: {
    worker: number
    company: number
  }
  counts: Array<{
    recipientType: 'worker' | 'company'
    consentType: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
    allowedCount: number
    blockedCount: number
    unknownCount: number
  }>
}

type SuppressionSummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  activeSuppressionCount: number
  recentRecords: Array<{
    maskedMobile: string
    suppressionScope: string
    triggerCommand: string
    triggerSource: string
    active: boolean
    createdAt: string
    restorationRequestedAt: string | null
    hasRestorationRequest: boolean
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

const formatDateTime = (value: string | null) => {
  if (!value) return 'Not requested'

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const consentTypeLabels: Record<ConsentSummary['counts'][number]['consentType'], string> = {
  service_allowed: 'Service messages',
  matching_alerts_allowed: 'Matching alerts',
  marketing_allowed: 'Marketing messages',
}

export default function LabourWhatsappConsentOptoutsCard() {
  const [consentSummary, setConsentSummary] = useState<ConsentSummary | null>(null)
  const [suppressionSummary, setSuppressionSummary] = useState<SuppressionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      setLoading(true)
      setError('')

      try {
        const [consentResponse, suppressionResponse] = await Promise.all([
          fetch('/api/admin/labour/whatsapp/consent-summary', {
            cache: 'no-store',
          }),
          fetch('/api/admin/labour/whatsapp/suppression-summary', {
            cache: 'no-store',
          }),
        ])

        const consentPayload = await consentResponse.json().catch(() => ({
          error: 'Unexpected consent response from server.',
        }))
        const suppressionPayload = await suppressionResponse.json().catch(() => ({
          error: 'Unexpected suppression response from server.',
        }))

        if (!consentResponse.ok) {
          throw new Error(
            consentPayload.error || 'Unable to load WhatsApp consent persistence summary.',
          )
        }

        if (!suppressionResponse.ok) {
          throw new Error(
            suppressionPayload.error || 'Unable to load WhatsApp suppression summary.',
          )
        }

        if (active) {
          setConsentSummary((consentPayload.summary as ConsentSummary | undefined) || null)
          setSuppressionSummary(
            (suppressionPayload.summary as SuppressionSummary | undefined) || null,
          )
        }
      } catch (loadError) {
        if (active) {
          setConsentSummary(null)
          setSuppressionSummary(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load WhatsApp consent persistence summary.',
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

  const connected = Boolean(consentSummary?.available && suppressionSummary?.available)
  const countRows = consentSummary?.counts || []

  return (
    <div id="whatsapp-consent-optouts" style={sectionCardStyle}>
      <div>
        <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px' }}>
          Consent &amp; Suppressions
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
          Read-only visibility into persisted consent state and suppression history. No manual
          override, restoration, or recipient messaging actions are active in this phase.
        </p>
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
          Loading consent and suppression persistence...
        </div>
      ) : null}

      {!loading && consentSummary && suppressionSummary ? (
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
              Consent persistence:{' '}
              {connected ? 'CONNECTED' : consentSummary.persistenceStatus || 'Persistence unavailable'}
            </div>
            <div>
              Fail-closed state:{' '}
              {consentSummary.failClosed || suppressionSummary.failClosed ? 'YES' : 'NO'}
            </div>
            <div>Active suppression count: {suppressionSummary.activeSuppressionCount}</div>
            <div>Worker recipients with valid WhatsApp targets: {consentSummary.recipientTotals.worker}</div>
            <div>Company recipients with valid WhatsApp targets: {consentSummary.recipientTotals.company}</div>
            <div>No consent override API: YES</div>
            <div>No recipient messaging action: YES</div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {(['worker', 'company'] as const).map((recipientType) => (
              <div
                key={recipientType}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  padding: '12px 14px',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                  {recipientType === 'worker' ? 'Worker consents' : 'Company consents'}
                </strong>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {countRows
                    .filter((row) => row.recipientType === recipientType)
                    .map((row) => (
                      <div key={`${row.recipientType}:${row.consentType}`} style={{ display: 'grid', gap: '4px' }}>
                        <span style={pillStyle}>{row.consentType}</span>
                        <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>
                          {consentTypeLabels[row.consentType]}
                        </div>
                        <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                          Allowed: {row.allowedCount} | Blocked: {row.blockedCount} | Unknown: {row.unknownCount}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#ffffff',
              padding: '12px 14px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              Recent suppression and restoration activity
            </strong>
            {suppressionSummary.recentRecords.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                No persisted suppression records are available yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {suppressionSummary.recentRecords.map((record, index) => (
                  <div
                    key={`${record.maskedMobile}:${record.createdAt}:${index}`}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      padding: '12px 14px',
                      display: 'grid',
                      gap: '5px',
                      color: '#0f172a',
                      fontSize: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    <div>Mobile: {record.maskedMobile || 'Masked unavailable'}</div>
                    <div>
                      Command: {record.triggerCommand} | Source: {record.triggerSource}
                    </div>
                    <div>
                      Scope: {record.suppressionScope} | Active: {record.active ? 'YES' : 'NO'}
                    </div>
                    <div>Suppressed at: {formatDateTime(record.createdAt)}</div>
                    <div>
                      Restoration requested:{' '}
                      {record.hasRestorationRequest
                        ? formatDateTime(record.restorationRequestedAt)
                        : 'NO'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
