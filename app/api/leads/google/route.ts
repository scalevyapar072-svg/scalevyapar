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

const GOOGLE_PAGE_SIZE = 20
const GOOGLE_BATCH_LIMIT = 200

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (user instanceof NextResponse) {
      return user
    }

    const { keyword, location, limit = 'all' } = await request.json()

    if (!keyword || !location) {
      return NextResponse.json(
        { error: 'Keyword and location are required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Google extractor is not configured yet. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in your environment variables.'
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

    while (collected.length < requestedLimit) {
      const pageSize = Math.min(GOOGLE_PAGE_SIZE, requestedLimit - collected.length)

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
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
          { error: payload?.error?.message || 'Failed to fetch Google leads.' },
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

    const leads = collected.map((place, index) => ({
      id: place.id || `google-${index + 1}`,
      source: 'Google',
      businessName: place.displayName?.text || 'Unknown business',
      contactName: '',
      mobile: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
      email: '',
      address: place.formattedAddress || '',
      city: String(location).trim(),
      website: place.websiteUri || '',
      googleMapsUrl: place.googleMapsUri || '',
      category: place.primaryTypeDisplayName?.text || String(keyword).trim(),
      rating: place.rating || null,
      reviews: place.userRatingCount || null,
      status: place.businessStatus || ''
    }))

    return NextResponse.json({
      success: true,
      query: {
        keyword: String(keyword).trim(),
        location: String(location).trim(),
        requestedLimit: limit,
        appliedLimit: requestedLimit,
        mode: typeof limit === 'string' && limit.toLowerCase() === 'all' ? 'batch-all' : 'batch-fixed'
      },
      count: leads.length,
      pagesFetched,
      hasMore: Boolean(nextPageToken),
      searchUri,
      leads
    })
  } catch (error) {
    console.error('Google leads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google leads.' },
      { status: 500 }
    )
  }
}
