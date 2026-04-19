'use client'
import { useState } from 'react'
import Link from 'next/link'

const tools = [
  {
    id: 'generate',
    name: 'AI Photo Generator',
    description: 'Upload product photo and get a professional studio model shoot in 2 minutes.',
    icon: '🖼️',
    href: '/vizora/generate',
    cost: '₹0.25 / image',
    badge: 'Most Used',
    color: '#7c3aed',
  },
  {
    id: 'upscale',
    name: 'Photo Upscaler 4x',
    description: 'Upscale to print-ready 4096px — perfect for Myntra and export catalogs.',
    icon: '🔍',
    href: '/vizora/upscale',
    cost: '₹0.02 / image',
    badge: 'High Margin',
    color: '#0284c7',
  },
  {
    id: 'video',
    name: 'Video Ad Generator',
    description: 'Turn product photo into a 30-second Instagram reel ready to run as ad.',
    icon: '🎬',
    href: '/vizora/video',
    cost: '₹4 / video',
    badge: 'Popular',
    color: '#db2777',
  },
  {
    id: 'ugc',
    name: 'UGC Ads Creator',
    description: 'AI avatar speaks about your product in Hindi or English — viral UGC ads.',
    icon: '🎭',
    href: '/vizora/ugc',
    cost: '₹45 / video',
    badge: 'New',
    color: '#d97706',
  },
  {
    id: 'eraser',
    name: 'Magic Eraser',
    description: 'Remove backgrounds, erase objects, generative fill — just like Canva.',
    icon: '✨',
    href: '/vizora/eraser',
    cost: '₹1.5 / erase',
    badge: 'Client Fav',
    color: '#059669',
  },
]

export default function VizoraPage() {
  const credits = { images: 200, videos: 25, ugc: 5, erases: 150 }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '14px' }}>V</div>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>Vizora</span>
            <span style={{ background: '#3730a320', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40', fontWeight: '500' }}>AI Creative Studio</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{credits.images} image credits left</span>
          </div>
          <button style={{ background: '#7c3aed', color: 'white', border: 'none', fontSize: '13px', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            Upgrade Plan
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '44px 28px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ede9fe', border: '1px solid #c4b5fd', color: '#7c3aed', fontSize: '12px', padding: '5px 16px', borderRadius: '99px', marginBottom: '18px', fontWeight: '600' }}>
            ✦ AI Creative Suite — All tools in one place
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: '1.1' }}>
            Welcome to{' '}
            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Vizora
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '17px', maxWidth: '540px', margin: '0 auto', lineHeight: '1.6' }}>
            Generate professional product photos, video ads and UGC content — powered by AI. Built for Indian fashion sellers.
          </p>
        </div>

        {/* Credits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '36px' }}>
          {[
            { label: 'Image Credits', value: credits.images, max: 200, color: '#7c3aed' },
            { label: 'Video Credits', value: credits.videos, max: 25, color: '#db2777' },
            { label: 'UGC Credits', value: credits.ugc, max: 5, color: '#d97706' },
            { label: 'Erase Credits', value: credits.erases, max: 150, color: '#059669' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>{c.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>{c.value}</p>
              <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (c.value / c.max) * 100)}%`, background: c.color, borderRadius: '2px', transition: 'width 0.5s' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tools */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px', marginBottom: '36px' }}>
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href} style={{ textDecoration: 'none' }}>
              <div
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; d.style.borderColor = tool.color + '60' }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ''; d.style.boxShadow = ''; d.style.borderColor = '#e2e8f0' }}
              >
                <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px' }}>{tool.icon}</span>
                    <span style={{ background: tool.color + '25', color: tool.color, fontSize: '10px', padding: '3px 10px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${tool.color}50` }}>
                      {tool.badge}
                    </span>
                  </div>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 7px' }}>{tool.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0', lineHeight: '1.6' }}>{tool.description}</p>
                </div>
                <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>API cost: {tool.cost}</span>
                  <span style={{ color: tool.color, fontSize: '13px', fontWeight: '600' }}>Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '28px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>This Month</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '28px' }}>
            {[
              { label: 'Photos Generated', value: '0' },
              { label: 'Videos Created', value: '0' },
              { label: 'Backgrounds Removed', value: '0' },
              { label: 'Saved vs Photographer', value: '₹0' },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0' }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
