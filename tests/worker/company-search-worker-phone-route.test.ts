import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { handleWorkerPhonePost } from '../../app/api/labour/company/search/worker-phone/route'

const companyUser = {
  id: 'synthetic-company-user',
  name: 'Synthetic Company',
  email: 'synthetic-company@example.test',
  role: 'CLIENT',
}

const createDependencies = ({
  authenticated = true,
  companyStatus = 'active',
  workerCategoryIds = ['stitching'],
  workerStatus = 'active',
  workerIsVisible = true,
  mobile = '09876 543210',
  workerExists = true,
  jobExpiresAt = '2099-12-31',
} = {}) => ({
  getCompanyUser: async () => authenticated ? companyUser : null,
  getGeneralUser: async () => null,
  findCompanyByEmail: async () => ({
    id: 'synthetic-company',
    email: companyUser.email,
    status: companyStatus,
  }),
  findCompanyJobs: async () => [{
    id: 'synthetic-live-job',
    company_id: 'synthetic-company',
    category_id: 'stitching',
    status: 'live',
    expires_at: jobExpiresAt,
    created_at: '2026-09-19T10:00:00.000Z',
    published_at: '2026-09-19T10:00:00.000Z',
  }],
  findWorkerPhoneRecord: async () => workerExists ? ({
    category_ids: workerCategoryIds,
    status: workerStatus,
    is_visible: workerIsVisible,
    mobile,
  }) : null,
})

const requestFor = (workerId = 'synthetic-worker') => new NextRequest(
  'https://preview.example.test/api/labour/company/search/worker-phone',
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workerId }),
  },
)

test('an authorized first click returns only the normalized phone after server checks', async () => {
  const response = await handleWorkerPhonePost(requestFor(), createDependencies())

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
  assert.equal(response.headers.get('pragma'), 'no-cache')
  assert.deepEqual(await response.json(), { mobile: '+919876543210' })
})

test('unauthenticated and unauthorized phone requests reveal no number', async () => {
  for (const dependencies of [
    createDependencies({ authenticated: false }),
    createDependencies({ companyStatus: 'blocked' }),
    createDependencies({ workerCategoryIds: ['electrician'] }),
    createDependencies({ workerStatus: 'pending' }),
    createDependencies({ workerIsVisible: false }),
    createDependencies({ jobExpiresAt: '2020-01-01' }),
  ]) {
    const response = await handleWorkerPhonePost(requestFor(), dependencies)
    const body = await response.json()

    assert.ok(response.status === 401 || response.status === 403)
    assert.equal('mobile' in body, false)
    assert.doesNotMatch(JSON.stringify(body), /09876|9876543210/)
  }
})

test('missing, malformed, and absent worker phone data stays unavailable', async () => {
  for (const dependencies of [
    createDependencies({ mobile: '' }),
    createDependencies({ mobile: '12345' }),
    createDependencies({ mobile: '+1 415 555 0100' }),
    createDependencies({ workerExists: false }),
  ]) {
    const response = await handleWorkerPhonePost(requestFor(), dependencies)
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.deepEqual(body, { error: 'Phone not available' })
    assert.equal('mobile' in body, false)
  }
})

test('invalid request bodies do not reach or reveal worker phone data', async () => {
  const missingWorkerId = await handleWorkerPhonePost(requestFor(''), createDependencies())
  assert.equal(missingWorkerId.status, 400)
  assert.equal('mobile' in await missingWorkerId.json(), false)

  const malformed = new NextRequest(
    'https://preview.example.test/api/labour/company/search/worker-phone',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    },
  )
  const malformedResponse = await handleWorkerPhonePost(malformed, createDependencies())
  assert.equal(malformedResponse.status, 400)
  assert.equal('mobile' in await malformedResponse.json(), false)
})
