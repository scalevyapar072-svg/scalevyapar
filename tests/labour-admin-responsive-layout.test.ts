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
