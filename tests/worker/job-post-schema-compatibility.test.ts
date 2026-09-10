import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const marketplaceSource = readFileSync(
  path.join(process.cwd(), 'lib', 'labour-marketplace.ts'),
  'utf8',
)

const extractVariableInitializer = (source: string, variableName: string) => {
  const sourceFile = ts.createSourceFile(
    `${variableName}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  let initializer = ''

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      initializer = node.initializer.getText(sourceFile)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  assert.ok(initializer, `Expected to find ${variableName} in production source`)
  return initializer
}

const transpiled = ts.transpileModule(
  `export const writeJobPostWithSchemaCompatibility = ${extractVariableInitializer(
    marketplaceSource,
    'writeJobPostWithSchemaCompatibility',
  )}`,
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
)

const compatibilityModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`
)

type WriteError = {
  code?: string | null
  message?: string | null
} | null

type WriteResult = {
  error: WriteError
}

type WriteCall = {
  operation: 'create' | 'update'
  payload: Record<string, unknown>
  write: (payload: Record<string, unknown>) => Promise<WriteResult>
}

const writeWithCompatibility = compatibilityModule.writeJobPostWithSchemaCompatibility as (
  operation: WriteCall['operation'],
  payload: WriteCall['payload'],
  write: WriteCall['write'],
) => Promise<WriteResult>

const fullJobPayload = {
  id: 'job-qa-preview',
  company_id: 'company-qa-preview',
  plan_id: 'plan-standard',
  category_id: 'category-stitching',
  title: 'Synthetic QA job',
  description: 'Synthetic compatibility test',
  city: 'Jaipur',
  location_label: 'Jaipur | Day shift',
  latitude: 26.9124,
  longitude: 75.7873,
  workers_needed: 4,
  wage_amount: 800,
  validity_days: 30,
  status: 'draft',
  review_status: 'under_review',
  review_reason: 'Synthetic review note',
  submitted_at: '2026-09-10T08:00:00.000Z',
  reviewed_at: null,
  published_at: null,
  expires_at: null,
  created_at: '2026-09-10T08:00:00.000Z',
  updated_at: '2026-09-10T08:00:00.000Z',
}

const missingReviewReasonError: WriteError = {
  code: 'PGRST204',
  message: "Could not find the 'review_reason' column of 'labour_job_posts' in the schema cache",
}

const expectedCompatiblePayload = () => {
  const payload = { ...fullJobPayload }
  delete (payload as Partial<typeof fullJobPayload>).review_status
  delete (payload as Partial<typeof fullJobPayload>).review_reason
  delete (payload as Partial<typeof fullJobPayload>).submitted_at
  delete (payload as Partial<typeof fullJobPayload>).reviewed_at
  return payload
}

test('company job creation succeeds after one confirmed review-column compatibility retry', async () => {
  const payloads: Record<string, unknown>[] = []
  const result = await writeWithCompatibility('create', fullJobPayload, async payload => {
    payloads.push(payload)
    return { error: payloads.length === 1 ? missingReviewReasonError : null }
  })

  assert.equal(result.error, null)
  assert.equal(payloads.length, 2)
  assert.deepEqual(payloads[0], fullJobPayload)
  assert.deepEqual(payloads[1], expectedCompatiblePayload())
})

test('Admin job update succeeds after one confirmed review-column compatibility retry', async () => {
  const payloads: Record<string, unknown>[] = []
  const updatePayload = { ...fullJobPayload }
  delete (updatePayload as Partial<typeof fullJobPayload>).id
  delete (updatePayload as Partial<typeof fullJobPayload>).created_at

  const result = await writeWithCompatibility('update', updatePayload, async payload => {
    payloads.push(payload)
    return { error: payloads.length === 1 ? missingReviewReasonError : null }
  })

  assert.equal(result.error, null)
  assert.equal(payloads.length, 2)
  assert.equal(payloads[1].title, updatePayload.title)
  assert.equal(payloads[1].status, updatePayload.status)
})

test('supported review schema uses one write attempt and keeps every review value', async () => {
  const payloads: Record<string, unknown>[] = []
  const result = await writeWithCompatibility('create', fullJobPayload, async payload => {
    payloads.push(payload)
    return { error: null }
  })

  assert.equal(result.error, null)
  assert.equal(payloads.length, 1)
  assert.deepEqual(payloads[0], fullJobPayload)
})

test('each confirmed missing review metadata column permits the single compatibility retry', async () => {
  for (const column of ['review_status', 'review_reason', 'submitted_at', 'reviewed_at']) {
    let attempts = 0
    const result = await writeWithCompatibility('update', fullJobPayload, async () => {
      attempts += 1
      return attempts === 1
        ? {
            error: {
              code: 'PGRST204',
              message: `Could not find the '${column}' column of 'labour_job_posts' in the schema cache`,
            },
          }
        : { error: null }
    })

    assert.equal(result.error, null)
    assert.equal(attempts, 2, column)
  }
})

test('authentication, authorization, network, validation, and unrelated database errors never retry', async () => {
  const errors: WriteError[] = [
    { code: 'PGRST301', message: 'Invalid authentication token' },
    { code: '42501', message: 'permission denied for table labour_job_posts' },
    { code: 'PGRST000', message: 'Could not connect to the database' },
    { code: '23514', message: 'check constraint violation' },
    {
      code: 'PGRST204',
      message: "Could not find the 'title' column of 'labour_job_posts' in the schema cache",
    },
    {
      code: 'PGRST204',
      message: "Could not find the 'review_reason' column of 'another_table' in the schema cache",
    },
  ]

  for (const expectedError of errors) {
    let attempts = 0
    const result = await writeWithCompatibility('create', fullJobPayload, async () => {
      attempts += 1
      return { error: expectedError }
    })

    assert.equal(attempts, 1, expectedError?.message || '')
    assert.deepEqual(result.error, expectedError)
  }
})

test('retry payload preserves every supported job-post field exactly', async () => {
  const payloads: Record<string, unknown>[] = []
  await writeWithCompatibility('create', fullJobPayload, async payload => {
    payloads.push(payload)
    return { error: payloads.length === 1 ? missingReviewReasonError : null }
  })

  assert.deepEqual(payloads[1], expectedCompatiblePayload())
  const supportedFields = [
    'id',
    'company_id',
    'plan_id',
    'category_id',
    'title',
    'description',
    'city',
    'location_label',
    'latitude',
    'longitude',
    'workers_needed',
    'wage_amount',
    'validity_days',
    'status',
    'published_at',
    'expires_at',
    'created_at',
    'updated_at',
  ] as const

  for (const field of supportedFields) {
    assert.deepEqual(payloads[1][field], fullJobPayload[field], field)
  }
})

test('failed create attempt cannot produce a duplicate before the successful retry', async () => {
  let attempts = 0
  const insertedIds: string[] = []
  const result = await writeWithCompatibility('create', fullJobPayload, async payload => {
    attempts += 1
    if (attempts === 1) return { error: missingReviewReasonError }
    insertedIds.push(String(payload.id))
    return { error: null }
  })

  assert.equal(result.error, null)
  assert.equal(attempts, 2)
  assert.deepEqual(insertedIds, ['job-qa-preview'])
})

test('a failed compatibility retry remains a failure and is not reported as success', async () => {
  let attempts = 0
  const retryError = { code: '23505', message: 'duplicate key value violates unique constraint' }
  const result = await writeWithCompatibility('create', fullJobPayload, async () => {
    attempts += 1
    return { error: attempts === 1 ? missingReviewReasonError : retryError }
  })

  assert.equal(attempts, 2)
  assert.deepEqual(result.error, retryError)
})

test('missing-column text without PGRST204 does not activate compatibility handling', async () => {
  let attempts = 0
  const nonPostgrestError = { code: 'XX000', message: missingReviewReasonError?.message }
  const result = await writeWithCompatibility('update', fullJobPayload, async () => {
    attempts += 1
    return { error: nonPostgrestError }
  })

  assert.equal(attempts, 1)
  assert.deepEqual(result.error, nonPostgrestError)
})

test('both centralized job-post database builders use the compatibility writer', () => {
  assert.match(
    marketplaceSource,
    /writeJobPostWithSchemaCompatibility\(\s*'create',\s*jobPostPayload,/,
  )
  assert.match(
    marketplaceSource,
    /writeJobPostWithSchemaCompatibility\(\s*'update',\s*jobPostPayload,/,
  )
})

test('compatibility handling has no WhatsApp, notification, wallet, payment, KYC, or visibility dependency', () => {
  const initializer = extractVariableInitializer(
    marketplaceSource,
    'writeJobPostWithSchemaCompatibility',
  )

  for (const forbiddenDependency of [
    'whatsapp',
    'notification',
    'wallet',
    'payment',
    'kyc',
    'is_visible',
  ]) {
    assert.equal(initializer.toLowerCase().includes(forbiddenDependency), false, forbiddenDependency)
  }
})
