import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getSafeMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'Data Deletion Status | ScaleVyapar',
  description: 'Confirmation page for ScaleVyapar data deletion requests.',
}

export default async function DataDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { content } = await getSafeMainWebsiteContent()
  const params = await searchParams
  const code = params.code || 'pending'

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
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
          }}
        >
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
              fontSize: '36px',
              lineHeight: 1.1,
              margin: '16px 0 10px',
              fontWeight: 900,
            }}
          >
            Data Deletion Request Received
          </h1>
          <p style={{ margin: '0 0 20px', color: '#475569', fontSize: '16px', lineHeight: 1.7 }}>
            Your deletion request has been recorded. Our team will review it and process eligible records in line with legal, billing, and security requirements.
          </p>
          <div
            style={{
              padding: '16px 18px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              marginBottom: '20px',
            }}
          >
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>Confirmation Code</p>
            <p style={{ margin: '8px 0 0', color: '#475569', wordBreak: 'break-all' }}>{code}</p>
          </div>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            If you need help, contact{' '}
            <a href="mailto:scalevyapar072@gmail.com" style={{ color: '#1d4ed8' }}>
              scalevyapar072@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer content={content} />
    </>
  )
}
