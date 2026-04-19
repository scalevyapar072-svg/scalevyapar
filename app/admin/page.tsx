'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  assignedModules?: Module[]
}

interface Module {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  isActive?: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModule, setShowAddModule] = useState(false)
  const [showEditModule, setShowEditModule] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [newClient, setNewClient] = useState({
    name: '', email: '', password: '', moduleIds: [] as string[]
  })
  const [newModule, setNewModule] = useState({
    name: '', slug: '', icon: '📌', description: '', isActive: true
  })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersRes, modulesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/modules')
      ])
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
      if (modulesRes.ok) {
        const data = await modulesRes.json()
        setModules(data.modules || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.password) {
      alert('Please fill all fields')
      return
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })
      if (res.ok) {
        setShowAddForm(false)
        setNewClient({ name: '', email: '', password: '', moduleIds: [] })
        loadData()
        alert('Client added successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEditModules = (user: User) => {
    setSelectedUser(user)
    const preSelected = (user.assignedModules || []).map(m => m.id)
    setSelectedModules(preSelected)
    setShowEditModal(true)
  }

  const handleSaveModules = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds: selectedModules })
      })
      if (res.ok) {
        setShowEditModal(false)
        loadData()
        alert('Modules updated successfully!')
      } else {
        alert('Failed to update modules.')
      }
    } catch (error) {
      alert('Error saving modules.')
    }
  }

  const handleAddModule = async () => {
    if (!newModule.name || !newModule.slug) {
      alert('Please fill name and slug')
      return
    }
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule)
      })
      const data = await res.json()
      if (res.ok) {
        setShowAddModule(false)
        setNewModule({ name: '', slug: '', icon: '📌', description: '', isActive: true })
        loadData()
        alert('Module added successfully!')
      } else {
        alert(data.error || 'Failed to add module')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEditModule = (module: Module) => {
    setSelectedModule({ ...module })
    setShowEditModule(true)
  }

  const handleUpdateModule = async () => {
    if (!selectedModule) return
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedModule)
      })
      if (res.ok) {
        setShowEditModule(false)
        loadData()
        alert('Module updated!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: moduleId })
      })
      if (res.ok) {
        loadData()
        alert('Module deleted!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleToggleModuleStatus = async (module: Module) => {
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...module, isActive: !module.isActive })
      })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  const toggleNewModule = (moduleId: string) => {
    setNewClient(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId]
    }))
  }

  const getModuleEmoji = (slug: string) => {
    const map: { [key: string]: string } = {
      leads: '🎯', crm: '👥', whatsapp: '💬', shopify: '🛒', inventory: '📦'
    }
    return map[slug] || '📌'
  }

  const getModuleDescription = (slug: string) => {
    const map: { [key: string]: string } = {
      leads: 'Extract B2B leads from Google Maps by location and business type',
      crm: 'Manage customer relationships, calls, follow-ups and deal pipeline',
      whatsapp: 'Send bulk messages, chatbot automation and lead nurturing',
      shopify: 'Setup and manage client Shopify store with products and orders',
      inventory: 'Track stock levels, raw materials, production and dispatch'
    }
    return map[slug] || 'Business automation module'
  }

  const clientUsers = users.filter(u => u.role === 'CLIENT')

  const navItems = [
    { icon: '🏠', label: 'Dashboard', key: 'dashboard' },
    { icon: '👥', label: 'Clients', key: 'clients' },
    { icon: '🗂️', label: 'Modules', key: 'modules' },
    { icon: '⚙️', label: 'Settings', key: 'settings' }
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', fontWeight: '800', fontSize: '18px' }}>SV</div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading ScaleVyapar...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}>SV</div>
          <div>
            <p style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px', margin: 0 }}>ScaleVyapar</p>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Panel</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>S</div>
            <div>
              <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600', margin: 0 }}>Scale Vyapar</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px 16px', flexShrink: 0 }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 12px' }}>Main Menu</p>
          {navItems.map(item => (
            <div key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', color: activeTab === item.key ? '#3b82f6' : '#64748b', background: activeTab === item.key ? '#eff6ff' : 'transparent', cursor: 'pointer', marginBottom: '4px', fontSize: '14px', fontWeight: activeTab === item.key ? '600' : '500', borderLeft: activeTab === item.key ? '3px solid #3b82f6' : '3px solid transparent', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div style={{ marginTop: '24px', background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Overview</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Clients</span>
              <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{clientUsers.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Modules</span>
              <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>{modules.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800', margin: '0 0 4px 0' }}>Good morning, Admin 👋</h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Here is what is happening with your platform today</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                  { label: 'Total Clients', value: clientUsers.length, color: '#3b82f6', bg: '#eff6ff', icon: '👥' },
                  { label: 'Active Clients', value: clientUsers.length, color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
                  { label: 'Total Modules', value: modules.length, color: '#8b5cf6', bg: '#f5f3ff', icon: '🗂️' }
                ].map(card => (
                  <div key={card.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: '500' }}>{card.label}</p>
                        <p style={{ color: '#0f172a', fontSize: '40px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{card.value}</p>
                      </div>
                      <div style={{ background: card.bg, width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{card.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveTab('clients'); setShowAddForm(true) }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>➕ Add New Client</button>
                  <button onClick={() => setActiveTab('clients')} style={{ background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>👥 View Clients</button>
                  <button onClick={() => setActiveTab('modules')} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>🗂️ View Modules</button>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <div>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800', margin: '0 0 4px 0' }}>Client Management</h1>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage clients and assign automation modules</p>
                </div>
                <button onClick={() => setShowAddForm(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 8px #3b82f640' }}>➕ Add New Client</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Clients', value: clientUsers.length, color: '#3b82f6', bg: '#eff6ff', icon: '👥' },
                  { label: 'Active Clients', value: clientUsers.length, color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
                  { label: 'Total Modules', value: modules.length, color: '#8b5cf6', bg: '#f5f3ff', icon: '🗂️' }
                ].map(card => (
                  <div key={card.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 6px 0' }}>{card.label}</p>
                        <p style={{ color: '#0f172a', fontSize: '32px', fontWeight: '800', margin: 0 }}>{card.value}</p>
                      </div>
                      <div style={{ background: card.bg, width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{card.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: 0 }}>All Clients ({clientUsers.length})</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Client', 'Email', 'Modules Assigned', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '60px 24px', textAlign: 'center' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                          <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '500', margin: '0 0 4px 0' }}>No clients yet</p>
                          <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>Click Add New Client to get started</p>
                        </td>
                      </tr>
                    ) : (
                      clientUsers.map(user => (
                        <tr key={user.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ color: '#0f172a', fontWeight: '600', fontSize: '14px', margin: 0 }}>{user.name}</p>
                                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Client Account</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{user.email}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {(user.assignedModules || []).length === 0 ? (
                                <span style={{ color: '#cbd5e1', fontSize: '13px', fontStyle: 'italic' }}>No modules assigned</span>
                              ) : (
                                (user.assignedModules || []).map(m => (
                                  <span key={m.id} style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #bfdbfe' }}>
                                    {m.icon || getModuleEmoji(m.slug)} {m.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <button onClick={() => handleEditModules(user)} style={{ background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                              ✏️ Edit Modules
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULES TAB */}
          {activeTab === 'modules' && (
            <div>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800', margin: '0 0 4px 0' }}>Module Management</h1>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Add and manage automation modules for your clients</p>
                </div>
                <button onClick={() => setShowAddModule(true)} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 8px #8b5cf640' }}>
                  + Add New Module
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {modules.map(module => (
                  <div key={module.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '1px solid #e2e8f0' }}>
                          {module.icon || getModuleEmoji(module.slug)}
                        </div>
                        <div>
                          <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>{module.name}</h3>
                          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>#{module.slug}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditModule(module)} style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                        <button onClick={() => handleDeleteModule(module.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.6', minHeight: '38px' }}>
                      {module.description || getModuleDescription(module.slug)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ background: module.isActive === false ? '#fef2f2' : '#f0fdf4', color: module.isActive === false ? '#ef4444' : '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: `1px solid ${module.isActive === false ? '#fecaca' : '#bbf7d0'}` }}>
                        {module.isActive === false ? '● Inactive' : '● Active'}
                      </span>
                      <button onClick={() => handleToggleModuleStatus(module)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                        {module.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800', margin: '0 0 4px 0' }}>Settings</h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage your ScaleVyapar platform settings</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', maxWidth: '520px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '20px' }}>S</div>
                  <div>
                    <p style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 2px 0' }}>Scale Vyapar</p>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Administrator Account</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Email', value: 'admin@scalevyapar.com' },
                    { label: 'Role', value: 'Administrator' },
                    { label: 'Platform', value: 'ScaleVyapar v1.0' },
                    { label: 'Total Clients', value: String(clientUsers.length) },
                    { label: 'Total Modules', value: String(modules.length) }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{item.label}</span>
                      <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Client Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Add New Client</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>Fill in the details to create a new client account</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input type="email" placeholder="e.g. rahul@business.com" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Password</label>
                <input type="password" placeholder="Set a strong password" value={newClient.password} onChange={e => setNewClient(p => ({ ...p, password: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Assign Modules</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modules.filter(m => m.isActive !== false).map(module => (
                    <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', background: newClient.moduleIds.includes(module.id) ? '#eff6ff' : '#f8fafc', borderRadius: '10px', border: `1px solid ${newClient.moduleIds.includes(module.id) ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newClient.moduleIds.includes(module.id)} onChange={() => toggleNewModule(module.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{module.icon || getModuleEmoji(module.slug)} {module.name}</span>
                      {newClient.moduleIds.includes(module.id) && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '12px', fontWeight: '600' }}>✓</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleAddClient} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>Add Client</button>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Add New Module</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>Create a new automation module for your platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Icon (emoji)</label>
                <input type="text" placeholder="e.g. 🎯 💬 📦 🛒" value={newModule.icon} onChange={e => setNewModule(p => ({ ...p, icon: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '24px', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>Paste any emoji from your keyboard or copy from the internet</p>
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Name</label>
                <input type="text" placeholder="e.g. Facebook Ads" value={newModule.name} onChange={e => setNewModule(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Slug (unique ID)</label>
                <input type="text" placeholder="e.g. facebook-ads" value={newModule.slug} onChange={e => setNewModule(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>Lowercase letters and hyphens only. No spaces.</p>
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea placeholder="Describe what this module does for clients..." value={newModule.description} onChange={e => setNewModule(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'system-ui' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Status</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: newModule.isActive ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${newModule.isActive ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <input type="radio" checked={newModule.isActive === true} onChange={() => setNewModule(p => ({ ...p, isActive: true }))} />
                    <span style={{ color: newModule.isActive ? '#16a34a' : '#64748b', fontSize: '14px', fontWeight: '600' }}>● Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: !newModule.isActive ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${!newModule.isActive ? '#fecaca' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <input type="radio" checked={newModule.isActive === false} onChange={() => setNewModule(p => ({ ...p, isActive: false }))} />
                    <span style={{ color: !newModule.isActive ? '#ef4444' : '#64748b', fontSize: '14px', fontWeight: '600' }}>● Inactive</span>
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleAddModule} style={{ flex: 1, background: '#8b5cf6', color: 'white', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>Add Module</button>
              <button onClick={() => setShowAddModule(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModule && selectedModule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Edit Module</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>Update module details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Icon (emoji)</label>
                <input type="text" value={selectedModule.icon || ''} onChange={e => setSelectedModule(p => p ? { ...p, icon: e.target.value } : p)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '24px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Name</label>
                <input type="text" value={selectedModule.name} onChange={e => setSelectedModule(p => p ? { ...p, name: e.target.value } : p)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module Slug</label>
                <input type="text" value={selectedModule.slug} onChange={e => setSelectedModule(p => p ? { ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : p)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea value={selectedModule.description || ''} onChange={e => setSelectedModule(p => p ? { ...p, description: e.target.value } : p)} rows={3} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'system-ui' }} />
              </div>
              <div>
                <label style={{ color: '#374151', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Status</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: selectedModule.isActive !== false ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${selectedModule.isActive !== false ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <input type="radio" checked={selectedModule.isActive !== false} onChange={() => setSelectedModule(p => p ? { ...p, isActive: true } : p)} />
                    <span style={{ color: selectedModule.isActive !== false ? '#16a34a' : '#64748b', fontSize: '14px', fontWeight: '600' }}>● Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: selectedModule.isActive === false ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${selectedModule.isActive === false ? '#fecaca' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <input type="radio" checked={selectedModule.isActive === false} onChange={() => setSelectedModule(p => p ? { ...p, isActive: false } : p)} />
                    <span style={{ color: selectedModule.isActive === false ? '#ef4444' : '#64748b', fontSize: '14px', fontWeight: '600' }}>● Inactive</span>
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleUpdateModule} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>Save Changes</button>
              <button onClick={() => setShowEditModule(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modules Modal */}
      {showEditModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>✏️ Edit Modules</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600', margin: 0 }}>{selectedUser.name}</p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{selectedUser.email}</p>
              </div>
            </div>
            <p style={{ color: '#374151', fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0' }}>Select modules to assign:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {modules.filter(m => m.isActive !== false).map(module => (
                <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: selectedModules.includes(module.id) ? '#eff6ff' : '#f8fafc', borderRadius: '10px', border: `1px solid ${selectedModules.includes(module.id) ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => toggleModule(module.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{module.icon || getModuleEmoji(module.slug)} {module.name}</span>
                  {selectedModules.includes(module.id) && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '12px', fontWeight: '700' }}>✓ Selected</span>}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveModules} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>💾 Save Changes</button>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}