'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { normalizeRozgarCurrentPath, toRozgarPublicPath } from '@/lib/labour-company-host'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { DEFAULT_ROZGAR_LOGO_SRC, normalizeWebsiteAssetPath } from '@/lib/labour-company-public-assets'
import styles from './company-site.module.css'
import { PublicAssetImage } from './public-asset-image'
import { attachRozgarMotion } from './rozgar-motion'

type Props = {
  content: LabourCompanyWebsiteContent
  currentPath: string
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
  initialHostname?: string | null
}

const socialLabels = ['LinkedIn', 'Instagram', 'Facebook', 'YouTube']
const COMPANY_TOKEN_KEY = 'labour_company_token'
type FooterLinkGroup = LabourCompanyWebsiteContent['footer']['linkGroups'][number]

function sanitizeRozgarFooterGroups(groups: FooterLinkGroup[]) {
  return groups
    .map(group => ({
      ...group,
      links: group.links.filter(link => {
        const label = link.label.trim().toLowerCase()
        const href = link.href.trim().toLowerCase()
        return label !== 'tools' && label !== 'chat' && href !== '/tools'
      })
    }))
    .filter(group => group?.title?.trim() && group.links.some(link => link?.label?.trim() && link?.href?.trim()))
}

function SocialMark({ label }: { label: string }) {
  const initials = label === 'LinkedIn' ? 'in' : label.charAt(0)
  return <span className={styles.homeSocialMark}>{initials}</span>
}

function useMobileMenuScrollLock(menuOpen: boolean) {
  useEffect(() => {
    if (!menuOpen || typeof window === 'undefined') return

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (!isMobile) return

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'contain'
    document.body.dataset.rozgarMenuOpen = 'true'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
      delete document.body.dataset.rozgarMenuOpen
    }
  }, [menuOpen])
}

export function CompanySiteShell({
  content,
  currentPath,
  children,
  showHeader = true,
  showFooter = true,
  initialHostname = null
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hostname, setHostname] = useState<string | null>(initialHostname)
  const jobPostHref = '/labour/company/job-post'
  const registrationHref = '/labour/company/company-registration'
  const loginHref = '/labour/company/signin'
  const dashboardHref = '/labour/company/panel'
  const searchHref = '/labour/company/search'
  const logoSrc = normalizeWebsiteAssetPath(content.header.logoSrc, DEFAULT_ROZGAR_LOGO_SRC)
  const parsedLogoWidth = Number(content.header.logoWidth)
  const logoWidth = Number.isFinite(parsedLogoWidth) && parsedLogoWidth > 0 ? Math.round(parsedLogoWidth) : 220
  const brandTitle = content.header.logoTitle?.trim() || content.theme.brandName || 'ScaleVyapar Rozgar'
  const brandSlogan = content.header.logoSlogan?.trim() || 'Hire Faster across India'
  const announcementText = content.header.announcement?.trim()
  const primaryCtaLabel = content.header.primaryCtaLabel?.trim() || 'Post Requirement'
  const primaryCtaHref = content.header.primaryCtaHref?.trim() || jobPostHref
  const searchCtaLabel = content.home.hero.secondaryCtaLabel?.trim() || 'Find Workers'
  const themeStyle = {
    '--rozgar-accent-color': content.theme.accentColor || '#0f172a',
    '--rozgar-accent-soft': content.theme.accentSoft || '#e0ecff',
    '--rozgar-highlight-color': content.theme.highlightColor || '#2563eb'
  } as CSSProperties
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
      title: 'Rozgar',
      links: [
        { label: 'Home', href: '/labour/company' },
        { label: 'Find Workers', href: searchHref },
        { label: 'Post Job', href: jobPostHref },
        { label: 'Register Company', href: registrationHref },
        { label: 'Pricing', href: '/labour/company/pricing' },
        { label: 'Contact', href: '/labour/company/contact' }
      ]
    },
    {
      title: 'For Companies',
      links: [
        { label: 'Company Portal', href: dashboardHref },
        { label: 'Sign In', href: loginHref }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/labour/company/privacy-policy' },
        { label: 'Terms of Service', href: '/labour/company/terms-of-service' }
      ]
    }
  ] satisfies FooterLinkGroup[]
  const footerLinkGroups = sanitizeRozgarFooterGroups(content.footer.linkGroups.length ? content.footer.linkGroups : fallbackFooterLinkGroups)
  const resolveHref = (href: string) => toRozgarPublicPath(href, hostname)
  const resolvedCurrentPath = normalizeRozgarCurrentPath(pathname || currentPath, hostname)
  const accountHref = resolveHref(isLoggedIn ? dashboardHref : loginHref)
  const accountLabel = isLoggedIn ? 'Logged in' : 'Login'
  const isRozgarSearchRoute = resolvedCurrentPath === resolveHref(searchHref)
  const mobileNavItems = [
    { label: 'Home', href: '/labour/company' },
    { label: 'Find Workers', href: searchHref },
    { label: 'Post Job', href: jobPostHref },
    { label: 'Register Company', href: registrationHref },
    { label: accountLabel, href: isLoggedIn ? dashboardHref : loginHref },
    { label: 'Contact', href: '/labour/company/contact' }
  ]

  useMobileMenuScrollLock(menuOpen)

  useEffect(() => {
    const routesToPrefetch = [
      '/labour/company',
      searchHref,
      jobPostHref,
      registrationHref,
      loginHref,
      dashboardHref,
      '/labour/company/contact'
    ]

    Array.from(new Set(routesToPrefetch.map(resolveHref))).forEach(route => {
      router.prefetch(route)
    })
  }, [dashboardHref, hostname, jobPostHref, loginHref, registrationHref, router, searchHref])

  useEffect(() => {
    const syncAuthState = () => {
      const hasToken = Boolean(
        window.localStorage.getItem(COMPANY_TOKEN_KEY) ||
        window.sessionStorage.getItem(COMPANY_TOKEN_KEY)
      )
      setIsLoggedIn(hasToken)
    }

    setHostname(window.location.hostname)
    syncAuthState()
    window.addEventListener('storage', syncAuthState)
    window.addEventListener('labour-company-auth-change', syncAuthState)
    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('labour-company-auth-change', syncAuthState)
    }
  }, [])

  useEffect(() => {
    if (!shellRef.current) return
    if (window.matchMedia('(max-width: 1024px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    return attachRozgarMotion(shellRef.current, styles)
  }, [])

  const isActiveLink = (href: string) => {
    const resolvedHref = resolveHref(href)
    if (resolvedHref === '/') {
      return resolvedCurrentPath === '/'
    }
    return resolvedCurrentPath === resolvedHref || resolvedCurrentPath.startsWith(`${resolvedHref}/`)
  }

  const isFooterActiveLink = (href: string) => {
    const resolvedHref = resolveHref(href)
    if (href === '/labour/company') {
      return resolvedCurrentPath === resolvedHref || resolvedCurrentPath === '/'
    }
    return resolvedCurrentPath === resolvedHref || resolvedCurrentPath.startsWith(`${resolvedHref}/`)
  }

  return (
    <div ref={shellRef} className={styles.homeLandingPage} style={themeStyle}>
      <div className={styles.homeLandingBackdrop} />
      <div className={styles.container}>
        {showHeader ? (
          <header className={styles.homeLandingHeader}>
            {announcementText ? (
              <div className={styles.homeAnnouncementBar}>
                <p className={styles.homeAnnouncementText}>{announcementText}</p>
              </div>
            ) : null}
            <div className={styles.homeLandingHeaderRow}>
              <Link href={resolveHref('/labour/company')} className={styles.homeLandingBrand}>
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
                    href={resolveHref(item.href)}
                    className={`${styles.homeLandingNavLink} ${isActiveLink(item.href) ? styles.homeLandingNavLinkActive : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className={styles.homeLandingHeaderButtons}>
                <Link href={resolveHref(primaryCtaHref)} className={styles.homeHeaderPrimaryButton}>
                  {primaryCtaLabel}
                </Link>
                <Link href={resolveHref(registrationHref)} className={styles.homeHeaderSecondaryButton}>
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
                {mobileNavItems.map(item => (
                  <Link
                    key={`${item.href}-mobile`}
                    href={resolveHref(item.href)}
                    className={`${styles.homeLandingNavLink} ${isActiveLink(item.href) ? styles.homeLandingNavLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className={styles.homeLandingNavUtilities}>
                <Link href={resolveHref(searchHref)} className={styles.homeHeaderDashboardButton} onClick={() => setMenuOpen(false)}>
                  {searchCtaLabel}
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
                    loading="lazy"
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

              <nav className={styles.homeFooterMobileNav} aria-label="Rozgar quick links">
                <Link href={resolveHref('/labour/company')} className={isFooterActiveLink('/labour/company') ? styles.homeFooterMobileNavActive : ''}>Home</Link>
                <Link href={resolveHref(searchHref)} className={isFooterActiveLink(searchHref) ? styles.homeFooterMobileNavActive : ''}>Find Workers</Link>
                <Link href={resolveHref(jobPostHref)} className={isFooterActiveLink(jobPostHref) ? styles.homeFooterMobileNavActive : ''}>Post Job</Link>
                <Link href={resolveHref(registrationHref)} className={isFooterActiveLink(registrationHref) ? styles.homeFooterMobileNavActive : ''}>Register Company</Link>
                <Link href={resolveHref('/labour/company/contact')} className={isFooterActiveLink('/labour/company/contact') ? styles.homeFooterMobileNavActive : ''}>Contact</Link>
              </nav>

              {footerLinkGroups.map(group => (
                <div key={group.title}>
                  <h4 className={styles.homeFooterTitle}>{group.title}</h4>
                  <div className={styles.homeFooterLinks}>
                    {group.links
                      .filter(link => link?.label?.trim() && link?.href?.trim())
                      .map(link => (
                        <Link key={`${group.title}-${link.label}-${link.href}`} href={resolveHref(link.href)}>
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
                    <Link key={`${link.label}-${link.href}`} href={resolveHref(link.href)}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className={styles.homeFooterContact}>
                  <span>Email: {content.footer.supportEmail}</span>
                  {!isRozgarSearchRoute ? <span>Phone: {content.footer.phone}</span> : null}
                  {!isRozgarSearchRoute ? <span>Office: {content.footer.address}</span> : null}
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
