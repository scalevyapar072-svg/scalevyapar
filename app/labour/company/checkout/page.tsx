'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RazorpayHandlerResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  const planId = searchParams?.get('planId') || ''
  const planName = searchParams?.get('planName') || 'Plan'
  const amount = Number(searchParams?.get('amount') || 0)
  const gst = Math.round(amount * 0.18)
  const total = amount + gst

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search))
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, planId, planName }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok || !orderData.orderId) throw new Error(orderData.error || 'Failed to create order')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ScaleVyapar Rozgar',
        description: planName,
        order_id: orderData.orderId,
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response: RazorpayHandlerResponse) => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, planId, planName, amount: total }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            router.push('/labour/company/payment-success?paymentId=' + verifyData.paymentId + '&plan=' + encodeURIComponent(planName))
          } else {
            setError('Payment verification failed. Please contact support.')
            setLoading(false)
          }
        },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const btnBg = loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'
  const btnCursor = loading ? 'not-allowed' : 'pointer'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '40px', maxWidth: '460px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/labour/company/pricing" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none' }}>Back to Pricing</Link>
          <h1 style={{ margin: '16px 0 4px', fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>Checkout</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Complete your purchase securely</p>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ margin: '0 0 16px', fontWeight: '700', color: '#0f172a', fontSize: '18px' }}>{planName}</p>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Subtotal</span>
              <span style={{ color: '#0f172a', fontSize: '14px' }}>Rs {amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>GST (18%)</span>
              <span style={{ color: '#0f172a', fontSize: '14px' }}>Rs {gst}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '8px' }}>
              <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px' }}>Total</span>
              <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '20px' }}>Rs {total}</span>
            </div>
          </div>
        </div>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>{error}</div>
        )}
        <button onClick={handlePayment} disabled={loading} style={{ width: '100%', padding: '16px', background: btnBg, color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: btnCursor }}>
          {loading ? 'Processing...' : 'Pay Rs ' + total + ' Securely'}
        </button>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '20px' }}>Secured by Razorpay</p>
      </div>
    </div>
  )
}
