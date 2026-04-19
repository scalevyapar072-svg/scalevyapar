import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(req: NextRequest) {
  try {
    const { prompt, numImages = 1 } = await req.json()

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const input: any = {
      prompt: prompt,
      negative_prompt: 'mannequin, dummy, plastic, CGI, cartoon, anime, blurry, bad quality, watermark, deformed, low resolution, ugly, extra limbs, missing limbs, bad hands, bad face, doll, robot, headless',
      num_outputs: 1,
      aspect_ratio: '2:3',
      output_format: 'png',
      output_quality: 90,
      guidance_scale: 7.5,
      num_inference_steps: 28,
    }

    const output = await replicate.run('black-forest-labs/flux-dev', { input })

    const images = Array.isArray(output)
      ? output.map((item: any) => {
          if (typeof item === 'string') return item
          if (item && typeof item.url === 'function') return item.url().toString()
          if (item && item.href) return item.href
          return String(item)
        })
      : [String(output)]

    return NextResponse.json({ images })

  } catch (error: any) {
    console.error('Vizora error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}