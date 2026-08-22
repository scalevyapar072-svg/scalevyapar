import {
  readWhatsappMetaConfig,
  resolveWhatsappHealthConfig,
  type WhatsappMetaConfigSnapshot,
} from './meta-config.ts'
import {
  createWhatsappMetaReadOnlyClient,
  WhatsappMetaReadOnlyClientError,
} from './meta-client.ts'
import { assertWhatsappServerOnly } from './server-runtime.ts'

assertWhatsappServerOnly('lib/whatsapp/meta-status')

type EnvMap = Record<string, string | undefined>

type ProviderHealthStatus = 'ok' | 'misconfigured' | 'degraded' | 'error'

export type WhatsappMetaConnectionStatus = {
  checkedAt: string
  environment: string
  graphApiVersion: string
  graphApiVersionSource: WhatsappMetaConfigSnapshot['graphApiVersionSource']
  previewSendingDisabled: boolean
  sendRuntimeReady: boolean
  secretsRedacted: true
  canonicalConfig: {
    accessTokenConfigured: boolean
    phoneNumberIdConfigured: boolean
    webhookVerifyTokenConfigured: boolean
    businessAccountIdConfigured: boolean
    appIdConfigured: boolean
    appSecretConfigured: boolean
    missingCanonicalVariables: string[]
    missingSendVariables: string[]
    missingWebhookPostVariables: string[]
    missingHealthVariables: string[]
  }
  legacyCompatibility: WhatsappMetaConfigSnapshot['legacyCompatibility']
  providerHealth: {
    attempted: boolean
    ok: boolean
    status: ProviderHealthStatus
    requestPath: string
    neverCallsMessages: true
    usesAppSecretProof: boolean
    configuredPhoneNumberMatch: boolean | null
    discoveredPhoneNumberCount: number | null
    missingVariables: string[]
    error: string | null
  }
}

const getEnvironmentLabel = (env: EnvMap) =>
  String(env.VERCEL_ENV || env.NODE_ENV || 'unknown').trim() || 'unknown'

const buildBaseStatus = (
  snapshot: WhatsappMetaConfigSnapshot,
  env: EnvMap,
): Omit<WhatsappMetaConnectionStatus, 'providerHealth'> => ({
  checkedAt: new Date().toISOString(),
  environment: getEnvironmentLabel(env),
  graphApiVersion: snapshot.graphApiVersion,
  graphApiVersionSource: snapshot.graphApiVersionSource,
  previewSendingDisabled: getEnvironmentLabel(env) === 'preview',
  sendRuntimeReady: snapshot.missingSendVariables.length === 0,
  secretsRedacted: true,
  canonicalConfig: {
    accessTokenConfigured: snapshot.accessTokenConfigured,
    phoneNumberIdConfigured: snapshot.phoneNumberIdConfigured,
    webhookVerifyTokenConfigured: snapshot.webhookVerifyTokenConfigured,
    businessAccountIdConfigured: snapshot.businessAccountIdConfigured,
    appIdConfigured: snapshot.appIdConfigured,
    appSecretConfigured: snapshot.appSecretConfigured,
    missingCanonicalVariables: snapshot.missingCanonicalVariables,
    missingSendVariables: snapshot.missingSendVariables,
    missingWebhookPostVariables: snapshot.missingWebhookPostVariables,
    missingHealthVariables: snapshot.missingHealthVariables,
  },
  legacyCompatibility: snapshot.legacyCompatibility,
})

export const getWhatsappMetaConnectionStatus = async ({
  env = process.env,
  fetchImplementation = fetch,
}: {
  env?: EnvMap
  fetchImplementation?: typeof fetch
} = {}): Promise<WhatsappMetaConnectionStatus> => {
  const snapshot = readWhatsappMetaConfig(env)
  const environmentLabel = getEnvironmentLabel(env)
  const baseStatus = {
    ...buildBaseStatus(snapshot, env),
    previewSendingDisabled: environmentLabel === 'preview',
    sendRuntimeReady:
      environmentLabel === 'production' && snapshot.missingSendVariables.length === 0,
  }
  const healthConfig = resolveWhatsappHealthConfig(env)

  if (!healthConfig.ok) {
    return {
      ...baseStatus,
      providerHealth: {
        attempted: false,
        ok: false,
        status: 'misconfigured',
        requestPath: '/{business-account-id}/phone_numbers',
        neverCallsMessages: true,
        usesAppSecretProof: false,
        configuredPhoneNumberMatch: null,
        discoveredPhoneNumberCount: null,
        missingVariables: healthConfig.missingVariables,
        error: 'Meta read-only health check is fail-closed until the required server configuration exists.',
      },
    }
  }

  try {
    const client = createWhatsappMetaReadOnlyClient(
      healthConfig.config,
      fetchImplementation,
    )
    const providerResult = await client.getBusinessPhoneNumbers()
    const configuredPhoneNumberMatch = providerResult.phoneNumbers.some(
      (phoneNumber) => phoneNumber.id === healthConfig.config.phoneNumberId,
    )

    return {
      ...baseStatus,
      providerHealth: {
        attempted: true,
        ok: configuredPhoneNumberMatch,
        status: configuredPhoneNumberMatch ? 'ok' : 'degraded',
        requestPath: providerResult.requestPath,
        neverCallsMessages: true,
        usesAppSecretProof: true,
        configuredPhoneNumberMatch,
        discoveredPhoneNumberCount: providerResult.phoneNumbers.length,
        missingVariables: [],
        error: configuredPhoneNumberMatch
          ? null
          : 'Configured phone number ID was not returned by Meta for the current business account.',
      },
    }
  } catch (error) {
    const requestPath =
      error instanceof WhatsappMetaReadOnlyClientError
        ? error.requestPath
        : '/{business-account-id}/phone_numbers'

    return {
      ...baseStatus,
      providerHealth: {
        attempted: true,
        ok: false,
        status: 'error',
        requestPath,
        neverCallsMessages: true,
        usesAppSecretProof: true,
        configuredPhoneNumberMatch: null,
        discoveredPhoneNumberCount: null,
        missingVariables: [],
        error:
          error instanceof WhatsappMetaReadOnlyClientError
            ? error.message
            : 'Meta read-only health check failed unexpectedly.',
      },
    }
  }
}
