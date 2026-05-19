'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SigninCardContent = {
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  rememberMeLabel: string
  forgotPasswordLabel: string
  signInButtonLabel: string
  registerCompanyButtonLabel: string
  registerPromptText: string
  redirectNoteText: string
}

type Props = {
  content: SigninCardContent
}

export function CompanySigninFormClient({ content }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotIdentity, setForgotIdentity] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [previewResetUrl, setPreviewResetUrl] = useState('')

  const openForgotPassword = () => {
    setForgotIdentity(email.trim())
    setForgotError('')
    setForgotMessage('')
    setPreviewResetUrl('')
    setForgotOpen(true)
  }

  const closeForgotPassword = () => {
    if (!forgotLoading) {
      setForgotOpen(false)
    }
  }

  const handleForgotPassword = async () => {
    const normalizedForgotEmail = forgotIdentity.trim().toLowerCase()

    if (!normalizedForgotEmail) {
      setForgotError('Enter your registered email address to reset your password.')
      setForgotMessage('')
      setPreviewResetUrl('')
      return
    }

    if (!EMAIL_PATTERN.test(normalizedForgotEmail)) {
      setForgotError('Enter a valid registered email address to reset your password.')
      setForgotMessage('')
      setPreviewResetUrl('')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotMessage('')
    setPreviewResetUrl('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: normalizedForgotEmail
        })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!response.ok) {
        setForgotError(data.error || 'Failed to start password reset.')
        return
      }

      setForgotMessage(data.message || 'If your account exists, a password reset email has been sent.')
      setPreviewResetUrl(data.resetUrl || '')
    } catch {
      setForgotError('Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/labour/company/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in company account.')
      }

      const authToken = String(data.token || '')
      if (!authToken) {
        throw new Error('Company token is missing from the login response.')
      }

      localStorage.setItem(COMPANY_TOKEN_KEY, authToken)
      if (data.dashboard?.profile) {
        localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(data.dashboard.profile))
      }

      if (!rememberMe) {
        sessionStorage.setItem(COMPANY_TOKEN_KEY, authToken)
      }

      window.dispatchEvent(new Event('labour-company-auth-change'))
      router.push('/labour/company/panel')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in company account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.signinFormCard} onSubmit={handleSubmit}>
      <div className={styles.signinFormLock}>S</div>
      <h2 className={styles.signinFormTitle}>{content.title}</h2>
      <p className={styles.signinFormSubtitle}>{content.subtitle}</p>

      <div className={styles.signinFormStack}>
        <label className={styles.signinField}>
          <span className={styles.signinFieldLabel}>{content.emailLabel}</span>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder={content.emailPlaceholder}
            className={styles.signinInput}
          />
        </label>

        <label className={styles.signinField}>
          <span className={styles.signinFieldLabel}>{content.passwordLabel}</span>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder={content.passwordPlaceholder}
            className={styles.signinInput}
          />
        </label>
      </div>

      <div className={styles.signinInlineControls}>
        <label className={styles.signinRemember}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={event => setRememberMe(event.target.checked)}
          />
          <span>{content.rememberMeLabel}</span>
        </label>
        <button type="button" className={styles.signinForgotLink} onClick={openForgotPassword}>
          {content.forgotPasswordLabel}
        </button>
      </div>

      {error ? (
        <div className={styles.signinErrorCard}>
          <p>{error}</p>
        </div>
      ) : null}

      <button type="submit" className={styles.signinSubmitButton} disabled={submitting}>
        {submitting ? 'Signing in...' : content.signInButtonLabel}
      </button>

      <div className={styles.signinInfoNote}>{content.redirectNoteText}</div>

      <div className={styles.signinRegisterPrompt}>
        <span>{content.registerPromptText}</span>
        <Link href="/labour/company/company-registration" className={styles.signinSecondaryButton}>
          {content.registerCompanyButtonLabel}
        </Link>
      </div>

      {forgotOpen ? (
        <div className={styles.signinForgotOverlay} onClick={closeForgotPassword}>
          <div className={styles.signinForgotModal} onClick={event => event.stopPropagation()}>
            <div className={styles.signinForgotHead}>
              <div>
                <h3 className={styles.signinForgotTitle}>Forgot Password</h3>
                <p className={styles.signinForgotText}>
                  Enter your registered email address and we will create a reset link for your account.
                </p>
              </div>
              <button
                type="button"
                className={styles.signinForgotClose}
                onClick={closeForgotPassword}
                disabled={forgotLoading}
                aria-label="Close forgot password popup"
              >
                x
              </button>
            </div>

            {forgotError ? (
              <div className={styles.signinForgotError}>{forgotError}</div>
            ) : null}

            {forgotMessage ? (
              <div className={styles.signinForgotSuccess}>
                <div>{forgotMessage}</div>
                {previewResetUrl ? (
                  <a href={previewResetUrl} className={styles.signinForgotPreviewLink}>
                    {previewResetUrl}
                  </a>
                ) : null}
              </div>
            ) : null}

            <label className={styles.signinField}>
              <span className={styles.signinFieldLabel}>Email Address</span>
              <input
                type="email"
                value={forgotIdentity}
                onChange={event => setForgotIdentity(event.target.value)}
                placeholder="Enter your registered email"
                className={styles.signinInput}
              />
            </label>

            <div className={styles.signinForgotActions}>
              <button type="button" className={styles.signinSecondaryButton} onClick={closeForgotPassword} disabled={forgotLoading}>
                Cancel
              </button>
              <button type="button" className={styles.signinSubmitButton} onClick={handleForgotPassword} disabled={forgotLoading}>
                {forgotLoading ? 'Generating reset link...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  )
}
