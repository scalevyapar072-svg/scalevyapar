import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('admin review route requires admin and accepts only approve or reject', async () => {
  const source = await readFile(
    new URL('../../app/api/admin/labour/job-post-review/route.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /requireAdmin\(request\)/)
  assert.match(source, /value === 'approve' \|\| value === 'reject'/)
  assert.match(source, /reviewLabourJobPost\(\{/)
  assert.match(source, /actor: admin\.email/)
  assert.match(source, /JobReviewValidationError/)
})

test('generic admin route blocks direct review-field mutation and unreviewed live promotion', async () => {
  const source = await readFile(
    new URL('../../app/api/admin/labour/route.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /hasReviewFieldMutation/)
  assert.match(source, /current\.reviewStatus !== 'approved'/)
  assert.match(source, /Use the controlled job review workflow/)
})

test('company publish bypasses the legacy review queue and becomes live immediately', async () => {
  const source = await readFile(
    new URL('../../app/api/labour/company/job-post/route.ts', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(source, /buildJobSubmissionReviewFields/)
  assert.match(source, /buildCompanyJobSubmissionFields/)
  assert.match(source, /Job requirement published successfully\./)
  assert.match(source, /statusLabel: mode === 'draft' \? 'Draft' : 'Active'/)
})
