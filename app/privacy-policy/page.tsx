import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | ScaleVyapar',
  description: 'Privacy policy for the ScaleVyapar website and business automation platform.',
}

const sectionStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
}

export default function ScaleVyaparPrivacyPolicyPage() {
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
              Privacy Policy
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
              This policy explains how ScaleVyapar collects, uses, and protects business and contact data across its website, lead generation tools, CRM workflows, and support operations.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Information we collect</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                We may collect your name, business name, email address, phone number, city, lead enquiry details, billing details,
                messages submitted through forms, and usage information needed to operate our services and respond to requests.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>How we use data</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                We use collected data to provide demos, process enquiries, manage accounts, deliver automation services, send operational
                notifications, improve product performance, and support customer communication.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>How data is shared</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                ScaleVyapar does not sell your personal data. Information may be processed by infrastructure and service providers that help us run the platform,
                including hosting, database, analytics, and messaging vendors, only to the extent needed to provide the service.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Retention and security</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                We retain information only as long as needed for active service operations, support history, compliance, and fraud prevention.
                We use managed infrastructure, authenticated admin access, and operational safeguards to protect the data we store.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0, fontSize: '22px' }}>Contact</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
                If you have privacy questions or data requests, contact us at{' '}
                <a href="mailto:scalevyapar072@gmail.com" style={{ color: '#1d4ed8' }}>
                  scalevyapar072@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
