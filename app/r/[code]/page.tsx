import type { Metadata } from 'next'
import Image from 'next/image'
import ReferralSelectionClient from './referral-selection-client'
import { getPublicReferralLandingData } from './referral-public-data'
import styles from './public-referral.module.css'

type Props = {
  params: Promise<{ code: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ValidReferralLandingData = Extract<
  Awaited<ReturnType<typeof getPublicReferralLandingData>>,
  { status: 'valid' }
>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Rozgar Referral ${String(code || '').toUpperCase()} | ScaleVyapar`,
    description: 'Choose your Rozgar work category from an approved referral invitation.'
  }
}

function StatusPage({
  title,
  message,
  code
}: {
  title: string
  message: string
  code: string
}) {
  return (
    <main className={styles.statusWrap}>
      <section className={styles.statusCard}>
        <Image
          src="/images/rozgar/rozgar-logo-main.png"
          alt="Rozgar by ScaleVyapar"
          width={240}
          height={72}
          priority
          className={styles.statusLogo}
        />
        <p className={styles.statusEyebrow}>Rozgar by ScaleVyapar</p>
        <h1 className={styles.statusTitle}>{title}</h1>
        <p className={styles.statusMessage}>{message}</p>
        {code ? (
          <p className={styles.statusCode}>
            Referral Code: <strong>{code}</strong>
          </p>
        ) : null}
        <div className={styles.statusActions}>
          <a href="/labour/company" className={`${styles.secondaryLink} ${styles.secondaryLinkPrimary}`}>Go to Rozgar</a>
          <a
            href="https://play.google.com/store/apps/details?id=in.scalevyapar.rozgar"
            className={`${styles.secondaryLink} ${styles.secondaryLinkGhost}`}
          >
            Download Rozgar App
          </a>
        </div>
      </section>
    </main>
  )
}

export default async function PublicReferralLandingPage({ params }: Props) {
  const { code } = await params
  const referral = await getPublicReferralLandingData(code)

  if (referral.status === 'invalid') {
    return (
      <StatusPage
        title="Referral Link Not Valid"
        message="This referral link could not be verified. Please check the link or continue to Rozgar without referral benefits."
        code={referral.referralCode}
      />
    )
  }

  if (referral.status === 'inactive') {
    return (
      <StatusPage
        title="Referral Link Inactive"
        message="This referral link is currently inactive. Referral categories are not available from this link right now."
        code={referral.referralCode}
      />
    )
  }

  if (referral.status === 'no_categories') {
    return (
      <StatusPage
        title="No Referral Categories Available"
        message="No referral categories are currently available for this invitation. You can still continue to Rozgar normally."
        code={referral.referralCode}
      />
    )
  }

  const validReferral = referral as ValidReferralLandingData

  return (
    <ReferralSelectionClient
      referralCode={validReferral.referralCode}
      invitedBy={validReferral.invitedBy}
      categories={validReferral.categories}
    />
  )
}
