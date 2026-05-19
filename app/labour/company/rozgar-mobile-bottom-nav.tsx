'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BriefcaseBusiness, Home, LayoutDashboard, Search } from 'lucide-react'
import styles from './company-site.module.css'

const navItems = [
  {
    label: 'Home',
    href: '/labour/company',
    Icon: Home,
    isActive: (pathname: string) =>
      pathname === '/labour/company' ||
      pathname.startsWith('/labour/company/about') ||
      pathname.startsWith('/labour/company/pricing') ||
      pathname.startsWith('/labour/company/contact') ||
      pathname.startsWith('/labour/company/signin') ||
      pathname.startsWith('/labour/company/company-registration') ||
      pathname.startsWith('/labour/company/privacy-policy') ||
      pathname.startsWith('/labour/company/terms-of-service') ||
      pathname.startsWith('/labour/company/user-data-deletion')
  },
  {
    label: 'Post Requirement',
    href: '/labour/company/job-post',
    Icon: BriefcaseBusiness,
    isActive: (pathname: string) =>
      pathname.startsWith('/labour/company/job-post') || pathname.startsWith('/labour/company/post-requirement')
  },
  {
    label: 'Find Worker',
    href: '/labour/company/search',
    Icon: Search,
    isActive: (pathname: string) => pathname.startsWith('/labour/company/search')
  },
  {
    label: 'Client Dashboard',
    href: '/labour/company/panel',
    Icon: LayoutDashboard,
    isActive: (pathname: string) => pathname.startsWith('/labour/company/panel')
  }
]

export function RozgarMobileBottomNav() {
  const pathname = usePathname()

  if (!pathname || !pathname.startsWith('/labour/company')) {
    return null
  }

  return (
    <nav className={styles.rozgarMobileBottomNav} aria-label="Rozgar mobile navigation">
      <div className={styles.rozgarMobileBottomNavGrid}>
        {navItems.map(({ label, href, Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <Link
              key={href}
              href={href}
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
