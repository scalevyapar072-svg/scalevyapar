import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { getCurrentUser } from '@/lib/auth'
import { getAllModules, getUserModules } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'CLIENT') {
    redirect('/admin')
  }

  const allModules = await getAllModules()
  const assignedModules = await getUserModules(user.id)
  const assignedModuleIds = new Set(assignedModules.map(module => module.id))
  const modules = allModules.map(module => ({
    id: module.id,
    name: module.name,
    slug: module.slug || module.name.toLowerCase().replace(/\s+/g, '-'),
    description: module.description || '',
    summary: module.summary || '',
    isActive: module.isActive ?? module.status === 'active',
    isAssigned: assignedModuleIds.has(module.id),
    href: module.href || '#',
    customerLink: module.customerLink || '',
    features: Array.isArray(module.features) ? module.features : [],
    icon: module.icon || '',
    status: module.status || 'coming_soon',
    type: module.type || '',
  }))

  return <DashboardClient user={user} modules={modules} />
}
