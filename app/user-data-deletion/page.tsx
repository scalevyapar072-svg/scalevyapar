import type { Metadata } from 'next'
import MainLegalPage from '@/components/MainLegalPage'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export const metadata: Metadata = {
  title: 'User Data Deletion | ScaleVyapar',
  description: 'Instructions for requesting deletion of user data associated with ScaleVyapar services.',
}

export default async function ScaleVyaparUserDataDeletionPage() {
  const { content } = await getMainWebsiteContent()
  return <MainLegalPage content={content} page={content.legalPages.userDataDeletion} />
}
