import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendNewJobPostedEmail,
  sendNewWorkerRegisteredEmail,
  sendPaymentReceivedEmail
} from '@/lib/rozgar-notification-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type QaEmailType = 'config' | 'worker' | 'worker_payment' | 'company_payment' | 'job'

const RECIPIENT = 'scalevyapar072@gmail.com'
const ALLOWED_TYPES = new Set<QaEmailType>(['config', 'worker', 'worker_payment', 'company_payment', 'job'])

const safeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

const getSenderEmail = () =>
  process.env.RESEND_FROM_EMAIL ||
  process.env.MAIL_FROM ||
  process.env.RESET_EMAIL_FROM ||
  ''

const sendConfigEmail = async () => {
  const apiKey = process.env.RESEND_API_KEY
  const from = getSenderEmail()

  if (!apiKey || !from) {
    return { delivered: false, reason: 'mail-not-configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `rozgar-qa-config-${Date.now()}`
    },
    body: JSON.stringify({
      from,
      to: [RECIPIENT],
      subject: '[QA] Rozgar Resend Configuration Test',
      text: 'This is a Resend configuration verification email. No business event was triggered.',
      html: '<p>This is a Resend configuration verification email. No business event was triggered.</p>'
    })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    return {
      delivered: false,
      reason: `resend-${response.status}`,
      detail: body
    }
  }

  return { delivered: true }
}

const sendSyntheticNotification = (type: QaEmailType) => {
  const stamp = Date.now()
  if (type === 'config') {
    return sendConfigEmail()
  }

  if (type === 'worker') {
    return sendNewWorkerRegisteredEmail({
      workerId: `qa-worker-test-${stamp}`,
      workerName: 'QA Test Worker',
      mobile: '0000000000',
      industryCategory: 'QA Industry',
      businessType: 'QA Business',
      jobCategories: ['QA Job Category'],
      skills: ['QA Skill'],
      city: 'QA City',
      state: 'QA State',
      requiredWorkLocation: 'QA State: QA City',
      experienceYears: 1,
      registeredAt: new Date().toISOString()
    })
  }

  if (type === 'worker_payment') {
    return sendPaymentReceivedEmail({
      paymentType: 'Worker Wallet Recharge',
      entityName: 'QA Test Worker',
      mobile: '0000000000',
      entityId: 'qa-worker-test',
      amount: 100,
      paymentGateway: 'Razorpay',
      paymentReference: `qa-worker-payment-${stamp}`,
      status: 'completed',
      paidAt: new Date().toISOString()
    })
  }

  if (type === 'company_payment') {
    return sendPaymentReceivedEmail({
      paymentType: 'Company Plan Payment',
      entityName: 'QA Test Company',
      mobile: '0000000000',
      entityId: 'qa-company-test',
      plan: 'QA Test Plan',
      amount: 500,
      paymentGateway: 'Razorpay',
      paymentReference: `qa-company-payment-${stamp}`,
      status: 'completed',
      paidAt: new Date().toISOString()
    })
  }

  return sendNewJobPostedEmail({
    jobPostId: `qa-job-test-${stamp}`,
    companyName: 'QA Test Company',
    companyId: 'qa-company-test',
    companyMobile: '0000000000',
    jobTitle: 'QA Test Job',
    industryCategory: 'QA Industry',
    businessType: 'QA Business',
    workerCategory: 'QA Worker Category',
    workLocation: 'QA City',
    salary: 12345,
    salaryType: 'Monthly Salary',
    workersRequired: 2,
    experience: '1 Year',
    genderPreference: 'Any',
    shift: 'Day',
    facilities: ['Food: No', 'Accommodation: No', 'Transport: No'],
    createdAt: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const expectedToken = process.env.QA_EMAIL_TEST_TOKEN || ''
  const suppliedToken = request.headers.get('x-qa-test-token') || ''
  if (!expectedToken || !suppliedToken || !safeEquals(suppliedToken, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const type = String(body.type || '').trim() as QaEmailType
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid QA email type.' }, { status: 400 })
  }

  const result = await sendSyntheticNotification(type)
  if (!result.delivered) {
    const reason = 'reason' in result ? result.reason : 'not-delivered'
    return NextResponse.json({ success: false, type, reason }, { status: 502 })
  }

  return NextResponse.json({ success: true, type })
}
