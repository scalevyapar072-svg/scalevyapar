import type { LabourWorkerRecord } from './labour-marketplace'
import {
  isWorkerMobileUniqueConflict,
  normalizeIndianWorkerMobile,
} from './labour-worker-mobile'

export const WORKER_OTP_REQUEST_FAILED_MESSAGE =
  'Failed to request OTP. Please try again.'

export const WORKER_OTP_DELIVERY_FAILED_MESSAGE =
  'OTP delivery failed. Please try again.'

type ResolveWorkerForOtpDependencies = {
  findWorkersByMobile: (mobile: string) => Promise<LabourWorkerRecord[]>
  createWorker: (mobile: string) => Promise<void>
}

const getSingleWorker = (workers: LabourWorkerRecord[]) =>
  workers.length === 1 ? workers[0] : null

export const resolveWorkerForOtp = async (
  mobile: unknown,
  dependencies: ResolveWorkerForOtpDependencies,
) => {
  const normalizedMobile = normalizeIndianWorkerMobile(mobile)
  if (!normalizedMobile) {
    throw new Error('Enter a valid 10-digit mobile number.')
  }

  let workers = await dependencies.findWorkersByMobile(normalizedMobile)
  const existingWorker = getSingleWorker(workers)
  if (existingWorker) return existingWorker
  if (workers.length > 1) {
    throw new Error(WORKER_OTP_REQUEST_FAILED_MESSAGE)
  }

  try {
    await dependencies.createWorker(normalizedMobile)
  } catch (error) {
    if (!isWorkerMobileUniqueConflict(error)) {
      throw new Error(WORKER_OTP_REQUEST_FAILED_MESSAGE)
    }
  }

  workers = await dependencies.findWorkersByMobile(normalizedMobile)
  const resolvedWorker = getSingleWorker(workers)
  if (!resolvedWorker) {
    throw new Error(WORKER_OTP_REQUEST_FAILED_MESSAGE)
  }

  return resolvedWorker
}

const SAFE_WORKER_AUTH_MESSAGES = new Set([
  'Enter a valid 10-digit mobile number.',
  'Worker OTP provider is not configured.',
  'OTP session not found. Request OTP again.',
  'OTP expired. Request a new OTP.',
  'OTP session does not match this mobile number. Request OTP again.',
  'OTP session does not match this login flow. Request OTP again.',
  'Invalid OTP code.',
  'Too many wrong OTP attempts. Request a new OTP.',
  'Worker account not found. Request OTP again.',
  'Worker account not found after OTP verification.',
  WORKER_OTP_REQUEST_FAILED_MESSAGE,
])

export const getSafeWorkerAuthErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  const message = error instanceof Error ? error.message.trim() : ''
  if (SAFE_WORKER_AUTH_MESSAGES.has(message)) return message
  if (/^Please wait \d+ seconds before requesting another OTP\.$/.test(message)) {
    return message
  }
  if (message.startsWith('OTP delivery failed')) {
    return WORKER_OTP_DELIVERY_FAILED_MESSAGE
  }
  return fallbackMessage
}
