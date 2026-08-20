import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const REFERRAL_PAYOUT_ENCRYPTION_VERSION = 'v1'
const REFERRAL_PAYOUT_ENCRYPTION_SECRET_NAME = 'REFERRAL_PAYOUT_ENCRYPTION_KEY'

const getReferralPayoutEncryptionKey = () => {
  const secret = String(process.env[REFERRAL_PAYOUT_ENCRYPTION_SECRET_NAME] || '').trim()
  if (!secret) {
    throw new Error(`${REFERRAL_PAYOUT_ENCRYPTION_SECRET_NAME} is not configured`)
  }

  return createHash('sha256').update(secret).digest()
}

const toBase64Url = (value: Buffer) => value.toString('base64url')
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url')

export const getReferralPayoutEncryptionVersion = () => REFERRAL_PAYOUT_ENCRYPTION_VERSION

export const encryptReferralPayoutValue = (value: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error('Payout value is required for encryption.')
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getReferralPayoutEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    REFERRAL_PAYOUT_ENCRYPTION_VERSION,
    toBase64Url(iv),
    toBase64Url(ciphertext),
    toBase64Url(authTag),
  ].join(':')
}

export const decryptReferralPayoutValue = (value: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error('Encrypted payout value is required.')
  }

  const [version, iv, ciphertext, authTag] = normalized.split(':')
  if (
    version !== REFERRAL_PAYOUT_ENCRYPTION_VERSION ||
    !iv ||
    !ciphertext ||
    !authTag
  ) {
    throw new Error('Invalid encrypted payout value format.')
  }

  const decipher = createDecipheriv('aes-256-gcm', getReferralPayoutEncryptionKey(), fromBase64Url(iv))
  decipher.setAuthTag(fromBase64Url(authTag))
  const plaintext = Buffer.concat([
    decipher.update(fromBase64Url(ciphertext)),
    decipher.final(),
  ]).toString('utf8')

  if (!plaintext.trim()) {
    throw new Error('Decrypted payout value was empty.')
  }

  return plaintext
}

export const maskReferralBankAccount = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length < 4) return 'XXXX'
  return `${'X'.repeat(Math.max(digits.length - 4, 6))}${digits.slice(-4)}`
}

export const maskReferralUpiId = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''

  const [localPart, domainPart = ''] = normalized.split('@')
  if (!localPart) return domainPart ? `***@${domainPart}` : '***'

  const visiblePrefixLength = localPart.length <= 2 ? 1 : 2
  const visiblePrefix = localPart.slice(0, visiblePrefixLength)
  return domainPart ? `${visiblePrefix}***@${domainPart}` : `${visiblePrefix}***`
}
