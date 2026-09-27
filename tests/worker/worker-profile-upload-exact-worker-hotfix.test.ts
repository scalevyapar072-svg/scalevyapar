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

const assetModule = await import(pathToFileURL(path.join(
  workspaceRoot,
  'lib',
  'labour-worker-registration-assets.ts',
)).href)
const {
  getWorkerRegistrationAssetPrefix,
  resolveWorkerRegistrationAssetPath,
  uploadAndLinkWorkerRegistrationAsset,
} = assetModule

const workerAppSource = readSource('lib', 'labour-worker-app.ts')
const assetSource = readSource('lib', 'labour-worker-registration-assets.ts')
const uploadRouteSource = readSource('app', 'api', 'labour', 'worker', 'upload', 'route.ts')
const registerRouteSource = readSource('app', 'api', 'labour', 'worker', 'register', 'route.ts')

const authenticatedWorkerId = 'worker-synthetic-1112'
const makePayload = (
  documentKind: 'profile_photo' | 'identity_proof' | 'resume_document' = 'profile_photo',
) => ({
  documentKind,
  fileName: 'synthetic.png',
  contentType: 'image/png',
  bytes: Buffer.from('synthetic-isolated-bytes'),
})
const makeStoredAsset = (
  documentKind: 'profile_photo' | 'identity_proof' | 'resume_document',
) => ({
  storagePath: `${getWorkerRegistrationAssetPrefix(authenticatedWorkerId, documentKind)}synthetic.png`,
  bucket: 'labour-worker-uploads',
  fileName: 'synthetic.png',
})

test('OTP-authenticated existing and Admin-created workers upload and link to the exact worker', async t => {
  for (const accountKind of ['registration-incomplete', 'Admin-created', 'beyond-row-cap']) {
    await t.test(accountKind, async () => {
      const calls: string[] = []
      const stored = makeStoredAsset('profile_photo')
      const result = await uploadAndLinkWorkerRegistrationAsset(
        authenticatedWorkerId,
        makePayload(),
        {
          findWorkerById: async (workerId: string) => {
            calls.push(`find:${workerId}`)
            return { id: workerId, accountKind }
          },
          storeAsset: async (workerId: string) => {
            calls.push(`store:${workerId}`)
            return stored
          },
          linkAsset: async (workerId: string, documentKind: string, storagePath: string) => {
            calls.push(`link:${workerId}:${documentKind}:${storagePath}`)
          },
          removeAsset: async () => assert.fail('successful linkage must not remove the object'),
        },
      )

      assert.deepEqual(result, stored)
      assert.deepEqual(calls, [
        `find:${authenticatedWorkerId}`,
        `store:${authenticatedWorkerId}`,
        `link:${authenticatedWorkerId}:profile_photo:${stored.storagePath}`,
      ])
    })
  }
})

test('identity documents are linked independently from profile photos', async () => {
  const links: Array<{ documentKind: string, storagePath: string }> = []
  for (const documentKind of ['profile_photo', 'identity_proof'] as const) {
    await uploadAndLinkWorkerRegistrationAsset(
      authenticatedWorkerId,
      makePayload(documentKind),
      {
        findWorkerById: async () => ({ id: authenticatedWorkerId }),
        storeAsset: async () => makeStoredAsset(documentKind),
        linkAsset: async (_workerId: string, kind: string, storagePath: string) => {
          links.push({ documentKind: kind, storagePath })
        },
        removeAsset: async () => assert.fail('successful linkage must not remove the object'),
      },
    )
  }

  assert.deepEqual(links.map(link => link.documentKind), ['profile_photo', 'identity_proof'])
  assert.match(links[0].storagePath, /\/profile_photo-/)
  assert.match(links[1].storagePath, /\/identity_proof-/)
})

test('upload failure never marks a profile photo as completed', async () => {
  let linkCalls = 0
  let cleanupCalls = 0
  await assert.rejects(
    uploadAndLinkWorkerRegistrationAsset(
      authenticatedWorkerId,
      makePayload(),
      {
        findWorkerById: async () => ({ id: authenticatedWorkerId }),
        storeAsset: async () => {
          throw new Error('Failed to upload worker document.')
        },
        linkAsset: async () => {
          linkCalls += 1
        },
        removeAsset: async () => {
          cleanupCalls += 1
        },
      },
    ),
    /Failed to upload worker document\./,
  )
  assert.equal(linkCalls, 0)
  assert.equal(cleanupCalls, 0)
})

test('link failure rolls back only the newly uploaded object and hides the cause', async () => {
  const stored = makeStoredAsset('profile_photo')
  const removed: string[] = []
  await assert.rejects(
    uploadAndLinkWorkerRegistrationAsset(
      authenticatedWorkerId,
      makePayload(),
      {
        findWorkerById: async () => ({ id: authenticatedWorkerId }),
        storeAsset: async () => stored,
        linkAsset: async () => {
          throw new Error('database column detail that must stay private')
        },
        removeAsset: async (storagePath: string) => {
          removed.push(storagePath)
        },
      },
    ),
    error => {
      assert.equal((error as Error).message, 'Failed to link uploaded worker document.')
      assert.doesNotMatch((error as Error).message, /database|column|storage/i)
      return true
    },
  )
  assert.deepEqual(removed, [stored.storagePath])
})

test('persisted upload links make profile-save retries idempotent', () => {
  const profilePath = makeStoredAsset('profile_photo').storagePath
  const identityPath = makeStoredAsset('identity_proof').storagePath

  assert.deepEqual(
    resolveWorkerRegistrationAssetPath({
      workerId: authenticatedWorkerId,
      documentKind: 'profile_photo',
      incomingPath: '',
      existingPath: profilePath,
    }),
    { path: profilePath, requiresExistenceCheck: false },
  )
  assert.deepEqual(
    resolveWorkerRegistrationAssetPath({
      workerId: authenticatedWorkerId,
      documentKind: 'identity_proof',
      incomingPath: identityPath,
      existingPath: identityPath,
    }),
    { path: identityPath, requiresExistenceCheck: false },
  )
})

test('only authenticated-worker paths may be attached and authorized replacements stay supported', () => {
  const replacementPath = makeStoredAsset('profile_photo').storagePath
  assert.deepEqual(
    resolveWorkerRegistrationAssetPath({
      workerId: authenticatedWorkerId,
      documentKind: 'profile_photo',
      incomingPath: replacementPath,
      existingPath: 'workers/worker-synthetic-1112/profile_photo-old.png',
    }),
    { path: replacementPath, requiresExistenceCheck: true },
  )

  assert.throws(
    () => resolveWorkerRegistrationAssetPath({
      workerId: authenticatedWorkerId,
      documentKind: 'profile_photo',
      incomingPath: 'workers/another-worker/profile_photo-private.png',
      existingPath: '',
    }),
    /does not belong to the authenticated worker/,
  )
  assert.throws(
    () => resolveWorkerRegistrationAssetPath({
      workerId: authenticatedWorkerId,
      documentKind: 'identity_proof',
      incomingPath: `${getWorkerRegistrationAssetPrefix(authenticatedWorkerId, 'profile_photo')}wrong-kind.png`,
      existingPath: '',
    }),
    /does not belong to the authenticated worker/,
  )
})

test('the implementation uses exact reads and narrowly scoped linkage without lifecycle side effects', () => {
  const uploadStart = workerAppSource.indexOf('export const uploadWorkerRegistrationAsset')
  const adminUploadStart = workerAppSource.indexOf('export const uploadAdminWorkerRegistrationAsset', uploadStart)
  const uploadBlock = workerAppSource.slice(uploadStart, adminUploadStart)
  const linkStart = workerAppSource.indexOf('const linkWorkerRegistrationAsset')
  const removeStart = workerAppSource.indexOf('const removeWorkerRegistrationAsset', linkStart)
  const linkBlock = workerAppSource.slice(linkStart, removeStart)
  const registerStart = workerAppSource.indexOf('export const completeWorkerAppRegistration')
  const profileUpdateStart = workerAppSource.indexOf('export const updateWorkerAppProfile', registerStart)
  const registerBlock = workerAppSource.slice(registerStart, profileUpdateStart)

  assert.match(uploadBlock, /findWorkerById: findLabourWorkerById/)
  assert.doesNotMatch(uploadBlock, /getLabourMarketplaceSnapshot|createLabourEntity|referral/)
  assert.match(linkBlock, /\.from\('labour_workers'\)/)
  assert.match(linkBlock, /\.eq\('id', workerId\)/)
  assert.match(linkBlock, /\[column\]: storagePath/)
  assert.doesNotMatch(linkBlock, /status|isVisible|kyc|wallet|payment|referral|mobile/)
  assert.match(registerBlock, /findLabourWorkerById\(workerId\)/)
  assert.match(registerBlock, /resolvedProfilePhoto\.path/)
  assert.match(registerBlock, /resolvedIdentityProof\.path/)
  assert.match(registerBlock, /assertWorkerRegistrationPayload\(\{[\s\S]*profilePhotoPath: nextWorker\.profilePhotoPath/)
  assert.match(registerBlock, /if \(wasRegistrationCompleted\)[\s\S]*not-first-registration/)
  assert.match(assetSource, /normalizedIncomingPath === normalizedExistingPath/)
  assert.doesNotMatch(assetSource, /createWorker|referral|kycStatus|wallet|payment/)
})

const nextServerStubUrl = toDataUrl(`
  export class NextRequest extends Request {}
  export const NextResponse = { json: (body, init) => Response.json(body, init) }
`)
const uploadAdminSettingsStubUrl = toDataUrl('export const getLabourAdminSettings = async () => ({})')
const uploadWorkerAppStubUrl = toDataUrl(`
  export const requireWorkerApp = async () => ({ workerId: 'stub-worker' })
  export const uploadWorkerRegistrationAsset = async () => ({})
`)
const uploadRoute = await import(transpileToDataUrl(
  uploadRouteSource
    .replace("'next/server'", `'${nextServerStubUrl}'`)
    .replace("'@/lib/labour-admin-settings'", `'${uploadAdminSettingsStubUrl}'`)
    .replace("'@/lib/labour-worker-app'", `'${uploadWorkerAppStubUrl}'`),
))

const registerWorkerAppStubUrl = toDataUrl(`
  export const completeWorkerAppRegistration = async () => ({})
  export const requireWorkerApp = async () => ({ workerId: 'stub-worker' })
`)
const referralStubUrl = toDataUrl('export const parseRozgarRegistrationReferralContext = () => null')
const guardStubUrl = toDataUrl(`
  export const shouldBlockWorkerLifecycleMutation = () => false
  export const buildWorkerLifecycleMutationBlockedResponse = () =>
    Response.json({ error: 'blocked' }, { status: 503 })
`)
const registerRoute = await import(transpileToDataUrl(
  registerRouteSource
    .replace("'@/lib/labour-worker-app'", `'${registerWorkerAppStubUrl}'`)
    .replace("'@/lib/rozgar-referral-context'", `'${referralStubUrl}'`)
    .replace("'@/lib/worker-lifecycle-mutation-guard'", `'${guardStubUrl}'`),
))

const syntheticUploadRequest = () => {
  const form = new FormData()
  form.set('documentKind', 'profile_photo')
  form.set('file', new Blob(['synthetic'], { type: 'image/png' }), 'synthetic.png')
  return new Request('https://example.test/api/labour/worker/upload', {
    method: 'POST',
    body: form,
  })
}

test('raw database and Storage errors never reach the upload or registration response', async () => {
  const rawUploadError = 'Storage SQL policy detail that must stay private'
  const uploadResponse = await uploadRoute.handleWorkerUploadPost(
    syntheticUploadRequest(),
    {
      requireWorkerApp: async () => ({ workerId: authenticatedWorkerId }),
      getLabourAdminSettings: async () => ({
        settings: {
          uploadRules: {
            allowedPhotoExtensions: ['png'],
            allowedDocumentExtensions: ['png', 'pdf'],
            maxPhotoSizeMb: 5,
            maxDocumentSizeMb: 5,
          },
        },
      }),
      uploadWorkerRegistrationAsset: async () => {
        throw new Error(rawUploadError)
      },
    },
  )
  const uploadBody = await uploadResponse.json()

  const rawRegistrationError = 'database constraint and worker row detail'
  const registerResponse = await registerRoute.handleWorkerRegisterPost(
    new Request('https://example.test/api/labour/worker/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
    {
      requireWorkerApp: async () => ({ workerId: authenticatedWorkerId }),
      completeWorkerAppRegistration: async () => {
        throw new Error(rawRegistrationError)
      },
      mutationRuntime: { vercelEnv: 'production' },
    },
  )
  const registerBody = await registerResponse.json()

  assert.deepEqual(uploadBody, { error: 'Failed to upload worker document.' })
  assert.deepEqual(registerBody, { error: 'Failed to complete worker registration.' })
  assert.doesNotMatch(JSON.stringify([uploadBody, registerBody]), /sql|policy|database|constraint|row detail/i)
})

test('OTP wiring and unrelated Admin/company/payment modules are not changed by this hotfix', () => {
  assert.match(workerAppSource, /export const requestWorkerOtp = async/)
  assert.match(workerAppSource, /export const verifyWorkerOtpCode = async/)
  assert.match(uploadRouteSource, /requireWorkerApp/)
  assert.doesNotMatch(uploadRouteSource, /clientWorkerId|formData\.get\('workerId'\)/)
})
