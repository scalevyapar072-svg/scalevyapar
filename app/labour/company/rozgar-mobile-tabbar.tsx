'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  label: string
  href: string
  icon: string
  match: (pathname: string) => boolean
}

const tabs: Tab[] = [
  {
    label: 'Home',
    href: '/labour/company',
    icon: '🏠',
    match: (p) => p === '/labour/company'
  },
  {
    label: 'Find Workers',
    href: '/labour/company/search',
    icon: '🔍',
    match: (p) => p.startsWith('/labour/company/search')
  },
  {
    label: 'Post Job',
    href: '/labour/company/panel',
    icon: '➕',
    match: (p) => p.startsWith('/labour/company/panel')
  },
  {
    label: 'Register Company',
    href: '/labour/company#company-intake',
    icon: '🏢',
    match: () => false
  },
  {
    label: 'Contact',
    href: '/labour/company/contact',
    icon: '📞',
    match: (p) => p.startsWith('/labour/company/contact')
  }
]

export function RozgarMobileTabBar() {
  const pathname = usePathname() || '/labour/company'

  return (
    <>
      <style>{`
        .rozgar-tabbar-spacer {
          display: none;
        }
        .rozgar-tabbar {
          display: none;
        }
        @media (max-width: 768px) {
          .rozgar-tabbar-spacer {
            display: block;
            height: calc(72px + env(safe-area-inset-bottom, 0px));
            width: 100%;
          }
          .rozgar-tabbar {
            display: grid;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 998;
            grid-template-columns: repeat(5, 1fr);
            padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-top: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: 0 -10px 28px rgba(15, 23, 42, 0.08);
          }
          .rozgar-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            min-height: 60px;
            padding: 6px 4px;
            border-radius: 14px;
            color: #64748b;
            text-decoration: none;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.01em;
            text-align: center;
            line-height: 1.1;
            transition: color 0.18s ease, background 0.18s ease, transform 0.12s ease;
            -webkit-tap-highlight-color: transparent;
          }
          .rozgar-tab:active {
            transform: scale(0.96);
            background: rgba(37, 99, 235, 0.06);
          }
          .rozgar-tab-icon {
            font-size: 20px;
            line-height: 1;
          }
          .rozgar-tab-label {
            font-size: 10px;
            line-height: 1.18;
            max-width: 100%;
            word-break: break-word;
            hyphens: auto;
          }
          .rozgar-tab-active {
            color: #1d4ed8;
            background: linear-gradient(180deg, rgba(239, 246, 255, 0.95), rgba(219, 234, 254, 0.7));
            box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.45);
          }
          .rozgar-tab-cta {
            color: #ffffff;
          }
          .rozgar-tab-cta .rozgar-tab-cta-bubble {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: -18px;
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
          }
          .rozgar-tab-cta .rozgar-tab-label {
            color: #1d4ed8;
            font-weight: 700;
          }
        }
      `}</style>

      <div className="rozgar-tabbar-spacer" aria-hidden="true" />

      <nav className="rozgar-tabbar" aria-label="Rozgar mobile navigation">
        {tabs.map((tab, index) => {
          const isCta = index === 2
          const isActive = tab.match(pathname)
          const className = [
            'rozgar-tab',
            isCta ? 'rozgar-tab-cta' : '',
            isActive ? 'rozgar-tab-active' : ''
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <Link key={tab.href + tab.label} href={tab.href} className={className} prefetch={false}>
              {isCta ? (
                <span className="rozgar-tab-cta-bubble" aria-hidden="true">
                  {tab.icon}
                </span>
              ) : (
                <span className="rozgar-tab-icon" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              <span className="rozgar-tab-label">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
