import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!process.env.FASHN_API_KEY) {
      return NextResponse.json({ error: 'FASHN_API_KEY not set' }, { status: 500 })
    }

    if (!image) {
      return NextResponse.json({ error: 'Please upload a product photo first' }, { status: 400 })
    }

    const API_KEY = process.env.FASHN_API_KEY
    const BASE_URL = 'https://api.fashn.ai/v1'
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    }

    // Only model_image and garment_image are required
    const runRes = await fetch(`${BASE_URL}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=768&q=80',
          garment_image: image,
        },
      }),
    })

    const runData = await runRes.json()

    if (!runRes.ok) {
      return NextResponse.json({ error: `FASHN error: ${JSON.stringify(runData)}` }, { status: 500 })
    }

    const predictionId = runData.id
    if (!predictionId) {
      return NextResponse.json({ error: `No ID returned: ${JSON.stringify(runData)}` }, { status: 500 })
    }

    // Poll for result
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(`${BASE_URL}/status/${predictionId}`, { headers })
      const statusData = await statusRes.json()

      if (statusData.status === 'completed' && statusData.output?.length > 0) {
        return NextResponse.json({ images: [statusData.output[0]] })
      }

      if (statusData.status === 'failed') {
        return NextResponse.json({ error: `Failed: ${JSON.stringify(statusData)}` }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Timed out — try again' }, { status: 500 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}