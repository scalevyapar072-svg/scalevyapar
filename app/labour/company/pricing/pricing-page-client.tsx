'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from 'lucide-react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import styles from '../company-site.module.css'

const iconMap = {
  badge: BadgeCheck,
  briefcase: BriefcaseBusiness,
  building: Building2,
  clipboard: ClipboardList,
  clock: Clock3,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users
} as const

function resolveIcon(name: string, fallback: typeof ShieldCheck) {
  return iconMap[name as keyof typeof iconMap] || fallback
}

function PricingTableValue({ value }: { value: string }) {
  if (/^yes$/i.test(value)) {
    return <span className={styles.pricingCompareStatusYes}><Check size={16} /> Yes</span>
  }

  if (/^no$/i.test(value)) {
    return <span className={styles.pricingCompareStatusNo}><X size={16} /> No</span>
  }

  return <span>{value}</span>
}

export function PricingPageClient({ content }: { content: LabourCompanyWebsiteContent['pricingPage'] }) {
  const [billingMode, setBillingMode] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <div className={styles.pricingPage}>
      <section className={styles.pricingHeroSection}>
        <div className={styles.pricingHeroGlow} />
        <div className={styles.pricingHeroInner}>
          <p className={styles.pricingHeroEyebrow}>{content.eyebrow}</p>
          <h1 className={styles.pricingHeroTitle}>{content.title}</h1>
          <p className={styles.pricingHeroText}>{content.subtitle}</p>
        </div>
      </section>

      <section className={styles.pricingBenefitsBar}>
        {content.benefits.map((item, index) => {
          const Icon = resolveIcon(item.icon, ShieldCheck)
          return (
            <article key={`${item.title}-${index}`} className={styles.pricingBenefitItem}>
              <span className={styles.pricingBenefitIcon}>
                <Icon size={18} />
              </span>
              <div className={styles.pricingBenefitCopy}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </article>
          )
        })}
      </section>

      <section className={styles.pricingBillingRow}>
        <div className={styles.pricingBillingToggle}>
          <button
            type="button"
            className={`${styles.pricingBillingOption} ${billingMode === 'monthly' ? styles.pricingBillingOptionActive : ''}`}
            onClick={() => setBillingMode('monthly')}
          >
            {content.billing.monthlyLabel}
          </button>
          <button
            type="button"
            className={`${styles.pricingBillingOption} ${billingMode === 'yearly' ? styles.pricingBillingOptionActive : ''}`}
            onClick={() => setBillingMode('yearly')}
          >
            {content.billing.yearlyLabel}
          </button>
          <span className={styles.pricingBillingSavings}>{content.billing.savingsLabel}</span>
        </div>
        <span className={styles.pricingCurrencyNote}>{content.billing.currencyNote}</span>
      </section>

      <section className={styles.pricingPlansGrid}>
        {content.plans.map((plan, index) => {
          const showYearly = billingMode === 'yearly'
          const displayedPrice = showYearly ? plan.yearlyPrice : plan.monthlyPrice
          const displayedSuffix = showYearly ? plan.yearlySuffix : plan.monthlySuffix
          const isFeatured = Boolean(plan.badge)

          return (
            <article
              key={`${plan.name}-${index}`}
              className={`${styles.pricingPlanCard} ${isFeatured ? styles.pricingPlanCardFeatured : ''}`}
            >
              {isFeatured ? <span className={styles.pricingPlanBadge}>{plan.badge}</span> : null}
              <div className={styles.pricingPlanTop}>
                <h2>{plan.name}</h2>
                <p>{plan.subtitle}</p>
              </div>
              <div className={styles.pricingPlanPriceWrap}>
                <strong>{displayedPrice}</strong>
                <span>{displayedSuffix}</span>
              </div>
              <Link href={plan.buttonHref} className={styles.pricingPlanButton}>
                {plan.buttonLabel}
              </Link>
              <div className={styles.pricingPlanFeatures}>
                {plan.features.map(feature => (
                  <div key={feature} className={styles.pricingPlanFeature}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <section className={styles.pricingCompareSection}>
        <div className={styles.pricingSectionIntro}>
          <h2 className={styles.pricingSectionTitle}>{content.compareTitle}</h2>
        </div>
        <div className={styles.pricingCompareScroller}>
          <table className={styles.pricingCompareTable}>
            <thead>
              <tr>
                <th>Features</th>
                <th>
                  <span>{content.plans[0]?.name || 'Starter'}</span>
                  <small>{content.plans[0]?.monthlyPrice || '₹499'} /month</small>
                </th>
                <th>
                  <span>{content.plans[1]?.name || 'Professional'}</span>
                  <small>{content.plans[1]?.monthlyPrice || '₹999'} /month</small>
                </th>
                <th>
                  <span>{content.plans[2]?.name || 'Enterprise'}</span>
                  <small>{content.plans[2]?.monthlyPrice || '₹1,999'} /month</small>
                </th>
              </tr>
            </thead>
            <tbody>
              {content.compareRows.map((row, index) => {
                const Icon = resolveIcon(row.icon, ClipboardList)
                return (
                  <tr key={`${row.feature}-${index}`}>
                    <td>
                      <div className={styles.pricingCompareFeature}>
                        <Icon size={16} />
                        <span>{row.feature}</span>
                      </div>
                    </td>
                    <td><PricingTableValue value={row.starter} /></td>
                    <td><PricingTableValue value={row.professional} /></td>
                    <td><PricingTableValue value={row.enterprise} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.pricingFaqSection}>
        <div className={styles.pricingSectionIntro}>
          <h2 className={styles.pricingSectionTitle}>{content.faqTitle}</h2>
        </div>
        <div className={styles.pricingFaqGrid}>
          {content.faqs.map((item, index) => {
            const open = openFaqIndex === index
            return (
              <article key={`${item.question}-${index}`} className={styles.pricingFaqCard}>
                <button
                  type="button"
                  className={styles.pricingFaqButton}
                  onClick={() => setOpenFaqIndex(current => current === index ? null : index)}
                  aria-expanded={open}
                >
                  <span>{item.question}</span>
                  {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {open ? <p className={styles.pricingFaqAnswer}>{item.answer}</p> : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.pricingFinalCta}>
        <div className={styles.pricingFinalCtaCopy}>
          <h2>{content.finalCta.title}</h2>
          <p>{content.finalCta.subtitle}</p>
        </div>
        <div className={styles.pricingFinalCtaButtons}>
          <Link href={content.finalCta.primaryCtaHref} className={styles.homeHeaderSecondaryButton}>
            {content.finalCta.primaryCtaLabel}
          </Link>
          <Link href={content.finalCta.secondaryCtaHref} className={styles.homeHeaderGhostButton}>
            {content.finalCta.secondaryCtaLabel}
          </Link>
        </div>
      </section>
    </div>
  )
}
