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
const COMPANY_PROFILE_KEY = 'labour_company_profile'

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
  const [loggedInCompanyName, setLoggedInCompanyName] = useState<string | null>(null)
  const jobPostHref = '/labour/company/job-post'
  const registrationHref = '/labour/company/company-registration'
  const loginHref = '/labour/company/signin'
  const dashboardHref = '/labour/company/panel'
  const searchHref = '/labour/company/search'
  const workerJoinHref = '/login'
  const navItems = [
    { label: 'Home', href: '/labour/company' },
    { label: 'About Us', href: '/labour/company/about' },
    { label: 'Pricing', href: '/labour/company/pricing' },
    { label: 'Search Worker', href: '/labour/company/search' },
    { label: 'Client Dashboard', href: '/labour/company/panel' },
    { label: 'Contact Us', href: '/labour/company/contact' }
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    let active = true

    const syncCompanyProfile = () => {
      try {
        const rawProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
        if (!rawProfile) {
          if (active) setLoggedInCompanyName(null)
          return
        }

        const parsed = JSON.parse(rawProfile) as {
          companyName?: string
          contactPerson?: string
        }

        const label = parsed.companyName?.trim() || parsed.contactPerson?.trim() || null
        if (active) {
          setLoggedInCompanyName(label)
        }
      } catch {
        if (active) {
          setLoggedInCompanyName(null)
        }
      }
    }

    const hydrateFromDashboardSession = async () => {
      try {
        const storedToken = window.localStorage.getItem(COMPANY_TOKEN_KEY)
        const storedProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
        if (storedToken && storedProfile) {
          syncCompanyProfile()
          return
        }

        const response = await fetch('/api/labour/company/auth/dashboard-session', { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        const profile = data?.dashboard?.profile
        const token = data?.token
        if (!profile) return

        window.localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile))
        if (token) {
          window.localStorage.setItem(COMPANY_TOKEN_KEY, String(token))
        }

        syncCompanyProfile()
      } catch {
        // Keep header in logged-out state if no session exists.
      }
    }

    const handleAuthChange = () => {
      syncCompanyProfile()
    }

    syncCompanyProfile()
    hydrateFromDashboardSession()
    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('focus', handleAuthChange)
    window.addEventListener('labour-company-auth-change', handleAuthChange as EventListener)

    return () => {
      active = false
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('focus', handleAuthChange)
      window.removeEventListener('labour-company-auth-change', handleAuthChange as EventListener)
    }
  }, [])

  return (
    <div className={styles.homeLandingPage}>
      <div className={styles.homeLandingBackdrop} />
      <div className={styles.container}>
        {showHeader ? (
          <header className={styles.homeLandingHeader}>
            <div className={styles.homeLandingHeaderRow}>
              <Link href="/labour/company" className={styles.homeLandingBrand}>
                <span className={styles.homeLandingBrandMark}>SV</span>
                <span className={styles.homeLandingBrandText}>
                  <span className={styles.homeLandingBrandName}>{content.theme.brandName || 'ScaleVyapar'}</span>
                  <span className={styles.homeLandingBrandTagline}>
                    {content.theme.brandTagline || 'Find skilled workers and hire faster across India'}
                  </span>
                </span>
              </Link>

              <nav className={styles.homeLandingDesktopNav}>
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.homeLandingNavLink} ${currentPath === item.href || (item.href !== '/labour/company' && currentPath.startsWith(item.href)) ? styles.homeLandingNavLinkActive : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className={styles.homeLandingHeaderButtons}>
                <Link href={jobPostHref} className={styles.homeHeaderPrimaryButton}>
                  Post Job
                </Link>
                <Link href={registrationHref} className={styles.homeHeaderSecondaryButton}>
                  Register Company
                </Link>
                <Link
                  href={loggedInCompanyName ? dashboardHref : loginHref}
                  className={loggedInCompanyName ? styles.homeHeaderAccountButton : styles.homeHeaderGhostButton}
                >
                  {loggedInCompanyName ? 'Logged In' : 'Login'}
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
                    className={`${styles.homeLandingNavLink} ${currentPath === item.href || (item.href !== '/labour/company' && currentPath.startsWith(item.href)) ? styles.homeLandingNavLinkActive : ''}`}
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
