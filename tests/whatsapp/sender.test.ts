import assert from 'node:assert/strict'
import test from 'node:test'

import {
  sendWhatsappTemplateMessage,
  sendWhatsappTextMessage,
} from '../../lib/labour-whatsapp'

const WHATSAPP_ENV_KEYS = [
  'VERCEL_ENV',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_CLOUD_API_ACCESS_TOKEN',
  'WHATSAPP_CLOUD_PHONE_NUMBER_ID',
  'WHATSAPP_GRAPH_API_VERSION',
] as const

const originalEnv = { ...process.env }
const originalFetch = globalThis.fetch

const withEnv = async (
  overrides: Record<string, string | undefined>,
  run: () => Promise<void>,
) => {
  for (const key of WHATSAPP_ENV_KEYS) {
    delete process.env[key]
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key]
      return
    }

    process.env[key] = value
  })

  try {
    await run()
  } finally {
    for (const key of WHATSAPP_ENV_KEYS) {
      delete process.env[key]
    }

    Object.entries(originalEnv).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        process.env[key] = value
      }
    })

    globalThis.fetch = originalFetch
  }
}

test('production text sender payload remains unchanged', async () => {
  await withEnv(
    {
      VERCEL_ENV: 'production',
      WHATSAPP_ACCESS_TOKEN: 'canonical-token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      WHATSAPP_GRAPH_API_VERSION: 'v25.0',
    },
    async () => {
      let requestUrl = ''
      let requestBody = ''

      globalThis.fetch = (async (input, init) => {
        requestUrl = String(input)
        requestBody = String(init?.body || '')

        return Response.json({
          contacts: [{ wa_id: '919876543210' }],
          messages: [{ id: 'wamid-1', message_status: 'accepted' }],
        })
      }) as typeof fetch

      const result = await sendWhatsappTextMessage({
        to: '9876543210',
        body: 'Hello worker',
      })

      assert.equal(result.accepted, true)
      assert.match(requestUrl, /\/v25\.0\/phone-id\/messages$/)
      assert.deepEqual(JSON.parse(requestBody), {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210',
        type: 'text',
        text: {
          preview_url: false,
          body: 'Hello worker',
        },
      })
    },
  )
})

test('production template sender payload remains unchanged with legacy env fallback support', async () => {
  await withEnv(
    {
      VERCEL_ENV: 'production',
      WHATSAPP_CLOUD_API_ACCESS_TOKEN: 'legacy-token',
      WHATSAPP_CLOUD_PHONE_NUMBER_ID: 'legacy-phone-id',
    },
    async () => {
      let requestUrl = ''
      let requestBody = ''

      globalThis.fetch = (async (input, init) => {
        requestUrl = String(input)
        requestBody = String(init?.body || '')

        return Response.json({
          contacts: [{ wa_id: '919876543210' }],
          messages: [{ id: 'wamid-2', message_status: 'accepted' }],
        })
      }) as typeof fetch

      const result = await sendWhatsappTemplateMessage({
        to: '9876543210',
        templateName: 'worker_confirmation',
        languageCode: 'en',
        bodyParameters: ['Alice', 'Welder'],
      })

      assert.equal(result.accepted, true)
      assert.match(requestUrl, /\/v23\.0\/legacy-phone-id\/messages$/)
      assert.deepEqual(JSON.parse(requestBody), {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210',
        type: 'template',
        template: {
          name: 'worker_confirmation',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: 'Alice',
                },
                {
                  type: 'text',
                  text: 'Welder',
                },
              ],
            },
          ],
        },
      })
    },
  )
})

test('preview and local sends remain disabled', async () => {
  await withEnv(
    {
      VERCEL_ENV: 'preview',
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    },
    async () => {
      let fetchCalls = 0
      globalThis.fetch = (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch

      const previewResult = await sendWhatsappTextMessage({
        to: '9876543210',
        body: 'Hello worker',
      })

      assert.deepEqual(previewResult, {
        accepted: false,
        skipped: true,
        reason: 'whatsapp-disabled-outside-production',
      })
      assert.equal(fetchCalls, 0)
    },
  )

  await withEnv(
    {
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    },
    async () => {
      let fetchCalls = 0
      globalThis.fetch = (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch

      const localResult = await sendWhatsappTemplateMessage({
        to: '9876543210',
        templateName: 'worker_confirmation',
      })

      assert.deepEqual(localResult, {
        accepted: false,
        skipped: true,
        reason: 'whatsapp-disabled-outside-production',
      })
      assert.equal(fetchCalls, 0)
    },
  )
})
