import { supabaseAdmin } from './supabase-admin'
import {
  createWorkerBulkProcessor,
  StoredWorkerBulkOperation,
  WorkerBulkProcessorDependencies
} from './labour-worker-bulk-core'
import {
  WORKER_BULK_STATUSES,
  type WorkerBulkRecord,
  type WorkerBulkResult,
  type WorkerBulkStatus
} from './labour-worker-bulk-domain'

const WORKERS_TABLE = 'labour_workers'
const AUDIT_TABLE = 'labour_audit_logs'
const WORKER_UPLOAD_BUCKET = 'labour-worker-files'
const QUERY_CHUNK_SIZE = 50
const OPERATION_MARKER = '[bulk-worker-operation:v1]'
const OPERATION_DATA_PATTERN = /\[bulk-operation-data:v1:([A-Za-z0-9_-]+)\]/

type WorkerRow = {
  id: string
  full_name: string | null
  city: string | null
  status: string | null
  is_visible: boolean | null
  category_ids: string[] | null
  profile_photo_path: string | null
  identity_proof_type: string | null
  identity_proof_number: string | null
  identity_proof_path: string | null
  registration_completed_at: string | null
  kyc_status: string | null
  kyc_remarks: string | null
}

const isWorkerBulkStatus = (value: string): value is WorkerBulkStatus =>
  WORKER_BULK_STATUSES.includes(value as WorkerBulkStatus)

const mapWorkerRow = (row: WorkerRow): WorkerBulkRecord => ({
  id: String(row.id || '').trim(),
  fullName: String(row.full_name || '').trim(),
  city: String(row.city || '').trim(),
  status: isWorkerBulkStatus(String(row.status || '')) ? row.status as WorkerBulkStatus : 'pending',
  isVisible: row.is_visible ?? false,
  categoryIds: Array.isArray(row.category_ids) ? row.category_ids.map(value => String(value || '').trim()).filter(Boolean) : [],
  profilePhotoPath: String(row.profile_photo_path || '').trim(),
  identityProofType: String(row.identity_proof_type || '').trim(),
  identityProofNumber: String(row.identity_proof_number || '').trim(),
  identityProofPath: String(row.identity_proof_path || '').trim(),
  registrationCompletedAt: String(row.registration_completed_at || '').trim(),
  kycStatus: String(row.kyc_status || '').trim(),
  kycRemarks: String(row.kyc_remarks || '').trim()
})

const chunkValues = <T,>(values: T[], size = QUERY_CHUNK_SIZE) => {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

const toBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url')
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const buildOperationSummary = (input: StoredWorkerBulkOperation) => {
  const encoded = toBase64Url(JSON.stringify(input))
  const readable = input.state === 'complete' && input.result
    ? `Bulk worker ${input.result.field} update to ${input.result.destination}: ${input.result.changed} changed, ${input.result.unchanged} unchanged, ${input.result.skipped} skipped, ${input.result.failed} failed.`
    : 'Bulk worker operation started.'
  return `${OPERATION_MARKER} ${readable} [bulk-operation-data:v1:${encoded}]`
}

const parseOperationSummary = (summary: string): StoredWorkerBulkOperation | null => {
  const match = summary.match(OPERATION_DATA_PATTERN)
  if (!match?.[1]) return null
  try {
    const parsed = JSON.parse(fromBase64Url(match[1])) as StoredWorkerBulkOperation
    if (!parsed?.fingerprint || (parsed.state !== 'started' && parsed.state !== 'complete')) return null
    return parsed
  } catch {
    return null
  }
}

const isDuplicateKeyError = (error: { code?: string; message?: string } | null) =>
  error?.code === '23505' || String(error?.message || '').toLowerCase().includes('duplicate key')

const dependencies: WorkerBulkProcessorDependencies = {
  async loadWorkers(workerIds) {
    const rows: WorkerRow[] = []
    for (const workerIdsChunk of chunkValues(workerIds)) {
      const { data, error } = await supabaseAdmin
        .from(WORKERS_TABLE)
        .select('id,full_name,city,status,is_visible,category_ids,profile_photo_path,identity_proof_type,identity_proof_number,identity_proof_path,registration_completed_at,kyc_status,kyc_remarks')
        .in('id', workerIdsChunk)
      if (error) throw new Error('Workers could not be validated safely.')
      rows.push(...((data || []) as WorkerRow[]))
    }
    return rows.map(mapWorkerRow)
  },

  async storageObjectExists(storagePath) {
    const { data, error } = await supabaseAdmin.storage.from(WORKER_UPLOAD_BUCKET).exists(storagePath)
    if (error) throw new Error('Document reference could not be validated.')
    return data === true
  },

  async readOperation(operationAuditId) {
    const { data, error } = await supabaseAdmin
      .from(AUDIT_TABLE)
      .select('summary')
      .eq('id', operationAuditId)
      .maybeSingle()
    if (error) throw new Error('Bulk operation state could not be read safely.')
    return data?.summary ? parseOperationSummary(String(data.summary)) : null
  },

  async claimOperation({ operationAuditId, operationEntityId, fingerprint, actor }) {
    const { error } = await supabaseAdmin.from(AUDIT_TABLE).insert({
      id: operationAuditId,
      action: 'update',
      entity_type: 'workers',
      entity_id: operationEntityId,
      summary: buildOperationSummary({ fingerprint, state: 'started' }),
      actor,
      created_at: new Date().toISOString()
    })
    if (!error) return 'claimed'
    if (isDuplicateKeyError(error)) return 'exists'
    throw new Error('Bulk operation could not be started safely.')
  },

  async completeOperation({ operationAuditId, fingerprint, result }) {
    const summary = buildOperationSummary({ fingerprint, state: 'complete', result })
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabaseAdmin
        .from(AUDIT_TABLE)
        .update({ summary })
        .eq('id', operationAuditId)
        .select('id')
      if (!error && data?.length === 1) return
    }
    throw new Error('Bulk operation result could not be recorded safely.')
  },

  async updateWorkerField({ worker, field, destination, rejectionReason }) {
    if (field !== 'kyc') {
      const column = field === 'status' ? 'status' : 'is_visible'
      const previousValue = field === 'status' ? worker.status : worker.isVisible
      const destinationValue = field === 'status' ? destination : destination === 'visible'
      const { data, error } = await supabaseAdmin
        .from(WORKERS_TABLE)
        .update({ [column]: destinationValue, updated_at: new Date().toISOString() })
        .eq('id', worker.id)
        .eq(column, previousValue)
        .select('id')
      if (error) throw new Error('The worker update failed safely.')
      if (data?.length === 1) return 'changed'

      const { data: latest, error: latestError } = await supabaseAdmin
        .from(WORKERS_TABLE)
        .select(`id,${column}`)
        .eq('id', worker.id)
        .maybeSingle()
      if (latestError) throw new Error('The worker could not be revalidated safely.')
      if (!latest) return 'missing'
      return latest[column as keyof typeof latest] === destinationValue ? 'unchanged' : 'conflict'
    }

    const destinationStatus = destination === 'not_submitted' ? null : destination
    const updatePayload: Record<string, unknown> = {
      kyc_status: destinationStatus,
      updated_at: new Date().toISOString()
    }
    if (destination === 'rejected') updatePayload.kyc_remarks = rejectionReason

    let updateQuery = supabaseAdmin
      .from(WORKERS_TABLE)
      .update(updatePayload)
      .eq('id', worker.id)
    updateQuery = worker.kycStatus
      ? updateQuery.eq('kyc_status', worker.kycStatus)
      : updateQuery.is('kyc_status', null)
    if (destination === 'approved') {
      updateQuery = updateQuery
        .eq('full_name', worker.fullName)
        .eq('city', worker.city)
        .contains('category_ids', worker.categoryIds)
        .containedBy('category_ids', worker.categoryIds)
        .eq('profile_photo_path', worker.profilePhotoPath)
        .eq('identity_proof_type', worker.identityProofType)
        .eq('identity_proof_number', worker.identityProofNumber)
        .eq('identity_proof_path', worker.identityProofPath)
    }
    if (destination === 'rejected') {
      updateQuery = worker.kycRemarks
        ? updateQuery.eq('kyc_remarks', worker.kycRemarks)
        : updateQuery.is('kyc_remarks', null)
    }

    const { data, error } = await updateQuery.select('id')
    if (error) throw new Error('The worker KYC update failed safely.')
    if (data?.length === 1) return 'changed'

    const { data: latest, error: latestError } = await supabaseAdmin
      .from(WORKERS_TABLE)
      .select('id,kyc_status,kyc_remarks')
      .eq('id', worker.id)
      .maybeSingle()
    if (latestError) throw new Error('The worker could not be revalidated safely.')
    if (!latest) return 'missing'
    const latestStatus = String(latest.kyc_status || '').trim()
    const latestRemarks = String(latest.kyc_remarks || '').trim()
    const reachedDestination = destination === 'not_submitted'
      ? !latestStatus
      : latestStatus === destination && (destination !== 'rejected' || latestRemarks === rejectionReason)
    return reachedDestination ? 'unchanged' : 'conflict'
  },

  async restoreWorkerField({ worker, field, destination, rejectionReason }) {
    if (field !== 'kyc') {
      const column = field === 'status' ? 'status' : 'is_visible'
      const previousValue = field === 'status' ? worker.status : worker.isVisible
      const destinationValue = field === 'status' ? destination : destination === 'visible'
      const { data, error } = await supabaseAdmin
        .from(WORKERS_TABLE)
        .update({ [column]: previousValue, updated_at: new Date().toISOString() })
        .eq('id', worker.id)
        .eq(column, destinationValue)
        .select('id')
      return !error && data?.length === 1
    }

    const destinationStatus = destination === 'not_submitted' ? null : destination
    let restoreQuery = supabaseAdmin
      .from(WORKERS_TABLE)
      .update({
        kyc_status: worker.kycStatus || null,
        kyc_remarks: worker.kycRemarks || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', worker.id)
    restoreQuery = destinationStatus
      ? restoreQuery.eq('kyc_status', destinationStatus)
      : restoreQuery.is('kyc_status', null)
    if (destination === 'rejected') restoreQuery = restoreQuery.eq('kyc_remarks', rejectionReason)
    const { data, error } = await restoreQuery.select('id')
    return !error && data?.length === 1
  },

  async createWorkerAudit({ auditId, workerId, actor, summary }) {
    const { error } = await supabaseAdmin.from(AUDIT_TABLE).insert({
      id: auditId,
      action: 'update',
      entity_type: 'workers',
      entity_id: workerId,
      summary,
      actor,
      created_at: new Date().toISOString()
    })
    if (!error) return 'created'
    if (isDuplicateKeyError(error)) return 'exists'
    throw new Error('The worker audit entry could not be recorded safely.')
  }
}

let processor: ReturnType<typeof createWorkerBulkProcessor> | null = null

const getProcessor = () => {
  if (!processor) {
    const signingSecret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    processor = createWorkerBulkProcessor(dependencies, signingSecret)
  }
  return processor
}

export const dryRunWorkerBulkUpdate = (body: unknown, actor: string): Promise<WorkerBulkResult> =>
  getProcessor().dryRun(body, actor)

export const applyWorkerBulkUpdate = (body: unknown, actor: string): Promise<WorkerBulkResult> =>
  getProcessor().apply(body, actor)
