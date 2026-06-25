import type { Metadata } from 'next'
import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Delete Your Rozgar Account | ScaleVyapar Rozgar',
  description: 'Public account deletion instructions for Rozgar users.'
}

const sections = [
  {
    title: 'What to include in your request',
    body:
      'Please send the request from your registered details, or include your registered mobile number so we can verify the account safely.\n\n• Your registered mobile number\n• Your full name\n• A clear request saying: "Please delete my Rozgar account"'
  },
  {
    title: 'Processing time',
    body:
      'After receiving your request, we will verify the account details and process the deletion request within 7–15 working days.'
  },
  {
    title: 'What deletion covers',
    body:
      'When your account is deleted, your worker profile and account-related data will be removed from active use where legally and technically possible.'
  },
  {
    title: 'Information we may retain',
    body:
      'Some information may be retained if required for legal compliance, security, fraud prevention, payment records, dispute handling, or business record obligations.'
  },
  {
    title: 'Support',
    body: 'For help, contact scalevyapar072@gmail.com.'
  }
]

export default async function LabourCompanyDeleteAccountPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/delete-account">
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>
          Rozgar account support
        </p>
        <h1 className={styles.pageTitle}>Delete Your Rozgar Account</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '24px' }}>
          If you want to delete your Rozgar account and associated data, please email us at{' '}
          <a href="mailto:scalevyapar072@gmail.com">scalevyapar072@gmail.com</a>.
        </p>

        <div className={styles.stack}>
          {sections.map(section => (
            <div key={section.title} className={styles.softCard}>
              <p className={styles.footerTitle}>{section.title}</p>
              <p className={styles.textMuted} style={{ whiteSpace: 'pre-line' }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </CompanySiteShell>
  )
}
