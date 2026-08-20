'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  Bell,
  Download,
  Home,
  Languages,
  Share2,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { agentCopy, type AgentCopy } from '../_lib/agent-copy'
import type { AgentLocale } from '../_lib/agent-types'
import styles from '../agent.module.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type AgentLocaleContextValue = {
  locale: AgentLocale
  copy: AgentCopy
  setLocale: (locale: AgentLocale) => void
}

const AgentLocaleContext = createContext<AgentLocaleContextValue | null>(null)
const AGENT_LOCALE_KEY = 'rozgar-agent-locale'
const AGENT_NAV_LINKS = [
  '/labour/agent',
  '/labour/agent/refer',
  '/labour/agent/referrals',
  '/labour/agent/earnings',
  '/labour/agent/profile',
] as const

export function AgentLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AgentLocale>('en')

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(AGENT_LOCALE_KEY)
    if (storedLocale === 'en' || storedLocale === 'hi') {
      const frameId = window.requestAnimationFrame(() => {
        setLocaleState(currentLocale => (currentLocale === storedLocale ? currentLocale : storedLocale))
      })
      return () => {
        window.cancelAnimationFrame(frameId)
      }
    }
    return undefined
  }, [])

  const value = useMemo<AgentLocaleContextValue>(
    () => ({
      locale,
      copy: agentCopy[locale],
      setLocale: nextLocale => {
        setLocaleState(nextLocale)
        window.localStorage.setItem(AGENT_LOCALE_KEY, nextLocale)
      },
    }),
    [locale]
  )

  return (
    <AgentLocaleContext.Provider value={value}>
      {children}
    </AgentLocaleContext.Provider>
  )
}

export function useAgentLocale() {
  const context = useContext(AgentLocaleContext)
  if (!context) {
    throw new Error('useAgentLocale must be used inside AgentLocaleProvider.')
  }
  return context
}

export function AgentBrandLockup() {
  return (
    <div className={styles.agentBrand}>
      <Image
        src="/images/agent-ui/agent-header-logo.png"
        alt="Rozgar by ScaleVyapar"
        width={240}
        height={61}
        className={styles.agentBrandLogoImage}
        sizes="(max-width: 375px) 34vw, (max-width: 430px) 38vw, (max-width: 540px) 34vw, 240px"
        priority
      />
      <div className={styles.agentBrandTag}>AJENT</div>
    </div>
  )
}

export function AgentHeaderIconButton({
  children,
  ariaLabel,
  onClick,
  disabled = false,
}: {
  children: ReactNode
  ariaLabel: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={styles.headerIconButton}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function AgentNotificationButton() {
  const { copy } = useAgentLocale()

  return (
    <AgentHeaderIconButton
      ariaLabel="Notifications"
      onClick={() => {
        window.alert(copy.notificationsComingSoon)
      }}
    >
      <Bell size={24} strokeWidth={2.2} />
      <span className={styles.notificationDot} />
    </AgentHeaderIconButton>
  )
}

export function AgentLocaleControl() {
  const { locale, copy, setLocale } = useAgentLocale()

  return (
    <div className={`${styles.localeToggle} ${styles.localeToggleHeader}`} role="group" aria-label={copy.language}>
      <Languages size={13} strokeWidth={2.1} />
      <button
        type="button"
        className={`${styles.localeToggleButton} ${locale === 'en' ? styles.localeToggleButtonActive : ''}`}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`${styles.localeToggleButton} ${locale === 'hi' ? styles.localeToggleButtonActive : ''}`}
        onClick={() => setLocale('hi')}
      >
        {copy.hindi}
      </button>
    </div>
  )
}

export function AgentHeaderControls() {
  return (
    <div className={styles.headerControlRow}>
      <AgentLocaleControl />
      <AgentNotificationButton />
    </div>
  )
}

export function AgentInstallCta() {
  const { copy, locale } = useAgentLocale()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const title = locale === 'hi' ? 'Rozgar Agent App इंस्टॉल करें' : 'Install Rozgar Agent App'
  const body =
    locale === 'hi'
      ? 'तेज़ एक्सेस और रियल-टाइम अपडेट्स के लिए इसे अपने होम स्क्रीन पर जोड़ें।'
      : 'Get faster access & real-time updates'

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/labour/agent/agent-sw.js', {
        scope: '/labour/agent/',
      }).catch(() => {
        // Installability help should never block the Agent experience.
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!promptEvent) {
      setShowFallback(current => !current)
      return
    }

    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  return (
    <section className={styles.installShowcase}>
      <div className={styles.installShowcaseCopy}>
        <h3 className={styles.installShowcaseTitle}>{title}</h3>
        <p className={styles.installShowcaseBody}>{body}</p>
        <button type="button" className={styles.installShowcaseButton} onClick={handleInstall}>
          {copy.installNow}
        </button>
        {showFallback ? <p className={styles.installShowcaseFallback}>{copy.installFallback}</p> : null}
      </div>

      <div className={styles.installShowcaseArt} aria-hidden="true">
        <div className={styles.installPhone}>
          <div className={styles.installPhoneNotch} />
          <div className={styles.installPhoneScreen}>
            <div className={styles.installPhoneBadge}>
              <Image
                src="/images/agent-ui/agent-header-logo.png"
                alt=""
                width={106}
                height={28}
                className={styles.installPhoneLogo}
                sizes="106px"
              />
            </div>
            <div className={styles.installPhoneAction}>
              <Download size={16} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AgentLogoutButton({
  redirectTo = '/labour/agent/login',
  className = '',
}: {
  redirectTo?: string
  className?: string
}) {
  const router = useRouter()
  const { copy } = useAgentLocale()
  const [submitting, setSubmitting] = useState(false)

  const handleLogout = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/labour/agent/auth/logout', { method: 'POST' })
    } finally {
      router.replace(redirectTo)
      router.refresh()
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      className={className || styles.secondaryButton}
      onClick={handleLogout}
      disabled={submitting}
    >
      {submitting ? '...' : copy.logout}
    </button>
  )
}

export function AgentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { copy } = useAgentLocale()

  const navItems = [
    { href: '/labour/agent', label: copy.home, icon: Home },
    { href: '/labour/agent/refer', label: copy.refer, icon: Share2 },
    { href: '/labour/agent/referrals', label: copy.referrals, icon: Users },
    { href: '/labour/agent/earnings', label: copy.earnings, icon: Wallet },
    { href: '/labour/agent/profile', label: copy.profile, icon: UserRound },
  ]

  useEffect(() => {
    AGENT_NAV_LINKS.forEach(href => {
      void router.prefetch(href)
    })
  }, [router])

  return (
    <div className={styles.agentScreen}>
      <div className={styles.agentViewport}>
        <div className={styles.agentContent}>{children}</div>
      </div>

      <div className={styles.bottomNavDock}>
        <nav className={styles.bottomNav} aria-label="Agent navigation">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`${styles.bottomNavLink} ${isActive ? styles.bottomNavLinkActive : ''}`}
              >
                <Icon size={22} strokeWidth={2.2} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
