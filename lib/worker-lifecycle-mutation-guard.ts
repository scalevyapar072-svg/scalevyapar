export const WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE =
  'Worker lifecycle mutations are disabled in Preview.'

export type WorkerLifecycleMutationRuntime = {
  vercelEnv?: string | null
  allowNonProductionForTests?: boolean
}

const assertServerOnly = () => {
  if (typeof window !== 'undefined') {
    throw new Error(
      'worker-lifecycle-mutation-guard is server-only and must not be imported into client bundles.',
    )
  }
}

const resolveRuntime = (
  runtime?: WorkerLifecycleMutationRuntime,
): WorkerLifecycleMutationRuntime => ({
  vercelEnv: runtime?.vercelEnv ?? process.env.VERCEL_ENV ?? null,
  allowNonProductionForTests: runtime?.allowNonProductionForTests ?? false,
})

export const shouldBlockWorkerLifecycleMutation = (
  runtime?: WorkerLifecycleMutationRuntime,
) => {
  assertServerOnly()

  const resolvedRuntime = resolveRuntime(runtime)
  if (resolvedRuntime.allowNonProductionForTests) {
    return false
  }

  return resolvedRuntime.vercelEnv !== 'production'
}

export const assertWorkerLifecycleMutationAllowed = (
  runtime?: WorkerLifecycleMutationRuntime,
) => {
  if (shouldBlockWorkerLifecycleMutation(runtime)) {
    throw new Error(WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE)
  }
}

export const buildWorkerLifecycleMutationBlockedResponse = (
  status = 503,
) =>
  Response.json(
    { error: WORKER_LIFECYCLE_MUTATIONS_DISABLED_MESSAGE },
    { status },
  )
