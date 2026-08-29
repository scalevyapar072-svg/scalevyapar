export type JobReviewStatus = 'under_review' | 'approved' | 'rejected'
export type JobReviewAction = 'approve' | 'reject'

export type JobReviewRecord = {
  id: string
  status: string
  reviewStatus: JobReviewStatus | null
  reviewReason: string
  submittedAt: string
  reviewedAt: string
  validityDays: number
  publishedAt: string
  expiresAt: string
}

export type JobReviewMutation = {
  status: 'draft' | 'live'
  reviewStatus: 'approved' | 'rejected'
  reviewReason: string
  reviewedAt: string
  publishedAt: string
  expiresAt: string
}

export class JobReviewValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JobReviewValidationError'
  }
}

const toDateOnly = (value: string) => value.slice(0, 10)

const addUtcDays = (value: string, days: number) => {
  const date = new Date(`${toDateOnly(value)}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new JobReviewValidationError('A valid review timestamp is required.')
  }
  date.setUTCDate(date.getUTCDate() + Math.max(1, Math.trunc(days || 0)))
  return date.toISOString().slice(0, 10)
}

const clampDateOnly = (value: string, maximum: string) =>
  maximum && maximum < value ? maximum : value

export const sanitizeJobReviewReason = (value: unknown) =>
  String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)

export const buildJobSubmissionReviewFields = ({
  mode,
  submittedAt,
}: {
  mode: 'draft' | 'publish'
  submittedAt: string
}) =>
  mode === 'draft'
    ? {
        status: 'draft' as const,
        reviewStatus: null,
        reviewReason: '',
        submittedAt: '',
        reviewedAt: '',
        publishedAt: '',
        expiresAt: '',
      }
    : {
        status: 'draft' as const,
        reviewStatus: 'under_review' as const,
        reviewReason: '',
        submittedAt,
        reviewedAt: '',
        publishedAt: '',
        expiresAt: '',
      }

export const buildJobReviewMutation = ({
  job,
  action,
  rejectionReason,
  reviewedAt,
  maximumExpiresAt = '',
}: {
  job: JobReviewRecord
  action: JobReviewAction
  rejectionReason?: unknown
  reviewedAt: string
  maximumExpiresAt?: string
}): JobReviewMutation => {
  if (job.reviewStatus !== 'under_review') {
    throw new JobReviewValidationError('Only jobs currently under review can be approved or rejected.')
  }

  if (action === 'reject') {
    const reason = sanitizeJobReviewReason(rejectionReason)
    if (!reason) {
      throw new JobReviewValidationError('Enter the actual rejection reason before rejecting this job.')
    }

    return {
      status: 'draft',
      reviewStatus: 'rejected',
      reviewReason: reason,
      reviewedAt,
      publishedAt: '',
      expiresAt: '',
    }
  }

  const publishedAt = toDateOnly(reviewedAt)
  return {
    status: 'live',
    reviewStatus: 'approved',
    reviewReason: '',
    reviewedAt,
    publishedAt,
    expiresAt: clampDateOnly(addUtcDays(publishedAt, job.validityDays), maximumExpiresAt),
  }
}
