export type WorkerGlobalOrderKey = {
  id: string
  categoryMatch: boolean
  cityMatch: boolean
  active: boolean
  secondaryRank: number
  availabilityRank: number
  sourceRank: number
}

type GlobalWorkerTierOrderingContext = {
  requestedJobId: string
  selectedJobId: string | null | undefined
  selectedJobCompanyId: string | null | undefined
  authenticatedCompanyId: string | null | undefined
  selectedJobIsLive: boolean
}

export const shouldUseGlobalWorkerTierOrdering = ({
  requestedJobId,
  selectedJobId,
  selectedJobCompanyId,
  authenticatedCompanyId,
  selectedJobIsLive,
}: GlobalWorkerTierOrderingContext) => {
  const requested = String(requestedJobId || '').trim()
  const selected = String(selectedJobId || '').trim()
  const selectedCompany = String(selectedJobCompanyId || '').trim()
  const authenticatedCompany = String(authenticatedCompanyId || '').trim()

  return Boolean(
    requested &&
    selected &&
    requested === selected &&
    selectedJobIsLive &&
    selectedCompany &&
    authenticatedCompany &&
    selectedCompany === authenticatedCompany
  )
}

export const getWorkerGlobalOrderTier = ({
  categoryMatch,
  cityMatch,
  active,
}: Pick<WorkerGlobalOrderKey, 'categoryMatch' | 'cityMatch' | 'active'>) => {
  const categoryOffset = categoryMatch ? 0 : 4
  const cityOffset = cityMatch ? 0 : 2
  const activeOffset = active ? 0 : 1

  return categoryOffset + cityOffset + activeOffset
}

export const compareWorkerGlobalOrderKeys = (
  left: WorkerGlobalOrderKey,
  right: WorkerGlobalOrderKey,
) =>
  getWorkerGlobalOrderTier(left) - getWorkerGlobalOrderTier(right) ||
  left.secondaryRank - right.secondaryRank ||
  right.availabilityRank - left.availabilityRank ||
  left.sourceRank - right.sourceRank ||
  left.id.localeCompare(right.id)
