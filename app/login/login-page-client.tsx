'use client'

import { useState } from 'react'
import type { MainWebsiteContent } from '@/lib/main-website-content'

type LoginPageClientProps = {
  content: MainWebsiteContent
}

export default function LoginPageClient({ content }: LoginPageClientProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [previewResetUrl, setPreviewResetUrl] = useState('')

  const page = content.loginPage

  const fieldStyle = {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#0f172a',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (response.ok && data.success) {
        window.location.href = data.role === 'ADMIN' ? '/admin' : '/dashboard'
        return
      }

      setError(data.error || 'Invalid email or password')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openForgotPassword = () => {
    setForgotEmail(email.trim())
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
    if (!forgotEmail.trim()) {
      setForgotError('Enter your email address to reset your password.')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
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

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; }
        .login-wrap { min-height: 100vh; display: flex; }
        .left-panel { width: 45%; background: #374655; display: flex; flex-direction: column; justify-content: center; padding: 60px; position: relative; overflow: hidden; }
        .right-panel { flex: 1; background: white; display: flex; align-items: center; justify-content: center; padding: 40px; }
        .form-box { width: 100%; max-width: 440px; }
        .input-field:focus { border-color: #374655 !important; }
        .sign-btn { width: 100%; background: #374655; color: white; border: none; border-radius: 12px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
        .sign-btn:hover { background: #4a5a6a; }
        .sign-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .secondary-btn { width: 100%; background: white; color: #374655; border: 1px solid #d7e0ea; border-radius: 12px; padding: 13px 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
        .secondary-btn:hover { background: #f8fafc; border-color: #b7c5d6; }
        .secondary-btn:disabled { color: #94a3b8; cursor: not-allowed; }
        .link-btn { background: none; border: 0; padding: 0; color: #1d4ed8; font-size: 13px; font-weight: 700; cursor: pointer; }
        .link-btn:disabled { color: #94a3b8; cursor: not-allowed; }
        .feature-item { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .feature-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .deco1 { position: absolute; top: -100px; right: -100px; width: 350px; height: 350px; background: rgba(255,255,255,0.03); border-radius: 50%; }
        .deco2 { position: absolute; bottom: -100px; left: -100px; width: 350px; height: 350px; background: rgba(255,255,255,0.03); border-radius: 50%; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50; }
        .modal-card { width: 100%; max-width: 430px; background: white; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18); padding: 24px; }
        .modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .modal-close { border: 0; background: none; color: #64748b; font-size: 24px; line-height: 1; cursor: pointer; padding: 0; }
        .modal-close:disabled { cursor: not-allowed; color: #cbd5e1; }
        .modal-actions { display: flex; gap: 10px; margin-top: 18px; }
        @media (max-width: 768px) {
          .login-wrap { flex-direction: column; }
          .left-panel { width: 100%; padding: 32px 24px; min-height: auto; }
          .left-panel h1 { font-size: 22px !important; }
          .left-panel p { font-size: 14px !important; margin-bottom: 0 !important; }
          .features-section { display: none; }
          .trusted-line { display: none; }
          .right-panel { padding: 32px 24px; align-items: flex-start; }
          .form-box { max-width: 100%; }
          .modal-actions { flex-direction: column; }
        }
      `}</style>

      <div className="login-wrap">
        <div className="left-panel">
          <div className="deco1" />
          <div className="deco2" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '40px' }}>
              <img src={content.header.logoSrc} alt={content.header.logoAlt} style={{ height: '38px', width: 'auto' }} />
            </div>

            <h1 style={{ color: 'white', fontSize: '34px', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2 }}>
              {page.left.title}
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.7 }}>
              {page.left.subtitle}
            </p>

            <div className="features-section">
              {page.left.features.map(item => (
                <div key={item.text} className="feature-item">
                  <div className="feature-icon">{item.icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', fontWeight: '500' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="trusted-line" style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{page.left.trustedLine}</p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="form-box">
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{page.right.title}</h2>
              <p style={{ color: '#64748b', fontSize: '15px' }}>{page.right.subtitle}</p>
            </div>

            {error ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
                {error}
              </div>
            ) : null}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>{page.right.emailLabel}</label>
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={page.right.emailPlaceholder} required style={fieldStyle} />
              </div>

              <div>
                <label style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>{page.right.passwordLabel}</label>
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={page.right.passwordPlaceholder} required style={fieldStyle} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="link-btn" onClick={openForgotPassword}>{page.forgotPassword.triggerLabel}</button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="sign-btn">
                {loading ? page.right.submittingLabel : page.right.submitLabel}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '24px' }}>{page.right.footerText}</p>
          </div>
        </div>
      </div>

      {forgotOpen ? (
        <div className="modal-overlay" onClick={closeForgotPassword}>
          <div className="modal-card" onClick={event => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 style={{ color: '#0f172a', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>{page.forgotPassword.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{page.forgotPassword.subtitle}</p>
              </div>
              <button type="button" className="modal-close" onClick={closeForgotPassword} disabled={forgotLoading}>×</button>
            </div>

            {forgotError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                {forgotError}
              </div>
            ) : null}

            {forgotMessage ? (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', color: '#1d4ed8', fontSize: '14px', lineHeight: 1.6 }}>
                <div>{forgotMessage}</div>
                {previewResetUrl ? (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bfdbfe' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#1e40af', fontWeight: '700' }}>Preview reset link</p>
                    <a href={previewResetUrl} style={{ color: '#2563eb', fontSize: '13px', wordBreak: 'break-all' }}>
                      {previewResetUrl}
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div>
              <label style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>{page.forgotPassword.emailLabel}</label>
              <input type="email" value={forgotEmail} onChange={event => setForgotEmail(event.target.value)} placeholder={page.forgotPassword.emailPlaceholder} style={fieldStyle} />
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeForgotPassword} disabled={forgotLoading}>{page.forgotPassword.cancelLabel}</button>
              <button type="button" className="sign-btn" onClick={handleForgotPassword} disabled={forgotLoading} style={{ marginTop: 0 }}>
                {forgotLoading ? page.forgotPassword.submittingLabel : page.forgotPassword.submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
