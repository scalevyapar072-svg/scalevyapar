import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/meta-config')

export const DEFAULT_WHATSAPP_GRAPH_API_VERSION = 'v23.0'
export const WHATSAPP_GRAPH_API_VERSION_PATTERN = /^v\d+\.\d+$/

export type EnvMap = Record<string, string | undefined>

type EnvSource = 'canonical' | 'legacy' | 'fallback' | 'missing'

type EnvResolution = {
  value: string
  source: EnvSource
}

export type WhatsappMetaConfigSnapshot = {
  accessTokenConfigured: boolean
  accessTokenSource: EnvSource
  phoneNumberIdConfigured: boolean
  phoneNumberIdSource: EnvSource
  webhookVerifyTokenConfigured: boolean
  webhookVerifyTokenSource: EnvSource
  businessAccountIdConfigured: boolean
  appIdConfigured: boolean
  appSecretConfigured: boolean
  graphApiVersion: string
  graphApiVersionSource: 'canonical' | 'fallback'
  graphApiVersionValid: boolean
  missingCanonicalVariables: string[]
  missingSendVariables: string[]
  missingWebhookPostVariables: string[]
  missingHealthVariables: string[]
  legacyCompatibility: {
    usesLegacyAccessTokenAlias: boolean
    usesLegacyPhoneNumberIdAlias: boolean
    usesLegacyWebhookVerifyTokenAlias: boolean
  }
}

export type WhatsappMetaSendConfig = {
  accessToken: string
  phoneNumberId: string
  graphApiVersion: string
}

export type WhatsappMetaWebhookPostConfig = {
  appSecret: string
}

export type WhatsappMetaHealthConfig = {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
  appId: string
  appSecret: string
  graphApiVersion: string
}

export type WhatsappMetaResolvedValues = {
  accessToken: EnvResolution
  phoneNumberId: EnvResolution
  webhookVerifyToken: EnvResolution
  businessAccountId: string
  appId: string
  appSecret: string
  graphApiVersion: string
  graphApiVersionSource: 'canonical' | 'fallback'
  graphApiVersionValid: boolean
}

type ResolutionResult<T> =
  | {
      ok: true
      config: T
      snapshot: WhatsappMetaConfigSnapshot
    }
  | {
      ok: false
      missingVariables: string[]
      snapshot: WhatsappMetaConfigSnapshot
      error?: string
    }

const normalizeText = (value: string | undefined) => String(value || '').trim()

export const isValidWhatsappGraphApiVersion = (value: string) =>
  WHATSAPP_GRAPH_API_VERSION_PATTERN.test(normalizeText(value))

const resolveCanonicalOrLegacy = (
  env: EnvMap,
  canonicalName: string,
  legacyNames: string[] = [],
): EnvResolution => {
  const canonicalValue = normalizeText(env[canonicalName])
  if (canonicalValue) {
    return { value: canonicalValue, source: 'canonical' }
  }

  for (const legacyName of legacyNames) {
    const legacyValue = normalizeText(env[legacyName])
    if (legacyValue) {
      return { value: legacyValue, source: 'legacy' }
    }
  }

  return { value: '', source: 'missing' }
}

const resolveCanonicalOrFallback = (
  env: EnvMap,
  canonicalName: string,
  fallbackValue: string,
) => {
  const canonicalValue = normalizeText(env[canonicalName])
  if (canonicalValue) {
    return {
      value: canonicalValue,
      source: 'canonical' as const,
    }
  }

  return {
    value: fallbackValue,
    source: 'fallback' as const,
  }
}

export const resolveWhatsappMetaValues = (
  env: EnvMap = process.env,
): WhatsappMetaResolvedValues => {
  const accessToken = resolveCanonicalOrLegacy(env, 'WHATSAPP_ACCESS_TOKEN', [
    'WHATSAPP_CLOUD_API_ACCESS_TOKEN',
  ])
  const phoneNumberId = resolveCanonicalOrLegacy(env, 'WHATSAPP_PHONE_NUMBER_ID', [
    'WHATSAPP_CLOUD_PHONE_NUMBER_ID',
  ])
  const webhookVerifyToken = resolveCanonicalOrLegacy(
    env,
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    ['WHATSAPP_VERIFY_TOKEN'],
  )
  const graphApiVersionResolution = resolveCanonicalOrFallback(
    env,
    'WHATSAPP_GRAPH_API_VERSION',
    DEFAULT_WHATSAPP_GRAPH_API_VERSION,
  )

  return {
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
    businessAccountId: normalizeText(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    appId: normalizeText(env.WHATSAPP_APP_ID),
    appSecret: normalizeText(env.WHATSAPP_APP_SECRET),
    graphApiVersion: graphApiVersionResolution.value,
    graphApiVersionSource: graphApiVersionResolution.source,
    graphApiVersionValid: isValidWhatsappGraphApiVersion(graphApiVersionResolution.value),
  }
}

const buildMissingCanonicalVariables = (resolvedValues: WhatsappMetaResolvedValues) => {
  const missing = [
    resolvedValues.accessToken.source === 'canonical' ? '' : 'WHATSAPP_ACCESS_TOKEN',
    resolvedValues.phoneNumberId.source === 'canonical' ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
    resolvedValues.webhookVerifyToken.source === 'canonical'
      ? ''
      : 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    resolvedValues.businessAccountId ? '' : 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    resolvedValues.appId ? '' : 'WHATSAPP_APP_ID',
    resolvedValues.appSecret ? '' : 'WHATSAPP_APP_SECRET',
  ].filter(Boolean)

  return Array.from(new Set(missing))
}

export const readWhatsappMetaConfig = (
  env: EnvMap = process.env,
): WhatsappMetaConfigSnapshot => {
  const resolvedValues = resolveWhatsappMetaValues(env)
  const missingCanonicalVariables = buildMissingCanonicalVariables(resolvedValues)

  return {
    accessTokenConfigured: Boolean(resolvedValues.accessToken.value),
    accessTokenSource: resolvedValues.accessToken.source,
    phoneNumberIdConfigured: Boolean(resolvedValues.phoneNumberId.value),
    phoneNumberIdSource: resolvedValues.phoneNumberId.source,
    webhookVerifyTokenConfigured: Boolean(resolvedValues.webhookVerifyToken.value),
    webhookVerifyTokenSource: resolvedValues.webhookVerifyToken.source,
    businessAccountIdConfigured: Boolean(resolvedValues.businessAccountId),
    appIdConfigured: Boolean(resolvedValues.appId),
    appSecretConfigured: Boolean(resolvedValues.appSecret),
    graphApiVersion: resolvedValues.graphApiVersion,
    graphApiVersionSource: resolvedValues.graphApiVersionSource,
    graphApiVersionValid: resolvedValues.graphApiVersionValid,
    missingCanonicalVariables,
    missingSendVariables: [
      resolvedValues.accessToken.value ? '' : 'WHATSAPP_ACCESS_TOKEN',
      resolvedValues.phoneNumberId.value ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
    ].filter(Boolean),
    missingWebhookPostVariables: [
      resolvedValues.appSecret ? '' : 'WHATSAPP_APP_SECRET',
    ].filter(Boolean),
    missingHealthVariables: [
      resolvedValues.accessToken.value ? '' : 'WHATSAPP_ACCESS_TOKEN',
      resolvedValues.phoneNumberId.value ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
      resolvedValues.businessAccountId ? '' : 'WHATSAPP_BUSINESS_ACCOUNT_ID',
      resolvedValues.appId ? '' : 'WHATSAPP_APP_ID',
      resolvedValues.appSecret ? '' : 'WHATSAPP_APP_SECRET',
    ].filter(Boolean),
    legacyCompatibility: {
      usesLegacyAccessTokenAlias: resolvedValues.accessToken.source === 'legacy',
      usesLegacyPhoneNumberIdAlias: resolvedValues.phoneNumberId.source === 'legacy',
      usesLegacyWebhookVerifyTokenAlias:
        resolvedValues.webhookVerifyToken.source === 'legacy',
    },
  }
}

export const resolveWhatsappSendConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaSendConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const resolvedValues = resolveWhatsappMetaValues(env)

  if (snapshot.missingSendVariables.length > 0) {
    return {
      ok: false,
      missingVariables: snapshot.missingSendVariables,
      snapshot,
    }
  }

  return {
    ok: true,
    config: {
      accessToken: resolvedValues.accessToken.value,
      phoneNumberId: resolvedValues.phoneNumberId.value,
      graphApiVersion: snapshot.graphApiVersion,
    },
    snapshot,
  }
}

export const resolveWhatsappWebhookPostConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaWebhookPostConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const resolvedValues = resolveWhatsappMetaValues(env)

  if (snapshot.missingWebhookPostVariables.length > 0) {
    return {
      ok: false,
      missingVariables: snapshot.missingWebhookPostVariables,
      snapshot,
    }
  }

  return {
    ok: true,
    config: {
      appSecret: resolvedValues.appSecret,
    },
    snapshot,
  }
}

export const resolveWhatsappHealthConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaHealthConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const resolvedValues = resolveWhatsappMetaValues(env)

  if (snapshot.missingHealthVariables.length > 0) {
    return {
      ok: false,
      missingVariables: snapshot.missingHealthVariables,
      snapshot,
    }
  }

  if (!snapshot.graphApiVersionValid) {
    return {
      ok: false,
      missingVariables: [],
      snapshot,
      error: 'WHATSAPP_GRAPH_API_VERSION must match the format vNN.N.',
    }
  }

  return {
    ok: true,
    config: {
      accessToken: resolvedValues.accessToken.value,
      phoneNumberId: resolvedValues.phoneNumberId.value,
      businessAccountId: resolvedValues.businessAccountId,
      appId: resolvedValues.appId,
      appSecret: resolvedValues.appSecret,
      graphApiVersion: snapshot.graphApiVersion,
    },
    snapshot,
  }
}

export const getWhatsappWebhookVerifyToken = (
  env: EnvMap = process.env,
) =>
  resolveCanonicalOrLegacy(env, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', ['WHATSAPP_VERIFY_TOKEN'])
    .value
