type CompanyApplicationEmailPayload = {
  companyEmail: string
  companyName: string
  contactPerson: string
  workerName: string
  workerCity: string
  workerMobile: string
  workerCategories: string[]
  expectedDailyWage: number
  note: string
  jobTitle: string
  jobCity: string
  appliedAt: string
}

const getPublicBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.PUBLIC_APP_URL ||
  'https://scalevyapar.vercel.app'

export const sendCompanyApplicationEmail = async (payload: CompanyApplicationEmailPayload) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || process.env.MAIL_FROM || ''
  const companyEmail = payload.companyEmail.trim()

  if (!companyEmail) {
    return { delivered: false, skipped: true, reason: 'missing-company-email' as const }
  }

  if (!apiKey || !from) {
    console.warn('Company application email skipped because RESEND_API_KEY or RESEND_FROM_EMAIL/MAIL_FROM is not configured.')
    return { delivered: false, skipped: true, reason: 'mail-not-configured' as const }
  }

  const companySigninUrl = `${getPublicBaseUrl()}/labour/company/signin`
  const categoryLabel = payload.workerCategories.length ? payload.workerCategories.join(', ') : 'Not specified'
  const appliedAtLabel = new Date(payload.appliedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  const wageLabel = `Rs ${Number(payload.expectedDailyWage || 0).toLocaleString('en-IN')}`

  const subject = `New worker application for ${payload.jobTitle}`
  const text = [
    `Hello ${payload.contactPerson || payload.companyName},`,
    '',
    `${payload.workerName} has applied for your job post "${payload.jobTitle}".`,
    `City: ${payload.workerCity || 'Not added'}`,
    `Mobile: ${payload.workerMobile || 'Not available'}`,
    `Categories: ${categoryLabel}`,
    `Expected daily wage: ${wageLabel}`,
    `Applied at: ${appliedAtLabel}`,
    payload.note ? `Worker note: ${payload.note}` : '',
    '',
    `Review this application here: ${companySigninUrl}`,
    '',
    'ScaleVyapar Rozgar'
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:24px">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">ScaleVyapar Rozgar</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">New worker application received</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Hello ${payload.contactPerson || payload.companyName}, ${payload.workerName} has applied for your job post <strong>${payload.jobTitle}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 18px">
          <tr><td style="padding:8px 0;color:#64748b">Worker</td><td style="padding:8px 0;font-weight:700">${payload.workerName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">City</td><td style="padding:8px 0">${payload.workerCity || 'Not added'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Mobile</td><td style="padding:8px 0">${payload.workerMobile || 'Not available'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Categories</td><td style="padding:8px 0">${categoryLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Expected wage</td><td style="padding:8px 0">${wageLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Applied at</td><td style="padding:8px 0">${appliedAtLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Job city</td><td style="padding:8px 0">${payload.jobCity || 'Not added'}</td></tr>
        </table>
        ${payload.note ? `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#eff6ff;color:#1e3a8a"><strong>Worker note:</strong><br/>${payload.note}</div>` : ''}
        <a href="${companySigninUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700">Open company sign in</a>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [companyEmail],
      subject,
      text,
      html
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend email failed (${response.status}): ${body}`)
  }

  return { delivered: true, skipped: false }
}
