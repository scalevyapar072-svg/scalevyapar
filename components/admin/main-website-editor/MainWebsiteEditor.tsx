'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type {
  MainWebsiteContactHour,
  MainWebsiteContent,
  MainWebsiteFaqItem,
  MainWebsiteFeatureCard,
  MainWebsiteLegalPage,
  MainWebsiteLinkItem,
  MainWebsitePlan,
  MainWebsiteProcessStep,
  MainWebsiteSeoPageKey,
  MainWebsiteStatItem,
  MainWebsiteTestimonial
} from '@/lib/main-website-content'
import styles from './main-website-editor.module.css'

type EditorTab = 'theme' | 'headerFooter' | 'home' | 'about' | 'services' | 'pricing' | 'contact' | 'legal' | 'seo'

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

const tabs: Array<{ id: EditorTab; label: string; description: string }> = [
  { id: 'theme', label: 'Theme', description: 'Brand, colors, logo, favicon, and typography.' },
  { id: 'headerFooter', label: 'Header & Footer', description: 'Navigation, announcement bar, quick links, and contact details.' },
  { id: 'home', label: 'Home Page', description: 'Hero content, services, stats, process, testimonials, FAQ, and CTA.' },
  { id: 'about', label: 'About Us', description: 'About copy, mission, vision, values, stats, and CTA.' },
  { id: 'services', label: 'Services / Features', description: 'Public tools and service listing content.' },
  { id: 'pricing', label: 'Pricing / Plans', description: 'Pricing copy, optional plan cards, FAQs, and CTA.' },
  { id: 'contact', label: 'Contact', description: 'Contact details, support text, social links, hours, and FAQs.' },
  { id: 'legal', label: 'Legal Pages', description: 'Terms, privacy, refund, and disclaimer page content.' },
  { id: 'seo', label: 'SEO / Meta', description: 'Site title, description, OG image, keywords, and page-level metadata.' }
]

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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
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
  onUpload: (file: File, uploadKey: string) => Promise<string>
  uploading: boolean
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localMessage, setLocalMessage] = useState('')

  const preview = value.trim()

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
          onClick={async () => {
            if (!selectedFile) {
              setLocalMessage('Choose an image file first, then click Upload Image.')
              return
            }

            const nextUrl = await onUpload(selectedFile, uploadKey)
            if (nextUrl) {
              onChange(nextUrl)
              setLocalMessage('Image uploaded and field updated.')
            }
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
      {preview ? (
        <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} style={{ width: '100%', maxWidth: '240px', borderRadius: '12px', border: '1px solid #d8e1ee', background: '#f8fafc' }} />
        </div>
      ) : null}
      {localMessage ? (
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>{localMessage}</p>
      ) : null}
    </div>
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
        <button type="button" onClick={() => onChange([...items, { value: '', label: '' }])} style={subtleButtonStyle}>Add Stat</button>
      </div>
      {items.map((item, index) => (
        <div key={`stat-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Stat {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Value" value={item.value} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, value } : entry))} />
            <Field label="Label" value={item.label} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: value } : entry))} />
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
        <button type="button" onClick={() => onChange([...items, { icon: '', title: '', description: '', bullets: [''], badge: '', href: '' }])} style={subtleButtonStyle}>Add Card</button>
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
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Icon / Short Tag" value={item.icon} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value } : entry))} />
              <Field label="Title" value={item.title} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
              <Field label="Badge" value={item.badge || ''} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, badge: value } : entry))} />
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
        <button type="button" onClick={() => onChange([...items, { title: '', description: '' }])} style={subtleButtonStyle}>Add Step</button>
      </div>
      {items.map((item, index) => (
        <div key={`step-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Step {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <Field label="Title" value={item.title} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
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
        <button type="button" onClick={() => onChange([...items, { quote: '', name: '', business: '' }])} style={subtleButtonStyle}>Add Testimonial</button>
      </div>
      {items.map((item, index) => (
        <div key={`testimonial-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Testimonial {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <TextAreaField label="Quote" value={item.quote} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, quote: value } : entry))} rows={4} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Field label="Name" value={item.name} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: value } : entry))} />
              <Field label="Business" value={item.business} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, business: value } : entry))} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FaqListEditor({
  items,
  onChange
}: {
  items: MainWebsiteFaqItem[]
  onChange: (items: MainWebsiteFaqItem[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>FAQ Items</p>
        <button type="button" onClick={() => onChange([...items, { question: '', answer: '' }])} style={subtleButtonStyle}>Add FAQ</button>
      </div>
      {items.map((item, index) => (
        <div key={`faq-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>FAQ {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <Field label="Question" value={item.question} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, question: value } : entry))} />
            <TextAreaField label="Answer" value={item.answer} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, answer: value } : entry))} rows={4} />
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
        <button
          type="button"
          onClick={() => onChange([...items, { name: '', price: '', cadence: '', description: '', badge: '', features: [''], buttonLabel: '', buttonHref: '' }])}
          style={subtleButtonStyle}
        >
          Add Plan
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`plan-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Plan {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Field label="Plan Name" value={item.name} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: value } : entry))} />
              <Field label="Price" value={item.price} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, price: value } : entry))} />
              <Field label="Cadence" value={item.cadence} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, cadence: value } : entry))} />
              <Field label="Badge" value={item.badge} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, badge: value } : entry))} />
            </div>
            <TextAreaField label="Description" value={item.description} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} rows={3} />
            <TextAreaField label="Features (one per line)" value={joinLines(item.features)} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, features: splitLines(value) } : entry))} rows={4} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Field label="Button Label" value={item.buttonLabel} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, buttonLabel: value } : entry))} />
              <Field label="Button Link" value={item.buttonHref} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, buttonHref: value } : entry))} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HoursListEditor({
  items,
  onChange
}: {
  items: MainWebsiteContactHour[]
  onChange: (items: MainWebsiteContactHour[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>Business Hours</p>
        <button type="button" onClick={() => onChange([...items, { day: '', time: '' }])} style={subtleButtonStyle}>Add Row</button>
      </div>
      {items.map((item, index) => (
        <div key={`hour-${index}`} className={styles.repeatableCard}>
          <div className={styles.repeatableHeader}>
            <p className={styles.repeatableTitle}>Hour Row {index + 1}</p>
            <RepeatableActions
              onMoveUp={() => onChange(moveItem(items, index, -1))}
              onMoveDown={() => onChange(moveItem(items, index, 1))}
              onRemove={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Day" value={item.day} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, day: value } : entry))} />
            <Field label="Time" value={item.time} onChange={value => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, time: value } : entry))} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LegalPageEditor({
  label,
  page,
  onChange
}: {
  label: string
  page: MainWebsiteLegalPage
  onChange: (page: MainWebsiteLegalPage) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <Field label={`${label} Title`} value={page.title} onChange={value => onChange({ ...page, title: value })} />
      </div>
      <TextAreaField label={`${label} Description`} value={page.description} onChange={value => onChange({ ...page, description: value })} rows={3} />
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{label} Sections</p>
          <button type="button" onClick={() => onChange({ ...page, sections: [...page.sections, { title: '', body: '' }] })} style={subtleButtonStyle}>Add Section</button>
        </div>
        {page.sections.map((section, index) => (
          <div key={`${label}-section-${index}`} className={styles.repeatableCard}>
            <div className={styles.repeatableHeader}>
              <p className={styles.repeatableTitle}>Section {index + 1}</p>
              <RepeatableActions
                onMoveUp={() => onChange({ ...page, sections: moveItem(page.sections, index, -1) })}
                onMoveDown={() => onChange({ ...page, sections: moveItem(page.sections, index, 1) })}
                onRemove={() => onChange({ ...page, sections: page.sections.filter((_, itemIndex) => itemIndex !== index) })}
                disableUp={index === 0}
                disableDown={index === page.sections.length - 1}
              />
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <Field label="Section Title" value={section.title} onChange={value => onChange({
                ...page,
                sections: page.sections.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry)
              })} />
              <TextAreaField label="Section Body" value={section.body} onChange={value => onChange({
                ...page,
                sections: page.sections.map((entry, itemIndex) => itemIndex === index ? { ...entry, body: value } : entry)
              })} rows={5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MainWebsiteEditor() {
  const [content, setContent] = useState<MainWebsiteContent | null>(null)
  const [storage, setStorage] = useState<'supabase' | 'json'>('json')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [activeTab, setActiveTab] = useState<EditorTab>('theme')

  useEffect(() => {
    void loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/main-website', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login'
        return
      }

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

  async function uploadWebsiteImage(file: File, uploadKey: string) {
    setUploadingField(uploadKey)
    setError('')
    setSaved('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('assetKey', uploadKey)

      const response = await fetch('/api/admin/main-website/upload', {
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

  async function saveContent() {
    if (!content) return
    setSaving(true)
    setError('')
    setSaved('')
    try {
      const response = await fetch('/api/admin/main-website', {
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
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading main website editor...</p>
      </div>
    )
  }

  if (!content) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error || 'Unable to load main website editor.'}</p>
        <button onClick={() => void loadContent()} style={primaryButtonStyle}>Retry</button>
      </div>
    )
  }

  const activeTabDetails = tabs.find(tab => tab.id === activeTab) ?? tabs[0]
  const seoPageKeys: MainWebsiteSeoPageKey[] = ['home', 'about', 'services', 'pricing', 'contact', 'terms', 'privacy', 'refund', 'disclaimer']

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
                    <p className={styles.brandTitle}>Main Website Editor</p>
                    <p className={styles.brandSubtitle}>ScaleVyapar public website</p>
                  </div>
                </div>
                <p className={styles.brandDescription}>Edit only the main public ScaleVyapar website content, theme, header, footer, and page metadata.</p>
              </div>

              <nav className={styles.sidebarNav} aria-label="Main website editor sections">
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
                  <h1 className={styles.headerTitle}>ScaleVyapar Main Website Editor</h1>
                  <p className={styles.headerSubtitle}>{activeTabDetails.description} Storage: {storage}.</p>
                </div>

                <div className={styles.headerActions}>
                  <Link href="/admin" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Back To Admin</Link>
                  <a href="/" target="_blank" rel="noreferrer" style={{ ...subtleButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Open Website</a>
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
              {activeTab === 'theme' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Theme" description="Control the main website brand, colors, logo, favicon, and shared font family.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Brand Name" value={content.theme.brandName} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandName: value } } : current)} />
                        <Field label="Brand Tagline" value={content.theme.brandTagline} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, brandTagline: value } } : current)} />
                        <Field label="Primary Color" value={content.theme.primaryColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, primaryColor: value } } : current)} />
                        <Field label="Accent Color" value={content.theme.accentColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, accentColor: value } } : current)} />
                        <Field label="Background Color" value={content.theme.backgroundColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, backgroundColor: value } } : current)} />
                        <Field label="Button Color" value={content.theme.buttonColor} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, buttonColor: value } } : current)} />
                        <Field label="Font Family" value={content.theme.fontFamily} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, fontFamily: value } } : current)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <ImageUploadField label="Theme Logo" value={content.theme.logoSrc} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, logoSrc: value } } : current)} uploadKey="theme-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'theme-logo'} />
                        <ImageUploadField label="Favicon" value={content.theme.faviconSrc} onChange={value => setContent(current => current ? { ...current, theme: { ...current.theme, faviconSrc: value } } : current)} uploadKey="theme-favicon" onUpload={uploadWebsiteImage} uploading={uploadingField === 'theme-favicon'} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'headerFooter' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Header" description="Manage the announcement bar, logo, site name, navigation items, and top-right buttons.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Announcement Text" value={content.header.announcementText} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementText: value } } : current)} />
                        <Field label="Announcement Button Label" value={content.header.announcementButtonLabel} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementButtonLabel: value } } : current)} />
                        <Field label="Announcement Button Link" value={content.header.announcementButtonHref} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, announcementButtonHref: value } } : current)} />
                        <Field label="Site Name" value={content.header.siteName} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, siteName: value } } : current)} />
                      </div>
                      <ImageUploadField label="Header Logo" value={content.header.logoSrc} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, logoSrc: value } } : current)} uploadKey="header-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'header-logo'} />
                      <LinkListEditor label="Navigation Link" items={content.header.navItems} onChange={items => setContent(current => current ? { ...current, header: { ...current.header, navItems: items } } : current)} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        <Field label="Primary Button Label" value={content.header.primaryButton.label} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryButton: { ...current.header.primaryButton, label: value } } } : current)} />
                        <Field label="Primary Button Link" value={content.header.primaryButton.href} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, primaryButton: { ...current.header.primaryButton, href: value } } } : current)} />
                        <Field label="Secondary Button Label" value={content.header.secondaryButton.label} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, secondaryButton: { ...current.header.secondaryButton, label: value } } } : current)} />
                        <Field label="Secondary Button Link" value={content.header.secondaryButton.href} onChange={value => setContent(current => current ? { ...current, header: { ...current.header, secondaryButton: { ...current.header.secondaryButton, href: value } } } : current)} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Footer" description="Control footer logo, description, quick links, contact details, and social links.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <ImageUploadField label="Footer Logo" value={content.footer.logoSrc} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, logoSrc: value } } : current)} uploadKey="footer-logo" onUpload={uploadWebsiteImage} uploading={uploadingField === 'footer-logo'} />
                      <TextAreaField label="Footer Description" value={content.footer.description} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, description: value } } : current)} rows={4} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Contact Email" value={content.footer.contactEmail} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, contactEmail: value } } : current)} />
                        <Field label="Phone" value={content.footer.phone} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, phone: value } } : current)} />
                        <Field label="Address" value={content.footer.address} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, address: value } } : current)} />
                        <Field label="Copyright Text" value={content.footer.copyrightText} onChange={value => setContent(current => current ? { ...current, footer: { ...current.footer, copyrightText: value } } : current)} />
                      </div>
                      <LinkListEditor label="Quick Link" items={content.footer.quickLinks} onChange={items => setContent(current => current ? { ...current, footer: { ...current.footer, quickLinks: items } } : current)} />
                      <LinkListEditor label="Social Link" items={content.footer.socialLinks} onChange={items => setContent(current => current ? { ...current, footer: { ...current.footer, socialLinks: items } } : current)} />
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'home' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Hero" description="Edit the homepage hero, image paths, and top call-to-action buttons.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Hero Eyebrow" value={content.home.heroEyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroEyebrow: value } } : current)} />
                        <Field label="Hero Title" value={content.home.heroTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroTitle: value } } : current)} />
                        <Field label="Hero Highlighted Text" value={content.home.heroHighlightedText} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroHighlightedText: value } } : current)} />
                      </div>
                      <TextAreaField label="Hero Description" value={content.home.heroDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroDescription: value } } : current)} rows={4} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <ImageUploadField label="Hero Desktop Image" value={content.home.heroDesktopImage} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroDesktopImage: value } } : current)} uploadKey="home-hero-desktop" onUpload={uploadWebsiteImage} uploading={uploadingField === 'home-hero-desktop'} />
                        <ImageUploadField label="Hero Mobile Image" value={content.home.heroMobileImage} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroMobileImage: value } } : current)} uploadKey="home-hero-mobile" onUpload={uploadWebsiteImage} uploading={uploadingField === 'home-hero-mobile'} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Primary Button Label" value={content.home.heroPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroPrimaryButton: { ...current.home.heroPrimaryButton, label: value } } } : current)} />
                        <Field label="Primary Button Link" value={content.home.heroPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroPrimaryButton: { ...current.home.heroPrimaryButton, href: value } } } : current)} />
                        <Field label="Secondary Button Label" value={content.home.heroSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroSecondaryButton: { ...current.home.heroSecondaryButton, label: value } } } : current)} />
                        <Field label="Secondary Button Link" value={content.home.heroSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, heroSecondaryButton: { ...current.home.heroSecondaryButton, href: value } } } : current)} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Stats" description="Manage the homepage metrics or headline proof points.">
                    <StatListEditor items={content.home.stats} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, stats: items } } : current)} />
                  </SectionCard>

                  <SectionCard title="Services Section" description="These cards power the homepage feature and service section.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Services Title" value={content.home.servicesTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, servicesTitle: value } } : current)} />
                      <TextAreaField label="Services Description" value={content.home.servicesDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, servicesDescription: value } } : current)} rows={3} />
                      <FeatureCardListEditor label="Service Card" items={content.home.serviceCards} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, serviceCards: items } } : current)} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Process" description="Control the 'how it works' section.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Process Title" value={content.home.processTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, processTitle: value } } : current)} />
                      <TextAreaField label="Process Description" value={content.home.processDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, processDescription: value } } : current)} rows={3} />
                      <ProcessListEditor items={content.home.processSteps} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, processSteps: items } } : current)} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Testimonials and FAQ" description="Update homepage testimonial quotes and optional FAQ content.">
                    <div style={{ display: 'grid', gap: '18px' }}>
                      <div style={{ display: 'grid', gap: '14px' }}>
                        <Field label="Testimonials Title" value={content.home.testimonialsTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonialsTitle: value } } : current)} />
                        <TextAreaField label="Testimonials Description" value={content.home.testimonialsDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, testimonialsDescription: value } } : current)} rows={3} />
                        <TestimonialListEditor items={content.home.testimonials} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, testimonials: items } } : current)} />
                      </div>
                      <div style={{ display: 'grid', gap: '14px' }}>
                        <Field label="FAQ Title" value={content.home.faqTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, faqTitle: value } } : current)} />
                        <FaqListEditor items={content.home.faqItems} onChange={items => setContent(current => current ? { ...current, home: { ...current.home, faqItems: items } } : current)} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Call To Action Banner" description="Control the closing CTA section on the homepage.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="CTA Eyebrow" value={content.home.ctaEyebrow} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaEyebrow: value } } : current)} />
                      <Field label="CTA Title" value={content.home.ctaTitle} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaTitle: value } } : current)} />
                      <TextAreaField label="CTA Description" value={content.home.ctaDescription} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaDescription: value } } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Primary CTA Label" value={content.home.ctaPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaPrimaryButton: { ...current.home.ctaPrimaryButton, label: value } } } : current)} />
                        <Field label="Primary CTA Link" value={content.home.ctaPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaPrimaryButton: { ...current.home.ctaPrimaryButton, href: value } } } : current)} />
                        <Field label="Secondary CTA Label" value={content.home.ctaSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaSecondaryButton: { ...current.home.ctaSecondaryButton, label: value } } } : current)} />
                        <Field label="Secondary CTA Link" value={content.home.ctaSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, home: { ...current.home, ctaSecondaryButton: { ...current.home.ctaSecondaryButton, href: value } } } : current)} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'about' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="About Page" description="Edit the main content for the public About page.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Page Title" value={content.about.pageTitle} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, pageTitle: value } } : current)} />
                        <Field label="Hero Eyebrow" value={content.about.heroEyebrow} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, heroEyebrow: value } } : current)} />
                        <Field label="Hero Title" value={content.about.heroTitle} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, heroTitle: value } } : current)} />
                      </div>
                      <TextAreaField label="Hero Description" value={content.about.heroDescription} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, heroDescription: value } } : current)} rows={4} />
                      <TextAreaField label="Company Description" value={content.about.companyDescription} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, companyDescription: value } } : current)} rows={5} />
                      <TextAreaField label="Mission" value={content.about.mission} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, mission: value } } : current)} rows={3} />
                      <TextAreaField label="Vision" value={content.about.vision} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, vision: value } } : current)} rows={3} />
                      <FeatureCardListEditor label="Value Card" items={content.about.values} onChange={items => setContent(current => current ? { ...current, about: { ...current.about, values: items } } : current)} />
                      <StatListEditor items={content.about.stats} onChange={items => setContent(current => current ? { ...current, about: { ...current.about, stats: items } } : current)} />
                      <div style={{ display: 'grid', gap: '14px' }}>
                        <Field label="CTA Title" value={content.about.ctaTitle} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaTitle: value } } : current)} />
                        <TextAreaField label="CTA Description" value={content.about.ctaDescription} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaDescription: value } } : current)} rows={3} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                          <Field label="Primary CTA Label" value={content.about.ctaPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaPrimaryButton: { ...current.about.ctaPrimaryButton, label: value } } } : current)} />
                          <Field label="Primary CTA Link" value={content.about.ctaPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaPrimaryButton: { ...current.about.ctaPrimaryButton, href: value } } } : current)} />
                          <Field label="Secondary CTA Label" value={content.about.ctaSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaSecondaryButton: { ...current.about.ctaSecondaryButton, label: value } } } : current)} />
                          <Field label="Secondary CTA Link" value={content.about.ctaSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, about: { ...current.about, ctaSecondaryButton: { ...current.about.ctaSecondaryButton, href: value } } } : current)} />
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'services' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Services / Features Page" description="Edit the public tools and services page content.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Page Title" value={content.services.pageTitle} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, pageTitle: value } } : current)} />
                      <TextAreaField label="Page Description" value={content.services.pageDescription} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, pageDescription: value } } : current)} rows={3} />
                      <Field label="Section Title" value={content.services.sectionTitle} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, sectionTitle: value } } : current)} />
                      <TextAreaField label="Section Description" value={content.services.sectionDescription} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, sectionDescription: value } } : current)} rows={3} />
                      <FeatureCardListEditor label="Service Card" items={content.services.cards} onChange={items => setContent(current => current ? { ...current, services: { ...current.services, cards: items } } : current)} />
                      <div style={{ display: 'grid', gap: '14px' }}>
                        <Field label="CTA Title" value={content.services.ctaTitle} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaTitle: value } } : current)} />
                        <TextAreaField label="CTA Description" value={content.services.ctaDescription} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaDescription: value } } : current)} rows={3} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                          <Field label="Primary CTA Label" value={content.services.ctaPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaPrimaryButton: { ...current.services.ctaPrimaryButton, label: value } } } : current)} />
                          <Field label="Primary CTA Link" value={content.services.ctaPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaPrimaryButton: { ...current.services.ctaPrimaryButton, href: value } } } : current)} />
                          <Field label="Secondary CTA Label" value={content.services.ctaSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaSecondaryButton: { ...current.services.ctaSecondaryButton, label: value } } } : current)} />
                          <Field label="Secondary CTA Link" value={content.services.ctaSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, services: { ...current.services, ctaSecondaryButton: { ...current.services.ctaSecondaryButton, href: value } } } : current)} />
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'pricing' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Pricing / Plans" description="Edit pricing page copy and optional plan cards shown above the calculator.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <ToggleField label="Show pricing section" checked={content.pricing.enabled} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, enabled: value } } : current)} />
                      <Field label="Page Title" value={content.pricing.pageTitle} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, pageTitle: value } } : current)} />
                      <TextAreaField label="Page Description" value={content.pricing.pageDescription} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, pageDescription: value } } : current)} rows={3} />
                      <Field label="Intro Title" value={content.pricing.introTitle} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, introTitle: value } } : current)} />
                      <TextAreaField label="Intro Description" value={content.pricing.introDescription} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, introDescription: value } } : current)} rows={3} />
                      <PlanListEditor items={content.pricing.plans} onChange={items => setContent(current => current ? { ...current, pricing: { ...current.pricing, plans: items } } : current)} />
                      <Field label="FAQ Title" value={content.pricing.faqTitle} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, faqTitle: value } } : current)} />
                      <FaqListEditor items={content.pricing.faqItems} onChange={items => setContent(current => current ? { ...current, pricing: { ...current.pricing, faqItems: items } } : current)} />
                      <Field label="CTA Title" value={content.pricing.ctaTitle} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaTitle: value } } : current)} />
                      <TextAreaField label="CTA Description" value={content.pricing.ctaDescription} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaDescription: value } } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Primary CTA Label" value={content.pricing.ctaPrimaryButton.label} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaPrimaryButton: { ...current.pricing.ctaPrimaryButton, label: value } } } : current)} />
                        <Field label="Primary CTA Link" value={content.pricing.ctaPrimaryButton.href} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaPrimaryButton: { ...current.pricing.ctaPrimaryButton, href: value } } } : current)} />
                        <Field label="Secondary CTA Label" value={content.pricing.ctaSecondaryButton.label} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaSecondaryButton: { ...current.pricing.ctaSecondaryButton, label: value } } } : current)} />
                        <Field label="Secondary CTA Link" value={content.pricing.ctaSecondaryButton.href} onChange={value => setContent(current => current ? { ...current, pricing: { ...current.pricing, ctaSecondaryButton: { ...current.pricing.ctaSecondaryButton, href: value } } } : current)} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'contact' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Contact Page" description="Manage the visible contact details, support copy, social links, hours, FAQs, and CTA.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Page Title" value={content.contact.pageTitle} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, pageTitle: value } } : current)} />
                      <TextAreaField label="Page Description" value={content.contact.pageDescription} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, pageDescription: value } } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="Phone" value={content.contact.phone} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, phone: value } } : current)} />
                        <Field label="Email" value={content.contact.email} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, email: value } } : current)} />
                        <Field label="Address" value={content.contact.address} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, address: value } } : current)} />
                        <Field label="Map Link" value={content.contact.mapLink} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, mapLink: value } } : current)} />
                        <Field label="WhatsApp Link" value={content.contact.whatsappLink} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, whatsappLink: value } } : current)} />
                        <Field label="Contact Form Title" value={content.contact.contactFormTitle} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, contactFormTitle: value } } : current)} />
                      </div>
                      <TextAreaField label="Support Text" value={content.contact.supportText} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, supportText: value } } : current)} rows={3} />
                      <LinkListEditor label="Social Link" items={content.contact.socialLinks} onChange={items => setContent(current => current ? { ...current, contact: { ...current.contact, socialLinks: items } } : current)} />
                      <HoursListEditor items={content.contact.hours} onChange={items => setContent(current => current ? { ...current, contact: { ...current.contact, hours: items } } : current)} />
                      <Field label="FAQ Title" value={content.contact.faqTitle} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, faqTitle: value } } : current)} />
                      <FaqListEditor items={content.contact.faqItems} onChange={items => setContent(current => current ? { ...current, contact: { ...current.contact, faqItems: items } } : current)} />
                      <Field label="CTA Title" value={content.contact.ctaTitle} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, ctaTitle: value } } : current)} />
                      <TextAreaField label="CTA Description" value={content.contact.ctaDescription} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, ctaDescription: value } } : current)} rows={3} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <Field label="CTA Button Label" value={content.contact.ctaButton.label} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, ctaButton: { ...current.contact.ctaButton, label: value } } } : current)} />
                        <Field label="CTA Button Link" value={content.contact.ctaButton.href} onChange={value => setContent(current => current ? { ...current, contact: { ...current.contact, ctaButton: { ...current.contact.ctaButton, href: value } } } : current)} />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'legal' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="Legal Pages" description="Edit the public legal page content shown on the main website.">
                    <div style={{ display: 'grid', gap: '24px' }}>
                      <LegalPageEditor label="Terms and Conditions" page={content.legal.terms} onChange={page => setContent(current => current ? { ...current, legal: { ...current.legal, terms: page } } : current)} />
                      <LegalPageEditor label="Privacy Policy" page={content.legal.privacy} onChange={page => setContent(current => current ? { ...current, legal: { ...current.legal, privacy: page } } : current)} />
                      <LegalPageEditor label="Refund Policy" page={content.legal.refund} onChange={page => setContent(current => current ? { ...current, legal: { ...current.legal, refund: page } } : current)} />
                      <LegalPageEditor label="Disclaimer" page={content.legal.disclaimer} onChange={page => setContent(current => current ? { ...current, legal: { ...current.legal, disclaimer: page } } : current)} />
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === 'seo' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <SectionCard title="SEO / Meta" description="Manage site-level metadata and page-specific titles and descriptions.">
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <Field label="Site Title" value={content.seo.siteTitle} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, siteTitle: value } } : current)} />
                      <TextAreaField label="Site Description" value={content.seo.siteDescription} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, siteDescription: value } } : current)} rows={3} />
                      <ImageUploadField label="Open Graph Image" value={content.seo.openGraphImage} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, openGraphImage: value } } : current)} uploadKey="seo-og-image" onUpload={uploadWebsiteImage} uploading={uploadingField === 'seo-og-image'} />
                      <TextAreaField label="Keywords (comma separated)" value={content.seo.keywords} onChange={value => setContent(current => current ? { ...current, seo: { ...current.seo, keywords: value } } : current)} rows={3} />
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {seoPageKeys.map(pageKey => (
                          <div key={pageKey} className={styles.repeatableCard}>
                            <div className={styles.repeatableHeader}>
                              <p className={styles.repeatableTitle}>{pageKey}</p>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                              <Field label="Meta Title" value={content.seo.pages[pageKey].title} onChange={value => setContent(current => current ? {
                                ...current,
                                seo: {
                                  ...current.seo,
                                  pages: {
                                    ...current.seo.pages,
                                    [pageKey]: {
                                      ...current.seo.pages[pageKey],
                                      title: value
                                    }
                                  }
                                }
                              } : current)} />
                              <TextAreaField label="Meta Description" value={content.seo.pages[pageKey].description} onChange={value => setContent(current => current ? {
                                ...current,
                                seo: {
                                  ...current.seo,
                                  pages: {
                                    ...current.seo.pages,
                                    [pageKey]: {
                                      ...current.seo.pages[pageKey],
                                      description: value
                                    }
                                  }
                                }
                              } : current)} rows={3} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
