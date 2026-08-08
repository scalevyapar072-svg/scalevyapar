import type { Metadata } from 'next'
import { getPublicReferralLandingData } from '../referral-public-data'

type Props = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ category?: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Referral Registration Context | Rozgar',
  description: 'Referral category selection prepared for Rozgar registration.'
}

export default async function ReferralContinuePage({ params, searchParams }: Props) {
  const [{ code }, { category }] = await Promise.all([params, searchParams])
  const referral = await getPublicReferralLandingData(code)
  const selectedCategory = referral.status === 'valid'
    ? referral.categories.find(item => item.slug === String(category || '').trim())
    : null

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #eaf3ff 0%, #ffffff 52%, #fff4e6 100%)', padding: '24px 16px', boxSizing: 'border-box' }}>
      <section style={{ width: '100%', maxWidth: '560px', margin: '0 auto', border: '1px solid #dbe6f4', borderRadius: '28px', background: '#fff', boxShadow: '0 24px 70px rgba(10, 47, 117, 0.14)', padding: '24px', boxSizing: 'border-box' }}>
        <p style={{ margin: '0 0 10px', color: '#ef5b2a', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Rozgar by ScaleVyapar
        </p>
        <h1 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '30px', lineHeight: 1.12 }}>
          {referral.status === 'valid' && selectedCategory ? 'Referral context prepared' : 'Referral Selection Unavailable'}
        </h1>
        {referral.status === 'valid' && selectedCategory ? (
          <>
            <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>
              Referral Code <strong>{referral.referralCode}</strong> is valid for <strong>{selectedCategory.name}</strong>.
            </p>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Registration attribution is intentionally not connected in Phase 3. Phase 4 will revalidate this referral code and category before creating any referral record.
            </p>
          </>
        ) : (
          <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>
            This referral category selection is not available. Please go back and choose an eligible category.
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href={`/r/${encodeURIComponent(String(code || ''))}`} style={{ color: '#0a2f75', fontWeight: 800, textDecoration: 'none' }}>
            Back to referral page
          </a>
          <a href="https://play.google.com/store/apps/details?id=in.scalevyapar.rozgar" style={{ color: '#0a2f75', fontWeight: 800, textDecoration: 'none' }}>
            Download Rozgar App
          </a>
        </div>
      </section>
    </main>
  )
}
