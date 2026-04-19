import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data/db.json')

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const userId = params.id
    const { moduleIds } = await request.json()

    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)

    db.userModules = db.userModules.filter(
      (um: any) => um.userId !== userId
    )

    if (moduleIds && moduleIds.length > 0) {
      moduleIds.forEach((moduleId: string) => {
        db.userModules.push({
          userId,
          moduleId,
          isEnabled: true
        })
      })
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}