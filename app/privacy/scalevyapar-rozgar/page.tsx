import type { Metadata } from 'next'
import type { CSSProperties } from 'react'

export const metadata: Metadata = {
  title: 'ScaleVyapar Rozgar Privacy Policy',
  description: 'Privacy policy for the ScaleVyapar Rozgar worker Android app.',
}

const sectionStyle: CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
}

export default function ScaleVyaparRozgarPrivacyPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #edf4ff 0%, #f8fafc 38%, #ffffff 100%)',
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
            ScaleVyapar Rozgar
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
            This policy explains how ScaleVyapar handles worker data in the
            ScaleVyapar Rozgar Android app. It covers account login, profile and
            KYC details, job matching, notifications, and support operations.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '18px',
          }}
        >
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>Information we collect</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              We may collect your mobile number, worker name, city, selected
              categories, availability, profile photo, identity-proof type,
              identity-proof number, uploaded identity documents, wallet and
              recharge information, job applications, saved jobs, push
              notification token, and basic device or app usage information
              needed to operate the service.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>How we use data</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              We use this data to authenticate workers by OTP, match workers to
              job posts, determine when company details can be shown, process
              recharge requests, support KYC review, deliver push and in-app
              alerts, investigate misuse, and maintain service reliability.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>How data is shared</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              ScaleVyapar does not sell worker personal data. Data may be
              processed by service providers that help operate the app, including
              Supabase for database and storage services, Vercel for backend
              hosting, and Firebase Cloud Messaging for push notification
              delivery.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>Retention and deletion</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              We retain data only for active service operations, support history,
              policy compliance, and fraud prevention. To request deletion of
              your ScaleVyapar Rozgar worker account or uploaded KYC records,
              email <strong>admin@scalevyapar.com</strong> with your registered
              mobile number and deletion request.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>Security practices</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              We protect stored data through authenticated APIs, access-restricted
              admin workflows, and managed infrastructure controls. No system is
              perfectly secure, so we continuously monitor and improve our
              technical and operational safeguards.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0, fontSize: '22px' }}>Contact</h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              If you have privacy questions, account deletion requests, or policy
              concerns, contact ScaleVyapar at{' '}
              <a href="mailto:admin@scalevyapar.com" style={{ color: '#1d4ed8' }}>
                admin@scalevyapar.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
