import assert from 'node:assert/strict'
import {
  LabourWorkerReferralError,
  createLabourWorkerReferralService
} from '../lib/labour-worker-referral.ts'

const makeRepository = () => {
  const state = {
    workers: new Map([
      ['worker-1', { id: 'worker-1' }],
      ['worker-2', { id: 'worker-2' }],
      ['worker-3', { id: 'worker-3' }]
    ]),
    categories: new Map([
      ['cat-active-a', { id: 'cat-active-a', isActive: true }],
      ['cat-active-b', { id: 'cat-active-b', isActive: true }],
      ['cat-active-c', { id: 'cat-active-c', isActive: true }],
      ['cat-inactive', { id: 'cat-inactive', isActive: false }]
    ]),
    profiles: new Map(),
    eligibilities: new Map(),
    referrals: new Map(),
    ledger: new Map(),
    walletBalance: new Map([
      ['worker-1', 500],
      ['worker-2', 0],
      ['worker-3', 0]
    ]),
    walletTransactions: []
  }

  const profileCategoryKey = (profileId, categoryId) => `${profileId}:${categoryId}`

  return {
    state,
    async findWorkerById(workerId) {
      return state.workers.get(workerId) || null
    },
    async findCategoryById(categoryId) {
      return state.categories.get(categoryId) || null
    },
    async findProfileById(referralProfileId) {
      return state.profiles.get(referralProfileId) || null
    },
    async findProfileByWorkerId(workerId) {
      return [...state.profiles.values()].find(profile => profile.workerId === workerId) || null
    },
    async findProfileByCode(referralCode) {
      return [...state.profiles.values()].find(profile => profile.referralCode === referralCode) || null
    },
    async insertProfile(profile) {
      if ([...state.profiles.values()].some(item => item.workerId === profile.workerId)) {
        throw Object.assign(new Error('duplicate worker profile'), { code: '23505' })
      }
      if ([...state.profiles.values()].some(item => item.referralCode === profile.referralCode)) {
        throw Object.assign(new Error('duplicate referral code'), { code: '23505' })
      }
      state.profiles.set(profile.id, profile)
      return profile
    },
    async findEligibility(referralProfileId, categoryId) {
      return state.eligibilities.get(profileCategoryKey(referralProfileId, categoryId)) || null
    },
    async listEligibility(referralProfileId) {
      return [...state.eligibilities.values()].filter(item => item.referralProfileId === referralProfileId)
    },
    async upsertEligibility(eligibility) {
      state.eligibilities.set(profileCategoryKey(eligibility.referralProfileId, eligibility.categoryId), eligibility)
      return eligibility
    },
    async findReferralByReferredWorkerId(workerId) {
      return [...state.referrals.values()].find(referral => referral.referredWorkerId === workerId) || null
    },
    async insertReferral(referral) {
      if ([...state.referrals.values()].some(item => item.referredWorkerId === referral.referredWorkerId)) {
        throw Object.assign(new Error('duplicate referred worker'), { code: '23505' })
      }
      state.referrals.set(referral.id, referral)
      return referral
    },
    async qualifyReferral(referralId, qualifiedAt) {
      const referral = state.referrals.get(referralId)
      if (
        !referral ||
        referral.referralStatus !== 'registered' ||
        referral.rewardStatus !== 'pending'
      ) {
        return null
      }

      const updated = {
        ...referral,
        referralStatus: 'qualified',
        qualifiedAt,
        updatedAt: qualifiedAt
      }
      state.referrals.set(referralId, updated)
      return updated
    },
    async listReferralsByReferrer(workerId) {
      return [...state.referrals.values()].filter(referral => referral.referrerWorkerId === workerId)
    },
    async findLedgerByReference(reference) {
      return state.ledger.get(reference) || null
    },
    async listLedgerByWorker(workerId) {
      return [...state.ledger.values()].filter(entry => entry.workerId === workerId)
    },
    async insertLedgerEntry(entry) {
      if (state.ledger.has(entry.reference)) {
        throw Object.assign(new Error('duplicate ledger reference'), { code: '23505' })
      }
      state.ledger.set(entry.reference, entry)
      return entry
    }
  }
}

const expectReferralError = async (action, code) => {
  await assert.rejects(
    action,
    error => error instanceof LabourWorkerReferralError && error.code === code
  )
}

const run = async () => {
  const repository = makeRepository()
  const service = createLabourWorkerReferralService(repository)

  const profile1 = await service.ensureReferralProfileForWorker('worker-1')
  assert.equal(profile1.workerId, 'worker-1', 'worker gets one referral profile')
  assert.match(profile1.referralCode, /^RZG[A-Z0-9]{8}$/, 'referral code format')

  const repeatedProfile1 = await service.ensureReferralProfileForWorker('worker-1')
  assert.equal(repeatedProfile1.id, profile1.id, 'repeated ensure returns same profile')

  const profile2 = await service.ensureReferralProfileForWorker('worker-2')
  assert.notEqual(profile2.referralCode, profile1.referralCode, 'different workers get different codes')

  const collisionRepository = makeRepository()
  const collisionService = createLabourWorkerReferralService(collisionRepository)
  let codeChecks = 0
  const originalFindProfileByCode = collisionRepository.findProfileByCode.bind(collisionRepository)
  collisionRepository.findProfileByCode = async code => {
    codeChecks += 1
    if (codeChecks === 1 && code) return { ...profile1, referralCode: code }
    return originalFindProfileByCode(code)
  }
  const collisionProfile = await collisionService.ensureReferralProfileForWorker('worker-1')
  assert.equal(collisionProfile.workerId, 'worker-1', 'referral code collision handled safely')

  const eligibilityA = await service.setReferralCategoryEligibility({
    referralProfileId: profile1.id,
    categoryId: 'cat-active-a',
    rewardAmount: 100
  })
  assert.equal(eligibilityA.categoryId, 'cat-active-a', 'one category assignment')

  const eligibilityB = await service.setReferralCategoryEligibility({
    referralProfileId: profile1.id,
    categoryId: 'cat-active-b',
    rewardAmount: 200
  })
  assert.equal(eligibilityB.categoryId, 'cat-active-b', 'multiple category assignment')

  const duplicateEligibility = await service.setReferralCategoryEligibility({
    referralProfileId: profile1.id,
    categoryId: 'cat-active-a',
    rewardAmount: 100
  })
  assert.equal(duplicateEligibility.id, eligibilityA.id, 'duplicate category mapping is idempotent')

  await expectReferralError(
    () => service.setReferralCategoryEligibility({
      referralProfileId: profile1.id,
      categoryId: 'cat-inactive',
      rewardAmount: 100
    }),
    'category-inactive'
  )

  const referral = await service.createReferralAttribution({
    referralCode: profile1.referralCode.toLowerCase(),
    referredWorkerId: 'worker-2',
    categoryId: 'cat-active-a'
  })
  assert.equal(referral.referrerWorkerId, 'worker-1', 'valid Worker 1 to Worker 2 succeeds')
  assert.equal(referral.rewardAmountSnapshot, 100, 'historical reward snapshot captured')
  assert.equal(referral.categoryId, 'cat-active-a', 'historical category snapshot captured')

  await expectReferralError(
    () => service.createReferralAttribution({
      referralCode: profile1.referralCode,
      referredWorkerId: 'worker-1',
      categoryId: 'cat-active-a'
    }),
    'self-referral'
  )

  const sameReferralRetry = await service.createReferralAttribution({
    referralCode: profile1.referralCode,
    referredWorkerId: 'worker-2',
    categoryId: 'cat-active-a'
  })
  assert.equal(sameReferralRetry.id, referral.id, 'same attribution retry does not duplicate')

  const profile3 = await service.ensureReferralProfileForWorker('worker-3')
  await expectReferralError(
    () => service.createReferralAttribution({
      referralCode: profile3.referralCode,
      referredWorkerId: 'worker-2',
      categoryId: 'cat-active-a'
    }),
    'category-not-eligible'
  )

  await service.setReferralCategoryEligibility({
    referralProfileId: profile3.id,
    categoryId: 'cat-active-a',
    rewardAmount: 150
  })
  await expectReferralError(
    () => service.createReferralAttribution({
      referralCode: profile3.referralCode,
      referredWorkerId: 'worker-2',
      categoryId: 'cat-active-a'
    }),
    'already-attributed'
  )

  await expectReferralError(
    () => service.createReferralAttribution({
      referralCode: profile1.referralCode,
      referredWorkerId: 'worker-3',
      categoryId: 'cat-inactive'
    }),
    'category-inactive'
  )

  await expectReferralError(
    () => service.createReferralAttribution({
      referralCode: profile1.referralCode,
      referredWorkerId: 'worker-3',
      categoryId: 'cat-active-c'
    }),
    'category-not-eligible'
  )

  const firstCredit = await service.creditReferralReward({
    workerId: 'worker-1',
    referralId: referral.id,
    amount: 100,
    reference: `reward-credit-${referral.id}`
  })
  assert.equal(firstCredit.balanceAfter, 100, 'first reward credit succeeds')

  const repeatedCredit = await service.creditReferralReward({
    workerId: 'worker-1',
    referralId: referral.id,
    amount: 100,
    reference: `reward-credit-${referral.id}`
  })
  assert.equal(repeatedCredit.id, firstCredit.id, 'repeated same reward reference does not duplicate credit')

  const reversal = await service.reverseReferralReward({
    workerId: 'worker-1',
    referralId: referral.id,
    amount: 100,
    reference: `reward-reversal-${referral.id}`
  })
  assert.equal(reversal.entryType, 'reward_reversal', 'reversal creates new ledger entry')
  assert.equal(await service.getReferralBalance('worker-1'), 0, 'referral balance reflects reversal')
  assert.equal(repository.state.walletBalance.get('worker-1'), 500, 'existing main wallet remains unchanged')
  assert.equal(repository.state.walletTransactions.length, 0, 'labour_wallet_transactions remains untouched')

  const phase5Repository = makeRepository()
  const phase5Service = createLabourWorkerReferralService(phase5Repository)
  const phase5Profile = await phase5Service.ensureReferralProfileForWorker('worker-1')
  await phase5Service.setReferralCategoryEligibility({
    referralProfileId: phase5Profile.id,
    categoryId: 'cat-active-a',
    rewardAmount: 50
  })
  const registeredReferral = await phase5Service.createReferralAttribution({
    referralCode: phase5Profile.referralCode,
    referredWorkerId: 'worker-2',
    categoryId: 'cat-active-a',
    referralStatus: 'registered',
    registeredAt: '2026-08-10T00:00:00.000Z'
  })

  const qualifiedReferral = await phase5Service.qualifyReferralAfterKycApproval('worker-2')
  assert.equal(qualifiedReferral.referralStatus, 'qualified', 'KYC approval qualifies registered referral')
  assert.equal(qualifiedReferral.rewardStatus, 'pending', 'qualification keeps reward pending')
  assert.ok(qualifiedReferral.qualifiedAt, 'qualification timestamp is set')
  assert.equal(phase5Repository.state.ledger.size, 0, 'qualification does not create referral ledger rows')
  assert.equal(phase5Repository.state.walletBalance.get('worker-1'), 500, 'qualification does not change main wallet')
  assert.equal(phase5Repository.state.walletTransactions.length, 0, 'qualification does not create labour wallet transactions')

  const firstQualifiedAt = qualifiedReferral.qualifiedAt
  const repeatedQualification = await phase5Service.qualifyReferralAfterKycApproval('worker-2')
  assert.equal(repeatedQualification.qualifiedAt, firstQualifiedAt, 'repeated KYC approval keeps qualified_at unchanged')
  assert.equal(phase5Repository.state.referrals.size, 1, 'repeated KYC approval does not duplicate referral')

  const noReferralQualification = await phase5Service.qualifyReferralAfterKycApproval('worker-3')
  assert.equal(noReferralQualification, null, 'worker with no referral is ignored')

  const pendingReferral = {
    ...registeredReferral,
    id: 'referral-pending',
    referredWorkerId: 'worker-3',
    referralStatus: 'registered',
    rewardStatus: 'available',
    qualifiedAt: '',
    updatedAt: registeredReferral.updatedAt
  }
  phase5Repository.state.referrals.set(pendingReferral.id, pendingReferral)
  const rewardAvailableResult = await phase5Service.qualifyReferralAfterKycApproval('worker-3')
  assert.equal(rewardAvailableResult.rewardStatus, 'available', 'non-pending reward status is not qualified')
  assert.equal(rewardAvailableResult.referralStatus, 'registered', 'rewarded or available referral is not downgraded or rewritten')

  const rejectedReferral = {
    ...registeredReferral,
    id: 'referral-rejected',
    referredWorkerId: 'worker-rejected',
    referralStatus: 'rejected',
    qualifiedAt: ''
  }
  phase5Repository.state.workers.set('worker-rejected', { id: 'worker-rejected' })
  phase5Repository.state.referrals.set(rejectedReferral.id, rejectedReferral)
  const rejectedResult = await phase5Service.qualifyReferralAfterKycApproval('worker-rejected')
  assert.equal(rejectedResult.referralStatus, 'rejected', 'rejected referral is not qualified')

  console.log('PASS referral foundation tests')
}

await run()
