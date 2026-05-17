'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const testimonials = [
  { name: 'Rajesh Sharma', business: 'Sharma Textiles, Jaipur', review: 'Got 500 leads in 2 weeks using LeadRadar. Our sales team is 3x more productive!', avatar: 'R' },
  { name: 'Priya Agarwal', business: 'Agarwal Exports, Jaipur', review: 'Vizora AI photos saved us 15000 per month on photographers. Instagram sales doubled!', avatar: 'P' },
  { name: 'Mohit Gupta', business: 'Gupta Electronics, Jaipur', review: 'WhatsApp automation took our follow-up rate from 20 to 80 percent. Game changer!', avatar: 'M' },
  { name: 'Sunita Verma', business: 'Verma Jewellers, Jaipur', review: 'CRM system improved our conversion rate by 40 percent. Support team is amazing!', avatar: 'S' },
  { name: 'Amit Joshi', business: 'Joshi Manufacturing, Jaipur', review: 'Reduced stock wastage by 60 percent with inventory management. Highly recommended!', avatar: 'A' },
  { name: 'Kavita Mehta', business: 'Mehta Fashion, Jaipur', review: 'Got 200 leads in first month. The team held our hand through everything!', avatar: 'K' },
]

export default function TestimonialsSlider() {
  const pathname = usePathname()
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const hideOnWorkspacePages =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/labour/company' ||
    pathname.startsWith('/labour/company/')

  useEffect(() => {
    if (hideOnWorkspacePages) {
      return
    }

    const timers: Array<ReturnType<typeof setTimeout>> = []

    const cycle = () => {
      // Show popup
      setDismissed(false)
      setVisible(true)

      // Hide after 3 seconds
      const hideTimer = setTimeout(() => {
        setVisible(false)

        // Wait 12 seconds then show next
        const nextTimer = setTimeout(() => {
          setCurrent(prev => (prev + 1) % testimonials.length)
          cycle()
        }, 12000)
        timers.push(nextTimer)
      }, 3000)
      timers.push(hideTimer)
    }

    // First popup appears after 4 seconds
    const firstTimer = setTimeout(() => {
      cycle()
    }, 4000)
    timers.push(firstTimer)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [hideOnWorkspacePages])

  const t = testimonials[current]

  if (hideOnWorkspacePages) return null

  return (
    <>
      <style>{`
        .testimonial-popup {
          position: fixed;
          bottom: 100px;
          left: 24px;
          z-index: 998;
          max-width: 300px;
          background: white;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid #e2e8f0;
          border-left: 4px solid #374655;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateX(-120%);
          opacity: 0;
        }
        .testimonial-popup.show {
          transform: translateX(0);
          opacity: 1;
        }
        .popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .popup-stars { color: #f59e0b; font-size: 14px; letter-spacing: 1px; }
        .popup-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 0; line-height: 1; }
        .popup-close:hover { color: #374655; }
        .popup-review { color: #475569; font-size: 13px; line-height: 1.6; margin-bottom: 12px; font-style: italic; }
        .popup-footer { display: flex; align-items: center; gap: 10px; }
        .popup-avatar { width: 36px; height: 36px; border-radius: 50%; background: #374655; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .popup-name { color: #1e293b; font-size: 13px; font-weight: 700; margin-bottom: 1px; }
        .popup-business { color: #94a3b8; font-size: 11px; }
        .popup-tag { position: absolute; top: -10px; left: 16px; background: #374655; color: white; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        @media (max-width: 768px) {
          .testimonial-popup { left: 12px; right: 12px; max-width: calc(100% - 24px); bottom: 80px; }
        }
      `}</style>

      <div className={`testimonial-popup ${visible && !dismissed ? 'show' : ''}`}>
        <span className="popup-tag">⭐ Verified Review</span>
        <div className="popup-header">
          <div className="popup-stars">★★★★★</div>
          <button className="popup-close" onClick={() => setDismissed(true)}>✕</button>
        </div>
        <p className="popup-review">{t.review}</p>
        <div className="popup-footer">
          <div className="popup-avatar">{t.avatar}</div>
          <div>
            <p className="popup-name">{t.name}</p>
            <p className="popup-business">{t.business}</p>
          </div>
        </div>
      </div>
    </>
  )
}
