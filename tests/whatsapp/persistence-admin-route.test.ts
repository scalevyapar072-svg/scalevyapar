import assert from 'node:assert/strict'
import test from 'node:test'

import { handleAdminWhatsappReadOnlyGet } from '../../lib/whatsapp/admin-readonly-route'

const assertNoStoreHeaders = (response: Response) => {
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, no-cache, max-age=0, must-revalidate',
  )
  assert.equal(response.headers.get('pragma'), 'no-cache')
  assert.equal(response.headers.get('expires'), '0')
}

test('read-only admin helper rejects unauthenticated requests with no-store headers', async () => {
  const response = await handleAdminWhatsappReadOnlyGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/consent-summary'),
    requireAdmin: async () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
    getPayload: async () => ({ success: true }),
    errorMessage: 'Failed to load WhatsApp read-only payload.',
  })

  assert.equal(response.status, 401)
  assertNoStoreHeaders(response)
})

test('read-only admin helper returns success payloads with no-store headers', async () => {
  const response = await handleAdminWhatsappReadOnlyGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/safety-status'),
    requireAdmin: async () => ({ id: 'admin-1', role: 'ADMIN' }),
    getPayload: async () => ({
      success: true,
      summary: {
        available: false,
        persistenceStatus: 'Persistence unavailable',
      },
    }),
    errorMessage: 'Failed to load WhatsApp read-only payload.',
  })

  assert.equal(response.status, 200)
  assertNoStoreHeaders(response)
  assert.deepEqual(await response.json(), {
    success: true,
    summary: {
      available: false,
      persistenceStatus: 'Persistence unavailable',
    },
  })
})

test('read-only admin helper returns bounded errors with no-store headers', async () => {
  const response = await handleAdminWhatsappReadOnlyGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/template-inventory'),
    requireAdmin: async () => ({ id: 'admin-1', role: 'ADMIN' }),
    getPayload: async () => {
      throw new Error('boom')
    },
    errorMessage: 'Failed to load WhatsApp read-only payload.',
    logger: {
      error() {},
    },
  })

  assert.equal(response.status, 500)
  assertNoStoreHeaders(response)
  assert.deepEqual(await response.json(), {
    error: 'Failed to load WhatsApp read-only payload.',
  })
})
