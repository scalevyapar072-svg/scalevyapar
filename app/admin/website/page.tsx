'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { defaultMainWebsiteContent, type MainWebsiteContent } from '@/data/main-website-content'

type EditorTab = 'theme' | 'headerFooter' | 'home' | 'pricing' | 'tools' | 'about' | 'contact' | 'login' | 'legal'

type WebsitePayload = {
  content: MainWebsiteContent
  storage?: 'supabase' | 'fallback'
}

const tabs: Array<{ id: EditorTab; label: string; description: string }> = [
  { id: 'theme', label: 'Theme', description: 'Brand name, support identity, and reusable theme values.' },
  { id: 'headerFooter', label: 'Header & Footer', description: 'Main navigation, login CTA, footer links, contact details, and social links.' },
  { id: 'home', label: 'Home', description: 'Hero, stats, features, testimonials, comparison copy, and final CTA.' },
  { id: 'pricing', label: 'Pricing', description: 'Pricing hero, calculator display content, credit packs, FAQs, and CTA copy.' },
  { id: 'tools', label: 'Tools', description: 'Tools page hero, tool blocks, credits text, and CTA.' },
  { id: 'about', label: 'About', description: 'About page hero, story, mission, values, and CTA.' },
  { id: 'contact', label: 'Contact', description: 'Contact cards, business hours, form copy, FAQs, and CTA.' },
  { id: 'login', label: 'Login', description: 'Visible login marketing copy, form labels, and forgot-password modal text.' },
  { id: 'legal', label: 'Legal Pages', description: 'Privacy Policy, Terms of Service, and User Data Deletion content.' }
]

const pickSection = (content: MainWebsiteContent, tab: EditorTab) => {
  switch (tab) {
    case 'theme':
      return { theme: content.theme }
    case 'headerFooter':
      return { header: content.header, footer: content.footer }
    case 'home':
      return content.home
    case 'pricing':
      return content.pricingPage
    case 'tools':
      return content.toolsPage
    case 'about':
      return content.aboutPage
    case 'contact':
      return content.contactPage
    case 'login':
      return content.loginPage
    case 'legal':
      return content.legalPages
  }
}

const setSection = (content: MainWebsiteContent, tab: EditorTab, value: unknown): MainWebsiteContent => {
  const next = structuredClone(content)

  switch (tab) {
    case 'theme':
      next.theme = (value as { theme: MainWebsiteContent['theme'] }).theme
      break
    case 'headerFooter': {
      const section = value as { header: MainWebsiteContent['header']; footer: MainWebsiteContent['footer'] }
      next.header = section.header
      next.footer = section.footer
      break
    }
    case 'home':
      next.home = value as MainWebsiteContent['home']
      break
    case 'pricing':
      next.pricingPage = value as MainWebsiteContent['pricingPage']
      break
    case 'tools':
      next.toolsPage = value as MainWebsiteContent['toolsPage']
      break
    case 'about':
      next.aboutPage = value as MainWebsiteContent['aboutPage']
      break
    case 'contact':
      next.contactPage = value as MainWebsiteContent['contactPage']
      break
    case 'login':
      next.loginPage = value as MainWebsiteContent['loginPage']
      break
    case 'legal':
      next.legalPages = value as MainWebsiteContent['legalPages']
      break
  }

  return next
}

const pathToArray = (path: string) => path.split('.')

const getValueAtPath = (source: unknown, path: string) =>
  pathToArray(path).reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }

    return undefined
  }, source)

const setValueAtPath = (source: unknown, path: string, value: unknown) => {
  const parts = pathToArray(path)
  const next = structuredClone(source) as Record<string, unknown>
  let cursor: Record<string, unknown> = next

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value
      return
    }

    const current = cursor[part]

    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      cursor[part] = {}
    }

    cursor = cursor[part] as Record<string, unknown>
  })

  return next
}

const arrayValue = (value: unknown) => (Array.isArray(value) ? value : [])

const SectionCard = ({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <div
    style={{
      border: '1px solid #dbe4ef',
      borderRadius: '20px',
      padding: '18px',
      background: '#fff'
    }}
  >
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{title}</h3>
      {description ? <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6, fontSize: '13px' }}>{description}</p> : null}
    </div>
    {children}
  </div>
)

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>{children}</div>
)

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'number' | 'color'
}) => (
  <label style={{ display: 'grid', gap: '8px' }}>
    <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>{label}</span>
    <input
      type={type}
      value={String(value ?? '')}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #d8e1ee',
        borderRadius: '12px',
        padding: '12px 14px',
        color: '#0f172a',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box'
      }}
    />
  </label>
)

const TextField = ({
  label,
  value,
  onChange,
  rows = 4,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) => (
  <label style={{ display: 'grid', gap: '8px' }}>
    <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>{label}</span>
    <textarea
      value={value}
      onChange={event => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #d8e1ee',
        borderRadius: '12px',
        padding: '12px 14px',
        color: '#0f172a',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'vertical'
      }}
    />
  </label>
)

const ListToolbar = ({
  label,
  onAdd
}: {
  label: string
  onAdd: () => void
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
    <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>{label}</div>
    <button
      type="button"
      onClick={onAdd}
      style={{
        border: '1px solid #cbd5e1',
        background: '#fff',
        color: '#0f172a',
        borderRadius: '10px',
        padding: '8px 12px',
        fontWeight: 700,
        cursor: 'pointer'
      }}
    >
      Add Item
    </button>
  </div>
)

const ItemShell = ({
  title,
  onRemove,
  children
}: {
  title: string
  onRemove: () => void
  children: React.ReactNode
}) => (
  <div
    style={{
      border: '1px solid #dbe4ef',
      background: '#f8fafc',
      borderRadius: '16px',
      padding: '14px',
      display: 'grid',
      gap: '12px'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{title}</strong>
      <button
        type="button"
        onClick={onRemove}
        style={{
          border: '1px solid #fecaca',
          background: '#fff1f2',
          color: '#b91c1c',
          borderRadius: '10px',
          padding: '7px 10px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Remove
      </button>
    </div>
    {children}
  </div>
)

export default function MainWebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>('home')
  const [content, setContent] = useState<MainWebsiteContent>(defaultMainWebsiteContent)
  const [savedContent, setSavedContent] = useState<MainWebsiteContent>(defaultMainWebsiteContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storage, setStorage] = useState<'supabase' | 'fallback'>('fallback')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showAdvancedJson, setShowAdvancedJson] = useState(false)
  const [jsonDraft, setJsonDraft] = useState('')

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/admin/website', { cache: 'no-store' })
        const payload = await response.json().catch(() => null) as WebsitePayload | null

        if (!response.ok || !payload?.content) {
          throw new Error((payload as { error?: string } | null)?.error || 'Failed to load main website content.')
        }

        setContent(payload.content)
        setSavedContent(payload.content)
        setStorage(payload.storage || 'fallback')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load main website content.')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  useEffect(() => {
    setJsonDraft(JSON.stringify(pickSection(content, activeTab), null, 2))
  }, [activeTab, content])

  const currentTabMeta = useMemo(
    () => tabs.find(tab => tab.id === activeTab) || tabs[0],
    [activeTab]
  )

  const updateField = (path: string, value: unknown) => {
    setContent(prev => setValueAtPath(prev, path, value) as MainWebsiteContent)
    setMessage('')
    setError('')
  }

  const addListItem = (path: string, defaultItem: unknown) => {
    setContent(prev => {
      const current = arrayValue(getValueAtPath(prev, path))
      return setValueAtPath(prev, path, [...current, structuredClone(defaultItem)]) as MainWebsiteContent
    })
    setMessage('')
    setError('')
  }

  const removeListItem = (path: string, index: number) => {
    setContent(prev => {
      const current = arrayValue(getValueAtPath(prev, path))
      return setValueAtPath(prev, path, current.filter((_, itemIndex) => itemIndex !== index)) as MainWebsiteContent
    })
    setMessage('')
    setError('')
  }

  const updateListItem = (path: string, index: number, key: string, value: unknown) => {
    setContent(prev => {
      const current = arrayValue(getValueAtPath(prev, path))
      const next = current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        return {
          ...(item as Record<string, unknown>),
          [key]: value
        }
      })

      return setValueAtPath(prev, path, next) as MainWebsiteContent
    })
    setMessage('')
    setError('')
  }

  const resetCurrentTab = () => {
    setContent(prev => setSection(prev, activeTab, pickSection(savedContent, activeTab)))
    setMessage('')
    setError('')
  }

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft)
      setContent(prev => setSection(prev, activeTab, parsed))
      setMessage(`${currentTabMeta.label} advanced JSON applied.`)
      setError('')
    } catch (jsonError) {
      setError(jsonError instanceof Error ? jsonError.message : 'Invalid JSON.')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response = await fetch('/api/admin/website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const payload = await response.json().catch(() => null) as WebsitePayload | null

      if (!response.ok || !payload?.content) {
        throw new Error((payload as { error?: string } | null)?.error || 'Failed to save main website content.')
      }

      setContent(payload.content)
      setSavedContent(payload.content)
      setStorage(payload.storage || 'fallback')
      setMessage('Main website content saved successfully.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save main website content.')
    } finally {
      setSaving(false)
    }
  }

  const renderThemeTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Brand & Support" description="Core identity values used across the main website.">
        <FieldGrid>
          <Field label="Brand Name" value={content.theme.brandName} onChange={value => updateField('theme.brandName', value)} />
          <Field label="Support Email" type="email" value={content.theme.supportEmail} onChange={value => updateField('theme.supportEmail', value)} />
          <Field label="WhatsApp Number" value={content.theme.whatsappNumber} onChange={value => updateField('theme.whatsappNumber', value)} />
          <Field label="Accent Color" type="color" value={content.theme.accentColor} onChange={value => updateField('theme.accentColor', value)} />
          <Field label="Soft Background" type="color" value={content.theme.accentSoft} onChange={value => updateField('theme.accentSoft', value)} />
          <Field label="Highlight Color" type="color" value={content.theme.highlightColor} onChange={value => updateField('theme.highlightColor', value)} />
        </FieldGrid>
      </SectionCard>
    </div>
  )

  const renderHeaderFooterTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Header" description="Editable header logo and navigation fields without changing the public layout.">
        <FieldGrid>
          <Field label="Logo Source" value={content.header.logoSrc} onChange={value => updateField('header.logoSrc', value)} />
          <Field label="Logo Alt Text" value={content.header.logoAlt} onChange={value => updateField('header.logoAlt', value)} />
          <Field label="Login Button Label" value={content.header.loginButtonLabel} onChange={value => updateField('header.loginButtonLabel', value)} />
          <Field label="Login Button Link" value={content.header.loginButtonHref} onChange={value => updateField('header.loginButtonHref', value)} />
          <Field label="Mobile Login Label" value={content.header.mobileLoginLabel} onChange={value => updateField('header.mobileLoginLabel', value)} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Navigation Items" description="Edit label and link pairs for the top header navigation.">
        <ListToolbar label="Navigation Menu" onAdd={() => addListItem('header.navItems', { label: 'New Item', href: '/' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.header.navItems.map((item, index) => (
            <ItemShell key={`nav-${index}`} title={`Nav Item ${index + 1}`} onRemove={() => removeListItem('header.navItems', index)}>
              <FieldGrid>
                <Field label="Label" value={item.label} onChange={value => updateListItem('header.navItems', index, 'label', value)} />
                <Field label="Link" value={item.href} onChange={value => updateListItem('header.navItems', index, 'href', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Footer Basics" description="Footer logo, description, and copyright text.">
        <FieldGrid>
          <Field label="Footer Logo Source" value={content.footer.logoSrc} onChange={value => updateField('footer.logoSrc', value)} />
          <Field label="Footer Secondary Text" value={content.footer.secondaryText} onChange={value => updateField('footer.secondaryText', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Footer Description" rows={3} value={content.footer.description} onChange={value => updateField('footer.description', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Copyright Text" rows={2} value={content.footer.copyrightText} onChange={value => updateField('footer.copyrightText', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Footer Tool Links" description="Repeatable list for tool links shown in the footer.">
        <ListToolbar label="Tool Links" onAdd={() => addListItem('footer.toolLinks', { label: 'New Tool', href: '/tools' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.footer.toolLinks.map((item, index) => (
            <ItemShell key={`tool-link-${index}`} title={`Tool Link ${index + 1}`} onRemove={() => removeListItem('footer.toolLinks', index)}>
              <FieldGrid>
                <Field label="Label" value={item.label} onChange={value => updateListItem('footer.toolLinks', index, 'label', value)} />
                <Field label="Link" value={item.href} onChange={value => updateListItem('footer.toolLinks', index, 'href', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Footer Quick Links" description="Repeatable list for general footer links.">
        <ListToolbar label="Quick Links" onAdd={() => addListItem('footer.quickLinks', { label: 'New Link', href: '/' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.footer.quickLinks.map((item, index) => (
            <ItemShell key={`quick-link-${index}`} title={`Quick Link ${index + 1}`} onRemove={() => removeListItem('footer.quickLinks', index)}>
              <FieldGrid>
                <Field label="Label" value={item.label} onChange={value => updateListItem('footer.quickLinks', index, 'label', value)} />
                <Field label="Link" value={item.href} onChange={value => updateListItem('footer.quickLinks', index, 'href', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Footer Contact Items" description="Editable footer contact lines with icon, label, and link.">
        <ListToolbar label="Contact Items" onAdd={() => addListItem('footer.contactItems', { icon: '📍', label: 'New Contact', href: '' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.footer.contactItems.map((item, index) => (
            <ItemShell key={`contact-item-${index}`} title={`Contact Item ${index + 1}`} onRemove={() => removeListItem('footer.contactItems', index)}>
              <FieldGrid>
                <Field label="Icon" value={item.icon} onChange={value => updateListItem('footer.contactItems', index, 'icon', value)} />
                <Field label="Label" value={item.label} onChange={value => updateListItem('footer.contactItems', index, 'label', value)} />
                <Field label="Link" value={item.href} onChange={value => updateListItem('footer.contactItems', index, 'href', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Footer Social Links" description="Editable repeatable social links.">
        <ListToolbar label="Social Links" onAdd={() => addListItem('footer.socialLinks', { icon: '💬', label: 'Social', href: '' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.footer.socialLinks.map((item, index) => (
            <ItemShell key={`social-link-${index}`} title={`Social Link ${index + 1}`} onRemove={() => removeListItem('footer.socialLinks', index)}>
              <FieldGrid>
                <Field label="Icon" value={item.icon} onChange={value => updateListItem('footer.socialLinks', index, 'icon', value)} />
                <Field label="Label" value={item.label} onChange={value => updateListItem('footer.socialLinks', index, 'label', value)} />
                <Field label="Link" value={item.href} onChange={value => updateListItem('footer.socialLinks', index, 'href', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>
    </div>
  )

  const renderHomeTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Hero" description="Main homepage hero copy and CTA fields.">
        <FieldGrid>
          <Field label="Badge" value={content.home.hero.badge} onChange={value => updateField('home.hero.badge', value)} />
          <Field label="Title Prefix" value={content.home.hero.titlePrefix} onChange={value => updateField('home.hero.titlePrefix', value)} />
          <Field label="Primary Button Label" value={content.home.hero.primaryCtaLabel} onChange={value => updateField('home.hero.primaryCtaLabel', value)} />
          <Field label="Primary Button Link" value={content.home.hero.primaryCtaHref} onChange={value => updateField('home.hero.primaryCtaHref', value)} />
          <Field label="Secondary Button Label" value={content.home.hero.secondaryCtaLabel} onChange={value => updateField('home.hero.secondaryCtaLabel', value)} />
          <Field label="Secondary Button Link" value={content.home.hero.secondaryCtaHref} onChange={value => updateField('home.hero.secondaryCtaHref', value)} />
          <Field label="Mobile Primary Button Label" value={content.home.hero.mobilePrimaryCtaLabel} onChange={value => updateField('home.hero.mobilePrimaryCtaLabel', value)} />
          <Field label="Scroll Hint" value={content.home.hero.scrollHint} onChange={value => updateField('home.hero.scrollHint', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Hero Subtitle" rows={3} value={content.home.hero.subtitle} onChange={value => updateField('home.hero.subtitle', value)} />
          <TextField label="Mobile Subtitle" rows={3} value={content.home.hero.mobileSubtitle} onChange={value => updateField('home.hero.mobileSubtitle', value)} />
          <TextField
            label="Highlight Words (one per line)"
            rows={6}
            value={content.home.hero.titleWords.join('\n')}
            onChange={value => updateField('home.hero.titleWords', value.split('\n').map(item => item.trim()).filter(Boolean))}
          />
        </div>
      </SectionCard>

      <SectionCard title="Hero Stats" description="Repeatable hero stats list.">
        <ListToolbar label="Stats" onAdd={() => addListItem('home.hero.stats', { value: '100+', label: 'New Stat', mobileLabel: 'New Stat' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.home.hero.stats.map((item, index) => (
            <ItemShell key={`hero-stat-${index}`} title={`Stat ${index + 1}`} onRemove={() => removeListItem('home.hero.stats', index)}>
              <FieldGrid>
                <Field label="Value" value={item.value} onChange={value => updateListItem('home.hero.stats', index, 'value', value)} />
                <Field label="Label" value={item.label} onChange={value => updateListItem('home.hero.stats', index, 'label', value)} />
                <Field label="Mobile Label" value={item.mobileLabel} onChange={value => updateListItem('home.hero.stats', index, 'mobileLabel', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Feature Cards" description="Homepage tool feature cards shown near the top.">
        <FieldGrid>
          <Field label="Section Eyebrow" value={content.home.toolsSection.eyebrow} onChange={value => updateField('home.toolsSection.eyebrow', value)} />
          <Field label="Section Title" value={content.home.toolsSection.title} onChange={value => updateField('home.toolsSection.title', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Section Subtitle" rows={3} value={content.home.toolsSection.subtitle} onChange={value => updateField('home.toolsSection.subtitle', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Feature Cards" onAdd={() => addListItem('home.toolsSection.tools', { icon: '✨', name: 'New Tool', tag: 'Built by Us', tagText: '★', description: '', features: ['Feature'] })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.home.toolsSection.tools.map((item, index) => (
              <ItemShell key={`home-tool-${index}`} title={`Feature Card ${index + 1}`} onRemove={() => removeListItem('home.toolsSection.tools', index)}>
                <FieldGrid>
                  <Field label="Icon" value={item.icon} onChange={value => updateListItem('home.toolsSection.tools', index, 'icon', value)} />
                  <Field label="Name" value={item.name} onChange={value => updateListItem('home.toolsSection.tools', index, 'name', value)} />
                  <Field label="Tag" value={item.tag} onChange={value => updateListItem('home.toolsSection.tools', index, 'tag', value)} />
                  <Field label="Tag Text" value={item.tagText} onChange={value => updateListItem('home.toolsSection.tools', index, 'tagText', value)} />
                </FieldGrid>
                <TextField label="Description" rows={3} value={item.description} onChange={value => updateListItem('home.toolsSection.tools', index, 'description', value)} />
                <TextField
                  label="Features (one per line)"
                  rows={4}
                  value={item.features.join('\n')}
                  onChange={value => updateListItem('home.toolsSection.tools', index, 'features', value.split('\n').map(feature => feature.trim()).filter(Boolean))}
                />
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Testimonials" description="Editable list for testimonial cards.">
        <FieldGrid>
          <Field label="Section Eyebrow" value={content.home.testimonialsSection.eyebrow} onChange={value => updateField('home.testimonialsSection.eyebrow', value)} />
          <Field label="Section Title" value={content.home.testimonialsSection.title} onChange={value => updateField('home.testimonialsSection.title', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Section Subtitle" rows={3} value={content.home.testimonialsSection.subtitle} onChange={value => updateField('home.testimonialsSection.subtitle', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Testimonials" onAdd={() => addListItem('home.testimonialsSection.items', { name: 'New Name', business: 'Company Name', review: 'New testimonial', rating: 5, avatar: 'N' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.home.testimonialsSection.items.map((item, index) => (
              <ItemShell key={`testimonial-${index}`} title={`Testimonial ${index + 1}`} onRemove={() => removeListItem('home.testimonialsSection.items', index)}>
                <FieldGrid>
                  <Field label="Name" value={item.name} onChange={value => updateListItem('home.testimonialsSection.items', index, 'name', value)} />
                  <Field label="Company" value={item.business} onChange={value => updateListItem('home.testimonialsSection.items', index, 'business', value)} />
                  <Field label="Rating" type="number" value={item.rating} onChange={value => updateListItem('home.testimonialsSection.items', index, 'rating', Number(value) || 0)} />
                  <Field label="Avatar" value={item.avatar} onChange={value => updateListItem('home.testimonialsSection.items', index, 'avatar', value)} />
                </FieldGrid>
                <TextField label="Quote" rows={4} value={item.review} onChange={value => updateListItem('home.testimonialsSection.items', index, 'review', value)} />
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Comparison / FAQ Style Section" description="Editable comparison copy and feature list.">
        <FieldGrid>
          <Field label="Eyebrow" value={content.home.comparisonSection.eyebrow} onChange={value => updateField('home.comparisonSection.eyebrow', value)} />
          <Field label="Title" value={content.home.comparisonSection.title} onChange={value => updateField('home.comparisonSection.title', value)} />
          <Field label="Primary Label" value={content.home.comparisonSection.primaryLabel} onChange={value => updateField('home.comparisonSection.primaryLabel', value)} />
          <Field label="Secondary Label" value={content.home.comparisonSection.secondaryLabel} onChange={value => updateField('home.comparisonSection.secondaryLabel', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Subtitle" rows={3} value={content.home.comparisonSection.subtitle} onChange={value => updateField('home.comparisonSection.subtitle', value)} />
          <TextField label="CTA Text" rows={3} value={content.home.comparisonSection.ctaText} onChange={value => updateField('home.comparisonSection.ctaText', value)} />
        </div>
        <FieldGrid>
          <Field label="CTA Button Label" value={content.home.comparisonSection.ctaButtonLabel} onChange={value => updateField('home.comparisonSection.ctaButtonLabel', value)} />
          <Field label="CTA Button Link" value={content.home.comparisonSection.ctaButtonHref} onChange={value => updateField('home.comparisonSection.ctaButtonHref', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Comparison Rows" onAdd={() => addListItem('home.comparisonSection.features', { feature: 'New Feature', us: true, others: false })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.home.comparisonSection.features.map((item, index) => (
              <ItemShell key={`comparison-${index}`} title={`Comparison Row ${index + 1}`} onRemove={() => removeListItem('home.comparisonSection.features', index)}>
                <FieldGrid>
                  <Field label="Feature" value={item.feature} onChange={value => updateListItem('home.comparisonSection.features', index, 'feature', value)} />
                  <Field label="ScaleVyapar" value={item.us ? 'Yes' : 'No'} onChange={value => updateListItem('home.comparisonSection.features', index, 'us', value.toLowerCase() === 'yes')} />
                  <Field label="Others" value={item.others ? 'Yes' : 'No'} onChange={value => updateListItem('home.comparisonSection.features', index, 'others', value.toLowerCase() === 'yes')} />
                </FieldGrid>
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="Bottom homepage CTA block.">
        <FieldGrid>
          <Field label="Primary Button Label" value={content.home.finalCta.primaryCtaLabel} onChange={value => updateField('home.finalCta.primaryCtaLabel', value)} />
          <Field label="Primary Button Link" value={content.home.finalCta.primaryCtaHref} onChange={value => updateField('home.finalCta.primaryCtaHref', value)} />
          <Field label="Secondary Button Label" value={content.home.finalCta.secondaryCtaLabel} onChange={value => updateField('home.finalCta.secondaryCtaLabel', value)} />
          <Field label="Secondary Button Link" value={content.home.finalCta.secondaryCtaHref} onChange={value => updateField('home.finalCta.secondaryCtaHref', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Heading" rows={2} value={content.home.finalCta.title} onChange={value => updateField('home.finalCta.title', value)} />
          <TextField label="Description" rows={3} value={content.home.finalCta.subtitle} onChange={value => updateField('home.finalCta.subtitle', value)} />
        </div>
      </SectionCard>
    </div>
  )

  const renderPricingTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Pricing Hero" description="Visible pricing page hero and builder labels.">
        <FieldGrid>
          <Field label="Page Title" value={content.pricingPage.heroTitle} onChange={value => updateField('pricingPage.heroTitle', value)} />
          <Field label="Builder Eyebrow" value={content.pricingPage.builder.eyebrow} onChange={value => updateField('pricingPage.builder.eyebrow', value)} />
          <Field label="Builder Title" value={content.pricingPage.builder.title} onChange={value => updateField('pricingPage.builder.title', value)} />
          <Field label="FAQ Title" value={content.pricingPage.faqTitle} onChange={value => updateField('pricingPage.faqTitle', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Page Subtitle" rows={3} value={content.pricingPage.heroSubtitle} onChange={value => updateField('pricingPage.heroSubtitle', value)} />
          <TextField label="Builder Subtitle" rows={3} value={content.pricingPage.builder.subtitle} onChange={value => updateField('pricingPage.builder.subtitle', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Calculator Labels" description="Display-only pricing copy. No billing logic is changed here.">
        <FieldGrid>
          <Field label="Build Plan Tab Label" value={content.pricingPage.calculator.planTabLabel} onChange={value => updateField('pricingPage.calculator.planTabLabel', value)} />
          <Field label="Extra Credits Tab Label" value={content.pricingPage.calculator.creditsTabLabel} onChange={value => updateField('pricingPage.calculator.creditsTabLabel', value)} />
          <Field label="Summary Title" value={content.pricingPage.calculator.summaryTitle} onChange={value => updateField('pricingPage.calculator.summaryTitle', value)} />
          <Field label="Monthly Total Label" value={content.pricingPage.calculator.monthlyTotalLabel} onChange={value => updateField('pricingPage.calculator.monthlyTotalLabel', value)} />
          <Field label="Monthly Credits Label" value={content.pricingPage.calculator.monthlyCreditsLabel} onChange={value => updateField('pricingPage.calculator.monthlyCreditsLabel', value)} />
          <Field label="Website Setup Label" value={content.pricingPage.calculator.websiteSetupLabel} onChange={value => updateField('pricingPage.calculator.websiteSetupLabel', value)} />
          <Field label="WhatsApp CTA Label" value={content.pricingPage.calculator.whatsappCtaLabel} onChange={value => updateField('pricingPage.calculator.whatsappCtaLabel', value)} />
          <Field label="Custom Package Title" value={content.pricingPage.calculator.customPackageTitle} onChange={value => updateField('pricingPage.calculator.customPackageTitle', value)} />
          <Field label="Custom Package Button" value={content.pricingPage.calculator.customPackageButtonLabel} onChange={value => updateField('pricingPage.calculator.customPackageButtonLabel', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Plan Intro" rows={3} value={content.pricingPage.calculator.planIntro} onChange={value => updateField('pricingPage.calculator.planIntro', value)} />
          <TextField label="Credits Intro" rows={3} value={content.pricingPage.calculator.creditsIntro} onChange={value => updateField('pricingPage.calculator.creditsIntro', value)} />
          <TextField label="Empty State Text" rows={2} value={content.pricingPage.calculator.emptyStateText} onChange={value => updateField('pricingPage.calculator.emptyStateText', value)} />
          <TextField label="Custom Package Text" rows={3} value={content.pricingPage.calculator.customPackageText} onChange={value => updateField('pricingPage.calculator.customPackageText', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Tool Cards" description="Display content for pricing tool cards.">
        <ListToolbar
          label="Pricing Tools"
          onAdd={() =>
            addListItem('pricingPage.calculator.tools', {
              icon: '✨',
              name: 'New Tool',
              description: '',
              detail: '',
              credits: 100,
              unit: 'per action',
              monthly: 999
            })
          }
        />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.pricingPage.calculator.tools.map((item, index) => (
            <ItemShell key={`pricing-tool-${index}`} title={`Pricing Tool ${index + 1}`} onRemove={() => removeListItem('pricingPage.calculator.tools', index)}>
              <FieldGrid>
                <Field label="Icon" value={item.icon} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'icon', value)} />
                <Field label="Name" value={item.name} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'name', value)} />
                <Field label="Monthly Price Display" type="number" value={item.monthly} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'monthly', Number(value) || 0)} />
                <Field label="Setup Fee Display" type="number" value={item.oneTime || 0} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'oneTime', Number(value) || 0)} />
                <Field label="Credits Amount" type="number" value={item.credits} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'credits', Number(value) || 0)} />
                <Field label="Credits Unit" value={item.unit} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'unit', value)} />
              </FieldGrid>
              <TextField label="Description" rows={2} value={item.description} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'description', value)} />
              <TextField label="Detail Text" rows={3} value={item.detail} onChange={value => updateListItem('pricingPage.calculator.tools', index, 'detail', value)} />
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Credit Packs" description="Editable display packs for extra credits.">
        <ListToolbar label="Credit Packs" onAdd={() => addListItem('pricingPage.calculator.creditPacks', { credits: 100, price: 99, label: 'New Pack', popular: false })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.pricingPage.calculator.creditPacks.map((item, index) => (
            <ItemShell key={`credit-pack-${index}`} title={`Credit Pack ${index + 1}`} onRemove={() => removeListItem('pricingPage.calculator.creditPacks', index)}>
              <FieldGrid>
                <Field label="Label" value={item.label} onChange={value => updateListItem('pricingPage.calculator.creditPacks', index, 'label', value)} />
                <Field label="Credits" type="number" value={item.credits} onChange={value => updateListItem('pricingPage.calculator.creditPacks', index, 'credits', Number(value) || 0)} />
                <Field label="Price" type="number" value={item.price} onChange={value => updateListItem('pricingPage.calculator.creditPacks', index, 'price', Number(value) || 0)} />
                <Field label="Popular" value={item.popular ? 'Yes' : 'No'} onChange={value => updateListItem('pricingPage.calculator.creditPacks', index, 'popular', value.toLowerCase() === 'yes')} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="FAQs" description="Repeatable pricing FAQs.">
        <ListToolbar label="Pricing FAQs" onAdd={() => addListItem('pricingPage.faqs', { question: 'New question?', answer: 'New answer.' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.pricingPage.faqs.map((item, index) => (
            <ItemShell key={`pricing-faq-${index}`} title={`FAQ ${index + 1}`} onRemove={() => removeListItem('pricingPage.faqs', index)}>
              <TextField label="Question" rows={2} value={item.question} onChange={value => updateListItem('pricingPage.faqs', index, 'question', value)} />
              <TextField label="Answer" rows={4} value={item.answer} onChange={value => updateListItem('pricingPage.faqs', index, 'answer', value)} />
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="Bottom pricing CTA block.">
        <FieldGrid>
          <Field label="Button Label" value={content.pricingPage.finalCta.buttonLabel} onChange={value => updateField('pricingPage.finalCta.buttonLabel', value)} />
          <Field label="Button Link" value={content.pricingPage.finalCta.buttonHref} onChange={value => updateField('pricingPage.finalCta.buttonHref', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Heading" rows={2} value={content.pricingPage.finalCta.title} onChange={value => updateField('pricingPage.finalCta.title', value)} />
          <TextField label="Description" rows={3} value={content.pricingPage.finalCta.subtitle} onChange={value => updateField('pricingPage.finalCta.subtitle', value)} />
        </div>
      </SectionCard>
    </div>
  )

  const renderToolsTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Tools Hero" description="Tools page hero content.">
        <FieldGrid>
          <Field label="Hero Title" value={content.toolsPage.heroTitle} onChange={value => updateField('toolsPage.heroTitle', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Hero Subtitle" rows={3} value={content.toolsPage.heroSubtitle} onChange={value => updateField('toolsPage.heroSubtitle', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Tool Cards" description="Editable list for the tools page cards.">
        <ListToolbar
          label="Tools"
          onAdd={() =>
            addListItem('toolsPage.tools', {
              icon: '✨',
              name: 'New Tool',
              tagline: 'New Tagline',
              description: '',
              features: ['Feature'],
              credits: '100 credits per action',
              badge: 'Built by ScaleVyapar',
              badgeColor: '#0369a1',
              badgeBg: '#e0f2fe',
              useCases: ['Use case']
            })
          }
        />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.toolsPage.tools.map((item, index) => (
            <ItemShell key={`tool-page-card-${index}`} title={`Tool Card ${index + 1}`} onRemove={() => removeListItem('toolsPage.tools', index)}>
              <FieldGrid>
                <Field label="Icon" value={item.icon} onChange={value => updateListItem('toolsPage.tools', index, 'icon', value)} />
                <Field label="Name" value={item.name} onChange={value => updateListItem('toolsPage.tools', index, 'name', value)} />
                <Field label="Tagline" value={item.tagline} onChange={value => updateListItem('toolsPage.tools', index, 'tagline', value)} />
                <Field label="Credits Text" value={item.credits} onChange={value => updateListItem('toolsPage.tools', index, 'credits', value)} />
                <Field label="Badge Text" value={item.badge} onChange={value => updateListItem('toolsPage.tools', index, 'badge', value)} />
                <Field label="Badge Color" type="color" value={item.badgeColor} onChange={value => updateListItem('toolsPage.tools', index, 'badgeColor', value)} />
                <Field label="Badge Background" type="color" value={item.badgeBg} onChange={value => updateListItem('toolsPage.tools', index, 'badgeBg', value)} />
                <Field label="One-time Display" value={item.oneTime || ''} onChange={value => updateListItem('toolsPage.tools', index, 'oneTime', value)} />
              </FieldGrid>
              <TextField label="Description" rows={3} value={item.description} onChange={value => updateListItem('toolsPage.tools', index, 'description', value)} />
              <TextField
                label="Features (one per line)"
                rows={5}
                value={item.features.join('\n')}
                onChange={value => updateListItem('toolsPage.tools', index, 'features', value.split('\n').map(feature => feature.trim()).filter(Boolean))}
              />
              <TextField
                label="Use Cases (one per line)"
                rows={4}
                value={item.useCases.join('\n')}
                onChange={value => updateListItem('toolsPage.tools', index, 'useCases', value.split('\n').map(feature => feature.trim()).filter(Boolean))}
              />
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="Tools page CTA section.">
        <FieldGrid>
          <Field label="Primary CTA Label" value={content.toolsPage.finalCta.primaryCtaLabel} onChange={value => updateField('toolsPage.finalCta.primaryCtaLabel', value)} />
          <Field label="Primary CTA Link" value={content.toolsPage.finalCta.primaryCtaHref} onChange={value => updateField('toolsPage.finalCta.primaryCtaHref', value)} />
          <Field label="Secondary CTA Label" value={content.toolsPage.finalCta.secondaryCtaLabel} onChange={value => updateField('toolsPage.finalCta.secondaryCtaLabel', value)} />
          <Field label="Secondary CTA Link" value={content.toolsPage.finalCta.secondaryCtaHref} onChange={value => updateField('toolsPage.finalCta.secondaryCtaHref', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Heading" rows={2} value={content.toolsPage.finalCta.title} onChange={value => updateField('toolsPage.finalCta.title', value)} />
          <TextField label="Description" rows={3} value={content.toolsPage.finalCta.subtitle} onChange={value => updateField('toolsPage.finalCta.subtitle', value)} />
        </div>
      </SectionCard>
    </div>
  )

  const renderAboutTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="About Hero" description="Top hero content for the about page.">
        <FieldGrid>
          <Field label="Hero Title" value={content.aboutPage.heroTitle} onChange={value => updateField('aboutPage.heroTitle', value)} />
          <Field label="Story Title" value={content.aboutPage.storyTitle} onChange={value => updateField('aboutPage.storyTitle', value)} />
          <Field label="Location Line" value={content.aboutPage.locationLine} onChange={value => updateField('aboutPage.locationLine', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Hero Subtitle" rows={3} value={content.aboutPage.heroSubtitle} onChange={value => updateField('aboutPage.heroSubtitle', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Story Paragraphs" description="Repeatable story content blocks.">
        <ListToolbar label="Story Paragraphs" onAdd={() => addListItem('aboutPage.storyParagraphs', 'New paragraph')} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.aboutPage.storyParagraphs.map((item, index) => (
            <ItemShell key={`about-paragraph-${index}`} title={`Paragraph ${index + 1}`} onRemove={() => removeListItem('aboutPage.storyParagraphs', index)}>
              <TextField label="Paragraph" rows={4} value={item} onChange={value => {
                const next = [...content.aboutPage.storyParagraphs]
                next[index] = value
                updateField('aboutPage.storyParagraphs', next)
              }} />
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="About Stats" description="Editable list of about-page stats.">
        <ListToolbar label="Stats" onAdd={() => addListItem('aboutPage.stats', { icon: '✨', text: '100', label: 'New Stat' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.aboutPage.stats.map((item, index) => (
            <ItemShell key={`about-stat-${index}`} title={`Stat ${index + 1}`} onRemove={() => removeListItem('aboutPage.stats', index)}>
              <FieldGrid>
                <Field label="Icon" value={item.icon} onChange={value => updateListItem('aboutPage.stats', index, 'icon', value)} />
                <Field label="Value" value={item.value || ''} onChange={value => updateListItem('aboutPage.stats', index, 'value', value ? Number(value) : undefined)} />
                <Field label="Text" value={item.text || ''} onChange={value => updateListItem('aboutPage.stats', index, 'text', value)} />
                <Field label="Suffix" value={item.suffix || ''} onChange={value => updateListItem('aboutPage.stats', index, 'suffix', value)} />
                <Field label="Label" value={item.label} onChange={value => updateListItem('aboutPage.stats', index, 'label', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Mission & Vision" description="Mission section header and cards.">
        <FieldGrid>
          <Field label="Eyebrow" value={content.aboutPage.mission.eyebrow} onChange={value => updateField('aboutPage.mission.eyebrow', value)} />
          <Field label="Title" value={content.aboutPage.mission.title} onChange={value => updateField('aboutPage.mission.title', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Subtitle" rows={3} value={content.aboutPage.mission.subtitle} onChange={value => updateField('aboutPage.mission.subtitle', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Mission Cards" onAdd={() => addListItem('aboutPage.mission.cards', { icon: '✨', title: 'New Card', description: '' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.aboutPage.mission.cards.map((item, index) => (
              <ItemShell key={`mission-card-${index}`} title={`Mission Card ${index + 1}`} onRemove={() => removeListItem('aboutPage.mission.cards', index)}>
                <FieldGrid>
                  <Field label="Icon" value={item.icon} onChange={value => updateListItem('aboutPage.mission.cards', index, 'icon', value)} />
                  <Field label="Title" value={item.title} onChange={value => updateListItem('aboutPage.mission.cards', index, 'title', value)} />
                </FieldGrid>
                <TextField label="Description" rows={4} value={item.description} onChange={value => updateListItem('aboutPage.mission.cards', index, 'description', value)} />
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Values" description="Values section header and cards.">
        <FieldGrid>
          <Field label="Eyebrow" value={content.aboutPage.values.eyebrow} onChange={value => updateField('aboutPage.values.eyebrow', value)} />
          <Field label="Title" value={content.aboutPage.values.title} onChange={value => updateField('aboutPage.values.title', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Subtitle" rows={3} value={content.aboutPage.values.subtitle} onChange={value => updateField('aboutPage.values.subtitle', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Value Cards" onAdd={() => addListItem('aboutPage.values.cards', { icon: '✨', title: 'New Value', description: '' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.aboutPage.values.cards.map((item, index) => (
              <ItemShell key={`value-card-${index}`} title={`Value Card ${index + 1}`} onRemove={() => removeListItem('aboutPage.values.cards', index)}>
                <FieldGrid>
                  <Field label="Icon" value={item.icon} onChange={value => updateListItem('aboutPage.values.cards', index, 'icon', value)} />
                  <Field label="Title" value={item.title} onChange={value => updateListItem('aboutPage.values.cards', index, 'title', value)} />
                </FieldGrid>
                <TextField label="Description" rows={4} value={item.description} onChange={value => updateListItem('aboutPage.values.cards', index, 'description', value)} />
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="Bottom about-page CTA.">
        <FieldGrid>
          <Field label="Primary CTA Label" value={content.aboutPage.finalCta.primaryCtaLabel} onChange={value => updateField('aboutPage.finalCta.primaryCtaLabel', value)} />
          <Field label="Primary CTA Link" value={content.aboutPage.finalCta.primaryCtaHref} onChange={value => updateField('aboutPage.finalCta.primaryCtaHref', value)} />
          <Field label="Secondary CTA Label" value={content.aboutPage.finalCta.secondaryCtaLabel} onChange={value => updateField('aboutPage.finalCta.secondaryCtaLabel', value)} />
          <Field label="Secondary CTA Link" value={content.aboutPage.finalCta.secondaryCtaHref} onChange={value => updateField('aboutPage.finalCta.secondaryCtaHref', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Heading" rows={2} value={content.aboutPage.finalCta.title} onChange={value => updateField('aboutPage.finalCta.title', value)} />
          <TextField label="Description" rows={3} value={content.aboutPage.finalCta.subtitle} onChange={value => updateField('aboutPage.finalCta.subtitle', value)} />
        </div>
      </SectionCard>
    </div>
  )

  const renderContactTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Contact Hero" description="Contact page hero and info title.">
        <FieldGrid>
          <Field label="Hero Title" value={content.contactPage.heroTitle} onChange={value => updateField('contactPage.heroTitle', value)} />
          <Field label="Info Title" value={content.contactPage.infoTitle} onChange={value => updateField('contactPage.infoTitle', value)} />
          <Field label="Business Hours Title" value={content.contactPage.hoursTitle} onChange={value => updateField('contactPage.hoursTitle', value)} />
          <Field label="FAQ Title" value={content.contactPage.faqTitle} onChange={value => updateField('contactPage.faqTitle', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Hero Subtitle" rows={3} value={content.contactPage.heroSubtitle} onChange={value => updateField('contactPage.heroSubtitle', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Contact Cards" description="Edit the visible contact cards.">
        <div style={{ display: 'grid', gap: '12px' }}>
          {(['whatsapp', 'phone', 'email', 'location'] as const).map(cardKey => {
            const card = content.contactPage.cards[cardKey]
            const linkValue = 'href' in card ? card.href : ''
            return (
              <ItemShell key={cardKey} title={cardKey.toUpperCase()} onRemove={() => undefined}>
                <FieldGrid>
                  <Field label="Icon" value={card.icon} onChange={value => updateField(`contactPage.cards.${cardKey}.icon`, value)} />
                  <Field label="Title" value={card.title} onChange={value => updateField(`contactPage.cards.${cardKey}.title`, value)} />
                  <Field label="Value" value={card.value} onChange={value => updateField(`contactPage.cards.${cardKey}.value`, value)} />
                  <Field label="Helper" value={card.helper} onChange={value => updateField(`contactPage.cards.${cardKey}.helper`, value)} />
                  <Field label="Link" value={linkValue} onChange={value => updateField(`contactPage.cards.${cardKey}.href`, value)} />
                </FieldGrid>
              </ItemShell>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Business Hours" description="Repeatable business hours rows.">
        <ListToolbar label="Hours" onAdd={() => addListItem('contactPage.hours', { day: 'New Day', time: '9:00 AM - 5:00 PM' })} />
        <div style={{ display: 'grid', gap: '12px' }}>
          {content.contactPage.hours.map((item, index) => (
            <ItemShell key={`hour-${index}`} title={`Hours Row ${index + 1}`} onRemove={() => removeListItem('contactPage.hours', index)}>
              <FieldGrid>
                <Field label="Day" value={item.day} onChange={value => updateListItem('contactPage.hours', index, 'day', value)} />
                <Field label="Time" value={item.time} onChange={value => updateListItem('contactPage.hours', index, 'time', value)} />
              </FieldGrid>
            </ItemShell>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Form Copy" description="All visible form labels, placeholders, and button text.">
        <FieldGrid>
          <Field label="Form Title" value={content.contactPage.form.title} onChange={value => updateField('contactPage.form.title', value)} />
          <Field label="Submit Button Label" value={content.contactPage.form.submitLabel} onChange={value => updateField('contactPage.form.submitLabel', value)} />
          <Field label="Reset Button Label" value={content.contactPage.form.resetLabel} onChange={value => updateField('contactPage.form.resetLabel', value)} />
          <Field label="Tool Placeholder" value={content.contactPage.form.fields.toolPlaceholder} onChange={value => updateField('contactPage.form.fields.toolPlaceholder', value)} />
        </FieldGrid>
        <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
          <FieldGrid>
            <Field label="Name Label" value={content.contactPage.form.fields.nameLabel} onChange={value => updateField('contactPage.form.fields.nameLabel', value)} />
            <Field label="Name Placeholder" value={content.contactPage.form.fields.namePlaceholder} onChange={value => updateField('contactPage.form.fields.namePlaceholder', value)} />
            <Field label="Phone Label" value={content.contactPage.form.fields.phoneLabel} onChange={value => updateField('contactPage.form.fields.phoneLabel', value)} />
            <Field label="Phone Placeholder" value={content.contactPage.form.fields.phonePlaceholder} onChange={value => updateField('contactPage.form.fields.phonePlaceholder', value)} />
            <Field label="Email Label" value={content.contactPage.form.fields.emailLabel} onChange={value => updateField('contactPage.form.fields.emailLabel', value)} />
            <Field label="Email Placeholder" value={content.contactPage.form.fields.emailPlaceholder} onChange={value => updateField('contactPage.form.fields.emailPlaceholder', value)} />
            <Field label="Business Label" value={content.contactPage.form.fields.businessLabel} onChange={value => updateField('contactPage.form.fields.businessLabel', value)} />
            <Field label="Business Placeholder" value={content.contactPage.form.fields.businessPlaceholder} onChange={value => updateField('contactPage.form.fields.businessPlaceholder', value)} />
            <Field label="Tool Label" value={content.contactPage.form.fields.toolLabel} onChange={value => updateField('contactPage.form.fields.toolLabel', value)} />
            <Field label="Message Label" value={content.contactPage.form.fields.messageLabel} onChange={value => updateField('contactPage.form.fields.messageLabel', value)} />
          </FieldGrid>
          <TextField label="Message Placeholder" rows={3} value={content.contactPage.form.fields.messagePlaceholder} onChange={value => updateField('contactPage.form.fields.messagePlaceholder', value)} />
          <TextField
            label="Tool Options (one per line)"
            rows={6}
            value={content.contactPage.form.toolOptions.join('\n')}
            onChange={value => updateField('contactPage.form.toolOptions', value.split('\n').map(item => item.trim()).filter(Boolean))}
          />
        </div>
      </SectionCard>

      <SectionCard title="Success Message, FAQs, and CTA" description="Visible confirmation copy and supporting content.">
        <FieldGrid>
          <Field label="Success Icon" value={content.contactPage.success.icon} onChange={value => updateField('contactPage.success.icon', value)} />
          <Field label="Success Title" value={content.contactPage.success.title} onChange={value => updateField('contactPage.success.title', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
          <TextField label="Success Message" rows={3} value={content.contactPage.success.message} onChange={value => updateField('contactPage.success.message', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Contact FAQs" onAdd={() => addListItem('contactPage.faqs', { question: 'New question?', answer: 'New answer.' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.contactPage.faqs.map((item, index) => (
              <ItemShell key={`contact-faq-${index}`} title={`FAQ ${index + 1}`} onRemove={() => removeListItem('contactPage.faqs', index)}>
                <TextField label="Question" rows={2} value={item.question} onChange={value => updateListItem('contactPage.faqs', index, 'question', value)} />
                <TextField label="Answer" rows={4} value={item.answer} onChange={value => updateListItem('contactPage.faqs', index, 'answer', value)} />
              </ItemShell>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <FieldGrid>
            <Field label="CTA Button Label" value={content.contactPage.finalCta.buttonLabel} onChange={value => updateField('contactPage.finalCta.buttonLabel', value)} />
            <Field label="CTA Button Link" value={content.contactPage.finalCta.buttonHref} onChange={value => updateField('contactPage.finalCta.buttonHref', value)} />
          </FieldGrid>
          <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
            <TextField label="CTA Heading" rows={2} value={content.contactPage.finalCta.title} onChange={value => updateField('contactPage.finalCta.title', value)} />
            <TextField label="CTA Description" rows={3} value={content.contactPage.finalCta.subtitle} onChange={value => updateField('contactPage.finalCta.subtitle', value)} />
          </div>
        </div>
      </SectionCard>
    </div>
  )

  const renderLoginTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      <SectionCard title="Left Marketing Panel" description="Visible login marketing content only.">
        <FieldGrid>
          <Field label="Marketing Headline" value={content.loginPage.left.title} onChange={value => updateField('loginPage.left.title', value)} />
          <Field label="Trusted Line" value={content.loginPage.left.trustedLine} onChange={value => updateField('loginPage.left.trustedLine', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Description" rows={3} value={content.loginPage.left.subtitle} onChange={value => updateField('loginPage.left.subtitle', value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Feature List" onAdd={() => addListItem('loginPage.left.features', { icon: 'N', text: 'New feature' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {content.loginPage.left.features.map((item, index) => (
              <ItemShell key={`login-feature-${index}`} title={`Feature ${index + 1}`} onRemove={() => removeListItem('loginPage.left.features', index)}>
                <FieldGrid>
                  <Field label="Icon" value={item.icon} onChange={value => updateListItem('loginPage.left.features', index, 'icon', value)} />
                  <Field label="Text" value={item.text} onChange={value => updateListItem('loginPage.left.features', index, 'text', value)} />
                </FieldGrid>
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Login Form Copy" description="Form headings, labels, placeholders, and button text.">
        <FieldGrid>
          <Field label="Form Title" value={content.loginPage.right.title} onChange={value => updateField('loginPage.right.title', value)} />
          <Field label="Form Subtitle" value={content.loginPage.right.subtitle} onChange={value => updateField('loginPage.right.subtitle', value)} />
          <Field label="Email Label" value={content.loginPage.right.emailLabel} onChange={value => updateField('loginPage.right.emailLabel', value)} />
          <Field label="Email Placeholder" value={content.loginPage.right.emailPlaceholder} onChange={value => updateField('loginPage.right.emailPlaceholder', value)} />
          <Field label="Password Label" value={content.loginPage.right.passwordLabel} onChange={value => updateField('loginPage.right.passwordLabel', value)} />
          <Field label="Password Placeholder" value={content.loginPage.right.passwordPlaceholder} onChange={value => updateField('loginPage.right.passwordPlaceholder', value)} />
          <Field label="Sign In Button" value={content.loginPage.right.submitLabel} onChange={value => updateField('loginPage.right.submitLabel', value)} />
          <Field label="Submitting Button" value={content.loginPage.right.submittingLabel} onChange={value => updateField('loginPage.right.submittingLabel', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Footer / Copyright" rows={2} value={content.loginPage.right.footerText} onChange={value => updateField('loginPage.right.footerText', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Forgot Password Modal" description="Forgot password modal copy.">
        <FieldGrid>
          <Field label="Trigger Label" value={content.loginPage.forgotPassword.triggerLabel} onChange={value => updateField('loginPage.forgotPassword.triggerLabel', value)} />
          <Field label="Modal Title" value={content.loginPage.forgotPassword.title} onChange={value => updateField('loginPage.forgotPassword.title', value)} />
          <Field label="Email Label" value={content.loginPage.forgotPassword.emailLabel} onChange={value => updateField('loginPage.forgotPassword.emailLabel', value)} />
          <Field label="Email Placeholder" value={content.loginPage.forgotPassword.emailPlaceholder} onChange={value => updateField('loginPage.forgotPassword.emailPlaceholder', value)} />
          <Field label="Cancel Label" value={content.loginPage.forgotPassword.cancelLabel} onChange={value => updateField('loginPage.forgotPassword.cancelLabel', value)} />
          <Field label="Submit Label" value={content.loginPage.forgotPassword.submitLabel} onChange={value => updateField('loginPage.forgotPassword.submitLabel', value)} />
          <Field label="Submitting Label" value={content.loginPage.forgotPassword.submittingLabel} onChange={value => updateField('loginPage.forgotPassword.submittingLabel', value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Subtitle" rows={3} value={content.loginPage.forgotPassword.subtitle} onChange={value => updateField('loginPage.forgotPassword.subtitle', value)} />
        </div>
      </SectionCard>
    </div>
  )

  const renderLegalEditor = (
    path: 'privacyPolicy' | 'termsOfService' | 'userDataDeletion',
    title: string
  ) => {
    const page = content.legalPages[path]

    return (
      <SectionCard key={path} title={title} description="Editable legal page content with repeatable sections.">
        <FieldGrid>
          <Field label="Eyebrow" value={page.eyebrow} onChange={value => updateField(`legalPages.${path}.eyebrow`, value)} />
          <Field label="Title" value={page.title} onChange={value => updateField(`legalPages.${path}.title`, value)} />
        </FieldGrid>
        <div style={{ marginTop: '14px' }}>
          <TextField label="Subtitle" rows={3} value={page.subtitle} onChange={value => updateField(`legalPages.${path}.subtitle`, value)} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <ListToolbar label="Sections" onAdd={() => addListItem(`legalPages.${path}.sections`, { title: 'New Section', body: 'New body text.' })} />
          <div style={{ display: 'grid', gap: '12px' }}>
            {page.sections.map((item, index) => (
              <ItemShell key={`${path}-section-${index}`} title={`Section ${index + 1}`} onRemove={() => removeListItem(`legalPages.${path}.sections`, index)}>
                <TextField label="Heading" rows={2} value={item.title} onChange={value => updateListItem(`legalPages.${path}.sections`, index, 'title', value)} />
                <TextField label="Body" rows={5} value={item.body} onChange={value => updateListItem(`legalPages.${path}.sections`, index, 'body', value)} />
              </ItemShell>
            ))}
          </div>
        </div>
      </SectionCard>
    )
  }

  const renderLegalTab = () => (
    <div style={{ display: 'grid', gap: '18px' }}>
      {renderLegalEditor('privacyPolicy', 'Privacy Policy')}
      {renderLegalEditor('termsOfService', 'Terms of Service')}
      {renderLegalEditor('userDataDeletion', 'User Data Deletion')}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theme':
        return renderThemeTab()
      case 'headerFooter':
        return renderHeaderFooterTab()
      case 'home':
        return renderHomeTab()
      case 'pricing':
        return renderPricingTab()
      case 'tools':
        return renderToolsTab()
      case 'about':
        return renderAboutTab()
      case 'contact':
        return renderContactTab()
      case 'login':
        return renderLoginTab()
      case 'legal':
        return renderLegalTab()
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eaf1fb 0%, #f8fafc 40%, #ffffff 100%)',
        padding: '28px 20px 48px',
        color: '#0f172a',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section
          style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.96)',
            borderRadius: '26px',
            padding: '24px',
            boxShadow: '0 20px 44px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '8px' }}>
                Admin / Website Editor
              </div>
              <h1 style={{ margin: '0 0 8px', fontSize: '34px', lineHeight: 1.1, fontWeight: 900 }}>Main Website Editor</h1>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, maxWidth: '760px' }}>
                Edit the main ScaleVyapar marketing website with normal form fields. This uses the same
                <code style={{ marginLeft: '6px' }}>main-website</code> content record and public pages update from the saved data.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/admin" style={{ textDecoration: 'none', background: '#ffffff', color: '#334155', border: '1px solid #d8e1ee', padding: '12px 16px', borderRadius: '14px', fontWeight: 700 }}>
                ← Back to Admin
              </Link>
              <a href="/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: '#ffffff', color: '#334155', border: '1px solid #d8e1ee', padding: '12px 16px', borderRadius: '14px', fontWeight: 700 }}>
                Open Main Site ↗
              </a>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  cursor: saving || loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.16)'
                }}
              >
                {saving ? 'Saving Website...' : 'Save Website'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
            <span style={{ background: '#eef2ff', color: '#3730a3', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
              Storage: {storage}
            </span>
            <span style={{ background: '#f8fafc', color: '#475569', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
              Record ID: main-website
            </span>
            <span style={{ background: '#f8fafc', color: '#475569', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
              Table: labour_website_content
            </span>
          </div>

          {message ? (
            <div style={{ marginTop: '16px', background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '16px', padding: '14px 16px', fontWeight: 700 }}>
              {message}
            </div>
          ) : null}

          {error ? (
            <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '16px', padding: '14px 16px', fontWeight: 700 }}>
              {error}
            </div>
          ) : null}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '20px' }}>
          <aside
            style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.96)',
              borderRadius: '24px',
              padding: '16px',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
              alignSelf: 'start'
            }}
          >
            <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '12px' }}>
              Sections
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '16px',
                    border: activeTab === tab.id ? '1px solid #1d4ed8' : '1px solid #d8e1ee',
                    background: activeTab === tab.id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{tab.label}</div>
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#64748b' }}>{tab.description}</div>
                </button>
              ))}
            </div>
          </aside>

          <section
            style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.96)',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
              display: 'grid',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900 }}>{currentTabMeta.label}</h2>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{currentTabMeta.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={resetCurrentTab}
                  disabled={loading}
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #d8e1ee',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Reset Tab
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedJson(prev => !prev)}
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #d8e1ee',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {showAdvancedJson ? 'Hide Advanced JSON' : 'Show Advanced JSON'}
                </button>
              </div>
            </div>

            {renderTabContent()}

            {showAdvancedJson ? (
              <SectionCard title="Advanced JSON" description="Optional raw JSON editor for this tab. Normal editing should happen with the fields above.">
                <textarea
                  value={jsonDraft}
                  onChange={event => setJsonDraft(event.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    minHeight: '340px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    fontFamily: 'Consolas, Menlo, Monaco, monospace',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={applyAdvancedJson}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Apply JSON to This Tab
                  </button>
                </div>
              </SectionCard>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  )
}
