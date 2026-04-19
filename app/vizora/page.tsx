'use client'
import { useState } from 'react'
import Link from 'next/link'

const modules = [
  {
    id: 'generate',
    icon: '🖼️',
    name: 'AI Photo Generator',
    desc: 'Exact dress on real model — Indian & international',
    href: '/vizora/generate',
    badge: 'Most Used',
    badgeColor: '#f59e0b',
    stat: '₹6/image',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'upscale',
    icon: '🔍',
    name: 'Photo Upscaler 4x',
    desc: 'Print-ready 4096px — perfect for Myntra & exports',
    href: '/vizora/upscale',
    badge: 'High Margin',
    badgeColor: '#10b981',
    stat: '₹2/image',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  {
    id: 'video',
    icon: '🎬',
    name: 'Video Ad Generator',
    desc: '30-second Instagram reel from product photo',
    href: '/vizora/video',
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    stat: '₹4/video',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'ugc',
    icon: '🎭',
    name: 'UGC Ads Creator',
    desc: 'AI avatar speaks Hindi/English about your product',
    href: '/vizora/ugc',
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    stat: '₹45/video',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'eraser',
    icon: '✨',
    name: 'Magic Eraser',
    desc: 'Remove backgrounds & objects instantly',
    href: '/vizora/eraser',
    badge: 'Client Fav',
    badgeColor: '#ec4899',
    stat: '₹2/image',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
]

const stats = [
  { label: 'Photos Generated', value: '0', icon: '📸' },
  { label: 'Videos Created', value: '0', icon: '🎬' },
  { label: 'Credits Used', value: '5', icon: '⚡' },
  { label: 'Saved vs Shoot', value: '₹0', icon: '💰' },
]

export default function VizoraPage() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#f1f5f9',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .card-hover { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .card-hover:hover { transform: translateY(-6px); }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #7c3aed20, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #0ea5e920, transparent 70%)', animation: 'pulse 5s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, #7c3aed08, transparent 70%)' }} />
      </div>

      {/* Grid pattern overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Navbar */}
        <nav style={{ borderBottom: '1px solid #ffffff10', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: '#03071280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/admin" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Admin
            </Link>
            <div style={{ width: '1px', height: '20px', background: '#1e293b' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 20px #7c3aed40' }}>
                ✦
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', fontFamily: '"Playfair Display", serif', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vizora</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Creative Studio</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: '99px', padding: '6px 14px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>100 FASHN credits</span>
            </div>
            <Link href="/vizora/generate" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', fontSize: '13px', padding: '8px 18px', borderRadius: '99px', textDecoration: 'none', fontWeight: '600', boxShadow: '0 0 20px #7c3aed40' }}>
              + New Shoot
            </Link>
          </div>
        </nav>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7c3aed15', border: '1px solid #7c3aed40', color: '#a78bfa', fontSize: '12px', padding: '6px 16px', borderRadius: '99px', marginBottom: '24px', letterSpacing: '0.05em' }}>
              ✦ AI Creative Suite — 5 Tools · Powered by FASHN.ai + Replicate
            </div>
            <h1 style={{ fontSize: '56px', fontWeight: '800', fontFamily: '"Playfair Display", serif', margin: '0 0 16px', lineHeight: '1.1', background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome to<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vizora Studio</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '18px', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7', fontWeight: '300' }}>
              Generate professional fashion photos, video ads and UGC content — powered by AI. Built for Indian fashion sellers.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '48px' }}>
            {stats.map((s) => (
              <div key={s.label} style={{ background: '#ffffff05', border: '1px solid #ffffff10', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                <p style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px', fontFamily: '"Playfair Display", serif' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#475569', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tools Grid */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '14px', color: '#475569', margin: '0', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>AI Tools</h2>
            <span style={{ fontSize: '12px', color: '#334155' }}>5 tools available</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {modules.map((mod) => (
              <Link key={mod.id} href={mod.href} style={{ textDecoration: 'none' }}>
                <div
                  className="card-hover"
                  onMouseEnter={() => setHovered(mod.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === mod.id ? '#ffffff08' : '#ffffff04',
                    border: `1px solid ${hovered === mod.id ? '#ffffff20' : '#ffffff08'}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: hovered === mod.id ? '0 20px 60px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  {/* Gradient top bar */}
                  <div style={{ height: '4px', background: mod.gradient }} />

                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: mod.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: `0 8px 24px ${mod.badgeColor}30` }}>
                        {mod.icon}
                      </div>
                      <span style={{ background: mod.badgeColor + '20', color: mod.badgeColor, fontSize: '10px', padding: '3px 10px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${mod.badgeColor}40`, letterSpacing: '0.05em' }}>
                        {mod.badge}
                      </span>
                    </div>

                    <h3 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', margin: '0 0 8px', fontFamily: '"DM Sans", sans-serif' }}>{mod.name}</h3>
                    <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.6' }}>{mod.desc}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ffffff08', paddingTop: '16px' }}>
                      <span style={{ fontSize: '12px', color: '#334155' }}>API cost: {mod.stat}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Open →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick access banner */}
          <div style={{ marginTop: '32px', background: 'linear-gradient(135deg, #7c3aed15, #4f46e515)', border: '1px solid #7c3aed30', borderRadius: '16px', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#a78bfa' }}>🚀 Quick Start — AI Photo Generator</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>Upload any mannequin photo → get exact dress on real model in 30 seconds</p>
            </div>
            <Link href="/vizora/generate" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', fontSize: '13px', padding: '10px 24px', borderRadius: '99px', textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap', boxShadow: '0 0 30px #7c3aed40' }}>
              Start Generating →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}