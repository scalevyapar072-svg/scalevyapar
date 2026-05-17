import Link from 'next/link'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import type { MainWebsiteComparisonRow, MainWebsiteContent, MainWebsitePlan } from '@/lib/main-website-content'
import styles from './main-website-home.module.css'

const isPositive = (value: string) => /^(yes|true|included|available)$/i.test(value.trim())
const isNegative = (value: string) => /^(no|false|not included)$/i.test(value.trim())

const enabledPlans = (plans: MainWebsitePlan[]) => plans.filter(plan => plan.enabled)
const enabledComparisonRows = (rows: MainWebsiteComparisonRow[]) => rows.filter(row => row.enabled)

export default function MainWebsiteHome({ content }: { content: MainWebsiteContent }) {
  const theme = content.theme
  const services = content.home.serviceCards.filter(card => card.enabled)
  const features = content.home.featureCards.filter(card => card.enabled)
  const processSteps = content.home.processSteps.filter(step => step.enabled)
  const testimonials = content.home.testimonials.filter(item => item.enabled)
  const productCards = content.home.productCards.filter(item => item.enabled)
  const stats = content.home.stats.filter(item => item.enabled)
  const plans = enabledPlans(content.pricing.plans).slice(0, 3)
  const comparisonRows = enabledComparisonRows(content.home.comparisonRows)
  const heroShowcaseCards = services.slice(0, 4)

  return (
    <main
      className={styles.page}
      style={{
        ['--mw-primary' as string]: theme.primaryColor,
        ['--mw-secondary' as string]: theme.secondaryColor,
        ['--mw-accent' as string]: theme.accentColor,
        ['--mw-dark' as string]: theme.darkBackgroundColor,
        ['--mw-light' as string]: theme.lightBackgroundColor,
        ['--mw-surface' as string]: theme.backgroundColor,
        ['--mw-text' as string]: theme.textColor,
        ['--mw-muted' as string]: theme.mutedTextColor,
        ['--mw-radius' as string]: theme.borderRadius || '20px'
      }}
    >
      <section className={styles.heroSection}>
        <div className={styles.heroGlowOne} />
        <div className={styles.heroGlowTwo} />
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}>{content.home.heroEyebrow}</span>
              <h1 className={styles.heroTitle}>
                {content.home.heroTitle}{' '}
                <span>{content.home.heroHighlightedText}</span>
              </h1>
              <p className={styles.heroDescription}>{content.home.heroDescription}</p>
              <div className={styles.heroActions}>
                <Link href={content.home.heroPrimaryButton.href} className={styles.primaryButton}>
                  {content.home.heroPrimaryButton.label}
                </Link>
                <Link href={content.home.heroSecondaryButton.href} className={styles.secondaryButton}>
                  {content.home.heroSecondaryButton.label}
                </Link>
              </div>
              <div className={styles.heroBadgeRow}>
                {content.home.heroBadges.map(badge => (
                  <span key={badge} className={styles.heroBadge}>
                    {badge}
                  </span>
                ))}
              </div>
              <div className={styles.heroStats}>
                {stats.slice(0, 3).map(stat => (
                  <div key={`${stat.label}-${stat.value}`} className={styles.heroStatCard}>
                    <p className={styles.heroStatValue}>{stat.value}</p>
                    <p className={styles.heroStatLabel}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroVisualWrap}>
              <div className={styles.heroVisualSurface}>
                {content.home.heroDesktopImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={content.home.heroDesktopImage} alt={content.home.heroTitle} className={styles.heroVisualImage} />
                ) : null}
              </div>
              <div className={styles.heroFloatingGrid}>
                {heroShowcaseCards.map(card => (
                  <div key={card.title} className={styles.heroFloatingCard}>
                    <div className={styles.heroFloatingIcon}>{card.icon || card.title.slice(0, 1)}</div>
                    <div>
                      <p className={styles.heroFloatingTitle}>{card.title}</p>
                      <p className={styles.heroFloatingText}>{card.badge || card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statsBand}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <AnimateOnScroll key={`stat-${stat.label}`} direction="up" delay={index * 80}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>{stat.icon || '•'}</div>
                  <h2 className={styles.statValue}>{stat.value}</h2>
                  <p className={styles.statLabel}>{stat.label}</p>
                  {stat.description ? <p className={styles.statDescription}>{stat.description}</p> : null}
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.lightSection}>
        <div className={styles.container}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Our Tools</span>
              <h2 className={styles.sectionTitle}>{content.home.servicesTitle}</h2>
              <p className={styles.sectionSubtitle}>{content.home.servicesDescription}</p>
            </div>
          </AnimateOnScroll>
          <div className={styles.toolGrid}>
            {services.map((card, index) => (
              <AnimateOnScroll key={card.title} direction="up" delay={index * 90}>
                <article className={styles.toolCard}>
                  <div className={styles.toolIcon}>{card.icon || card.title.slice(0, 1)}</div>
                  <h3 className={styles.toolTitle}>{card.title}</h3>
                  {card.badge ? <span className={styles.toolBadge}>{card.badge}</span> : null}
                  <p className={styles.toolDescription}>{card.description}</p>
                  <div className={styles.toolBullets}>
                    {card.bullets.map(bullet => (
                      <div key={bullet} className={styles.toolBullet}>
                        <span className={styles.toolBulletDot}>✓</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                  {card.href ? (
                    <Link href={card.href} className={styles.toolLink}>
                      {card.buttonLabel || 'Learn More'}
                    </Link>
                  ) : null}
                </article>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.surfaceSection}>
        <div className={styles.container}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>See It In Action</span>
              <h2 className={styles.sectionTitle}>{content.home.productTitle}</h2>
              <p className={styles.sectionSubtitle}>{content.home.productDescription}</p>
            </div>
          </AnimateOnScroll>
          <div className={styles.previewStack}>
            {productCards.map((card, index) => (
              <AnimateOnScroll key={card.name} direction={index % 2 === 0 ? 'left' : 'right'}>
                <div className={`${styles.previewRow} ${index % 2 === 1 ? styles.previewRowReverse : ''}`}>
                  <div className={styles.previewText}>
                    <div className={styles.previewIcon}>{card.icon || card.name.slice(0, 1)}</div>
                    <span className={styles.previewTag}>{card.name}</span>
                    <h3 className={styles.previewTitle}>{card.tagline}</h3>
                    <p className={styles.previewDescription}>{card.description}</p>
                    <Link href={card.ctaHref} className={styles.primaryButton}>
                      {card.ctaLabel}
                    </Link>
                  </div>
                  <div className={styles.previewShell}>
                    <div className={styles.previewChrome}>
                      <span />
                      <span />
                      <span />
                    </div>
                    {card.isPhoto ? (
                      <div className={styles.photoPreview}>
                        <div className={styles.photoCompare}>
                          <div className={styles.photoBox}>
                            <strong>Product</strong>
                            <span>Raw upload</span>
                          </div>
                          <div className={styles.photoArrow}>→</div>
                          <div className={styles.photoBox}>
                            <strong>AI Output</strong>
                            <span>Styled creative</span>
                          </div>
                        </div>
                        <div className={styles.photoTags}>
                          {card.photoTags.map(tag => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.previewRows}>
                        {card.mockRows.map(row => (
                          <div key={`${card.name}-${row.label}`} className={styles.previewMetricRow}>
                            <span>{row.label}</span>
                            <strong>{row.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.surfaceSection}>
        <div className={styles.container}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>How It Works</span>
              <h2 className={styles.sectionTitle}>{content.home.processTitle}</h2>
              <p className={styles.sectionSubtitle}>{content.home.processDescription}</p>
            </div>
          </AnimateOnScroll>
          <div className={styles.stepsGrid}>
            {processSteps.map((step, index) => (
              <AnimateOnScroll key={step.title} direction="up" delay={index * 110}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>{step.icon || step.step}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.container}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTagAlt}>Why ScaleVyapar</span>
              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleAlt}`}>{content.home.featuresTitle}</h2>
              <p className={`${styles.sectionSubtitle} ${styles.sectionSubtitleAlt}`}>{content.home.featuresDescription}</p>
            </div>
          </AnimateOnScroll>
          <div className={styles.featureGrid}>
            {features.map((card, index) => (
              <AnimateOnScroll key={card.title} direction="up" delay={index * 90}>
                <article className={styles.featureCard}>
                  <div className={styles.featureIcon}>{card.icon || card.title.slice(0, 1)}</div>
                  <h3 className={styles.featureTitle}>{card.title}</h3>
                  <p className={styles.featureDescription}>{card.description}</p>
                </article>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {content.home.pricingEnabled && plans.length ? (
        <section className={styles.lightSection}>
          <div className={styles.container}>
            <AnimateOnScroll direction="up">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>{content.home.pricingEyebrow}</span>
                <h2 className={styles.sectionTitle}>{content.home.pricingTitle}</h2>
                <p className={styles.sectionSubtitle}>{content.home.pricingDescription}</p>
              </div>
            </AnimateOnScroll>
            <div className={styles.planGrid}>
              {plans.map((plan, index) => (
                <AnimateOnScroll key={plan.name} direction="up" delay={index * 100}>
                  <article className={styles.planCard}>
                    {plan.badge ? <span className={styles.planBadge}>{plan.badge}</span> : null}
                    <h3 className={styles.planTitle}>{plan.name}</h3>
                    <div className={styles.planPriceWrap}>
                      <span className={styles.planPrice}>{plan.price}</span>
                      <span className={styles.planCadence}>{plan.cadence}</span>
                    </div>
                    <p className={styles.planDescription}>{plan.description}</p>
                    <div className={styles.planFeatures}>
                      {plan.features.map(feature => (
                        <div key={`${plan.name}-${feature}`} className={styles.planFeature}>
                          <span>✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={plan.buttonHref} className={styles.planButton}>
                      {plan.buttonLabel}
                    </Link>
                  </article>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.surfaceSection}>
        <div className={styles.container}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Testimonials</span>
              <h2 className={styles.sectionTitle}>{content.home.testimonialsTitle}</h2>
              <p className={styles.sectionSubtitle}>{content.home.testimonialsDescription}</p>
            </div>
          </AnimateOnScroll>
          <div className={styles.testimonialGrid}>
            {testimonials.map((item, index) => (
              <AnimateOnScroll key={`${item.name}-${item.business}`} direction="up" delay={index * 70}>
                <article className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>{'★'.repeat(Math.max(1, item.rating || 5))}</div>
                  <p className={styles.testimonialQuote}>&quot;{item.quote}&quot;</p>
                  <div className={styles.testimonialMeta}>
                    <div className={styles.testimonialAvatar}>{item.avatar || item.name.slice(0, 1)}</div>
                    <div>
                      <p className={styles.testimonialName}>{item.name}</p>
                      <p className={styles.testimonialBusiness}>{item.business}</p>
                    </div>
                  </div>
                </article>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.lightSection}>
        <div className={styles.containerSlim}>
          <AnimateOnScroll direction="up">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Why Choose Us</span>
              <h2 className={styles.sectionTitle}>{content.home.comparisonTitle}</h2>
              <p className={styles.sectionSubtitle}>{content.home.comparisonDescription}</p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll direction="up" delay={180}>
            <div className={styles.comparisonTableWrap}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>{content.home.comparisonLeftLabel}</th>
                    <th>{content.home.comparisonRightLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(row => (
                    <tr key={row.title}>
                      <td>{row.title}</td>
                      <td>{renderComparisonValue(row.scaleVyaparValue)}</td>
                      <td>{renderComparisonValue(row.otherValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.comparisonFooter}>
              <p>{content.home.comparisonCtaText}</p>
              <Link href={content.home.comparisonCtaButton.href} className={styles.whatsAppButton}>
                {content.home.comparisonCtaButton.label}
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {content.home.ctaEnabled ? (
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <AnimateOnScroll direction="up">
              <div
                className={styles.ctaCard}
                style={{
                  background: content.home.ctaBackgroundImage
                    ? `linear-gradient(135deg, rgba(27, 39, 53, 0.92), rgba(55, 70, 85, 0.94)), url(${content.home.ctaBackgroundImage}) center/cover`
                    : content.home.ctaBackgroundColor
                }}
              >
                <span className={styles.ctaEyebrow}>{content.home.ctaEyebrow}</span>
                <h2 className={styles.ctaTitle}>{content.home.ctaTitle}</h2>
                <p className={styles.ctaDescription}>{content.home.ctaDescription}</p>
                <div className={styles.ctaActions}>
                  <Link href={content.home.ctaPrimaryButton.href} className={styles.ctaPrimaryButton}>
                    {content.home.ctaPrimaryButton.label}
                  </Link>
                  <Link href={content.home.ctaSecondaryButton.href} className={styles.ctaSecondaryButton}>
                    {content.home.ctaSecondaryButton.label}
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      ) : null}
    </main>
  )
}

function renderComparisonValue(value: string) {
  if (isPositive(value)) {
    return <span className={styles.comparisonYes}>✓</span>
  }

  if (isNegative(value)) {
    return <span className={styles.comparisonNo}>✕</span>
  }

  return <span className={styles.comparisonText}>{value}</span>
}
