import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, shootType } = await req.json()

    if (!process.env.FASHN_API_KEY) {
      return NextResponse.json({ error: 'FASHN_API_KEY not set in Vercel environment variables' }, { status: 500 })
    }

    if (!image) {
      return NextResponse.json({ error: 'Please upload a product photo first' }, { status: 400 })
    }

    // Step 1 — Start the prediction
    const startRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
      },
      body: JSON.stringify({
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
      return NextResponse.json({ error: 'No prediction ID returned from FASHN' }, { status: 500 })
    }

    // Step 2 — Poll for result (max 60 seconds)
    let imageUrl: string | null = null
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++

      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
        },
      })

      if (!statusRes.ok) continue

      const statusData = await statusRes.json()

      if (statusData.status === 'completed' && statusData.output && statusData.output.length > 0) {
        imageUrl = statusData.output[0]
        break
      }

      if (statusData.status === 'failed') {
        return NextResponse.json({ error: `FASHN generation failed: ${statusData.error || 'Unknown error'}` }, { status: 500 })
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Generation timed out — please try again' }, { status: 500 })
    }

    return NextResponse.json({ images: [imageUrl] })

  } catch (error: any) {
    console.error('Vizora FASHN error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}