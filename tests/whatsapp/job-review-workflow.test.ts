import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildJobReviewMutation,
  buildJobSubmissionReviewFields,
  JobReviewValidationError,
  sanitizeJobReviewReason,
  type JobReviewRecord,
} from '../../lib/job-review-workflow'

const job: JobReviewRecord = {
  id: 'job-1',
  status: 'draft',
  reviewStatus: 'under_review',
  reviewReason: '',
  submittedAt: '2026-08-29T09:00:00.000Z',
  reviewedAt: '',
  validityDays: 30,
  publishedAt: '',
  expiresAt: '',
}

test('publish submission becomes hidden and explicitly under review', () => {
  assert.deepEqual(
    buildJobSubmissionReviewFields({
      mode: 'publish',
      submittedAt: '2026-08-29T09:00:00.000Z',
    }),
    {
      status: 'draft',
      reviewStatus: 'under_review',
      reviewReason: '',
      submittedAt: '2026-08-29T09:00:00.000Z',
      reviewedAt: '',
      publishedAt: '',
      expiresAt: '',
    },
  )
})

test('draft remains outside the review workflow', () => {
  assert.equal(
    buildJobSubmissionReviewFields({ mode: 'draft', submittedAt: 'ignored' }).reviewStatus,
    null,
  )
})

test('approval starts the live validity window at review time', () => {
  const result = buildJobReviewMutation({
    job,
    action: 'approve',
    reviewedAt: '2026-08-30T05:30:00.000Z',
  })

  assert.equal(result.status, 'live')
  assert.equal(result.reviewStatus, 'approved')
  assert.equal(result.publishedAt, '2026-08-30')
  assert.equal(result.expiresAt, '2026-09-29')
})

test('approval never extends beyond the paid plan window', () => {
  const result = buildJobReviewMutation({
    job,
    action: 'approve',
    reviewedAt: '2026-08-30T05:30:00.000Z',
    maximumExpiresAt: '2026-09-10',
  })

  assert.equal(result.expiresAt, '2026-09-10')
})

test('rejection stays hidden and requires a sanitized actual reason', () => {
  const result = buildJobReviewMutation({
    job,
    action: 'reject',
    rejectionReason: '  Salary details\nare incomplete.  ',
    reviewedAt: '2026-08-30T05:30:00.000Z',
  })

  assert.equal(result.status, 'draft')
  assert.equal(result.reviewStatus, 'rejected')
  assert.equal(result.reviewReason, 'Salary details are incomplete.')
  assert.equal(result.publishedAt, '')
  assert.equal(result.expiresAt, '')
  assert.equal(sanitizeJobReviewReason('x'.repeat(600)).length, 500)
})

test('empty rejection reason and repeat review fail closed', () => {
  assert.throws(
    () =>
      buildJobReviewMutation({
        job,
        action: 'reject',
        rejectionReason: '   ',
        reviewedAt: '2026-08-30T05:30:00.000Z',
      }),
    JobReviewValidationError,
  )
  assert.throws(
    () =>
      buildJobReviewMutation({
        job: { ...job, reviewStatus: 'approved' },
        action: 'approve',
        reviewedAt: '2026-08-30T05:30:00.000Z',
      }),
    JobReviewValidationError,
  )
})
