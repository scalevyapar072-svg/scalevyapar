import type { Metadata } from 'next'
import MainLegalPage from '@/components/MainLegalPage'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'Terms of Service | ScaleVyapar',
  description: 'Terms of service for using the ScaleVyapar website and business automation platform.',
}

export default async function ScaleVyaparTermsOfServicePage() {
  const { content } = await getMainWebsiteContent()
  return <MainLegalPage content={content} page={content.legalPages.termsOfService} />
}
