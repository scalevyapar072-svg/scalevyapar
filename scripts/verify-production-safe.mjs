import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const requiredFiles = [
  'app/admin/page.tsx',
  'app/admin/website/page.tsx',
  'app/labour/company/company-registration/page.tsx',
  'app/labour/company/company-registration-form.tsx',
  'app/labour/company/search/labour-search-client.tsx',
  'lib/labour-worker-app.ts',
  'app/pricing/page.tsx',
  'app/tools/page.tsx'
]

const routeSources = {
  '/': 'app/page.tsx',
  '/pricing': 'app/pricing/page.tsx',
  '/tools': 'app/tools/page.tsx',
  '/admin': 'app/admin/page.tsx',
  '/admin/website': 'app/admin/website/page.tsx',
  '/admin/labour': 'app/admin/labour/page.tsx',
  '/admin/labour/website': 'app/admin/labour/website/page.tsx',
  '/labour/company': 'app/labour/company/page.tsx',
  '/labour/company/search': 'app/labour/company/search/page.tsx',
  '/labour/company/job-post': 'app/labour/company/job-post/page.tsx',
  '/labour/company/company-registration': 'app/labour/company/company-registration/page.tsx'
}

const has = (file, pattern) => readFileSync(file, 'utf8').includes(pattern)

const fail = (message) => {
  console.error(`❌ ${message}`)
  process.exit(1)
}

const warn = (message) => {
  console.log(`⚠️ ${message}`)
}

console.log(`[verify] root: ${ROOT}`)
if (!ROOT.includes('scalevyapar-production-current-safe')) {
  warn('Expected deployment guard to run from scalevyapar-production-current-safe.')
}

for (const file of requiredFiles) {
  if (!existsSync(join(ROOT, file))) fail(`Missing required file: ${file}`)
}

const adminPage = join(ROOT, 'app/admin/page.tsx')
const adminContent = readFileSync(adminPage, 'utf8')

const deprecatedLabelPatterns = [
  { pattern: /\bLabour Site\b/g, name: 'Labour Site' },
  { pattern: /\bLabour Admin\b/g, name: 'Labour Admin' },
  { pattern: /\bEdit Website\b/g, name: 'Edit Website' },
  { pattern: /<[^>]*>\s*Website Editor\s*<\/[^>]*>/g, name: 'Website Editor' }
]

for (const item of deprecatedLabelPatterns) {
  const matches = adminContent.matchAll(item.pattern)
  for (const match of [...matches]) {
    const fullMatch = match[0]
    if (item.name === 'Website Editor') {
      if (fullMatch.includes('ScaleVyapar') || fullMatch.includes('Rozgar')) {
        continue
      }
      fail(`Found deprecated admin label in app/admin/page.tsx: ${item.name}`)
    } else {
      fail(`Found deprecated admin label in app/admin/page.tsx: ${item.name}`)
    }
  }
}

const requiredAdminLabels = [
  'Client Dashboard',
  'ScaleVyapar Website',
  'ScaleVyapar Website Editor',
  'Rozgar Website',
  'Rozgar Admin',
  'Rozgar Website Editor',
  'Refresh'
]
for (const good of requiredAdminLabels) {
  if (!adminContent.includes(good)) {
    fail(`Missing required admin label in app/admin/page.tsx: ${good}`)
  }
}

const regFormPath = join(ROOT, 'app/labour/company/company-registration-form.tsx')
const regFormContent = readFileSync(regFormPath, 'utf8')
for (const field of ['State *', 'City *', 'Area *', 'Pincode *']) {
  if (!regFormContent.includes(field)) fail(`Missing company registration field: ${field}`)
}

const searchClientPath = join(ROOT, 'app/labour/company/search/labour-search-client.tsx')
const searchClient = readFileSync(searchClientPath, 'utf8')
if (!searchClient.includes('WORKERS_PER_PAGE = 20')) fail('Search page missing WORKERS_PER_PAGE = 20')

const workerAppPath = join(ROOT, 'lib/labour-worker-app.ts')
if (!has(workerAppPath, 'city_master')) fail('Coordinate fallback to city_master not found in lib/labour-worker-app.ts')

const hasMojibake = (filePath) => {
  const c = readFileSync(filePath, 'utf8')
  return c.includes('â‚¹') || c.includes('ðŸ')
}

const hasRouteFile = (routePath, relativeFile) => {
  const absolutePath = join(ROOT, relativeFile)
  if (!existsSync(absolutePath)) {
    fail(`Missing route source for ${routePath}: ${relativeFile}`)
  }
  return true
}

if (hasMojibake(join(ROOT, 'app/pricing/page.tsx')) || hasMojibake(join(ROOT, 'app/tools/page.tsx'))) {
  fail('Known mojibake strings detected in pricing/tools routes')
}

const middlewarePath = join(ROOT, 'middleware.ts')
const nextConfigPath = join(ROOT, 'next.config.ts')
if (existsSync(middlewarePath)) {
  console.log('[verify] middleware.ts present.')
} else {
  fail('middleware.ts is missing.')
}

if (existsSync(nextConfigPath)) {
  console.log('[verify] next.config.ts present.')
} else {
  fail('next.config.ts is missing.')
}

try {
  const sensitiveDiff = execSync('git diff --name-only -- middleware.ts next.config.ts', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim()
  if (sensitiveDiff) {
    fail(`Protected files changed since baseline: ${sensitiveDiff}`)
  }
} catch {
  warn('Could not check git diff for middleware.ts / next.config.ts; not running in git-aware context.')
}

for (const [route, source] of Object.entries(routeSources)) {
  hasRouteFile(route, source)
}

try {
  const status = execSync('git status --short', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  const dirty = status.trim().split('\n').filter(Boolean)
  const dirtyCore = dirty.filter(line => {
    const file = line.substring(3).trim()
    return !file.includes('node_modules') && !file.includes('.next')
  })
  if (dirtyCore.length > 0) {
    warn(`Working tree has changes (${dirtyCore.length}). Verify only expected changes before production attach.`)
  }
} catch {
  warn('Git status check skipped (no git metadata or unavailable).')
}

console.log('✅ production-safe verification passed')
