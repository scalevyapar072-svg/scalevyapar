import { randomInt, randomUUID } from 'crypto'

export type ReferralStatus =
  | 'attributed'
  | 'registered'
  | 'kyc_pending'
  | 'qualified'
  | 'rejected'
  | 'reward_credited'
  | 'invalid'

export type ReferralRewardStatus = 'pending' | 'available' | 'reversed'
export type ReferralLedgerEntryType = 'reward_credit' | 'reward_reversal'
export type ReferralLedgerStatus = 'pending' | 'available' | 'reversed'

export class LabourWorkerReferralError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode = 400) {
    super(message)
    this.name = 'LabourWorkerReferralError'
    this.code = code
    this.statusCode = statusCode
  }
}

export interface ReferralWorker {
  id: string
}

export interface ReferralCategory {
  id: string
  isActive: boolean
}

export interface WorkerReferralProfile {
  id: string
  workerId: string
  referralCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkerReferralCategoryEligibility {
  id: string
  referralProfileId: string
  categoryId: string
  rewardAmount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkerReferral {
  id: string
  referrerWorkerId: string
  referredWorkerId: string
  referralProfileId: string
  referralCodeSnapshot: string
  categoryId: string
  rewardAmountSnapshot: number
  referralStatus: ReferralStatus
  rewardStatus: ReferralRewardStatus
  attributedAt: string
  registeredAt: string
  qualifiedAt: string
  rewardedAt: string
  rejectedAt: string
  invalidatedAt: string
  createdAt: string
  updatedAt: string
}

export interface WorkerReferralLedgerEntry {
  id: string
  workerId: string
  referralId: string
  entryType: ReferralLedgerEntryType
  amount: number
  balanceAfter: number
  status: ReferralLedgerStatus
  reference: string
  remarks: string
  createdAt: string
}

export interface WorkerReferralRepository {
  findWorkerById(workerId: string): Promise<ReferralWorker | null>
  findCategoryById(categoryId: string): Promise<ReferralCategory | null>
  findProfileById(referralProfileId: string): Promise<WorkerReferralProfile | null>
  findProfileByWorkerId(workerId: string): Promise<WorkerReferralProfile | null>
  findProfileByCode(referralCode: string): Promise<WorkerReferralProfile | null>
  insertProfile(profile: WorkerReferralProfile): Promise<WorkerReferralProfile>
  findEligibility(
    referralProfileId: string,
    categoryId: string
  ): Promise<WorkerReferralCategoryEligibility | null>
  listEligibility(referralProfileId: string): Promise<WorkerReferralCategoryEligibility[]>
  upsertEligibility(
    eligibility: WorkerReferralCategoryEligibility
  ): Promise<WorkerReferralCategoryEligibility>
  findReferralByReferredWorkerId(workerId: string): Promise<WorkerReferral | null>
  insertReferral(referral: WorkerReferral): Promise<WorkerReferral>
  listReferralsByReferrer(workerId: string): Promise<WorkerReferral[]>
  findLedgerByReference(reference: string): Promise<WorkerReferralLedgerEntry | null>
  listLedgerByWorker(workerId: string): Promise<WorkerReferralLedgerEntry[]>
  insertLedgerEntry(entry: WorkerReferralLedgerEntry): Promise<WorkerReferralLedgerEntry>
}

const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const REFERRAL_CODE_PREFIX = 'RZG'
const REFERRAL_CODE_LENGTH = 8
const MAX_CODE_ATTEMPTS = 12

const nowIso = () => new Date().toISOString()

const normalizeId = (value: string, label: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new LabourWorkerReferralError(`${label} is required.`, 'missing-id')
  }
  return normalized
}

const normalizeReferralCode = (value: string) =>
  String(value || '')
    .trim()
    .toUpperCase()

const normalizeAmount = (value: number, label: string, allowZero = false) => {
  const amount = Math.round(Number(value || 0) * 100) / 100
  if (!Number.isFinite(amount) || (allowZero ? amount < 0 : amount <= 0)) {
    throw new LabourWorkerReferralError(`${label} is invalid.`, 'invalid-amount')
  }
  return amount
}

const id = (prefix: string) => `${prefix}-${randomUUID()}`

export const generateWorkerReferralCode = () => {
  let suffix = ''
  for (let index = 0; index < REFERRAL_CODE_LENGTH; index += 1) {
    suffix += REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)]
  }
  return `${REFERRAL_CODE_PREFIX}${suffix}`
}

const buildProfile = (workerId: string, referralCode: string, at = nowIso()): WorkerReferralProfile => ({
  id: id('ref-profile'),
  workerId,
  referralCode,
  isActive: true,
  createdAt: at,
  updatedAt: at
})

const assertWorkerExists = async (repository: WorkerReferralRepository, workerId: string) => {
  const worker = await repository.findWorkerById(workerId)
  if (!worker) {
    throw new LabourWorkerReferralError('Worker was not found.', 'worker-not-found', 404)
  }
  return worker
}

const assertActiveCategory = async (repository: WorkerReferralRepository, categoryId: string) => {
  const category = await repository.findCategoryById(categoryId)
  if (!category) {
    throw new LabourWorkerReferralError('Referral category was not found.', 'category-not-found', 404)
  }
  if (!category.isActive) {
    throw new LabourWorkerReferralError('Referral category is inactive.', 'category-inactive')
  }
  return category
}

export const createLabourWorkerReferralService = (repository: WorkerReferralRepository) => {
  const getReferralProfileForWorker = async (workerId: string) =>
    repository.findProfileByWorkerId(normalizeId(workerId, 'Worker ID'))

  const ensureReferralProfileForWorker = async (workerId: string) => {
    const normalizedWorkerId = normalizeId(workerId, 'Worker ID')
    await assertWorkerExists(repository, normalizedWorkerId)

    const existing = await repository.findProfileByWorkerId(normalizedWorkerId)
    if (existing) return existing

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const profile = buildProfile(normalizedWorkerId, generateWorkerReferralCode())
      const codeOwner = await repository.findProfileByCode(profile.referralCode)
      if (codeOwner) continue

      try {
        return await repository.insertProfile(profile)
      } catch (error) {
        const racedProfile = await repository.findProfileByWorkerId(normalizedWorkerId)
        if (racedProfile) return racedProfile
        if (isUniqueViolation(error)) continue
        throw error
      }
    }

    throw new LabourWorkerReferralError('Could not generate a unique referral code.', 'code-collision', 409)
  }

  const getReferralProfileByCode = async (referralCode: string) =>
    repository.findProfileByCode(normalizeReferralCode(referralCode))

  const listReferralEligibleCategories = async (referralProfileId: string) =>
    repository.listEligibility(normalizeId(referralProfileId, 'Referral profile ID'))

  const setReferralCategoryEligibility = async ({
    referralProfileId,
    categoryId,
    rewardAmount,
    isActive = true
  }: {
    referralProfileId: string
    categoryId: string
    rewardAmount: number
    isActive?: boolean
  }) => {
    const normalizedProfileId = normalizeId(referralProfileId, 'Referral profile ID')
    const normalizedCategoryId = normalizeId(categoryId, 'Category ID')
    const profile = await repository.findProfileById(normalizedProfileId)
    if (!profile) {
      throw new LabourWorkerReferralError('Referral profile was not found.', 'profile-not-found', 404)
    }
    await assertActiveCategory(repository, normalizedCategoryId)

    const existing = await repository.findEligibility(normalizedProfileId, normalizedCategoryId)
    const timestamp = nowIso()
    const eligibility: WorkerReferralCategoryEligibility = {
      id: existing?.id || id('ref-eligibility'),
      referralProfileId: normalizedProfileId,
      categoryId: normalizedCategoryId,
      rewardAmount: normalizeAmount(rewardAmount, 'Reward amount', true),
      isActive,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    }

    return repository.upsertEligibility(eligibility)
  }

  const createReferralAttribution = async ({
    referralCode,
    referredWorkerId,
    categoryId,
    attributedAt = nowIso()
  }: {
    referralCode: string
    referredWorkerId: string
    categoryId: string
    attributedAt?: string
  }) => {
    const normalizedCode = normalizeReferralCode(referralCode)
    const normalizedReferredWorkerId = normalizeId(referredWorkerId, 'Referred worker ID')
    const normalizedCategoryId = normalizeId(categoryId, 'Category ID')
    const profile = await repository.findProfileByCode(normalizedCode)
    if (!profile || !profile.isActive) {
      throw new LabourWorkerReferralError('Referral code is invalid or inactive.', 'referral-inactive', 404)
    }

    await assertWorkerExists(repository, profile.workerId)
    await assertWorkerExists(repository, normalizedReferredWorkerId)
    await assertActiveCategory(repository, normalizedCategoryId)

    if (profile.workerId === normalizedReferredWorkerId) {
      throw new LabourWorkerReferralError('Self-referral is not allowed.', 'self-referral', 409)
    }

    const eligibility = await repository.findEligibility(profile.id, normalizedCategoryId)
    if (!eligibility || !eligibility.isActive) {
      throw new LabourWorkerReferralError('Category is not eligible for this referral.', 'category-not-eligible', 409)
    }

    const existing = await repository.findReferralByReferredWorkerId(normalizedReferredWorkerId)
    if (existing) {
      if (
        existing.referrerWorkerId === profile.workerId &&
        existing.categoryId === normalizedCategoryId &&
        existing.referralCodeSnapshot === normalizedCode
      ) {
        return existing
      }
      throw new LabourWorkerReferralError('Worker is already assigned to another referral.', 'already-attributed', 409)
    }

    const timestamp = nowIso()
    const referral: WorkerReferral = {
      id: id('referral'),
      referrerWorkerId: profile.workerId,
      referredWorkerId: normalizedReferredWorkerId,
      referralProfileId: profile.id,
      referralCodeSnapshot: normalizedCode,
      categoryId: normalizedCategoryId,
      rewardAmountSnapshot: eligibility.rewardAmount,
      referralStatus: 'attributed',
      rewardStatus: 'pending',
      attributedAt,
      registeredAt: '',
      qualifiedAt: '',
      rewardedAt: '',
      rejectedAt: '',
      invalidatedAt: '',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    try {
      return await repository.insertReferral(referral)
    } catch (error) {
      const raced = await repository.findReferralByReferredWorkerId(normalizedReferredWorkerId)
      if (
        raced &&
        raced.referrerWorkerId === profile.workerId &&
        raced.categoryId === normalizedCategoryId &&
        raced.referralCodeSnapshot === normalizedCode
      ) {
        return raced
      }
      if (isUniqueViolation(error)) {
        throw new LabourWorkerReferralError('Worker is already assigned to another referral.', 'already-attributed', 409)
      }
      throw error
    }
  }

  const getReferralForReferredWorker = async (workerId: string) =>
    repository.findReferralByReferredWorkerId(normalizeId(workerId, 'Worker ID'))

  const listReferralsForReferrer = async (workerId: string) =>
    repository.listReferralsByReferrer(normalizeId(workerId, 'Worker ID'))

  const getReferralLedger = async (workerId: string) =>
    repository.listLedgerByWorker(normalizeId(workerId, 'Worker ID'))

  const getReferralBalance = async (workerId: string) => {
    const entries = await getReferralLedger(workerId)
    return entries.reduce((balance, entry) => {
      if (entry.entryType === 'reward_credit') return balance + entry.amount
      if (entry.entryType === 'reward_reversal') return balance - entry.amount
      return balance
    }, 0)
  }

  const addReferralLedgerEntry = async ({
    workerId,
    referralId,
    entryType,
    amount,
    reference,
    remarks = '',
    status
  }: {
    workerId: string
    referralId: string
    entryType: ReferralLedgerEntryType
    amount: number
    reference: string
    remarks?: string
    status?: ReferralLedgerStatus
  }) => {
    const normalizedWorkerId = normalizeId(workerId, 'Worker ID')
    const normalizedReferralId = normalizeId(referralId, 'Referral ID')
    const normalizedReference = normalizeId(reference, 'Ledger reference')
    const existing = await repository.findLedgerByReference(normalizedReference)
    if (existing) return existing

    const cleanAmount = normalizeAmount(amount, 'Ledger amount')
    const currentBalance = await getReferralBalance(normalizedWorkerId)
    const balanceAfter =
      entryType === 'reward_credit'
        ? currentBalance + cleanAmount
        : currentBalance - cleanAmount

    if (balanceAfter < 0) {
      throw new LabourWorkerReferralError('Referral ledger balance cannot become negative.', 'negative-balance', 409)
    }

    const entry: WorkerReferralLedgerEntry = {
      id: id('ref-ledger'),
      workerId: normalizedWorkerId,
      referralId: normalizedReferralId,
      entryType,
      amount: cleanAmount,
      balanceAfter,
      status: status || (entryType === 'reward_credit' ? 'available' : 'reversed'),
      reference: normalizedReference,
      remarks: String(remarks || '').trim(),
      createdAt: nowIso()
    }

    try {
      return await repository.insertLedgerEntry(entry)
    } catch (error) {
      const raced = await repository.findLedgerByReference(normalizedReference)
      if (raced) return raced
      throw error
    }
  }

  const creditReferralReward = async ({
    workerId,
    referralId,
    amount,
    reference,
    remarks
  }: {
    workerId: string
    referralId: string
    amount: number
    reference: string
    remarks?: string
  }) =>
    addReferralLedgerEntry({
      workerId,
      referralId,
      entryType: 'reward_credit',
      amount,
      reference,
      remarks,
      status: 'available'
    })

  const reverseReferralReward = async ({
    workerId,
    referralId,
    amount,
    reference,
    remarks
  }: {
    workerId: string
    referralId: string
    amount: number
    reference: string
    remarks?: string
  }) =>
    addReferralLedgerEntry({
      workerId,
      referralId,
      entryType: 'reward_reversal',
      amount,
      reference,
      remarks,
      status: 'reversed'
    })

  return {
    getReferralProfileForWorker,
    ensureReferralProfileForWorker,
    getReferralProfileByCode,
    listReferralEligibleCategories,
    setReferralCategoryEligibility,
    createReferralAttribution,
    getReferralForReferredWorker,
    listReferralsForReferrer,
    getReferralLedger,
    getReferralBalance,
    addReferralLedgerEntry,
    creditReferralReward,
    reverseReferralReward
  }
}

const isUniqueViolation = (error: unknown) => {
  const candidate = error as { code?: string; message?: string }
  return candidate?.code === '23505' || /unique|duplicate/i.test(String(candidate?.message || ''))
}

type SupabaseQueryBuilderLike = {
  select(columns?: string): SupabaseQueryBuilderLike
  insert(payload: unknown): SupabaseQueryBuilderLike
  upsert(payload: unknown, options?: unknown): SupabaseQueryBuilderLike
  eq(column: string, value: string): SupabaseQueryBuilderLike
  maybeSingle(): unknown
  single(): unknown
  order(column: string, options: { ascending: boolean }): unknown
}

type SupabaseClientLike = {
  from(table: string): SupabaseQueryBuilderLike
}

const rowToProfile = (row: Record<string, unknown>): WorkerReferralProfile => ({
  id: String(row.id || ''),
  workerId: String(row.worker_id || ''),
  referralCode: String(row.referral_code || ''),
  isActive: Boolean(row.is_active),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || '')
})

const rowToEligibility = (row: Record<string, unknown>): WorkerReferralCategoryEligibility => ({
  id: String(row.id || ''),
  referralProfileId: String(row.referral_profile_id || ''),
  categoryId: String(row.category_id || ''),
  rewardAmount: Number(row.reward_amount || 0),
  isActive: Boolean(row.is_active),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || '')
})

const rowToReferral = (row: Record<string, unknown>): WorkerReferral => ({
  id: String(row.id || ''),
  referrerWorkerId: String(row.referrer_worker_id || ''),
  referredWorkerId: String(row.referred_worker_id || ''),
  referralProfileId: String(row.referral_profile_id || ''),
  referralCodeSnapshot: String(row.referral_code_snapshot || ''),
  categoryId: String(row.category_id || ''),
  rewardAmountSnapshot: Number(row.reward_amount_snapshot || 0),
  referralStatus: String(row.referral_status || 'attributed') as ReferralStatus,
  rewardStatus: String(row.reward_status || 'pending') as ReferralRewardStatus,
  attributedAt: String(row.attributed_at || ''),
  registeredAt: String(row.registered_at || ''),
  qualifiedAt: String(row.qualified_at || ''),
  rewardedAt: String(row.rewarded_at || ''),
  rejectedAt: String(row.rejected_at || ''),
  invalidatedAt: String(row.invalidated_at || ''),
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || '')
})

const rowToLedger = (row: Record<string, unknown>): WorkerReferralLedgerEntry => ({
  id: String(row.id || ''),
  workerId: String(row.worker_id || ''),
  referralId: String(row.referral_id || ''),
  entryType: String(row.entry_type || 'reward_credit') as ReferralLedgerEntryType,
  amount: Number(row.amount || 0),
  balanceAfter: Number(row.balance_after || 0),
  status: String(row.status || 'pending') as ReferralLedgerStatus,
  reference: String(row.reference || ''),
  remarks: String(row.remarks || ''),
  createdAt: String(row.created_at || '')
})

const unwrapSingle = async <T>(query: unknown, mapper: (row: Record<string, unknown>) => T) => {
  const { data, error } = await query as { data: Record<string, unknown> | null; error: unknown }
  if (error) throw error
  return data ? mapper(data) : null
}

const unwrapList = async <T>(query: unknown, mapper: (row: Record<string, unknown>) => T) => {
  const { data, error } = await query as { data: Record<string, unknown>[] | null; error: unknown }
  if (error) throw error
  return (data || []).map(mapper)
}

const requireSingle = async <T>(query: unknown, mapper: (row: Record<string, unknown>) => T) => {
  const record = await unwrapSingle(query, mapper)
  if (!record) {
    throw new LabourWorkerReferralError('Referral database write did not return a record.', 'write-empty-response', 500)
  }
  return record
}

export const createSupabaseWorkerReferralRepository = (client: SupabaseClientLike): WorkerReferralRepository => ({
  findWorkerById: async workerId =>
    unwrapSingle(
      client.from('labour_workers').select('id').eq('id', workerId).maybeSingle(),
      row => ({ id: String(row.id || '') })
    ),
  findCategoryById: async categoryId =>
    unwrapSingle(
      client.from('labour_categories').select('id,is_active').eq('id', categoryId).maybeSingle(),
      row => ({ id: String(row.id || ''), isActive: Boolean(row.is_active) })
    ),
  findProfileById: async referralProfileId =>
    unwrapSingle(
      client.from('worker_referral_profiles').select('*').eq('id', referralProfileId).maybeSingle(),
      rowToProfile
    ),
  findProfileByWorkerId: async workerId =>
    unwrapSingle(
      client.from('worker_referral_profiles').select('*').eq('worker_id', workerId).maybeSingle(),
      rowToProfile
    ),
  findProfileByCode: async referralCode =>
    unwrapSingle(
      client.from('worker_referral_profiles').select('*').eq('referral_code', normalizeReferralCode(referralCode)).maybeSingle(),
      rowToProfile
    ),
  insertProfile: async profile =>
    requireSingle(
      client.from('worker_referral_profiles').insert({
        id: profile.id,
        worker_id: profile.workerId,
        referral_code: profile.referralCode,
        is_active: profile.isActive,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt
      }).select('*').single(),
      rowToProfile
    ),
  findEligibility: async (referralProfileId, categoryId) =>
    unwrapSingle(
      client
        .from('worker_referral_category_eligibility')
        .select('*')
        .eq('referral_profile_id', referralProfileId)
        .eq('category_id', categoryId)
        .maybeSingle(),
      rowToEligibility
    ),
  listEligibility: async referralProfileId =>
    unwrapList(
      client.from('worker_referral_category_eligibility').select('*').eq('referral_profile_id', referralProfileId),
      rowToEligibility
    ),
  upsertEligibility: async eligibility =>
    requireSingle(
      client.from('worker_referral_category_eligibility').upsert({
        id: eligibility.id,
        referral_profile_id: eligibility.referralProfileId,
        category_id: eligibility.categoryId,
        reward_amount: eligibility.rewardAmount,
        is_active: eligibility.isActive,
        created_at: eligibility.createdAt,
        updated_at: eligibility.updatedAt
      }, { onConflict: 'referral_profile_id,category_id' }).select('*').single(),
      rowToEligibility
    ),
  findReferralByReferredWorkerId: async workerId =>
    unwrapSingle(
      client.from('worker_referrals').select('*').eq('referred_worker_id', workerId).maybeSingle(),
      rowToReferral
    ),
  insertReferral: async referral =>
    requireSingle(
      client.from('worker_referrals').insert({
        id: referral.id,
        referrer_worker_id: referral.referrerWorkerId,
        referred_worker_id: referral.referredWorkerId,
        referral_profile_id: referral.referralProfileId,
        referral_code_snapshot: referral.referralCodeSnapshot,
        category_id: referral.categoryId,
        reward_amount_snapshot: referral.rewardAmountSnapshot,
        referral_status: referral.referralStatus,
        reward_status: referral.rewardStatus,
        attributed_at: referral.attributedAt,
        registered_at: referral.registeredAt || null,
        qualified_at: referral.qualifiedAt || null,
        rewarded_at: referral.rewardedAt || null,
        rejected_at: referral.rejectedAt || null,
        invalidated_at: referral.invalidatedAt || null,
        created_at: referral.createdAt,
        updated_at: referral.updatedAt
      }).select('*').single(),
      rowToReferral
    ),
  listReferralsByReferrer: async workerId =>
    unwrapList(
      client.from('worker_referrals').select('*').eq('referrer_worker_id', workerId),
      rowToReferral
    ),
  findLedgerByReference: async reference =>
    unwrapSingle(
      client.from('worker_referral_ledger').select('*').eq('reference', reference).maybeSingle(),
      rowToLedger
    ),
  listLedgerByWorker: async workerId =>
    unwrapList(
      client.from('worker_referral_ledger').select('*').eq('worker_id', workerId).order('created_at', { ascending: true }),
      rowToLedger
    ),
  insertLedgerEntry: async entry =>
    requireSingle(
      client.from('worker_referral_ledger').insert({
        id: entry.id,
        worker_id: entry.workerId,
        referral_id: entry.referralId,
        entry_type: entry.entryType,
        amount: entry.amount,
        balance_after: entry.balanceAfter,
        status: entry.status,
        reference: entry.reference,
        remarks: entry.remarks || null,
        created_at: entry.createdAt
      }).select('*').single(),
      rowToLedger
    )
})

const getDefaultService = async () => {
  const { supabaseAdmin } = await import('./supabase-admin')
  return createLabourWorkerReferralService(
    createSupabaseWorkerReferralRepository(supabaseAdmin as unknown as SupabaseClientLike)
  )
}

export const getReferralProfileForWorker = async (workerId: string) =>
  (await getDefaultService()).getReferralProfileForWorker(workerId)

export const ensureReferralProfileForWorker = async (workerId: string) =>
  (await getDefaultService()).ensureReferralProfileForWorker(workerId)

export const getReferralProfileByCode = async (referralCode: string) =>
  (await getDefaultService()).getReferralProfileByCode(referralCode)

export const listReferralEligibleCategories = async (referralProfileId: string) =>
  (await getDefaultService()).listReferralEligibleCategories(referralProfileId)

export const setReferralCategoryEligibility = async (
  payload: Parameters<ReturnType<typeof createLabourWorkerReferralService>['setReferralCategoryEligibility']>[0]
) => (await getDefaultService()).setReferralCategoryEligibility(payload)

export const createReferralAttribution = async (
  payload: Parameters<ReturnType<typeof createLabourWorkerReferralService>['createReferralAttribution']>[0]
) => (await getDefaultService()).createReferralAttribution(payload)

export const getReferralForReferredWorker = async (workerId: string) =>
  (await getDefaultService()).getReferralForReferredWorker(workerId)

export const listReferralsForReferrer = async (workerId: string) =>
  (await getDefaultService()).listReferralsForReferrer(workerId)

export const getReferralLedger = async (workerId: string) =>
  (await getDefaultService()).getReferralLedger(workerId)

export const getReferralBalance = async (workerId: string) =>
  (await getDefaultService()).getReferralBalance(workerId)

export const addReferralLedgerEntry = async (
  payload: Parameters<ReturnType<typeof createLabourWorkerReferralService>['addReferralLedgerEntry']>[0]
) => (await getDefaultService()).addReferralLedgerEntry(payload)

export const creditReferralReward = async (
  payload: Parameters<ReturnType<typeof createLabourWorkerReferralService>['creditReferralReward']>[0]
) => (await getDefaultService()).creditReferralReward(payload)

export const reverseReferralReward = async (
  payload: Parameters<ReturnType<typeof createLabourWorkerReferralService>['reverseReferralReward']>[0]
) => (await getDefaultService()).reverseReferralReward(payload)
