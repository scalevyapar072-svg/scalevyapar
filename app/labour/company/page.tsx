import { CompanyIntakeForm } from './company-intake-form'
import { CompanySiteShell } from './company-site-shell'
import styles from './company-site.module.css'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent, type LabourCompanyWebsiteSection } from '@/lib/labour-company-website'

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export default async function LabourCompanyHomePage() {
  const [website, snapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot()
  ])

  const content = website.content
  const categories = snapshot.categories.filter(category => category.isActive)
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const liveJobs = snapshot.jobPosts.filter(job => job.status === 'live').length
  const expiredJobs = snapshot.jobPosts.filter(job => job.status === 'expired').length

  const stats = [
    { label: 'Active categories', value: String(categories.length) },
    { label: 'Active workers', value: String(snapshot.stats.activeWorkers) },
    { label: 'Live job posts', value: String(liveJobs) },
    { label: 'Active companies', value: String(snapshot.stats.activeCompanies) }
  ]

  const renderSection = (section: LabourCompanyWebsiteSection) => {
    if (section === 'hero') {
      return (
        <section key={section} className={styles.heroGrid}>
          <div className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor} 0%, #111827 100%)` }}>
            <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.72)' }}>{content.home.hero.eyebrow}</p>
            <h1 className={styles.heroTitle}>{content.home.hero.title}</h1>
            <p className={styles.textMutedDark} style={{ maxWidth: '650px', marginBottom: '24px' }}>{content.home.hero.subtitle}</p>

            <div className={styles.buttonRow} style={{ marginBottom: '24px' }}>
              <a href={content.home.hero.primaryCtaHref} className={styles.primaryButton} style={{ background: content.theme.highlightColor, color: '#ffffff', border: '1px solid transparent' }}>
                {content.home.hero.primaryCtaLabel}
              </a>
              <a href={content.home.hero.secondaryCtaHref} className={styles.secondaryButton}>
                {content.home.hero.secondaryCtaLabel}
              </a>
            </div>

            <div className={styles.fourColGrid} style={{ marginBottom: '24px' }}>
              {stats.map(stat => (
                <div key={stat.label} className={styles.metricCard}>
                  <p className={styles.metricLabel}>{stat.label}</p>
                  <p className={styles.metricValue}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className={styles.chipRow}>
              {categories.map(category => (
                <span key={category.id} className={styles.chip}>{category.name}</span>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.sectionTitle} style={{ fontSize: '26px' }}>Executive hiring snapshot</p>
            <p className={styles.textMuted} style={{ marginBottom: '16px' }}>
              This version is designed to feel more premium and business-ready while still staying editable from labour admin in simple fields.
            </p>

            <div className={styles.stack} style={{ marginBottom: '18px' }}>
              {[
                `Website storage: ${website.storage}`,
                `Live company plans: ${companyPlans.length}`,
                `Expired job posts tracked: ${expiredJobs}`,
                `Wallet balance tracked: ${formatCurrency(snapshot.stats.totalWalletBalance)}`
              ].map(item => (
                <div key={item} className={styles.softCard} style={{ padding: '16px', borderRadius: '18px' }}>
                  <p style={{ margin: 0, color: '#334155', fontSize: '13px', fontWeight: '700' }}>{item}</p>
                </div>
              ))}
            </div>

            <div className={styles.softCard}>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '16px', fontWeight: '900' }}>Company actions</p>
              <div className={styles.stack}>
                <a href="/labour/company/search" className={styles.secondaryButton}>Search labour</a>
                <a href="/labour/company/pricing" className={styles.secondaryButton}>View pricing</a>
                <a href="/labour/company/signin" className={styles.secondaryButton}>Existing company sign in</a>
              </div>
            </div>
          </div>
        </section>
      )
    }

    if (section === 'trust') {
      return (
        <section key={section} className={styles.card}>
          <div className={styles.splitGrid}>
            <div>
              <h2 className={styles.sectionTitle}>{content.home.trustStrip.title}</h2>
              <p className={styles.textMuted}>Use this block to highlight your strongest employer value in simple language.</p>
            </div>
            <div className={styles.twoColGrid}>
              {content.home.trustStrip.items.map(item => (
                <div key={item} className={styles.softCard}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (section === 'features') {
      return (
        <section key={section} className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>{content.home.features.title}</h2>
              <p className={styles.textMuted}>{content.home.features.subtitle}</p>
            </div>
            <a href="/labour/company/search" className={styles.primaryButton} style={{ background: content.theme.accentColor, color: '#ffffff', border: '1px solid transparent' }}>
              Search Workers
            </a>
          </div>

          <div className={styles.threeColGrid}>
            {content.home.features.cards.map(card => (
              <div key={card.title} className={styles.listCard}>
                <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '19px', fontWeight: '900' }}>{card.title}</p>
                <p className={styles.textMuted} style={{ marginBottom: '16px' }}>{card.description}</p>
                <div className={styles.stack}>
                  {card.bullets.map(bullet => (
                    <div key={bullet} className={styles.bullet}>
                      <span className={styles.bulletDot} style={{ background: content.theme.highlightColor }} />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'process') {
      return (
        <section key={section} className={styles.card}>
          <h2 className={styles.sectionTitle}>{content.home.process.title}</h2>
          <div className={styles.fourColGrid}>
            {content.home.process.steps.map((step, index) => (
              <div key={`${step.title}-${index}`} className={styles.softCard}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: content.theme.accentColor, color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', marginBottom: '14px' }}>
                  {index + 1}
                </div>
                <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{step.title}</p>
                <p className={styles.textMuted}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'pricing') {
      return (
        <section key={section} className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>{content.home.pricing.title}</h2>
              <p className={styles.textMuted}>{content.home.pricing.subtitle}</p>
              <p className={styles.textMuted} style={{ fontSize: '12px', marginTop: '6px' }}>{content.home.pricing.footnote}</p>
            </div>
            <a href="/labour/company/pricing" className={styles.secondaryButton}>Open full pricing page</a>
          </div>

          <div className={styles.threeColGrid}>
            {companyPlans.map(plan => (
              <div key={plan.id} className={styles.listCard} style={{ background: plan.categoryId ? content.theme.accentSoft : '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start', marginBottom: '14px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{plan.name}</p>
                    <p className={styles.textMuted}>{plan.description}</p>
                  </div>
                  {plan.categoryId ? (
                    <span className={styles.chip} style={{ background: '#ffffff', color: content.theme.accentColor, border: '1px solid rgba(37,99,235,0.2)' }}>
                      Priority
                    </span>
                  ) : null}
                </div>
                <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '34px', fontWeight: '900' }}>{formatCurrency(plan.planAmount)}</p>
                <p className={styles.textMuted} style={{ fontSize: '12px', marginBottom: '12px' }}>{plan.validityDays} days validity</p>
                <div className={styles.stack}>
                  <span className={styles.textMuted}>Registration fee: {formatCurrency(plan.registrationFee)}</span>
                  <span className={styles.textMuted}>
                    Category: {plan.categoryId ? (categories.find(category => category.id === plan.categoryId)?.name || plan.categoryId) : 'All categories'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'testimonials') {
      return (
        <section key={section} className={styles.card}>
          <h2 className={styles.sectionTitle}>{content.home.testimonials.title}</h2>
          <div className={styles.twoColGrid}>
            {content.home.testimonials.items.map(item => (
              <div key={`${item.name}-${item.company}`} className={styles.listCard}>
                <p style={{ margin: '0 0 18px', color: '#0f172a', fontSize: '19px', lineHeight: 1.7, fontWeight: '700' }}>
                  "{item.quote}"
                </p>
                <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>{item.name}</p>
                <p className={styles.textMuted}>{item.role} | {item.company}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'faq') {
      return (
        <section key={section} className={styles.card}>
          <h2 className={styles.sectionTitle}>{content.home.faq.title}</h2>
          <div className={styles.twoColGrid}>
            {content.home.faq.items.map(item => (
              <div key={item.question} className={styles.softCard}>
                <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{item.question}</p>
                <p className={styles.textMuted}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'cta') {
      return (
        <section key={section} className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor}, ${content.theme.highlightColor})` }}>
          <div className={styles.sectionFooter} style={{ marginBottom: 0 }}>
            <div>
              <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>{content.home.finalCta.title}</h2>
              <p className={styles.textMutedDark}>{content.home.finalCta.subtitle}</p>
            </div>
            <a href={content.home.finalCta.buttonHref} className={styles.secondaryButton}>
              {content.home.finalCta.buttonLabel}
            </a>
          </div>
        </section>
      )
    }

    if (section === 'intake') {
      return (
        <section key={section} id="company-intake" className={styles.splitGrid}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>{content.home.intake.title}</h2>
            <p className={styles.textMuted} style={{ marginBottom: '18px' }}>{content.home.intake.description}</p>
            <div className={styles.stack} style={{ marginBottom: '18px' }}>
              {[
                'Collect company details and first job requirement in one flow',
                'Keep all job posts and pricing plans connected to admin',
                'Make it easy for employers to act from mobile as well'
              ].map(item => (
                <div key={item} className={styles.bullet}>
                  <span className={styles.bulletDot} style={{ background: content.theme.highlightColor }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className={styles.softCard}>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '16px', fontWeight: '900' }}>Current market snapshot</p>
              <div className={styles.stack}>
                <span className={styles.textMuted}>Total active workers: {snapshot.stats.activeWorkers}</span>
                <span className={styles.textMuted}>Active companies: {snapshot.stats.activeCompanies}</span>
                <span className={styles.textMuted}>Live job posts: {liveJobs}</span>
                <span className={styles.textMuted}>Available categories: {categories.length}</span>
              </div>
            </div>
          </div>

          <CompanyIntakeForm
            categories={categories.map(category => ({
              id: category.id,
              name: category.name,
              description: category.description,
              demandLevel: category.demandLevel
            }))}
            plans={companyPlans.map(plan => ({
              id: plan.id,
              name: plan.name,
              planAmount: plan.planAmount,
              registrationFee: plan.registrationFee,
              validityDays: plan.validityDays,
              description: plan.description,
              categoryId: plan.categoryId
            }))}
            heading={content.home.intake.title}
            description={content.home.intake.description}
            submitLabel={content.home.intake.submitLabel}
            accentColor={content.theme.accentColor}
          />
        </section>
      )
    }

    return null
  }

  return (
    <CompanySiteShell content={content} currentPath="/labour/company">
      {content.home.sectionOrder.map(renderSection)}
    </CompanySiteShell>
  )
}
