import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service | ScaleVyapar',
  description: 'Terms of service for using the ScaleVyapar website and business automation platform.',
}

const sectionStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
}

export default function ScaleVyaparTermsOfServicePage() {
  return (
    <>
      <Navbar />
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
              Terms of Service
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
              By using the ScaleVyapar website, tools, and services, you agree to use them only for lawful business activity and genuine operational needs.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Permitted use</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                You may use ScaleVyapar to enquire about services, generate leads, manage customer workflows, publish content, or run supported business automations
                in accordance with applicable laws and platform policies.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Account and information accuracy</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                You agree to provide accurate account, billing, and contact information. False, abusive, deceptive, or unlawful use may lead to account suspension,
                service restriction, or permanent removal from the platform.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Service availability</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                ScaleVyapar may modify, improve, suspend, or discontinue features to maintain reliability, compliance, and service quality.
                We do not guarantee uninterrupted availability of all services at all times.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Payments and support</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                Paid services, if any, are governed by the agreed plan terms. For billing, service questions, or disputes, contact{' '}
                <a href="mailto:scalevyapar072@gmail.com" style={{ color: '#1d4ed8' }}>
                  scalevyapar072@gmail.com
                </a>
                . Continued use after policy updates means you accept the revised terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
