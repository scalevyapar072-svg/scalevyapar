import type { Metadata } from 'next'
import Image from 'next/image'
import { buildRozgarPlayStoreReferralUrl } from '@/lib/rozgar-referral-context'
import styles from '@/app/r/[code]/public-referral.module.css'

type Props = {
  searchParams: Promise<{ ref?: string | string[]; cat?: string | string[] }>
}

const referralCodePattern = /^RZG[A-Z2-9]{8}$/
const categoryPattern = /^[a-z0-9][a-z0-9-]{0,79}$/

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Referral Registration Context | Rozgar',
  description: 'Referral category selection prepared for Rozgar registration.',
}

function normalizeSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return ''
  }
  return String(value || '').trim()
}

export default async function AppReferralPage({ searchParams }: Props) {
  const { ref, cat } = await searchParams
  const referralCode = normalizeSingleValue(ref).toUpperCase()
  const categorySlug = normalizeSingleValue(cat).toLowerCase()

  const validReferral =
    referralCodePattern.test(referralCode) &&
    categoryPattern.test(categorySlug)

  const playStoreUrl = validReferral
    ? buildRozgarPlayStoreReferralUrl({
        referralCode,
        categorySlug,
      })
    : 'https://play.google.com/store/apps/details?id=in.scalevyapar.rozgar'

  return (
    <main className={styles.continuePage}>
      <section className={styles.continueCard}>
        <div className={styles.continueHeader}>
          <Image
            src="/images/rozgar/rozgar-logo-main.png"
            alt="Rozgar by ScaleVyapar"
            width={240}
            height={72}
            priority
            className={styles.continueLogo}
          />
        </div>
        <h1 className={styles.continueBodyTitle}>
          {validReferral ? 'Referral context prepared' : 'Referral Handoff Unavailable'}
        </h1>
        {validReferral ? (
          <>
            <p className={styles.continueBodyText}>
              Download Rozgar App from Google Play to continue with your selected referral category.
            </p>
            <div className={styles.continueCategoryCard}>
              <span className={styles.continueCategoryLabel}>Referral code</span>
              <p className={styles.continueCategoryName}>{referralCode}</p>
              <span className={styles.continueCategoryLabel}>Selected referral category</span>
              <p className={styles.continueCategoryName}>{categorySlug}</p>
            </div>
          </>
        ) : (
          <p className={styles.continueBodyText}>
            This referral handoff link is incomplete or invalid. Please go back to the referral
            page and select an eligible category again.
          </p>
        )}
        <div className={styles.continueActions}>
          <a
            href={playStoreUrl}
            className={`${styles.secondaryLink} ${styles.secondaryLinkPrimary}`}
          >
            Download Rozgar App
          </a>
        </div>
      </section>
    </main>
  )
}
