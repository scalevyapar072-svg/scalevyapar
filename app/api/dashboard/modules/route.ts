import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { readFileSync } from 'fs'
import { join } from 'path'

const JWT_SECRET = new TextEncoder().encode('scalevyapar-secret-key-2024')

export async function GET(request: NextRequest) {
  try {
    // 1. Read the auth-token cookie using Next.js cookies()
    const token = request.cookies.get('auth-token')?.value
    console.log('Auth token from cookie:', token)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Decode the JWT token using jose jwtVerify with secret 'scalevyapar-secret-key-2024'
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // 3. Get the user ID from the token
    const userId = payload.id as string

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 4. Read data/db.json using fs.readFileSync
    const dbPath = join(process.cwd(), 'data', 'db.json')
    const dbData = JSON.parse(readFileSync(dbPath, 'utf-8'))

    // 5. Find all userModules where userId matches and isEnabled is true
    const userModules = dbData.userModules.filter((um: any) => um.userId === userId && um.isEnabled === true)

    // Get the matching modules
    const modules = userModules.map((um: any) => {
      return dbData.modules.find((m: any) => m.id === um.moduleId)
    }).filter(Boolean)

    // 6. Return the matching modules as JSON response like: { modules: [...] }
    return NextResponse.json({ modules })

  } catch (error) {
    console.error('Token verification or processing error:', error)
    // 7. If no token or invalid token return 401
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}