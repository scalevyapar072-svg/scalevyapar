import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()
const readSource = (...parts: string[]) => readFileSync(path.join(workspaceRoot, ...parts), 'utf8')

const marketplaceSource = readSource('lib', 'labour-marketplace.ts')
const websiteSource = readSource('lib', 'labour-company-website.ts')
const mastersSource = readSource('lib', 'labour-masters.ts')
const searchSource = readSource('app', 'labour', 'company', 'search', 'page.tsx')
const panelSource = readSource('app', 'labour', 'company', 'panel', 'company-panel-client.tsx')
const adminSource = readSource('app', 'admin', 'labour', 'page.tsx')

test('public pages use scoped cached reads instead of the full marketplace snapshot', () => {
  const homeSource = readSource('app', 'labour', 'company', 'page.tsx')
  assert.ok(homeSource.includes('getPublicLabourMarketplaceSnapshot'))
  assert.ok(!homeSource.includes('getLabourMarketplaceSnapshot'))
  assert.ok(websiteSource.includes('unstable_cache'))
  assert.ok(mastersSource.includes('unstable_cache'))
  assert.ok(marketplaceSource.includes("select('status,is_visible,active_plan,plan_valid_until')"))
  assert.ok(marketplaceSource.includes("select('id', { count: 'exact', head: true })"))
})

test('affected Supabase reads opt out of broad automatic SDK retries', () => {
  assert.ok(websiteSource.includes('.retry(false)'))
  assert.ok(mastersSource.includes('.retry(false)'))
  assert.ok(marketplaceSource.includes('.retry(false)'))
  assert.ok(searchSource.includes('.abortSignal(signal).retry(false)'))
  assert.ok(searchSource.includes('maxRetries: 1'))
})

test('degraded search and Admin data cannot be rendered as genuine empty data', () => {
  assert.ok(searchSource.includes('searchDataUnavailable'))
  assert.ok(searchSource.includes('No empty-result conclusion has been made'))
  assert.ok(adminSource.includes('snapshotLoaded'))
  assert.ok(adminSource.includes('referralLoaded'))
  assert.ok(adminSource.includes('referralSettingsLoaded'))
  assert.ok(adminSource.includes('referralWithdrawalsLoaded'))
})

test('Company panel only clears its local token after an authentication failure', () => {
  assert.ok(panelSource.includes('if (!isAuthenticationFailure(dashboardError))'))
  assert.ok(panelSource.includes('setSessionUnavailable(true)'))
  assert.ok(panelSource.includes('localStorage.removeItem(COMPANY_TOKEN_KEY)'))
  assert.ok(panelSource.indexOf('if (!isAuthenticationFailure(dashboardError))') < panelSource.indexOf('localStorage.removeItem(COMPANY_TOKEN_KEY)'))
})

test('mutating requests are guarded in memory and contain no automatic retry loop', () => {
  assert.ok(panelSource.includes('applicationMutationInFlightRef.current.has(payload.applicationId)'))
  assert.ok(panelSource.includes('billingProfileInFlightRef.current'))
  assert.ok(panelSource.includes('communicationPreferencesInFlightRef.current'))
  assert.ok(!panelSource.includes("method: 'POST',\n        retry"))
  assert.ok(!panelSource.includes("method: 'PUT',\n        retry"))
})
