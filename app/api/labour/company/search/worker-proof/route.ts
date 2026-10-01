import { NextRequest, NextResponse } from 'next/server'
import { getCompanyUserFromRequest, getUserFromRequest, type User } from '@/lib/auth'
import {
  resolveWorkerDocumentAccess,
  type WorkerDocumentKind,
} from '@/lib/labour-company-worker-access'
import { isLiveWorkerSearchJob } from '@/lib/labour-worker-search-job'
import { supabaseAdmin } from '@/lib/supabase-admin'

const WORKER_UPLOAD_BUCKET = 'labour-worker-files'
const PRIVATE_NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' }

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

type WorkerDocumentRecord = {
  category_ids: string[] | null
  status: string | null
  is_visible: boolean | null
  identity_proof_path: string | null
  resume_document_path: string | null
}

type WorkerDocumentRouteDependencies = {
  getCompanyUser: (request: Request) => Promise<User | null>
  getGeneralUser: (request: Request) => Promise<User | null>
  findCompanyByEmail: (email: string) => Promise<CompanyRecord | null>
  findCompanyJobs: (companyId: string) => Promise<JobRecord[]>
  findWorkerDocumentRecord: (workerId: string) => Promise<WorkerDocumentRecord | null>
  createSignedWorkerFileUrl: (storagePath: string) => Promise<string>
}

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

const findWorkerDocumentRecord = async (workerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('labour_workers')
    .select('category_ids,status,is_visible,identity_proof_path,resume_document_path')
    .eq('id', workerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as WorkerDocumentRecord | null
}

const createSignedWorkerFileUrl = async (storagePath: string) => {
  if (/^https?:\/\//i.test(storagePath)) return storagePath

  const { data, error } = await supabaseAdmin.storage
    .from(WORKER_UPLOAD_BUCKET)
    .createSignedUrl(storagePath, 60 * 10)

  if (error) throw new Error(error.message)
  return data.signedUrl
}

const defaultDependencies: WorkerDocumentRouteDependencies = {
  getCompanyUser: getCompanyUserFromRequest,
  getGeneralUser: getUserFromRequest,
  findCompanyByEmail,
  findCompanyJobs,
  findWorkerDocumentRecord,
  createSignedWorkerFileUrl,
}

export async function handleWorkerDocumentGet(
  request: NextRequest,
  dependencies: WorkerDocumentRouteDependencies = defaultDependencies,
) {
  const workerId = request.nextUrl.searchParams.get('workerId')?.trim()
  const requestedDocument = request.nextUrl.searchParams.get('document')?.trim().toLowerCase() || 'identity'
  if (!workerId) {
    return NextResponse.json({ error: 'Worker id is required.' }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (requestedDocument !== 'identity' && requestedDocument !== 'resume') {
    return NextResponse.json({ error: 'Worker document type is invalid.' }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  const documentKind = requestedDocument as WorkerDocumentKind

  try {
    const companyUser = await dependencies.getCompanyUser(request)
    const generalUser = companyUser ? null : await dependencies.getGeneralUser(request)
    const authenticatedUser = companyUser || (generalUser?.role === 'CLIENT' ? generalUser : null)
    if (!authenticatedUser?.email) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const company = await dependencies.findCompanyByEmail(authenticatedUser.email)
    if (!company) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const [companyJobs, worker] = await Promise.all([
      dependencies.findCompanyJobs(company.id),
      dependencies.findWorkerDocumentRecord(workerId),
    ])
    if (!worker) {
      return NextResponse.json({ error: 'Worker document is not available.' }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
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
    const documentAccess = resolveWorkerDocumentAccess({
      companyStatus: company.status,
      liveJobCategoryIds,
      workerCategoryIds: worker.category_ids || [],
      workerStatus: worker.status,
      workerIsVisible: worker.is_visible,
    }, {
      identityProofPath: worker.identity_proof_path,
      resumeDocumentPath: worker.resume_document_path,
    }, documentKind)
    if (!documentAccess.authorized) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    }
    const documentPath = documentAccess.documentPath
    if (!documentPath) {
      return NextResponse.json({ error: 'Worker document is not available.' }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const url = await dependencies.createSignedWorkerFileUrl(documentPath)
    return NextResponse.json({ url }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch {
    return NextResponse.json(
      { error: 'Unable to open worker document.' },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleWorkerDocumentGet(request)
}
