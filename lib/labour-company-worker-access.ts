export const COMPANY_SEARCHABLE_WORKER_STATUSES = [
  'active',
  'inactive_wallet_empty',
  'inactive_subscription_expired',
  'inactive_paused_by_worker',
] as const

export type WorkerDocumentKind = 'identity' | 'resume'

type WorkerDocumentPaths = {
  identityProofPath?: string | null
  resumeDocumentPath?: string | null
}

type CompanyWorkerAccessInput = {
  companyStatus: string | null | undefined
  liveJobCategoryIds: readonly string[]
  workerCategoryIds: readonly string[]
  workerStatus: string | null | undefined
  workerIsVisible: boolean | null | undefined
}

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

const normalizeIndianMobile = (value: unknown) => {
  const trimmed = String(value || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  let nationalNumber = ''

  if (digits.length === 10) {
    nationalNumber = digits
  } else if (digits.length === 11 && digits.startsWith('0')) {
    nationalNumber = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith('91')) {
    nationalNumber = digits.slice(2)
  }

  return /^[6-9]\d{9}$/.test(nationalNumber) ? `+91${nationalNumber}` : ''
}

export const canCompanyAccessWorkerRecord = ({
  companyStatus,
  liveJobCategoryIds,
  workerCategoryIds,
  workerStatus,
  workerIsVisible,
}: CompanyWorkerAccessInput) => {
  if (normalize(companyStatus) !== 'active' || workerIsVisible === false) return false
  if (!COMPANY_SEARCHABLE_WORKER_STATUSES.includes(
    normalize(workerStatus) as (typeof COMPANY_SEARCHABLE_WORKER_STATUSES)[number],
  )) return false

  const liveCategoryIds = new Set(liveJobCategoryIds.map(value => String(value || '').trim()).filter(Boolean))
  return workerCategoryIds.some(categoryId => liveCategoryIds.has(String(categoryId || '').trim()))
}

export const getWorkerDocumentPath = (
  worker: WorkerDocumentPaths,
  documentKind: WorkerDocumentKind,
) => String(
  documentKind === 'resume'
    ? worker.resumeDocumentPath || ''
    : worker.identityProofPath || '',
).trim()

export const resolveWorkerDocumentAccess = (
  access: CompanyWorkerAccessInput,
  worker: WorkerDocumentPaths,
  documentKind: WorkerDocumentKind,
) => {
  const authorized = canCompanyAccessWorkerRecord(access)
  return {
    authorized,
    documentPath: authorized ? getWorkerDocumentPath(worker, documentKind) : '',
  }
}

export const buildWorkerContactLinks = (mobile: unknown, message: string) => {
  const normalizedMobile = normalizeIndianMobile(mobile)
  if (!normalizedMobile) {
    return {
      normalizedMobile: '',
      telHref: '',
      whatsappHref: '',
    }
  }

  const whatsappDigits = normalizedMobile.slice(1)
  return {
    normalizedMobile,
    telHref: `tel:${normalizedMobile}`,
    whatsappHref: `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
  }
}
