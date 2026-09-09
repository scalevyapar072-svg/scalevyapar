import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const workspaceRoot = process.cwd()
const labourAdminPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'admin', 'labour', 'page.tsx'),
  'utf8',
)
const workerFileRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'admin', 'labour', 'worker-file', 'route.ts'),
  'utf8',
)
const marketplaceSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-marketplace.ts'),
  'utf8',
)
const workerAppSource = readFileSync(
  path.join(workspaceRoot, 'lib', 'labour-worker-app.ts'),
  'utf8',
)

const toDataUrl = (source: string) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`

const transpileToDataUrl = (source: string) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })

  return toDataUrl(transpiled.outputText)
}

const extractVariableInitializer = (
  source: string,
  variableName: string,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS,
) => {
  const sourceFile = ts.createSourceFile(
    `${variableName}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
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

const saveWorkerExpression = extractVariableInitializer(
  labourAdminPageSource,
  'saveWorker',
  ts.ScriptKind.TSX,
)

const saveWorkerHarnessModule = await import(
  transpileToDataUrl(`
    export const createSaveWorker = (dependencies: any) => {
      const {
        workerSaveBusy,
        setError,
        setSaved,
        buildWorkerEditorDraft,
        workerDraft,
        validateWorker,
        editingWorkerId,
        workerPhotoFile,
        validateWorkerKycFileSelection,
        workerIdentityDocumentFile,
        setWorkerDraft,
        setWorkerSaveBusy,
        persistEntity,
        buildWorkerSavePayload,
        resetWorkerDraft,
        showSaved,
        snapshot,
        requestWorkerFileUpload,
        replaceSnapshot,
        requestWorkerMetadataUpdate,
        setSelectedWorkerReviewId,
        buildWorkerKycReviewDraft,
        setWorkerKycReviewDraft,
        setWorkerKycMetadataDraft,
        setWorkerKycReviewValidation,
        setIsWorkerKycReviewOpen,
      } = dependencies

      const saveWorker = ${saveWorkerExpression}
      return saveWorker
    }
  `),
)

type WorkerRecord = {
  id: string
  mobile: string
  fullName: string
  isVisible: boolean
  status: string
  profilePhotoPath: string
  identityProofType: string
  identityProofNumber: string
  identityProofPath: string
}

type SaveHarnessOptions = {
  busy?: boolean
  creationReturnsNull?: boolean
  creationThrows?: boolean
  photoFile?: File | null
  identityFile?: File | null
  photoUploadFails?: boolean
  identityUploadFails?: boolean
  metadataFails?: boolean
  identityProofType?: string
  identityProofNumber?: string
}

const makePngFile = (name: string) =>
  new File(
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
    name,
    { type: 'image/png' },
  )

const makeWorker = (overrides: Partial<WorkerRecord> = {}): WorkerRecord => ({
  id: 'worker-created',
  mobile: '0000000000',
  fullName: 'QA KYC PREVIEW TEST — DO NOT CONTACT',
  isVisible: false,
  status: 'pending',
  profilePhotoPath: '',
  identityProofType: '',
  identityProofNumber: '',
  identityProofPath: '',
  ...overrides,
})

const makeSaveHarness = (options: SaveHarnessOptions = {}) => {
  const createdWorker = makeWorker()
  const initialSnapshot = { workers: [] as WorkerRecord[] }
  let currentSnapshot = { workers: [createdWorker] }
  const calls = {
    persist: [] as Array<{ method: string; entityType: string; payload: Record<string, unknown>; id?: string }>,
    uploads: [] as Array<{ workerId: string; documentKind: string; file: File }>,
    metadata: [] as Array<{ workerId: string; identityProofType: string; identityProofNumber: string }>,
  }
  const events: string[] = []
  const state = {
    busyValues: [] as boolean[],
    errors: [] as string[],
    saved: [] as string[],
    resetCount: 0,
    selectedWorkerId: '',
    reviewOpen: false,
    snapshotHistory: [] as Array<{ workers: WorkerRecord[] }>,
    metadataDraft: null as null | { identityProofType: string; identityProofNumber: string },
  }

  const workerDraft = makeWorker({
    id: '',
    identityProofType: options.identityProofType || '',
    identityProofNumber: options.identityProofNumber || '',
  })

  const dependencies = {
    workerSaveBusy: options.busy || false,
    setError: (message: string) => state.errors.push(message),
    setSaved: (message: string) => state.saved.push(message),
    buildWorkerEditorDraft: (draft: WorkerRecord) => ({ ...draft }),
    workerDraft,
    validateWorker: () => '',
    editingWorkerId: '',
    workerPhotoFile: options.photoFile || null,
    validateWorkerKycFileSelection: () => '',
    workerIdentityDocumentFile: options.identityFile || null,
    setWorkerDraft: () => undefined,
    setWorkerSaveBusy: (value: boolean) => state.busyValues.push(value),
    persistEntity: async (
      method: string,
      entityType: string,
      payload: Record<string, unknown>,
      id?: string,
    ) => {
      events.push('create')
      calls.persist.push({ method, entityType, payload, id })
      if (options.creationThrows) throw new Error('Synthetic worker creation failure')
      if (options.creationReturnsNull) return null
      currentSnapshot = { workers: [createdWorker] }
      return currentSnapshot
    },
    buildWorkerSavePayload: (draft: Record<string, unknown>) => ({ ...draft }),
    resetWorkerDraft: () => {
      state.resetCount += 1
    },
    showSaved: (message: string) => state.saved.push(message),
    snapshot: initialSnapshot,
    requestWorkerFileUpload: async (
      workerId: string,
      documentKind: string,
      file: File,
    ) => {
      events.push(`upload:${documentKind}`)
      calls.uploads.push({ workerId, documentKind, file })
      if (documentKind === 'profile_photo' && options.photoUploadFails) {
        throw new Error('Synthetic photo storage failure')
      }
      if (documentKind === 'identity_proof' && options.identityUploadFails) {
        throw new Error('Synthetic document storage failure')
      }

      const field = documentKind === 'profile_photo' ? 'profilePhotoPath' : 'identityProofPath'
      currentSnapshot = {
        workers: currentSnapshot.workers.map(worker =>
          worker.id === workerId
            ? { ...worker, [field]: `workers/${workerId}/${documentKind}/synthetic.png` }
            : worker,
        ),
      }
      return { snapshot: currentSnapshot }
    },
    replaceSnapshot: (nextSnapshot: { workers: WorkerRecord[] }) => {
      currentSnapshot = nextSnapshot
      state.snapshotHistory.push(nextSnapshot)
    },
    requestWorkerMetadataUpdate: async (
      workerId: string,
      identityProofType: string,
      identityProofNumber: string,
    ) => {
      events.push('metadata')
      calls.metadata.push({ workerId, identityProofType, identityProofNumber })
      if (options.metadataFails) throw new Error('Synthetic metadata update failure')

      currentSnapshot = {
        workers: currentSnapshot.workers.map(worker =>
          worker.id === workerId
            ? { ...worker, identityProofType, identityProofNumber }
            : worker,
        ),
      }
      return currentSnapshot
    },
    setSelectedWorkerReviewId: (workerId: string) => {
      state.selectedWorkerId = workerId
    },
    buildWorkerKycReviewDraft: (worker: WorkerRecord) => ({ workerId: worker.id }),
    setWorkerKycReviewDraft: () => undefined,
    setWorkerKycMetadataDraft: (draft: { identityProofType: string; identityProofNumber: string }) => {
      state.metadataDraft = draft
    },
    setWorkerKycReviewValidation: () => undefined,
    setIsWorkerKycReviewOpen: (open: boolean) => {
      state.reviewOpen = open
    },
  }

  return {
    saveWorker: saveWorkerHarnessModule.createSaveWorker(dependencies) as () => Promise<void>,
    calls,
    events,
    state,
  }
}

const workerFileMockKey = '__scaleVyaparWorkerFileMocks'

const loadWorkerFileRoute = async () => {
  const nextServerStubUrl = toDataUrl(`
    export class NextRequest extends Request {
      get nextUrl() { return new URL(this.url) }
    }
    export class NextResponse extends Response {
      static json(body, init = {}) {
        const headers = new Headers(init.headers || {})
        headers.set('content-type', 'application/json')
        return new NextResponse(JSON.stringify(body), { ...init, headers })
      }
      static redirect(url, status = 307) {
        return new NextResponse(null, { status, headers: { location: String(url) } })
      }
    }
  `)
  const authStubUrl = toDataUrl(`
    export const requireAdmin = (...args) =>
      globalThis.${workerFileMockKey}.requireAdmin(...args)
  `)
  const marketplaceStubUrl = toDataUrl(`
    export const getLabourMarketplaceSnapshot = (...args) =>
      globalThis.${workerFileMockKey}.getLabourMarketplaceSnapshot(...args)
    export const updateLabourEntity = (...args) =>
      globalThis.${workerFileMockKey}.updateLabourEntity(...args)
  `)
  const workerAppStubUrl = toDataUrl(`
    export const uploadWorkerRegistrationAsset = (...args) =>
      globalThis.${workerFileMockKey}.uploadWorkerRegistrationAsset(...args)
  `)
  const supabaseStubUrl = toDataUrl(`
    export const supabaseAdmin = {
      storage: {
        from(bucket) {
          return {
            remove(paths) {
              return globalThis.${workerFileMockKey}.removeStorage(bucket, paths)
            },
            createSignedUrl(path, expiresIn) {
              return globalThis.${workerFileMockKey}.createSignedUrl(bucket, path, expiresIn)
            }
          }
        }
      }
    }
  `)

  const transformed = workerFileRouteSource
    .replace("'next/server'", `'${nextServerStubUrl}'`)
    .replace("'@/lib/auth'", `'${authStubUrl}'`)
    .replace("'@/lib/labour-marketplace'", `'${marketplaceStubUrl}'`)
    .replace("'@/lib/labour-worker-app'", `'${workerAppStubUrl}'`)
    .replace("'@/lib/supabase-admin'", `'${supabaseStubUrl}'`)

  return import(transpileToDataUrl(transformed))
}

const workerFileRoute = await loadWorkerFileRoute()

type WorkerFileMockState = {
  workers: Map<string, WorkerRecord>
  uploads: Array<{ workerId: string; documentKind: string; storagePath: string }>
  updates: Array<{ entityType: string; workerId: string; payload: Record<string, unknown>; actor: string }>
  removals: Array<{ bucket: string; paths: string[] }>
}

const installWorkerFileMocks = (workers: WorkerRecord[]) => {
  const state: WorkerFileMockState = {
    workers: new Map(workers.map(worker => [worker.id, { ...worker }])),
    uploads: [],
    updates: [],
    removals: [],
  }
  let uploadSequence = 0

  ;(globalThis as Record<string, unknown>)[workerFileMockKey] = {
    requireAdmin: async () => ({ email: 'mock-admin@example.test' }),
    getLabourMarketplaceSnapshot: async () => ({
      workers: Array.from(state.workers.values()).map(worker => ({ ...worker })),
    }),
    updateLabourEntity: async (
      entityType: string,
      workerId: string,
      payload: Record<string, unknown>,
      actor: string,
    ) => {
      state.updates.push({ entityType, workerId, payload: { ...payload }, actor })
      const worker = state.workers.get(workerId)
      if (!worker) return null
      state.workers.set(workerId, { ...worker, ...payload } as WorkerRecord)
      return { workers: Array.from(state.workers.values()).map(item => ({ ...item })) }
    },
    uploadWorkerRegistrationAsset: async (
      workerId: string,
      input: { documentKind: string },
    ) => {
      uploadSequence += 1
      const storagePath = `workers/${workerId}/${input.documentKind}/mock-${uploadSequence}.png`
      state.uploads.push({ workerId, documentKind: input.documentKind, storagePath })
      return { storagePath }
    },
    removeStorage: async (bucket: string, paths: string[]) => {
      state.removals.push({ bucket, paths: [...paths] })
      return { data: null, error: null }
    },
    createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/file' }, error: null }),
  }

  return state
}

const makeWorkerFilePostRequest = (
  workerId: string,
  documentKind: 'profile_photo' | 'identity_proof',
) => {
  const formData = new FormData()
  formData.set('workerId', workerId)
  formData.set('documentKind', documentKind)
  formData.set('file', makePngFile(`${documentKind}.png`))
  return new Request('https://example.test/api/admin/labour/worker-file', {
    method: 'POST',
    body: formData,
  })
}

const makeWorkerFileDeleteRequest = (
  workerId: string,
  documentKind: 'profile_photo' | 'identity_proof',
) => new Request('https://example.test/api/admin/labour/worker-file', {
  method: 'DELETE',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ workerId, documentKind }),
})

const visibilityHarnessModule = await import(
  transpileToDataUrl(`
    export const createVisibilityReconciler = () => {
      const isWorkerProfileComplete = ${extractVariableInitializer(workerAppSource, 'isWorkerProfileComplete')}
      const isWorkerRegistrationComplete = ${extractVariableInitializer(workerAppSource, 'isWorkerRegistrationComplete')}
      const getReconciledWorkerVisibility = ${extractVariableInitializer(workerAppSource, 'getReconciledWorkerVisibility')}
      return getReconciledWorkerVisibility
    }
  `),
)

const reconcileVisibility = visibilityHarnessModule.createVisibilityReconciler() as (
  worker: Record<string, unknown>,
  status: string,
) => boolean

const completeVisibilityWorker = (isVisible: boolean) => ({
  fullName: 'Synthetic Worker',
  city: 'Test City',
  categoryIds: ['test-category'],
  profilePhotoPath: 'workers/synthetic/profile.png',
  identityProofType: 'other',
  identityProofNumber: 'QA-PREVIEW-TEST',
  identityProofPath: 'workers/synthetic/identity.png',
  isVisible,
})

test('1. Add Worker creates exactly one worker', async () => {
  const harness = makeSaveHarness()
  await harness.saveWorker()

  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.calls.persist[0].method, 'POST')
  assert.equal(harness.calls.persist[0].entityType, 'workers')
})

test('2. worker creation failure prevents all KYC uploads and metadata updates', async () => {
  const harness = makeSaveHarness({
    creationReturnsNull: true,
    photoFile: makePngFile('photo.png'),
    identityFile: makePngFile('identity.png'),
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  })
  await harness.saveWorker()

  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.calls.uploads.length, 0)
  assert.equal(harness.calls.metadata.length, 0)
})

test('3. successful creation identifies and selects the returned worker ID', async () => {
  const harness = makeSaveHarness()
  await harness.saveWorker()

  assert.equal(harness.state.selectedWorkerId, 'worker-created')
  assert.equal(harness.state.reviewOpen, true)
})

test('4. selected Worker Photo uploads only after worker creation', async () => {
  const harness = makeSaveHarness({ photoFile: makePngFile('photo.png') })
  await harness.saveWorker()

  assert.deepEqual(harness.events, ['create', 'upload:profile_photo'])
  assert.equal(harness.calls.uploads[0].workerId, 'worker-created')
  assert.equal(harness.calls.uploads[0].documentKind, 'profile_photo')
})

test('5. selected Identity Proof Document uploads only after worker creation', async () => {
  const harness = makeSaveHarness({ identityFile: makePngFile('identity.png') })
  await harness.saveWorker()

  assert.deepEqual(harness.events, ['create', 'upload:identity_proof'])
  assert.equal(harness.calls.uploads[0].workerId, 'worker-created')
  assert.equal(harness.calls.uploads[0].documentKind, 'identity_proof')
})

test('6. proof type and proof number are saved against the created worker', async () => {
  const harness = makeSaveHarness({
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  })
  await harness.saveWorker()

  assert.deepEqual(harness.calls.metadata, [{
    workerId: 'worker-created',
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  }])
  assert.deepEqual(harness.state.metadataDraft, {
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  })
})

test('7. an unchecked visibility value remains false in the creation payload', async () => {
  const harness = makeSaveHarness()
  await harness.saveWorker()

  assert.equal(harness.calls.persist[0].payload.isVisible, false)
  assert.equal(harness.calls.persist[0].payload.status, 'pending')
})

test('8. the busy guard prevents duplicate submission work', async () => {
  const harness = makeSaveHarness({
    busy: true,
    photoFile: makePngFile('photo.png'),
    identityFile: makePngFile('identity.png'),
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  })
  await Promise.all([harness.saveWorker(), harness.saveWorker()])

  assert.equal(harness.calls.persist.length, 0)
  assert.equal(harness.calls.uploads.length, 0)
  assert.equal(harness.calls.metadata.length, 0)
  assert.ok(labourAdminPageSource.includes('disabled={workerSaveBusy}'))
})

test('9. photo upload failure keeps the created worker and reports a retry message', async () => {
  const harness = makeSaveHarness({
    photoFile: makePngFile('photo.png'),
    photoUploadFails: true,
  })
  await harness.saveWorker()

  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.state.selectedWorkerId, 'worker-created')
  assert.equal(harness.state.resetCount, 1)
  assert.match(
    harness.state.errors.at(-1) || '',
    /Worker created, but Worker Photo upload failed: Synthetic photo storage failure\. Open KYC Review to retry\./,
  )
  assert.equal(harness.state.saved.at(-1), 'Worker created with KYC follow-up required.')
})

test('10. document upload failure keeps the worker and reports its own retry message', async () => {
  const harness = makeSaveHarness({
    identityFile: makePngFile('identity.png'),
    identityUploadFails: true,
  })
  await harness.saveWorker()

  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.state.selectedWorkerId, 'worker-created')
  assert.match(
    harness.state.errors.at(-1) || '',
    /Worker created, but Identity Proof Document upload failed: Synthetic document storage failure\. Open KYC Review to retry\./,
  )
  assert.doesNotMatch(harness.state.errors.at(-1) || '', /Worker Photo upload failed/)
})

test('11. metadata update failure reports partial completion without losing the worker', async () => {
  const harness = makeSaveHarness({
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
    metadataFails: true,
  })
  await harness.saveWorker()

  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.calls.metadata.length, 1)
  assert.equal(harness.state.selectedWorkerId, 'worker-created')
  assert.match(
    harness.state.errors.at(-1) || '',
    /Worker created, but Identity Proof Type\/Number save failed: Synthetic metadata update failure\. Open KYC Review to retry\./,
  )
})

test('12. file add, replace, and delete operations target only the selected worker', async () => {
  const selected = makeWorker({ id: 'worker-selected' })
  const decoy = makeWorker({
    id: 'worker-decoy',
    mobile: '0000000001',
    profilePhotoPath: 'workers/worker-decoy/profile_photo/untouched.png',
    identityProofPath: 'workers/worker-decoy/identity_proof/untouched.png',
  })
  const state = installWorkerFileMocks([selected, decoy])

  for (const documentKind of ['profile_photo', 'identity_proof'] as const) {
    const addResponse = await workerFileRoute.POST(
      makeWorkerFilePostRequest(selected.id, documentKind),
    )
    assert.equal(addResponse.status, 200)
    const firstPath = state.workers.get(selected.id)?.[
      documentKind === 'profile_photo' ? 'profilePhotoPath' : 'identityProofPath'
    ] || ''
    assert.ok(firstPath.startsWith(`workers/${selected.id}/`))

    const replaceResponse = await workerFileRoute.POST(
      makeWorkerFilePostRequest(selected.id, documentKind),
    )
    assert.equal(replaceResponse.status, 200)
    const replacementPath = state.workers.get(selected.id)?.[
      documentKind === 'profile_photo' ? 'profilePhotoPath' : 'identityProofPath'
    ] || ''
    assert.notEqual(replacementPath, firstPath)

    const deleteResponse = await workerFileRoute.DELETE(
      makeWorkerFileDeleteRequest(selected.id, documentKind),
    )
    assert.equal(deleteResponse.status, 200)
  }

  assert.ok(state.updates.every(call => call.entityType === 'workers'))
  assert.ok(state.updates.every(call => call.workerId === selected.id))
  assert.ok(state.uploads.every(call => call.workerId === selected.id))
  assert.ok(state.removals.flatMap(call => call.paths).every(storagePath =>
    storagePath.startsWith(`workers/${selected.id}/`),
  ))
  assert.equal(
    state.workers.get(decoy.id)?.profilePhotoPath,
    'workers/worker-decoy/profile_photo/untouched.png',
  )
  assert.equal(
    state.workers.get(decoy.id)?.identityProofPath,
    'workers/worker-decoy/identity_proof/untouched.png',
  )
})

test('13. deleted and intentionally empty document paths remain empty', async () => {
  const worker = makeWorker({
    id: 'worker-empty-path',
    identityProofPath: 'workers/worker-empty-path/identity_proof/original.png',
  })
  const state = installWorkerFileMocks([worker])

  const firstDelete = await workerFileRoute.DELETE(
    makeWorkerFileDeleteRequest(worker.id, 'identity_proof'),
  )
  assert.equal(firstDelete.status, 200)
  assert.equal(state.workers.get(worker.id)?.identityProofPath, '')

  const secondDelete = await workerFileRoute.DELETE(
    makeWorkerFileDeleteRequest(worker.id, 'identity_proof'),
  )
  assert.equal(secondDelete.status, 404)
  assert.equal(state.workers.get(worker.id)?.identityProofPath, '')
  assert.equal(state.removals.length, 1)
  assert.ok(
    marketplaceSource.includes(
      "identityProofPath: String(payload.identityProofPath ?? existing?.identityProofPath ?? '').trim()",
    ),
  )
})

test('14. reconciliation cannot change an existing false visibility to true', () => {
  assert.equal(reconcileVisibility(completeVisibilityWorker(false), 'active'), false)
})

test('15. inactive or otherwise ineligible workers remain hidden', () => {
  const eligibleWorker = completeVisibilityWorker(true)
  assert.equal(reconcileVisibility(eligibleWorker, 'pending'), false)
  assert.equal(reconcileVisibility(eligibleWorker, 'inactive_wallet_empty'), false)
  assert.equal(reconcileVisibility(eligibleWorker, 'inactive_subscription_expired'), false)
  assert.equal(
    reconcileVisibility({ ...eligibleWorker, identityProofPath: '' }, 'active'),
    false,
  )
})

test('16. Add Worker KYC orchestration calls no WhatsApp, notification, wallet, or payment function', async () => {
  const loweredSaveWorkerSource = saveWorkerExpression.toLowerCase()
  for (const forbidden of ['whatsapp', 'notification', 'wallet', 'payment', 'razorpay']) {
    assert.equal(
      loweredSaveWorkerSource.includes(forbidden),
      false,
      `Expected saveWorker to exclude ${forbidden}`,
    )
  }

  const harness = makeSaveHarness({
    photoFile: makePngFile('photo.png'),
    identityFile: makePngFile('identity.png'),
    identityProofType: 'other',
    identityProofNumber: 'QA-PREVIEW-TEST',
  })
  await harness.saveWorker()

  assert.deepEqual(harness.events, [
    'create',
    'upload:profile_photo',
    'upload:identity_proof',
    'metadata',
  ])
  assert.equal(harness.calls.persist.length, 1)
  assert.equal(harness.calls.uploads.length, 2)
  assert.equal(harness.calls.metadata.length, 1)
})
