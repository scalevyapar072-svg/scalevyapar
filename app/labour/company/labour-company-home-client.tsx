'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  industryCategories: string[]
  companyPlans: PlanOption[]
  stats: {
    activeCompanies: number
    activeWorkers: number
    liveJobs: number
    totalJobs: number
    industriesCovered: number
  }
}

const socialLabels = ['LinkedIn', 'Instagram', 'Facebook']
const cityOptions = ['All Cities', 'Surat', 'Ahmedabad', 'Jaipur', 'Mumbai']

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

export function LabourCompanyHomeClient({ content, industryCategories, companyPlans, stats }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showPricingLink = companyPlans.length > 0

  const jobPostHref = '/labour/company/job-post'
  const registrationHref = '/labour/company/company-registration'
  const searchHref = '/labour/company/search'
  const loginHref = '/labour/company/signin'
  const panelHref = '/labour/company/panel'
  const workerJoinHref = content.home.workerCta.buttonHref || '/labour'

  const categorySearchOptions = useMemo(() => {
    const dynamicCategories = content.home.categories.cards
      .map(card => card.title.trim())
      .filter(Boolean)
      .filter(title => title.toLowerCase() !== 'all categories')

    return [content.home.searchBar.categoryLabel || 'All Categories', ...dynamicCategories]
  }, [content.home.categories.cards, content.home.searchBar.categoryLabel])

  const industrySearchOptions = useMemo(() => {
    const dynamicIndustries = industryCategories
      .map(item => item.trim())
      .filter(Boolean)

    return ['All Industry Categories', ...dynamicIndustries]
  }, [industryCategories])

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

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveHeroSlide(current => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [heroSlides.length])

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

  const headerNav = [
    { label: 'Home', href: '/labour/company', isLink: true },
    { label: 'About Us', href: '/labour/company/about', isLink: true },
    ...(showPricingLink ? [{ label: 'Pricing', href: '/labour/company/pricing', isLink: true }] : []),
    { label: 'Search Worker', href: '/labour/company/search', isLink: true },
    { label: 'Company Panel', href: panelHref, isLink: true },
    { label: 'Contact Us', href: '/labour/company/contact', isLink: true }
  ]

  return (
    <div className={styles.homeLandingPage}>
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
            {headerNav.map(item =>
              item.isLink ? (
                <Link key={item.href} href={item.href} className={styles.homeLandingNavLink}>
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={item.href} className={styles.homeLandingNavLink}>
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className={styles.homeLandingHeaderButtons}>
            <Link href={content.header.primaryCtaHref || jobPostHref} className={styles.homeHeaderPrimaryButton}>
              {content.header.primaryCtaLabel || 'Post a Job'}
            </Link>
            <Link href={registrationHref} className={styles.homeHeaderSecondaryButton}>
              Register Company
            </Link>
            <Link href={loginHref} className={styles.homeHeaderGhostButton}>
              Login
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
            {headerNav.map(item =>
              item.isLink ? (
                <Link key={`${item.href}-mobile`} href={item.href} className={styles.homeLandingNavLink}>
                  {item.label}
                </Link>
              ) : (
                <a key={`${item.href}-mobile`} href={item.href} className={styles.homeLandingNavLink}>
                  {item.label}
                </a>
              )
            )}
          </div>
          <div className={styles.homeLandingNavUtilities}>
            <Link href={searchHref} className={styles.homeHeaderDashboardButton}>
              Find Workers
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
                href={content.home.hero.primaryCtaHref || jobPostHref}
                className={`${styles.homeHeroPrimaryButton} ${styles.homeHeroAnimatedButton}`}
              >
                {content.home.hero.primaryCtaLabel}
              </Link>
              <Link
                href={content.home.hero.secondaryCtaHref || searchHref}
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
            <form action={searchHref} method="get" className={styles.homeSearchBar}>
              <div className={styles.homeSearchFieldLarge}>
                <Search size={18} />
                <input
                  type="text"
                  name="q"
                  placeholder={content.home.searchBar.placeholder}
                  className={styles.homeSearchInput}
                />
              </div>

              <div className={styles.homeSearchField}>
                <select name="industryCategory" className={styles.homeSearchSelect} defaultValue="All Industry Categories">
                  {industrySearchOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className={styles.homeSearchField}>
                <select name="category" className={styles.homeSearchSelect} defaultValue={content.home.searchBar.categoryLabel}>
                  {categorySearchOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className={styles.homeSearchField}>
                <select name="city" className={styles.homeSearchSelect} defaultValue={content.home.searchBar.cityLabel}>
                  {[content.home.searchBar.cityLabel, ...cityOptions.filter(option => option !== content.home.searchBar.cityLabel)].map(option => (
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

          <div className={styles.homeCategoryGrid}>
            {categoryCards.map((category, index) => {
              const Icon = resolveIcon(category.icon, [Hammer, Factory, PackageCheck, Truck, Wrench, Sparkles][index] || Sparkles)
              return (
                <Link key={`${category.title}-${index}`} href={category.href || searchHref} className={styles.homeCategoryCard}>
                  <span className={styles.homeCategoryIconWrap}>
                    <Icon size={20} />
                  </span>
                  <h3>{category.title}</h3>
                  <p>{category.subtitle}</p>
                </Link>
              )
            })}
          </div>

          <div className={styles.homeCategoryCtaRow}>
            <Link href={content.home.categories.buttonHref || searchHref} className={styles.homeCategoryCtaButton}>
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
              <Link href={content.home.finalCta.buttonHref || jobPostHref} className={styles.homeCompanyBannerPrimary}>
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

          <div className={styles.homeTestimonialsGrid}>
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
              {showPricingLink ? <Link href="/labour/company/pricing">Pricing</Link> : null}
              <Link href="/labour/company/search">Search Worker</Link>
              <Link href="/labour/company/contact">Contact Us</Link>
            </div>
          </div>

          <div>
            <h4 className={styles.homeFooterTitle}>For Companies</h4>
            <div className={styles.homeFooterLinks}>
              <Link href={jobPostHref}>Post a Job</Link>
              <Link href={registrationHref}>Register Company</Link>
              <Link href={panelHref}>Company Portal</Link>
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
    </div>
  )
}
