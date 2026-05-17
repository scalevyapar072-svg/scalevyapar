'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AnnouncementBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const hideOnWorkspacePages =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/labour/company' ||
    pathname.startsWith('/labour/company/')

  if (!visible || hideOnWorkspacePages) return null

  return (
    <>
      <style>{`
        .announce-bar {
          background: white;
          color: #374655;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 1px solid #e2e8f0;
        }
        .announce-text { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .announce-badge { background: #dc2626; color: white; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.05);} }
        .announce-link { background: #374655; color: white; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s; white-space: nowrap; }
        .announce-link:hover { background: #4a5a6a; transform: scale(1.05); }
        .announce-close { position: absolute; right: 16px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; transition: color 0.2s; }
        .announce-close:hover { color: #374655; }
        @media (max-width: 768px) {
          .announce-bar { padding: 10px 40px 10px 16px; font-size: 12px; }
          .announce-close { right: 10px; }
        }
      `}</style>

      <div className="announce-bar">
        <div className="announce-text">
          <span className="announce-badge">🔥 Limited Time Offer</span>
          <span style={{ color: '#374655', fontWeight: '600' }}>Get 30% OFF on all plans — Offer ends soon!</span>
          <Link href="/pricing" className="announce-link">Claim Offer →</Link>
        </div>
        <button className="announce-close" onClick={() => setVisible(false)}>✕</button>
      </div>
    </>
  )
}
