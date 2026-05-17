'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { MainWebsiteContent } from '@/lib/main-website-content'

export default function TestimonialsSlider({ content }: { content: MainWebsiteContent }) {
  const pathname = usePathname()
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const testimonials = content.home.testimonials.filter(item => item.enabled)
  const hideOnWorkspacePages =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/labour/company' ||
    pathname.startsWith('/labour/company/')

  useEffect(() => {
    if (hideOnWorkspacePages || testimonials.length === 0) {
      return
    }

    const timers: Array<ReturnType<typeof setTimeout>> = []

    const cycle = () => {
      setDismissed(false)
      setVisible(true)

      const hideTimer = setTimeout(() => {
        setVisible(false)

        const nextTimer = setTimeout(() => {
          setCurrent(prev => (prev + 1) % testimonials.length)
          cycle()
        }, 12000)

        timers.push(nextTimer)
      }, 3200)

      timers.push(hideTimer)
    }

    const firstTimer = setTimeout(() => {
      cycle()
    }, 4500)
    timers.push(firstTimer)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [hideOnWorkspacePages, testimonials.length])

  if (hideOnWorkspacePages || testimonials.length === 0) return null

  const testimonial = testimonials[current]

  return (
    <>
      <style>{`
        .testimonial-popup {
          position: fixed;
          bottom: 100px;
          left: 24px;
          z-index: 998;
          max-width: 320px;
          background: white;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid #e2e8f0;
          border-left: 4px solid ${content.theme.primaryColor};
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateX(-120%);
          opacity: 0;
        }
        .testimonial-popup.show {
          transform: translateX(0);
          opacity: 1;
        }
        .popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .popup-stars {
          color: #f59e0b;
          font-size: 14px;
          letter-spacing: 1px;
        }
        .popup-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          line-height: 1;
        }
        .popup-review {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 12px;
          font-style: italic;
        }
        .popup-footer {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .popup-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${content.theme.primaryColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .popup-name {
          color: #1e293b;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 1px;
        }
        .popup-business {
          color: #94a3b8;
          font-size: 11px;
        }
        .popup-tag {
          position: absolute;
          top: -10px;
          left: 16px;
          background: ${content.theme.primaryColor};
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
        }
        @media (max-width: 768px) {
          .testimonial-popup {
            left: 12px;
            right: 12px;
            max-width: calc(100% - 24px);
            bottom: 84px;
          }
        }
      `}</style>

      <div className={`testimonial-popup ${visible && !dismissed ? 'show' : ''}`}>
        <span className="popup-tag">Client Review</span>
        <div className="popup-header">
          <div className="popup-stars">{'★'.repeat(Math.max(1, testimonial.rating || 5))}</div>
          <button className="popup-close" onClick={() => setDismissed(true)}>X</button>
        </div>
        <p className="popup-review">{testimonial.quote}</p>
        <div className="popup-footer">
          <div className="popup-avatar">{(testimonial.avatar || testimonial.name.slice(0, 1)).toUpperCase()}</div>
          <div>
            <p className="popup-name">{testimonial.name}</p>
            <p className="popup-business">{testimonial.business}</p>
          </div>
        </div>
      </div>
    </>
  )
}
