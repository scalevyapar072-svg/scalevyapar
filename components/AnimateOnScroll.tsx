'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'fade'
}

export default function AnimateOnScroll({ children, delay = 0, direction = 'up' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  const getTransform = () => {
    if (visible) return 'translate(0, 0)'
    if (direction === 'up') return 'translateY(40px)'
    if (direction === 'left') return 'translateX(-40px)'
    if (direction === 'right') return 'translateX(40px)'
    return 'translate(0, 0)'
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity 0.6s ease, transform 0.6s ease`,
      }}
    >
      {children}
    </div>
  )
}