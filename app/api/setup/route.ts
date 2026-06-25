import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, updateUserPassword } from '@/lib/db'

const getConfiguredAdminCredentials = () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim()
  const name = process.env.DEFAULT_ADMIN_NAME?.trim() || 'Scale Vyapar'
  const recoveryKey = process.env.ADMIN_RECOVERY_KEY?.trim()

  if (!email || !password) {
    throw new Error('Default admin credentials are not configured on the server')
  }

  if (!recoveryKey) {
    throw new Error('ADMIN_RECOVERY_KEY is required to use the admin recovery route')
  }

  return { email, password, name, recoveryKey }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, recoveryKey } = getConfiguredAdminCredentials()
    const providedRecoveryKey = request.headers.get('x-admin-recovery-key')?.trim()

    if (!providedRecoveryKey || providedRecoveryKey !== recoveryKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid recovery key'
        },
        { status: 401 }
      )
    }

    const existingAdmin = await getUserByEmail(email)

    if (existingAdmin) {
      await updateUserPassword(existingAdmin.id, password)

      return NextResponse.json({
        success: true,
        message: 'Admin password reset successfully',
        user: {
          id: existingAdmin.id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      })
    }

    const adminUser = await createUser(name, email, password, 'ADMIN')

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
        message: 'Failed to recover admin user',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
