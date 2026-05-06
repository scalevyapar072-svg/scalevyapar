import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { syncLabourJsonToSupabase } from '@/lib/labour-marketplace'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const snapshot = await syncLabourJsonToSupabase()
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour marketplace sync failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync labour data to Supabase' },
      { status: 500 }
    )
  }
}
