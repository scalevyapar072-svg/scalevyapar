'use client'

import { useState } from 'react'
import type { MainWebsiteContent } from '@/lib/main-website-content'

export default function ContactPageClient({ content }: { content: MainWebsiteContent }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    business: '',
    message: '',
    tool: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const message = [
      `Hi ${content.theme.brandName}! I want to know more about your services.`,
      '',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Business: ${form.business}`,
      `Tool Interested In: ${form.tool}`,
      `Message: ${form.message}`
    ].join('\n')
    window.open(`${content.contact.whatsappLink}?text=${encodeURIComponent(message)}`, '_blank')
    setSubmitted(true)
  }

  return (
    <section style={{ background: content.theme.backgroundColor, padding: '0 20px 80px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '28px' }}>
        <div
          style={{
            background: content.theme.primaryColor,
            borderRadius: '32px',
            padding: '56px 28px',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
              Contact
            </span>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.05 }}>{content.contact.pageTitle}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.78)', fontSize: '16px', lineHeight: 1.75 }}>{content.contact.pageDescription}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '24px' }}>Contact Information</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <a href={content.contact.whatsappLink} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', background: content.theme.primaryColor, color: 'white', borderRadius: '18px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.72, marginBottom: '4px' }}>Fastest response</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>WhatsApp</div>
                  <div style={{ fontSize: '14px', opacity: 0.82 }}>{content.contact.phone}</div>
                </a>
                <a href={`tel:${content.contact.phone.replace(/\s+/g, '')}`} style={{ display: 'block', textDecoration: 'none', background: '#f8fafc', color: '#0f172a', borderRadius: '18px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{content.contact.phone}</div>
                </a>
                <a href={`mailto:${content.contact.email}`} style={{ display: 'block', textDecoration: 'none', background: '#f8fafc', color: '#0f172a', borderRadius: '18px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{content.contact.email}</div>
                </a>
                <a href={content.contact.mapLink} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#f8fafc', color: '#0f172a', borderRadius: '18px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Address</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{content.contact.address}</div>
                </a>
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}>Business Hours</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {content.contact.hours.map(item => (
                  <div key={`${item.day}-${item.time}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#475569', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span>{item.day}</span>
                    <strong style={{ color: '#0f172a' }}>{item.time}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 12px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>Done</div>
                <h2 style={{ margin: '0 0 10px', color: '#0f172a' }}>Message prepared</h2>
                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>Your message has been opened in WhatsApp. Our team will follow up there.</p>
                <button onClick={() => setSubmitted(false)} style={{ ...buttonStyle(content.theme.primaryColor), marginTop: '20px' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '26px' }}>{content.contact.contactFormTitle}</h2>
                <p style={{ marginTop: 0, color: '#64748b', lineHeight: 1.7 }}>{content.contact.supportText}</p>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <Input label="Full Name" value={form.name} onChange={value => setForm(current => ({ ...current, name: value }))} required />
                    <Input label="Phone Number" value={form.phone} onChange={value => setForm(current => ({ ...current, phone: value }))} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <Input label="Email Address" value={form.email} onChange={value => setForm(current => ({ ...current, email: value }))} />
                    <Input label="Business Name" value={form.business} onChange={value => setForm(current => ({ ...current, business: value }))} />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Tool Interested In</label>
                    <select value={form.tool} onChange={event => setForm(current => ({ ...current, tool: event.target.value }))} style={fieldStyle}>
                      <option value="">Select a tool</option>
                      {content.services.cards.map(card => (
                        <option key={card.title} value={card.title}>{card.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Message</label>
                    <textarea value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} required rows={5} style={{ ...fieldStyle, resize: 'vertical' }} />
                  </div>
                  <button type="submit" style={buttonStyle(content.theme.primaryColor)}>
                    Send Message on WhatsApp
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{content.contact.faqTitle}</h2>
          {content.contact.faqItems.map(item => (
            <div key={item.question} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '17px' }}>{item.question}</h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75 }}>{item.answer}</p>
            </div>
          ))}
        </div>

        <div style={{ background: content.theme.primaryColor, color: 'white', borderRadius: '28px', padding: '40px 28px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '30px' }}>{content.contact.ctaTitle}</h2>
          <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.7 }}>{content.contact.ctaDescription}</p>
          <a href={content.contact.ctaButton.href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: content.theme.primaryColor, borderRadius: '999px', padding: '14px 24px', fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
            {content.contact.ctaButton.label}
          </a>
        </div>
      </div>
    </section>
  )
}

function Input({
  label,
  value,
  onChange,
  required = false
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <input value={value} onChange={event => onChange(event.target.value)} required={required} style={fieldStyle} />
    </div>
  )
}

const fieldLabelStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#0f172a',
  fontSize: '13px',
  fontWeight: 700
}

const fieldStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #dbe5ef',
  borderRadius: '14px',
  padding: '12px 14px',
  color: '#0f172a',
  fontSize: '14px',
  boxSizing: 'border-box' as const
}

const buttonStyle = (background: string) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  border: 'none',
  borderRadius: '14px',
  padding: '14px 16px',
  background,
  color: 'white',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer'
})
