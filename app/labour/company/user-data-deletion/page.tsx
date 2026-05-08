import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export default async function LabourCompanyUserDataDeletionPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/user-data-deletion">
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>Legal</p>
        <h1 className={styles.pageTitle}>User Data Deletion</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '24px' }}>
          If you want ScaleVyapar Rozgar to delete company-side enquiry or contact data associated with your business, please
          send a request using the steps below.
        </p>

        <div className={styles.stack}>
          <div className={styles.softCard}>
            <p className={styles.footerTitle}>How to request deletion</p>
            <p className={styles.textMuted}>
              Email {content.footer.supportEmail} with the subject line <strong>User Data Deletion Request</strong> and include
              your company name, contact number, and the email address used on the platform.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Verification</p>
            <p className={styles.textMuted}>
              We may contact you to verify ownership of the company record before deleting any data, so we can protect against
              accidental or fraudulent deletion requests.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>What gets removed</p>
            <p className={styles.textMuted}>
              After verification, we will delete or anonymise eligible company enquiry data, support messages, and related
              records unless retention is required for billing, security, fraud prevention, or legal compliance.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Response time</p>
            <p className={styles.textMuted}>
              We aim to review deletion requests promptly and respond through {content.footer.supportEmail} or {content.footer.phone}.
            </p>
          </div>
        </div>
      </section>
    </CompanySiteShell>
  )
}
