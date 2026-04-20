import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import bcrypt from 'bcryptjs'
import path from 'path'

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'CLIENT'
  createdAt: string
  phone?: string
  plan?: string
  status?: 'active' | 'inactive'
}

export interface ModuleRecord {
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

interface UserModuleRecord {
  userId: string
  moduleId: string
  isEnabled: boolean
}

interface Database {
  users: UserRecord[]
  modules: ModuleRecord[]
  userModules: UserModuleRecord[]
}

interface ClientInput {
  name: string
  email: string
  password: string
  phone?: string
  plan?: string
}

interface ModuleInput {
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

const file = path.join(process.cwd(), 'data/db.json')
const adapter = new JSONFile<Database>(file)
const db = new Low<Database>(adapter, {
  users: [],
  modules: [],
  userModules: []
})

await db.read()

if (!db.data.users || db.data.users.length === 0) {
  const defaultModules: ModuleRecord[] = [
    { id: 'mod-vizora', name: 'Vizora', slug: 'vizora', description: 'AI-powered photo, video and ad creation studio.', status: 'active', type: 'AI Module', icon: '✦', href: '/vizora', customerLink: 'https://scalevyapar.vercel.app/vizora', features: ['AI Photo Generation', 'Photo Upscaling 4x', 'Video Ads', 'UGC Creator Videos', 'Magic Eraser'], color: '#7c3aed', isActive: true },
    { id: 'mod-crm', name: 'CRM Module', slug: 'crm', status: 'coming_soon', type: 'Standard', icon: '◈', href: '#', customerLink: '', features: ['Contact Management', 'Call Tracking', 'Follow-ups', 'Pipeline'], color: '#0284c7', isActive: false },
    { id: 'mod-inventory', name: 'Inventory Module', slug: 'inventory', status: 'coming_soon', type: 'Standard', icon: '◉', href: '#', customerLink: '', features: ['Stock Tracking', 'Production Orders', 'Raw Materials', 'Dispatch'], color: '#059669', isActive: false },
    { id: 'mod-whatsapp', name: 'WhatsApp Module', slug: 'whatsapp', status: 'coming_soon', type: 'Standard', icon: '◎', href: '#', customerLink: '', features: ['Bulk Messaging', 'Chatbot', 'Auto Replies', 'Lead Capture'], color: '#16a34a', isActive: false },
    { id: 'mod-leads', name: 'Lead Generation', slug: 'leads', status: 'coming_soon', type: 'Standard', icon: '◎', href: '#', customerLink: '', features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business', 'Export CSV'], color: '#d97706', isActive: false },
    { id: 'mod-shopify', name: 'Shopify / Website', slug: 'shopify', status: 'coming_soon', type: 'Standard', icon: '◇', href: '#', customerLink: '', features: ['Shopify Setup', 'Product Catalog', 'Order Management', 'Pricing'], color: '#84cc16', isActive: false }
  ]

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser: UserRecord = {
    id: 'admin-' + Date.now(),
    name: 'Admin',
    email: 'admin@scalevyapar.com',
    password: hashedPassword,
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    status: 'active'
  }

  const adminModules: UserModuleRecord[] = defaultModules.map(module => ({
    userId: adminUser.id,
    moduleId: module.id,
    isEnabled: true
  }))

  db.data = {
    users: [adminUser],
    modules: defaultModules,
    userModules: adminModules
  }

  await db.write()
}

const ensureDatabaseShape = async () => {
  await db.read()
  db.data ||= { users: [], modules: [], userModules: [] }
  db.data.users ||= []
  db.data.modules ||= []
  db.data.userModules ||= []
}

const sanitizeUser = (user: UserRecord) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    phone: user.phone,
    plan: user.plan,
    status: user.status
  }
}

export const getUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  await ensureDatabaseShape()
  return db.data.users.find(user => user.email === email)
}

export const getUserById = async (id: string): Promise<UserRecord | undefined> => {
  await ensureDatabaseShape()
  return db.data.users.find(user => user.id === id)
}

export const createUser = async (name: string, email: string, password: string, role: 'ADMIN' | 'CLIENT' = 'CLIENT'): Promise<UserRecord> => {
  await ensureDatabaseShape()
  const hashedPassword = await bcrypt.hash(password, 10)
  const user: UserRecord = {
    id: `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
    status: 'active'
  }

  db.data.users.push(user)
  await db.write()
  return user
}

export const createClient = async ({ name, email, password, phone, plan }: ClientInput): Promise<UserRecord> => {
  await ensureDatabaseShape()
  const hashedPassword = await bcrypt.hash(password, 10)
  const user: UserRecord = {
    id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    password: hashedPassword,
    role: 'CLIENT',
    createdAt: new Date().toISOString(),
    phone,
    plan,
    status: 'active'
  }

  db.data.users.push(user)
  await db.write()
  return user
}

export const getAllUsers = async (): Promise<UserRecord[]> => {
  await ensureDatabaseShape()
  return db.data.users
}

export const getAllModules = async (): Promise<ModuleRecord[]> => {
  await ensureDatabaseShape()
  return db.data.modules
}

export const getUserModules = async (userId: string): Promise<ModuleRecord[]> => {
  await ensureDatabaseShape()
  const userModuleIds = db.data.userModules
    .filter(um => um.userId === userId && um.isEnabled)
    .map(um => um.moduleId)

  return db.data.modules.filter(module => userModuleIds.includes(module.id))
}

export const assignModuleToUser = async (userId: string, moduleId: string, isEnabled: boolean = true): Promise<void> => {
  await ensureDatabaseShape()
  db.data.userModules = db.data.userModules.filter(um => !(um.userId === userId && um.moduleId === moduleId))
  db.data.userModules.push({ userId, moduleId, isEnabled })
  await db.write()
}

export const removeModuleFromUser = async (userId: string, moduleId: string): Promise<void> => {
  await ensureDatabaseShape()
  db.data.userModules = db.data.userModules.filter(um => !(um.userId === userId && um.moduleId === moduleId))
  await db.write()
}

export const updateUserModules = async (userId: string, moduleIds: string[]): Promise<void> => {
  await ensureDatabaseShape()
  db.data.userModules = db.data.userModules.filter(userModule => userModule.userId !== userId)
  for (const moduleId of moduleIds) {
    db.data.userModules.push({
      userId,
      moduleId,
      isEnabled: true
    })
  }
  await db.write()
}

export const deleteUser = async (userId: string): Promise<void> => {
  await ensureDatabaseShape()
  db.data.users = db.data.users.filter(user => user.id !== userId)
  db.data.userModules = db.data.userModules.filter(um => um.userId !== userId)
  await db.write()
}

export const getAllUsersWithModules = async (): Promise<(UserRecord & { modules: string })[]> => {
  await ensureDatabaseShape()
  const users = db.data.users
  const userModules = db.data.userModules
  const modules = db.data.modules

  return users.map(user => {
    const userModuleIds = userModules
      .filter(um => um.userId === user.id && um.isEnabled)
      .map(um => um.moduleId)

    const userModuleNames = userModuleIds
      .map(moduleId => modules.find(m => m.id === moduleId)?.name)
      .filter(Boolean)

    return {
      ...user,
      modules: userModuleNames.length > 0 ? userModuleNames.join(', ') : 'None'
    }
  })
}

export const getAllUsersWithAssignedModules = async (): Promise<Array<ReturnType<typeof sanitizeUser> & { assignedModules: ModuleRecord[]; assignedModuleIds: string[] }>> => {
  await ensureDatabaseShape()

  return db.data.users.map(user => {
    const assignedModuleIds = db.data.userModules
      .filter(um => um.userId === user.id && um.isEnabled)
      .map(um => um.moduleId)

    const assignedModules = db.data.modules.filter(module => assignedModuleIds.includes(module.id))

    return {
      ...sanitizeUser(user),
      assignedModules,
      assignedModuleIds
    }
  })
}

export const createModule = async (input: ModuleInput): Promise<ModuleRecord> => {
  await ensureDatabaseShape()
  const moduleRecord: ModuleRecord = {
    id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    slug: input.slug,
    description: input.description || '',
    status: input.status || (input.isActive ? 'active' : 'coming_soon'),
    type: input.type || 'Standard',
    icon: input.icon || '◆',
    href: input.href || '#',
    customerLink: input.customerLink || '',
    features: input.features || [],
    color: input.color || '#7c3aed',
    isActive: input.isActive ?? input.status === 'active'
  }

  db.data.modules.push(moduleRecord)
  await db.write()
  return moduleRecord
}

export const updateModule = async (id: string, input: Partial<ModuleInput>): Promise<boolean> => {
  await ensureDatabaseShape()
  const moduleIndex = db.data.modules.findIndex(moduleRecord => moduleRecord.id === id)
  if (moduleIndex === -1) return false

  const current = db.data.modules[moduleIndex]
  const status = input.status ?? current.status
  db.data.modules[moduleIndex] = {
    ...current,
    ...input,
    status,
    isActive: input.isActive ?? (status === 'active')
  }

  await db.write()
  return true
}

export const deleteModuleById = async (id: string): Promise<void> => {
  await ensureDatabaseShape()
  db.data.modules = db.data.modules.filter(module => module.id !== id)
  db.data.userModules = db.data.userModules.filter(userModule => userModule.moduleId !== id)
  await db.write()
}
