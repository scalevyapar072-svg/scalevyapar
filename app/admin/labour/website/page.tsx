'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type LabourCompanyWebsiteSection =
  | 'hero'
  | 'trust'
  | 'features'
  | 'process'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'intake'

type LabourCompanyWebsiteContent = {
  theme: {
    brandName: string
    accentColor: string
    accentSoft: string
    highlightColor: string
  }
  sectionOrder: LabourCompanyWebsiteSection[]
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
  }
  trustStrip: {
    title: string
    items: string[]
  }
  features: {
    title: string
    subtitle: string
    cards: Array<{
      title: string
      description: string
      bullets: string[]
    }>
  }
  process: {
    title: string
    steps: Array<{
      title: string
      description: string
    }>
  }
  pricing: {
    title: string
    subtitle: string
    footnote: string
  }
  testimonials: {
    title: string
    items: Array<{
      quote: string
      name: string
      role: string
      company: string
    }>
  }
  faq: {
    title: string
    items: Array<{
      question: string
      answer: string
    }>
  }
  finalCta: {
    title: string
    subtitle: string
    buttonLabel: string
    buttonHref: string
  }
}

const sectionOptions: LabourCompanyWebsiteSection[] = ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake']

const toJson = (value: unknown) => JSON.stringify(value, null, 2)

export default function LabourWebsiteEditorPage() {
  const [content, setContent] = useState<LabourCompanyWebsiteContent | null>(null)
  const [storage, setStorage] = useState<'supabase' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const [trustItemsText, setTrustItemsText] = useState('[]')
  const [featureCardsText, setFeatureCardsText] = useState('[]')
  const [processStepsText, setProcessStepsText] = useState('[]')
  const [testimonialsText, setTestimonialsText] = useState('[]')
  const [faqText, setFaqText] = useState('[]')

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    color: '#0f172a',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  }

  const labelStyle = {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '700' as const,
    display: 'block' as const,
    marginBottom: '6px'
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
  }

  const loadContent = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/company-website', { cache: 'no-store' })
      const data = await response.json().catch(() => ({ error: 'Unexpected response.' }))

      if (!response.ok) {
        setError(data.error || 'Failed to load website content.')
        return
      }

      setContent(data.content)
      setStorage(data.storage || 'json')
      setTrustItemsText(toJson(data.content.trustStrip.items))
      setFeatureCardsText(toJson(data.content.features.cards))
      setProcessStepsText(toJson(data.content.process.steps))
      setTestimonialsText(toJson(data.content.testimonials.items))
      setFaqText(toJson(data.content.faq.items))
    } catch {
      setError('Failed to load website content.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadContent()
  }, [])

  const saveContent = async () => {
    if (!content) return
    setSaving(true)
    setError('')
    setSaved('')

    try {
      const nextContent: LabourCompanyWebsiteContent = {
        ...content,
        trustStrip: {
          ...content.trustStrip,
          items: JSON.parse(trustItemsText)
        },
        features: {
          ...content.features,
          cards: JSON.parse(featureCardsText)
        },
        process: {
          ...content.process,
          steps: JSON.parse(processStepsText)
        },
        testimonials: {
          ...content.testimonials,
          items: JSON.parse(testimonialsText)
        },
        faq: {
          ...content.faq,
          items: JSON.parse(faqText)
        }
      }

      const response = await fetch('/api/admin/labour/company-website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nextContent })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected response.' }))
      if (!response.ok) {
        setError(data.error || 'Failed to save website content.')
        return
      }

      setContent(data.content)
      setStorage(data.storage || 'json')
      setSaved('Website content saved')
      setTimeout(() => setSaved(''), 2500)
    } catch {
      setError('JSON format is invalid or save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading labour website editor...</p>
      </div>
    )
  }

  if (!content) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error || 'Unable to load labour website editor.'}</p>
        <button onClick={() => void loadContent()} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {(error || saved) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999 }}>
          {error || saved}
        </div>
      )}

      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>Company Website Editor</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Edit content, section order and layout blocks for the labour company website. Storage: {storage}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/labour" style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '12px' }}>
            Back To Labour Admin
          </Link>
          <a href="/labour/company" target="_blank" rel="noreferrer" style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '12px' }}>
            Open Website
          </a>
          <button onClick={() => void saveContent()} disabled={saving} style={{ background: saving ? '#94a3b8' : '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '12px' }}>
            {saving ? 'Saving...' : 'Save Website'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 32px 40px', display: 'grid', gap: '20px' }}>
        <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Brand Name</label>
            <input value={content.theme.brandName} onChange={event => setContent(current => current ? { ...current, theme: { ...current.theme, brandName: event.target.value } } : current)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Accent Color</label>
            <input value={content.theme.accentColor} onChange={event => setContent(current => current ? { ...current, theme: { ...current.theme, accentColor: event.target.value } } : current)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Soft Accent</label>
            <input value={content.theme.accentSoft} onChange={event => setContent(current => current ? { ...current, theme: { ...current.theme, accentSoft: event.target.value } } : current)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Highlight Color</label>
            <input value={content.theme.highlightColor} onChange={event => setContent(current => current ? { ...current, theme: { ...current.theme, highlightColor: event.target.value } } : current)} style={inputStyle} />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Section Order</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {content.sectionOrder.map((section, index) => (
              <div key={`${section}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '8px 10px' }}>
                <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: '700' }}>{section}</span>
                <button
                  onClick={() => {
                    if (index === 0) return
                    const next = [...content.sectionOrder]
                    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                    setContent(current => current ? { ...current, sectionOrder: next } : current)
                  }}
                  style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '999px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  Up
                </button>
                <button
                  onClick={() => {
                    if (index === content.sectionOrder.length - 1) return
                    const next = [...content.sectionOrder]
                    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                    setContent(current => current ? { ...current, sectionOrder: next } : current)
                  }}
                  style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '999px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  Down
                </button>
                <button
                  onClick={() => {
                    const next = content.sectionOrder.filter((_, currentIndex) => currentIndex !== index)
                    setContent(current => current ? { ...current, sectionOrder: next } : current)
                  }}
                  style={{ background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', borderRadius: '999px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  Hide
                </button>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '12px' }}>
            Available sections: {sectionOptions.join(', ')}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            {sectionOptions.filter(section => !content.sectionOrder.includes(section)).map(section => (
              <button
                key={section}
                onClick={() => setContent(current => current ? { ...current, sectionOrder: [...current.sectionOrder, section] } : current)}
                style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer', color: '#0f172a', fontSize: '12px', fontWeight: '700' }}
              >
                Show {section}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Hero</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Eyebrow</label>
                <input value={content.hero.eyebrow} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, eyebrow: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <textarea value={content.hero.title} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, title: event.target.value } } : current)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Subtitle</label>
                <textarea value={content.hero.subtitle} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, subtitle: event.target.value } } : current)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Primary CTA Label</label>
                  <input value={content.hero.primaryCtaLabel} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, primaryCtaLabel: event.target.value } } : current)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Primary CTA Href</label>
                  <input value={content.hero.primaryCtaHref} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, primaryCtaHref: event.target.value } } : current)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Secondary CTA Label</label>
                  <input value={content.hero.secondaryCtaLabel} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, secondaryCtaLabel: event.target.value } } : current)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Secondary CTA Href</label>
                  <input value={content.hero.secondaryCtaHref} onChange={event => setContent(current => current ? { ...current, hero: { ...current.hero, secondaryCtaHref: event.target.value } } : current)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Section Titles</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Trust Strip Title</label>
                <input value={content.trustStrip.title} onChange={event => setContent(current => current ? { ...current, trustStrip: { ...current.trustStrip, title: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Features Title</label>
                <input value={content.features.title} onChange={event => setContent(current => current ? { ...current, features: { ...current.features, title: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Features Subtitle</label>
                <textarea value={content.features.subtitle} onChange={event => setContent(current => current ? { ...current, features: { ...current.features, subtitle: event.target.value } } : current)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Process Title</label>
                <input value={content.process.title} onChange={event => setContent(current => current ? { ...current, process: { ...current.process, title: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pricing Title</label>
                <input value={content.pricing.title} onChange={event => setContent(current => current ? { ...current, pricing: { ...current.pricing, title: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pricing Subtitle</label>
                <textarea value={content.pricing.subtitle} onChange={event => setContent(current => current ? { ...current, pricing: { ...current.pricing, subtitle: event.target.value } } : current)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={labelStyle}>Pricing Footnote</label>
                <textarea value={content.pricing.footnote} onChange={event => setContent(current => current ? { ...current, pricing: { ...current.pricing, footnote: event.target.value } } : current)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Trust Strip Items</h2>
            <textarea value={trustItemsText} onChange={event => setTrustItemsText(event.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Feature Cards JSON</h2>
            <textarea value={featureCardsText} onChange={event => setFeatureCardsText(event.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Process Steps JSON</h2>
            <textarea value={processStepsText} onChange={event => setProcessStepsText(event.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Testimonials JSON</h2>
            <textarea value={testimonialsText} onChange={event => setTestimonialsText(event.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>FAQ JSON</h2>
            <textarea value={faqText} onChange={event => setFaqText(event.target.value)} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '18px' }}>Final CTA</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelStyle}>CTA Title</label>
                <input value={content.finalCta.title} onChange={event => setContent(current => current ? { ...current, finalCta: { ...current.finalCta, title: event.target.value } } : current)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CTA Subtitle</label>
                <textarea value={content.finalCta.subtitle} onChange={event => setContent(current => current ? { ...current, finalCta: { ...current.finalCta, subtitle: event.target.value } } : current)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Button Label</label>
                  <input value={content.finalCta.buttonLabel} onChange={event => setContent(current => current ? { ...current, finalCta: { ...current.finalCta, buttonLabel: event.target.value } } : current)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Button Href</label>
                  <input value={content.finalCta.buttonHref} onChange={event => setContent(current => current ? { ...current, finalCta: { ...current.finalCta, buttonHref: event.target.value } } : current)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
