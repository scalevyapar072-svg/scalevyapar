import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { WhatsappPersistenceAvailability } from './persistence-types'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/persistence-client')

let cachedClient: SupabaseClient | null = null

type WhatsappPersistenceAvailableClient = Extract<
  WhatsappPersistenceAvailability,
  { available: true }
> & {
  client: SupabaseClient
}

type WhatsappPersistenceUnavailableClient = Extract<
  WhatsappPersistenceAvailability,
  { available: false }
>

export type WhatsappPersistenceWriteAvailability =
  | {
      enabled: true
    }
  | {
      enabled: false
      reason: 'preview_disabled' | 'missing_configuration'
      message: string
    }

const getTrimmedEnv = (name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') =>
  String(process.env[name] || '').trim()

export const getWhatsappPersistenceClient = ():
  | WhatsappPersistenceAvailableClient
  | WhatsappPersistenceUnavailableClient => {
  const supabaseUrl = getTrimmedEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getTrimmedEnv('SUPABASE_SERVICE_ROLE_KEY')

  const missingConfigurationNames: Array<
    'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
  > = []

  if (!supabaseUrl) {
    missingConfigurationNames.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    missingConfigurationNames.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  if (missingConfigurationNames.length > 0) {
    return {
      available: false,
      missingConfigurationNames,
      message:
        'Persistence unavailable. Server-only Supabase service-role configuration is missing.',
    }
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return {
    available: true,
    client: cachedClient,
    presentConfigurationNames: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  }
}

export const getWhatsappPersistenceWriteAvailability = (): WhatsappPersistenceWriteAvailability => {
  if (String(process.env.VERCEL_ENV || '').trim().toLowerCase() === 'preview') {
    return {
      enabled: false,
      reason: 'preview_disabled',
      message: 'WhatsApp consent persistence is disabled in Preview deployments.',
    }
  }

  const persistence = getWhatsappPersistenceClient()
  if (!persistence.available) {
    return {
      enabled: false,
      reason: 'missing_configuration',
      message: persistence.message,
    }
  }

  return {
    enabled: true,
  }
}

export const sanitizeWhatsappPersistenceError = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof Error && error.message) {
    if (/invalid whatsapp mobile/i.test(error.message)) {
      return 'Invalid WhatsApp mobile.'
    }

    if (/ambiguous recipient/i.test(error.message)) {
      return 'Recipient lookup is ambiguous.'
    }
  }

  return fallbackMessage
}
