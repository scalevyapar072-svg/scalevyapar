import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()
const marketplaceSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-marketplace.ts'),
  'utf8',
)
const adminPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'admin', 'labour', 'page.tsx'),
  'utf8',
)

const getSupabaseWorkerDeleteCase = () => {
  const deleteFunctionStart = marketplaceSource.indexOf('export const deleteLabourEntity')
  const supabaseDeleteStart = marketplaceSource.indexOf("  let summary = ''", deleteFunctionStart)
  const workerCaseStart = marketplaceSource.indexOf("    case 'workers': {", supabaseDeleteStart)
  const workerCaseEnd = marketplaceSource.indexOf("    case 'companies': {", workerCaseStart)

  assert.ok(deleteFunctionStart >= 0, 'deleteLabourEntity must exist')
  assert.ok(supabaseDeleteStart > deleteFunctionStart, 'Supabase delete branch must exist')
  assert.ok(workerCaseStart > supabaseDeleteStart, 'Supabase worker delete case must exist')
  assert.ok(workerCaseEnd > workerCaseStart, 'Supabase worker delete case must be bounded')

  return marketplaceSource.slice(workerCaseStart, workerCaseEnd)
}

test('worker deletion resolves a displayed worker by exact ID outside a capped snapshot', async () => {
  const workers = Array.from({ length: 1_001 }, (_, index) => ({
    id: `worker-${String(index + 1).padStart(4, '0')}`,
    fullName: `Worker ${index + 1}`,
  }))
  const cappedMarketplaceSnapshot = workers.slice(0, 1_000)
  const displayedWorker = workers[1_000]
  const findWorkerById = async (workerId: string) =>
    workers.find(worker => worker.id === workerId) || null

  assert.equal(
    cappedMarketplaceSnapshot.find(worker => worker.id === displayedWorker.id),
    undefined,
  )
  assert.deepEqual(await findWorkerById(displayedWorker.id), displayedWorker)

  const workerDeleteCase = getSupabaseWorkerDeleteCase()
  assert.match(workerDeleteCase, /const existing = await findLabourWorkerById\(id\)/)
  assert.doesNotMatch(workerDeleteCase, /readSupabaseData\(\)/)
})

test('worker Delete remains bound to the rendered result instead of the edit panel', () => {
  assert.match(
    adminPageSource,
    /void removeEntity\('workers', worker\.id, worker\.fullName\)/,
  )
  assert.match(
    adminPageSource,
    /body: JSON\.stringify\(\{ entityType, id \}\)/,
  )
  assert.doesNotMatch(
    adminPageSource,
    /removeEntity\('workers', editingWorkerId/,
  )
})
