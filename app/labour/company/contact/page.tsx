import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Users
} from 'lucide-react'
import { CompanySiteShell } from '../company-site-shell'
import { ContactFormClient } from './contact-form-client'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const featureIcons = [Headphones, ShieldCheck, Users] as const
const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', mark: 'f' },
  { key: 'twitter', label: 'Twitter / X', mark: 'x' },
  { key: 'linkedin', label: 'LinkedIn', mark: 'in' },
  { key: 'instagram', label: 'Instagram', mark: 'ig' }
] as const

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

function ContactHeroImage({ src }: { src: string }) {
  const isRemote = /^https?:\/\//i.test(src)

  return (
    <Image
      src={src}
      alt="Friendly customer support executive"
      width={880}
      height={720}
      className={styles.contactHeroImage}
      unoptimized={isRemote}
    />
  )
}

function ContactMapImage() {
  return (
    <Image
      src="/contact-map-surface.png"
      alt="ScaleVyapar office map location"
      width={1400}
      height={520}
      className={styles.contactMapImage}
    />
  )
}

export default async function LabourCompanyContactPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const contact = content.contactPage

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/contact">
      <div className={styles.contactPage}>
        <nav className={styles.contactBreadcrumb} aria-label="Breadcrumb">
          <Link href="/labour/company">Home</Link>
          <ChevronRight size={14} />
          <span>Contact Us</span>
        </nav>

        <section className={styles.contactHeroSection}>
          <div className={styles.contactHeroContent}>
            <p className={styles.contactHeroEyebrow}>{contact.eyebrow}</p>
            <h1 className={styles.contactHeroTitle}>
              {renderHighlightedText(contact.title, contact.highlightedText, styles.contactHeroTitleHighlight)}
            </h1>
            <p className={styles.contactHeroText}>{contact.subtitle}</p>

            <div className={styles.contactHeroFeatures}>
              {contact.featurePoints.map((item, index) => {
                const Icon = featureIcons[index] || Users
                return (
                  <article key={`${item.title}-${index}`} className={styles.contactHeroFeature}>
                    <span className={styles.contactHeroFeatureIcon}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <h2>{item.title}</h2>
                      <p>{item.description}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <div className={styles.contactHeroMedia}>
            <div className={styles.contactHeroDotPattern} aria-hidden="true" />
            <div className={styles.contactHeroImageFrame}>
              <ContactHeroImage src={contact.imageSrc} />
            </div>

            <div className={styles.contactHeroFloatingCard}>
              <h2>{contact.floatingCardTitle}</h2>
              <p>{contact.floatingCardDescription}</p>
              <div className={styles.contactHeroFloatingFooter}>
                <div className={styles.contactHeroFloatingFaces} aria-hidden="true">
                  <span>SV</span>
                  <span>HR</span>
                  <span>24</span>
                </div>
                <div className={styles.contactHeroFloatingStatus}>
                  <strong>{contact.floatingCardAvailabilityValue}</strong>
                  <span>{contact.floatingCardAvailabilityLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contactContentGrid}>
          <ContactFormClient
            title={contact.formTitle}
            subtitle={contact.formSubtitle}
            subjectOptions={contact.subjectOptions}
            buttonLabel={contact.formButtonLabel}
          />

          <aside className={styles.contactInfoCard}>
            <div className={styles.contactSectionHeading}>
              <h2>{contact.infoTitle}</h2>
              <p>{contact.infoSubtitle}</p>
            </div>

            <div className={styles.contactInfoStack}>
              <article className={styles.contactInfoItem}>
                <span className={styles.contactInfoIcon}>
                  <Phone size={18} />
                </span>
                <div>
                  <h3>{contact.phoneLabel}</h3>
                  <strong>{contact.phone}</strong>
                  <p>{contact.officeHours}</p>
                </div>
              </article>

              <article className={styles.contactInfoItem}>
                <span className={styles.contactInfoIcon}>
                  <Mail size={18} />
                </span>
                <div>
                  <h3>{contact.emailLabel}</h3>
                  <strong>{contact.supportEmail}</strong>
                  <p>{contact.emailResponseText}</p>
                  {contact.escalationEmail ? <small>Escalation: {contact.escalationEmail}</small> : null}
                </div>
              </article>

              <article className={styles.contactInfoItem}>
                <span className={styles.contactInfoIcon}>
                  <MapPin size={18} />
                </span>
                <div>
                  <h3>{contact.addressLabel}</h3>
                  <strong>{contact.address}</strong>
                </div>
              </article>

              <article className={styles.contactInfoItem}>
                <span className={styles.contactInfoIcon}>
                  <Share2 size={18} />
                </span>
                <div>
                  <h3>{contact.socialLabel}</h3>
                  <div className={styles.contactSocialRow}>
                    {socialPlatforms.map(platform => {
                      const href = contact.socialLinks[platform.key]

                      if (href) {
                        return (
                          <a
                            key={platform.key}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={platform.label}
                            className={styles.contactSocialButton}
                          >
                            <span>{platform.mark}</span>
                          </a>
                        )
                      }

                      return (
                        <span
                          key={platform.key}
                          aria-label={platform.label}
                          className={`${styles.contactSocialButton} ${styles.contactSocialButtonMuted}`}
                        >
                          <span>{platform.mark}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </article>
            </div>
          </aside>
        </section>

        <section className={styles.contactMapSection}>
          <div className={styles.contactMapFrame}>
            <ContactMapImage />
            <div className={styles.contactMapMarker} aria-hidden="true">
              <span className={styles.contactMapMarkerPin}>
                <MapPin size={16} />
              </span>
              <span className={styles.contactMapMarkerLabel}>ScaleVyapar</span>
            </div>
            <div className={styles.contactMapOverlayCard}>
              <h2>{contact.locationTitle}</h2>
              <p>{contact.locationDescription}</p>
              <a href={contact.directionsHref} className={styles.contactMapButton} target="_blank" rel="noreferrer">
                <ArrowRight size={16} />
                {contact.directionsLabel}
              </a>
            </div>
          </div>
        </section>

        <section className={styles.contactFaqSection}>
          <div className={styles.contactFaqIntro}>
            <h2>{contact.faqTitle}</h2>
          </div>
          <div className={styles.contactFaqGrid}>
            {contact.faqs.map((item, index) => (
              <details key={`${item.question}-${index}`} className={styles.contactFaqCard} open={index === 0}>
                <summary className={styles.contactFaqSummary}>
                  <span>{item.question}</span>
                  <span className={styles.contactFaqIcon}>
                    <Plus size={18} />
                  </span>
                </summary>
                <p className={styles.contactFaqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.contactCtaSection}>
          <div className={styles.contactCtaPanel}>
            <div className={styles.contactCtaCopy}>
              <span className={styles.contactCtaIconWrap}>
                <Users size={22} />
              </span>
              <div>
                <h2>{contact.finalCta.title}</h2>
                <p>{contact.finalCta.subtitle}</p>
              </div>
            </div>
            <div className={styles.contactCtaButtons}>
              <Link href={contact.finalCta.primaryCtaHref} className={styles.contactCtaPrimaryButton}>
                {contact.finalCta.primaryCtaLabel}
              </Link>
              <Link href={contact.finalCta.secondaryCtaHref} className={styles.contactCtaSecondaryButton}>
                {contact.finalCta.secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </CompanySiteShell>
  )
}
