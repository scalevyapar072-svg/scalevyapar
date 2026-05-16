'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  LabourCompanyLegalPageContent,
  LabourCompanyWebsiteContent,
  LabourCompanyWebsiteSection
} from '@/lib/labour-company-website'
import styles from './website-editor.module.css'

type EditorTab = 'theme' | 'headerFooter' | 'home' | 'about' | 'pricing' | 'search' | 'postJob' | 'registerCompany' | 'companyPanel' | 'signin' | 'contact' | 'legal'

const homeSections: LabourCompanyWebsiteSection[] = ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake']

const emptyFeatureCard = {
  icon: '',
  title: '',
  description: '',
  bullets: ['']
}

const emptyProcessStep = {
  icon: '',
  title: '',
  description: ''
}

const emptyStatItem = {
  value: '',
  label: '',
  icon: ''
}

const emptyCategoryCard = {
  icon: '',
  title: '',
  subtitle: '',
  href: ''
}

const emptyFaqItem = {
  question: '',
  answer: ''
}

const emptyTestimonial = {
  quote: '',
  name: '',
  role: '',
  company: '',
  rating: ''
}

const emptyHeroSlide = {
  primaryImageSrc: '',
  secondaryImageSrc: '',
  imageBadgeTitle: '',
  imageBadgeSubtitle: '',
  ratingText: ''
}

const emptyPricingBenefit = {
  icon: '',
  title: '',
  description: ''
}

const emptyPricingPlan = {
  name: '',
  subtitle: '',
  badge: '',
  monthlyPrice: '',
  yearlyPrice: '',
  monthlySuffix: '',
  yearlySuffix: '',
  buttonLabel: '',
  buttonHref: '',
  features: ['']
}

const emptyPricingCompareRow = {
  icon: '',
  feature: '',
  starter: '',
  professional: '',
  enterprise: ''
}

const emptyContactCard = {
  title: '',
  description: '',
  ctaLabel: '',
  ctaHref: ''
}

const emptyContactFeaturePoint = {
  title: '',
  description: ''
}

const emptyContactFaq = {
  question: '',
  answer: ''
}

const emptyLegalSection = {
  title: '',
  body: ''
}

const inputStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #d8e1ee',
  color: '#0f172a',
  fontSize: '14px',
  lineHeight: 1.45,
  padding: '10px 12px',
  borderRadius: '12px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)'
}

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(226, 232, 240, 0.96)',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)'
}

const labelStyle = {
  fontSize: '12px',
  color: '#475569',
  fontWeight: '700' as const,
  display: 'block' as const,
  marginBottom: '6px'
}

const subtleButtonStyle = {
  background: '#ffffff',
  color: '#334155',
  border: '1px solid #d8e1ee',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer'
}

const dangerButtonStyle = {
  background: '#fff1f2',
  color: '#b91c1c',
  border: '1px solid #fecdd3',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer'
}

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
  color: '#ffffff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.16)'
}

const textareaStyle = { ...inputStyle, resize: 'vertical' as const, minHeight: '88px' }

const tabs: Array<{ id: EditorTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'headerFooter', label: 'Header & Footer' },
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'search', label: 'Search Workers' },
  { id: 'postJob', label: 'Post Job' },
  { id: 'registerCompany', label: 'Register Company' },
  { id: 'companyPanel', label: 'Company Panel' },
  { id: 'signin', label: 'Sign In' },
  { id: 'contact', label: 'Contact' },
  { id: 'legal', label: 'Legal Pages' }
]

const homeSectionLabels: Record<LabourCompanyWebsiteSection, string> = {
  hero: 'Hero Section',
  trust: 'Trust Section',
  features: 'Features Section',
  process: 'Process Section',
  pricing: 'Pricing Section',
  testimonials: 'Testimonials Section',
  faq: 'FAQ Section',
  cta: 'CTA Section',
  intake: 'Intake Section'
}

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

function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = '',
  uploadKey,
  onUpload,
  uploading
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  uploadKey: string
  onUpload: (file: File, uploadKey: string) => Promise<void>
  uploading: boolean
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localMessage, setLocalMessage] = useState('')

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={event => {
            setSelectedFile(event.target.files?.[0] || null)
            setLocalMessage('')
          }}
          style={{ fontSize: '12px', color: '#475569', maxWidth: '100%' }}
        />
        <button
          type="button"
          onClick={() => {
            if (!selectedFile) {
              setLocalMessage('Choose an image file first, then click Upload Image.')
              return
            }

            setLocalMessage(`Ready to upload: ${selectedFile.name}`)
            void onUpload(selectedFile, uploadKey)
          }}
          disabled={uploading}
          style={{
            ...primaryButtonStyle,
            opacity: uploading ? 0.65 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>
      {selectedFile ? (
        <p style={{ margin: '8px 0 0', color: '#0f172a', fontSize: '11px', lineHeight: 1.6 }}>
          Selected file: {selectedFile.name}
        </p>
      ) : null}
      {localMessage ? (
        <p style={{ margin: '6px 0 0', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
          {localMessage}
        </p>
      ) : null}
      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '11px', lineHeight: 1.6 }}>
        Choose an image file to upload automatically, or paste a direct image URL/path manually.
      </p>
    </div>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className={styles.sectionCard} style={cardStyle}>
      <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
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
  const [uploadingField, setUploadingField] = useState('')
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

  const uploadWebsiteImage = async (file: File, uploadKey: string) => {
    setUploadingField(uploadKey)
    setError('')
    setSaved('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('assetKey', uploadKey)

      const response = await fetch('/api/admin/labour/company-website/upload', {
        method: 'POST',
        body: formData
      })
      const data = await response.json().catch(() => ({ error: 'Unexpected response.' }))

      if (!response.ok || !data.publicUrl) {
        setError(data.error || 'Failed to upload image.')
        return ''
      }

      setSaved('Image uploaded')
      setTimeout(() => setSaved(''), 2500)
      return data.publicUrl as string
    } catch {
      setError('Failed to upload image.')
      return ''
    } finally {
      setUploadingField('')
    }
  }

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

  const legalPages: Array<{ key: keyof LabourCompanyWebsiteContent['legalPages']; label: string; page: LabourCompanyLegalPageContent }> = [
    { key: 'privacyPolicy', label: 'Privacy Policy', page: content.legalPages.privacyPolicy },
    { key: 'termsOfService', label: 'Terms of Service', page: content.legalPages.termsOfService },
    { key: 'userDataDeletion', label: 'User Data Deletion', page: content.legalPages.userDataDeletion }
  ]

  const activeTabDetails = tabs.find(tab => tab.id === activeTab) ?? tabs[0]
  const hiddenHomeSections = homeSections.filter(section => !content.home.sectionOrder.includes(section))

  return (
    <div className={styles.page} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {(error || saved) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: error ? '#fff1f2' : '#eff6ff', color: error ? '#b91c1c' : '#1d4ed8', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, fontSize: '13px', fontWeight: '700', padding: '12px 20px', borderRadius: '12px', zIndex: 9999 }}>
          {error || saved}
        </div>
      )}

      <div className={styles.frame}>
        <div className={styles.editorShell}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.brandBlock}>
                <div className={styles.brandRow}>
                  <div className={styles.brandMark}>SV</div>
                  <div className={styles.brandText}>
                    <p className={styles.brandTitle}>ScaleVyapar</p>
                    <p className={styles.brandSubtitle}>Company Website Editor</p>
                  </div>
                </div>
                <p className={styles.brandDescription}>Edit the Rozgar company website content and theme.</p>
              </div>

              <nav className={styles.sidebarNav} aria-label="Website editor sections">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${styles.sidebarTab} ${activeTab === tab.id ? styles.sidebarTabActive : ''}`}
                    type="button"
                  >
                    <span className={styles.sidebarTabLabel}>{tab.label}</span>
                    <span className={styles.sidebarTabBadge} />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.headerWrap}>
              <div className={styles.headerCard}>
                <div className={styles.headerCopy}>
                  <p className={styles.headerEyebrow}>{activeTabDetails.label}</p>
                  <h1 className={styles.headerTitle}>Company Website Editor</h1>
                  <p className={styles.headerSubtitle}>Edit the company website in simple fields. Storage: {storage}</p>
                </div>

                <div className={styles.headerActions}>
                  <Link href="/admin/labour" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Back To Labour Admin</Link>
                  <a href="/labour/company" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Open Website</a>
                  <button
                    onClick={() => void saveContent()}
                    disabled={saving}
                    style={{
                      ...primaryButtonStyle,
                      background: saving ? '#94a3b8' : primaryButtonStyle.background,
                      boxShadow: saving ? 'none' : primaryButtonStyle.boxShadow,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Website'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.content}>

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
                  <Field label="Logo Image Path" value={content.header.logoSrc} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, logoSrc: value } } : current)} placeholder="/rozgar-logo-source.png" />
                  <Field label="Logo Width (px)" value={content.header.logoWidth} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, logoWidth: value } } : current)} placeholder="260" />
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
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Legal Footer Links</p>
                  {content.footer.legalLinks.map((link, linkIndex) => (
                    <div key={`${link.label}-${linkIndex}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Legal Link ${linkIndex + 1} Label`} value={link.label} onChange={value => setContent(current => current ? {
                        ...current,
                        footer: {
                          ...current.footer,
                          legalLinks: current.footer.legalLinks.map((currentLink, currentLinkIndex) => currentLinkIndex === linkIndex ? { ...currentLink, label: value } : currentLink)
                        }
                      } : current)} />
                      <Field label={`Legal Link ${linkIndex + 1} URL`} value={link.href} onChange={value => setContent(current => current ? {
                        ...current,
                        footer: {
                          ...current.footer,
                          legalLinks: current.footer.legalLinks.map((currentLink, currentLinkIndex) => currentLinkIndex === linkIndex ? { ...currentLink, href: value } : currentLink)
                        }
                      } : current)} />
                    </div>
                  ))}
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
              <div className={styles.homeLayoutTable}>
                <div className={styles.homeLayoutHead}>
                  <span>Section Name</span>
                  <span>Visibility</span>
                  <span style={{ textAlign: 'right' }}>Order Actions</span>
                </div>
                {content.home.sectionOrder.map((section, index) => (
                  <div key={`${section}-${index}`} className={styles.homeLayoutRow}>
                    <div className={styles.homeLayoutName}>
                      <strong>{homeSectionLabels[section]}</strong>
                      <span>Position {index + 1}</span>
                    </div>
                    <span className={styles.visibilityBadge}>Shown</span>
                    <div className={styles.homeLayoutActions}>
                      <button
                        onClick={() => {
                          if (index === 0) return
                          const next = [...content.home.sectionOrder]
                          ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                          setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: next } } : current)
                        }}
                        style={subtleButtonStyle}
                        type="button"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => {
                          if (index === content.home.sectionOrder.length - 1) return
                          const next = [...content.home.sectionOrder]
                          ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                          setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: next } } : current)
                        }}
                        style={subtleButtonStyle}
                        type="button"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: current.home.sectionOrder.filter((_, currentIndex) => currentIndex !== index) } } : current)}
                        style={dangerButtonStyle}
                        type="button"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.hiddenSections}>
                <div className={styles.sectionHeader}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>Hidden Sections</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>Add hidden homepage sections back into the editor order without changing their saved content.</p>
                </div>
                {hiddenHomeSections.length ? (
                  <div className={styles.hiddenSectionButtons}>
                    {hiddenHomeSections.map(section => (
                      <button
                        key={section}
                        onClick={() => setContent(current => current ? { ...current, home: { ...current.home, sectionOrder: [...current.home.sectionOrder, section] } } : current)}
                        style={subtleButtonStyle}
                        type="button"
                      >
                        Show {homeSectionLabels[section]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.mutedCard}>
                    <p className={styles.mutedText}>All homepage sections are currently visible.</p>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Home Hero" description="Main hero copy, action buttons, image URLs, and badge content for the homepage top section.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.home.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, eyebrow: value } } } : current)} />
                <TextAreaField label="Hero Title" value={content.home.hero.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, title: value } } } : current)} rows={3} />
                <Field label="Highlighted Words" value={content.home.hero.highlightedText} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, highlightedText: value } } } : current)} placeholder="Grow Your Business." />
                <TextAreaField label="Hero Subtitle" value={content.home.hero.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, subtitle: value } } } : current)} rows={4} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Primary Button Text" value={content.home.hero.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, primaryCtaLabel: value } } } : current)} />
                  <Field label="Primary Button Link" value={content.home.hero.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, primaryCtaHref: value } } } : current)} />
                  <Field label="Secondary Button Text" value={content.home.hero.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, secondaryCtaLabel: value } } } : current)} />
                  <Field label="Secondary Button Link" value={content.home.hero.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, secondaryCtaHref: value } } } : current)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <ImageUploadField
                    label="Hero Banner Image"
                    value={content.home.hero.primaryImageSrc}
                    onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, primaryImageSrc: value, secondaryImageSrc: value } } } : current)}
                    placeholder="/worker-hero-reference.png"
                    uploadKey="hero-banner"
                    uploading={uploadingField === 'hero-banner'}
                    onUpload={async file => {
                      const publicUrl = await uploadWebsiteImage(file, 'hero-banner')
                      if (!publicUrl) return
                      setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          hero: {
                            ...current.home.hero,
                            primaryImageSrc: publicUrl,
                            secondaryImageSrc: publicUrl
                          }
                        }
                      } : current)
                    }}
                  />
                  <Field label="Image Badge Title" value={content.home.hero.imageBadgeTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, imageBadgeTitle: value } } } : current)} />
                  <Field label="Image Badge Subtitle" value={content.home.hero.imageBadgeSubtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, hero: { ...current.home.hero, imageBadgeSubtitle: value } } } : current)} />
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Hero Slides</label>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>Add 3 to 5 slides for the right-side banner. Use one banner image per slide. The homepage rotates them every 5 seconds.</p>
                  </div>
                  {content.home.hero.slides.map((slide, index) => (
                    <div key={`hero-slide-${index}`} style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>Slide {index + 1}</strong>
                        {content.home.hero.slides.length > 1 ? (
                          <button
                            onClick={() => setContent(current => current ? {
                              ...current,
                              home: {
                                ...current.home,
                                hero: {
                                  ...current.home.hero,
                                  slides: current.home.hero.slides.filter((_, currentIndex) => currentIndex !== index)
                                }
                              }
                            } : current)}
                            style={dangerButtonStyle}
                          >
                            Remove Slide
                          </button>
                        ) : null}
                      </div>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <ImageUploadField
                            label="Banner Image"
                            value={slide.primaryImageSrc}
                            onChange={value => setContent(current => current ? {
                              ...current,
                              home: {
                                ...current.home,
                                hero: {
                                  ...current.home.hero,
                                  slides: current.home.hero.slides.map((currentSlide, currentIndex) => currentIndex === index ? { ...currentSlide, primaryImageSrc: value, secondaryImageSrc: value } : currentSlide)
                                }
                              }
                            } : current)}
                            placeholder="/worker-hero-reference.png"
                            uploadKey={`hero-slide-${index + 1}`}
                            uploading={uploadingField === `hero-slide-${index + 1}`}
                            onUpload={async file => {
                              const publicUrl = await uploadWebsiteImage(file, `hero-slide-${index + 1}`)
                              if (!publicUrl) return
                              setContent(current => current ? {
                                ...current,
                                home: {
                                  ...current.home,
                                  hero: {
                                    ...current.home.hero,
                                    slides: current.home.hero.slides.map((currentSlide, currentIndex) =>
                                      currentIndex === index
                                        ? { ...currentSlide, primaryImageSrc: publicUrl, secondaryImageSrc: publicUrl }
                                        : currentSlide
                                    )
                                  }
                                }
                              } : current)
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <Field label="Badge Title" value={slide.imageBadgeTitle} onChange={value => setContent(current => current ? {
                            ...current,
                            home: {
                              ...current.home,
                              hero: {
                                ...current.home.hero,
                                slides: current.home.hero.slides.map((currentSlide, currentIndex) => currentIndex === index ? { ...currentSlide, imageBadgeTitle: value } : currentSlide)
                              }
                            }
                          } : current)} />
                          <Field label="Rating Text" value={slide.ratingText} onChange={value => setContent(current => current ? {
                            ...current,
                            home: {
                              ...current.home,
                              hero: {
                                ...current.home.hero,
                                slides: current.home.hero.slides.map((currentSlide, currentIndex) => currentIndex === index ? { ...currentSlide, ratingText: value } : currentSlide)
                              }
                            }
                          } : current)} placeholder="4.8/5" />
                        </div>
                        <TextAreaField label="Badge Subtitle" value={slide.imageBadgeSubtitle} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            hero: {
                              ...current.home.hero,
                              slides: current.home.hero.slides.map((currentSlide, currentIndex) => currentIndex === index ? { ...currentSlide, imageBadgeSubtitle: value } : currentSlide)
                            }
                          }
                        } : current)} rows={3} />
                      </div>
                    </div>
                  ))}
                  {content.home.hero.slides.length < 5 ? (
                    <button
                      onClick={() => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          hero: {
                            ...current.home.hero,
                            slides: [...current.home.hero.slides, emptyHeroSlide]
                          }
                        }
                      } : current)}
                      style={subtleButtonStyle}
                    >
                      Add Hero Slide
                    </button>
                  ) : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Search Section and Stats" description="Control the search strip text and the four homepage stats shown below the hero.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Search Section Title" value={content.home.searchBar.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, searchBar: { ...current.home.searchBar, title: value } } } : current)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Search Placeholder" value={content.home.searchBar.placeholder} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, searchBar: { ...current.home.searchBar, placeholder: value } } } : current)} />
                  <Field label="Category Label" value={content.home.searchBar.categoryLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, searchBar: { ...current.home.searchBar, categoryLabel: value } } } : current)} />
                  <Field label="City Label" value={content.home.searchBar.cityLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, searchBar: { ...current.home.searchBar, cityLabel: value } } } : current)} />
                  <Field label="Search Button Label" value={content.home.searchBar.buttonLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, searchBar: { ...current.home.searchBar, buttonLabel: value } } } : current)} />
                </div>
                {content.home.stats.items.map((item, index) => (
                  <div key={`${item.label}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Stat ${index + 1} Number`} value={item.value} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          stats: {
                            ...current.home.stats,
                            items: current.home.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, value } : currentItem)
                          }
                        }
                      } : current)} />
                      <Field label={`Stat ${index + 1} Label`} value={item.label} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          stats: {
                            ...current.home.stats,
                            items: current.home.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, label: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <Field label={`Stat ${index + 1} Icon`} value={item.icon} onChange={value => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          stats: {
                            ...current.home.stats,
                            items: current.home.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, icon: value } : currentItem)
                          }
                        }
                      } : current)} placeholder="users / building / clipboard / sparkles" />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, stats: { ...current.home.stats, items: [...current.home.stats.items, emptyStatItem] } } } : current)} style={subtleButtonStyle}>Add Stat</button>
                  {content.home.stats.items.length > 1 ? (
                    <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, stats: { ...current.home.stats, items: current.home.stats.items.slice(0, -1) } } } : current)} style={dangerButtonStyle}>Remove Last Stat</button>
                  ) : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Trust Points" description="Short trust labels shown under the hero buttons.">
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

            <SectionCard title="Why Choose Section" description="Edit the section eyebrow, title, subtitle, and homepage benefit cards.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.home.features.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, eyebrow: value } } } : current)} />
                <Field label="Section Title" value={content.home.features.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, title: value } } } : current)} />
                <TextAreaField label="Section Subtitle" value={content.home.features.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, features: { ...current.home.features, subtitle: value } } } : current)} rows={3} />
                {content.home.features.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Card ${index + 1} Icon`} value={card.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            features: {
                              ...current.home.features,
                              cards: current.home.features.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, icon: value } : currentCard)
                            }
                          }
                        } : current)} />
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
                      </div>
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

            <SectionCard title="How It Works Section" description="Edit the step-by-step hiring flow content shown in the middle of the homepage.">
              <div style={{ display: 'grid', gap: '12px' }}>
                <Field label="Eyebrow" value={content.home.process.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, process: { ...current.home.process, eyebrow: value } } } : current)} />
                <Field label="Section Title" value={content.home.process.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, process: { ...current.home.process, title: value } } } : current)} />
                {content.home.process.steps.map((step, index) => (
                  <div key={`${step.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Step ${index + 1} Icon`} value={step.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            process: {
                              ...current.home.process,
                              steps: current.home.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, icon: value } : currentStep)
                            }
                          }
                        } : current)} />
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
                      </div>
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

            <SectionCard title="Worker Categories Section" description="Manage the category cards and the main category CTA shown on the homepage.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.home.categories.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, categories: { ...current.home.categories, eyebrow: value } } } : current)} />
                <Field label="Section Title" value={content.home.categories.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, categories: { ...current.home.categories, title: value } } } : current)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="View All Button Text" value={content.home.categories.buttonLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, categories: { ...current.home.categories, buttonLabel: value } } } : current)} />
                  <Field label="View All Button Link" value={content.home.categories.buttonHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, categories: { ...current.home.categories, buttonHref: value } } } : current)} />
                </div>
                {content.home.categories.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Category ${index + 1} Icon`} value={card.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            categories: {
                              ...current.home.categories,
                              cards: current.home.categories.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, icon: value } : currentCard)
                            }
                          }
                        } : current)} />
                        <Field label={`Category ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            categories: {
                              ...current.home.categories,
                              cards: current.home.categories.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                            }
                          }
                        } : current)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Category ${index + 1} Subtitle`} value={card.subtitle} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            categories: {
                              ...current.home.categories,
                              cards: current.home.categories.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, subtitle: value } : currentCard)
                            }
                          }
                        } : current)} />
                        <Field label={`Category ${index + 1} Link`} value={card.href} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            categories: {
                              ...current.home.categories,
                              cards: current.home.categories.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, href: value } : currentCard)
                            }
                          }
                        } : current)} />
                      </div>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        home: {
                          ...current.home,
                          categories: {
                            ...current.home.categories,
                            cards: current.home.categories.cards.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove Category Card</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, home: { ...current.home, categories: { ...current.home.categories, cards: [...current.home.categories.cards, emptyCategoryCard] } } } : current)} style={subtleButtonStyle}>Add Category Card</button>
              </div>
            </SectionCard>

            <SectionCard title="CTA Banner, Worker CTA, Pricing and Intake" description="Edit the banner near the bottom of the homepage, the worker CTA strip, and preserve the existing pricing/intake text fields.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="CTA Eyebrow" value={content.home.finalCta.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, eyebrow: value } } } : current)} />
                <Field label="CTA Title" value={content.home.finalCta.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, title: value } } } : current)} />
                <TextAreaField label="CTA Subtitle" value={content.home.finalCta.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, subtitle: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="CTA Button Text" value={content.home.finalCta.buttonLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, buttonLabel: value } } } : current)} />
                  <Field label="CTA Button Link" value={content.home.finalCta.buttonHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, finalCta: { ...current.home.finalCta, buttonHref: value } } } : current)} />
                </div>
                <Field label="Worker CTA Title" value={content.home.workerCta.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, workerCta: { ...current.home.workerCta, title: value } } } : current)} />
                <TextAreaField label="Worker CTA Description" value={content.home.workerCta.description} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, workerCta: { ...current.home.workerCta, description: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Worker CTA Button Text" value={content.home.workerCta.buttonLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, workerCta: { ...current.home.workerCta, buttonLabel: value } } } : current)} />
                  <Field label="Worker CTA Button Link" value={content.home.workerCta.buttonHref} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, workerCta: { ...current.home.workerCta, buttonHref: value } } } : current)} />
                </div>
                <Field label="Pricing Section Title" value={content.home.pricing.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, title: value } } } : current)} />
                <TextAreaField label="Pricing Subtitle" value={content.home.pricing.subtitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, subtitle: value } } } : current)} rows={3} />
                <TextAreaField label="Pricing Footnote" value={content.home.pricing.footnote} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricing: { ...current.home.pricing, footnote: value } } } : current)} rows={2} />
                <Field label="Company Intake Title" value={content.home.intake.title} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, title: value } } } : current)} />
                <TextAreaField label="Company Intake Description" value={content.home.intake.description} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, description: value } } } : current)} rows={3} />
                <Field label="Company Intake Button Text" value={content.home.intake.submitLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, intake: { ...current.home.intake, submitLabel: value } } } : current)} />
              </div>
            </SectionCard>

            <SectionCard title="Testimonials and FAQ" description="Edit testimonial cards, ratings, and FAQ content without changing any route or workflow logic.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Testimonial Eyebrow" value={content.home.testimonials.eyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonials: { ...current.home.testimonials, eyebrow: value } } } : current)} />
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
                        <Field label="Rating" value={item.rating} onChange={value => setContent(current => current ? {
                          ...current,
                          home: {
                            ...current.home,
                            testimonials: {
                              ...current.home.testimonials,
                              items: current.home.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, rating: value } : currentItem)
                            }
                          }
                        } : current)} placeholder="5" />
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

        {activeTab === 'about' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="About Hero" description="Edit the About Us hero copy, bullet points, floating card, and hero image.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.aboutPage.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, eyebrow: value } } } : current)} />
                <TextAreaField label="Hero Heading" value={content.aboutPage.hero.title} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, title: value } } } : current)} rows={3} />
                <Field label="Highlighted Heading Text" value={content.aboutPage.hero.highlightedText} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, highlightedText: value } } } : current)} />
                <TextAreaField label="Hero Description" value={content.aboutPage.hero.subtitle} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, subtitle: value } } } : current)} rows={4} />
                <ImageUploadField
                  label="Hero Image"
                  value={content.aboutPage.hero.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, imageSrc: value } } } : current)}
                  uploadKey="about-hero-image"
                  onUpload={async (file, uploadKey) => {
                    const publicUrl = await uploadWebsiteImage(file, uploadKey)
                    if (!publicUrl) return
                    setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, imageSrc: publicUrl } } } : current)
                  }}
                  uploading={uploadingField === 'about-hero-image'}
                />
                <Field label="Floating Card Title" value={content.aboutPage.hero.floatingCardTitle} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, floatingCardTitle: value } } } : current)} />

                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Hero Bullet Points</p>
                  {content.aboutPage.hero.bulletPoints.map((point, index) => (
                    <div key={`${point}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                      <div style={{ flex: 1 }}>
                        <Field label={`Bullet ${index + 1}`} value={point} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            hero: {
                              ...current.aboutPage.hero,
                              bulletPoints: current.aboutPage.hero.bulletPoints.map((currentPoint, currentIndex) => currentIndex === index ? value : currentPoint)
                            }
                          }
                        } : current)} />
                      </div>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          hero: {
                            ...current.aboutPage.hero,
                            bulletPoints: current.aboutPage.hero.bulletPoints.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, bulletPoints: [...current.aboutPage.hero.bulletPoints, ''] } } } : current)} style={subtleButtonStyle}>Add Bullet Point</button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Floating Card Labels</p>
                  {content.aboutPage.hero.floatingCardItems.map((item, index) => (
                    <div key={`${item}-${index}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                      <div style={{ flex: 1 }}>
                        <Field label={`Label ${index + 1}`} value={item} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            hero: {
                              ...current.aboutPage.hero,
                              floatingCardItems: current.aboutPage.hero.floatingCardItems.map((currentItem, currentIndex) => currentIndex === index ? value : currentItem)
                            }
                          }
                        } : current)} />
                      </div>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          hero: {
                            ...current.aboutPage.hero,
                            floatingCardItems: current.aboutPage.hero.floatingCardItems.filter((_, currentIndex) => currentIndex !== index)
                          }
                        }
                      } : current)} style={dangerButtonStyle}>Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, hero: { ...current.aboutPage.hero, floatingCardItems: [...current.aboutPage.hero.floatingCardItems, ''] } } } : current)} style={subtleButtonStyle}>Add Floating Label</button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Mission, Vision, Promise and Stats" description="Manage the three mission cards and the dark stats banner on the About Us page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                {content.aboutPage.missionCards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Card ${index + 1} Icon`} value={card.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            missionCards: current.aboutPage.missionCards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, icon: value } : currentCard)
                          }
                        } : current)} />
                        <Field label={`Card ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            missionCards: current.aboutPage.missionCards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                          }
                        } : current)} />
                      </div>
                      <TextAreaField label={`Card ${index + 1} Description`} value={card.description} onChange={value => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          missionCards: current.aboutPage.missionCards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, description: value } : currentCard)
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}

                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Stats Banner</p>
                  {content.aboutPage.stats.items.map((item, index) => (
                    <div key={`${item.label}-${index}`} style={cardStyle}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Stat ${index + 1} Value`} value={item.value} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            stats: {
                              ...current.aboutPage.stats,
                              items: current.aboutPage.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label={`Stat ${index + 1} Label`} value={item.label} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            stats: {
                              ...current.aboutPage.stats,
                              items: current.aboutPage.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, label: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label={`Stat ${index + 1} Icon`} value={item.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            stats: {
                              ...current.aboutPage.stats,
                              items: current.aboutPage.stats.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, icon: value } : currentItem)
                            }
                          }
                        } : current)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Why Choose and How It Works" description="Edit the benefit cards and the step-by-step hiring flow on the About Us page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Why Choose Eyebrow" value={content.aboutPage.whyChoose.eyebrow} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, whyChoose: { ...current.aboutPage.whyChoose, eyebrow: value } } } : current)} />
                <Field label="Why Choose Title" value={content.aboutPage.whyChoose.title} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, whyChoose: { ...current.aboutPage.whyChoose, title: value } } } : current)} />
                {content.aboutPage.whyChoose.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Benefit ${index + 1} Icon`} value={card.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            whyChoose: {
                              ...current.aboutPage.whyChoose,
                              cards: current.aboutPage.whyChoose.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, icon: value } : currentCard)
                            }
                          }
                        } : current)} />
                        <Field label={`Benefit ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            whyChoose: {
                              ...current.aboutPage.whyChoose,
                              cards: current.aboutPage.whyChoose.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                            }
                          }
                        } : current)} />
                      </div>
                      <TextAreaField label={`Benefit ${index + 1} Description`} value={card.description} onChange={value => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          whyChoose: {
                            ...current.aboutPage.whyChoose,
                            cards: current.aboutPage.whyChoose.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, description: value } : currentCard)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}

                <Field label="How It Works Eyebrow" value={content.aboutPage.process.eyebrow} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, process: { ...current.aboutPage.process, eyebrow: value } } } : current)} />
                <Field label="How It Works Title" value={content.aboutPage.process.title} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, process: { ...current.aboutPage.process, title: value } } } : current)} />
                {content.aboutPage.process.steps.map((step, index) => (
                  <div key={`${step.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label={`Step ${index + 1} Icon`} value={step.icon} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            process: {
                              ...current.aboutPage.process,
                              steps: current.aboutPage.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, icon: value } : currentStep)
                            }
                          }
                        } : current)} />
                        <Field label={`Step ${index + 1} Title`} value={step.title} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            process: {
                              ...current.aboutPage.process,
                              steps: current.aboutPage.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, title: value } : currentStep)
                            }
                          }
                        } : current)} />
                      </div>
                      <TextAreaField label={`Step ${index + 1} Description`} value={step.description} onChange={value => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          process: {
                            ...current.aboutPage.process,
                            steps: current.aboutPage.process.steps.map((currentStep, currentIndex) => currentIndex === index ? { ...currentStep, description: value } : currentStep)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Testimonials and Final CTA" description="Manage client testimonials and the closing CTA banner for the About Us page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Testimonials Eyebrow" value={content.aboutPage.testimonials.eyebrow} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, testimonials: { ...current.aboutPage.testimonials, eyebrow: value } } } : current)} />
                <Field label="Testimonials Title" value={content.aboutPage.testimonials.title} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, testimonials: { ...current.aboutPage.testimonials, title: value } } } : current)} />
                {content.aboutPage.testimonials.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <TextAreaField label={`Testimonial ${index + 1} Quote`} value={item.quote} onChange={value => setContent(current => current ? {
                        ...current,
                        aboutPage: {
                          ...current.aboutPage,
                          testimonials: {
                            ...current.aboutPage.testimonials,
                            items: current.aboutPage.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, quote: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <Field label="Name" value={item.name} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            testimonials: {
                              ...current.aboutPage.testimonials,
                              items: current.aboutPage.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, name: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label="Role / Company" value={item.role} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            testimonials: {
                              ...current.aboutPage.testimonials,
                              items: current.aboutPage.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, role: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label="City / Secondary Line" value={item.company} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            testimonials: {
                              ...current.aboutPage.testimonials,
                              items: current.aboutPage.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, company: value } : currentItem)
                            }
                          }
                        } : current)} />
                        <Field label="Rating" value={item.rating} onChange={value => setContent(current => current ? {
                          ...current,
                          aboutPage: {
                            ...current.aboutPage,
                            testimonials: {
                              ...current.aboutPage.testimonials,
                              items: current.aboutPage.testimonials.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, rating: value } : currentItem)
                            }
                          }
                        } : current)} />
                      </div>
                    </div>
                  </div>
                ))}

                <Field label="CTA Title" value={content.aboutPage.finalCta.title} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, title: value } } } : current)} />
                <TextAreaField label="CTA Description" value={content.aboutPage.finalCta.subtitle} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, subtitle: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Primary CTA Label" value={content.aboutPage.finalCta.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, primaryCtaLabel: value } } } : current)} />
                  <Field label="Primary CTA Link" value={content.aboutPage.finalCta.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, primaryCtaHref: value } } } : current)} />
                  <Field label="Secondary CTA Label" value={content.aboutPage.finalCta.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, secondaryCtaLabel: value } } } : current)} />
                  <Field label="Secondary CTA Link" value={content.aboutPage.finalCta.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, aboutPage: { ...current.aboutPage, finalCta: { ...current.aboutPage.finalCta, secondaryCtaHref: value } } } : current)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Pricing Hero" description="Edit the intro section shown at the top of the pricing page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.pricingPage.eyebrow} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, eyebrow: value } } : current)} />
                <TextAreaField label="Hero Title" value={content.pricingPage.title} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Hero Description" value={content.pricingPage.subtitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, subtitle: value } } : current)} rows={4} />
              </div>
            </SectionCard>

            <SectionCard title="Trust Highlights" description="These three compact benefit cards appear under the pricing hero.">
              <div style={{ display: 'grid', gap: '14px' }}>
                {content.pricingPage.benefits.map((item, index) => (
                  <div key={`${item.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Benefit ${index + 1} Icon`} value={item.icon} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          benefits: current.pricingPage.benefits.map((benefit, benefitIndex) => benefitIndex === index ? { ...benefit, icon: value } : benefit)
                        }
                      } : current)} />
                      <Field label={`Benefit ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          benefits: current.pricingPage.benefits.map((benefit, benefitIndex) => benefitIndex === index ? { ...benefit, title: value } : benefit)
                        }
                      } : current)} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <TextAreaField label={`Benefit ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          benefits: current.pricingPage.benefits.map((benefit, benefitIndex) => benefitIndex === index ? { ...benefit, description: value } : benefit)
                        }
                      } : current)} rows={2} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, benefits: [...current.pricingPage.benefits, { ...emptyPricingBenefit }] } } : current)} style={subtleButtonStyle}>Add Benefit Card</button>
              </div>
            </SectionCard>

            <SectionCard title="Billing Toggle" description="Frontend display labels only.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <Field label="Monthly Label" value={content.pricingPage.billing.monthlyLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, billing: { ...current.pricingPage.billing, monthlyLabel: value } } } : current)} />
                <Field label="Yearly Label" value={content.pricingPage.billing.yearlyLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, billing: { ...current.pricingPage.billing, yearlyLabel: value } } } : current)} />
                <Field label="Savings Label" value={content.pricingPage.billing.savingsLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, billing: { ...current.pricingPage.billing, savingsLabel: value } } } : current)} />
                <Field label="Currency Note" value={content.pricingPage.billing.currencyNote} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, billing: { ...current.pricingPage.billing, currencyNote: value } } } : current)} />
              </div>
            </SectionCard>

            <SectionCard title="Pricing Plans" description="Edit each pricing card, badge, prices, buttons, and feature list.">
              <div style={{ display: 'grid', gap: '16px' }}>
                {content.pricingPage.plans.map((plan, index) => (
                  <div key={`${plan.name}-${index}`} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>Plan {index + 1}</p>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.filter((_, planIndex) => planIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove Plan</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label="Plan Name" value={plan.name} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item)
                        }
                      } : current)} />
                      <Field label="Badge Text" value={plan.badge} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, badge: value } : item)
                        }
                      } : current)} />
                      <Field label="Monthly Price" value={plan.monthlyPrice} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, monthlyPrice: value } : item)
                        }
                      } : current)} />
                      <Field label="Yearly Price" value={plan.yearlyPrice} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, yearlyPrice: value } : item)
                        }
                      } : current)} />
                      <Field label="Monthly Suffix" value={plan.monthlySuffix} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, monthlySuffix: value } : item)
                        }
                      } : current)} />
                      <Field label="Yearly Suffix" value={plan.yearlySuffix} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, yearlySuffix: value } : item)
                        }
                      } : current)} />
                      <Field label="Button Label" value={plan.buttonLabel} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, buttonLabel: value } : item)
                        }
                      } : current)} />
                      <Field label="Button Link" value={plan.buttonHref} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, buttonHref: value } : item)
                        }
                      } : current)} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <TextAreaField label="Plan Subtitle" value={plan.subtitle} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: value } : item)
                        }
                      } : current)} rows={2} />
                    </div>
                    <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                      {plan.features.map((feature, featureIndex) => (
                        <div key={`${feature}-${featureIndex}`} style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                          <div style={{ flex: 1 }}>
                            <Field label={`Feature ${featureIndex + 1}`} value={feature} onChange={value => setContent(current => current ? {
                              ...current,
                              pricingPage: {
                                ...current.pricingPage,
                                plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? {
                                  ...item,
                                  features: item.features.map((currentFeature, currentFeatureIndex) => currentFeatureIndex === featureIndex ? value : currentFeature)
                                } : item)
                              }
                            } : current)} />
                          </div>
                          <button onClick={() => setContent(current => current ? {
                            ...current,
                            pricingPage: {
                              ...current.pricingPage,
                              plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? {
                                ...item,
                                features: item.features.filter((_, currentFeatureIndex) => currentFeatureIndex !== featureIndex)
                              } : item)
                            }
                          } : current)} style={dangerButtonStyle}>Remove</button>
                        </div>
                      ))}
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          plans: current.pricingPage.plans.map((item, itemIndex) => itemIndex === index ? { ...item, features: [...item.features, ''] } : item)
                        }
                      } : current)} style={subtleButtonStyle}>Add Feature</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, plans: [...current.pricingPage.plans, { ...emptyPricingPlan }] } } : current)} style={subtleButtonStyle}>Add Pricing Plan</button>
              </div>
            </SectionCard>

            <SectionCard title="Compare Plans Table" description="Edit the comparison title and row values shown below the plans.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Compare Section Title" value={content.pricingPage.compareTitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, compareTitle: value } } : current)} />
                {content.pricingPage.compareRows.map((row, index) => (
                  <div key={`${row.feature}-${index}`} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Compare Row {index + 1}</p>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.filter((_, rowIndex) => rowIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove Row</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label="Icon" value={row.icon} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.map((item, itemIndex) => itemIndex === index ? { ...item, icon: value } : item)
                        }
                      } : current)} />
                      <Field label="Feature" value={row.feature} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.map((item, itemIndex) => itemIndex === index ? { ...item, feature: value } : item)
                        }
                      } : current)} />
                      <Field label="Starter" value={row.starter} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.map((item, itemIndex) => itemIndex === index ? { ...item, starter: value } : item)
                        }
                      } : current)} />
                      <Field label="Professional" value={row.professional} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.map((item, itemIndex) => itemIndex === index ? { ...item, professional: value } : item)
                        }
                      } : current)} />
                      <Field label="Enterprise" value={row.enterprise} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          compareRows: current.pricingPage.compareRows.map((item, itemIndex) => itemIndex === index ? { ...item, enterprise: value } : item)
                        }
                      } : current)} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, compareRows: [...current.pricingPage.compareRows, { ...emptyPricingCompareRow }] } } : current)} style={subtleButtonStyle}>Add Compare Row</button>
              </div>
            </SectionCard>

            <SectionCard title="Pricing FAQs" description="Edit the accordion questions and answers shown on the pricing page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="FAQ Section Title" value={content.pricingPage.faqTitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, faqTitle: value } } : current)} />
                {content.pricingPage.faqs.map((item, index) => (
                  <div key={`${item.question}-${index}`} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>FAQ {index + 1}</p>
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          faqs: current.pricingPage.faqs.filter((_, faqIndex) => faqIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove FAQ</button>
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label="Question" value={item.question} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          faqs: current.pricingPage.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, question: value } : faq)
                        }
                      } : current)} />
                      <TextAreaField label="Answer" value={item.answer} onChange={value => setContent(current => current ? {
                        ...current,
                        pricingPage: {
                          ...current.pricingPage,
                          faqs: current.pricingPage.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, answer: value } : faq)
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, faqs: [...current.pricingPage.faqs, { ...emptyFaqItem }] } } : current)} style={subtleButtonStyle}>Add FAQ</button>
              </div>
            </SectionCard>

            <SectionCard title="Final CTA Banner" description="Edit the final pricing CTA text and button routes.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <TextAreaField label="CTA Title" value={content.pricingPage.finalCta.title} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, title: value } } } : current)} rows={2} />
                <TextAreaField label="CTA Description" value={content.pricingPage.finalCta.subtitle} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, subtitle: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Primary Button Text" value={content.pricingPage.finalCta.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, primaryCtaLabel: value } } } : current)} />
                  <Field label="Primary Button Link" value={content.pricingPage.finalCta.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, primaryCtaHref: value } } } : current)} />
                  <Field label="Secondary Button Text" value={content.pricingPage.finalCta.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, secondaryCtaLabel: value } } } : current)} />
                  <Field label="Secondary Button Link" value={content.pricingPage.finalCta.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, pricingPage: { ...current.pricingPage, finalCta: { ...current.pricingPage.finalCta, secondaryCtaHref: value } } } : current)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'search' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Search Worker Banner" description="Edit the public search page hero copy, trust points, floating card, and banner image.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.searchPage.eyebrow} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.searchPage.title} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, title: value } } : current)} rows={3} />
                <Field label="Highlighted Words" value={content.searchPage.highlightedText} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, highlightedText: value } } : current)} />
                <TextAreaField label="Subtitle" value={content.searchPage.subtitle} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, subtitle: value } } : current)} rows={4} />
                <TextAreaField label="Helper Text" value={content.searchPage.helperText} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, helperText: value } } : current)} rows={2} />
                <ImageUploadField
                  label="Banner Image"
                  value={content.searchPage.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, imageSrc: value } } : current)}
                  placeholder="/worker-hero-reference.png"
                  uploadKey="search-banner"
                  uploading={uploadingField === 'search-banner'}
                  onUpload={async file => {
                    const publicUrl = await uploadWebsiteImage(file, 'search-banner')
                    if (!publicUrl) return
                    setContent(current => current ? {
                      ...current,
                      searchPage: {
                        ...current.searchPage,
                        imageSrc: publicUrl
                      }
                    } : current)
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field
                    label="Trust Point 1"
                    value={content.searchPage.trustPoints[0] || ''}
                    onChange={value => setContent(current => current ? {
                      ...current,
                      searchPage: {
                        ...current.searchPage,
                        trustPoints: [value, current.searchPage.trustPoints[1] || '', current.searchPage.trustPoints[2] || '']
                      }
                    } : current)}
                  />
                  <Field
                    label="Trust Point 2"
                    value={content.searchPage.trustPoints[1] || ''}
                    onChange={value => setContent(current => current ? {
                      ...current,
                      searchPage: {
                        ...current.searchPage,
                        trustPoints: [current.searchPage.trustPoints[0] || '', value, current.searchPage.trustPoints[2] || '']
                      }
                    } : current)}
                  />
                  <Field
                    label="Trust Point 3"
                    value={content.searchPage.trustPoints[2] || ''}
                    onChange={value => setContent(current => current ? {
                      ...current,
                      searchPage: {
                        ...current.searchPage,
                        trustPoints: [current.searchPage.trustPoints[0] || '', current.searchPage.trustPoints[1] || '', value]
                      }
                    } : current)}
                  />
                </div>
                <Field label="Floating Card Title" value={content.searchPage.floatingCardTitle} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, floatingCardTitle: value } } : current)} />
                <TextAreaField label="Floating Card Description" value={content.searchPage.floatingCardDescription} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, floatingCardDescription: value } } : current)} rows={3} />
                <Field label="No Result Title" value={content.searchPage.emptyTitle} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, emptyTitle: value } } : current)} />
                <TextAreaField label="No Result Description" value={content.searchPage.emptyDescription} onChange={value => setContent(current => current ? { ...current, searchPage: { ...current.searchPage, emptyDescription: value } } : current)} rows={3} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'postJob' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Post Job Hero" description="Edit the visible banner content for the public job-post page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Eyebrow Text" value={content.postJobPage.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, eyebrow: value } } } : current)} />
                  <Field label="Dashboard Access Button Label" value={content.postJobPage.hero.dashboardAccessLabel} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, dashboardAccessLabel: value } } } : current)} />
                </div>
                <TextAreaField label="Page Title" value={content.postJobPage.hero.title} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, title: value } } } : current)} rows={3} />
                <TextAreaField label="Page Subtitle" value={content.postJobPage.hero.subtitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, subtitle: value } } } : current)} rows={3} />
                <ImageUploadField
                  label="Hero Image / Illustration Path"
                  value={content.postJobPage.hero.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, imageSrc: value } } } : current)}
                  placeholder="/job-post-hero-illustration.png"
                  uploadKey="post-job-hero"
                  uploading={uploadingField === 'post-job-hero'}
                  onUpload={async file => {
                    const publicUrl = await uploadWebsiteImage(file, 'post-job-hero')
                    if (!publicUrl) return
                    setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, hero: { ...current.postJobPage.hero, imageSrc: publicUrl } } } : current)
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard title="Why Post Sidebar" description="Control the benefit cards shown in the left help column.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Sidebar Title" value={content.postJobPage.sidebarBenefits.title} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, sidebarBenefits: { ...current.postJobPage.sidebarBenefits, title: value } } } : current)} />
                {content.postJobPage.sidebarBenefits.items.map((item, index) => (
                  <div key={`post-benefit-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Benefit ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        postJobPage: {
                          ...current.postJobPage,
                          sidebarBenefits: {
                            ...current.postJobPage.sidebarBenefits,
                            items: current.postJobPage.sidebarBenefits.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Benefit ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        postJobPage: {
                          ...current.postJobPage,
                          sidebarBenefits: {
                            ...current.postJobPage.sidebarBenefits,
                            items: current.postJobPage.sidebarBenefits.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Simple Steps & Help Card" description="Edit the step rail descriptions and support card details.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Steps Section Title" value={content.postJobPage.simpleSteps.title} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, simpleSteps: { ...current.postJobPage.simpleSteps, title: value } } } : current)} />
                {content.postJobPage.simpleSteps.items.map((item, index) => (
                  <div key={`post-step-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Step ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        postJobPage: {
                          ...current.postJobPage,
                          simpleSteps: {
                            ...current.postJobPage.simpleSteps,
                            items: current.postJobPage.simpleSteps.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Step ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        postJobPage: {
                          ...current.postJobPage,
                          simpleSteps: {
                            ...current.postJobPage.simpleSteps,
                            items: current.postJobPage.simpleSteps.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
                <div style={{ ...cardStyle, display: 'grid', gap: '12px' }}>
                  <Field label="Help Card Title" value={content.postJobPage.helpCard.title} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, helpCard: { ...current.postJobPage.helpCard, title: value } } } : current)} />
                  <TextAreaField label="Help Card Description" value={content.postJobPage.helpCard.description} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, helpCard: { ...current.postJobPage.helpCard, description: value } } } : current)} rows={3} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <Field label="Phone Number" value={content.postJobPage.helpCard.phone} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, helpCard: { ...current.postJobPage.helpCard, phone: value } } } : current)} />
                    <Field label="Email" value={content.postJobPage.helpCard.email} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, helpCard: { ...current.postJobPage.helpCard, email: value } } } : current)} />
                    <Field label="Support Hours" value={content.postJobPage.helpCard.supportHours} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, helpCard: { ...current.postJobPage.helpCard, supportHours: value } } } : current)} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Form Section Titles, Buttons & Stats" description="Only visible labels are editable here. Form fields and submit handlers stay unchanged.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Section 1 Title" value={content.postJobPage.formSections.companyDetailsTitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, companyDetailsTitle: value } } } : current)} />
                  <Field label="Section 2 Title" value={content.postJobPage.formSections.jobRequirementTitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, jobRequirementTitle: value } } } : current)} />
                  <Field label="Section 3 Title" value={content.postJobPage.formSections.workDetailsTitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, workDetailsTitle: value } } } : current)} />
                  <Field label="Section 4 Title" value={content.postJobPage.formSections.salaryFacilitiesTitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, salaryFacilitiesTitle: value } } } : current)} />
                  <Field label="Section 5 Title" value={content.postJobPage.formSections.jobDescriptionTitle} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, jobDescriptionTitle: value } } } : current)} />
                </div>
                <TextAreaField label="Section 1 Helper Text" value={content.postJobPage.formSections.companyDetailsHelper} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, companyDetailsHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Section 2 Helper Text" value={content.postJobPage.formSections.jobRequirementHelper} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, jobRequirementHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Section 3 Helper Text" value={content.postJobPage.formSections.workDetailsHelper} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, workDetailsHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Section 4 Helper Text" value={content.postJobPage.formSections.salaryFacilitiesHelper} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, salaryFacilitiesHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Section 5 Helper Text" value={content.postJobPage.formSections.jobDescriptionHelper} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, formSections: { ...current.postJobPage.formSections, jobDescriptionHelper: value } } } : current)} rows={2} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Save Draft Button" value={content.postJobPage.buttonLabels.saveDraft} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, buttonLabels: { ...current.postJobPage.buttonLabels, saveDraft: value } } } : current)} />
                  <Field label="Preview Button" value={content.postJobPage.buttonLabels.previewPost} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, buttonLabels: { ...current.postJobPage.buttonLabels, previewPost: value } } } : current)} />
                  <Field label="Hide Preview Button" value={content.postJobPage.buttonLabels.hidePreview} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, buttonLabels: { ...current.postJobPage.buttonLabels, hidePreview: value } } } : current)} />
                  <Field label="Submit Button" value={content.postJobPage.buttonLabels.submitJobPost} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, buttonLabels: { ...current.postJobPage.buttonLabels, submitJobPost: value } } } : current)} />
                  <Field label="Update Button" value={content.postJobPage.buttonLabels.updateJobPost} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, buttonLabels: { ...current.postJobPage.buttonLabels, updateJobPost: value } } } : current)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Stats Label 1" value={content.postJobPage.statsLabels.verifiedWorkers} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, statsLabels: { ...current.postJobPage.statsLabels, verifiedWorkers: value } } } : current)} />
                  <Field label="Stats Label 2" value={content.postJobPage.statsLabels.companiesTrustUs} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, statsLabels: { ...current.postJobPage.statsLabels, companiesTrustUs: value } } } : current)} />
                  <Field label="Stats Label 3" value={content.postJobPage.statsLabels.jobsPosted} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, statsLabels: { ...current.postJobPage.statsLabels, jobsPosted: value } } } : current)} />
                  <Field label="Stats Label 4" value={content.postJobPage.statsLabels.averageCompanyRating} onChange={value => setContent(current => current ? { ...current, postJobPage: { ...current.postJobPage, statsLabels: { ...current.postJobPage.statsLabels, averageCompanyRating: value } } } : current)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'registerCompany' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Register Company Hero" description="Edit the hero content for the public company registration page.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow Text" value={content.registerCompanyPage.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, eyebrow: value } } } : current)} />
                <TextAreaField label="Page Title" value={content.registerCompanyPage.hero.title} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, title: value } } } : current)} rows={3} />
                <Field label="Highlighted Title Text" value={content.registerCompanyPage.hero.highlightedText} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, highlightedText: value } } } : current)} />
                <TextAreaField label="Page Subtitle" value={content.registerCompanyPage.hero.subtitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, subtitle: value } } } : current)} rows={3} />
                <ImageUploadField
                  label="Hero Image / Illustration Path"
                  value={content.registerCompanyPage.hero.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, imageSrc: value } } } : current)}
                  placeholder="/company-registration-trust-illustration.png"
                  uploadKey="register-company-hero"
                  uploading={uploadingField === 'register-company-hero'}
                  onUpload={async file => {
                    const publicUrl = await uploadWebsiteImage(file, 'register-company-hero')
                    if (!publicUrl) return
                    setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, imageSrc: publicUrl } } } : current)
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Trust Card Title" value={content.registerCompanyPage.hero.trustCardTitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, trustCardTitle: value } } } : current)} />
                  <Field label="Trust Card Rating Text" value={content.registerCompanyPage.hero.trustCardRating} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, hero: { ...current.registerCompanyPage.hero, trustCardRating: value } } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Form Section Titles & Submit Area" description="Only visible form section titles, helper text and submit-area labels are editable.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Company Information Title" value={content.registerCompanyPage.formSections.companyInformationTitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, companyInformationTitle: value } } } : current)} />
                  <Field label="Account Setup Title" value={content.registerCompanyPage.formSections.accountSetupTitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, accountSetupTitle: value } } } : current)} />
                  <Field label="Company Address Title" value={content.registerCompanyPage.formSections.companyAddressTitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, companyAddressTitle: value } } } : current)} />
                  <Field label="Additional Details Title" value={content.registerCompanyPage.formSections.additionalDetailsTitle} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, additionalDetailsTitle: value } } } : current)} />
                </div>
                <TextAreaField label="Company Information Helper Text" value={content.registerCompanyPage.formSections.companyInformationHelper} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, companyInformationHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Account Setup Helper Text" value={content.registerCompanyPage.formSections.accountSetupHelper} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, accountSetupHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Company Address Helper Text" value={content.registerCompanyPage.formSections.companyAddressHelper} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, companyAddressHelper: value } } } : current)} rows={2} />
                <TextAreaField label="Additional Details Helper Text" value={content.registerCompanyPage.formSections.additionalDetailsHelper} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, formSections: { ...current.registerCompanyPage.formSections, additionalDetailsHelper: value } } } : current)} rows={2} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <Field label="Register Button Label" value={content.registerCompanyPage.submitArea.registerCompanyLabel} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, submitArea: { ...current.registerCompanyPage.submitArea, registerCompanyLabel: value } } } : current)} />
                  <Field label="Already Have Account Text" value={content.registerCompanyPage.submitArea.alreadyHaveAccountText} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, submitArea: { ...current.registerCompanyPage.submitArea, alreadyHaveAccountText: value } } } : current)} />
                  <Field label="Login Link Label" value={content.registerCompanyPage.submitArea.loginLabel} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, submitArea: { ...current.registerCompanyPage.submitArea, loginLabel: value } } } : current)} />
                  <Field label="Terms Label" value={content.registerCompanyPage.submitArea.termsLabel} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, submitArea: { ...current.registerCompanyPage.submitArea, termsLabel: value } } } : current)} />
                  <Field label="Privacy Policy Label" value={content.registerCompanyPage.submitArea.privacyPolicyLabel} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, submitArea: { ...current.registerCompanyPage.submitArea, privacyPolicyLabel: value } } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Why Register Benefits Panel" description="Edit the right-side registration benefits card content.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Panel Title" value={content.registerCompanyPage.benefitsPanel.title} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, benefitsPanel: { ...current.registerCompanyPage.benefitsPanel, title: value } } } : current)} />
                <TextAreaField label="Panel Description" value={content.registerCompanyPage.benefitsPanel.description} onChange={value => setContent(current => current ? { ...current, registerCompanyPage: { ...current.registerCompanyPage, benefitsPanel: { ...current.registerCompanyPage.benefitsPanel, description: value } } } : current)} rows={3} />
                {content.registerCompanyPage.benefitsPanel.items.map((item, index) => (
                  <div key={`register-benefit-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <Field label={`Benefit ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        registerCompanyPage: {
                          ...current.registerCompanyPage,
                          benefitsPanel: {
                            ...current.registerCompanyPage.benefitsPanel,
                            items: current.registerCompanyPage.benefitsPanel.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Benefit ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        registerCompanyPage: {
                          ...current.registerCompanyPage,
                          benefitsPanel: {
                            ...current.registerCompanyPage.benefitsPanel,
                            items: current.registerCompanyPage.benefitsPanel.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'companyPanel' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Company Panel Header and Hero" description="Edit the company panel branding, dashboard intro, hero image, feature chips and floating trust card.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Panel Title" value={content.companyPanel.header.panelTitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, header: { ...current.companyPanel.header, panelTitle: value } } } : current)} />
                  <Field label="Sidebar Brand Label" value={content.companyPanel.header.sidebarBrandLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, header: { ...current.companyPanel.header, sidebarBrandLabel: value } } } : current)} />
                  <Field label="Sidebar Subtitle" value={content.companyPanel.header.sidebarSubtitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, header: { ...current.companyPanel.header, sidebarSubtitle: value } } } : current)} />
                </div>
                <TextAreaField label="Panel Subtitle" value={content.companyPanel.header.panelSubtitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, header: { ...current.companyPanel.header, panelSubtitle: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Hero Eyebrow" value={content.companyPanel.hero.eyebrow} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, eyebrow: value } } } : current)} />
                  <Field label="Hero Highlighted Text" value={content.companyPanel.hero.highlightedText} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, highlightedText: value } } } : current)} />
                  <Field label="Trust Rating Text" value={content.companyPanel.hero.trustRatingText} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, trustRatingText: value } } } : current)} />
                </div>
                <TextAreaField label="Hero Title" value={content.companyPanel.hero.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, title: value } } } : current)} rows={2} />
                <TextAreaField label="Hero Description" value={content.companyPanel.hero.description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, description: value } } } : current)} rows={3} />
                <ImageUploadField
                  label="Hero Image"
                  value={content.companyPanel.hero.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, imageSrc: value } } } : current)}
                  placeholder="/worker-hero-reference.png"
                  uploadKey="company-panel-hero"
                  uploading={uploadingField === 'company-panel-hero'}
                  onUpload={async file => {
                    const publicUrl = await uploadWebsiteImage(file, 'company-panel-hero')
                    if (!publicUrl) return
                    setContent(current => current ? {
                      ...current,
                      companyPanel: {
                        ...current.companyPanel,
                        hero: {
                          ...current.companyPanel.hero,
                          imageSrc: publicUrl
                        }
                      }
                    } : current)
                  }}
                />
                <Field label="Trust Card Title" value={content.companyPanel.hero.trustCardTitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, trustCardTitle: value } } } : current)} />
                <TextAreaField label="Trust Card Subtitle" value={content.companyPanel.hero.trustCardSubtitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, trustCardSubtitle: value } } } : current)} rows={2} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Feature Chip 1 Title" value={content.companyPanel.hero.featureChip1Title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, featureChip1Title: value } } } : current)} />
                  <Field label="Feature Chip 1 Description" value={content.companyPanel.hero.featureChip1Description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, featureChip1Description: value } } } : current)} />
                  <Field label="Feature Chip 2 Title" value={content.companyPanel.hero.featureChip2Title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, featureChip2Title: value } } } : current)} />
                  <Field label="Feature Chip 2 Description" value={content.companyPanel.hero.featureChip2Description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, hero: { ...current.companyPanel.hero, featureChip2Description: value } } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Sidebar, Action Buttons and Stats Labels" description="Edit sidebar display text, top buttons and stat card labels while keeping routes and counts unchanged.">
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Dashboard Label" value={content.companyPanel.sidebar.dashboardLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, dashboardLabel: value } } } : current)} />
                  <Field label="Job Requirements Label" value={content.companyPanel.sidebar.jobRequirementsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, jobRequirementsLabel: value } } } : current)} />
                  <Field label="Applications Label" value={content.companyPanel.sidebar.applicationsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, applicationsLabel: value } } } : current)} />
                  <Field label="Shortlisted Label" value={content.companyPanel.sidebar.shortlistedLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, shortlistedLabel: value } } } : current)} />
                  <Field label="Hired Workers Label" value={content.companyPanel.sidebar.hiredWorkersLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, hiredWorkersLabel: value } } } : current)} />
                  <Field label="Search Workers Label" value={content.companyPanel.sidebar.searchWorkersLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, searchWorkersLabel: value } } } : current)} />
                  <Field label="Company Profile Label" value={content.companyPanel.sidebar.companyProfileLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, companyProfileLabel: value } } } : current)} />
                  <Field label="Billing & Plan Label" value={content.companyPanel.sidebar.billingPlanLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, billingPlanLabel: value } } } : current)} />
                  <Field label="Messages Label" value={content.companyPanel.sidebar.messagesLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, messagesLabel: value } } } : current)} />
                  <Field label="Settings Label" value={content.companyPanel.sidebar.settingsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, sidebar: { ...current.companyPanel.sidebar, settingsLabel: value } } } : current)} />
                  <Field label="Post New Requirement Button" value={content.companyPanel.actions.postNewRequirementLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, actions: { ...current.companyPanel.actions, postNewRequirementLabel: value } } } : current)} />
                  <Field label="Browse Workers Button" value={content.companyPanel.actions.browseWorkersLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, actions: { ...current.companyPanel.actions, browseWorkersLabel: value } } } : current)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Total Job Posts Label" value={content.companyPanel.stats.totalJobPostsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, totalJobPostsLabel: value } } } : current)} />
                  <Field label="Total Job Posts Description" value={content.companyPanel.stats.totalJobPostsDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, totalJobPostsDescription: value } } } : current)} />
                  <Field label="Active Job Posts Label" value={content.companyPanel.stats.activeJobPostsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, activeJobPostsLabel: value } } } : current)} />
                  <Field label="Active Job Posts Description" value={content.companyPanel.stats.activeJobPostsDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, activeJobPostsDescription: value } } } : current)} />
                  <Field label="Total Applications Label" value={content.companyPanel.stats.totalApplicationsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, totalApplicationsLabel: value } } } : current)} />
                  <Field label="Total Applications Description" value={content.companyPanel.stats.totalApplicationsDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, totalApplicationsDescription: value } } } : current)} />
                  <Field label="Shortlisted Label" value={content.companyPanel.stats.shortlistedLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, shortlistedLabel: value } } } : current)} />
                  <Field label="Shortlisted Description" value={content.companyPanel.stats.shortlistedDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, stats: { ...current.companyPanel.stats, shortlistedDescription: value } } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Recent Sections, Quick Actions and Support" description="Edit section titles, empty states, quick action text, support copy and upgrade labels.">
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Recent Job Posts Title" value={content.companyPanel.recentJobs.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentJobs: { ...current.companyPanel.recentJobs, title: value } } } : current)} />
                  <Field label="Recent Jobs View All Label" value={content.companyPanel.recentJobs.viewAllLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentJobs: { ...current.companyPanel.recentJobs, viewAllLabel: value } } } : current)} />
                  <Field label="View Details Label" value={content.companyPanel.recentJobs.viewDetailsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentJobs: { ...current.companyPanel.recentJobs, viewDetailsLabel: value } } } : current)} />
                  <Field label="Recent Jobs Empty Title" value={content.companyPanel.recentJobs.emptyTitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentJobs: { ...current.companyPanel.recentJobs, emptyTitle: value } } } : current)} />
                  <TextAreaField label="Recent Jobs Empty Description" value={content.companyPanel.recentJobs.emptyDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentJobs: { ...current.companyPanel.recentJobs, emptyDescription: value } } } : current)} rows={2} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Recent Applications Title" value={content.companyPanel.recentApplications.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentApplications: { ...current.companyPanel.recentApplications, title: value } } } : current)} />
                  <Field label="Recent Applications View All Label" value={content.companyPanel.recentApplications.viewAllLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentApplications: { ...current.companyPanel.recentApplications, viewAllLabel: value } } } : current)} />
                  <Field label="View Profile Label" value={content.companyPanel.recentApplications.viewProfileLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentApplications: { ...current.companyPanel.recentApplications, viewProfileLabel: value } } } : current)} />
                  <Field label="Recent Applications Empty Title" value={content.companyPanel.recentApplications.emptyTitle} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentApplications: { ...current.companyPanel.recentApplications, emptyTitle: value } } } : current)} />
                  <TextAreaField label="Recent Applications Empty Description" value={content.companyPanel.recentApplications.emptyDescription} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, recentApplications: { ...current.companyPanel.recentApplications, emptyDescription: value } } } : current)} rows={2} />
                </div>
                <Field label="Quick Actions Title" value={content.companyPanel.quickActions.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, quickActions: { ...current.companyPanel.quickActions, title: value } } } : current)} />
                {content.companyPanel.quickActions.items.map((item, index) => (
                  <div key={index} style={{ ...cardStyle, padding: '16px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Action {index + 1}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="Title" value={item.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, quickActions: { ...current.companyPanel.quickActions, items: current.companyPanel.quickActions.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem) } } } : current)} />
                      <Field label="Description" value={item.description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, quickActions: { ...current.companyPanel.quickActions, items: current.companyPanel.quickActions.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem) } } } : current)} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Support Title" value={content.companyPanel.support.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, support: { ...current.companyPanel.support, title: value } } } : current)} />
                  <Field label="Support Button Label" value={content.companyPanel.support.buttonLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, support: { ...current.companyPanel.support, buttonLabel: value } } } : current)} />
                  <Field label="Upgrade Card Title" value={content.companyPanel.upgradeCard.title} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, upgradeCard: { ...current.companyPanel.upgradeCard, title: value } } } : current)} />
                  <Field label="Upgrade Button Label" value={content.companyPanel.upgradeCard.buttonLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, upgradeCard: { ...current.companyPanel.upgradeCard, buttonLabel: value } } } : current)} />
                </div>
                <TextAreaField label="Support Description" value={content.companyPanel.support.description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, support: { ...current.companyPanel.support, description: value } } } : current)} rows={3} />
                <ImageUploadField
                  label="Support Image / Icon"
                  value={content.companyPanel.support.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, support: { ...current.companyPanel.support, imageSrc: value } } } : current)}
                  placeholder="/worker-hero-reference.png"
                  uploadKey="company-panel-support"
                  uploading={uploadingField === 'company-panel-support'}
                  onUpload={async file => {
                    const publicUrl = await uploadWebsiteImage(file, 'company-panel-support')
                    if (!publicUrl) return
                    setContent(current => current ? {
                      ...current,
                      companyPanel: {
                        ...current.companyPanel,
                        support: {
                          ...current.companyPanel.support,
                          imageSrc: publicUrl
                        }
                      }
                    } : current)
                  }}
                />
                <TextAreaField label="Upgrade Card Description" value={content.companyPanel.upgradeCard.description} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, upgradeCard: { ...current.companyPanel.upgradeCard, description: value } } } : current)} rows={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Current Plan Label" value={content.companyPanel.planSummary.currentPlanLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, planSummary: { ...current.companyPanel.planSummary, currentPlanLabel: value } } } : current)} />
                  <Field label="Valid Till Label" value={content.companyPanel.planSummary.validTillLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, planSummary: { ...current.companyPanel.planSummary, validTillLabel: value } } } : current)} />
                  <Field label="Job Posts Label" value={content.companyPanel.planSummary.jobPostsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, planSummary: { ...current.companyPanel.planSummary, jobPostsLabel: value } } } : current)} />
                  <Field label="Applications Label" value={content.companyPanel.planSummary.applicationsLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, planSummary: { ...current.companyPanel.planSummary, applicationsLabel: value } } } : current)} />
                  <Field label="Upgrade Plan Button Label" value={content.companyPanel.planSummary.upgradeButtonLabel} onChange={value => setContent(current => current ? { ...current, companyPanel: { ...current.companyPanel, planSummary: { ...current.companyPanel.planSummary, upgradeButtonLabel: value } } } : current)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'signin' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Sign In Hero" description="Edit the sign-in page headline, intro copy and left-side benefits.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.signinPage.eyebrow} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.signinPage.title} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, title: value } } : current)} rows={3} />
                <TextAreaField label="Page Description" value={content.signinPage.heroDescription} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, subtitle: value, heroDescription: value } } : current)} rows={4} />
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
              </div>
            </SectionCard>

            <SectionCard title="Login Card" description="Edit the visible labels and helper copy inside the sign-in form without changing the real auth flow.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <Field label="Card Title" value={content.signinPage.loginCard.title} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, title: value } } } : current)} />
                <Field label="Card Subtitle" value={content.signinPage.loginCard.subtitle} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, subtitle: value } } } : current)} />
                <Field label="Email Label" value={content.signinPage.loginCard.emailLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, emailLabel: value } } } : current)} />
                <Field label="Email Placeholder" value={content.signinPage.loginCard.emailPlaceholder} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, emailPlaceholder: value } } } : current)} />
                <Field label="Password Label" value={content.signinPage.loginCard.passwordLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, passwordLabel: value } } } : current)} />
                <Field label="Password Placeholder" value={content.signinPage.loginCard.passwordPlaceholder} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, passwordPlaceholder: value } } } : current)} />
                <Field label="Remember Me Label" value={content.signinPage.loginCard.rememberMeLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, rememberMeLabel: value } } } : current)} />
                <Field label="Forgot Password Label" value={content.signinPage.loginCard.forgotPasswordLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, forgotPasswordLabel: value } } } : current)} />
                <Field label="Sign In Button Label" value={content.signinPage.loginCard.signInButtonLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, signInButtonLabel: value } } } : current)} />
                <Field label="Register Prompt Text" value={content.signinPage.loginCard.registerPromptText} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, registerPromptText: value } } } : current)} />
                <Field label="Register Company Button Label" value={content.signinPage.loginCard.registerCompanyButtonLabel} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, registerCompanyButtonLabel: value } } } : current)} />
                <TextAreaField label="Redirect Note Text" value={content.signinPage.loginCard.redirectNoteText} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, loginCard: { ...current.signinPage.loginCard, redirectNoteText: value } } } : current)} rows={3} />
              </div>
            </SectionCard>

            <SectionCard title="Right Benefits Panel" description="Control the benefit panel content shown next to the sign-in card.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Panel Title" value={content.signinPage.rightPanel.title} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, rightPanel: { ...current.signinPage.rightPanel, title: value } } } : current)} />
                {content.signinPage.rightPanel.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Benefit ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        signinPage: {
                          ...current.signinPage,
                          rightPanel: {
                            ...current.signinPage.rightPanel,
                            items: current.signinPage.rightPanel.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem)
                          }
                        }
                      } : current)} />
                      <TextAreaField label={`Benefit ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        signinPage: {
                          ...current.signinPage,
                          rightPanel: {
                            ...current.signinPage.rightPanel,
                            items: current.signinPage.rightPanel.items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem)
                          }
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Bottom Banner & Feature Strip" description="Edit the lower banner image and feature highlights shown below the sign-in card.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <ImageUploadField
                  label="Banner Image"
                  value={content.signinPage.banner.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, banner: { ...current.signinPage.banner, imageSrc: value } } } : current)}
                  uploadKey="signin-banner-image"
                  onUpload={async (file, uploadKey) => {
                    const publicUrl = await uploadWebsiteImage(file, uploadKey)
                    if (!publicUrl) return
                    setContent(current => current ? { ...current, signinPage: { ...current.signinPage, banner: { ...current.signinPage.banner, imageSrc: publicUrl } } } : current)
                  }}
                  uploading={uploadingField === 'signin-banner-image'}
                />
                <Field label="Banner Title" value={content.signinPage.banner.title} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, banner: { ...current.signinPage.banner, title: value } } } : current)} />
                <TextAreaField label="Banner Description" value={content.signinPage.banner.description} onChange={value => setContent(current => current ? { ...current, signinPage: { ...current.signinPage, banner: { ...current.signinPage.banner, description: value } } } : current)} rows={3} />
                {content.signinPage.featureStrip.map((item, index) => (
                  <div key={`${item.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Feature ${index + 1} Title`} value={item.title} onChange={value => setContent(current => current ? {
                        ...current,
                        signinPage: {
                          ...current.signinPage,
                          featureStrip: current.signinPage.featureStrip.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, title: value } : currentItem)
                        }
                      } : current)} />
                      <TextAreaField label={`Feature ${index + 1} Description`} value={item.description} onChange={value => setContent(current => current ? {
                        ...current,
                        signinPage: {
                          ...current.signinPage,
                          featureStrip: current.signinPage.featureStrip.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: value } : currentItem)
                        }
                      } : current)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <SectionCard title="Contact Hero" description="Edit the main contact-page headline, hero image and support highlights.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label="Eyebrow" value={content.contactPage.eyebrow} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, eyebrow: value } } : current)} />
                <TextAreaField label="Title" value={content.contactPage.title} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, title: value } } : current)} rows={3} />
                <Field label="Highlighted Text" value={content.contactPage.highlightedText} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, highlightedText: value } } : current)} />
                <TextAreaField label="Subtitle" value={content.contactPage.subtitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, subtitle: value } } : current)} rows={4} />
                <ImageUploadField
                  label="Hero Image"
                  value={content.contactPage.imageSrc}
                  onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, imageSrc: value } } : current)}
                  uploadKey="contact-hero-image"
                  onUpload={async (file, uploadKey) => {
                    const publicUrl = await uploadWebsiteImage(file, uploadKey)
                    if (!publicUrl) return
                    setContent(current => current ? { ...current, contactPage: { ...current.contactPage, imageSrc: publicUrl } } : current)
                  }}
                  uploading={uploadingField === 'contact-hero-image'}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Floating Card Title" value={content.contactPage.floatingCardTitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, floatingCardTitle: value } } : current)} />
                  <Field label="Floating Card Description" value={content.contactPage.floatingCardDescription} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, floatingCardDescription: value } } : current)} />
                  <Field label="Availability Value" value={content.contactPage.floatingCardAvailabilityValue} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, floatingCardAvailabilityValue: value } } : current)} />
                  <Field label="Availability Label" value={content.contactPage.floatingCardAvailabilityLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, floatingCardAvailabilityLabel: value } } : current)} />
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Hero Feature Points</p>
                  {content.contactPage.featurePoints.map((point, index) => (
                    <div key={`${point.title}-${index}`} style={cardStyle}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <Field label={`Feature ${index + 1} Title`} value={point.title} onChange={value => setContent(current => current ? {
                            ...current,
                            contactPage: {
                              ...current.contactPage,
                              featurePoints: current.contactPage.featurePoints.map((currentPoint, currentIndex) => currentIndex === index ? { ...currentPoint, title: value } : currentPoint)
                            }
                          } : current)} />
                          <Field label={`Feature ${index + 1} Description`} value={point.description} onChange={value => setContent(current => current ? {
                            ...current,
                            contactPage: {
                              ...current.contactPage,
                              featurePoints: current.contactPage.featurePoints.map((currentPoint, currentIndex) => currentIndex === index ? { ...currentPoint, description: value } : currentPoint)
                            }
                          } : current)} />
                        </div>
                        <button onClick={() => setContent(current => current ? {
                          ...current,
                          contactPage: {
                            ...current.contactPage,
                            featurePoints: current.contactPage.featurePoints.filter((_, currentIndex) => currentIndex !== index)
                          }
                        } : current)} style={dangerButtonStyle}>Remove Feature Point</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, featurePoints: [...current.contactPage.featurePoints, emptyContactFeaturePoint] } } : current)} style={subtleButtonStyle}>Add Feature Point</button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Form & Contact Details" description="Control the public form labels, contact information, social links and map directions.">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Form Title" value={content.contactPage.formTitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, formTitle: value } } : current)} />
                  <Field label="Form Subtitle" value={content.contactPage.formSubtitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, formSubtitle: value } } : current)} />
                  <Field label="Form Button Text" value={content.contactPage.formButtonLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, formButtonLabel: value } } : current)} />
                  <Field label="FAQ Title" value={content.contactPage.faqTitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, faqTitle: value } } : current)} />
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Subject Options</p>
                  {content.contactPage.subjectOptions.map((option, index) => (
                    <div key={`${option}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '12px', alignItems: 'center' }}>
                      <Field label={`Subject ${index + 1}`} value={option} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          subjectOptions: current.contactPage.subjectOptions.map((currentOption, currentIndex) => currentIndex === index ? value : currentOption)
                        }
                      } : current)} />
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          subjectOptions: current.contactPage.subjectOptions.filter((_, currentIndex) => currentIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, subjectOptions: [...current.contactPage.subjectOptions, ''] } } : current)} style={subtleButtonStyle}>Add Subject Option</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Info Title" value={content.contactPage.infoTitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, infoTitle: value } } : current)} />
                  <Field label="Info Subtitle" value={content.contactPage.infoSubtitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, infoSubtitle: value } } : current)} />
                  <Field label="Phone Label" value={content.contactPage.phoneLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, phoneLabel: value } } : current)} />
                  <Field label="Phone" value={content.contactPage.phone} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, phone: value } } : current)} />
                  <Field label="Office Hours" value={content.contactPage.officeHours} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, officeHours: value } } : current)} />
                  <Field label="Email Label" value={content.contactPage.emailLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, emailLabel: value } } : current)} />
                  <Field label="Support Email" value={content.contactPage.supportEmail} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, supportEmail: value } } : current)} />
                  <Field label="Escalation Email" value={content.contactPage.escalationEmail} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, escalationEmail: value } } : current)} />
                  <Field label="Email Response Text" value={content.contactPage.emailResponseText} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, emailResponseText: value } } : current)} />
                  <Field label="Address Label" value={content.contactPage.addressLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, addressLabel: value } } : current)} />
                  <Field label="Address" value={content.contactPage.address} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, address: value } } : current)} />
                  <Field label="Social Label" value={content.contactPage.socialLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, socialLabel: value } } : current)} />
                  <Field label="Facebook Link" value={content.contactPage.socialLinks.facebook} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, socialLinks: { ...current.contactPage.socialLinks, facebook: value } } } : current)} />
                  <Field label="Twitter / X Link" value={content.contactPage.socialLinks.twitter} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, socialLinks: { ...current.contactPage.socialLinks, twitter: value } } } : current)} />
                  <Field label="LinkedIn Link" value={content.contactPage.socialLinks.linkedin} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, socialLinks: { ...current.contactPage.socialLinks, linkedin: value } } } : current)} />
                  <Field label="Instagram Link" value={content.contactPage.socialLinks.instagram} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, socialLinks: { ...current.contactPage.socialLinks, instagram: value } } } : current)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="Location Title" value={content.contactPage.locationTitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, locationTitle: value } } : current)} />
                  <Field label="Location Description" value={content.contactPage.locationDescription} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, locationDescription: value } } : current)} />
                  <Field label="Directions Button Text" value={content.contactPage.directionsLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, directionsLabel: value } } : current)} />
                  <Field label="Directions Link" value={content.contactPage.directionsHref} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, directionsHref: value } } : current)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="FAQs, CTA & Quick Links" description="Edit the public FAQ entries, closing CTA banner and optional quick action cards.">
              <div style={{ display: 'grid', gap: '14px' }}>
                {content.contactPage.faqs.map((item, index) => (
                  <div key={`${item.question}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`FAQ ${index + 1} Question`} value={item.question} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          faqs: current.contactPage.faqs.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, question: value } : currentItem)
                        }
                      } : current)} />
                      <TextAreaField label={`FAQ ${index + 1} Answer`} value={item.answer} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          faqs: current.contactPage.faqs.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, answer: value } : currentItem)
                        }
                      } : current)} rows={3} />
                      <button onClick={() => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          faqs: current.contactPage.faqs.filter((_, currentIndex) => currentIndex !== index)
                        }
                      } : current)} style={dangerButtonStyle}>Remove FAQ</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, faqs: [...current.contactPage.faqs, emptyContactFaq] } } : current)} style={subtleButtonStyle}>Add FAQ</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <Field label="CTA Title" value={content.contactPage.finalCta.title} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, title: value } } } : current)} />
                  <TextAreaField label="CTA Description" value={content.contactPage.finalCta.subtitle} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, subtitle: value } } } : current)} rows={3} />
                  <Field label="Primary Button Text" value={content.contactPage.finalCta.primaryCtaLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, primaryCtaLabel: value } } } : current)} />
                  <Field label="Primary Button Link" value={content.contactPage.finalCta.primaryCtaHref} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, primaryCtaHref: value } } } : current)} />
                  <Field label="Secondary Button Text" value={content.contactPage.finalCta.secondaryCtaLabel} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, secondaryCtaLabel: value } } } : current)} />
                  <Field label="Secondary Button Link" value={content.contactPage.finalCta.secondaryCtaHref} onChange={value => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, finalCta: { ...current.contactPage.finalCta, secondaryCtaHref: value } } } : current)} />
                </div>
                {content.contactPage.cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Field label={`Quick Link ${index + 1} Title`} value={card.title} onChange={value => setContent(current => current ? {
                        ...current,
                        contactPage: {
                          ...current.contactPage,
                          cards: current.contactPage.cards.map((currentCard, currentIndex) => currentIndex === index ? { ...currentCard, title: value } : currentCard)
                        }
                      } : current)} />
                      <TextAreaField label={`Quick Link ${index + 1} Description`} value={card.description} onChange={value => setContent(current => current ? {
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
                      } : current)} style={dangerButtonStyle}>Remove Quick Link</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setContent(current => current ? { ...current, contactPage: { ...current.contactPage, cards: [...current.contactPage.cards, emptyContactCard] } } : current)} style={subtleButtonStyle}>Add Quick Link</button>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'legal' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {legalPages.map(({ key, label, page }) => (
              <SectionCard key={key} title={label} description={`Edit the full ${label.toLowerCase()} page content shown on the company website.`}>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <Field label="Eyebrow" value={page.eyebrow} onChange={value => setContent(current => current ? {
                    ...current,
                    legalPages: {
                      ...current.legalPages,
                      [key]: {
                        ...current.legalPages[key],
                        eyebrow: value
                      }
                    }
                  } : current)} />
                  <TextAreaField label="Page Title" value={page.title} onChange={value => setContent(current => current ? {
                    ...current,
                    legalPages: {
                      ...current.legalPages,
                      [key]: {
                        ...current.legalPages[key],
                        title: value
                      }
                    }
                  } : current)} rows={2} />
                  <TextAreaField label="Page Subtitle" value={page.subtitle} onChange={value => setContent(current => current ? {
                    ...current,
                    legalPages: {
                      ...current.legalPages,
                      [key]: {
                        ...current.legalPages[key],
                        subtitle: value
                      }
                    }
                  } : current)} rows={4} />

                  {page.sections.map((section, index) => (
                    <div key={`${key}-${section.title}-${index}`} style={cardStyle}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <Field label={`Section ${index + 1} Title`} value={section.title} onChange={value => setContent(current => current ? {
                          ...current,
                          legalPages: {
                            ...current.legalPages,
                            [key]: {
                              ...current.legalPages[key],
                              sections: current.legalPages[key].sections.map((currentSection, currentIndex) => currentIndex === index ? { ...currentSection, title: value } : currentSection)
                            }
                          }
                        } : current)} />
                        <TextAreaField label={`Section ${index + 1} Body`} value={section.body} onChange={value => setContent(current => current ? {
                          ...current,
                          legalPages: {
                            ...current.legalPages,
                            [key]: {
                              ...current.legalPages[key],
                              sections: current.legalPages[key].sections.map((currentSection, currentIndex) => currentIndex === index ? { ...currentSection, body: value } : currentSection)
                            }
                          }
                        } : current)} rows={5} />
                        <button onClick={() => setContent(current => current ? {
                          ...current,
                          legalPages: {
                            ...current.legalPages,
                            [key]: {
                              ...current.legalPages[key],
                              sections: current.legalPages[key].sections.filter((_, currentIndex) => currentIndex !== index)
                            }
                          }
                        } : current)} style={dangerButtonStyle}>Remove Section</button>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => setContent(current => current ? {
                    ...current,
                    legalPages: {
                      ...current.legalPages,
                      [key]: {
                        ...current.legalPages[key],
                        sections: [...current.legalPages[key].sections, emptyLegalSection]
                      }
                    }
                  } : current)} style={subtleButtonStyle}>Add Section</button>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
