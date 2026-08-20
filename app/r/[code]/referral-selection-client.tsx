'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  ChevronRight,
  Factory,
  Globe,
  Grid2x2,
  Search,
  Scissors,
  Settings2,
  ShieldCheck,
  Shirt,
  Sparkles,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { getAgentCategoryDisplayName } from '@/app/labour/agent/_lib/agent-category-labels'
import styles from './public-referral.module.css'

type ReferralCategory = {
  slug: string
  name: string
  rewardAmount: number
}

type ReferralLocale = 'en' | 'hi'

const SEARCH_VISIBLE_COUNT = 8

const copy = {
  en: {
    english: 'English',
    hindi: 'हिंदी',
    invitedHeading: 'You have been invited to join',
    invitedSubtitle: 'Choose the category that matches your work skill.',
    invitedBy: 'Invited by',
    chooseCategory: 'Choose your work category',
    chooseCategorySubtitle:
      'Select the category that matches your work skill and find the right opportunities.',
    searchPlaceholder: 'Search your work category...',
    searchButton: 'Search',
    noSearchResults:
      'No matching category found in this referral. Try another skill keyword from the available eligible categories.',
    supportTitle: 'Rozgar - The right platform for your skill',
    supportSubtitle: 'We are always ready to connect you with the right work.',
    showMore: 'Show More',
    showLess: 'Show Less',
    heroSupport: 'Better opportunities for your skill, better future for you.',
  },
  hi: {
    english: 'English',
    hindi: 'हिंदी',
    invitedHeading: 'आपको Rozgar से जुड़ने के लिए आमंत्रित किया गया है',
    invitedSubtitle: 'अपने काम के अनुसार श्रेणी चुनें।',
    invitedBy: 'आमंत्रित किया गया',
    chooseCategory: 'अपनी कार्य श्रेणी चुनें',
    chooseCategorySubtitle: 'अपने हुनर से मेल खाने वाली श्रेणी चुनें और सही अवसर तक पहुँचें।',
    searchPlaceholder: 'अपनी काम की श्रेणी खोजें...',
    searchButton: 'खोजें',
    noSearchResults: 'इस रेफरल में आपकी खोज से मेल खाने वाली श्रेणी नहीं मिली। कोई दूसरा कौशल शब्द आज़माएँ।',
    supportTitle: 'Rozgar - आपके हुनर का सही मंच',
    supportSubtitle: 'हम आपको सही काम से जोड़ने के लिए हमेशा तैयार हैं।',
    showMore: 'और दिखाएँ',
    showLess: 'कम दिखाएँ',
    heroSupport: 'रोजगार के बेहतर अवसर, आपके हुनर के साथ।',
  },
} as const

function formatAgentDisplayName(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function normalizeValue(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getCategoryDisplay(categoryName: string, locale: ReferralLocale) {
  const english = categoryName
  const hindi = getAgentCategoryDisplayName(categoryName, 'hi')
  const hasHindi = normalizeValue(hindi) !== normalizeValue(english)

  if (locale === 'hi') {
    return {
      primary: hindi,
      secondary: hasHindi ? english : '',
    }
  }

  return {
    primary: english,
    secondary: hasHindi ? hindi : '',
  }
}

function getCategoryIcon(categoryName: string): LucideIcon {
  const value = normalizeValue(categoryName)

  if (value.includes('cutting')) return Scissors
  if (value.includes('stitch') || value.includes('tailor')) return Shirt
  if (value.includes('embroidery') || value.includes('aari') || value.includes('zari')) return Sparkles
  if (value.includes('press') || value.includes('iron')) return BriefcaseBusiness
  if (value.includes('helper') || value.includes('assistant')) return Wrench
  if (value.includes('machine') || value.includes('operator') || value.includes('overlock')) return Settings2
  if (value.includes('dye') || value.includes('fabric')) return Factory
  if (value.includes('contractor') || value.includes('manager') || value.includes('office')) return BriefcaseBusiness
  if (value.includes('other')) return Grid2x2
  return ShieldCheck
}

function buildRozgarAppLinkUrl(referralCode: string, categorySlug: string) {
  const params = new URLSearchParams({
    ref: String(referralCode || '').trim().toUpperCase(),
    cat: String(categorySlug || '').trim().toLowerCase(),
  })

  return `/app/referral?${params.toString()}`
}

export default function ReferralSelectionClient({
  referralCode,
  invitedBy,
  categories,
}: {
  referralCode: string
  invitedBy: string
  categories: ReferralCategory[]
}) {
  const [locale, setLocale] = useState<ReferralLocale>('en')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(SEARCH_VISIBLE_COUNT)
  const ui = copy[locale]
  const displayAgentName = useMemo(() => formatAgentDisplayName(invitedBy), [invitedBy])

  const filteredCategories = useMemo(() => {
    const query = normalizeValue(searchQuery)
    if (!query) {
      return categories
    }

    return categories.filter(category => {
      const english = normalizeValue(category.name)
      const hindi = normalizeValue(getAgentCategoryDisplayName(category.name, 'hi'))
      return english.includes(query) || hindi.includes(query)
    })
  }, [categories, searchQuery])

  const visibleCategories = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredCategories
    }

    return filteredCategories.slice(0, visibleCount)
  }, [filteredCategories, searchQuery, visibleCount])

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.surface}>
          <header className={styles.header}>
            <Link href="/labour/company" className={styles.headerLogoLink}>
              <Image
                src="/images/agent-ui/agent-header-logo.png"
                alt="Rozgar by ScaleVyapar"
                width={493}
                height={119}
                priority
                className={styles.headerLogoImage}
              />
            </Link>

            <div className={styles.languageToggle} aria-label="Referral language switch">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`${styles.languageButton} ${
                  locale === 'en' ? `${styles.languageButtonActive} ${styles.languageButtonEnglishActive}` : ''
                }`}
              >
                <Globe className={styles.languageIcon} size={20} aria-hidden="true" />
                <span>{copy.en.english}</span>
              </button>
              <button
                type="button"
                onClick={() => setLocale('hi')}
                className={`${styles.languageButton} ${
                  locale === 'hi' ? `${styles.languageButtonActive} ${styles.languageButtonHindiActive}` : ''
                }`}
              >
                <span>{copy.hi.hindi}</span>
              </button>
            </div>
          </header>

          <div className={styles.content}>
            <section className={styles.intro}>
              <h1 className={styles.introTitle}>
                {ui.invitedHeading}
                <span className={styles.introTitleAccent}>Rozgar</span>
              </h1>
              <p className={styles.introSubtitle}>{ui.invitedSubtitle}</p>
            </section>

            <section className={styles.hero}>
              <div className={styles.heroInfo}>
                <div className={styles.heroInviteRow}>
                  <span className={styles.heroInviteIcon}>
                    <UserRound size={20} aria-hidden="true" />
                  </span>
                  <span>{ui.invitedBy}</span>
                </div>
                <h2 className={styles.heroAgentName}>{displayAgentName}</h2>
                <div className={styles.heroAccentBar} />
                <p className={styles.heroSupportCopy}>{ui.heroSupport}</p>
              </div>

              <div className={styles.heroMedia}>
                <Image
                  src="/images/referral/public-referral-hero-workers.png"
                  alt="Rozgar workers greeting each other in a garment factory"
                  fill
                  priority
                  sizes="(max-width: 719px) 100vw, 60vw"
                  className={styles.heroImage}
                />
              </div>
            </section>

            <section className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap} aria-hidden="true">
                <BriefcaseBusiness size={30} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h2 className={styles.sectionTitle}>{ui.chooseCategory}</h2>
                <p className={styles.sectionSubtitle}>{ui.chooseCategorySubtitle}</p>
              </div>
            </section>

            <form className={styles.searchForm} onSubmit={event => event.preventDefault()}>
              <div className={styles.searchFieldWrap}>
                <Search className={styles.searchIcon} size={22} aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => {
                    setSearchQuery(event.target.value)
                    setVisibleCount(SEARCH_VISIBLE_COUNT)
                  }}
                  placeholder={ui.searchPlaceholder}
                  className={styles.searchInput}
                  aria-label={ui.searchPlaceholder}
                />
              </div>
              <button type="submit" className={styles.searchButton}>
                <Search size={20} aria-hidden="true" />
                {ui.searchButton}
              </button>
            </form>

            {visibleCategories.length ? (
              <div className={styles.categoriesGrid}>
                {visibleCategories.map(category => {
                  const Icon = getCategoryIcon(category.name)
                  const display = getCategoryDisplay(category.name, locale)
                  const appLinkUrl = buildRozgarAppLinkUrl(referralCode, category.slug)

                  return (
                    <a
                      key={category.slug}
                      href={appLinkUrl}
                      className={styles.categoryCard}
                      aria-label={`${display.primary} ${display.secondary}`.trim()}
                    >
                      <span className={styles.categoryCardContent}>
                        <span className={styles.categoryIconWrap} aria-hidden="true">
                          <Icon size={30} />
                        </span>
                        <span className={styles.categoryText}>
                          <strong className={styles.categoryNamePrimary}>{display.primary}</strong>
                          {display.secondary ? (
                            <span className={styles.categoryNameSecondary}>{display.secondary}</span>
                          ) : null}
                        </span>
                      </span>
                      <ChevronRight className={styles.categoryChevron} size={22} aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>{ui.noSearchResults}</div>
            )}

            {!searchQuery.trim() && filteredCategories.length > SEARCH_VISIBLE_COUNT ? (
              <div className={styles.showMoreRow}>
                {visibleCount < filteredCategories.length ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setVisibleCount(current => Math.min(current + SEARCH_VISIBLE_COUNT, filteredCategories.length))}
                  >
                    {ui.showMore}
                  </button>
                ) : null}
                {visibleCount > SEARCH_VISIBLE_COUNT ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setVisibleCount(SEARCH_VISIBLE_COUNT)}
                  >
                    {ui.showLess}
                  </button>
                ) : null}
              </div>
            ) : null}

            <section className={styles.supportBanner}>
              <div className={styles.supportIconWrap} aria-hidden="true">
                <ShieldCheck size={32} />
              </div>
              <div className={styles.supportText}>
                <h3 className={styles.supportTitle}>{ui.supportTitle}</h3>
                <p className={styles.supportSubtitle}>{ui.supportSubtitle}</p>
              </div>
              <div className={styles.supportImageWrap}>
                <Image
                  src="/images/referral/public-referral-footer-workers.png"
                  alt="Rozgar workers illustration"
                  fill
                  sizes="220px"
                  className={styles.supportImage}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
