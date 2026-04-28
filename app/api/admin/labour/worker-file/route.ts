import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const WORKER_UPLOAD_BUCKET = 'labour-worker-files'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const storagePath = request.nextUrl.searchParams.get('path')?.trim() || ''
    if (!storagePath) {
      return NextResponse.json({ error: 'File path is required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.storage.from(WORKER_UPLOAD_BUCKET).createSignedUrl(storagePath, 60 * 10)
    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || 'Unable to open worker file right now.' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to open worker file.' },
      { status: 500 }
    )
  }
}
