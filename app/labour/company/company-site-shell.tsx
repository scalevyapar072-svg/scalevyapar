'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import styles from './company-site.module.css'

type Props = {
  content: LabourCompanyWebsiteContent
  currentPath: string
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

const socialLabels = ['LinkedIn', 'Instagram', 'Facebook', 'YouTube']
const COMPANY_TOKEN_KEY = 'labour_company_token'

function SocialMark({ label }: { label: string }) {
  const initials = label === 'LinkedIn' ? 'in' : label.charAt(0)
  return <span className={styles.homeSocialMark}>{initials}</span>
}

export function CompanySiteShell({
  content,
  currentPath,
  children,
  showHeader = true,
  showFooter = true
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const jobPostHref = '/labour/company/job-post'
  const registrationHref = '/labour/company/company-registration'
  const loginHref = '/labour/company/signin'
  const dashboardHref = '/labour/company/panel'
  const searchHref = '/labour/company/search'
  const workerJoinHref = '/login'
  const navItems = content.header.navItems
  const accountHref = isLoggedIn ? dashboardHref : loginHref
  const accountLabel = isLoggedIn ? 'Logged In' : 'Login'
  const logoSrc = content.header.logoSrc || '/images/rozgar/rozgar-logo.png'
  const logoWidth = (() => {
    const parsed = Number.parseInt(content.header.logoWidth || '260', 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 260
  })()

  useEffect(() => {
    const syncAuthState = () => {
      const hasToken = Boolean(
        window.localStorage.getItem(COMPANY_TOKEN_KEY) ||
        window.sessionStorage.getItem(COMPANY_TOKEN_KEY)
      )
      setIsLoggedIn(hasToken)
    }

    syncAuthState()
    window.addEventListener('storage', syncAuthState)
    window.addEventListener('labour-company-auth-change', syncAuthState)
    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('labour-company-auth-change', syncAuthState)
    }
  }, [])

  const isActiveLink = (href: string) => {
    if (href === '/labour/company') {
      return currentPath === href
    }
    return currentPath === href || currentPath.startsWith(`${href}/`)
  }

  return (
    <div className={styles.homeLandingPage}>
      <div className={styles.homeLandingBackdrop} />
      <div className={styles.container}>
        {showHeader ? (
          <header className={styles.homeLandingHeader}>
            <div className={styles.homeLandingHeaderRow}>
              <Link href="/labour/company" className={styles.homeLandingBrand}>
                <span className={styles.homeLandingBrandLogoWrap} aria-hidden="true">
                  <img
                    src={logoSrc}
                    alt={content.theme.brandName || 'ScaleVyapar Rozgar'}
                    className={styles.rozgarLogo3d}
                    style={{
                      width: `${logoWidth}px`,
                      maxWidth: `min(${logoWidth}px, calc(100vw - 32px))`,
                      height: 'auto'
                    }}
                  />
                </span>
                <span className={styles.homeLandingBrandText}>
                  <span className={styles.homeLandingBrandName}>{content.theme.brandName || 'ScaleVyapar Rozgar'}</span>
                  <span className={styles.homeLandingBrandTagline}>
                    {content.theme.brandTagline || 'Find skilled workers and hire faster across India'}
                  </span>
                </span>
                <span className={styles.homeLandingBrandScreenReader}>
                  {content.theme.brandName || 'ScaleVyapar Rozgar'}
                </span>
              </Link>

              <nav className={styles.homeLandingDesktopNav}>
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.homeLandingNavLink} ${isActiveLink(item.href) ? styles.homeLandingNavLinkActive : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className={styles.homeLandingHeaderButtons}>
                <Link href={jobPostHref} className={styles.homeHeaderPrimaryButton}>
                  Post Requirement
                </Link>
                <Link href={registrationHref} className={styles.homeHeaderSecondaryButton}>
                  Register Company
                </Link>
                <Link href={accountHref} className={styles.homeHeaderGhostButton}>
                  {accountLabel}
                </Link>
              </div>

              <button
                type="button"
                className={styles.homeHeaderMenuButton}
                onClick={() => setMenuOpen(current => !current)}
                aria-expanded={menuOpen}
                aria-label="Toggle company menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>

            <div className={`${styles.homeLandingNavRow} ${menuOpen ? styles.homeLandingNavRowOpen : ''}`}>
              <div className={styles.homeLandingNav}>
                {navItems.map(item => (
                  <Link
                    key={`${item.href}-mobile`}
                    href={item.href}
                    className={`${styles.homeLandingNavLink} ${isActiveLink(item.href) ? styles.homeLandingNavLinkActive : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className={styles.homeLandingNavUtilities}>
                <Link href={searchHref} className={styles.homeHeaderDashboardButton}>
                  Find Workers
                </Link>
              </div>
            </div>
          </header>
        ) : null}

        <main className={styles.homeLandingMain}>{children}</main>

        {showFooter ? (
          <footer className={styles.homeFooter}>
            <div className={styles.homeFooterGrid}>
              <div className={styles.homeFooterBrandCol}>
                <div className={styles.homeFooterBrandRow}>
                  <span className={styles.homeLandingBrandMark}>SV</span>
                  <div>
                    <h3>{content.theme.brandName || 'ScaleVyapar'}</h3>
                    <p>{content.footer.description}</p>
                  </div>
                </div>
                <div className={styles.homeFooterSocials}>
                  {socialLabels.map(label => (
                    <span key={label} className={styles.homeFooterSocial}>
                      <SocialMark label={label} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={styles.homeFooterTitle}>Quick Links</h4>
                <div className={styles.homeFooterLinks}>
                  <Link href="/labour/company">Home</Link>
                  <Link href="/labour/company/about">About Us</Link>
                  <Link href="/labour/company/pricing">Pricing</Link>
                  <Link href="/labour/company/search">Search Worker</Link>
                  <Link href="/labour/company/contact">Contact Us</Link>
                </div>
              </div>

              <div>
                <h4 className={styles.homeFooterTitle}>For Companies</h4>
                <div className={styles.homeFooterLinks}>
                  <Link href={jobPostHref}>Post a Job</Link>
                  <Link href={registrationHref}>Register Company</Link>
                  <Link href={dashboardHref}>Company Portal</Link>
                  <Link href={loginHref}>Login</Link>
                </div>
              </div>

              <div>
                <h4 className={styles.homeFooterTitle}>For Workers</h4>
                <div className={styles.homeFooterLinks}>
                  <Link href={searchHref}>Find Jobs</Link>
                  <Link href={workerJoinHref}>Join as Worker</Link>
                  <Link href={searchHref}>Browse Categories</Link>
                </div>
              </div>

              <div>
                <h4 className={styles.homeFooterTitle}>Legal</h4>
                <div className={styles.homeFooterLinks}>
                  {content.footer.legalLinks.map(link => (
                    <Link key={`${link.label}-${link.href}`} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className={styles.homeFooterContact}>
                  <span>Email: {content.footer.supportEmail}</span>
                  <span>Phone: {content.footer.phone}</span>
                  <span>Office: {content.footer.address}</span>
                </div>
              </div>
            </div>

            <div className={styles.homeFooterBottom}>
              <span>{content.footer.copyrightText}</span>
              <span>Made with care in India for a stronger workforce.</span>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
