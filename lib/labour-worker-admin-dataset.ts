export const ADMIN_WORKER_FETCH_BATCH_SIZE = 500

export type AdminWorkerRangeReader<T> = (from: number, to: number) => Promise<T[]>

export const readCompleteAdminWorkerDataset = async <T>(
  readRange: AdminWorkerRangeReader<T>,
  batchSize = ADMIN_WORKER_FETCH_BATCH_SIZE
): Promise<T[]> => {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Worker batch size must be a positive integer.')
  }

  const rows: T[] = []

  for (let from = 0; ; from += batchSize) {
    const batch = await readRange(from, from + batchSize - 1)
    if (batch.length > batchSize) {
      throw new Error('Worker range returned more records than requested.')
    }

    rows.push(...batch)
    if (batch.length < batchSize) break
  }

  return rows
}
