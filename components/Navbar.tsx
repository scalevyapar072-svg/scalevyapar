'use client'

import Link from 'next/link'
import { useState } from 'react'
import { defaultMainWebsiteContent } from '@/data/main-website-content'

type NavbarProps = {
  content?: typeof defaultMainWebsiteContent.header
}

export default function Navbar({ content = defaultMainWebsiteContent.header }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .navbar {
          background: #374655;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 20px rgba(0,0,0,0.15);
        }
        .nav-logo img { height: 65px; width: auto; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { color: rgba(255,255,255,0.8); font-size: 15px; font-weight: 500; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: white; }
        .nav-cta { background: white; color: #374655; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; transition: all 0.2s; }
        .nav-cta:hover { background: #f1f5f9; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: white; font-size: 26px; }
        .mobile-menu { display: none; position: fixed; top: 70px; left: 0; right: 0; background: #374655; padding: 24px; z-index: 99; flex-direction: column; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .mobile-menu.open { display: flex; }
        .mobile-link { color: rgba(255,255,255,0.85); font-size: 16px; font-weight: 500; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        @media (max-width: 768px) {
          .nav-logo img { height: 36px !important; }
          .navbar { padding: 0 20px; }
          .nav-links { display: none; }
          .hamburger { display: block; }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-logo">
          <Link href="/">
            <img src={content.logoSrc} alt={content.logoAlt} />
          </Link>
        </div>

        <div className="nav-links">
          {content.navItems.map(item => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
          <Link href={content.loginButtonHref} className="nav-cta">
            {content.loginButtonLabel}
          </Link>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {content.navItems.map(item => (
          <Link key={`mobile-${item.label}-${item.href}`} href={item.href} className="mobile-link" onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href={content.loginButtonHref} className="mobile-link" onClick={() => setMenuOpen(false)}>
          {content.mobileLoginLabel}
        </Link>
      </div>
    </>
  )
}
