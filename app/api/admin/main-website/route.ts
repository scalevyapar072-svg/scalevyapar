import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getMainWebsiteContent, updateMainWebsiteContent } from '@/lib/main-website-content'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const data = await getMainWebsiteContent()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to load main website content:', error)
    return NextResponse.json({ error: 'Failed to load main website content.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { content } = await request.json()
    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Website content is required.' }, { status: 400 })
    }

    const data = await updateMainWebsiteContent(content)
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Failed to update main website content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update main website content.' },
      { status: 500 }
    )
  }
}
