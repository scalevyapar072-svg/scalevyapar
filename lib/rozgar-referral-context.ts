export type RozgarReferralContext = {
  version: 1
  referralCode: string
  categorySlug: string
  source?: 'play_install_referrer'
}

export type RozgarReferralParseResult =
  | { ok: true; context: RozgarReferralContext }
  | { ok: false; reason: string }

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details'
const ROZGAR_PACKAGE = 'in.scalevyapar.rozgar'
const MAX_REFERRER_LENGTH = 512
const REFERRAL_CODE_PATTERN = /^RZG[A-Z2-9]{8}$/
const CATEGORY_REFERENCE_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

export const normalizeRozgarReferralCode = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()

const normalizeCategoryReference = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()

export const parseRozgarPlayReferrerPayload = (payload: string): RozgarReferralParseResult => {
  const raw = String(payload || '').trim()
  if (!raw || raw.length > MAX_REFERRER_LENGTH) {
    return { ok: false, reason: 'empty-or-oversized' }
  }

  let params: URLSearchParams
  try {
    params = new URLSearchParams(raw)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (
    params.getAll('v').length !== 1 ||
    params.getAll('rzg_ref').length !== 1 ||
    params.getAll('cat').length !== 1
  ) {
    return { ok: false, reason: 'duplicate-or-missing' }
  }

  if (params.get('v') !== '1') {
    return { ok: false, reason: 'unsupported-version' }
  }

  const referralCode = normalizeRozgarReferralCode(params.get('rzg_ref'))
  const categorySlug = normalizeCategoryReference(params.get('cat'))
  if (!REFERRAL_CODE_PATTERN.test(referralCode)) {
    return { ok: false, reason: 'invalid-referral-code' }
  }
  if (!CATEGORY_REFERENCE_PATTERN.test(categorySlug)) {
    return { ok: false, reason: 'invalid-category' }
  }

  return {
    ok: true,
    context: {
      version: 1,
      referralCode,
      categorySlug,
      source: 'play_install_referrer'
    }
  }
}

export const parseRozgarRegistrationReferralContext = (value: unknown): RozgarReferralParseResult => {
  if (!value || typeof value !== 'object') {
    return { ok: false, reason: 'missing' }
  }

  const input = value as Record<string, unknown>
  if (Number(input.version) !== 1) {
    return { ok: false, reason: 'unsupported-version' }
  }

  const referralCode = normalizeRozgarReferralCode(input.referralCode)
  const categorySlug = normalizeCategoryReference(input.categorySlug)
  const source = String(input.source || '').trim()
  if (!REFERRAL_CODE_PATTERN.test(referralCode)) {
    return { ok: false, reason: 'invalid-referral-code' }
  }
  if (!CATEGORY_REFERENCE_PATTERN.test(categorySlug)) {
    return { ok: false, reason: 'invalid-category' }
  }
  if (source && source !== 'play_install_referrer') {
    return { ok: false, reason: 'invalid-source' }
  }

  return {
    ok: true,
    context: {
      version: 1,
      referralCode,
      categorySlug,
      source: 'play_install_referrer'
    }
  }
}

export const buildRozgarPlayReferrerPayload = (input: {
  referralCode: string
  categorySlug: string
}) => {
  const params = new URLSearchParams()
  params.set('v', '1')
  params.set('rzg_ref', normalizeRozgarReferralCode(input.referralCode))
  params.set('cat', normalizeCategoryReference(input.categorySlug))
  return params.toString()
}

export const buildRozgarPlayStoreReferralUrl = (input: {
  referralCode: string
  categorySlug: string
}) => {
  const url = new URL(PLAY_STORE_URL)
  url.searchParams.set('id', ROZGAR_PACKAGE)
  url.searchParams.set('referrer', buildRozgarPlayReferrerPayload(input))
  return url.toString()
}
