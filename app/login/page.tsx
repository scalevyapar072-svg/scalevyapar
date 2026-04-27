'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.error || 'Invalid email or password')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
        .form-box { width: 100%; max-width: 420px; }
        .input-field { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 13px 16px; color: #1e293b; font-size: 15px; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #374655; }
        .sign-btn { width: 100%; background: #374655; color: white; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
        .sign-btn:hover { background: #4a5a6a; }
        .sign-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .feature-item { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .feature-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .deco1 { position: absolute; top: -100px; right: -100px; width: 350px; height: 350px; background: rgba(255,255,255,0.03); border-radius: 50%; }
        .deco2 { position: absolute; bottom: -100px; left: -100px; width: 350px; height: 350px; background: rgba(255,255,255,0.03); border-radius: 50%; }
        @media (max-width: 768px) {
          .login-wrap { flex-direction: column; }
          .left-panel { width: 100%; padding: 32px 24px; min-height: auto; }
          .left-panel h1 { font-size: 22px !important; }
          .left-panel p { font-size: 14px !important; margin-bottom: 0 !important; }
          .features-section { display: none; }
          .trusted-line { display: none; }
          .right-panel { padding: 32px 24px; align-items: flex-start; }
          .form-box { max-width: 100%; }
        }
      `}</style>

      <div className="login-wrap">

        {/* Left Panel */}
        <div className="left-panel">
          <div className="deco1" />
          <div className="deco2" />
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Logo */}
            <div style={{ marginBottom: '40px' }}>
              <img src="/logo.png" alt="ScaleVyapar" style={{ height: '38px', width: 'auto' }} />
            </div>

            <h1 style={{ color: 'white', fontSize: '34px', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2 }}>
              Scale Your Business with Automation
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.7 }}>
              The all-in-one platform for lead generation, CRM, WhatsApp automation, and inventory management.
            </p>

            <div className="features-section">
              {[
                { icon: '🎯', text: 'Google B2B Lead Extraction' },
                { icon: '💬', text: 'WhatsApp Automation' },
                { icon: '👥', text: 'CRM & Call Management' },
                { icon: '📦', text: 'Inventory Management' },
                { icon: '📸', text: 'AI Photo & Video Generation' }
              ].map(item => (
                <div key={item.text} className="feature-item">
                  <div className="feature-icon">{item.icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', fontWeight: '500' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="trusted-line" style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Trusted by businesses across India 🇮🇳
              </p>
            </div>

          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="form-box">

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
                Welcome back 👋
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px' }}>
                Sign in to your ScaleVyapar account
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  className="input-field"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="sign-btn">
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>
            </form>

            <div style={{ marginTop: '28px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Admin Login
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                  <span style={{ color: '#374655', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>admin@scalevyapar.com</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Password</span>
                  <span style={{ color: '#374655', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>ScaleVyapar@2026</span>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '24px' }}>
              ScaleVyapar © 2026 · Business Automation Platform
            </p>

          </div>
        </div>

      </div>
    </>
  )
}