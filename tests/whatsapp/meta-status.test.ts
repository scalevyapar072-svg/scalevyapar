import assert from 'node:assert/strict'
import test from 'node:test'

import { getWhatsappMetaConnectionStatus } from '../../lib/whatsapp/meta-status.ts'

test('provider health check uses phone_numbers and never calls /messages', async () => {
  let requestedUrl = ''

  const status = await getWhatsappMetaConnectionStatus({
    env: {
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
      WHATSAPP_APP_SECRET: 'secret',
      WHATSAPP_GRAPH_API_VERSION: 'v25.0',
      VERCEL_ENV: 'production',
    },
    fetchImplementation: async (input) => {
      requestedUrl = String(input)

      return new Response(
        JSON.stringify({
          data: [
            {
              id: 'phone-id',
              display_phone_number: '+91 9999999999',
              verified_name: 'ScaleVyapar',
              quality_rating: 'GREEN',
              name_status: 'APPROVED',
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    },
  })

  assert.equal(status.providerHealth.ok, true)
  assert.equal(status.providerHealth.requestPath, '/business-id/phone_numbers')
  assert.equal(status.providerHealth.neverCallsMessages, true)
  assert.match(requestedUrl, /\/v25\.0\/business-id\/phone_numbers/)
  assert.doesNotMatch(requestedUrl, /\/messages/)
  assert.match(requestedUrl, /appsecret_proof=/)
})

test('status payload redacts secrets and reports fail-closed blockers safely', async () => {
  const status = await getWhatsappMetaConnectionStatus({
    env: {
      WHATSAPP_ACCESS_TOKEN: 'top-secret-token',
      WHATSAPP_PHONE_NUMBER_ID: 'secret-phone-id',
      VERCEL_ENV: 'preview',
    },
  })

  const serialized = JSON.stringify(status)

  assert.equal(status.secretsRedacted, true)
  assert.equal(status.previewSendingDisabled, true)
  assert.equal(status.providerHealth.status, 'misconfigured')
  assert.ok(status.providerHealth.missingVariables.includes('WHATSAPP_APP_SECRET'))
  assert.doesNotMatch(serialized, /top-secret-token/)
  assert.doesNotMatch(serialized, /secret-phone-id/)
})
