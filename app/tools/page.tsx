import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('services')
}

export default async function ToolsPage() {
  const { content } = await getSafeMainWebsiteContent()
  const theme = content.theme

  return (
    <>
      <Navbar content={content} />
      <main style={{ background: theme.backgroundColor, color: '#0f172a', fontFamily: theme.fontFamily || 'system-ui, sans-serif' }}>
        <section style={{ background: theme.primaryColor, color: 'white', padding: '72px 20px' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
              Services
            </span>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.04 }}>{content.services.pageTitle}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.76)', fontSize: '16px', lineHeight: 1.75, maxWidth: '760px', marginInline: 'auto' }}>
              {content.services.pageDescription}
            </p>
          </div>
        </section>

        <section style={{ padding: '76px 20px 0' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: `${theme.accentColor}14`, color: theme.accentColor, fontSize: '12px', fontWeight: 800, marginBottom: '14px' }}>
                Main website services
              </span>
              <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 42px)', color: '#0f172a' }}>{content.services.sectionTitle}</h2>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75, maxWidth: '720px', marginInline: 'auto' }}>{content.services.sectionDescription}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {content.services.cards.map(card => (
                <article key={card.title} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.06)' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: `${theme.accentColor}12`, color: theme.accentColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, marginBottom: '14px' }}>
                    {card.icon || card.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '22px' }}>{card.title}</h3>
                      {card.badge ? <span style={{ padding: '4px 10px', borderRadius: '999px', background: `${theme.primaryColor}12`, color: theme.primaryColor, fontSize: '11px', fontWeight: 800 }}>{card.badge}</span> : null}
                    </div>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{card.description}</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {card.bullets.map(item => (
                        <div key={item} style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>- {item}</div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '76px 20px 80px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', background: theme.primaryColor, color: 'white', borderRadius: '32px', padding: '42px 28px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 40px)' }}>{content.services.ctaTitle}</h2>
            <p style={{ margin: '0 auto 22px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.75, maxWidth: '720px' }}>{content.services.ctaDescription}</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={content.services.ctaPrimaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'white', color: theme.primaryColor, fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.services.ctaPrimaryButton.label}
              </Link>
              <Link href={content.services.ctaSecondaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'white', fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.services.ctaSecondaryButton.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer content={content} />
    </>
  )
}
