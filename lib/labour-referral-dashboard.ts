import {
  getLabourMarketplaceSnapshot,
  type LabourMarketplaceSnapshot,
} from './labour-marketplace'
import {
  getReferralLedger,
  getReferralProfileForWorker,
  listReferralEligibleCategories,
  listReferralsForReferrer,
  type WorkerReferral,
} from './labour-worker-referral'

const REFERRAL_LINK_BASE = 'https://rozgar.scalevyapar.in/r'

export type LabourReferralDashboardCategory = {
  categoryId: string
  categoryName: string
  rewardAmount: number
}

export type LabourReferralDashboardMetrics = {
  totalReferred: number
  registered: number
  kycPending: number
  qualified: number
  rejected: number
}

export type LabourReferralDashboardEarnings = {
  lifetimeEarned: number
  pending: number
  available: number
  withdrawn: number
}

export type LabourReferralDashboardHistoryItem = {
  referredWorkerName: string
  maskedMobile: string
  categoryId: string
  categoryName: string
  referralDate: string
  referralStatus: string
  kycStatus: string
  rewardSnapshot: number
  rewardStatus: string
  qualifiedAt: string
  rewardedAt: string
}

export type LabourReferralDashboard = {
  enabled: boolean
  referralCode: string
  referralLink: string
  eligibleCategories: LabourReferralDashboardCategory[]
  metrics: LabourReferralDashboardMetrics
  earnings: LabourReferralDashboardEarnings
  history: LabourReferralDashboardHistoryItem[]
}

export const EMPTY_LABOUR_REFERRAL_DASHBOARD: LabourReferralDashboard = {
  enabled: false,
  referralCode: '',
  referralLink: '',
  eligibleCategories: [],
  metrics: {
    totalReferred: 0,
    registered: 0,
    kycPending: 0,
    qualified: 0,
    rejected: 0,
  },
  earnings: {
    lifetimeEarned: 0,
    pending: 0,
    available: 0,
    withdrawn: 0,
  },
  history: [],
}

const roundCurrency = (value: number) => Math.round(Number(value || 0) * 100) / 100

const maskMobile = (mobile: string) => {
  const normalized = String(mobile || '').replace(/\D/g, '')
  if (normalized.length < 4) return '**********'
  return `${normalized.slice(0, 2)}******${normalized.slice(-2)}`
}

const timestampValue = (value: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) return 0
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const resolveReferralDate = (referral: Pick<WorkerReferral, 'registeredAt' | 'attributedAt' | 'createdAt'>) =>
  referral.registeredAt || referral.attributedAt || referral.createdAt

const isQualifiedReferral = (status: string) =>
  status === 'qualified' || status === 'reward_credited'

const isRejectedReferral = (status: string) => status === 'rejected' || status === 'invalid'

export const normalizeWorkerReferralKycStatus = (status: string) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')

export const isRejectedWorkerReferralKyc = (status: string) =>
  normalizeWorkerReferralKycStatus(status) === 'rejected'

export const isWorkerReferralKycInProgress = (status: string) =>
  normalizeWorkerReferralKycStatus(status) === 'pending review'

export const getEffectiveReferralLifecycleStatus = ({
  referralStatus,
  kycStatus,
}: {
  referralStatus: string
  kycStatus: string
}) => {
  if (isQualifiedReferral(referralStatus)) {
    return 'qualified'
  }

  if (isRejectedReferral(referralStatus) || isRejectedWorkerReferralKyc(kycStatus)) {
    return 'rejected'
  }

  if (referralStatus === 'registered' && isWorkerReferralKycInProgress(kycStatus)) {
    return 'kyc_pending'
  }

  if (referralStatus === 'registered') {
    return 'registered'
  }

  return 'registered'
}

export async function buildReferralDashboard(
  workerId: string,
  options?: { marketplace?: LabourMarketplaceSnapshot }
): Promise<LabourReferralDashboard> {
  const profile = await getReferralProfileForWorker(workerId)

  if (!profile || !profile.isActive) {
    return EMPTY_LABOUR_REFERRAL_DASHBOARD
  }

  const [eligibleCategories, referrals, ledgerEntries, marketplace] = await Promise.all([
    listReferralEligibleCategories(profile.id),
    listReferralsForReferrer(workerId),
    getReferralLedger(workerId),
    options?.marketplace ? Promise.resolve(options.marketplace) : getLabourMarketplaceSnapshot(),
  ])

  const categoryById = new Map(marketplace.categories.map(category => [category.id, category]))
  const workerById = new Map(marketplace.workers.map(worker => [worker.id, worker]))
  const latestRewardedAtByReferralId = new Map<string, string>()

  for (const entry of [...ledgerEntries].sort((left, right) => timestampValue(right.createdAt) - timestampValue(left.createdAt))) {
    if (entry.entryType !== 'reward_credit') continue
    if (!latestRewardedAtByReferralId.has(entry.referralId)) {
      latestRewardedAtByReferralId.set(entry.referralId, entry.createdAt)
    }
  }

  const metrics = referrals.reduce<LabourReferralDashboardMetrics>(
    (summary, referral) => {
      const referredWorkerKycStatus = workerById.get(referral.referredWorkerId)?.kycStatus || ''
      const effectiveStatus = getEffectiveReferralLifecycleStatus({
        referralStatus: referral.referralStatus,
        kycStatus: referredWorkerKycStatus,
      })

      summary.totalReferred += 1

      if (effectiveStatus === 'qualified') {
        summary.qualified += 1
        return summary
      }

      if (effectiveStatus === 'rejected') {
        summary.rejected += 1
        return summary
      }

      if (effectiveStatus === 'kyc_pending') {
        summary.kycPending += 1
        return summary
      }

      summary.registered += 1
      return summary
    },
    {
      totalReferred: 0,
      registered: 0,
      kycPending: 0,
      qualified: 0,
      rejected: 0,
    }
  )

  const pending = roundCurrency(
    referrals.reduce((sum, referral) => {
      if (isQualifiedReferral(referral.referralStatus) && referral.rewardStatus === 'pending') {
        return sum + referral.rewardAmountSnapshot
      }
      return sum
    }, 0)
  )

  const withdrawn = roundCurrency(
    ledgerEntries.reduce((sum, entry) => {
      if (entry.status !== 'available') return sum
      if (entry.entryType === 'withdrawal_debit') return sum + entry.amount
      if (entry.entryType === 'withdrawal_reversal') return sum - entry.amount
      return sum
    }, 0)
  )

  const available = roundCurrency(
    ledgerEntries.reduce((sum, entry) => {
      if (entry.status !== 'available') return sum
      if (entry.entryType === 'reward_credit') return sum + entry.amount
      if (entry.entryType === 'reward_reversal') return sum - entry.amount
      if (entry.entryType === 'withdrawal_debit') return sum - entry.amount
      if (entry.entryType === 'withdrawal_reversal') return sum + entry.amount
      return sum
    }, 0)
  )

  const lifetimeEarned = roundCurrency(available + pending + withdrawn)

  return {
    enabled: true,
    referralCode: profile.referralCode,
    referralLink: `${REFERRAL_LINK_BASE}/${encodeURIComponent(profile.referralCode)}`,
    eligibleCategories: eligibleCategories
      .filter(category => category.isActive)
      .map(category => ({
        categoryId: category.categoryId,
        categoryName: categoryById.get(category.categoryId)?.name || category.categoryId,
        rewardAmount: roundCurrency(category.rewardAmount),
      }))
      .sort((left, right) => left.categoryName.localeCompare(right.categoryName)),
    metrics,
    earnings: {
      lifetimeEarned,
      pending,
      available,
      withdrawn,
    },
    history: [...referrals]
      .sort((left, right) => timestampValue(resolveReferralDate(right)) - timestampValue(resolveReferralDate(left)))
      .map(referral => {
        const referredWorker = workerById.get(referral.referredWorkerId)
        const category = categoryById.get(referral.categoryId)

        return {
          referredWorkerName: referredWorker?.fullName || '',
          maskedMobile: maskMobile(referredWorker?.mobile || ''),
          categoryId: referral.categoryId,
          categoryName: category?.name || referral.categoryId,
          referralDate: resolveReferralDate(referral),
          referralStatus: referral.referralStatus,
          kycStatus: referredWorker?.kycStatus || '',
          rewardSnapshot: roundCurrency(referral.rewardAmountSnapshot),
          rewardStatus: referral.rewardStatus,
          qualifiedAt: referral.qualifiedAt,
          rewardedAt: referral.rewardedAt || latestRewardedAtByReferralId.get(referral.id) || '',
        }
      }),
  }
}
