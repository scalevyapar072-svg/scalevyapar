import { requireAdmin } from '@/lib/auth'
import { createWorkerBulkPostHandler } from '@/lib/labour-worker-bulk-api'
import { applyWorkerBulkUpdate, dryRunWorkerBulkUpdate } from '@/lib/labour-worker-bulk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = createWorkerBulkPostHandler({
  authorize: async request => requireAdmin(request),
  dryRun: dryRunWorkerBulkUpdate,
  apply: applyWorkerBulkUpdate
})
