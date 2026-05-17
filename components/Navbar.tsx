'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MainWebsiteContent } from '@/lib/main-website-content'

export default function Navbar({ content }: { content: MainWebsiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const logoSrc = content.header.logoSrc || content.theme.logoSrc
  const stickyPosition = content.header.sticky ? 'sticky' : 'relative'
  const background = content.header.backgroundStyle === 'glass-dark'
    ? 'rgba(31, 44, 58, 0.78)'
    : `linear-gradient(135deg, ${content.theme.darkBackgroundColor}, ${content.theme.primaryColor})`

  return (
    <>
      <style>{`
        .navbar {
          position: ${stickyPosition};
          top: 0;
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          min-height: 74px;
          padding: 0 48px;
          background: ${background};
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 28px rgba(15,23,42,0.16);
          backdrop-filter: blur(18px);
        }
        .nav-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: white;
          text-decoration: none;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .nav-logo img {
          height: 54px;
          width: auto;
          object-fit: contain;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
        }
        .nav-link {
          color: rgba(255,255,255,0.78);
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: white;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-secondary,
        .nav-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border-radius: 12px;
          padding: 11px 18px;
          font-size: 14px;
          font-weight: 800;
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .nav-secondary {
          color: white;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
        }
        .nav-primary {
          color: ${content.theme.primaryColor};
          background: white;
          box-shadow: 0 12px 24px rgba(15,23,42,0.12);
        }
        .nav-secondary:hover,
        .nav-primary:hover {
          transform: translateY(-2px);
        }
        .nav-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
          color: white;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 74px;
          left: 0;
          right: 0;
          z-index: 119;
          padding: 20px;
          background: linear-gradient(180deg, ${content.theme.darkBackgroundColor}, ${content.theme.primaryColor});
          border-top: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 42px rgba(15,23,42,0.24);
        }
        .mobile-menu.open {
          display: grid;
          gap: 14px;
        }
        .mobile-link {
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          padding: 0 0 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
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
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 800;
        }
        .mobile-primary {
          color: ${content.theme.primaryColor};
          background: white;
        }
        .mobile-secondary {
          color: white;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
        }
        @media (max-width: 1024px) {
          .nav-links,
          .nav-actions {
            display: none;
          }
          .nav-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .navbar {
            padding: 0 18px;
          }
          .nav-logo {
            font-size: 16px;
          }
          .nav-logo img {
            height: 40px;
          }
        }
      `}</style>

      <nav className="navbar">
        <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={content.header.siteName || content.theme.brandName} />
          ) : null}
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

        <button type="button" className="nav-toggle" onClick={() => setMenuOpen(value => !value)} aria-label="Toggle navigation">
          {menuOpen ? '×' : '☰'}
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
