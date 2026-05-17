'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Boxes, Database, LayoutDashboard, LogOut, Plus, RefreshCw, Settings2, ShieldCheck, Users2 } from 'lucide-react'
import { defaultLoginPageSettings, type LoginPageFeatureItem, type LoginPageSettings } from '@/lib/login-page-settings-schema'
import { LabourMastersPanel } from '@/components/admin/labour-masters-panel'

type TabKey = 'dashboard' | 'clients' | 'modules' | 'masters' | 'settings'

interface ModuleRecord {
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

interface UserRecord {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CLIENT'
  createdAt: string
  phone?: string
  plan?: string
  status?: 'active' | 'inactive'
  assignedModules?: ModuleRecord[]
  assignedModuleIds?: string[]
}

interface ClientDraft {
  name: string
  email: string
  password: string
  phone: string
  plan: string
  status: 'active' | 'inactive'
  moduleIds: string[]
}

interface ModuleDraft {
  id?: string
  name: string
  slug: string
  icon: string
  description: string
  type: string
  status: 'active' | 'coming_soon'
  isActive: boolean
  href: string
  customerLink: string
  color: string
  featuresText: string
}

interface FlashMessage {
  type: 'success' | 'error'
  message: string
}

interface GeneratedCredentials {
  title: string
  clientId: string
  email: string
  temporaryPassword: string
}

const PAGE = '#f2f5fa'
const SURFACE = '#ffffff'
const SURFACE_SOFT = '#f9fbfe'
const BORDER = '#d8e0eb'
const INK = '#0f172a'
const MUTED = '#63748b'
const BRAND = '#0f2240'
const BRAND_BLUE = '#2c4f97'
const BRAND_SOFT = '#eef3fb'
const SUCCESS = '#10b981'
const SUCCESS_BG = '#eefaf5'
const DANGER = '#dc2626'
const DANGER_BG = '#fff1f2'
const WARNING = '#f59e0b'
const WARNING_BG = '#fff7e6'

const modulePresets: Record<'leads' | 'labour' | 'vizora', ModuleDraft> = {
  leads: {
    name: 'Leads',
    slug: 'leads',
    icon: 'LD',
    description: 'Lead generation and public business data workflows.',
    type: 'Growth',
    status: 'active',
    isActive: true,
    href: '/leads',
    customerLink: '',
    color: '#2563eb',
    featuresText: 'Google Maps scraping\nBusiness listing capture\nCSV export'
  },
  labour: {
    name: 'Rozgar',
    slug: 'labour',
    icon: 'RZ',
    description: 'Company-side labour marketplace and hiring workflows.',
    type: 'Operations',
    status: 'active',
    isActive: true,
    href: '/labour/company',
    customerLink: '',
    color: '#1d4ed8',
    featuresText: 'Company intake\nWorker search\nMarketplace dashboard'
  },
  vizora: {
    name: 'Vizora',
    slug: 'vizora',
    icon: 'VZ',
    description: 'AI content generation and creative media tooling.',
    type: 'Creative',
    status: 'active',
    isActive: true,
    href: '/vizora',
    customerLink: '',
    color: '#7c3aed',
    featuresText: 'AI image generation\nUpscaling\nCreative workspace'
  }
}

const navItems: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'clients', label: 'Clients' },
  { key: 'modules', label: 'Modules' },
  { key: 'masters', label: 'Masters' },
  { key: 'settings', label: 'Settings' }
]

const tabMeta: Record<TabKey, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: 'Admin Overview',
    title: 'Workspace control centre',
    description: 'Track client access, live modules, and the most recent workspace activity in one vertical dashboard.'
  },
  clients: {
    eyebrow: 'Client Operations',
    title: 'Client management',
    description: 'Create accounts, manage access, and update assignments without changing any connected workflows.'
  },
  modules: {
    eyebrow: 'Module Directory',
    title: 'Module management',
    description: 'Maintain module presentation, launch destinations, and client-ready availability from one place.'
  },
  masters: {
    eyebrow: 'Labour Master Data',
    title: 'Masters and dependencies',
    description: 'Manage central labour dropdown values and dependency mappings from the main admin workspace.'
  },
  settings: {
    eyebrow: 'Content Settings',
    title: 'Settings and routing',
    description: 'Update login page content and verify the core admin route references used across the workspace.'
  }
}

const emptyClientDraft = (): ClientDraft => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  plan: 'Starter',
  status: 'active',
  moduleIds: []
})

const emptyModuleDraft = (): ModuleDraft => ({
  name: '',
  slug: '',
  icon: 'SV',
  description: '',
  type: 'Operations',
  status: 'active',
  isActive: true,
  href: '',
  customerLink: '',
  color: '#294fbc',
  featuresText: ''
})

function initials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2)
  return parts.map(part => part.charAt(0).toUpperCase()).join('') || 'SV'
}

function moduleBadge(module: Pick<ModuleRecord, 'icon' | 'name'>) {
  return (module.icon && module.icon.trim()) || initials(module.name)
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function joinFeatures(features?: string[]) {
  return Array.isArray(features) ? features.join('\n') : ''
}

function splitFeatures(text: string) {
  return text
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
}

function prettyDate(value?: string) {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return value
  }
}

function isRozgarModule(module: Pick<ModuleRecord, 'slug' | 'name'>) {
  const value = `${module.slug} ${module.name}`.toLowerCase()
  return value.includes('rozgar') || value.includes('labour')
}

function getModuleTarget(module: ModuleRecord) {
  return module.customerLink || module.href || ''
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : 'Request failed. Please try again.'
    throw new Error(message)
  }

  return payload as T
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [clientQuery, setClientQuery] = useState('')
  const [moduleQuery, setModuleQuery] = useState('')
  const [clientDraft, setClientDraft] = useState<ClientDraft>(emptyClientDraft)
  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>(emptyModuleDraft)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [showClientModal, setShowClientModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null)
  const [loginPageSettings, setLoginPageSettings] = useState<LoginPageSettings>(defaultLoginPageSettings)
  const [loginPageSettingsStorage, setLoginPageSettingsStorage] = useState<'supabase' | 'json'>('json')
  const [savingLoginPageSettings, setSavingLoginPageSettings] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(timer)
  }, [flash])

  async function loadData() {
    try {
      setLoading(true)
      const [usersRes, modulesRes, loginSettingsRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/admin/modules', { cache: 'no-store' }),
        fetch('/api/admin/login-page-settings', { cache: 'no-store' })
      ])

      if ([usersRes.status, modulesRes.status, loginSettingsRes.status].some(status => status === 401 || status === 403)) {
        router.push('/login')
        return
      }

      const usersPayload = await parseJson<{ users: UserRecord[] }>(usersRes)
      const modulesPayload = await parseJson<{ modules: ModuleRecord[] }>(modulesRes)
      const loginSettingsPayload = await parseJson<{ settings: LoginPageSettings; storage?: 'supabase' | 'json' }>(loginSettingsRes)
      setUsers(Array.isArray(usersPayload.users) ? usersPayload.users : [])
      setModules(Array.isArray(modulesPayload.modules) ? modulesPayload.modules : [])
      setLoginPageSettings(loginSettingsPayload.settings || defaultLoginPageSettings)
      setLoginPageSettingsStorage(loginSettingsPayload.storage === 'supabase' ? 'supabase' : 'json')
    } catch (error) {
      console.error('Failed to load admin data:', error)
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load admin data.'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function updateClientField<K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) {
    setClientDraft(prev => ({ ...prev, [key]: value }))
  }

  function updateModuleField<K extends keyof ModuleDraft>(key: K, value: ModuleDraft[K]) {
    setModuleDraft(prev => ({ ...prev, [key]: value }))
  }

  function openCreateClient() {
    setSelectedUser(null)
    setClientDraft(emptyClientDraft())
    setShowClientModal(true)
  }

  function openEditClient(user: UserRecord) {
    setSelectedUser(user)
    setClientDraft({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      plan: user.plan || 'Starter',
      status: user.status || 'active',
      moduleIds: user.assignedModuleIds || user.assignedModules?.map(module => module.id) || []
    })
    setShowClientModal(true)
  }

  function openAssignModules(user: UserRecord) {
    setSelectedUser(user)
    setSelectedModuleIds(user.assignedModuleIds || user.assignedModules?.map(module => module.id) || [])
    setShowAssignModal(true)
  }

  function openCreateModule() {
    setModuleDraft(emptyModuleDraft())
    setShowModuleModal(true)
  }

  function openModulePreset(preset: 'leads' | 'labour' | 'vizora') {
    setModuleDraft({ ...modulePresets[preset] })
    setShowModuleModal(true)
  }

  function openEditModule(module: ModuleRecord) {
    setModuleDraft({
      id: module.id,
      name: module.name,
      slug: module.slug,
      icon: module.icon || moduleBadge(module),
      description: module.description || '',
      type: module.type || 'Operations',
      status: module.status || (module.isActive === false ? 'coming_soon' : 'active'),
      isActive: module.isActive ?? module.status === 'active',
      href: module.href || '',
      customerLink: module.customerLink || '',
      color: module.color || '#294fbc',
      featuresText: joinFeatures(module.features)
    })
    setShowModuleModal(true)
  }

  function toggleClientModule(moduleId: string) {
    setClientDraft(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId]
    }))
  }

  function toggleAssignedModule(moduleId: string) {
    setSelectedModuleIds(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  function updateLoginPageField<K extends keyof LoginPageSettings>(key: K, value: LoginPageSettings[K]) {
    setLoginPageSettings(prev => ({ ...prev, [key]: value }))
  }

  function updateLoginPageFeature(index: number, key: keyof LoginPageFeatureItem, value: string) {
    setLoginPageSettings(prev => ({
      ...prev,
      features: prev.features.map((feature, featureIndex) =>
        featureIndex === index ? { ...feature, [key]: value } : feature
      )
    }))
  }

  function addLoginPageFeature() {
    setLoginPageSettings(prev => ({
      ...prev,
      features: [...prev.features, { icon: '•', text: '' }]
    }))
  }

  function removeLoginPageFeature(index: number) {
    setLoginPageSettings(prev => ({
      ...prev,
      features: prev.features.filter((_, featureIndex) => featureIndex !== index)
    }))
  }

  async function copyGeneratedCredentials() {
    if (!generatedCredentials) return

    const payload = [
      generatedCredentials.title,
      `Client ID: ${generatedCredentials.clientId || 'Not returned'}`,
      `Email: ${generatedCredentials.email}`,
      `Password: ${generatedCredentials.temporaryPassword}`
    ].join('\n')

    try {
      await navigator.clipboard.writeText(payload)
      setFlash({ type: 'success', message: 'Credentials copied to clipboard.' })
    } catch {
      setFlash({ type: 'error', message: 'Could not copy credentials. Please copy them manually.' })
    }
  }

  async function handleSaveLoginPageSettings() {
    setSavingLoginPageSettings(true)
    try {
      const payload = await parseJson<{ settings: LoginPageSettings; storage?: 'supabase' | 'json' }>(
        await fetch('/api/admin/login-page-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: loginPageSettings })
        })
      )

      setLoginPageSettings(payload.settings || defaultLoginPageSettings)
      setLoginPageSettingsStorage(payload.storage === 'supabase' ? 'supabase' : 'json')
      setFlash({ type: 'success', message: 'Login page content updated.' })
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save login page settings.'
      })
    } finally {
      setSavingLoginPageSettings(false)
    }
  }

  async function handleSaveClient() {
    if (!clientDraft.name.trim() || !clientDraft.email.trim()) {
      setFlash({ type: 'error', message: 'Name and email are required.' })
      return
    }

    setSubmitting(true)
    try {
      if (selectedUser) {
        await parseJson(
          await fetch(`/api/admin/users/${selectedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientDraft.name,
              email: clientDraft.email,
              phone: clientDraft.phone,
              plan: clientDraft.plan,
              status: clientDraft.status
            })
          })
        )

        await parseJson(
          await fetch(`/api/admin/users/${selectedUser.id}/modules`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moduleIds: clientDraft.moduleIds })
          })
        )

        setFlash({ type: 'success', message: 'Client updated successfully.' })
      } else {
        const payload = await parseJson<{
          user: { id: string; email: string }
          temporaryPassword: string
        }>(
          await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientDraft.name,
              email: clientDraft.email,
              password: clientDraft.password.trim() || undefined,
              moduleIds: clientDraft.moduleIds,
              phone: clientDraft.phone,
              plan: clientDraft.plan
            })
          })
        )

        setGeneratedCredentials({
          title: 'Client credentials generated',
          clientId: payload.user?.id || '',
          email: payload.user?.email || clientDraft.email,
          temporaryPassword: payload.temporaryPassword || ''
        })
        setFlash({ type: 'success', message: 'Client created successfully.' })
      }

      setShowClientModal(false)
      setSelectedUser(null)
      setClientDraft(emptyClientDraft())
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save client.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteClient(user: UserRecord) {
    if (!window.confirm(`Delete client "${user.name}"?`)) {
      return
    }

    try {
      await parseJson(
        await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE'
        })
      )
      setFlash({ type: 'success', message: 'Client deleted successfully.' })
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete client.'
      })
    }
  }

  async function handleResetPassword(user: UserRecord) {
    if (!window.confirm(`Generate a new password for ${user.email}?`)) {
      return
    }

    try {
      const payload = await parseJson<{ password: string }>(
        await fetch(`/api/admin/users/${user.id}/reset-password`, {
          method: 'POST'
        })
      )

      setGeneratedCredentials({
        title: 'Password reset completed',
        clientId: user.id,
        email: user.email,
        temporaryPassword: payload.password
      })
      setFlash({ type: 'success', message: 'Temporary password generated.' })
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset password.'
      })
    }
  }

  async function handleSaveAssignments() {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      await parseJson(
        await fetch(`/api/admin/users/${selectedUser.id}/modules`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleIds: selectedModuleIds })
        })
      )

      setFlash({ type: 'success', message: 'Assigned modules updated.' })
      setShowAssignModal(false)
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update modules.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveModule() {
    if (!moduleDraft.name.trim() || !moduleDraft.slug.trim()) {
      setFlash({ type: 'error', message: 'Module name and slug are required.' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: moduleDraft.name,
        slug: cleanSlug(moduleDraft.slug),
        icon: moduleDraft.icon.trim(),
        description: moduleDraft.description,
        type: moduleDraft.type,
        status: moduleDraft.status,
        isActive: moduleDraft.isActive,
        href: moduleDraft.href.trim(),
        customerLink: moduleDraft.customerLink.trim(),
        color: moduleDraft.color.trim(),
        features: splitFeatures(moduleDraft.featuresText)
      }

      if (moduleDraft.id) {
        await parseJson(
          await fetch(`/api/admin/modules/${moduleDraft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        )
        setFlash({ type: 'success', message: 'Module updated successfully.' })
      } else {
        await parseJson(
          await fetch('/api/admin/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        )
        setFlash({ type: 'success', message: 'Module created successfully.' })
      }

      setShowModuleModal(false)
      setModuleDraft(emptyModuleDraft())
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save module.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteModule(module: ModuleRecord) {
    if (!window.confirm(`Delete module "${module.name}"?`)) {
      return
    }

    try {
      await parseJson(
        await fetch(`/api/admin/modules/${module.id}`, {
          method: 'DELETE'
        })
      )
      setFlash({ type: 'success', message: 'Module deleted successfully.' })
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete module.'
      })
    }
  }

  async function handleToggleModule(module: ModuleRecord) {
    try {
      await parseJson(
        await fetch(`/api/admin/modules/${module.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: module.name,
            slug: module.slug,
            icon: module.icon,
            description: module.description,
            status: module.isActive === false ? 'active' : 'coming_soon',
            isActive: module.isActive === false,
            type: module.type,
            href: module.href,
            customerLink: module.customerLink,
            color: module.color,
            features: module.features || []
          })
        })
      )

      setFlash({
        type: 'success',
        message: `${module.name} ${module.isActive === false ? 'activated' : 'paused'}.`
      })
      await loadData()
    } catch (error) {
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update module state.'
      })
    }
  }

  const clientUsers = useMemo(
    () => users.filter(user => user.role === 'CLIENT'),
    [users]
  )

  const activeModules = useMemo(
    () => modules.filter(module => module.isActive !== false),
    [modules]
  )

  const connectedModules = useMemo(
    () => modules.filter(module => Boolean(module.href && module.href !== '#') || Boolean(module.customerLink)),
    [modules]
  )

  const filteredClientUsers = useMemo(() => {
    const query = clientQuery.trim().toLowerCase()
    if (!query) return clientUsers
    return clientUsers.filter(user =>
      [user.name, user.email, user.phone, user.plan]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    )
  }, [clientQuery, clientUsers])

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase()
    if (!query) return modules
    return modules.filter(module =>
      [module.name, module.slug, module.description, module.type]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    )
  }, [moduleQuery, modules])

  const statCards = [
    {
      label: 'Active Clients',
      value: clientUsers.filter(user => (user.status || 'active') === 'active').length,
      color: '#10b981',
      description: 'Clients currently able to sign in'
    },
    {
      label: 'Assigned Modules',
      value: clientUsers.reduce((count, user) => count + (user.assignedModuleIds?.length || 0), 0),
      color: '#f59e0b',
      description: 'Live mapping across all clients'
    },
    {
      label: 'Live Modules',
      value: activeModules.length,
      color: '#4f46e5',
      description: 'Available for active accounts'
    },
    {
      label: 'Connected Modules',
      value: connectedModules.length,
      color: '#b45309',
      description: 'Ready for launch and assignment'
    }
  ]

  const currentTabMeta = tabMeta[activeTab]

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: PAGE,
          color: MUTED,
          fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
        }}
      >
        Loading admin workspace...
      </div>
    )
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          background: ${PAGE};
          color: ${INK};
        }
        .admin-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          background:
            radial-gradient(circle at top left, rgba(54, 99, 204, 0.08), transparent 26%),
            radial-gradient(circle at bottom right, rgba(15, 34, 64, 0.08), transparent 28%),
            linear-gradient(180deg, #f9fbff 0%, #f4f7fb 42%, #eef3f9 100%);
        }
        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 20px 18px;
          border-right: 1px solid rgba(213, 223, 236, 0.92);
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(18px);
        }
        .sidebar-panel {
          height: 100%;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 18px;
        }
        .sidebar-brand {
          display: grid;
          gap: 12px;
        }
        .brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2f5fd6 0%, #153a91 100%);
          color: white;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.04em;
          box-shadow: 0 12px 24px rgba(41, 79, 188, 0.16);
        }
        .brand-title {
          margin: 0;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .brand-subtitle {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #58749a;
        }
        .brand-copy {
          margin: 6px 0 0;
          font-size: 13px;
          color: ${MUTED};
          line-height: 1.6;
        }
        .sidebar-section {
          display: grid;
          gap: 12px;
        }
        .tabbar {
          display: grid;
          gap: 8px;
        }
        .nav-item {
          width: 100%;
          border: 1px solid transparent;
          border-radius: 16px;
          padding: 11px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #29415f;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-item:hover {
          background: rgba(237, 243, 255, 0.84);
          border-color: rgba(195, 214, 244, 0.9);
          color: ${BRAND};
        }
        .nav-item.active {
          background: linear-gradient(180deg, #eef4ff 0%, #e7f0ff 100%);
          border-color: rgba(194, 213, 244, 1);
          color: #13356f;
          box-shadow: 0 12px 24px rgba(41, 79, 188, 0.1);
        }
        .nav-icon {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
        }
        .sidebar-footer {
          padding: 16px;
          display: grid;
          gap: 8px;
          align-self: end;
        }
        .sidebar-footer-icon {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef3fb;
          color: ${BRAND_BLUE};
        }
        .sidebar-footer-title {
          font-size: 14px;
          font-weight: 600;
          color: ${BRAND};
        }
        .workspace-shell {
          min-width: 0;
          display: grid;
          grid-template-rows: auto 1fr;
        }
        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 18px 24px 14px;
          background: rgba(244, 247, 251, 0.84);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(213, 223, 236, 0.86);
        }
        .header-copy {
          max-width: 760px;
        }
        .header-title {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #091427;
        }
        .header-subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: ${MUTED};
        }
        .page-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .page-shell {
          padding: 20px 24px 28px;
        }
        .workspace-stack {
          width: min(1280px, 100%);
          display: grid;
          gap: 14px;
        }
        .surface-card {
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(213, 223, 236, 0.94);
          border-radius: 20px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }
        .utility-bar {
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) auto;
          gap: 16px;
          align-items: center;
        }
        .utility-kicker {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #46658f;
          margin-bottom: 6px;
        }
        .utility-copy {
          font-size: 14px;
          color: ${MUTED};
          line-height: 1.55;
        }
        .utility-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .stat-card {
          padding: 16px 18px;
          min-height: 112px;
          display: grid;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: "";
          position: absolute;
          inset: auto -28px -28px auto;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          background: rgba(219, 230, 246, 0.3);
        }
        .stat-card-head {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #58749a;
        }
        .stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          box-shadow: 0 0 0 4px rgba(219, 230, 246, 0.38);
        }
        .stat-value {
          position: relative;
          z-index: 1;
          font-size: 31px;
          line-height: 1.05;
          font-weight: 600;
          letter-spacing: -0.03em;
        }
        .content-panel {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .panel-title {
          margin: 0 0 4px;
          font-size: 22px;
          line-height: 1.15;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .panel-copy {
          margin: 0;
          font-size: 13px;
          color: ${MUTED};
          line-height: 1.55;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .inner-card {
          padding: 16px 18px;
          border-radius: 18px;
          background: ${SURFACE};
          border: 1px solid rgba(213, 223, 236, 0.96);
        }
        .section-title {
          margin: 0 0 14px;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #081427;
        }
        .dashboard-stack {
          display: grid;
          gap: 14px;
        }
        .quick-actions-card {
          display: grid;
          gap: 12px;
        }
        .list-stack {
          display: grid;
          gap: 4px;
        }
        .list-row {
          padding: 12px 0;
          border-top: 1px solid rgba(213, 223, 236, 0.9);
          display: grid;
          gap: 8px;
        }
        .list-row:first-of-type {
          border-top: 0;
          padding-top: 0;
        }
        .row-between {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .muted { color: ${MUTED}; }
        .client-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .client-results {
          display: grid;
          gap: 14px;
        }
        .client-card {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(213, 223, 236, 0.96);
          background:
            radial-gradient(circle at top right, rgba(235, 243, 255, 0.78), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.04);
          display: grid;
          gap: 16px;
        }
        .client-card-top {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .client-main {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          min-width: 0;
        }
        .client-avatar {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, ${BRAND} 0%, #0f2d63 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 21px;
          flex: 0 0 auto;
          box-shadow: 0 12px 24px rgba(22, 63, 162, 0.18);
        }
        .client-summary {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .client-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .client-name {
          font-size: 18px;
          font-weight: 800;
          color: ${INK};
        }
        .client-email {
          font-size: 14px;
          color: #44617f;
          word-break: break-word;
        }
        .client-meta-line {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .client-meta-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          background: ${SURFACE_SOFT};
          border: 1px solid rgba(213, 223, 236, 0.92);
          color: #58749a;
          font-size: 11px;
          font-weight: 700;
        }
        .client-side {
          display: grid;
          gap: 10px;
          justify-items: end;
          min-width: 180px;
        }
        .client-module-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .client-module-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 800;
          color: ${BRAND_BLUE};
          background: rgba(235, 243, 255, 0.9);
          border: 1px solid rgba(195, 214, 244, 0.86);
        }
        .client-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .client-panel > .row-between {
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(213, 223, 236, 0.9);
          background: linear-gradient(180deg, #fcfdff 0%, #f7faff 100%);
        }
        .client-panel > div:last-child {
          display: grid;
          gap: 14px;
        }
        .client-panel .list-row {
          padding: 18px;
          border: 1px solid rgba(213, 223, 236, 0.94);
          border-radius: 22px;
          background:
            radial-gradient(circle at top right, rgba(235, 243, 255, 0.78), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.04);
          gap: 14px;
        }
        .client-panel .list-row:first-of-type {
          padding-top: 18px;
        }
        .client-panel .list-row .row-between:first-child {
          gap: 18px;
        }
        .client-panel .list-row .chip-row {
          gap: 9px;
        }
        .client-panel .list-row .actions {
          padding-top: 2px;
        }
        .client-panel .list-row .actions .secondary-btn,
        .client-panel .list-row .actions .danger-btn {
          min-width: 122px;
        }
        .selection-header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .selection-summary {
          font-size: 12px;
          color: ${MUTED};
        }
        .field {
          display: grid;
          gap: 6px;
        }
        .field label {
          font-size: 11px;
          font-weight: 600;
          color: #274563;
        }
        .field input, .field select, .field textarea {
          width: 100%;
          border: 1px solid ${BORDER};
          background: ${SURFACE_SOFT};
          border-radius: 13px;
          padding: 9px 11px;
          font-size: 13px;
          color: ${INK};
          outline: none;
        }
        .field textarea {
          min-height: 76px;
          resize: vertical;
          font-family: inherit;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: rgba(41, 79, 188, 0.42);
          box-shadow: 0 0 0 4px rgba(41, 79, 188, 0.08);
          background: white;
        }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .primary-btn, .secondary-btn, .danger-btn {
          border-radius: 16px;
          padding: 9px 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .primary-btn {
          background: ${BRAND};
          color: white;
          border: 1px solid ${BRAND};
        }
        .secondary-btn {
          background: white;
          color: #274563;
          border: 1px solid ${BORDER};
        }
        .danger-btn {
          background: ${DANGER_BG};
          color: ${DANGER};
          border: 1px solid #fecaca;
        }
        .button-icon {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }
        .primary-btn:hover,
        .secondary-btn:hover,
        .danger-btn:hover,
        .module-card:hover,
        .surface-card:hover {
          transform: translateY(-1px);
        }
        .primary-btn:hover { filter: brightness(1.04); box-shadow: 0 14px 28px rgba(15, 34, 64, 0.16); }
        .secondary-btn:hover { border-color: rgba(41, 79, 188, 0.26); background: #f8fbff; }
        .danger-btn:hover { border-color: #fca5a5; }
        .nav-item:focus-visible,
        .primary-btn:focus-visible,
        .secondary-btn:focus-visible,
        .danger-btn:focus-visible,
        .field input:focus-visible,
        .field select:focus-visible,
        .field textarea:focus-visible,
        .selection-card:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 4px rgba(41, 79, 188, 0.12);
        }
        .chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .chip.success {
          background: ${SUCCESS_BG};
          color: ${SUCCESS};
        }
        .chip.warning {
          background: ${WARNING_BG};
          color: ${WARNING};
        }
        .chip.neutral {
          background: ${BRAND_SOFT};
          color: ${BRAND_BLUE};
          border-color: rgba(41, 79, 188, 0.08);
        }
        .flash {
          padding: 14px 16px;
          border-radius: 18px;
          font-weight: 600;
        }
        .flash.success {
          background: ${SUCCESS_BG};
          color: ${SUCCESS};
          border: 1px solid #bbf7d0;
        }
        .flash.error {
          background: ${DANGER_BG};
          color: ${DANGER};
          border: 1px solid #fecaca;
        }
        .module-toolbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 4px;
        }
        .module-toolbar-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .module-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        .module-card {
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(240px, 320px);
          gap: 18px;
          align-items: center;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .module-card-head {
          min-width: 0;
        }
        .module-card-summary {
          display: flex;
          gap: 14px;
          align-items: center;
          min-width: 0;
        }
        .module-card-title {
          min-width: 0;
          display: grid;
          gap: 5px;
        }
        .module-card-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .module-card-name {
          font-size: 17px;
          line-height: 1.2;
          font-weight: 600;
          color: #13233f;
        }
        .module-card-subtitle {
          font-size: 13px;
          line-height: 1.5;
          color: #617a9f;
        }
        .module-card-body {
          min-width: 0;
          display: grid;
          gap: 12px;
        }
        .module-card-copy {
          color: #617a9f;
          font-size: 14px;
          line-height: 1.6;
        }
        .module-card-side {
          min-width: 0;
          display: flex;
          justify-content: flex-end;
        }
        .module-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
          max-width: 320px;
        }
        .module-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 800;
        }
        .module-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .module-meta {
          padding: 9px 10px;
          border-radius: 14px;
          background: ${SURFACE_SOFT};
          border: 1px solid rgba(213, 223, 236, 0.8);
        }
        .module-meta-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #58749a;
          margin-bottom: 6px;
        }
        .module-meta-value {
          font-size: 12px;
          font-weight: 700;
          color: ${BRAND};
        }
        .selection-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .selection-card {
          border: 1px solid ${BORDER};
          border-radius: 18px;
          padding: 14px;
          background: ${SURFACE_SOFT};
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .selection-card:hover {
          border-color: rgba(41, 79, 188, 0.24);
          transform: translateY(-1px);
        }
        .selection-card.active {
          border-color: rgba(41, 79, 188, 0.34);
          background: ${BRAND_SOFT};
          box-shadow: inset 0 0 0 1px rgba(41, 79, 188, 0.08);
        }
        .selection-card-copy {
          display: grid;
          gap: 6px;
        }
        .selection-card-title {
          font-size: 16px;
          font-weight: 800;
          color: ${INK};
        }
        .selection-card-meta {
          font-size: 12px;
          color: ${MUTED};
          line-height: 1.5;
        }
        .selection-card-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }
        .selection-check {
          width: 18px;
          height: 18px;
        }
        .selection-card .row-between {
          gap: 16px;
          align-items: flex-start;
        }
        .selection-card input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 4px;
          flex: 0 0 auto;
        }
        .credentials-card {
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%);
          border: 1px solid rgba(41, 79, 188, 0.14);
        }
        .credentials-card code {
          background: white;
          color: ${BRAND};
          padding: 3px 7px;
          border-radius: 9px;
          border: 1px solid rgba(41, 79, 188, 0.12);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-card {
          width: min(920px, 100%);
          max-height: 92vh;
          overflow: auto;
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(213, 223, 236, 0.94);
          padding: 16px;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
        }
        .metric-subtext {
          position: relative;
          z-index: 1;
          margin-top: 0;
          font-size: 12px;
          line-height: 1.45;
          color: ${MUTED};
        }
        .overview-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 1100px) {
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
            padding: 18px 18px 0;
            border-right: 0;
            border-bottom: 1px solid rgba(213, 223, 236, 0.92);
          }
          .sidebar-panel {
            grid-template-rows: auto auto auto;
          }
          .sidebar-footer {
            display: none;
          }
          .topbar {
            padding: 18px 20px 14px;
          }
          .page-shell { padding: 18px; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .card-grid { grid-template-columns: 1fr; }
          .module-grid { grid-template-columns: 1fr; }
          .module-card {
            grid-template-columns: minmax(0, 1fr);
            align-items: stretch;
          }
          .module-card-side {
            justify-content: flex-start;
          }
          .module-actions {
            justify-content: flex-start;
            max-width: none;
          }
          .selection-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 860px) {
          .utility-bar {
            grid-template-columns: 1fr;
          }
          .utility-actions {
            justify-content: flex-start;
          }
          .module-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
        }
        @media (max-width: 720px) {
          .topbar { padding: 18px 14px 14px; }
          .header-title,
          .panel-title { font-size: 22px; }
          .page-shell { padding: 16px; }
          .stats-grid { grid-template-columns: 1fr; }
          .utility-bar, .panel-head, .row-between { flex-direction: column; align-items: stretch; }
          .tabbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .page-actions,
          .actions,
          .overview-actions {
            width: 100%;
          }
          .page-actions > button,
          .actions > button,
          .overview-actions > button {
            flex: 1 1 180px;
          }
          .module-toolbar-actions,
          .module-actions {
            width: 100%;
          }
          .module-meta-grid {
            grid-template-columns: 1fr;
          }
          .module-card {
            padding: 16px;
          }
          .client-card-top, .client-main { flex-direction: column; }
          .client-side { justify-items: start; min-width: 0; }
        }
      `}</style>

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="sidebar-panel">
            <div className="sidebar-brand">
              <div className="brand-mark">SV</div>
              <div>
                <p className="brand-subtitle">Workspace Control</p>
                <h1 className="brand-title">ScaleVyapar Admin</h1>
                <p className="brand-copy">
                  Manage clients, modules, credentials, labour tools, website editor access, and destination links.
                </p>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="utility-kicker">Navigation</div>
              <div className="tabbar">
                {navItems.map(item => {
                  const Icon =
                    item.key === 'dashboard'
                      ? LayoutDashboard
                      : item.key === 'clients'
                        ? Users2
                        : item.key === 'modules'
                          ? Boxes
                          : item.key === 'masters'
                            ? Database
                            : Settings2

                  return (
                    <button
                      key={item.key}
                      className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.key)}
                    >
                      <Icon className="nav-icon" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div />

            <div className="surface-card sidebar-footer">
              <div className="sidebar-footer-icon">
                <ShieldCheck className="nav-icon" />
              </div>
              <div className="sidebar-footer-title">Admin workspace</div>
              <p className="panel-copy">
                This refresh keeps all existing dashboard connectivity, handlers, and access flows intact while improving the frontend layout.
              </p>
            </div>
          </div>
        </aside>

        <main className="workspace-shell">
          <header className="topbar">
            <div className="header-copy">
              <div className="utility-kicker">{currentTabMeta.eyebrow}</div>
              <h2 className="header-title">{currentTabMeta.title}</h2>
              <p className="header-subtitle">{currentTabMeta.description}</p>
            </div>

            <div className="page-actions">
              <button className="secondary-btn" onClick={() => window.open('/dashboard', '_blank', 'noopener,noreferrer')}>
                <ArrowUpRight className="button-icon" />
                Client Dashboard
              </button>
              <button className="secondary-btn" onClick={() => window.open('/labour/company', '_blank', 'noopener,noreferrer')}>
                <ArrowUpRight className="button-icon" />
                Labour Site
              </button>
              <button className="primary-btn" onClick={handleLogout}>
                <LogOut className="button-icon" />
                Logout
              </button>
            </div>
          </header>

          <div className="page-shell">
            <div className="workspace-stack">
              {flash ? (
                <div className={`flash ${flash.type}`}>
                  {flash.message}
                </div>
              ) : null}

              {generatedCredentials ? (
                <div className="credentials-card">
                  <div className="row-between" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="utility-kicker">Generated Credentials</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{generatedCredentials.title}</div>
                      <div className="muted">Save these credentials before closing the card.</div>
                    </div>
                    <div className="actions">
                      <button className="secondary-btn" onClick={copyGeneratedCredentials}>Copy</button>
                      <button className="secondary-btn" onClick={() => setGeneratedCredentials(null)}>Close</button>
                    </div>
                  </div>
                  <div className="card-grid">
                    <div className="inner-card">
                      <div className="utility-kicker">Client ID</div>
                      <code>{generatedCredentials.clientId || 'Not returned'}</code>
                    </div>
                    <div className="inner-card">
                      <div className="utility-kicker">Email</div>
                      <code>{generatedCredentials.email}</code>
                    </div>
                  </div>
                  <div className="inner-card" style={{ marginTop: 14 }}>
                    <div className="utility-kicker">Password</div>
                    <code>{generatedCredentials.temporaryPassword}</code>
                  </div>
                </div>
              ) : null}

              <div className="surface-card utility-bar">
                <div>
                  <div className="utility-kicker">Control Mode</div>
                  <div className="utility-copy">
                    This panel controls client access, module routing, and Rozgar operations from one workspace.
                  </div>
                </div>

                <div className="utility-actions">
                  <button className="secondary-btn" onClick={openCreateClient}>
                    <Plus className="button-icon" />
                    Add Client
                  </button>
                  <button className="secondary-btn" onClick={openCreateModule}>
                    <Plus className="button-icon" />
                    Add Module
                  </button>
                  <button className="secondary-btn" onClick={() => window.open('/admin/labour', '_blank', 'noopener,noreferrer')}>
                    <ArrowUpRight className="button-icon" />
                    Labour Admin
                  </button>
                  <button className="secondary-btn" onClick={() => window.open('/admin/labour/website', '_blank', 'noopener,noreferrer')}>
                    <ArrowUpRight className="button-icon" />
                    Edit Website
                  </button>
                  <button className="primary-btn" onClick={() => void loadData()}>
                    <RefreshCw className="button-icon" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                {statCards.map(card => (
                  <div className="surface-card stat-card" key={card.label}>
                    <div className="stat-card-head">
                      <div className="stat-label">{card.label}</div>
                      <span className="stat-dot" style={{ backgroundColor: card.color }} />
                    </div>
                    <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                    <div className="metric-subtext">{card.description}</div>
                  </div>
                ))}
              </div>

              {activeTab === 'dashboard' ? (
                <section className="surface-card content-panel">
                  <div className="panel-head">
                    <div>
                      <h2 className="panel-title">Workspace overview</h2>
                      <p className="panel-copy">Quick visibility into clients, modules, and the live admin toolkit.</p>
                    </div>
                  </div>

                  <div className="dashboard-stack">
                    <div className="inner-card">
                      <h3 className="section-title">Recent clients</h3>
                      <div className="list-stack">
                        {clientUsers.slice(-5).reverse().map(user => (
                          <div key={user.id} className="list-row">
                            <div className="row-between">
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>{user.name}</div>
                                <div className="muted" style={{ fontSize: 14, marginTop: 5 }}>{user.email}</div>
                              </div>
                              <div className="chip-row">
                                <span className={`chip ${(user.status || 'active') === 'active' ? 'success' : 'warning'}`}>
                                  {user.status || 'active'}
                                </span>
                                <span className="chip neutral">{user.assignedModuleIds?.length || 0} modules</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="inner-card quick-actions-card">
                      <div>
                        <h3 className="section-title" style={{ marginBottom: 10 }}>Quick actions</h3>
                        <p className="panel-copy">
                          Use the modules section to assign launch-ready tools and use the Rozgar actions to jump into labour management.
                        </p>
                      </div>
                      <div className="overview-actions">
                        <button className="primary-btn" onClick={openCreateClient}>Create Client</button>
                        <button className="secondary-btn" onClick={openCreateModule}>Create Module</button>
                        <button className="secondary-btn" onClick={() => window.open('/api/setup', '_blank', 'noopener,noreferrer')}>
                          Recreate Admin
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTab === 'clients' ? (
                <section className="surface-card content-panel client-panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Client management</h2>
                  <p className="panel-copy">Create clients, generate credentials, assign modules, and manage dashboard access.</p>
                </div>
                <button className="primary-btn" onClick={openCreateClient}>Add Client</button>
              </div>

              <div className="client-toolbar">
                <div className="field" style={{ width: 'min(420px, 100%)' }}>
                  <label>Search clients</label>
                  <input
                    value={clientQuery}
                    onChange={event => setClientQuery(event.target.value)}
                    placeholder="Search by name, email, phone, or plan"
                  />
                </div>
                <div className="actions">
                  <span className="chip neutral">{filteredClientUsers.length} results</span>
                  <span className="chip success">
                    {clientUsers.filter(user => (user.status || 'active') === 'active').length} active clients
                  </span>
                </div>
              </div>

              <div>
                {filteredClientUsers.length === 0 ? (
                  <div className="inner-card muted">No clients found.</div>
                ) : (
                  filteredClientUsers.map(user => (
                    <div key={user.id} className="list-row">
                      <div className="row-between">
                        <div style={{ display: 'flex', gap: 14 }}>
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 18,
                              background: BRAND,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 18
                            }}
                          >
                            {initials(user.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
                            <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{user.email}</div>
                            <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>
                              {user.phone || 'No phone'} · {user.plan || 'Starter'} · Created {prettyDate(user.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="chip-row">
                          <span className={`chip ${(user.status || 'active') === 'active' ? 'success' : 'warning'}`}>
                            {user.status || 'active'}
                          </span>
                          <span className="chip neutral">{user.assignedModuleIds?.length || 0} modules</span>
                        </div>
                      </div>

                      <div className="chip-row">
                        {(user.assignedModules || []).length > 0 ? (
                          user.assignedModules?.map(module => (
                            <span className="chip neutral" key={module.id}>
                              {moduleBadge(module)} {module.name}
                            </span>
                          ))
                        ) : (
                          <span className="muted">No modules assigned yet.</span>
                        )}
                      </div>

                      <div className="actions">
                        <button className="secondary-btn" onClick={() => openEditClient(user)}>Edit</button>
                        <button className="secondary-btn" onClick={() => openAssignModules(user)}>Assign Modules</button>
                        <button className="secondary-btn" onClick={() => handleResetPassword(user)}>Reset Password</button>
                        <button className="danger-btn" onClick={() => handleDeleteClient(user)}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
                </section>
              ) : null}

              {activeTab === 'modules' ? (
                <section className="surface-card content-panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Module management</h2>
                  <p className="panel-copy">Edit module experience, assign premium routing, and manage Rozgar shortcuts without exposing raw URLs.</p>
                </div>
                <button className="primary-btn" onClick={openCreateModule}>Add Module</button>
              </div>

              <div className="module-toolbar">
                <div className="module-toolbar-actions">
                  <button className="secondary-btn" onClick={() => openModulePreset('leads')}>Lead Preset</button>
                  <button className="secondary-btn" onClick={() => openModulePreset('labour')}>Rozgar Preset</button>
                  <button className="secondary-btn" onClick={() => openModulePreset('vizora')}>Vizora Preset</button>
                </div>
                <div className="field" style={{ width: 'min(380px, 100%)' }}>
                  <label>Search modules</label>
                  <input
                    value={moduleQuery}
                    onChange={event => setModuleQuery(event.target.value)}
                    placeholder="Search module, slug, or category"
                  />
                </div>
              </div>

              <div className="module-grid">
                {filteredModules.map(module => {
                  const isRozgar = isRozgarModule(module)
                  const target = getModuleTarget(module)

                  return (
                    <div className="surface-card module-card" key={module.id}>
                      <div className="module-card-head">
                        <div className="module-card-summary">
                          <div
                            className="module-icon"
                            style={{ background: `linear-gradient(135deg, ${module.color || BRAND_BLUE} 0%, ${BRAND} 100%)` }}
                          >
                            {moduleBadge(module)}
                          </div>
                          <div className="module-card-title">
                            <div className="module-card-title-row">
                              <div className="module-card-name">{module.name}</div>
                              <span className={`chip ${module.isActive === false ? 'warning' : 'success'}`}>
                                {module.isActive === false ? 'Paused' : 'Live'}
                              </span>
                            </div>
                            <div className="module-card-subtitle">{module.type || 'Operations'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="module-card-body">
                        <div className="module-card-copy">
                          {module.description || 'Module workspace ready to be assigned and launched for clients.'}
                        </div>

                        <div className="module-meta-grid">
                          <div className="module-meta">
                            <div className="module-meta-label">Category</div>
                            <div className="module-meta-value">{module.type || 'Operations'}</div>
                          </div>
                          <div className="module-meta">
                            <div className="module-meta-label">Launch Mode</div>
                            <div className="module-meta-value">
                              {module.customerLink ? 'External App' : module.href && module.href !== '#' ? 'Internal Page' : 'Needs Setup'}
                            </div>
                          </div>
                        </div>

                        <div className="chip-row">
                          {(module.features || []).length > 0 ? (
                            module.features?.slice(0, 4).map(feature => (
                              <span className="chip neutral" key={feature}>{feature}</span>
                            ))
                          ) : (
                            <span className="muted">No feature list added.</span>
                          )}
                        </div>
                      </div>

                      <div className="module-card-side">
                        <div className="module-actions">
                          <button className="secondary-btn" onClick={() => openEditModule(module)}>Edit</button>
                          <button className="secondary-btn" onClick={() => handleToggleModule(module)}>
                            {module.isActive === false ? 'Activate' : 'Pause'}
                          </button>
                          {target ? (
                            <button
                              className="secondary-btn"
                              onClick={() => {
                                if (target.startsWith('http')) {
                                  window.open(target, '_blank', 'noopener,noreferrer')
                                  return
                                }
                                window.open(target, '_blank', 'noopener,noreferrer')
                              }}
                            >
                              Open Module
                            </button>
                          ) : null}
                          {isRozgar ? (
                            <>
                              <button
                                className="secondary-btn"
                                onClick={() => window.open('https://www.scalevyapar.in/admin/labour/website', '_blank', 'noopener,noreferrer')}
                              >
                                Website Editor
                              </button>
                              <button
                                className="secondary-btn"
                                onClick={() => window.open('https://www.scalevyapar.in/admin/labour', '_blank', 'noopener,noreferrer')}
                              >
                                Labour Admin
                              </button>
                            </>
                          ) : null}
                          <button className="danger-btn" onClick={() => handleDeleteModule(module)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
                </section>
              ) : null}

              {activeTab === 'masters' ? (
                <LabourMastersPanel />
              ) : null}

              {activeTab === 'settings' ? (
                <section className="surface-card content-panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Settings and routing</h2>
                  <p className="panel-copy">Manage login page content, route references, and environment expectations for the admin workspace.</p>
                </div>
                <div className="actions">
                  <span className={`chip ${loginPageSettingsStorage === 'supabase' ? 'success' : 'neutral'}`}>
                    {loginPageSettingsStorage === 'supabase' ? 'Live Supabase storage' : 'JSON fallback storage'}
                  </span>
                  <button className="primary-btn" onClick={handleSaveLoginPageSettings} disabled={savingLoginPageSettings}>
                    {savingLoginPageSettings ? 'Saving...' : 'Save Login Content'}
                  </button>
                </div>
              </div>

              <div className="card-grid">
                <div className="inner-card">
                  <h3 style={{ marginTop: 0, marginBottom: 14 }}>Login page content</h3>
                  <div className="list-stack">
                    <div className="field">
                      <label>Hero headline</label>
                      <input
                        value={loginPageSettings.headline}
                        onChange={event => updateLoginPageField('headline', event.target.value)}
                        placeholder="Scale Your Business with Automation"
                      />
                    </div>
                    <div className="field">
                      <label>Hero subtitle</label>
                      <textarea
                        value={loginPageSettings.subtitle}
                        onChange={event => updateLoginPageField('subtitle', event.target.value)}
                        placeholder="The all-in-one platform for lead generation..."
                      />
                    </div>
                  </div>
                </div>

                <div className="inner-card">
                  <h3 style={{ marginTop: 0, marginBottom: 14 }}>Core routes</h3>
                  <div className="list-stack">
                    <div className="row-between"><span className="muted">Admin panel</span><code>/admin</code></div>
                    <div className="row-between"><span className="muted">Client dashboard</span><code>/dashboard</code></div>
                    <div className="row-between"><span className="muted">Leads module</span><code>/leads</code></div>
                    <div className="row-between"><span className="muted">Labour module</span><code>/labour/company</code></div>
                    <div className="row-between"><span className="muted">Vizora module</span><code>/vizora</code></div>
                  </div>
                </div>
              </div>

              <div className="inner-card">
                <div className="panel-head">
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 8 }}>Login page features</h3>
                    <p className="panel-copy">Edit the icon and label pairs shown on the left side of the login page.</p>
                  </div>
                  <button className="secondary-btn" onClick={addLoginPageFeature}>
                    Add feature
                  </button>
                </div>

                <div className="list-stack">
                  {loginPageSettings.features.map((feature, index) => (
                    <div key={`${feature.icon}-${index}`} className="inner-card" style={{ padding: 14 }}>
                      <div className="card-grid">
                        <div className="field">
                          <label>Icon</label>
                          <input
                            value={feature.icon}
                            onChange={event => updateLoginPageFeature(index, 'icon', event.target.value)}
                            placeholder="🎯"
                          />
                        </div>
                        <div className="field">
                          <label>Feature label</label>
                          <input
                            value={feature.text}
                            onChange={event => updateLoginPageFeature(index, 'text', event.target.value)}
                            placeholder="Google B2B Lead Extraction"
                          />
                        </div>
                      </div>
                      <div className="actions" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                        <button
                          className="danger-btn"
                          onClick={() => removeLoginPageFeature(index)}
                          disabled={loginPageSettings.features.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-grid">
                <div className="inner-card">
                  <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recommended setup flow</h3>
                  <div className="list-stack">
                    <div className="muted">1. Create or edit modules with internal href or external customer link.</div>
                    <div className="muted">2. Create a client and leave the password blank to auto-generate credentials.</div>
                    <div className="muted">3. Assign modules and verify the dashboard count updates.</div>
                    <div className="muted">4. Use password reset when a client needs new credentials later.</div>
                  </div>
                </div>

                <div className="inner-card">
                  <h3 style={{ marginTop: 0, marginBottom: 14 }}>Environment notes</h3>
                  <div className="list-stack">
                    <div className="muted">This panel expects Supabase tables for <code>clients</code>, <code>modules</code>, <code>client_modules</code>, and <code>login_page_settings</code>.</div>
                    <div className="muted">Use the SQL file in <code>supabase/admin-client-management.sql</code> to create or repair those tables.</div>
                    <div className="muted">If the login content saves with JSON fallback, add the <code>login_page_settings</code> table in Supabase for persistent production edits.</div>
                  </div>
                </div>
              </div>
                </section>
              ) : null}
            </div>
          </div>
        </main>

        {showClientModal ? (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">{selectedUser ? 'Edit client' : 'Create client'}</h2>
                  <p className="panel-copy">
                    {selectedUser
                      ? 'Update the client profile and assigned modules.'
                      : 'Leave the password blank to auto-generate a secure one.'}
                  </p>
                </div>
                <button className="secondary-btn" onClick={() => setShowClientModal(false)}>Close</button>
              </div>

              <div className="card-grid">
                <div className="field">
                  <label>Name</label>
                  <input value={clientDraft.name} onChange={event => updateClientField('name', event.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={clientDraft.email} onChange={event => updateClientField('email', event.target.value)} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={clientDraft.phone} onChange={event => updateClientField('phone', event.target.value)} />
                </div>
                <div className="field">
                  <label>Plan</label>
                  <input value={clientDraft.plan} onChange={event => updateClientField('plan', event.target.value)} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={clientDraft.status} onChange={event => updateClientField('status', event.target.value as ClientDraft['status'])}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="field">
                  <label>{selectedUser ? 'Password' : 'Password (optional)'}</label>
                  <input
                    type="text"
                    value={clientDraft.password}
                    onChange={event => updateClientField('password', event.target.value)}
                    placeholder={selectedUser ? 'Use reset password action instead' : 'Leave blank to auto-generate'}
                    disabled={Boolean(selectedUser)}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: 20 }}>
                <div className="selection-header">
                  <label>Assigned modules</label>
                  <div className="selection-summary">
                    {clientDraft.moduleIds.length} selected of {modules.length}
                  </div>
                </div>
                <div className="selection-grid">
                  {modules.map(module => {
                    const checked = clientDraft.moduleIds.includes(module.id)
                    return (
                      <div
                        key={module.id}
                        className={`selection-card ${checked ? 'active' : ''}`}
                        onClick={() => toggleClientModule(module.id)}
                      >
                        <div className="row-between">
                          <div>
                            <div style={{ fontWeight: 600 }}>{moduleBadge(module)} {module.name}</div>
                            <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                              {module.type || 'Operations'}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleClientModule(module.id)}
                            onClick={event => event.stopPropagation()}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="actions" style={{ marginTop: 22, justifyContent: 'flex-end' }}>
                <button className="secondary-btn" onClick={() => setShowClientModal(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleSaveClient} disabled={submitting}>
                  {submitting ? 'Saving...' : selectedUser ? 'Save Client' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showAssignModal && selectedUser ? (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Assign modules</h2>
                  <p className="panel-copy">{selectedUser.name} · {selectedUser.email}</p>
                </div>
                <button className="secondary-btn" onClick={() => setShowAssignModal(false)}>Close</button>
              </div>

              <div className="selection-header">
                <div className="selection-summary">Choose the modules this client should see after login.</div>
                <span className="chip neutral">{selectedModuleIds.length} assigned</span>
              </div>

              <div className="selection-grid">
                {modules.map(module => {
                  const checked = selectedModuleIds.includes(module.id)
                  return (
                    <div
                      key={module.id}
                      className={`selection-card ${checked ? 'active' : ''}`}
                      onClick={() => toggleAssignedModule(module.id)}
                    >
                      <div className="row-between">
                        <div>
                          <div style={{ fontWeight: 600 }}>{moduleBadge(module)} {module.name}</div>
                          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                            {(module.features || []).slice(0, 2).join(' · ') || 'No feature list added'}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAssignedModule(module.id)}
                          onClick={event => event.stopPropagation()}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="actions" style={{ marginTop: 22, justifyContent: 'flex-end' }}>
                <button className="secondary-btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleSaveAssignments} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showModuleModal ? (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">{moduleDraft.id ? 'Edit module' : 'Create module'}</h2>
                  <p className="panel-copy">Configure launch behavior, appearance, and features for each module.</p>
                </div>
                <button className="secondary-btn" onClick={() => setShowModuleModal(false)}>Close</button>
              </div>

              <div className="card-grid">
                <div className="field">
                  <label>Module name</label>
                  <input value={moduleDraft.name} onChange={event => updateModuleField('name', event.target.value)} />
                </div>
                <div className="field">
                  <label>Slug</label>
                  <input value={moduleDraft.slug} onChange={event => updateModuleField('slug', cleanSlug(event.target.value))} />
                </div>
                <div className="field">
                  <label>Icon / badge</label>
                  <input value={moduleDraft.icon} onChange={event => updateModuleField('icon', event.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <input value={moduleDraft.type} onChange={event => updateModuleField('type', event.target.value)} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={moduleDraft.status} onChange={event => updateModuleField('status', event.target.value as ModuleDraft['status'])}>
                    <option value="active">Active</option>
                    <option value="coming_soon">Coming soon</option>
                  </select>
                </div>
                <div className="field">
                  <label>Theme color</label>
                  <input value={moduleDraft.color} onChange={event => updateModuleField('color', event.target.value)} />
                </div>
                <div className="field">
                  <label>Internal href</label>
                  <input value={moduleDraft.href} onChange={event => updateModuleField('href', event.target.value)} placeholder="/leads or /labour/company" />
                </div>
                <div className="field">
                  <label>External customer link</label>
                  <input value={moduleDraft.customerLink} onChange={event => updateModuleField('customerLink', event.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="field" style={{ marginTop: 20 }}>
                <label>Description</label>
                <textarea value={moduleDraft.description} onChange={event => updateModuleField('description', event.target.value)} />
              </div>

              <div className="field" style={{ marginTop: 20 }}>
                <label>Features (one per line or comma separated)</label>
                <textarea value={moduleDraft.featuresText} onChange={event => updateModuleField('featuresText', event.target.value)} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={moduleDraft.isActive}
                  onChange={event => updateModuleField('isActive', event.target.checked)}
                />
                Mark this module as active and visible to assigned clients
              </label>

              <div className="actions" style={{ marginTop: 22, justifyContent: 'flex-end' }}>
                <button className="secondary-btn" onClick={() => setShowModuleModal(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleSaveModule} disabled={submitting}>
                  {submitting ? 'Saving...' : moduleDraft.id ? 'Save Module' : 'Create Module'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
