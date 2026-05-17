'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'

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
        <Link href="/reset-password" className={styles.signinForgotLink}>
          {content.forgotPasswordLabel}
        </Link>
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
    </form>
  )
}
