import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const importLocal = (relativePath: string) => import(
  pathToFileURL(path.join(workspaceRoot, relativePath)).href
)

const {
  buildCompanyWorkerSearchHref,
  resolveAuthorizedWorkerSearchJob,
} = await importLocal('lib/labour-worker-search-job.ts')
const {
  buildWorkerContactLinks,
  canCompanyAccessWorkerRecord,
  getWorkerDocumentPath,
  resolveWorkerDocumentAccess,
} = await importLocal('lib/labour-company-worker-access.ts')

const searchPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'page.tsx'),
  'utf8',
)
const searchClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'labour-search-client.tsx'),
  'utf8',
)
const panelClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'panel', 'company-panel-client.tsx'),
  'utf8',
)
const workerDocumentRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'search', 'worker-proof', 'route.ts'),
  'utf8',
)

const now = new Date('2026-09-19T12:00:00.000Z')
const jobs = [
  {
    id: 'owned-older-live',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-17T10:00:00.000Z',
    publishedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'owned-latest-live',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-18T10:00:00.000Z',
    publishedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'owned-expired',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-09-18',
    createdAt: '2026-09-19T10:00:00.000Z',
    publishedAt: '2026-09-19T10:00:00.000Z',
  },
  {
    id: 'foreign-live',
    companyId: 'company-b',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-19T11:00:00.000Z',
    publishedAt: '2026-09-19T11:00:00.000Z',
  },
]

test('automatic owned-job selection and selecting the same job manually resolve identically', () => {
  const automatic = resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-a',
    requestedJobId: '',
    now,
  })
  const manual = resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-a',
    requestedJobId: 'owned-latest-live',
    now,
  })

  assert.equal(automatic?.id, 'owned-latest-live')
  assert.deepEqual(automatic, manual)
  assert.equal(buildCompanyWorkerSearchHref(automatic?.id), '/labour/company/search?jobId=owned-latest-live')
})

test('missing without an owned live job and explicit invalid, expired, or foreign jobs fail closed', () => {
  assert.equal(resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-without-jobs',
    requestedJobId: '',
    now,
  }), null)

  for (const requestedJobId of ['missing-job', 'owned-expired', 'foreign-live']) {
    assert.equal(resolveAuthorizedWorkerSearchJob(jobs, {
      authenticatedCompanyId: 'company-a',
      requestedJobId,
      now,
    }), null)
  }
})

test('valid Indian mobile variants produce canonical Call and WhatsApp hrefs', () => {
  const message = 'Synthetic interest message'

  for (const mobile of ['9876543210', '09876543210', '+91 98765 43210', '91-98765-43210']) {
    assert.deepEqual(buildWorkerContactLinks(mobile, message), {
      normalizedMobile: '+919876543210',
      telHref: 'tel:+919876543210',
      whatsappHref: `https://wa.me/919876543210?text=${encodeURIComponent(message)}`,
    })
  }
})

test('missing and malformed mobiles produce no clickable contact href', () => {
  for (const mobile of ['', '12345', '+1 415 555 0100', 'not-a-number']) {
    assert.deepEqual(buildWorkerContactLinks(mobile, 'Synthetic message'), {
      normalizedMobile: '',
      telHref: '',
      whatsappHref: '',
    })
  }
})

test('document access requires an active company, a live matching category, and an eligible visible worker', () => {
  const allowed = {
    companyStatus: 'active',
    liveJobCategoryIds: ['cutting', 'stitching'],
    workerCategoryIds: ['finishing', 'stitching'],
    workerStatus: 'active',
    workerIsVisible: true,
  }

  assert.equal(canCompanyAccessWorkerRecord(allowed), true)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, companyStatus: 'blocked' }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, liveJobCategoryIds: [] }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerCategoryIds: ['electrician'] }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerStatus: 'pending' }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerIsVisible: false }), false)
})

test('identity and resume paths are mapped independently and preserve genuine absence', () => {
  const worker = {
    identityProofPath: 'workers/synthetic/identity.pdf',
    resumeDocumentPath: 'workers/synthetic/resume.pdf',
  }

  assert.equal(getWorkerDocumentPath(worker, 'identity'), worker.identityProofPath)
  assert.equal(getWorkerDocumentPath(worker, 'resume'), worker.resumeDocumentPath)
  assert.equal(getWorkerDocumentPath({ ...worker, resumeDocumentPath: '' }, 'resume'), '')

  const access = {
    companyStatus: 'active',
    liveJobCategoryIds: ['stitching'],
    workerCategoryIds: ['stitching'],
    workerStatus: 'inactive_wallet_empty',
    workerIsVisible: true,
  }
  assert.deepEqual(resolveWorkerDocumentAccess(access, worker, 'identity'), {
    authorized: true,
    documentPath: worker.identityProofPath,
  })
  assert.deepEqual(resolveWorkerDocumentAccess(access, worker, 'resume'), {
    authorized: true,
    documentPath: worker.resumeDocumentPath,
  })
  assert.deepEqual(resolveWorkerDocumentAccess(
    { ...access, liveJobCategoryIds: ['electrician'] },
    worker,
    'identity',
  ), { authorized: false, documentPath: '' })
})

test('the server owns automatic selection and privileged ranking before the client renders it', () => {
  assert.match(searchPageSource, /resolveAuthorizedWorkerSearchJob/)
  assert.match(searchPageSource, /orderingCompany/)
  assert.match(searchPageSource, /globalTierOrder:\s*useGlobalTierOrdering/)
  assert.match(searchPageSource, /initialRequestedJobId=\{effectiveRequestedJobId\}/)
  assert.match(searchClientSource, /hasValidRequestedJobContext\s*&&\s*tab\.jobId === requestedJobId/)
  assert.doesNotMatch(searchClientSource, /!requestedJobId\s*&&\s*effectiveJobContext/)
})

test('every Company Panel Search Worker navigation carries the latest authorized live job', () => {
  assert.match(panelClientSource, /const searchWorkersHref = useMemo/)
  assert.match(panelClientSource, /buildCompanyWorkerSearchHref/)
  assert.equal((panelClientSource.match(/href=\{searchWorkersHref\}/g) || []).length, 5)
})

test('resume is selected, entitlement-masked, and served by the authenticated document route', () => {
  assert.match(searchPageSource, /resume_document_path/)
  assert.match(searchPageSource, /resumeDocumentPath:/)
  assert.match(searchClientSource, /document=\$\{documentKind\}/)
  assert.match(searchClientSource, /worker\.resumeDocumentPath/)
  assert.doesNotMatch(searchClientSource, />Resume Not Available</)
  assert.match(workerDocumentRouteSource, /getCompanyUserFromRequest/)
  assert.match(workerDocumentRouteSource, /getUserFromRequest/)
  assert.match(workerDocumentRouteSource, /resolveWorkerDocumentAccess/)
  assert.match(workerDocumentRouteSource, /resume_document_path/)
})

test('mobile and document metadata remain masked server-side for unauthorized sessions', () => {
  assert.match(searchPageSource, /const authenticatedCompany = orderingCompany/)
  assert.match(searchPageSource, /mobile:\s*Boolean\(/)
  assert.match(searchPageSource, /identityProofPath:\s*Boolean\(/)
  assert.match(searchPageSource, /resumeDocumentPath:\s*Boolean\(/)
})
