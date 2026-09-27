import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const readSource = (...segments: string[]) =>
  readFileSync(path.join(workspaceRoot, ...segments), 'utf8')
const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const transpileToDataUrl = (source: string) => toDataUrl(ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText)

const mobileModulePath = path.join(workspaceRoot, 'lib', 'labour-worker-mobile.ts')
const mobileModule = await import(pathToFileURL(mobileModulePath).href)
const mobileModuleUrl = transpileToDataUrl(readFileSync(mobileModulePath, 'utf8'))
const otpModuleSource = readSource('lib', 'labour-worker-otp.ts')
const otpModuleUrl = transpileToDataUrl(
  otpModuleSource.replace("'./labour-worker-mobile'", `'${mobileModuleUrl}'`),
)
const otpModule = await import(otpModuleUrl)

const requestRouteSource = readSource('app', 'api', 'labour', 'worker', 'auth', 'request-otp', 'route.ts')
const verifyRouteSource = readSource('app', 'api', 'labour', 'worker', 'auth', 'verify-otp', 'route.ts')
const workerAppSource = readSource('lib', 'labour-worker-app.ts')
const marketplaceSource = readSource('lib', 'labour-marketplace.ts')

const routeMockKey = '__workerOtpHotfixRouteMocks'
const nextServerStubUrl = toDataUrl(`
  export class NextRequest extends Request {}
  export const NextResponse = { json: (body, init) => Response.json(body, init) }
`)
const workerAppStubUrl = toDataUrl(`
  export const requestWorkerOtp = (...args) =>
    globalThis.${routeMockKey}.requestWorkerOtp(...args)
  export const verifyWorkerOtpCode = (...args) =>
    globalThis.${routeMockKey}.verifyWorkerOtpCode(...args)
  export const getWorkerAppDashboard = (...args) =>
    globalThis.${routeMockKey}.getWorkerAppDashboard(...args)
`)

const requestRoute = await import(transpileToDataUrl(
  requestRouteSource
    .replace("'next/server'", `'${nextServerStubUrl}'`)
    .replace("'@/lib/labour-worker-app'", `'${workerAppStubUrl}'`)
    .replace("'@/lib/labour-worker-otp'", `'${otpModuleUrl}'`),
))
const verifyRoute = await import(transpileToDataUrl(
  verifyRouteSource
    .replace("'next/server'", `'${nextServerStubUrl}'`)
    .replace("'@/lib/labour-worker-app'", `'${workerAppStubUrl}'`)
    .replace("'@/lib/labour-worker-otp'", `'${otpModuleUrl}'`),
))

const canonicalMobile = '6500000000'
const workerFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'worker-existing',
  fullName: 'Synthetic Worker',
  mobile: canonicalMobile,
  status: 'pending',
  isVisible: false,
  kycStatus: '',
  kycRemarks: '',
  registrationCompletedAt: '',
  walletBalance: 17,
  activePlan: 'synthetic-plan',
  referralProfileId: 'synthetic-referral',
  ...overrides,
})

const makeRequest = (body: Record<string, unknown>) => new Request(
  'https://example.test/api/labour/worker/auth/request-otp',
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  },
)

test('existing workers across origins and lifecycle states are reused byte-for-byte', async t => {
  const cases = [
    ['Admin-created', { fullName: 'Admin Seeded', registrationCompletedAt: '' }],
    ['worker-app-created', { fullName: '', registrationCompletedAt: '' }],
    ['Pending', { status: 'pending' }],
    ['Active', { status: 'active', isVisible: true }],
    ['inactive', { status: 'inactive_wallet_empty', isVisible: false }],
    ['hidden', { status: 'active', isVisible: false }],
    ['rejected', { status: 'rejected', isVisible: false }],
    ['blocked', { status: 'blocked', isVisible: false }],
    ['KYC approved', { kycStatus: 'approved', registrationCompletedAt: '2026-01-01T00:00:00.000Z' }],
    ['KYC not submitted', { kycStatus: '', registrationCompletedAt: '' }],
    ['registration incomplete', { fullName: '', registrationCompletedAt: '' }],
  ] as const

  for (const [label, overrides] of cases) {
    await t.test(label, async () => {
      const worker = workerFixture(overrides)
      const before = JSON.stringify(worker)
      let createCalls = 0
      const resolved = await otpModule.resolveWorkerForOtp('+91 (65000) 00000', {
        findWorkersByMobile: async () => [worker],
        createWorker: async () => {
          createCalls += 1
        },
      })

      assert.equal(resolved, worker)
      assert.equal(createCalls, 0)
      assert.equal(JSON.stringify(worker), before)
    })
  }
})

test('supported Indian mobile formats canonicalize to the same exact lookup', async () => {
  const formats = [
    canonicalMobile,
    `+91${canonicalMobile}`,
    `91${canonicalMobile}`,
    '65000 00000',
    '65000-00000',
    '(65000) 00000',
  ]

  for (const value of formats) {
    let lookedUpMobile = ''
    const worker = workerFixture()
    const resolved = await otpModule.resolveWorkerForOtp(value, {
      findWorkersByMobile: async (mobile: string) => {
        lookedUpMobile = mobile
        return [worker]
      },
      createWorker: async () => assert.fail('existing worker must not be created again'),
    })
    assert.equal(mobileModule.normalizeIndianWorkerMobile(value), canonicalMobile)
    assert.equal(lookedUpMobile, canonicalMobile)
    assert.equal(resolved.id, worker.id)
  }
})

test('new mobile creates one worker and allows one provider invocation', async () => {
  let worker: ReturnType<typeof workerFixture> | null = null
  let insertCalls = 0
  let providerCalls = 0
  const resolved = await otpModule.resolveWorkerForOtp(canonicalMobile, {
    findWorkersByMobile: async () => worker ? [worker] : [],
    createWorker: async mobile => {
      insertCalls += 1
      worker = workerFixture({ mobile })
    },
  })
  providerCalls += 1

  assert.equal(resolved.id, 'worker-existing')
  assert.equal(insertCalls, 1)
  assert.equal(providerCalls, 1)
})

test('two concurrent first-time requests create at most one worker and reuse it safely', async () => {
  let worker: ReturnType<typeof workerFixture> | null = null
  let initialLookups = 0
  let releaseInitialLookups: () => void = () => {}
  const bothLookedUp = new Promise<void>(resolve => {
    releaseInitialLookups = resolve
  })
  let insertAttempts = 0
  let successfulInserts = 0

  const dependencies = {
    findWorkersByMobile: async () => {
      if (!worker) {
        initialLookups += 1
        if (initialLookups === 2) releaseInitialLookups()
        await bothLookedUp
      }
      return worker ? [worker] : []
    },
    createWorker: async () => {
      insertAttempts += 1
      if (worker) {
        throw {
          code: '23505',
          message: 'duplicate key',
          details: 'labour_workers mobile',
        }
      }
      worker = workerFixture()
      successfulInserts += 1
    },
  }

  const results = await Promise.all([
    otpModule.resolveWorkerForOtp(canonicalMobile, dependencies),
    otpModule.resolveWorkerForOtp(`+91${canonicalMobile}`, dependencies),
  ])

  assert.equal(insertAttempts, 2)
  assert.equal(successfulInserts, 1)
  assert.deepEqual(results.map(result => result.id), ['worker-existing', 'worker-existing'])
})

test('ambiguous race recovery stops safely without exposing database details', async () => {
  let lookupCalls = 0
  await assert.rejects(
    otpModule.resolveWorkerForOtp(canonicalMobile, {
      findWorkersByMobile: async () => {
        lookupCalls += 1
        return lookupCalls === 1
          ? []
          : [workerFixture({ id: 'worker-a' }), workerFixture({ id: 'worker-b' })]
      },
      createWorker: async () => {
        throw {
          code: '23505',
          message: 'duplicate key',
          details: 'labour_workers mobile',
        }
      },
    }),
    error => {
      assert.equal((error as Error).message, otpModule.WORKER_OTP_REQUEST_FAILED_MESSAGE)
      assert.doesNotMatch((error as Error).message, /duplicate|database|constraint|labour_workers/i)
      return true
    },
  )
})

test('provider failure cannot create an additional worker on retry', async () => {
  let worker: ReturnType<typeof workerFixture> | null = null
  let successfulInserts = 0
  const resolveWorker = () => otpModule.resolveWorkerForOtp(canonicalMobile, {
    findWorkersByMobile: async () => worker ? [worker] : [],
    createWorker: async () => {
      successfulInserts += 1
      worker = workerFixture()
    },
  })

  await resolveWorker()
  const safeProviderMessage = otpModule.getSafeWorkerAuthErrorMessage(
    new Error('OTP delivery failed: synthetic provider detail'),
    'Failed to request OTP.',
  )
  await resolveWorker()

  assert.equal(successfulInserts, 1)
  assert.equal(safeProviderMessage, otpModule.WORKER_OTP_DELIVERY_FAILED_MESSAGE)
  assert.doesNotMatch(safeProviderMessage, /synthetic provider detail/i)
})

test('request route preserves the successful Flutter response contract', async () => {
  ;(globalThis as Record<string, unknown>)[routeMockKey] = {
    requestWorkerOtp: async () => ({
      message: 'OTP sent successfully to your mobile number.',
      mobile: canonicalMobile,
      expiresAt: '2026-09-27T12:00:00.000Z',
      workerId: 'worker-existing',
      otpSessionToken: 'synthetic-session-token',
    }),
    verifyWorkerOtpCode: async () => ({ token: 'unused', workerId: 'worker-existing' }),
    getWorkerAppDashboard: async () => ({}),
  }

  const response = await requestRoute.POST(makeRequest({ mobile: `+91${canonicalMobile}` }))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(Object.keys(body), [
    'success',
    'message',
    'mobile',
    'expiresAt',
    'workerId',
    'otpSessionToken',
  ])
  assert.equal(body.success, true)
  assert.equal(body.workerId, 'worker-existing')
})

test('request and verify routes never return raw database or provider errors', async () => {
  ;(globalThis as Record<string, unknown>)[routeMockKey] = {
    requestWorkerOtp: async () => {
      throw new Error('database insert failed with internal constraint detail')
    },
    verifyWorkerOtpCode: async () => {
      throw new Error('Supabase query failed with internal SQL detail')
    },
    getWorkerAppDashboard: async () => ({}),
  }

  const requestResponse = await requestRoute.POST(makeRequest({ mobile: canonicalMobile }))
  const requestBody = await requestResponse.json()
  const verifyResponse = await verifyRoute.POST(new Request(
    'https://example.test/api/labour/worker/auth/verify-otp',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mobile: canonicalMobile, otpCode: '000000' }),
    },
  ))
  const verifyBody = await verifyResponse.json()

  assert.equal(requestResponse.status, 400)
  assert.equal(verifyResponse.status, 400)
  assert.deepEqual(requestBody, { error: 'Failed to request OTP.' })
  assert.deepEqual(verifyBody, { error: 'Failed to verify OTP.' })
  assert.doesNotMatch(JSON.stringify([requestBody, verifyBody]), /database|sql|supabase|constraint/i)
})

test('OTP auth uses uncapped exact reads and retains the database concurrency guard', () => {
  const lookupStart = marketplaceSource.indexOf('export const findLabourWorkersByMobile')
  const lookupEnd = marketplaceSource.indexOf('export const findLabourWorkerById', lookupStart)
  const lookupSource = marketplaceSource.slice(lookupStart, lookupEnd)

  assert.ok(lookupStart > 0)
  assert.match(lookupSource, /\.in\('mobile', getIndianWorkerMobileLookupVariants\(canonicalMobile\)\)/)
  assert.match(lookupSource, /\.ilike\('mobile', separatorTolerantPattern\)/)
  assert.doesNotMatch(lookupSource, /\.limit\(/)
  assert.match(workerAppSource, /resolveWorkerForOtp\(mobile/)
  assert.match(workerAppSource, /findWorkersByMobile: findLabourWorkersByMobile/)
  assert.match(workerAppSource, /const worker = await findLabourWorkerById\(session\.workerId\)/)
  assert.match(workerAppSource, /const worker = await findLabourWorkerById\(workerId\)/)
  assert.match(otpModuleSource, /isWorkerMobileUniqueConflict/)
})
