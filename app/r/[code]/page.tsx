import type { Metadata } from 'next'
import ReferralSelectionClient from './referral-selection-client'
import { getPublicReferralLandingData } from './referral-public-data'

type Props = {
  params: Promise<{ code: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Rozgar Referral ${String(code || '').toUpperCase()} | ScaleVyapar`,
    description: 'Choose your Rozgar work category from an approved referral invitation.'
  }
}

const pageShellStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(145deg, #eaf3ff 0%, #ffffff 48%, #fff4e6 100%)',
  color: '#0f172a',
  padding: '24px 16px',
  boxSizing: 'border-box' as const
}

const cardStyle = {
  width: '100%',
  maxWidth: '620px',
  margin: '0 auto',
  border: '1px solid #dbe6f4',
  borderRadius: '28px',
  background: 'rgba(255, 255, 255, 0.94)',
  boxShadow: '0 24px 70px rgba(10, 47, 117, 0.14)',
  padding: '24px',
  boxSizing: 'border-box' as const
}

const secondaryLinkStyle = {
  color: '#0a2f75',
  fontWeight: 800,
  textDecoration: 'none'
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
    <main style={pageShellStyle}>
      <section style={cardStyle}>
        <p style={{ margin: '0 0 10px', color: '#ef5b2a', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Rozgar by ScaleVyapar
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: '30px', lineHeight: 1.1 }}>{title}</h1>
        <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>{message}</p>
        {code ? (
          <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px' }}>
            Referral Code: <strong style={{ color: '#0f172a' }}>{code}</strong>
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/labour/company" style={secondaryLinkStyle}>Go to Rozgar</a>
          <a href="https://play.google.com/store/apps/details?id=in.scalevyapar.rozgar" style={secondaryLinkStyle}>Download Rozgar App</a>
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

  return (
    <main style={pageShellStyle}>
      <section style={cardStyle}>
        <p style={{ margin: '0 0 10px', color: '#ef5b2a', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Rozgar by ScaleVyapar
        </p>
        <h1 style={{ margin: '0 0 10px', fontSize: '34px', lineHeight: 1.08 }}>You have been invited to join Rozgar</h1>
        <p style={{ margin: '0 0 18px', color: '#475569', fontSize: '16px', lineHeight: 1.6 }}>
          Invited by {referral.invitedBy}. Choose one work category to prepare your referral registration context.
        </p>
        <div style={{ border: '1px solid #dbe6f4', borderRadius: '18px', padding: '14px', background: '#f8fbff', marginBottom: '20px' }}>
          <span style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Referral Code
          </span>
          <strong style={{ color: '#0a2f75', fontSize: '22px', letterSpacing: '0.04em' }}>{referral.referralCode}</strong>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px' }}>Choose your work category</h2>
        <ReferralSelectionClient referralCode={referral.referralCode} categories={referral.categories} />
        <p style={{ margin: '16px 0 0', color: '#667085', fontSize: '12px', lineHeight: 1.5 }}>
          Phase 3 note: registration attribution and Play Store deferred referral tracking are not active yet. Your selection is prepared for the next step only.
        </p>
      </section>
    </main>
  )
}
