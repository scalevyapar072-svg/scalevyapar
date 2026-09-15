type SafeServerEvent = {
  event: string
  outcome: 'success' | 'failure' | 'degraded'
  durationMs?: number
  status?: number
  retryCount?: number
  source?: 'supabase' | 'cache' | 'json' | 'browser'
}
const normalizeMetric = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : undefined

export const logSafeServerEvent = (event: SafeServerEvent) => {
  const payload = {
    event: event.event,
    outcome: event.outcome,
    durationMs: normalizeMetric(event.durationMs),
    status: normalizeMetric(event.status),
    retryCount: normalizeMetric(event.retryCount),
    source: event.source,
  }

  if (event.outcome === 'failure') {
    console.error(payload)
    return
  }

  console.info(payload)
}
