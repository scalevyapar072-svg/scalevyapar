export const DEFAULT_READ_TIMEOUT_MS = 8_000
export const MAX_SAFE_READ_RETRIES = 1

export type SafeReadMethod = 'GET' | 'HEAD'

export type BoundedReadAttempt = {
  attempt: number
  signal: AbortSignal
}
export type BoundedReadOptions = {
  method?: SafeReadMethod
  timeoutMs?: number
  maxRetries?: 0 | 1
  baseDelayMs?: number
  jitterRatio?: number
  random?: () => number
  shouldRetry?: (error: unknown) => boolean
}

const wait = (delayMs: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, Math.max(0, delayMs))
  })

export const isTransientReadStatus = (status: number) =>
  status === 408 || status === 429 || status === 502 || status === 503 || status === 504 || status === 520

export const getReadErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('status' in error)) return null
  const status = Number((error as { status?: unknown }).status)
  return Number.isFinite(status) ? status : null
}

export const isRetryableReadError = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return false

  const status = getReadErrorStatus(error)
  return status === null || isTransientReadStatus(status)
}

export async function runBoundedRead<T>(
  operation: (context: BoundedReadAttempt) => Promise<T>,
  options: BoundedReadOptions = {},
): Promise<T> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_READ_TIMEOUT_MS)
  const maxRetries = Math.min(MAX_SAFE_READ_RETRIES, Math.max(0, options.maxRetries ?? MAX_SAFE_READ_RETRIES)) as 0 | 1
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 180)
  const jitterRatio = Math.min(1, Math.max(0, options.jitterRatio ?? 0.25))
  const random = options.random ?? Math.random
  const shouldRetry = options.shouldRetry ?? isRetryableReadError

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('Read timed out', 'TimeoutError')), timeoutMs)

    try {
      return await operation({ attempt, signal: controller.signal })
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error
      }

      const jitter = baseDelayMs * jitterRatio * random()
      await wait(baseDelayMs + jitter)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('Bounded read exhausted unexpectedly')
}

export function createInFlightReadDeduper<T>() {
  const inFlight = new Map<string, Promise<T>>()

  return (key: string, read: () => Promise<T>) => {
    const existing = inFlight.get(key)
    if (existing) return existing

    const pending = read().finally(() => {
      if (inFlight.get(key) === pending) {
        inFlight.delete(key)
      }
    })
    inFlight.set(key, pending)
    return pending
  }
}

export class ReadResponseError extends Error {
  status: number

  constructor(status: number, message = 'Read request failed') {
    super(message)
    this.name = 'ReadResponseError'
    this.status = status
  }
}
