import { NextRequest, NextResponse } from 'next/server'
import { deleteModuleById, getAllModules, updateModule } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await context.params
    const { name, slug, icon, description, summary, isActive, status, type, href, customerLink, features, color } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const modules = await getAllModules()
    const existing = modules.find(module => module.slug === slug && module.id !== id)
    if (existing) {
      return NextResponse.json({ error: 'Module with this slug already exists' }, { status: 400 })
    }

    const updated = await updateModule(id, {
      name,
      slug,
      icon,
      description,
      summary,
      isActive,
      status,
      type,
      href,
      customerLink,
      features,
      color
    })

    if (!updated) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await context.params
    await deleteModuleById(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
