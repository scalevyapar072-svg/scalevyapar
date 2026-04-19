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

    // Step 1 — Start prediction with correct FASHN API format
    const startRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=768&q=80',
          garment_image: image,
          category: 'tops',
          mode: 'balanced',
          garment_photo_type: 'auto',
          num_samples: 1,
          cover_feet: false,
          adjust_hands: true,
          restore_background: false,
          restore_clothes: false,
          flat_lay: false,
        },
      }),
    })

    if (!startRes.ok) {
      const err = await startRes.text()
      console.error('FASHN start error:', err)
      return NextResponse.json({ error: `FASHN API error: ${err}` }, { status: 500 })
    }

    const startData = await startRes.json()
    const predictionId = startData.id

    if (!predictionId) {
      return NextResponse.json({ error: `No prediction ID: ${JSON.stringify(startData)}` }, { status: 500 })
    }

    // Step 2 — Poll for result (max 60 seconds)
    let imageUrl: string | null = null
    let attempts = 0

    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++

      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
        },
      })

      if (!statusRes.ok) continue

      const statusData = await statusRes.json()
      console.log('FASHN status:', statusData.status)

      if (statusData.status === 'completed' && statusData.output?.length > 0) {
        imageUrl = statusData.output[0]
        break
      }

      if (statusData.status === 'failed') {
        return NextResponse.json({ error: `FASHN failed: ${statusData.error || 'Unknown'}` }, { status: 500 })
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Timed out — please try again' }, { status: 500 })
    }

    return NextResponse.json({ images: [imageUrl] })

  } catch (error: any) {
    console.error('FASHN error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}