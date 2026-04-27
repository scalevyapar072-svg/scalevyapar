import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  createLabourEntity,
  deleteLabourEntity,
  getLabourMarketplaceSnapshot,
  LabourEntityType,
  updateLabourEntity
} from '@/lib/labour-marketplace'

const isEntityType = (value: unknown): value is LabourEntityType =>
  value === 'categories' ||
  value === 'plans' ||
  value === 'workers' ||
  value === 'companies' ||
  value === 'jobPosts' ||
  value === 'jobApplications' ||
  value === 'walletTransactions' ||
  value === 'rechargeRequests'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const snapshot = await getLabourMarketplaceSnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Labour marketplace fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load labour marketplace data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { entityType, payload } = await request.json()
    if (!isEntityType(entityType) || !payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'entityType and payload are required' }, { status: 400 })
    }

    const snapshot = await createLabourEntity(entityType, payload as Record<string, unknown>, admin.email)
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour marketplace create failed:', error)
    return NextResponse.json({ error: 'Failed to create labour record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { entityType, id, payload } = await request.json()
    if (!isEntityType(entityType) || !id || !payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'entityType, id and payload are required' }, { status: 400 })
    }

    const snapshot = await updateLabourEntity(entityType, String(id), payload as Record<string, unknown>, admin.email)
    if (!snapshot) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour marketplace update failed:', error)
    return NextResponse.json({ error: 'Failed to update labour record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { entityType, id } = await request.json()
    if (!isEntityType(entityType) || !id) {
      return NextResponse.json({ error: 'entityType and id are required' }, { status: 400 })
    }

    const snapshot = await deleteLabourEntity(entityType, String(id), admin.email)
    if (!snapshot) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour marketplace delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete labour record' }, { status: 500 })
  }
}
