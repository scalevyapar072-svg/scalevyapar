import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInFlightReadDeduper,
  ReadResponseError,
  runBoundedRead,
} from '../../lib/bounded-read'

test('bounded read retries one transient read failure and then succeeds', async () => {
  let attempts = 0
  const result = await runBoundedRead(async ({ attempt }) => {
    attempts += 1
    if (attempt === 0) throw new ReadResponseError(503)
    return 'available'
  }, {
    baseDelayMs: 0,
    jitterRatio: 0,
  })

  assert.equal(result, 'available')
  assert.equal(attempts, 2)
})

test('bounded read never retries a non-transient response', async () => {
  let attempts = 0

  await assert.rejects(
    runBoundedRead(async () => {
      attempts += 1
      throw new ReadResponseError(400)
    }, {
      baseDelayMs: 0,
      jitterRatio: 0,
    }),
    (error: unknown) => error instanceof ReadResponseError && error.status === 400,
  )

  assert.equal(attempts, 1)
})

test('bounded read is capped at one retry even when requested repeatedly', async () => {
  let attempts = 0

  await assert.rejects(
    runBoundedRead(async () => {
      attempts += 1
      throw new ReadResponseError(503)
    }, {
      maxRetries: 1,
      baseDelayMs: 0,
      jitterRatio: 0,
    }),
  )

  assert.equal(attempts, 2)
})

test('in-flight read deduper shares a same-key read and releases it after completion', async () => {
  const dedupe = createInFlightReadDeduper<number>()
  let reads = 0
  let resolveRead: ((value: number) => void) | undefined
  const firstRead = dedupe('public-home', () => {
    reads += 1
    return new Promise<number>(resolve => {
      resolveRead = resolve
    })
  })
  const duplicateRead = dedupe('public-home', async () => {
    reads += 1
    return 2
  })

  assert.equal(firstRead, duplicateRead)
  assert.equal(reads, 1)
  resolveRead?.(1)
  assert.equal(await firstRead, 1)
  assert.equal(await dedupe('public-home', async () => {
    reads += 1
    return 3
  }), 3)
  assert.equal(reads, 2)
})
