'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CircleCheckBig, LockKeyhole, Pencil } from 'lucide-react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { createCheckoutSummary, formatRupees } from '@/lib/labour-company-checkout'
import { toRozgarPublicPath } from '@/lib/labour-company-host'
import styles from '../company-site.module.css'

const COMPANY_TOKEN_KEY = 'labour_company_token'
const COMPANY_PROFILE_KEY = 'labour_company_profile'

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  handler: (response: RazorpayCheckoutResponse) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void
      on?: (eventName: 'payment.failed', handler: (response: { error?: { description?: string; reason?: string } }) => void) => void
    }
  }
}

const loadRazorpayCheckout = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay checkout can only be opened in the browser.'))
      return
    }

    if (window.Razorpay) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout. Please try again.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout. Please try again.'))
    document.body.appendChild(script)
  })

export function CheckoutPageClient({
  pricingContent,
  initialPlan,
  initialBilling,
  initialHostname
}: {
  pricingContent: LabourCompanyWebsiteContent['pricingPage']
  initialPlan: string
  initialBilling: string
  initialHostname?: string | null
}) {
  const searchParams = useSearchParams()
  const [hostname, setHostname] = useState<string | null>(initialHostname || null)
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('')
  const [discountCodeMessage, setDiscountCodeMessage] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'verifying' | 'success' | 'error'>('idle')
  const [gstinOverride, setGstinOverride] = useState(() => {
    if (typeof window === 'undefined') return ''

    try {
      const rawProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
      if (!rawProfile) return ''
      const profile = JSON.parse(rawProfile) as Record<string, unknown>
      const gstValue = [profile.gstNumber, profile.gst_number, profile.gstin].find(value => typeof value === 'string' && value.trim()) as string | undefined
      return gstValue ? gstValue.trim() : ''
    } catch {
      return ''
    }
  })
  const [buyerStateOverride, setBuyerStateOverride] = useState(() => {
    if (typeof window === 'undefined') return ''

    try {
      const rawProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
      if (!rawProfile) return ''
      const profile = JSON.parse(rawProfile) as Record<string, unknown>
      const stateValue = [profile.state, profile.companyState].find(value => typeof value === 'string' && value.trim()) as string | undefined
      return stateValue ? stateValue.trim() : ''
    } catch {
      return ''
    }
  })
  const resolveHref = (href: string) => toRozgarPublicPath(href, hostname)

  useEffect(() => {
    setHostname(window.location.hostname)
    if (typeof window === 'undefined') return

    const authToken = window.localStorage.getItem(COMPANY_TOKEN_KEY) || window.sessionStorage.getItem(COMPANY_TOKEN_KEY) || ''
    if (!authToken) return

    let cancelled = false

    const syncCompanyGstin = async () => {
      try {
        const response = await fetch('/api/labour/company/dashboard', {
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          cache: 'no-store'
        })

        if (!response.ok) return
        const data = await response.json()
        const profile = data?.dashboard?.profile as Record<string, unknown> | undefined
        if (!profile) return

        window.localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile))
        const gstValue = [profile.gstNumber, profile.gst_number, profile.gstin].find(value => typeof value === 'string' && value.trim()) as string | undefined
        const stateValue = [profile.state, profile.companyState].find(value => typeof value === 'string' && value.trim()) as string | undefined
        if (!cancelled && gstValue?.trim()) {
          setGstinOverride(gstValue.trim())
        }
        if (!cancelled && stateValue?.trim()) {
          setBuyerStateOverride(stateValue.trim())
        }
      } catch {
        // Ignore checkout GST sync issues and keep fallback GSTIN.
      }
    }

    void syncCompanyGstin()

    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => createCheckoutSummary({
    pricingPage: pricingContent,
    planSlug: searchParams.get('plan') || initialPlan,
    billingMode: searchParams.get('billing') || initialBilling,
    discountCode: appliedDiscountCode,
    gstinOverride,
    buyerStateOverride
  }), [appliedDiscountCode, buyerStateOverride, gstinOverride, initialBilling, initialPlan, pricingContent, searchParams])

  const showDiscountCodeField = !summary.autoDiscountEnabled && Boolean(summary.discountCode)

  const handleApplyDiscountCode = () => {
    const normalized = discountCodeInput.trim()
    if (!normalized) {
      setAppliedDiscountCode('')
      setDiscountCodeMessage('Enter the discount code to apply your offer.')
      return
    }

    if (normalized.toLowerCase() === summary.discountCode.trim().toLowerCase()) {
      setAppliedDiscountCode(normalized)
      setDiscountCodeMessage('Discount code applied successfully.')
      return
    }

    setAppliedDiscountCode('')
    setDiscountCodeMessage('This discount code is not valid for the selected plan.')
  }

  const getCompanyToken = () => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(COMPANY_TOKEN_KEY) || window.sessionStorage.getItem(COMPANY_TOKEN_KEY) || ''
  }

  const getStoredCompanyProfile = () => {
    if (typeof window === 'undefined') return {} as Record<string, unknown>
    try {
      const rawProfile = window.localStorage.getItem(COMPANY_PROFILE_KEY)
      return rawProfile ? JSON.parse(rawProfile) as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }

  const handleProceedToPay = async () => {
    const authToken = getCompanyToken()
    if (!authToken) {
      setPaymentStatus('error')
      setPaymentNotice('Please sign in with your company account before making payment.')
      return
    }

    setPaymentStatus('creating')
    setPaymentNotice('Creating secure Razorpay order...')

    try {
      await loadRazorpayCheckout()

      const orderResponse = await fetch('/api/labour/company/payments/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          plan: searchParams.get('plan') || initialPlan,
          billing: searchParams.get('billing') || initialBilling,
          discountCode: appliedDiscountCode,
          gstin: gstinOverride,
          buyerState: buyerStateOverride
        })
      })
      const orderData = await orderResponse.json().catch(() => ({ error: 'Unexpected payment order response.' }))
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Unable to create Razorpay order.')
      }

      const profile = getStoredCompanyProfile()
      const checkout = new window.Razorpay!({
        key: orderData.keyId,
        amount: Number(orderData.amount || 0),
        currency: orderData.currency || 'INR',
        name: 'ScaleVyapar Rozgar',
        description: orderData.planTitle || summary.planTitle,
        order_id: orderData.orderId,
        prefill: {
          name: String(profile.contactPerson || profile.companyName || orderData.contactPerson || orderData.companyName || ''),
          email: String(profile.email || orderData.email || ''),
          contact: String(profile.mobile || profile.contactMobile || orderData.mobile || '')
        },
        notes: {
          companyPlanId: String(orderData.companyPlanId || ''),
          planTitle: String(orderData.planTitle || summary.planTitle)
        },
        theme: {
          color: '#0f766e'
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('error')
            setPaymentNotice('Payment was cancelled. You can try again when ready.')
          }
        },
        handler: response => {
          setPaymentStatus('verifying')
          setPaymentNotice('Verifying payment securely...')
          void (async () => {
            try {
              const verifyResponse = await fetch('/api/labour/company/payments/razorpay/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(response)
              })
              const verifyData = await verifyResponse.json().catch(() => ({ error: 'Unexpected payment verification response.' }))
              if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'Payment verification failed.')
              }

              if (verifyData.dashboard?.profile && typeof window !== 'undefined') {
                window.localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(verifyData.dashboard.profile))
              }

              setPaymentStatus('success')
              setPaymentNotice(verifyData.message || 'Payment successful. Your Rozgar plan is active.')
              window.setTimeout(() => {
                window.location.href = resolveHref(verifyData.redirectTo || '/labour/company/job-post')
              }, 1200)
            } catch (error) {
              setPaymentStatus('error')
              setPaymentNotice(error instanceof Error ? error.message : 'Payment verification failed. Please contact support if money was deducted.')
            }
          })()
        }
      })

      checkout.on?.('payment.failed', response => {
        setPaymentStatus('error')
        setPaymentNotice(response.error?.description || response.error?.reason || 'Payment failed. Please try again.')
      })
      checkout.open()
    } catch (error) {
      setPaymentStatus('error')
      setPaymentNotice(error instanceof Error ? error.message : 'Unable to start Razorpay payment. Please try again.')
    }
  }

  return (
    <div className={styles.checkoutPage}>
      <section className={styles.checkoutStepper} aria-label="Checkout steps">
        <div className={styles.checkoutStep}>
          <span className={styles.checkoutStepCircle}>1</span>
          <span>Select a plan</span>
        </div>
        <span className={styles.checkoutStepLine} />
        <div className={`${styles.checkoutStep} ${styles.checkoutStepActive}`}>
          <span className={styles.checkoutStepCircle}>2</span>
          <span>Checkout</span>
        </div>
      </section>

      <div className={styles.checkoutShell}>
        <Link href={resolveHref('/labour/company/pricing')} className={styles.checkoutBackLink}>
          <ArrowLeft size={18} />
          <span>Checkout</span>
        </Link>

        <article className={styles.checkoutCard}>
          <h1 className={styles.checkoutSummaryTitle}>Purchase summary</h1>

          <div className={styles.checkoutPlanRow}>
            <div>
              <h2 className={styles.checkoutPlanTitle}>{summary.planTitle}</h2>
              <ul className={styles.checkoutPlanBullets}>
                <li>You are buying <strong>{summary.creditsLabel}</strong></li>
                <li>Use these credits to post Jobs within <strong>{summary.validityLabel}</strong>.</li>
              </ul>
            </div>
            <strong className={styles.checkoutAmountPrimary}>{formatRupees(summary.baseAmount)}</strong>
          </div>

          {showDiscountCodeField ? (
            <div className={styles.checkoutDiscountCode}>
              <label htmlFor="checkout-discount-code" className={styles.checkoutFieldLabel}>Discount code</label>
              <div className={styles.checkoutDiscountCodeRow}>
                <input
                  id="checkout-discount-code"
                  className={styles.checkoutDiscountInput}
                  value={discountCodeInput}
                  onChange={event => setDiscountCodeInput(event.target.value)}
                  placeholder="Enter discount code"
                />
                <button type="button" className={styles.checkoutApplyButton} onClick={handleApplyDiscountCode}>Apply</button>
              </div>
              {discountCodeMessage ? (
                <p className={`${styles.checkoutDiscountMessage} ${appliedDiscountCode ? styles.checkoutDiscountMessageSuccess : ''}`}>{discountCodeMessage}</p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.checkoutSummaryList}>
            <div className={styles.checkoutSummaryItem}>
              <span>{summary.discountLabel}</span>
              <strong className={styles.checkoutDiscountAmount}>
                {summary.discountAmount > 0 ? `-${formatRupees(summary.discountAmount)}` : formatRupees(0)}
              </strong>
            </div>
            <div className={`${styles.checkoutSummaryItem} ${styles.checkoutSummaryDivider}`}>
              <span>Sub Total</span>
              <strong>{formatRupees(summary.subtotal)}</strong>
            </div>
            <div className={styles.checkoutSummaryItem}>
              <span>{summary.taxLabel}</span>
              <strong>{formatRupees(summary.gstAmount)}</strong>
            </div>
            <div className={styles.checkoutSummaryItem}>
              <span className={styles.checkoutGstinLabel}>GSTIN: {summary.gstin}</span>
              <Pencil size={15} />
            </div>
          </div>

          <div className={styles.checkoutTotalRow}>
            <div>
              <h3>Total <small>(Inc tax)</small></h3>
            </div>
            <strong>{formatRupees(summary.total)}</strong>
          </div>

          {summary.discountAmount > 0 ? (
            <div className={styles.checkoutSavingsBanner}>
              <span aria-hidden="true">🎉</span>
              <span>{summary.savingsMessage}</span>
            </div>
          ) : null}

          <button
            type="button"
            className={styles.checkoutPayButton}
            onClick={handleProceedToPay}
            disabled={paymentStatus === 'creating' || paymentStatus === 'verifying'}
          >
            {paymentStatus === 'creating'
              ? 'Opening Razorpay...'
              : paymentStatus === 'verifying'
                ? 'Verifying payment...'
                : `${summary.paymentButtonLabel} ${formatRupees(summary.total)}`}
          </button>

          {paymentNotice ? (
            <p className={`${styles.checkoutGatewayNotice} ${paymentStatus === 'success' ? styles.checkoutGatewayNoticeSuccess : ''}`}>
              {paymentNotice}
            </p>
          ) : null}

          <p className={styles.checkoutPolicyText}>{summary.policyText}</p>

          <div className={styles.checkoutSecurityRow}>
            <LockKeyhole size={18} />
            <span>{summary.securityText}</span>
            {summary.paymentProviderMode === 'razorpay-ready' ? <CircleCheckBig size={18} /> : null}
          </div>
        </article>
      </div>
    </div>
  )
}
