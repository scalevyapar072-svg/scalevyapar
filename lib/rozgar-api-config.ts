import { NextRequest } from 'next/server'

const DEFAULT_BACKEND_VERSION = 'rozgar-backend-v1'
const DEFAULT_API_BASE_PATH = '/api/rozgar/v1'
const DEFAULT_APP_PACKAGE = 'in.scalevyapar.rozgar'
const DEFAULT_APP_VERSION = '0.1.0'

const normalizeApiBaseUrl = (value: string | undefined) => {
  if (!value) {
    return null
  }

  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.length > 0 ? trimmed : null
}

const resolveRequestOrigin = (request: NextRequest) => {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

export const getRozgarApiBaseUrl = (request: NextRequest) => {
  const configuredBaseUrl = normalizeApiBaseUrl(process.env.ROZGAR_API_BASE_URL)
  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  return `${resolveRequestOrigin(request)}${DEFAULT_API_BASE_PATH}`
}

export const getRozgarAppConfig = (request: NextRequest) => ({
  backendVersion: process.env.ROZGAR_BACKEND_VERSION?.trim() || DEFAULT_BACKEND_VERSION,
  latestAppVersion: process.env.ROZGAR_LATEST_APP_VERSION?.trim() || DEFAULT_APP_VERSION,
  minimumAppVersion: process.env.ROZGAR_MINIMUM_APP_VERSION?.trim() || DEFAULT_APP_VERSION,
  apiBaseUrl: getRozgarApiBaseUrl(request),
  razorpayEnabled: process.env.ROZGAR_RAZORPAY_ENABLED === 'true',
  appPackage: process.env.ROZGAR_APP_PACKAGE?.trim() || DEFAULT_APP_PACKAGE
})
