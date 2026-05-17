import type { Metadata } from 'next'
import LegalPage from '@/components/main-website/LegalPage'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('refund')
}

export default async function RefundPolicyPage() {
  const { content } = await getSafeMainWebsiteContent()
  return <LegalPage content={content} page={content.legal.refund} />
}
