import type { Metadata } from 'next'
import { getPublicReferralLandingData } from '../referral-public-data'

type Props = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ category?: string | string[] }>
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
  const requestedSlug = Array.isArray(category) ? '' : String(category || '').trim()
  const selectedCategory = referral.status === 'valid'
    ? referral.categories.find(item => item.slug === requestedSlug) || null
    : null
  const hasInvalidSelection =
    referral.status !== 'valid' ||
    !requestedSlug ||
    Array.isArray(category) ||
    !selectedCategory
  const canPrepareContext = referral.status === 'valid' && !hasInvalidSelection

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #eaf3ff 0%, #ffffff 52%, #fff4e6 100%)', padding: '24px 16px', boxSizing: 'border-box' }}>
      <section style={{ width: '100%', maxWidth: '560px', margin: '0 auto', border: '1px solid #dbe6f4', borderRadius: '28px', background: '#fff', boxShadow: '0 24px 70px rgba(10, 47, 117, 0.14)', padding: '24px', boxSizing: 'border-box' }}>
        <p style={{ margin: '0 0 10px', color: '#ef5b2a', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Rozgar by ScaleVyapar
        </p>
        <h1 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '30px', lineHeight: 1.12 }}>
          {canPrepareContext ? 'Referral context prepared' : 'Referral Selection Unavailable'}
        </h1>
        {canPrepareContext ? (
          <>
            <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>
              Referral Code <strong>{referral.referralCode}</strong> is valid for <strong>{selectedCategory?.name}</strong>.
            </p>
            <div style={{ border: '1px solid #dbe6f4', borderRadius: '18px', padding: '14px', background: '#f8fbff', marginBottom: '18px' }}>
              <strong style={{ display: 'block', marginBottom: '10px', color: '#0f172a' }}>Selected Referral Category</strong>
              <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: 1.4 }}>{selectedCategory?.name}</p>
            </div>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Registration attribution is intentionally not connected in Phase 3. Phase 4 will revalidate this referral code and category before creating any referral record.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=in.scalevyapar.rozgar"
              style={{ display: 'block', borderRadius: '16px', background: '#0a2f75', color: '#fff', padding: '15px 18px', fontSize: '16px', fontWeight: 800, textDecoration: 'none', textAlign: 'center', boxShadow: '0 16px 32px rgba(10, 47, 117, 0.22)', marginBottom: '16px' }}
            >
              Continue to Rozgar Registration
            </a>
          </>
        ) : (
          <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>
            This referral category selection is not available. Please go back and choose one eligible category.
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
