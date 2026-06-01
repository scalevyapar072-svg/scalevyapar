# Rozgar Worker V1 Wrapper Verification

Phase 1 adds `/api/rozgar/v1/worker/*` routes as direct wrappers around the existing `/api/labour/worker/*` handlers.

## Wrapper strategy

Each new versioned route re-exports the existing labour worker route handler instead of duplicating business logic.

Benefits:

- same request parsing
- same auth behavior
- same JSON response shape
- same HTTP status codes
- same runtime configuration

## Routes added

- `POST /api/rozgar/v1/worker/auth/request-otp`
- `POST /api/rozgar/v1/worker/auth/verify-otp`
- `GET /api/rozgar/v1/worker/dashboard`
- `PUT /api/rozgar/v1/worker/profile`
- `POST /api/rozgar/v1/worker/upload`
- `POST /api/rozgar/v1/worker/register`
- `POST /api/rozgar/v1/worker/recharge-request`
- `POST /api/rozgar/v1/worker/applications`
- `POST /api/rozgar/v1/worker/saved-jobs`
- `POST /api/rozgar/v1/worker/notifications`
- `POST /api/rozgar/v1/worker/push-token`
- `DELETE /api/rozgar/v1/worker/push-token`

## Explicit non-goals in this phase

- no Flutter app changes
- no Razorpay worker payment routes
- no admin or database changes
- no removal or modification of `/api/labour/worker/*`

## Old vs new verification checklist

For each endpoint below, compare the old labour route and the new Rozgar v1 route with the same request body and headers.

### Auth request OTP

- Old: `POST /api/labour/worker/auth/request-otp`
- New: `POST /api/rozgar/v1/worker/auth/request-otp`
- Verify:
  - invalid body returns the same `400` response
  - valid body returns the same `success`, `message`, `mobile`, `expiresAt`, `workerId`, and `otpCode` fields

### Auth verify OTP

- Old: `POST /api/labour/worker/auth/verify-otp`
- New: `POST /api/rozgar/v1/worker/auth/verify-otp`
- Verify:
  - missing mobile or otp returns the same `400` response
  - valid login returns the same `success`, `token`, and `dashboard` shape

### Dashboard

- Old: `GET /api/labour/worker/dashboard`
- New: `GET /api/rozgar/v1/worker/dashboard`
- Verify:
  - missing or invalid bearer token returns the same `401`
  - valid bearer token returns the same `success` and `dashboard`

### Profile

- Old: `PUT /api/labour/worker/profile`
- New: `PUT /api/rozgar/v1/worker/profile`
- Verify:
  - invalid auth or payload returns the same `400`
  - valid payload returns the same `success` and `dashboard`

### Upload

- Old: `POST /api/labour/worker/upload`
- New: `POST /api/rozgar/v1/worker/upload`
- Verify:
  - invalid document kind returns the same `400`
  - missing file returns the same `400`
  - valid multipart upload returns the same `success`, `storagePath`, `bucket`, and `fileName`

### Register

- Old: `POST /api/labour/worker/register`
- New: `POST /api/rozgar/v1/worker/register`
- Verify:
  - invalid auth or invalid payload returns the same `400`
  - valid payload returns the same `success` and `dashboard`

### Recharge request

- Old: `POST /api/labour/worker/recharge-request`
- New: `POST /api/rozgar/v1/worker/recharge-request`
- Verify:
  - invalid auth returns the same `400`
  - valid request returns the same `success` and `dashboard`

### Applications

- Old: `POST /api/labour/worker/applications`
- New: `POST /api/rozgar/v1/worker/applications`
- Verify:
  - invalid auth or missing `jobPostId` returns the same `400`
  - valid request returns the same `success`, `dashboard`, and `deliveryDebug`

### Saved jobs

- Old: `POST /api/labour/worker/saved-jobs`
- New: `POST /api/rozgar/v1/worker/saved-jobs`
- Verify:
  - invalid auth or invalid body returns the same `400`
  - valid request returns the same `success` and `dashboard`

### Notifications

- Old: `POST /api/labour/worker/notifications`
- New: `POST /api/rozgar/v1/worker/notifications`
- Verify:
  - invalid auth returns the same `400`
  - valid request returns the same `success` and `dashboard`

### Push token

- Old: `POST /api/labour/worker/push-token`
- New: `POST /api/rozgar/v1/worker/push-token`
- Verify:
  - missing `fcmToken` returns the same `400`
  - valid registration returns the same `success` response

### Push token delete

- Old: `DELETE /api/labour/worker/push-token`
- New: `DELETE /api/rozgar/v1/worker/push-token`
- Verify:
  - invalid auth returns the same `400`
  - valid request returns the same `204` with empty body
