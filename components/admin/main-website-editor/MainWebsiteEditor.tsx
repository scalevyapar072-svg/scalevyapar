'use client'

import { useEffect, useState } from 'react'
import type {
  MainWebsiteComparisonRow,
  MainWebsiteContent,
  MainWebsiteFeatureCard,
  MainWebsiteLinkItem,
  MainWebsitePlan,
  MainWebsitePreviewMetric,
  MainWebsiteProductPreviewCard,
  MainWebsiteSeoPageKey,
  MainWebsiteStatItem,
  MainWebsiteTestimonial,
  MainWebsiteProcessStep
} from '@/lib/main-website-content'
import styles from './main-website-editor.module.css'

type EditorTab =
  | 'theme'
  | 'header'
  | 'hero'
  | 'stats'
  | 'tools'
  | 'features'
  | 'product'
  | 'process'
  | 'pricing'
  | 'testimonials'
  | 'comparison'
  | 'cta'
  | 'footer'
  | 'seo'
  | 'floating'

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

const textareaStyle = { ...inputStyle, resize: 'vertical' as const, minHeight: '94px' }

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(226, 232, 240, 0.96)',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)'
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

const labelStyle = {
  fontSize: '12px',
  color: '#475569',
  fontWeight: '700' as const,
  display: 'block' as const,
  marginBottom: '6px'
}

const tabs: Array<{ id: EditorTab; label: string; description: string }> = [
  { id: 'theme', label: 'Theme', description: 'Colors, brand, logo, typography, and radius settings.' },
  { id: 'header', label: 'Header', description: 'Navigation, login button, CTA button, and header behavior.' },
  { id: 'hero', label: 'Hero', description: 'Hero content, visual paths, buttons, and highlight badges.' },
  { id: 'stats', label: 'Stats', description: 'Homepage stats with icons, descriptions, and visibility toggles.' },
  { id: 'tools', label: 'Tools / Services', description: 'The service cards shown on the main homepage.' },
  { id: 'features', label: 'Features', description: 'Dark benefits section shown after process.' },
  { id: 'product', label: 'Product Cards', description: 'Tool preview cards and mock data blocks.' },
  { id: 'process', label: 'Process / Steps', description: 'Three-step workflow section and ordering.' },
  { id: 'pricing', label: 'Pricing / Custom Plan', description: 'Homepage pricing teaser and plan cards.' },
  { id: 'testimonials', label: 'Testimonials', description: 'Client reviews, ratings, avatars, and order.' },
  { id: 'comparison', label: 'Comparison', description: 'ScaleVyapar vs Others title, labels, rows, and CTA.' },
  { id: 'cta', label: 'CTA Banner', description: 'Final call-to-action banner shown before the footer.' },
  { id: 'footer', label: 'Footer', description: 'Footer logo, links, contact details, and social links.' },
  { id: 'seo', label: 'SEO / Meta', description: 'Site title, descriptions, OG image, and page metadata.' },
  { id: 'floating', label: 'Floating Contact', description: 'WhatsApp floating button number, message, and position.' }
]

const seoPageKeys: MainWebsiteSeoPageKey[] = ['home', 'about', 'services', 'pricing', 'contact', 'terms', 'privacy', 'refund', 'disclaimer']

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean)

const joinLines = (value: string[]) => value.join('\n')

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const copy = [...items]
  ;[copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]]
  return copy
}

function Field({
  label,
  value,
  onChange,
  placeholder = ''
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = ''
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} placeholder={placeholder} style={textareaStyle} />
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionCard} style={cardStyle}>
      <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '19px' }}>{title}</h2>
        {description ? <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function RepeatableActions({
  onMoveUp,
  onMoveDown,
  onRemove,
  disableUp,
  disableDown
}: {
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  disableUp: boolean
  disableDown: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button type="button" onClick={onMoveUp} disabled={disableUp} style={{ ...subtleButtonStyle, opacity: disableUp ? 0.55 : 1 }}>Up</button>
      <button type="button" onClick={onMoveDown} disabled={disableDown} style={{ ...subtleButtonStyle, opacity: disableDown ? 0.55 : 1 }}>Down</button>
      <button type="button" onClick={onRemove} style={dangerButtonStyle}>Remove</button>
    </div>
  )
}

function ImageUploadField({
  label,
  value,
  onChange,
  uploadKey,
  onUpload,
  uploading,
  placeholder = ''
}: {
  label: string
  value: string
  onChange: (value: string) => void
  uploadKey: string
  onUpload: (file: File, uploadKey: string) => Promise<string>
  uploading: boolean
  placeholder?: string
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <div>
      <Field label={label} value={value} onChange={onChange} placeholder={placeholder} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={event => setSelectedFile(event.target.files?.[0] || null)}
          style={{ fontSize: '12px', color: '#475569', maxWidth: '100%' }}
        />
        <button
          type="button"
          onClick={async () => {
            if (!selectedFile) return
            const nextUrl = await onUpload(selectedFile, uploadKey)
            if (nextUrl) {
              onChange(nextUrl)
            }
          }}
          disabled={uploading}
          style={{ ...primaryButtonStyle, opacity: uploading ? 0.65 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>
      {value.trim() ? (
        <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} style={{ width: '100%', maxWidth: '260px', borderRadius: '12px', border: '1px solid #d8e1ee', background: '#f8fafc' }} />
        </div>
      ) : null}
    </div>
  )
}

function StringListEditor({
  label,
  values,
  onChange,
  addLabel = 'Add Item'
}: {
  label: string
  values: string[]
  onChange: (items: string[]) => void
  addLabel?: string
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{label}</p>
        <button type="button" onClick={() => onChange([...values, ''])} style={subtleButtonStyle}>{addLabel}</button>
      </div>
      {values.map((value, index) => (
        <div key={`${label}-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>{label} {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(values, index, -1))}
              onMoveDown={() => onChange(moveItem(values, index, 1))}
              onRemove={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === values.length - 1}
            />
          </div>
          <Field label="Value" value={value} onChange={nextValue => onChange(values.map((entry, itemIndex) => itemIndex === index ? nextValue : entry))} />
        </div>
      ))}
    </div>
  )
}

function LinkListEditor({
  label,
  items,
  onChange
}: {
  label: string
  items: MainWebsiteLinkItem[]
  onChange: (items: MainWebsiteLinkItem[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{label}</p>
        <button type="button" onClick={() => onChange([...items, { label: '', href: '' }])} style={subtleButtonStyle}>Add Link</button>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>{label} {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Label" value={item.label} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: value } : entry))} />
            <Field label="Link" value={item.href} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: value } : entry))} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatListEditor({
  items,
  onChange
}: {
  items: MainWebsiteStatItem[]
  onChange: (items: MainWebsiteStatItem[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Stats</p>
        <button type="button" onClick={() => onChange([...items, { value: '', label: '', description: '', icon: '', enabled: true }])} style={subtleButtonStyle}>Add Stat</button>
      </div>
      {items.map((item, index) => (
        <div key={`stat-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Stat {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Field label="Number / Value" value={item.value} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, value } : entry))} />
              <Field label="Label" value={item.label} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: value } : entry))} />
              <Field label="Icon" value={item.icon} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value } : entry))} />
            </div>
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FeatureCardListEditor({
  label,
  items,
  onChange
}: {
  label: string
  items: MainWebsiteFeatureCard[]
  onChange: (items: MainWebsiteFeatureCard[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{label}</p>
        <button type="button" onClick={() => onChange([...items, { icon: '', title: '', description: '', bullets: [''], badge: '', href: '', buttonLabel: '', enabled: true }])} style={subtleButtonStyle}>Add Card</button>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>{label} {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Icon" value={item.icon} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value } : entry))} />
              <Field label="Title" value={item.title} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
              <Field label="Badge" value={item.badge || ''} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, badge: value } : entry))} />
              <Field label="Button Label" value={item.buttonLabel || ''} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, buttonLabel: value } : entry))} />
              <Field label="Link" value={item.href || ''} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: value } : entry))} />
            </div>
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
            <TextAreaField label="Bullets (one per line)" value={joinLines(item.bullets)} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, bullets: splitLines(value) } : entry))} rows={4} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewMetricListEditor({
  label,
  metrics,
  onChange
}: {
  label: string
  metrics: MainWebsitePreviewMetric[]
  onChange: (items: MainWebsitePreviewMetric[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', fontWeight: 800 }}>{label}</p>
        <button type="button" onClick={() => onChange([...metrics, { label: '', value: '' }])} style={subtleButtonStyle}>Add Row</button>
      </div>
      {metrics.map((metric, index) => (
        <div key={`${label}-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Row {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(metrics, index, -1))}
              onMoveDown={() => onChange(moveItem(metrics, index, 1))}
              onRemove={() => onChange(metrics.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === metrics.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Label" value={metric.label} onChange={value => onChange(metrics.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: value } : entry))} />
            <Field label="Value" value={metric.value} onChange={value => onChange(metrics.map((entry, itemIndex) => itemIndex === index ? { ...entry, value } : entry))} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductCardListEditor({
  items,
  onChange
}: {
  items: MainWebsiteProductPreviewCard[]
  onChange: (items: MainWebsiteProductPreviewCard[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Product Cards</p>
        <button type="button" onClick={() => onChange([...items, { icon: '', name: '', tagline: '', description: '', ctaLabel: '', ctaHref: '', mockRows: [{ label: '', value: '' }], photoTags: [''], isPhoto: false, enabled: true }])} style={subtleButtonStyle}>Add Product Card</button>
      </div>
      {items.map((item, index) => (
        <div key={`product-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Product Card {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Icon" value={item.icon} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value } : entry))} />
              <Field label="Name" value={item.name} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: value } : entry))} />
              <Field label="Tagline" value={item.tagline} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, tagline: value } : entry))} />
              <Field label="CTA Label" value={item.ctaLabel} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaLabel: value } : entry))} />
              <Field label="CTA Link" value={item.ctaHref} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaHref: value } : entry))} />
            </div>
            <ToggleField label="Use photo / before-after preview mode" checked={item.isPhoto} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, isPhoto: value } : entry))} />
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
            <StringListEditor label="Photo Tag" values={item.photoTags} onChange={values => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, photoTags: values } : entry))} addLabel="Add Photo Tag" />
            <PreviewMetricListEditor label="Mockup Rows" metrics={item.mockRows} onChange={metrics => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, mockRows: metrics } : entry))} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProcessListEditor({
  items,
  onChange
}: {
  items: MainWebsiteProcessStep[]
  onChange: (items: MainWebsiteProcessStep[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Process Steps</p>
        <button type="button" onClick={() => onChange([...items, { step: '', icon: '', title: '', description: '', enabled: true }])} style={subtleButtonStyle}>Add Step</button>
      </div>
      {items.map((item, index) => (
        <div key={`step-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Step {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Field label="Step Number" value={item.step} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, step: value } : entry))} />
              <Field label="Icon" value={item.icon} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value } : entry))} />
              <Field label="Title" value={item.title} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
            </div>
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanListEditor({
  items,
  onChange
}: {
  items: MainWebsitePlan[]
  onChange: (items: MainWebsitePlan[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Plan Cards</p>
        <button type="button" onClick={() => onChange([...items, { name: '', price: '', cadence: '', description: '', badge: '', features: [''], buttonLabel: '', buttonHref: '', enabled: true }])} style={subtleButtonStyle}>Add Plan</button>
      </div>
      {items.map((item, index) => (
        <div key={`plan-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Plan {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Plan Name" value={item.name} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: value } : entry))} />
              <Field label="Price" value={item.price} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, price: value } : entry))} />
              <Field label="Cadence" value={item.cadence} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, cadence: value } : entry))} />
              <Field label="Badge" value={item.badge} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, badge: value } : entry))} />
              <Field label="CTA Label" value={item.buttonLabel} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, buttonLabel: value } : entry))} />
              <Field label="CTA Link" value={item.buttonHref} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, buttonHref: value } : entry))} />
            </div>
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
            <TextAreaField label="Features (one per line)" value={joinLines(item.features)} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, features: splitLines(value) } : entry))} rows={4} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TestimonialListEditor({
  items,
  onChange
}: {
  items: MainWebsiteTestimonial[]
  onChange: (items: MainWebsiteTestimonial[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Testimonials</p>
        <button type="button" onClick={() => onChange([...items, { quote: '', name: '', business: '', rating: 5, avatar: '', enabled: true }])} style={subtleButtonStyle}>Add Testimonial</button>
      </div>
      {items.map((item, index) => (
        <div key={`testimonial-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Testimonial {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <TextAreaField label="Review Text" value={item.quote} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, quote: value } : entry))} rows={4} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Name" value={item.name} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: value } : entry))} />
              <Field label="Company" value={item.business} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, business: value } : entry))} />
              <Field label="Rating" value={String(item.rating)} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, rating: Number(value) || 5 } : entry))} />
              <Field label="Avatar / Initial" value={item.avatar} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, avatar: value } : entry))} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ComparisonListEditor({
  items,
  onChange
}: {
  items: MainWebsiteComparisonRow[]
  onChange: (items: MainWebsiteComparisonRow[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Comparison Rows</p>
        <button type="button" onClick={() => onChange([...items, { title: '', scaleVyaparValue: '', otherValue: '', enabled: true }])} style={subtleButtonStyle}>Add Row</button>
      </div>
      {items.map((item, index) => (
        <div key={`comparison-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Row {index + 1}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ToggleField label="Show" checked={item.enabled} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, enabled: value } : entry))} />
              <RepeatableActions
                onMoveUp={() => onChange(moveItem(items, index, -1))}
                onMoveDown={() => onChange(moveItem(items, index, 1))}
                onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Row Title" value={item.title} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
            <Field label="ScaleVyapar Value" value={item.scaleVyaparValue} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, scaleVyaparValue: value } : entry))} />
            <Field label="Other Value" value={item.otherValue} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, otherValue: value } : entry))} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MainWebsiteEditor() {
  const [activeTab, setActiveTab] = useState<EditorTab>('theme')
  const [content, setContent] = useState<MainWebsiteContent | null>(null)
  const [storage, setStorage] = useState<'supabase' | 'json' | ''>('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/main-website', { credentials: 'include' })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load main website content.')
        }
        setContent(data.content)
        setStorage(data.storage || '')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load main website content.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const saveWebsite = async () => {
    if (!content) return
    try {
      setSaving(true)
      setErrorMessage('')
      setStatusMessage('')
      const response = await fetch('/api/admin/main-website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save main website content.')
      }
      setContent(data.content)
      setStorage(data.storage || storage)
      setStatusMessage('Main website content saved successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save main website content.')
    } finally {
      setSaving(false)
    }
  }

  const uploadWebsiteImage = async (file: File, uploadKey: string) => {
    try {
      setUploadingField(uploadKey)
      setErrorMessage('')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadKey', uploadKey)

      const response = await fetch('/api/admin/main-website/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image.')
      }

      setStatusMessage('Image uploaded successfully.')
      return data.url as string
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload image.')
      return ''
    } finally {
      setUploadingField('')
    }
  }

  if (loading || !content) {
    return (
      <div className={styles.page}>
        <div className={styles.frame}>
          <div className={styles.headerCard}>
            <div className={styles.headerCopy}>
              <p className={styles.headerEyebrow}>Loading</p>
              <h1 className={styles.headerTitle}>Preparing Main Website Editor</h1>
              <p className={styles.headerSubtitle}>Fetching the saved content and editor controls.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.editorShell}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.brandBlock}>
                <div className={styles.brandRow}>
                  <div className={styles.brandMark}>SV</div>
                  <div className={styles.brandText}>
                    <p className={styles.brandTitle}>Main Website Editor</p>
                    <p className={styles.brandSubtitle}>ScaleVyapar public website controls</p>
                  </div>
                </div>
                <p className={styles.brandDescription}>
                  Restore and manage the dark ScaleVyapar homepage style, section content, navigation, pricing teaser, testimonials, comparison, footer, and floating WhatsApp contact.
                </p>
              </div>
              <div className={styles.sidebarNav}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.sidebarTab} ${activeTab === tab.id ? styles.sidebarTabActive : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className={styles.sidebarTabLabel}>{tab.label}</span>
                    <span className={styles.sidebarTabBadge} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.main}>
            <div className={styles.headerWrap}>
              <div className={styles.headerCard}>
                <div className={styles.headerCopy}>
                  <p className={styles.headerEyebrow}>Main Website</p>
                  <h1 className={styles.headerTitle}>Control the public ScaleVyapar website</h1>
                  <p className={styles.headerSubtitle}>
                    Storage: {storage || 'unknown'} · Use the section tabs to edit the live homepage structure and supporting website settings.
                  </p>
                  {statusMessage ? <p style={{ margin: 0, color: '#166534', fontSize: '13px', fontWeight: 700 }}>{statusMessage}</p> : null}
                  {errorMessage ? <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>{errorMessage}</p> : null}
                </div>
                <div className={styles.headerActions}>
                  <button type="button" onClick={() => window.location.assign('/admin')} style={subtleButtonStyle}>Back to Admin</button>
                  <button type="button" onClick={() => window.open('https://www.scalevyapar.in/', '_blank', 'noopener,noreferrer')} style={subtleButtonStyle}>Open Website</button>
                  <button type="button" onClick={saveWebsite} disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Save Website'}
                  </button>
                </div>
              </div>
            </div>

            <main className={styles.content}>
              {activeTab === 'theme' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Theme" description="Configure the main visual system used by the restored homepage and the shared website chrome.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Brand Name" value={content.theme.brandName} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandName: value } } : current)} />
                        <Field label="Brand Tagline" value={content.theme.brandTagline} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandTagline: value } } : current)} />
                        <Field label="Primary Color" value={content.theme.primaryColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, primaryColor: value } } : current)} />
                        <Field label="Secondary Color" value={content.theme.secondaryColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, secondaryColor: value } } : current)} />
                        <Field label="Accent Color" value={content.theme.accentColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, accentColor: value } } : current)} />
                        <Field label="Dark Background" value={content.theme.darkBackgroundColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, darkBackgroundColor: value } } : current)} />
                        <Field label="Light Background" value={content.theme.lightBackgroundColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, lightBackgroundColor: value } } : current)} />
                        <Field label="Surface Background" value={content.theme.backgroundColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, backgroundColor: value } } : current)} />
                        <Field label="Button Color" value={content.theme.buttonColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, buttonColor: value } } : current)} />
                        <Field label="Text Color" value={content.theme.textColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, textColor: value } } : current)} />
                        <Field label="Muted Text Color" value={content.theme.mutedTextColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, mutedTextColor: value } } : current)} />
                        <Field label="Font Family" value={content.theme.fontFamily} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, fontFamily: value } } : current)} />
                        <Field label="Border Radius" value={content.theme.borderRadius} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, borderRadius: value } } : current)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <ImageUploadField label="Theme Logo" value={content.theme.logoSrc} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, logoSrc: value } } : current)} uploadKey="main-theme-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-theme-logo'} />
                        <ImageUploadField label="Favicon" value={content.theme.faviconSrc} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, faviconSrc: value } } : current)} uploadKey="main-theme-favicon" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-theme-favicon'} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'header' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Header" description="Control the logo, navigation, login button, CTA button, and dark header behavior.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Site Name" value={content.header.siteName} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, siteName: value } } : current)} />
                        <Field label="Header Background Style" value={content.header.backgroundStyle} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, backgroundStyle: value } } : current)} placeholder="solid-dark or glass-dark" />
                      </div>
                      <ToggleField label="Sticky Header" checked={content.header.sticky} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, sticky: value } } : current)} />
                      <ImageUploadField label="Header Logo" value={content.header.logoSrc} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, logoSrc: value } } : current)} uploadKey="main-header-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-header-logo'} />
                      <LinkListEditor label="Navigation Link" items={content.header.navItems} onChange={items => setContent(current => current ? { ...current, header: { ...current.header, navItems: items } } : current)} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Login Button Label" value={content.header.primaryButton.label} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryButton: { ...current.header.primaryButton, label: value } } } : current)} />
                        <Field label="Login Button Link" value={content.header.primaryButton.href} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryButton: { ...current.header.primaryButton, href: value } } } : current)} />
                        <Field label="CTA Button Label" value={content.header.secondaryButton.label} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, secondaryButton: { ...current.header.secondaryButton, label: value } } } : current)} />
                        <Field label="CTA Button Link" value={content.header.secondaryButton.href} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, secondaryButton: { ...current.header.secondaryButton, href: value } } } : current)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Announcement Text" value={content.header.announcementText} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementText: value } } : current)} />
                        <Field label="Announcement Button Label" value={content.header.announcementButtonLabel} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementButtonLabel: value } } : current)} />
                        <Field label="Announcement Button Link" value={content.header.announcementButtonHref} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementButtonHref: value } } : current)} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'hero' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Hero Section" description="Restore and edit the dark hero content, buttons, image paths, and highlight badges.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Eyebrow" value={content.home.heroEyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroEyebrow: value } } : current)} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Title" value={content.home.heroTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroTitle: value } } : current)} />
                        <Field label="Highlighted Title" value={content.home.heroHighlightedText} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroHighlightedText: value } } : current)} />
                      </div>
                      <TextAreaField label="Description" value={content.home.heroDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroDescription: value } } : current)} rows={4} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <ImageUploadField label="Desktop Hero Image" value={content.home.heroDesktopImage} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroDesktopImage: value } } : current)} uploadKey="main-hero-desktop" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-hero-desktop'} />
                        <ImageUploadField label="Mobile Hero Image" value={content.home.heroMobileImage} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroMobileImage: value } } : current)} uploadKey="main-hero-mobile" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-hero-mobile'} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Primary CTA Label" value={content.home.heroPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroPrimaryButton: { ...current.home.heroPrimaryButton, label: value } } } : current)} />
                        <Field label="Primary CTA Link" value={content.home.heroPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroPrimaryButton: { ...current.home.heroPrimaryButton, href: value } } } : current)} />
                        <Field label="Secondary CTA Label" value={content.home.heroSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroSecondaryButton: { ...current.home.heroSecondaryButton, label: value } } } : current)} />
                        <Field label="Secondary CTA Link" value={content.home.heroSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroSecondaryButton: { ...current.home.heroSecondaryButton, href: value } } } : current)} />
                      </div>
                      <StringListEditor label="Hero Badge" values={content.home.heroBadges} onChange={values => setContent(current => current ? { ...current, home: { ...current.home, heroBadges: values } } : current)} addLabel="Add Hero Badge" />
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'stats' ? (
                <SectionCard title="Stats Section" description="Editable homepage metrics with descriptions, icons, visibility, and ordering.">
                  <StatListEditor items={content.home.stats} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, stats: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'tools' ? (
                <SectionCard title="Tools / Services" description="Manage the homepage service cards that appear under the stats section.">
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
                    <Field label="Section Title" value={content.home.servicesTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, servicesTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.servicesDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, servicesDescription: value } } : current)} rows={3} />
                  </div>
                  <FeatureCardListEditor label="Service Card" items={content.home.serviceCards} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, serviceCards: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'features' ? (
                <SectionCard title="Features / Benefits" description="Manage the dark benefit cards used in the Why ScaleVyapar section.">
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
                    <Field label="Section Title" value={content.home.featuresTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, featuresTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.featuresDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, featuresDescription: value } } : current)} rows={3} />
                  </div>
                  <FeatureCardListEditor label="Feature Card" items={content.home.featureCards} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, featureCards: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'product' ? (
                <SectionCard title="Product Cards" description="Control the preview-style cards that demonstrate how the tools work.">
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
                    <Field label="Section Title" value={content.home.productTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, productTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.productDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, productDescription: value } } : current)} rows={3} />
                  </div>
                  <ProductCardListEditor items={content.home.productCards} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, productCards: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'process' ? (
                <SectionCard title="Process / Steps" description="Edit the 3-step workflow area and re-order steps safely.">
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
                    <Field label="Section Title" value={content.home.processTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, processTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.processDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, processDescription: value } } : current)} rows={3} />
                  </div>
                  <ProcessListEditor items={content.home.processSteps} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, processSteps: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'pricing' ? (
                <SectionCard title="Pricing / Custom Plan" description="Edit the homepage pricing teaser and the plan cards shown in the pricing section.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <ToggleField label="Show Pricing Section on Homepage" checked={content.home.pricingEnabled} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricingEnabled: value } } : current)} />
                    <Field label="Homepage Pricing Eyebrow" value={content.home.pricingEyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricingEyebrow: value } } : current)} />
                    <Field label="Homepage Pricing Title" value={content.home.pricingTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricingTitle: value } } : current)} />
                    <TextAreaField label="Homepage Pricing Description" value={content.home.pricingDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, pricingDescription: value } } : current)} rows={3} />
                    <Field label="Pricing Page Title" value={content.pricing.pageTitle} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, pageTitle: value } } : current)} />
                    <TextAreaField label="Pricing Page Description" value={content.pricing.pageDescription} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, pageDescription: value } } : current)} rows={3} />
                    <PlanListEditor items={content.pricing.plans} onChange={items => setContent(current => current ? { ...current, pricing: { ...current.pricing, plans: items } } : current)} />
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === 'testimonials' ? (
                <SectionCard title="Testimonials" description="Manage the testimonial grid and the popup review slider content at the same time.">
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
                    <Field label="Section Title" value={content.home.testimonialsTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonialsTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.testimonialsDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonialsDescription: value } } : current)} rows={3} />
                  </div>
                  <TestimonialListEditor items={content.home.testimonials} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, testimonials: items } } : current)} />
                </SectionCard>
              ) : null}

              {activeTab === 'comparison' ? (
                <SectionCard title="Comparison Section" description="Edit the comparison headline, labels, rows, and the comparison CTA.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <Field label="Section Title" value={content.home.comparisonTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonTitle: value } } : current)} />
                    <TextAreaField label="Section Description" value={content.home.comparisonDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonDescription: value } } : current)} rows={3} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="Left Label" value={content.home.comparisonLeftLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonLeftLabel: value } } : current)} />
                      <Field label="Right Label" value={content.home.comparisonRightLabel} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonRightLabel: value } } : current)} />
                    </div>
                    <ComparisonListEditor items={content.home.comparisonRows} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, comparisonRows: items } } : current)} />
                    <TextAreaField label="Comparison CTA Text" value={content.home.comparisonCtaText} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonCtaText: value } } : current)} rows={3} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="CTA Button Label" value={content.home.comparisonCtaButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonCtaButton: { ...current.home.comparisonCtaButton, label: value } } } : current)} />
                      <Field label="CTA Button Link" value={content.home.comparisonCtaButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, comparisonCtaButton: { ...current.home.comparisonCtaButton, href: value } } } : current)} />
                    </div>
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === 'cta' ? (
                <SectionCard title="CTA Banner" description="Edit the final homepage banner with titles, buttons, and optional background image.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <ToggleField label="Show CTA Banner" checked={content.home.ctaEnabled} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaEnabled: value } } : current)} />
                    <Field label="CTA Eyebrow" value={content.home.ctaEyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaEyebrow: value } } : current)} />
                    <Field label="CTA Title" value={content.home.ctaTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaTitle: value } } : current)} />
                    <TextAreaField label="CTA Description" value={content.home.ctaDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaDescription: value } } : current)} rows={3} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="Primary CTA Label" value={content.home.ctaPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaPrimaryButton: { ...current.home.ctaPrimaryButton, label: value } } } : current)} />
                      <Field label="Primary CTA Link" value={content.home.ctaPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaPrimaryButton: { ...current.home.ctaPrimaryButton, href: value } } } : current)} />
                      <Field label="Secondary CTA Label" value={content.home.ctaSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaSecondaryButton: { ...current.home.ctaSecondaryButton, label: value } } } : current)} />
                      <Field label="Secondary CTA Link" value={content.home.ctaSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaSecondaryButton: { ...current.home.ctaSecondaryButton, href: value } } } : current)} />
                    </div>
                    <Field label="CTA Background Color" value={content.home.ctaBackgroundColor} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaBackgroundColor: value } } : current)} />
                    <ImageUploadField label="CTA Background Image" value={content.home.ctaBackgroundImage} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaBackgroundImage: value } } : current)} uploadKey="main-cta-background" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-cta-background'} />
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === 'footer' ? (
                <SectionCard title="Footer" description="Edit the footer logo, link columns, contact details, and social links.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <ImageUploadField label="Footer Logo" value={content.footer.logoSrc} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, logoSrc: value } } : current)} uploadKey="main-footer-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-footer-logo'} />
                    <TextAreaField label="Footer Description" value={content.footer.description} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, description: value } } : current)} rows={4} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="Contact Email" value={content.footer.contactEmail} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, contactEmail: value } } : current)} />
                      <Field label="Phone Number" value={content.footer.phone} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, phone: value } } : current)} />
                      <Field label="Address" value={content.footer.address} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, address: value } } : current)} />
                      <Field label="Copyright Text" value={content.footer.copyrightText} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, copyrightText: value } } : current)} />
                    </div>
                    <LinkListEditor label="Quick Link" items={content.footer.quickLinks} onChange={items => setContent(current => current ? { ...current, footer: { ...current.footer, quickLinks: items } } : current)} />
                    <LinkListEditor label="Social Link" items={content.footer.socialLinks} onChange={items => setContent(current => current ? { ...current, footer: { ...current.footer, socialLinks: items } } : current)} />
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === 'seo' ? (
                <SectionCard title="SEO / Meta" description="Edit site metadata and page-specific meta titles and descriptions.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <Field label="Site Title" value={content.seo.siteTitle} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, siteTitle: value } } : current)} />
                    <TextAreaField label="Site Description" value={content.seo.siteDescription} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, siteDescription: value } } : current)} rows={3} />
                    <ImageUploadField label="Open Graph Image" value={content.seo.openGraphImage} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, openGraphImage: value } } : current)} uploadKey="main-seo-og" onUpload={uploadWebsiteImage} uploading={uploadingField === 'main-seo-og'} />
                    <TextAreaField label="Keywords (comma separated)" value={content.seo.keywords} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, keywords: value } } : current)} rows={3} />
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {seoPageKeys.map(pageKey => (
                        <div key={pageKey} className={styles.repeatableCard}>
                          <div className={styles.repeatableHeader}>
                            <p className={styles.repeatableTitle}>{pageKey}</p>
                          </div>
                          <div style={{ display: 'grid', gap: '12px' }}>
                            <Field label="Meta Title" value={content.seo.pages[pageKey].title} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, pages: { ...current.seo.pages, [pageKey]: { ...current.seo.pages[pageKey], title: value } } } } : current)} />
                            <TextAreaField label="Meta Description" value={content.seo.pages[pageKey].description} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, pages: { ...current.seo.pages, [pageKey]: { ...current.seo.pages[pageKey], description: value } } } } : current)} rows={3} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === 'floating' ? (
                <SectionCard title="Floating Contact / WhatsApp" description="Control the floating WhatsApp button used across the main website.">
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <ToggleField label="Show Floating WhatsApp Button" checked={content.floatingContact.enabled} onChange={value => setContent(current => current ? { ...current, floatingContact: { ...current.floatingContact, enabled: value } } : current)} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <Field label="WhatsApp Number" value={content.floatingContact.whatsappNumber} onChange={value => setContent(current => current ? { ...current, floatingContact: { ...current.floatingContact, whatsappNumber: value } } : current)} />
                      <Field label="Position" value={content.floatingContact.position} onChange={value => setContent(current => current ? { ...current, floatingContact: { ...current.floatingContact, position: value === 'left' ? 'left' : 'right' } } : current)} placeholder="left or right" />
                    </div>
                    <TextAreaField label="WhatsApp Message" value={content.floatingContact.whatsappMessage} onChange={value => setContent(current => current ? { ...current, floatingContact: { ...current.floatingContact, whatsappMessage: value } } : current)} rows={3} />
                    <Field label="WhatsApp Link (public site fallback)" value={content.contact.whatsappLink} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, whatsappLink: value } } : current)} />
                  </div>
                </SectionCard>
              ) : null}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
