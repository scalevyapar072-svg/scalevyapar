import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { createWhatsappAutomationExecutionRepository } from '../../lib/whatsapp/automation-execution-repository'
import type {
  WhatsappAutomaticDeliveryAttemptRow,
  WhatsappAutomaticExecutionRow,
} from '../../lib/whatsapp/persistence-types'

const workspaceRoot = process.cwd()
const migrationPath = path.join(
  workspaceRoot,
  'supabase',
  'migrations',
  '20260825131706_add_labour_whatsapp_automation_execution_foundation.sql',
)
const senderSourcePath = path.join(workspaceRoot, 'lib', 'labour-whatsapp.ts')
const bulkUiPath = path.join(
  workspaceRoot,
  'components',
  'admin',
  'labour-whatsapp-templates.tsx',
)
const workerAppSourcePath = path.join(workspaceRoot, 'lib', 'labour-worker-app.ts')
const automaticModePath = path.join(workspaceRoot, 'lib', 'whatsapp', 'automatic-mode.ts')
const automaticModeRepositoryPath = path.join(
  workspaceRoot,
  'lib',
  'whatsapp',
  'automatic-mode-repository.ts',
)

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

test('commercial automatic-mode source files are removed from the repository', () => {
  assert.equal(existsSync(automaticModePath), false)
  assert.equal(existsSync(automaticModeRepositoryPath), false)
})

test('execution idempotency and delivery-attempt uniqueness prevent duplicate automatic audit rows', async () => {
  const { store, executionRows, deliveryRows } = makeExecutionStore()
  const repository = createWhatsappAutomationExecutionRepository({ store })

  const firstExecution = await repository.recordExecution({
    automationEventType: 'company_matching_digest',
    recipientType: 'company',
    recipientId: 'company-1',
    cycleStartsAt: '2026-08-25T00:00:00.000Z',
    cycleEndsAt: '2026-08-28T00:00:00.000Z',
    idempotencyKey: 'company-1:company_matching_digest:2026-08-25',
  })
  const duplicateExecution = await repository.recordExecution({
    automationEventType: 'company_matching_digest',
    recipientType: 'company',
    recipientId: 'company-1',
    cycleStartsAt: '2026-08-25T00:00:00.000Z',
    cycleEndsAt: '2026-08-28T00:00:00.000Z',
    idempotencyKey: 'company-1:company_matching_digest:2026-08-25',
  })

  const firstAttempt = await repository.recordDeliveryAttempt({
    executionId: firstExecution.execution.id,
    recipientType: 'company',
    recipientId: 'company-1',
    templateName: 'company_matching_digest',
    templateLanguage: 'en',
    eligibilityOutcome: 'eligible',
    attemptStatus: 'blocked',
    reasonCode: 'pause_all_sending',
  })
  const duplicateAttempt = await repository.recordDeliveryAttempt({
    executionId: firstExecution.execution.id,
    recipientType: 'company',
    recipientId: 'company-1',
    templateName: 'company_matching_digest',
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
  assert.equal(executionRows[0]?.recipientType, 'company')
  assert.equal(executionRows[0]?.cycleEndsAt, '2026-08-28T00:00:00.000Z')
})

test('foundation source leaves /messages isolated and preserves pause_all_sending plus Preview blocking', () => {
  const source = readFileSync(senderSourcePath, 'utf8')

  assert.ok(source.includes('whatsapp-paused'))
  assert.ok(source.includes('whatsapp-disabled-outside-production'))
  assert.ok(source.includes('createSettingsRepository'))
  assert.ok(source.includes('isAllSendingPaused'))
  assert.ok(
    source.includes("String(dependencies.env.VERCEL_ENV || '').trim().toLowerCase() !== 'production'"),
  )
  assert.ok(source.includes('https://graph.facebook.com/'))
  assert.ok(source.includes('/messages'))
})

test('manual bulk workflow source remains unchanged by corrected automatic scope', () => {
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
  assert.equal(source.includes('automatic_addon_pricing'), false)
  assert.equal(source.includes('company_automation_entitlements'), false)
})

test('worker application source no longer contains automatic WhatsApp application confirmations', () => {
  const source = readFileSync(workerAppSourcePath, 'utf8')

  assert.ok(source.includes('Automatic application-confirmation WhatsApp messages are intentionally disabled.'))
  assert.equal(source.includes('sendCompanyApplicationWhatsapp'), false)
  assert.equal(source.includes('sendWorkerApplicationConfirmationWhatsapp'), false)
  assert.equal(source.includes('WHATSAPP_COMPANY_APPLICATION_TEMPLATE_NAME'), false)
  assert.equal(source.includes('WHATSAPP_WORKER_CONFIRMATION_TEMPLATE_NAME'), false)
})

test('migration source contains only corrected audit and dedup foundations for approved automatic categories', () => {
  const source = readFileSync(migrationPath, 'utf8')

  for (const fragment of [
    'create table public.labour_whatsapp_automatic_executions',
    'create table public.labour_whatsapp_automatic_delivery_attempts',
    'company_matching_digest',
    'worker_matching_digest',
    'worker_payment_or_plan_reminder',
    'worker_kyc_rejected',
    'recipient_type text not null',
    'recipient_id text not null',
    'cycle_starts_at timestamptz not null',
    'cycle_ends_at timestamptz not null',
    'idempotency_key text not null unique',
    'create unique index idx_labour_whatsapp_automatic_executions_recipient_cycle',
    'create unique index idx_labour_whatsapp_automatic_delivery_attempts_execution_recipient',
    'revoke all on table public.labour_whatsapp_automatic_executions',
    'revoke all on table public.labour_whatsapp_automatic_delivery_attempts',
    'grant select, insert, update, delete, references',
    'enable row level security',
  ]) {
    assert.ok(source.includes(fragment), `Expected migration to include: ${fragment}`)
  }

  for (const fragment of [
    'automatic_messaging_mode',
    'automatic_addon_pricing',
    'labour_whatsapp_company_automation_entitlements',
    'mode_snapshot',
    "'free'",
    "'paid'",
  ]) {
    assert.equal(source.includes(fragment), false, `Expected migration to exclude: ${fragment}`)
  }
})
