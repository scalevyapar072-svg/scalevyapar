import assert from 'node:assert/strict'
import test from 'node:test'

import {
  sendWhatsappTemplateMessage,
  sendWhatsappTextMessage,
} from '../../lib/labour-whatsapp'
import { resolveWhatsappSendConfig } from '../../lib/whatsapp/meta-config'

type SenderDependencies = NonNullable<Parameters<typeof sendWhatsappTextMessage>[1]>

type PauseStatus = {
  paused: boolean
  reason: 'missing' | 'invalid' | 'query_error' | 'explicit_true' | 'explicit_false'
}

const createRepository = (pauseStatus: PauseStatus) => ({
  async getWhatsappSetting() {
    return null
  },
  async isAllSendingPaused() {
    return pauseStatus
  },
  async getWhatsappSafetySettings() {
    return {
      available: true,
      persistenceStatus: 'Connected',
      failClosed: pauseStatus.paused,
      pauseAllSending: pauseStatus.paused,
      pauseReason: pauseStatus.reason,
      reviewOnlyDefaults: {} as never,
    }
  },
})

const buildDependencies = ({
  env,
  pauseStatus = {
    paused: false,
    reason: 'explicit_false',
  } as const,
  persistenceAvailable = true,
  fetchImplementation = (async () =>
    Response.json({
      contacts: [{ wa_id: '919876543210' }],
      messages: [{ id: 'wamid-default', message_status: 'accepted' }],
    })) as typeof fetch,
}: {
  env?: Partial<NodeJS.ProcessEnv>
  pauseStatus?: PauseStatus
  persistenceAvailable?: boolean
  fetchImplementation?: typeof fetch
} = {}): SenderDependencies => ({
  env: (env || {}) as NodeJS.ProcessEnv,
  fetchImplementation,
  getPersistenceClient: () =>
    persistenceAvailable
      ? ({
          available: true,
          client: {} as never,
          presentConfigurationNames: [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY',
          ] as ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        } as const)
      : ({
          available: false,
          missingConfigurationNames: ['NEXT_PUBLIC_SUPABASE_URL'] as Array<
            'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
          >,
          message: 'Persistence unavailable.',
        } as const),
  createSettingsRepository: () => createRepository(pauseStatus),
  resolveSendConfig: resolveWhatsappSendConfig,
}) as SenderDependencies

const withSuppressedWarn = async (run: () => Promise<void>) => {
  const originalWarn = console.warn
  console.warn = (() => {}) as typeof console.warn

  try {
    await run()
  } finally {
    console.warn = originalWarn
  }
}

const assertBlockedSenders = async ({
  dependencies,
  expectedReason,
}: {
  dependencies: SenderDependencies
  expectedReason:
    | 'whatsapp-disabled-outside-production'
    | 'whatsapp-not-configured'
    | 'whatsapp-paused'
    | 'whatsapp-pause-setting-missing'
    | 'whatsapp-pause-setting-invalid'
    | 'whatsapp-pause-setting-unavailable'
}) => {
  await withSuppressedWarn(async () => {
    const textResult = await sendWhatsappTextMessage(
      {
        to: '9876543210',
        body: 'Hello worker',
      },
      dependencies,
    )
    const templateResult = await sendWhatsappTemplateMessage(
      {
        to: '9876543210',
        templateName: 'worker_confirmation',
        languageCode: 'en',
        bodyParameters: ['Alice', 'Welder'],
      },
      dependencies,
    )

    assert.deepEqual(textResult, {
      accepted: false,
      skipped: true,
      reason: expectedReason,
    })
    assert.deepEqual(templateResult, {
      accepted: false,
      skipped: true,
      reason: expectedReason,
    })
  })
}

test('production text sender payload remains unchanged when the safety gate is explicitly unpaused', async () => {
  let requestUrl = ''
  let requestBody = ''

  const dependencies = buildDependencies({
    env: {
      VERCEL_ENV: 'production',
      WHATSAPP_ACCESS_TOKEN: 'canonical-token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      WHATSAPP_GRAPH_API_VERSION: 'v25.0',
    },
    fetchImplementation: (async (input, init) => {
      requestUrl = String(input)
      requestBody = String(init?.body || '')

      return Response.json({
        contacts: [{ wa_id: '919876543210' }],
        messages: [{ id: 'wamid-1', message_status: 'accepted' }],
      })
    }) as typeof fetch,
  })

  const result = await sendWhatsappTextMessage(
    {
      to: '9876543210',
      body: 'Hello worker',
    },
    dependencies,
  )

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
})

test('production template sender payload remains unchanged with legacy env fallback support when explicitly unpaused', async () => {
  let requestUrl = ''
  let requestBody = ''

  const dependencies = buildDependencies({
    env: {
      VERCEL_ENV: 'production',
      WHATSAPP_CLOUD_API_ACCESS_TOKEN: 'legacy-token',
      WHATSAPP_CLOUD_PHONE_NUMBER_ID: 'legacy-phone-id',
    },
    fetchImplementation: (async (input, init) => {
      requestUrl = String(input)
      requestBody = String(init?.body || '')

      return Response.json({
        contacts: [{ wa_id: '919876543210' }],
        messages: [{ id: 'wamid-2', message_status: 'accepted' }],
      })
    }) as typeof fetch,
  })

  const result = await sendWhatsappTemplateMessage(
    {
      to: '9876543210',
      templateName: 'worker_confirmation',
      languageCode: 'en',
      bodyParameters: ['Alice', 'Welder'],
    },
    dependencies,
  )

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
})

test('pause_all_sending true blocks every sender without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      pauseStatus: {
        paused: true,
        reason: 'explicit_true',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-paused',
  })

  assert.equal(fetchCalls, 0)
})

test('missing pause setting blocks every sender without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      pauseStatus: {
        paused: true,
        reason: 'missing',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-pause-setting-missing',
  })

  assert.equal(fetchCalls, 0)
})

test('malformed pause setting blocks every sender without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      pauseStatus: {
        paused: true,
        reason: 'invalid',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-pause-setting-invalid',
  })

  assert.equal(fetchCalls, 0)
})

test('settings read failure blocks every sender without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      pauseStatus: {
        paused: true,
        reason: 'query_error',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-pause-setting-unavailable',
  })

  assert.equal(fetchCalls, 0)
})

test('missing persistence availability fails closed without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      persistenceAvailable: false,
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-pause-setting-unavailable',
  })

  assert.equal(fetchCalls, 0)
})

test('preview sends remain disabled', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'preview',
        WHATSAPP_ACCESS_TOKEN: 'token',
        WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-disabled-outside-production',
  })

  assert.equal(fetchCalls, 0)
})

test('missing Meta configuration blocks every sender without calling /messages', async () => {
  let fetchCalls = 0

  await assertBlockedSenders({
    dependencies: buildDependencies({
      env: {
        VERCEL_ENV: 'production',
      },
      fetchImplementation: (async () => {
        fetchCalls += 1
        return Response.json({})
      }) as typeof fetch,
    }),
    expectedReason: 'whatsapp-not-configured',
  })

  assert.equal(fetchCalls, 0)
})
