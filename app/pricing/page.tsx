import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingCalculator from './PricingCalculatorClient'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('pricing')
}

export default async function PricingPage() {
  const { content } = await getSafeMainWebsiteContent()
  const theme = content.theme

  return (
    <>
      <Navbar content={content} />
      <main style={{ background: theme.backgroundColor, color: '#0f172a', fontFamily: theme.fontFamily || 'system-ui, sans-serif' }}>
        <section style={{ background: theme.primaryColor, color: 'white', padding: '72px 20px' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
              Pricing
            </span>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.04 }}>{content.pricing.pageTitle}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.76)', fontSize: '16px', lineHeight: 1.75, maxWidth: '760px', marginInline: 'auto' }}>
              {content.pricing.pageDescription}
            </p>
          </div>
        </section>

        <section style={{ padding: '76px 20px 0' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '34px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: `${theme.accentColor}14`, color: theme.accentColor, fontSize: '12px', fontWeight: 800, marginBottom: '14px' }}>
                Plan builder
              </span>
              <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 42px)' }}>{content.pricing.introTitle}</h2>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75, maxWidth: '720px', marginInline: 'auto' }}>{content.pricing.introDescription}</p>
            </div>

            {content.pricing.enabled && content.pricing.plans.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                {content.pricing.plans.map(plan => (
                  <div key={plan.name} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.06)' }}>
                    {plan.badge ? <span style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: '999px', background: `${theme.primaryColor}12`, color: theme.primaryColor, fontSize: '11px', fontWeight: 800, marginBottom: '14px' }}>{plan.badge}</span> : null}
                    <h3 style={{ margin: '0 0 8px', fontSize: '24px' }}>{plan.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '34px', fontWeight: 900, color: theme.primaryColor }}>{plan.price}</span>
                      <span style={{ color: '#64748b' }}>{plan.cadence}</span>
                    </div>
                    <p style={{ margin: '0 0 16px', color: '#64748b', lineHeight: 1.75 }}>{plan.description}</p>
                    <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                      {plan.features.map(item => (
                        <div key={item} style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>- {item}</div>
                      ))}
                    </div>
                    <Link href={plan.buttonHref} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', borderRadius: '14px', padding: '13px 18px', background: theme.primaryColor, color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 800 }}>
                      {plan.buttonLabel}
                    </Link>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '24px' }}>
              <PricingCalculator />
            </div>
          </div>
        </section>

        <section style={{ padding: '76px 20px 0' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '28px' }}>
            <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: 'clamp(26px, 4vw, 38px)' }}>{content.pricing.faqTitle}</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              {content.pricing.faqItems.map(item => (
                <div key={item.question} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px' }}>{item.question}</h3>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '76px 20px 80px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', background: theme.primaryColor, color: 'white', borderRadius: '32px', padding: '42px 28px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 40px)' }}>{content.pricing.ctaTitle}</h2>
            <p style={{ margin: '0 auto 22px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.75, maxWidth: '720px' }}>{content.pricing.ctaDescription}</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={content.pricing.ctaPrimaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'white', color: theme.primaryColor, fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.pricing.ctaPrimaryButton.label}
              </Link>
              <Link href={content.pricing.ctaSecondaryButton.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '14px 22px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'white', fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
                {content.pricing.ctaSecondaryButton.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer content={content} />
    </>
  )
}
