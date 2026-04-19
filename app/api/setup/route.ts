import { NextResponse } from 'next/server'
import { getUserByEmail, createUser, deleteUser } from '@/lib/db'

export async function GET() {
  try {
    // Check if admin user already exists
    const existingAdmin = await getUserByEmail('admin@scalevyapar.com')

    if (existingAdmin) {
      console.log('Admin user exists, deleting and recreating...')
      // Delete the existing admin user
      await deleteUser(existingAdmin.id)
    }

    // Create the default admin user with properly hashed password
    console.log('Creating admin user with hashed password...')
    const adminUser = await createUser(
      'Scale Vyapar',
      'admin@scalevyapar.com',
      'ScaleVyapar@2024',
      'ADMIN'
    )

    console.log('Admin user created successfully:', adminUser.email)
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create admin user',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}