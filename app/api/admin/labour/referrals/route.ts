import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth'
import {
  ensureReferralProfileForWorker,
  LabourWorkerReferralError
} from '@/lib/labour-worker-referral'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ReferralEligibilityInput = {
  categoryId: string
  rewardAmount: number
  isActive: boolean
}

const REFERRAL_TABLES = {
  profiles: 'worker_referral_profiles',
  eligibility: 'worker_referral_category_eligibility',
  referrals: 'worker_referrals',
  ledger: 'worker_referral_ledger'
} as const

const normalizeText = (value: unknown) => String(value || '').trim()

const normalizeAmount = (value: unknown) => {
  const amount = Math.round(Number(value || 0) * 100) / 100
  if (!Number.isFinite(amount) || amount < 0) {
    throw new LabourWorkerReferralError('Reward amount must be zero or more.', 'invalid-reward-amount')
  }
  return amount
}

const rowToProfile = (row: Record<string, unknown>) => ({
  id: normalizeText(row.id),
  workerId: normalizeText(row.worker_id),
  referralCode: normalizeText(row.referral_code),
  isActive: Boolean(row.is_active),
  createdAt: normalizeText(row.created_at),
  updatedAt: normalizeText(row.updated_at)
})

const rowToEligibility = (row: Record<string, unknown>) => ({
  id: normalizeText(row.id),
  referralProfileId: normalizeText(row.referral_profile_id),
  categoryId: normalizeText(row.category_id),
  rewardAmount: Number(row.reward_amount || 0),
  isActive: Boolean(row.is_active),
  createdAt: normalizeText(row.created_at),
  updatedAt: normalizeText(row.updated_at)
})

const rowToReferral = (row: Record<string, unknown>) => ({
  id: normalizeText(row.id),
  referrerWorkerId: normalizeText(row.referrer_worker_id),
  referredWorkerId: normalizeText(row.referred_worker_id),
  referralProfileId: normalizeText(row.referral_profile_id),
  referralCodeSnapshot: normalizeText(row.referral_code_snapshot),
  categoryId: normalizeText(row.category_id),
  rewardAmountSnapshot: Number(row.reward_amount_snapshot || 0),
  referralStatus: normalizeText(row.referral_status),
  rewardStatus: normalizeText(row.reward_status),
  attributedAt: normalizeText(row.attributed_at),
  registeredAt: normalizeText(row.registered_at),
  qualifiedAt: normalizeText(row.qualified_at),
  rewardedAt: normalizeText(row.rewarded_at),
  rejectedAt: normalizeText(row.rejected_at),
  invalidatedAt: normalizeText(row.invalidated_at),
  createdAt: normalizeText(row.created_at),
  updatedAt: normalizeText(row.updated_at)
})

const rowToLedger = (row: Record<string, unknown>) => ({
  id: normalizeText(row.id),
  workerId: normalizeText(row.worker_id),
  referralId: normalizeText(row.referral_id),
  entryType: normalizeText(row.entry_type),
  amount: Number(row.amount || 0),
  balanceAfter: Number(row.balance_after || 0),
  status: normalizeText(row.status),
  reference: normalizeText(row.reference),
  remarks: normalizeText(row.remarks),
  createdAt: normalizeText(row.created_at)
})

const fetchReferralSnapshot = async () => {
  const [profilesResult, eligibilityResult, referralsResult, ledgerResult] = await Promise.all([
    supabaseAdmin.from(REFERRAL_TABLES.profiles).select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from(REFERRAL_TABLES.eligibility).select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from(REFERRAL_TABLES.referrals).select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from(REFERRAL_TABLES.ledger).select('*').order('created_at', { ascending: false })
  ])

  for (const result of [profilesResult, eligibilityResult, referralsResult, ledgerResult]) {
    if (result.error) throw result.error
  }

  const profiles = (profilesResult.data || []).map(rowToProfile)
  const eligibility = (eligibilityResult.data || []).map(rowToEligibility)
  const referrals = (referralsResult.data || []).map(rowToReferral)
  const ledger = (ledgerResult.data || []).map(rowToLedger)
  const activeProfileIds = new Set(profiles.filter(profile => profile.isActive).map(profile => profile.id))

  return {
    profiles,
    eligibility,
    referrals,
    ledger,
    stats: {
      totalReferrers: profiles.length,
      activeReferrers: activeProfileIds.size,
      totalReferrals: referrals.length,
      registered: referrals.filter(referral => referral.referralStatus === 'registered').length,
      kycPending: referrals.filter(referral => referral.referralStatus === 'kyc_pending').length,
      qualified: referrals.filter(referral => referral.referralStatus === 'qualified').length,
      rejectedInvalid: referrals.filter(referral => referral.referralStatus === 'rejected' || referral.referralStatus === 'invalid').length,
      rewardsCredited: referrals.filter(referral => referral.referralStatus === 'reward_credited').length,
      availableReferralEarningsLiability: ledger
        .filter(entry => entry.entryType === 'reward_credit' && entry.status === 'available')
        .reduce((sum, entry) => sum + entry.amount, 0),
      reversedRewards: ledger
        .filter(entry => entry.entryType === 'reward_reversal' || entry.status === 'reversed')
        .reduce((sum, entry) => sum + entry.amount, 0)
    }
  }
}

const assertWorkerExists = async (workerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('id')
    .eq('id', workerId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new LabourWorkerReferralError('Worker was not found.', 'worker-not-found', 404)
  }
}

const assertCategoryExists = async (categoryId: string, isActive: boolean) => {
  const { data, error } = await supabaseAdmin
    .from('labour_categories')
    .select('id,is_active')
    .eq('id', categoryId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new LabourWorkerReferralError('Category was not found.', 'category-not-found', 404)
  }
  if (isActive && !data.is_active) {
    throw new LabourWorkerReferralError('Inactive categories cannot be enabled for new referrals.', 'category-inactive')
  }
}

const setProfileActive = async (workerId: string, isActive: boolean) => {
  await assertWorkerExists(workerId)
  const profile = await ensureReferralProfileForWorker(workerId)
  const timestamp = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from(REFERRAL_TABLES.profiles)
    .update({ is_active: isActive, updated_at: timestamp })
    .eq('id', profile.id)

  if (error) throw error
}

const setEligibility = async (referralProfileId: string, entries: ReferralEligibilityInput[]) => {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from(REFERRAL_TABLES.profiles)
    .select('id')
    .eq('id', referralProfileId)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) {
    throw new LabourWorkerReferralError('Referral profile was not found.', 'profile-not-found', 404)
  }

  for (const entry of entries) {
    const categoryId = normalizeText(entry.categoryId)
    if (!categoryId) {
      throw new LabourWorkerReferralError('Category ID is required.', 'category-required')
    }
    await assertCategoryExists(categoryId, Boolean(entry.isActive))
  }

  const timestamp = new Date().toISOString()
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from(REFERRAL_TABLES.eligibility)
    .select('id, category_id, created_at')
    .eq('referral_profile_id', referralProfileId)

  if (existingError) throw existingError

  const existingByCategory = new Map(
    (existingRows || []).map(row => [normalizeText(row.category_id), row])
  )

  const rows = entries.map(entry => ({
    id: normalizeText(existingByCategory.get(normalizeText(entry.categoryId))?.id) || randomUUID(),
    referral_profile_id: referralProfileId,
    category_id: normalizeText(entry.categoryId),
    reward_amount: normalizeAmount(entry.rewardAmount),
    is_active: Boolean(entry.isActive),
    created_at: normalizeText(existingByCategory.get(normalizeText(entry.categoryId))?.created_at) || timestamp,
    updated_at: timestamp
  }))

  if (rows.length === 0) return

  const { error } = await supabaseAdmin
    .from(REFERRAL_TABLES.eligibility)
    .upsert(rows, { onConflict: 'referral_profile_id,category_id' })

  if (error) throw error
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    return NextResponse.json(await fetchReferralSnapshot())
  } catch (error) {
    console.error('Labour referral admin fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load referral data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const body = await request.json()
    const action = normalizeText(body.action)

    if (action === 'set-profile-active') {
      await setProfileActive(normalizeText(body.workerId), Boolean(body.isActive))
      return NextResponse.json({ success: true, snapshot: await fetchReferralSnapshot() })
    }

    if (action === 'set-eligibility') {
      const entries = Array.isArray(body.entries) ? body.entries : []
      await setEligibility(normalizeText(body.referralProfileId), entries)
      return NextResponse.json({ success: true, snapshot: await fetchReferralSnapshot() })
    }

    return NextResponse.json({ error: 'Unsupported referral admin action.' }, { status: 400 })
  } catch (error) {
    console.error('Labour referral admin save failed:', error)
    const status = error instanceof LabourWorkerReferralError ? error.statusCode : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save referral data' },
      { status }
    )
  }
}
