import type { Metadata } from 'next'
import MainLegalPage from '@/components/MainLegalPage'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'Privacy Policy | ScaleVyapar',
  description: 'Privacy policy for the ScaleVyapar website and business automation platform.',
}

export default async function ScaleVyaparPrivacyPolicyPage() {
  const { content } = await getMainWebsiteContent()
  return <MainLegalPage content={content} page={content.legalPages.privacyPolicy} />
}
