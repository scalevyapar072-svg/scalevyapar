import { NextRequest, NextResponse } from 'next/server'
import { getCompanyUserFromRequest, getUserFromRequest, type User } from '@/lib/auth'
import { resolveWorkerPhoneAccess } from '@/lib/labour-company-worker-access'
import { isLiveWorkerSearchJob } from '@/lib/labour-worker-search-job'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type CompanyRecord = {
  id: string
  email: string
  status: string | null
}

type JobRecord = {
  id: string
  company_id: string
  category_id: string
  status: string | null
  expires_at: string | null
  created_at: string | null
  published_at: string | null
}

type WorkerPhoneRecord = {
  category_ids: string[] | null
  status: string | null
  is_visible: boolean | null
  mobile: string | null
}

type WorkerPhoneRouteDependencies = {
  getCompanyUser: (request: Request) => Promise<User | null>
  getGeneralUser: (request: Request) => Promise<User | null>
  findCompanyByEmail: (email: string) => Promise<CompanyRecord | null>
  findCompanyJobs: (companyId: string) => Promise<JobRecord[]>
  findWorkerPhoneRecord: (workerId: string) => Promise<WorkerPhoneRecord | null>
}

const privateJson = (body: Record<string, string>, status = 200) => NextResponse.json(body, {
  status,
  headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
    Vary: 'Cookie',
  },
})

const findCompanyByEmail = async (email: string) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const { data, error } = await supabaseAdmin
    .from('labour_companies')
    .select('id,email,status')
    .ilike('email', normalizedEmail)

  if (error) throw new Error(error.message)
  return ((data || []) as CompanyRecord[]).find(
    company => String(company.email || '').trim().toLowerCase() === normalizedEmail,
  ) || null
}

const findCompanyJobs = async (companyId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_job_posts')
    .select('id,company_id,category_id,status,expires_at,created_at,published_at')
    .eq('company_id', companyId)
    .eq('status', 'live')

  if (error) throw new Error(error.message)
  return (data || []) as JobRecord[]
}

const findWorkerPhoneRecord = async (workerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('category_ids,status,is_visible,mobile')
    .eq('id', workerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as WorkerPhoneRecord | null
}

const defaultDependencies: WorkerPhoneRouteDependencies = {
  getCompanyUser: getCompanyUserFromRequest,
  getGeneralUser: getUserFromRequest,
  findCompanyByEmail,
  findCompanyJobs,
  findWorkerPhoneRecord,
}

export async function handleWorkerPhonePost(
  request: NextRequest,
  dependencies: WorkerPhoneRouteDependencies = defaultDependencies,
) {
  let workerId = ''
  try {
    const body = await request.json()
    workerId = typeof body?.workerId === 'string' ? body.workerId.trim() : ''
  } catch {
    return privateJson({ error: 'Worker id is required' }, 400)
  }

  if (!workerId) {
    return privateJson({ error: 'Worker id is required' }, 400)
  }

  try {
    const companyUser = await dependencies.getCompanyUser(request)
    const generalUser = companyUser ? null : await dependencies.getGeneralUser(request)
    const authenticatedUser = companyUser || (generalUser?.role === 'CLIENT' ? generalUser : null)
    if (!authenticatedUser?.email) {
      return privateJson({ error: 'Unauthorized' }, 401)
    }

    const company = await dependencies.findCompanyByEmail(authenticatedUser.email)
    if (!company) {
      return privateJson({ error: 'Forbidden' }, 403)
    }

    const [companyJobs, worker] = await Promise.all([
      dependencies.findCompanyJobs(company.id),
      dependencies.findWorkerPhoneRecord(workerId),
    ])
    if (!worker) {
      return privateJson({ error: 'Phone not available' }, 404)
    }

    const liveJobCategoryIds = companyJobs
      .filter(job => isLiveWorkerSearchJob({
        id: job.id,
        companyId: job.company_id,
        status: job.status,
        expiresAt: job.expires_at,
        createdAt: job.created_at,
        publishedAt: job.published_at,
      }))
      .map(job => job.category_id)
    const phoneAccess = resolveWorkerPhoneAccess({
      companyStatus: company.status,
      liveJobCategoryIds,
      workerCategoryIds: worker.category_ids || [],
      workerStatus: worker.status,
      workerIsVisible: worker.is_visible,
    }, worker.mobile)

    if (!phoneAccess.authorized) {
      return privateJson({ error: 'Forbidden' }, 403)
    }
    if (!phoneAccess.normalizedMobile) {
      return privateJson({ error: 'Phone not available' }, 404)
    }

    return privateJson({ mobile: phoneAccess.normalizedMobile })
  } catch {
    return privateJson({ error: 'Unable to load phone' }, 500)
  }
}

export async function POST(request: NextRequest) {
  return handleWorkerPhonePost(request)
}
