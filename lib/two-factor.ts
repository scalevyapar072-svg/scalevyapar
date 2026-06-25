type TwoFactorOtpConfig = {
  apiKey: string
  templateName: string
  senderId: string
}

export type TwoFactorOtpSendResult = {
  expiresAt: string
  providerSessionId: string
}

type TwoFactorOtpSendPayload = {
  mobile: string
  otpCode: string
  expiresAt: string
}

type TwoFactorResponseShape = Record<string, unknown>

type ParsedTwoFactorResponse = {
  httpStatus: number
  providerStatus: string
  providerReason: string
  providerSessionId: string
  rawBodyPreview: string
}

const TWO_FACTOR_SUCCESS_STATUSES = new Set([
  'success',
  'ok',
  'sent',
  'queued',
  'submitted',
  'pending'
])

const toStringValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const maskMobile = (mobile: string) => {
  const normalized = mobile.replace(/\D/g, '')
  if (normalized.length < 4) {
    return '**********'
  }

  return `${normalized.slice(0, 2)}******${normalized.slice(-2)}`
}

const parseTwoFactorResponse = (
  httpStatus: number,
  rawBody: string,
  parsed: TwoFactorResponseShape | null
): ParsedTwoFactorResponse => {
  const providerStatus =
    toStringValue(parsed?.Status) ||
    toStringValue(parsed?.status) ||
    toStringValue(parsed?.message_status)

  const providerReason =
    toStringValue(parsed?.Details) ||
    toStringValue(parsed?.details) ||
    toStringValue(parsed?.message) ||
    toStringValue(parsed?.error) ||
    rawBody.trim()

  const providerSessionId =
    toStringValue(parsed?.session_id) ||
    toStringValue(parsed?.message_id) ||
    toStringValue(parsed?.request_id) ||
    toStringValue(parsed?.Details)

  return {
    httpStatus,
    providerStatus,
    providerReason,
    providerSessionId,
    rawBodyPreview: rawBody.trim().slice(0, 160)
  }
}

const getTwoFactorOtpConfig = (): TwoFactorOtpConfig => {
  const apiKey = (process.env.TWO_FACTOR_API_KEY || '').trim()
  const templateName = (process.env.TWO_FACTOR_OTP_TEMPLATE_NAME || '').trim()
  const senderId = (process.env.TWO_FACTOR_SENDER_ID || '').trim()

  if (!apiKey) {
    throw new Error('2Factor API key is not configured.')
  }

  if (!templateName) {
    throw new Error('2Factor OTP template name is not configured.')
  }

  if (!senderId) {
    throw new Error('2Factor sender ID is not configured.')
  }

  return {
    apiKey,
    templateName,
    senderId
  }
}

export const sendTwoFactorOtp = async ({
  mobile,
  otpCode,
  expiresAt
}: TwoFactorOtpSendPayload): Promise<TwoFactorOtpSendResult> => {
  const config = getTwoFactorOtpConfig()
  const requestMobile = `91${mobile}`
  const requestUrl = [
    'https://2factor.in/API/V1',
    encodeURIComponent(config.apiKey),
    'SMS',
    encodeURIComponent(requestMobile),
    encodeURIComponent(otpCode),
    encodeURIComponent(config.templateName)
  ].join('/')

  const response = await fetch(requestUrl, {
    method: 'POST',
    cache: 'no-store'
  })

  const rawBody = await response.text()
  let parsed: Record<string, unknown> | null = null
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    parsed = null
  }

  const parsedResponse = parseTwoFactorResponse(response.status, rawBody, parsed)
  const logContext = {
    httpStatus: parsedResponse.httpStatus,
    providerStatus: parsedResponse.providerStatus || 'missing',
    providerReason: parsedResponse.providerReason || null,
    providerSessionId: parsedResponse.providerSessionId || null,
    mobile: maskMobile(requestMobile),
    templateName: config.templateName,
    endpointMode: 'API/V1/SMS/{mobile}/{otp}/{template}',
    senderIdConfigured: Boolean(config.senderId),
    senderIdUsedInRequest: false
  }

  if (!response.ok) {
    console.warn('2Factor OTP transport failure.', logContext)
    throw new Error(
      parsedResponse.providerReason
        ? `OTP delivery failed: ${parsedResponse.providerReason}`
        : 'OTP delivery failed: 2Factor transport error.'
    )
  }

  const normalizedProviderStatus = parsedResponse.providerStatus.toLowerCase()
  if (!TWO_FACTOR_SUCCESS_STATUSES.has(normalizedProviderStatus)) {
    console.warn('2Factor OTP provider rejected the request.', {
      ...logContext,
      rawBodyPreview: parsedResponse.rawBodyPreview
    })
    throw new Error(
      parsedResponse.providerReason
        ? `OTP delivery failed: ${parsedResponse.providerReason}`
        : parsedResponse.providerStatus
          ? `OTP delivery failed: provider status ${parsedResponse.providerStatus}.`
          : 'OTP delivery failed: provider did not confirm success.'
    )
  }

  const providerSessionId = parsedResponse.providerSessionId

  if (!providerSessionId) {
    console.warn('2Factor OTP success response missing provider reference.', {
      ...logContext,
      rawBodyPreview: parsedResponse.rawBodyPreview
    })
    throw new Error('OTP delivery failed: provider did not return a session reference.')
  }

  console.info('2Factor OTP provider accepted the request.', logContext)

  return {
    expiresAt,
    providerSessionId
  }
}
