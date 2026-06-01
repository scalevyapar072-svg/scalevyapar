# Rozgar Backend Stabilization V1

This document records the current Rozgar/labour API surface and the stable versioned entry points added for future Rozgar app builds.

## Stable versioned API base

- Environment variable: `ROZGAR_API_BASE_URL`
- Expected value: the full versioned backend base URL, for example `https://rozgar.scalevyapar.in/api/rozgar/v1`
- Fallback behavior: if `ROZGAR_API_BASE_URL` is not set, the backend derives the origin from the incoming request and appends `/api/rozgar/v1`

## New versioned routes

- `GET /api/rozgar/v1/health`
- `GET /api/rozgar/v1/app-config`

`/api/rozgar/v1/app-config` returns:

- `backendVersion`
- `latestAppVersion`
- `minimumAppVersion`
- `apiBaseUrl`
- `razorpayEnabled`
- `appPackage`

## Existing worker app APIs in use

Worker Android app service file:

- `worker-android-app/lib/src/services/worker_api_service.dart`

Current worker endpoints called by the app:

- `POST /api/labour/worker/auth/request-otp`
- `POST /api/labour/worker/auth/verify-otp`
- `GET /api/labour/worker/dashboard`
- `PUT /api/labour/worker/profile`
- `POST /api/labour/worker/upload`
- `POST /api/labour/worker/register`
- `POST /api/labour/worker/recharge-request`
- `GET|POST /api/labour/worker/applications`
- `GET|POST /api/labour/worker/saved-jobs`
- `GET /api/labour/worker/notifications`
- `POST|DELETE /api/labour/worker/push-token`

Referenced by the current worker app but not stabilized in this pass:

- `POST /api/labour/worker/payments/razorpay/order`
- `POST /api/labour/worker/payments/razorpay/verify`

## Existing company website APIs in use

Company website/frontend files:

- `app/labour/company/company-intake-form.tsx`
- `app/labour/company/company-registration-form.tsx`
- `app/labour/company/search/labour-search-client.tsx`
- `app/labour/company/panel/company-panel-client.tsx`

Current company endpoints referenced:

- `POST /api/labour/company-intake`
- `POST /api/labour/company/auth/login`
- `GET /api/labour/company/dashboard`
- `POST /api/labour/company/applications`
- `POST /api/labour/company/search-access`

Referenced by the current company site but not present under `app/api/labour/company`:

- `POST /api/labour/company/upload`

## Existing admin panel APIs in use

Admin pages:

- `app/admin/labour/page.tsx`
- `app/admin/labour/website/page.tsx`

Current admin endpoints referenced:

- `GET|POST|PUT|DELETE /api/admin/labour`
- `GET|PUT /api/admin/labour/settings`
- `GET|PUT /api/admin/labour/company-website`
- `GET /api/admin/labour/worker-file`
- `POST /api/admin/labour/worker-notifications`

Additional existing admin labour route files:

- `app/api/admin/labour/sync/route.ts`

## Existing labour route files

Worker route files:

- `app/api/labour/worker/applications/route.ts`
- `app/api/labour/worker/auth/request-otp/route.ts`
- `app/api/labour/worker/auth/verify-otp/route.ts`
- `app/api/labour/worker/dashboard/route.ts`
- `app/api/labour/worker/help-request/route.ts`
- `app/api/labour/worker/notifications/route.ts`
- `app/api/labour/worker/profile/route.ts`
- `app/api/labour/worker/push-token/route.ts`
- `app/api/labour/worker/recharge-request/route.ts`
- `app/api/labour/worker/register/route.ts`
- `app/api/labour/worker/saved-jobs/route.ts`
- `app/api/labour/worker/upload/route.ts`

Company route files:

- `app/api/labour/company/applications/route.ts`
- `app/api/labour/company/auth/dashboard-session/route.ts`
- `app/api/labour/company/auth/login/route.ts`
- `app/api/labour/company/dashboard/route.ts`
- `app/api/labour/company/search-access/route.ts`
- `app/api/labour/company-intake/route.ts`

## Manual verification

Run the local backend and verify:

```powershell
npm run dev
```

Then check:

```powershell
Invoke-WebRequest http://localhost:3000/api/rozgar/v1/health | Select-Object -ExpandProperty Content
Invoke-WebRequest http://localhost:3000/api/rozgar/v1/app-config | Select-Object -ExpandProperty Content
```

Expected:

- `/health` responds with `success: true`, `status: ok`, `service: rozgar-api`, and the configured package/version metadata
- `/app-config` responds with the stable API contract and `apiBaseUrl`
