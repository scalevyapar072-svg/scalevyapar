import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const automationSourceUrl = new URL('../../lib/whatsapp/automation-preview.ts', import.meta.url)
const componentSourceUrl = new URL(
  '../../components/admin/labour-whatsapp-automation-preview.tsx',
  import.meta.url,
)
const routeSourceUrl = new URL(
  '../../app/api/admin/labour/whatsapp/automation-preview/route.ts',
  import.meta.url,
)

test('existing admin-only no-store route remains the only API boundary', async () => {
  const routeSource = await readFile(routeSourceUrl, 'utf8')
  assert.match(routeSource, /requireAdmin/)
  assert.match(routeSource, /handleAdminWhatsappReadOnlyGet/)
  assert.match(routeSource, /getWhatsappAutomationPreviewSummary/)
  assert.equal(/export async function POST/.test(routeSource), false)
})

test('automation summary integrates bounded pair evaluation and read-only duplicate lookup', async () => {
  const source = await readFile(automationSourceUrl, 'utf8')
  assert.match(source, /buildWorkerJobMatchPreview/)
  assert.match(source, /workerJobMatchPreview/)
  assert.match(source, /labour_whatsapp_worker_job_match_candidates/)
  assert.match(source, /\.select\('match_key'\)/)
  assert.match(source, /review_status, review_reason, submitted_at, reviewed_at/)
  for (const writeCall of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    assert.equal(source.includes(writeCall), false)
  }
  assert.equal(source.includes('/messages'), false)
})

test('Admin card exposes accessible decision, category, and city filters with masked rows', async () => {
  const source = await readFile(componentSourceUrl, 'utf8')
  assert.match(source, /Worker–Job matching decisions/)
  assert.match(source, /Filter Worker-job matches by decision/)
  assert.match(source, /Filter Worker-job matches by category/)
  assert.match(source, /Filter Worker-job matches by city/)
  assert.match(source, /row\.maskedMobile/)
  assert.equal(source.includes('row.mobile'), false)
  assert.match(source, /slice\(0, 100\)/)
})
