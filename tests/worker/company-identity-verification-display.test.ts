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

test('company search receives only the derived identity state and renders the required safe copy', () => {
  assert.match(searchPageSource, /identityVerificationState:\s*getCompanyIdentityVerificationState\(\{/)
  assert.doesNotMatch(searchPageSource, /identityProof(?:Type|Number|Path):\s*Boolean\(/)
  assert.doesNotMatch(searchClientSource, /identityProof(?:Type|Number|Path)/)
  assert.doesNotMatch(searchClientSource, /openWorkerDocument\(worker,\s*'identity'\)/)
  assert.doesNotMatch(searchClientSource, /downloadWorkerDocument\(worker,\s*'identity'\)/)

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
