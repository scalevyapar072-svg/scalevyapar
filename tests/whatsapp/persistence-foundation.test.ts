import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWhatsappConsentState } from '../../lib/whatsapp/consent'
import { createWhatsappConsentRepository } from '../../lib/whatsapp/consent-repository'
import { createWhatsappInboundEventRepository } from '../../lib/whatsapp/inbound-event-repository'
import { getWhatsappPersistenceClient } from '../../lib/whatsapp/persistence-client'
import type {
  WhatsappConsentEventRow,
  WhatsappConsentRow,
  WhatsappInboundEventRow,
  WhatsappSettingRow,
  WhatsappSuppressionRow,
  WhatsappTemplateInventoryRow,
} from '../../lib/whatsapp/persistence-types'
import { createWhatsappSettingsRepository } from '../../lib/whatsapp/settings-repository'
import { createWhatsappSuppressionRepository } from '../../lib/whatsapp/suppression-repository'
import {
  createWhatsappTemplateInventoryRepository,
  evaluateTemplateSendEligibility,
  prepareTemplateInventoryUpsert,
} from '../../lib/whatsapp/template-inventory-repository'

const makeConsentStore = () => {
  const currentRows: WhatsappConsentRow[] = []
  const eventRows: WhatsappConsentEventRow[] = []

  return {
    currentRows,
    eventRows,
    store: {
      async listCurrentConsents(query: {
        recipientType: string
        recipientId?: string | null
        normalizedMobile: string
        consentType?: string
      }) {
        return currentRows.filter((row) => {
          if (row.recipientType !== query.recipientType) return false
          if (row.normalizedMobile !== query.normalizedMobile) return false
          if (typeof query.consentType !== 'undefined' && row.consentType !== query.consentType) {
            return false
          }
          if (typeof query.recipientId !== 'undefined' && row.recipientId !== query.recipientId) {
            return false
          }
          return true
        })
      },
      async insertConsentEvent(
        row: Omit<WhatsappConsentEventRow, 'id' | 'createdAt'>,
      ) {
        const nextRow: WhatsappConsentEventRow = {
          ...row,
          id: `event-${eventRows.length + 1}`,
          createdAt: row.occurredAt,
        }
        eventRows.push(nextRow)
        return nextRow
      },
      async insertCurrentConsent(
        row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const nextRow: WhatsappConsentRow = {
          ...row,
          id: `consent-${currentRows.length + 1}`,
          createdAt: '2026-08-22T00:00:00.000Z',
          updatedAt: '2026-08-22T00:00:00.000Z',
        }
        currentRows.push(nextRow)
        return nextRow
      },
      async updateCurrentConsent(
        id: string,
        row: Omit<WhatsappConsentRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const index = currentRows.findIndex((candidate) => candidate.id === id)
        assert.notEqual(index, -1)
        const nextRow: WhatsappConsentRow = {
          ...currentRows[index],
          ...row,
          id,
          updatedAt: '2026-08-22T00:01:00.000Z',
        }
        currentRows[index] = nextRow
        return nextRow
      },
      async countCurrentConsents(input: {
        recipientType: 'worker' | 'company'
        consentType: string
        allowed: boolean
      }) {
        return currentRows.filter(
          (row) =>
            row.recipientType === input.recipientType &&
            row.consentType === input.consentType &&
            row.allowed === input.allowed,
        ).length
      },
    },
  }
}

const makeSuppressionStore = () => {
  const rows: WhatsappSuppressionRow[] = []

  return {
    rows,
    store: {
      async getActiveSuppression(normalizedMobile: string) {
        return rows.find((row) => row.normalizedMobile === normalizedMobile && row.active) || null
      },
      async insertSuppression(
        row: Omit<
          WhatsappSuppressionRow,
          'id' | 'createdAt' | 'updatedAt' | 'restorationRequestedAt' | 'restorationMessageId'
        >,
      ) {
        const nextRow: WhatsappSuppressionRow = {
          ...row,
          id: `suppression-${rows.length + 1}`,
          restorationRequestedAt: null,
          restorationMessageId: null,
          createdAt: '2026-08-22T01:00:00.000Z',
          updatedAt: '2026-08-22T01:00:00.000Z',
        }
        rows.push(nextRow)
        return nextRow
      },
      async updateSuppression(id: string, row: Partial<WhatsappSuppressionRow>) {
        const index = rows.findIndex((candidate) => candidate.id === id)
        assert.notEqual(index, -1)
        const nextRow: WhatsappSuppressionRow = {
          ...rows[index],
          ...row,
          id,
          updatedAt: '2026-08-22T01:05:00.000Z',
        }
        rows[index] = nextRow
        return nextRow
      },
      async listSuppressionHistory(limit: number) {
        return rows.slice(0, limit)
      },
      async countActiveSuppressions() {
        return rows.filter((row) => row.active).length
      },
    },
  }
}

const makeInboundStore = () => {
  const rows: WhatsappInboundEventRow[] = []

  return {
    rows,
    store: {
      async getByMessageId(messageId: string) {
        return rows.find((row) => row.messageId === messageId) || null
      },
      async insertInboundEvent(
        row: Omit<WhatsappInboundEventRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const nextRow: WhatsappInboundEventRow = {
          ...row,
          id: `inbound-${rows.length + 1}`,
          createdAt: '2026-08-22T02:00:00.000Z',
          updatedAt: '2026-08-22T02:00:00.000Z',
        }
        rows.push(nextRow)
        return nextRow
      },
    },
  }
}

test('persistence client fails closed when service-role configuration is missing', async () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const result = getWhatsappPersistenceClient()
    assert.equal(result.available, false)
    if (!result.available) {
      assert.deepEqual(result.missingConfigurationNames, [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ])
      assert.match(result.message, /Persistence unavailable/)
    }
  } finally {
    if (typeof originalSupabaseUrl !== 'undefined') {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
    }
    if (typeof originalServiceRoleKey !== 'undefined') {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
    }
  }
})

test('empty consent state never infers registration consent', async () => {
  const { store } = makeConsentStore()
  const repository = createWhatsappConsentRepository({ store })

  assert.deepEqual(
    await repository.getEffectiveConsentState({
      recipientType: 'worker',
      normalizedMobile: '+919876543210',
    }),
    buildWhatsappConsentState(),
  )
})

test('consent decision writes current state and immutable event history through one contract', async () => {
  const { store, currentRows, eventRows } = makeConsentStore()
  let atomicRuns = 0
  const repository = createWhatsappConsentRepository({
    store,
    runAtomically: async (callback) => {
      atomicRuns += 1
      return callback()
    },
  })

  const result = await repository.recordConsentDecision({
    recipientType: 'worker',
    recipientId: 'worker-1',
    mobile: '9876543210',
    consentType: 'service_allowed',
    allowed: true,
    eventType: 'granted',
    source: 'worker_settings',
    consentTextVersion: 'v1',
  })

  assert.equal(atomicRuns, 1)
  assert.equal(currentRows.length, 1)
  assert.equal(eventRows.length, 1)
  assert.equal(result.atomicWriteApplied, true)
  assert.equal(result.currentConsent.allowed, true)
  assert.equal(result.consentEvent.newAllowed, true)
  assert.equal(result.consentEvent.previousAllowed, null)
})

test('suppression remains idempotent and restoration request does not silently restore consent', async () => {
  const { store, rows } = makeSuppressionStore()
  const repository = createWhatsappSuppressionRepository({ store })

  const first = await repository.recordSuppression({
    mobile: '9876543210',
    triggerSource: 'inbound_opt_out',
    triggerCommand: 'STOP',
    previousConsentSnapshot: {
      matching_alerts_allowed: true,
      marketing_allowed: false,
    },
  })
  const duplicate = await repository.recordSuppression({
    mobile: '9876543210',
    triggerSource: 'inbound_opt_out',
    triggerCommand: 'STOP',
  })
  const restoration = await repository.recordRestorationRequest({
    mobile: '9876543210',
    restorationMessageId: 'wamid-start-1',
  })
  const summary = await repository.getSuppressionSummary()

  assert.equal(first.created, true)
  assert.equal(duplicate.duplicate, true)
  assert.equal(restoration.updated, true)
  assert.equal(rows[0]?.active, true)
  assert.equal(summary.recentRecords[0]?.maskedMobile, '+91******3210')
  assert.doesNotMatch(JSON.stringify(summary), /9876543210/)
})

test('inbound event contract deduplicates message ids and classifies Hindi and English commands', async () => {
  const { store } = makeInboundStore()
  const repository = createWhatsappInboundEventRepository({ store })

  const optOutPrepared = await repository.classifyAndPrepareInboundEvent({
    messageId: 'wamid-stop-1',
    mobile: '9876543210',
    rawText: ' मैसेज बंद करें ',
  })
  const restorePrepared = await repository.classifyAndPrepareInboundEvent({
    messageId: 'wamid-start-1',
    mobile: '9876543210',
    rawText: 'SUBSCRIBE',
  })
  const firstRecord = await repository.recordInboundEvent({
    messageId: optOutPrepared.messageId,
    normalizedMobile: optOutPrepared.normalizedMobile,
    matchedRecipientType: null,
    matchedRecipientId: null,
    eventKind: optOutPrepared.eventKind,
    rawText: optOutPrepared.rawText,
    normalizedText: optOutPrepared.normalizedText,
    commandKey: optOutPrepared.commandKey,
    suppressionApplied: optOutPrepared.suppressionApplied,
    metadata: optOutPrepared.metadata,
  })
  const duplicateRecord = await repository.recordInboundEvent({
    messageId: optOutPrepared.messageId,
    normalizedMobile: optOutPrepared.normalizedMobile,
    matchedRecipientType: null,
    matchedRecipientId: null,
    eventKind: optOutPrepared.eventKind,
    rawText: optOutPrepared.rawText,
    normalizedText: optOutPrepared.normalizedText,
    commandKey: optOutPrepared.commandKey,
    suppressionApplied: optOutPrepared.suppressionApplied,
    metadata: optOutPrepared.metadata,
  })

  assert.equal(optOutPrepared.classification.kind, 'opt_out_all')
  assert.equal(optOutPrepared.eventKind, 'opt_out_all')
  assert.equal(restorePrepared.classification.kind, 'restore_request')
  assert.equal(restorePrepared.eventKind, 'restore_request')
  assert.equal(firstRecord.duplicate, false)
  assert.equal(duplicateRecord.duplicate, true)
})

test('template eligibility validates persisted shape and the repository path never calls /messages', async () => {
  let fetchCalls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    fetchCalls += 1
    return Response.json({})
  }) as typeof fetch

  try {
    const validTemplate: WhatsappTemplateInventoryRow = {
      id: 'template-1',
      metaTemplateName: 'worker_confirmation',
      language: 'en',
      metaCategory: 'UTILITY',
      metaStatus: 'APPROVED',
      intendedRecipientType: 'worker',
      intendedBusinessEvent: 'worker_confirmation',
      headerType: 'DOCUMENT',
      bodyVariableSchema: [{ placeholder: '{{1}}', position: 1 }],
      footerText: '',
      buttonSchema: [
        {
          type: 'QUICK_REPLY',
          label: 'STOP',
          targetSummary: 'Quick reply',
          optOutQuickReply: true,
        },
      ],
      enabled: true,
      safeTestAvailable: false,
      metadata: {},
      lastSynchronizedAt: '2026-08-22T03:00:00.000Z',
      createdAt: '2026-08-22T03:00:00.000Z',
      updatedAt: '2026-08-22T03:00:00.000Z',
    }

    const invalidTemplate: WhatsappTemplateInventoryRow = {
      ...validTemplate,
      id: 'template-2',
      headerType: 'TEXT',
      bodyVariableSchema: {} as unknown[],
      buttonSchema: [{ type: 'MAGIC', label: 'Nope' } as unknown as never],
      metaStatus: 'PENDING',
      enabled: false,
      safeTestAvailable: true,
    }

    assert.deepEqual(
      evaluateTemplateSendEligibility({ template: validTemplate }),
      {
        eligible: true,
        reasonCodes: [],
        approved: true,
        headerValid: true,
        bodySchemaValid: true,
        buttonSchemaValid: true,
        safeTestAllowed: true,
      },
    )

    const invalidEligibility = evaluateTemplateSendEligibility({
      template: invalidTemplate,
      testMode: true,
    })

    assert.equal(invalidEligibility.eligible, false)
    assert.ok(invalidEligibility.reasonCodes.includes('meta_status_not_approved'))
    assert.ok(invalidEligibility.reasonCodes.includes('template_not_enabled'))
    assert.ok(invalidEligibility.reasonCodes.includes('invalid_body_variable_schema'))
    assert.ok(invalidEligibility.reasonCodes.includes('invalid_button_schema'))

    const preparedUpsert = prepareTemplateInventoryUpsert({
      template: {
        name: 'worker_confirmation',
        language: 'en',
        category: 'UTILITY',
        status: 'APPROVED',
        headerType: 'IMAGE',
        bodyVariableCount: 2,
        footerText: '',
        buttons: [
          {
            type: 'URL',
            label: 'Open profile',
            targetSummary: 'Configured URL',
            optOutQuickReply: false,
          },
        ],
        validationErrors: [],
      },
    })

    assert.deepEqual(
      {
        ...preparedUpsert,
        lastSynchronizedAt: 'dynamic',
      },
      {
        metaTemplateName: 'worker_confirmation',
        language: 'en',
        metaCategory: 'UTILITY',
        metaStatus: 'APPROVED',
        intendedRecipientType: null,
        intendedBusinessEvent: null,
        headerType: 'IMAGE',
        bodyVariableSchema: [
          { placeholder: '{{1}}', position: 1 },
          { placeholder: '{{2}}', position: 2 },
        ],
        footerText: '',
        buttonSchema: [
          {
            type: 'URL',
            label: 'Open profile',
            targetSummary: 'Configured URL',
            optOutQuickReply: false,
          },
        ],
        enabled: false,
        safeTestAvailable: false,
        metadata: {},
        lastSynchronizedAt: 'dynamic',
      },
    )
    assert.match(preparedUpsert.lastSynchronizedAt, /^\d{4}-\d{2}-\d{2}T/)

    const repository = createWhatsappTemplateInventoryRepository({
      store: {
        async listTemplates() {
          return [validTemplate]
        },
        async getTemplateByNameAndLanguage() {
          return validTemplate
        },
      },
    })

    const summary = await repository.getTemplateInventorySummary()
    assert.equal(summary.totalTemplates, 1)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('pause state fails closed for missing invalid and query error settings', async () => {
  const missingRepository = createWhatsappSettingsRepository({
    store: {
      async getSetting() {
        return null
      },
      async listSettings() {
        return []
      },
    },
  })

  const invalidRepository = createWhatsappSettingsRepository({
    store: {
      async getSetting() {
        return {
          id: 'setting-1',
          settingsKey: 'pause_all_sending',
          settingsValue: 'true',
          description: '',
          createdAt: '',
          updatedAt: '',
        } satisfies WhatsappSettingRow
      },
      async listSettings() {
        return []
      },
    },
  })

  const errorRepository = createWhatsappSettingsRepository({
    store: {
      async getSetting() {
        throw new Error('boom')
      },
      async listSettings() {
        return []
      },
    },
  })

  const explicitFalseRepository = createWhatsappSettingsRepository({
    store: {
      async getSetting() {
        return {
          id: 'setting-2',
          settingsKey: 'pause_all_sending',
          settingsValue: false,
          description: '',
          createdAt: '',
          updatedAt: '',
        } satisfies WhatsappSettingRow
      },
      async listSettings() {
        return []
      },
    },
  })

  assert.deepEqual(await missingRepository.isAllSendingPaused(), {
    paused: true,
    reason: 'missing',
  })
  assert.deepEqual(await invalidRepository.isAllSendingPaused(), {
    paused: true,
    reason: 'invalid',
  })
  assert.deepEqual(await errorRepository.isAllSendingPaused(), {
    paused: true,
    reason: 'query_error',
  })
  assert.deepEqual(await explicitFalseRepository.isAllSendingPaused(), {
    paused: false,
    reason: 'explicit_false',
  })
})
