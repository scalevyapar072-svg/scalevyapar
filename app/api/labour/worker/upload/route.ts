import { NextRequest, NextResponse } from 'next/server'
import { requireWorkerApp, uploadWorkerRegistrationAsset } from '@/lib/labour-worker-app'

export const runtime = 'nodejs'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
])

const ALLOWED_EXTENSIONS = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['heic', 'image/heic'],
  ['heif', 'image/heif'],
  ['pdf', 'application/pdf']
])

const resolveUploadContentType = (file: File) => {
  const reportedType = String(file.type || '').trim().toLowerCase()
  if (ALLOWED_MIME_TYPES.has(reportedType)) {
    return reportedType
  }

  const extension = file.name.split('.').pop()?.trim().toLowerCase() || ''
  return ALLOWED_EXTENSIONS.get(extension) || ''
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const formData = await request.formData()
    const documentKind = String(formData.get('documentKind') || '')
    const file = formData.get('file')

    if (documentKind !== 'profile_photo' && documentKind !== 'identity_proof') {
      return NextResponse.json({ error: 'Invalid document kind.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload file is required.' }, { status: 400 })
    }

    const contentType = resolveUploadContentType(file)
    if (!contentType) {
      return NextResponse.json({ error: 'Only JPG, JPEG, PNG, WEBP, HEIC, HEIF, or PDF files are allowed.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadWorkerRegistrationAsset(auth.workerId, {
      documentKind,
      fileName: file.name,
      contentType,
      bytes
    })

    return NextResponse.json({
      success: true,
      storagePath: uploaded.storagePath,
      bucket: uploaded.bucket,
      fileName: uploaded.fileName
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload worker document.' },
      { status: 400 }
    )
  }
}
