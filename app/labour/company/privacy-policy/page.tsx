import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export default async function LabourCompanyPrivacyPolicyPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/privacy-policy">
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>Legal</p>
        <h1 className={styles.pageTitle}>Privacy Policy</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '24px' }}>
          ScaleVyapar Rozgar collects only the business and contact information needed to help companies discover labour,
          manage enquiries, and communicate about hiring activity.
        </p>

        <div className={styles.stack}>
          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Information we collect</p>
            <p className={styles.textMuted}>
              We may collect company name, contact person name, phone numbers, email addresses, city, hiring preferences,
              and communication history submitted through the company website or labour administration tools.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>How we use information</p>
            <p className={styles.textMuted}>
              We use submitted information to respond to enquiries, match companies with available labour, manage job post
              activity, send service updates, and improve marketplace operations and support quality.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Sharing and retention</p>
            <p className={styles.textMuted}>
              Information is shared only with authorised ScaleVyapar systems, support workflows, and service providers needed
              to operate the platform. We retain data only as long as necessary for hiring support, legal compliance, and
              operational recordkeeping.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Contact</p>
            <p className={styles.textMuted}>
              For privacy questions, contact {content.footer.supportEmail} or use the support number {content.footer.phone}.
            </p>
          </div>
        </div>
      </section>
    </CompanySiteShell>
  )
}
