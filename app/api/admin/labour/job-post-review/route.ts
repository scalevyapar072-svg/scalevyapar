import { requireAdmin } from '@/lib/auth'
import { JobReviewValidationError, type JobReviewAction } from '@/lib/job-review-workflow'
import {
  getLabourAdminVisibleCategories,
  reviewLabourJobPost,
} from '@/lib/labour-marketplace'

type JobPostReviewDependencies = {
  requireAdmin: typeof requireAdmin
  reviewLabourJobPost: typeof reviewLabourJobPost
  getLabourAdminVisibleCategories: typeof getLabourAdminVisibleCategories
}

const isReviewAction = (value: unknown): value is JobReviewAction =>
  value === 'approve' || value === 'reject'

export async function POST(request: Request) {
  return handleAdminJobPostReview(request)
}

export async function handleAdminJobPostReview(
  request: Request,
  dependencies: JobPostReviewDependencies = {
    requireAdmin,
    reviewLabourJobPost,
    getLabourAdminVisibleCategories,
  },
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) return admin

    const body = await request.json()
    const jobPostId = String(body?.jobPostId || '').trim()
    const action = body?.action
    if (!jobPostId || !isReviewAction(action)) {
      return Response.json(
        { error: 'A valid job post and review action are required.' },
        { status: 400 },
      )
    }

    const snapshot = await dependencies.reviewLabourJobPost({
      jobPostId,
      action,
      rejectionReason: body?.rejectionReason,
      actor: admin.email,
    })
    if (!snapshot) {
      return Response.json({ error: 'Job post not found.' }, { status: 404 })
    }

    const adminCategories = await dependencies.getLabourAdminVisibleCategories()
    return Response.json({
      success: true,
      snapshot: { ...snapshot, adminCategories },
    })
  } catch (error) {
    if (error instanceof JobReviewValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error('Admin job post review failed:', error)
    return Response.json({ error: 'Failed to review job post.' }, { status: 500 })
  }
}
