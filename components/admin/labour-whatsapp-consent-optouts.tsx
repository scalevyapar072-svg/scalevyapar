'use client'

import { useEffect, useState } from 'react'

type ConsentOverview = {
  migrationApplied: false
  readOnlyMode: true
  persistenceState: string
  consentTypes: Array<{
    type: 'service_allowed' | 'matching_alerts_allowed' | 'marketing_allowed'
    label: string
    description: string
  }>
  workerCollectionPoints: string[]
  companyCollectionPoints: string[]
  globalOptOutCommands: string[]
  restoreRequestCommands: string[]
  generalOptOutEffect: string
  restorationPolicy: string
  noManualConsentOverride: boolean
  recipientActionsEnabled: boolean
  maskedExampleMobile: string
}

const sectionCardStyle = {
  border: '1px solid #dbeafe',
  borderRadius: '16px',
  padding: '16px 18px',
  background: '#ffffff',
  display: 'grid',
  gap: '14px',
} as const

const chipStyle = {
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
} as const

export default function LabourWhatsappConsentOptoutsCard() {
  const [overview, setOverview] = useState<ConsentOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/labour/whatsapp/consents', {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({
          error: 'Unexpected response from server.',
        }))

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load WhatsApp consent architecture.')
        }

        if (active) {
          setOverview((data.overview as ConsentOverview | undefined) || null)
        }
      } catch (loadError) {
        if (active) {
          setOverview(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load WhatsApp consent architecture.',
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
    <div id="whatsapp-consent-optouts" style={sectionCardStyle}>
      <div>
        <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px' }}>
          Consent &amp; Opt-outs
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
          Read-only consent and suppression architecture. No manual overrides and no recipient
          messaging actions are active in Phase 16C.2.
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
          Loading consent architecture...
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
            <div>Migration applied: NO</div>
            <div>Read-only mode: YES</div>
            <div>Persistence state: {overview.persistenceState}</div>
            <div>Masked example mobile: {overview.maskedExampleMobile || 'Not available'}</div>
            <div>
              Manual consent override: {overview.noManualConsentOverride ? 'DISABLED' : 'ENABLED'}
            </div>
            <div>
              Recipient message action: {overview.recipientActionsEnabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
                gap: '10px',
              }}
            >
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>Consent categories</strong>
              <div style={{ display: 'grid', gap: '10px' }}>
                {overview.consentTypes.map((consentType) => (
                  <div key={consentType.type} style={{ display: 'grid', gap: '4px' }}>
                    <span style={chipStyle}>{consentType.type}</span>
                    <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>
                      {consentType.label}
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                      {consentType.description}
                    </div>
                  </div>
                ))}
              </div>
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
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>Worker collection points</strong>
              <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                {overview.workerCollectionPoints.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>Company collection points</strong>
              <div style={{ display: 'grid', gap: '6px', color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                {overview.companyCollectionPoints.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
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
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>Opt-out coverage</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {overview.globalOptOutCommands.map((command) => (
                  <span key={command} style={chipStyle}>
                    {command}
                  </span>
                ))}
              </div>
              <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                {overview.generalOptOutEffect}
              </div>
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>Opt-in restoration</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {overview.restoreRequestCommands.map((command) => (
                  <span key={command} style={chipStyle}>
                    {command}
                  </span>
                ))}
              </div>
              <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
                {overview.restorationPolicy}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
