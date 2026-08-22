import { createHmac, timingSafeEqual } from 'node:crypto'

import { assertWhatsappServerOnly } from './server-runtime.ts'

assertWhatsappServerOnly('lib/whatsapp/meta-signature')

export type MetaWebhookSignatureVerificationResult = {
  valid: boolean
  reason:
    | 'valid'
    | 'missing-app-secret'
    | 'missing-signature'
    | 'invalid-format'
    | 'invalid-signature'
}

const SIGNATURE_PREFIX = 'sha256='

const toBuffer = (value: string | Buffer) =>
  Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8')

export const verifyMetaWebhookSignature = ({
  rawBody,
  signatureHeader,
  appSecret,
}: {
  rawBody: string | Buffer
  signatureHeader: string | null
  appSecret: string
}): MetaWebhookSignatureVerificationResult => {
  if (!appSecret) {
    return {
      valid: false,
      reason: 'missing-app-secret',
    }
  }

  const normalizedHeader = String(signatureHeader || '').trim()
  if (!normalizedHeader) {
    return {
      valid: false,
      reason: 'missing-signature',
    }
  }

  if (!normalizedHeader.startsWith(SIGNATURE_PREFIX)) {
    return {
      valid: false,
      reason: 'invalid-format',
    }
  }

  const providedDigest = normalizedHeader.slice(SIGNATURE_PREFIX.length).trim()
  if (!/^[a-f0-9]{64}$/i.test(providedDigest)) {
    return {
      valid: false,
      reason: 'invalid-format',
    }
  }

  const expectedDigest = createHmac('sha256', appSecret)
    .update(toBuffer(rawBody))
    .digest('hex')

  try {
    const signaturesMatch = timingSafeEqual(
      Buffer.from(providedDigest, 'hex'),
      Buffer.from(expectedDigest, 'hex'),
    )

    return {
      valid: signaturesMatch,
      reason: signaturesMatch ? 'valid' : 'invalid-signature',
    }
  } catch {
    return {
      valid: false,
      reason: 'invalid-signature',
    }
  }
}
