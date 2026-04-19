import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

// Model images of real human models for try-on
const MODEL_IMAGES = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=768&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=768&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=768&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=768&q=80',
]

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, numImages = 1 } = await req.json()

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    let output: any

    if (image) {
      // Pick random model image
      const humanImg = MODEL_IMAGES[Math.floor(Math.random() * MODEL_IMAGES.length)]

      // Use IDM-VTON for exact garment transfer
      output = await replicate.run(
        'cuuupid/idm-vton',
        {
          input: {
            garm_img: image,
            human_img: humanImg,
            garment_des: prompt || 'Indian kurta set',
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