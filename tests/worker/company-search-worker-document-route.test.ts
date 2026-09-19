import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { handleWorkerDocumentGet } from '../../app/api/labour/company/search/worker-proof/route'

const companyUser = {
  id: 'synthetic-company-user',
  name: 'Synthetic Company',
  email: 'synthetic-company@example.test',
  role: 'CLIENT',
}

const createDependencies = ({
  authenticated = true,
  workerCategoryIds = ['stitching'],
  identityProofPath = 'workers/synthetic/identity.pdf',
  resumeDocumentPath = 'workers/synthetic/resume.pdf',
} = {}) => {
  let signedPath = ''

  return {
    dependencies: {
      getCompanyUser: async () => authenticated ? companyUser : null,
      getGeneralUser: async () => null,
      findCompanyByEmail: async () => ({
        id: 'synthetic-company',
        email: companyUser.email,
        status: 'active',
      }),
      findCompanyJobs: async () => [{
        id: 'synthetic-live-job',
        company_id: 'synthetic-company',
        category_id: 'stitching',
        status: 'live',
        expires_at: '2099-12-31',
        created_at: '2026-09-19T10:00:00.000Z',
        published_at: '2026-09-19T10:00:00.000Z',
      }],
      findWorkerDocumentRecord: async () => ({
        category_ids: workerCategoryIds,
        status: 'active',
        is_visible: true,
        identity_proof_path: identityProofPath,
        resume_document_path: resumeDocumentPath,
      }),
      createSignedWorkerFileUrl: async (storagePath: string) => {
        signedPath = storagePath
        return `https://signed.example.test/${encodeURIComponent(storagePath)}`
      },
    },
    getSignedPath: () => signedPath,
  }
}

const requestFor = (documentKind: 'identity' | 'resume') => new NextRequest(
  `https://preview.example.test/api/labour/company/search/worker-proof?workerId=synthetic-worker&document=${documentKind}`,
)

test('authorized company receives the independently mapped identity and resume links', async () => {
  for (const [documentKind, expectedPath] of [
    ['identity', 'workers/synthetic/identity.pdf'],
    ['resume', 'workers/synthetic/resume.pdf'],
  ] as const) {
    const fixture = createDependencies()
    const response = await handleWorkerDocumentGet(
      requestFor(documentKind),
      fixture.dependencies,
    )

    assert.equal(response.status, 200)
    assert.equal(fixture.getSignedPath(), expectedPath)
    assert.deepEqual(await response.json(), {
      url: `https://signed.example.test/${encodeURIComponent(expectedPath)}`,
    })
  }
})

test('unauthenticated, unentitled, and unrelated-category requests never sign a document', async () => {
  for (const fixture of [
    createDependencies({ authenticated: false }),
    createDependencies({ workerCategoryIds: ['electrician'] }),
  ]) {
    const response = await handleWorkerDocumentGet(
      requestFor('identity'),
      fixture.dependencies,
    )

    assert.ok(response.status === 401 || response.status === 403)
    assert.equal(fixture.getSignedPath(), '')
  }
})

test('a genuinely missing identity or resume remains unavailable without signing', async () => {
  for (const [documentKind, fixture] of [
    ['identity', createDependencies({ identityProofPath: '' })],
    ['resume', createDependencies({ resumeDocumentPath: '' })],
  ] as const) {
    const response = await handleWorkerDocumentGet(
      requestFor(documentKind),
      fixture.dependencies,
    )

    assert.equal(response.status, 404)
    assert.equal(fixture.getSignedPath(), '')
  }
})
