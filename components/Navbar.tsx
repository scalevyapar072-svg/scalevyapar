'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
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
            <img src="/logo.png" alt="ScaleVyapar" />
          </Link>
        </div>

        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/tools" className="nav-link">Tools</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
          <Link href="https://www.scalevyapar.in/login" className="nav-cta" target="_blank">
            Login →
          </Link>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link href="/" className="mobile-link" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
        <Link href="/tools" className="mobile-link" onClick={() => setMenuOpen(false)}>🛠️ Tools</Link>
        <Link href="/pricing" className="mobile-link" onClick={() => setMenuOpen(false)}>💰 Pricing</Link>
        <Link href="/about" className="mobile-link" onClick={() => setMenuOpen(false)}>📖 About</Link>
        <Link href="/contact" className="mobile-link" onClick={() => setMenuOpen(false)}>📞 Contact</Link>
        <Link href="https://scalevyapar.vercel.app/login" className="mobile-link" onClick={() => setMenuOpen(false)} target="_blank">🔐 Login</Link>
      </div>
    </>
  )
}