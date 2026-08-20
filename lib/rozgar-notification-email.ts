export const ROZGAR_ADMIN_NOTIFICATION_EMAIL_FALLBACK = 'scalevyapar072@gmail.com'

export const getRozgarNotificationSenderEmail = () =>
  process.env.RESEND_FROM_EMAIL ||
  process.env.MAIL_FROM ||
  process.env.RESET_EMAIL_FROM ||
  ''

export const getRozgarAdminNotificationEmail = () =>
  // Preview infrastructure may temporarily fall back to the fixed admin inbox until
  // ROZGAR_ADMIN_NOTIFICATION_EMAIL is wired everywhere.
  String(process.env.ROZGAR_ADMIN_NOTIFICATION_EMAIL || '').trim() ||
  ROZGAR_ADMIN_NOTIFICATION_EMAIL_FALLBACK

const isProductionRuntime = () => process.env.VERCEL_ENV === 'production'

const withEnvironmentPrefix = (subject: string) =>
  isProductionRuntime() ? subject : `[QA] ${subject}`

const formatIndiaDateTime = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short'
  }).format(Number.isNaN(date.getTime()) ? new Date() : date)
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatCurrency = (amount: number) =>
  `₹${Math.max(0, Math.round(Number(amount || 0))).toLocaleString('en-IN')}`

const compactRows = (rows: Array<[string, unknown]>) =>
  rows
    .map(([label, value]) => [label, Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value ?? '').trim()] as const)
    .filter(([, value]) => value)

const buildText = (title: string, rows: Array<readonly [string, string]>) =>
  [
    title,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'ScaleVyapar Rozgar'
  ].join('\n')

const buildHtml = (title: string, rows: Array<readonly [string, string]>) => `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:24px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">ScaleVyapar Rozgar</p>
      <h1 style="margin:0 0 18px;font-size:26px;line-height:1.2">${escapeHtml(title)}</h1>
      <table style="width:100%;border-collapse:collapse">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="padding:9px 0;color:#64748b;border-bottom:1px solid #f1f5f9;width:34%">${escapeHtml(label)}</td>
            <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-weight:600">${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  </div>
`

export const sendResendAdminNotification = async ({
  recipient,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  recipient?: string
  subject: string
  text: string
  html: string
  idempotencyKey: string
}) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = getRozgarNotificationSenderEmail()

  if (!apiKey || !from) {
    console.warn('Rozgar admin email skipped because RESEND_API_KEY or RESEND_FROM_EMAIL/MAIL_FROM is not configured.')
    return {
      delivered: false,
      skipped: true,
      reason: 'mail-not-configured' as const,
      providerMessageId: '',
      safeErrorCode: 'mail-not-configured',
      safeErrorMessage: 'Resend sender is not configured',
    }
  }
  const finalSubject = withEnvironmentPrefix(subject)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        from,
        to: [String(recipient || getRozgarAdminNotificationEmail()).trim()],
        subject: finalSubject,
        text,
        html,
      })
    })

    const responseText = await response.text().catch(() => '')
    let responseJson: Record<string, unknown> | null = null
    if (responseText) {
      try {
        responseJson = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        responseJson = null
      }
    }

    if (!response.ok) {
      const safeErrorCode = String(
        responseJson?.name ||
          response.status ||
          'provider-error',
      ).trim()
      const safeErrorMessage = String(
        responseJson?.message ||
          response.statusText ||
          'Provider request failed',
      ).trim()

      console.error(`Rozgar admin email failed (${response.status}): ${safeErrorMessage}`)
      return {
        delivered: false,
        skipped: false,
        reason: 'provider-error' as const,
        providerMessageId: '',
        safeErrorCode,
        safeErrorMessage,
        statusCode: response.status,
      }
    }

    return {
      delivered: true,
      skipped: false,
      providerMessageId: String(responseJson?.id || '').trim(),
      safeErrorCode: '',
      safeErrorMessage: '',
      statusCode: response.status,
    }
  } catch (error) {
    console.error('Rozgar admin email failed', error)
    return {
      delivered: false,
      skipped: false,
      reason: 'send-error' as const,
      providerMessageId: '',
      safeErrorCode: 'send-error',
      safeErrorMessage: error instanceof Error ? error.message : 'Send failed',
    }
  }
}

const sendRozgarAdminEmail = async ({
  subject,
  title,
  rows,
  idempotencyKey
}: {
  subject: string
  title: string
  rows: Array<[string, unknown]>
  idempotencyKey: string
}) => {
  const normalizedRows = compactRows(rows)

  return sendResendAdminNotification({
    subject,
    text: buildText(title, normalizedRows),
    html: buildHtml(title, normalizedRows),
    idempotencyKey,
  })
}

export const formatRozgarWorkLocations = (
  locations: Array<{ stateLabel?: string; cityLabels?: string[] }>
) =>
  locations
    .map(location => {
      const state = String(location.stateLabel || '').trim()
      const cities = (location.cityLabels || []).map(city => String(city).trim()).filter(Boolean)
      if (!state && !cities.length) return ''
      return cities.length ? `${state}: ${cities.join(', ')}` : state
    })
    .filter(Boolean)
    .join('; ')

export const sendNewWorkerRegisteredEmail = (payload: {
  workerId: string
  workerName: string
  mobile: string
  industryCategory?: string
  businessType?: string
  jobCategories?: string[]
  skills?: string[]
  city?: string
  state?: string
  requiredWorkLocation?: string
  experienceYears?: number
  registeredAt?: string
}) =>
  sendRozgarAdminEmail({
    subject: 'Rozgar - New Worker Registered',
    title: 'New Worker Registered',
    idempotencyKey: `rozgar-worker-registered-${payload.workerId}`,
    rows: [
      ['Worker Name', payload.workerName],
      ['Mobile', payload.mobile],
      ['Worker ID', payload.workerId],
      ['Industry Category', payload.industryCategory],
      ['Business Type', payload.businessType],
      ['Job Category / Skill', [...(payload.jobCategories || []), ...(payload.skills || [])].join(', ')],
      ['City', payload.city],
      ['State', payload.state],
      ['Required Work Location', payload.requiredWorkLocation],
      ['Experience', payload.experienceYears === undefined ? '' : `${payload.experienceYears} years`],
      ['Registration Date & Time', formatIndiaDateTime(payload.registeredAt)]
    ]
  })

export const sendPaymentReceivedEmail = (payload: {
  paymentType: 'Worker Wallet Recharge' | 'Company Plan Payment'
  entityName: string
  mobile: string
  entityId: string
  amount: number
  plan?: string
  paymentGateway: string
  paymentReference: string
  status: string
  paidAt?: string
}) =>
  sendRozgarAdminEmail({
    subject: `Rozgar - Payment Received - ${formatCurrency(payload.amount)}`,
    title: 'Payment Received',
    idempotencyKey: `rozgar-payment-${payload.paymentType}-${payload.paymentReference}`.replace(/\s+/g, '-').toLowerCase(),
    rows: [
      ['Type', payload.paymentType],
      [payload.paymentType === 'Company Plan Payment' ? 'Company Name' : 'Worker Name', payload.entityName],
      ['Mobile', payload.mobile],
      [payload.paymentType === 'Company Plan Payment' ? 'Company ID' : 'Worker ID', payload.entityId],
      ['Plan', payload.plan],
      ['Amount', formatCurrency(payload.amount)],
      ['Payment Gateway', payload.paymentGateway],
      ['Payment ID / Reference', payload.paymentReference],
      ['Transaction Status', payload.status],
      ['Date / Time', formatIndiaDateTime(payload.paidAt)]
    ]
  })

export const sendNewJobPostedEmail = (payload: {
  jobPostId: string
  companyName: string
  companyId: string
  companyMobile: string
  jobTitle: string
  industryCategory?: string
  businessType?: string
  workerCategory?: string
  workLocation?: string
  salary?: number
  salaryType?: string
  workersRequired?: number
  experience?: string
  genderPreference?: string
  shift?: string
  facilities?: string[]
  createdAt?: string
}) =>
  sendRozgarAdminEmail({
    subject: 'Rozgar - New Job Posted',
    title: 'New Job Posted',
    idempotencyKey: `rozgar-new-job-${payload.jobPostId}`,
    rows: [
      ['Job Post ID', payload.jobPostId],
      ['Company Name', payload.companyName],
      ['Company ID', payload.companyId],
      ['Company Mobile', payload.companyMobile],
      ['Job Title', payload.jobTitle],
      ['Industry Category', payload.industryCategory],
      ['Business Type', payload.businessType],
      ['Worker Category', payload.workerCategory],
      ['City / Work Location', payload.workLocation],
      ['Salary', payload.salary === undefined ? '' : formatCurrency(payload.salary)],
      ['Salary Type', payload.salaryType],
      ['Workers Required', payload.workersRequired],
      ['Experience', payload.experience],
      ['Gender Preference', payload.genderPreference],
      ['Shift', payload.shift],
      ['Facilities', payload.facilities],
      ['Created Date & Time', formatIndiaDateTime(payload.createdAt)]
    ]
  })
