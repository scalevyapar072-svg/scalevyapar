import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const WORKER_UPLOAD_BUCKET = 'labour-worker-files'

export const dynamic = 'force-dynamic'

const getSignedWorkerFileUrl = async (storagePath: string) => {
  const trimmedPath = String(storagePath || '').trim()
  if (!trimmedPath) return ''
  if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath

  const { data, error } = await supabaseAdmin.storage
    .from(WORKER_UPLOAD_BUCKET)
    .createSignedUrl(trimmedPath, 60 * 10)

  if (error) {
    throw new Error(error.message)
  }

  return data.signedUrl
}

export async function GET(request: NextRequest) {
  const workerId = request.nextUrl.searchParams.get('workerId')?.trim()
  if (!workerId) {
    return NextResponse.json({ error: 'Worker id is required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('identity_proof_path')
    .eq('id', workerId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const proofPath = String(data?.identity_proof_path || '').trim()
  if (!proofPath) {
    return NextResponse.json({ error: 'Identity proof is not available.' }, { status: 404 })
  }

  try {
    const url = await getSignedWorkerFileUrl(proofPath)
    return NextResponse.json({ url })
  } catch (signingError) {
    const message = signingError instanceof Error ? signingError.message : 'Unable to sign identity proof.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
