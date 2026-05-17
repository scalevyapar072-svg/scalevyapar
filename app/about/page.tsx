import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('about')
}

export default async function AboutPage() {
  const { content } = await getSafeMainWebsiteContent()
  const theme = content.theme

  return (
    <>
      <Navbar content={content} />
      <main style={{ background: theme.backgroundColor, color: '#0f172a', fontFamily: theme.fontFamily || 'system-ui, sans-serif' }}>
        <section style={{ background: theme.primaryColor, color: 'white', padding: '72px 20px' }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
              {content.about.heroEyebrow}
            </span>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.04 }}>{content.about.heroTitle}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.76)', fontSize: '16px', lineHeight: 1.75, maxWidth: '760px', marginInline: 'auto' }}>
              {content.about.heroDescription}
            </p>
          </div>
        </section>

        <section style={{ padding: '76px 20px 0' }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '30px' }}>
              <h2 style={{ marginTop: 0, fontSize: '30px' }}>{content.about.pageTitle}</h2>
              <p style={{ margin: '0 0 18px', color: '#475569', lineHeight: 1.8 }}>{content.about.companyDescription}</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ padding: '16px 18px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: theme.accentColor, fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>Mission</div>
                  <div style={{ color: '#0f172a', lineHeight: 1.75 }}>{content.about.mission}</div>
                </div>
                <div style={{ padding: '16px 18px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: theme.accentColor, fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>Vision</div>
                  <div style={{ color: '#0f172a', lineHeight: 1.75 }}>{content.about.vision}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {content.about.stats.map(item => (
                <div key={item.label} style={{ background: theme.primaryColor, color: 'white', borderRadius: '22px', padding: '22px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '4px' }}>{item.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.76)', lineHeight: 1.6 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '76px 20px 0' }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '34px' }}>
              <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: `${theme.accentColor}14`, color: theme.accentColor, fontSize: '12px', fontWeight: 800, marginBottom: '14px' }}>
                Values
              </span>
              <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 42px)' }}>What drives our work</h2>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75, maxWidth: '720px', marginInline: 'auto' }}>
                These principles shape how the main ScaleVyapar platform is built and supported.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {content.about.values.map(card => (
                <article key={card.title} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${theme.accentColor}12`, color: theme.accentColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '14px' }}>
                    {card.icon || card.title.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '21px', color: '#0f172a' }}>{card.title}</h3>
                  <p style={{ margin: '0 0 12px', color: '#64748b', lineHeight: 1.75 }}>{card.description}</p>
                  {card.bullets.map(item => (
                    <div key={item} style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>- {item}</div>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '76px 20px 80px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', background: theme.primaryColor, color: 'white', borderRadius: '32px', padding: '40px 28px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 40px)' }}>{content.about.ctaTitle}</h2>
            <p style={{ margin: '0 auto 22px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.75, maxWidth: '720px' }}>{content.about.ctaDescription}</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={content.about.ctaPrimaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'white', color: theme.primaryColor, fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.about.ctaPrimaryButton.label}
              </Link>
              <Link href={content.about.ctaSecondaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'white', fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.about.ctaSecondaryButton.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer content={content} />
    </>
  )
}
