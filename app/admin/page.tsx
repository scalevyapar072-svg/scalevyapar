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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModule, setShowAddModule] = useState(false)
  const [showEditModule, setShowEditModule] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', moduleIds: [] as string[] })
  const [newModule, setNewModule] = useState({ name: '', slug: '', icon: '📌', description: '', isActive: true })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersRes, modulesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/modules')
      ])
      if (usersRes.ok) { const data = await usersRes.json(); setUsers(data.users || []) }
      if (modulesRes.ok) { const data = await modulesRes.json(); setModules(data.modules || []) }
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
    if (!newClient.name || !newClient.email || !newClient.password) { alert('Please fill all fields'); return }
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) })
      if (res.ok) { setShowAddForm(false); setNewClient({ name: '', email: '', password: '', moduleIds: [] }); loadData(); alert('Client added!') }
    } catch (error) { console.error('Error:', error) }
  }

  const handleEditModules = (user: User) => {
    setSelectedUser(user)
    setSelectedModules((user.assignedModules || []).map(m => m.id))
    setShowEditModal(true)
  }

  const handleSaveModules = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/modules`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleIds: selectedModules }) })
      if (res.ok) { setShowEditModal(false); loadData(); alert('Modules updated!') }
    } catch (error) { console.error('Error:', error) }
  }

  const handleAddModule = async () => {
    if (!newModule.name || !newModule.slug) { alert('Please fill name and slug'); return }
    try {
      const res = await fetch('/api/admin/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newModule) })
      if (res.ok) { setShowAddModule(false); setNewModule({ name: '', slug: '', icon: '📌', description: '', isActive: true }); loadData() }
    } catch (error) { console.error('Error:', error) }
  }

  const handleEditModule = (module: Module) => { setSelectedModule({ ...module }); setShowEditModule(true) }

  const handleUpdateModule = async () => {
    if (!selectedModule) return
    try {
      const res = await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selectedModule) })
      if (res.ok) { setShowEditModule(false); loadData() }
    } catch (error) { console.error('Error:', error) }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module?')) return
    try {
      await fetch('/api/admin/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: moduleId }) })
      loadData()
    } catch (error) { console.error('Error:', error) }
  }

  const handleToggleModule = async (module: Module) => {
    try {
      await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...module, isActive: !module.isActive }) })
      loadData()
    } catch (error) { console.error('Error:', error) }
  }

  const toggleModule = (id: string) => setSelectedModules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleNewModule = (id: string) => setNewClient(prev => ({ ...prev, moduleIds: prev.moduleIds.includes(id) ? prev.moduleIds.filter(x => x !== id) : [...prev.moduleIds, id] }))
  const getEmoji = (slug: string) => ({ leads: '🎯', crm: '👥', whatsapp: '💬', shopify: '🛒', inventory: '📦', vizora: '📸' }[slug] || '📌')

  const clientUsers = users.filter(u => u.role === 'CLIENT')
  const navItems = [
    { icon: '🏠', label: 'Dashboard', key: 'dashboard' },
    { icon: '👥', label: 'Clients', key: 'clients' },
    { icon: '🗂️', label: 'Modules', key: 'modules' },
    { icon: '⚙️', label: 'Settings', key: 'settings' }
  ]

  const C = '#374655'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="ScaleVyapar" style={{ height: '40px', marginBottom: '16px' }} />
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; cursor: pointer; margin-bottom: 4px; font-size: 14px; font-weight: 500; border-left: 3px solid transparent; color: rgba(255,255,255,0.6); transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
        .nav-item.active { background: rgba(255,255,255,0.12); color: white; border-left-color: white; font-weight: 600; }
        .btn-primary { background: #374655; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; }
        .btn-primary:hover { background: #4a5a6a; }
        .btn-secondary { background: #f1f5f9; color: #374655; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; }
        .input-style { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; color: #1e293b; font-size: 14px; outline: none; }
        .input-style:focus { border-color: #374655; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
        .modal-box { background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: white; font-size: 24px; }
        @media (max-width: 768px) {
          .admin-sidebar { position: fixed !important; left: -240px !important; top: 0 !important; height: 100vh !important; z-index: 150 !important; transition: left 0.3s !important; padding-top: 80px !important; }
          .admin-sidebar.open { left: 0 !important; }
          .hamburger { display: block !important; }
          .admin-content { padding: 16px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .modal-overlay { align-items: flex-end !important; }
          .modal-box { border-radius: 20px 20px 0 0 !important; max-height: 95vh !important; }
          .hide-mobile { display: none !important; }
          .mobile-overlay.open { display: block !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* Header */}
        <div style={{ background: C, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <img src="/logo.png" alt="ScaleVyapar" style={{ height: '32px', width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="hide-mobile" style={{ textAlign: 'right' }}>
              <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Scale Vyapar</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Administrator</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile overlay */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140 }} />

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

          {/* Sidebar */}
          <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '240px', background: C, padding: '24px 16px', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 12px' }}>Main Menu</p>
            {navItems.map(item => (
              <div key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false) }} className={`nav-item ${activeTab === item.key ? 'active' : ''}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
            <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Overview</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Clients</span>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{clientUsers.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Modules</span>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{modules.length}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="admin-content" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>Good morning, Admin 👋</h1>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Here is what is happening with your platform today</p>
                </div>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Clients', value: clientUsers.length, icon: '👥' },
                    { label: 'Active Modules', value: modules.filter(m => m.isActive !== false).length, icon: '🗂️' },
                    { label: 'Total Modules', value: modules.length, icon: '📦' }
                  ].map(card => (
                    <div key={card.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>{card.label}</p>
                          <p style={{ color: C, fontSize: '40px', fontWeight: '800', lineHeight: 1 }}>{card.value}</p>
                        </div>
                        <div style={{ background: '#f1f5f9', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{card.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                  <h2 style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Quick Actions</h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => { setActiveTab('clients'); setShowAddForm(true) }}>➕ Add New Client</button>
                    <button className="btn-secondary" onClick={() => setActiveTab('clients')}>👥 View Clients</button>
                    <button className="btn-secondary" onClick={() => setActiveTab('modules')}>🗂️ View Modules</button>
                  </div>
                </div>
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: '800' }}>Client Management</h1>
                  <button className="btn-primary" onClick={() => setShowAddForm(true)}>➕ Add New Client</button>
                </div>
                {clientUsers.length === 0 ? (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>👥</p>
                    <p style={{ color: '#94a3b8', fontSize: '16px' }}>No clients yet. Add your first client!</p>
                  </div>
                ) : (
                  clientUsers.map(user => (
                    <div key={user.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: C, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ color: '#1e293b', fontWeight: '700', fontSize: '15px' }}>{user.name}</p>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>{user.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleEditModules(user)} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>✏️ Edit Modules</button>
                      </div>
                      <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(user.assignedModules || []).length === 0 ? (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>No modules assigned</span>
                        ) : (
                          (user.assignedModules || []).map(m => (
                            <span key={m.id} style={{ background: C, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                              {m.icon || getEmoji(m.slug)} {m.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MODULES TAB */}
            {activeTab === 'modules' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: '800' }}>Module Management</h1>
                  <button className="btn-primary" onClick={() => setShowAddModule(true)}>+ Add New Module</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {modules.map(module => (
                    <div key={module.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                            {module.icon || getEmoji(module.slug)}
                          </div>
                          <div>
                            <p style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>{module.name}</p>
                            <p style={{ color: '#94a3b8', fontSize: '12px' }}>#{module.slug}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditModule(module)} style={{ background: '#f1f5f9', color: C, border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                          <button onClick={() => handleDeleteModule(module.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
                        </div>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px', lineHeight: '1.5' }}>{module.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ background: module.isActive === false ? '#fef2f2' : '#f0fdf4', color: module.isActive === false ? '#dc2626' : '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                          {module.isActive === false ? '● Inactive' : '● Active'}
                        </span>
                        <button onClick={() => handleToggleModule(module)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
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
                <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: '800', marginBottom: '24px' }}>Settings</h1>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', maxWidth: '520px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: C, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '20px' }}>S</div>
                    <div>
                      <p style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700' }}>Scale Vyapar</p>
                      <p style={{ color: '#64748b', fontSize: '13px' }}>Administrator Account</p>
                    </div>
                  </div>
                  {[
                    { label: 'Platform', value: 'ScaleVyapar v2.0' },
                    { label: 'Total Clients', value: String(clientUsers.length) },
                    { label: 'Total Modules', value: String(modules.length) }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>{item.label}</span>
                      <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: '600' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ background: C, padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>ScaleVyapar © 2026 · Business Automation Platform</p>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Add New Client</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input className="input-style" type="text" placeholder="Full Name" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} />
              <input className="input-style" type="email" placeholder="Email Address" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
              <input className="input-style" type="password" placeholder="Password" value={newClient.password} onChange={e => setNewClient(p => ({ ...p, password: e.target.value }))} />
              <div>
                <p style={{ color: '#1e293b', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Assign Modules</p>
                {modules.filter(m => m.isActive !== false).map(module => (
                  <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: newClient.moduleIds.includes(module.id) ? '#f1f5f9' : '#f8fafc', borderRadius: '8px', border: `1px solid ${newClient.moduleIds.includes(module.id) ? C : '#e2e8f0'}`, cursor: 'pointer', marginBottom: '8px' }}>
                    <input type="checkbox" checked={newClient.moduleIds.includes(module.id)} onChange={() => toggleNewModule(module.id)} />
                    <span style={{ color: '#1e293b', fontSize: '14px' }}>{module.icon || getEmoji(module.slug)} {module.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleAddClient} className="btn-primary" style={{ flex: 1, padding: '13px' }}>Add Client</button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ flex: 1, padding: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modules Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Edit Modules</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>{selectedUser.name} — {selectedUser.email}</p>
            {modules.filter(m => m.isActive !== false).map(module => (
              <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: selectedModules.includes(module.id) ? '#f1f5f9' : '#f8fafc', borderRadius: '10px', border: `1px solid ${selectedModules.includes(module.id) ? C : '#e2e8f0'}`, cursor: 'pointer', marginBottom: '8px' }}>
                <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => toggleModule(module.id)} />
                <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{module.icon || getEmoji(module.slug)} {module.name}</span>
                {selectedModules.includes(module.id) && <span style={{ marginLeft: 'auto', color: C, fontSize: '12px', fontWeight: '700' }}>✓</span>}
              </label>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={handleSaveModules} className="btn-primary" style={{ flex: 1, padding: '13px' }}>Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ flex: 1, padding: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Add New Module</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input className="input-style" type="text" placeholder="Icon emoji e.g. 🎯" value={newModule.icon} onChange={e => setNewModule(p => ({ ...p, icon: e.target.value }))} style={{ fontSize: '22px' }} />
              <input className="input-style" type="text" placeholder="Module Name" value={newModule.name} onChange={e => setNewModule(p => ({ ...p, name: e.target.value }))} />
              <input className="input-style" type="text" placeholder="Slug e.g. lead-gen" value={newModule.slug} onChange={e => setNewModule(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
              <textarea className="input-style" placeholder="Description" value={newModule.description} onChange={e => setNewModule(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical', fontFamily: 'system-ui' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleAddModule} className="btn-primary" style={{ flex: 1, padding: '13px' }}>Add Module</button>
              <button onClick={() => setShowAddModule(false)} className="btn-secondary" style={{ flex: 1, padding: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModule && selectedModule && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Edit Module</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input className="input-style" type="text" value={selectedModule.icon || ''} onChange={e => setSelectedModule(p => p ? { ...p, icon: e.target.value } : p)} style={{ fontSize: '22px' }} />
              <input className="input-style" type="text" value={selectedModule.name} onChange={e => setSelectedModule(p => p ? { ...p, name: e.target.value } : p)} />
              <input className="input-style" type="text" value={selectedModule.slug} onChange={e => setSelectedModule(p => p ? { ...p, slug: e.target.value } : p)} />
              <textarea className="input-style" value={selectedModule.description || ''} onChange={e => setSelectedModule(p => p ? { ...p, description: e.target.value } : p)} rows={3} style={{ resize: 'vertical', fontFamily: 'system-ui' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={handleUpdateModule} className="btn-primary" style={{ flex: 1, padding: '13px' }}>Save Changes</button>
              <button onClick={() => setShowEditModule(false)} className="btn-secondary" style={{ flex: 1, padding: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}