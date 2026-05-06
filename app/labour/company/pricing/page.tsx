import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export default async function LabourCompanyPricingPage() {
  const [website, snapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot()
  ])

  const content = website.content
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const categories = snapshot.categories.filter(category => category.isActive)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/pricing">
      <section className={styles.heroGrid}>
        <div className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor}, #111827)` }}>
          <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.72)' }}>{content.pricingPage.eyebrow}</p>
          <h1 className={styles.heroTitle}>{content.pricingPage.title}</h1>
          <p className={styles.textMutedDark} style={{ maxWidth: '640px', marginBottom: '24px' }}>{content.pricingPage.subtitle}</p>
          <div className={styles.buttonRow}>
            <a href={content.pricingPage.primaryCtaHref} className={styles.primaryButton} style={{ background: content.theme.highlightColor, color: '#ffffff', border: '1px solid transparent' }}>
              {content.pricingPage.primaryCtaLabel}
            </a>
            <a href={content.pricingPage.secondaryCtaHref} className={styles.secondaryButton}>
              {content.pricingPage.secondaryCtaLabel}
            </a>
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.chip} style={{ background: content.theme.accentSoft, color: content.theme.accentColor, border: '1px solid rgba(37,99,235,0.2)', marginBottom: '14px' }}>
            {content.pricingPage.badgeText}
          </span>
          <h2 className={styles.sectionTitle} style={{ fontSize: '26px' }}>{content.pricingPage.customPlanTitle}</h2>
          <p className={styles.textMuted} style={{ marginBottom: '16px' }}>{content.pricingPage.customPlanDescription}</p>
          <div className={styles.stack} style={{ marginBottom: '18px' }}>
            {content.pricingPage.customPlanPoints.map(point => (
              <div key={point} className={styles.bullet}>
                <span className={styles.bulletDot} style={{ background: content.theme.highlightColor }} />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <a href="/labour/company/contact" className={styles.secondaryButton}>Talk to sales</a>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <h2 className={styles.sectionTitle}>Choose from your live company plans</h2>
            <p className={styles.textMuted}>This page follows the simple card-based pricing structure from employer pricing pages, but uses your own labour plans from ScaleVyapar.</p>
          </div>
        </div>

        <div className={styles.threeColGrid}>
          {companyPlans.map((plan, index) => (
            <div key={plan.id} className={styles.listCard} style={{ background: index === 1 ? content.theme.accentSoft : '#ffffff' }}>
              {index === 1 ? (
                <span className={styles.chip} style={{ background: '#ffffff', color: content.theme.accentColor, border: '1px solid rgba(37,99,235,0.2)', marginBottom: '12px' }}>
                  Popular
                </span>
              ) : null}
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '20px', fontWeight: '900' }}>{plan.name}</p>
              <p className={styles.textMuted} style={{ marginBottom: '14px' }}>{plan.description}</p>
              <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '36px', fontWeight: '900' }}>{formatCurrency(plan.planAmount)}</p>
              <p className={styles.textMuted} style={{ fontSize: '12px', marginBottom: '16px' }}>{plan.validityDays} days validity</p>
              <div className={styles.stack} style={{ marginBottom: '18px' }}>
                <span className={styles.textMuted}>Registration fee: {formatCurrency(plan.registrationFee)}</span>
                <span className={styles.textMuted}>Plan audience: Company</span>
                <span className={styles.textMuted}>
                  Category: {plan.categoryId ? (categories.find(category => category.id === plan.categoryId)?.name || plan.categoryId) : 'All categories'}
                </span>
              </div>
              <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: content.theme.accentColor, color: '#ffffff', border: '1px solid transparent', width: '100%' }}>
                Choose plan
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{content.pricingPage.faqTitle}</h2>
        <div className={styles.twoColGrid}>
          {content.home.faq.items.map(item => (
            <div key={item.question} className={styles.softCard}>
              <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{item.question}</p>
              <p className={styles.textMuted}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </CompanySiteShell>
  )
}
