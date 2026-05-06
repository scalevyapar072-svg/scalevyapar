'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomBar() {
  const pathname = usePathname()

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
        .mobile-bottom-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 4px;
          text-decoration: none;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .mobile-bottom-item.active {
          color: #374655;
        }
        .mobile-bottom-item span:first-child {
          font-size: 20px;
        }
        .mobile-bottom-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 4px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .mobile-bottom-cta-icon {
          width: 40px;
          height: 40px;
          background: #374655;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-top: -16px;
          box-shadow: 0 4px 12px rgba(55,70,85,0.3);
        }
        .mobile-bottom-cta span:last-child {
          color: #374655;
        }
        @media (max-width: 768px) {
          .mobile-bottom-bar { display: block; }
        }
      `}</style>

      <div className="mobile-bottom-bar">
        <div className="mobile-bottom-grid">
          <Link href="/" className={`mobile-bottom-item ${pathname === '/' ? 'active' : ''}`}>
            <span>🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/tools" className={`mobile-bottom-item ${pathname === '/tools' ? 'active' : ''}`}>
            <span>🛠️</span>
            <span>Tools</span>
          </Link>
          <a href="https://wa.me/919314023719" className="mobile-bottom-cta" target="_blank">
            <div className="mobile-bottom-cta-icon">💬</div>
            <span>Chat</span>
          </a>
          <Link href="/pricing" className={`mobile-bottom-item ${pathname === '/pricing' ? 'active' : ''}`}>
            <span>💰</span>
            <span>Pricing</span>
          </Link>
          <Link href="/contact" className={`mobile-bottom-item ${pathname === '/contact' ? 'active' : ''}`}>
            <span>📞</span>
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </>
  )
}