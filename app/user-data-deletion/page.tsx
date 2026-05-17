import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getSafeMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'User Data Deletion | ScaleVyapar',
  description: 'Instructions for requesting deletion of user data associated with ScaleVyapar services.',
}

const sectionStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
}

export default async function ScaleVyaparUserDataDeletionPage() {
  const { content } = await getSafeMainWebsiteContent()

  return (
    <>
      <Navbar content={content} />
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
              ScaleVyapar
            </span>
            <h1
              style={{
                fontSize: '40px',
                lineHeight: 1.1,
                margin: '16px 0 10px',
                fontWeight: 900,
              }}
            >
              User Data Deletion
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
              If you want ScaleVyapar to delete personal or business data associated with your use of our website or services, follow the process below.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>How to request deletion</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                Email{' '}
                <a href="mailto:scalevyapar072@gmail.com" style={{ color: '#1d4ed8' }}>
                  scalevyapar072@gmail.com
                </a>{' '}
                with the subject line <strong>User Data Deletion Request</strong>. Include your name, phone number, business name if applicable,
                and the email address used with ScaleVyapar.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Verification</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                We may contact you to confirm account ownership before taking action so we can prevent accidental or fraudulent deletion requests.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>What gets removed</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                After verification, we will delete or anonymise eligible records associated with your account or enquiry unless retention is required for billing,
                fraud prevention, legal compliance, or security investigations.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Response time</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                We aim to review deletion requests promptly and respond through the contact details you provide in your request.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer content={content} />
    </>
  )
}
