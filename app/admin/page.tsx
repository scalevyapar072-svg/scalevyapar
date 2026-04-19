'use client'
import { useState } from 'react'
import Link from 'next/link'

const modules = [
  {
    id: 'vizora',
    name: 'Vizora',
    description: 'AI-powered photo, video and ad creation studio for fashion and product sellers.',
    status: 'active',
    type: 'AI Module',
    icon: '✦',
    color: 'from-violet-600 to-indigo-600',
    href: '/vizora',
    customerLink: 'https://scalevyapar.vercel.app/vizora',
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['AI Photo Generation', 'Photo Upscaling 4x', 'Video Ads', 'UGC Creator Videos', 'Magic Eraser'],
  },
  {
    id: 'crm',
    name: 'CRM Module',
    description: 'Customer relationship management and call tracking.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◈',
    color: 'from-blue-500 to-cyan-500',
    href: '#',
    customerLink: null,
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['Contact Management', 'Call Tracking', 'Follow-ups', 'Pipeline'],
  },
  {
    id: 'inventory',
    name: 'Inventory Module',
    description: 'Stock management and production tracking.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◉',
    color: 'from-emerald-500 to-teal-500',
    href: '#',
    customerLink: null,
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['Stock Tracking', 'Production Orders', 'Raw Materials', 'Dispatch'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Module',
    description: 'Bulk messaging, chatbot and lead automation.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◎',
    color: 'from-green-500 to-emerald-500',
    href: '#',
    customerLink: null,
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['Bulk Messaging', 'Chatbot', 'Auto Replies', 'Lead Capture'],
  },
  {
    id: 'leads',
    name: 'Lead Generation',
    description: 'Google data extractor — scrape B2B leads by location and business type.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◎',
    color: 'from-orange-500 to-amber-500',
    href: '#',
    customerLink: null,
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business', 'Export CSV'],
  },
  {
    id: 'shopify',
    name: 'Shopify / Website',
    description: 'Website setup, product catalog, pricing and order management.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◇',
    color: 'from-lime-500 to-green-500',
    href: '#',
    customerLink: null,
    stats: { clients: 0, usage: 0, revenue: '₹0' },
    features: ['Shopify Setup', 'Product Catalog', 'Order Management', 'Pricing'],
  },
]

// Sample clients data
const initialClients = [
  {
    id: 'client-1776346123958-g7l955z69',
    name: 'Neelufer Creations',
    email: 'neelufercreation@gmail.com',
    plan: 'Growth',
    status: 'active',
    assignedModules: ['vizora'],
    joinedAt: '2026-04-16',
  },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'modules' | 'clients'>('modules')
  const [clients, setClients] = useState(initialClients)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const toggleModule = (clientId: string, moduleId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      const has = c.assignedModules.includes(moduleId)
      return {
        ...c,
        assignedModules: has
          ? c.assignedModules.filter(m => m !== moduleId)
          : [...c.assignedModules, moduleId],
      }
    }))
  }

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top Nav */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '14px' }}>SV</div>
            <div>
              <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '700' }}>Scale Vyapar</p>
              <p style={{ margin: 0, color: '#475569', fontSize: '10px' }}>Business Automation Platform</p>
            </div>
          </div>
          <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40' }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>admin@scalevyapar.com</span>
          <button
            onClick={() => { window.location.href = '/login' }}
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Modules', value: `${modules.length}`, icon: '🧩', color: '#7c3aed' },
            { label: 'Live Modules', value: '1', icon: '✅', color: '#10b981' },
            { label: 'Active Clients', value: `${clients.length}`, icon: '👥', color: '#0284c7' },
            { label: 'Monthly Revenue', value: '₹0', icon: '💰', color: '#f59e0b' },
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { key: 'modules', label: '🧩 Module Management' },
            { key: 'clients', label: '👥 Client Management' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 20px',
                border: `2px solid ${activeTab === tab.key ? '#7c3aed' : '#e2e8f0'}`,
                background: activeTab === tab.key ? '#ede9fe' : 'white',
                color: activeTab === tab.key ? '#7c3aed' : '#64748b',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? '700' : '500',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MODULES TAB */}
        {activeTab === 'modules' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Module Management</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>All platform modules — assign to clients from the Client tab</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {modules.map(mod => (
                <div key={mod.id} style={{ background: 'white', border: `1px solid ${mod.status === 'active' ? '#a78bfa50' : '#e2e8f0'}`, borderRadius: '18px', overflow: 'hidden', boxShadow: mod.status === 'active' ? '0 4px 20px rgba(124,58,237,0.1)' : 'none' }}>
                  <div style={{ height: '5px', background: `linear-gradient(135deg, ${mod.color.includes('violet') ? '#7c3aed,#4f46e5' : mod.color.includes('blue') ? '#0284c7,#0369a1' : mod.color.includes('emerald') ? '#059669,#047857' : mod.color.includes('green') ? '#16a34a,#15803d' : mod.color.includes('orange') ? '#d97706,#b45309' : '#84cc16,#65a30d'})` }} />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: mod.status === 'active' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        {mod.icon}
                      </div>
                      <span style={{ background: mod.status === 'active' ? '#d1fae520' : '#f1f5f9', color: mod.status === 'active' ? '#10b981' : '#94a3b8', fontSize: '11px', padding: '3px 10px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${mod.status === 'active' ? '#10b98130' : '#e2e8f0'}` }}>
                        {mod.status === 'active' ? '● Live' : '○ Coming Soon'}
                      </span>
                    </div>
                    <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>{mod.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 14px', lineHeight: '1.6' }}>{mod.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                      {mod.features.map(f => (
                        <span key={f} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}>{f}</span>
                      ))}
                    </div>

                    {/* Customer Access Link for Vizora */}
                    {mod.customerLink && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '10px', color: '#166534', margin: '0 0 4px', fontWeight: '700' }}>🔗 Customer Access Link</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontSize: '10px', color: '#16a34a', margin: '0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.customerLink}</p>
                          <button
                            onClick={() => copyLink(mod.customerLink!, mod.id)}
                            style={{ background: '#16a34a', color: 'white', border: 'none', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                          >
                            {copied === mod.id ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', flex: 1, marginRight: '12px' }}>
                        {[
                          { label: 'Clients', value: mod.stats.clients },
                          { label: 'Usage', value: mod.stats.usage },
                          { label: 'Revenue', value: mod.stats.revenue },
                        ].map(s => (
                          <div key={s.label} style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0' }}>{s.value}</p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {mod.status === 'active' ? (
                        <Link href={mod.href} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', fontSize: '12px', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          Open →
                        </Link>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: '11px', padding: '7px 14px', borderRadius: '8px', whiteSpace: 'nowrap' }}>Soon</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === 'clients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Client Management</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>Assign modules to each client — toggle to enable/disable</p>
              </div>
              <button style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', fontSize: '13px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                + Add Client
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {clients.map(client => (
                <div key={client.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Client header */}
                  <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px' }}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{client.name}</p>
                        <p style={{ margin: '0', color: '#64748b', fontSize: '12px' }}>{client.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '12px', padding: '4px 12px', borderRadius: '99px', fontWeight: '600' }}>{client.plan} Plan</span>
                      <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', padding: '4px 12px', borderRadius: '99px', fontWeight: '600', border: '1px solid #bbf7d0' }}>● Active</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Joined {client.joinedAt}</span>
                      <button
                        onClick={() => setEditingClient(editingClient === client.id ? null : client.id)}
                        style={{ background: editingClient === client.id ? '#ede9fe' : '#f8fafc', color: editingClient === client.id ? '#7c3aed' : '#64748b', border: `1px solid ${editingClient === client.id ? '#7c3aed' : '#e2e8f0'}`, fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        {editingClient === client.id ? 'Done ✓' : 'Edit Modules'}
                      </button>
                    </div>
                  </div>

                  {/* Module assignment */}
                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Assigned Modules ({client.assignedModules.length}/{modules.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {modules.map(mod => {
                        const isAssigned = client.assignedModules.includes(mod.id)
                        const isEditing = editingClient === client.id
                        return (
                          <div
                            key={mod.id}
                            onClick={() => isEditing && mod.status === 'active' && toggleModule(client.id, mod.id)}
                            style={{
                              padding: '12px 14px',
                              border: `2px solid ${isAssigned ? '#7c3aed' : '#e2e8f0'}`,
                              background: isAssigned ? '#ede9fe' : '#f8fafc',
                              borderRadius: '10px',
                              cursor: isEditing && mod.status === 'active' ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s',
                              opacity: mod.status !== 'active' && !isAssigned ? 0.5 : 1,
                            }}
                          >
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: isAssigned ? '#7c3aed' : '#374151' }}>{mod.name}</p>
                              <p style={{ margin: '0', fontSize: '10px', color: '#94a3b8' }}>{mod.status === 'active' ? 'Live' : 'Coming Soon'}</p>
                            </div>
                            <div style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              background: isAssigned ? '#7c3aed' : 'transparent',
                              border: `2px solid ${isAssigned ? '#7c3aed' : '#d1d5db'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                            }}>
                              {isAssigned ? '✓' : ''}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {editingClient === client.id && (
                      <div style={{ marginTop: '14px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                        <p style={{ margin: '0', fontSize: '12px', color: '#92400e' }}>
                          ✏️ Editing mode — click any <strong>Live</strong> module to toggle. Coming Soon modules will be enabled when they launch.
                        </p>
                      </div>
                    )}

                    {/* Vizora access link for client */}
                    {client.assignedModules.includes('vizora') && (
                      <div style={{ marginTop: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#166534' }}>🔗 Vizora Access Link for {client.name}</p>
                          <p style={{ margin: '0', fontSize: '11px', color: '#16a34a' }}>https://scalevyapar.vercel.app/vizora</p>
                        </div>
                        <button
                          onClick={() => copyLink('https://scalevyapar.vercel.app/vizora', client.id + '-vizora')}
                          style={{ background: '#16a34a', color: 'white', border: 'none', fontSize: '12px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          {copied === client.id + '-vizora' ? '✓ Copied!' : 'Copy & Share'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}