import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase-admin'

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  password_hash: string
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

interface ClientInput {
  name: string
  email: string
  password: string
  phone?: string
  plan?: string
}

interface ClientUpdateInput {
  name?: string
  email?: string
  phone?: string
  plan?: string
  status?: 'active' | 'inactive'
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

const mapClientRow = (row: {
  id: string
  name: string
  email: string
  password_hash: string
  role: string
  created_at: string
  phone: string | null
  plan: string | null
  status: string | null
}): UserRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password_hash,
  password_hash: row.password_hash,
  role: row.role as 'ADMIN' | 'CLIENT',
  createdAt: row.created_at,
  phone: row.phone || undefined,
  plan: row.plan || undefined,
  status: (row.status as 'active' | 'inactive' | null) || undefined
})

const getDefaultModuleHref = (slug: string) => {
  if (slug === 'vizora') return '/vizora'
  if (slug === 'leads') return '/leads'
  if (slug === 'rozgar') return '/labour/company/search'
  return '#'
}

const getDefaultCustomerLink = (slug: string) => {
  const href = getDefaultModuleHref(slug)
  if (href === '#') {
    return ''
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  return baseUrl ? `${baseUrl}${href}` : ''
}

const mapModuleRow = (row: {
  id: string
  name: string
  slug: string
  description: string | null
  status: string | null
  type: string | null
  icon: string | null
  href: string | null
  customer_link: string | null
  features: string[] | null
  color: string | null
  is_active: boolean | null
}): ModuleRecord => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  status: (row.status as 'active' | 'coming_soon' | null) || undefined,
  type: row.type || undefined,
  icon: row.icon || undefined,
  href: row.href || getDefaultModuleHref(row.slug),
  customerLink: row.customer_link || getDefaultCustomerLink(row.slug),
  features: Array.isArray(row.features) ? row.features : [],
  color: row.color || undefined,
  isActive: row.is_active ?? false
})

const sanitizeUser = (user: UserRecord) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  phone: user.phone,
  plan: user.plan,
  status: user.status
})

const mapJoinedUserRows = (
  rows: Array<{
    id: string
    name: string
    email: string
    password_hash: string
    role: string
    created_at: string
    phone: string | null
    plan: string | null
    status: string | null
    client_modules: Array<{
      is_enabled: boolean
      module_id: string
      modules:
        | {
            id: string
            name: string
            slug: string
            description: string | null
            status: string | null
            type: string | null
            icon: string | null
            href: string | null
            customer_link: string | null
            features: string[] | null
            color: string | null
            is_active: boolean | null
          }
        | Array<{
            id: string
            name: string
            slug: string
            description: string | null
            status: string | null
            type: string | null
            icon: string | null
            href: string | null
            customer_link: string | null
            features: string[] | null
            color: string | null
            is_active: boolean | null
          }>
        | null
    }> | null
  }>
) => {
  return rows.map(row => {
    const user = mapClientRow(row)
    const enabledMappings = (row.client_modules || []).filter(mapping => mapping.is_enabled && mapping.modules)
    const assignedModules = enabledMappings.flatMap(mapping => {
      const nestedModules = mapping.modules
      if (!nestedModules) {
        return []
      }

      return Array.isArray(nestedModules)
        ? nestedModules.map(moduleRecord => mapModuleRow(moduleRecord))
        : [mapModuleRow(nestedModules)]
    })
    const assignedModuleIds = assignedModules.map(module => module.id)

    return {
      ...sanitizeUser(user),
      assignedModules,
      assignedModuleIds
    }
  })
}

export const getUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch user by email: ${error.message}`)
  }

  return data ? mapClientRow(data) : undefined
}

export const getUserById = async (id: string): Promise<UserRecord | undefined> => {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch user by id: ${error.message}`)
  }

  return data ? mapClientRow(data) : undefined
}

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'CLIENT' = 'CLIENT'
): Promise<UserRecord> => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user: UserRecord = {
    id: `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    email,
    password: hashedPassword,
    password_hash: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
    status: 'active'
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.password,
      role: user.role,
      created_at: user.createdAt,
      phone: user.phone ?? null,
      plan: user.plan ?? null,
      status: user.status ?? 'active'
    })
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return mapClientRow(data)
}

export const createClient = async ({ name, email, password, phone, plan }: ClientInput): Promise<UserRecord> => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      id: clientId,
      name,
      email,
      password_hash: hashedPassword,
      role: 'CLIENT',
      phone: phone ?? null,
      plan: plan ?? null,
      status: 'active'
    })
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .single()

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`)
  }

  return mapClientRow(data)
}

export const getAllUsers = async (): Promise<UserRecord[]> => {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return (data || []).map(mapClientRow)
}

export const getAllModules = async (): Promise<ModuleRecord[]> => {
  const { data, error } = await supabaseAdmin
    .from('modules')
    .select('id, name, slug, description, status, type, icon, href, customer_link, features, color, is_active')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch modules: ${error.message}`)
  }

  return (data || []).map(mapModuleRow)
}

export const getUserModules = async (userId: string): Promise<ModuleRecord[]> => {
  const { data, error } = await supabaseAdmin
    .from('client_modules')
    .select(`
      is_enabled,
      modules (
        id,
        name,
        slug,
        description,
        status,
        type,
        icon,
        href,
        customer_link,
        features,
        color,
        is_active
      )
    `)
    .eq('client_id', userId)
    .eq('is_enabled', true)

  if (error) {
    throw new Error(`Failed to fetch user modules: ${error.message}`)
  }

  return (data || [])
    .flatMap(row => {
      const nestedModules = row.modules
      if (!nestedModules) {
        return []
      }

      return Array.isArray(nestedModules)
        ? nestedModules.map(moduleRecord => mapModuleRow(moduleRecord))
        : [mapModuleRow(nestedModules)]
    })
}

export const assignModuleToUser = async (userId: string, moduleId: string, isEnabled: boolean = true): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('client_modules')
    .upsert(
      {
        client_id: userId,
        module_id: moduleId,
        is_enabled: isEnabled
      },
      { onConflict: 'client_id,module_id' }
    )

  if (error) {
    throw new Error(`Failed to assign module: ${error.message}`)
  }
}

export const removeModuleFromUser = async (userId: string, moduleId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('client_modules')
    .delete()
    .eq('client_id', userId)
    .eq('module_id', moduleId)

  if (error) {
    throw new Error(`Failed to remove module from user: ${error.message}`)
  }
}

export const updateUserModules = async (userId: string, moduleIds: string[]): Promise<void> => {
  const { error: deleteError } = await supabaseAdmin
    .from('client_modules')
    .delete()
    .eq('client_id', userId)

  if (deleteError) {
    throw new Error(`Failed to clear client modules: ${deleteError.message}`)
  }

  if (moduleIds.length === 0) {
    return
  }

  const { error: insertError } = await supabaseAdmin
    .from('client_modules')
    .insert(
      moduleIds.map(moduleId => ({
        client_id: userId,
        module_id: moduleId,
        is_enabled: true
      }))
    )

  if (insertError) {
    throw new Error(`Failed to assign client modules: ${insertError.message}`)
  }
}

export const updateUserPassword = async (userId: string, password: string): Promise<void> => {
  const hashedPassword = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin
    .from('clients')
    .update({ password_hash: hashedPassword })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user password: ${error.message}`)
  }
}

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

export const updateClient = async (userId: string, input: ClientUpdateInput): Promise<UserRecord | null> => {
  const updatePayload = {
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    plan: input.plan ?? null,
    status: input.status ?? null
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(updatePayload)
    .eq('id', userId)
    .eq('role', 'CLIENT')
    .select('id, name, email, password_hash, role, created_at, phone, plan, status')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`)
  }

  return data ? mapClientRow(data) : null
}

export const getAllUsersWithModules = async (): Promise<(UserRecord & { modules: string })[]> => {
  const usersWithAssignments = await getAllUsersWithAssignedModules()

  return usersWithAssignments.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'ADMIN' | 'CLIENT',
    createdAt: user.createdAt,
    phone: user.phone,
    plan: user.plan,
    status: user.status as 'active' | 'inactive' | undefined,
    password: '',
    password_hash: '',
    modules: user.assignedModules.length > 0
      ? user.assignedModules.map(moduleRecord => moduleRecord.name).join(', ')
      : 'None'
  }))
}

export const getAllUsersWithAssignedModules = async (): Promise<Array<ReturnType<typeof sanitizeUser> & { assignedModules: ModuleRecord[]; assignedModuleIds: string[] }>> => {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select(`
      id,
      name,
      email,
      password_hash,
      role,
      created_at,
      phone,
      plan,
      status,
      client_modules (
        is_enabled,
        module_id,
        modules (
          id,
          name,
          slug,
          description,
          status,
          type,
          icon,
          href,
          customer_link,
          features,
          color,
          is_active
        )
      )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch users with assigned modules: ${error.message}`)
  }

  return mapJoinedUserRows(data || [])
}

export const createModule = async (input: ModuleInput): Promise<ModuleRecord> => {
  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({
      id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      slug: input.slug,
      description: input.description || '',
      status: input.status || (input.isActive ? 'active' : 'coming_soon'),
      type: input.type || 'Standard',
      icon: input.icon || 'â—†',
      href: input.href || '#',
      customer_link: input.customerLink || '',
      features: input.features || [],
      color: input.color || '#7c3aed',
      is_active: input.isActive ?? input.status === 'active'
    })
    .select('id, name, slug, description, status, type, icon, href, customer_link, features, color, is_active')
    .single()

  if (error) {
    throw new Error(`Failed to create module: ${error.message}`)
  }

  return mapModuleRow(data)
}

export const updateModule = async (id: string, input: Partial<ModuleInput>): Promise<boolean> => {
  const status = input.status
  const updatePayload = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    status,
    type: input.type,
    icon: input.icon,
    href: input.href,
    customer_link: input.customerLink,
    features: input.features,
    color: input.color,
    is_active: input.isActive ?? (status ? status === 'active' : undefined)
  }

  const { data, error } = await supabaseAdmin
    .from('modules')
    .update(updatePayload)
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update module: ${error.message}`)
  }

  return Boolean(data)
}

export const deleteModuleById = async (id: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete module: ${error.message}`)
  }
}







