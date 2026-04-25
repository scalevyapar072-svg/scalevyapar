import { CompanyIntakeForm } from './company-intake-form'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourCompanyWebsiteContent, type LabourCompanyWebsiteSection } from '@/lib/labour-company-website'

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const sectionCardStyle = {
  background: '#ffffff',
  border: '1px solid #dbe2ea',
  borderRadius: '28px',
  padding: '28px',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.05)'
}

const linkButtonStyle = (background: string, color: string) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '48px',
  padding: '12px 18px',
  borderRadius: '14px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '800',
  background,
  color,
  border: background === '#ffffff' ? '1px solid #dbe2ea' : '1px solid transparent'
})

export default async function LabourCompanyPage() {
  const [snapshot, website] = await Promise.all([
    getLabourMarketplaceSnapshot(),
    getLabourCompanyWebsiteContent()
  ])

  const content = website.content
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const categories = snapshot.categories.filter(category => category.isActive)
  const liveJobs = snapshot.jobPosts.filter(jobPost => jobPost.status === 'live').length
  const expiredJobs = snapshot.jobPosts.filter(jobPost => jobPost.status === 'expired').length

  const stats = [
    { label: 'Active categories', value: String(categories.length) },
    { label: 'Active workers', value: String(snapshot.stats.activeWorkers) },
    { label: 'Live job posts', value: String(liveJobs) },
    { label: 'Active companies', value: String(snapshot.stats.activeCompanies) }
  ]

  const renderSection = (section: LabourCompanyWebsiteSection) => {
    if (section === 'hero') {
      return (
        <section key={section} style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: '24px', alignItems: 'stretch' }}>
          <div style={{ background: `linear-gradient(135deg, ${content.theme.accentColor} 0%, #111827 100%)`, color: '#ffffff', borderRadius: '32px', padding: '34px', position: 'relative', overflow: 'hidden', boxShadow: '0 28px 70px rgba(15, 23, 42, 0.18)' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${content.theme.highlightColor}33, transparent 34%), radial-gradient(circle at bottom left, ${content.theme.accentSoft}, transparent 30%)` }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', marginBottom: '18px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: content.theme.highlightColor }} />
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{content.hero.eyebrow}</span>
              </div>

              <h1 style={{ margin: '0 0 16px', fontSize: '48px', lineHeight: 1.02, fontWeight: '900', maxWidth: '720px' }}>
                {content.hero.title}
              </h1>
              <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.78)', fontSize: '17px', lineHeight: 1.75, maxWidth: '650px' }}>
                {content.hero.subtitle}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
                <a href={content.hero.primaryCtaHref} style={linkButtonStyle(content.theme.highlightColor, '#ffffff')}>
                  {content.hero.primaryCtaLabel}
                </a>
                <a href={content.hero.secondaryCtaHref} style={linkButtonStyle('#ffffff', '#0f172a')}>
                  {content.hero.secondaryCtaLabel}
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {stats.map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '18px', padding: '16px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.58)' }}>{stat.label}</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.map(category => (
                  <span key={category.id} style={{ padding: '10px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: '700' }}>
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, padding: '24px', display: 'grid', gap: '18px', alignContent: 'start' }}>
            <div>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '20px', fontWeight: '900' }}>Hiring dashboard preview</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
                This landing page is fully editable from labour admin. You can change colors, section order, headings, FAQs and CTA blocks without touching code.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                `Storage mode: ${website.storage}`,
                `Company plans live: ${companyPlans.length}`,
                `Expired job posts tracked: ${expiredJobs}`,
                `Current wallet balance: ${formatCurrency(snapshot.stats.totalWalletBalance)}`
              ].map(item => (
                <div key={item} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px 16px', color: '#334155', fontSize: '13px', fontWeight: '700' }}>
                  {item}
                </div>
              ))}
            </div>

            <div style={{ background: content.theme.accentSoft, border: `1px solid ${content.theme.highlightColor}30`, borderRadius: '22px', padding: '20px' }}>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '15px', fontWeight: '800' }}>Made for practical labour hiring</p>
              <p style={{ margin: 0, color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
                Inspired by modern employer landing pages, but adapted for ScaleVyapar’s market: stitching karighar, embroidery worker, electrician, printer labour, machine setup and daily-basis workforce demand.
              </p>
            </div>
          </div>
        </section>
      )
    }

    if (section === 'trust') {
      return (
        <section key={section} style={{ ...sectionCardStyle, display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: '20px', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '24px', fontWeight: '900' }}>{content.trustStrip.title}</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
              Use this strip to highlight your strongest value proposition for employers and contractors.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            {content.trustStrip.items.map(item => (
              <div key={item} style={{ padding: '16px 18px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '14px', fontWeight: '700' }}>
                {item}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'features') {
      return (
        <section key={section} style={{ ...sectionCardStyle, padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{content.features.title}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.7, maxWidth: '760px' }}>{content.features.subtitle}</p>
            </div>
            <a href="#company-intake" style={linkButtonStyle(content.theme.accentColor, '#ffffff')}>
              Start Company Intake
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            {content.features.cards.map(card => (
              <div key={card.title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '22px', boxShadow: '0 14px 32px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: content.theme.accentSoft, color: content.theme.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', marginBottom: '14px' }}>
                  {card.title.slice(0, 2).toUpperCase()}
                </div>
                <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{card.title}</p>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>{card.description}</p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {card.bullets.map(bullet => (
                    <div key={bullet} style={{ display: 'flex', gap: '10px', alignItems: 'start', color: '#334155', fontSize: '13px', lineHeight: 1.6 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: content.theme.highlightColor, marginTop: '7px', flexShrink: 0 }} />
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
        <section key={section} style={{ ...sectionCardStyle, padding: '30px' }}>
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{content.process.title}</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Reorder or rewrite these steps from the website editor any time.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
            {content.process.steps.map((step, index) => (
              <div key={`${step.title}-${index}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '22px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: content.theme.accentColor, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', marginBottom: '14px' }}>
                  {index + 1}
                </div>
                <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '17px', fontWeight: '900' }}>{step.title}</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'pricing') {
      return (
        <section key={section} id="pricing" style={{ ...sectionCardStyle, padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{content.pricing.title}</p>
              <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>{content.pricing.subtitle}</p>
              <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{content.pricing.footnote}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            {companyPlans.map(plan => (
              <div key={plan.id} style={{ background: plan.categoryId ? content.theme.accentSoft : '#ffffff', border: `1px solid ${plan.categoryId ? `${content.theme.highlightColor}30` : '#e2e8f0'}`, borderRadius: '24px', padding: '22px', boxShadow: '0 14px 32px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', marginBottom: '14px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>{plan.name}</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>{plan.description}</p>
                  </div>
                  {plan.categoryId ? (
                    <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', background: '#ffffff', color: content.theme.accentColor, fontSize: '11px', fontWeight: '800', border: `1px solid ${content.theme.highlightColor}26` }}>
                      Priority
                    </span>
                  ) : null}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: '900' }}>{formatCurrency(plan.planAmount)}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{plan.validityDays} days validity</p>
                </div>

                <div style={{ display: 'grid', gap: '8px', color: '#334155', fontSize: '13px' }}>
                  <div>Registration fee: {formatCurrency(plan.registrationFee)}</div>
                  <div>Plan audience: Company</div>
                  <div>
                    Category: {plan.categoryId ? (categories.find(category => category.id === plan.categoryId)?.name || plan.categoryId) : 'All categories'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'testimonials') {
      return (
        <section key={section} style={{ ...sectionCardStyle, padding: '30px' }}>
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{content.testimonials.title}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            {content.testimonials.items.map(item => (
              <div key={`${item.name}-${item.company}`} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 14px 32px rgba(15, 23, 42, 0.04)' }}>
                <p style={{ margin: '0 0 18px', color: '#0f172a', fontSize: '18px', lineHeight: 1.7, fontWeight: '700' }}>
                  "{item.quote}"
                </p>
                <div>
                  <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '14px', fontWeight: '900' }}>{item.name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{item.role} • {item.company}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'faq') {
      return (
        <section key={section} style={{ ...sectionCardStyle, padding: '30px' }}>
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>{content.faq.title}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            {content.faq.items.map(item => (
              <div key={item.question} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '22px' }}>
                <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '17px', fontWeight: '900' }}>{item.question}</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (section === 'cta') {
      return (
        <section key={section} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor} 0%, ${content.theme.highlightColor} 100%)`, borderRadius: '32px', padding: '34px', color: '#ffffff', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '720px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '32px', lineHeight: 1.08, fontWeight: '900' }}>{content.finalCta.title}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: '15px', lineHeight: 1.7 }}>{content.finalCta.subtitle}</p>
            </div>
            <a href={content.finalCta.buttonHref} style={linkButtonStyle('#ffffff', '#0f172a')}>
              {content.finalCta.buttonLabel}
            </a>
          </div>
        </section>
      )
    }

    if (section === 'intake') {
      return (
        <section key={section} id="company-intake" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ ...sectionCardStyle, padding: '30px' }}>
            <p style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '28px', fontWeight: '900' }}>Start your company onboarding</p>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
              Use this form to collect company details, choose plans, and create the first job requirement. The enquiry lands directly in labour admin for review.
            </p>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '18px' }}>
              {[
                'Editable from admin website editor',
                'Connected to live company plans',
                'Creates pending company plus draft job post',
                'Made for quick market-level labour hiring'
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'start', color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: content.theme.highlightColor, marginTop: '6px', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '20px' }}>
              <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '15px', fontWeight: '800' }}>Current market snapshot</p>
              <div style={{ display: 'grid', gap: '8px', color: '#475569', fontSize: '13px' }}>
                <div>Total active workers: {snapshot.stats.activeWorkers}</div>
                <div>Active companies: {snapshot.stats.activeCompanies}</div>
                <div>Live job posts: {liveJobs}</div>
                <div>Available categories: {categories.length}</div>
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
            heading="Post company requirement"
            description="Submit your company and first job requirement in one go. The labour admin team can review, approve and publish it from the admin panel."
            submitLabel="Create company enquiry"
            accentColor={content.theme.accentColor}
          />
        </section>
      )
    }

    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, #f8fafc 0%, ${content.theme.accentSoft} 100%)`, fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 28px 56px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: `linear-gradient(135deg, ${content.theme.accentColor}, ${content.theme.highlightColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '900', fontSize: '18px', fontFamily: 'Arial, sans-serif' }}>
              LX
            </div>
            <div>
              <p style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>{content.theme.brandName}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                Company hiring website for labour demand
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/admin/labour/website" style={linkButtonStyle('#ffffff', '#334155')}>
              Website Editor
            </a>
            <a href="/login" style={linkButtonStyle(content.theme.accentColor, '#ffffff')}>
              Existing Client Login
            </a>
          </div>
        </header>

        <main style={{ display: 'grid', gap: '22px' }}>
          {content.sectionOrder.map(renderSection)}
        </main>
      </div>
    </div>
  )
}
