import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const WEBSITE_ASSET_BUCKET = 'main-website-assets'
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024

const sanitizeFileName = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const ensureWebsiteAssetBucket = async () => {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
  if (error) {
    throw new Error(`Failed to access website asset storage: ${error.message}`)
  }

  if ((buckets || []).some(bucket => bucket.name === WEBSITE_ASSET_BUCKET)) {
    return
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(WEBSITE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(`Failed to create website asset bucket: ${createError.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const formData = await request.formData()
    const assetKey = String(formData.get('assetKey') || 'main-site').trim() || 'main-site'
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, or GIF images are allowed.' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image must be smaller than 8MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!bytes.length) {
      return NextResponse.json({ error: 'Uploaded image is empty.' }, { status: 400 })
    }

    await ensureWebsiteAssetBucket()

    const extension = file.name.split('.').pop()?.trim().toLowerCase() || 'png'
    const safeFileName = sanitizeFileName(file.name || `website-image.${extension}`) || `website-image.${extension}`
    const safeAssetKey = sanitizeFileName(assetKey) || 'main-site'
    const storagePath = `website/${safeAssetKey}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from(WEBSITE_ASSET_BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: true
    })

    if (uploadError) {
      throw new Error(`Failed to upload website image: ${uploadError.message}`)
    }

    const { data: publicData } = supabaseAdmin.storage.from(WEBSITE_ASSET_BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      bucket: WEBSITE_ASSET_BUCKET,
      storagePath,
      publicUrl: publicData.publicUrl
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload website image.' },
      { status: 400 }
    )
  }
}
