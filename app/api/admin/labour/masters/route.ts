import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  clearLabourCategoryDependencyGroup,
  clearAllDependencyMappings,
  createLabourCategoryDependency,
  createLabourMasterOption,
  createIndustryBusinessDependency,
  deleteLabourMasterOption,
  getLabourMastersSnapshot,
  removeIndustryBusinessDependency,
  removeLabourCategoryDependency,
  updateLabourCategoryDependency,
  updateIndustryBusinessDependency,
  updateLabourMasterOption
} from '@/lib/labour-masters'

const isMutationKind = (value: unknown): value is 'option' | 'dependency' | 'industryBusiness' =>
  value === 'option' || value === 'dependency' || value === 'industryBusiness'

const isDeleteKind = (value: unknown): value is 'option' | 'dependency' | 'dependencyGroup' | 'industryBusiness' | 'allDependencies' =>
  value === 'option' || value === 'dependency' || value === 'dependencyGroup' || value === 'industryBusiness' || value === 'allDependencies'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const snapshot = await getLabourMastersSnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Labour masters fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load labour master data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { kind, payload } = await request.json()
    if (!isMutationKind(kind) || !payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'kind and payload are required' }, { status: 400 })
    }

    const snapshot =
      kind === 'option'
        ? await createLabourMasterOption(payload as Record<string, unknown>, admin.email)
        : kind === 'industryBusiness'
          ? await createIndustryBusinessDependency(payload as Record<string, unknown>, admin.email)
          : await createLabourCategoryDependency(payload as Record<string, unknown>, admin.email)

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour masters create failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create labour master record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { kind, id, payload } = await request.json()
    if (!isMutationKind(kind) || !id || !payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'kind, id and payload are required' }, { status: 400 })
    }

    const snapshot =
      kind === 'option'
        ? await updateLabourMasterOption(String(id), payload as Record<string, unknown>, admin.email)
        : kind === 'industryBusiness'
          ? await updateIndustryBusinessDependency(String(id), payload as Record<string, unknown>, admin.email)
          : await updateLabourCategoryDependency(String(id), payload as Record<string, unknown>, admin.email)

    if (!snapshot) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour masters update failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update labour master record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { kind, id, payload } = await request.json()
    if (!isDeleteKind(kind)) {
      return NextResponse.json({ error: 'kind is required' }, { status: 400 })
    }

    const snapshot =
      kind === 'option'
        ? await deleteLabourMasterOption(String(id), admin.email)
        : kind === 'allDependencies'
        ? await clearAllDependencyMappings(admin.email)
        : kind === 'industryBusiness'
        ? await removeIndustryBusinessDependency(payload as Record<string, unknown>, admin.email)
        : kind === 'dependencyGroup'
          ? await clearLabourCategoryDependencyGroup(payload as Record<string, unknown>, admin.email)
          : await removeLabourCategoryDependency(payload as Record<string, unknown>, admin.email)

    if (!snapshot) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('Labour masters delete failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete labour master mapping' },
      { status: 500 }
    )
  }
}
