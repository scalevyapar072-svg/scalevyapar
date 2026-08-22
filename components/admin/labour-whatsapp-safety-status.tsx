'use client'

import { useEffect, useState } from 'react'

type SafetySummary = {
  available: boolean
  persistenceStatus: string
  failClosed: boolean
  pauseAllSending: boolean
  pauseReason:
    | 'explicit_true'
    | 'explicit_false'
    | 'missing'
    | 'invalid'
    | 'query_error'
    | 'persistence_unavailable'
  reviewOnlyDefaults: {
    workerDailyLimit: number
    companyJobDailyLimit: number
    manualBulkCap: number
    quietHoursStart: string
    quietHoursEnd: string
    timeZone: string
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

const pauseReasonLabels: Record<SafetySummary['pauseReason'], string> = {
  explicit_true: 'pause_all_sending is explicitly true',
  explicit_false: 'pause_all_sending is explicitly false',
  missing: 'pause_all_sending is missing',
  invalid: 'pause_all_sending is invalid',
  query_error: 'settings query failed',
  persistence_unavailable: 'persistence is unavailable',
}

export default function LabourWhatsappSafetyStatusCard() {
  const [summary, setSummary] = useState<SafetySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/labour/whatsapp/safety-status', {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({
          error: 'Unexpected response from server.',
        }))

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load WhatsApp safety status.')
        }

        if (active) {
          setSummary((data.summary as SafetySummary | undefined) || null)
        }
      } catch (loadError) {
        if (active) {
          setSummary(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load WhatsApp safety status.',
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
    <div id="whatsapp-limits-safety" style={sectionCardStyle}>
      <div>
        <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px' }}>
          Limits &amp; Safety
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
          Read-only fail-closed safety status for the future persistence and messaging layers.
          Sending remains disabled in this phase.
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
          Loading safety status...
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
            <div>pause_all_sending: {summary.pauseAllSending ? 'TRUE' : 'FALSE'}</div>
            <div>Fail-closed: {summary.failClosed ? 'YES' : 'NO'}</div>
            <div>Pause reason: {pauseReasonLabels[summary.pauseReason]}</div>
            <div>Preview sending disabled: YES</div>
            <div>No active Pause/Resume toggle: YES</div>
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
                color: '#0f172a',
                fontSize: '13px',
              }}
            >
              <strong>Review-only proposed limits</strong>
              <div>Worker automatic matching limit: {summary.reviewOnlyDefaults.workerDailyLimit}/day</div>
              <div>
                Company job matching-worker limit:{' '}
                {summary.reviewOnlyDefaults.companyJobDailyLimit}/day
              </div>
              <div>Manual bulk cap: {summary.reviewOnlyDefaults.manualBulkCap}</div>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#ffffff',
                padding: '12px 14px',
                display: 'grid',
                gap: '6px',
                color: '#0f172a',
                fontSize: '13px',
              }}
            >
              <strong>Review-only quiet hours</strong>
              <div>
                {summary.reviewOnlyDefaults.quietHoursStart} to{' '}
                {summary.reviewOnlyDefaults.quietHoursEnd}
              </div>
              <div>Timezone: {summary.reviewOnlyDefaults.timeZone}</div>
              <div>Enforcement in this phase: DISABLED</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
