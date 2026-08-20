import type { Metadata } from 'next'
import Image from 'next/image'
import { getPublicReferralLandingData } from '../referral-public-data'
import { buildRozgarPlayStoreReferralUrl } from '@/lib/rozgar-referral-context'
import styles from '../public-referral.module.css'

type Props = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ cat?: string | string[]; category?: string | string[] }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Referral Registration Context | Rozgar',
  description: 'Referral category selection prepared for Rozgar registration.'
}

export default async function ReferralContinuePage({ params, searchParams }: Props) {
  const [{ code }, { cat, category }] = await Promise.all([params, searchParams])
  const referral = await getPublicReferralLandingData(code)
  const requestedCategoryParam = cat ?? category
  const requestedSlug = Array.isArray(requestedCategoryParam) ? '' : String(requestedCategoryParam || '').trim()
  const selectedCategory = referral.status === 'valid'
    ? referral.categories.find(item => item.slug === requestedSlug) || null
    : null
  const hasInvalidSelection =
    referral.status !== 'valid' ||
    !requestedSlug ||
    Array.isArray(requestedCategoryParam) ||
    !selectedCategory
  const canPrepareContext = referral.status === 'valid' && !hasInvalidSelection
  const playStoreUrl = canPrepareContext && selectedCategory
    ? buildRozgarPlayStoreReferralUrl({
        referralCode: referral.referralCode,
        categorySlug: selectedCategory.slug
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
          {canPrepareContext ? 'Referral context prepared' : 'Referral Selection Unavailable'}
        </h1>
        {canPrepareContext ? (
          <>
            <p className={styles.continueBodyText}>
              Download Rozgar App from Google Play to continue with your selected referral category.
            </p>
            <div className={styles.continueDetails}>
              <div className={styles.continueCategoryCard}>
                <span className={styles.continueCategoryLabel}>Referral code</span>
                <p className={styles.continueCategoryName}>{referral.referralCode}</p>
              </div>
              <div className={styles.continueCategoryCard}>
                <span className={styles.continueCategoryLabel}>Selected referral category</span>
                <p className={styles.continueCategoryName}>{selectedCategory?.name}</p>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.continueBodyText}>
            This referral category selection is not available. Please go back and choose one eligible category.
          </p>
        )}
        <div className={styles.continueActions}>
          <a
            href={playStoreUrl}
            className={`${styles.secondaryLink} ${styles.secondaryLinkPrimary} ${styles.continueDownloadLink}`}
          >
            Download Rozgar App
          </a>
        </div>
      </section>
    </main>
  )
}
