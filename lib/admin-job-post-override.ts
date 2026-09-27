type AdminJobPostOverrideRecord = {
  id: string
  status: string
  reviewStatus?: string | null
  reviewReason?: string
  submittedAt?: string
  reviewedAt?: string
  publishedAt?: string
  expiresAt?: string
}

type AdminJobPostOverrideSnapshot = {
  jobPosts: AdminJobPostOverrideRecord[]
}

type AdminJobPostOverrideDependencies = {
  requireAdmin: (request: Request) => Promise<{ email: string } | Response>
  getSnapshot: () => Promise<AdminJobPostOverrideSnapshot>
  updateJobPost: (
    jobPostId: string,
    payload: Record<string, unknown>,
    actor: string,
  ) => Promise<AdminJobPostOverrideSnapshot | null>
  getAdminCategories: () => Promise<unknown>
  revalidatePublicCache?: () => void | Promise<void>
  now?: () => Date
}

const ADMIN_JOB_POST_STATUSES = new Set(['draft', 'live', 'expired', 'paused'])
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SERVER_MANAGED_FIELDS = ['id', 'createdAt', 'updatedAt'] as const

export class AdminJobPostOverrideValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminJobPostOverrideValidationError'
  }
}

const parseDateOnly = (value: unknown, label: string, required = false) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    if (required) {
      throw new AdminJobPostOverrideValidationError(`${label} is required.`)
    }
    return ''
  }
  if (!DATE_ONLY_PATTERN.test(normalized)) {
    throw new AdminJobPostOverrideValidationError(`${label} must be a valid date.`)
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new AdminJobPostOverrideValidationError(`${label} must be a valid date.`)
  }
  return normalized
}

const valuesMatch = (left: unknown, right: unknown) =>
  Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right)

const hasMaterialChange = (
  current: AdminJobPostOverrideRecord,
  payload: Record<string, unknown>,
) => {
  const currentFields = current as unknown as Record<string, unknown>
  return Object.entries(payload).some(([key, value]) => !valuesMatch(currentFields[key], value))
}

export const buildAdminJobPostOverrideMutation = ({
  current,
  payload,
  now,
}: {
  current: AdminJobPostOverrideRecord
  payload: Record<string, unknown>
  now: Date
}) => {
  const nextStatus = String(payload.status ?? current.status ?? '').trim().toLowerCase()
  if (!ADMIN_JOB_POST_STATUSES.has(nextStatus)) {
    throw new AdminJobPostOverrideValidationError('Select a valid job post status.')
  }

  const today = now.toISOString().slice(0, 10)
  const publishedAt = parseDateOnly(
    payload.publishedAt ?? current.publishedAt ?? '',
    'Published At',
  )
  const expiresAt = parseDateOnly(
    payload.expiresAt ?? current.expiresAt ?? '',
    'Expires At',
    nextStatus === 'live',
  )

  if (nextStatus === 'live' && expiresAt <= today) {
    throw new AdminJobPostOverrideValidationError(
      'Expires At must be a future date before a job can be made live.',
    )
  }

  const mutation: Record<string, unknown> = { ...payload }
  for (const field of SERVER_MANAGED_FIELDS) {
    delete mutation[field]
  }

  mutation.status = nextStatus
  mutation.publishedAt = nextStatus === 'live' && !publishedAt ? today : publishedAt
  mutation.expiresAt = expiresAt

  let currentExpiry = ''
  try {
    currentExpiry = parseDateOnly(current.expiresAt || '', 'Existing Expires At')
  } catch {
    // A malformed legacy expiry must not prevent an Admin from repairing the record.
  }
  const isReactivation = nextStatus === 'live' && (
    String(current.status || '').trim().toLowerCase() !== 'live' ||
    !currentExpiry ||
    currentExpiry <= today
  )

  mutation.reviewStatus = current.reviewStatus ?? null
  mutation.reviewReason = current.reviewReason || ''
  mutation.submittedAt = current.submittedAt || ''
  mutation.reviewedAt = current.reviewedAt || ''

  if (isReactivation && current.reviewStatus) {
    mutation.reviewStatus = 'approved'
    mutation.reviewReason = ''
    mutation.reviewedAt = now.toISOString()
  }

  return {
    mutation,
    changed: hasMaterialChange(current, mutation),
  }
}

export async function handleAdminJobPostOverrideRequest(
  request: Request,
  dependencies: AdminJobPostOverrideDependencies,
) {
  try {
    const admin = await dependencies.requireAdmin(request)
    if (admin instanceof Response) return admin

    const body = await request.json()
    const jobPostId = String(body?.jobPostId || '').trim()
    const payload = body?.payload
    if (!jobPostId || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return Response.json(
        { error: 'jobPostId and payload are required.' },
        { status: 400 },
      )
    }

    const snapshot = await dependencies.getSnapshot()
    const current = snapshot.jobPosts.find(jobPost => jobPost.id === jobPostId)
    if (!current) {
      return Response.json({ error: 'Job post not found.' }, { status: 404 })
    }

    const { mutation, changed } = buildAdminJobPostOverrideMutation({
      current,
      payload: payload as Record<string, unknown>,
      now: (dependencies.now || (() => new Date()))(),
    })

    const updatedSnapshot = changed
      ? await dependencies.updateJobPost(jobPostId, mutation, admin.email)
      : snapshot
    if (!updatedSnapshot) {
      return Response.json({ error: 'Job post not found.' }, { status: 404 })
    }

    if (changed) {
      await dependencies.revalidatePublicCache?.()
    }
    const adminCategories = await dependencies.getAdminCategories()
    return Response.json({
      success: true,
      changed,
      snapshot: { ...updatedSnapshot, adminCategories },
    })
  } catch (error) {
    if (error instanceof AdminJobPostOverrideValidationError || error instanceof SyntaxError) {
      return Response.json(
        { error: error.message || 'A valid JSON request body is required.' },
        { status: 400 },
      )
    }
    console.error('Admin job post override failed:', error)
    return Response.json({ error: 'Failed to update job post.' }, { status: 500 })
  }
}
