import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  getLabourMarketplaceSnapshot,
  updateLabourEntity
} from '@/lib/labour-marketplace'
import { uploadWorkerRegistrationAsset } from '@/lib/labour-worker-app'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const WORKER_UPLOAD_BUCKET = 'labour-worker-files'
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

type WorkerDocumentKind = 'profile_photo' | 'identity_proof'

const WORKER_FILE_FIELDS = {
  profile_photo: 'profilePhotoPath',
  identity_proof: 'identityProofPath'
} as const

const CONTENT_TYPES_BY_EXTENSION = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['heic', 'image/heic'],
  ['heif', 'image/heif'],
  ['pdf', 'application/pdf']
])

const PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])
const IDENTITY_EXTENSIONS = new Set([...PHOTO_EXTENSIONS, 'pdf'])
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'])

class WorkerFileRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const isWorkerDocumentKind = (value: string): value is WorkerDocumentKind =>
  value === 'profile_photo' || value === 'identity_proof'

const sanitizeStoragePathSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const isWorkerOwnedStoragePath = (workerId: string, storagePath: string) => {
  const safeWorkerId = sanitizeStoragePathSegment(workerId)
  return Boolean(safeWorkerId) &&
    !storagePath.startsWith('/') &&
    !storagePath.includes('..') &&
    storagePath.startsWith(`workers/${safeWorkerId}/`)
}

const getWorkerFileContext = async (workerId: string, documentKind: string) => {
  if (!workerId) {
    throw new WorkerFileRequestError('Worker is required.', 400)
  }
  if (!isWorkerDocumentKind(documentKind)) {
    throw new WorkerFileRequestError('Invalid worker document kind.', 400)
  }

  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = snapshot.workers.find(record => record.id === workerId)
  if (!worker) {
    throw new WorkerFileRequestError('Worker not found.', 404)
  }

  const field = WORKER_FILE_FIELDS[documentKind]
  const storagePath = worker[field].trim()
  if (storagePath && !isWorkerOwnedStoragePath(workerId, storagePath)) {
    throw new WorkerFileRequestError('The stored worker file path failed its safety check.', 409)
  }

  return {
    documentKind,
    field,
    storagePath,
    isVisible: worker.isVisible
  }
}

const hasPrefix = (bytes: Buffer, prefix: number[]) =>
  bytes.length >= prefix.length && prefix.every((value, index) => bytes[index] === value)

const hasExpectedFileSignature = (bytes: Buffer, contentType: string) => {
  if (contentType === 'image/jpeg') {
    return hasPrefix(bytes, [0xff, 0xd8, 0xff])
  }
  if (contentType === 'image/png') {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }
  if (contentType === 'image/webp') {
    return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  if (contentType === 'application/pdf') {
    return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
  }
  if (contentType === 'image/heic' || contentType === 'image/heif') {
    if (bytes.length < 12 || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') return false
    const brands = []
    for (let offset = 8; offset + 4 <= Math.min(bytes.length, 32); offset += 4) {
      brands.push(bytes.subarray(offset, offset + 4).toString('ascii').toLowerCase())
    }
    return brands.some(brand => HEIF_BRANDS.has(brand))
  }

  return false
}

const resolveUploadContentType = (
  file: File,
  bytes: Buffer,
  documentKind: WorkerDocumentKind
) => {
  const extension = file.name.split('.').pop()?.trim().toLowerCase() || ''
  const acceptedExtensions = documentKind === 'profile_photo' ? PHOTO_EXTENSIONS : IDENTITY_EXTENSIONS
  if (!acceptedExtensions.has(extension)) {
    return ''
  }

  const contentType = CONTENT_TYPES_BY_EXTENSION.get(extension) || ''
  const reportedType = String(file.type || '').trim().toLowerCase()
  const acceptedReportedTypes = new Set([contentType])
  if (contentType === 'image/jpeg') {
    acceptedReportedTypes.add('image/jpg')
  }
  if (contentType === 'image/heic' || contentType === 'image/heif') {
    acceptedReportedTypes.add('image/heic')
    acceptedReportedTypes.add('image/heif')
  }

  if (reportedType && reportedType !== 'application/octet-stream' && !acceptedReportedTypes.has(reportedType)) {
    return ''
  }

  return hasExpectedFileSignature(bytes, contentType) ? contentType : ''
}

const removeStoragePath = async (storagePath: string) => {
  try {
    const { error } = await supabaseAdmin.storage.from(WORKER_UPLOAD_BUCKET).remove([storagePath])
    return error
  } catch (error) {
    return error instanceof Error ? error : new Error('Failed to remove stored worker file.')
  }
}

const toErrorResponse = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: error instanceof WorkerFileRequestError ? error.status : 500 }
  )

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const workerId = request.nextUrl.searchParams.get('workerId')?.trim() || ''
    const documentKind = request.nextUrl.searchParams.get('documentKind')?.trim() || ''
    const context = await getWorkerFileContext(workerId, documentKind)
    if (!context.storagePath) {
      throw new WorkerFileRequestError('This worker does not have that file.', 404)
    }

    const { data, error } = await supabaseAdmin.storage
      .from(WORKER_UPLOAD_BUCKET)
      .createSignedUrl(context.storagePath, 60 * 10)
    if (error || !data?.signedUrl) {
      throw new WorkerFileRequestError(error?.message || 'Unable to open worker file right now.', 500)
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    return toErrorResponse(error, 'Failed to open worker file.')
  }
}

export async function POST(request: NextRequest) {
  let uploadedPath = ''
  let keepUploadedFile = false

  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const formData = await request.formData()
    const workerId = String(formData.get('workerId') || '').trim()
    const documentKind = String(formData.get('documentKind') || '').trim()
    const context = await getWorkerFileContext(workerId, documentKind)
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new WorkerFileRequestError('Choose a file to upload.', 400)
    }
    if (file.size <= 0) {
      throw new WorkerFileRequestError('The selected file is empty.', 400)
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new WorkerFileRequestError('Worker files must be 10 MB or smaller.', 400)
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const contentType = resolveUploadContentType(file, bytes, context.documentKind)
    if (!contentType) {
      throw new WorkerFileRequestError(
        context.documentKind === 'profile_photo'
          ? 'Worker photos must be valid JPG, JPEG, PNG, WEBP, HEIC, or HEIF files.'
          : 'Identity documents must be valid JPG, JPEG, PNG, WEBP, HEIC, HEIF, or PDF files.',
        400
      )
    }

    const uploaded = await uploadWorkerRegistrationAsset(workerId, {
      documentKind: context.documentKind,
      fileName: file.name,
      contentType,
      bytes
    })
    uploadedPath = uploaded.storagePath

    const snapshot = await updateLabourEntity('workers', workerId, {
      [context.field]: uploadedPath
    }, admin.email)
    if (!snapshot) {
      throw new WorkerFileRequestError('Worker not found.', 404)
    }

    if (context.storagePath && context.storagePath !== uploadedPath) {
      const removeError = await removeStoragePath(context.storagePath)
      if (removeError) {
        let rollbackSucceeded = false
        try {
          rollbackSucceeded = Boolean(await updateLabourEntity('workers', workerId, {
            [context.field]: context.storagePath
          }, admin.email))
        } catch {
          rollbackSucceeded = false
        }

        if (!rollbackSucceeded) {
          keepUploadedFile = true
          throw new WorkerFileRequestError(
            'The new file was saved, but the previous stored file could not be removed. Refresh before retrying.',
            500
          )
        }

        throw new WorkerFileRequestError(
          'The previous stored file could not be removed, so the replacement was not saved.',
          500
        )
      }
    }

    keepUploadedFile = true
    return NextResponse.json({
      success: true,
      message: context.storagePath ? 'Worker file replaced.' : 'Worker file uploaded.',
      storagePath: uploadedPath,
      snapshot
    })
  } catch (error) {
    if (uploadedPath && !keepUploadedFile) {
      await removeStoragePath(uploadedPath)
    }
    return toErrorResponse(error, 'Failed to upload worker file.')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await request.json().catch(() => ({}))
    const workerId = String(body.workerId || '').trim()
    const documentKind = String(body.documentKind || '').trim()
    const context = await getWorkerFileContext(workerId, documentKind)
    if (!context.storagePath) {
      throw new WorkerFileRequestError('This worker does not have that file.', 404)
    }

    const snapshot = await updateLabourEntity('workers', workerId, {
      [context.field]: '',
      isVisible: false
    }, admin.email)
    if (!snapshot) {
      throw new WorkerFileRequestError('Worker not found.', 404)
    }

    const removeError = await removeStoragePath(context.storagePath)
    if (removeError) {
      let rollbackSucceeded = false
      try {
        rollbackSucceeded = Boolean(await updateLabourEntity('workers', workerId, {
          [context.field]: context.storagePath,
          isVisible: context.isVisible
        }, admin.email))
      } catch {
        rollbackSucceeded = false
      }

      throw new WorkerFileRequestError(
        rollbackSucceeded
          ? 'The stored file could not be removed, so the worker record was left unchanged.'
          : 'The worker record was cleared, but the stored file could not be removed. Refresh before retrying.',
        500
      )
    }

    return NextResponse.json({
      success: true,
      message: context.documentKind === 'profile_photo'
        ? 'Worker photo deleted.'
        : 'Identity document deleted.',
      snapshot
    })
  } catch (error) {
    return toErrorResponse(error, 'Failed to delete worker file.')
  }
}
