import assert from 'node:assert/strict'
import test from 'node:test'

import { handleAdminWhatsappMetaStatusGet } from '../../lib/whatsapp/admin-status-route'
import type { WhatsappMetaConnectionStatus } from '../../lib/whatsapp/meta-status'

const baseStatus: WhatsappMetaConnectionStatus = {
  checkedAt: '2026-08-22T00:00:00.000Z',
  graphApiVersion: 'v25.0',
  configurationState: {
    accessTokenConfigured: true,
    phoneNumberIdConfigured: true,
    webhookVerifyTokenConfigured: true,
    businessAccountIdConfigured: true,
    appIdConfigured: true,
    appSecretConfigured: true,
    previewSendingDisabled: true,
    sendRuntimeReady: false,
    graphApiVersionSource: 'canonical',
    graphApiVersionValid: true,
  },
  missingVariableNames: [],
  legacyFallbackUsage: {
    usesLegacyAccessTokenAlias: false,
    usesLegacyPhoneNumberIdAlias: false,
    usesLegacyWebhookVerifyTokenAlias: false,
  },
  connectionState: 'connected',
  tokenHealthState: 'valid',
  maskedAppId: '12******90',
  maskedWabaId: 'bu*******id',
  maskedPhoneNumberId: 'ph****id',
  maskedSender: '+91********99',
  displayName: 'ScaleVyapar',
  displayNameStatus: 'APPROVED',
  registrationStatus: 'VERIFIED',
  qualityState: 'GREEN',
  templateCounts: {
    total: 1,
    byLanguage: { en: 1 },
    byCategory: { UTILITY: 1 },
    byStatus: { APPROVED: 1 },
  },
  sanitizedError: null,
}

const assertNoStoreHeaders = (response: Response) => {
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, no-cache, max-age=0, must-revalidate',
  )
  assert.equal(response.headers.get('pragma'), 'no-cache')
  assert.equal(response.headers.get('expires'), '0')
}

test('Admin API rejects unauthenticated requests with no-store headers', async () => {
  const response = await handleAdminWhatsappMetaStatusGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/meta-status'),
    requireAdmin: async () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
    getStatus: async () => baseStatus,
  })

  assert.equal(response.status, 401)
  assertNoStoreHeaders(response)
})

test('Admin API rejects unauthorized requests with no-store headers', async () => {
  const response = await handleAdminWhatsappMetaStatusGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/meta-status'),
    requireAdmin: async () => Response.json({ error: 'Forbidden' }, { status: 403 }),
    getStatus: async () => baseStatus,
  })

  assert.equal(response.status, 403)
  assertNoStoreHeaders(response)
})

test('Admin API returns no-store success responses', async () => {
  const response = await handleAdminWhatsappMetaStatusGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/meta-status'),
    requireAdmin: async () => ({ id: 'admin-id', role: 'ADMIN' }),
    getStatus: async () => baseStatus,
  })

  const payload = await response.json()

  assert.equal(response.status, 200)
  assertNoStoreHeaders(response)
  assert.equal(payload.success, true)
  assert.equal(payload.status.maskedAppId, '12******90')
})

test('Admin API returns no-store error responses', async () => {
  const response = await handleAdminWhatsappMetaStatusGet({
    request: new Request('https://example.com/api/admin/labour/whatsapp/meta-status'),
    requireAdmin: async () => ({ id: 'admin-id', role: 'ADMIN' }),
    getStatus: async () => {
      throw new Error('boom')
    },
    logger: {
      error() {},
    },
  })

  assert.equal(response.status, 500)
  assertNoStoreHeaders(response)
  assert.deepEqual(await response.json(), {
    error: 'Failed to load WhatsApp Meta connection status.',
  })
})
