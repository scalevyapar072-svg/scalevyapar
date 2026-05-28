import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export default async function LabourCompanyPrivacyPolicyPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const page = content.legalPages.privacyPolicy

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/privacy-policy">
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>{page.eyebrow}</p>
        <h1 className={styles.pageTitle}>{page.title}</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '24px' }}>
          {page.subtitle}
        </p>

        <div className={styles.stack}>
          {page.sections.map(section => (
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
