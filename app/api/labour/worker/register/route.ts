import { NextRequest, NextResponse } from 'next/server'
import { completeWorkerAppRegistration, requireWorkerApp } from '@/lib/labour-worker-app'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkerApp(request)
    const payload = await request.json()
    const dashboard = await completeWorkerAppRegistration(auth.workerId, {
      fullName: String(payload.fullName || ''),
      city: String(payload.city || ''),
      categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds.map((item: unknown) => String(item)) : [],
      skills: Array.isArray(payload.skills) ? payload.skills.map((item: unknown) => String(item)) : [],
      experienceYears: Number(payload.experienceYears || 0),
      expectedDailyWage: Number(payload.expectedDailyWage || 0),
      availability: String(payload.availability || 'available_today'),
      profilePhotoPath: String(payload.profilePhotoPath || ''),
      identityProofType: payload.identityProofType || '',
      identityProofNumber: String(payload.identityProofNumber || ''),
      identityProofPath: String(payload.identityProofPath || '')
    })

    return NextResponse.json({ success: true, dashboard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete worker registration.' },
      { status: 400 }
    )
  }
}
