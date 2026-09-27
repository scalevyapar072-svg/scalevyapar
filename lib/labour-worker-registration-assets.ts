export type WorkerRegistrationAssetKind =
  | 'profile_photo'
  | 'identity_proof'
  | 'resume_document'

export type WorkerRegistrationAssetPayload = {
  documentKind: WorkerRegistrationAssetKind
  fileName: string
  contentType: string
  bytes: Buffer
}

export type StoredWorkerRegistrationAsset = {
  storagePath: string
  bucket: string
  fileName: string
}

type UploadAndLinkDependencies<Worker> = {
  findWorkerById: (workerId: string) => Promise<Worker | null>
  storeAsset: (
    workerId: string,
    payload: WorkerRegistrationAssetPayload,
  ) => Promise<StoredWorkerRegistrationAsset>
  linkAsset: (
    workerId: string,
    documentKind: WorkerRegistrationAssetKind,
    storagePath: string,
  ) => Promise<void>
  removeAsset: (storagePath: string) => Promise<void>
}

const sanitizeStoragePathSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export const getWorkerRegistrationAssetPrefix = (
  workerId: string,
  documentKind: WorkerRegistrationAssetKind,
) => {
  const safeWorkerId = sanitizeStoragePathSegment(workerId)
  if (!safeWorkerId) {
    throw new Error('Worker account has an invalid storage identifier.')
  }

  return `workers/${safeWorkerId}/${documentKind}-`
}

export const resolveWorkerRegistrationAssetPath = ({
  workerId,
  documentKind,
  incomingPath,
  existingPath,
}: {
  workerId: string
  documentKind: WorkerRegistrationAssetKind
  incomingPath: string
  existingPath: string
}) => {
  const normalizedIncomingPath = String(incomingPath || '').trim()
  const normalizedExistingPath = String(existingPath || '').trim()

  if (!normalizedIncomingPath || normalizedIncomingPath === normalizedExistingPath) {
    return {
      path: normalizedExistingPath,
      requiresExistenceCheck: false,
    }
  }

  const expectedPrefix = getWorkerRegistrationAssetPrefix(workerId, documentKind)
  if (
    !normalizedIncomingPath.startsWith(expectedPrefix) ||
    normalizedIncomingPath.includes('..') ||
    normalizedIncomingPath.includes('\\')
  ) {
    throw new Error('Uploaded worker document does not belong to the authenticated worker.')
  }

  return {
    path: normalizedIncomingPath,
    requiresExistenceCheck: true,
  }
}

export const uploadAndLinkWorkerRegistrationAsset = async <Worker>(
  workerId: string,
  payload: WorkerRegistrationAssetPayload,
  dependencies: UploadAndLinkDependencies<Worker>,
) => {
  const worker = await dependencies.findWorkerById(workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const uploaded = await dependencies.storeAsset(workerId, payload)
  try {
    await dependencies.linkAsset(
      workerId,
      payload.documentKind,
      uploaded.storagePath,
    )
  } catch {
    try {
      await dependencies.removeAsset(uploaded.storagePath)
    } catch {
      // The original safe linkage error is returned; cleanup never exposes Storage details.
    }
    throw new Error('Failed to link uploaded worker document.')
  }

  return uploaded
}
