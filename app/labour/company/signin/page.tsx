import Link from 'next/link'
import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanySigninFormClient } from './company-signin-form-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanySigninPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const signinContent = content.signinPage

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/signin">
      <section className={styles.signinHeroSection}>
        <div className={styles.signinHeroIntro}>
          <p className={styles.signinHeroEyebrow}>{signinContent.eyebrow}</p>
          <h1 className={styles.signinHeroTitle}>{signinContent.title}</h1>
          <p className={styles.signinHeroSubtitle}>{signinContent.subtitle}</p>

          <div className={styles.signinBenefitList}>
            {signinContent.benefits.map(item => (
              <div key={item} className={styles.signinBenefitItem}>
                <span className={styles.signinBenefitIcon}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className={styles.signinRedirectCard}>
            <p className={styles.signinRedirectTitle}>{signinContent.loginCard.redirectNoteText}</p>
            <Link href="/labour/company/panel" className={styles.signinRedirectLink}>
              https://www.scalevyapar.in/labour/company/panel
            </Link>
          </div>
        </div>

        <CompanySigninFormClient content={signinContent.loginCard} />

        <aside className={styles.signinSidePanel}>
          <h2 className={styles.signinSideTitle}>{signinContent.rightPanel.title}</h2>
          <div className={styles.signinSideItems}>
            {signinContent.rightPanel.items.map((item, index) => (
              <div key={item.title} className={styles.signinSideItem}>
                <span className={styles.signinSideIcon}>{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.signinBannerSection}>
        <div className={styles.signinBannerImageWrap}>
          <img
            src={signinContent.banner.imageSrc}
            alt="ScaleVyapar Rozgar workforce banner"
            className={styles.signinBannerImage}
          />
        </div>
        <div className={styles.signinBannerOverlay}>
          <div className={styles.signinBannerBadge}>Hiring</div>
          <h2 className={styles.signinBannerTitle}>{signinContent.banner.title}</h2>
          <p className={styles.signinBannerText}>{signinContent.banner.description}</p>
        </div>
      </section>

      <section className={styles.signinFeatureStrip}>
        {signinContent.featureStrip.map((item, index) => (
          <div key={item.title} className={styles.signinFeatureCard}>
            <span className={styles.signinFeatureIcon}>{index + 1}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </section>
    </CompanySiteShell>
  )
}
