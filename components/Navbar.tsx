'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MainWebsiteContent } from '@/lib/main-website-content'

export default function Navbar({ content }: { content: MainWebsiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const primaryColor = content.theme.primaryColor
  const accentColor = content.theme.accentColor
  const logoSrc = content.header.logoSrc || content.theme.logoSrc

  return (
    <>
      <style>{`
        .navbar {
          background: ${primaryColor};
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
        }
        .nav-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          font-weight: 800;
          font-size: 18px;
        }
        .nav-logo img {
          height: 44px;
          width: auto;
          border-radius: 10px;
          background: white;
          padding: 4px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .nav-link {
          color: rgba(255,255,255,0.82);
          font-size: 15px;
          font-weight: 600;
          transition: color 0.2s;
          text-decoration: none;
        }
        .nav-link:hover {
          color: white;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-secondary {
          color: white;
          border: 1px solid rgba(255,255,255,0.28);
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .nav-primary {
          background: white;
          color: ${primaryColor};
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }
        .hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 26px;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 74px;
          left: 0;
          right: 0;
          background: ${primaryColor};
          padding: 24px 20px 28px;
          z-index: 99;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .mobile-menu.open {
          display: grid;
          gap: 16px;
        }
        .mobile-link {
          color: rgba(255,255,255,0.9);
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          text-decoration: none;
        }
        .mobile-actions {
          display: grid;
          gap: 10px;
          margin-top: 8px;
        }
        .mobile-primary,
        .mobile-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 800;
        }
        .mobile-primary {
          background: white;
          color: ${primaryColor};
        }
        .mobile-secondary {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .nav-accent {
          color: ${accentColor};
        }
        @media (max-width: 1024px) {
          .nav-links,
          .nav-actions {
            display: none;
          }
          .hamburger {
            display: block;
          }
        }
        @media (max-width: 768px) {
          .navbar {
            padding: 0 20px;
          }
          .nav-logo {
            font-size: 16px;
          }
          .nav-logo img {
            height: 38px;
          }
        }
      `}</style>

      <nav className="navbar">
        <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={content.header.siteName || content.theme.brandName} />
          ) : null}
          <span>{content.header.siteName || content.theme.brandName}</span>
        </Link>

        <div className="nav-links">
          {content.header.navItems.map(item => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          {content.header.secondaryButton.label && content.header.secondaryButton.href ? (
            <Link href={content.header.secondaryButton.href} className="nav-secondary" target={content.header.secondaryButton.href.startsWith('http') ? '_blank' : undefined}>
              {content.header.secondaryButton.label}
            </Link>
          ) : null}
          {content.header.primaryButton.label && content.header.primaryButton.href ? (
            <Link href={content.header.primaryButton.href} className="nav-primary" target={content.header.primaryButton.href.startsWith('http') ? '_blank' : undefined}>
              {content.header.primaryButton.label}
            </Link>
          ) : null}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(value => !value)} aria-label="Toggle navigation">
          {menuOpen ? 'X' : '='}
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {content.header.navItems.map(item => (
          <Link key={`mobile-${item.label}-${item.href}`} href={item.href} className="mobile-link" onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
        <div className="mobile-actions">
          {content.header.primaryButton.label && content.header.primaryButton.href ? (
            <Link href={content.header.primaryButton.href} className="mobile-primary" onClick={() => setMenuOpen(false)} target={content.header.primaryButton.href.startsWith('http') ? '_blank' : undefined}>
              {content.header.primaryButton.label}
            </Link>
          ) : null}
          {content.header.secondaryButton.label && content.header.secondaryButton.href ? (
            <Link href={content.header.secondaryButton.href} className="mobile-secondary" onClick={() => setMenuOpen(false)} target={content.header.secondaryButton.href.startsWith('http') ? '_blank' : undefined}>
              {content.header.secondaryButton.label}
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}
