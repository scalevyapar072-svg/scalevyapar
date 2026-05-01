import { NextRequest, NextResponse } from 'next/server'
import { createModule, deleteModuleById, getAllModules, updateModule } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const modules = await getAllModules()
    return NextResponse.json({ modules })
  } catch {
    return NextResponse.json({ modules: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { name, slug, icon, description, summary, isActive, status, type, href, customerLink, features, color } = await request.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const modules = await getAllModules()
    const existing = modules.find(module => module.slug === slug)
    if (existing) {
      return NextResponse.json({ error: 'Module with this slug already exists' }, { status: 400 })
    }

    const newModule = await createModule({
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

    return NextResponse.json({ success: true, module: newModule })
  } catch {
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id, name, slug, icon, description, summary, isActive, status, type, href, customerLink, features, color } = await request.json()
    const updated = await updateModule(id, { name, slug, icon, description, summary, isActive, status, type, href, customerLink, features, color })

    if (!updated) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await request.json()
    await deleteModuleById(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
