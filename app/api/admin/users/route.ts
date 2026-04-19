import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data/db.json')

export async function GET() {
  try {
    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)

    const usersWithModules = db.users.map((user: any) => {
      const userModuleIds = db.userModules
        .filter((um: any) => um.userId === user.id && um.isEnabled === true)
        .map((um: any) => um.moduleId)

      const assignedModules = db.modules.filter((m: any) =>
        userModuleIds.includes(m.id)
      )

      const { password, ...userWithoutPassword } = user
      return { ...userWithoutPassword, assignedModules }
    })

    return NextResponse.json({ users: usersWithModules })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, moduleIds } = await request.json()

    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const db = JSON.parse(fileContent)

    const existingUser = db.users.find((u: any) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      role: 'CLIENT',
      createdAt: new Date().toISOString()
    }

    db.users.push(newUser)

    if (moduleIds && moduleIds.length > 0) {
      moduleIds.forEach((moduleId: string) => {
        db.userModules.push({
          userId: newUser.id,
          moduleId,
          isEnabled: true
        })
      })
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}