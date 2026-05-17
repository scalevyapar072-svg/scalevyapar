'use client'

import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import styles from '../company-site.module.css'

type Props = {
  title: string
  subtitle: string
  subjectOptions: string[]
  buttonLabel: string
}

type FormState = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactFormClient({ title, subtitle, subjectOptions, buttonLabel }: Props) {
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const isValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
      emailRegex.test(form.email.trim()) &&
      /^\d{10}$/.test(form.phone.trim()) &&
      form.subject.trim() &&
      form.message.trim()
    )
  }, [form])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: '' }))
    setSubmitted(false)
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.name.trim()) nextErrors.name = 'Please enter your name.'
    if (!emailRegex.test(form.email.trim())) nextErrors.email = 'Please enter a valid email address.'
    if (!/^\d{10}$/.test(form.phone.trim())) nextErrors.phone = 'Phone number must be 10 digits.'
    if (!form.subject.trim()) nextErrors.subject = 'Please select a subject.'
    if (!form.message.trim()) nextErrors.message = 'Please enter your message.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitted(true)
    setForm(initialState)
  }

  return (
    <div className={styles.contactFormCard}>
      <div className={styles.contactSectionHeading}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {submitted ? (
        <div className={`${styles.contactFormStatus} ${styles.contactFormStatusSuccess}`}>
          Your message is ready and our team will get back to you as soon as possible.
        </div>
      ) : null}

      <form className={styles.contactFormLayout} onSubmit={submitForm} noValidate>
        <div className={styles.contactFormRow}>
          <label className={styles.contactField}>
            <span>Your Name *</span>
            <input type="text" name="name" value={form.name} onChange={event => setField('name', event.target.value)} placeholder="Enter your name" />
            {errors.name ? <small className={styles.contactFieldError}>{errors.name}</small> : null}
          </label>
          <label className={styles.contactField}>
            <span>Your Email *</span>
            <input type="email" name="email" value={form.email} onChange={event => setField('email', event.target.value)} placeholder="Enter your email" />
            {errors.email ? <small className={styles.contactFieldError}>{errors.email}</small> : null}
          </label>
        </div>

        <label className={styles.contactField}>
          <span>Phone Number *</span>
          <input type="tel" name="phone" value={form.phone} onChange={event => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter your phone number" />
          {errors.phone ? <small className={styles.contactFieldError}>{errors.phone}</small> : null}
        </label>

        <label className={styles.contactField}>
          <span>Subject *</span>
          <select name="subject" value={form.subject} onChange={event => setField('subject', event.target.value)}>
            <option value="" disabled>
              Select a subject
            </option>
            {subjectOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.subject ? <small className={styles.contactFieldError}>{errors.subject}</small> : null}
        </label>

        <label className={styles.contactField}>
          <span>Your Message *</span>
          <textarea name="message" rows={5} value={form.message} onChange={event => setField('message', event.target.value)} placeholder="Type your message here..." />
          {errors.message ? <small className={styles.contactFieldError}>{errors.message}</small> : null}
        </label>

        <button type="submit" className={styles.contactSubmitButton} disabled={!isValid}>
          <Send size={16} />
          {buttonLabel}
        </button>
      </form>
    </div>
  )
}
