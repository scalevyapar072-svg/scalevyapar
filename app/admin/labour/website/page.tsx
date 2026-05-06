'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LabourCompanyWebsiteContent, LabourCompanyWebsiteSection } from '@/lib/labour-company-website'

type EditorTab = 'theme' | 'headerFooter' | 'home' | 'pricing' | 'search' | 'signin' | 'contact'

const homeSections: LabourCompanyWebsiteSection[] = ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake']

const emptyFeatureCard = {
  title: '',
  description: '',
  bullets: ['']
}

const emptyProcessStep = {
  title: '',
  description: ''
}

const emptyFaqItem = {
  question: '',
  answer: ''
}

const emptyTestimonial = {
  quote: '',
  name: '',
  role: '',
  company: ''
}

const emptyContactCard = {
  title: '',
  description: '',
  ctaLabel: '',
  ctaHref: ''
}

const emptyLink = {
  label: '',
  href: ''
}

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

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '20px',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
}

const labelStyle = {
  fontSize: '11px',
  color: '#475569',
  fontWeight: '700' as const,
  display: 'block' as const,
  marginBottom: '6px'
}

const subtleButtonStyle = {
  background: '#ffffff',
  color: '#334155',
  border: '1px solid #dbe2ea',
  padding: '9px 14px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer'
}

const dangerButtonStyle = {
  background: '#fff1f2',
  color: '#b91c1c',
  border: '1px solid #fecdd3',
  padding: '9px 14px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer'
}

const primaryButtonStyle = {
  background: '#0f172a',
  color: '#ffffff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer'
}

const textareaStyle = { ...inputStyle, resize: 'vertical' as const, minHeight: '88px' }

const tabs: Array<{ id: EditorTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'headerFooter', label: 'Header & Footer' },
  { id: 'home', label: 'Home' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'search', label: 'Search Labour' },
  { id: 'signin', label: 'Sign In' },
  { id: 'contact', label: 'Contact' }
]

function Field({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder = '', rows = 4 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={rows} style={textareaStyle} />
    </div>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>{title}</h2>
        {description ? <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

export default function LabourWebsiteEditorPage() {
  const [content, setContent] = useState<LabourCompanyWebsiteContent | null>(null)
  const [storage, setStorage] = useState<'supabase' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [activeTab, setActiveTab] = useState<EditorTab>('theme')

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
      const response = await fetch('/api/admin/labour/company-website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
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
      setError('Failed to save website content.')
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
        <button onClick={() => void loadContent()} style={primaryButtonStyle}>Retry</button>
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
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Edit the company website in simple fields. Storage: {storage}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/labour" style={{ ...subtleButtonStyle, textDecoration: 'none' }}>Back To Labour Admin</Link>
          <a href="/labour/company" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none' }}>Open Website</a>
          <button onClick={() => void saveContent()} disabled={saving} style={{ ...primaryButtonStyle, background: saving ? '#94a3b8' : '#0f172a', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Website'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '28px 32px 40px', display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...subtleButtonStyle,
                background: activeTab === tab.id ? '#0f172a' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#334155',
                border: activeTab === tab.id ? '1px solid #0f172a' : '1px solid #dbe2ea'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'theme' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Theme" description="Change brand name, tagline and colors used across the whole website.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <Field label="Brand Name" value={content.theme.brandName} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandName: value } } : current)} />
                <Field label="Brand Tagline" value={content.theme.brandTagline} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandTagline: value } } : current)} />
                <Field label="Accent Color" value={content.theme.accentColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, accentColor: value } } : current)} />
                <Field label="Soft Background Color" value={content.theme.accentSoft} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, accentSoft: value } } : current)} />
                <Field label="Highlight Color" value={content.theme.highlightColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, highlightColor: value } } : current)} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'headerFooter' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Header" description="Edit the top announcement, navigation tabs and main button.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Top Announcement" value={content.header.announcement} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcement: value } } : current)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Main Button Label" value={content.header.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryCtaLabel: value } } : current)} />
                  <Field label="Main Button Link" value={content.header.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryCtaHref: value } } : current)} />
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {content.header.navItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} style={{ ...cardStyle, padding: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
                        <Field label={`Tab ${index + 1} Label`} value={item.label} onChange={value => setContent(current => current ? {
                          ...current,
                          header: {
                            ...current.header,
                            navItems: current.header.navItems.map((navItem, navIndex) => navIndex === index ? { ...navItem, label: value } : navItem)
                          }
                        } : current)} />
                        <Field label={`Tab ${index + 1} Link`} value={item.href} onChange={value => setContent(current => current ? {
                          ...current,
                          header: {
                            ...current.header,
                            navItems: current.header.navItems.map((navItem, navIndex) => navIndex === index ? { ...navItem, href: value } : navItem)
                          }
                        } : current)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Footer" description="Edit footer text, contact details and footer links.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <TextAreaField label="Footer Description" value={content.footer.description} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, description: value } } : current)} rows={4} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Support Email" value={content.footer.supportEmail} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, supportEmail: value } } : current)} />
                  <Field label="Phone" value={content.footer.phone} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, phone: value } } : current)} />
                  <Field label="Address" value={content.footer.address} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, address: value } } : current)} />
                  <Field label="Copyright Text" value={content.footer.copyrightText} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, copyrightText: value } } : current)} />
                </div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  {content.footer.linkGroups.map((group, groupIndex) => (
                    <div key={`${group.title}-${groupIndex}`} style={cardStyle}>
                      <Field label={`Footer Column ${groupIndex + 1} Title`} value={group.title} onChange={value => setContent(current => current ? {
                        ...current,
                        footer: {
                          ...current.footer,
                          linkGroups: current.footer.linkGroups.map((linkGroup, index) => index === groupIndex ? { ...linkGroup, title: value } : linkGroup)
                        }
                      } : current)} />
                      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                        {group.links.map((link, linkIndex) => (
                          <div key={`${group.title}-${linkIndex}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                            <Field label={`Link ${linkIndex + 1} Label`} value={link.label} onChange={value => setContent(current => current ? {
                              ...current,
                              footer: {
                                ...current.footer,
                                linkGroups: current.footer.linkGroups.map((linkGroup, currentGroupIndex) => currentGroupIndex === groupIndex ? {
                                  ...linkGroup,
                                  links: linkGroup.links.map((currentLink, currentLinkIndex) => currentLinkIndex === linkIndex ? { ...currentLink, label: value } : currentLink)
                                } : linkGroup)
                              }
                            } : current)} />
                            <Field label={`Link ${linkIndex + 1} URL`} value={link.href} onChange={value => setContent(current => current ? {
                              ...current,
                              footer: {
                                ...current.footer,
                                linkGroups: current.footer.linkGroups.map((linkGroup, currentGroupIndex) => currentGroupIndex === groupIndex ? {
                                  ...linkGroup,
                                  links: linkGroup.links.map((currentLink, currentLinkIndex) => currentLinkIndex === linkIndex ? { ...currentLink, href: value } : currentLink)
                                } : linkGroup)
                              }
                            } : current)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'home' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Home Page Layout" description="Move sections up or down, or hide them from the home page.">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {content.home.sectionOrder.map((section, index) => (
                  <div key={`${section}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '8px 10px' }}>
                    <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: '700' }}>{section}</span>
                    <button onClick={() => {
                      if (index === 0) return
                      const next = [...content.home.sectionOrder]
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: next } } : current)
                    }} style={subtleButtonStyle}>Up</button>
                    <button onClick={() => {
                      if (index === content.home.sectionOrder.length - 1) return
                      const next = [...content.home.sectionOrder]
                      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                      setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: next } } : current)
                    }} style={subtleButtonStyle}>Down</button>
                    <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: current.home.sectionOrder.filter((_, currentIndex) => currentIndex !== index) } } : current)} style={dangerButtonStyle}>Hide</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                {homeSections.filter(section => !content.home.sectionOrder.includes(section)).map(section => (
                  <button key={section} onClick={() => setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: [...current.home.sectionOrder, section] } } : current)} style={subtleButtonStyle}>
                    Show {section}
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Home Hero">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.home.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, eyebrow: value } } } : current)} />
                <TextAreaField label="Hero Title" value={content.home.hero.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, title: value } } } : current)} rows={3} />
                <TextAreaField label="Hero Subtitle" value={content.home.hero.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, subtitle: value } } } : current)} rows={4} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Primary Button Text" value={content.home.hero.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, primaryCtaLabel: value } } } : current)} />
                  <Field label="Primary Button Link" value={content.home.hero.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, primaryCtaHref: value } } } : current)} />
                  <Field label="Secondary Button Text" value={content.home.hero.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, secondaryCtaLabel: value } } } : current)} />
                  <Field label="Secondary Button Link" value={content.home.hero.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, secondaryCtaHref: value } } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Trust Strip">
              <div style={{ display: 'grid', gap: '12px' }}>
                <Field label="Trust Strip Title" value={content.home.trustStrip.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, trustStrip: { ...current.home.trustStrip, title: value } } } : current)} />
                {content.home.trustStrip.items.map((item, index) => (
                  <div key={`${item}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <Field label={`Trust Item ${index + 1}`} value={item} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          trustStrip: {
                            ...current.home.trustStrip,
                            items: current.home.trustStrip.items.map((currentItem, currentIndex) => currentIndex === index ? value : currentItem)
                          }
                        }
                      } : current)} />
                    </div>
                    <button onClick={() => setContent(current => current ? {
                      ...current,
                      home: {
                        ...current.home,
                        trustStrip: {
                          ...current.home.trustStrip,
                          items: current.home.trustStrip.items.filter((_, currentIndex) => currentIndex !== index)
                        }
                      }
                    } : current)} style={dangerButtonStyle}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, trustStrip: { ...current.home.trustStrip, items: [...current.home.trustStrip.items, ''] } } } : current)} style={subtleButtonStyle}>Add Trust Item</button>
              </div>
            </SectionCard>

            <SectionCard title="Feature Cards">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Section Title" value={content.home.features.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, title: value } } } : current)} />
                <TextAreaField label="Section Subtitle" value={content.home.features.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, subtitle: value } } } : current)} rows={3} />
                {content.home.features.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Card ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          features: {
                            ...current.home.features,
                            cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Card ${index + 1} Description`} value={card.description} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          features: {
                            ...current.home.features,
                            cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, description: value } : currentCard)
                          }
                        }
                      } : current)} rows={3} />
                      {card.bullets.map((bullet, bulletIndex) => (
                        <div key={`${card.title}-${bulletIndex}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                          <div style={{ flex: 1 }}>
                            <Field label={`Bullet ${bulletIndex + 1}`} value={bullet} onChange={value => setContent(current => current ? {
                              ...current,
                              home: {
                                ...current.home,
                                features: {
                                  ...current.home.features,
                                  cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? {
                                    ...currentCard,
                                    bullets: currentCard.bullets.map((currentBullet, currentBulletIndex) => currentBulletIndex === bulletIndex ? value : currentBullet)
                                  } : currentCard)
                                }
                              }
                            } : current)} />
                          </div>
                          <button onClick={() => setContent(current => current ? {
                            ...current,
                            home: {
                              ...current.home,
                              features: {
                                ...current.home.features,
                                cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? {
                                  ...currentCard,
                                  bullets: currentCard.bullets.filter((_, currentBulletIndex) => currentBulletIndex !== bulletIndex)
                                } : currentCard)
                              }
                            }
                          } : current)} style={dangerButtonStyle}>Remove</button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            features: {
                              ...current.home.features,
                              cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, bullets: [...currentCard.bullets, ''] } : currentCard)
                            }
                          }
                        } : current)} style={subtleButtonStyle}>Add Bullet</button>
                        <button onClick={() => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            features: {
                              ...current.home.features,
                              cards: current.home.features.cards.filter((_, currentIndex) => currentIndex !== index)
                            }
                          }
                        } : current)} style={dangerButtonStyle}>Remove Card</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, cards: [...current.home.features.cards, emptyFeatureCard] } } } : current)} style={subtleButtonStyle}>Add Feature Card</button>
              </div>
            </SectionCard>

            <SectionCard title="Process Steps">
              <div style={{ display: 'grid', gap: '12px' }}>
                <Field label="Process Section Title" value={content.home.process.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, process: { ...current.home.process, title: value } } } : current)} />
                {content.home.process.steps.map((step, index) => (
                  <div key={`${step.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Step ${index + 1} Title`} value={step.title} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          process: {
                            ...current.home.process,
                            steps: current.home.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, title: value } : currentStep)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Step ${index + 1} Description`} value={step.description} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          process: {
                            ...current.home.process,
                            steps: current.home.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, description: value } : currentStep)
                          }
                        }
                      } : current)} rows={3} />
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          process: {
                            ...current.home.process,
                            steps: current.home.process.steps.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove Step</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, process: { ...current.home.process, steps: [...current.home.process.steps, emptyProcessStep] } } } : current)} style={subtleButtonStyle}>Add Process Step</button>
              </div>
            </SectionCard>

            <SectionCard title="Pricing, CTA and Intake Text">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Pricing Section Title" value={content.home.pricing.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, title: value } } } : current)} />
                <TextAreaField label="Pricing Subtitle" value={content.home.pricing.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, subtitle: value } } } : current)} rows={3} />
                <TextAreaField label="Pricing Footnote" value={content.home.pricing.footnote} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, footnote: value } } } : current)} rows={2} />
                <Field label="Final CTA Title" value={content.home.finalCta.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, title: value } } } : current)} />
                <TextAreaField label="Final CTA Subtitle" value={content.home.finalCta.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, subtitle: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Final CTA Button Text" value={content.home.finalCta.buttonLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, buttonLabel: value } } } : current)} />
                  <Field label="Final CTA Button Link" value={content.home.finalCta.buttonHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, buttonHref: value } } } : current)} />
                </div>
                <Field label="Company Intake Title" value={content.home.intake.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, title: value } } } : current)} />
                <TextAreaField label="Company Intake Description" value={content.home.intake.description} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, description: value } } } : current)} rows={3} />
                <Field label="Company Intake Button Text" value={content.home.intake.submitLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, submitLabel: value } } } : current)} />
              </div>
            </SectionCard>

            <SectionCard title="Testimonials and FAQ">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Testimonial Section Title" value={content.home.testimonials.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonials: { ...current.home.testimonials, title: value } } } : current)} />
                {content.home.testimonials.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <TextAreaField label={`Testimonial ${index + 1} Quote`} value={item.quote} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          testimonials: {
                            ...current.home.testimonials,
                            items: current.home.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, quote: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label="Name" value={item.name} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            testimonials: {
                              ...current.home.testimonials,
                              items: current.home.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, name: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label="Role" value={item.role} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            testimonials: {
                              ...current.home.testimonials,
                              items: current.home.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, role: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label="Company" value={item.company} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            testimonials: {
                              ...current.home.testimonials,
                              items: current.home.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, company: value } : currentItem)
                            }
                          }
                        } : current)} />
                      </div>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          testimonials: {
                            ...current.home.testimonials,
                            items: current.home.testimonials.items.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove Testimonial</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, testimonials: { ...current.home.testimonials, items: [...current.home.testimonials.items, emptyTestimonial] } } } : current)} style={subtleButtonStyle}>Add Testimonial</button>

                <Field label="FAQ Section Title" value={content.home.faq.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, faq: { ...current.home.faq, title: value } } } : current)} />
                {content.home.faq.items.map((item, index) => (
                  <div key={`${item.question}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`FAQ ${index + 1} Question`} value={item.question} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          faq: {
                            ...current.home.faq,
                            items: current.home.faq.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, question: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`FAQ ${index + 1} Answer`} value={item.answer} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          faq: {
                            ...current.home.faq,
                            items: current.home.faq.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, answer: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          faq: {
                            ...current.home.faq,
                            items: current.home.faq.items.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove FAQ</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, faq: { ...current.home.faq, items: [...current.home.faq.items, emptyFaqItem] } } } : current)} style={subtleButtonStyle}>Add FAQ</button>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Pricing Page">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.pricingPage.eyebrow} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.pricingPage.title} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Subtitle" value={content.pricingPage.subtitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, subtitle: value } } : current)} rows={4} />
                <Field label="Popular Badge Text" value={content.pricingPage.badgeText} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, badgeText: value } } : current)} />
                <Field label="Custom Plan Title" value={content.pricingPage.customPlanTitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, customPlanTitle: value } } : current)} />
                <TextAreaField label="Custom Plan Description" value={content.pricingPage.customPlanDescription} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, customPlanDescription: value } } : current)} rows={3} />
                {content.pricingPage.customPlanPoints.map((item, index) => (
                  <div key={`${item}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <Field label={`Custom Plan Point ${index + 1}`} value={item} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          customPlanPoints: current.pricingPage.customPlanPoints.map((currentItem, currentIndex) => currentIndex === index ? value : currentItem)
                        }
                      } : current)} />
                    </div>
                    <button onClick={() => setContent(current => current ? {
                      ...current,
                      pricingPage: {
                        ...current.pricingPage,
                        customPlanPoints: current.pricingPage.customPlanPoints.filter((_, currentIndex) => currentIndex !== index)
                      }
                    } : current)} style={dangerButtonStyle}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, customPlanPoints: [...current.pricingPage.customPlanPoints, ''] } } : current)} style={subtleButtonStyle}>Add Custom Plan Point</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Primary Button Text" value={content.pricingPage.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, primaryCtaLabel: value } } : current)} />
                  <Field label="Primary Button Link" value={content.pricingPage.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, primaryCtaHref: value } } : current)} />
                  <Field label="Secondary Button Text" value={content.pricingPage.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, secondaryCtaLabel: value } } : current)} />
                  <Field label="Secondary Button Link" value={content.pricingPage.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, secondaryCtaHref: value } } : current)} />
                </div>
                <Field label="FAQ Title" value={content.pricingPage.faqTitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, faqTitle: value } } : current)} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'search' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Search Labour Page">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.searchPage.eyebrow} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.searchPage.title} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Subtitle" value={content.searchPage.subtitle} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, subtitle: value } } : current)} rows={4} />
                <TextAreaField label="Helper Text" value={content.searchPage.helperText} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, helperText: value } } : current)} rows={2} />
                <Field label="No Result Title" value={content.searchPage.emptyTitle} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, emptyTitle: value } } : current)} />
                <TextAreaField label="No Result Description" value={content.searchPage.emptyDescription} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, emptyDescription: value } } : current)} rows={3} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'signin' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Sign In Page">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.signinPage.eyebrow} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.signinPage.title} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Subtitle" value={content.signinPage.subtitle} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, subtitle: value } } : current)} rows={4} />
                <Field label="Info Box Title" value={content.signinPage.infoTitle} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, infoTitle: value } } : current)} />
                <TextAreaField label="Info Box Description" value={content.signinPage.infoDescription} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, infoDescription: value } } : current)} rows={3} />
                {content.signinPage.benefits.map((item, index) => (
                  <div key={`${item}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <Field label={`Benefit ${index + 1}`} value={item} onChange={value => setContent(current => current ? {
                        ...current,
                        signinPage: {
                          ...current.signinPage,
                          benefits: current.signinPage.benefits.map((currentItem, currentIndex) => currentIndex === index ? value : currentItem)
                        }
                      } : current)} />
                    </div>
                    <button onClick={() => setContent(current => current ? {
                      ...current,
                      signinPage: {
                        ...current.signinPage,
                        benefits: current.signinPage.benefits.filter((_, currentIndex) => currentIndex !== index)
                      }
                    } : current)} style={dangerButtonStyle}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, benefits: [...current.signinPage.benefits, ''] } } : current)} style={subtleButtonStyle}>Add Benefit</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Primary Button Text" value={content.signinPage.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, primaryCtaLabel: value } } : current)} />
                  <Field label="Primary Button Link" value={content.signinPage.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, primaryCtaHref: value } } : current)} />
                  <Field label="Secondary Button Text" value={content.signinPage.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, secondaryCtaLabel: value } } : current)} />
                  <Field label="Secondary Button Link" value={content.signinPage.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, secondaryCtaHref: value } } : current)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Contact Page">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.contactPage.eyebrow} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.contactPage.title} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Subtitle" value={content.contactPage.subtitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, subtitle: value } } : current)} rows={4} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Support Email" value={content.contactPage.supportEmail} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, supportEmail: value } } : current)} />
                  <Field label="Escalation Email" value={content.contactPage.escalationEmail} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, escalationEmail: value } } : current)} />
                  <Field label="Phone" value={content.contactPage.phone} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, phone: value } } : current)} />
                  <Field label="Address" value={content.contactPage.address} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, address: value } } : current)} />
                </div>
                {content.contactPage.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Contact Card ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          cards: current.contactPage.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                        }
                      } : current)} />
                      <TextAreaField label={`Contact Card ${index + 1} Description`} value={card.description} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          cards: current.contactPage.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, description: value } : currentCard)
                        }
                      } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label="Button Text" value={card.ctaLabel} onChange={value => setContent(current => current ? {
                          ...current,
                          contactPage: {
                            ...current.contactPage,
                            cards: current.contactPage.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, ctaLabel: value } : currentCard)
                          }
                        } : current)} />
                        <Field label="Button Link" value={card.ctaHref} onChange={value => setContent(current => current ? {
                          ...current,
                          contactPage: {
                            ...current.contactPage,
                            cards: current.contactPage.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, ctaHref: value } : currentCard)
                          }
                        } : current)} />
                      </div>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          cards: current.contactPage.cards.filter((_, currentIndex) => currentIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove Contact Card</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, cards: [...current.contactPage.cards, emptyContactCard] } } : current)} style={subtleButtonStyle}>Add Contact Card</button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  )
}
