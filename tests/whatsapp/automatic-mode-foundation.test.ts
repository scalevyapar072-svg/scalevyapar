import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { createWhatsappAutomationExecutionRepository } from '../../lib/whatsapp/automation-execution-repository'
import { createWhatsappAutomaticModeRepository } from '../../lib/whatsapp/automatic-mode-repository'
import {
  DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
  DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
} from '../../lib/whatsapp/automatic-mode'
import type {
  WhatsappAutomaticDeliveryAttemptRow,
  WhatsappAutomaticExecutionRow,
  WhatsappCompanyAutomationEntitlementRow,
  WhatsappSettingRow,
} from '../../lib/whatsapp/persistence-types'

const workspaceRoot = process.cwd()
const migrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260825131706_add_labour_whatsapp_automatic_mode_foundation.sql',
)
const senderSourcePath = path.join(workspaceRoot, 'lib', 'labour-whatsapp.ts')
const bulkUiPath = path.join(
  workspaceRoot,
  'components',
  'admin',
  'labour-whatsapp-templates.tsx',
)

const makeSettingRow = (settingsValue: unknown): WhatsappSettingRow => ({
  id: 'setting-1',
  settingsKey: 'automatic_messaging_mode',
  settingsValue,
  description: '',
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
})

const makePricingSettingRow = (settingsValue: unknown): WhatsappSettingRow => ({
  ...makeSettingRow(settingsValue),
  settingsKey: 'automatic_addon_pricing',
})

const makeEntitlementRow = (
  overrides: Partial<WhatsappCompanyAutomationEntitlementRow> = {},
): WhatsappCompanyAutomationEntitlementRow => ({
  id: 'entitlement-1',
  companyId: 'company-1',
  entitlementStatus: 'active',
  entitlementMode: 'paid',
  validFrom: '2026-08-01T00:00:00.000Z',
  validUntil: '2026-09-01T00:00:00.000Z',
  paymentOrderReference: 'order-1',
  paymentReference: 'payment-1',
  source: 'checkout_activation',
  metadata: {},
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
  ...overrides,
})

const makeExecutionStore = () => {
  const executionRows: WhatsappAutomaticExecutionRow[] = []
  const deliveryRows: WhatsappAutomaticDeliveryAttemptRow[] = []

  return {
    executionRows,
    deliveryRows,
    store: {
      async getExecutionByIdempotencyKey(key: string) {
        return executionRows.find((row) => row.idempotencyKey === key) || null
      },
      async insertExecution(
        row: Omit<WhatsappAutomaticExecutionRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const nextRow: WhatsappAutomaticExecutionRow = {
          ...row,
          id: `execution-${executionRows.length + 1}`,
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        }
        executionRows.push(nextRow)
        return nextRow
      },
      async getDeliveryAttemptByRecipient(input: {
        executionId: string
        recipientType: 'worker' | 'company'
        recipientId: string
      }) {
        return (
          deliveryRows.find(
            (row) =>
              row.executionId === input.executionId &&
              row.recipientType === input.recipientType &&
              row.recipientId === input.recipientId,
          ) || null
        )
      },
      async insertDeliveryAttempt(
        row: Omit<WhatsappAutomaticDeliveryAttemptRow, 'id' | 'createdAt' | 'updatedAt'>,
      ) {
        const nextRow: WhatsappAutomaticDeliveryAttemptRow = {
          ...row,
          id: `attempt-${deliveryRows.length + 1}`,
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:00.000Z',
        }
        deliveryRows.push(nextRow)
        return nextRow
      },
    },
  }
}

test('automatic mode defaults to OFF for missing invalid and unreadable settings', async () => {
  const missingRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return null
      },
      async listEntitlements() {
        return []
      },
    },
  })

  const invalidRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return makeSettingRow({ mode: 'launch' })
      },
      async listEntitlements() {
        return []
      },
    },
  })

  const errorRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        throw new Error('boom')
      },
      async listEntitlements() {
        return []
      },
    },
  })

  assert.deepEqual(await missingRepository.resolveAutomaticMode(), {
    mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
    source: 'missing',
  })
  assert.deepEqual(await invalidRepository.resolveAutomaticMode(), {
    mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
    source: 'invalid',
  })
  assert.deepEqual(await errorRepository.resolveAutomaticMode(), {
    mode: DEFAULT_WHATSAPP_AUTOMATIC_MESSAGE_MODE,
    source: 'query_error',
  })
})

test('automatic pricing foundation defaults inactive and zero-priced when missing or invalid', async () => {
  const repository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting(key: string) {
        if (key === 'automatic_addon_pricing') {
          return makePricingSettingRow({ active: 'yes', currency: 'rupees', amountMinor: -1 })
        }

        return makeSettingRow({ mode: 'off' })
      },
      async listEntitlements() {
        return []
      },
    },
  })

  assert.deepEqual(await repository.getAutomationPricingSettings(), {
    pricing: DEFAULT_WHATSAPP_AUTOMATION_PRICING_SETTINGS,
    source: 'invalid',
  })
})

test('FREE mode does not require a paid entitlement while PAID mode requires a valid active entitlement', async () => {
  const repository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return makeSettingRow({ mode: 'free' })
      },
      async listEntitlements() {
        return [makeEntitlementRow()]
      },
    },
  })

  const freeResult = await repository.checkCompanyEntitlement({
    companyId: 'company-1',
    mode: 'free',
    now: new Date('2026-08-25T12:00:00.000Z'),
  })
  const paidResult = await repository.checkCompanyEntitlement({
    companyId: 'company-1',
    mode: 'paid',
    now: new Date('2026-08-25T12:00:00.000Z'),
  })

  assert.deepEqual(freeResult, {
    eligible: true,
    evaluatedMode: 'free',
    reason: 'not_required',
    entitlement: null,
  })
  assert.equal(paidResult.eligible, true)
  assert.equal(paidResult.reason, 'active')
  assert.equal(paidResult.entitlement?.companyId, 'company-1')
})

test('expired inactive and missing PAID entitlements fail closed', async () => {
  const expiredRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return makeSettingRow({ mode: 'paid' })
      },
      async listEntitlements() {
        return [
          makeEntitlementRow({
            validUntil: '2026-08-20T00:00:00.000Z',
          }),
        ]
      },
    },
  })
  const inactiveRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return makeSettingRow({ mode: 'paid' })
      },
      async listEntitlements() {
        return [
          makeEntitlementRow({
            entitlementStatus: 'inactive',
            paymentOrderReference: null,
            paymentReference: null,
          }),
        ]
      },
    },
  })
  const missingRepository = createWhatsappAutomaticModeRepository({
    store: {
      async getSetting() {
        return makeSettingRow({ mode: 'paid' })
      },
      async listEntitlements() {
        return []
      },
    },
  })

  assert.deepEqual(
    await expiredRepository.checkCompanyEntitlement({
      companyId: 'company-1',
      mode: 'paid',
      now: new Date('2026-08-25T12:00:00.000Z'),
    }),
    {
      eligible: false,
      evaluatedMode: 'paid',
      reason: 'expired',
      entitlement: makeEntitlementRow({
        validUntil: '2026-08-20T00:00:00.000Z',
      }),
    },
  )

  assert.deepEqual(
    await inactiveRepository.checkCompanyEntitlement({
      companyId: 'company-1',
      mode: 'paid',
      now: new Date('2026-08-25T12:00:00.000Z'),
    }),
    {
      eligible: false,
      evaluatedMode: 'paid',
      reason: 'inactive',
      entitlement: makeEntitlementRow({
        entitlementStatus: 'inactive',
        paymentOrderReference: null,
        paymentReference: null,
      }),
    },
  )

  assert.deepEqual(
    await missingRepository.checkCompanyEntitlement({
      companyId: 'company-1',
      mode: 'paid',
      now: new Date('2026-08-25T12:00:00.000Z'),
    }),
    {
      eligible: false,
      evaluatedMode: 'paid',
      reason: 'missing',
      entitlement: null,
    },
  )
})

test('execution idempotency and delivery-attempt uniqueness prevent duplicate automatic audit rows', async () => {
  const { store, executionRows, deliveryRows } = makeExecutionStore()
  const repository = createWhatsappAutomationExecutionRepository({ store })

  const firstExecution = await repository.recordExecution({
    automationEventType: 'job_post_matching',
    companyId: 'company-1',
    jobPostId: 'job-1',
    modeSnapshot: 'paid',
    idempotencyKey: 'job-1:job_post_matching',
  })
  const duplicateExecution = await repository.recordExecution({
    automationEventType: 'job_post_matching',
    companyId: 'company-1',
    jobPostId: 'job-1',
    modeSnapshot: 'paid',
    idempotencyKey: 'job-1:job_post_matching',
  })

  const firstAttempt = await repository.recordDeliveryAttempt({
    executionId: firstExecution.execution.id,
    recipientType: 'worker',
    recipientId: 'worker-1',
    templateName: 'matched_job_alert',
    templateLanguage: 'en',
    eligibilityOutcome: 'eligible',
    attemptStatus: 'blocked',
    reasonCode: 'pause_all_sending',
  })
  const duplicateAttempt = await repository.recordDeliveryAttempt({
    executionId: firstExecution.execution.id,
    recipientType: 'worker',
    recipientId: 'worker-1',
    templateName: 'matched_job_alert',
    templateLanguage: 'en',
    eligibilityOutcome: 'eligible',
    attemptStatus: 'blocked',
    reasonCode: 'pause_all_sending',
  })

  assert.equal(firstExecution.duplicate, false)
  assert.equal(duplicateExecution.duplicate, true)
  assert.equal(firstAttempt.duplicate, false)
  assert.equal(duplicateAttempt.duplicate, true)
  assert.equal(executionRows.length, 1)
  assert.equal(deliveryRows.length, 1)
})

test('foundation source leaves /messages isolated and preserves pause_all_sending plus Preview blocking', () => {
  const source = readFileSync(senderSourcePath, 'utf8')

  assert.ok(source.includes('whatsapp-paused'))
  assert.ok(source.includes('whatsapp-disabled-outside-production'))
  assert.ok(source.includes('createSettingsRepository'))
  assert.ok(source.includes('isAllSendingPaused'))
  assert.ok(source.includes("String(dependencies.env.VERCEL_ENV || '').trim().toLowerCase() !== 'production'"))
  assert.ok(source.includes('https://graph.facebook.com/'))
  assert.ok(source.includes('/messages'))
})

test('manual bulk workflow source remains unchanged by automatic-mode foundation', () => {
  const source = readFileSync(bulkUiPath, 'utf8')

  for (const label of [
    'Worker All Status',
    'Paused by Worker',
    'Company All Status',
    'Job All Status',
    'Job Category filter',
    'Select All',
    'Eligible preview: 0',
    'Excluded preview: 0',
    'Recipient queries executed: NONE',
    'cannot bypass pause_all_sending',
    'unavailable in Preview',
    'Disabled — future controlled phase',
  ]) {
    assert.ok(source.includes(label), `Expected bulk UI source to include: ${label}`)
  }

  assert.equal(source.includes('automatic_messaging_mode'), false)
})

test('migration source contains database-level uniqueness and security for the new automatic-mode foundation tables', () => {
  const source = readFileSync(migrationPath, 'utf8')

  for (const fragment of [
    'automatic_messaging_mode',
    'automatic_addon_pricing',
    'create table public.labour_whatsapp_company_automation_entitlements',
    'create table public.labour_whatsapp_automatic_executions',
    'create table public.labour_whatsapp_automatic_delivery_attempts',
    'idempotency_key text not null unique',
    'create unique index idx_labour_whatsapp_automatic_delivery_attempts_execution_recipient',
    'revoke all on table public.labour_whatsapp_company_automation_entitlements',
    'revoke all on table public.labour_whatsapp_automatic_executions',
    'revoke all on table public.labour_whatsapp_automatic_delivery_attempts',
    'grant select, insert, update, delete, references',
    'enable row level security',
  ]) {
    assert.ok(source.includes(fragment), `Expected migration to include: ${fragment}`)
  }
})
