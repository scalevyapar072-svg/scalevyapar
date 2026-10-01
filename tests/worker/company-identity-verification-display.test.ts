import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const importLocal = (relativePath: string) => import(
  pathToFileURL(path.join(workspaceRoot, relativePath)).href
)

const { getCompanyIdentityVerificationState } = await importLocal(
  'lib/labour-company-identity-verification.ts',
)

const searchPageSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'page.tsx'),
  'utf8',
)
const searchClientSource = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'search', 'labour-search-client.tsx'),
  'utf8',
)
const companySiteStyles = readFileSync(
  path.join(workspaceRoot, 'app', 'labour', 'company', 'company-site.module.css'),
  'utf8',
)

test('company identity verification state uses submitted evidence and explicit Admin decisions', () => {
  assert.equal(getCompanyIdentityVerificationState({
    identityProofPath: '',
    kycStatus: 'pending_review',
  }), 'not_submitted')

  assert.equal(getCompanyIdentityVerificationState({
    identityProofPath: 'workers/synthetic/identity-proof.pdf',
    kycStatus: 'pending_review',
  }), 'in_review')

  assert.equal(getCompanyIdentityVerificationState({
    identityProofPath: 'workers/synthetic/identity-proof.pdf',
    kycStatus: 'approved',
  }), 'approved')

  for (const kycStatus of ['rejected', 'needs_correction', 'needs correction']) {
    assert.equal(getCompanyIdentityVerificationState({
      identityProofPath: 'workers/synthetic/identity-proof.pdf',
      kycStatus,
    }), 'rejected')
  }

  assert.equal(getCompanyIdentityVerificationState({
    identityProofPath: 'workers/synthetic/identity-proof.pdf',
    kycStatus: 'verified',
  }), 'in_review')
})

test('each company identity verification state renders its required badge label', () => {
  const expectedLabels = {
    not_submitted: 'Identity Proof Pending',
    in_review: 'Identity Verification in Review',
    approved: 'Identity Verified',
    rejected: 'Identity Verification Needed',
  }

  for (const [state, label] of Object.entries(expectedLabels)) {
    const stateBlock = new RegExp(
      `${state}:\\s*\\{[\\s\\S]*?label:\\s*'${label}'`,
    )

    assert.match(searchClientSource, stateBlock, `Missing ${state} badge label: ${label}`)
  }
})

test('photo badge is green only for approved identity and yellow for every other state', () => {
  for (const state of ['not_submitted', 'in_review', 'rejected']) {
    assert.match(
      searchClientSource,
      new RegExp(`${state}:\\s*\\{[\\s\\S]*?photoBadgeClassName:\\s*styles\\.searchWorkerIdentityPhotoBadgeAttention`),
    )
  }
  assert.match(
    searchClientSource,
    /approved:\s*\{[\s\S]*?photoBadgeClassName:\s*styles\.searchWorkerIdentityPhotoBadgeApproved/,
  )
  assert.match(companySiteStyles, /\.searchWorkerIdentityPhotoBadgeAttention\s*\{[\s\S]*?background:\s*rgba\(254,\s*243,\s*199/)
  assert.match(companySiteStyles, /\.searchWorkerIdentityPhotoBadgeApproved\s*\{[\s\S]*?background:\s*rgba\(220,\s*252,\s*231/)
})

test('identity status card stays compact while retaining the exact status copy', () => {
  const compactCardRule = companySiteStyles.match(/\.searchWorkerIdentityProofCard\s*\{([\s\S]*?)\}/)?.[1] || ''

  assert.match(compactCardRule, /grid-template-columns:\s*32px\s+minmax\(0,\s*1fr\)/)
  assert.match(compactCardRule, /padding:\s*10px\s+12px/)
  assert.doesNotMatch(compactCardRule, /aspect-ratio|min-height:\s*186px/)
  assert.match(searchClientSource, /<p>\{identityVerificationMeta\.label\}<\/p>/)
  assert.match(searchClientSource, /<span>\{identityVerificationMeta\.message\}<\/span>/)
})

test('company search receives only the derived identity state and renders the required safe copy', () => {
  assert.match(searchPageSource, /identityVerificationState:\s*getCompanyIdentityVerificationState\(\{/)
  assert.doesNotMatch(searchPageSource, /identityProof(?:Type|Number|Path):\s*Boolean\(/)
  assert.doesNotMatch(searchClientSource, /identityProof(?:Type|Number|Path)/)
  assert.doesNotMatch(searchClientSource, /openWorkerDocument\(worker,\s*'identity'\)/)
  assert.doesNotMatch(searchClientSource, /downloadWorkerDocument\(worker,\s*'identity'\)/)
  assert.doesNotMatch(searchClientSource, /Identity (?:View|Download)/)

  for (const copy of [
    'Identity Proof Pending',
    'Worker profile is available. Identity document is not submitted. Verify identity before final hiring.',
    'Identity Verification in Review.',
    'Identity Verified',
    'Identity document verified by Rozgar.',
    'Identity Verification Needed.',
  ]) {
    assert.ok(searchClientSource.includes(copy), `Missing company-safe identity copy: ${copy}`)
  }
})
