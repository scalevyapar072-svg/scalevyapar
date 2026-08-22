import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const sourcePath = path.join(
  process.cwd(),
  'components',
  'admin',
  'labour-whatsapp-templates.tsx',
)

test('Phase 16C.6A WhatsApp UI architecture strings remain visible and disabled', () => {
  const source = readFileSync(sourcePath, 'utf8')

  for (const label of [
    'Disabled — future controlled phase',
    "type: 'NONE'",
    "type: 'TEXT'",
    "type: 'IMAGE'",
    "type: 'VIDEO'",
    "type: 'DOCUMENT'",
    "type: 'CALL_PHONE_NUMBER'",
    "type: 'URL'",
    "type: 'QUICK_REPLY'",
    'No Header Template',
    'Text Header Template',
    'Image Header Template',
    'Video Header Template',
    'Document Header Template',
    'Stop Messages',
    'Test Template',
    'Admin-only',
    'approved template only',
    'one allowlisted test number',
    'unavailable in Preview',
    'cannot bypass pause_all_sending',
    'Automatic matching uses eligible Active Workers only.',
    'Paused by Worker never qualifies for automatic matching messages.',
    'Worker All Status',
    'Paused by Worker',
    'Company All Status',
    'Job All Status',
    'Job Category filter',
    'All Categories',
    'Select All',
    'Eligible preview: 0',
    'Excluded preview: 0',
    'Recipient queries executed: NONE',
    'Search Worker name/mobile',
    'Search Company name/mobile',
  ]) {
    assert.ok(source.includes(label), `Expected source to include: ${label}`)
  }

  assert.ok(source.includes('disabled'))
})

test('Phase 16C.6A UI correction adds no recipient query path and no /messages usage', () => {
  const source = readFileSync(sourcePath, 'utf8')
  const fetchMatches = source.match(/fetch\(/g) || []

  assert.equal(fetchMatches.length, 1)
  assert.ok(source.includes("/api/admin/labour/whatsapp/template-inventory"))
  assert.equal(source.includes('/messages'), false)
  assert.equal(source.includes('/api/admin/labour/whatsapp/recipients'), false)
  assert.equal(source.includes('/api/admin/labour/whatsapp/bulk'), false)
})
