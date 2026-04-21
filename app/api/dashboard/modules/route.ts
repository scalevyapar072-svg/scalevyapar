import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getUserModules } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (user instanceof NextResponse) {
      return user
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
      features: module.features || [],
    }))

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Dashboard modules error:', error)
    return NextResponse.json({ modules: [] })
  }
}
