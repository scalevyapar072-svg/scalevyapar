import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const dbPath = path.join(process.cwd(), 'data', 'db.json')
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ modules: [] })
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

    // Get all modules assigned to this user
    const userModuleIds = db.userModules
      ?.filter((um: any) => um.userId === payload.id && um.isEnabled !== false)
      ?.map((um: any) => um.moduleId) || []

    // Get module details with live status
    const LIVE_MODULES = ['vizora', 'mod-vizora']

    const modules = db.modules
      ?.filter((mod: any) => userModuleIds.includes(mod.id))
      ?.map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        slug: mod.slug || mod.name?.toLowerCase().replace(/\s+/g, '-'),
        description: mod.description || '',
        isActive: mod.isActive || LIVE_MODULES.includes(mod.id) || LIVE_MODULES.includes(mod.slug),
        href: mod.href || '#',
        customerLink: mod.customerLink || '',
        features: mod.features || [],
      })) || []

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Dashboard modules error:', error)
    return NextResponse.json({ modules: [] })
  }
}