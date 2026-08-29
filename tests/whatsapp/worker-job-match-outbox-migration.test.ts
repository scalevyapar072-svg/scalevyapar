import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('reviewed outbox migration is candidate-linked, deduplicated, indexed, and server-only', async () => {
  const migrationDirectory = new URL('../../supabase/migrations/', import.meta.url)
  const migrationNames = (await readdir(migrationDirectory)).filter((name) =>
    name.endsWith('_add_whatsapp_worker_job_match_outbox.sql'),
  )
  assert.ok(migrationNames.length <= 1, 'expected no more than one final Phase 16H.1 migration')

  const reviewedSqlUrl = migrationNames.length === 1
    ? new URL(migrationNames[0], migrationDirectory)
    : new URL('../../phase16h1_sql/add_whatsapp_worker_job_match_outbox.sql', import.meta.url)
  const sql = await readFile(reviewedSqlUrl, 'utf8')
  const normalized = sql.toLowerCase()

  assert.match(normalized, /create table public\.labour_whatsapp_worker_job_match_outbox/)
  assert.match(normalized, /references public\.labour_whatsapp_worker_job_match_candidates \(id\)/)
  assert.match(normalized, /create unique index idx_labour_whatsapp_match_outbox_candidate/)
  assert.match(normalized, /create unique index idx_labour_whatsapp_match_outbox_match_key/)
  assert.match(normalized, /create unique index idx_labour_whatsapp_match_outbox_idempotency_key/)
  assert.match(normalized, /create index idx_labour_whatsapp_match_outbox_due/)
  assert.match(normalized, /where outbox_status in \('pending', 'retry_scheduled'\)/)
  assert.match(normalized, /attempt_count between 0 and 4/)
  assert.match(normalized, /template_category = 'utility'/)
  assert.match(normalized, /enable row level security/)
  assert.match(normalized, /revoke all on table[\s\s]*public\.labour_whatsapp_worker_job_match_outbox[\s\s]*from public, anon, authenticated/)
  assert.match(normalized, /grant select, insert, update[\s\s]*on table public\.labour_whatsapp_worker_job_match_outbox[\s\s]*to service_role/)

  assert.equal(normalized.includes('create policy'), false)
  assert.equal(normalized.includes('create trigger'), false)
  assert.equal(normalized.includes('create function'), false)
  assert.equal(normalized.includes('create or replace function'), false)
  assert.equal(normalized.includes('cron.schedule'), false)
  assert.equal(normalized.includes('net.http'), false)
  assert.equal(normalized.includes('/messages'), false)
  assert.equal(normalized.includes('insert into public.labour_whatsapp_worker_job_match_outbox'), false)
})
