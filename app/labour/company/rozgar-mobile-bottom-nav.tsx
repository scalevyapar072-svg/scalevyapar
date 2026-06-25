'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Building2, Headset, Home, Search } from 'lucide-react'
import { normalizeRozgarCurrentPath, toRozgarPublicPath } from '@/lib/labour-company-host'
import styles from './company-site.module.css'

const navItems = [
  {
    label: 'Home',
    href: '/labour/company',
    Icon: Home,
    isActive: (pathname: string) =>
      pathname === '/' ||
      pathname === '/labour/company' ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/delete-account') ||
      pathname.startsWith('/privacy-policy') ||
      pathname.startsWith('/terms-of-service') ||
      pathname.startsWith('/user-data-deletion') ||
      pathname.startsWith('/labour/company/about') ||
      pathname.startsWith('/labour/company/delete-account') ||
      pathname.startsWith('/labour/company/privacy-policy') ||
      pathname.startsWith('/labour/company/terms-of-service') ||
      pathname.startsWith('/labour/company/user-data-deletion')
  },
  {
    label: 'Find Workers',
    href: '/labour/company/search',
    Icon: Search,
    isActive: (pathname: string) => pathname.startsWith('/search') || pathname.startsWith('/labour/company/search')
  },
  {
    label: 'Post Job',
    href: '/labour/company/job-post',
    Icon: BriefcaseBusiness,
    isActive: (pathname: string) =>
      pathname.startsWith('/job-post') ||
      pathname.startsWith('/post-requirement') ||
      pathname.startsWith('/labour/company/job-post') ||
      pathname.startsWith('/labour/company/post-requirement')
  },
  {
    label: 'Register Company',
    href: '/labour/company/company-registration',
    Icon: Building2,
    isActive: (pathname: string) =>
      pathname.startsWith('/company-registration') || pathname.startsWith('/labour/company/company-registration')
  },
  {
    label: 'Contact',
    href: '/labour/company/contact',
    Icon: Headset,
    isActive: (pathname: string) => pathname.startsWith('/contact') || pathname.startsWith('/labour/company/contact')
  }
]

export function RozgarMobileBottomNav() {
  const pathname = usePathname()
  const [hostname, setHostname] = useState<string | null>(null)

  useEffect(() => {
    setHostname(window.location.hostname)
  }, [])

  const resolvedPathname = normalizeRozgarCurrentPath(pathname || '', hostname)

  if (!resolvedPathname || (!resolvedPathname.startsWith('/labour/company') && resolvedPathname !== '/' && !resolvedPathname.startsWith('/about') && !resolvedPathname.startsWith('/pricing') && !resolvedPathname.startsWith('/contact') && !resolvedPathname.startsWith('/signin') && !resolvedPathname.startsWith('/company-registration') && !resolvedPathname.startsWith('/delete-account') && !resolvedPathname.startsWith('/privacy-policy') && !resolvedPathname.startsWith('/terms-of-service') && !resolvedPathname.startsWith('/user-data-deletion') && !resolvedPathname.startsWith('/job-post') && !resolvedPathname.startsWith('/search') && !resolvedPathname.startsWith('/panel'))) {
    return null
  }

  return (
    <nav className={styles.rozgarMobileBottomNav} aria-label="Rozgar mobile navigation">
      <div className={styles.rozgarMobileBottomNavGrid}>
        {navItems.map(({ label, href, Icon, isActive }) => {
          const publicHref = toRozgarPublicPath(href, hostname)
          const active = isActive(resolvedPathname)
          return (
            <Link
              key={publicHref}
              href={publicHref}
              className={`${styles.rozgarMobileBottomNavItem} ${active ? styles.rozgarMobileBottomNavItemActive : ''}`}
            >
              <Icon size={18} strokeWidth={2.1} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
