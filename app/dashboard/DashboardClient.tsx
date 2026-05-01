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
  isAssigned?: boolean
  href?: string
  customerLink?: string
  features?: string[]
  icon?: string
  status?: string
  type?: string
}

type ModuleMeta = {
  badge: string
  shortIcon: string
  heroIcon: string
  accent: string
  surface: string
  softSurface: string
  border: string
  description: string
  features: string[]
  href: string
  summary: string
}

const MODULE_META: Record<string, ModuleMeta> = {
  vizora: {
    badge: 'Creative Studio',
    shortIcon: 'V',
    heroIcon: 'VA',
    accent: '#7c3aed',
    surface: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    softSurface: 'linear-gradient(135deg,#f5f3ff,#eef2ff)',
    border: '#ddd6fe',
    description: 'Create polished product visuals, ad creatives, and motion content for your catalog from one workspace.',
    summary: 'AI-powered creative production for product photos, ads, and short-form selling content.',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator', 'Background Cleanup', 'Creative Variants'],
    href: '/vizora',
  },
  leads: {
    badge: 'Lead Engine',
    shortIcon: 'LG',
    heroIcon: 'LE',
    accent: '#0284c7',
    surface: 'linear-gradient(135deg,#0284c7,#0369a1)',
    softSurface: 'linear-gradient(135deg,#ecfeff,#eff6ff)',
    border: '#bae6fd',
    description: 'Search businesses by location, export lead lists, and build a reliable outbound pipeline.',
    summary: 'Google-sourced B2B lead collection with filtering, list management, and export support.',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV', 'Lead List Cleanup', 'Quick Follow-up Prep'],
    href: '/leads',
  },
  rozgar: {
    badge: 'Labour Hiring',
    shortIcon: 'R',
    heroIcon: 'RZ',
    accent: '#2563eb',
    surface: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    softSurface: 'linear-gradient(135deg,#eff6ff,#eef2ff)',
    border: '#bfdbfe',
    description: 'Search available workers, receive applications, and manage labour hiring without leaving your dashboard.',
    summary: 'Dedicated labour marketplace and company hiring panel for fast worker sourcing.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Rozgar Dashboard', 'Worker Shortlisting', 'Hiring Activity Review'],
    href: '/labour/company/search',
  },
  crm: {
    badge: 'CRM Workflow',
    shortIcon: 'CRM',
    heroIcon: 'CM',
    accent: '#059669',
    surface: 'linear-gradient(135deg,#059669,#047857)',
    softSurface: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)',
    border: '#a7f3d0',
    description: 'Track call outcomes, capture notes, and move every prospect through a clear follow-up pipeline.',
    summary: 'Daily sales follow-up workspace for call tracking, notes, and lead stage management.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History', 'Opportunity Tracking', 'Team Handover Notes'],
    href: '/leads',
  },
  whatsapp: {
    badge: 'Messaging Automation',
    shortIcon: 'WA',
    heroIcon: 'WA',
    accent: '#16a34a',
    surface: 'linear-gradient(135deg,#16a34a,#15803d)',
    softSurface: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
    border: '#bbf7d0',
    description: 'Automate customer replies, nurture leads, and keep conversations moving on WhatsApp.',
    summary: 'WhatsApp-first outreach and auto-response workflows for customer communication.',
    features: ['Auto Replies', 'Bulk Messaging', 'Lead Nurturing', 'Message Templates', 'Customer Follow-up', 'Quick Response Queues'],
    href: '/leads',
  },
  shopify: {
    badge: 'Store Operations',
    shortIcon: 'S',
    heroIcon: 'SP',
    accent: '#65a30d',
    surface: 'linear-gradient(135deg,#65a30d,#4d7c0f)',
    softSurface: 'linear-gradient(135deg,#f7fee7,#fefce8)',
    border: '#d9f99d',
    description: 'Organize catalog, pricing, and store operations for a cleaner Shopify workflow.',
    summary: 'Storefront operations support for listings, pricing, and order visibility.',
    features: ['Catalog Setup', 'Product Organization', 'Pricing Workflow', 'Store Readiness Checklist', 'Order Snapshot', 'Collection Planning'],
    href: '/leads',
  },
  inventory: {
    badge: 'Inventory Control',
    shortIcon: 'INV',
    heroIcon: 'IN',
    accent: '#d97706',
    surface: 'linear-gradient(135deg,#d97706,#b45309)',
    softSurface: 'linear-gradient(135deg,#fffbeb,#fff7ed)',
    border: '#fcd34d',
    description: 'Monitor stock, materials, and dispatch activity in a more organized operations dashboard.',
    summary: 'Inventory and production visibility for stock movement, materials, and dispatch planning.',
    features: ['Stock Monitoring', 'Material Tracking', 'Dispatch Planning', 'Low Stock Review', 'Batch Visibility', 'Movement Notes'],
    href: '/leads',
  },
  chatbot: {
    badge: 'AI Assistant',
    shortIcon: 'AI',
    heroIcon: 'AI',
    accent: '#db2777',
    surface: 'linear-gradient(135deg,#db2777,#be185d)',
    softSurface: 'linear-gradient(135deg,#fdf2f8,#fce7f3)',
    border: '#f9a8d4',
    description: 'Deploy a support assistant that handles first responses and helps qualify incoming prospects.',
    summary: 'AI chat assistant for fast first-touch customer support and lead qualification.',
    features: ['Customer Support Bot', 'Lead Qualification', 'FAQ Handling', 'Instant Replies', 'Escalation Routing', 'Chat Intake Capture'],
    href: '/leads',
  },
}

function resolveModuleKey(mod: DashboardModule) {
  const rawSlug = String(mod?.slug || '').trim().toLowerCase()
  const rawName = String(mod?.name || '').trim().toLowerCase()
  const rawHref = String(mod?.customerLink || mod?.href || '').trim().toLowerCase()

  if (rawSlug in MODULE_META) return rawSlug
  if (rawName.includes('rozgar') || rawHref.includes('/labour/company')) return 'rozgar'
  if (rawName.includes('vizora') || rawHref.includes('/vizora')) return 'vizora'
  if (rawName.includes('lead')) return 'leads'
  if (rawName.includes('crm')) return 'crm'
  if (rawName.includes('whatsapp')) return 'whatsapp'
  if (rawName.includes('shopify')) return 'shopify'
  if (rawName.includes('inventory')) return 'inventory'
  if (rawName.includes('chatbot')) return 'chatbot'

  return 'crm'
}

function pickModuleHref(moduleKey: string, mod?: DashboardModule) {
  const candidates = [mod?.customerLink, mod?.href, MODULE_META[moduleKey]?.href]
  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim() !== '#') || '#'
}

function getModuleStatus(module: DashboardModule) {
  if (module.isAssigned) {
    return module.isActive ? 'Assigned & live' : 'Assigned but inactive'
  }

  return 'Not assigned'
}

export default function DashboardClient({
  user,
  modules,
}: {
  user: DashboardUser
  modules: DashboardModule[]
}) {
  const assignedModules = modules.filter(module => module.isAssigned)
  const inactiveModules = modules.filter(module => !module.isAssigned)

  const [activeModule, setActiveModule] = useState<string>(() => {
    const firstAssigned = assignedModules[0] || modules[0]
    return firstAssigned ? resolveModuleKey(firstAssigned) : 'crm'
  })

  const activeModuleRecord =
    modules.find(module => resolveModuleKey(module) === activeModule) ||
    assignedModules[0] ||
    modules[0]

  const activeKey = activeModuleRecord ? resolveModuleKey(activeModuleRecord) : 'crm'
  const activeMeta = MODULE_META[activeKey] || MODULE_META.crm
  const activeHref = pickModuleHref(activeKey, activeModuleRecord)
  const featureList = useMemo(() => {
    if (Array.isArray(activeModuleRecord?.features) && activeModuleRecord.features.length > 0) {
      return activeModuleRecord.features
    }

    return activeMeta.features
  }, [activeMeta.features, activeModuleRecord?.features])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#f8fbff 0%,#eef4fb 45%,#f7f9fc 100%)',
        fontFamily: '"Inter","Segoe UI",Tahoma,sans-serif',
        color: '#122033',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(248,251,255,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(148,163,184,0.16)',
          padding: '18px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg,#0f172a,#2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '15px',
              boxShadow: '0 14px 32px rgba(37,99,235,0.24)',
            }}
          >
            SV
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>ScaleVyapar Client Hub</div>
            <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Module workspace
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
          </div>
          <button
            onClick={logout}
            style={{
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#dc2626',
              borderRadius: '12px',
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '24px 20px 36px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(250px,280px) minmax(0,1fr)',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          <aside
            style={{
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid rgba(226,232,240,0.9)',
              borderRadius: '24px',
              padding: '18px',
              boxShadow: '0 18px 40px rgba(15,23,42,0.045)',
              position: 'sticky',
              top: '90px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg,#0f172a,#1d4ed8 58%,#38bdf8)',
                borderRadius: '20px',
                padding: '18px',
                color: 'white',
                marginBottom: '18px',
                boxShadow: '0 18px 38px rgba(29,78,216,0.24)',
              }}
            >
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75, marginBottom: '8px' }}>
                Client Overview
              </div>
              <div style={{ fontSize: '21px', fontWeight: 900, lineHeight: 1.2, marginBottom: '8px' }}>{user.name}</div>
              <div style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.88 }}>
                Review every module from one place, open active tools quickly, and keep visibility on what is assigned or still inactive.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {[
                { label: 'Assigned', value: assignedModules.length, tone: '#dcfce7', text: '#166534' },
                { label: 'Inactive', value: inactiveModules.length, tone: '#fff7ed', text: '#b45309' },
                { label: 'Total', value: modules.length, tone: '#eff6ff', text: '#1d4ed8' },
                { label: 'Status', value: user.status || 'active', tone: '#f5f3ff', text: '#6d28d9' },
              ].map(card => (
                <div key={card.label} style={{ background: card.tone, borderRadius: '16px', padding: '12px 12px 10px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: card.text, textTransform: 'capitalize' }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontWeight: 800, marginBottom: '10px' }}>
              Active modules
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: inactiveModules.length > 0 ? '18px' : 0 }}>
              {assignedModules.map(module => {
                const moduleKey = resolveModuleKey(module)
                const meta = MODULE_META[moduleKey] || MODULE_META.crm
                const selected = activeModule === moduleKey

                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(moduleKey)}
                    style={{
                      width: '100%',
                      borderRadius: '18px',
                      border: `1px solid ${selected ? meta.border : '#e2e8f0'}`,
                      background: selected ? meta.softSurface : 'white',
                      padding: '13px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: selected ? '0 12px 30px rgba(15,23,42,0.06)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: module.isAssigned ? meta.surface : '#e2e8f0',
                        color: module.isAssigned ? 'white' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '12px',
                        flexShrink: 0,
                      }}
                    >
                      {module.icon || meta.shortIcon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '5px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{module.name}</div>
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            borderRadius: '999px',
                            padding: '4px 9px',
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            background: module.isAssigned ? '#dcfce7' : '#f8fafc',
                            color: module.isAssigned ? '#15803d' : '#64748b',
                          }}
                        >
                          {module.isAssigned ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>{getModuleStatus(module)}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {inactiveModules.length > 0 ? (
              <>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontWeight: 800, marginBottom: '10px' }}>
                  Inactive modules
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inactiveModules.map(module => {
                    const moduleKey = resolveModuleKey(module)
                    const meta = MODULE_META[moduleKey] || MODULE_META.crm
                    const selected = activeModule === moduleKey

                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(moduleKey)}
                        style={{
                          width: '100%',
                          borderRadius: '18px',
                          border: `1px solid ${selected ? meta.border : '#e2e8f0'}`,
                          background: selected ? meta.softSurface : 'white',
                          padding: '13px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: '#e2e8f0',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '12px',
                            flexShrink: 0,
                          }}
                        >
                          {module.icon || meta.shortIcon}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '5px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{module.name}</div>
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                borderRadius: '999px',
                                padding: '4px 9px',
                                fontSize: '9px',
                                fontWeight: 900,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                background: '#f8fafc',
                                color: '#64748b',
                              }}
                            >
                              Inactive
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>{getModuleStatus(module)}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}
          </aside>

          <main style={{ minWidth: 0 }}>
            <section
              style={{
                background: activeMeta.surface,
                color: 'white',
                borderRadius: '28px',
                padding: '24px 26px',
                marginBottom: '18px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 24px 50px rgba(15,23,42,0.12)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-30px',
                  width: '210px',
                  height: '210px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.10)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-60px',
                  right: '120px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '22px' }}>
                  <div style={{ maxWidth: '700px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.76, marginBottom: '8px' }}>
                      {activeMeta.badge}
                    </div>
                    <div style={{ fontSize: '31px', fontWeight: 900, lineHeight: 1.08, marginBottom: '10px' }}>
                      {activeModuleRecord?.name || 'Module dashboard'}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.7, opacity: 0.95, maxWidth: '640px' }}>
                      {activeModuleRecord?.description || activeMeta.summary}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '10px 16px',
                        background: activeModuleRecord?.isAssigned ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.22)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {activeModuleRecord?.isAssigned ? 'Assigned to client' : 'Not assigned yet'}
                    </span>

                    {activeModuleRecord?.isAssigned ? (
                      <a
                        href={activeHref}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          borderRadius: '14px',
                          background: 'white',
                          color: activeMeta.accent,
                          textDecoration: 'none',
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: '13px',
                          boxShadow: '0 12px 26px rgba(15,23,42,0.16)',
                        }}
                      >
                        Open module in new tab
                      </a>
                    ) : (
                      <div
                        style={{
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.12)',
                          color: 'rgba(255,255,255,0.9)',
                          padding: '12px 16px',
                          fontWeight: 800,
                          fontSize: '13px',
                        }}
                      >
                        Waiting for assignment
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    {
                      label: 'Module state',
                      value: activeModuleRecord?.isAssigned ? 'Live for your account' : 'Inactive for your account',
                    },
                    {
                      label: 'Primary use',
                      value: activeMeta.badge,
                    },
                    {
                      label: 'Feature coverage',
                      value: `${featureList.length} capabilities`,
                    },
                  ].map(card => (
                    <div
                      key={card.label}
                      style={{
                        borderRadius: '18px',
                        background: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        padding: '16px 18px',
                      }}
                    >
                      <div style={{ fontSize: '10px', opacity: 0.76, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>{card.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1.35 }}>{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              style={{
                background: 'rgba(255,255,255,0.86)',
                border: '1px solid rgba(226,232,240,0.92)',
                borderRadius: '26px',
                boxShadow: '0 20px 48px rgba(15,23,42,0.05)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '22px 24px 18px',
                  borderBottom: '1px solid #edf2f7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '18px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: activeMeta.accent, marginBottom: '8px' }}>
                    Module detail
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
                    {activeModuleRecord?.name || 'Module overview'}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#475569', maxWidth: '720px' }}>
                    {activeMeta.description}
                  </div>
                </div>

                <div
                  style={{
                    minWidth: '230px',
                    borderRadius: '18px',
                    background: activeMeta.softSurface,
                    border: `1px solid ${activeMeta.border}`,
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: activeMeta.accent, marginBottom: '7px' }}>
                    Assignment status
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', marginBottom: '7px' }}>
                    {activeModuleRecord?.isAssigned ? 'Enabled for you' : 'Inactive for now'}
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.65, color: '#475569' }}>
                    {activeModuleRecord?.isAssigned
                      ? 'This module is already assigned to your account. You can open it directly and use the tools listed below.'
                      : 'This module exists in ScaleVyapar, but it is not assigned to your client account yet. You can review what it includes before activation.'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 24px 28px' }}>
                {activeKey === 'rozgar' ? (
                  <div
                    style={{
                      background: activeMeta.softSurface,
                      border: `1px solid ${activeMeta.border}`,
                      borderRadius: '20px',
                      padding: '18px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: activeMeta.accent, marginBottom: '8px' }}>
                      Rozgar quick actions
                    </div>
                    <div style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
                      Hiring tools for labour sourcing and worker applications
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#475569', marginBottom: '14px', maxWidth: '760px' }}>
                      Open the labour search interface to browse available workers, or jump directly into the company panel to review incoming applications, shortlist workers, and continue the hiring flow.
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <a
                        href="/labour/company/search"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#0f172a',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '12px',
                          padding: '11px 16px',
                          fontWeight: 900,
                          fontSize: '13px',
                        }}
                      >
                        Search Labour
                      </a>
                      <a
                        href="/labour/company/panel"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'white',
                          color: activeMeta.accent,
                          textDecoration: 'none',
                          border: `1px solid ${activeMeta.border}`,
                          borderRadius: '12px',
                          padding: '11px 16px',
                          fontWeight: 900,
                          fontSize: '13px',
                        }}
                      >
                        Receive Worker Applications
                      </a>
                    </div>
                  </div>
                ) : null}

                <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                  What you can do in this module
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
                    gap: '12px',
                    marginBottom: '22px',
                  }}
                >
                  {featureList.map((feature, index) => (
                    <div
                      key={feature}
                      style={{
                        borderRadius: '18px',
                        border: `1px solid ${activeMeta.border}`,
                        background: index % 2 === 0 ? 'white' : activeMeta.softSurface,
                        padding: '16px',
                        minHeight: '104px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: activeMeta.surface,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '11px',
                          marginBottom: '12px',
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{feature}</div>
                      <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#64748b' }}>
                        {activeModuleRecord?.isAssigned
                          ? `Use ${feature.toLowerCase()} from your assigned ${activeModuleRecord?.name || 'module'} workspace when you need it.`
                          : `This capability is part of ${activeModuleRecord?.name || 'this module'} and becomes available after the module is assigned to your account.`}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,0.8fr)',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: '18px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Module summary</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#475569' }}>
                      {activeMeta.summary} {activeModuleRecord?.isAssigned
                        ? 'Your account already has access, so you can open the module directly from this dashboard.'
                        : 'It is shown here in inactive mode so you can review it without confusion before it is assigned.'}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: '20px',
                      border: `1px solid ${activeMeta.border}`,
                      background: activeMeta.softSurface,
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: activeMeta.accent, marginBottom: '8px' }}>Next step</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
                        {activeModuleRecord?.isAssigned ? 'Open and start using it' : 'Request this module when needed'}
                      </div>
                      <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#475569' }}>
                        {activeModuleRecord?.isAssigned
                          ? 'You already have access to this module. Open it in a new tab and continue your work.'
                          : 'This module is displayed for visibility, but it stays inactive until it is assigned to your client account.'}
                      </div>
                    </div>
                    {activeModuleRecord?.isAssigned ? (
                      <a
                        href={activeHref}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: 'none',
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: activeMeta.accent,
                          color: 'white',
                          padding: '14px 16px',
                          fontWeight: 900,
                          fontSize: '13px',
                        }}
                      >
                        Open {activeModuleRecord?.name}
                      </a>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: '#e2e8f0',
                          color: '#64748b',
                          padding: '14px 16px',
                          fontWeight: 900,
                          fontSize: '13px',
                        }}
                      >
                        Inactive for this client
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
