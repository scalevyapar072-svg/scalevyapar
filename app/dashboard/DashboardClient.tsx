'use client'

import { useMemo, useState } from 'react'

type DashboardUser = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  plan?: string
  status?: string
}

type DashboardModule = {
  id: string
  name: string
  slug?: string
  description?: string
  isActive?: boolean
  href?: string
  customerLink?: string
  features?: string[]
  icon?: string
}

const MODULE_CONFIG: Record<string, {
  icon: string
  color: string
  bg: string
  description: string
  features: string[]
  href: string
}> = {
  vizora: {
    icon: 'V',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    description: 'AI-powered photo, video and ad creation studio for fashion sellers.',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator'],
    href: '/vizora',
  },
  leads: {
    icon: 'LG',
    color: '#0284c7',
    bg: 'linear-gradient(135deg,#0284c7,#0369a1)',
    description: 'Extract B2B leads from Google Maps by location and business type.',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV'],
    href: '/leads',
  },
  rozgar: {
    icon: 'R',
    color: '#2563eb',
    bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    description: 'Search labour, receive worker applications and manage hiring from one place.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Labour Dashboard'],
    href: '/labour/company/search',
  },
  crm: {
    icon: 'CRM',
    color: '#059669',
    bg: 'linear-gradient(135deg,#059669,#047857)',
    description: 'Track calls, follow-ups, notes and lead status - Hot / Warm / Cold.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History'],
    href: '/leads',
  },
}

function resolveModuleKey(mod: DashboardModule) {
  const rawSlug = String(mod?.slug || '').trim().toLowerCase()
  const rawName = String(mod?.name || '').trim().toLowerCase()
  const rawHref = String(mod?.customerLink || mod?.href || '').trim().toLowerCase()

  if (rawSlug in MODULE_CONFIG) return rawSlug
  if (rawName.includes('rozgar') || rawHref.includes('/labour/company')) return 'rozgar'
  if (rawName.includes('vizora') || rawHref.includes('/vizora')) return 'vizora'
  if (rawName.includes('lead') || rawHref.includes('/leads')) return 'leads'
  if (rawName.includes('crm')) return 'crm'
  return 'crm'
}

function pickModuleHref(moduleKey: string, mod?: DashboardModule) {
  const candidates = [mod?.customerLink, mod?.href, MODULE_CONFIG[moduleKey]?.href]
  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim() !== '#') || '#'
}

export default function DashboardClient({
  user,
  modules,
}: {
  user: DashboardUser
  modules: DashboardModule[]
}) {
  const [activeModule, setActiveModule] = useState<string>(() =>
    modules.length > 0 ? resolveModuleKey(modules[0]) : 'crm'
  )

  const activeModuleRecord = modules.find(mod => resolveModuleKey(mod) === activeModule) || modules[0]
  const activeConfig = MODULE_CONFIG[activeModule] || MODULE_CONFIG.crm
  const activeHref = pickModuleHref(activeModule, activeModuleRecord)
  const featureList = useMemo(() => {
    if (Array.isArray(activeModuleRecord?.features) && activeModuleRecord.features.length > 0) {
      return activeModuleRecord.features
    }

    return activeConfig.features
  }, [activeConfig.features, activeModuleRecord?.features])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>SV</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>ScaleVyapar</div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Client Account</div>
          </div>
          <button onClick={logout} style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: 700 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 77px)' }}>
        <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)', borderRadius: '16px', padding: '18px', color: 'white', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.08em', marginBottom: '6px' }}>Welcome Back</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>{user.name}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{modules.length} modules active</div>
          </div>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700, marginBottom: '10px' }}>
            Your Modules
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {modules.map(module => {
              const moduleKey = resolveModuleKey(module)
              const cfg = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.crm
              const isActive = moduleKey === activeModule

              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(moduleKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: '14px',
                    border: `1px solid ${isActive ? cfg.color : '#e2e8f0'}`,
                    background: isActive ? `${cfg.color}12` : 'white',
                    padding: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: isActive ? cfg.bg : '#e2e8f0', color: isActive ? 'white' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {module.icon || cfg.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{module.name}</div>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>Live</div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main style={{ flex: 1, padding: '24px 28px' }}>
          <div style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: 'white', borderRadius: '20px', padding: '36px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Your Business Dashboard</div>
            <div style={{ fontSize: '34px', fontWeight: 900, marginBottom: '10px' }}>Hello, {user.name}!</div>
            <div style={{ fontSize: '16px', opacity: 0.92, marginBottom: '18px' }}>You have {modules.length} automation modules ready. Click any module to explore.</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {modules.map(module => {
                const key = resolveModuleKey(module)
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(key)}
                    style={{ borderRadius: '999px', border: '1px solid rgba(255,255,255,0.35)', background: key === activeModule ? 'rgba(255,255,255,0.18)' : 'transparent', color: 'white', padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {(MODULE_CONFIG[key] || MODULE_CONFIG.crm).icon} {module.name}
                  </button>
                )
              })}
            </div>
          </div>

          <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: activeConfig.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800 }}>
                  {activeModuleRecord?.icon || activeConfig.icon}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{activeModuleRecord?.name || 'Module'}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>{activeModuleRecord?.description || activeConfig.description}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ borderRadius: '999px', padding: '10px 18px', background: '#dcfce7', color: '#16a34a', fontWeight: 800 }}>Live</span>
                <a href={activeHref} target="_blank" rel="noreferrer" style={{ borderRadius: '12px', background: activeConfig.color, color: 'white', padding: '12px 18px', textDecoration: 'none', fontWeight: 800 }}>
                  Open {activeModuleRecord?.name || 'Module'} -&gt;
                </a>
              </div>
            </div>

            <div style={{ padding: '28px' }}>
              {activeModule === 'rozgar' ? (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '18px', padding: '22px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', fontWeight: 800, marginBottom: '10px' }}>Labour Tools</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Search labour and receive worker applications from one place</div>
                  <div style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', lineHeight: 1.7 }}>
                    Use the Rozgar tools below to search active workers and manage incoming worker applications without leaving your dashboard.
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a href="/labour/company/search" target="_blank" rel="noreferrer" style={{ background: '#0f172a', color: 'white', textDecoration: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 800 }}>
                      Search Labour
                    </a>
                    <a href="/labour/company/panel" target="_blank" rel="noreferrer" style={{ background: 'white', color: '#2563eb', textDecoration: 'none', border: '1px solid #93c5fd', borderRadius: '12px', padding: '12px 18px', fontWeight: 800 }}>
                      Receive Worker Applications
                    </a>
                  </div>
                </div>
              ) : null}

              <div style={{ fontSize: '15px', color: '#475569', marginBottom: '18px' }}>
                {activeModuleRecord?.description || activeConfig.description}
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>What you can do:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {featureList.map(feature => (
                  <div key={feature} style={{ border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '14px', padding: '16px', color: '#0f172a', fontWeight: 700 }}>
                    {feature}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', borderRadius: '18px', border: '1px solid #bbf7d0', background: '#f0fdf4', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>{activeModuleRecord?.name || 'This module'} is ready to use!</div>
                  <div style={{ fontSize: '14px', color: '#16a34a' }}>Click the button to open this module.</div>
                </div>
                <a href={activeHref} target="_blank" rel="noreferrer" style={{ borderRadius: '12px', background: '#16a34a', color: 'white', textDecoration: 'none', padding: '14px 20px', fontWeight: 800 }}>
                  Open Now -&gt;
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
