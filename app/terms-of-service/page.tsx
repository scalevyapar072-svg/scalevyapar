import type { Metadata } from 'next'
import LegalPage from '@/components/main-website/LegalPage'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('terms')
}

export default async function TermsOfServicePage() {
  const { content } = await getSafeMainWebsiteContent()
  return <LegalPage content={content} page={content.legal.terms} />
}
