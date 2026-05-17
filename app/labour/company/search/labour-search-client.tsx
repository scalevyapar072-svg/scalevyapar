'use client'

import { useMemo, useState } from 'react'
import styles from '../company-site.module.css'

type WorkerItem = {
  id: string
  fullName: string
  city: string
  experienceYears: number
  expectedDailyWage: number
  availability: string
  categoryLabels: string[]
}

type Props = {
  workers: WorkerItem[]
  categories: string[]
  cities: string[]
  eyebrow: string
  title: string
  subtitle: string
  helperText: string
  emptyTitle: string
  emptyDescription: string
  accentColor: string
  highlightColor: string
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const titleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())

export function LabourSearchClient({
  workers,
  categories,
  cities,
  eyebrow,
  title,
  subtitle,
  helperText,
  emptyTitle,
  emptyDescription,
  accentColor,
  highlightColor
}: Props) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const searchMatch = !search || `${worker.fullName} ${worker.city} ${worker.categoryLabels.join(' ')}`.toLowerCase().includes(search.toLowerCase())
      const cityMatch = !city || worker.city === city
      const categoryMatch = !category || worker.categoryLabels.includes(category)
      return searchMatch && cityMatch && categoryMatch
    })
  }, [workers, search, city, category])

  return (
    <>
      <section className={styles.card}>
        <p className={styles.eyebrow} style={{ color: accentColor }}>{eyebrow}</p>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.textMuted} style={{ maxWidth: '760px', marginBottom: '18px' }}>{subtitle}</p>
        <p className={styles.textMuted}>{helperText}</p>

        <div className={styles.threeColGrid} style={{ marginTop: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>Search</label>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by worker, city or category" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>City</label>
            <select value={city} onChange={event => setCity(event.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px', background: '#ffffff' }}>
              <option value="">All cities</option>
              {cities.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>Category</label>
            <select value={category} onChange={event => setCategory(event.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe2ea', borderRadius: '14px', fontSize: '14px', background: '#ffffff' }}>
              <option value="">All categories</option>
              {categories.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {filteredWorkers.length === 0 ? (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{emptyTitle}</h2>
          <p className={styles.textMuted}>{emptyDescription}</p>
        </section>
      ) : (
        <section className={styles.card}>
          <div className={styles.sectionFooter}>
            <div>
              <h2 className={styles.sectionTitle}>Visible labour list</h2>
              <p className={styles.textMuted}>{filteredWorkers.length} workers match your current filters.</p>
            </div>
            <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}>
              Post Requirement
            </a>
          </div>

          <div className={styles.twoColGrid}>
            {filteredWorkers.map(worker => (
              <div key={worker.id} className={styles.listCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', marginBottom: '14px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '19px', fontWeight: '900' }}>{worker.fullName}</p>
                    <p className={styles.textMuted}>{worker.city} • {titleCase(worker.availability)}</p>
                  </div>
                  <span className={styles.chip} style={{ background: '#f8fafc', color: accentColor, border: '1px solid rgba(37,99,235,0.18)' }}>
                    {worker.experienceYears} yrs
                  </span>
                </div>

                <div className={styles.stack} style={{ marginBottom: '16px' }}>
                  <span className={styles.textMuted}>Expected wage: {formatCurrency(worker.expectedDailyWage)} / day</span>
                  <span className={styles.textMuted}>Categories: {worker.categoryLabels.join(', ')}</span>
                </div>

                <div className={styles.chipRow} style={{ marginBottom: '16px' }}>
                  {worker.categoryLabels.map(label => (
                    <span key={`${worker.id}-${label}`} className={styles.chip} style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea' }}>
                      {label}
                    </span>
                  ))}
                </div>

                <div className={styles.buttonRow}>
                  <a href="/labour/company#company-intake" className={styles.primaryButton} style={{ background: accentColor, color: '#ffffff', border: '1px solid transparent' }}>
                    Connect Through Admin
                  </a>
                  <a href="/labour/company/contact" className={styles.secondaryButton}>
                    Contact Support
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.darkCard} style={{ background: `linear-gradient(135deg, ${accentColor}, ${highlightColor})` }}>
        <div className={styles.sectionFooter} style={{ marginBottom: 0 }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>Need faster matching?</h2>
            <p className={styles.textMutedDark}>Post your job requirement so the admin team can help you activate the right labour search faster.</p>
          </div>
          <a href="/labour/company#company-intake" className={styles.secondaryButton}>
            Submit company enquiry
          </a>
        </div>
      </section>
    </>
  )
}
