import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export default async function LabourCompanyTermsOfServicePage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/terms-of-service">
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>Legal</p>
        <h1 className={styles.pageTitle}>Terms of Service</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '24px' }}>
          By using the ScaleVyapar Rozgar company site, you agree to use the service only for genuine hiring, labour search,
          and related business communication.
        </p>

        <div className={styles.stack}>
          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Permitted use</p>
            <p className={styles.textMuted}>
              You may use this site to enquire about labour, create hiring requests, review plans, and communicate with
              ScaleVyapar support regarding company-side recruitment activity.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Accurate information</p>
            <p className={styles.textMuted}>
              You agree to provide accurate company, contact, and hiring information. False, misleading, abusive, or unlawful
              usage may lead to account restriction or removal from the platform.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Service availability</p>
            <p className={styles.textMuted}>
              ScaleVyapar may update, improve, suspend, or limit parts of the service to maintain quality, compliance, and
              operational stability. We do not guarantee uninterrupted availability at all times.
            </p>
          </div>

          <div className={styles.softCard}>
            <p className={styles.footerTitle}>Support and disputes</p>
            <p className={styles.textMuted}>
              For support, billing, or service questions, contact {content.footer.supportEmail}. Continued use of the service
              after updates to these terms constitutes acceptance of the revised terms.
            </p>
          </div>
        </div>
      </section>
    </CompanySiteShell>
  )
}
