import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyWhatsappOptOutCommand,
  normalizeWhatsappCommandText,
} from '../../lib/whatsapp/opt-out'

test('STOP variants suppress all categories and duplicate opt-out is idempotent', () => {
  const primaryResult = classifyWhatsappOptOutCommand({
    text: 'STOP',
  })
  const duplicateResult = classifyWhatsappOptOutCommand({
    text: 'मैसेज बंद करें',
    currentlySuppressed: true,
  })

  assert.equal(primaryResult.kind, 'opt_out_all')
  assert.equal(primaryResult.suppressesAllCategories, true)
  assert.deepEqual(primaryResult.affectsConsentTypes, [
    'service_allowed',
    'matching_alerts_allowed',
    'marketing_allowed',
  ])
  assert.equal(duplicateResult.kind, 'opt_out_all')
  assert.equal(duplicateResult.duplicate, true)
})

test('START variants do not restore marketing automatically', () => {
  const result = classifyWhatsappOptOutCommand({
    text: 'SUBSCRIBE',
  })

  assert.equal(result.kind, 'restore_request')
  assert.deepEqual(result.restoresConsents, [])
  assert.equal(result.requiresFreshConsentFlow, true)
})

test('command normalization is stable across spacing and casing', () => {
  assert.equal(normalizeWhatsappCommandText('  UnSubscribe  '), 'unsubscribe')
  assert.equal(normalizeWhatsappCommandText(' मैसेज   बंद   करें '), 'मैसेज बंद करें')
})
