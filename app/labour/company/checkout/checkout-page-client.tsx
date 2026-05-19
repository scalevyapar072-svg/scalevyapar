'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ArrowLeft, CircleCheckBig, LockKeyhole, Pencil } from 'lucide-react'
import type { LabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { createCheckoutSummary, formatRupees } from '@/lib/labour-company-checkout'
import styles from '../company-site.module.css'

const COMPANY_PROFILE_KEY = 'labour_company_profile'

export function CheckoutPageClient({ pricingContent }: { pricingContent: LabourCompanyWebsiteContent['pricingPage'] }) {
  const searchParams = useSearchParams()
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('')
  const [discountCodeMessage, setDiscountCodeMessage] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [gstinOverride] = useState(() => {
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

  const summary = useMemo(() => createCheckoutSummary({
    pricingPage: pricingContent,
    planSlug: searchParams.get('plan'),
    billingMode: searchParams.get('billing'),
    discountCode: appliedDiscountCode,
    gstinOverride
  }), [appliedDiscountCode, gstinOverride, pricingContent, searchParams])

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

  const handleProceedToPay = () => {
    // TODO: Connect Razorpay payment gateway here after launch.
    setPaymentNotice(summary.gatewayComingSoonMessage)
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
        <Link href="/labour/company/pricing" className={styles.checkoutBackLink}>
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
              <span>GST ({summary.gstPercent}%)</span>
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

          <button type="button" className={styles.checkoutPayButton} onClick={handleProceedToPay}>
            {summary.paymentButtonLabel} {formatRupees(summary.total)}
          </button>

          {paymentNotice ? (
            <p className={styles.checkoutGatewayNotice}>{paymentNotice}</p>
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
