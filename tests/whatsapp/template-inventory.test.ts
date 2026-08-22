import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeWhatsappButtonType,
  parseWhatsappTemplateContractFromMetaComponents,
  validateWhatsappTemplateButton,
  validateWhatsappTemplateHeaderBinding,
} from '../../lib/whatsapp/template-inventory'

test('template header types and approved buttons are parsed safely', () => {
  const contract = parseWhatsappTemplateContractFromMetaComponents([
    {
      type: 'HEADER',
      format: 'IMAGE',
    },
    {
      type: 'BODY',
      text: 'Hello {{1}}, job {{2}} is available.',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'PHONE_NUMBER',
          text: 'Call now',
          phone_number: '+919876543210',
        },
        {
          type: 'QUICK_REPLY',
          text: 'STOP',
        },
      ],
    },
  ])

  assert.equal(contract.headerType, 'IMAGE')
  assert.equal(contract.bodyVariableCount, 2)
  assert.deepEqual(
    contract.buttons.map((button) => ({
      type: button.type,
      optOutQuickReply: button.optOutQuickReply,
    })),
    [
      { type: 'CALL_PHONE_NUMBER', optOutQuickReply: false },
      { type: 'QUICK_REPLY', optOutQuickReply: true },
    ],
  )
  assert.deepEqual(contract.validationErrors, [])
})

test('media and header mismatches fail closed and arbitrary buttons are rejected', () => {
  assert.deepEqual(
    validateWhatsappTemplateHeaderBinding({
      headerType: 'TEXT',
      mediaAssetType: 'IMAGE',
      textValue: 'Preview text',
    }),
    {
      ok: false,
      errorCode: 'header_text_with_media',
    },
  )

  assert.equal(normalizeWhatsappButtonType('MAGIC_BUTTON'), null)
  assert.deepEqual(
    validateWhatsappTemplateButton({
      type: 'MAGIC_BUTTON',
      text: 'Nope',
    }),
    {
      ok: false,
      errorCode: 'unsupported_button_type',
    },
  )
})
