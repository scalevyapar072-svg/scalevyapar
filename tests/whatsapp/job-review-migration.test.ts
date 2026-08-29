import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('reviewed migration body adds constrained moderation fields without applying privileges', async () => {
  const migrationsDirectory = new URL('../../supabase/migrations/', import.meta.url)
  const matchingMigrations = (await readdir(migrationsDirectory)).filter(fileName =>
    /^\d+_add_job_review_workflow\.sql$/.test(fileName),
  )
  assert.equal(matchingMigrations.length, 1)

  const sql = await readFile(new URL(matchingMigrations[0], migrationsDirectory), 'utf8')

  for (const column of ['review_status', 'review_reason', 'submitted_at', 'reviewed_at']) {
    assert.match(sql, new RegExp(`add column if not exists ${column}`))
  }
  assert.match(sql, /review_status in \('under_review', 'approved', 'rejected'\)/)
  assert.match(sql, /review_status <> 'rejected'/)
  assert.match(sql, /reviewed_at is not null/)
  assert.equal(/\bgrant\b/i.test(sql), false)
  assert.equal(/disable row level security/i.test(sql), false)
  assert.equal(/drop table/i.test(sql), false)
})
