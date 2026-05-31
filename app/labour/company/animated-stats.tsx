'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './company-site.module.css'

type Stat = {
  label: string
  value: number
  suffix?: string
}

type Props = {
  stats: Stat[]
}

export function AnimatedStats({ stats }: Props) {
  const [displayValues, setDisplayValues] = useState(() => stats.map(() => 0))

  const targets = useMemo(() => stats.map(item => Math.max(0, Math.floor(item.value))), [stats])

  useEffect(() => {
    let frame = 0
    const startedAt = performance.now()
    const duration = 1000

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1)
      setDisplayValues(targets.map(target => Math.round(target * progress)))

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [targets])

  return (
    <div className={styles.fourColGrid}>
      {stats.map((item, index) => (
        <div key={item.label} className={styles.card}>
          <p className={styles.eyebrow} style={{ color: '#2563eb', marginBottom: '10px' }}>{item.label}</p>
          <p style={{ margin: 0, color: '#0f172a', fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em' }}>
            {displayValues[index].toLocaleString('en-IN')}
            {item.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  )
}
