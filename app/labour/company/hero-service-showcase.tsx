'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './company-site.module.css'

type ShowcaseItem = {
  id: string
  title: string
  description: string
  industries: string[]
  metricLabel: string
  metricValue: string
  accentClass: string
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'textile-factory',
    title: 'Textile & factory workforce',
    description:
      'Skilled helpers, machine operators, packaging staff, and floor workers for textile units and factories.',
    industries: ['Textile', 'Factory', 'Manufacturing', 'Quality Check'],
    metricLabel: 'Textile & factory',
    metricValue: '24/7',
    accentClass: styles.heroAccentIndigo
  },
  {
    id: 'warehouse-logistics',
    title: 'Warehouse & logistics teams',
    description:
      'Pickers, loaders, scanning staff, dispatch workers, and logistics support for fast-moving warehouse operations.',
    industries: ['Warehouse', 'Logistics', 'Inventory', 'Dispatch'],
    metricLabel: 'Warehouse response',
    metricValue: 'Fast',
    accentClass: styles.heroAccentBlue
  },
  {
    id: 'delivery-manufacturing',
    title: 'Delivery & manufacturing crews',
    description:
      'Reliable daily-basis workers for manufacturing shifts, local delivery support, movement, and fulfillment tasks.',
    industries: ['Delivery', 'Manufacturing', 'Fulfillment', 'Movement'],
    metricLabel: 'Shift-ready teams',
    metricValue: 'Same Day',
    accentClass: styles.heroAccentTeal
  },
  {
    id: 'hospitality-multi',
    title: 'Hospitality & multi-service staff',
    description:
      'Housekeeping, service, support, and utility workers for hospitality businesses and fast-growing service operations.',
    industries: ['Hospitality', 'Service', 'Support Staff', 'Utility Crew'],
    metricLabel: 'Multi-industry',
    metricValue: 'Flexible',
    accentClass: styles.heroAccentSky
  }
]

export function HeroServiceShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % SHOWCASE_ITEMS.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const activeItem = useMemo(() => SHOWCASE_ITEMS[activeIndex], [activeIndex])

  return (
    <div className={styles.heroShowcaseCard}>
      <div className={styles.heroVisualBackdrop} />
      <div className={styles.heroVisualStage}>
        <div className={`${styles.heroVisualHalo} ${activeItem.accentClass}`} />

        <div className={styles.heroVisualMainCard}>
          <div className={styles.heroTemplateBadgeRow}>
            <div className={styles.heroTemplateDots}>
              {SHOWCASE_ITEMS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.heroTemplateDot}${index === activeIndex ? ` ${styles.heroTemplateDotActive}` : ''}`}
                  aria-label={`Show ${item.title}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>

          <div key={activeItem.id} className={styles.heroTemplateBody}>
            <p className={styles.heroVisualTitle}>{activeItem.title}</p>
            <p className={styles.textMuted} style={{ fontSize: '13px' }}>
              {activeItem.description}
            </p>

            <div className={styles.heroServiceGrid}>
              {activeItem.industries.map(label => (
                <span key={label} className={styles.heroServiceChip}>
                  <span className={styles.heroServiceDot} />
                  {label}
                </span>
              ))}
            </div>

            <div className={styles.heroVisualMetricStrip}>
              <div className={styles.heroVisualMetricCard}>
                <p className={styles.heroVisualMetricValue}>{activeItem.metricValue}</p>
                <p className={styles.heroVisualMetricLabel}>{activeItem.metricLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
