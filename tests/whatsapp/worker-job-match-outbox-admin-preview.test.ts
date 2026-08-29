import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const automationSourceUrl = new URL('../../lib/whatsapp/automation-preview.ts', import.meta.url)
const componentSourceUrl = new URL(
  '../../components/admin/labour-whatsapp-automation-preview.tsx',
  import.meta.url,
)

test('existing admin summary adds bounded read-only candidate and outbox reads', async () => {
  const source = await readFile(automationSourceUrl, 'utf8')
  assert.match(source, /buildWorkerJobMatchOutboxPreview/)
  assert.match(source, /workerJobMatchOutboxPreview/)
  assert.match(source, /labour_whatsapp_worker_job_match_candidates/)
  assert.match(source, /labour_whatsapp_worker_job_match_outbox/)
  assert.match(source, /\.limit\(1000\)/)
  for (const writeCall of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    assert.equal(source.includes(writeCall), false)
  }
  assert.equal(source.includes('/messages'), false)
})

test('Admin card exposes accessible outbox filters and only masked recipient rows', async () => {
  const source = await readFile(componentSourceUrl, 'utf8')
  assert.match(source, /Worker–Job outbox decisions/)
  assert.match(source, /Filter Worker-job outbox rows by queue decision/)
  assert.match(source, /outboxPreview\?\.candidateReadState/)
  assert.match(source, /outboxPreview\?\.outboxReadState/)
  assert.match(source, /row\.maskedMobile/)
  assert.equal(source.includes('row.mobile'), false)
  assert.match(source, /filteredOutboxRows\.slice\(0, 100\)/)
})
