import assert from 'node:assert/strict'
import test from 'node:test'

import { handleCompanyDashboardSessionGet } from '../../app/api/labour/company/auth/dashboard-session/route'
import { handleCompanyDashboardGet } from '../../app/api/labour/company/dashboard/route'
import { handleCompanyLoginPost } from '../../app/api/labour/company/auth/login/route'
import { handleCompanyLogoutPost } from '../../app/api/labour/company/auth/logout/route'
import {
  AUTH_COOKIE_NAME,
  COMPANY_AUTH_COOKIE_NAME,
  generateToken,
  type User,
} from '../../lib/auth-token'
import {
  getCompanyUserFromRequest,
  getUserFromRequest,
  requireAdmin,
  requireCompanyDashboardUser,
} from '../../lib/auth'

const adminUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
}

const companyDashboardUser: User = {
  id: 'client-1',
  name: 'Client User',
  email: 'client@example.com',
  role: 'CLIENT',
}

const dashboardStub = {
  profile: { companyName: 'ScaleVyapar QA Company' },
  currentJobPostingPlan: null,
  currentJobPostingPlans: [],
  stats: {
    liveJobPosts: 0,
    totalApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0,
  },
  jobs: [],
  recentApplications: [],
  billingHistory: [],
} as const

const makeRequest = (
  url: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    body?: string
  },
) =>
  ({
    headers: new Headers(init?.headers),
    json: async () => (init?.body ? JSON.parse(init.body) : {}),
    method: init?.method || 'GET',
    nextUrl: new URL(url),
    url,
  }) as never

const makeCookieHeader = (cookies: Record<string, string>) =>
  Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')

test('Company login writes only the dedicated Company cookie and leaves Admin cookie untouched', async () => {
  const request = makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `${AUTH_COOKIE_NAME}=existing-admin-session`,
    },
    body: JSON.stringify({
      email: 'client@example.com',
      password: 'synthetic-password',
    }),
  })

  const response = await handleCompanyLoginPost(request, {
    comparePassword: async () => true,
    createCookie: (token, hostname) => ({
      name: COMPANY_AUTH_COOKIE_NAME,
      value: token,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 604800,
        path: '/',
        domain: hostname ? '.scalevyapar.in' : undefined,
      },
    }),
    generateSessionToken: async () => 'company-dashboard-session',
    getUserByEmail: async () => ({
      ...companyDashboardUser,
      password: 'stored-hash',
      password_hash: 'stored-hash',
      phone: '',
      plan: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } as never),
    loginCompanyAppFromDashboard: async () => ({
      token: 'company-app-token',
      dashboard: dashboardStub as never,
    }),
  })

  assert.equal(response.status, 200)
  const setCookie = response.headers.get('set-cookie') || ''
  assert.match(setCookie, /scalevyapar-company-auth=/)
  assert.doesNotMatch(setCookie, /scalevyapar-auth=/)
  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.token, 'company-app-token')
})

test('Company dashboard session accepts the dedicated Company cookie', async () => {
  const companyToken = await generateToken(companyDashboardUser)
  const request = makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session', {
    headers: {
      cookie: `${COMPANY_AUTH_COOKIE_NAME}=${companyToken}`,
    },
  })

  const response = await handleCompanyDashboardSessionGet(request, {
    loginCompanyAppFromDashboard: async (email: string) => ({
      token: `company-app-token-for:${email}`,
      dashboard: {
        ...dashboardStub,
        profile: { companyName: 'Recovered Company' },
      } as never,
    }),
    requireCompanyDashboardUser,
  })

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.token, 'company-app-token-for:client@example.com')
})

test('Company dashboard session rejects missing or wrong-role Company cookies', async () => {
  const adminToken = await generateToken(adminUser)

  const missingResponse = await handleCompanyDashboardSessionGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session'),
    {
      loginCompanyAppFromDashboard: async () => {
        throw new Error('should not reach company app bootstrap')
      },
      requireCompanyDashboardUser,
    },
  )

  assert.equal(missingResponse.status, 401)

  const wrongRoleResponse = await handleCompanyDashboardSessionGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session', {
      headers: {
        cookie: `${COMPANY_AUTH_COOKIE_NAME}=${adminToken}`,
      },
    }),
    {
      loginCompanyAppFromDashboard: async () => {
        throw new Error('should not reach company app bootstrap')
      },
      requireCompanyDashboardUser,
    },
  )

  assert.equal(wrongRoleResponse.status, 401)
})

test('Company logout clears only the dedicated Company cookie', async () => {
  const request = makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/logout', {
    method: 'POST',
    headers: {
      cookie: `${AUTH_COOKIE_NAME}=existing-admin-session; ${COMPANY_AUTH_COOKIE_NAME}=existing-company-session`,
    },
  })

  const response = await handleCompanyLogoutPost(request)

  assert.equal(response.status, 200)
  const setCookie = response.headers.get('set-cookie') || ''
  assert.match(setCookie, /scalevyapar-company-auth=/)
  assert.match(setCookie, /Max-Age=0/i)
  assert.doesNotMatch(setCookie, /scalevyapar-auth=/)
})

test('Admin and Company session readers stay isolated on the same host', async () => {
  const adminToken = await generateToken(adminUser)
  const companyToken = await generateToken(companyDashboardUser)
  const request = makeRequest('https://qa-profile-sync.scalevyapar.in/admin/labour', {
    headers: {
      cookie: makeCookieHeader({
        [AUTH_COOKIE_NAME]: adminToken,
        [COMPANY_AUTH_COOKIE_NAME]: companyToken,
      }),
    },
  })

  const resolvedAdmin = await getUserFromRequest(request)
  const resolvedCompany = await getCompanyUserFromRequest(request)

  assert.equal(resolvedAdmin?.email, adminUser.email)
  assert.equal(resolvedAdmin?.role, 'ADMIN')
  assert.equal(resolvedCompany?.email, companyDashboardUser.email)
  assert.equal(resolvedCompany?.role, 'CLIENT')
})

test('Admin authorization ignores the Company cookie and Company authorization ignores Admin tokens', async () => {
  const adminToken = await generateToken(adminUser)
  const companyToken = await generateToken(companyDashboardUser)

  const adminResponse = await requireAdmin(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/admin/labour/whatsapp/meta-status', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${adminToken}`,
      },
    }),
  )

  assert.equal((adminResponse as User).role, 'ADMIN')

  const companyOnlyAdminResponse = await requireAdmin(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/admin/labour/whatsapp/meta-status', {
      headers: {
        cookie: `${COMPANY_AUTH_COOKIE_NAME}=${companyToken}`,
      },
    }),
  )

  assert.ok(companyOnlyAdminResponse instanceof Response)
  assert.equal(companyOnlyAdminResponse.status, 401)

  const wrongRoleCompanyResponse = await requireCompanyDashboardUser(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session', {
      headers: {
        cookie: `${COMPANY_AUTH_COOKIE_NAME}=${adminToken}`,
      },
    }),
  )

  assert.ok(wrongRoleCompanyResponse instanceof Response)
  assert.equal(wrongRoleCompanyResponse.status, 401)
})

test('Company dashboard session distinguishes a provider outage from an invalid Company cookie', async () => {
  const validCompanyUser = { ...companyDashboardUser }
  const outageResponse = await handleCompanyDashboardSessionGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session'),
    {
      loginCompanyAppFromDashboard: async () => {
        throw new Error('synthetic provider outage')
      },
      requireCompanyDashboardUser: async () => validCompanyUser,
    },
  )

  assert.equal(outageResponse.status, 503)
  assert.deepEqual(await outageResponse.json(), {
    error: 'Company dashboard is temporarily unavailable.',
  })

  const invalidResponse = await handleCompanyDashboardSessionGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session'),
    {
      loginCompanyAppFromDashboard: async () => {
        throw new Error('should not reach company app bootstrap')
      },
      requireCompanyDashboardUser,
    },
  )

  assert.equal(invalidResponse.status, 401)
})

test('Known Company-account bootstrap failures preserve the existing 400 contract', async () => {
  const response = await handleCompanyDashboardSessionGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/auth/dashboard-session'),
    {
      loginCompanyAppFromDashboard: async () => {
        throw new Error('No registered company was found for this dashboard account.')
      },
      requireCompanyDashboardUser: async () => companyDashboardUser,
    },
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'No registered company was found for this dashboard account.',
  })
})

test('Company dashboard read preserves the session distinction during provider outages', async () => {
  const outageResponse = await handleCompanyDashboardGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/dashboard'),
    {
      getCompanyAppDashboard: async () => {
        throw new Error('synthetic provider outage')
      },
      requireCompanyApp: async () => ({ companyId: 'company-1' } as never),
    },
  )

  assert.equal(outageResponse.status, 503)
  assert.deepEqual(await outageResponse.json(), {
    error: 'Company dashboard is temporarily unavailable.',
  })

  const invalidResponse = await handleCompanyDashboardGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/dashboard'),
    {
      getCompanyAppDashboard: async () => {
        throw new Error('should not read the dashboard')
      },
      requireCompanyApp: async () => {
        throw new Error('Unauthorized')
      },
    },
  )

  assert.equal(invalidResponse.status, 401)
})

test('Missing Company account remains an authentication failure', async () => {
  const response = await handleCompanyDashboardGet(
    makeRequest('https://qa-profile-sync.scalevyapar.in/api/labour/company/dashboard'),
    {
      getCompanyAppDashboard: async () => {
        throw new Error('Company account not found.')
      },
      requireCompanyApp: async () => ({ companyId: 'company-1' } as never),
    },
  )

  assert.equal(response.status, 401)
})
