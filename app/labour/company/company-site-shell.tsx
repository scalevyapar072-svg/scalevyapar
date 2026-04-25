import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import styles from './company-site.module.css'

type Props = {
  content: LabourCompanyWebsiteContent
  currentPath: string
  children: ReactNode
}

export function CompanySiteShell({ content, currentPath, children }: Props) {
  return (
    <div className={styles.page} style={{ background: `linear-gradient(180deg, #f8fafc 0%, ${content.theme.accentSoft} 100%)` }}>
      <div className={styles.container}>
        <div className={styles.topBar}>{content.header.announcement}</div>

        <header className={styles.siteHeader}>
          <Link href="/labour/company" className={styles.brandWrap}>
            <span className={styles.brandBadge} style={{ background: `linear-gradient(135deg, ${content.theme.accentColor}, ${content.theme.highlightColor})` }}>
              LX
            </span>
            <span>
              <p className={styles.brandName}>{content.theme.brandName}</p>
              <p className={styles.brandTagline}>{content.theme.brandTagline}</p>
            </span>
          </Link>

          <div className={styles.headerActions}>
            <Link href="/admin/labour/website" className={styles.secondaryButton}>
              Website Editor
            </Link>
            <Link href={content.header.primaryCtaHref} className={styles.primaryButton} style={{ background: content.theme.accentColor, color: '#ffffff', border: '1px solid transparent' }}>
              {content.header.primaryCtaLabel}
            </Link>
          </div>
        </header>

        <nav className={styles.nav}>
          {content.header.navItems.map(item => {
            const isActive = currentPath === item.href
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerTitle}>{content.theme.brandName}</p>
              <p className={styles.textMuted}>{content.footer.description}</p>
              <div className={styles.stack} style={{ marginTop: '14px' }}>
                <span className={styles.textMuted}>Email: {content.footer.supportEmail}</span>
                <span className={styles.textMuted}>Phone: {content.footer.phone}</span>
                <span className={styles.textMuted}>Address: {content.footer.address}</span>
              </div>
            </div>

            {content.footer.linkGroups.map(group => (
              <div key={group.title}>
                <p className={styles.footerTitle}>{group.title}</p>
                <div className={styles.footerLinks}>
                  {group.links.map(link => (
                    <Link key={`${group.title}-${link.label}`} href={link.href} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.divider} />
          <p className={styles.textMuted}>{content.footer.copyrightText}</p>
        </footer>
      </div>
    </div>
  )
}
