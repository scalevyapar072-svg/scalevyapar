import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, scale = 4 } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    })

    const output = await replicate.run(
      'nightmareai/real-esrgan:42fed1c4dbd5d5bb16ca23400603867aeafdd555bc8aada79fd56b218b6f5bff',
      {
        input: {
          image: imageUrl,
          scale,
          face_enhance: true,
        },
      }
    )

    return NextResponse.json({ upscaledUrl: output })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}