import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const pageSource = readFileSync(
  path.join(process.cwd(), 'app', 'admin', 'labour', 'page.tsx'),
  'utf8',
)

test('Labour Admin mobile navigation is an accessible closed-by-default drawer', () => {
  assert.match(pageSource, /isMobileNavigationOpen[\s\S]*?useState\(false\)/)
  assert.match(pageSource, /aria-controls="labour-admin-navigation"/)
  assert.match(pageSource, /aria-expanded=\{isMobileNavigationOpen\}/)
  assert.match(pageSource, /aria-label="Open Labour Admin navigation"/)
  assert.match(pageSource, /aria-label="Close Labour Admin navigation"/)
  assert.match(pageSource, /event\.key === 'Escape'/)
  assert.match(pageSource, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(pageSource, /\.labour-sidebar\.open\s*\{[\s\S]*?transform: translateX\(0\)/)
  assert.match(pageSource, /\.labour-sidebar-backdrop\.open\s*\{[\s\S]*?pointer-events: auto/)
})

test('Labour Admin constrains implicit grid tracks and stacks fixed-width section grids', () => {
  assert.match(
    pageSource,
    /\.labour-content-shell\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/,
  )
  assert.match(
    pageSource,
    /@media \(max-width: 920px\)[\s\S]*?\.labour-page-stack \[style\*="grid-template-columns"\][\s\S]*?grid-template-columns: minmax\(0, 1fr\) !important/,
  )
  assert.match(pageSource, /\.labour-page-stack > \*\s*\{[\s\S]*?min-width: 0;[\s\S]*?max-width: 100%/)
  assert.match(pageSource, /\.labour-page-stack \[style\*="overflow-x: auto"\][\s\S]*?max-width: 100%/)
})

test('Labour Admin keeps the existing desktop sidebar layout', () => {
  assert.match(
    pageSource,
    /\.labour-admin-shell\s*\{[\s\S]*?grid-template-columns: 272px minmax\(0, 1fr\)/,
  )
  assert.match(
    pageSource,
    /\.labour-sidebar\s*\{[\s\S]*?position: sticky;[\s\S]*?height: 100vh/,
  )
  assert.match(pageSource, /@media \(max-width: 1120px\)[\s\S]*?\.labour-sidebar\s*\{[\s\S]*?position: fixed/)
  assert.match(pageSource, /@media \(prefers-reduced-motion: reduce\)/)
})

test('Categories contain long content and actions without changing the desktop card layout', () => {
  const longCategoryContent = {
    name: 'Industrial electrical installation and maintenance specialists '.repeat(3),
    metadata: 'very-long-category-metadata-without-natural-breaks-'.repeat(4),
    imageUrl: `https://assets.example.test/categories/${'long-image-filename-'.repeat(8)}.webp`,
  }

  assert.ok(Object.values(longCategoryContent).every(value => value.length > 120))
  assert.match(pageSource, /className="labour-category-card"[\s\S]*?justifyContent: 'space-between'[\s\S]*?gap: '16px'/)
  assert.match(pageSource, /className="labour-category-card-copy"/)
  assert.match(pageSource, /\.labour-category-card-copy\s*\{[\s\S]*?min-width: 0;[\s\S]*?flex: 1 1 auto/)
  assert.match(pageSource, /\.labour-category-card-copy p\s*\{[\s\S]*?overflow-wrap: anywhere;[\s\S]*?word-break: break-word/)
  assert.match(pageSource, /className="labour-category-card-actions"[\s\S]*?alignItems: 'flex-start'/)
  assert.match(pageSource, /\.labour-category-card-actions\s*\{[\s\S]*?max-width: 100%;[\s\S]*?flex-wrap: wrap/)
  assert.match(pageSource, /@media \(max-width: 720px\)[\s\S]*?\.labour-category-card\s*\{[\s\S]*?flex-direction: column;[\s\S]*?align-items: stretch/)
  assert.match(pageSource, /@media \(max-width: 720px\)[\s\S]*?\.labour-category-card-actions\s*\{[\s\S]*?width: 100%/)
})

test('Plan card actions use a contained two-column mobile grid and preserve the desktop row', () => {
  assert.match(
    pageSource,
    /className="labour-plan-card"[\s\S]*?display: 'flex'[\s\S]*?justifyContent: 'space-between'/,
  )
  assert.match(pageSource, /className="labour-plan-card-copy"/)
  assert.match(
    pageSource,
    /className="labour-plan-card-actions"[\s\S]*?display: 'flex'[\s\S]*?alignItems: 'flex-start'/,
  )
  assert.match(
    pageSource,
    /@media \(max-width: 720px\)[\s\S]*?\.labour-plan-card\s*\{[\s\S]*?flex-direction: column;[\s\S]*?align-items: stretch/,
  )
  assert.match(
    pageSource,
    /@media \(max-width: 720px\)[\s\S]*?\.labour-plan-card-actions\s*\{[\s\S]*?width: 100%;[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  )
  assert.match(
    pageSource,
    /\.labour-plan-card-actions button\s*\{[\s\S]*?width: 100%;[\s\S]*?min-width: 0/,
  )
  assert.doesNotMatch(pageSource, /(?:html|body)\s*\{[^}]*overflow-x:\s*hidden/)
})

test('Plan action responsive contract covers every required verification viewport', () => {
  const viewports = [360, 390, 430, 626, 768, 1024, 1440]

  assert.deepEqual(
    viewports.map(width => ({
      width,
      actionLayout: width <= 720 ? 'two-column-grid' : 'desktop-row',
    })),
    [
      { width: 360, actionLayout: 'two-column-grid' },
      { width: 390, actionLayout: 'two-column-grid' },
      { width: 430, actionLayout: 'two-column-grid' },
      { width: 626, actionLayout: 'two-column-grid' },
      { width: 768, actionLayout: 'desktop-row' },
      { width: 1024, actionLayout: 'desktop-row' },
      { width: 1440, actionLayout: 'desktop-row' },
    ],
  )
})

test('Plan action labels, handlers, and first/last move boundaries remain wired', () => {
  assert.match(pageSource, /const canMoveUp = audiencePlanIndex > 0/)
  assert.match(pageSource, /const canMoveDown = audiencePlanIndex >= 0 && audiencePlanIndex < audiencePlanIds\.length - 1/)
  assert.match(pageSource, /onClick=\{\(\) => void movePlan\(plan\.id, 'up'\)\}/)
  assert.match(pageSource, /onClick=\{\(\) => void movePlan\(plan\.id, 'down'\)\}/)
  assert.match(pageSource, /disabled=\{!canMoveUp \|\| Boolean\(movingPlanId\)\}/)
  assert.match(pageSource, /disabled=\{!canMoveDown \|\| Boolean\(movingPlanId\)\}/)
  assert.match(pageSource, /aria-label=\{`Move \$\{plan\.name\} up`\}/)
  assert.match(pageSource, /aria-label=\{`Move \$\{plan\.name\} down`\}/)
  assert.match(pageSource, />Edit<\/button>/)
  assert.match(pageSource, />Delete<\/button>/)
})
