import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PayoutQaClient from './payout-qa-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Refer & Earn Payout QA | ScaleVyapar',
  description: 'Preview-only QA surface for Rozgar Refer & Earn payout account setup.',
}

export default function ReferEarnPayoutQaPage() {
  if (process.env.VERCEL_ENV === 'production') {
    notFound()
  }

  return <PayoutQaClient />
}
