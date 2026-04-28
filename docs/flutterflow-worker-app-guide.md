# FlutterFlow Worker App Guide

This guide explains how to build the `ScaleVyapar Worker Android App` in `FlutterFlow` using the backend that already exists in this project.

## Goal

Build the worker app MVP with these features:

- mobile number login with OTP
- profile with name, city, category, skills, experience, expected wage, and availability
- wallet balance
- recharge history
- daily deduction visibility
- matching job feed
- company details locked unless worker is active

## Backend Base URL

Use:

```text
https://scalevyapar.vercel.app
```

If you are testing locally, use your local API base instead.

## Authentication Model

The worker app uses a `Bearer token`.

Flow:

1. worker enters mobile number
2. app calls `request-otp`
3. app calls `verify-otp`
4. backend returns `token`
5. save this token in FlutterFlow `App State` or secure local storage
6. send this token in `Authorization` header for protected APIs

Header format:

```text
Authorization: Bearer <token>
```

## FlutterFlow Pages

Recommended page structure:

1. `Splash Page`
2. `Login Page`
3. `OTP Verify Page`
4. `Worker Home Page`
5. `Job Feed Tab`
6. `Wallet Tab`
7. `Profile Tab`
8. `Job Detail Bottom Sheet` or page

Best MVP navigation:

- `Login`
- `OTP Verify`
- `Home` with bottom tabs:
  - `Feed`
  - `Wallet`
  - `Profile`

## App State Variables

Create these global app variables in FlutterFlow:

- `workerToken` as `String`
- `workerId` as `String` optional
- `workerStatus` as `String`
- `workerIsActive` as `bool`
- `workerCanViewCompanyDetails` as `bool`

## API List

### 1. Request OTP

**Method**
`POST`

**URL**
```text
/api/labour/worker/auth/request-otp
```

**Body**
```json
{
  "mobile": "9876543210"
}
```

**Success response**
```json
{
  "success": true,
  "message": "OTP generated for worker login. Connect an SMS provider later for production delivery.",
  "mobile": "9876543210",
  "expiresAt": "2026-04-25T19:30:00.000Z",
  "workerId": "worker-sajid",
  "otpCode": "123456"
}
```

**FlutterFlow use**

- call this from `Login Page`
- save `mobile` in local page state or app state
- move user to `OTP Verify Page`
- for development, show `otpCode` on screen
- in production, remove visible OTP and send by SMS provider

### 2. Verify OTP

**Method**
`POST`

**URL**
```text
/api/labour/worker/auth/verify-otp
```

**Body**
```json
{
  "mobile": "9876543210",
  "otpCode": "123456"
}
```

**Success response**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "dashboard": {
    "profile": {},
    "wallet": {},
    "activation": {},
    "feed": [],
    "availableCategories": [],
    "workerPlan": {}
  }
}
```

**FlutterFlow use**

- save `token` to `workerToken`
- save:
  - `dashboard.activation.status`
  - `dashboard.activation.isActive`
  - `dashboard.activation.canViewCompanyDetails`
- navigate to `Worker Home Page`

### 3. Worker Dashboard

**Method**
`GET`

**URL**
```text
/api/labour/worker/dashboard
```

**Headers**
```text
Authorization: Bearer <workerToken>
```

**Success response shape**
```json
{
  "success": true,
  "dashboard": {
    "profile": {
      "id": "worker-sajid",
      "fullName": "Sajid Ansari",
      "mobile": "9876543210",
      "city": "Surat",
      "categoryIds": ["cat-stitching", "cat-embroidery"],
      "categoryLabels": ["Stitching Karighar", "Embroidery Worker"],
      "skills": ["Ladies kurti stitching", "Machine handling", "Finishing"],
      "experienceYears": 6,
      "expectedDailyWage": 950,
      "availability": "available_today",
      "walletBalance": 40,
      "status": "active",
      "isVisible": true
    },
    "wallet": {
      "balance": 40,
      "dailyCharge": 5,
      "estimatedDaysRemaining": 8,
      "visibilityRule": "Rs 5 is deducted every active day. Company details unlock only while your worker access is active.",
      "lastDeductionAt": "2026-04-25T00:00:00.000Z",
      "transactions": []
    },
    "activation": {
      "isActive": true,
      "canViewCompanyDetails": true,
      "status": "active",
      "headline": "Worker access is active",
      "description": "Your wallet is active. Daily deduction is Rs 5 and company details are unlocked.",
      "recommendedAction": "Apply to matching job posts"
    },
    "feed": [
      {
        "id": "job-neelufer-stitching",
        "title": "10 Stitching Karighar Needed For Ladies Kurtis",
        "description": "Immediate requirement for experienced stitching karighars for daily production. Overtime available.",
        "city": "Surat",
        "wageAmount": 950,
        "workersNeeded": 10,
        "categoryName": "Stitching Karighar",
        "companyLocked": false,
        "companyName": "Neelufer Creations",
        "companyCity": "Surat",
        "contactPerson": "Neelu",
        "companyMobile": "9898989898",
        "publishedAt": "2026-04-25",
        "expiresAt": "2026-04-28",
        "matchReason": "Strong match in your city and category"
      }
    ],
    "availableCategories": [
      {
        "id": "cat-stitching",
        "name": "Stitching Karighar"
      }
    ],
    "workerPlan": {
      "id": "plan-worker-basic",
      "name": "Worker Access 10 Days",
      "validityDays": 10,
      "dailyCharge": 5,
      "registrationFee": 50,
      "walletCredit": 50
    }
  }
}
```

**FlutterFlow use**

Use this API as the main source for:

- `Home top banner`
- `Job Feed`
- `Wallet summary`
- `Profile default values`
- `Category dropdown/check list`

## Dashboard Binding Map

### Activation Banner

Bind:

- headline: `dashboard.activation.headline`
- description: `dashboard.activation.description`
- recommended action: `dashboard.activation.recommendedAction`
- status badge: `dashboard.activation.status`

Use conditional UI:

- if `dashboard.activation.isActive == true`
  - green or positive banner
- else
  - yellow or warning banner

### Feed Page

List source:

- `dashboard.feed`

Feed card fields:

- title: `title`
- city: `city`
- wage: `wageAmount`
- category: `categoryName`
- workers needed: `workersNeeded`
- match reason: `matchReason`
- description: `description`

Company section:

- if `companyLocked == true`
  - show text:
    - `Company details are locked`
    - `Recharge and activate to unlock`
- else show:
  - `companyName`
  - `contactPerson`
  - `companyMobile`
  - `companyCity`

### Wallet Page

Bind:

- balance: `dashboard.wallet.balance`
- daily deduction: `dashboard.wallet.dailyCharge`
- days remaining: `dashboard.wallet.estimatedDaysRemaining`
- rule text: `dashboard.wallet.visibilityRule`
- last deduction: `dashboard.wallet.lastDeductionAt`

Wallet history list source:

- `dashboard.wallet.transactions`

Wallet history item fields:

- type: `transactionType`
- amount: `amount`
- direction: `direction`
- status: `status`
- note: `note`
- reference: `reference`
- date: `createdAt`

### Profile Page

Bind these initial values:

- full name: `dashboard.profile.fullName`
- city: `dashboard.profile.city`
- selected categories: `dashboard.profile.categoryIds`
- selected category labels: `dashboard.profile.categoryLabels`
- skills: `dashboard.profile.skills`
- experience: `dashboard.profile.experienceYears`
- expected wage: `dashboard.profile.expectedDailyWage`
- availability: `dashboard.profile.availability`

Category options source:

- `dashboard.availableCategories`

## 4. Update Worker Profile

**Method**
`PUT`

**URL**
```text
/api/labour/worker/profile
```

**Headers**
```text
Authorization: Bearer <workerToken>
Content-Type: application/json
```

**Body example**
```json
{
  "fullName": "Sajid Ansari",
  "city": "Surat",
  "categoryIds": ["cat-stitching", "cat-embroidery"],
  "skills": ["Ladies kurti stitching", "Machine handling", "Finishing"],
  "experienceYears": 6,
  "expectedDailyWage": 950,
  "availability": "available_today"
}
```

**FlutterFlow use**

- call this on `Save Profile`
- after success, refresh dashboard state with returned `dashboard`

## 5. Create Recharge Request

**Method**
`POST`

**URL**
```text
/api/labour/worker/recharge-request
```

**Headers**
```text
Authorization: Bearer <workerToken>
Content-Type: application/json
```

**Body**
```json
{
  "note": "Need recharge to activate profile again"
}
```

**FlutterFlow use**

- add button on wallet page:
  - `Request Recharge`
- after success:
  - show snackbar
  - refresh dashboard from returned `dashboard`

## Worker Status Rules

Possible worker statuses:

- `pending`
- `active`
- `inactive_wallet_empty`
- `inactive_subscription_expired`
- `blocked`
- `rejected`

### UI rules

If status is `active`:

- feed visible
- company details visible
- wallet active

If status is `inactive_wallet_empty` or `inactive_subscription_expired`:

- feed visible
- company details locked
- wallet page should push recharge action strongly

If status is `blocked` or `rejected`:

- disable apply/connect CTA
- show contact support banner

## FlutterFlow Screen-by-Screen Setup

## Login Page

Widgets:

- logo
- title
- mobile number text field
- `Request OTP` button

Action on `Request OTP`:

1. call `Request OTP API`
2. save mobile number in page state or app state
3. navigate to `OTP Verify Page`

## OTP Verify Page

Widgets:

- OTP input
- note for demo OTP
- `Verify OTP` button

Action on `Verify OTP`:

1. call `Verify OTP API`
2. save `token` into app state `workerToken`
3. save:
   - `dashboard.activation.status`
   - `dashboard.activation.isActive`
   - `dashboard.activation.canViewCompanyDetails`
4. navigate to `Worker Home Page`

## Worker Home Page

Use bottom navigation or tabs:

- `Feed`
- `Wallet`
- `Profile`

On page load:

1. call `Worker Dashboard API`
2. bind result to local page state

## Feed Tab

Widgets:

- activation banner
- repeating job cards

Conditional UI:

- if `companyLocked`
  - blur/hide company details
  - show lock notice
- else
  - show company name, contact person, mobile, city

## Wallet Tab

Widgets:

- wallet balance card
- daily deduction card
- days remaining card
- recharge request button
- transaction history list

Action:

- `Request Recharge` button calls `Create Recharge Request API`

## Profile Tab

Widgets:

- full name input
- city input
- categories multi-select
- skills chip input or comma text input
- experience input
- expected wage input
- availability dropdown
- `Save Profile` button

Availability values:

- `available_today`
- `available_this_week`
- `not_available`

## Suggested FlutterFlow Collections / Local State

You do not need Firestore for this MVP if you use only your backend.

Use:

- App State:
  - `workerToken`
  - `workerStatus`
  - `workerIsActive`
  - `workerCanViewCompanyDetails`

- Page State on Home:
  - `dashboardResponse`

## Demo Test Data

Current seeded test worker:

- mobile: `9876543210`
- OTP: `123456`
- status: `active`

Second test worker:

- mobile: `9812345678`
- OTP: `123456`
- status: `inactive_wallet_empty`

## Recommended FlutterFlow Component Design

### Feed job card

Sections:

- title
- city and category
- wage and worker count
- description
- match reason badge
- company section locked/unlocked

### Wallet summary card

Sections:

- current balance
- daily deduction
- days remaining
- recharge action

### Activation banner

Sections:

- status headline
- short explanation
- recommended action

## Important Note for Production OTP

Current OTP is a `development OTP`.

For production later:

- connect `MSG91` or another OTP provider
- in `request-otp`, send actual SMS
- remove `otpCode` from response

## Current Backend Files

Worker app backend logic:

- [labour-worker-app.ts](C:/Users/neelu/Documents/New%20project/scalevyapar/lib/labour-worker-app.ts:1)

Worker APIs:

- [request-otp](C:/Users/neelu/Documents/New%20project/scalevyapar/app/api/labour/worker/auth/request-otp/route.ts:1)
- [verify-otp](C:/Users/neelu/Documents/New%20project/scalevyapar/app/api/labour/worker/auth/verify-otp/route.ts:1)
- [dashboard](C:/Users/neelu/Documents/New%20project/scalevyapar/app/api/labour/worker/dashboard/route.ts:1)
- [profile](C:/Users/neelu/Documents/New%20project/scalevyapar/app/api/labour/worker/profile/route.ts:1)
- [recharge-request](C:/Users/neelu/Documents/New%20project/scalevyapar/app/api/labour/worker/recharge-request/route.ts:1)

## What To Build Next After This MVP

After you finish this in FlutterFlow, the next good features are:

1. `Apply to Job`
2. `Saved Jobs`
3. `Worker notification center`
4. `Recharge payment integration`
5. `Profile photo and identity documents`
