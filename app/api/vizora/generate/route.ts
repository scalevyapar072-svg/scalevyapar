import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, numImages = 1 } = await req.json()

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    let output: any

    if (image) {
      // Virtual Try-On — puts exact garment from your photo onto a real model
      output = await replicate.run(
        'cuuupid/idm-vton:906425dbaca4437faces1b67bee26c032d7a3a5a87941a03c55de2fc56c6a90d',
        {
          input: {
            garm_img: image,
            human_img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=768&q=80',
            garment_des: prompt,
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: Math.floor(Math.random() * 999999),
          },
        }
      )
    } else {
      // Text only fallback
      output = await replicate.run(
        'black-forest-labs/flux-dev',
        {
          input: {
            prompt: prompt,
            negative_prompt: 'mannequin, dummy, plastic, CGI, blurry, bad quality, watermark, deformed',
            num_outputs: 1,
            aspect_ratio: '2:3',
            output_format: 'png',
            output_quality: 90,
            guidance_scale: 7.5,
            num_inference_steps: 28,
          },
        }
      )
    }

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