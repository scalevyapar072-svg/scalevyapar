export const DUPLICATE_WORKER_MOBILE_CODE = 'DUPLICATE_WORKER_MOBILE'

export const DUPLICATE_WORKER_MOBILE_MESSAGE =
  'A worker with this mobile number already exists. Open the existing worker record to review or update it.'

export const normalizeIndianWorkerMobile = (value: unknown) => {
  const compact = String(value || '').trim().replace(/[\s()-]/g, '')
  if (/^\d{10}$/.test(compact)) return compact
  if (/^(?:\+91|91)\d{10}$/.test(compact)) return compact.slice(-10)
  return ''
}

export const getIndianWorkerMobileLookupVariants = (value: unknown) => {
  const canonical = normalizeIndianWorkerMobile(value)
  return canonical ? [canonical, `+91${canonical}`, `91${canonical}`] : []
}

export const workerMobilesMatch = (left: unknown, right: unknown) => {
  const normalizedLeft = normalizeIndianWorkerMobile(left)
  return Boolean(normalizedLeft && normalizedLeft === normalizeIndianWorkerMobile(right))
}

export const findWorkerByIndianMobile = <T extends { mobile?: unknown }>(
  workers: readonly T[],
  value: unknown,
) => workers.find(worker => workerMobilesMatch(worker.mobile, value)) || null

const readErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return [record.message, record.details, record.hint, record.constraint]
      .map(value => String(value || ''))
      .join(' ')
  }
  return String(error || '')
}

export const isWorkerMobileUniqueConflict = (error: unknown) => {
  const record = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : null
  const code = String(record?.code || '').trim()
  const searchable = readErrorText(error).toLowerCase()
  const namesWorkerMobileConstraint = searchable.includes('labour_workers_mobile_key')
  const describesWorkerMobileDuplicate =
    searchable.includes('duplicate key') &&
    searchable.includes('labour_workers') &&
    searchable.includes('mobile')

  return namesWorkerMobileConstraint || (code === '23505' && describesWorkerMobileDuplicate)
}
