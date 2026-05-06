import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getLabourAdminSettings, saveLabourAdminSettings } from '@/lib/labour-admin-settings'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const payload = await getLabourAdminSettings()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Labour admin settings fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load labour admin settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { settings } = await request.json()
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings payload is required' }, { status: 400 })
    }

    const payload = await saveLabourAdminSettings(settings)
    return NextResponse.json({ success: true, ...payload })
  } catch (error) {
    console.error('Labour admin settings update failed:', error)
    return NextResponse.json({ error: 'Failed to save labour admin settings' }, { status: 500 })
  }
}
