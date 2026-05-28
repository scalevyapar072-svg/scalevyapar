'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import styles from './company-site.module.css'
import { RozgarMobileTabBar } from './rozgar-mobile-tabbar'

type Props = {
  content: LabourCompanyWebsiteContent
  currentPath: string
  children: ReactNode
  isAdmin?: boolean
}

const siteNavigation = [
  { label: 'Home', href: '/labour/company' },
  { label: 'About', href: '/labour/company#about' },
  { label: 'Industries', href: '/labour/company#industries' },
  { label: 'How It Works', href: '/labour/company#how-it-works' },
  { label: 'Employers', href: '/labour/company#company-intake' },
  { label: 'Workers', href: '/labour/company/search' },
  { label: 'Contact', href: '/labour/company/contact' }
]

const topActions = [
  { label: 'Contact', href: '/labour/company/contact', tone: 'ghost' as const },
  { label: 'Login', href: '/labour/company/signin', tone: 'secondary' as const },
  { label: 'Register Company', href: '/labour/company#company-intake', tone: 'primary' as const }
]

const socialBadges = ['in', 'IG', 'f', 'YT']

const isNavActive = (currentPath: string, href: string) => {
  const [pathname] = href.split('#')
  if (href === '/labour/company') {
    return currentPath === '/labour/company'
  }

  return currentPath === pathname
}

export function CompanySiteShell({ content, currentPath, children, isAdmin }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [currentPath])

  useEffect(() => {
    if (!isMobileMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onResize = () => {
      if (window.matchMedia('(min-width: 769px)').matches) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('resize', onResize)
    }
  }, [isMobileMenuOpen])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      <style jsx global>{`
        @media (max-width: 768px) {
          .headerActions {
            display: none !important;
          }
          .desktopNav {
            display: none !important;
          }
        }
      `}</style>
      <div className={styles.page}>
        <div className={styles.pageGlow} />
        <div className={styles.container}>
        <div className={styles.announcementBar}>
          <span>Daily worker hiring for factories, workshops, contractors and growing businesses</span>
        </div>

        <header className={styles.headerPanel}>
          <div className={styles.siteHeader}>
            <Link href="/labour/company" className={styles.brandWrap}>
              <span
                className={styles.brandBadge}
                style={{
                  background: `linear-gradient(145deg, ${content.theme.highlightColor}, ${content.theme.accentColor})`
                }}
              >
                <span className={styles.brandBadgeDepth} />
                <span className={styles.brandBadgeFace}>
                  <span className={styles.brandBadgeWordmark}>RZ</span>
                  <span className={styles.brandBadgeArrow}>↗</span>
                </span>
              </span>
              <span>
                <p className={styles.brandName}>
                  <span className={styles.brandNameBase}>ScaleVyapar</span>{' '}
                  <span className={styles.brandNameAccent}>Rozgar</span>
                </p>
                <p className={styles.brandTagline}>{content.theme.brandTagline}</p>
              </span>
            </Link>

            <nav className={styles.desktopNav}>
              {siteNavigation.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isNavActive(currentPath, item.href) ? styles.navLinkActive : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className={styles.headerActions}>
              {isAdmin && (
                <Link href="/admin/labour/website" className={styles.secondaryButton}>
                  Website Editor
                </Link>
              )}
              {topActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.tone === 'primary'
                      ? styles.primaryButton
                      : action.tone === 'secondary'
                        ? styles.secondaryButton
                        : styles.ghostButton
                  }
                  style={
                    action.tone === 'primary'
                      ? {
                          background: `linear-gradient(135deg, ${content.theme.highlightColor}, ${content.theme.accentColor})`,
                          color: '#ffffff',
                          border: '1px solid transparent'
                        }
                      : undefined
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>

            <div className={styles.mobileMenu}>
              <button
                type="button"
                className={styles.mobileMenuButton}
                aria-label="Open navigation"
                aria-expanded={isMobileMenuOpen}
                aria-controls="rozgar-mobile-drawer"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </header>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerTitle}>ScaleVyapar Rozgar</p>
              <p className={styles.textMuted}>
                Premium labour hiring platform for companies that need faster daily-basis workforce discovery,
                activation, and workforce coordination across industries.
              </p>
            </div>

            <div>
              <p className={styles.footerTitle}>Company</p>
              <div className={styles.footerLinks}>
                <Link href="/labour/company#about" className={styles.footerLink}>About ScaleVyapar Rozgar</Link>
                <Link href="/labour/company#how-it-works" className={styles.footerLink}>Mission</Link>
                <Link href="/labour/company" className={styles.footerLink}>Platform Overview</Link>
              </div>
            </div>

            <div>
              <p className={styles.footerTitle}>Quick Links</p>
              <div className={styles.footerLinks}>
                <Link href="/labour/company" className={styles.footerLink}>Home</Link>
                <Link href="/labour/company/search" className={styles.footerLink}>Workers</Link>
                <Link href="/labour/company#company-intake" className={styles.footerLink}>Employers</Link>
                <Link href="/labour/company#industries" className={styles.footerLink}>Industries</Link>
                <Link href="/labour/company/contact" className={styles.footerLink}>Contact</Link>
              </div>
            </div>

            <div>
              <p className={styles.footerTitle}>Legal</p>
              <div className={styles.footerLinks}>
                <Link href="/labour/company/privacy-policy" className={styles.footerLink}>Privacy Policy</Link>
                <Link href="/labour/company/terms-of-service" className={styles.footerLink}>Terms & Conditions</Link>
                <Link href="/labour/company/user-data-deletion" className={styles.footerLink}>Refund Policy</Link>
              </div>
            </div>

            <div>
              <p className={styles.footerTitle}>Business Contact</p>
              <div className={styles.footerLinks}>
                <span className={styles.footerLink}>Email: {content.footer.supportEmail}</span>
                <span className={styles.footerLink}>Phone: {content.footer.phone}</span>
                <span className={styles.footerLink}>Office: {content.footer.address}</span>
              </div>
              <div className={styles.socialRow}>
                {socialBadges.map(item => (
                  <span key={item} className={styles.socialBadge}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.divider} />
          <div className={styles.legalLinks}>
            {content.footer.legalLinks.map(link => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className={styles.footerLink}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.divider} />
          <p className={styles.textMuted}>{content.footer.copyrightText}</p>
        </footer>
      </div>
      {isMobileMenuOpen && (
        <>
          <div
            className={styles.mobileDrawerBackdrop}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <aside
            id="rozgar-mobile-drawer"
            className={styles.mobileDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className={styles.mobileDrawerHeader}>
              <span className={styles.mobileDrawerTitle}>Menu</span>
              <button
                type="button"
                className={styles.mobileDrawerClose}
                aria-label="Close navigation"
                onClick={closeMobileMenu}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <nav className={styles.mobileDrawerNav} aria-label="Site navigation">
              {siteNavigation.map(item => {
                const active = isNavActive(currentPath, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.mobileDrawerLink} ${active ? styles.mobileDrawerLinkActive : ''}`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin/labour/website"
                  className={styles.mobileDrawerLink}
                  onClick={closeMobileMenu}
                >
                  Website Editor
                </Link>
              )}
            </nav>
          </aside>
        </>
      )}
      <RozgarMobileTabBar />
    </div>
  )
}
