import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getMainWebsiteContent, updateMainWebsiteContent } from '@/lib/main-website-content'

const MAIN_WEBSITE_PATHS = [
  '/',
  '/pricing',
  '/tools',
  '/about',
  '/contact',
  '/login',
  '/privacy-policy',
  '/terms-of-service',
  '/user-data-deletion'
]

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
    MAIN_WEBSITE_PATHS.forEach(path => revalidatePath(path))
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Failed to update main website content:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update main website content.' }, { status: 500 })
  }
}
