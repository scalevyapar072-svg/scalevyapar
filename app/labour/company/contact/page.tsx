import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export default async function LabourCompanyContactPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/contact">
      <section className={styles.heroGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: content.theme.accentColor }}>{content.contactPage.eyebrow}</p>
          <h1 className={styles.pageTitle}>{content.contactPage.title}</h1>
          <p className={styles.textMuted} style={{ maxWidth: '700px', marginBottom: '24px' }}>{content.contactPage.subtitle}</p>

          <div className={styles.stack}>
            <div className={styles.softCard}>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>Support email</p>
              <p className={styles.textMuted}>{content.contactPage.supportEmail}</p>
            </div>
            <div className={styles.softCard}>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>Escalation email</p>
              <p className={styles.textMuted}>{content.contactPage.escalationEmail}</p>
            </div>
            <div className={styles.softCard}>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>Phone and address</p>
              <p className={styles.textMuted}>{content.contactPage.phone}</p>
              <p className={styles.textMuted}>{content.contactPage.address}</p>
            </div>
          </div>
        </div>

        <div className={styles.formBox}>
          <p style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '24px', fontWeight: '900' }}>Quick contact form</p>
          <p className={styles.textMuted} style={{ marginBottom: '18px' }}>This simple responsive contact block is inspired by customer support pages and works well on mobile too.</p>
          <div className={styles.stack}>
            <input placeholder="Your name" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }} />
            <input placeholder="Mobile number" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }} />
            <input placeholder="Company name" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }} />
            <textarea placeholder="Tell us what you need" rows={5} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px', resize: 'none' }} />
            <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: content.theme.accentColor, color: '#ffffff', border: '1px solid transparent' }}>
              Continue with company enquiry
            </a>
          </div>
        </div>
      </section>

      <section className={styles.twoColGrid}>
        {content.contactPage.cards.map(card => (
          <div key={card.title} className={styles.listCard}>
            <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '20px', fontWeight: '900' }}>{card.title}</p>
            <p className={styles.textMuted} style={{ marginBottom: '18px' }}>{card.description}</p>
            <a href={card.ctaHref} className={styles.secondaryButton}>{card.ctaLabel}</a>
          </div>
        ))}
      </section>
    </CompanySiteShell>
  )
}
