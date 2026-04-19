import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import bcrypt from 'bcryptjs'
import path from 'path'

interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'CLIENT'
  createdAt: string
}

interface Module {
  id: string
  name: string
  slug: string
}

interface UserModule {
  userId: string
  moduleId: string
  isEnabled: boolean
}

interface Database {
  users: User[]
  modules: Module[]
  userModules: UserModule[]
}

const file = path.join(process.cwd(), 'data/db.json')
const adapter = new JSONFile<Database>(file)
const db = new Low<Database>(adapter, {
  users: [],
  modules: [],
  userModules: []
})

// Initialize database
await db.read()

// Seed default data if file doesn't exist or is empty
if (!db.data.users || db.data.users.length === 0) {
  // Create default modules
  const defaultModules: Module[] = [
    { id: 'mod-1', name: 'Lead Generation', slug: 'leads' },
    { id: 'mod-2', name: 'CRM', slug: 'crm' },
    { id: 'mod-3', name: 'WhatsApp', slug: 'whatsapp' },
    { id: 'mod-4', name: 'Shopify', slug: 'shopify' },
    { id: 'mod-5', name: 'Inventory', slug: 'inventory' }
  ]

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser: User = {
    id: 'admin-' + Date.now(),
    name: 'Admin',
    email: 'admin@scalevyapar.com',
    password: hashedPassword,
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  }

  // Assign all modules to admin
  const adminModules: UserModule[] = defaultModules.map(module => ({
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

// Database operations
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  await db.read()
  return db.data.users.find(user => user.email === email)
}

export const getUserById = async (id: string): Promise<User | undefined> => {
  await db.read()
  return db.data.users.find(user => user.id === id)
}

export const createUser = async (name: string, email: string, password: string, role: 'ADMIN' | 'CLIENT' = 'CLIENT'): Promise<User> => {
  await db.read()
  const hashedPassword = await bcrypt.hash(password, 10)
  const user: User = {
    id: `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  }

  db.data.users.push(user)
  await db.write()
  return user
}

export const getAllUsers = async (): Promise<User[]> => {
  await db.read()
  return db.data.users
}

export const getAllModules = async (): Promise<Module[]> => {
  await db.read()
  return db.data.modules
}

export const getUserModules = async (userId: string): Promise<Module[]> => {
  await db.read()
  const userModuleIds = db.data.userModules
    .filter(um => um.userId === userId && um.isEnabled)
    .map(um => um.moduleId)

  return db.data.modules.filter(module => userModuleIds.includes(module.id))
}

export const assignModuleToUser = async (userId: string, moduleId: string, isEnabled: boolean = true): Promise<void> => {
  await db.read()

  // Remove existing assignment
  db.data.userModules = db.data.userModules.filter(um => !(um.userId === userId && um.moduleId === moduleId))

  // Add new assignment
  db.data.userModules.push({
    userId,
    moduleId,
    isEnabled
  })

  await db.write()
}

export const removeModuleFromUser = async (userId: string, moduleId: string): Promise<void> => {
  await db.read()
  db.data.userModules = db.data.userModules.filter(um => !(um.userId === userId && um.moduleId === moduleId))
  await db.write()
}

export const deleteUser = async (userId: string): Promise<void> => {
  await db.read()
  db.data.users = db.data.users.filter(user => user.id !== userId)
  // Also remove all user module assignments
  db.data.userModules = db.data.userModules.filter(um => um.userId !== userId)
  await db.write()
}

export const getAllUsersWithModules = async (): Promise<(User & { modules: string })[]> => {
  await db.read()
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