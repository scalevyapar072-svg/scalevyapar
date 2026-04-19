'use client'
import { useState } from 'react'
import Link from 'next/link'

const initialModules = [
  {
    id: 'vizora',
    name: 'Vizora',
    description: 'AI-powered photo, video and ad creation studio for fashion and product sellers.',
    status: 'active',
    type: 'AI Module',
    icon: '✦',
    href: '/vizora',
    customerLink: 'https://scalevyapar.vercel.app/vizora',
    features: ['AI Photo Generation', 'Photo Upscaling 4x', 'Video Ads', 'UGC Creator Videos', 'Magic Eraser'],
    color: '#7c3aed',
  },
  {
    id: 'crm',
    name: 'CRM Module',
    description: 'Customer relationship management and call tracking.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◈',
    href: '#',
    customerLink: '',
    features: ['Contact Management', 'Call Tracking', 'Follow-ups', 'Pipeline'],
    color: '#0284c7',
  },
  {
    id: 'inventory',
    name: 'Inventory Module',
    description: 'Stock management and production tracking.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◉',
    href: '#',
    customerLink: '',
    features: ['Stock Tracking', 'Production Orders', 'Raw Materials', 'Dispatch'],
    color: '#059669',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Module',
    description: 'Bulk messaging, chatbot and lead automation.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◎',
    href: '#',
    customerLink: '',
    features: ['Bulk Messaging', 'Chatbot', 'Auto Replies', 'Lead Capture'],
    color: '#16a34a',
  },
  {
    id: 'leads',
    name: 'Lead Generation',
    description: 'Google data extractor — scrape B2B leads by location and business type.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◎',
    href: '#',
    customerLink: '',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business', 'Export CSV'],
    color: '#d97706',
  },
  {
    id: 'shopify',
    name: 'Shopify / Website',
    description: 'Website setup, product catalog, pricing and order management.',
    status: 'coming_soon',
    type: 'Standard',
    icon: '◇',
    href: '#',
    customerLink: '',
    features: ['Shopify Setup', 'Product Catalog', 'Order Management', 'Pricing'],
    color: '#84cc16',
  },
]

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

const BLANK_MODULE = {
  id: '',
  name: '',
  description: '',
  status: 'coming_soon',
  type: 'Standard',
  icon: '◆',
  href: '#',
  customerLink: '',
  features: [''],
  color: '#7c3aed',
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'modules' | 'clients'>('modules')
  const [modules, setModules] = useState(initialModules)
  const [clients, setClients] = useState(initialClients)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [addingModule, setAddingModule] = useState(false)
  const [newModule, setNewModule] = useState({ ...BLANK_MODULE })
  const [editModule, setEditModule] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const startEdit = (mod: any) => {
    setEditModule({ ...mod, features: [...mod.features] })
    setEditingModuleId(mod.id)
    setAddingModule(false)
  }

  const saveEdit = () => {
    if (!editModule.name.trim()) return
    setModules(prev => prev.map(m => m.id === editModule.id ? { ...editModule } : m))
    setEditingModuleId(null)
    setEditModule(null)
  }

  const deleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id))
    setDeleteConfirm(null)
  }

  const saveNew = () => {
    if (!newModule.name.trim()) return
    const id = newModule.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    setModules(prev => [...prev, { ...newModule, id, features: newModule.features.filter(f => f.trim()) }])
    setNewModule({ ...BLANK_MODULE })
    setAddingModule(false)
  }

  const toggleModule = (clientId: string, moduleId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      const has = c.assignedModules.includes(moduleId)
      return { ...c, assignedModules: has ? c.assignedModules.filter(m => m !== moduleId) : [...c.assignedModules, moduleId] }
    }))
  }

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const updateFeature = (arr: string[], i: number, val: string) => arr.map((f, idx) => idx === i ? val : f)

  const inp = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }

  const ModuleForm = ({ data, setData, onSave, onCancel, title }: any) => (
    <div style={{ background: '#f8fafc', border: '2px solid #7c3aed', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed', margin: '0 0 16px' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Module Name *</label>
          <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Ads Manager" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type</label>
          <select value={data.type} onChange={e => setData({ ...data, type: e.target.value })} style={inp}>
            <option>Standard</option>
            <option>AI Module</option>
            <option>Premium</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Status</label>
          <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })} style={inp}>
            <option value="active">Live / Active</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Icon (emoji or symbol)</label>
          <input value={data.icon} onChange={e => setData({ ...data, icon: e.target.value })} placeholder="e.g. 📊 or ◆" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Module URL (href)</label>
          <input value={data.href} onChange={e => setData({ ...data, href: e.target.value })} placeholder="/module-name or #" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Customer Access Link</label>
          <input value={data.customerLink} onChange={e => setData({ ...data, customerLink: e.target.value })} placeholder="https://scalevyapar.vercel.app/..." style={inp} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Color (hex)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={data.color} onChange={e => setData({ ...data, color: e.target.value })} placeholder="#7c3aed" style={{ ...inp, flex: 1 }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: data.color, border: '1px solid #e2e8f0', flexShrink: 0 }} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
        <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="What does this module do?" rows={2} style={{ ...inp, resize: 'none' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Features (one per line)</label>
        {data.features.map((f: string, i: number) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input value={f} onChange={e => setData({ ...data, features: updateFeature(data.features, i, e.target.value) })} placeholder={`Feature ${i + 1}`} style={{ ...inp, flex: 1 }} />
            {data.features.length > 1 && (
              <button onClick={() => setData({ ...data, features: data.features.filter((_: any, idx: number) => idx !== i) })} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', fontSize: '14px' }}>×</button>
            )}
          </div>
        ))}
        <button onClick={() => setData({ ...data, features: [...data.features, ''] })} style={{ background: '#f8fafc', color: '#7c3aed', border: '1px dashed #7c3aed', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>+ Add Feature</button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer' }}>Save Module</button>
        <button onClick={onCancel} style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontSize: '13px', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )

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
          <button onClick={() => { window.location.href = '/login' }} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Modules', value: `${modules.length}`, icon: '🧩', color: '#7c3aed' },
            { label: 'Live Modules', value: `${modules.filter(m => m.status === 'active').length}`, icon: '✅', color: '#10b981' },
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
          {[{ key: 'modules', label: '🧩 Module Management' }, { key: 'clients', label: '👥 Client Management' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ padding: '10px 20px', border: `2px solid ${activeTab === tab.key ? '#7c3aed' : '#e2e8f0'}`, background: activeTab === tab.key ? '#ede9fe' : 'white', color: activeTab === tab.key ? '#7c3aed' : '#64748b', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.key ? '700' : '500' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* MODULES TAB */}
        {activeTab === 'modules' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Module Management</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>Add, edit or delete modules. Assign them to clients in the Client tab.</p>
              </div>
              <button
                onClick={() => { setAddingModule(true); setEditingModuleId(null); setNewModule({ ...BLANK_MODULE }) }}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                + Add New Module
              </button>
            </div>

            {/* Add new module form */}
            {addingModule && (
              <ModuleForm
                data={newModule}
                setData={setNewModule}
                onSave={saveNew}
                onCancel={() => setAddingModule(false)}
                title="✦ Create New Module"
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {modules.map(mod => (
                <div key={mod.id}>
                  {/* Edit form inline */}
                  {editingModuleId === mod.id && editModule ? (
                    <ModuleForm
                      data={editModule}
                      setData={setEditModule}
                      onSave={saveEdit}
                      onCancel={() => { setEditingModuleId(null); setEditModule(null) }}
                      title={`✎ Editing — ${mod.name}`}
                    />
                  ) : (
                    <div style={{ background: 'white', border: `1px solid ${mod.status === 'active' ? '#a78bfa50' : '#e2e8f0'}`, borderRadius: '18px', overflow: 'hidden', boxShadow: mod.status === 'active' ? '0 4px 20px rgba(124,58,237,0.1)' : 'none' }}>
                      <div style={{ height: '5px', background: mod.color }} />
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: mod.color + '20', border: `1px solid ${mod.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {mod.icon}
                          </div>
                          <span style={{ background: mod.status === 'active' ? '#d1fae520' : '#f1f5f9', color: mod.status === 'active' ? '#10b981' : '#94a3b8', fontSize: '11px', padding: '3px 10px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${mod.status === 'active' ? '#10b98130' : '#e2e8f0'}` }}>
                            {mod.status === 'active' ? '● Live' : '○ Coming Soon'}
                          </span>
                        </div>

                        <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>{mod.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 6px' }}>{mod.type}</p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>{mod.description}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                          {mod.features.map(f => (
                            <span key={f} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}>{f}</span>
                          ))}
                        </div>

                        {mod.customerLink && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '10px', color: '#16a34a', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{mod.customerLink}</p>
                            <button onClick={() => copyLink(mod.customerLink, mod.id)} style={{ background: '#16a34a', color: 'white', border: 'none', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {copied === mod.id ? '✓' : 'Copy'}
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => startEdit(mod)}
                            style={{ flex: 1, background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', fontSize: '12px', fontWeight: '700', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            ✎ Edit
                          </button>
                          {mod.status === 'active' && (
                            <Link href={mod.href} style={{ flex: 1, background: '#7c3aed', color: 'white', fontSize: '12px', fontWeight: '700', padding: '8px', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
                              Open →
                            </Link>
                          )}
                          {deleteConfirm === mod.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => deleteModule(mod.id)} style={{ background: '#dc2626', color: 'white', border: 'none', fontSize: '11px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Delete!</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontSize: '11px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(mod.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>🗑</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>Assign modules to each client — click Edit Modules to toggle</p>
              </div>
              <button style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', fontSize: '13px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>+ Add Client</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {clients.map(client => (
                <div key={client.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
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
                      <button
                        onClick={() => setEditingClient(editingClient === client.id ? null : client.id)}
                        style={{ background: editingClient === client.id ? '#ede9fe' : '#f8fafc', color: editingClient === client.id ? '#7c3aed' : '#64748b', border: `1px solid ${editingClient === client.id ? '#7c3aed' : '#e2e8f0'}`, fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        {editingClient === client.id ? 'Done ✓' : 'Edit Modules'}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Assigned Modules ({client.assignedModules.length}/{modules.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {modules.map(mod => {
                        const isAssigned = client.assignedModules.includes(mod.id)
                        const isEditing = editingClient === client.id
                        return (
                          <div key={mod.id} onClick={() => isEditing && toggleModule(client.id, mod.id)} style={{ padding: '12px 14px', border: `2px solid ${isAssigned ? mod.color : '#e2e8f0'}`, background: isAssigned ? mod.color + '12' : '#f8fafc', borderRadius: '10px', cursor: isEditing ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: isAssigned ? mod.color : '#374151' }}>{mod.name}</p>
                              <p style={{ margin: '0', fontSize: '10px', color: '#94a3b8' }}>{mod.status === 'active' ? 'Live' : 'Coming Soon'}</p>
                            </div>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isAssigned ? mod.color : 'transparent', border: `2px solid ${isAssigned ? mod.color : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                              {isAssigned ? '✓' : ''}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {editingClient === client.id && (
                      <div style={{ marginTop: '12px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                        <p style={{ margin: '0', fontSize: '12px', color: '#92400e' }}>✏️ Click any module card to toggle access ON/OFF for this client</p>
                      </div>
                    )}
                    {client.assignedModules.includes('vizora') && (
                      <div style={{ marginTop: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#166534' }}>🔗 Vizora Access Link for {client.name}</p>
                          <p style={{ margin: '0', fontSize: '11px', color: '#16a34a' }}>https://scalevyapar.vercel.app/vizora</p>
                        </div>
                        <button onClick={() => copyLink('https://scalevyapar.vercel.app/vizora', client.id + '-vizora')} style={{ background: '#16a34a', color: 'white', border: 'none', fontSize: '12px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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