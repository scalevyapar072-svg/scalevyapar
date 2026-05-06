'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Missing reset token. Please request a new reset link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.')
        return
      }

      setSuccess('Password updated successfully. You can now sign in with your new password.')
      setPassword('')
      setConfirmPassword('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ScaleVyapar</p>
        <h1 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Reset your password</h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          Choose a new password for your account. This reset link expires automatically for security.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>New password</label>
            <input type='password' value={password} onChange={event => setPassword(event.target.value)} placeholder='Enter a new password' style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '13px 14px', fontSize: '15px', color: '#0f172a', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Confirm password</label>
            <input type='password' value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder='Re-enter your new password' style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '13px 14px', fontSize: '15px', color: '#0f172a', boxSizing: 'border-box' }} />
          </div>

          <button type='submit' disabled={loading} style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <p style={{ margin: '20px 0 0', fontSize: '13px', color: '#64748b' }}>
          Remembered it? <Link href='/login' style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}
