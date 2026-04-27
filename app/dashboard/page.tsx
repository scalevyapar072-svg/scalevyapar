'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Module {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  isLive?: boolean
  accessLink?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) { router.push('/login'); return }
      const authData = await authRes.json()
      if (!authData.user || authData.user.role !== 'CLIENT') { router.push('/login'); return }
      setUser(authData.user)
      const modulesRes = await fetch('/api/dashboard/modules')
      if (modulesRes.ok) {
        const data = await modulesRes.json()
        const list = Array.isArray(data.modules) ? data.modules : []
        setModules(list)
        if (list.length > 0) setActiveModule(list[0].slug)
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getEmoji = (slug: string) => {
    const map: any = { leads: '🎯', crm: '👥', whatsapp: '💬', shopify: '🛒', inventory: '📦', vizora: '📸' }
    return map[slug] || '📌'
  }

  const getDescription = (slug: string) => {
    const map: any = {
      leads: 'Extract B2B leads from Google Maps. Filter by location, business type and keywords to build your prospect database.',
      crm: 'Manage customer relationships, track calls, set follow-up reminders and monitor your sales pipeline.',
      whatsapp: 'Send bulk WhatsApp messages, set up chatbot automation and run lead nurturing campaigns.',
      shopify: 'Manage your Shopify store orders, products, pricing and customer data from one place.',
      inventory: 'Track stock levels, manage raw materials, monitor production orders and dispatch in real time.',
      vizora: 'Generate professional AI photos and videos for your products instantly.'
    }
    return map[slug] || 'This module is coming soon with powerful automation features.'
  }

  const getFeatures = (slug: string) => {
    const map: any = {
      leads: ['Google Maps extraction', 'Filter by location and type', 'Export to CRM', 'Bulk import leads'],
      crm: ['Contact management', 'Call tracking', 'Follow-up reminders', 'Deal pipeline'],
      whatsapp: ['Bulk messaging', 'Chatbot automation', 'Lead nurturing', 'Broadcast campaigns'],
      shopify: ['Order management', 'Product catalog', 'Customer data', 'Sales reports'],
      inventory: ['Stock tracking', 'Raw material management', 'Production orders', 'Dispatch tracking'],
      vizora: ['AI photo generation', 'Video ad creation', 'Multiple poses', 'Instant download']
    }
    return map[slug] || ['Coming soon']
  }

  const getLiveLink = (slug: string) => {
    const map: any = {
      leads: 'https://leadradar-production-ffa0.up.railway.app',
      vizora: '/vizora'
    }
    return map[slug] || null
  }

  const activeModuleData = modules.find(m => m.slug === activeModule)
  const liveLink = activeModuleData ? getLiveLink(activeModuleData.slug) : null

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="ScaleVyapar" style={{ height: '40px', marginBottom: '16px' }} />
        <p style={{ color: '#64748b' }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; }
        .dash-layout { min-height: 100vh; background: #f8fafc; padding-bottom: 70px; }
        .dash-header { background: #374655; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 100; }
        .dash-body { display: flex; min-height: calc(100vh - 64px); }
        .dash-sidebar { width: 260px; background: #374655; padding: 24px 16px; flex-shrink: 0; }
        .dash-content { flex: 1; padding: 32px; overflow-y: auto; }
        .module-nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; cursor: pointer; margin-bottom: 6px; font-size: 14px; font-weight: 500; border-left: 3px solid transparent; color: rgba(255,255,255,0.6); transition: all 0.15s; }
        .module-nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
        .module-nav-item.active { background: rgba(255,255,255,0.12); color: white; border-left-color: white; font-weight: 600; }
        .module-icon-box { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .module-icon-box.active { background: rgba(255,255,255,0.2); }
        .feature-chip { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .live-badge { background: #f0fdf4; color: #16a34a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #bbf7d0; }
        .soon-badge { background: #fef9c3; color: #a16207; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #fde68a; }
        .open-btn { background: #374655; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s; }
        .open-btn:hover { background: #4a5a6a; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: white; font-size: 24px; }
        .bottom-nav { display: none; }
        @media (max-width: 768px) {
          .dash-sidebar { position: fixed; left: -260px; top: 0; height: 100vh; z-index: 150; transition: left 0.3s; padding-top: 80px; }
          .dash-sidebar.open { left: 0; }
          .hamburger { display: block; }
          .dash-content { padding: 16px; }
          .hide-mobile { display: none; }
          .features-grid { grid-template-columns: 1fr !important; }
          .mobile-overlay.open { display: block !important; }
          .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #e2e8f0; z-index: 50; }
          .bottom-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 4px; background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 10px; font-weight: 500; gap: 2px; }
          .bottom-nav-item.active { color: #374655; }
          .bottom-nav-item span:first-child { font-size: 20px; }
        }
      `}</style>

      <div className="dash-layout">

        {/* Header */}
        <div className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <img src="/logo.png" alt="ScaleVyapar" style={{ height: '32px', width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="hide-mobile" style={{ textAlign: 'right' }}>
              <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{user?.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Client Account</p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile overlay */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140 }} />

        <div className="dash-body">

          {/* Sidebar */}
          <div className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>

            {/* Welcome card */}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Welcome back</p>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{user?.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{modules.length} modules active</span>
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 12px' }}>Your Modules</p>

            {modules.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>No modules assigned yet</p>
              </div>
            ) : (
              modules.map(module => (
                <div key={module.id} onClick={() => { setActiveModule(module.slug); setSidebarOpen(false) }} className={`module-nav-item ${activeModule === module.slug ? 'active' : ''}`}>
                  <div className={`module-icon-box ${activeModule === module.slug ? 'active' : ''}`}>
                    {module.icon || getEmoji(module.slug)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span>{module.name}</span>
                    {getLiveLink(module.slug) && (
                      <span style={{ display: 'block', color: '#4ade80', fontSize: '10px', fontWeight: '600' }}>● Live</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main Content */}
          <div className="dash-content">

            {/* Welcome Banner */}
            <div style={{ background: '#374655', borderRadius: '20px', padding: '28px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                  Hello, {user?.name}! 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '16px' }}>
                  You have {modules.length} automation module{modules.length !== 1 ? 's' : ''} ready to use.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {modules.map(m => (
                    <span key={m.id} onClick={() => setActiveModule(m.slug)} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                      {m.icon || getEmoji(m.slug)} {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Module Detail */}
            {activeModuleData && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>

                {/* Module Header */}
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', background: '#374655', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {activeModuleData.icon || getEmoji(activeModuleData.slug)}
                    </div>
                    <div>
                      <h2 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '2px' }}>{activeModuleData.name}</h2>
                      <p style={{ color: '#94a3b8', fontSize: '13px' }}>Business Automation Module</p>
                    </div>
                  </div>
                  {liveLink ? (
                    <span className="live-badge">✅ Live</span>
                  ) : (
                    <span className="soon-badge">🚀 Coming Soon</span>
                  )}
                </div>

                {/* Module Body */}
                {liveLink ? (
                  <div>
                    <div style={{ background: '#f0fdf4', padding: '12px 24px', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }} />
                        <p style={{ color: '#15803d', fontSize: '13px', fontWeight: '600' }}>Module is live and ready to use</p>
                      </div>
                      <button onClick={() => window.open(liveLink, '_blank')} className="open-btn" style={{ fontSize: '13px', padding: '8px 16px' }}>
                        Open in new tab ↗
                      </button>
                    </div>
                    <iframe src={liveLink} style={{ width: '100%', height: '700px', border: 'none', display: 'block' }} title={activeModuleData.name} />
                  </div>
                ) : (
                  <div style={{ padding: '28px' }}>
                    <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
                      {getDescription(activeModuleData.slug)}
                    </p>
                    <h3 style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>What you will be able to do:</h3>
                    <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
                      {getFeatures(activeModuleData.slug).map((feature: string, idx: number) => (
                        <div key={idx} className="feature-chip">
                          <div style={{ width: '28px', height: '28px', background: '#374655', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', flexShrink: 0 }}>✓</div>
                          <span style={{ color: '#374655', fontSize: '14px', fontWeight: '500' }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</p>
                      <h4 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Full functionality launching soon!</h4>
                      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                        Our team is building this module. You will be notified when it goes live.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Modules Grid */}
            <div>
              <h3 style={{ color: '#1e293b', fontSize: '17px', fontWeight: '700', marginBottom: '14px' }}>All Your Modules</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {modules.map(module => {
                  const isActive = activeModule === module.slug
                  const isLive = !!getLiveLink(module.slug)
                  return (
                    <div key={module.id} onClick={() => setActiveModule(module.slug)} style={{ background: isActive ? '#374655' : 'white', border: `1px solid ${isActive ? '#374655' : '#e2e8f0'}`, borderRadius: '14px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: '44px', height: '44px', background: isActive ? 'rgba(255,255,255,0.15)' : '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '12px' }}>
                        {module.icon || getEmoji(module.slug)}
                      </div>
                      <h4 style={{ color: isActive ? 'white' : '#1e293b', fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{module.name}</h4>
                      <p style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>Automation Module</p>
                      {isLive ? (
                        <span style={{ background: isActive ? 'rgba(255,255,255,0.15)' : '#f0fdf4', color: isActive ? 'white' : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>✅ Live</span>
                      ) : (
                        <span style={{ background: isActive ? 'rgba(255,255,255,0.1)' : '#fef9c3', color: isActive ? 'rgba(255,255,255,0.8)' : '#a16207', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Coming Soon</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#374655', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>ScaleVyapar © 2026 · Business Automation Platform</p>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="bottom-nav">
          {modules.slice(0, 5).map(module => (
            <button key={module.slug} className={`bottom-nav-item ${activeModule === module.slug ? 'active' : ''}`} onClick={() => setActiveModule(module.slug)}>
              <span>{module.icon || getEmoji(module.slug)}</span>
              <span>{module.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

      </div>
    </>
  )
}