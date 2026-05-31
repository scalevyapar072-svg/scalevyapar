'use client'

import { useEffect, useState } from 'react'
import styles from './company-site.module.css'

type Slide = {
  title: string
  text: string
  ctaLabel: string
  ctaHref: string
}

type Props = {
  slides: Slide[]
}

export function LandingSlider({ slides }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return

    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  const activeSlide = slides[activeIndex]

  return (
    <div className={styles.sliderCard}>
      <div className={styles.stack} style={{ gap: '18px' }}>
        <span className={styles.announcementPill} style={{ alignSelf: 'flex-start', background: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8' }}>
          Live workforce slider
        </span>
        <div key={activeSlide.title} className={styles.stack} style={{ gap: '14px' }}>
          <h3 className={styles.sectionTitle}>{activeSlide.title}</h3>
          <p className={styles.textMuted}>{activeSlide.text}</p>
        </div>
        <div className={styles.buttonRow}>
          <a href={activeSlide.ctaHref} className={styles.primaryButton} style={{ background: 'linear-gradient(135deg, #2563eb, #1e3a8a)', color: '#ffffff', border: '1px solid transparent' }}>
            {activeSlide.ctaLabel}
          </a>
          <a href="/labour/company/panel" className={styles.secondaryButton}>
            Open Dashboard
          </a>
        </div>
      </div>

      <div className={styles.buttonRow} style={{ marginTop: '22px' }}>
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: index === activeIndex ? '#2563eb' : '#cbd5e1',
              boxShadow: index === activeIndex ? '0 0 0 4px rgba(37,99,235,0.14)' : 'none'
            }}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
