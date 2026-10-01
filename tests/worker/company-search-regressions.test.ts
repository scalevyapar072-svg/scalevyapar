import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const importLocal = (relativePath: string) => import(
  pathToFileURL(path.join(workspaceRoot, relativePath)).href
)

const {
  buildCompanyWorkerSearchHref,
  resolveAuthorizedWorkerSearchJob,
} = await importLocal('lib/labour-worker-search-job.ts')
const {
  buildWorkerPhoneRevealState,
  buildWorkerContactLinks,
  canCompanyAccessWorkerRecord,
  getWorkerPhoneInteraction,
  getWorkerDocumentPath,
  resolveWorkerDocumentAccess,
  setWorkerPhoneRevealState,
} = await importLocal('lib/labour-company-worker-access.ts')
const { getWorkerKycReviewState } = await importLocal('lib/worker-kyc-completeness.ts')

const searchPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'page.tsx'),
  'utf8',
)
const searchClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'labour-search-client.tsx'),
  'utf8',
)
const panelClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'panel', 'company-panel-client.tsx'),
  'utf8',
)
const workerDocumentRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'search', 'worker-proof', 'route.ts'),
  'utf8',
)
const workerPhoneRouteSource = readFileSync(
  path.join(workspaceRoot, 'app', 'api', 'labour', 'company', 'search', 'worker-phone', 'route.ts'),
  'utf8',
)
const companySiteStyles = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'company-site.module.css'),
  'utf8',
)

const now = new Date('2026-09-19T12:00:00.000Z')
const jobs = [
  {
    id: 'owned-older-live',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-17T10:00:00.000Z',
    publishedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'owned-latest-live',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-18T10:00:00.000Z',
    publishedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'owned-expired',
    companyId: 'company-a',
    status: 'live',
    expiresAt: '2026-09-18',
    createdAt: '2026-09-19T10:00:00.000Z',
    publishedAt: '2026-09-19T10:00:00.000Z',
  },
  {
    id: 'foreign-live',
    companyId: 'company-b',
    status: 'live',
    expiresAt: '2026-10-01',
    createdAt: '2026-09-19T11:00:00.000Z',
    publishedAt: '2026-09-19T11:00:00.000Z',
  },
]

test('automatic owned-job selection and selecting the same job manually resolve identically', () => {
  const automatic = resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-a',
    requestedJobId: '',
    now,
  })
  const manual = resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-a',
    requestedJobId: 'owned-latest-live',
    now,
  })

  assert.equal(automatic?.id, 'owned-latest-live')
  assert.deepEqual(automatic, manual)
  assert.equal(buildCompanyWorkerSearchHref(automatic?.id), '/labour/company/search?jobId=owned-latest-live')
})

test('missing without an owned live job and explicit invalid, expired, or foreign jobs fail closed', () => {
  assert.equal(resolveAuthorizedWorkerSearchJob(jobs, {
    authenticatedCompanyId: 'company-without-jobs',
    requestedJobId: '',
    now,
  }), null)

  for (const requestedJobId of ['missing-job', 'owned-expired', 'foreign-live']) {
    assert.equal(resolveAuthorizedWorkerSearchJob(jobs, {
      authenticatedCompanyId: 'company-a',
      requestedJobId,
      now,
    }), null)
  }
})

test('valid Indian mobile variants produce canonical Call and WhatsApp hrefs', () => {
  const message = 'Synthetic interest message'

  for (const mobile of ['9876543210', '09876543210', '+91 98765 43210', '91-98765-43210']) {
    assert.deepEqual(buildWorkerContactLinks(mobile, message), {
      normalizedMobile: '+919876543210',
      telHref: 'tel:+919876543210',
      whatsappHref: `https://wa.me/919876543210?text=${encodeURIComponent(message)}`,
    })
  }
})

test('missing and malformed mobiles produce no clickable contact href', () => {
  for (const mobile of ['', '12345', '+1 415 555 0100', 'not-a-number']) {
    assert.deepEqual(buildWorkerContactLinks(mobile, 'Synthetic message'), {
      normalizedMobile: '',
      telHref: '',
      whatsappHref: '',
    })
  }
})

test('the first phone interaction reveals without dialing and the second exposes only the normalized tel href', () => {
  assert.deepEqual(getWorkerPhoneInteraction(), {
    label: 'View Contact',
    href: '',
    disabled: false,
    shouldReveal: true,
    normalizedMobile: '',
    whatsappHref: '',
  })

  const revealed = buildWorkerPhoneRevealState('09876 543210', 'Synthetic message')
  assert.deepEqual(getWorkerPhoneInteraction(revealed), {
    label: '+919876543210',
    href: 'tel:+919876543210',
    disabled: false,
    shouldReveal: false,
    normalizedMobile: '+919876543210',
    whatsappHref: `https://wa.me/919876543210?text=${encodeURIComponent('Synthetic message')}`,
  })
})

test('invalid or missing phone reveals become unavailable and cannot dial', () => {
  for (const mobile of ['', '12345', '+1 415 555 0100', 'not-a-number']) {
    assert.deepEqual(getWorkerPhoneInteraction(buildWorkerPhoneRevealState(mobile, 'Synthetic message')), {
      label: 'Phone not available',
      href: '',
      disabled: true,
      shouldReveal: false,
      normalizedMobile: '',
      whatsappHref: '',
    })
  }
})

test('phone reveal state is independent for multiple worker cards', () => {
  const first = buildWorkerPhoneRevealState('9876543210', 'First worker')
  const second = buildWorkerPhoneRevealState('', 'Second worker')
  const states = setWorkerPhoneRevealState(
    setWorkerPhoneRevealState({}, 'worker-one', first),
    'worker-two',
    second,
  )

  assert.equal(states['worker-one'].status, 'available')
  assert.equal(states['worker-two'].status, 'unavailable')
  assert.equal(getWorkerPhoneInteraction(states['worker-one']).href, 'tel:+919876543210')
  assert.equal(getWorkerPhoneInteraction(states['worker-two']).disabled, true)
})

test('document access requires an active company, a live matching category, and an eligible visible worker', () => {
  const allowed = {
    companyStatus: 'active',
    liveJobCategoryIds: ['cutting', 'stitching'],
    workerCategoryIds: ['finishing', 'stitching'],
    workerStatus: 'active',
    workerIsVisible: true,
  }

  assert.equal(canCompanyAccessWorkerRecord(allowed), true)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, companyStatus: 'blocked' }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, liveJobCategoryIds: [] }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerCategoryIds: ['electrician'] }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerStatus: 'pending' }), false)
  assert.equal(canCompanyAccessWorkerRecord({ ...allowed, workerIsVisible: false }), false)
  assert.deepEqual(resolveWorkerDocumentAccess({
    ...allowed,
    workerStatus: 'pending',
    workerIsVisible: false,
  }, {
    identityProofPath: '',
    resumeDocumentPath: '',
  }, 'identity'), {
    authorized: false,
    documentPath: '',
  })
})

test('existing verified ranking signal keeps the same approved and complete KYC state as Admin', () => {
  const completeWorker = {
    fullName: 'Synthetic Worker',
    city: 'Test City',
    categoryIds: ['test-category'],
    profilePhotoPath: 'workers/synthetic/profile.png',
    identityProofType: 'other',
    identityProofNumber: 'SYNTHETIC',
    identityProofPath: 'workers/synthetic/identity.png',
    status: 'active',
    kycStatus: 'approved',
  }

  assert.equal(getWorkerKycReviewState(completeWorker), 'approved')
  assert.equal(getWorkerKycReviewState({ ...completeWorker, identityProofPath: '' }), 'not_submitted')
  assert.equal(getWorkerKycReviewState({ ...completeWorker, kycStatus: 'pending_review' }), 'ready_for_review')
  assert.match(searchPageSource, /'kyc_status'/)
  assert.match(searchPageSource, /isVerified:\s*getWorkerKycReviewState\(\{/)
  assert.match(searchPageSource, /kycStatus:\s*worker\.kyc_status/)
  assert.doesNotMatch(
    searchPageSource,
    /isVerified:\s*worker\.status === 'active' \|\| Boolean\(worker\.identity_proof_number \|\| worker\.identity_proof_path\)/,
  )
})

test('identity and resume paths are mapped independently and preserve genuine absence', () => {
  const worker = {
    identityProofPath: 'workers/synthetic/identity.pdf',
    resumeDocumentPath: 'workers/synthetic/resume.pdf',
  }

  assert.equal(getWorkerDocumentPath(worker, 'identity'), worker.identityProofPath)
  assert.equal(getWorkerDocumentPath(worker, 'resume'), worker.resumeDocumentPath)
  assert.equal(getWorkerDocumentPath({ ...worker, resumeDocumentPath: '' }, 'resume'), '')

  const access = {
    companyStatus: 'active',
    liveJobCategoryIds: ['stitching'],
    workerCategoryIds: ['stitching'],
    workerStatus: 'inactive_wallet_empty',
    workerIsVisible: true,
  }
  assert.deepEqual(resolveWorkerDocumentAccess(access, worker, 'identity'), {
    authorized: true,
    documentPath: worker.identityProofPath,
  })
  assert.deepEqual(resolveWorkerDocumentAccess(access, worker, 'resume'), {
    authorized: true,
    documentPath: worker.resumeDocumentPath,
  })
  assert.deepEqual(resolveWorkerDocumentAccess(
    { ...access, liveJobCategoryIds: ['electrician'] },
    worker,
    'identity',
  ), { authorized: false, documentPath: '' })
})

test('the server owns automatic selection and privileged ranking before the client renders it', () => {
  assert.match(searchPageSource, /resolveAuthorizedWorkerSearchJob/)
  assert.match(searchPageSource, /orderingCompany/)
  assert.match(searchPageSource, /globalTierOrder:\s*useGlobalTierOrdering/)
  assert.match(searchPageSource, /initialRequestedJobId=\{effectiveRequestedJobId\}/)
  assert.match(searchClientSource, /hasValidRequestedJobContext\s*&&\s*tab\.jobId === requestedJobId/)
  assert.doesNotMatch(searchClientSource, /!requestedJobId\s*&&\s*effectiveJobContext/)
})

test('every Company Panel Search Worker navigation carries the latest authorized live job', () => {
  assert.match(panelClientSource, /const searchWorkersHref = useMemo/)
  assert.match(panelClientSource, /buildCompanyWorkerSearchHref/)
  assert.equal((panelClientSource.match(/href=\{searchWorkersHref\}/g) || []).length, 5)
})

test('identity and resume controls use only the authenticated document route without exposing document paths', () => {
  assert.match(searchPageSource, /hasIdentityDocument:\s*Boolean\(worker\.identity_proof_path\)/)
  assert.match(searchPageSource, /resume_document_path/)
  assert.match(searchPageSource, /hasResumeDocument:\s*Boolean\(worker\.resume_document_path\)/)
  assert.match(searchClientSource, /document=\$\{documentKind\}/)
  assert.match(searchClientSource, /worker\.hasIdentityDocument\s*&&\s*workerCanAccessDirectly\(worker\)/)
  assert.match(searchClientSource, /worker\.hasResumeDocument\s*&&\s*workerCanAccessDirectly\(worker\)/)
  assert.doesNotMatch(searchClientSource, /identityProof(?:Type|Number|Path)/)
  assert.doesNotMatch(searchClientSource, /resumeDocumentPath/)
  assert.doesNotMatch(searchPageSource, /resumeDocumentPath:/)
  assert.match(searchClientSource, /openWorkerDocument\(worker,\s*'identity'\)/)
  assert.match(searchClientSource, /downloadWorkerDocument\(worker,\s*'identity'\)/)
  assert.match(searchClientSource, /openWorkerDocument\(worker,\s*'resume'\)/)
  assert.match(searchClientSource, /downloadWorkerDocument\(worker,\s*'resume'\)/)
  assert.doesNotMatch(searchClientSource, />Resume Not Available</)
  assert.match(workerDocumentRouteSource, /getCompanyUserFromRequest/)
  assert.match(workerDocumentRouteSource, /getUserFromRequest/)
  assert.match(workerDocumentRouteSource, /resolveWorkerDocumentAccess/)
  assert.match(workerDocumentRouteSource, /resume_document_path/)
})

test('worker phones are absent from the initial page DTO and fetched only by the authenticated endpoint', () => {
  assert.match(searchPageSource, /const authenticatedCompany = orderingCompany/)
  assert.doesNotMatch(searchPageSource, /['"]mobile['"]\s*,/)
  assert.doesNotMatch(searchPageSource, /mobile:\s*worker\.mobile/)
  assert.doesNotMatch(searchClientSource, /worker\.mobile/)
  assert.match(searchClientSource, /\/api\/labour\/company\/search\/worker-phone/)
  assert.match(searchClientSource, /method:\s*'POST'/)
  assert.match(workerPhoneRouteSource, /getCompanyUserFromRequest/)
  assert.match(workerPhoneRouteSource, /getUserFromRequest/)
  assert.match(workerPhoneRouteSource, /resolveWorkerPhoneAccess/)
  assert.match(workerPhoneRouteSource, /Cache-Control['"]?:\s*['"]private, no-store/)
  assert.doesNotMatch(workerPhoneRouteSource, /console\.(?:log|info|warn|error)/)
  assert.match(searchPageSource, /identityVerificationState:\s*getCompanyIdentityVerificationState\(\{/)
  assert.doesNotMatch(searchPageSource, /identityProof(?:Type|Number|Path):\s*Boolean\(/)
  assert.doesNotMatch(searchClientSource, /identityProof(?:Type|Number|Path)/)
  assert.match(searchPageSource, /hasResumeDocument:\s*Boolean\(worker\.resume_document_path\)/)
  assert.doesNotMatch(searchClientSource, /resumeDocumentPath/)
})

test('phone reveal preserves the existing responsive contact layout', () => {
  assert.match(companySiteStyles, /\.searchWorkerExpandedActionsUnlocked\s+\.searchWorkerContactButton\s*\{[\s\S]*?width:\s*100%/)
  assert.match(companySiteStyles, /\.searchWorkerExpandedActionsUnlocked\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*44px/)
})
