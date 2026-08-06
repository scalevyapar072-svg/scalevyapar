import { NextRequest, NextResponse } from 'next/server'
import { getLabourAdminSettings } from '@/lib/labour-admin-settings'
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

const RESUME_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const RESUME_MAX_SIZE_MB = 5

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
    const requestedDocumentKind = String(formData.get('documentKind') || '').trim()
    const documentKind =
      requestedDocumentKind === 'resume'
        ? 'resume_document'
        : requestedDocumentKind === 'identity'
          ? 'identity_proof'
          : requestedDocumentKind
    const file = formData.get('file')

    if (documentKind !== 'profile_photo' && documentKind !== 'identity_proof' && documentKind !== 'resume_document') {
      return NextResponse.json({ error: 'Invalid document kind.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload file is required.' }, { status: 400 })
    }

    const contentType = resolveUploadContentType(file)
    if (!contentType) {
      return NextResponse.json({ error: 'Only JPG, JPEG, PNG, WEBP, HEIC, HEIF, or PDF files are allowed.' }, { status: 400 })
    }

    const settings = await getLabourAdminSettings()
    const extension = file.name.split('.').pop()?.trim().toLowerCase() || ''
    const allowedExtensions =
      documentKind === 'resume_document'
        ? RESUME_ALLOWED_EXTENSIONS
        : (
            documentKind === 'profile_photo'
              ? settings.settings.uploadRules.allowedPhotoExtensions
              : settings.settings.uploadRules.allowedDocumentExtensions
          ).map(item => item.toLowerCase())

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Only ${allowedExtensions.join(', ').toUpperCase()} files are allowed.` },
        { status: 400 }
      )
    }

    const sizeMb =
      documentKind === 'resume_document'
        ? RESUME_MAX_SIZE_MB
        : documentKind === 'profile_photo'
          ? settings.settings.uploadRules.maxPhotoSizeMb
          : settings.settings.uploadRules.maxDocumentSizeMb
    const maxBytes = sizeMb * 1024 * 1024

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            documentKind === 'profile_photo'
              ? `Photo must be smaller than ${sizeMb}MB.`
              : documentKind === 'resume_document'
                ? `Resume must be smaller than ${sizeMb}MB.`
                : `Document must be smaller than ${sizeMb}MB.`
        },
        { status: 400 }
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!bytes.length) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 })
    }
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
