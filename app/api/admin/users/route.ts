import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAllUsersWithAssignedModules, getUserByEmail, updateUserModules } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const usersWithModules = await getAllUsersWithAssignedModules()
    return NextResponse.json({ users: usersWithModules })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { name, email, password, moduleIds, phone, plan } = await request.json()

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const temporaryPassword = password || `SV-${Math.random().toString(36).slice(2, 6)}${Date.now().toString().slice(-4)}`
    const newUser = await createClient({
      name,
      email,
      password: temporaryPassword,
      phone,
      plan
    })

    await updateUserModules(newUser.id, Array.isArray(moduleIds) ? moduleIds : [])

    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      phone: newUser.phone,
      plan: newUser.plan,
      status: newUser.status
    }
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      temporaryPassword
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
