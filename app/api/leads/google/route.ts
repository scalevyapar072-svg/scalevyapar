import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

interface GooglePlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  primaryTypeDisplayName?: { text?: string }
  businessStatus?: string
  rating?: number
  userRatingCount?: number
}

interface TavilyWebResult {
  title?: string
  url?: string
  content?: string
}

type SourceId = 'googleMaps' | 'websites' | 'social' | 'directories' | 'otherSources'

type LeadRow = {
  id: string
  source: string
  businessName: string
  productName: string
  contactName: string
  mobile: string
  email: string
  address: string
  city: string
  website: string
  googleMapsUrl: string
  category: string
  price: string
  memberYears: string
  gstVisible: boolean
  emailVisible: boolean
  mobileVisible: boolean
  rating: number | null
  reviews: number | null
  status: string
  notes: string
}

type WebsiteSnapshot = {
  phones: string[]
  emails: string[]
  socialLinks: string[]
  directoryLinks: string[]
  otherLinks: string[]
  pagesScanned: string[]
  contactPages: string[]
}

const GOOGLE_PAGE_SIZE = 20
const GOOGLE_BATCH_LIMIT = 60
const WEBSITE_ENRICHMENT_LIMIT = 12
const SOCIAL_HOSTS = ['facebook.com', 'instagram.com']
const DIRECTORY_HOSTS = ['justdial.com', 'sulekha.com', 'tradeindia.com', 'yellowpages.com', 'exportersindia.com']
const OTHER_HOSTS = ['linkedin.com', 'wa.me', 'whatsapp.com']
const CONTACT_PATH_HINTS = [
  '/contact',
  '/contact-us',
  '/contactus',
  '/about',
  '/about-us',
  '/aboutus',
  '/reach-us',
  '/get-in-touch',
  '/support'
]

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const maskKey = (value: string) => {
  if (!value) return 'missing'
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const getApiKey = () => {
  if (process.env.GOOGLE_PLACES_API_KEY) {
    return {
      value: process.env.GOOGLE_PLACES_API_KEY,
      source: 'GOOGLE_PLACES_API_KEY',
      masked: maskKey(process.env.GOOGLE_PLACES_API_KEY)
    }
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    return {
      value: process.env.GOOGLE_MAPS_API_KEY,
      source: 'GOOGLE_MAPS_API_KEY',
      masked: maskKey(process.env.GOOGLE_MAPS_API_KEY)
    }
  }

  return {
    value: '',
    source: 'missing',
    masked: 'missing'
  }
}

const normalizeSources = (value: unknown): SourceId[] => {
  const defaults: SourceId[] = ['googleMaps']
  if (!Array.isArray(value)) return defaults

  const known = new Set<SourceId>(['googleMaps', 'websites', 'social', 'directories', 'otherSources'])
  const normalized = value
    .map(item => String(item))
    .filter((item): item is SourceId => known.has(item as SourceId))

  return normalized.length > 0 ? normalized : defaults
}

const cleanPhone = (value: string) => {
  const trimmed = value.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ''
  return `${plus}${digits}`
}

const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)))

const extractMatches = (value: string, pattern: RegExp, cleaner?: (input: string) => string) => {
  const matches = Array.from(value.matchAll(pattern)).map(match => (match[1] || match[0] || '').trim())
  return uniq(cleaner ? matches.map(cleaner).filter(Boolean) : matches)
}

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const buildPageCandidates = (website: string) => {
  try {
    const base = new URL(website)
    const candidates = [
      website,
      ...CONTACT_PATH_HINTS.map(pathname => new URL(pathname, base).toString())
    ]
    return uniq(candidates)
  } catch {
    return uniq([website])
  }
}

const getTavilyKey = () => {
  const value = process.env.TAVILY_API_KEY || ''
  return {
    value,
    source: value ? 'TAVILY_API_KEY' : 'missing',
    masked: maskKey(value)
  }
}

const classifyLinks = (links: string[]) => {
  const socialLinks = links.filter(link => SOCIAL_HOSTS.some(host => link.includes(host)))
  const directoryLinks = links.filter(link => DIRECTORY_HOSTS.some(host => link.includes(host)))
  const otherLinks = links.filter(link => OTHER_HOSTS.some(host => link.includes(host)))

  return {
    socialLinks: uniq(socialLinks),
    directoryLinks: uniq(directoryLinks),
    otherLinks: uniq(otherLinks)
  }
}

const contactHrefToPhone = (value: string) => {
  const normalized = value
    .replace(/^tel:/i, '')
    .replace(/^https?:\/\/wa\.me\//i, '')
    .replace(/^https?:\/\/api\.whatsapp\.com\/send\?phone=/i, '')
  return cleanPhone(normalized)
}

const isContactPage = (page: string) => {
  try {
    const pathname = new URL(page).pathname.toLowerCase()
    return CONTACT_PATH_HINTS.some(hint => pathname === hint || pathname.startsWith(`${hint}/`))
  } catch {
    return false
  }
}

const fetchWebsiteSnapshot = async (website: string): Promise<WebsiteSnapshot> => {
  const pages = buildPageCandidates(website)
  const phones: string[] = []
  const emails: string[] = []
  const links: string[] = []
  const pagesScanned: string[] = []
  const contactPages: string[] = []

  for (const page of pages) {
    try {
      const response = await fetch(page, {
        headers: {
          'User-Agent': 'ScaleVyaparLeadBot/1.0 (+public visible data extraction)'
        },
        redirect: 'follow'
      })

      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) continue

      const html = await response.text()
      const text = stripHtml(html)
      pagesScanned.push(page)
      if (isContactPage(page)) {
        contactPages.push(page)
      }

      phones.push(
        ...extractMatches(text, /(\+?\d[\d\s().-]{8,}\d)/g, cleanPhone),
        ...extractMatches(html, /tel:([^'"\s<>]+)/gi, cleanPhone),
        ...extractMatches(html, /(https?:\/\/wa\.me\/\d+)/gi, contactHrefToPhone),
        ...extractMatches(html, /(https?:\/\/api\.whatsapp\.com\/send\?phone=\d+)/gi, contactHrefToPhone),
        ...extractMatches(html, /"telephone"\s*:\s*"([^"]+)"/gi, cleanPhone)
      )

      emails.push(
        ...extractMatches(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi),
        ...extractMatches(html, /mailto:([^'"\s<>]+)/gi),
        ...extractMatches(html, /"email"\s*:\s*"([^"]+)"/gi)
      )

      links.push(...extractMatches(html, /href=["']([^"']+)["']/gi))
    } catch {
      continue
    }
  }

  const normalizedLinks = uniq(
    links
      .map(link => {
        if (link.startsWith('//')) return `https:${link}`
        return link
      })
      .filter(link => /^https?:\/\//i.test(link))
  )

  const classified = classifyLinks(normalizedLinks)

  return {
    phones: uniq(phones),
    emails: uniq(emails),
    socialLinks: classified.socialLinks,
    directoryLinks: classified.directoryLinks,
    otherLinks: classified.otherLinks,
    pagesScanned,
    contactPages: uniq(contactPages)
  }
}

const toBaseLead = (place: GooglePlace, location: string, keyword: string, index: number): LeadRow => ({
  id: place.id || `google-${index + 1}`,
  source: 'Google Maps',
  businessName: place.displayName?.text || 'Unknown business',
  productName: '',
  contactName: '',
  mobile: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
  email: '',
  address: place.formattedAddress || '',
  city: String(location).trim(),
  website: place.websiteUri || '',
  googleMapsUrl: place.googleMapsUri || '',
  category: place.primaryTypeDisplayName?.text || String(keyword).trim(),
  price: '',
  memberYears: '',
  gstVisible: false,
  emailVisible: false,
  mobileVisible: Boolean(place.nationalPhoneNumber || place.internationalPhoneNumber),
  rating: place.rating || null,
  reviews: place.userRatingCount || null,
  status: place.businessStatus || 'VISIBLE_PUBLIC_DATA',
  notes: place.websiteUri ? 'Google Maps listing includes a public website for enrichment.' : 'Visible Google Maps business listing.'
})

const summarizeLinks = (label: string, links: string[]) =>
  links.length > 0 ? `${label}: ${links.slice(0, 3).join(', ')}` : ''

const normalizeWebsiteUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const inferBusinessNameFromTitle = (title: string, keyword: string) => {
  const trimmed = title.trim()
  if (!trimmed) return String(keyword).trim() || 'Discovered business'
  return trimmed
    .split(/[\-|–|•]/)
    .map(part => part.trim())
    .find(Boolean) || trimmed
}

const inferSourceLabel = (url: string, selectedSource: SourceId): LeadRow['source'] => {
  if (selectedSource === 'websites') return 'Business Website'
  if (selectedSource === 'directories') return 'Directory'
  if (selectedSource === 'otherSources') return 'Other Public Source'
  if (selectedSource === 'social') {
    if (url.includes('instagram.com')) return 'Instagram'
    if (url.includes('facebook.com')) return 'Facebook'
    return 'Social Profile'
  }
  return 'Website'
}

const buildTavilyQuery = (selectedSource: SourceId, keyword: string, location: string) => {
  const base = `${String(keyword).trim()} ${String(location).trim()}`.trim()

  switch (selectedSource) {
    case 'social':
      return `${base} (site:facebook.com OR site:instagram.com)`
    case 'directories':
      return `${base} (site:justdial.com OR site:sulekha.com OR site:tradeindia.com OR site:yellowpages.com OR site:exportersindia.com)`
    case 'otherSources':
      return `${base} (site:linkedin.com OR site:wa.me OR site:whatsapp.com)`
    case 'websites':
    default:
      return `${base} business website`
  }
}

const matchesSelectedSource = (url: string, selectedSource: SourceId) => {
  const lower = url.toLowerCase()

  if (selectedSource === 'social') {
    return SOCIAL_HOSTS.some(host => lower.includes(host))
  }

  if (selectedSource === 'directories') {
    return DIRECTORY_HOSTS.some(host => lower.includes(host))
  }

  if (selectedSource === 'otherSources') {
    return OTHER_HOSTS.some(host => lower.includes(host))
  }

  if (selectedSource === 'websites') {
    const blockedHosts = [...SOCIAL_HOSTS, ...DIRECTORY_HOSTS, ...OTHER_HOSTS]
    return !blockedHosts.some(host => lower.includes(host))
  }

  return true
}

const toTavilyLead = (
  result: TavilyWebResult,
  selectedSource: SourceId,
  location: string,
  keyword: string,
  index: number
): LeadRow => {
  const url = normalizeWebsiteUrl(result.url || '')
  const description = (result.content || '').replace(/<[^>]+>/g, '').trim()

  return {
    id: `tavily-${selectedSource}-${index + 1}`,
    source: inferSourceLabel(url, selectedSource),
    businessName: inferBusinessNameFromTitle(result.title || '', keyword),
    productName: '',
    contactName: '',
    mobile: '',
    email: '',
    address: '',
    city: String(location).trim(),
    website: url,
    googleMapsUrl: '',
    category: String(keyword).trim(),
    price: '',
    memberYears: '',
    gstVisible: false,
    emailVisible: false,
    mobileVisible: false,
    rating: null,
    reviews: null,
    status: 'VISIBLE_PUBLIC_RESULT',
    notes: description || 'Visible public result discovered from Tavily Search.'
  }
}

export async function GET() {
  const key = getApiKey()
  const tavilyKey = getTavilyKey()

  return NextResponse.json({
    configured: Boolean(key.value),
    keySource: key.source,
    maskedKey: key.masked,
    hasPlacesKey: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    hasMapsKey: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    hasEmbedKey: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY),
    hasTavilyKey: Boolean(tavilyKey.value),
    tavilyKeySource: tavilyKey.source,
    maskedTavilyKey: tavilyKey.masked
  })
}

export async function POST(request: NextRequest) {
  try {
    const isLocalDev =
      process.env.NODE_ENV !== 'production' &&
      (request.nextUrl.hostname === '127.0.0.1' || request.nextUrl.hostname === 'localhost')

    if (!isLocalDev) {
      const user = await requireUser(request)
      if (user instanceof NextResponse) {
        return user
      }
    }

    const { keyword, location, limit = 'all', sources = ['googleMaps'] } = await request.json()

    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword and location are required.' }, { status: 400 })
    }

    const selectedSources = normalizeSources(sources)
    const primarySource = selectedSources[0]
    const key = getApiKey()
    const tavilyKey = getTavilyKey()

    if (primarySource === 'googleMaps' && !key.value) {
      return NextResponse.json(
        {
          error: 'Google extractor is not configured yet. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in your environment variables.',
          diagnostics: {
            keySource: key.source,
            maskedKey: key.masked,
            hasPlacesKey: Boolean(process.env.GOOGLE_PLACES_API_KEY),
            hasMapsKey: Boolean(process.env.GOOGLE_MAPS_API_KEY),
            hasEmbedKey: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY)
          }
        },
        { status: 500 }
      )
    }

    const requestedLimit =
      typeof limit === 'string' && limit.toLowerCase() === 'all'
        ? GOOGLE_BATCH_LIMIT
        : Math.max(1, Math.min(Number(limit) || GOOGLE_PAGE_SIZE, GOOGLE_BATCH_LIMIT))

    const textQuery = `${String(keyword).trim()} in ${String(location).trim()}`
    const collected: GooglePlace[] = []
    const seenIds = new Set<string>()
    let nextPageToken: string | undefined
    let searchUri = ''
    let pagesFetched = 0

    const fetchMapsSeed = async () => {
      while (collected.length < requestedLimit) {
        const pageSize = Math.min(GOOGLE_PAGE_SIZE, requestedLimit - collected.length)

        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key.value,
            'X-Goog-FieldMask': [
              'places.id',
              'places.displayName',
              'places.formattedAddress',
              'places.internationalPhoneNumber',
              'places.nationalPhoneNumber',
              'places.websiteUri',
              'places.googleMapsUri',
              'places.primaryTypeDisplayName',
              'places.businessStatus',
              'places.rating',
              'places.userRatingCount',
              'nextPageToken',
              'searchUri'
            ].join(',')
          },
          body: JSON.stringify({
            textQuery,
            pageSize,
            pageToken: nextPageToken,
            languageCode: 'en'
          })
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          return NextResponse.json(
            {
              error: payload?.error?.message || 'Failed to fetch Google leads.',
              diagnostics: {
                keySource: key.source,
                maskedKey: key.masked,
                status: response.status,
                googleStatus: payload?.error?.status || null,
                googleCode: payload?.error?.code || null,
                projectHint: payload?.error?.details?.[0]?.metadata?.consumer || null,
                textQuery,
                pageSize,
                nextPageTokenPresent: Boolean(nextPageToken)
              }
            },
            { status: response.status || 500 }
          )
        }

        const places = (payload.places || []) as GooglePlace[]
        searchUri = payload.searchUri || searchUri
        pagesFetched += 1

        for (const place of places) {
          const placeId = place.id || `${place.displayName?.text || 'place'}-${collected.length + 1}`
          if (seenIds.has(placeId)) continue
          seenIds.add(placeId)
          collected.push(place)
          if (collected.length >= requestedLimit) break
        }

        nextPageToken = payload.nextPageToken || undefined
        if (!nextPageToken || places.length === 0 || collected.length >= requestedLimit) {
          break
        }

        await wait(1200)
      }

      return null
    }

    const fetchTavilySeed = async () => {
      if (!tavilyKey.value) {
        return NextResponse.json(
          {
            error: 'Business Website extractor is not configured yet. Add TAVILY_API_KEY in your environment variables.',
            diagnostics: {
              keySource: tavilyKey.source,
              maskedKey: tavilyKey.masked,
              selectedSource: primarySource
            }
          },
          { status: 500 }
        )
      }

      const tavilyQuery = buildTavilyQuery(primarySource, keyword, location)
      const count = Math.min(requestedLimit, 20)
      const requestBody = {
        api_key: tavilyKey.value,
        query: tavilyQuery,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        max_results: count
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        return NextResponse.json(
          {
            error: payload?.detail || payload?.error || payload?.message || 'Failed to fetch website leads from Tavily Search.',
            diagnostics: {
              keySource: tavilyKey.source,
              maskedKey: tavilyKey.masked,
              status: response.status,
              selectedSource: primarySource,
              requestUrl: 'https://api.tavily.com/search'
            }
          },
          { status: response.status || 500 }
        )
      }

      const results = ((payload.results || []) as TavilyWebResult[])
        .filter(result => result.url && matchesSelectedSource(result.url, primarySource))
        .slice(0, requestedLimit)

      const baseLeads = results.map((result, index) => toTavilyLead(result, primarySource, location, keyword, index))

      return {
        baseLeads,
        searchUri: `https://app.tavily.com/search?q=${encodeURIComponent(tavilyQuery)}`,
        pagesFetched: 1,
        hasMore: false
      }
    }

    let baseLeads: LeadRow[] = []

    if (primarySource === 'googleMaps') {
      const mapsError = await fetchMapsSeed()
      if (mapsError) {
        return mapsError
      }

      baseLeads = collected.map((place, index) => toBaseLead(place, location, keyword, index))
    } else {
      const tavilyResult = await fetchTavilySeed()
      if (tavilyResult instanceof NextResponse) {
        return tavilyResult
      }

      baseLeads = tavilyResult.baseLeads
      searchUri = tavilyResult.searchUri
      pagesFetched = tavilyResult.pagesFetched
      nextPageToken = undefined
    }

    const combined: LeadRow[] = [...baseLeads]

    const enrichmentTargets = baseLeads
      .filter(item => item.website)
      .slice(0, WEBSITE_ENRICHMENT_LIMIT)

    for (const lead of enrichmentTargets) {
      const snapshot = await fetchWebsiteSnapshot(lead.website)
      const sharedNotes = [
        snapshot.pagesScanned.length > 0 ? `Pages scanned: ${snapshot.pagesScanned.length}` : '',
        snapshot.contactPages.length > 0 ? `Contact pages: ${snapshot.contactPages.slice(0, 2).join(', ')}` : '',
        summarizeLinks('Social', snapshot.socialLinks),
        summarizeLinks('Directories', snapshot.directoryLinks),
        summarizeLinks('Other public channels', snapshot.otherLinks)
      ]
        .filter(Boolean)
        .join(' | ')

      if (selectedSources.includes('websites')) {
        const visibleContactSummary = [
          snapshot.phones.length > 0 ? `Visible phones: ${snapshot.phones.slice(0, 2).join(', ')}` : '',
          snapshot.emails.length > 0 ? `Visible emails: ${snapshot.emails.slice(0, 2).join(', ')}` : '',
          snapshot.contactPages.length > 0 ? `Contact pages found: ${snapshot.contactPages.length}` : ''
        ]
          .filter(Boolean)
          .join(' | ')

        combined.push({
          ...lead,
          id: `${lead.id}-website`,
          source: lead.source === 'Business Website' ? 'Business Website' : 'Business Website',
          mobile: snapshot.phones[0] || lead.mobile,
          email: snapshot.emails[0] || lead.email,
          emailVisible: snapshot.emails.length > 0,
          mobileVisible: snapshot.phones.length > 0 || lead.mobileVisible,
          status:
            snapshot.contactPages.length > 0
              ? 'VISIBLE_CONTACT_PAGE_FOUND'
              : snapshot.phones.length > 0
                ? 'VISIBLE_PHONE_FOUND'
                : 'VISIBLE_PUBLIC_DATA',
          notes: ['Visible business website enrichment complete.', visibleContactSummary, sharedNotes]
            .filter(Boolean)
            .join(' ')
        })
      }

      if (selectedSources.includes('social')) {
        const socialTargets =
          lead.source === 'Facebook' || lead.source === 'Instagram' || lead.source === 'Social Profile'
            ? uniq([lead.website, ...snapshot.socialLinks])
            : snapshot.socialLinks

        socialTargets.forEach((link, socialIndex) => {
          const platform = link.includes('instagram.com') ? 'Instagram' : 'Facebook'
          combined.push({
            ...lead,
            id: `${lead.id}-social-${socialIndex + 1}`,
            source: platform,
            website: link,
            mobile: snapshot.phones[0] || lead.mobile,
            email: snapshot.emails[0] || lead.email,
            emailVisible: snapshot.emails.length > 0,
            mobileVisible: snapshot.phones.length > 0 || lead.mobileVisible,
            status: 'PUBLIC_PROFILE_DISCOVERED',
            notes: `Public ${platform} profile discovered from the business website with visible enrichment: ${sharedNotes}`
          })
        })
      }

      if (selectedSources.includes('directories')) {
        const directoryTargets =
          lead.source === 'Directory' ? uniq([lead.website, ...snapshot.directoryLinks]) : snapshot.directoryLinks

        directoryTargets.forEach((link, directoryIndex) => {
          combined.push({
            ...lead,
            id: `${lead.id}-directory-${directoryIndex + 1}`,
            source: 'Directory',
            website: link,
            mobile: snapshot.phones[0] || lead.mobile,
            email: snapshot.emails[0] || lead.email,
            emailVisible: snapshot.emails.length > 0,
            mobileVisible: snapshot.phones.length > 0 || lead.mobileVisible,
            status: 'DIRECTORY_LINK_DISCOVERED',
            notes: ['Public directory reference discovered from the business website.', sharedNotes]
              .filter(Boolean)
              .join(' ')
          })
        })
      }

      if (selectedSources.includes('otherSources')) {
        const otherTargets =
          lead.source === 'Other Public Source' ? uniq([lead.website, ...snapshot.otherLinks]) : snapshot.otherLinks

        otherTargets.forEach((link, otherIndex) => {
          combined.push({
            ...lead,
            id: `${lead.id}-other-${otherIndex + 1}`,
            source: 'Other Public Source',
            website: link,
            mobile: snapshot.phones[0] || lead.mobile,
            email: snapshot.emails[0] || lead.email,
            emailVisible: snapshot.emails.length > 0,
            mobileVisible: snapshot.phones.length > 0 || lead.mobileVisible,
            status: 'PUBLIC_LINK_DISCOVERED',
            notes: ['Public business channel discovered from the website.', sharedNotes]
              .filter(Boolean)
              .join(' ')
          })
        })
      }
    }

    const deduped = Array.from(
      new Map(combined.map(item => [`${item.source}-${item.businessName}-${item.website}-${item.mobile}`, item])).values()
    )

    return NextResponse.json({
      success: true,
      query: {
        keyword: String(keyword).trim(),
        location: String(location).trim(),
        requestedLimit: limit,
        appliedLimit: requestedLimit,
        mode: typeof limit === 'string' && limit.toLowerCase() === 'all' ? 'batch-all' : 'batch-fixed',
        selectedSources
      },
      count: deduped.length,
      pagesFetched,
      hasMore: Boolean(nextPageToken),
      searchUri,
      leads: deduped,
      diagnostics: {
        keySource: primarySource === 'googleMaps' ? key.source : tavilyKey.source,
        maskedKey: primarySource === 'googleMaps' ? key.masked : tavilyKey.masked,
        websiteEnrichmentCap: WEBSITE_ENRICHMENT_LIMIT
      }
    })
  } catch (error) {
    console.error('Google leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch Google leads.' }, { status: 500 })
  }
}
