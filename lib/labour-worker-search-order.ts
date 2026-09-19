export type WorkerGlobalOrderKey = {
  id: string
  categoryMatch: boolean
  active: boolean
  secondaryRank: number
  availabilityRank: number
  sourceRank: number
}

export const shouldUseGlobalWorkerTierOrdering = (
  requestedJobId: string,
  selectedJobId: string | null | undefined,
) => {
  const requested = String(requestedJobId || '').trim()
  const selected = String(selectedJobId || '').trim()
  return Boolean(requested && selected && requested === selected)
}

export const getWorkerGlobalOrderTier = ({
  categoryMatch,
  active,
}: Pick<WorkerGlobalOrderKey, 'categoryMatch' | 'active'>) => {
  if (categoryMatch) return active ? 0 : 1
  return active ? 2 : 3
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
