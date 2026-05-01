import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getLoginPageSettings, saveLoginPageSettings } from '@/lib/login-page-settings'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const payload = await getLoginPageSettings()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Admin login page settings fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load login page settings.' }, { status: 500 })
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

    const payload = await saveLoginPageSettings(settings)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Admin login page settings update failed:', error)
    return NextResponse.json({ error: 'Failed to save login page settings.' }, { status: 500 })
  }
}
