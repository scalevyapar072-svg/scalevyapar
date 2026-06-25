import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'Delete Your Rozgar Account | ScaleVyapar',
  description: 'Public account deletion instructions for Rozgar users.'
}

const cardStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)'
} as const

export default async function DeleteAccountPage() {
  const { content } = await getMainWebsiteContent()

  return (
    <>
      <Navbar content={content.header} />
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #edf4ff 0%, #f8fafc 38%, #ffffff 100%)',
          padding: '48px 20px 80px',
          color: '#0f172a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '8px 14px',
                borderRadius: '999px',
                background: '#dbeafe',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              Rozgar account support
            </span>
            <h1
              style={{
                fontSize: '40px',
                lineHeight: 1.1,
                margin: '16px 0 10px',
                fontWeight: 900,
              }}
            >
              Delete Your Rozgar Account
            </h1>
            <p
              style={{
                margin: 0,
                color: '#475569',
                fontSize: '16px',
                lineHeight: 1.7,
                maxWidth: '760px',
              }}
            >
              If you want to delete your Rozgar account and associated data, please email us at{' '}
              <a href="mailto:scalevyapar072@gmail.com">scalevyapar072@gmail.com</a>.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>What to include in your request</h2>
              <p style={{ color: '#475569', lineHeight: 1.7 }}>
                Please send the request from your registered details, or include your registered mobile number so we can
                verify the account safely.
              </p>
              <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: '22px', marginBottom: 0 }}>
                <li>Your registered mobile number</li>
                <li>Your full name</li>
                <li>A clear request saying: &quot;Please delete my Rozgar account&quot;</li>
              </ul>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Processing time</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                After receiving your request, we will verify the account details and process the deletion request within
                7–15 working days.
              </p>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>What deletion covers</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                When your account is deleted, your worker profile and account-related data will be removed from active
                use where legally and technically possible.
              </p>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Information we may retain</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                Some information may be retained if required for legal compliance, security, fraud prevention, payment
                records, dispute handling, or business record obligations.
              </p>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Need help?</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                For help, contact <a href="mailto:scalevyapar072@gmail.com">scalevyapar072@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer content={content.footer} />
    </>
  )
}
