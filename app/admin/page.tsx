'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type ModuleItem = {
  id: string
  name: string
  slug: string
  description?: string
  status?: 'active' | 'coming_soon'
  type?: string
  icon?: string
  href?: string
  customerLink?: string
  features?: string[]
  color?: string
  isActive?: boolean
}

type ClientItem = {
  id: string
  name: string
  email: string
  role?: string
  phone?: string
  plan?: string
  status?: string
  createdAt: string
  assignedModules: ModuleItem[]
  assignedModuleIds: string[]
}

const BLANK_MODULE: ModuleItem = {
  id: '',
  name: '',
  slug: '',
  description: '',
  status: 'coming_soon',
  type: 'Standard',
  icon: '◆',
  href: '#',
  customerLink: '',
  features: [''],
  color: '#7c3aed',
  isActive: false
}

const BLANK_CLIENT = {
  name: '',
  email: '',
  phone: '',
  plan: 'Starter'
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'modules' | 'clients'>('modules')
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [copied, setCopied] = useState('')

  const [addingModule, setAddingModule] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [moduleDraft, setModuleDraft] = useState<ModuleItem>(BLANK_MODULE)

  const [addingClient, setAddingClient] = useState(false)
  const [clientDraft, setClientDraft] = useState(BLANK_CLIENT)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    title: string
    clientId: string
    email: string
    temporaryPassword: string
  } | null>(null)

  const inp = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    color: '#0f172a',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  }

  const lbl = {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600' as const,
    display: 'block' as const,
    marginBottom: '4px'
  }

  const activeModulesCount = useMemo(
    () => modules.filter(module => module.status === 'active' || module.isActive).length,
    [modules]
  )

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')

    try {
      const [modulesRes, clientsRes] = await Promise.all([
        fetch('/api/admin/modules', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' })
      ])

      if (!modulesRes.ok || !clientsRes.ok) {
        throw new Error('Failed to load admin data')
      }

      const modulesData = await modulesRes.json()
      const clientsData = await clientsRes.json()

      setModules(modulesData.modules || [])
      setClients((clientsData.users || []).filter((user: ClientItem) => user.role !== 'ADMIN'))
    } catch {
      setError('Unable to load admin data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAdminData()
  }, [])

  const showSaved = (message: string) => {
    setSaved(message)
    setTimeout(() => setSaved(''), 2500)
  }

  const startAddModule = () => {
    setModuleDraft(BLANK_MODULE)
    setEditingModuleId(null)
    setAddingModule(true)
  }

  const startEditModule = (module: ModuleItem) => {
    setModuleDraft({
      ...BLANK_MODULE,
      ...module,
      features: module.features?.length ? [...module.features] : ['']
    })
    setEditingModuleId(module.id)
    setAddingModule(false)
  }

  const saveModule = async () => {
    setError('')
    const payload = {
      ...moduleDraft,
      slug: moduleDraft.slug || toSlug(moduleDraft.name),
      features: (moduleDraft.features || []).filter(feature => feature.trim()),
      isActive: moduleDraft.status === 'active'
    }

    if (!payload.name.trim() || !payload.slug.trim()) {
      setError('Module name and slug are required.')
      return
    }

    const endpoint = editingModuleId ? `/api/admin/modules/${editingModuleId}` : '/api/admin/modules'
    const method = editingModuleId ? 'PUT' : 'POST'
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))
    if (!res.ok) {
      setError(data.error || 'Failed to save module.')
      return
    }

    setAddingModule(false)
    setEditingModuleId(null)
    setModuleDraft(BLANK_MODULE)
    await fetchAdminData()
    showSaved('Module saved')
  }

  const deleteModule = async (id: string) => {
    setError('')
    const confirmed = window.confirm('Delete this module? This will also remove it from assigned clients.')
    if (!confirmed) {
      return
    }

    const res = await fetch(`/api/admin/modules/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to delete module.' }))
      setError(data.error || 'Failed to delete module.')
      return
    }

    await fetchAdminData()
    showSaved('Module deleted')
  }

  const saveClient = async () => {
    setError('')

    if (!clientDraft.name.trim() || !clientDraft.email.trim()) {
      setError('Client name and email are required.')
      return
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: clientDraft.name,
        email: clientDraft.email,
        phone: clientDraft.phone,
        plan: clientDraft.plan
      })
    })

    const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

    if (!res.ok) {
      setError(data.error || 'Failed to create client.')
      return
    }

    setGeneratedCredentials({
      title: 'Client credentials generated',
      clientId: data.user?.id || '',
      email: data.user?.email || clientDraft.email,
      temporaryPassword: data.temporaryPassword || ''
    })

    setClientDraft(BLANK_CLIENT)
    setAddingClient(false)
    await fetchAdminData()
    showSaved('Client created')
  }

  const deleteClient = async (clientId: string) => {
    setError('')
    const confirmed = window.confirm('Delete this client? This will also remove their module access.')
    if (!confirmed) {
      return
    }

    const res = await fetch(`/api/admin/users/${clientId}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to delete client.' }))
      setError(data.error || 'Failed to delete client.')
      return
    }

    setClients(current => current.filter(client => client.id !== clientId))
    showSaved('Client deleted')
  }

    const resetClientPassword = async (client: ClientItem) => {
    setError('')
    const confirmed = window.confirm(`Reset password for ${client.name}? A new temporary password will be generated.`)
    if (!confirmed) {
      return
    }

    const res = await fetch(`/api/admin/users/${client.id}/reset-password`, {
      method: 'POST'
    })

    const data = await res.json().catch(() => ({ error: 'Failed to reset password.' }))

    if (!res.ok) {
      setError(data.error || 'Failed to reset password.')
      return
    }

    setGeneratedCredentials({
      title: `Temporary password reset for ${client.name}`,
      clientId: client.id,
      email: client.email,
      temporaryPassword: data.password || ''
    })
    showSaved('Password reset')
  }
  const toggleClientModule = async (clientId: string, moduleId: string) => {
    setError('')
    const client = clients.find(item => item.id === clientId)
    if (!client) return

    const nextModuleIds = client.assignedModuleIds.includes(moduleId)
      ? client.assignedModuleIds.filter(id => id !== moduleId)
      : [...client.assignedModuleIds, moduleId]

    const res = await fetch(`/api/admin/users/${clientId}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleIds: nextModuleIds })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to update client modules.' }))
      setError(data.error || 'Failed to update client modules.')
      return
    }

    setClients(current =>
      current.map(item =>
        item.id === clientId
          ? {
              ...item,
              assignedModuleIds: nextModuleIds,
              assignedModules: modules.filter(module => nextModuleIds.includes(module.id))
            }
          : item
      )
    )
    showSaved('Client modules updated')
  }

  const updateFeature = (index: number, value: string) => {
    const nextFeatures = [...(moduleDraft.features || [''])]
    nextFeatures[index] = value
    setModuleDraft(current => ({ ...current, features: nextFeatures }))
  }

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      setError('Copy failed.')
    }
  }

  const ModuleForm = (
    <div style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {editingModuleId ? 'Edit Module' : 'Create New Module'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={lbl}>Module Name *</label>
          <input value={moduleDraft.name} onChange={event => setModuleDraft(current => ({ ...current, name: event.target.value, slug: current.slug || toSlug(event.target.value) }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Slug *</label>
          <input value={moduleDraft.slug} onChange={event => setModuleDraft(current => ({ ...current, slug: toSlug(event.target.value) }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Type</label>
          <select value={moduleDraft.type} onChange={event => setModuleDraft(current => ({ ...current, type: event.target.value }))} style={inp}>
            <option>Standard</option>
            <option>AI Module</option>
            <option>Premium</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select value={moduleDraft.status} onChange={event => setModuleDraft(current => ({ ...current, status: event.target.value as ModuleItem['status'], isActive: event.target.value === 'active' }))} style={inp}>
            <option value="active">Live / Active</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Icon</label>
          <input value={moduleDraft.icon} onChange={event => setModuleDraft(current => ({ ...current, icon: event.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Color</label>
          <input value={moduleDraft.color} onChange={event => setModuleDraft(current => ({ ...current, color: event.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Module URL</label>
          <input value={moduleDraft.href} onChange={event => setModuleDraft(current => ({ ...current, href: event.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Customer Access Link</label>
          <input value={moduleDraft.customerLink} onChange={event => setModuleDraft(current => ({ ...current, customerLink: event.target.value }))} style={inp} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Description</label>
          <textarea value={moduleDraft.description} onChange={event => setModuleDraft(current => ({ ...current, description: event.target.value }))} rows={2} style={{ ...inp, resize: 'none' }} />
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ ...lbl, marginBottom: '8px' }}>Features</label>
        {(moduleDraft.features || ['']).map((feature, index) => (
          <div key={`${feature}-${index}`} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input value={feature} onChange={event => updateFeature(index, event.target.value)} style={{ ...inp, flex: 1 }} />
            {(moduleDraft.features || []).length > 1 && (
              <button onClick={() => setModuleDraft(current => ({ ...current, features: (current.features || []).filter((_, featureIndex) => featureIndex !== index) }))} style={{ background: '#ffffff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '0 10px', cursor: 'pointer', fontSize: '16px' }}>
                x
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setModuleDraft(current => ({ ...current, features: [...(current.features || []), ''] }))} style={{ background: '#f8fafc', color: '#2563eb', border: '1px dashed #93c5fd', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
          + Add Feature
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={saveModule} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>
          Save Module
        </button>
        <button onClick={() => { setAddingModule(false); setEditingModuleId(null); setModuleDraft(BLANK_MODULE) }} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', fontSize: '13px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading admin panel...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {(saved || error) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          {error || saved}
        </div>
      )}

      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(15,23,42,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '14px' }}>SV</div>
            <div>
              <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: '700' }}>Scale Vyapar</p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '10px' }}>Business Automation Platform</p>
            </div>
          </div>
          <span style={{ background: '#f8fafc', color: '#334155', fontSize: '11px', padding: '4px 10px', borderRadius: '99px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>admin@scalevyapar.com</span>
          <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }} style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', fontSize: '12px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Modules', value: `${modules.length}`, icon: 'Modules', color: '#7c3aed' },
            { label: 'Live Modules', value: `${activeModulesCount}`, icon: 'Live', color: '#10b981' },
            { label: 'Active Clients', value: `${clients.length}`, icon: 'Clients', color: '#0284c7' },
            { label: 'Connected Assignments', value: `${clients.reduce((count, client) => count + client.assignedModuleIds.length, 0)}`, icon: 'Links', color: '#f59e0b' }
          ].map(card => (
            <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ minWidth: '56px', height: '56px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#334155', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{card.icon}</div>
              <div>
                <p style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px' }}>{card.value}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {generatedCredentials && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#0f172a', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{generatedCredentials.title}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Client ID</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>{generatedCredentials.clientId}</p>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Email</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>{generatedCredentials.email}</p>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Temporary Password</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>{generatedCredentials.temporaryPassword}</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => copyText(generatedCredentials.clientId, 'generated-client-id')} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '12px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                {copied === 'generated-client-id' ? 'Copied ID' : 'Copy ID'}
              </button>
              <button onClick={() => copyText(generatedCredentials.email, 'generated-client-email')} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '12px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                {copied === 'generated-client-email' ? 'Copied Email' : 'Copy Email'}
              </button>
              <button onClick={() => copyText(generatedCredentials.temporaryPassword, 'generated-client-password')} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '12px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                {copied === 'generated-client-password' ? 'Copied Password' : 'Copy Password'}
              </button>
              <button onClick={() => setGeneratedCredentials(null)} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', fontSize: '12px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[{ key: 'modules', label: 'Module Management' }, { key: 'clients', label: 'Client Management' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as 'modules' | 'clients')} style={{ padding: '10px 20px', border: `1px solid ${activeTab === tab.key ? '#cbd5e1' : '#e2e8f0'}`, background: activeTab === tab.key ? '#ffffff' : '#f8fafc', color: activeTab === tab.key ? '#0f172a' : '#64748b', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.key ? '700' : '600', boxShadow: activeTab === tab.key ? '0 6px 18px rgba(15, 23, 42, 0.06)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'modules' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Module Management</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Changes here now update the same server data used by client dashboards.</p>
              </div>
              <button onClick={startAddModule} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '11px 20px', borderRadius: '12px', cursor: 'pointer' }}>
                + Add New Module
              </button>
            </div>

            {(addingModule || editingModuleId) && ModuleForm}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {modules.map(module => (
                <div key={module.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ height: '4px', background: '#e2e8f0' }} />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#334155' }}>
                        {module.icon || '◆'}
                      </div>
                      <span style={{ background: module.status === 'active' ? '#f0fdf4' : '#f8fafc', color: module.status === 'active' ? '#166534' : '#64748b', fontSize: '11px', padding: '4px 10px', borderRadius: '99px', fontWeight: '700', border: `1px solid ${module.status === 'active' ? '#bbf7d0' : '#e2e8f0'}` }}>
                        {module.status === 'active' ? 'Live' : 'Coming Soon'}
                      </span>
                    </div>
                    <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>{module.name}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 6px' }}>{module.type || 'Standard'}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>{module.description || 'No description yet.'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                      {(module.features || []).map(feature => (
                        <span key={feature} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                    {module.customerLink && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '10px', color: '#16a34a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{module.customerLink}</p>
                        <button onClick={() => copyText(module.customerLink || '', module.id)} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                          {copied === module.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEditModule(module)} style={{ flex: 1, background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', fontSize: '12px', fontWeight: '700', padding: '9px', borderRadius: '10px', cursor: 'pointer' }}>
                        Edit
                      </button>
                      {module.href && module.href !== '#' && (
                        <Link href={module.href} target="_blank" style={{ flex: 1, background: '#0f172a', color: 'white', fontSize: '12px', fontWeight: '700', padding: '9px', borderRadius: '10px', textDecoration: 'none', textAlign: 'center' }}>
                          Open
                        </Link>
                      )}
                      <button onClick={() => deleteModule(module.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Client Management</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Assign modules here and the client dashboard will update from the same backend records.</p>
              </div>
              <button onClick={() => setAddingClient(true)} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '11px 20px', borderRadius: '12px', cursor: 'pointer' }}>
                + Add New Client
              </button>
            </div>

            {addingClient && (
              <div style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '18px', padding: '24px', marginBottom: '20px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)' }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Create Client</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={lbl}>Business Name *</label>
                    <input value={clientDraft.name} onChange={event => setClientDraft(current => ({ ...current, name: event.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email Address *</label>
                    <input type="email" value={clientDraft.email} onChange={event => setClientDraft(current => ({ ...current, email: event.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Phone Number</label>
                    <input value={clientDraft.phone} onChange={event => setClientDraft(current => ({ ...current, phone: event.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Subscription Plan</label>
                    <select value={clientDraft.plan} onChange={event => setClientDraft(current => ({ ...current, plan: event.target.value }))} style={inp}>
                      <option>Starter</option>
                      <option>Growth</option>
                      <option>Pro</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveClient} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '14px', fontWeight: '700', padding: '11px 24px', borderRadius: '12px', cursor: 'pointer' }}>
                    Save Client
                  </button>
                  <button onClick={() => setAddingClient(false)} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', fontSize: '13px', padding: '11px 20px', borderRadius: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {clients.map(client => (
                <div key={client.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{client.name}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{client.email}{client.phone ? ` · ${client.phone}` : ''}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#f8fafc', color: '#334155', fontSize: '12px', padding: '5px 12px', borderRadius: '99px', fontWeight: '600', border: '1px solid #e2e8f0' }}>{client.plan || 'Starter'}</span>
                      <span style={{ background: '#f0fdf4', color: '#166534', fontSize: '12px', padding: '5px 12px', borderRadius: '99px', fontWeight: '600', border: '1px solid #bbf7d0' }}>{client.status || 'active'}</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Joined {formatDate(client.createdAt)}</span>
                      <button onClick={() => setEditingClientId(current => current === client.id ? null : client.id)} style={{ background: editingClientId === client.id ? '#0f172a' : '#ffffff', color: editingClientId === client.id ? '#ffffff' : '#475569', border: `1px solid ${editingClientId === client.id ? '#0f172a' : '#dbe2ea'}`, fontSize: '12px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                        {editingClientId === client.id ? 'Done' : 'Edit Modules'}
                      </button>
                      <button onClick={() => resetClientPassword(client)} style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                        Reset Password
                      </button>
                      <button onClick={() => deleteClient(client.id)} style={{ background: '#ffffff', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Assigned Modules ({client.assignedModuleIds.length}/{modules.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {modules.map(module => {
                        const isAssigned = client.assignedModuleIds.includes(module.id)
                        const isEditing = editingClientId === client.id
                        return (
                          <div key={`${client.id}-${module.id}`} onClick={() => isEditing && toggleClientModule(client.id, module.id)} style={{ padding: '12px 14px', border: `1px solid ${isAssigned ? module.color || '#2563eb' : '#e2e8f0'}`, background: isAssigned ? '#ffffff' : '#f8fafc', borderRadius: '12px', cursor: isEditing ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: isAssigned ? '0 6px 18px rgba(15, 23, 42, 0.04)' : 'none' }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{module.name}</p>
                              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{module.status === 'active' ? 'Live' : 'Coming Soon'}</p>
                            </div>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isAssigned ? '#0f172a' : 'transparent', border: `2px solid ${isAssigned ? '#0f172a' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700' }}>
                              {isAssigned ? 'Yes' : ''}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {editingClientId === client.id && (
                      <div style={{ marginTop: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Click any module card above to toggle access on or off. The client dashboard will reflect the change from backend data.</p>
                      </div>
                    )}

                    {client.assignedModules
                      .filter(module => module.customerLink)
                      .map(module => (
                        <div key={`${client.id}-${module.id}-link`} style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{module.name} Access Link</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{module.customerLink}</p>
                          </div>
                          <button onClick={() => copyText(module.customerLink || '', `${client.id}-${module.id}`)} style={{ background: '#0f172a', color: 'white', border: 'none', fontSize: '12px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                            {copied === `${client.id}-${module.id}` ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                      ))}
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






