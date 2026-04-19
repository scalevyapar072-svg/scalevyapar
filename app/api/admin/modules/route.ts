import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data/db.json')

export async function GET() {
  try {
    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)
    return NextResponse.json({ modules: db.modules || [] })
  } catch (error) {
    return NextResponse.json({ modules: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug, icon, description, isActive } = await request.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }
    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)
    const existing = db.modules.find((m: any) => m.slug === slug)
    if (existing) {
      return NextResponse.json({ error: 'Module with this slug already exists' }, { status: 400 })
    }
    const newModule = {
      id: `mod-${Date.now()}`,
      name,
      slug,
      icon: icon || '📌',
      description: description || '',
      isActive: isActive !== false
    }
    db.modules.push(newModule)
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    return NextResponse.json({ success: true, module: newModule })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, slug, icon, description, isActive } = await request.json()
    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)
    const moduleIndex = db.modules.findIndex((m: any) => m.id === id)
    if (moduleIndex === -1) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    db.modules[moduleIndex] = { ...db.modules[moduleIndex], name, slug, icon, description, isActive }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)
    db.modules = db.modules.filter((m: any) => m.id !== id)
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}