'use client'

import { useEffect, useState } from 'react'

type StatusTone = {
  border: string
  color: string
  background: string
}

type LabourWhatsappMetaStatus = {
  checkedAt: string
  environment: string
  graphApiVersion: string
  graphApiVersionSource: 'canonical' | 'fallback'
  previewSendingDisabled: boolean
  sendRuntimeReady: boolean
  secretsRedacted: true
  canonicalConfig: {
    accessTokenConfigured: boolean
    phoneNumberIdConfigured: boolean
    webhookVerifyTokenConfigured: boolean
    businessAccountIdConfigured: boolean
    appIdConfigured: boolean
    appSecretConfigured: boolean
    missingCanonicalVariables: string[]
    missingSendVariables: string[]
    missingWebhookPostVariables: string[]
    missingHealthVariables: string[]
  }
  legacyCompatibility: {
    usesLegacyAccessTokenAlias: boolean
    usesLegacyPhoneNumberIdAlias: boolean
    usesLegacyWebhookVerifyTokenAlias: boolean
  }
  providerHealth: {
    attempted: boolean
    ok: boolean
    status: 'ok' | 'misconfigured' | 'degraded' | 'error'
    requestPath: string
    neverCallsMessages: true
    usesAppSecretProof: boolean
    configuredPhoneNumberMatch: boolean | null
    discoveredPhoneNumberCount: number | null
    missingVariables: string[]
    error: string | null
  }
}

const toneByStatus: Record<LabourWhatsappMetaStatus['providerHealth']['status'], StatusTone> = {
  ok: {
    border: '#99f6e4',
    color: '#0f766e',
    background: '#f0fdfa',
  },
  misconfigured: {
    border: '#fed7aa',
    color: '#c2410c',
    background: '#fff7ed',
  },
  degraded: {
    border: '#fde68a',
    color: '#a16207',
    background: '#fffbeb',
  },
  error: {
    border: '#fecaca',
    color: '#b91c1c',
    background: '#fff1f2',
  },
}

const formatDateTime = (value: string) => {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const StatusChip = ({
  label,
  active,
}: {
  label: string
  active: boolean
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '999px',
      padding: '5px 10px',
      fontSize: '11px',
      fontWeight: 700,
      border: `1px solid ${active ? '#99f6e4' : '#cbd5e1'}`,
      background: active ? '#f0fdfa' : '#f8fafc',
      color: active ? '#0f766e' : '#64748b',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }}
  >
    {label}: {active ? 'configured' : 'missing'}
  </span>
)

export default function LabourWhatsappMetaStatusCard() {
  const [status, setStatus] = useState<LabourWhatsappMetaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStatus = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/whatsapp/meta-status', {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({
        error: 'Unexpected response from server.',
      }))

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load Meta connection status.')
      }

      setStatus((data.status as LabourWhatsappMetaStatus | undefined) || null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load Meta connection status.',
      )
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const tone = status ? toneByStatus[status.providerHealth.status] : toneByStatus.error

  return (
    <div
      style={{
        border: '1px solid #dbeafe',
        borderRadius: '16px',
        padding: '16px 18px',
        background: '#ffffff',
        display: 'grid',
        gap: '14px',
      }}
    >
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
            Meta connection infrastructure
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
            Read-only health status for the secure Meta connection layer. This panel
            never sends WhatsApp messages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
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
          {loading ? 'Refreshing...' : 'Refresh Meta Status'}
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

      {status ? (
        <>
          <div
            style={{
              border: `1px solid ${tone.border}`,
              borderRadius: '12px',
              background: tone.background,
              color: tone.color,
              padding: '12px 14px',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <strong style={{ fontSize: '13px' }}>
                Provider health: {status.providerHealth.status}
              </strong>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                Last checked: {formatDateTime(status.checkedAt)}
              </span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.7 }}>
              <div>Environment: {status.environment}</div>
              <div>
                Graph API version: {status.graphApiVersion} ({status.graphApiVersionSource})
              </div>
              <div>Read-only endpoint: {status.providerHealth.requestPath}</div>
              <div>
                Preview sending disabled:{' '}
                {status.previewSendingDisabled ? 'YES' : 'NO'}
              </div>
              <div>
                Health check never calls /messages:{' '}
                {status.providerHealth.neverCallsMessages ? 'YES' : 'NO'}
              </div>
              <div>
                App secret proof used:{' '}
                {status.providerHealth.usesAppSecretProof ? 'YES' : 'NO'}
              </div>
              {status.providerHealth.error ? (
                <div>Error: {status.providerHealth.error}</div>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatusChip
                label="Access token"
                active={status.canonicalConfig.accessTokenConfigured}
              />
              <StatusChip
                label="Phone number id"
                active={status.canonicalConfig.phoneNumberIdConfigured}
              />
              <StatusChip
                label="Business account id"
                active={status.canonicalConfig.businessAccountIdConfigured}
              />
              <StatusChip label="App id" active={status.canonicalConfig.appIdConfigured} />
              <StatusChip
                label="App secret"
                active={status.canonicalConfig.appSecretConfigured}
              />
              <StatusChip
                label="Verify token"
                active={status.canonicalConfig.webhookVerifyTokenConfigured}
              />
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
                  background: '#f8fafc',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Missing canonical variables
                </div>
                <div style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.6 }}>
                  {status.canonicalConfig.missingCanonicalVariables.length > 0
                    ? status.canonicalConfig.missingCanonicalVariables.join(', ')
                    : 'None'}
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Legacy compatibility
                </div>
                <div style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.7 }}>
                  <div>
                    Access token alias:{' '}
                    {status.legacyCompatibility.usesLegacyAccessTokenAlias
                      ? 'active'
                      : 'canonical'}
                  </div>
                  <div>
                    Phone id alias:{' '}
                    {status.legacyCompatibility.usesLegacyPhoneNumberIdAlias
                      ? 'active'
                      : 'canonical'}
                  </div>
                  <div>
                    Verify token alias:{' '}
                    {status.legacyCompatibility.usesLegacyWebhookVerifyTokenAlias
                      ? 'active'
                      : 'canonical'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Fail-closed blockers
                </div>
                <div style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.6 }}>
                  {status.providerHealth.missingVariables.length > 0
                    ? status.providerHealth.missingVariables.join(', ')
                    : 'No provider health blockers'}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : loading ? (
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
          Loading Meta connection status...
        </div>
      ) : null}
    </div>
  )
}
