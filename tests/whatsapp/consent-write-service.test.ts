import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getWhatsappConsentPreferences,
  persistWhatsappConsentPreferences,
} from '../../lib/whatsapp/consent-write-service'
import {
  getWhatsappPersistenceWriteAvailability,
} from '../../lib/whatsapp/persistence-client'
import { WHATSAPP_CONSENT_TEXT_VERSION } from '../../lib/whatsapp/consent'

test('non-production deployments fail closed for WhatsApp consent reads and writes', async () => {
  const previousVercelEnv = process.env.VERCEL_ENV
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

  try {
    for (const environment of ['preview', 'development', 'test', '', 'staging']) {
      if (environment) {
        process.env.VERCEL_ENV = environment
      } else {
        delete process.env.VERCEL_ENV
      }

      const availability = getWhatsappPersistenceWriteAvailability()
      assert.deepEqual(availability, {
        enabled: false,
        reason: 'environment_not_production',
        message: 'WhatsApp persistence writes are disabled unless VERCEL_ENV is exactly production.',
      })

      const preferences = await getWhatsappConsentPreferences({
        recipientType: 'company',
        recipientId: 'company-1',
        mobile: '9876543210',
      })

      assert.equal(preferences.available, false)
      assert.equal(preferences.readOnly, true)
      assert.equal(preferences.writeEnabled, false)
      assert.equal(preferences.state.marketing_allowed, null)

      const result = await persistWhatsappConsentPreferences({
        recipient: {
          recipientType: 'company',
          recipientId: 'company-1',
          mobile: '9876543210',
        },
        consents: {
          service_allowed: true,
          matching_alerts_allowed: true,
          marketing_allowed: true,
        },
        source: 'company_settings',
        consentTextVersion: WHATSAPP_CONSENT_TEXT_VERSION,
        metadata: {
          origin: 'company_settings',
        },
      })

      assert.equal(result.persisted, false)
      assert.equal(result.writeEnabled, false)
      assert.equal(result.disabledReason, 'environment_not_production')
      assert.equal(result.state.service_allowed, null)
      assert.equal(result.consentTextVersion, WHATSAPP_CONSENT_TEXT_VERSION)
    }
  } finally {
    if (typeof previousVercelEnv === 'string') {
      process.env.VERCEL_ENV = previousVercelEnv
    } else {
      delete process.env.VERCEL_ENV
    }

    if (typeof previousSupabaseUrl === 'string') {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    }

    if (typeof previousServiceRole === 'string') {
      process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRole
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  }
})
