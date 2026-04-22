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

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (user instanceof NextResponse) {
      return user
    }

    const { keyword, location, limit = 10 } = await request.json()

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
          error: 'Google extractor is not configured yet. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in your environment variables.'
        },
        { status: 500 }
      )
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 20))
    const textQuery = `${String(keyword).trim()} in ${String(location).trim()}`

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
          'places.userRatingCount'
        ].join(',')
      },
      body: JSON.stringify({
        textQuery,
        pageSize: safeLimit,
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

    const leads = ((payload.places || []) as GooglePlace[]).map((place, index) => ({
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
        limit: safeLimit
      },
      count: leads.length,
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
