import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getLabourCompanyWebsiteContent, updateLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

const PUBLIC_COMPANY_ROUTES = [
  '/labour/company',
  '/labour/company/about',
  '/labour/company/pricing',
  '/labour/company/search',
  '/labour/company/contact',
  '/labour/company/job-post',
  '/labour/company/company-registration',
  '/labour/company/signin',
  '/labour/company/panel'
] as const

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const data = await getLabourCompanyWebsiteContent()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to load labour company website content:', error)
    return NextResponse.json({ error: 'Failed to load labour company website content.' }, { status: 500 })
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

    const data = await updateLabourCompanyWebsiteContent(content)
    revalidatePath('/admin/labour/website')
    for (const route of PUBLIC_COMPANY_ROUTES) {
      revalidatePath(route)
    }
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Failed to update labour company website content:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update labour company website content.' }, { status: 500 })
  }
}
