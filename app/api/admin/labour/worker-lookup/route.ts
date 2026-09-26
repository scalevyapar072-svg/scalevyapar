import { requireAdmin } from '@/lib/auth'
import { findLabourWorkerById, findLabourWorkerByMobile } from '@/lib/labour-marketplace'
import { normalizeIndianWorkerMobile } from '@/lib/labour-worker-mobile'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof Response) return admin

    const body = await request.json().catch(() => null)
    const workerId = String(body?.workerId || '').trim()
    const normalizedMobile = normalizeIndianWorkerMobile(body?.mobile)
    if (!workerId && !normalizedMobile) {
      return Response.json({ error: 'A valid worker ID or Indian mobile number is required.' }, { status: 400 })
    }

    const worker = workerId
      ? await findLabourWorkerById(workerId)
      : await findLabourWorkerByMobile(normalizedMobile)
    if (!worker) {
      return Response.json({ error: 'Worker not found.' }, { status: 404 })
    }

    return Response.json({ worker })
  } catch (error) {
    console.error('Admin worker lookup failed:', error)
    return Response.json({ error: 'Failed to load the existing worker.' }, { status: 500 })
  }
}
