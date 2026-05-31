'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './company-site.module.css'

type ScrollRevealProps = {
  children: React.ReactNode
  className?: string
  delayMs?: number
  variant?: 'up' | 'left' | 'right' | 'scale'
}

export function ScrollReveal({ children, className = '', delayMs = 0, variant = 'up' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px'
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${styles.scrollReveal} ${
        variant === 'left'
          ? styles.scrollRevealLeft
          : variant === 'right'
            ? styles.scrollRevealRight
            : variant === 'scale'
              ? styles.scrollRevealScale
              : styles.scrollRevealUp
      }${visible ? ` ${styles.scrollRevealVisible}` : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
