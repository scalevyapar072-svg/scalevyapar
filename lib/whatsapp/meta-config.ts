import { assertWhatsappServerOnly } from './server-runtime.ts'

assertWhatsappServerOnly('lib/whatsapp/meta-config')

export const DEFAULT_WHATSAPP_GRAPH_API_VERSION = 'v23.0'

type EnvMap = Record<string, string | undefined>

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
  appSecret: string
  graphApiVersion: string
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
    }

const normalizeText = (value: string | undefined) => String(value || '').trim()

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

const buildMissingCanonicalVariables = (
  env: EnvMap,
  accessTokenResolution: EnvResolution,
  phoneNumberIdResolution: EnvResolution,
  webhookVerifyTokenResolution: EnvResolution,
) => {
  const missing = [
    accessTokenResolution.source === 'canonical' ? '' : 'WHATSAPP_ACCESS_TOKEN',
    phoneNumberIdResolution.source === 'canonical' ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
    webhookVerifyTokenResolution.source === 'canonical'
      ? ''
      : 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    normalizeText(env.WHATSAPP_BUSINESS_ACCOUNT_ID)
      ? ''
      : 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    normalizeText(env.WHATSAPP_APP_ID) ? '' : 'WHATSAPP_APP_ID',
    normalizeText(env.WHATSAPP_APP_SECRET) ? '' : 'WHATSAPP_APP_SECRET',
    normalizeText(env.WHATSAPP_GRAPH_API_VERSION) ? '' : '',
  ].filter(Boolean)

  return Array.from(new Set(missing))
}

export const readWhatsappMetaConfig = (
  env: EnvMap = process.env,
): WhatsappMetaConfigSnapshot => {
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
  const graphApiVersion = resolveCanonicalOrFallback(
    env,
    'WHATSAPP_GRAPH_API_VERSION',
    DEFAULT_WHATSAPP_GRAPH_API_VERSION,
  )
  const businessAccountId = normalizeText(env.WHATSAPP_BUSINESS_ACCOUNT_ID)
  const appId = normalizeText(env.WHATSAPP_APP_ID)
  const appSecret = normalizeText(env.WHATSAPP_APP_SECRET)

  const missingCanonicalVariables = buildMissingCanonicalVariables(
    env,
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
  )

  return {
    accessTokenConfigured: Boolean(accessToken.value),
    accessTokenSource: accessToken.source,
    phoneNumberIdConfigured: Boolean(phoneNumberId.value),
    phoneNumberIdSource: phoneNumberId.source,
    webhookVerifyTokenConfigured: Boolean(webhookVerifyToken.value),
    webhookVerifyTokenSource: webhookVerifyToken.source,
    businessAccountIdConfigured: Boolean(businessAccountId),
    appIdConfigured: Boolean(appId),
    appSecretConfigured: Boolean(appSecret),
    graphApiVersion: graphApiVersion.value,
    graphApiVersionSource: graphApiVersion.source,
    missingCanonicalVariables,
    missingSendVariables: [
      accessToken.value ? '' : 'WHATSAPP_ACCESS_TOKEN',
      phoneNumberId.value ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
    ].filter(Boolean),
    missingWebhookPostVariables: [appSecret ? '' : 'WHATSAPP_APP_SECRET'].filter(Boolean),
    missingHealthVariables: [
      accessToken.value ? '' : 'WHATSAPP_ACCESS_TOKEN',
      phoneNumberId.value ? '' : 'WHATSAPP_PHONE_NUMBER_ID',
      businessAccountId ? '' : 'WHATSAPP_BUSINESS_ACCOUNT_ID',
      appSecret ? '' : 'WHATSAPP_APP_SECRET',
    ].filter(Boolean),
    legacyCompatibility: {
      usesLegacyAccessTokenAlias: accessToken.source === 'legacy',
      usesLegacyPhoneNumberIdAlias: phoneNumberId.source === 'legacy',
      usesLegacyWebhookVerifyTokenAlias: webhookVerifyToken.source === 'legacy',
    },
  }
}

export const resolveWhatsappSendConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaSendConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const accessToken = resolveCanonicalOrLegacy(env, 'WHATSAPP_ACCESS_TOKEN', [
    'WHATSAPP_CLOUD_API_ACCESS_TOKEN',
  ])
  const phoneNumberId = resolveCanonicalOrLegacy(env, 'WHATSAPP_PHONE_NUMBER_ID', [
    'WHATSAPP_CLOUD_PHONE_NUMBER_ID',
  ])

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
      accessToken: accessToken.value,
      phoneNumberId: phoneNumberId.value,
      graphApiVersion: snapshot.graphApiVersion,
    },
    snapshot,
  }
}

export const resolveWhatsappWebhookPostConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaWebhookPostConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const appSecret = normalizeText(env.WHATSAPP_APP_SECRET)

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
      appSecret,
    },
    snapshot,
  }
}

export const resolveWhatsappHealthConfig = (
  env: EnvMap = process.env,
): ResolutionResult<WhatsappMetaHealthConfig> => {
  const snapshot = readWhatsappMetaConfig(env)
  const accessToken = resolveCanonicalOrLegacy(env, 'WHATSAPP_ACCESS_TOKEN', [
    'WHATSAPP_CLOUD_API_ACCESS_TOKEN',
  ])
  const phoneNumberId = resolveCanonicalOrLegacy(env, 'WHATSAPP_PHONE_NUMBER_ID', [
    'WHATSAPP_CLOUD_PHONE_NUMBER_ID',
  ])
  const businessAccountId = normalizeText(env.WHATSAPP_BUSINESS_ACCOUNT_ID)
  const appSecret = normalizeText(env.WHATSAPP_APP_SECRET)

  if (snapshot.missingHealthVariables.length > 0) {
    return {
      ok: false,
      missingVariables: snapshot.missingHealthVariables,
      snapshot,
    }
  }

  return {
    ok: true,
    config: {
      accessToken: accessToken.value,
      phoneNumberId: phoneNumberId.value,
      businessAccountId,
      appSecret,
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
