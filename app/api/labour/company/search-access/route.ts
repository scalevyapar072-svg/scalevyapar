import { NextRequest, NextResponse } from 'next/server'
import { getCompanyWorkerSearchAccess, requireCompanyApp } from '@/lib/labour-company-app'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyApp(request)
    const result = await getCompanyWorkerSearchAccess(auth.companyId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load worker contact access.'
      },
      { status: 401 }
    )
  }
}
