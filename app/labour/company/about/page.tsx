import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Factory,
  MessageSquareQuote,
  Search,
  Send,
  ShieldCheck,
  Target,
  Users
} from 'lucide-react'
import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const iconMap = {
  users: Users,
  building: Building2,
  briefcase: BriefcaseBusiness,
  factory: Factory,
  target: Target,
  eye: Eye,
  shield: ShieldCheck,
  send: Send,
  clipboard: ClipboardList,
  badge: BadgeCheck,
  clock: Clock3,
  search: Search
} as const

function resolveIcon(name: string, fallback: typeof Users) {
  return iconMap[name as keyof typeof iconMap] || fallback
}

function AboutHeroImage({ src, alt }: { src: string; alt: string }) {
  const isRemote = /^https?:\/\//i.test(src)

  return (
    <Image
      src={src}
      alt={alt}
      width={820}
      height={620}
      className={styles.aboutHeroImage}
      unoptimized={isRemote}
    />
  )
}

function renderHighlightedText(title: string, highlightedText: string, className: string) {
  if (!highlightedText || !title.includes(highlightedText)) {
    return title
  }

  const parts = title.split(highlightedText)
  return parts.reduce<ReactNode[]>((nodes, part, index) => {
    nodes.push(part)
    if (index < parts.length - 1) {
      nodes.push(
        <span key={`highlight-${index}`} className={className}>
          {highlightedText}
        </span>
      )
    }
    return nodes
  }, [])
}

export default async function LabourCompanyAboutPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const about = content.aboutPage
  const floatingIcons = [Building2, Users, Factory]

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/about">
      <div className={styles.aboutPage}>
        <nav className={styles.aboutBreadcrumb} aria-label="Breadcrumb">
          <Link href="/labour/company">Home</Link>
          <ChevronRight size={14} />
          <span>About Us</span>
        </nav>

        <section className={styles.aboutHeroSection}>
          <div className={styles.aboutHeroContent}>
            <p className={styles.aboutHeroEyebrow}>{about.hero.eyebrow}</p>
            <h1 className={styles.aboutHeroTitle}>
              {renderHighlightedText(about.hero.title, about.hero.highlightedText, styles.aboutHeroTitleHighlight)}
            </h1>
            <p className={styles.aboutHeroText}>{about.hero.subtitle}</p>

            <div className={styles.aboutHeroBulletList}>
              {about.hero.bulletPoints.map(point => (
                <div key={point} className={styles.aboutHeroBulletItem}>
                  <BadgeCheck size={18} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.aboutHeroMedia}>
            <div className={styles.aboutHeroImageFrame}>
              <AboutHeroImage src={about.hero.imageSrc} alt="Worker hiring team" />
            </div>

            <div className={styles.aboutHeroFloatingCard}>
              <h2>{about.hero.floatingCardTitle}</h2>
              <div className={styles.aboutHeroFloatingItems}>
                {about.hero.floatingCardItems.map((item, index) => {
                  const Icon = floatingIcons[index] || Users
                  return (
                    <div key={`${item}-${index}`} className={styles.aboutHeroFloatingItem}>
                      <span className={styles.aboutHeroFloatingIcon}>
                        <Icon size={18} />
                      </span>
                      <span>{item}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.aboutMissionGrid}>
          {about.missionCards.map((card, index) => {
            const Icon = resolveIcon(card.icon, [Target, Eye, ShieldCheck][index] || Target)
            return (
              <article key={`${card.title}-${index}`} className={styles.aboutMissionCard}>
                <span className={styles.aboutMissionIconWrap}>
                  <Icon size={20} />
                </span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </article>
            )
          })}
        </section>

        <section className={styles.aboutStatsBanner}>
          <div className={styles.aboutStatsGrid}>
            {about.stats.items.map((item, index) => {
              const Icon = resolveIcon(item.icon, [Users, Building2, BriefcaseBusiness, Factory][index] || Users)
              return (
                <div key={`${item.label}-${index}`} className={styles.aboutStatsItem}>
                  <span className={styles.aboutStatsIconWrap}>
                    <Icon size={20} />
                  </span>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.aboutSection}>
          <div className={styles.aboutSectionIntro}>
            <p className={styles.aboutSectionEyebrow}>{about.whyChoose.eyebrow}</p>
            <h2 className={styles.aboutSectionTitle}>{about.whyChoose.title}</h2>
          </div>

          <div className={styles.aboutWhyGrid}>
            {about.whyChoose.cards.map((card, index) => {
              const Icon = resolveIcon(card.icon, [Users, Send, ClipboardList, BadgeCheck, Clock3, ShieldCheck][index] || Users)
              return (
                <article key={`${card.title}-${index}`} className={styles.aboutWhyCard}>
                  <span className={styles.aboutWhyIconWrap}>
                    <Icon size={18} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className={styles.aboutSection}>
          <div className={styles.aboutSectionIntro}>
            <p className={styles.aboutSectionEyebrow}>{about.process.eyebrow}</p>
            <h2 className={styles.aboutSectionTitle}>{about.process.title}</h2>
          </div>

          <div className={styles.aboutProcessTimeline}>
            {about.process.steps.map((step, index) => {
              const Icon = resolveIcon(step.icon, [Building2, ClipboardList, Users, Search, BadgeCheck][index] || Building2)
              return (
                <article key={`${step.title}-${index}`} className={styles.aboutProcessCard}>
                  <span className={styles.aboutProcessDot}>
                    <Icon size={20} />
                  </span>
                  <h3>{`${index + 1}. ${step.title}`}</h3>
                  <p>{step.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className={styles.aboutSection}>
          <div className={styles.aboutSectionIntro}>
            <p className={styles.aboutSectionEyebrow}>{about.testimonials.eyebrow}</p>
            <h2 className={styles.aboutSectionTitle}>{about.testimonials.title}</h2>
          </div>

          <div className={styles.aboutTestimonialsGrid}>
            {about.testimonials.items.map((item, index) => (
              <article key={`${item.name}-${index}`} className={styles.aboutTestimonialCard}>
                <div className={styles.aboutTestimonialTop}>
                  <MessageSquareQuote size={20} />
                  <span className={styles.aboutStars}>{'★'.repeat(Number(item.rating || '5'))}</span>
                </div>
                <p className={styles.aboutTestimonialQuote}>{item.quote}</p>
                <div className={styles.aboutTestimonialMeta}>
                  <strong>{item.name}</strong>
                  <span>{item.role}, {item.company}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.aboutFinalCta}>
          <div className={styles.aboutFinalCtaCopy}>
            <h2>{about.finalCta.title}</h2>
            <p>{about.finalCta.subtitle}</p>
          </div>
          <div className={styles.aboutFinalCtaButtons}>
            <Link href={about.finalCta.primaryCtaHref} className={styles.homeHeaderSecondaryButton}>
              {about.finalCta.primaryCtaLabel}
            </Link>
            <Link href={about.finalCta.secondaryCtaHref} className={styles.homeHeaderGhostButton}>
              {about.finalCta.secondaryCtaLabel}
            </Link>
          </div>
        </section>
      </div>
    </CompanySiteShell>
  )
}
