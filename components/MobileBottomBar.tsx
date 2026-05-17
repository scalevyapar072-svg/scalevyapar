'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MainWebsiteContent } from '@/lib/main-website-content'

const iconForPath = (href: string) => {
  if (href === '/') return 'Home'
  if (href.includes('tools')) return 'Tools'
  if (href.includes('pricing')) return 'Price'
  if (href.includes('contact')) return 'Call'
  if (href.includes('about')) return 'Info'
  return 'Go'
}

export default function MobileBottomBar({ content }: { content: MainWebsiteContent }) {
  const pathname = usePathname()
  const navItems = content.header.navItems.slice(0, 4)

  return (
    <>
      <style>{`
        .mobile-bottom-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e2e8f0;
          z-index: 997;
          padding: 8px 0;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }
        .mobile-bottom-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
        }
        .mobile-bottom-item,
        .mobile-bottom-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 4px;
          text-decoration: none;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
        }
        .mobile-bottom-item.active {
          color: ${content.theme.primaryColor};
        }
        .mobile-bottom-item span:first-child {
          font-size: 12px;
          font-weight: 800;
        }
        .mobile-bottom-cta-icon {
          width: 40px;
          height: 40px;
          background: ${content.theme.primaryColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          margin-top: -16px;
          box-shadow: 0 4px 12px rgba(55,70,85,0.3);
          color: white;
          font-weight: 800;
        }
        .mobile-bottom-cta span:last-child {
          color: ${content.theme.primaryColor};
        }
        @media (max-width: 768px) {
          .mobile-bottom-bar { display: block; }
        }
      `}</style>

      <div className="mobile-bottom-bar">
        <div className="mobile-bottom-grid">
          {navItems.map(item => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className={`mobile-bottom-item ${pathname === item.href ? 'active' : ''}`}>
              <span>{iconForPath(item.href)}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <a href={content.contact.whatsappLink} className="mobile-bottom-cta" target="_blank" rel="noreferrer">
            <div className="mobile-bottom-cta-icon">Chat</div>
            <span>Chat</span>
          </a>
        </div>
      </div>
    </>
  )
}
