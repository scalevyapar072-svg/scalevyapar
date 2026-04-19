'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MODULES = [
  {
    id: 'vizora',
    name: 'Vizora AI Studio',
    description: 'AI fashion photo generation — exact dress on real model, 12 pose types, 5 tools',
    icon: '✦',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    link: '/vizora',
    externalLink: 'https://scalevyapar.vercel.app/vizora',
    badge: 'Live',
    badgeColor: '#10b981',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator', 'Magic Eraser'],
    cost: '₹6/image',
    category: 'AI Creative',
  },
  {
    id: 'leads',
    name: 'Lead Generation',
    description: 'Google data extractor — scrape B2B leads by location, business type and keywords',
    icon: '🎯',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
    link: '/dashboard',
    externalLink: null,
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV'],
    cost: 'Free',
    category: 'Lead Gen',
  },
  {
    id: 'crm',
    name: 'CRM + Call Management',
    description: 'Track calls, follow-ups, notes and lead status — Hot / Warm / Cold',
    icon: '📞',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    link: '/dashboard',
    externalLink: null,
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History'],
    cost: 'Free',
    category: 'CRM',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Automation',
    description: 'Chatbot, bulk messaging, auto replies and lead nurturing via WhatsApp',
    icon: '💬',
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #25d366, #128c7e)',
    link: '/dashboard',
    externalLink: null,
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    features: ['Chatbot', 'Bulk Messaging', 'Auto Replies', 'Lead Nurturing'],
    cost: 'API based',
    category: 'Marketing',
  },
  {
    id: 'shopify',
    name: 'Website & Sales',
    description: 'Shopify store setup, product catalog, pricing and order management',
    icon: '🛒',
    color: '#96bf48',
    gradient: 'linear-gradient(135deg, #96bf48, #5e8e3e)',
    link: '/dashboard',
    externalLink: null,
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    features: ['Shopify Setup', 'Product Catalog', 'Order Management', 'Pricing'],
    cost: 'Shopify plan',
    category: 'Sales',
  },
  {
    id: 'inventory',
    name: 'Inventory + Production',
    description: 'Raw materials, production tracking, orders and dispatch management',
    icon: '📦',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    link: '/dashboard',
    externalLink: null,
    badge: 'Coming Soon',
    badgeColor: '#6366f1',
    features: ['Inventory Management', 'Production Tracking', 'Raw Materials', 'Dispatch'],
    cost: 'Free',
    category: 'Operations',
  },
]

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('modules')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  

  const categories = ['All', ...Array.from(new Set(MODULES.map(m => m.category)))]
  const filtered = MODULES.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory
    return matchSearch && matchCat
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top Nav */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '14px' }}>SV</div>
            <div>
              <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '700' }}>Scale Vyapar</p>
              <p style={{ margin: 0, color: '#475569', fontSize: '10px' }}>Business Automation Platform</p>
            </div>
          </div>
          <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40' }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>admin@scalevyapar.com</span>
          <button onClick={() => { localStorage.removeItem('auth-token'); router.push('/login') }} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>Module Management</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '0' }}>Manage and assign platform modules to your clients</p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Modules', value: '6', icon: '🧩', color: '#7c3aed' },
            { label: 'Live Modules', value: '1', icon: '✅', color: '#10b981' },
            { label: 'Coming Soon', value: '5', icon: '🔜', color: '#6366f1' },
            { label: 'Active Clients', value: '0', icon: '👥', color: '#0284c7' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '28px' }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '14px', padding: '10px 16px', borderRadius: '10px', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 16px', border: `1px solid ${selectedCategory === cat ? '#7c3aed' : '#e2e8f0'}`, background: selectedCategory === cat ? '#ede9fe' : 'white', color: selectedCategory === cat ? '#7c3aed' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: selectedCategory === cat ? '600' : '400' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
          {filtered.map(mod => (
            <div key={mod.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = '' }}
            >
              {/* Top gradient bar */}
              <div style={{ height: '5px', background: mod.gradient }} />

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: mod.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {mod.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ background: mod.badgeColor + '20', color: mod.badgeColor, fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${mod.badgeColor}40` }}>
                      {mod.badge}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{mod.category}</span>
                  </div>
                </div>

                <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>{mod.name}</h3>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 14px', lineHeight: '1.6' }}>{mod.description}</p>

                {/* Features */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                  {mod.features.map(f => (
                    <span key={f} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}>{f}</span>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Cost: {mod.cost}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {mod.externalLink && (
                      <a href={mod.externalLink} target="_blank" rel="noopener noreferrer" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>
                        Share Link ↗
                      </a>
                    )}
                    <a href={mod.link} style={{ background: mod.gradient, color: 'white', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
                      {mod.badge === 'Live' ? 'Open →' : 'Preview →'}
                    </a>
                  </div>
                </div>

                {/* Customer access link for Vizora */}
                {mod.id === 'vizora' && (
                  <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px' }}>
                    <p style={{ fontSize: '10px', color: '#166534', margin: '0 0 4px', fontWeight: '600' }}>🔗 Customer Access Link</p>
                    <p style={{ fontSize: '10px', color: '#16a34a', margin: '0', wordBreak: 'break-all' }}>https://scalevyapar.vercel.app/vizora</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
