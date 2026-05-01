import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { getCurrentUser } from '@/lib/auth'
import { getUserModules } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'CLIENT') {
    redirect('/admin')
  }

  const assignedModules = await getUserModules(user.id)
  const modules = assignedModules.map(module => ({
    id: module.id,
    name: module.name,
    slug: module.slug || module.name.toLowerCase().replace(/\s+/g, '-'),
    description: module.description || '',
    isActive: module.isActive ?? module.status === 'active',
    href: module.href || '#',
    customerLink: module.customerLink || '',
    features: Array.isArray(module.features) ? module.features : [],
    icon: module.icon || '',
  }))

  return <DashboardClient user={user} modules={modules} />
}
