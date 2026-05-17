import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('home')
}

export default async function HomePage() {
  const { content } = await getSafeMainWebsiteContent()
  const theme = content.theme

  return (
    <>
      <Navbar content={content} />
      <main style={{ background: theme.backgroundColor, color: '#0f172a', fontFamily: theme.fontFamily || 'system-ui, sans-serif' }}>
        <section
          style={{
            background: theme.primaryColor,
            padding: '72px 20px',
            overflow: 'hidden'
          }}
        >
          <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '12px', fontWeight: 800, marginBottom: '18px' }}>
                {content.home.heroEyebrow}
              </span>
              <h1 style={{ margin: '0 0 16px', color: 'white', fontSize: 'clamp(40px, 6vw, 66px)', lineHeight: 1.02 }}>
                {content.home.heroTitle}{' '}
                <span style={{ color: '#dbeafe' }}>{content.home.heroHighlightedText}</span>
              </h1>
              <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.76)', fontSize: '17px', lineHeight: 1.75, maxWidth: '620px' }}>
                {content.home.heroDescription}
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href={content.home.heroPrimaryButton.href} style={primaryLinkStyle(theme.primaryColor)}>
                  {content.home.heroPrimaryButton.label}
                </Link>
                <Link href={content.home.heroSecondaryButton.href} style={secondaryLinkStyle()}>
                  {content.home.heroSecondaryButton.label}
                </Link>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              {content.home.heroDesktopImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.home.heroDesktopImage} alt={content.home.heroTitle} style={{ width: '100%', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.26)' }} />
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {content.home.stats.slice(0, 3).map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '18px' }}>
                    <div style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>{item.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px', lineHeight: 1.5 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '26px 20px 0' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {content.home.stats.map(item => (
                <div key={`summary-${item.label}`} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '22px', textAlign: 'center' }}>
                  <div style={{ color: theme.primaryColor, fontSize: '30px', fontWeight: 900, marginBottom: '6px' }}>{item.value}</div>
                  <div style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '86px 20px 0' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '42px' }}>
              <span style={eyebrowStyle(theme.accentColor)}>Services</span>
              <h2 style={sectionTitleStyle}>{content.home.servicesTitle}</h2>
              <p style={sectionCopyStyle}>{content.home.servicesDescription}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {content.home.serviceCards.map(card => (
                <article key={card.title} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.06)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '52px', height: '52px', padding: '0 14px', borderRadius: '16px', background: `${theme.accentColor}12`, color: theme.accentColor, fontWeight: 900, marginBottom: '16px' }}>
                    {card.icon || card.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '21px' }}>{card.title}</h3>
                      {card.badge ? <span style={{ padding: '4px 10px', borderRadius: '999px', background: `${theme.primaryColor}12`, color: theme.primaryColor, fontSize: '11px', fontWeight: 800 }}>{card.badge}</span> : null}
                    </div>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{card.description}</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {card.bullets.map(bullet => (
                        <div key={bullet} style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>- {bullet}</div>
                      ))}
                    </div>
                    {card.href ? (
                      <Link href={card.href} style={{ color: theme.accentColor, fontWeight: 800, fontSize: '14px', textDecoration: 'none' }}>
                        Learn more
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '86px 20px 0' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '34px' }}>
              <span style={eyebrowStyle(theme.accentColor)}>Process</span>
              <h2 style={sectionTitleStyle}>{content.home.processTitle}</h2>
              <p style={sectionCopyStyle}>{content.home.processDescription}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              {content.home.processSteps.map((item, index) => (
                <div key={item.title} style={{ borderRadius: '22px', background: '#f8fafc', padding: '22px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '999px', background: theme.primaryColor, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '14px' }}>
                    {index + 1}
                  </div>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '19px' }}>{item.title}</h3>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '86px 20px 0' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '38px' }}>
              <span style={eyebrowStyle(theme.accentColor)}>Testimonials</span>
              <h2 style={sectionTitleStyle}>{content.home.testimonialsTitle}</h2>
              <p style={sectionCopyStyle}>{content.home.testimonialsDescription}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {content.home.testimonials.map(item => (
                <div key={item.name} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                  <div style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '1px', marginBottom: '12px' }}>*****</div>
                  <p style={{ margin: '0 0 18px', color: '#475569', lineHeight: 1.75 }}>&quot;{item.quote}&quot;</p>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{item.business}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {content.home.faqItems.length ? (
          <section style={{ padding: '86px 20px 0' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span style={eyebrowStyle(theme.accentColor)}>FAQ</span>
                <h2 style={sectionTitleStyle}>{content.home.faqTitle}</h2>
              </div>
              <div style={{ display: 'grid', gap: '18px' }}>
                {content.home.faqItems.map(item => (
                  <div key={item.question} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px' }}>{item.question}</h3>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ padding: '86px 20px 80px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', background: theme.primaryColor, color: 'white', borderRadius: '32px', padding: '42px 28px', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '12px', fontWeight: 800, marginBottom: '14px' }}>
              {content.home.ctaEyebrow}
            </span>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.08 }}>{content.home.ctaTitle}</h2>
            <p style={{ margin: '0 auto 24px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.75, maxWidth: '720px' }}>{content.home.ctaDescription}</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={content.home.ctaPrimaryButton.href} style={primaryLinkStyle(theme.primaryColor)}>
                {content.home.ctaPrimaryButton.label}
              </Link>
              <Link href={content.home.ctaSecondaryButton.href} style={secondaryLinkStyle()}>
                {content.home.ctaSecondaryButton.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer content={content} />
    </>
  )
}

const sectionTitleStyle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: 'clamp(28px, 4vw, 42px)',
  lineHeight: 1.08
}

const sectionCopyStyle = {
  margin: '0 auto',
  color: '#64748b',
  fontSize: '16px',
  lineHeight: 1.75,
  maxWidth: '720px'
}

const eyebrowStyle = (color: string) => ({
  display: 'inline-flex',
  padding: '7px 14px',
  borderRadius: '999px',
  background: `${color}14`,
  color,
  fontSize: '12px',
  fontWeight: 800,
  marginBottom: '14px'
})

const primaryLinkStyle = (textColor: string) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  padding: '14px 22px',
  background: 'white',
  color: textColor,
  fontSize: '14px',
  fontWeight: 800,
  textDecoration: 'none'
})

const secondaryLinkStyle = () => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  padding: '14px 22px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.16)',
  color: 'white',
  fontSize: '14px',
  fontWeight: 800,
  textDecoration: 'none'
})
