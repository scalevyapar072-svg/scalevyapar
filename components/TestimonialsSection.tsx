'use client'

import { useEffect, useState } from 'react'
import { defaultMainWebsiteContent } from '@/data/main-website-content'

type TestimonialsSectionProps = {
  content?: typeof defaultMainWebsiteContent.home.testimonialsSection
}

export default function TestimonialsSection({ content = defaultMainWebsiteContent.home.testimonialsSection }: TestimonialsSectionProps) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      goNext()
    }, 4000)
    return () => clearInterval(timer)
  }, [current])

  const goNext = () => {
    setAnimating(true)
    setTimeout(() => {
      setCurrent(prev => (prev + 1) % content.items.length)
      setAnimating(false)
    }, 300)
  }

  const goPrev = () => {
    setAnimating(true)
    setTimeout(() => {
      setCurrent(prev => (prev - 1 + content.items.length) % content.items.length)
      setAnimating(false)
    }, 300)
  }

  const getVisible = () => {
    const items = []
    for (let index = 0; index < Math.min(3, content.items.length); index += 1) {
      items.push(content.items[(current + index) % content.items.length])
    }
    return items
  }

  return (
    <>
      <style>{`
        .ts-section { background: #f8fafc; padding: 80px 48px; }
        .ts-header { text-align: center; margin-bottom: 48px; }
        .ts-tag { background: #374655; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .ts-title { color: #1e293b; font-size: 36px; font-weight: 800; margin-bottom: 12px; }
        .ts-subtitle { color: #64748b; font-size: 16px; max-width: 600px; margin: 0 auto; line-height: 1.7; }
        .ts-wrapper { max-width: 1200px; margin: 0 auto; }
        .ts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; transition: opacity 0.3s ease; }
        .ts-grid.animating { opacity: 0; }
        .ts-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; transition: all 0.3s; }
        .ts-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(55,70,85,0.12); border-color: #374655; }
        .ts-stars { display: flex; margin-bottom: 16px; }
        .ts-star { color: #f59e0b; font-size: 18px; }
        .ts-review { color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 20px; font-style: italic; }
        .ts-reviewer { display: flex; align-items: center; gap: 12px; }
        .ts-avatar { width: 44px; height: 44px; border-radius: 50%; background: #374655; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; flex-shrink: 0; }
        .ts-name { color: #1e293b; font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .ts-business { color: #64748b; font-size: 12px; }
        .ts-controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
        .ts-btn { width: 44px; height: 44px; border-radius: 50%; background: #374655; color: white; border: none; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ts-btn:hover { background: #4a5a6a; transform: scale(1.1); }
        .ts-dots { display: flex; gap: 8px; }
        .ts-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; cursor: pointer; transition: all 0.2s; border: none; padding: 0; }
        .ts-dot.active { background: #374655; width: 24px; border-radius: 4px; }
        @media (max-width: 768px) {
          .ts-section { padding: 60px 20px; }
          .ts-grid { grid-template-columns: 1fr; }
          .ts-title { font-size: 26px; }
        }
      `}</style>

      <section className="ts-section">
        <div className="ts-header">
          <span className="ts-tag">{content.eyebrow}</span>
          <h2 className="ts-title">{content.title}</h2>
          <p className="ts-subtitle">{content.subtitle}</p>
        </div>

        <div className="ts-wrapper">
          <div className={`ts-grid ${animating ? 'animating' : ''}`}>
            {getVisible().map((item, index) => (
              <div key={`${item.name}-${index}`} className="ts-card">
                <div className="ts-stars">
                  {Array.from({ length: item.rating }).map((_, starIndex) => (
                    <span key={starIndex} className="ts-star">★</span>
                  ))}
                </div>
                <p className="ts-review">{item.review}</p>
                <div className="ts-reviewer">
                  <div className="ts-avatar">{item.avatar}</div>
                  <div>
                    <p className="ts-name">{item.name}</p>
                    <p className="ts-business">{item.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ts-controls">
            <button className="ts-btn" onClick={goPrev}>←</button>
            <div className="ts-dots">
              {content.items.map((_, index) => (
                <button key={index} className={`ts-dot ${index === current ? 'active' : ''}`} onClick={() => setCurrent(index)} />
              ))}
            </div>
            <button className="ts-btn" onClick={goNext}>→</button>
          </div>
        </div>
      </section>
    </>
  )
}
