import { NextRequest, NextResponse } from 'next/server'
import { getRozgarAppConfig } from '@/lib/rozgar-api-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json(getRozgarAppConfig(request))
}
