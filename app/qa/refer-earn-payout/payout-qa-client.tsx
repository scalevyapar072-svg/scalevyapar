'use client'

import { useCallback, useEffect, useState } from 'react'
import styles from './payout-qa.module.css'

type AuthResponse = {
  success?: boolean
  token?: string
  error?: string
}

type RequestOtpResponse = {
  success?: boolean
  message?: string
  otpSessionToken?: string
  error?: string
}

type PayoutMethod = 'bank' | 'upi'

type PayoutAccount = {
  id: string
  workerId: string
  method: PayoutMethod
  accountHolderName: string
  maskedAccountNumber: string
  ifsc: string
  maskedUpiId: string
  updatedAt: string
}

type PayoutResponse = {
  success?: boolean
  payoutAccount?: PayoutAccount | null
  error?: string
}

const STORAGE_KEY = 'refer-earn-payout-preview-auth'

const WORKERS = [
  {
    label: 'Worker A',
    workerId: 'preview-worker-a-20260818',
    mobile: '0000000001',
  },
  {
    label: 'Worker B',
    workerId: 'preview-worker-b-20260818',
    mobile: '0000000002',
  },
] as const

type StoredPreviewAuth = {
  mobile: string
  token: string
}

const BANK_INITIAL = {
  accountHolderName: 'Preview Worker A',
  accountNumber: '',
  ifsc: 'TEST0001234',
}

const UPI_INITIAL = {
  upiId: '',
}

function readStoredAuth(): StoredPreviewAuth | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPreviewAuth>
    if (!parsed || typeof parsed.mobile !== 'string' || typeof parsed.token !== 'string') {
      return null
    }

    return {
      mobile: parsed.mobile,
      token: parsed.token,
    }
  } catch {
    return null
  }
}

function writeStoredAuth(auth: StoredPreviewAuth | null) {
  if (typeof window === 'undefined') return

  if (!auth) {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function resolveWorkerLabel(mobile: string) {
  const matched = WORKERS.find(worker => worker.mobile === mobile)
  return matched?.label || 'Preview Worker'
}

function buildSavePayload(
  method: PayoutMethod,
  bankForm: typeof BANK_INITIAL,
  upiForm: typeof UPI_INITIAL,
) {
  if (method === 'bank') {
    return {
      method,
      accountHolderName: bankForm.accountHolderName,
      accountNumber: bankForm.accountNumber,
      ifsc: bankForm.ifsc,
    }
  }

  return {
    method,
    upiId: upiForm.upiId,
  }
}

export default function PayoutQaClient() {
  const [mobile, setMobile] = useState<string>(WORKERS[0].mobile)
  const [otpCode, setOtpCode] = useState('')
  const [otpSessionToken, setOtpSessionToken] = useState('')
  const [token, setToken] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [otpRequestLoading, setOtpRequestLoading] = useState(false)
  const [otpRequestError, setOtpRequestError] = useState('')
  const [otpRequestMessage, setOtpRequestMessage] = useState('')
  const [account, setAccount] = useState<PayoutAccount | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [method, setMethod] = useState<PayoutMethod>('bank')
  const [bankForm, setBankForm] = useState(BANK_INITIAL)
  const [upiForm, setUpiForm] = useState(UPI_INITIAL)

  useEffect(() => {
    const stored = readStoredAuth()
    if (!stored) return

    setMobile(stored.mobile)
    setToken(stored.token)
  }, [])

  const loadPayoutAccount = useCallback(async (nextToken: string) => {
    if (!nextToken) return

    setAccountLoading(true)
    setAccountError('')

    try {
      const response = await fetch('/api/labour/worker/referral-payout-account', {
        headers: {
          Authorization: `Bearer ${nextToken}`,
        },
        cache: 'no-store',
      })

      const payload = await parseJson<PayoutResponse>(response)
      if (!response.ok) {
        setAccount(null)
        setAccountError(payload?.error || 'Failed to load payout account.')
        return
      }

      const nextAccount = payload?.payoutAccount || null
      setAccount(nextAccount)
      setMethod(nextAccount?.method || 'bank')
    } catch {
      setAccount(null)
      setAccountError('Failed to load payout account.')
    } finally {
      setAccountLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setAccount(null)
      return
    }

    void loadPayoutAccount(token)
  }, [token, loadPayoutAccount])

  async function handleRequestOtp() {
    setOtpRequestLoading(true)
    setOtpRequestError('')
    setOtpRequestMessage('')
    setAuthError('')

    try {
      const response = await fetch('/api/labour/worker/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      })

      const payload = await parseJson<RequestOtpResponse>(response)
      if (!response.ok) {
        setOtpSessionToken('')
        setOtpRequestError(payload?.error || 'Failed to request Preview OTP.')
        return
      }

      setOtpSessionToken(payload?.otpSessionToken || '')
      setOtpRequestMessage(
        payload?.message ||
          'Preview OTP request accepted. Use the current Preview synthetic OTP for this worker.',
      )
    } catch {
      setOtpSessionToken('')
      setOtpRequestError('Failed to request Preview OTP.')
    } finally {
      setOtpRequestLoading(false)
    }
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAccountError('')
    setSaveError('')
    setSaveSuccess('')
    setOtpRequestError('')

    try {
      const response = await fetch('/api/labour/worker/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          otpCode,
          otpSessionToken: otpSessionToken || undefined,
        }),
      })

      const payload = await parseJson<AuthResponse>(response)
      if (!response.ok || !payload?.token) {
        setToken('')
        writeStoredAuth(null)
        setAuthError(payload?.error || 'Preview worker sign-in failed.')
        return
      }

      setToken(payload.token)
      setOtpSessionToken('')
      writeStoredAuth({
        mobile,
        token: payload.token,
      })
      setOtpCode('')
    } catch {
      setToken('')
      writeStoredAuth(null)
      setAuthError('Preview worker sign-in failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setSaveError('Sign in with a Preview worker before saving payout details.')
      return
    }

    setSaveLoading(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const response = await fetch('/api/labour/worker/referral-payout-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildSavePayload(method, bankForm, upiForm)),
      })

      const payload = await parseJson<PayoutResponse>(response)
      if (!response.ok) {
        setSaveError(payload?.error || 'Failed to save payout account.')
        return
      }

      await loadPayoutAccount(token)
      setSaveSuccess(method === 'bank' ? 'Bank account saved.' : 'UPI ID saved.')
    } catch {
      setSaveError('Failed to save payout account.')
    } finally {
      setSaveLoading(false)
    }
  }

  function handleSignOut() {
    setToken('')
    setOtpCode('')
    setAccount(null)
    setAuthError('')
    setAccountError('')
    setSaveError('')
    setSaveSuccess('')
    setOtpRequestError('')
    setOtpRequestMessage('')
    setOtpSessionToken('')
    writeStoredAuth(null)
  }

  const activeWorkerLabel = resolveWorkerLabel(mobile)
  const isSignedIn = token.length > 0

  return (
    <main className={styles.screen}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Preview only</span>
          <h1 className={styles.title}>Refer &amp; Earn Payout Account QA</h1>
          <p className={styles.subtitle}>
            Manual Preview surface for testing the existing worker payout account flow with
            synthetic Preview workers only.
          </p>
        </header>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Preview worker sign-in</h2>
              <p className={styles.cardNote}>
                Uses the existing worker OTP verification route. No new auth bypass or token
                endpoint is introduced here.
              </p>
            </div>
            {isSignedIn ? (
              <button type="button" className={styles.secondaryButton} onClick={handleSignOut}>
                Sign Out
              </button>
            ) : null}
          </div>

          <div className={styles.workerPills}>
            {WORKERS.map(worker => (
              <button
                key={worker.workerId}
                type="button"
                className={worker.mobile === mobile ? styles.workerPillActive : styles.workerPill}
                onClick={() => setMobile(worker.mobile)}
              >
                <span>{worker.label}</span>
                <strong>{worker.mobile}</strong>
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSignIn}>
            <label className={styles.field}>
              <span className={styles.label}>Preview mobile</span>
              <input
                className={styles.input}
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={event => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0000000001"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Preview OTP</span>
              <input
                className={styles.input}
                inputMode="numeric"
                value={otpCode}
                onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter Preview OTP"
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void handleRequestOtp()}
                disabled={otpRequestLoading || authLoading}
              >
                {otpRequestLoading ? 'Requesting...' : 'Request Preview OTP'}
              </button>
              <button type="submit" className={styles.primaryButton} disabled={authLoading}>
                {authLoading ? 'Signing in...' : 'Sign In Preview Worker'}
              </button>
            </div>
          </form>

          {otpRequestError ? <p className={styles.errorBanner}>{otpRequestError}</p> : null}
          {otpRequestMessage ? <p className={styles.successBanner}>{otpRequestMessage}</p> : null}
          {authError ? <p className={styles.errorBanner}>{authError}</p> : null}

          <div className={styles.sessionPanel}>
            <div>
              <span className={styles.sessionLabel}>Current worker</span>
              <p className={styles.sessionValue}>{activeWorkerLabel}</p>
            </div>
            <div>
              <span className={styles.sessionLabel}>Worker auth</span>
              <p className={styles.sessionValue}>{isSignedIn ? 'Active' : 'Signed out'}</p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Payout account</h2>
              <p className={styles.cardNote}>
                Save either BANK or UPI using the existing Preview payout API. Only masked values
                are shown after save.
              </p>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void loadPayoutAccount(token)}
              disabled={!isSignedIn || accountLoading}
            >
              {accountLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className={styles.methodTabs}>
            <button
              type="button"
              className={method === 'bank' ? styles.methodTabActive : styles.methodTab}
              onClick={() => setMethod('bank')}
            >
              Bank Account
            </button>
            <button
              type="button"
              className={method === 'upi' ? styles.methodTabActive : styles.methodTab}
              onClick={() => setMethod('upi')}
            >
              UPI
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            {method === 'bank' ? (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>Account holder name</span>
                  <input
                    className={styles.input}
                    value={bankForm.accountHolderName}
                    onChange={event =>
                      setBankForm(current => ({ ...current, accountHolderName: event.target.value }))
                    }
                    placeholder="Preview Worker A"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Account number</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={bankForm.accountNumber}
                    onChange={event =>
                      setBankForm(current => ({
                        ...current,
                        accountNumber: event.target.value.replace(/[^\d]/g, '').slice(0, 20),
                      }))
                    }
                    placeholder="123456789012"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>IFSC code</span>
                  <input
                    className={styles.input}
                    value={bankForm.ifsc}
                    onChange={event =>
                      setBankForm(current => ({
                        ...current,
                        ifsc: event.target.value.toUpperCase().replace(/\s+/g, '').slice(0, 11),
                      }))
                    }
                    placeholder="TEST0001234"
                  />
                </label>
              </>
            ) : (
              <label className={styles.field}>
                <span className={styles.label}>UPI ID</span>
                <input
                  className={styles.input}
                  value={upiForm.upiId}
                  onChange={event =>
                    setUpiForm({
                      upiId: event.target.value.trim().toLowerCase(),
                    })
                  }
                  placeholder="previewworkera@upi"
                />
              </label>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={!isSignedIn || saveLoading}>
                {saveLoading
                  ? 'Saving...'
                  : method === 'bank'
                    ? 'Save Bank Account'
                    : 'Save UPI'}
              </button>
            </div>
          </form>

          {saveError ? <p className={styles.errorBanner}>{saveError}</p> : null}
          {saveSuccess ? <p className={styles.successBanner}>{saveSuccess}</p> : null}
          {accountError ? <p className={styles.errorBanner}>{accountError}</p> : null}

          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h3 className={styles.summaryTitle}>Current active payout method</h3>
              <span className={styles.summaryBadge}>
                {account?.method ? account.method.toUpperCase() : 'NONE'}
              </span>
            </div>

            {account ? (
              <dl className={styles.summaryGrid}>
                {account.method === 'bank' ? (
                  <>
                    <div className={styles.summaryRow}>
                      <dt>Account holder</dt>
                      <dd>{account.accountHolderName || 'Not provided'}</dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>Bank account</dt>
                      <dd>{account.maskedAccountNumber || 'Not available'}</dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>IFSC</dt>
                      <dd>{account.ifsc || 'Not available'}</dd>
                    </div>
                  </>
                ) : (
                  <div className={styles.summaryRow}>
                    <dt>UPI ID</dt>
                    <dd>{account.maskedUpiId || 'Not available'}</dd>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <dt>Updated</dt>
                  <dd>{new Date(account.updatedAt).toLocaleString('en-IN')}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.emptyState}>
                {isSignedIn
                  ? 'No payout account is configured for this Preview worker yet.'
                  : 'Sign in with a Preview worker to load payout account details.'}
              </p>
            )}
          </div>
        </section>

        <section className={styles.noteCard}>
          <h2 className={styles.cardTitle}>Manual QA notes</h2>
          <ul className={styles.noteList}>
            <li>Use Worker A and Worker B only.</li>
            <li>Sign out before switching workers so each worker obtains a fresh legitimate token.</li>
            <li>After save, only masked BANK or UPI values should remain visible in the UI.</li>
            <li>This route is Preview-only and returns unavailable in Production.</li>
          </ul>
        </section>
      </section>
    </main>
  )
}
