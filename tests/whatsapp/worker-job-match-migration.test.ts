import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('reviewed match-candidate migration is deduplicated, indexed, and server-only', async () => {
  const migrationsDirectory = new URL('../../supabase/migrations/', import.meta.url)
  const matchingMigrations = (await readdir(migrationsDirectory)).filter(fileName =>
    /^\d+_add_whatsapp_worker_job_match_candidates\.sql$/.test(fileName),
  )
  assert.equal(matchingMigrations.length, 1)

  const sql = await readFile(new URL(matchingMigrations[0], migrationsDirectory), 'utf8')

  assert.match(sql, /create table public\.labour_whatsapp_worker_job_match_candidates/)
  assert.match(sql, /unique index idx_labour_whatsapp_match_candidates_worker_job/)
  assert.match(sql, /\(worker_id, job_post_id\)/)
  assert.match(sql, /unique index idx_labour_whatsapp_match_candidates_match_key/)
  assert.match(sql, /enable row level security/)
  assert.match(
    sql,
    /revoke all on table public\.labour_whatsapp_worker_job_match_candidates\s+from public, anon, authenticated/,
  )
  assert.match(
    sql,
    /grant select\s+on table public\.labour_whatsapp_worker_job_match_candidates\s+to service_role/,
  )
  assert.match(sql, /jsonb_typeof\(eligibility_snapshot\) = 'object'/)
  assert.equal(/grant\s+(?!select\s+on table public\.labour_whatsapp_worker_job_match_candidates\s+to service_role)/i.test(sql), false)
  assert.equal(/create\s+policy/i.test(sql), false)
  assert.equal(/create\s+(or\s+replace\s+)?function/i.test(sql), false)
  assert.equal(/create\s+trigger/i.test(sql), false)
  assert.equal(/cron\./i.test(sql), false)
  assert.equal(/disable row level security/i.test(sql), false)
  assert.equal(/normalized_mobile|message_body/i.test(sql), false)
})
