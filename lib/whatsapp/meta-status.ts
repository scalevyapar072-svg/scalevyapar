import {
  createWhatsappMetaReadOnlyClient,
  sanitizeMetaReadOnlyError,
  type WhatsappMetaReadOnlyClientError,
  type WhatsappMetaTemplateRecord,
} from './meta-client'
import { maskIdentifier, maskPhoneNumber } from './meta-mask'
import {
  readWhatsappMetaConfig,
  resolveWhatsappHealthConfig,
  resolveWhatsappMetaValues,
  type EnvMap,
  type WhatsappMetaConfigSnapshot,
} from './meta-config'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/meta-status')

type ConnectionState = 'connected' | 'misconfigured' | 'timed_out' | 'error'
type TokenHealthState = 'valid' | 'invalid' | 'not_checked' | 'timed_out' | 'error'

type TemplateCounts = {
  total: number
  byLanguage: Record<string, number>
  byCategory: Record<string, number>
  byStatus: Record<string, number>
}

export type WhatsappMetaConnectionStatus = {
  checkedAt: string
  graphApiVersion: string
  configurationState: {
    accessTokenConfigured: boolean
    phoneNumberIdConfigured: boolean
    webhookVerifyTokenConfigured: boolean
    businessAccountIdConfigured: boolean
    appIdConfigured: boolean
    appSecretConfigured: boolean
    previewSendingDisabled: boolean
    sendRuntimeReady: boolean
    graphApiVersionSource: WhatsappMetaConfigSnapshot['graphApiVersionSource']
    graphApiVersionValid: boolean
  }
  missingVariableNames: string[]
  legacyFallbackUsage: WhatsappMetaConfigSnapshot['legacyCompatibility']
  connectionState: ConnectionState
  tokenHealthState: TokenHealthState
  maskedAppId: string
  maskedWabaId: string
  maskedPhoneNumberId: string
  maskedSender: string
  displayName: string | null
  displayNameStatus: string | null
  registrationStatus: string | null
  qualityState: string | null
  templateCounts: TemplateCounts
  sanitizedError: string | null
}

export type WhatsappTemplateInventoryOverview = {
  checkedAt: string
  connectionState: ConnectionState
  previewSendingDisabled: boolean
  migrationApplied: false
  testActionEnabled: false
  persistenceState: string
  missingVariableNames: string[]
  sanitizedError: string | null
  templates: Array<{
    name: string
    language: string
    category: string
    status: string
    headerType: WhatsappMetaTemplateRecord['headerType']
    bodyVariableCount: number
    footerTextPresent: boolean
    buttons: WhatsappMetaTemplateRecord['buttons']
    enabled: false
    enabledReason: string
    safeTestAvailable: false
    validationErrors: string[]
  }>
}

const getEnvironmentLabel = (env: EnvMap) =>
  String(env.VERCEL_ENV || env.NODE_ENV || 'unknown').trim() || 'unknown'

const emptyTemplateCounts = (): TemplateCounts => ({
  total: 0,
  byLanguage: {},
  byCategory: {},
  byStatus: {},
})

const buildTemplateCounts = (templates: WhatsappMetaTemplateRecord[]): TemplateCounts => {
  const counts = emptyTemplateCounts()

  templates.forEach((template) => {
    counts.total += 1

    const language = template.language || 'unknown'
    const category = template.category || 'unknown'
    const status = template.status || 'unknown'

    counts.byLanguage[language] = (counts.byLanguage[language] || 0) + 1
    counts.byCategory[category] = (counts.byCategory[category] || 0) + 1
    counts.byStatus[status] = (counts.byStatus[status] || 0) + 1
  })

  return counts
}

const buildBaseStatus = (
  snapshot: WhatsappMetaConfigSnapshot,
  env: EnvMap,
): Omit<
  WhatsappMetaConnectionStatus,
  | 'connectionState'
  | 'tokenHealthState'
  | 'maskedAppId'
  | 'maskedWabaId'
  | 'maskedPhoneNumberId'
  | 'maskedSender'
  | 'displayName'
  | 'displayNameStatus'
  | 'registrationStatus'
  | 'qualityState'
  | 'templateCounts'
  | 'sanitizedError'
> => {
  const environmentLabel = getEnvironmentLabel(env)

  return {
    checkedAt: new Date().toISOString(),
    graphApiVersion: snapshot.graphApiVersion,
    configurationState: {
      accessTokenConfigured: snapshot.accessTokenConfigured,
      phoneNumberIdConfigured: snapshot.phoneNumberIdConfigured,
      webhookVerifyTokenConfigured: snapshot.webhookVerifyTokenConfigured,
      businessAccountIdConfigured: snapshot.businessAccountIdConfigured,
      appIdConfigured: snapshot.appIdConfigured,
      appSecretConfigured: snapshot.appSecretConfigured,
      previewSendingDisabled: environmentLabel === 'preview',
      sendRuntimeReady:
        environmentLabel === 'production' && snapshot.missingSendVariables.length === 0,
      graphApiVersionSource: snapshot.graphApiVersionSource,
      graphApiVersionValid: snapshot.graphApiVersionValid,
    },
    missingVariableNames: snapshot.missingHealthVariables,
    legacyFallbackUsage: snapshot.legacyCompatibility,
  }
}

const inferConnectionStateFromError = (error: unknown): ConnectionState => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as WhatsappMetaReadOnlyClientError).code === 'timeout'
  ) {
    return 'timed_out'
  }

  return 'error'
}

const buildTemplateOverviewRows = (
  templates: WhatsappMetaTemplateRecord[],
): WhatsappTemplateInventoryOverview['templates'] =>
  templates.map((template) => ({
    name: template.name,
    language: template.language,
    category: template.category,
    status: template.status,
    headerType: template.headerType,
    bodyVariableCount: template.bodyVariableCount,
    footerTextPresent: Boolean(template.footerText),
    buttons: template.buttons,
    enabled: false,
    enabledReason:
      'Read-only only. Persisted template enablement stays inactive until the reviewed migration is approved and applied.',
    safeTestAvailable: false,
    validationErrors: template.validationErrors,
  }))

export const getWhatsappMetaConnectionStatus = async ({
  env = process.env,
  fetchImplementation = fetch,
}: {
  env?: EnvMap
  fetchImplementation?: typeof fetch
} = {}): Promise<WhatsappMetaConnectionStatus> => {
  const snapshot = readWhatsappMetaConfig(env)
  const resolvedValues = resolveWhatsappMetaValues(env)
  const baseStatus = buildBaseStatus(snapshot, env)

  const maskedBaseFields = {
    maskedAppId: maskIdentifier(resolvedValues.appId),
    maskedWabaId: maskIdentifier(resolvedValues.businessAccountId),
    maskedPhoneNumberId: maskIdentifier(resolvedValues.phoneNumberId.value),
  }

  const healthConfig = resolveWhatsappHealthConfig(env)
  if (!healthConfig.ok) {
    return {
      ...baseStatus,
      ...maskedBaseFields,
      connectionState: 'misconfigured',
      tokenHealthState: 'not_checked',
      maskedSender: '',
      displayName: null,
      displayNameStatus: null,
      registrationStatus: null,
      qualityState: null,
      templateCounts: emptyTemplateCounts(),
      sanitizedError:
        ('error' in healthConfig ? healthConfig.error : undefined) ||
        'Meta read-only health check is fail-closed until the required server configuration exists.',
    }
  }

  try {
    const client = createWhatsappMetaReadOnlyClient(
      healthConfig.config,
      fetchImplementation,
    )
    const readinessSnapshot = await client.getReadinessSnapshot()
    const tokenHealthState = readinessSnapshot.tokenHealthResult.tokenHealth.state

    if (tokenHealthState !== 'valid') {
      return {
        ...baseStatus,
        ...maskedBaseFields,
        connectionState: 'error',
        tokenHealthState,
        maskedSender: '',
        displayName: null,
        displayNameStatus: null,
        registrationStatus: null,
        qualityState: null,
        templateCounts: emptyTemplateCounts(),
        sanitizedError: 'Meta access token is not currently valid for read-only WhatsApp inspection.',
      }
    }

    const phoneMetadata = readinessSnapshot.phoneMetadataResult?.phoneNumber
    const templateInventory = readinessSnapshot.templateInventoryResult?.templates || []

    return {
      ...baseStatus,
      maskedAppId:
        maskIdentifier(readinessSnapshot.tokenHealthResult.tokenHealth.appId) ||
        maskedBaseFields.maskedAppId,
      maskedWabaId:
        maskIdentifier(readinessSnapshot.wabaMetadataResult?.waba.id) ||
        maskedBaseFields.maskedWabaId,
      maskedPhoneNumberId:
        maskIdentifier(phoneMetadata?.id) || maskedBaseFields.maskedPhoneNumberId,
      connectionState: 'connected',
      tokenHealthState,
      maskedSender: maskPhoneNumber(phoneMetadata?.displayPhoneNumber),
      displayName: phoneMetadata?.verifiedName || null,
      displayNameStatus: phoneMetadata?.nameStatus || null,
      registrationStatus: phoneMetadata?.registrationStatus || null,
      qualityState: phoneMetadata?.qualityRating || null,
      templateCounts: buildTemplateCounts(templateInventory),
      sanitizedError: null,
    }
  } catch (error) {
    const connectionState = inferConnectionStateFromError(error)

    return {
      ...baseStatus,
      ...maskedBaseFields,
      connectionState,
      tokenHealthState: connectionState === 'timed_out' ? 'timed_out' : 'error',
      maskedSender: '',
      displayName: null,
      displayNameStatus: null,
      registrationStatus: null,
      qualityState: null,
      templateCounts: emptyTemplateCounts(),
      sanitizedError: sanitizeMetaReadOnlyError(error),
    }
  }
}

export const getWhatsappTemplateInventoryOverview = async ({
  env = process.env,
  fetchImplementation = fetch,
}: {
  env?: EnvMap
  fetchImplementation?: typeof fetch
} = {}): Promise<WhatsappTemplateInventoryOverview> => {
  const snapshot = readWhatsappMetaConfig(env)
  const environmentLabel = getEnvironmentLabel(env)
  const healthConfig = resolveWhatsappHealthConfig(env)
  const checkedAt = new Date().toISOString()

  if (!healthConfig.ok) {
    return {
      checkedAt,
      connectionState: 'misconfigured',
      previewSendingDisabled: environmentLabel === 'preview',
      migrationApplied: false,
      testActionEnabled: false,
      persistenceState:
        'Read-only architecture only. Consent and template persistence remain inactive until migration approval and application.',
      missingVariableNames: snapshot.missingHealthVariables,
      sanitizedError:
        ('error' in healthConfig ? healthConfig.error : undefined) ||
        'Meta read-only health check is fail-closed until the required server configuration exists.',
      templates: [],
    }
  }

  try {
    const client = createWhatsappMetaReadOnlyClient(
      healthConfig.config,
      fetchImplementation,
    )
    const readinessSnapshot = await client.getReadinessSnapshot()
    const tokenHealthState = readinessSnapshot.tokenHealthResult.tokenHealth.state

    if (tokenHealthState !== 'valid') {
      return {
        checkedAt,
        connectionState: 'error',
        previewSendingDisabled: environmentLabel === 'preview',
        migrationApplied: false,
        testActionEnabled: false,
        persistenceState:
          'Read-only architecture only. Consent and template persistence remain inactive until migration approval and application.',
        missingVariableNames: snapshot.missingHealthVariables,
        sanitizedError: 'Meta access token is not currently valid for read-only WhatsApp inspection.',
        templates: [],
      }
    }

    return {
      checkedAt,
      connectionState: 'connected',
      previewSendingDisabled: environmentLabel === 'preview',
      migrationApplied: false,
      testActionEnabled: false,
      persistenceState:
        'Read-only architecture only. Consent and template persistence remain inactive until migration approval and application.',
      missingVariableNames: snapshot.missingHealthVariables,
      sanitizedError: null,
      templates: buildTemplateOverviewRows(
        readinessSnapshot.templateInventoryResult?.templates || [],
      ),
    }
  } catch (error) {
    return {
      checkedAt,
      connectionState: inferConnectionStateFromError(error),
      previewSendingDisabled: environmentLabel === 'preview',
      migrationApplied: false,
      testActionEnabled: false,
      persistenceState:
        'Read-only architecture only. Consent and template persistence remain inactive until migration approval and application.',
      missingVariableNames: snapshot.missingHealthVariables,
      sanitizedError: sanitizeMetaReadOnlyError(error),
      templates: [],
    }
  }
}
