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

  console.log('PASS referral foundation tests')
}

await run()
