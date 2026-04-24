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
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { checkAuthAndLoadData() }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch('/api/auth/me')
      if (!authResponse.ok) { router.push('/login'); return }
      const authData = await authResponse.json()
      if (!authData.user || authData.user.role !== 'CLIENT') { router.push('/login'); return }
      setUser(authData.user)
      await loadUserModules()
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadUserModules = async () => {
    try {
      const response = await fetch('/api/dashboard/modules')
      if (response.ok) {
        const data = await response.json()
        const moduleList = Array.isArray(data.modules) ? data.modules : []
        setModules(moduleList)
        if (moduleList.length > 0) setActiveModule(moduleList[0].slug)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getModuleEmoji = (slug: string) => {
    const icons: { [key: string]: string } = {
      leads: '🎯', crm: '👥', whatsapp: '💬', shopify: '🛒', inventory: '📦'
    }
    return icons[slug] || '📌'
  }

  const getModuleDescription = (slug: string) => {
    const desc: { [key: string]: string } = {
      leads: 'Extract B2B leads from Google Maps. Filter by location, business type and keywords to build your prospect database.',
      crm: 'Manage all your customer relationships, track calls, set follow-up reminders and monitor deal progress in one place.',
      whatsapp: 'Send bulk WhatsApp messages, set up automated chatbot replies and run lead nurturing campaigns automatically.',
      shopify: 'View and manage your Shopify store orders, products, pricing and customer data from your dashboard.',
      inventory: 'Track stock levels, manage raw materials, monitor production orders and dispatch tracking in real time.'
    }
    return desc[slug] || 'This module is coming soon with powerful automation features.'
  }

  const getModuleFeatures = (slug: string) => {
    const features: { [key: string]: string[] } = {
      leads: ['Google Maps extraction', 'Filter by location & type', 'Export to CRM', 'Bulk import'],
      crm: ['Contact management', 'Call tracking', 'Follow-up reminders', 'Deal pipeline'],
      whatsapp: ['Bulk messaging', 'Chatbot automation', 'Lead nurturing', 'Broadcast campaigns'],
      shopify: ['Order management', 'Product catalog', 'Customer data', 'Sales reports'],
      inventory: ['Stock tracking', 'Raw material management', 'Production orders', 'Dispatch tracking']
    }
    return features[slug] || ['Coming soon']
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', fontWeight: '800', fontSize: '18px' }}><img src="/logo.png" alt="ScaleVyapar" style={{height: '32px', width: 'auto'}} /></div>
          <p style={{ color: '#0369a1', fontSize: '16px', fontWeight: '500' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const activeModuleData = modules.find(m => m.slug === activeModule)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #bae6fd', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(14,165,233,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}><img src="/logo.png" alt="ScaleVyapar" style={{height: '24px', width: 'auto'}} /></div>
          <div>
            <p style={{ color: '#0c4a6e', fontWeight: '700', fontSize: '16px', margin: 0 }}>ScaleVyapar</p>
            <p style={{ color: '#7dd3fc', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#0c4a6e', fontSize: '14px', fontWeight: '600', margin: 0 }}>{user?.name}</p>
              <p style={{ color: '#7dd3fc', fontSize: '12px', margin: 0 }}>Client Account</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <div style={{ width: '240px', background: 'white', borderRight: '1px solid #bae6fd', padding: '24px 16px', flexShrink: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>Welcome back</p>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0' }}>{user?.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{modules.length} modules active</span>
            </div>
          </div>

          <p style={{ color: '#7dd3fc', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 12px' }}>Your Modules</p>

          {modules.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f0f9ff', borderRadius: '12px', border: '1px dashed #bae6fd' }}>
              <p style={{ color: '#7dd3fc', fontSize: '13px', margin: 0 }}>No modules assigned yet</p>
            </div>
          ) : (
            modules.map(module => {
              const isActive = activeModule === module.slug
              return (
                <div
                  key={module.id}
                  onClick={() => setActiveModule(module.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px', borderRadius: '10px',
                    background: isActive ? '#e0f2fe' : 'transparent',
                    border: isActive ? '1px solid #7dd3fc' : '1px solid transparent',
                    cursor: 'pointer', marginBottom: '6px',
                    transition: 'all 0.15s',
                    borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', background: isActive ? '#0ea5e9' : '#f0f9ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, border: `1px solid ${isActive ? '#0ea5e9' : '#bae6fd'}` }}>
                    {getModuleEmoji(module.slug)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: isActive ? '#0369a1' : '#64748b', fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>
                      {module.name}
                    </span>
                    {module.slug === 'leads' && (
                      <span style={{ display: 'block', color: '#16a34a', fontSize: '10px', fontWeight: '600' }}>● Live</span>
                    )}
                  </div>
                </div>
              )
            })
          )}

          <div style={{ marginTop: '24px', background: '#f0f9ff', borderRadius: '12px', padding: '16px', border: '1px solid #bae6fd' }}>
            <p style={{ color: '#7dd3fc', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Overview</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Modules</span>
              <span style={{ color: '#0369a1', fontSize: '13px', fontWeight: '700' }}>{modules.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
              <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: '700' }}>Active</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

          {/* Welcome Banner */}
          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', borderRadius: '20px', padding: '32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-60px', right: '80px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Your Business Dashboard</p>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>Hello, {user?.name}! 👋</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', margin: '0 0 20px 0' }}>
                You have {modules.length} automation module{modules.length !== 1 ? 's' : ''} ready. Click any module to explore.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {modules.map(m => (
                  <span key={m.id} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }} onClick={() => setActiveModule(m.slug)}>
                    {getModuleEmoji(m.slug)} {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Active Module Detail */}
          {activeModuleData ? (
            <div style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(14,165,233,0.08)', marginBottom: '24px' }}>

              {/* Module Header */}
              <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', borderBottom: '1px solid #bae6fd', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#e0f2fe', border: '2px solid #7dd3fc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {getModuleEmoji(activeModuleData.slug)}
                  </div>
                  <div>
                    <h2 style={{ color: '#0c4a6e', fontSize: '20px', fontWeight: '800', margin: '0 0 2px 0' }}>{activeModuleData.name}</h2>
                    <p style={{ color: '#7dd3fc', fontSize: '13px', margin: 0 }}>Business Automation Module</p>
                  </div>
                </div>
                {activeModuleData.slug === 'leads' ? (
                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                    ✅ Live — Powered by LeadRadar
                  </span>
                ) : (
                  <span style={{ background: '#fef9c3', color: '#a16207', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #fde68a' }}>
                    🚀 Coming Soon
                  </span>
                )}
              </div>

              {/* Module Body */}
              {activeModuleData.slug === 'leads' ? (

                /* LEAD GENERATION — LeadRadar Embedded */
                <div>
                  <div style={{ background: '#f0fdf4', padding: '12px 24px', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }} />
                      <p style={{ color: '#15803d', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                        LeadRadar connected — Extract B2B leads from Google Maps instantly
                      </p>
                    </div>
<button onClick={() => window.open('https://leadradar-production-ffa0.up.railway.app/', '_blank')} style={{ color: '#0369a1', fontSize: '12px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>Open in new tab</button>
                  </div>
                  <iframe
                    src="https://leadradar-production-ffa0.up.railway.app/"
                    style={{ width: '100%', height: '800px', border: 'none', display: 'block' }}
                    title="LeadRadar Lead Extraction Tool"
                  />
                </div>

              ) : (

                /* OTHER MODULES — Coming Soon */
                <div style={{ padding: '32px' }}>
                  <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.7', margin: '0 0 28px 0' }}>
                    {getModuleDescription(activeModuleData.slug)}
                  </p>
                  <h3 style={{ color: '#0c4a6e', fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>What you will be able to do:</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
                    {getModuleFeatures(activeModuleData.slug).map((feature, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#e0f2fe', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                        <div style={{ width: '28px', height: '28px', background: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', flexShrink: 0 }}>✓</div>
                        <span style={{ color: '#0369a1', fontSize: '14px', fontWeight: '500' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '24px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>⚡</p>
                    <h4 style={{ color: '#0c4a6e', fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>Full functionality launching soon!</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                      Our team is building this module. You will be notified as soon as it goes live.
                    </p>
                  </div>
                </div>

              )}
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: '20px', padding: '60px', textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🗂️</p>
              <h3 style={{ color: '#0c4a6e', fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Select a module</h3>
              <p style={{ color: '#7dd3fc', fontSize: '15px', margin: 0 }}>Click any module from the sidebar to view details</p>
            </div>
          )}

          {/* All Modules Grid */}
          <div>
            <h3 style={{ color: '#0c4a6e', fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>All Your Modules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {modules.map(module => {
                const isActive = activeModule === module.slug
                return (
                  <div
                    key={module.id}
                    onClick={() => setActiveModule(module.slug)}
                    style={{
                      background: isActive ? '#e0f2fe' : 'white',
                      border: `1px solid ${isActive ? '#38bdf8' : '#bae6fd'}`,
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 12px rgba(14,165,233,0.15)' : '0 1px 3px rgba(14,165,233,0.05)',
                      transition: 'all 0.2s',
                      outline: isActive ? '2px solid #38bdf8' : 'none',
                      outlineOffset: '2px'
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', background: isActive ? '#0ea5e9' : '#e0f2fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px', border: '1px solid #7dd3fc' }}>
                      {getModuleEmoji(module.slug)}
                    </div>
                    <h4 style={{ color: '#0c4a6e', fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{module.name}</h4>
                    <p style={{ color: '#7dd3fc', fontSize: '12px', margin: '0 0 12px 0' }}>Automation Module</p>
                    {module.slug === 'leads' ? (
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #bbf7d0' }}>
                        ✅ Live
                      </span>
                    ) : (
                      <span style={{ background: '#fef9c3', color: '#a16207', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #fde68a' }}>
                        Coming Soon
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}