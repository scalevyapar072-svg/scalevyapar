'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [previewResetUrl, setPreviewResetUrl] = useState('')

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setForgotMessage('')
    setPreviewResetUrl('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (res.ok && data.success) {
        if (data.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        return
      }

      setError(data.error || 'Invalid email or password')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setForgotLoading(true)
    setError('')
    setForgotMessage('')
    setPreviewResetUrl('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!res.ok) {
        setError(data.error || 'Failed to request password reset.')
        return
      }

      setForgotMessage(data.message || 'If an account exists for that email, a reset link has been generated.')
      setPreviewResetUrl(data.resetUrl || '')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    background: 'white',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#0f172a',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '45%', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-120px', left: '-60px', width: '400px', height: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '20px' }}>SV</span>
          </div>

          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: '800', margin: '0 0 16px 0', lineHeight: 1.2 }}>
            Scale Your<br />Business with<br />Automation
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: '0 0 48px 0', lineHeight: 1.7 }}>
            The all-in-one platform for lead generation, CRM, WhatsApp automation, and inventory management.
          </p>

          {[
            { icon: 'Target', text: 'Google B2B Lead Extraction' },
            { icon: 'Chat', text: 'WhatsApp Automation' },
            { icon: 'Users', text: 'CRM and Call Management' },
            { icon: 'Box', text: 'Inventory Management' }
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ minWidth: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '700' }}>
                {item.icon.slice(0, 1)}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>
              {forgotMode ? 'Forgot password' : 'Welcome back'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
              {forgotMode ? 'Enter your email and we will create a secure reset link.' : 'Sign in to your ScaleVyapar account'}
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {forgotMessage && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px', fontWeight: '600' }}>
              <div>{forgotMessage}</div>
              {previewResetUrl && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bbf7d0' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#166534', fontWeight: '700' }}>Preview reset link</p>
                  <a href={previewResetUrl} style={{ color: '#2563eb', fontSize: '13px', wordBreak: 'break-all' }}>{previewResetUrl}</a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Email Address</label>
              <input
                type='email'
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder='Enter your email'
                required
                style={fieldStyle}
              />
            </div>

            {!forgotMode && (
              <div>
                <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Password</label>
                <input
                  type='password'
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder='Enter your password'
                  required
                  style={fieldStyle}
                />
              </div>
            )}

            <button
              type='submit'
              disabled={forgotMode ? forgotLoading : loading}
              style={{ width: '100%', background: forgotMode ? (forgotLoading ? '#94a3b8' : 'linear-gradient(135deg, #0f766e, #2563eb)') : (loading ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #7c3aed)'), color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '16px', fontWeight: '700', cursor: (forgotMode ? forgotLoading : loading) ? 'not-allowed' : 'pointer', marginTop: '8px' }}
            >
              {forgotMode ? (forgotLoading ? 'Generating reset link...' : 'Send reset link') : (loading ? 'Signing in...' : 'Sign In')}
            </button>
          </form>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type='button'
              onClick={() => {
                setForgotMode(current => !current)
                setError('')
                setForgotMessage('')
                setPreviewResetUrl('')
                setPassword('')
              }}
              style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
            >
              {forgotMode ? 'Back to login' : 'Forgot password?'}
            </button>
            {!forgotMode && (
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Admin and client login</span>
            )}
          </div>

          <div style={{ marginTop: '32px', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px 0' }}>
              Admin Login
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>admin@scalevyapar.com</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Password</span>
                <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>ScaleVyapar@2026!</span>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '28px' }}>
            ScaleVyapar 2026 · Business Automation Platform
          </p>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '10px' }}>
            Reset-link email delivery can be connected later by plugging an email provider into the forgot-password API.
          </p>
        </div>
      </div>
    </div>
  )
}

