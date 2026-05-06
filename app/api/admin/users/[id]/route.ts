import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { deleteUser, getUserByEmail, updateClient } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await context.params
    const { name, email, phone, plan, status } = await request.json()

    if (email) {
      const existingUser = await getUserByEmail(email)
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const updatedUser = await updateClient(id, { name, email, phone, plan, status })
    if (!updatedUser) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        phone: updatedUser.phone,
        plan: updatedUser.plan,
        status: updatedUser.status
      }
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) {
      return admin
    }

    const { id } = await context.params
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
