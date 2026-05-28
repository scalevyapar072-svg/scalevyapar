import { AnimatedStats } from './animated-stats'
import { CompanyIntakeForm } from './company-intake-form'
import { CompanySiteShell } from './company-site-shell'
import { HeroServiceShowcase } from './hero-service-showcase'
import { LandingSlider } from './landing-slider'
import { ScrollReveal } from './scroll-reveal'
import styles from './company-site.module.css'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const industryIcons: Record<string, string> = {
  Construction: '🏗',
  Textile: '🧵',
  Factory: '🏭',
  Warehouse: '📦',
  Manufacturing: '⚙',
  Delivery: '🚚',
  Hospitality: '🏨',
  Logistics: '🧭'
}

const industryLabels = Object.keys(industryIcons)

export default async function LabourCompanyHomePage() {
  const [website, snapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot()
  ])

  const content = website.content
  const categories = snapshot.categories.filter(category => category.isActive)
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const liveJobs = snapshot.jobPosts.filter(job => job.status === 'live').length
  const activeCompanies = snapshot.stats.activeCompanies

  const sliderSlides = [
    {
      title: 'Fast Labour Hiring for Businesses',
      text: 'Connect with skilled and unskilled workers instantly across multiple industries.',
      ctaLabel: 'Start Hiring',
      ctaHref: '/labour/company#company-intake'
    },
    {
      title: 'Verified Workforce Marketplace',
      text: 'Access trusted workers and manage hiring professionally through ScaleVyapar Rozgar.',
      ctaLabel: 'Explore Workforce',
      ctaHref: '/labour/company/search'
    },
    {
      title: 'Industry-Wise Labour Solutions',
      text: 'Construction, factory, textile, warehouse, delivery, and manufacturing labour hiring made easy.',
      ctaLabel: 'View Industries',
      ctaHref: '/labour/company#industries'
    },
    {
      title: 'Smart Hiring Dashboard',
      text: 'Track job posts, worker responses, hiring status, and workforce management in one place.',
      ctaLabel: 'Open Dashboard',
      ctaHref: '/labour/company/panel'
    }
  ]

  const homepageStats = [
    { label: 'Companies Registered', value: activeCompanies },
    { label: 'Active Workers', value: snapshot.stats.activeWorkers },
    { label: 'Jobs Posted', value: liveJobs },
    { label: 'Industries Covered', value: industryLabels.length }
  ]

  return (
    <CompanySiteShell content={content} currentPath="/labour/company">
      <ScrollReveal delayMs={40} variant="scale">
        <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          <div className={styles.heroContentCard}>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>ScaleVyapar Rozgar</p>
            <h1 className={styles.heroTitle}>
              Hire Daily-Basis Labour Faster <span className={styles.heroAccentText}>Across Industries</span>
            </h1>
            <p className={styles.textMuted} style={{ maxWidth: '720px', marginBottom: '24px', fontSize: '16px' }}>
              ScaleVyapar Rozgar connects businesses with verified and skilled workers instantly. Post your
              requirement and hire the right workforce for your business anytime, anywhere.
            </p>

            <div className={styles.heroFeatureRow}>
              {[
                'Verified Workers',
                'Instant Responses',
                'Trusted by Businesses'
              ].map(item => (
                <span key={item} className={styles.heroFeatureBadge}>
                  <span className={styles.heroFeatureIcon}>●</span>
                  {item}
                </span>
              ))}
            </div>

            <div className={styles.buttonRow} style={{ marginTop: '26px', marginBottom: '24px' }}>
              <a href="/labour/company/search" className={styles.primaryButton} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: '1px solid transparent' }}>
                Hire Workers Now
              </a>
              <a href="/labour/company#company-intake" className={styles.secondaryButton}>
                Post a Requirement
              </a>
              <a href="/labour/company#company-intake" className={styles.ghostButton}>
                Join as Company
              </a>
            </div>

            <div className={styles.heroMetaGrid}>
              {[
                { label: 'Live categories', value: String(categories.length) },
                { label: 'Active workers', value: String(snapshot.stats.activeWorkers) },
                { label: 'Open jobs', value: String(liveJobs) }
              ].map(item => (
                <div key={item.label} className={styles.heroMetaCard}>
                  <p className={styles.heroMetaLabel}>{item.label}</p>
                  <p className={styles.heroMetaValue}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroServiceShowcase />

          <div className={styles.heroVisualCard}>
            <div className={styles.heroVisualBackdrop} />
            <div className={styles.heroVisualStage}>
              <div className={styles.heroVisualMainCard}>
                <p className={styles.heroVisualTitle}>Professional labour workforce</p>
                <p className={styles.textMuted} style={{ fontSize: '13px' }}>
                  Construction, warehouse, delivery, textile, and manufacturing talent coordinated through one platform.
                </p>
                <div className={styles.heroAvatarRow}>
                  {['🏗', '📦', '🚚', '🏭', '🧵'].map(icon => (
                    <span key={icon} className={styles.heroAvatarBadge}>{icon}</span>
                  ))}
                </div>
              </div>

              <div className={styles.heroFloatCard} style={{ top: '10%', right: '-4%' }}>
                <p className={styles.heroFloatValue}>50,000+</p>
                <p className={styles.heroFloatLabel}>Active Workers</p>
              </div>
              <div className={styles.heroFloatCard} style={{ bottom: '16%', left: '-2%' }}>
                <p className={styles.heroFloatValue}>10,000+</p>
                <p className={styles.heroFloatLabel}>Companies</p>
              </div>
              <div className={styles.heroFloatCard} style={{ bottom: '-2%', right: '12%' }}>
                <p className={styles.heroFloatValue}>1,00,000+</p>
                <p className={styles.heroFloatLabel}>Jobs Completed</p>
              </div>
              <div className={styles.heroFloatCard} style={{ top: '52%', right: '6%' }}>
                <p className={styles.heroFloatValue}>30+</p>
                <p className={styles.heroFloatLabel}>Industries</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroIndustryStrip}>
          {['Construction', 'Manufacturing', 'Warehouse', 'Logistics', 'Hospitality', 'More'].map(label => (
            <span key={label} className={styles.heroIndustryPill}>
              <span className={styles.heroIndustryIcon}>{industryIcons[label] || '✦'}</span>
              {label}
            </span>
          ))}
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={80} variant="left">
        <section className={styles.heroGrid}>
        <LandingSlider slides={sliderSlides} />
        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Executive overview</p>
          <h2 className={styles.sectionTitle}>Built for employers that need speed, clarity, and control</h2>
          <div className={styles.stack} style={{ marginTop: '16px' }}>
            {[
              'Modern employer onboarding connected directly to labour admin and live marketplace data.',
              'Short-validity company plans designed for practical hiring cycles and urgent demand.',
              'One portal for searching labour, submitting requirements, and managing worker responses.'
            ].map(item => (
              <div key={item} className={styles.bullet}>
                <span className={styles.bulletDot} style={{ background: '#2563eb' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={100} variant="right">
        <section id="about" className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>About the platform</p>
            <h2 className={styles.sectionTitle}>Premium labour hiring portal for modern businesses</h2>
            <p className={styles.textMuted}>
              ScaleVyapar Rozgar brings enterprise-grade structure to daily-basis labour discovery, demand posting,
              and hiring coordination while staying fully connected to your existing admin workflows.
            </p>
          </div>
          <span className={styles.chip}>Admin-connected workflow</span>
        </div>

        <div className={styles.threeColGrid}>
          {content.home.features.cards.map(card => (
            <div key={card.title} className={styles.listCard}>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>{card.title}</p>
              <p className={styles.textMuted} style={{ marginBottom: '16px' }}>{card.description}</p>
              <div className={styles.stack}>
                {card.bullets.map(item => (
                  <div key={item} className={styles.bullet}>
                    <span className={styles.bulletDot} style={{ background: '#14b8a6' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={120} variant="scale">
        <section className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Trust & stats</p>
            <h2 className={styles.sectionTitle}>Trusted operational metrics from the live labour ecosystem</h2>
          </div>
          <span className={styles.chip}>Animated counters</span>
        </div>
        <AnimatedStats stats={homepageStats} />
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={140} variant="left">
        <section id="industries" className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Industries</p>
            <h2 className={styles.sectionTitle}>Industry-wise labour solutions</h2>
            <p className={styles.textMuted}>
              Construction, factory, textile, warehouse, delivery, hospitality, logistics, and manufacturing labour hiring made easy.
            </p>
          </div>
          <a href="/labour/company/search" className={styles.secondaryButton}>Explore workforce</a>
        </div>

        <div className={styles.fourColGrid}>
          {industryLabels.map(label => (
            <div key={label} className={styles.listCard}>
              <p style={{ margin: '0 0 12px', fontSize: '30px' }}>{industryIcons[label]}</p>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px', fontWeight: 800 }}>{label}</p>
              <p className={styles.textMuted}>
                Scalable labour sourcing and workforce coordination for {label.toLowerCase()} employers.
              </p>
            </div>
          ))}
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={160} variant="right">
        <section id="process" className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>How it works</p>
            <h2 className={styles.sectionTitle}>From registration to workforce activation</h2>
            <p className={styles.textMuted}>A clean four-step employer process built on the current labour admin architecture.</p>
          </div>
        </div>

        <div className={styles.fourColGrid}>
          {[
            'Register Company',
            'Post Labour Requirement',
            'Get Worker Responses',
            'Hire & Manage Workforce'
          ].map((title, index) => (
            <div key={title} className={styles.softCard}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
                  color: '#ffffff',
                  fontWeight: 900,
                  marginBottom: '14px'
                }}
              >
                {index + 1}
              </div>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px', fontWeight: 800 }}>{title}</p>
              <p className={styles.textMuted}>{content.home.process.steps[index]?.description || 'Seamless employer workflow powered by the existing ScaleVyapar labour system.'}</p>
            </div>
          ))}
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={180} variant="left">
        <section id="features" className={styles.twoColGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Employers</p>
          <h2 className={styles.sectionTitle}>Business-side hiring control</h2>
          <p className={styles.textMuted} style={{ marginBottom: '18px' }}>
            Register your company, choose a plan, post the first requirement, and manage workers through one polished workspace.
          </p>
          <div className={styles.stack}>
            {[
              'Company onboarding with labour categories and plan mapping',
              'Admin-reviewed requirement activation for controlled operations',
              'Dashboard visibility into shortlisted, hired, and reviewed workers'
            ].map(item => (
              <div key={item} className={styles.bullet}>
                <span className={styles.bulletDot} style={{ background: '#2563eb' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.eyebrow} style={{ color: '#14b8a6' }}>Workers</p>
          <h2 className={styles.sectionTitle}>Worker-side response quality</h2>
          <p className={styles.textMuted} style={{ marginBottom: '18px' }}>
            Employers get access to live worker categories, availability, city filters, and application tracking without a disconnected hiring process.
          </p>
          <div className={styles.stack}>
            {[
              'Worker discovery by city, category, and availability',
              'Application status updates powered by existing labour company APIs',
              'Consistent admin visibility into every employer action'
            ].map(item => (
              <div key={item} className={styles.bullet}>
                <span className={styles.bulletDot} style={{ background: '#14b8a6' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={200} variant="scale">
        <section className={styles.card}>
        <div className={styles.sectionFooter}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#2563eb' }}>Commercial plans</p>
            <h2 className={styles.sectionTitle}>Enterprise-ready pricing presentation</h2>
            <p className={styles.textMuted}>Active company plans stay fully connected to the same live labour plan data used in admin.</p>
          </div>
          <a href="/labour/company/pricing" className={styles.secondaryButton}>View full pricing</a>
        </div>

        <div className={styles.threeColGrid}>
          {companyPlans.slice(0, 3).map(plan => (
            <div key={plan.id} className={styles.listCard}>
              <div className={styles.buttonRow} style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
                <span className={styles.chip}>{plan.categoryId ? 'Priority plan' : 'Standard plan'}</span>
                <span className={styles.chip} style={{ background: '#eff6ff', color: '#1d4ed8' }}>{plan.validityDays} days</span>
              </div>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '22px', fontWeight: 800 }}>{plan.name}</p>
              <p className={styles.textMuted} style={{ marginBottom: '16px' }}>{plan.description}</p>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '38px', fontWeight: 900 }}>{formatCurrency(plan.planAmount)}</p>
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
      </ScrollReveal>

      <ScrollReveal delayMs={220} variant="right">
        <section className={styles.darkCard} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)' }}>
        <div className={styles.sectionFooter} style={{ marginBottom: '18px' }}>
          <div>
            <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.72)' }}>Call to action</p>
            <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>Ready to hire faster with ScaleVyapar Rozgar?</h2>
            <p className={styles.textMutedDark}>
              Launch your company profile, publish a labour requirement, and move into a premium dashboard experience backed by the existing ScaleVyapar ecosystem.
            </p>
          </div>
          <div className={styles.buttonRow}>
            <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: '#14b8a6', color: '#ffffff', border: '1px solid transparent' }}>
              Register Company
            </a>
            <a href="/labour/company/signin" className={styles.secondaryButton}>
              Login
            </a>
          </div>
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={240} variant="up">
        <section id="company-intake" className={styles.main}>
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
          heading="Register Company & Post Requirement"
          description="Start with a polished employer intake flow and send your first labour requirement into the existing ScaleVyapar admin review system."
          submitLabel={content.home.intake.submitLabel}
          accentColor={content.theme.accentColor}
        />
        </section>
      </ScrollReveal>
    </CompanySiteShell>
  )
}
