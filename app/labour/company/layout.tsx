import type { ReactNode } from 'react'
import styles from './company-site.module.css'
import { RozgarMobileBottomNav } from './rozgar-mobile-bottom-nav'

export default function LabourCompanyLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.rozgarMobileShell}>
      {children}
      <RozgarMobileBottomNav />
    </div>
  )
}
