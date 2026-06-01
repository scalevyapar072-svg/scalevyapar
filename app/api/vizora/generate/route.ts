import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { image, shootType = 'front', extra = '', backgroundImage = '' } = await req.json()

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

    // Build prompt from pose + extra details
    const POSE_PROMPTS: Record<string, string> = {
      front: 'front standing pose, full body, studio lighting',
      onearm: 'one arm raised up pose, dynamic stance, studio lighting',
      neckline: 'close up portrait showing neckline and upper body detail',
      'sitting-stool': 'sitting on stool pose, elegant posture, studio setting',
      'sitting-portrait': 'sitting portrait pose, relaxed, natural expression',
      reclining: 'reclining on sofa pose, lifestyle setting, comfortable',
      shoulder: 'over the shoulder pose, looking back, elegant',
      hand: 'hand and sleeve detail editorial close up',
      fabric: 'fabric texture close up detail, macro photography',
      stitch: 'stitching and embroidery detail close up',
      walking: 'walking naturally, candid movement, lifestyle',
      back: 'back pose, showing rear of garment, full body',
    }

    const posePrompt = POSE_PROMPTS[shootType] || POSE_PROMPTS.front
    const promptParts = [posePrompt]
    if (extra && extra.trim()) {
      promptParts.push(extra.trim())
    }
    const prompt = promptParts.join(', ')

    const inputs: Record<string, unknown> = {
      product_image: image,
      prompt,
    }

    // Add background reference image if provided
    if (backgroundImage && backgroundImage.trim()) {
      inputs.background_reference = backgroundImage
    }

    const requestBody = {
      model_name: 'product-to-model',
      inputs,
    }

    const runRes = await fetch(`${BASE_URL}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    const runData = await runRes.json()

    if (!runRes.ok) {
      return NextResponse.json({ error: `FASHN error: ${JSON.stringify(runData)}` }, { status: 500 })
    }

    const predictionId = runData.id
    if (!predictionId) {
      return NextResponse.json({ error: `No ID: ${JSON.stringify(runData)}` }, { status: 500 })
    }

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

    return NextResponse.json({ error: 'Timed out — try again' }, { status: 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}