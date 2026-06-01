import { NextRequest, NextResponse } from 'next/server'
import { getRozgarAppConfig } from '@/lib/rozgar-api-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const config = getRozgarAppConfig(request)

  return NextResponse.json({
    success: true,
    status: 'ok',
    service: 'rozgar-api',
    version: 'v1',
    backendVersion: config.backendVersion,
    appPackage: config.appPackage
  })
}
