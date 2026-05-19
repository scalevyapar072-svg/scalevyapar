'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { DEFAULT_ROZGAR_LOGO_SRC, normalizeWebsiteAssetPath } from '@/lib/labour-company-public-assets'
import styles from './company-site.module.css'
import { PublicAssetImage } from './public-asset-image'

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
  const logoSrc = normalizeWebsiteAssetPath(content.header.logoSrc, DEFAULT_ROZGAR_LOGO_SRC)
  const parsedLogoWidth = Number(content.header.logoWidth)
  const logoWidth = Number.isFinite(parsedLogoWidth) && parsedLogoWidth > 0 ? Math.round(parsedLogoWidth) : 220
  const brandTitle = content.header.logoTitle?.trim() || content.theme.brandName || 'ScaleVyapar Rozgar'
  const brandSlogan = content.header.logoSlogan?.trim() || content.theme.brandTagline || 'Find skilled workers and hire faster across India'
  const fallbackNavItems = [
    { label: 'Home', href: '/labour/company' },
    { label: 'About Us', href: '/labour/company/about' },
    { label: 'Pricing', href: '/labour/company/pricing' },
    { label: 'Search Worker', href: '/labour/company/search' },
    { label: 'Client Dashboard', href: '/labour/company/panel' },
    { label: 'Contact Us', href: '/labour/company/contact' }
  ]
  const navItems = (content.header.navItems.length ? content.header.navItems : fallbackNavItems)
    .filter(item => item?.label?.trim() && item?.href?.trim())
  const fallbackFooterLinkGroups = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', href: '/labour/company' },
        { label: 'About Us', href: '/labour/company/about' },
        { label: 'Pricing', href: '/labour/company/pricing' },
        { label: 'Search Worker', href: '/labour/company/search' },
        { label: 'Contact Us', href: '/labour/company/contact' }
      ]
    },
    {
      title: 'For Companies',
      links: [
        { label: 'Post a Job', href: jobPostHref },
        { label: 'Register Company', href: registrationHref },
        { label: 'Company Portal', href: dashboardHref },
        { label: 'Login', href: loginHref }
      ]
    },
    {
      title: 'For Workers',
      links: [
        { label: 'Find Jobs', href: searchHref },
        { label: 'Join as Worker', href: workerJoinHref },
        { label: 'Browse Categories', href: searchHref }
      ]
    }
  ]
  const footerLinkGroups = (content.footer.linkGroups.length ? content.footer.linkGroups : fallbackFooterLinkGroups)
    .filter(group => group?.title?.trim() && Array.isArray(group.links) && group.links.some(link => link?.label?.trim() && link?.href?.trim()))
  const accountHref = isLoggedIn ? dashboardHref : loginHref
  const accountLabel = isLoggedIn ? 'Logged In' : 'Login'

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
                  <PublicAssetImage
                    src={logoSrc}
                    fallbackSrc={DEFAULT_ROZGAR_LOGO_SRC}
                    alt={brandTitle}
                    className={styles.homeLandingBrandLogo}
                    widthPx={logoWidth}
                    maxWidthCss="calc(100vw - 32px)"
                  />
                </span>
                <span className={styles.homeLandingBrandText}>
                  <strong className={styles.homeLandingBrandName}>{brandTitle}</strong>
                  <span className={styles.homeLandingBrandTagline}>{brandSlogan}</span>
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
                  <span className={styles.homeFooterLogoWrap} aria-hidden="true">
                    <PublicAssetImage
                      src={logoSrc}
                      fallbackSrc={DEFAULT_ROZGAR_LOGO_SRC}
                      alt={brandTitle}
                      className={styles.homeFooterLogo}
                      widthPx={logoWidth}
                      maxWidthCss="100%"
                    />
                  </span>
                  <div className={styles.homeFooterBrandText}>
                    <strong className={styles.homeFooterBrandName}>{brandTitle}</strong>
                    <span className={styles.homeFooterBrandTagline}>{brandSlogan}</span>
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

              {footerLinkGroups.map(group => (
                <div key={group.title}>
                  <h4 className={styles.homeFooterTitle}>{group.title}</h4>
                  <div className={styles.homeFooterLinks}>
                    {group.links
                      .filter(link => link?.label?.trim() && link?.href?.trim())
                      .map(link => (
                        <Link key={`${group.title}-${link.label}-${link.href}`} href={link.href}>
                          {link.label}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}

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
