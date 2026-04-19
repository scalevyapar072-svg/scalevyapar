import { NextRequest, NextResponse } from 'next/server'

// These are reliable full-body model images that FASHN can detect pose from
const MODEL_IMAGES = [
  'https://images.fashn.ai/examples/model1.jpg',
  'https://v3.fal.media/files/panda/jRavCEb1D4OpZBjZKxaH7_image_2024-12-08_18-37-27 Large.jpeg',
  'https://storage.googleapis.com/falserverless/example_inputs/model.png',
]

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

    // Try each model image until one works
    for (const modelImage of MODEL_IMAGES) {
      const runRes = await fetch(`${BASE_URL}/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model_name: 'tryon-v1.6',
          inputs: {
            model_image: modelImage,
            garment_image: image,
          },
        }),
      })

      const runData = await runRes.json()

      if (!runRes.ok) {
        console.error('FASHN run error:', runData)
        continue
      }

      const predictionId = runData.id
      if (!predictionId) continue

      // Poll for result
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000))

        const statusRes = await fetch(`${BASE_URL}/status/${predictionId}`, { headers })
        const statusData = await statusRes.json()

        if (statusData.status === 'completed' && statusData.output?.length > 0) {
          return NextResponse.json({ images: [statusData.output[0]] })
        }

        if (statusData.status === 'failed') {
          const errName = statusData.error?.name || ''
          // If pose error — try next model image
          if (errName === 'PoseError') break
          return NextResponse.json({ 
            error: `Generation failed: ${statusData.error?.message || JSON.stringify(statusData.error)}` 
          }, { status: 500 })
        }
      }
    }

    // All model images failed — use garment-only mode
    // Try product-to-model endpoint instead
    const p2mRes = await fetch(`${BASE_URL}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: 'product-to-model',
        inputs: {
          garment_image: image,
          garment_type: 'tops',
        },
      }),
    })

    const p2mData = await p2mRes.json()

    if (!p2mRes.ok) {
      return NextResponse.json({ error: `FASHN error: ${JSON.stringify(p2mData)}` }, { status: 500 })
    }

    const p2mId = p2mData.id
    if (!p2mId) {
      return NextResponse.json({ error: 'No prediction ID returned' }, { status: 500 })
    }

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(`${BASE_URL}/status/${p2mId}`, { headers })
      const statusData = await statusRes.json()

      if (statusData.status === 'completed' && statusData.output?.length > 0) {
        return NextResponse.json({ images: [statusData.output[0]] })
      }

      if (statusData.status === 'failed') {
        return NextResponse.json({ 
          error: `Failed: ${statusData.error?.message || JSON.stringify(statusData.error)}` 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Timed out — please try again' }, { status: 500 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}