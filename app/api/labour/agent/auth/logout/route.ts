import { NextRequest, NextResponse } from 'next/server'
import { clearLabourAgentSession } from '@/lib/labour-agent-session'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  clearLabourAgentSession(response, request)
  return response
}
