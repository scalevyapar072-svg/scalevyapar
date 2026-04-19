import { NextRequest, NextResponse } from 'next/server'

// Model images for try-on poses — these are hosted on reliable CDNs
const POSE_CONFIGS: Record<string, { model_image?: string; use_p2m?: boolean; prompt?: string }> = {
  'Front Standing Shoot': { use_p2m: true },
  'One-Arm-Up Glamour Pose': { use_p2m: true },
  'Neckline Extreme Close-Up': { use_p2m: true },
  'Sitting on Stool Pose': { use_p2m: true },
  'Over-the-Shoulder Left Pose': { use_p2m: true },
  'Close-Up Hand Editorial': { use_p2m: true },
  'Fabric Texture Macro Shot': { use_p2m: true },
  'Stitch Detailing Close-Up': { use_p2m: true },
}

export async function POST(req: NextRequest) {
  try {
    const { image, shootType } = await req.json()

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

    // Use product-to-model — automatically generates model wearing your exact garment
    const runRes = await fetch(`${BASE_URL}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: 'product-to-model',
        inputs: {
          product_image: image,
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