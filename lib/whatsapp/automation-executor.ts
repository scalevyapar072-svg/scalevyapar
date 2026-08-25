import {
  type LabourJobPostRecord,
  type LabourMarketplaceSnapshot,
  type LabourWorkerRecord,
  isJobPostLiveRecord,
  isWorkerSearchActiveRecord,
} from '../labour-marketplace'
import type { JsonObject, WhatsappAutomaticExecutionEventType } from './persistence-types'
import {
  buildWhatsappConsentState,
  normalizeIndianMobileToE164,
  type WhatsappConsentState,
  type WhatsappNotificationPurpose,
} from './consent'
import {
  evaluateWhatsappRecipientEligibility,
  type WhatsappRecipientEligibilityResult,
} from './recipient-eligibility'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/automation-executor')

export const WHATSAPP_AUTOMATION_CYCLE_HOURS = 72
export const COMPANY_MATCHING_DIGEST_CTA_URL =
  'https://rozgar.scalevyapar.in/labour/company/search'

export const WHATSAPP_AUTOMATION_EVENT_RULES: Record<
  WhatsappAutomaticExecutionEventType,
  {
    recipientType: 'worker' | 'company'
    notificationPurpose: WhatsappNotificationPurpose
    templateCategory: 'UTILITY'
  }
> = {
  company_matching_digest: {
    recipientType: 'company',
    notificationPurpose: 'matching',
    templateCategory: 'UTILITY',
  },
  worker_matching_digest: {
    recipientType: 'worker',
    notificationPurpose: 'matching',
    templateCategory: 'UTILITY',
  },
  worker_payment_or_plan_reminder: {
    recipientType: 'worker',
    notificationPurpose: 'service',
    templateCategory: 'UTILITY',
  },
  worker_kyc_rejected: {
    recipientType: 'worker',
    notificationPurpose: 'service',
    templateCategory: 'UTILITY',
  },
}

export type WhatsappAutomationDispatchState = 'ready' | 'queued' | 'blocked'

export type WhatsappAutomationCycleWindow = {
  cycleStartsAt: string
  cycleEndsAt: string
}

export type WhatsappAutomationDigestPlan = {
  automationEventType: 'company_matching_digest' | 'worker_matching_digest'
  recipientType: 'worker' | 'company'
  recipientId: string
  maskedMobile: string
  cycleStartsAt: string
  cycleEndsAt: string
  idempotencyKey: string
  dispatchState: WhatsappAutomationDispatchState
  dispatchReason: string | null
  dryRun: boolean
  revalidationRequired: true
  eligibility: WhatsappRecipientEligibilityResult
  ctaUrl: string | null
  liveJobCount: number
  matchingWorkerCount: number
  matchingCompanyCount: number
  matchingJobCount: number
  matchedCategoryIds: string[]
  matchedCities: string[]
  metadata: JsonObject
}

export type WhatsappAutomationDigestContext = {
  snapshot: LabourMarketplaceSnapshot
  now?: Date
  vercelEnv?: string
  pauseAllSending?: boolean
  dryRun?: boolean
  timeZone?: string
  companyConsentStates?: Record<string, Partial<WhatsappConsentState>>
  workerConsentStates?: Record<string, Partial<WhatsappConsentState>>
  suppressedMobiles?: Iterable<string>
  withinLimitByRecipientId?: Record<string, boolean>
  resolveWorkerAppLink?: (worker: LabourWorkerRecord) => string | null | undefined
}

const CYCLE_WINDOW_MS = WHATSAPP_AUTOMATION_CYCLE_HOURS * 60 * 60 * 1000

const normalizeComparableKey = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const collectWorkerCityKeys = (worker: LabourWorkerRecord) => {
  const keys = new Set<string>()

  for (const value of [worker.city, worker.homeCity]) {
    const normalized = normalizeComparableKey(value)
    if (normalized) {
      keys.add(normalized)
    }
  }

  for (const location of worker.preferredWorkLocations || []) {
    for (const label of location.cityLabels || []) {
      const normalized = normalizeComparableKey(label)
      if (normalized) {
        keys.add(normalized)
      }
    }
  }

  return keys
}

const collectCategoryKeys = (categoryIds: string[]) =>
  new Set(
    (categoryIds || [])
      .map((categoryId) => normalizeComparableKey(categoryId))
      .filter(Boolean),
  )

const normalizeSuppressedMobiles = (input: Iterable<string> | undefined) => {
  const suppressed = new Set<string>()

  for (const value of input || []) {
    const normalized = normalizeIndianMobileToE164(value)
    if (normalized.ok) {
      suppressed.add(normalized.normalized)
    }
  }

  return suppressed
}

const collectLiveCompanyJobs = (
  snapshot: LabourMarketplaceSnapshot,
  companyId: string,
) => snapshot.jobPosts.filter((jobPost) => jobPost.companyId === companyId && isJobPostLiveRecord(jobPost))

const workerMatchesJobPost = (worker: LabourWorkerRecord, jobPost: LabourJobPostRecord) => {
  const workerCategoryKeys = collectCategoryKeys(worker.categoryIds)
  const jobCategoryKey = normalizeComparableKey(jobPost.categoryId)
  if (!jobCategoryKey || !workerCategoryKeys.has(jobCategoryKey)) {
    return false
  }

  const jobCityKey = normalizeComparableKey(jobPost.city)
  if (!jobCityKey) {
    return false
  }

  return collectWorkerCityKeys(worker).has(jobCityKey)
}

export const getWhatsappAutomationCycleWindow = (
  value: Date = new Date(),
): WhatsappAutomationCycleWindow => {
  const timestamp = value.getTime()
  const cycleStartsAt = Math.floor(timestamp / CYCLE_WINDOW_MS) * CYCLE_WINDOW_MS
  const cycleEndsAt = cycleStartsAt + CYCLE_WINDOW_MS

  return {
    cycleStartsAt: new Date(cycleStartsAt).toISOString(),
    cycleEndsAt: new Date(cycleEndsAt).toISOString(),
  }
}

export const buildWhatsappAutomationIdempotencyKey = ({
  automationEventType,
  recipientType,
  recipientId,
  cycleStartsAt,
}: {
  automationEventType: 'company_matching_digest' | 'worker_matching_digest'
  recipientType: 'worker' | 'company'
  recipientId: string
  cycleStartsAt: string
}) =>
  `${automationEventType}:${recipientType}:${String(recipientId || '').trim()}:${String(cycleStartsAt || '').trim()}`

const resolveDispatchState = ({
  eligibility,
  vercelEnv,
  pauseAllSending,
  dryRun,
  ctaUrl,
}: {
  eligibility: WhatsappRecipientEligibilityResult
  vercelEnv: string
  pauseAllSending: boolean
  dryRun: boolean
  ctaUrl: string | null
}): {
  dispatchState: WhatsappAutomationDispatchState
  dispatchReason: string | null
} => {
  if (!eligibility.eligible) {
    return {
      dispatchState: 'blocked',
      dispatchReason: eligibility.reasonCodes[0] || 'eligibility_blocked',
    }
  }

  if (!ctaUrl) {
    return {
      dispatchState: 'blocked',
      dispatchReason: 'missing_cta_url',
    }
  }

  if (vercelEnv !== 'production') {
    return {
      dispatchState: 'blocked',
      dispatchReason: 'whatsapp-disabled-outside-production',
    }
  }

  if (pauseAllSending) {
    return {
      dispatchState: 'blocked',
      dispatchReason: 'whatsapp-paused',
    }
  }

  if (dryRun) {
    return {
      dispatchState: 'blocked',
      dispatchReason: 'dry_run_only',
    }
  }

  if (eligibility.deliveryWindow === 'queue_until_allowed') {
    return {
      dispatchState: 'queued',
      dispatchReason: 'inside_quiet_hours',
    }
  }

  if (eligibility.deliveryWindow === 'blocked') {
    return {
      dispatchState: 'blocked',
      dispatchReason: eligibility.reasonCodes[0] || 'eligibility_blocked',
    }
  }

  return {
    dispatchState: 'ready',
    dispatchReason: null,
  }
}

const resolveWithinLimit = (
  withinLimitByRecipientId: Record<string, boolean> | undefined,
  recipientId: string,
) => withinLimitByRecipientId?.[recipientId] ?? true

export const planCompanyMatchingDigests = ({
  snapshot,
  now = new Date(),
  vercelEnv = '',
  pauseAllSending = true,
  dryRun = true,
  timeZone = 'Asia/Kolkata',
  companyConsentStates = {},
  suppressedMobiles,
  withinLimitByRecipientId,
}: WhatsappAutomationDigestContext): WhatsappAutomationDigestPlan[] => {
  const cycle = getWhatsappAutomationCycleWindow(now)
  const normalizedSuppressedMobiles = normalizeSuppressedMobiles(suppressedMobiles)
  const liveWorkers = snapshot.workers.filter((worker) => isWorkerSearchActiveRecord(worker))
  const plans: WhatsappAutomationDigestPlan[] = []

  for (const company of snapshot.companies) {
    const liveJobPosts = collectLiveCompanyJobs(snapshot, company.id)
    if (company.status !== 'active' || liveJobPosts.length === 0) {
      continue
    }

    const matchedWorkers = liveWorkers.filter((worker) =>
      liveJobPosts.some((jobPost) => workerMatchesJobPost(worker, jobPost)),
    )

    if (matchedWorkers.length === 0) {
      continue
    }

    const eligibleInput = evaluateWhatsappRecipientEligibility({
      recipientType: 'company',
      mode: 'automatic',
      notificationPurpose:
        WHATSAPP_AUTOMATION_EVENT_RULES.company_matching_digest.notificationPurpose,
      templateCategory:
        WHATSAPP_AUTOMATION_EVENT_RULES.company_matching_digest.templateCategory,
      consentState: buildWhatsappConsentState(companyConsentStates[company.id] || {}),
      suppressed: normalizedSuppressedMobiles.has(
        (() => {
          const normalized = normalizeIndianMobileToE164(company.contactMobile || company.mobile)
          return normalized.ok ? normalized.normalized : ''
        })(),
      ),
      withinLimit: resolveWithinLimit(withinLimitByRecipientId, company.id),
      matchStillValid: true,
      company,
      now,
      timeZone,
    })

    const matchedCategoryIds = Array.from(
      new Set(liveJobPosts.map((jobPost) => String(jobPost.categoryId || '').trim()).filter(Boolean)),
    )
    const matchedCities = Array.from(
      new Set(liveJobPosts.map((jobPost) => String(jobPost.city || '').trim()).filter(Boolean)),
    )
    const dispatch = resolveDispatchState({
      eligibility: eligibleInput,
      vercelEnv: String(vercelEnv || '').trim().toLowerCase(),
      pauseAllSending,
      dryRun,
      ctaUrl: COMPANY_MATCHING_DIGEST_CTA_URL,
    })

    plans.push({
      automationEventType: 'company_matching_digest',
      recipientType: 'company',
      recipientId: company.id,
      maskedMobile: eligibleInput.maskedMobile,
      cycleStartsAt: cycle.cycleStartsAt,
      cycleEndsAt: cycle.cycleEndsAt,
      idempotencyKey: buildWhatsappAutomationIdempotencyKey({
        automationEventType: 'company_matching_digest',
        recipientType: 'company',
        recipientId: company.id,
        cycleStartsAt: cycle.cycleStartsAt,
      }),
      dispatchState: dispatch.dispatchState,
      dispatchReason: dispatch.dispatchReason,
      dryRun,
      revalidationRequired: true,
      eligibility: eligibleInput,
      ctaUrl: COMPANY_MATCHING_DIGEST_CTA_URL,
      liveJobCount: liveJobPosts.length,
      matchingWorkerCount: matchedWorkers.length,
      matchingCompanyCount: 1,
      matchingJobCount: liveJobPosts.length,
      matchedCategoryIds,
      matchedCities,
      metadata: {
        matchedWorkerIds: matchedWorkers.map((worker) => worker.id),
        liveJobPostIds: liveJobPosts.map((jobPost) => jobPost.id),
      },
    })
  }

  return plans
}

export const planWorkerMatchingDigests = ({
  snapshot,
  now = new Date(),
  vercelEnv = '',
  pauseAllSending = true,
  dryRun = true,
  timeZone = 'Asia/Kolkata',
  workerConsentStates = {},
  suppressedMobiles,
  withinLimitByRecipientId,
  resolveWorkerAppLink,
}: WhatsappAutomationDigestContext): WhatsappAutomationDigestPlan[] => {
  const cycle = getWhatsappAutomationCycleWindow(now)
  const normalizedSuppressedMobiles = normalizeSuppressedMobiles(suppressedMobiles)
  const activeCompanies = new Map(
    snapshot.companies
      .filter((company) => company.status === 'active')
      .map((company) => [company.id, company] as const),
  )
  const liveJobPosts = snapshot.jobPosts.filter(
    (jobPost) => isJobPostLiveRecord(jobPost) && activeCompanies.has(jobPost.companyId),
  )
  const plans: WhatsappAutomationDigestPlan[] = []

  for (const worker of snapshot.workers) {
    if (!isWorkerSearchActiveRecord(worker)) {
      continue
    }

    const matchedJobPosts = liveJobPosts.filter((jobPost) => workerMatchesJobPost(worker, jobPost))
    if (matchedJobPosts.length === 0) {
      continue
    }

    const matchedCompanies = Array.from(
      new Set(
        matchedJobPosts
          .map((jobPost) => activeCompanies.get(jobPost.companyId)?.id || '')
          .filter(Boolean),
      ),
    )
    const normalizedMobile = normalizeIndianMobileToE164(worker.mobile)
    const ctaUrl = String(resolveWorkerAppLink?.(worker) || '').trim() || null
    const eligibleInput = evaluateWhatsappRecipientEligibility({
      recipientType: 'worker',
      mode: 'automatic',
      notificationPurpose:
        WHATSAPP_AUTOMATION_EVENT_RULES.worker_matching_digest.notificationPurpose,
      templateCategory:
        WHATSAPP_AUTOMATION_EVENT_RULES.worker_matching_digest.templateCategory,
      consentState: buildWhatsappConsentState(workerConsentStates[worker.id] || {}),
      suppressed:
        normalizedMobile.ok && normalizedSuppressedMobiles.has(normalizedMobile.normalized),
      withinLimit: resolveWithinLimit(withinLimitByRecipientId, worker.id),
      matchStillValid: true,
      worker,
      now,
      timeZone,
    })

    const matchedCategoryIds = Array.from(
      new Set(matchedJobPosts.map((jobPost) => String(jobPost.categoryId || '').trim()).filter(Boolean)),
    )
    const matchedCities = Array.from(
      new Set(matchedJobPosts.map((jobPost) => String(jobPost.city || '').trim()).filter(Boolean)),
    )
    const dispatch = resolveDispatchState({
      eligibility: eligibleInput,
      vercelEnv: String(vercelEnv || '').trim().toLowerCase(),
      pauseAllSending,
      dryRun,
      ctaUrl,
    })

    plans.push({
      automationEventType: 'worker_matching_digest',
      recipientType: 'worker',
      recipientId: worker.id,
      maskedMobile: eligibleInput.maskedMobile,
      cycleStartsAt: cycle.cycleStartsAt,
      cycleEndsAt: cycle.cycleEndsAt,
      idempotencyKey: buildWhatsappAutomationIdempotencyKey({
        automationEventType: 'worker_matching_digest',
        recipientType: 'worker',
        recipientId: worker.id,
        cycleStartsAt: cycle.cycleStartsAt,
      }),
      dispatchState: dispatch.dispatchState,
      dispatchReason: dispatch.dispatchReason,
      dryRun,
      revalidationRequired: true,
      eligibility: eligibleInput,
      ctaUrl,
      liveJobCount: matchedJobPosts.length,
      matchingWorkerCount: 1,
      matchingCompanyCount: matchedCompanies.length,
      matchingJobCount: matchedJobPosts.length,
      matchedCategoryIds,
      matchedCities,
      metadata: {
        matchedCompanyIds: matchedCompanies,
        matchedJobPostIds: matchedJobPosts.map((jobPost) => jobPost.id),
      },
    })
  }

  return plans
}
