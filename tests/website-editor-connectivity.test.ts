import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const source = (relativePath: string) =>
  readFileSync(path.join(workspaceRoot, relativePath), 'utf8')

const {
  applyAuthoritativeMainWebsitePhone,
  buildTelHref,
  buildWhatsAppHref,
  formatIndianPhone,
  normalizeIndianPhoneDigits,
  resolveRozgarWhatsAppHref
} = await import(
  pathToFileURL(path.join(workspaceRoot, 'lib', 'public-contact.ts')).href
)

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

test('phone normalization produces canonical Indian wa.me and tel links', () => {
  assert.equal(normalizeIndianPhoneDigits('9660768352'), '919660768352')
  assert.equal(normalizeIndianPhoneDigits('+91 96607 68352'), '919660768352')
  assert.equal(normalizeIndianPhoneDigits('0091-9660768352'), '919660768352')
  assert.equal(normalizeIndianPhoneDigits('09660768352'), '919660768352')
  assert.equal(normalizeIndianPhoneDigits('12345'), '')
  assert.equal(buildWhatsAppHref('+91 9660768352'), 'https://wa.me/919660768352')
  assert.equal(
    buildWhatsAppHref('9660768352', 'https://wa.me/911111111111?text=Hello'),
    'https://wa.me/919660768352?text=Hello'
  )
  assert.equal(buildTelHref('9660768352'), 'tel:+919660768352')
  assert.equal(formatIndianPhone('9660768352'), '+91 9660768352')
})

test('one ScaleVyapar phone fixture controls every public phone and WhatsApp surface', () => {
  const fixture = {
    theme: { whatsappNumber: '+91 98765 43210' },
    footer: {
      contactItems: [
        { icon: 'phone', label: '+91 1111111111', href: 'tel:+911111111111' },
        { icon: 'chat', label: 'WhatsApp Us', href: 'https://wa.me/911111111111' }
      ],
      socialLinks: [
        { label: 'WhatsApp', href: 'https://wa.me/911111111111' }
      ]
    },
    home: {
      comparisonSection: { ctaButtonHref: 'https://wa.me/911111111111' },
      finalCta: { secondaryCtaHref: 'https://wa.me/911111111111?text=Home' }
    },
    pricingPage: {
      finalCta: { buttonHref: 'https://wa.me/911111111111' }
    },
    contactPage: {
      cards: {
        whatsapp: { value: '+91 1111111111', href: 'https://wa.me/911111111111' },
        phone: { value: '+91 1111111111', href: 'tel:+911111111111' }
      },
      finalCta: { buttonHref: 'https://wa.me/911111111111?text=Contact' }
    }
  }

  const normalized = applyAuthoritativeMainWebsitePhone(fixture)
  const strings = collectStrings(normalized)
  const whatsappLinks = strings.filter(value => value.startsWith('https://wa.me/'))
  const telLinks = strings.filter(value => value.startsWith('tel:'))

  assert.ok(whatsappLinks.length >= 6)
  assert.ok(whatsappLinks.every(value => value.startsWith('https://wa.me/919876543210')))
  assert.ok(telLinks.length >= 2)
  assert.ok(telLinks.every(value => value === 'tel:+919876543210'))
  assert.equal(normalized.footer.contactItems[0]?.label, '+91 9876543210')
  assert.equal(normalized.contactPage.cards.phone.value, '+91 9876543210')
  assert.equal(normalized.contactPage.cards.whatsapp.value, '+91 9876543210')
  assert.equal(strings.some(value => value.includes('1111111111')), false)
})

test('one Rozgar phone fixture controls its public WhatsApp destination', () => {
  const firstFixture = {
    contactPage: { phone: '+91 9660768352' },
    footer: { phone: '+91 9660768352' }
  }
  const changedFixture = {
    contactPage: { phone: '+91 9876543210' },
    footer: { phone: '+91 9876543210' }
  }

  assert.equal(resolveRozgarWhatsAppHref(firstFixture), 'https://wa.me/919660768352')
  assert.equal(resolveRozgarWhatsAppHref(changedFixture), 'https://wa.me/919876543210')
  assert.equal(
    resolveRozgarWhatsAppHref({ contactPage: { phone: '' }, footer: { phone: '9660768352' } }),
    'https://wa.me/919660768352'
  )
})

test('Admin website APIs and editors remain isolated by record and route ownership', () => {
  const mainEditor = source('app/admin/website/page.tsx')
  const rozgarEditor = source('app/admin/labour/website/page.tsx')
  const mainApi = source('app/api/admin/website/route.ts')
  const rozgarApi = source('app/api/admin/labour/company-website/route.ts')
  const mainStore = source('lib/main-website-content.ts')
  const rozgarStore = source('lib/labour-company-website.ts')
  const mainPublic = source('app/page.tsx')
  const rozgarPublic = source('app/labour/company/page.tsx')

  assert.ok(mainEditor.includes("fetch('/api/admin/website'"))
  assert.equal(mainEditor.includes("fetch('/api/admin/labour/company-website'"), false)
  assert.ok(rozgarEditor.includes("fetch('/api/admin/labour/company-website'"))
  assert.equal(rozgarEditor.includes("fetch('/api/admin/website'"), false)

  assert.ok(mainApi.includes('getMainWebsiteContent'))
  assert.ok(mainApi.includes('updateMainWebsiteContent'))
  assert.equal(mainApi.includes('getLabourCompanyWebsiteContent'), false)
  assert.ok(rozgarApi.includes('getLabourCompanyWebsiteContent'))
  assert.ok(rozgarApi.includes('updateLabourCompanyWebsiteContent'))
  assert.equal(rozgarApi.includes('getMainWebsiteContent'), false)

  assert.ok(mainStore.includes("const RECORD_ID = 'main-website'"))
  assert.ok(rozgarStore.includes("const RECORD_ID = 'company-website'"))
  assert.ok(mainPublic.includes('getMainWebsiteContent'))
  assert.equal(mainPublic.includes('getLabourCompanyWebsiteContent'), false)
  assert.ok(rozgarPublic.includes('getLabourCompanyWebsiteContent'))
  assert.equal(rozgarPublic.includes('getMainWebsiteContent'), false)

  assert.equal(mainApi.includes("'/labour/company'"), false)
  assert.equal(rozgarApi.includes("  '/',"), false)
})

test('public website components contain no legacy 9314023719 fallback', () => {
  const publicSources = [
    'app/layout.tsx',
    'app/pricing/PricingCalculatorClient.tsx',
    'app/labour/company/labour-company-home-client.tsx',
    'components/FloatingWhatsApp.tsx',
    'components/MobileBottomBar.tsx',
    'data/main-website-content.ts'
  ].map(source).join('\n')

  assert.equal(publicSources.includes('9314023719'), false)
  assert.equal(publicSources.includes('919314023719'), false)
  assert.ok(source('app/layout.tsx').includes('buildWhatsAppHref(content.theme.whatsappNumber)'))
  assert.ok(source('app/layout.tsx').includes('resolveRozgarWhatsAppHref(content)'))
  assert.ok(source('app/labour/company/labour-company-home-client.tsx').includes('resolveRozgarWhatsAppHref(content)'))
})
