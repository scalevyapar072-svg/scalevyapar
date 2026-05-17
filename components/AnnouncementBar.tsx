'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MainWebsiteContent } from '@/lib/main-website-content'

export default function AnnouncementBar({ content }: { content: MainWebsiteContent }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const hideOnWorkspacePages =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/labour/company' ||
    pathname.startsWith('/labour/company/')

  if (!visible || hideOnWorkspacePages || !content.header.announcementText.trim()) return null

  return (
    <>
      <style>{`
        .announce-bar {
          background: white;
          color: ${content.theme.primaryColor};
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
        .announce-text {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .announce-badge {
          background: ${content.theme.accentColor};
          color: white;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .announce-link {
          background: ${content.theme.primaryColor};
          color: white;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }
        .announce-close {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        @media (max-width: 768px) {
          .announce-bar {
            padding: 10px 40px 10px 16px;
            font-size: 12px;
          }
          .announce-close {
            right: 10px;
          }
        }
      `}</style>

      <div className="announce-bar">
        <div className="announce-text">
          <span className="announce-badge">Update</span>
          <span style={{ color: content.theme.primaryColor, fontWeight: '600' }}>{content.header.announcementText}</span>
          {content.header.announcementButtonLabel && content.header.announcementButtonHref ? (
            <Link href={content.header.announcementButtonHref} className="announce-link">
              {content.header.announcementButtonLabel}
            </Link>
          ) : null}
        </div>
        <button className="announce-close" onClick={() => setVisible(false)}>X</button>
      </div>
    </>
  )
}
