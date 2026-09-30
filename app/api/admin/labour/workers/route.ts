import { requireAdmin } from '@/lib/auth'
import { getAllLabourWorkersForAdmin } from '@/lib/labour-marketplace'
import { createAdminWorkerDatasetGetHandler } from '@/lib/labour-worker-dataset-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = createAdminWorkerDatasetGetHandler({
  authorize: async request => requireAdmin(request),
  loadWorkers: getAllLabourWorkersForAdmin
})
