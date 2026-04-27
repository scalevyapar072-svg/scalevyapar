import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanyPanelClient } from '../panel/company-panel-client'

export default async function LabourCompanySigninPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/signin">
      <section className={styles.heroGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>{content.signinPage.eyebrow}</p>
          <h1 className={styles.pageTitle}>{content.signinPage.title}</h1>
          <p className={styles.textMuted} style={{ maxWidth: '650px', marginBottom: '24px' }}>{content.signinPage.subtitle}</p>
          <div className={styles.buttonRow}>
            <a href={content.signinPage.primaryCtaHref} className={styles.primaryButton} style={{ background: content.theme.accentColor, color: '#ffffff', border: '1px solid transparent' }}>
              {content.signinPage.primaryCtaLabel}
            </a>
            <a href={content.signinPage.secondaryCtaHref} className={styles.secondaryButton}>
              {content.signinPage.secondaryCtaLabel}
            </a>
          </div>
        </div>

        <div className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor}, ${content.theme.highlightColor})` }}>
          <p className={styles.sectionTitle} style={{ color: '#ffffff', fontSize: '26px' }}>{content.signinPage.infoTitle}</p>
          <p className={styles.textMutedDark} style={{ marginBottom: '18px' }}>{content.signinPage.infoDescription}</p>
          <div className={styles.stack}>
            {content.signinPage.benefits.map(item => (
              <div key={item} className={styles.bullet} style={{ color: '#ffffff' }}>
                <span className={styles.bulletDot} style={{ background: '#ffffff' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.splitGrid}>
        <div className={styles.formBox}>
          <CompanyPanelClient signinMode />
        </div>

        <div className={styles.card}>
          <p style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '24px', fontWeight: '900' }}>New company?</p>
          <p className={styles.textMuted} style={{ marginBottom: '18px' }}>
            Start from the public company enquiry form if you are not already activated in the system.
          </p>
          <div className={styles.stack}>
            <a href="/labour/company#company-intake" className={styles.secondaryButton}>Open company enquiry</a>
            <a href="/labour/company/contact" className={styles.secondaryButton}>Talk to support</a>
            <a href="/labour/company/pricing" className={styles.secondaryButton}>See pricing</a>
          </div>
        </div>
      </section>
    </CompanySiteShell>
  )
}
