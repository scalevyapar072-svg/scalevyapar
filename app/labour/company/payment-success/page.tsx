'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const plan = searchParams.get('plan')
  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '900', color: '#15803d' }}>Payment Successful!</h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>{plan} has been activated.</p>
        {paymentId && (
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Payment ID</p>
            <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>{paymentId}</p>
          </div>
        )}
        <Link href="/labour/company" style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>Back to Home</Link>
      </div>
    </div>
  )
}
