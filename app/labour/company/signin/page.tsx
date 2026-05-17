import Link from 'next/link'
import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanySigninFormClient } from './company-signin-form-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RestoredSigninContent = {
  eyebrow: string
  title: string
  subtitle: string
  heroDescription: string
  benefits: string[]
  loginCard: {
    title: string
    subtitle: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    rememberMeLabel: string
    forgotPasswordLabel: string
    signInButtonLabel: string
    registerCompanyButtonLabel: string
    registerPromptText: string
    redirectNoteText: string
  }
  rightPanel: {
    title: string
    items: Array<{
      title: string
      description: string
    }>
  }
  banner: {
    imageSrc: string
    title: string
    description: string
  }
  featureStrip: Array<{
    title: string
    description: string
  }>
}

function buildRestoredSigninContent(content: Awaited<ReturnType<typeof getLabourCompanyWebsiteContent>>['content']): RestoredSigninContent {
  const signinPage = content.signinPage

  return {
    eyebrow: signinPage.eyebrow || 'Welcome Back!',
    title: signinPage.title || 'Sign In to Your Company Account',
    subtitle:
      signinPage.subtitle ||
      'Customers can log in using their registered email and password. After successful login, you will be redirected to your company dashboard.',
    heroDescription:
      signinPage.subtitle ||
      'Customers can log in using their registered email and password. After successful login, you will be redirected to your company dashboard.',
    benefits: signinPage.benefits?.length
      ? signinPage.benefits
      : [
          'Access your Company Panel and manage your profile',
          'Browse and connect with verified workers',
          'Post job requirements and hire the right talent',
          'Track applications and manage enquiries'
        ],
    loginCard: {
      title: 'Company Sign In',
      subtitle: 'Use your registered email and password',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMeLabel: 'Remember me',
      forgotPasswordLabel: 'Forgot Password?',
      signInButtonLabel: 'Sign In',
      registerCompanyButtonLabel: 'Register Company',
      registerPromptText: "Don't have a company account?",
      redirectNoteText: 'After login, you will be redirected to your company dashboard.'
    },
    rightPanel: {
      title: 'With your company account, you can:',
      items: [
        {
          title: 'Access Company Panel',
          description: 'Manage your company profile, team and settings.'
        },
        {
          title: 'Post Job Requirements',
          description: 'Create and publish job vacancies in minutes.'
        },
        {
          title: 'Browse Verified Workers',
          description: 'Search and connect with skilled and verified workers.'
        },
        {
          title: 'Track Applications',
          description: 'View and manage applications in one place.'
        },
        {
          title: 'Logged-in Account Access',
          description: 'Secure access to your account dashboard anytime.'
        }
      ]
    },
    banner: {
      imageSrc: '/worker-hero-reference.png',
      title: 'Hiring Made Simple. Workforce Made Strong.',
      description: 'ScaleVyapar Rozgar helps businesses find skilled workers and build a reliable workforce with ease.'
    },
    featureStrip: [
      {
        title: 'Secure Login',
        description: 'Your data and account are protected with industry-standard security.'
      },
      {
        title: 'Verified Access',
        description: 'Only authorized companies can access the company panel and features.'
      },
      {
        title: 'Fast Dashboard Entry',
        description: 'Quick and seamless access to your company dashboard.'
      },
      {
        title: 'Post Jobs Quickly',
        description: 'Create job posts in minutes and reach the right workers instantly.'
      }
    ]
  }
}

export default async function LabourCompanySigninPage() {
  const { content } = await getLabourCompanyWebsiteContent()
  const signinContent = buildRestoredSigninContent(content)

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/signin">
      <section className={styles.signinHeroSection}>
        <div className={styles.signinHeroIntro}>
          <p className={styles.signinHeroEyebrow}>{signinContent.eyebrow}</p>
          <h1 className={styles.signinHeroTitle}>{signinContent.title}</h1>
          <p className={styles.signinHeroSubtitle}>{signinContent.heroDescription || signinContent.subtitle}</p>

          <div className={styles.signinBenefitList}>
            {signinContent.benefits.map(item => (
              <div key={item} className={styles.signinBenefitItem}>
                <span className={styles.signinBenefitIcon}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className={styles.signinRedirectCard}>
            <p className={styles.signinRedirectTitle}>
              After login, you will be redirected to your company dashboard:
            </p>
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
