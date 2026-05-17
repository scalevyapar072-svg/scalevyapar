import { NextRequest, NextResponse } from 'next/server'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const COMPANY_UPLOAD_BUCKET = 'labour-company-registration'

const ALLOWED_DOCUMENT_KINDS = new Set([
  'gst_certificate',
  'company_proof',
  'owner_id_proof'
])

const sanitizeFileName = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const ensureCompanyUploadBucket = async () => {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
  if (error) {
    throw new Error(`Failed to access company upload storage: ${error.message}`)
  }

  if ((buckets || []).some(bucket => bucket.name === COMPANY_UPLOAD_BUCKET)) {
    return
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(COMPANY_UPLOAD_BUCKET, {
    public: false,
    fileSizeLimit: '12MB'
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(`Failed to create company upload bucket: ${createError.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const documentKind = String(formData.get('documentKind') || '').trim()
    const submissionId = String(formData.get('submissionId') || '').trim() || `company-${Date.now()}`
    const file = formData.get('file')

    if (!ALLOWED_DOCUMENT_KINDS.has(documentKind)) {
      return NextResponse.json({ error: 'Invalid document kind.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload file is required.' }, { status: 400 })
    }

    const settings = await getLabourAdminSettings()
    const extension = file.name.split('.').pop()?.trim().toLowerCase() || ''
    const allowedExtensions = settings.settings.uploadRules.allowedDocumentExtensions.map(item => item.toLowerCase())

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ error: `Only ${allowedExtensions.join(', ').toUpperCase()} files are allowed.` }, { status: 400 })
    }

    const maxDocumentSizeBytes = settings.settings.uploadRules.maxDocumentSizeMb * 1024 * 1024
    if (file.size > maxDocumentSizeBytes) {
      return NextResponse.json({ error: `File must be smaller than ${settings.settings.uploadRules.maxDocumentSizeMb}MB.` }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!bytes.length) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 })
    }

    await ensureCompanyUploadBucket()

    const safeFileName = sanitizeFileName(file.name || `${documentKind}.bin`) || `${documentKind}.bin`
    const storagePath = `company-intake/${sanitizeFileName(submissionId) || `company-${Date.now()}`}/${documentKind}-${Date.now()}-${safeFileName}`

    const { error } = await supabaseAdmin.storage.from(COMPANY_UPLOAD_BUCKET).upload(storagePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    })

    if (error) {
      throw new Error(`Failed to upload company document: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      bucket: COMPANY_UPLOAD_BUCKET,
      storagePath,
      fileName: safeFileName
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload company document.' },
      { status: 400 }
    )
  }
}
