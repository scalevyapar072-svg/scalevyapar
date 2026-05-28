import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64')
}

const verifySignedRequest = (signedRequest: string, appSecret: string) => {
  const [encodedSignature, payload] = signedRequest.split('.', 2)
  if (!encodedSignature || !payload) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest()

  const receivedSignature = decodeBase64Url(encodedSignature)
  return (
    receivedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(receivedSignature, expectedSignature)
  )
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'ScaleVyapar data deletion callback is active.'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const signedRequest = params.get('signed_request') || ''
    const appSecret = (process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET || '').trim()

    if (!signedRequest) {
      return NextResponse.json({ error: 'signed_request is required.' }, { status: 400 })
    }

    if (appSecret && !verifySignedRequest(signedRequest, appSecret)) {
      return NextResponse.json({ error: 'Invalid signed request.' }, { status: 403 })
    }

    const confirmationCode = crypto.randomUUID()
    const statusUrl = `${request.nextUrl.origin}/data-deletion-status?code=${encodeURIComponent(confirmationCode)}`

    console.log('Meta data deletion callback received', {
      confirmationCode,
      signedRequestVerified: Boolean(appSecret)
    })

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    })
  } catch (error) {
    console.error('Failed to process Meta data deletion callback', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process data deletion callback.' },
      { status: 500 }
    )
  }
}
