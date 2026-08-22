import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createWhatsappMetaReadOnlyClient,
  sanitizeMetaReadOnlyError,
  WhatsappMetaReadOnlyClientError,
} from '../../lib/whatsapp/meta-client'

const metaConfig = {
  accessToken: 'access-token',
  phoneNumberId: 'phone-id',
  businessAccountId: 'business-id',
  appId: 'app-id',
  appSecret: 'app-secret',
  graphApiVersion: 'v25.0',
} as const

test('reads WABA metadata through the read-only path', async () => {
  const requestedUrls: string[] = []
  const client = createWhatsappMetaReadOnlyClient(metaConfig, async (input) => {
    requestedUrls.push(String(input))

    return Response.json({
      id: 'business-id',
      name: 'ScaleVyapar WABA',
    })
  })

  const result = await client.getWabaMetadata()

  assert.equal(result.requestPath, '/business-id')
  assert.deepEqual(result.waba, {
    id: 'business-id',
    name: 'ScaleVyapar WABA',
  })
  assert.match(requestedUrls[0] || '', /\/v25\.0\/business-id\?/)
})

test('reads template inventory through the read-only path', async () => {
  const requestedUrls: string[] = []
  const client = createWhatsappMetaReadOnlyClient(metaConfig, async (input) => {
    requestedUrls.push(String(input))

    return Response.json({
      data: [
        {
          name: 'worker_confirmation',
          language: 'en',
          category: 'UTILITY',
          status: 'APPROVED',
        },
      ],
    })
  })

  const result = await client.getTemplateInventory()

  assert.equal(result.requestPath, '/business-id/message_templates')
  assert.deepEqual(result.templates, [
    {
      name: 'worker_confirmation',
      language: 'en',
      category: 'UTILITY',
      status: 'APPROVED',
      headerType: 'NONE',
      bodyVariableCount: 0,
      footerText: '',
      buttons: [],
      validationErrors: [],
    },
  ])
  assert.match(requestedUrls[0] || '', /\/v25\.0\/business-id\/message_templates\?/)
})

test('returns explicit token health results', async () => {
  const client = createWhatsappMetaReadOnlyClient(metaConfig, async () =>
    Response.json({
      data: {
        app_id: 1234567890,
        is_valid: false,
        scopes: ['whatsapp_business_messaging'],
        type: 'SYSTEM_USER',
      },
    }),
  )

  const result = await client.getTokenHealth()

  assert.equal(result.requestPath, '/debug_token')
  assert.deepEqual(result.tokenHealth, {
    state: 'invalid',
    appId: '1234567890',
    scopes: ['whatsapp_business_messaging'],
    tokenType: 'SYSTEM_USER',
  })
})

test('fails with a bounded timeout and request cancellation', async () => {
  const client = createWhatsappMetaReadOnlyClient(
    metaConfig,
    async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        if (init?.signal?.aborted) {
          reject(new Error('aborted'))
          return
        }

        init?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'))
        })
      }),
    10,
  )

  await assert.rejects(
    () => client.getTokenHealth(),
    (error: unknown) => {
      assert.ok(error instanceof WhatsappMetaReadOnlyClientError)
      assert.equal(error.code, 'timeout')
      assert.equal(error.statusCode, null)
      assert.equal(error.requestPath, '/debug_token')
      return true
    },
  )
})

test('sanitizes provider errors without leaking raw payloads', async () => {
  const client = createWhatsappMetaReadOnlyClient(metaConfig, async () =>
    new Response('top-secret-token', { status: 500 }),
  )

  await assert.rejects(
    () => client.getWabaMetadata(),
    (error: unknown) => {
      assert.ok(error instanceof WhatsappMetaReadOnlyClientError)
      assert.equal(error.code, 'http-error')
      assert.equal(error.statusCode, 500)
      assert.equal(error.requestPath, '/business-id')
      assert.equal(
        sanitizeMetaReadOnlyError(error),
        'Meta read-only request failed with status 500.',
      )
      assert.doesNotMatch(error.message, /top-secret-token/)
      return true
    },
  )
})
