'use client'

import type { MainWebsiteContent } from '@/lib/main-website-content'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export default function FloatingWhatsApp({ content }: { content: MainWebsiteContent }) {
  if (!content.floatingContact.enabled) {
    return null
  }

  const href = content.contact.whatsappLink || buildWhatsAppLink(content.floatingContact.whatsappNumber, content.floatingContact.whatsappMessage)
  if (!href) {
    return null
  }

  return (
    <>
      <style>{`
        .wa-wrap {
          position: fixed;
          bottom: 32px;
          ${content.floatingContact.position === 'left' ? 'left: 24px;' : 'right: 24px;'}
          z-index: 999;
        }
        .wa-btn {
          width: 62px;
          height: 62px;
          background: #25d366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 26px rgba(37,211,102,0.38);
          text-decoration: none;
          position: relative;
          transition: transform 0.3s ease;
        }
        .wa-btn:hover { transform: scale(1.08); }
        .wa-pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(37,211,102,0.36);
          animation: waPulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes waPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @media (max-width: 768px) {
          .wa-wrap {
            bottom: 88px;
            ${content.floatingContact.position === 'left' ? 'left: 16px;' : 'right: 16px;'}
          }
        }
      `}</style>
      <div className="wa-wrap">
        <a href={href} className="wa-btn" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <div className="wa-pulse" />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
          </svg>
        </a>
      </div>
    </>
  )
}
