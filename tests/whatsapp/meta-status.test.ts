import assert from 'node:assert/strict'
import test from 'node:test'

import { getWhatsappMetaConnectionStatus } from '../../lib/whatsapp/meta-status'

test('provider health check uses read-only endpoints and never calls /messages', async () => {
  const requestedUrls: string[] = []

  const status = await getWhatsappMetaConnectionStatus({
    env: {
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
      WHATSAPP_APP_ID: 'app-id',
      WHATSAPP_APP_SECRET: 'secret',
      WHATSAPP_GRAPH_API_VERSION: 'v25.0',
      VERCEL_ENV: 'production',
    },
    fetchImplementation: async (input) => {
      const url = new URL(String(input))
      requestedUrls.push(url.toString())

      if (url.pathname.endsWith('/debug_token')) {
        return Response.json({
          data: {
            app_id: '1234567890',
            is_valid: true,
            scopes: ['whatsapp_business_messaging'],
            type: 'SYSTEM_USER',
          },
        })
      }

      if (url.pathname.endsWith('/phone-id')) {
        return Response.json({
          id: 'phone-id',
          display_phone_number: '+91 9999999999',
          verified_name: 'ScaleVyapar',
          quality_rating: 'GREEN',
          name_status: 'APPROVED',
          code_verification_status: 'VERIFIED',
        })
      }

      if (url.pathname.endsWith('/business-id/message_templates')) {
        return Response.json({
          data: [
            {
              name: 'worker_confirmation',
              language: 'en',
              category: 'UTILITY',
              status: 'APPROVED',
            },
            {
              name: 'company_application',
              language: 'hi',
              category: 'UTILITY',
              status: 'PENDING',
            },
          ],
        })
      }

      return Response.json({
        id: 'business-id',
        name: 'ScaleVyapar WABA',
      })
    },
  })

  assert.equal(status.connectionState, 'connected')
  assert.equal(status.tokenHealthState, 'valid')
  assert.equal(status.maskedAppId, '12******90')
  assert.equal(status.maskedWabaId, 'bu*******id')
  assert.equal(status.maskedPhoneNumberId, 'ph****id')
  assert.equal(status.maskedSender, '+91********99')
  assert.equal(status.displayName, 'ScaleVyapar')
  assert.equal(status.displayNameStatus, 'APPROVED')
  assert.equal(status.registrationStatus, 'VERIFIED')
  assert.equal(status.qualityState, 'GREEN')
  assert.deepEqual(status.templateCounts, {
    total: 2,
    byLanguage: {
      en: 1,
      hi: 1,
    },
    byCategory: {
      UTILITY: 2,
    },
    byStatus: {
      APPROVED: 1,
      PENDING: 1,
    },
  })
  assert.equal(status.configurationState.previewSendingDisabled, false)
  assert.equal(status.configurationState.sendRuntimeReady, true)
  assert.equal(status.sanitizedError, null)
  assert.equal(requestedUrls.some((url) => url.includes('/messages')), false)
})

test('status payload redacts identifiers and reports fail-closed blockers safely', async () => {
  const status = await getWhatsappMetaConnectionStatus({
    env: {
      WHATSAPP_ACCESS_TOKEN: 'top-secret-token',
      WHATSAPP_PHONE_NUMBER_ID: 'secret-phone-id',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'secret-business-id',
      WHATSAPP_APP_ID: 'secret-app-id',
      VERCEL_ENV: 'preview',
    },
  })

  const serialized = JSON.stringify(status)

  assert.equal(status.connectionState, 'misconfigured')
  assert.equal(status.tokenHealthState, 'not_checked')
  assert.equal(status.configurationState.previewSendingDisabled, true)
  assert.ok(status.missingVariableNames.includes('WHATSAPP_APP_SECRET'))
  assert.equal(status.maskedAppId, 'se*********id')
  assert.equal(status.maskedWabaId, 'se**************id')
  assert.equal(status.maskedPhoneNumberId, 'se***********id')
  assert.doesNotMatch(serialized, /top-secret-token/)
  assert.doesNotMatch(serialized, /secret-app-id/)
  assert.doesNotMatch(serialized, /secret-business-id/)
  assert.doesNotMatch(serialized, /secret-phone-id/)
})

test('returns sanitized provider errors without raw response leakage', async () => {
  const status = await getWhatsappMetaConnectionStatus({
    env: {
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'business-id',
      WHATSAPP_APP_ID: 'app-id',
      WHATSAPP_APP_SECRET: 'app-secret',
      VERCEL_ENV: 'production',
    },
    fetchImplementation: async () => new Response('token=top-secret-token', { status: 500 }),
  })

  const serialized = JSON.stringify(status)

  assert.equal(status.connectionState, 'error')
  assert.equal(status.sanitizedError, 'Meta read-only request failed with status 500.')
  assert.doesNotMatch(serialized, /top-secret-token/)
})
