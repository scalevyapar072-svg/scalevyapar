import { getMainWebsiteContent } from '@/lib/main-website-content'
import ContactPageClient from './contact-page-client'

export default async function ContactPage() {
  const { content } = await getMainWebsiteContent()
  return <ContactPageClient content={content} />
}
