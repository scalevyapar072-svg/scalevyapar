'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Factory,
  Hammer,
  Headset,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wrench,
  type LucideIcon
} from 'lucide-react'
import styles from './company-site.module.css'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { normalizeRozgarCurrentPath, toRozgarPublicPath } from '@/lib/labour-company-host'
import { DEFAULT_ROZGAR_LOGO_SRC, normalizeWebsiteAssetPath } from '@/lib/labour-company-public-assets'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  type LabourCategoryDependency,
  type LabourIndustryBusinessDependency,
  type LabourMasterOption
} from '@/lib/labour-masters-schema'
import { PublicAssetImage } from './public-asset-image'
import { attachRozgarMotion } from './rozgar-motion'

const COMPANY_TOKEN_KEY = 'labour_company_token'

type PlanOption = {
  id: string
  name: string
  planAmount: number
  registrationFee: number
  validityDays: number
  description: string
  categoryId?: string
}

type Props = {
  content: LabourCompanyWebsiteContent
  industryCategoryOptions: LabourMasterOption[]
  businessTypeOptions: LabourMasterOption[]
  categoryOptions: Array<{
    id: string
    name: string
    isActive?: boolean
  }>
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  categoryDependencies: LabourCategoryDependency[]
  cityOptions: string[]
  companyPlans: PlanOption[]
  stats: {
    activeCompanies: number
    activeWorkers: number
    liveJobs: number
    totalJobs: number
    industriesCovered: number
  }
  initialHostname?: string | null
}

const socialLabels = ['LinkedIn', 'Instagram', 'Facebook']
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

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  building: Building2,
  clipboard: ClipboardList,
  badge: BadgeCheck,
  search: Search,
  shield: ShieldCheck,
  headset: Headset,
  sparkles: Sparkles,
  hammer: Hammer,
  factory: Factory,
  package: PackageCheck,
  truck: Truck,
  wrench: Wrench
}

const fallbackTestimonials = [
  {
    quote: 'ScaleVyapar has made hiring easier for our business. We get good quality workers every time.',
    name: 'Rohit Sharma',
    role: 'Operations Head',
    company: 'Textile Unit',
    rating: '5'
  },
  {
    quote: 'We posted a job and received verified and fit profiles within hours. Highly efficient.',
    name: 'Vijay Agarwal',
    role: 'HR Manager',
    company: 'Manufacturing Company',
    rating: '5'
  },
  {
    quote: 'The best platform to quickly find reliable manpower for our projects and seasonal needs.',
    name: 'Neena Khan',
    role: 'CEO',
    company: 'BuildTech',
    rating: '5'
  }
]

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

function resolveIcon(iconName: string | undefined, fallback: LucideIcon) {
  if (!iconName) return fallback
  return iconMap[iconName.toLowerCase()] || fallback
}

function renderHeroTitle(title: string, highlightedText: string) {
  if (!highlightedText.trim() || !title.includes(highlightedText)) {
    return title
  }

  const parts = title.split(highlightedText)
  return (
    <>
      {parts[0]}
      <span className={styles.homeHeroTitleHighlight}>{highlightedText}</span>
      {parts.slice(1).join(highlightedText)}
    </>
  )
}

function HeroBannerImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  const isRemote = /^https?:\/\//i.test(src)

  if (isRemote) {
    return <img src={src} alt={alt} className={styles.homeHeroVisualImage} loading={priority ? 'eager' : 'lazy'} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 960px) 100vw, 42vw"
      className={styles.homeHeroVisualImage}
      priority={priority}
    />
  )
}

export function LabourCompanyHomeClient({
  content,
  industryCategoryOptions,
  businessTypeOptions,
  categoryOptions,
  industryBusinessDependencies,
  categoryDependencies,
  cityOptions,
  companyPlans,
  stats,
  initialHostname = null
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const homeRef = useRef<HTMLDivElement | null>(null)
  const testimonialTouchStartXRef = useRef<number | null>(null)
  const categoryTouchStartXRef = useRef<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hostname, setHostname] = useState<string | null>(initialHostname)
  const [selectedIndustryCategory, setSelectedIndustryCategory] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)

  const jobPostHref = '/labour/company/job-post'
  const registrationHref = '/labour/company/company-registration'
  const searchHref = '/labour/company/search'
  const loginHref = '/labour/company/signin'
  const panelHref = '/labour/company/panel'
  const hasCompanyPlans = companyPlans.length > 0
  const workerJoinHref = content.home.workerCta.buttonHref || '/labour'
  const currentPath = '/labour/company'
  const resolveHref = (href: string) => toRozgarPublicPath(href, hostname)
  const resolvedCurrentPath = normalizeRozgarCurrentPath(pathname || currentPath, hostname)
  const accountHref = resolveHref(isLoggedIn ? panelHref : loginHref)
  const accountLabel = isLoggedIn ? 'Logged in' : 'Login'
  const mobileNavItems = [
    { label: 'Home', href: '/labour/company' },
    { label: 'Find Workers', href: searchHref },
    { label: 'Post Job', href: jobPostHref },
    { label: 'Register Company', href: registrationHref },
    { label: accountLabel, href: isLoggedIn ? panelHref : loginHref },
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
      panelHref,
      '/labour/company/contact'
    ]

    Array.from(new Set(routesToPrefetch.map(resolveHref))).forEach(route => {
      router.prefetch(route)
    })
  }, [hostname, jobPostHref, loginHref, panelHref, registrationHref, router, searchHref])

  const announcementText = content.header.announcement?.trim()
  const primaryCtaLabel = content.header.primaryCtaLabel?.trim() || 'Post a Job'
  const primaryCtaHref = content.header.primaryCtaHref?.trim() || jobPostHref
  const searchCtaLabel = content.home.hero.secondaryCtaLabel?.trim() || 'Find Workers'
  const themeStyle = {
    '--rozgar-accent-color': content.theme.accentColor || '#0f172a',
    '--rozgar-accent-soft': content.theme.accentSoft || '#e0ecff',
    '--rozgar-highlight-color': content.theme.highlightColor || '#2563eb'
  } as CSSProperties
  const fallbackHeaderNav = [
    { label: 'Home', href: '/labour/company' },
    { label: 'About Us', href: '/labour/company/about' },
    ...(hasCompanyPlans ? [{ label: 'Pricing', href: '/labour/company/pricing' }] : []),
    { label: 'Search Worker', href: '/labour/company/search' },
    { label: 'Client Dashboard', href: panelHref },
    { label: 'Contact Us', href: '/labour/company/contact' }
  ]
  const headerNav = (content.header.navItems.length ? content.header.navItems : fallbackHeaderNav)
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
        { label: 'Company Portal', href: panelHref },
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
  const brandTitle = content.header.logoTitle?.trim() || content.theme.brandName || 'ScaleVyapar Rozgar'
  const brandSlogan = content.header.logoSlogan?.trim() || 'Hire Faster across India'
  const footerCopyrightText = (content.footer.copyrightText || '© 2026 ScaleVyapar. All rights reserved.')
    .replace(/^Â©/, '©')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const availableBusinessTypeOptions = useMemo(() => {
    if (!selectedIndustryCategory) return [] as LabourMasterOption[]

    return filterBusinessTypesByIndustryDependency(
      businessTypeOptions,
      industryCategoryOptions,
      industryBusinessDependencies,
      selectedIndustryCategory
    )
  }, [businessTypeOptions, industryBusinessDependencies, industryCategoryOptions, selectedIndustryCategory])

  const availableCategoryOptions = useMemo(() => {
    if (!selectedIndustryCategory || !selectedBusinessType) {
      return [] as typeof categoryOptions
    }

    return filterCategoriesByLabourDependency(
      categoryOptions,
      categoryDependencies,
      {
        business_type: businessTypeOptions,
        industry_category: industryCategoryOptions
      } as never,
      selectedBusinessType,
      selectedIndustryCategory
    )
  }, [
    businessTypeOptions,
    categoryDependencies,
    categoryOptions,
    industryCategoryOptions,
    selectedBusinessType,
    selectedIndustryCategory
  ])

  const heroTrustPoints = useMemo(() => {
    const items = content.home.trustStrip.items
      .map(item => item.trim())
      .filter(Boolean)

    const hasLegacyTrustCopy = items.some(item =>
      /daily-basis|company plan control|city-wise demand|short-validity urgent/i.test(item)
    )

    if (!items.length || hasLegacyTrustCopy) {
      return ['Verified Workers', 'Quick Matching', 'Secure & Reliable']
    }

    return items.slice(0, 3)
  }, [content.home.trustStrip.items])

  const benefitCards = content.home.features.cards
  const processSteps = content.home.process.steps.slice(0, 5)
  const categoryCards = content.home.categories.cards
  const testimonials = (content.home.testimonials.items.length ? content.home.testimonials.items : fallbackTestimonials).slice(0, 3)
  const heroSlides = useMemo(() => {
    const slides = content.home.hero.slides
      .slice(0, 5)
      .map(slide => {
        const primaryImageSrc = slide.primaryImageSrc?.trim() || content.home.hero.primaryImageSrc || '/worker-hero-reference.png'

        return {
          primaryImageSrc,
          secondaryImageSrc: primaryImageSrc,
          imageBadgeTitle: slide.imageBadgeTitle?.trim() || content.home.hero.imageBadgeTitle || 'Trusted by 1000+',
          imageBadgeSubtitle: slide.imageBadgeSubtitle?.trim() || content.home.hero.imageBadgeSubtitle || 'Companies Across India',
          ratingText: slide.ratingText?.trim() || '4.8/5'
        }
      })
      .filter(slide => slide.primaryImageSrc)

    if (slides.length > 0) {
      return slides
    }

    const fallbackPrimaryImage = content.home.hero.primaryImageSrc || '/worker-hero-reference.png'
    return [{
      primaryImageSrc: fallbackPrimaryImage,
      secondaryImageSrc: fallbackPrimaryImage,
      imageBadgeTitle: content.home.hero.imageBadgeTitle || 'Trusted by 1000+',
      imageBadgeSubtitle: content.home.hero.imageBadgeSubtitle || 'Companies Across India',
      ratingText: '4.8/5'
    }]
  }, [content.home.hero])
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const normalizedActiveTestimonialIndex = testimonials.length > 0 ? activeTestimonialIndex % testimonials.length : 0
  const normalizedActiveCategoryIndex = categoryCards.length > 0 ? activeCategoryIndex % categoryCards.length : 0
  const testimonialTrackStyle = {
    '--home-testimonial-index': normalizedActiveTestimonialIndex
  } as CSSProperties
  const categoryTrackStyle = {
    '--home-category-index': normalizedActiveCategoryIndex
  } as CSSProperties

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveHeroSlide(current => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    if (typeof window === 'undefined' || testimonials.length <= 1) return

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMedia = window.matchMedia('(max-width: 768px)')
    let timer: number | null = null

    const clearTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    const syncTimer = () => {
      clearTimer()
      if (motionMedia.matches || !mobileMedia.matches || document.visibilityState !== 'visible') return

      timer = window.setInterval(() => {
        setActiveTestimonialIndex(current => (current + 1) % testimonials.length)
      }, 4200)
    }

    syncTimer()
    const handleMediaChange = () => syncTimer()
    document.addEventListener('visibilitychange', syncTimer)
    motionMedia.addEventListener?.('change', handleMediaChange)
    mobileMedia.addEventListener?.('change', handleMediaChange)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', syncTimer)
      motionMedia.removeEventListener?.('change', handleMediaChange)
      mobileMedia.removeEventListener?.('change', handleMediaChange)
    }
  }, [testimonials.length])

  useEffect(() => {
    if (typeof window === 'undefined' || categoryCards.length <= 1) return

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMedia = window.matchMedia('(max-width: 768px)')
    let timer: number | null = null

    const clearTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    const syncTimer = () => {
      clearTimer()
      if (motionMedia.matches || !mobileMedia.matches || document.visibilityState !== 'visible') return

      timer = window.setInterval(() => {
        setActiveCategoryIndex(current => (current + 1) % categoryCards.length)
      }, 4300)
    }

    syncTimer()
    const handleMediaChange = () => syncTimer()
    document.addEventListener('visibilitychange', syncTimer)
    motionMedia.addEventListener?.('change', handleMediaChange)
    mobileMedia.addEventListener?.('change', handleMediaChange)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', syncTimer)
      motionMedia.removeEventListener?.('change', handleMediaChange)
      mobileMedia.removeEventListener?.('change', handleMediaChange)
    }
  }, [categoryCards.length])

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
    if (!homeRef.current) return
    if (window.matchMedia('(max-width: 1024px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    return attachRozgarMotion(homeRef.current, styles)
  }, [])

  useEffect(() => {
    if (!selectedIndustryCategory) {
      if (selectedBusinessType) setSelectedBusinessType('')
      if (selectedCategory) setSelectedCategory('')
      return
    }

    const isSelectedBusinessTypeAvailable = availableBusinessTypeOptions.some(option => option.label === selectedBusinessType)
    if (selectedBusinessType && !isSelectedBusinessTypeAvailable) {
      setSelectedBusinessType('')
      setSelectedCategory('')
    }
  }, [availableBusinessTypeOptions, selectedBusinessType, selectedCategory, selectedIndustryCategory])

  useEffect(() => {
    const isSelectedCategoryAvailable = availableCategoryOptions.some(option => option.name === selectedCategory)
    if (selectedCategory && !isSelectedCategoryAvailable) {
      setSelectedCategory('')
    }
  }, [availableCategoryOptions, selectedCategory])

  const handleTestimonialTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    testimonialTouchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleTestimonialTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (testimonials.length <= 1 || testimonialTouchStartXRef.current == null) {
      testimonialTouchStartXRef.current = null
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? testimonialTouchStartXRef.current
    const deltaX = endX - testimonialTouchStartXRef.current
    testimonialTouchStartXRef.current = null

    if (Math.abs(deltaX) < 40) {
      return
    }

    setActiveTestimonialIndex(current =>
      deltaX < 0
        ? (current + 1) % testimonials.length
        : (current - 1 + testimonials.length) % testimonials.length
    )
  }

  const handleCategoryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    categoryTouchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleCategoryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (categoryCards.length <= 1 || categoryTouchStartXRef.current == null) {
      categoryTouchStartXRef.current = null
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? categoryTouchStartXRef.current
    const deltaX = endX - categoryTouchStartXRef.current
    categoryTouchStartXRef.current = null

    if (Math.abs(deltaX) < 40) {
      return
    }

    setActiveCategoryIndex(current =>
      deltaX < 0
        ? (current + 1) % categoryCards.length
        : (current - 1 + categoryCards.length) % categoryCards.length
    )
  }

  const normalizedActiveHeroSlide = heroSlides.length > 0 ? activeHeroSlide % heroSlides.length : 0
  const currentHeroSlide = heroSlides[normalizedActiveHeroSlide] || heroSlides[0]
  const primaryHeroImageSrc = currentHeroSlide?.primaryImageSrc || content.home.hero.primaryImageSrc || '/worker-hero-reference.png'
  const secondaryHeroImageSrc = primaryHeroImageSrc
  const useSplitHeroImages = false
  const heroBadgeTitle = currentHeroSlide?.imageBadgeTitle || content.home.hero.imageBadgeTitle
  const heroBadgeSubtitle = currentHeroSlide?.imageBadgeSubtitle || content.home.hero.imageBadgeSubtitle
  const heroRatingText = currentHeroSlide?.ratingText || '4.8/5'

  const statItems = [
    {
      ...content.home.stats.items[0],
      value: stats.activeWorkers > 0 ? `${stats.activeWorkers}+` : (content.home.stats.items[0]?.value || '500+')
    },
    {
      ...content.home.stats.items[1],
      value: stats.activeCompanies > 0 ? `${stats.activeCompanies}+` : (content.home.stats.items[1]?.value || '120+')
    },
    {
      ...content.home.stats.items[2],
      value: (stats.totalJobs || stats.liveJobs) > 0 ? `${stats.totalJobs || stats.liveJobs}+` : (content.home.stats.items[2]?.value || '300+')
    },
    {
      ...content.home.stats.items[3],
      value: stats.industriesCovered > 0 ? `${stats.industriesCovered}+` : (content.home.stats.items[3]?.value || '12+')
    }
  ]

  const logoSrc = normalizeWebsiteAssetPath(content.header.logoSrc, DEFAULT_ROZGAR_LOGO_SRC)
  const parsedLogoWidth = Number(content.header.logoWidth)
  const logoWidth = Number.isFinite(parsedLogoWidth) && parsedLogoWidth > 0 ? Math.round(parsedLogoWidth) : 220
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
    <div ref={homeRef} className={styles.homeLandingPage} style={themeStyle}>
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
            {headerNav.map(item => (
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

      <main className={styles.homeLandingMain}>
        <section className={styles.homeHeroSection}>
          <div className={styles.homeHeroContent}>
            <p className={styles.homeHeroEyebrow}>{content.home.hero.eyebrow}</p>
            <h1 className={styles.homeHeroTitle}>
              {renderHeroTitle(content.home.hero.title, content.home.hero.highlightedText)}
            </h1>
            <p className={styles.homeHeroText}>{content.home.hero.subtitle}</p>

            <div className={styles.homeHeroButtonRow}>
              <Link
                href={resolveHref(content.home.hero.primaryCtaHref || jobPostHref)}
                className={`${styles.homeHeroPrimaryButton} ${styles.homeHeroAnimatedButton}`}
              >
                {content.home.hero.primaryCtaLabel}
              </Link>
              <Link
                href={resolveHref(content.home.hero.secondaryCtaHref || searchHref)}
                className={`${styles.homeHeroSecondaryButton} ${styles.homeHeroAnimatedButton} ${styles.homeHeroAnimatedButtonDelay}`}
              >
                {content.home.hero.secondaryCtaLabel}
              </Link>
            </div>

            <div className={styles.homeHeroTrustRow}>
              {heroTrustPoints.map(point => (
                <span key={point} className={styles.homeHeroTrustItem}>
                  <BadgeCheck size={16} />
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.homeHeroShowcase}>
            <div className={`${styles.homeHeroVisualGrid} ${!useSplitHeroImages ? styles.homeHeroVisualGridSingle : ''}`}>
              <div className={`${styles.homeHeroImagePrimary} ${!useSplitHeroImages ? styles.homeHeroImagePrimarySingle : ''}`}>
                <HeroBannerImage src={primaryHeroImageSrc} alt="Skilled worker hiring showcase" priority />
              </div>
              {useSplitHeroImages ? (
                <>
                  <div className={styles.homeHeroImageSecondary}>
                    <Image
                      src={secondaryHeroImageSrc}
                      alt="Worker showcase"
                      fill
                      sizes="(max-width: 960px) 100vw, 24vw"
                      className={styles.homeHeroVisualImage}
                    />
                  </div>
                  <div className={styles.homeHeroInsightCard}>
                    <strong>{heroBadgeTitle}</strong>
                    <p>{heroBadgeSubtitle}</p>
                    <div className={styles.homeHeroInsightFooter}>
                      <div className={styles.homeHeroInsightAvatars} aria-hidden="true">
                        {[0, 1, 2, 3].map(index => (
                          <span key={index} className={styles.homeHeroInsightAvatar} />
                        ))}
                      </div>
                      <div className={styles.homeHeroInsightRating}>
                        <span className={styles.homeStars}>★★★★★</span>
                        <small>{heroRatingText}</small>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              <div className={styles.homeHeroInsightCard}>
                <strong>{heroBadgeTitle}</strong>
                <p>{heroBadgeSubtitle}</p>
                <div className={styles.homeHeroInsightFooter}>
                  <div className={styles.homeHeroInsightAvatars} aria-hidden="true">
                    {[0, 1, 2, 3].map(index => (
                      <span key={index} className={styles.homeHeroInsightAvatar} />
                    ))}
                  </div>
                  <div className={styles.homeHeroInsightRating}>
                    <span className={styles.homeStars}>★★★★★</span>
                    <small>{heroRatingText}</small>
                  </div>
                </div>
              </div>
            </div>
            {heroSlides.length > 1 ? (
              <div className={styles.homeHeroSliderDots} aria-label="Hero image slides">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.primaryImageSrc}-${index}`}
                    type="button"
                    className={`${styles.homeHeroSliderDot} ${index === normalizedActiveHeroSlide ? styles.homeHeroSliderDotActive : ''}`}
                    aria-label={`Show hero slide ${index + 1}`}
                    aria-pressed={index === normalizedActiveHeroSlide}
                    onClick={() => setActiveHeroSlide(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.homeSearchSection}>
          <div className={styles.homeSearchPanel}>
            <h2 className={styles.homeSearchTitle}>{content.home.searchBar.title}</h2>
            <form action={resolveHref(searchHref)} method="get" className={styles.homeSearchBar}>
              <div className={`${styles.homeSearchFieldLarge} ${styles.homeSearchFieldSearch}`}>
                <Search size={18} />
                <input
                  type="text"
                  name="q"
                  placeholder={content.home.searchBar.placeholder}
                  className={styles.homeSearchInput}
                />
              </div>

              <div className={styles.homeSearchField}>
                <select
                  name="industryCategory"
                  className={styles.homeSearchSelect}
                  value={selectedIndustryCategory}
                  onChange={event => {
                    setSelectedIndustryCategory(event.target.value)
                    setSelectedBusinessType('')
                    setSelectedCategory('')
                  }}
                >
                  <option value="">All Industries</option>
                  {industryCategoryOptions.map(option => (
                    <option key={option.id} value={option.label}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.homeSearchField}>
                <select
                  name="businessType"
                  className={styles.homeSearchSelect}
                  value={selectedBusinessType}
                  onChange={event => {
                    setSelectedBusinessType(event.target.value)
                    setSelectedCategory('')
                  }}
                  disabled={!selectedIndustryCategory}
                >
                  <option value="">{selectedIndustryCategory ? 'All Business Types' : 'Select Industry First'}</option>
                  {availableBusinessTypeOptions.map(option => (
                    <option key={option.id} value={option.label}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.homeSearchField}>
                <select
                  name="category"
                  className={styles.homeSearchSelect}
                  value={selectedCategory}
                  onChange={event => setSelectedCategory(event.target.value)}
                  disabled={!selectedIndustryCategory || !selectedBusinessType}
                >
                  <option value="">
                    {!selectedIndustryCategory
                      ? 'Select Industry First'
                      : !selectedBusinessType
                        ? 'Select Business First'
                        : 'All Categories'}
                  </option>
                  {availableCategoryOptions.map(option => (
                    <option key={option.id} value={option.name}>{option.name}</option>
                  ))}
                </select>
              </div>

              <div className={`${styles.homeSearchField} ${styles.homeSearchFieldCity}`}>
                <select
                  name="city"
                  className={styles.homeSearchSelect}
                  value={selectedCity}
                  onChange={event => setSelectedCity(event.target.value)}
                >
                  <option value="">All Cities</option>
                  {cityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className={styles.homeSearchButton}>
                {content.home.searchBar.buttonLabel}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </section>

        <section className={styles.homeStatsSection}>
          <div className={styles.homeStatsBand}>
            {statItems.map((item, index) => {
              const Icon = resolveIcon(item.icon, [Users, Building2, ClipboardList, Sparkles][index] || Sparkles)
              return (
                <div key={`${item.label}-${index}`} className={styles.homeStatsCard}>
                  <span className={styles.homeStatsIconWrap}>
                    <Icon size={22} className={styles.homeStatsIcon} />
                  </span>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section id="about-rozgar" className={styles.homeAboutSection}>
          <div className={styles.homeSectionIntroCentered}>
            <p className={styles.homeSectionEyebrow}>{content.home.features.eyebrow}</p>
            <h2 className={styles.homeSectionTitle}>{content.home.features.title}</h2>
            <p className={styles.homeSectionText}>{content.home.features.subtitle}</p>
          </div>

          <div className={styles.homeBenefitsGrid}>
            {benefitCards.map((card, index) => {
              const Icon = resolveIcon(card.icon, [Users, ClipboardList, BadgeCheck, Search, ShieldCheck, Headset][index] || Users)
              return (
                <article key={`${card.title}-${index}`} className={styles.homeBenefitCard}>
                  <span className={styles.homeBenefitIconWrap}>
                    <Icon size={20} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="how-it-works" className={styles.homeHowSection}>
          <div className={styles.homeSectionIntroCentered}>
            <p className={styles.homeSectionEyebrow}>{content.home.process.eyebrow}</p>
            <h2 className={styles.homeSectionTitle}>{content.home.process.title}</h2>
          </div>

          <div className={styles.homeHowTimeline}>
            {processSteps.map((step, index) => {
              const Icon = resolveIcon(step.icon, [Building2, ClipboardList, Users, BriefcaseBusiness, BadgeCheck][index] || Users)
              return (
                <article key={`${step.title}-${index}`} className={styles.homeHowTimelineCard}>
                  <span className={styles.homeHowTimelineDot}>
                    <Icon size={18} />
                  </span>
                  <div className={styles.homeHowTimelineLine} aria-hidden={index === processSteps.length - 1} />
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="worker-categories" className={styles.homeIndustriesSection}>
          <div className={styles.homeSectionIntroCentered}>
            <p className={styles.homeSectionEyebrow}>{content.home.categories.eyebrow}</p>
            <h2 className={styles.homeSectionTitle}>{content.home.categories.title}</h2>
          </div>

          <div
            className={styles.homeCategoryViewport}
            onTouchStart={handleCategoryTouchStart}
            onTouchEnd={handleCategoryTouchEnd}
          >
            <div className={styles.homeCategoryGrid} style={categoryTrackStyle}>
              {categoryCards.map((category, index) => {
                const Icon = resolveIcon(category.icon, [Hammer, Factory, PackageCheck, Truck, Wrench, Sparkles][index] || Sparkles)
                return (
                  <Link key={`${category.title}-${index}`} href={resolveHref(category.href || searchHref)} className={styles.homeCategoryCard}>
                    <span className={styles.homeCategoryIconWrap}>
                      <Icon size={20} />
                    </span>
                    <h3>{category.title}</h3>
                    <p>{category.subtitle}</p>
                  </Link>
                )
              })}
            </div>
          </div>
          {categoryCards.length > 1 ? (
            <div className={styles.homeCategoryDots} aria-label="Category slides">
              {categoryCards.map((category, index) => (
                <button
                  key={`${category.title}-${index}-dot`}
                  type="button"
                  className={`${styles.homeCategoryDot} ${index === normalizedActiveCategoryIndex ? styles.homeCategoryDotActive : ''}`.trim()}
                  aria-label={`Show category ${index + 1}`}
                  aria-pressed={index === normalizedActiveCategoryIndex}
                  onClick={() => setActiveCategoryIndex(index)}
                />
              ))}
            </div>
          ) : null}

          <div className={styles.homeCategoryCtaRow}>
            <Link href={resolveHref(content.home.categories.buttonHref || searchHref)} className={styles.homeCategoryCtaButton}>
              {content.home.categories.buttonLabel}
            </Link>
          </div>
        </section>

        <section className={styles.homeCompanyBannerSection}>
          <div className={styles.homeCompanyBanner}>
            <div>
              <p className={styles.homeCompanyBannerEyebrow}>{content.home.finalCta.eyebrow}</p>
              <h2 className={styles.homeCompanyBannerTitle}>{content.home.finalCta.title}</h2>
              <p className={styles.homeCompanyBannerText}>{content.home.finalCta.subtitle}</p>
            </div>

            <div className={styles.homeCompanyBannerButtons}>
              <Link href={resolveHref(content.home.finalCta.buttonHref || jobPostHref)} className={styles.homeCompanyBannerPrimary}>
                {content.home.finalCta.buttonLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.homeTestimonialsSection}>
          <div className={styles.homeSectionIntroCentered}>
            <p className={styles.homeSectionEyebrow}>{content.home.testimonials.eyebrow}</p>
            <h2 className={styles.homeSectionTitle}>{content.home.testimonials.title}</h2>
          </div>

          <div
            className={styles.homeTestimonialsViewport}
            onTouchStart={handleTestimonialTouchStart}
            onTouchEnd={handleTestimonialTouchEnd}
          >
            <div className={styles.homeTestimonialsGrid} style={testimonialTrackStyle}>
            {testimonials.map((item, index) => (
              <article key={`${item.name}-${index}`} className={styles.homeTestimonialCard}>
                <div className={styles.homeStars}>{'★'.repeat(Math.max(1, Number(item.rating || '5')))}</div>
                <p className={styles.homeTestimonialQuote}>&ldquo;{item.quote}&rdquo;</p>
                <div className={styles.homeTestimonialMeta}>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                  <span>{item.company}</span>
                </div>
              </article>
            ))}
            </div>
          </div>
          {testimonials.length > 1 ? (
            <div className={styles.homeTestimonialsDots} aria-label="Testimonial slides">
              {testimonials.map((item, index) => (
                <button
                  key={`${item.name}-${index}-dot`}
                  type="button"
                  className={`${styles.homeTestimonialsDot} ${index === normalizedActiveTestimonialIndex ? styles.homeTestimonialsDotActive : ''}`.trim()}
                  aria-label={`Show testimonial ${index + 1}`}
                  aria-pressed={index === normalizedActiveTestimonialIndex}
                  onClick={() => setActiveTestimonialIndex(index)}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.homeWorkerCtaSection}>
          <div className={styles.homeWorkerCtaPanel}>
            <div className={styles.homeWorkerCtaCopy}>
              <span className={styles.homeWorkerCtaIconWrap}>
                <Users size={22} />
              </span>
              <div>
                <h2>{content.home.workerCta.title}</h2>
                <p>{content.home.workerCta.description}</p>
              </div>
            </div>
            <Link href={workerJoinHref} className={styles.homeWorkerCtaButton}>
              {content.home.workerCta.buttonLabel}
            </Link>
          </div>
        </section>
      </main>

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
                  loading="lazy"
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
              <span>Phone: {content.footer.phone}</span>
              <span>Office: {content.footer.address}</span>
            </div>
          </div>
        </div>

        <div className={styles.homeFooterBottom}>
          <span>{footerCopyrightText}</span>
          <span>Made with care in India for a stronger workforce.</span>
        </div>
      </footer>
      <FloatingWhatsApp isRozgarRoute isRozgarHomeRoute />
    </div>
  )
}
