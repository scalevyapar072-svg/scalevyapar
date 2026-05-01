'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MODULE_CONFIG: Record<string, {
  icon: string
  color: string
  bg: string
  description: string
  features: string[]
  href: string
  isLive: boolean
}> = {
  vizora: {
    icon: 'V',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    description: 'AI-powered photo, video and ad creation studio for fashion sellers.',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator', 'Magic Eraser'],
    href: '/vizora',
    isLive: true,
  },
  leads: {
    icon: 'LG',
    color: '#0284c7',
    bg: 'linear-gradient(135deg,#0284c7,#0369a1)',
    description: 'Extract B2B leads from Google Maps by location and business type.',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV'],
    href: '/leads',
    isLive: true,
  },
  crm: {
    icon: 'CRM',
    color: '#059669',
    bg: 'linear-gradient(135deg,#059669,#047857)',
    description: 'Track calls, follow-ups, notes and lead status â€” Hot / Warm / Cold.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History'],
    href: '/leads',
    isLive: true,
  },
  whatsapp: {
    icon: 'WA',
    color: '#16a34a',
    bg: 'linear-gradient(135deg,#25d366,#128c7e)',
    description: 'Chatbot, bulk messaging, auto replies and lead nurturing via WhatsApp.',
    features: ['Chatbot', 'Bulk Messaging', 'Auto Replies', 'Lead Nurturing'],
    href: '/leads',
    isLive: true,
  },
  shopify: {
    icon: 'S',
    color: '#96bf48',
    bg: 'linear-gradient(135deg,#96bf48,#5e8e3e)',
    description: 'Shopify store setup, product catalog, pricing and order management.',
    features: ['Shopify Setup', 'Product Catalog', 'Order Management', 'Pricing'],
    href: '/leads',
    isLive: true,
  },
  inventory: {
    icon: 'INV',
    color: '#d97706',
    bg: 'linear-gradient(135deg,#d97706,#b45309)',
    description: 'Raw materials, production tracking, orders and dispatch management.',
    features: ['Inventory Management', 'Production Tracking', 'Raw Materials', 'Dispatch'],
    href: '/leads',
    isLive: true,
  },
  chatbot: {
    icon: 'AI',
    color: '#db2777',
    bg: 'linear-gradient(135deg,#db2777,#9d174d)',
    description: 'AI chatbot for customer support and lead qualification.',
    features: ['Customer Support', 'Lead Qualification', 'Auto Replies', 'Multi-channel'],
    href: '/leads',
    isLive: true,
  },
  rozgar: {
    icon: 'R',
    color: '#2563eb',
    bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    description: 'Search labour, receive worker applications and manage hiring from one place.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Labour Dashboard'],
    href: '/labour/company/search',
    isLive: true,
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) { router.push('/login'); return }
        const meData = await meRes.json()
        setUser(meData.user)

        // Get assigned modules
        const modRes = await fetch('/api/dashboard/modules')
        if (modRes.ok) {
          const modData = await modRes.json()
          const mods = modData.modules || []
          setModules(mods)
          if (mods.length > 0) setActiveModule(resolveModuleKey(mods[0]))
        }
      } catch (e) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading your dashboard...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const resolveModuleKey = (mod: any) => {
    const rawSlug = String(mod?.slug || '').trim().toLowerCase()
    const rawName = String(mod?.name || '').trim().toLowerCase()
    const rawHref = String(mod?.href || mod?.customerLink || '').trim().toLowerCase()

    if (rawSlug in MODULE_CONFIG) return rawSlug
    if (rawName.includes('rozgar') || rawHref.includes('/labour/company')) return 'rozgar'
    if (rawName.includes('vizora') || rawHref.includes('/vizora')) return 'vizora'
    if (rawName.includes('lead') || rawHref.includes('/leads')) return 'leads'
    if (rawName.includes('crm')) return 'crm'
    if (rawName.includes('whatsapp')) return 'whatsapp'
    if (rawName.includes('shopify')) return 'shopify'
    if (rawName.includes('inventory')) return 'inventory'
    if (rawName.includes('chatbot')) return 'chatbot'
    return rawSlug || rawName
  }

  const activeSlug = activeModule
  const activeModData = modules.find((m: any) => resolveModuleKey(m) === activeSlug)
  const activeConfig = activeSlug ? MODULE_CONFIG[activeSlug] || MODULE_CONFIG['crm'] : null
  const getModuleIcon = (slug: string, mod: any) => {
    if (typeof mod?.icon === 'string' && mod.icon.trim() && mod.icon !== '#') return mod.icon.trim()
    return MODULE_CONFIG[slug]?.icon || 'M'
  }
  const getModuleHref = (slug: string, mod: any) => {
    const candidates = [mod?.customerLink, mod?.href, MODULE_CONFIG[slug]?.href]
    return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim() !== '#') || '#'
  }
  const activeHref = activeSlug && activeModData ? getModuleHref(activeSlug, activeModData) : '#'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top Nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}>SV</div>
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>ScaleVyapar</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{user?.name || 'Client'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Client Account</p>
            </div>
          </div>
          <button onClick={logout} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

          {/* User card */}
          <div style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Welcome Back</p>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: '0 0 6px' }}>{user?.name || 'Client'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{modules.length} modules active</p>
            </div>
          </div>

          <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', margin: '0 0 10px 4px' }}>Your Modules</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {modules.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8', padding: '12px', textAlign: 'center' }}>No modules assigned yet</p>
            ) : (
              modules.map((mod: any) => {
                const slug = resolveModuleKey(mod)
                const cfg = MODULE_CONFIG[slug] || { icon: 'M', color: '#64748b', bg: 'linear-gradient(135deg,#64748b,#475569)', isLive: mod.isActive }
                const isActive = activeModule === slug
                return (
                  <button key={mod.id || slug} onClick={() => setActiveModule(slug)} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${isActive ? cfg.color + '60' : '#f1f5f9'}`, background: isActive ? cfg.color + '12' : 'transparent', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: isActive ? cfg.bg : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      {getModuleIcon(slug, mod)}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: '600', color: isActive ? cfg.color : '#374151' }}>{mod.name}</p>
                      {(cfg.isLive || mod.isActive) && (
                        <p style={{ margin: 0, fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>Live</p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Overview */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', margin: '0 0 8px' }}>Overview</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Modules</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{modules.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Status</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>Active</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* Welcome banner */}
          <div style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', right: '60px', bottom: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Business Dashboard</p>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>Hello, {user?.name || 'Client'}!</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' }}>
              You have {modules.length} automation module{modules.length !== 1 ? 's' : ''} ready. Click any module to explore.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {modules.map((mod: any) => {
                const slug = resolveModuleKey(mod)
                const cfg = MODULE_CONFIG[slug] || { icon: 'M', color: '#64748b' }
                return (
                  <button key={mod.id || slug} onClick={() => setActiveModule(slug)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontSize: '12px', padding: '6px 14px', borderRadius: '99px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{getModuleIcon(slug, mod)}</span> {mod.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active module content */}
          {activeModule && activeConfig && activeModData ? (
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {/* Module header */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: activeConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: `0 4px 16px ${activeConfig.color}30` }}>
                    {getModuleIcon(activeSlug || '', activeModData)}
                    </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>{activeModData.name}</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Business Automation Module</p>
                  </div>
                </div>
                {activeConfig.isLive || activeModData.isActive ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', padding: '5px 14px', borderRadius: '99px', fontWeight: '700', border: '1px solid #bbf7d0' }}>Live</span>
                    <a href={activeHref} target="_blank" rel="noopener noreferrer" style={{ background: activeConfig.bg, color: 'white', fontSize: '13px', padding: '10px 22px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: `0 4px 16px ${activeConfig.color}40` }}>
                      Open {activeModData.name} {'->'}
                    </a>
                  </div>
                ) : (
                  <span style={{ background: '#fefce8', color: '#a16207', fontSize: '12px', padding: '5px 14px', borderRadius: '99px', fontWeight: '700', border: '1px solid #fde68a' }}>Coming Soon</span>
                )}
              </div>

              <div style={{ padding: '28px' }}>
                <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 24px', lineHeight: '1.7' }}>
                  {activeConfig.description.replace('â€”', '—')}
                </p>

                {activeSlug === 'rozgar' ? (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '18px 20px', marginBottom: '24px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.6px', color: '#1d4ed8', textTransform: 'uppercase' }}>Labour tools</p>
                    <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
                      Open labour search or worker applications in a new tab while keeping this dashboard open.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <a href="/labour/company/search" target="_blank" rel="noopener noreferrer" style={{ background: '#0f172a', color: 'white', fontSize: '13px', padding: '12px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 8px 20px rgba(15,23,42,0.14)' }}>
                        Search Labour
                      </a>
                      <a href="/labour/company/panel" target="_blank" rel="noopener noreferrer" style={{ background: '#ffffff', color: '#1d4ed8', border: '1px solid #93c5fd', fontSize: '13px', padding: '12px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                        Receive Worker Applications
                      </a>
                    </div>
                  </div>
                ) : null}

                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>What you can do:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '28px' }}>
                  {activeConfig.features.map((f: string) => (
                    <div key={f} style={{ background: activeConfig.color + '08', border: `1px solid ${activeConfig.color}20`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: activeConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>+</div>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{f}</span>
                    </div>
                  ))}
                </div>

                {activeConfig.isLive || activeModData.isActive ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#166534', margin: '0 0 4px' }}>{activeModData.name} is ready to use!</p>
                      <p style={{ fontSize: '13px', color: '#16a34a', margin: 0 }}>Click the button to open this module.</p>
                    </div>
                    <a href={activeHref} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontSize: '14px', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                      Open Now {'->'}
                    </a>
                  </div>
                ) : (
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px 24px' }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#a16207', margin: '0 0 4px' }}>Coming Soon</p>
                    <p style={{ fontSize: '13px', color: '#ca8a04', margin: 0 }}>This module is being built and will be available soon. You will be notified when it launches!</p>
                  </div>
                )}
              </div>
            </div>
          ) : modules.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>M</div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>No modules assigned yet</p>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Contact your admin to get modules assigned to your account.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
